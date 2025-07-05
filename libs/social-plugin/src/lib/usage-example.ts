import { SocialPlugin } from './social-plugin';
import { SocialPost } from './social-core';
import { PlatformConfig } from './platform-factory';
import { TwitterConfig } from './platforms/twitter-platform';

/**
 * Example usage of the SocialPlugin
 */
export class SocialPluginExample {
  private socialPlugin: SocialPlugin;

  constructor() {
    // Configure platforms
    const platformConfig: PlatformConfig = {
      facebook: {
        pageId: 'your-page-id',
        pageAccessToken: 'your-page-access-token',
        maxRetries: 3,
        timeout: 30000,
      },
      instagram: {
        userId: 'your-user-id',
        accessToken: 'your-instagram-access-token',
        maxRetries: 3,
      },
      linkedin: {
        accessToken: 'your-linkedin-access-token',
        organizationId: 'your-organization-id', // Optional, for company pages
        maxRetries: 3,
      },
      twitter: {
        bearerToken: 'your-twitter-bearer-token',
        maxRetries: 3,
      } as TwitterConfig,
      tiktok: {
        accessToken: 'your-tiktok-access-token',
        clientKey: 'your-client-key',
        openId: 'your-open-id',
        maxRetries: 3,
      },
    };

    // Create SocialPlugin instance
    this.socialPlugin = new SocialPlugin({
      platforms: platformConfig,
      retryAttempts: 3,
      retryDelay: 1000,
      logger: console, // Optional custom logger
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Example: Publish a simple text post
   */
  async publishTextPost(): Promise<void> {
    const post: SocialPost = {
      content: 'Hello world! This is a test post from our social media automation system.',
      hashtags: ['socialmedia', 'automation', 'test'],
    };

    console.log('Publishing text post...');
    const result = await this.socialPlugin.publish(post);
    
    console.log('Publish result:', {
      success: result.success,
      successfulPlatforms: result.successfulPlatforms,
      failedPlatforms: result.failedPlatforms,
      totalAttempts: result.totalAttempts,
    });
  }

  /**
   * Example: Publish a post with media
   */
  async publishMediaPost(): Promise<void> {
    const post: SocialPost = {
      content: 'Check out our latest product! 🚀',
      media: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ],
      hashtags: ['product', 'launch', 'innovation'],
    };

    console.log('Publishing media post...');
    const result = await this.socialPlugin.publish(post);
    
    console.log('Publish result:', {
      success: result.success,
      successfulPlatforms: result.successfulPlatforms,
      failedPlatforms: result.failedPlatforms,
    });
  }

  /**
   * Example: Publish to specific platform
   */
  async publishToSpecificPlatform(): Promise<void> {
    const post: SocialPost = {
      content: 'This post will only be published to Facebook.',
      hashtags: ['facebook', 'specific'],
    };

    console.log('Publishing to Facebook only...');
    const result = await this.socialPlugin.publishToPlatform('facebook', post);
    
    console.log('Facebook publish result:', result);
  }

  /**
   * Example: Validate post before publishing
   */
  async validateAndPublish(): Promise<void> {
    const post: SocialPost = {
      content: 'This is a valid post with proper content.',
      hashtags: ['validation', 'test'],
    };

    // Validate the post first
    const validation = this.socialPlugin.validatePost(post);
    
    if (validation.valid) {
      console.log('Post is valid, publishing...');
      const result = await this.socialPlugin.publish(post);
      console.log('Publish successful:', result.success);
    } else {
      console.error('Post validation failed:', validation.errors);
    }
  }

  /**
   * Example: Add platform dynamically
   */
  async addPlatformDynamically(): Promise<void> {
    // Add a new platform at runtime
    this.socialPlugin.addPlatform('twitter', {
      accessToken: 'new-twitter-access-token',
      maxRetries: 3,
    });

    console.log('Added Twitter platform dynamically');
    console.log('Configured platforms:', this.socialPlugin.getConfiguredPlatforms());
  }

  /**
   * Example: Handle platform-specific errors
   */
  async handlePlatformErrors(): Promise<void> {
    const post: SocialPost = {
      content: 'This post might fail on some platforms.',
      media: ['https://invalid-url.com/image.jpg'], // Invalid URL
    };

    console.log('Publishing post that might have errors...');
    const result = await this.socialPlugin.publish(post);
    
    // Check for errors
    if (result.errors.size > 0) {
      console.log('Platform errors:');
      for (const [platform, error] of result.errors) {
        console.log(`  ${platform}: ${error}`);
      }
    }
  }

  /**
   * Example: Get platform information
   */
  getPlatformInfo(): void {
    console.log('Available platforms:', this.socialPlugin.getAvailablePlatforms());
    console.log('Configured platforms:', this.socialPlugin.getConfiguredPlatforms());
    
    // Check if specific platforms are configured
    const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'];
    for (const platform of platforms) {
      const isConfigured = this.socialPlugin.isPlatformConfigured(platform as any);
      console.log(`${platform} configured: ${isConfigured}`);
    }
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    // Listen for successful publishes
    this.socialPlugin.on('platform:success', (data) => {
      console.log(`✅ Successfully published to ${data.platform}:`, data.response.postId);
    });

    // Listen for failed publishes
    this.socialPlugin.on('platform:error', (data) => {
      console.log(`❌ Failed to publish to ${data.platform}:`, data.error.message);
    });

    // Listen for complete publish operations
    this.socialPlugin.on('publish:complete', (result) => {
      console.log('📊 Publish operation completed:', {
        totalPlatforms: result.results.size,
        successful: result.successfulPlatforms.length,
        failed: result.failedPlatforms.length,
      });
    });
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('🚀 Running SocialPlugin examples...\n');

    try {
      // Get platform information
      this.getPlatformInfo();
      console.log('');

      // Validate and publish
      await this.validateAndPublish();
      console.log('');

      // Publish text post
      await this.publishTextPost();
      console.log('');

      // Publish media post
      await this.publishMediaPost();
      console.log('');

      // Publish to specific platform
      await this.publishToSpecificPlatform();
      console.log('');

      // Handle errors
      await this.handlePlatformErrors();
      console.log('');

      // Add platform dynamically
      await this.addPlatformDynamically();
      console.log('');

      console.log('✅ All examples completed successfully!');

    } catch (error) {
      console.error('❌ Error running examples:', error);
    }
  }
}

// Export for use in other files
export default SocialPluginExample; 