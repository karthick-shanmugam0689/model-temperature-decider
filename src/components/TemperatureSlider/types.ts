/**
 * Type definitions for TemperatureSlider component
 */

/**
 * Props for the TemperatureSlider component
 */
export interface TemperatureSliderProps {
  /** Current temperature value (0-1) */
  value: number;
  /** Callback when temperature value changes */
  onChange: (value: number) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
}

/**
 * Temperature label mapping based on value ranges
 */
export type TemperatureLabel = 
  | 'Very Precise' 
  | 'Precise' 
  | 'Balanced' 
  | 'Creative' 
  | 'Very Creative';
