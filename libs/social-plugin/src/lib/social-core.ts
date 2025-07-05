import { EventEmitter } from 'events';

export interface SocialPost {
  content: string;
  media?: string[];
  hashtags?: string[];
  scheduledTime?: Date;
  platform?: string;
}

export interface SocialResponse {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  platform: string;
  timestamp: Date;
}

export interface SocialPlatformConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export abstract class SocialCore extends EventEmitter {
  protected config: SocialPlatformConfig;
  protected logger: Console;
  protected maxRetries: number;
  protected retryDelay: number = 1000;

  constructor(config: SocialPlatformConfig, logger?: Console) {
    super();
    this.config = config;
    this.logger = logger || console;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Abstract method that must be implemented by each platform
   */
  abstract publish(post: SocialPost): Promise<SocialResponse>;

  /**
   * Common HTTP request method with retry logic
   */
  protected async makeRequest(
    url: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<Response> {
    try {
      this.logger.info(`Making request to ${url} (attempt ${retryCount + 1})`);
      
      const response = await fetch(url, {
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.info(`Request successful: ${response.status}`);
      return response;
    } catch (error) {
      this.logger.error(`Request failed: ${error.message}`);
      
      if (retryCount < this.maxRetries) {
        this.logger.info(`Retrying in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.makeRequest(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Delay utility for retry mechanism
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate post content
   */
  protected validatePost(post: SocialPost): void {
    if (!post.content || post.content.trim().length === 0) {
      throw new Error('Post content cannot be empty');
    }

    if (post.content.length > 5000) {
      throw new Error('Post content exceeds maximum length');
    }

    if (post.media && post.media.length > 10) {
      throw new Error('Too many media files (maximum 10)');
    }
  }

  /**
   * Format hashtags
   */
  protected formatHashtags(hashtags?: string[]): string {
    if (!hashtags || hashtags.length === 0) {
      return '';
    }
    return hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
  }

  /**
   * Upload media files
   */
  protected async uploadMedia(mediaUrls: string[]): Promise<string[]> {
    const uploadedIds: string[] = [];
    
    for (const mediaUrl of mediaUrls) {
      try {
        this.logger.info(`Uploading media: ${mediaUrl}`);
        // This is a placeholder - each platform will implement its own upload logic
        const mediaId = await this.uploadSingleMedia(mediaUrl);
        uploadedIds.push(mediaId);
      } catch (error) {
        this.logger.error(`Failed to upload media ${mediaUrl}: ${error.message}`);
        throw error;
      }
    }
    
    return uploadedIds;
  }

  /**
   * Abstract method for uploading single media file
   */
  protected abstract uploadSingleMedia(mediaUrl: string): Promise<string>;

  /**
   * Handle rate limiting
   */
  protected async handleRateLimit(retryAfter?: number): Promise<void> {
    const delay = retryAfter || 60 * 1000; // Default 1 minute
    this.logger.warn(`Rate limited. Waiting ${delay}ms before retry.`);
    await this.delay(delay);
  }

  /**
   * Log success
   */
  protected logSuccess(response: SocialResponse): void {
    this.logger.info(`Successfully published to ${response.platform}: ${response.postId}`);
    this.emit('publish:success', response);
  }

  /**
   * Log error
   */
  protected logError(error: Error, platform: string): void {
    this.logger.error(`Failed to publish to ${platform}: ${error.message}`);
    this.emit('publish:error', { error, platform });
  }
} 