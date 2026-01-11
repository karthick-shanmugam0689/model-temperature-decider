/**
 * OpenAI Provider Implementation
 */

import OpenAI from 'openai';
import type { LLMProvider, LogprobsRequest, LogprobsResponse } from '../types';
import { ProviderError } from '../types';
import { DEFAULT_TOP_K } from '../../utils/constants';
import { logprobToProb, sortByProbability } from '../../utils/probability';
import { SYSTEM_PROMPT, getUserPrompt } from '../prompts';

import type { ModelConfig } from '../types';

/**
 * OpenAI model configuration
 */
const OPENAI_MODELS: ModelConfig[] = [
  { id: 'gpt-5.2', name: 'GPT-5.2' },
  { id: 'gpt-4o', name: 'GPT-4o' },
];

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly models = OPENAI_MODELS;

  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new ProviderError(
          'OpenAI API key not configured. Set OPENAI_API_KEY in your .env file.',
          'API_KEY_MISSING',
          this.id,
          false
        );
      }
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      });
    }
    return this.client;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      return !!apiKey && apiKey.length > 0;
    } catch {
      return false;
    }
  }

  async getLogprobs(request: LogprobsRequest): Promise<LogprobsResponse> {
    const startTime = performance.now();
    const { prompt, model, temperature, topK = DEFAULT_TOP_K, signal } = request;

    const modelConfig = this.models.find((m) => m.id === model);
    if (!modelConfig) {
      throw new ProviderError(
        `Model '${model}' not found in OpenAI provider`,
        'MODEL_NOT_FOUND',
        this.id,
        false
      );
    }

    try {
      const client = this.getClient();
      console.log('OpenAI topK temperature', topK, temperature);
      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: getUserPrompt(prompt) },
          ],
          max_completion_tokens: 10,
          temperature,
          logprobs: true,
          top_logprobs: topK,
        },
        { signal }
      );

      console.log('OpenAI response', response);

      const latencyMs = Math.round(performance.now() - startTime);
      const choice = response.choices[0];
      
      if (!choice?.logprobs?.content?.[0]?.top_logprobs) {
        throw new ProviderError(
          'No logprobs in response. The model may not support logprobs.',
          'INVALID_RESPONSE',
          this.id,
          false
        );
      }
      
      const selectedToken = choice.message.content || '';
      const topLogprobs = choice.logprobs.content[0].top_logprobs;

      if (topLogprobs.length !== 0 && topLogprobs[0] !== undefined) {
        topLogprobs[0].token = selectedToken;
      }

      console.log('OpenAI topLogprobs', topLogprobs);
      console.log('OpenAI selectedToken', selectedToken);
      
      const rawTokens = topLogprobs.map((item) => ({
        token: item.token,
        logprob: item.logprob,
        probability: logprobToProb(item.logprob),
      }));

      const sorted = sortByProbability(rawTokens);

      return {
        tokens: sorted,
        model,
        latencyMs,
        selectedToken,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;

      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          const retryAfter = error.headers?.['retry-after'];
          throw new ProviderError(
            'Rate limited by OpenAI. Please wait before trying again.',
            'RATE_LIMITED',
            this.id,
            true,
            retryAfter ? parseInt(retryAfter) * 1000 : 60000
          );
        }
        if (error.status === 401) {
          throw new ProviderError(
            'Invalid OpenAI API key. Please check your OPENAI_API_KEY.',
            'API_KEY_MISSING',
            this.id,
            false
          );
        }
        throw new ProviderError(
          `OpenAI API error: ${error.message}`,
          'UNKNOWN',
          this.id,
          error.status >= 500
        );
      }

      if (error instanceof Error && error.name === 'AbortError') throw error;

      throw new ProviderError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        this.id,
        true
      );
    }
  }
}
