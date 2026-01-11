/**
 * Type definitions for ErrorBoundary component
 */

import type { ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback UI to display on error */
  fallback?: ReactNode;
}

/**
 * Internal state for the ErrorBoundary component
 */
export interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error object, if any */
  error: Error | null;
}
