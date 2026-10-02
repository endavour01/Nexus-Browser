import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input, InputProps } from '../Input/Input';
import './search-input.css';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon'> {
  onClear?: () => void;
  shortcut?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      shortcut,
      placeholder = 'Search...',
      size = 'md',
      ...rest
    },
    ref
  ) => {
    const hasValue = Boolean(value && String(value).length > 0);

    const iconSizeMap = {
      sm: 13,
      md: 15,
      lg: 17,
    };

    const searchIcon = (
      <Search size={iconSizeMap[size]} strokeWidth={2} />
    );

    const rightElements = (
      <>
        {hasValue && onClear && (
          <button
            type="button"
            className="nexus-search-input__clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        )}
        {shortcut && !hasValue && (
          <kbd className="nexus-search-input__shortcut" aria-hidden="true">
            {shortcut}
          </kbd>
        )}
      </>
    );

    return (
      <Input
        ref={ref}
        type="search"
        size={size}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        leftIcon={searchIcon}
        rightIcon={hasValue || shortcut ? rightElements : undefined}
        {...rest}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
