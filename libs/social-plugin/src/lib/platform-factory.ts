import { SocialCore, SocialPlatformConfig } from './social-core';
import { FacebookPlatform, FacebookConfig } from './platforms/facebook-platform';
import { InstagramPlatform, InstagramConfig } from './platforms/instagram-platform';
import { LinkedInPlatform, LinkedInConfig } from './platforms/linkedin-platform';
import { TikTokPlatform, TikTokConfig } from './platforms/tiktok-platform';
import { TwitterPlatform, TwitterConfig } from './platforms/twitter-platform';

export type PlatformType = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'twitter';

export interface PlatformConfig {
  facebook?: FacebookConfig;
  instagram?: InstagramConfig;
  linkedin?: LinkedInConfig;
  tiktok?: TikTokConfig;
  twitter?: TwitterConfig;
}

export class PlatformFactory {
  private static platforms = new Map<PlatformType, any>();

  static {
    // Register all available platforms
    PlatformFactory.platforms.set('facebook', FacebookPlatform);
    PlatformFactory.platforms.set('instagram', InstagramPlatform);
    PlatformFactory.platforms.set('linkedin', LinkedInPlatform);
    PlatformFactory.platforms.set('tiktok', TikTokPlatform);
    PlatformFactory.platforms.set('twitter', TwitterPlatform);
  }

  /**
   * Create a platform instance
   */
  static createPlatform(type: PlatformType, config: SocialPlatformConfig, logger?: Console): SocialCore {
    const PlatformClass = this.platforms.get(type);
    
    if (!PlatformClass) {
      throw new Error(`Unsupported platform: ${type}`);
    }

    return new PlatformClass(config, logger);
  }

  /**
   * Get all available platform types
   */
  static getAvailablePlatforms(): PlatformType[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Check if a platform is supported
   */
  static isPlatformSupported(type: PlatformType): boolean {
    return this.platforms.has(type);
  }

  /**
   * Create multiple platform instances from config
   */
  static createPlatforms(config: PlatformConfig, logger?: Console): Map<PlatformType, SocialCore> {
    const platforms = new Map<PlatformType, SocialCore>();

    for (const [type, platformConfig] of Object.entries(config)) {
      if (platformConfig && this.isPlatformSupported(type as PlatformType)) {
        try {
          const platform = this.createPlatform(type as PlatformType, platformConfig, logger);
          platforms.set(type as PlatformType, platform);
        } catch (error) {
          console.error(`Failed to create platform ${type}:`, error.message);
        }
      }
    }

    return platforms;
  }
} 