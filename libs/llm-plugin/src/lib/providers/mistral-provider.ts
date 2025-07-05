import { LlmCore, LlmConfig, LlmRequest, LlmResponse } from '../llm-core';

export interface MistralConfig extends LlmConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface MistralRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  random_seed?: number;
  stream?: boolean;
  safe_prompt?: boolean;
}

export interface MistralResponse {
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

export class MistralProvider extends LlmCore {
  private mistralConfig: MistralConfig;

  constructor(config: MistralConfig) {
    super(config);
    this.mistralConfig = {
      baseUrl: 'https://api.mistral.ai/v1',
      ...config,
    };
  }

  async ask(request: LlmRequest): Promise<LlmResponse> {
    const startTime = Date.now();
    const provider = 'Mistral';

    try {
      this.logRequest(request, provider);

      const mistralRequest: MistralRequest = {
        model: request.model || 'mistral-tiny',
        messages: [
          ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
          { role: 'user' as const, content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false,
      };

      const response = await this.makeRequest<MistralResponse>(
        () => this.httpClient.post(`${this.mistralConfig.baseUrl}/chat/completions`, mistralRequest, {
          headers: {
            'Authorization': `Bearer ${this.mistralConfig.apiKey}`,
          },
        }),
        'Mistral API Request'
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