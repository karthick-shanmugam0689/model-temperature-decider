/**
 * TemperatureSlider Component
 * 
 * Minimal slider for adjusting temperature with visual feedback.
 */

import React, { useCallback, useMemo } from 'react';
import { getTemperatureColor } from '../../utils/probability';
import type { TemperatureSliderProps, TemperatureLabel } from './types';

export const TemperatureSlider: React.FC<TemperatureSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const temperatureColor = useMemo(() => getTemperatureColor(value), [value]);

  const temperatureLabel: TemperatureLabel = useMemo(() => {
    if (value < 0.2) return 'Very Precise';
    if (value < 0.4) return 'Precise';
    if (value < 0.6) return 'Balanced';
    if (value < 0.8) return 'Creative';
    return 'Very Creative';
  }, [value]);

  // Calculate gradient position for track fill
  const fillPercentage = value * 100;

  return (
    <div className="temperature-slider">
      <div className="slider-header">
        <label htmlFor="temperature-slider" className="slider-label">
          Temperature
        </label>
        <div className="slider-value-container">
          <span
            className="slider-value"
            style={{ color: temperatureColor }}
          >
            {value.toFixed(2)}
          </span>
          <span className="slider-separator">—</span>
          <span className="slider-description">{temperatureLabel}</span>
        </div>
      </div>

      <div className="slider-track-container">
        <input
          id="temperature-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className="slider-input"
          style={{
            background: `linear-gradient(to right, 
              ${getTemperatureColor(0)} 0%, 
              ${temperatureColor} ${fillPercentage}%, 
              var(--color-surface-elevated) ${fillPercentage}%, 
              var(--color-surface-elevated) 100%)`,
          }}
        />
      </div>

      <div className="slider-labels">
        <span className="slider-label-left">Precise</span>
        <span className="slider-label-right">Creative</span>
      </div>
    </div>
  );
};

export default TemperatureSlider;
