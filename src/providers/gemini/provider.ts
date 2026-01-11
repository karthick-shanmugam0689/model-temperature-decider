/**
 * Gemini Provider Implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, LogprobsRequest, LogprobsResponse, ModelConfig } from '../types';
import { ProviderError } from '../types';
import { DEFAULT_TOP_K } from '../../utils/constants';
import { logprobToProb, sortByProbability } from '../../utils/probability';
import { SYSTEM_PROMPT, getUserPrompt } from '../prompts';
import { type Content, type ExtendedCandidate } from './types';

/**
 * Gemini model configuration
 */
const GEMINI_MODELS: ModelConfig[] = [
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
];

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly models = GEMINI_MODELS;

  private client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new ProviderError(
          'Google AI API key not configured. Set GOOGLE_AI_API_KEY in your .env file.',
          'API_KEY_MISSING',
          this.id,
          false
        );
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      return !!apiKey && apiKey.length > 0;
    } catch {
      return false;
    }
  }

  async getLogprobs(request: LogprobsRequest): Promise<LogprobsResponse> {
    const startTime = performance.now();
    const { prompt, model, temperature, topK = DEFAULT_TOP_K } = request;

    const modelConfig = this.models.find((m) => m.id === model);
    if (!modelConfig) {
      throw new ProviderError(
        `Model '${model}' not found in Gemini provider`,
        'MODEL_NOT_FOUND',
        this.id,
        false
      );
    }

    try {
      const client = this.getClient();
      
      const generativeModel = client.getGenerativeModel({ 
        model,
        systemInstruction: SYSTEM_PROMPT
      });

      const contents: Content[] = [
        { role: 'user', parts: [{ text: getUserPrompt(prompt) }] }
      ];

      const result = await generativeModel.generateContent({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: 10,
          responseLogprobs: true,
          logprobs: topK,
        },
      });
      
      const latencyMs = Math.round(performance.now() - startTime);
      const response = result.response;
      const candidate = response.candidates?.[0] as ExtendedCandidate | undefined;
      const logprobsResult = candidate?.logprobsResult;
      
      const selectedToken = logprobsResult?.chosenCandidates?.[0]?.token || response.text() || '';
      
      const logprobCandidates = 
        logprobsResult?.topCandidates?.[0]?.candidates ?? 
        logprobsResult?.chosenCandidates;
      
      if (!logprobCandidates || logprobCandidates.length === 0) {
        const text = response.text();
        return {
          tokens: [{ token: text || '(empty)', probability: 1, logprob: 0 }],
          model,
          latencyMs,
          selectedToken: text || '',
        };
      }

      console.log('Gemini selectedToken', selectedToken);

      const rawTokens = logprobCandidates.map((logprobCandidate) => ({
        token: logprobCandidate.token,
        logprob: logprobCandidate.logProbability,
        probability: logprobToProb(logprobCandidate.logProbability),
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

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('API key')) {
        throw new ProviderError(
          'Invalid Google AI API key. Please check your GOOGLE_AI_API_KEY.',
          'API_KEY_MISSING',
          this.id,
          false
        );
      }

      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        throw new ProviderError(
          'Rate limited by Google AI. Please wait before trying again.',
          'RATE_LIMITED',
          this.id,
          true,
          60000
        );
      }

      if (error instanceof Error && error.name === 'AbortError') throw error;

      throw new ProviderError(
        `Gemini API error: ${errorMessage}`,
        'UNKNOWN',
        this.id,
        true
      );
    }
  }
}
