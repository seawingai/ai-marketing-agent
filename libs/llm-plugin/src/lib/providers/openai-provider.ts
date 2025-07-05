import { LlmCore, LlmConfig, LlmRequest, LlmResponse } from '../llm-core';

export interface OpenAiConfig extends LlmConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
}

export interface OpenAiRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenAiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAiProvider extends LlmCore {
  private openAiConfig: OpenAiConfig;

  constructor(config: OpenAiConfig) {
    super(config);
    this.openAiConfig = {
      baseUrl: 'https://api.openai.com/v1',
      ...config,
    };
  }

  async ask(request: LlmRequest): Promise<LlmResponse> {
    const startTime = Date.now();
    const provider = 'OpenAI';

    try {
      this.logRequest(request, provider);

      const openAiRequest: OpenAiRequest = {
        model: request.model || 'gpt-3.5-turbo',
        messages: [
          ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
          { role: 'user' as const, content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false,
      };

      const response = await this.makeRequest<OpenAiResponse>(
        () => this.httpClient.post(`${this.openAiConfig.baseUrl}/chat/completions`, openAiRequest, {
          headers: {
            'Authorization': `Bearer ${this.openAiConfig.apiKey}`,
            ...(this.openAiConfig.organization && { 'OpenAI-Organization': this.openAiConfig.organization }),
          },
        }),
        'OpenAI API Request'
      );

      const llmResponse: LlmResponse = {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
        metadata: {
          id: response.id,
          finishReason: response.choices[0]?.finish_reason,
        },
      };

      const duration = Date.now() - startTime;
      this.logResponse(llmResponse, provider, duration);

      return llmResponse;
    } catch (error) {
      this.logError(error as any, provider);
      throw error;
    }
  }
} 