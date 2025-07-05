import { SocialCore, SocialPost, SocialResponse, SocialPlatformConfig } from '../social-core';

export interface TwitterConfig extends SocialPlatformConfig {
  bearerToken?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

export class TwitterPlatform extends SocialCore {
  private bearerToken: string;
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string;
  private accessTokenSecret: string;

  constructor(config: TwitterConfig, logger?: Console) {
    super(config, logger);
    this.bearerToken = config.bearerToken || '';
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.accessToken = config.accessToken || '';
    this.accessTokenSecret = config.accessTokenSecret || '';
    
    if (!this.bearerToken) {
      throw new Error('Twitter bearer token is required');
    }
  }

  async publish(post: SocialPost): Promise<SocialResponse> {
    try {
      this.validatePost(post);
      this.logger.info('Publishing to Twitter...');

      const text = this.formatText(post);
      const mediaIds = post.media ? await this.uploadMedia(post.media) : [];

      const tweetData: any = {
        text,
      };

      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds,
        };
      }

      const response = await this.makeRequest(
        'https://api.twitter.com/2/tweets',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tweetData),
        }
      );

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`Twitter API error: ${result.errors[0].message}`);
      }

      const socialResponse: SocialResponse = {
        success: true,
        postId: result.data.id,
        url: `https://twitter.com/user/status/${result.data.id}`,
        platform: 'twitter',
        timestamp: new Date(),
      };

      this.logSuccess(socialResponse);
      return socialResponse;

    } catch (error) {
      this.logError(error, 'twitter');
      return {
        success: false,
        error: error.message,
        platform: 'twitter',
        timestamp: new Date(),
      };
    }
  }

  protected async uploadSingleMedia(mediaUrl: string): Promise<string> {
    try {
      // First, download the media
      const mediaBlob = await this.fetchMediaAsBlob(mediaUrl);
      
      // Upload to Twitter
      const response = await this.makeRequest(
        'https://upload.twitter.com/1.1/media/upload.json',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            media_category: 'tweet_image',
            media_data: await this.blobToBase64(mediaBlob),
          }),
        }
      );

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`Twitter media upload error: ${result.errors[0].message}`);
      }

      return result.media_id_string;
    } catch (error) {
      this.logger.error(`Failed to upload media to Twitter: ${error.message}`);
      throw error;
    }
  }

  private async fetchMediaAsBlob(mediaUrl: string): Promise<Blob> {
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from ${mediaUrl}`);
    }
    return response.blob();
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private formatText(post: SocialPost): string {
    let text = post.content;
    
    if (post.hashtags && post.hashtags.length > 0) {
      text += '\n\n' + this.formatHashtags(post.hashtags);
    }
    
    // Twitter has a 280 character limit
    if (text.length > 280) {
      text = text.substring(0, 277) + '...';
    }
    
    return text;
  }
} 