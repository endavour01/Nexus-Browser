import React, { forwardRef, useState } from 'react';
import './input.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      leftIcon,
      rightIcon,
      error,
      helperText,
      disabled = false,
      fullWidth = true,
      className = '',
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const containerClasses = [
      'nexus-input-container',
      `nexus-input-container--${size}`,
      isFocused ? 'nexus-input-container--focused' : '',
      error ? 'nexus-input-container--error' : '',
      disabled ? 'nexus-input-container--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`nexus-input-wrap ${fullWidth ? 'nexus-input-wrap--full' : ''}`.trim()}>
        <div className={containerClasses}>
          {leftIcon && (
            <span className="nexus-input-icon nexus-input-icon--left" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className="nexus-input-field"
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={Boolean(error)}
            {...rest}
          />

          {rightIcon && (
            <span className="nexus-input-icon nexus-input-icon--right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <span className="nexus-input-helper nexus-input-helper--error" role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span className="nexus-input-helper">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
