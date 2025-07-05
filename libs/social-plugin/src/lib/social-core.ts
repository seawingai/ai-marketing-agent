import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface SocialPost {
  content: string;
  media?: string[];
  hashtags?: string[];
  scheduledTime?: Date;
  platform?: string;
}

export interface SocialResponse {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  platform: string;
  timestamp: Date;
}

export interface SocialPlatformConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export abstract class SocialCore extends EventEmitter {
  protected config: SocialPlatformConfig;
  protected logger: Console;
  protected maxRetries: number;
  protected retryDelay: number = 1000;
  protected httpClient: AxiosInstance;

  constructor(config: SocialPlatformConfig, logger?: Console) {
    super();
    this.config = config;
    this.logger = logger || console;
    this.maxRetries = config.maxRetries || 3;
    this.setupHttpClient();
  }

  /**
   * Setup HTTP client with axios
   */
  private setupHttpClient(): void {
    this.httpClient = axios.create({
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.info(`Making request to ${config.url}`, {
          method: config.method,
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
        this.logger.info(`Request successful: ${response.status}`, {
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

  /**
   * Abstract method that must be implemented by each platform
   */
  abstract publish(post: SocialPost): Promise<SocialResponse>;

  /**
   * Common HTTP request method with retry logic using axios
   */
  protected async makeRequest<T>(
    url: string,
    options: AxiosRequestConfig = {},
    retryCount: number = 0
  ): Promise<AxiosResponse<T>> {
    try {
      this.logger.info(`Making request to ${url} (attempt ${retryCount + 1})`);
      
      const response = await this.httpClient.request<T>({
        url,
        ...options,
      });

      this.logger.info(`Request successful: ${response.status}`);
      return response;
    } catch (error) {
      this.logger.error(`Request failed: ${error.message}`);
      
      if (retryCount < this.maxRetries) {
        this.logger.info(`Retrying in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.makeRequest<T>(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Convenience method for GET requests
   */
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'POST', data });
  }

  /**
   * Convenience method for PUT requests
   */
  protected async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'PUT', data });
  }

  /**
   * Convenience method for DELETE requests
   */
  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * Delay utility for retry mechanism
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate post content
   */
  protected validatePost(post: SocialPost): void {
    if (!post.content || post.content.trim().length === 0) {
      throw new Error('Post content cannot be empty');
    }

    if (post.content.length > 5000) {
      throw new Error('Post content exceeds maximum length');
    }

    if (post.media && post.media.length > 10) {
      throw new Error('Too many media files (maximum 10)');
    }
  }

  /**
   * Format hashtags
   */
  protected formatHashtags(hashtags?: string[]): string {
    if (!hashtags || hashtags.length === 0) {
      return '';
    }
    return hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
  }

  /**
   * Upload media files
   */
  protected async uploadMedia(mediaUrls: string[]): Promise<string[]> {
    const uploadedIds: string[] = [];
    
    for (const mediaUrl of mediaUrls) {
      try {
        this.logger.info(`Uploading media: ${mediaUrl}`);
        // This is a placeholder - each platform will implement its own upload logic
        const mediaId = await this.uploadSingleMedia(mediaUrl);
        uploadedIds.push(mediaId);
      } catch (error) {
        this.logger.error(`Failed to upload media ${mediaUrl}: ${error.message}`);
        throw error;
      }
    }
    
    return uploadedIds;
  }

  /**
   * Abstract method for uploading single media file
   */
  protected abstract uploadSingleMedia(mediaUrl: string): Promise<string>;

  /**
   * Handle rate limiting
   */
  protected async handleRateLimit(retryAfter?: number): Promise<void> {
    const delay = retryAfter || 60 * 1000; // Default 1 minute
    this.logger.warn(`Rate limited. Waiting ${delay}ms before retry.`);
    await this.delay(delay);
  }

  /**
   * Log success
   */
  protected logSuccess(response: SocialResponse): void {
    this.logger.info(`Successfully published to ${response.platform}: ${response.postId}`);
    this.emit('publish:success', response);
  }

  /**
   * Log error
   */
  protected logError(error: Error, platform: string): void {
    this.logger.error(`Failed to publish to ${platform}: ${error.message}`);
    this.emit('publish:error', { error, platform });
  }
} 