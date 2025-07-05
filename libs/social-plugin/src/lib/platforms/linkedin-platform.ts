import { SocialCore, SocialPost, SocialResponse, SocialPlatformConfig } from '../social-core';

export interface LinkedInConfig extends SocialPlatformConfig {
  accessToken?: string;
  organizationId?: string;
  userId?: string;
  clientId?: string;
  clientSecret?: string;
}

interface LinkedInPostResponse {
  id: string;
  error?: {
    message: string;
    code: number;
  };
}

export class LinkedInPlatform extends SocialCore {
  private accessToken: string;
  private organizationId?: string;
  private userId?: string;

  constructor(config: LinkedInConfig, logger?: Console) {
    super(config, logger);
    this.accessToken = config.accessToken || '';
    this.organizationId = config.organizationId;
    this.userId = config.userId;
    
    if (!this.accessToken) {
      throw new Error('LinkedIn access token is required');
    }
  }

  async publish(post: SocialPost): Promise<SocialResponse> {
    try {
      this.validatePost(post);
      this.logger.info('Publishing to LinkedIn...');

      const author = this.organizationId ? `urn:li:organization:${this.organizationId}` : `urn:li:person:${this.userId}`;
      const content = this.formatContent(post);

      const postData: any = {
        author: author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: post.media && post.media.length > 0 ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      if (post.media && post.media.length > 0) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = post.media.map(mediaUrl => ({
          status: 'READY',
          description: {
            text: 'Image',
          },
          media: mediaUrl,
          title: {
            text: 'Image',
          },
        }));
      }

      const response = await this.post<LinkedInPostResponse>(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      const result = response.data;
      
      if (result.error) {
        throw new Error(`LinkedIn API error: ${result.error.message}`);
      }

      const socialResponse: SocialResponse = {
        success: true,
        postId: result.id,
        url: `https://linkedin.com/feed/update/${result.id}`,
        platform: 'linkedin',
        timestamp: new Date(),
      };

      this.logSuccess(socialResponse);
      return socialResponse;

    } catch (error) {
      this.logError(error, 'linkedin');
      return {
        success: false,
        error: error.message,
        platform: 'linkedin',
        timestamp: new Date(),
      };
    }
  }

  protected async uploadSingleMedia(mediaUrl: string): Promise<string> {
    try {
      // LinkedIn uses direct URLs for media, so we return the URL as the ID
      // In a real implementation, you might need to upload to LinkedIn's media service first
      return mediaUrl;
    } catch (error) {
      this.logger.error(`Failed to upload media to LinkedIn: ${error.message}`);
      throw error;
    }
  }

  private formatContent(post: SocialPost): string {
    let content = post.content;
    
    if (post.hashtags && post.hashtags.length > 0) {
      content += '\n\n' + this.formatHashtags(post.hashtags);
    }
    
    return content;
  }
} 