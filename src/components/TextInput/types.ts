/**
 * Type definitions for TextInput component
 */

/**
 * Props for the TextInput component
 */
export interface TextInputProps {
  /** Current input value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
}
