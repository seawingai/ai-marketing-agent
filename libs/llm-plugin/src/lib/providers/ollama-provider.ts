import { LlmCore, LlmConfig, LlmRequest, LlmResponse } from '../llm-core';

export interface OllamaConfig extends LlmConfig {
  baseUrl?: string;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  num_predict?: number;
  stream?: boolean;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaProvider extends LlmCore {
  private ollamaConfig: OllamaConfig;

  constructor(config: OllamaConfig) {
    super(config);
    this.ollamaConfig = {
      baseUrl: 'http://localhost:11434',
      ...config,
    };
  }

  async ask(request: LlmRequest): Promise<LlmResponse> {
    const startTime = Date.now();
    const provider = 'Ollama';

    try {
      this.logRequest(request, provider);

      const ollamaRequest: OllamaRequest = {
        model: request.model || 'llama2',
        prompt: request.prompt,
        system: request.systemPrompt,
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens,
        stream: false,
      };

      const response = await this.makeRequest<OllamaResponse>(
        () => this.httpClient.post(`${this.ollamaConfig.baseUrl}/api/generate`, ollamaRequest),
        'Ollama API Request'
      );

      const llmResponse: LlmResponse = {
        content: response.response,
        model: response.model,
        usage: {
          promptTokens: response.prompt_eval_count || 0,
          completionTokens: response.eval_count || 0,
          totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
        },
        metadata: {
          totalDuration: response.total_duration,
          loadDuration: response.load_duration,
          promptEvalDuration: response.prompt_eval_duration,
          evalDuration: response.eval_duration,
          done: response.done,
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