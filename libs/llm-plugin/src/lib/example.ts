import { LlmPlugin, LlmPluginConfig } from './llm-plugin';
import { LlmRequest } from './llm-core';
import { OpenAiConfig } from './providers/openai-provider';
import { OllamaConfig } from './providers/ollama-provider';
import { GeminiConfig } from './providers/gemini-provider';
import { MistralConfig } from './providers/mistral-provider';

exampleOllama();

// Example usage of the LlmPlugin with different providers

export async function exampleOpenAI() {
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
    console.log('OpenAI Response:', response.content);
    return response;
  } catch (error) {
    console.error('OpenAI Error:', error);
    throw error;
  }
}

export async function exampleOllama() {
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
    model: 'llama3.2:latest',
    temperature: 0.8,
    maxTokens: 200,
  };

  try {
    const response = await llmPlugin.ask(request);
    console.log('Ollama Response:', response.content);
    return response;
  } catch (error) {
    console.error('Ollama Error:', error);
    throw error;
  }
}

export async function exampleGemini() {
  const config: LlmPluginConfig = {
    provider: 'gemini',
    config: {
      apiKey: process.env.GEMINI_API_KEY || 'your-gemini-api-key',
      timeout: 30000,
      maxRetries: 3,
    } as GeminiConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  const request: LlmRequest = {
    prompt: 'Write a short poem about technology',
    model: 'gemini-pro',
    temperature: 0.9,
    maxTokens: 150,
  };

  try {
    const response = await llmPlugin.ask(request);
    console.log('Gemini Response:', response.content);
    return response;
  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
}

export async function exampleMistral() {
  const config: LlmPluginConfig = {
    provider: 'mistral',
    config: {
      apiKey: process.env.MISTRAL_API_KEY || 'your-mistral-api-key',
      timeout: 30000,
      maxRetries: 3,
    } as MistralConfig,
  };

  const llmPlugin = new LlmPlugin(config);

  const request: LlmRequest = {
    prompt: 'What are the benefits of renewable energy?',
    model: 'mistral-tiny',
    temperature: 0.6,
    maxTokens: 200,
  };

  try {
    const response = await llmPlugin.ask(request);
    console.log('Mistral Response:', response.content);
    return response;
  } catch (error) {
    console.error('Mistral Error:', error);
    throw error;
  }
}

export async function exampleWithFallback() {
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

export async function exampleWithSystemPrompt() {
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

// Example of batch processing
export async function exampleBatchProcessing() {
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