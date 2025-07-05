import { LlmPlugin, LlmPluginConfig, LlmRequest, OllamaConfig } from '@awing/llm-plugin'
import { SocialPlugin, PlatformConfig, SocialPost } from '@awing/social-plugin'

export class ContentManager {
    private socialPlugin: SocialPlugin;
    private config: LlmPluginConfig;
    private llmPlugin: LlmPlugin;
    private request: LlmRequest;

    constructor() {
        this.config = {
            provider: 'ollama',
            config: {
                baseUrl: 'http://localhost:11434',
                timeout: 60000, // Ollama can be slower
                maxRetries: 2,
            } as OllamaConfig,
        };

        this.llmPlugin = new LlmPlugin(this.config);

        this.request = {
            prompt: 'Explain quantum computing in simple terms',
            model: 'llama3.2:latest',
            temperature: 0.8,
            maxTokens: 200,
        };

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

    async generate() {
        try {
            const response = await this.llmPlugin.ask(this.request);
            console.log('Ollama Response:', response.content);
            return response;
        } catch (error) {
            console.error('Ollama Error:', error);
            throw error;
        }
    }

    async publish() {
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
}
