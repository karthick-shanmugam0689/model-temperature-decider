/**
 * Prompt templates and utilities for LLM providers
 */

/**
 * System instruction for word-level predictions
 */
export const SYSTEM_PROMPT = 
  'You are a text completion assistant helping to find the list of next probable logical and grammatical and complete words or fullstop based on the temperature setting. IMPORTANT: Output ONLY the next grammatical and logical word that naturally continues the text, but not the next letter or spaces or quotes or incomplete words.';

/**
 * Generate the user prompt for text completion
 */
export function getUserPrompt(text: string): string {
  return `Complete this text with the next word: "${text}"`;
}

/**
 * Generate a combined prompt (for providers without system message support)
 */
export function getCombinedPrompt(text: string): string {
  return `${SYSTEM_PROMPT}\n\n${getUserPrompt(text)}`;
}
