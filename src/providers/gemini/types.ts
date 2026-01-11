/**
 * Logprobs candidate from Gemini response
 */
export interface GeminiLogprobsCandidate {
  /** The token string */
  token: string;
  /** Log probability value for this token */
  logProbability: number;
}

/**
 * Logprobs result structure from Gemini response
 */
export interface GeminiLogprobsResult {
  /** The candidates that were chosen/selected by the model */
  chosenCandidates?: GeminiLogprobsCandidate[];
  /** Top alternative candidates with their probabilities */
  topCandidates?: Array<{ candidates?: GeminiLogprobsCandidate[] }>;
}

/**
 * Extended candidate type with logprobs
 */
export interface ExtendedCandidate {
  /** Logprobs result attached to this candidate */
  logprobsResult?: GeminiLogprobsResult;
}

/**
 * Content structure for Gemini API
 */
export interface Content {
  /** Role of the message sender (e.g., 'user', 'model') */
  role: string;
  /** Array of content parts containing text */
  parts: Array<{ text: string }>;
}
