# LLM Plugin

A comprehensive TypeScript library for interacting with multiple Large Language Model (LLM) providers including OpenAI, Ollama, Google Gemini, and Mistral AI. The plugin provides a unified interface with robust error handling, logging, and retry mechanisms.

## Features

- **Multi-Provider Support**: OpenAI, Ollama, Google Gemini, Mistral AI
- **Unified Interface**: Consistent API across all providers
- **Robust Error Handling**: Comprehensive error management with retry logic
- **Logging**: Structured logging with Winston
- **Fallback Support**: Automatic fallback to secondary providers
- **Retry Mechanisms**: Exponential backoff with configurable retries
- **Type Safety**: Full TypeScript support with proper interfaces

## Architecture

The library follows a clean architecture pattern:

```
LlmPlugin (Main Interface)
├── LlmCore (Base Class)
│   ├── HTTP Client (Axios)
│   ├── Logging (Winston)
│   ├── Retry Logic (retry)
│   └── Error Handling
└── Provider Implementations
    ├── OpenAiProvider
    ├── OllamaProvider
    ├── GeminiProvider
    └── MistralProvider
```

## Installation

```bash
npm install @awing/llm-plugin
```

## Quick Start

### Basic Usage

```typescript
import { LlmPlugin, LlmPluginConfig } from '@awing/llm-plugin';
import { OpenAiConfig } from '@awing/llm-plugin';

const config: LlmPluginConfig = {
  provider: 'openai',
  config: {
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 3,
  } as OpenAiConfig,
};

const llmPlugin = new LlmPlugin(config);

const response = await llmPlugin.ask({
  prompt: 'What is the capital of France?',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 100,
});

console.log(response.content);
```

### With Fallback Provider

```typescript
const config: LlmPluginConfig = {
  provider: 'openai',
  config: {
    apiKey: process.env.OPENAI_API_KEY,
  } as OpenAiConfig,
  fallbackProvider: 'ollama',
  fallbackConfig: {
    baseUrl: 'http://localhost:11434',
  } as OllamaConfig,
};

const llmPlugin = new LlmPlugin(config);

// This will try OpenAI first, then fall back to Ollama if needed
const response = await llmPlugin.askWithRetry({
  prompt: 'Explain machine learning',
  model: 'gpt-3.5-turbo',
  maxTokens: 200,
}, 3);
```

## Supported Providers

### OpenAI

```typescript
import { OpenAiConfig } from '@awing/llm-plugin';

const config: OpenAiConfig = {
  apiKey: 'your-openai-api-key',
  baseUrl: 'https://api.openai.com/v1', // Optional
  organization: 'your-org-id', // Optional
  timeout: 30000,
  maxRetries: 3,
};
```

**Models**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`, etc.

### Ollama

```typescript
import { OllamaConfig } from '@awing/llm-plugin';

const config: OllamaConfig = {
  baseUrl: 'http://localhost:11434', // Default
  timeout: 60000, // Ollama can be slower
  maxRetries: 2,
};
```

**Models**: `llama2`, `codellama`, `mistral`, etc.

### Google Gemini

```typescript
import { GeminiConfig } from '@awing/llm-plugin';

const config: GeminiConfig = {
  apiKey: 'your-gemini-api-key',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  timeout: 30000,
  maxRetries: 3,
};
```

**Models**: `gemini-pro`, `gemini-pro-vision`, etc.

### Mistral AI

```typescript
import { MistralConfig } from '@awing/llm-plugin';

const config: MistralConfig = {
  apiKey: 'your-mistral-api-key',
  baseUrl: 'https://api.mistral.ai/v1',
  timeout: 30000,
  maxRetries: 3,
};
```

**Models**: `mistral-tiny`, `mistral-small`, `mistral-medium`, etc.

## API Reference

### LlmPlugin

#### Constructor

```typescript
constructor(config: LlmPluginConfig)
```

#### Methods

- `ask(request: LlmRequest): Promise<LlmResponse>` - Send a request to the LLM
- `askWithRetry(request: LlmRequest, maxRetries?: number): Promise<LlmResponse>` - Send request with retry logic
- `getAvailableModels(): string[]` - Get list of available models
- `validateConfig(): Promise<boolean>` - Validate the current configuration

### LlmRequest

```typescript
interface LlmRequest {
  prompt: string;           // The main prompt/question
  model?: string;           // Model name (provider-specific)
  temperature?: number;      // Creativity level (0-1)
  maxTokens?: number;       // Maximum tokens in response
  systemPrompt?: string;    // System instruction (if supported)
}
```

### LlmResponse

```typescript
interface LlmResponse {
  content: string;          // The generated response
  model: string;           // Model used
  usage?: {                // Token usage (if available)
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>; // Additional provider-specific data
}
```

## Error Handling

The library provides comprehensive error handling:

```typescript
try {
  const response = await llmPlugin.ask(request);
  console.log(response.content);
} catch (error) {
  if (error.retryable) {
    console.log('Error is retryable, attempting fallback...');
  } else {
    console.error('Non-retryable error:', error.message);
  }
}
```

### Error Types

- **Network Errors**: Automatically retried
- **Rate Limits (429)**: Retried with exponential backoff
- **Server Errors (5xx)**: Retried
- **Authentication Errors**: Not retried
- **Invalid Requests**: Not retried

## Logging

The library uses Winston for structured logging:

```typescript
// Log levels: error, warn, info, debug
const config = {
  logLevel: 'info', // Default
  // ... other config
};
```

Logs include:
- Request/response details
- Performance metrics
- Error information
- Retry attempts

## Advanced Usage

### Batch Processing

```typescript
const prompts = [
  'What is AI?',
  'Explain blockchain',
  'What is cloud computing?',
];

const requests = prompts.map(prompt => ({
  prompt,
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 150,
}));

const responses = await Promise.all(
  requests.map(request => llmPlugin.ask(request))
);
```

### Custom Retry Logic

```typescript
const response = await llmPlugin.askWithRetry({
  prompt: 'Complex question here',
  model: 'gpt-4',
  maxTokens: 500,
}, 5); // 5 retry attempts
```

### Configuration Validation

```typescript
const isValid = await llmPlugin.validateConfig();
if (!isValid) {
  console.error('Invalid configuration');
}
```

## Environment Variables

Set these environment variables for API keys:

```bash
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
MISTRAL_API_KEY=your-mistral-key
```

## Examples

See the `example.ts` file for comprehensive usage examples including:

- Basic usage with each provider
- Fallback configurations
- System prompts
- Batch processing
- Error handling

## Contributing

To add a new LLM provider:

1. Create a new provider class extending `LlmCore`
2. Implement the `ask` method
3. Add provider-specific interfaces
4. Update the `LlmPlugin` class to support the new provider
5. Add tests and documentation

## License

MIT License - see LICENSE file for details.
