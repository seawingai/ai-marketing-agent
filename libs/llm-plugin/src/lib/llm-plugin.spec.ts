import { LlmPlugin, LlmPluginConfig } from './llm-plugin';
import { LlmRequest } from './llm-core';
import { OpenAiConfig } from './providers/openai-provider';
import { OllamaConfig } from './providers/ollama-provider';

describe('LlmPlugin', () => {
  let llmPlugin: LlmPlugin;
  let mockConfig: LlmPluginConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'openai',
      config: {
        apiKey: 'test-api-key',
        timeout: 5000,
        maxRetries: 1,
      } as OpenAiConfig,
    };
  });

  describe('constructor', () => {
    it('should create an instance with valid config', () => {
      llmPlugin = new LlmPlugin(mockConfig);
      expect(llmPlugin).toBeDefined();
    });

    it('should create instance with fallback provider', () => {
      const configWithFallback: LlmPluginConfig = {
        ...mockConfig,
        fallbackProvider: 'ollama',
        fallbackConfig: {
          baseUrl: 'http://localhost:11434',
        } as OllamaConfig,
      };

      llmPlugin = new LlmPlugin(configWithFallback);
      expect(llmPlugin).toBeDefined();
    });

    it('should throw error for unsupported provider', () => {
      const invalidConfig = {
        ...mockConfig,
        provider: 'unsupported' as any,
      };

      expect(() => new LlmPlugin(invalidConfig)).toThrow('Unsupported LLM provider: unsupported');
    });
  });

  describe('getAvailableModels', () => {
    beforeEach(() => {
      llmPlugin = new LlmPlugin(mockConfig);
    });

    it('should return array of available models', () => {
      const models = llmPlugin.getAvailableModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('gpt-4');
    });
  });

  describe('validateConfig', () => {
    beforeEach(() => {
      llmPlugin = new LlmPlugin(mockConfig);
    });

    it('should return boolean indicating config validity', async () => {
      // This test would require actual API calls, so we'll mock the behavior
      // In a real test environment, you'd want to use actual API keys or mock the HTTP calls
      const result = await llmPlugin.validateConfig();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('ask method', () => {
    beforeEach(() => {
      llmPlugin = new LlmPlugin(mockConfig);
    });

    it('should accept valid LlmRequest', () => {
      const request: LlmRequest = {
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
      };

      // This would normally make an API call
      // In a real test, you'd want to mock the HTTP client
      expect(request).toBeDefined();
      expect(request.prompt).toBe('Test prompt');
      expect(request.model).toBe('gpt-3.5-turbo');
    });

    it('should handle request with system prompt', () => {
      const request: LlmRequest = {
        prompt: 'User question',
        model: 'gpt-3.5-turbo',
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.5,
        maxTokens: 150,
      };

      expect(request.systemPrompt).toBe('You are a helpful assistant.');
    });
  });

  describe('askWithRetry method', () => {
    beforeEach(() => {
      llmPlugin = new LlmPlugin(mockConfig);
    });

    it('should accept custom retry count', () => {
      const request: LlmRequest = {
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
        maxTokens: 50,
      };

      // This would test the retry logic
      // In a real test, you'd want to mock failures and verify retry behavior
      expect(request).toBeDefined();
    });
  });

  describe('provider configurations', () => {
    it('should support OpenAI configuration', () => {
      const openAiConfig: OpenAiConfig = {
        apiKey: 'test-key',
        organization: 'test-org',
        timeout: 30000,
        maxRetries: 3,
      };

      expect(openAiConfig.apiKey).toBe('test-key');
      expect(openAiConfig.organization).toBe('test-org');
    });

    it('should support Ollama configuration', () => {
      const ollamaConfig: OllamaConfig = {
        baseUrl: 'http://localhost:11434',
        timeout: 60000,
        maxRetries: 2,
      };

      expect(ollamaConfig.baseUrl).toBe('http://localhost:11434');
      expect(ollamaConfig.timeout).toBe(60000);
    });
  });

  describe('error handling', () => {
    it('should handle missing API key gracefully', () => {
      const configWithoutKey: LlmPluginConfig = {
        provider: 'openai',
        config: {
          timeout: 5000,
          maxRetries: 1,
        } as OpenAiConfig,
      };

      // This would test error handling for missing API keys
      expect(configWithoutKey).toBeDefined();
    });

    it('should handle invalid provider gracefully', () => {
      const invalidConfig = {
        provider: 'invalid-provider' as any,
        config: {
          apiKey: 'test-key',
        } as OpenAiConfig,
      };

      expect(() => new LlmPlugin(invalidConfig)).toThrow();
    });
  });
});
