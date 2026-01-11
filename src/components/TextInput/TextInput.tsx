/**
 * TextInput Component
 * 
 * Textarea for entering prompt text with character count and validation.
 */

import React, { useCallback } from 'react';
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from '../../utils/constants';
import type { TextInputProps } from './types';

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter your prompt text here...',
}) => {
  const charCount = value.length;
  const isOverLimit = charCount > MAX_PROMPT_LENGTH;
  const isTooShort = charCount < MIN_PROMPT_LENGTH && charCount > 0;
  const isValid = charCount >= MIN_PROMPT_LENGTH && charCount <= MAX_PROMPT_LENGTH;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent submission on Enter without modifier keys
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    },
    []
  );

  return (
    <div className="text-input-container">
      <label htmlFor="prompt-input" className="text-input-label">
        Prompt
      </label>
      <div className={`text-input-wrapper ${isOverLimit ? 'error' : ''}`}>
        <textarea
          id="prompt-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="text-input"
          rows={4}
          spellCheck={false}
          autoComplete="off"
        />
        <div className="text-input-footer">
          <span className="input-hint">
            {isTooShort && 'Enter at least 1 character'}
            {isOverLimit && 'Text is too long'}
            {isValid && value.length > 0 && 'Ready to analyze'}
          </span>
          <span
            className={`char-count ${
              isOverLimit ? 'error' : charCount > MAX_PROMPT_LENGTH * 0.9 ? 'warning' : ''
            }`}
          >
            {charCount.toLocaleString()} / {MAX_PROMPT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TextInput;
