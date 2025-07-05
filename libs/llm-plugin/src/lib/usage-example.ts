import { LlmPlugin, LlmPluginConfig } from './llm-plugin';
import { LlmRequest } from './llm-core';
import { OpenAiConfig } from './providers/openai-provider';
import { OllamaConfig } from './providers/ollama-provider';

// Example 1: Basic OpenAI usage
export async function basicOpenAIExample() {
  console.log('=== Basic OpenAI Example ===');
  
  const config: LlmPluginConfig = {
    provider: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
      timeout: 30000,
      maxRetries: 3,
    } as OpenAiConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  const request: LlmRequest = {
    prompt: 'What is the capital of France?',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 100,
  };

  try {
    const response = await llmPlugin.ask(request);
    console.log('Response:', response.content);
    console.log('Model used:', response.model);
    console.log('Token usage:', response.usage);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Example 2: Ollama with local model
export async function ollamaExample() {
  console.log('=== Ollama Example ===');
  
  const config: LlmPluginConfig = {
    provider: 'ollama',
    config: {
      baseUrl: 'http://localhost:11434',
      timeout: 60000, // Ollama can be slower
      maxRetries: 2,
    } as OllamaConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  const request: LlmRequest = {
    prompt: 'Explain quantum computing in simple terms',
    model: 'llama2',
    temperature: 0.8,
    maxTokens: 200,
  };

  try {
    const response = await llmPlugin.ask(request);
    console.log('Response:', response.content);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Example 3: With fallback provider
export async function fallbackExample() {
  console.log('=== Fallback Example ===');
  
  const config: LlmPluginConfig = {
    provider: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    } as OpenAiConfig,
    fallbackProvider: 'ollama',
    fallbackConfig: {
      baseUrl: 'http://localhost:11434',
    } as OllamaConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  const request: LlmRequest = {
    prompt: 'Explain machine learning concepts',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 300,
  };

  try {
    // This will try OpenAI first, and if it fails, fall back to Ollama
    const response = await llmPlugin.askWithRetry(request, 2);
    console.log('Response with fallback:', response.content);
    return response;
  } catch (error) {
    console.error('All providers failed:', error);
    throw error;
  }
}

// Example 4: With system prompt
export async function systemPromptExample() {
  console.log('=== System Prompt Example ===');
  
  const config: LlmPluginConfig = {
    provider: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    } as OpenAiConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  const request: LlmRequest = {
    prompt: 'Write a professional email to schedule a meeting',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are a professional business assistant. Always be polite and concise.',
    temperature: 0.5,
    maxTokens: 200,
  };

  try {
    const response = await llmPlugin.ask(request);
    console.log('Professional Email:', response.content);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Example 5: Batch processing
export async function batchProcessingExample() {
  console.log('=== Batch Processing Example ===');
  
  const config: LlmPluginConfig = {
    provider: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    } as OpenAiConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  const prompts = [
    'What is artificial intelligence?',
    'Explain blockchain technology',
    'What is cloud computing?',
    'Describe machine learning',
  ];

  const requests: LlmRequest[] = prompts.map(prompt => ({
    prompt,
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 150,
  }));

  try {
    const responses = await Promise.all(
      requests.map(request => llmPlugin.ask(request))
    );

    responses.forEach((response, index) => {
      console.log(`Response ${index + 1}:`, response.content.substring(0, 100) + '...');
    });

    return responses;
  } catch (error) {
    console.error('Batch processing error:', error);
    throw error;
  }
}

// Example 6: Configuration validation
export async function configValidationExample() {
  console.log('=== Configuration Validation Example ===');
  
  const config: LlmPluginConfig = {
    provider: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    } as OpenAiConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  try {
    const isValid = await llmPlugin.validateConfig();
    console.log('Configuration is valid:', isValid);
    
    if (isValid) {
      console.log('Available models:', llmPlugin.getAvailableModels());
    }
    
    return isValid;
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
}

// Main function to run all examples
export async function runAllExamples() {
  console.log('🚀 Starting LLM Plugin Examples\n');

  try {
    // Run examples that don't require actual API keys for demonstration
    console.log('1. Configuration validation...');
    await configValidationExample();
    
    console.log('\n2. Available models...');
    const config: LlmPluginConfig = {
      provider: 'openai',
      config: {
        apiKey: 'demo-key',
      } as OpenAiConfig,
    };
    const llmPlugin = new LlmPlugin(config);
    console.log('Available models:', llmPlugin.getAvailableModels());

    console.log('\n✅ Examples completed successfully!');
    console.log('\nNote: To test with real APIs, set your API keys as environment variables:');
    console.log('- OPENAI_API_KEY');
    console.log('- GEMINI_API_KEY');
    console.log('- MISTRAL_API_KEY');
    console.log('\nFor Ollama, make sure it\'s running on http://localhost:11434');

  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// All functions are already exported above 