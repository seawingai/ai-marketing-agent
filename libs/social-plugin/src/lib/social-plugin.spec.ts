import { SocialPlugin } from './social-plugin';
import { SocialPost } from './social-core';
import { PlatformConfig } from './platform-factory';
import { InstagramConfig } from './platforms/instagram-platform';

// Mock platform configurations for testing
const mockPlatformConfig: PlatformConfig = {
  facebook: {
    pageId: 'test-page-id',
    pageAccessToken: 'test-access-token',
    maxRetries: 2,
  },
  twitter: {
    bearerToken: 'test-bearer-token',
    maxRetries: 2,
  },
};

describe('SocialPlugin', () => {
  let socialPlugin: SocialPlugin;

  beforeEach(() => {
    socialPlugin = new SocialPlugin({
      platforms: mockPlatformConfig,
      retryAttempts: 2,
      retryDelay: 100,
      logger: console,
    });
  });

  describe('Constructor', () => {
    it('should create instance with valid config', () => {
      expect(socialPlugin).toBeDefined();
      expect(socialPlugin.getConfiguredPlatforms()).toContain('facebook');
      expect(socialPlugin.getConfiguredPlatforms()).toContain('twitter');
    });

    it('should get available platforms', () => {
      const availablePlatforms = socialPlugin.getAvailablePlatforms();
      expect(availablePlatforms).toContain('facebook');
      expect(availablePlatforms).toContain('instagram');
      expect(availablePlatforms).toContain('linkedin');
      expect(availablePlatforms).toContain('twitter');
      expect(availablePlatforms).toContain('tiktok');
    });
  });

  describe('Platform Management', () => {
    it('should check if platform is configured', () => {
      expect(socialPlugin.isPlatformConfigured('facebook')).toBe(true);
      expect(socialPlugin.isPlatformConfigured('instagram')).toBe(false);
    });

    it('should add platform dynamically', () => {
      socialPlugin.addPlatform('instagram', {
        userId: 'test-user-id',
        accessToken: 'test-access-token',
        maxRetries: 2,
      } as InstagramConfig);

      expect(socialPlugin.isPlatformConfigured('instagram')).toBe(true);
      expect(socialPlugin.getConfiguredPlatforms()).toContain('instagram');
    });

    it('should remove platform', () => {
      expect(socialPlugin.isPlatformConfigured('facebook')).toBe(true);
      
      const removed = socialPlugin.removePlatform('facebook');
      expect(removed).toBe(true);
      expect(socialPlugin.isPlatformConfigured('facebook')).toBe(false);
    });
  });

  describe('Post Validation', () => {
    it('should validate valid post', () => {
      const post: SocialPost = {
        content: 'This is a valid post content.',
        hashtags: ['test', 'validation'],
      };

      const validation = socialPlugin.validatePost(post);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject empty content', () => {
      const post: SocialPost = {
        content: '',
        hashtags: ['test'],
      };

      const validation = socialPlugin.validatePost(post);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Post content cannot be empty');
    });

    it('should reject content that is too long', () => {
      const post: SocialPost = {
        content: 'A'.repeat(5001), // Exceeds 5000 character limit
        hashtags: ['test'],
      };

      const validation = socialPlugin.validatePost(post);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Post content exceeds maximum length (5000 characters)');
    });

    it('should reject too many media files', () => {
      const post: SocialPost = {
        content: 'Test post',
        media: Array(11).fill('https://example.com/image.jpg'), // 11 files, exceeds limit of 10
      };

      const validation = socialPlugin.validatePost(post);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Too many media files (maximum 10)');
    });
  });

  describe('Event Handling', () => {
    it('should emit platform success events', (done) => {
      const post: SocialPost = {
        content: 'Test post for events',
      };

      socialPlugin.on('platform:success', (data) => {
        expect(data.platform).toBeDefined();
        expect(data.response).toBeDefined();
        expect(data.response.success).toBe(true);
        done();
      });

      // Note: This would require mocking the actual platform implementations
      // for a complete test, but demonstrates the event structure
    });

    it('should emit platform error events', (done) => {
      const post: SocialPost = {
        content: 'Test post for error events',
      };

      socialPlugin.on('platform:error', (data) => {
        expect(data.platform).toBeDefined();
        expect(data.error).toBeDefined();
        done();
      });

      // Note: This would require mocking the actual platform implementations
      // for a complete test, but demonstrates the event structure
    });
  });

  describe('Configuration', () => {
    it('should get platform instance', () => {
      const facebookPlatform = socialPlugin.getPlatform('facebook');
      expect(facebookPlatform).toBeDefined();
    });

    it('should return undefined for non-configured platform', () => {
      const instagramPlatform = socialPlugin.getPlatform('instagram');
      expect(instagramPlatform).toBeUndefined();
    });
  });
});
