import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as retry from 'retry';
import { PinoPlugin } from '@awing/pino-plugin'
export interface LlmConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  logLevel?: string;
}

export interface LlmRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LlmResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface LlmError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}

export abstract class LlmCore {
  protected config: LlmConfig;
  protected logger: PinoPlugin;
  protected httpClient: AxiosInstance;
  protected operation: retry.RetryOperation;

  constructor(config: LlmConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: 'info',
      ...config,
    };

    this.setupLogger();
    this.setupHttpClient();
    this.setupRetry();
  }

  private setupLogger(): void {
    this.logger = new PinoPlugin(this.constructor.name);
  }

  private setupHttpClient(): void {
    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug2(`HTTP Request`, {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        this.logger.error('HTTP Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug2('HTTP Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.logger.error('HTTP Response Error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          error: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  private setupRetry(): void {
    this.operation = retry.operation({
      retries: this.config.maxRetries,
      factor: 2,
      minTimeout: this.config.retryDelay,
      maxTimeout: 10000,
    });
  }

  protected async makeRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    context: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operation.attempt(async (currentAttempt) => {
        try {
          this.logger.info2(`${context} - Attempt ${currentAttempt}`, {
            attempt: currentAttempt,
            maxRetries: this.config.maxRetries,
          });

          const response = await requestFn();
          resolve(response.data);
        } catch (error) {
          const llmError = this.createLlmError(error, context);
          
          this.logger.error(`${context} - Attempt ${currentAttempt} failed`, {
            attempt: currentAttempt,
            error: llmError.message,
            retryable: llmError.retryable,
          });

          if (this.operation.retry(llmError)) {
            this.logger.info(`${context} - Retrying...`);
            return;
          }

          reject(llmError);
        }
      });
    });
  }

  private createLlmError(error: any, context: string): LlmError {
    const llmError: LlmError = new Error(
      `${context} failed: ${error.message || 'Unknown error'}`
    ) as LlmError;

    llmError.name = 'LlmError';
    llmError.code = error.code || 'UNKNOWN_ERROR';
    llmError.statusCode = error.response?.status;
    llmError.retryable = this.isRetryableError(error);

    return llmError;
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, 5xx server errors, and rate limits
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return true;
    }

    const statusCode = error.response?.status;
    if (statusCode >= 500 || statusCode === 429) {
      return true;
    }

    return false;
  }

  protected logRequest(request: LlmRequest, provider: string): void {
    this.logger.info2('LLM Request', {
      provider,
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      promptLength: request.prompt.length,
      hasSystemPrompt: !!request.systemPrompt,
    });
  }

  protected logResponse(response: LlmResponse, provider: string, duration: number): void {
    this.logger.info2('LLM Response', {
      provider,
      model: response.model,
      contentLength: response.content.length,
      usage: response.usage,
      duration,
    });
  }

  protected logError(error: LlmError, provider: string): void {
    this.logger.error2('LLM Error', {
      provider,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
    });
  }

  // Abstract method that each LLM provider must implement
  abstract ask(request: LlmRequest): Promise<LlmResponse>;
} 