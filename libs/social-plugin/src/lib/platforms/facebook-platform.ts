import { SocialCore, SocialPost, SocialResponse, SocialPlatformConfig } from '../social-core';

export interface FacebookConfig extends SocialPlatformConfig {
  pageId?: string;
  appId?: string;
  appSecret?: string;
  userAccessToken?: string;
  pageAccessToken?: string;
}

interface FacebookPostResponse {
  id: string;
  error?: {
    message: string;
    code: number;
  };
}

interface FacebookMediaResponse {
  id: string;
  error?: {
    message: string;
    code: number;
  };
}

export class FacebookPlatform extends SocialCore {
  private pageId: string;
  private accessToken: string;

  constructor(config: FacebookConfig, logger?: Console) {
    super(config, logger);
    this.pageId = config.pageId || '';
    this.accessToken = config.pageAccessToken || config.userAccessToken || '';
    
    if (!this.accessToken) {
      throw new Error('Facebook access token is required');
    }
  }

  async publish(post: SocialPost): Promise<SocialResponse> {
    try {
      this.validatePost(post);
      this.logger.info('Publishing to Facebook...');

      const message = this.formatMessage(post);
      const mediaIds = post.media ? await this.uploadMedia(post.media) : [];

      const postData: any = {
        message,
        access_token: this.accessToken,
      };

      if (mediaIds.length > 0) {
        postData.attached_media = mediaIds.map(id => ({ media_fbid: id }));
      }

      const response = await this.post<FacebookPostResponse>(
        `https://graph.facebook.com/v18.0/${this.pageId}/feed`,
        postData
      );

      const result = response.data;
      
      if (result.error) {
        throw new Error(`Facebook API error: ${result.error.message}`);
      }

      const socialResponse: SocialResponse = {
        success: true,
        postId: result.id,
        url: `https://facebook.com/${result.id}`,
        platform: 'facebook',
        timestamp: new Date(),
      };

      this.logSuccess(socialResponse);
      return socialResponse;

    } catch (error) {
      this.logError(error, 'facebook');
      return {
        success: false,
        error: error.message,
        platform: 'facebook',
        timestamp: new Date(),
      };
    }
  }

  protected async uploadSingleMedia(mediaUrl: string): Promise<string> {
    try {
      const response = await this.post<FacebookMediaResponse>(
        `https://graph.facebook.com/v18.0/${this.pageId}/photos`,
        {
          url: mediaUrl,
          access_token: this.accessToken,
          published: false,
        }
      );

      const result = response.data;
      
      if (result.error) {
        throw new Error(`Facebook media upload error: ${result.error.message}`);
      }

      return result.id;
    } catch (error) {
      this.logger.error(`Failed to upload media to Facebook: ${error.message}`);
      throw error;
    }
  }

  private formatMessage(post: SocialPost): string {
    let message = post.content;
    
    if (post.hashtags && post.hashtags.length > 0) {
      message += '\n\n' + this.formatHashtags(post.hashtags);
    }
    
    return message;
  }
} 