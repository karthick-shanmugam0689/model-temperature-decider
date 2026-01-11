/**
 * Temperature Probability Visualizer - Main App Component
 * 
 * Demonstrates how temperature affects LLM token probability distributions.
 * Temperature is sent to the provider when computing probabilities.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ModelSelector,
  TextInput,
  TemperatureSlider,
  ProbabilityChart,
  ErrorBoundary,
} from './components';
import { useProviderStatus } from './hooks';
import { getProvider, type TokenProbability, type ProviderError } from './providers';
import { DEFAULT_TEMPERATURE, MIN_PROMPT_LENGTH } from './utils/constants';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface ErrorDisplayProps {
  error: ProviderError;
  onRetry: () => void;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onDismiss }) => (
  <div className={`error-banner ${error.type}`}>
    <div className="error-banner-content">
      <span className="error-icon">
        {error.type === 'RATE_LIMITED' ? '⏳' : '⚠️'}
      </span>
      <div className="error-text">
        <strong>{error.type === 'RATE_LIMITED' ? 'Rate Limited' : 'Error'}</strong>
        <p>{error.message}</p>
      </div>
    </div>
    <div className="error-actions">
      {error.retryable && (
        <button type="button" onClick={onRetry} className="error-action-button retry">
          Retry
        </button>
      )}
      <button type="button" onClick={onDismiss} className="error-action-button dismiss">
        Dismiss
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  // Provider status
  const { providers, loading: providersLoading } = useProviderStatus();

  // Input state
  const [prompt, setPrompt] = useState('The quick brown fox');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);

  // Async state
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<ProviderError | null>(null);

  // Result state - raw logprobs from API
  const [rawLogprobs, setRawLogprobs] = useState<TokenProbability[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [computedTemperature, setComputedTemperature] = useState(DEFAULT_TEMPERATURE);

  // Refs for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if submit is allowed
  const canSubmit = prompt.length >= MIN_PROMPT_LENGTH && status !== 'loading' && !providersLoading;

  // Initialize provider/model when providers load
  useEffect(() => {
    if (providers.length > 0 && !providersLoading) {
      const availableProvider = providers.find((p) => p.available);
      if (availableProvider) {
        setSelectedProvider(availableProvider.provider.id);
        const firstModel = availableProvider.provider.models[0];
        if (firstModel) {
          setSelectedModel(firstModel.id);
        }
      }
    }
  }, [providers, providersLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch logprobs with current temperature setting
  const handleSubmit = useCallback(async () => {
    // Validate inputs
    if (prompt.length < MIN_PROMPT_LENGTH) {
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setStatus('loading');
    setError(null);

    try {
      const provider = getProvider(selectedProvider);
      const response = await provider.getLogprobs({
        prompt,
        model: selectedModel,
        temperature,
        signal: abortControllerRef.current.signal,
      });

      setRawLogprobs(response.tokens);
      setLatencyMs(response.latencyMs);
      setSelectedToken(response.selectedToken || null);
      setComputedTemperature(temperature);
      setStatus('success');
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setStatus('error');
      if (err && typeof err === 'object' && 'type' in err) {
        setError(err as ProviderError);
      } else {
        setError({
          message: err instanceof Error ? err.message : 'An unknown error occurred',
          type: 'UNKNOWN',
          provider: selectedProvider,
          retryable: true,
          name: 'ProviderError',
        } as ProviderError);
      }
    }
  }, [prompt, selectedProvider, selectedModel, temperature]);

  // Handle provider change
  const handleProviderChange = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    setError(null);
  }, []);

  // Handle model change
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    setError(null);
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    handleSubmit();
  }, [handleSubmit]);

  // Handle dismiss error
  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="title-icon">🌡️</span>
              Temperature Probability Visualizer
            </h1>
            <p className="app-subtitle">
              Explore how temperature affects LLM token prediction distributions
            </p>
          </div>
        </header>

        <main className="app-main">
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
            />
          )}

          {/* Step 1: Configure Model */}
          <section className="step-section">
            <h2 className="step-label">Step 1: Configure model</h2>
            <div className="step-content">
              <ModelSelector
                providers={providers}
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                onProviderChange={handleProviderChange}
                onModelChange={handleModelChange}
                loading={providersLoading}
              />
            </div>
          </section>

          {/* Step 2: Enter Prompt */}
          <section className="step-section">
            <h2 className="step-label">Step 2: Enter prompt</h2>
            <div className="step-content">
              <TextInput
                value={prompt}
                onChange={setPrompt}
              />
            </div>
          </section>

          {/* Step 3: Temperature Control */}
          <section className="step-section">
            <h2 className="step-label">Step 3: Set temperature</h2>
            <div className="step-content">
              <TemperatureSlider
                value={temperature}
                onChange={setTemperature}
              />
            </div>
          </section>

          {/* Step 4: Compute */}
          <section className="step-section">
            <h2 className="step-label">Step 4: Compute probabilities</h2>
            <div className="step-content compute-section">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="compute-button"
              >
                {status === 'loading' ? (
                  <>
                    <span className="loading-spinner sm" />
                    Computing...
                  </>
                ) : (
                  <>
                    <span className="compute-icon">▶</span>
                    Compute Probabilities
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Results Chart */}
          <div className="chart-section">
            <ProbabilityChart
              data={rawLogprobs}
              temperature={computedTemperature}
              loading={status === 'loading'}
              selectedToken={selectedToken}
            />
          </div>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-stats">
              {latencyMs !== null && status === 'success' && (
                <span className="stat-item">
                  <span className="stat-label">Latency:</span>
                  <span className="stat-value">{latencyMs}ms</span>
                </span>
              )}
              <span className="stat-item">
                <span className="stat-label">Model:</span>
                <span className="stat-value">{selectedModel}</span>
              </span>
              <span className="stat-item">
                <span className="stat-label">Provider:</span>
                <span className="stat-value">
                  {providers.find((p) => p.provider.id === selectedProvider)?.provider.name || selectedProvider}
                </span>
              </span>
            </div>
            <div className="footer-info">
              <span className="footer-hint">
                Lower temperature = more deterministic • Higher temperature = more creative
              </span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
