import { LlmCore, LlmRequest, LlmResponse, LlmError } from './llm-core';
import { OpenAiProvider, OpenAiConfig } from './providers/openai-provider';
import { OllamaProvider, OllamaConfig } from './providers/ollama-provider';
import { GeminiProvider, GeminiConfig } from './providers/gemini-provider';
import { MistralProvider, MistralConfig } from './providers/mistral-provider';

export type LlmProviderType = 'openai' | 'ollama' | 'gemini' | 'mistral';

export interface LlmPluginConfig {
  provider: LlmProviderType;
  config: OpenAiConfig | OllamaConfig | GeminiConfig | MistralConfig;
  fallbackProvider?: LlmProviderType;
  fallbackConfig?: OpenAiConfig | OllamaConfig | GeminiConfig | MistralConfig;
}

export class LlmPlugin {
  private provider: LlmCore;
  private fallbackProvider?: LlmCore;
  private logger: any; // Using the logger from LlmCore

  constructor(config: LlmPluginConfig) {
    this.provider = this.createProvider(config.provider, config.config);
    
    if (config.fallbackProvider && config.fallbackConfig) {
      this.fallbackProvider = this.createProvider(config.fallbackProvider, config.fallbackConfig);
    }
  }

  private createProvider(
    type: LlmProviderType,
    config: OpenAiConfig | OllamaConfig | GeminiConfig | MistralConfig
  ): LlmCore {
    switch (type) {
      case 'openai':
        return new OpenAiProvider(config as OpenAiConfig);
      case 'ollama':
        return new OllamaProvider(config as OllamaConfig);
      case 'gemini':
        return new GeminiProvider(config as GeminiConfig);
      case 'mistral':
        return new MistralProvider(config as MistralConfig);
      default:
        throw new Error(`Unsupported LLM provider: ${type}`);
    }
  }

  async ask(request: LlmRequest): Promise<LlmResponse> {
    try {
      return await this.provider.ask(request);
    } catch (error) {
      const llmError = error as LlmError;
      
      // If we have a fallback provider and the error is retryable, try the fallback
      if (this.fallbackProvider && llmError.retryable) {
        try {
          return await this.fallbackProvider.ask(request);
        } catch (fallbackError) {
          // If fallback also fails, throw the original error
          throw llmError;
        }
      }
      
      throw llmError;
    }
  }

  async askWithRetry(request: LlmRequest, maxRetries: number = 3): Promise<LlmResponse> {
    let lastError: LlmError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.ask(request);
      } catch (error) {
        lastError = error as LlmError;
        
        if (attempt === maxRetries || !lastError.retryable) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Method to get available models for the current provider
  getAvailableModels(): string[] {
    // This would need to be implemented based on the specific provider
    // For now, returning common models
    return [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'llama2',
      'gemini-pro',
      'mistral-tiny',
      'mistral-small',
      'mistral-medium',
    ];
  }

  // Method to validate if the current configuration is valid
  async validateConfig(): Promise<boolean> {
    try {
      const testRequest: LlmRequest = {
        prompt: 'Hello',
        maxTokens: 10,
      };
      
      await this.ask(testRequest);
      return true;
    } catch (error) {
      return false;
    }
  }
}
