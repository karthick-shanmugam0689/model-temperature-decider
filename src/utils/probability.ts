/**
 * Probability utility functions for converting and normalizing logprobs
 */

import type { TokenProbability } from '../providers/types';

/**
 * Convert log probability to probability (0-1 range)
 * logprob is ln(p), so p = e^logprob
 */
export function logprobToProb(logprob: number): number {
  return Math.exp(logprob);
}

/**
 * Convert probability to percentage string for display
 */
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Sort tokens by probability in descending order
 */
export function sortByProbability(tokens: TokenProbability[]): TokenProbability[] {
  return [...tokens].sort((a, b) => b.probability - a.probability);
}

/**
 * Get color interpolated between cold and hot based on temperature
 */
export function getTemperatureColor(temperature: number): string {
  // Interpolate between blue (cold) and red (hot)
  const r = Math.round(59 + (239 - 59) * temperature);
  const g = Math.round(130 + (68 - 130) * temperature);
  const b = Math.round(246 + (68 - 246) * temperature);
  return `rgb(${r}, ${g}, ${b})`;
}
