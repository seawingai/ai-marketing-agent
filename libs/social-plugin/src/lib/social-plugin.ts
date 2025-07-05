import { EventEmitter } from 'events';
import { SocialCore, SocialPost, SocialResponse, SocialPlatformConfig } from './social-core';
import { PlatformFactory, PlatformType, PlatformConfig } from './platform-factory';

export interface SocialPluginConfig {
  platforms: PlatformConfig;
  logger?: Console;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface PublishResult {
  success: boolean;
  results: Map<PlatformType, SocialResponse>;
  errors: Map<PlatformType, string>;
  totalAttempts: number;
  successfulPlatforms: PlatformType[];
  failedPlatforms: PlatformType[];
}

export class SocialPlugin extends EventEmitter {
  private platforms: Map<PlatformType, SocialCore>;
  private logger: Console;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: SocialPluginConfig) {
    super();
    this.platforms = PlatformFactory.createPlatforms(config.platforms, config.logger);
    this.logger = config.logger || console;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Set up event listeners for all platforms
    this.setupEventListeners();
  }

  /**
   * Publish a post to all configured platforms
   */
  async publish(post: SocialPost): Promise<PublishResult> {
    const results = new Map<PlatformType, SocialResponse>();
    const errors = new Map<PlatformType, string>();
    const successfulPlatforms: PlatformType[] = [];
    const failedPlatforms: PlatformType[] = [];
    let totalAttempts = 0;

    this.logger.info(`Publishing post to ${this.platforms.size} platforms`);

    for (const [platformType, platform] of this.platforms) {
      try {
        totalAttempts++;
        this.logger.info(`Publishing to ${platformType} (attempt ${totalAttempts})`);

        const response = await this.publishWithRetry(platform, post, platformType);
        results.set(platformType, response);

        if (response.success) {
          successfulPlatforms.push(platformType);
          this.logger.info(`Successfully published to ${platformType}`);
        } else {
          failedPlatforms.push(platformType);
          errors.set(platformType, response.error || 'Unknown error');
          this.logger.error(`Failed to publish to ${platformType}: ${response.error}`);
        }

      } catch (error) {
        totalAttempts++;
        failedPlatforms.push(platformType);
        errors.set(platformType, error.message);
        this.logger.error(`Exception publishing to ${platformType}: ${error.message}`);
        
        results.set(platformType, {
          success: false,
          error: error.message,
          platform: platformType,
          timestamp: new Date(),
        });
      }
    }

    const publishResult: PublishResult = {
      success: successfulPlatforms.length > 0,
      results,
      errors,
      totalAttempts,
      successfulPlatforms,
      failedPlatforms,
    };

    this.emit('publish:complete', publishResult);
    return publishResult;
  }

  /**
   * Publish to a specific platform
   */
  async publishToPlatform(platformType: PlatformType, post: SocialPost): Promise<SocialResponse> {
    const platform = this.platforms.get(platformType);
    
    if (!platform) {
      throw new Error(`Platform ${platformType} is not configured`);
    }

    return this.publishWithRetry(platform, post, platformType);
  }

  /**
   * Publish with retry logic
   */
  private async publishWithRetry(
    platform: SocialCore,
    post: SocialPost,
    platformType: PlatformType,
    attempt: number = 1
  ): Promise<SocialResponse> {
    try {
      return await platform.publish(post);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        this.logger.warn(`Retrying ${platformType} publish (attempt ${attempt + 1}/${this.retryAttempts})`);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
        return this.publishWithRetry(platform, post, platformType, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Add a platform dynamically
   */
  addPlatform(platformType: PlatformType, config: SocialPlatformConfig): void {
    try {
      const platform = PlatformFactory.createPlatform(platformType, config, this.logger);
      this.platforms.set(platformType, platform);
      this.setupPlatformEventListeners(platform, platformType);
      this.logger.info(`Added platform: ${platformType}`);
    } catch (error) {
      this.logger.error(`Failed to add platform ${platformType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove a platform
   */
  removePlatform(platformType: PlatformType): boolean {
    const removed = this.platforms.delete(platformType);
    if (removed) {
      this.logger.info(`Removed platform: ${platformType}`);
    }
    return removed;
  }

  /**
   * Get all configured platforms
   */
  getConfiguredPlatforms(): PlatformType[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Get platform instance
   */
  getPlatform(platformType: PlatformType): SocialCore | undefined {
    return this.platforms.get(platformType);
  }

  /**
   * Check if platform is configured
   */
  isPlatformConfigured(platformType: PlatformType): boolean {
    return this.platforms.has(platformType);
  }

  /**
   * Get available platforms (all supported platforms)
   */
  getAvailablePlatforms(): PlatformType[] {
    return PlatformFactory.getAvailablePlatforms();
  }

  /**
   * Validate post for all platforms
   */
  validatePost(post: SocialPost): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!post.content || post.content.trim().length === 0) {
      errors.push('Post content cannot be empty');
    }

    if (post.content && post.content.length > 5000) {
      errors.push('Post content exceeds maximum length (5000 characters)');
    }

    if (post.media && post.media.length > 10) {
      errors.push('Too many media files (maximum 10)');
    }

    // Platform-specific validation
    for (const [platformType, platform] of this.platforms) {
      try {
        platform['validatePost'](post);
      } catch (error) {
        errors.push(`${platformType}: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Setup event listeners for all platforms
   */
  private setupEventListeners(): void {
    for (const [platformType, platform] of this.platforms) {
      this.setupPlatformEventListeners(platform, platformType);
    }
  }

  /**
   * Setup event listeners for a specific platform
   */
  private setupPlatformEventListeners(platform: SocialCore, platformType: PlatformType): void {
    platform.on('publish:success', (response: SocialResponse) => {
      this.emit('platform:success', { platform: platformType, response });
    });

    platform.on('publish:error', (data: { error: Error; platform: string }) => {
      this.emit('platform:error', { platform: platformType, error: data.error });
    });
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
