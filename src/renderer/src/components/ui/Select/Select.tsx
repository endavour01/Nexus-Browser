import React, { forwardRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './select.css';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      options,
      error,
      helperText,
      disabled = false,
      fullWidth = true,
      className = '',
      children,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const containerClasses = [
      'nexus-select-container',
      `nexus-select-container--${size}`,
      isFocused ? 'nexus-select-container--focused' : '',
      error ? 'nexus-select-container--error' : '',
      disabled ? 'nexus-select-container--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconSizeMap = {
      sm: 13,
      md: 15,
      lg: 17,
    };

    return (
      <div className={`nexus-select-wrap ${fullWidth ? 'nexus-select-wrap--full' : ''}`.trim()}>
        <div className={containerClasses}>
          <select
            ref={ref}
            disabled={disabled}
            className="nexus-select-field"
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={Boolean(error)}
            {...rest}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span className="nexus-select-icon" aria-hidden="true">
            <ChevronDown size={iconSizeMap[size]} strokeWidth={2} />
          </span>
        </div>

        {error ? (
          <span className="nexus-select-helper nexus-select-helper--error" role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span className="nexus-select-helper">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
