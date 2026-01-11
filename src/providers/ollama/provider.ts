/**
 * Ollama Provider Implementation
 */

import type { LLMProvider, ModelConfig, LogprobsRequest, LogprobsResponse, TokenProbability } from '../types';
import { ProviderError } from '../types';
import { OLLAMA_BASE_URL, DEFAULT_TOP_K } from '../../utils/constants';
import { logprobToProb, sortByProbability } from '../../utils/probability';
import { getCombinedPrompt } from '../prompts';
import type { OllamaTagsResponse, OllamaModelInfo, OllamaGenerateResponse, OllamaCache } from './types';

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (Local)';
  
  private _models: ModelConfig[] = [];
  private baseUrl: string;
  private cache: OllamaCache | null = null;
  private readonly CACHE_TTL = 30000;

  constructor(baseUrl: string = OLLAMA_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  get models(): ModelConfig[] {
    return this._models;
  }

  private async fetchModels(): Promise<ModelConfig[]> {
    try {
      const url = this.getApiUrl('/api/tags');
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return [];

      const data: OllamaTagsResponse = await response.json();
      return data.models.map((model) => this.convertToModelConfig(model));
    } catch {
      return [];
    }
  }

  private convertToModelConfig(model: OllamaModelInfo): ModelConfig {
    const baseName = model.name.split(':')[0] ?? model.name;
    const displayName = this.formatModelName(baseName, model.details);
    return { id: model.name, name: displayName };
  }

  private formatModelName(baseName: string, details?: OllamaModelInfo['details']): string {
    const parts: string[] = [];
    const cleanName = baseName
      .split(/[-_.]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    
    parts.push(cleanName);
    if (details?.parameter_size) {
      parts.push(`(${details.parameter_size})`);
    }
    return parts.join(' ');
  }

  async isAvailable(): Promise<boolean> {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache.available;
    }

    try {
      const models = await this.fetchModels();
      const available = models.length > 0;
      this._models = models;
      this.cache = { available, models, timestamp: Date.now() };
      return available;
    } catch {
      this.cache = { available: false, models: [], timestamp: Date.now() };
      return false;
    }
  }

  async refreshModels(): Promise<ModelConfig[]> {
    const models = await this.fetchModels();
    this._models = models;
    if (this.cache) {
      this.cache.models = models;
      this.cache.timestamp = Date.now();
    }
    return models;
  }

  private getApiUrl(path: string): string {
    if (process.env.NODE_ENV === 'development') {
      return `/ollama${path}`;
    }
    return `${this.baseUrl}${path}`;
  }

  async getLogprobs(request: LogprobsRequest): Promise<LogprobsResponse> {
    const startTime = performance.now();
    const { prompt, model, temperature, topK = DEFAULT_TOP_K, signal } = request;

    const available = await this.isAvailable();
    if (!available) {
      throw new ProviderError(
        `Ollama is not running at ${this.baseUrl}. Please start Ollama first.`,
        'SERVICE_UNAVAILABLE',
        this.id,
        true
      );
    }

    const modelConfig = this._models.find((m) => m.id === model);
    if (!modelConfig) {
      throw new ProviderError(
        `Model '${model}' not found. Available models: ${this._models.map(m => m.id).join(', ')}`,
        'MODEL_NOT_FOUND',
        this.id,
        false
      );
    }

    try {
      const url = this.getApiUrl('/api/generate');
      const completionPrompt = getCombinedPrompt(prompt);
      
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: completionPrompt,
          stream: false,
          options: { temperature, num_predict: 1 },
          logprobs: true,
          top_logprobs: topK,
          raw: false,
        }),
      };
      
      if (signal) fetchOptions.signal = signal;
      
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          throw new ProviderError(
            `Model '${model}' not found. Run 'ollama pull ${model}' to download it.`,
            'MODEL_NOT_FOUND',
            this.id,
            false
          );
        }
        throw new ProviderError(
          `Ollama API error: ${errorText}`,
          'UNKNOWN',
          this.id,
          response.status >= 500
        );
      }

      const data: OllamaGenerateResponse = await response.json();
      const latencyMs = Math.round(performance.now() - startTime);
      const selectedToken = data.response || '';
      
      console.log('Ollama selectedToken', selectedToken);

      let tokens: TokenProbability[] = [];

      if (data.completion_probabilities?.[0]?.probs) {
        tokens = data.completion_probabilities[0].probs.map((p) => ({
          token: p.token,
          probability: p.prob,
          logprob: Math.log(p.prob),
        }));
      } else if (data.logprobs && data.logprobs.length > 0) {
        tokens = data.logprobs[0].top_logprobs.map((p) => ({
          token: p.token,
          probability: logprobToProb(p.logprob),
          logprob: p.logprob,
        }));
      } else {
        tokens = [{ token: data.response || '(empty)', probability: 1, logprob: 0 }];
      }

      const sorted = sortByProbability(tokens);

      return { tokens: sorted, model, latencyMs, selectedToken };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw error;

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ProviderError(
          `Cannot connect to Ollama at ${this.baseUrl}. Is it running?`,
          'NETWORK_ERROR',
          this.id,
          true
        );
      }

      throw new ProviderError(
        `Ollama error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN',
        this.id,
        true
      );
    }
  }
}
