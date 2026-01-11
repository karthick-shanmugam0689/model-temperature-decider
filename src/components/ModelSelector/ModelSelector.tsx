/**
 * ModelSelector Component
 * 
 * Dropdown for selecting provider and model with availability indicators.
 */

import React from 'react';
import type { ModelSelectorProps } from './types';
import type { ModelConfig } from '../../providers/types';

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  providers,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  disabled = false,
  loading = false,
}) => {
  const currentProvider = providers.find((p) => p.provider.id === selectedProvider);
  const models: ModelConfig[] = currentProvider?.provider.models ?? [];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProviderId = e.target.value;
    onProviderChange(newProviderId);
    
    // Auto-select first model of new provider
    const newProvider = providers.find((p) => p.provider.id === newProviderId);
    if (newProvider?.provider.models[0]) {
      onModelChange(newProvider.provider.models[0].id);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(e.target.value);
  };

  return (
    <div className="model-selector">
      <div className="selector-group">
        <label htmlFor="provider-select" className="selector-label">
          Provider
        </label>
        <div className="select-wrapper">
          <select
            id="provider-select"
            value={selectedProvider}
            onChange={handleProviderChange}
            disabled={disabled || loading}
            className="select-input"
          >
            {providers.map(({ provider, available, error }) => (
              <option
                key={provider.id}
                value={provider.id}
                disabled={!available}
              >
                {provider.name}
                {!available && ` (${error || 'unavailable'})`}
              </option>
            ))}
          </select>
          <span className="select-arrow">▼</span>
        </div>
        {currentProvider && (
          <span
            className={`availability-indicator ${
              currentProvider.available ? 'available' : 'unavailable'
            }`}
            title={currentProvider.available ? 'Connected' : currentProvider.error || 'Unavailable'}
          >
            {currentProvider.available ? '●' : '○'}
          </span>
        )}
      </div>

      <div className="selector-group">
        <label htmlFor="model-select" className="selector-label">
          Model
        </label>
        <div className="select-wrapper">
          <select
            id="model-select"
            value={selectedModel}
            onChange={handleModelChange}
            disabled={disabled || loading || models.length === 0}
            className="select-input"
          >
            {models.map((model) => (
              <option
                key={model.id}
                value={model.id}
              >
                {model.name}
              </option>
            ))}
          </select>
          <span className="select-arrow">▼</span>
        </div>
      </div>

      {loading && (
        <div className="selector-loading">
          <span className="loading-spinner" />
          <span>Checking providers...</span>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
