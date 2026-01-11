/**
 * Ollama provider types
 */

import type { ModelConfig } from '../types';

/**
 * Response from Ollama /api/tags endpoint
 */
export interface OllamaTagsResponse {
  /** Array of available models installed in Ollama */
  models: OllamaModelInfo[];
}

/**
 * Model info from Ollama API
 */
export interface OllamaModelInfo {
  /** Model name including tag (e.g., 'llama2:latest') */
  name: string;
  /** Model identifier */
  model: string;
  /** ISO timestamp of last modification */
  modified_at: string;
  /** Model file size in bytes */
  size: number;
  /** SHA256 digest hash of the model */
  digest: string;
  /** Additional model metadata */
  details?: {
    /** Parent model if this is a derivative/fine-tuned model */
    parent_model?: string;
    /** Model file format (e.g., 'gguf') */
    format?: string;
    /** Model architecture family (e.g., 'llama') */
    family?: string;
    /** List of model families this belongs to */
    families?: string[];
    /** Parameter count (e.g., '7B', '13B') */
    parameter_size?: string;
    /** Quantization level (e.g., 'Q4_0', 'Q8_0') */
    quantization_level?: string;
  };
}

/**
 * Response from Ollama /api/generate endpoint
 */
export interface OllamaGenerateResponse {
  /** Model used for generation */
  model: string;
  /** Generated text response */
  response: string;
  /** Whether generation is complete */
  done: boolean;
  /** Logprobs array (format varies by Ollama version) */
  logprobs?: Array<{
    /** The generated token */
    token: string;
    /** Log probability of this token */
    logprob: number;
    /** Top alternative tokens with their log probabilities */
    top_logprobs: Array<{ 
      /** Alternative token */
      token: string; 
      /** Log probability of the alternative */
      logprob: number 
    }>;
  }>;
  /** Alternative completion probabilities format */
  completion_probabilities?: Array<{
    /** Content string */
    content: string;
    /** Array of token probabilities */
    probs: Array<{ 
      /** Token string */
      token: string; 
      /** Probability value (0-1) */
      prob: number 
    }>;
  }>;
}

/**
 * Cache entry for Ollama availability and models
 */
export interface OllamaCache {
  /** Whether Ollama is currently available/running */
  available: boolean;
  /** Cached list of available models */
  models: ModelConfig[];
  /** Unix timestamp when cache was last updated */
  timestamp: number;
}
