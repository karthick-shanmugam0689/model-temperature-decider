/**
 * Type definitions for ModelSelector component
 */

import type { ProviderWithStatus, ModelConfig } from '../../providers/types';

/**
 * Props for the ModelSelector component
 */
export interface ModelSelectorProps {
  /** List of available providers with their status */
  providers: ProviderWithStatus[];
  /** Currently selected provider ID */
  selectedProvider: string;
  /** Currently selected model ID */
  selectedModel: string;
  /** Callback when provider selection changes */
  onProviderChange: (providerId: string) => void;
  /** Callback when model selection changes */
  onModelChange: (modelId: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Whether provider status is being loaded */
  loading?: boolean;
}

// Re-export types that consumers might need
export type { ProviderWithStatus, ModelConfig };
