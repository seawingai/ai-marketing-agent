# Social Plugin

A comprehensive social media publishing library that supports multiple platforms including Facebook, Instagram, LinkedIn, TikTok, and Twitter. Built with TypeScript, featuring proper error handling, logging, and retry mechanisms.

## Features

- **Multi-Platform Support**: Publish to Facebook, Instagram, LinkedIn, TikTok, and Twitter
- **Unified API**: Single interface for all social platforms
- **Error Handling**: Comprehensive error handling with detailed logging
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Event-Driven**: Real-time events for monitoring publish operations
- **Validation**: Post validation before publishing
- **Dynamic Platform Management**: Add/remove platforms at runtime
- **TypeScript Support**: Full TypeScript support with proper type definitions

## Architecture

The library follows a modular architecture:

- **SocialCore**: Abstract base class with common functionality
- **Platform Classes**: Platform-specific implementations (Facebook, Instagram, etc.)
- **PlatformFactory**: Factory for creating platform instances
- **SocialPlugin**: Main plugin class that orchestrates publishing

## Installation

```bash
npm install @awing/social-plugin
```

## Quick Start

```typescript
import { SocialPlugin, SocialPost } from '@awing/social-plugin';

// Configure platforms
const platformConfig = {
  facebook: {
    pageId: 'your-page-id',
    pageAccessToken: 'your-page-access-token',
    maxRetries: 3,
  },
  instagram: {
    userId: 'your-user-id',
    accessToken: 'your-instagram-access-token',
    maxRetries: 3,
  },
  linkedin: {
    accessToken: 'your-linkedin-access-token',
    organizationId: 'your-organization-id', // Optional
    maxRetries: 3,
  },
  twitter: {
    bearerToken: 'your-twitter-bearer-token',
    maxRetries: 3,
  },
  tiktok: {
    accessToken: 'your-tiktok-access-token',
    clientKey: 'your-client-key',
    openId: 'your-open-id',
    maxRetries: 3,
  },
};

// Create SocialPlugin instance
const socialPlugin = new SocialPlugin({
  platforms: platformConfig,
  retryAttempts: 3,
  retryDelay: 1000,
  logger: console, // Optional custom logger
});

// Publish a post
const post: SocialPost = {
  content: 'Hello world! This is a test post.',
  hashtags: ['socialmedia', 'automation'],
  media: ['https://example.com/image.jpg'], // Optional
};

const result = await socialPlugin.publish(post);
console.log('Publish result:', result);
```

## API Reference

### SocialPlugin

Main class for managing social media publishing.

#### Constructor

```typescript
new SocialPlugin(config: SocialPluginConfig)
```

**Config Options:**
- `platforms`: Platform configuration object
- `logger`: Optional custom logger (defaults to console)
- `retryAttempts`: Number of retry attempts (default: 3)
- `retryDelay`: Delay between retries in milliseconds (default: 1000)

#### Methods

##### `publish(post: SocialPost): Promise<PublishResult>`

Publishes a post to all configured platforms.

```typescript
const result = await socialPlugin.publish({
  content: 'Your post content',
  hashtags: ['tag1', 'tag2'],
  media: ['https://example.com/image.jpg'],
});
```

##### `publishToPlatform(platformType: PlatformType, post: SocialPost): Promise<SocialResponse>`

Publishes a post to a specific platform.

```typescript
const result = await socialPlugin.publishToPlatform('facebook', post);
```

##### `validatePost(post: SocialPost): { valid: boolean; errors: string[] }`

Validates a post before publishing.

```typescript
const validation = socialPlugin.validatePost(post);
if (validation.valid) {
  await socialPlugin.publish(post);
} else {
  console.error('Validation errors:', validation.errors);
}
```

##### `addPlatform(platformType: PlatformType, config: SocialPlatformConfig): void`

Adds a platform dynamically.

```typescript
socialPlugin.addPlatform('twitter', {
  bearerToken: 'your-bearer-token',
  maxRetries: 3,
});
```

##### `removePlatform(platformType: PlatformType): boolean`

Removes a platform.

```typescript
const removed = socialPlugin.removePlatform('twitter');
```

##### `getConfiguredPlatforms(): PlatformType[]`

Returns all configured platforms.

##### `getAvailablePlatforms(): PlatformType[]`

Returns all available platform types.

##### `isPlatformConfigured(platformType: PlatformType): boolean`

Checks if a platform is configured.

### Events

The SocialPlugin extends EventEmitter and emits the following events:

- `platform:success`: Emitted when a post is successfully published to a platform
- `platform:error`: Emitted when a post fails to publish to a platform
- `publish:complete`: Emitted when all platforms have been processed

```typescript
socialPlugin.on('platform:success', (data) => {
  console.log(`Successfully published to ${data.platform}:`, data.response.postId);
});

socialPlugin.on('platform:error', (data) => {
  console.log(`Failed to publish to ${data.platform}:`, data.error.message);
});

socialPlugin.on('publish:complete', (result) => {
  console.log('Publish operation completed:', {
    successful: result.successfulPlatforms.length,
    failed: result.failedPlatforms.length,
  });
});
```

## Platform Configuration

### Facebook

```typescript
{
  pageId: 'your-page-id',
  pageAccessToken: 'your-page-access-token',
  maxRetries: 3,
  timeout: 30000,
}
```

### Instagram

```typescript
{
  userId: 'your-user-id',
  accessToken: 'your-instagram-access-token',
  maxRetries: 3,
}
```

### LinkedIn

```typescript
{
  accessToken: 'your-linkedin-access-token',
  organizationId: 'your-organization-id', // Optional, for company pages
  maxRetries: 3,
}
```

### Twitter

```typescript
{
  bearerToken: 'your-twitter-bearer-token',
  maxRetries: 3,
}
```

### TikTok

```typescript
{
  accessToken: 'your-tiktok-access-token',
  clientKey: 'your-client-key',
  openId: 'your-open-id',
  maxRetries: 3,
}
```

## Error Handling

The library provides comprehensive error handling:

1. **Network Errors**: Automatic retry with exponential backoff
2. **API Errors**: Platform-specific error messages
3. **Validation Errors**: Pre-publish validation
4. **Rate Limiting**: Automatic handling of rate limits

## Logging

The library provides detailed logging for all operations:

- Request/response logging
- Error logging with stack traces
- Retry attempt logging
- Success/failure logging

## Examples

See the `usage-example.ts` file for comprehensive examples of all features.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
