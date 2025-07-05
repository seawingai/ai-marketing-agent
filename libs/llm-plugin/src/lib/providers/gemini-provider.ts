import { LlmCore, LlmConfig, LlmRequest, LlmResponse } from '../llm-core';

export interface GeminiConfig extends LlmConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends LlmCore {
  private geminiConfig: GeminiConfig;

  constructor(config: GeminiConfig) {
    super(config);
    this.geminiConfig = {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      ...config,
    };
  }

  async ask(request: LlmRequest): Promise<LlmResponse> {
    const startTime = Date.now();
    const provider = 'Gemini';

    try {
      this.logRequest(request, provider);

      const model = request.model || 'gemini-pro';
      const messages = [];
      
      if (request.systemPrompt) {
        messages.push({ parts: [{ text: request.systemPrompt }] });
      }
      messages.push({ parts: [{ text: request.prompt }] });

      const geminiRequest: GeminiRequest = {
        contents: messages,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens,
        },
      };

      const response = await this.makeRequest<GeminiResponse>(
        () => this.httpClient.post(
          `${this.geminiConfig.baseUrl}/models/${model}:generateContent?key=${this.geminiConfig.apiKey}`,
          geminiRequest
        ),
        'Gemini API Request'
      );

      const llmResponse: LlmResponse = {
        content: response.candidates[0]?.content?.parts[0]?.text || '',
        model: model,
        usage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount,
          completionTokens: response.usageMetadata.candidatesTokenCount,
          totalTokens: response.usageMetadata.totalTokenCount,
        } : undefined,
        metadata: {
          finishReason: response.candidates[0]?.finishReason,
          safetyRatings: response.candidates[0]?.safetyRatings,
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