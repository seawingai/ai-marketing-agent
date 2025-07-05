import { LlmPlugin, LlmPluginConfig, LlmRequest, OllamaConfig } from '@awing/llm-plugin'
import { MarketingDb, TaskSchedule } from '@awing/marketing-db';
import { SocialPlugin, PlatformConfig, SocialPost } from '@awing/social-plugin'

export type PublishResponse = {
    success: boolean;
    messages: string [];
} 

export class ContentManager {
    private socialPlugin: SocialPlugin;
    private config: LlmPluginConfig;
    private llmPlugin: LlmPlugin;
    private db: MarketingDb;

    constructor(db:MarketingDb) {
        this.db = db;
        
        this.config = {
            provider: 'ollama',
            config: {
                baseUrl: 'http://localhost:11434',
                timeout: 60000, // Ollama can be slower
                maxRetries: 2,
            } as OllamaConfig,
        };

        this.llmPlugin = new LlmPlugin(this.config);

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

    async generate(id: string) {
        try {
            const response = await this.llmPlugin.ask(this.request(id));
            console.log('Ollama Response:', response.content);
            return response;
        } catch (error) {
            console.error('Ollama Error:', error);
            throw error;
        }
    }

    request(id: string): LlmRequest {
        const ts = TaskSchedule.parseId(id);
        const prompt = this.db.schedules.get(ts.scheduleId).prompt;
        const systemPrompt = this.db.prompts.get('text');

        return {
            prompt: prompt,
            model: 'llama3.2:latest',
            temperature: 0.8,
            maxTokens: 200,
            systemPrompt: systemPrompt
        };
    }

    async publish(id: string): Promise<PublishResponse> {
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
            return { success: true, messages: []}
        } else {
            console.error('Post validation failed:', validation.errors);
            return { success: false, messages: validation.errors}
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
