/**
 * Provider Registry - manages LLM provider instances
 */

import type { LLMProvider, ProviderWithStatus } from './types';
import { OpenAIProvider } from './openai/provider';
import { GeminiProvider } from './gemini/provider';
import { OllamaProvider } from './ollama/provider';

class ProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  private initialized = false;

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): LLMProvider | undefined {
    this.ensureInitialized();
    return this.providers.get(id);
  }

  getAll(): LLMProvider[] {
    this.ensureInitialized();
    return Array.from(this.providers.values());
  }

  async getWithStatus(): Promise<ProviderWithStatus[]> {
    this.ensureInitialized();
    const providers = this.getAll();
    
    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          const available = await provider.isAvailable();
          return { provider, available };
        } catch (error) {
          return {
            provider,
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );
    
    return results;
  }

  async getAvailable(): Promise<LLMProvider[]> {
    const withStatus = await this.getWithStatus();
    return withStatus.filter((p) => p.available).map((p) => p.provider);
  }

  private ensureInitialized(): void {
    if (this.initialized) return;
    
    this.register(new OpenAIProvider());
    this.register(new GeminiProvider());
    this.register(new OllamaProvider());
    
    this.initialized = true;
  }
}

export const registry = new ProviderRegistry();
