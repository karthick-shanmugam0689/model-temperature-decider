/**
 * useProviderStatus Hook
 * 
 * Manages provider availability detection and caching.
 */

import { useState, useEffect, useCallback } from 'react';
import { getProvidersWithStatus } from '../providers';
import type { ProviderWithStatus } from '../providers/types';

/**
 * Return type for the useProviderStatus hook
 */
export interface UseProviderStatusResult {
  /** All providers with their availability status */
  providers: ProviderWithStatus[];
  /** Whether the status check is in progress */
  loading: boolean;
  /** Any error that occurred during status check */
  error: Error | null;
  /** Manually refresh provider status */
  refresh: () => Promise<void>;
}

/**
 * Hook to track provider availability
 * 
 * @returns Provider status information and refresh function
 */
export function useProviderStatus(): UseProviderStatusResult {
  const [providers, setProviders] = useState<ProviderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await getProvidersWithStatus();
      setProviders(status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check provider status'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { providers, loading, error, refresh };
}

export default useProviderStatus;
