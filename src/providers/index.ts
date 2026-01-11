/**
 * Provider exports for Temperature Decider
 */

import { registry } from './providerRegistry';
import type { LLMProvider, ProviderWithStatus } from './types';

// Re-export types
export * from './types';

// Re-export prompts
export { SYSTEM_PROMPT, getUserPrompt, getCombinedPrompt } from './prompts';

// Re-export providers
export { OpenAIProvider } from './openai/provider';
export { GeminiProvider } from './gemini/provider';
export { OllamaProvider } from './ollama/provider';

/**
 * Get a provider by ID
 */
export function getProvider(id: string): LLMProvider {
  const provider = registry.get(id);
  if (!provider) {
    throw new Error(`Provider '${id}' not found`);
  }
  return provider;
}

/**
 * Get all registered providers
 */
export function getAllProviders(): LLMProvider[] {
  return registry.getAll();
}

/**
 * Get all providers with availability status
 */
export function getProvidersWithStatus(): Promise<ProviderWithStatus[]> {
  return registry.getWithStatus();
}

/**
 * Get only available providers
 */
export function getAvailableProviders(): Promise<LLMProvider[]> {
  return registry.getAvailable();
}
