import { SocialCore, SocialPost, SocialResponse, SocialPlatformConfig } from '../social-core';

export interface InstagramConfig extends SocialPlatformConfig {
  userId?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
}

interface InstagramContainerResponse {
  id: string;
  error?: {
    message: string;
    code: number;
  };
}

interface InstagramPublishResponse {
  id: string;
  error?: {
    message: string;
    code: number;
  };
}

export class InstagramPlatform extends SocialCore {
  private userId: string;
  private accessToken: string;

  constructor(config: InstagramConfig, logger?: Console) {
    super(config, logger);
    this.userId = config.userId || '';
    this.accessToken = config.accessToken || '';
    
    if (!this.accessToken) {
      throw new Error('Instagram access token is required');
    }
  }

  async publish(post: SocialPost): Promise<SocialResponse> {
    try {
      this.validatePost(post);
      this.logger.info('Publishing to Instagram...');

      // Instagram requires media for posts
      if (!post.media || post.media.length === 0) {
        throw new Error('Instagram requires at least one media file for posts');
      }

      const mediaIds = await this.uploadMedia(post.media);
      const caption = this.formatCaption(post);

      // Create container for the post
      const containerResponse = await this.post<InstagramContainerResponse>(
        `https://graph.facebook.com/v18.0/${this.userId}/media`,
        {
          image_url: post.media[0], // Instagram typically uses one image per post
          caption,
          access_token: this.accessToken,
        }
      );

      const containerResult = containerResponse.data;
      
      if (containerResult.error) {
        throw new Error(`Instagram API error: ${containerResult.error.message}`);
      }

      // Publish the container
      const publishResponse = await this.post<InstagramPublishResponse>(
        `https://graph.facebook.com/v18.0/${this.userId}/media_publish`,
        {
          creation_id: containerResult.id,
          access_token: this.accessToken,
        }
      );

      const publishResult = publishResponse.data;
      
      if (publishResult.error) {
        throw new Error(`Instagram publish error: ${publishResult.error.message}`);
      }

      const socialResponse: SocialResponse = {
        success: true,
        postId: publishResult.id,
        url: `https://instagram.com/p/${publishResult.id}`,
        platform: 'instagram',
        timestamp: new Date(),
      };

      this.logSuccess(socialResponse);
      return socialResponse;

    } catch (error) {
      this.logError(error, 'instagram');
      return {
        success: false,
        error: error.message,
        platform: 'instagram',
        timestamp: new Date(),
      };
    }
  }

  protected async uploadSingleMedia(mediaUrl: string): Promise<string> {
    try {
      const response = await this.post<InstagramContainerResponse>(
        `https://graph.facebook.com/v18.0/${this.userId}/media`,
        {
          image_url: mediaUrl,
          access_token: this.accessToken,
          published: false,
        }
      );

      const result = response.data;
      
      if (result.error) {
        throw new Error(`Instagram media upload error: ${result.error.message}`);
      }

      return result.id;
    } catch (error) {
      this.logger.error(`Failed to upload media to Instagram: ${error.message}`);
      throw error;
    }
  }

  private formatCaption(post: SocialPost): string {
    let caption = post.content;
    
    if (post.hashtags && post.hashtags.length > 0) {
      caption += '\n\n' + this.formatHashtags(post.hashtags);
    }
    
    return caption;
  }
} 