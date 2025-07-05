import { SocialCore, SocialPost, SocialResponse, SocialPlatformConfig } from '../social-core';

export interface TikTokConfig extends SocialPlatformConfig {
  accessToken?: string;
  clientKey?: string;
  clientSecret?: string;
  openId?: string;
}

export class TikTokPlatform extends SocialCore {
  private accessToken: string;
  private clientKey: string;
  private openId: string;

  constructor(config: TikTokConfig, logger?: Console) {
    super(config, logger);
    this.accessToken = config.accessToken || '';
    this.clientKey = config.clientKey || '';
    this.openId = config.openId || '';
    
    if (!this.accessToken || !this.clientKey) {
      throw new Error('TikTok access token and client key are required');
    }
  }

  async publish(post: SocialPost): Promise<SocialResponse> {
    try {
      this.validatePost(post);
      this.logger.info('Publishing to TikTok...');

      // TikTok requires video content
      if (!post.media || post.media.length === 0) {
        throw new Error('TikTok requires video content for posts');
      }

      const videoUrl = post.media[0]; // TikTok typically uses one video per post
      const description = this.formatDescription(post);

      // First, create the video post
      const response = await this.makeRequest(
        'https://open.tiktokapis.com/v2/video/upload/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_info: {
              title: description,
              privacy_level: 'SELF_ONLY', // or 'PUBLIC', 'MUTUAL_FOLLOW_FRIENDS'
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
              video_cover_timestamp_ms: 0,
            },
            source_info: {
              source: 'FILE_UPLOAD',
              video_size: 0, // Will be calculated by TikTok
              chunk_size: 0, // Will be calculated by TikTok
              total_chunk_count: 1,
            },
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`TikTok API error: ${result.error.message}`);
      }

      // Upload the video file
      const uploadResponse = await this.makeRequest(
        `https://open.tiktokapis.com/v2/video/upload/${result.data.upload_url}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'video/mp4',
          },
          body: await this.fetchVideoAsBlob(videoUrl),
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video to TikTok');
      }

      const socialResponse: SocialResponse = {
        success: true,
        postId: result.data.upload_url,
        url: `https://tiktok.com/@${this.openId}/video/${result.data.upload_url}`,
        platform: 'tiktok',
        timestamp: new Date(),
      };

      this.logSuccess(socialResponse);
      return socialResponse;

    } catch (error) {
      this.logError(error, 'tiktok');
      return {
        success: false,
        error: error.message,
        platform: 'tiktok',
        timestamp: new Date(),
      };
    }
  }

  protected async uploadSingleMedia(mediaUrl: string): Promise<string> {
    try {
      // For TikTok, we return the video URL as the ID since we handle upload separately
      return mediaUrl;
    } catch (error) {
      this.logger.error(`Failed to upload media to TikTok: ${error.message}`);
      throw error;
    }
  }

  private async fetchVideoAsBlob(videoUrl: string): Promise<Blob> {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video from ${videoUrl}`);
    }
    return response.blob();
  }

  private formatDescription(post: SocialPost): string {
    let description = post.content;
    
    if (post.hashtags && post.hashtags.length > 0) {
      description += '\n\n' + this.formatHashtags(post.hashtags);
    }
    
    return description;
  }
} 