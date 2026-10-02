import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import './button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      disabled = false,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const classNames = [
      'nexus-btn-core',
      `nexus-btn-core--${variant}`,
      `nexus-btn-core--${size}`,
      fullWidth ? 'nexus-btn-core--full' : '',
      isLoading ? 'nexus-btn-core--loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconSizeMap: Record<ButtonSize, number> = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
    };

    return (
      <button
        ref={ref}
        type={rest.type || 'button'}
        className={classNames}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...rest}
      >
        {isLoading ? (
          <span className="nexus-btn-core__spinner" aria-hidden="true">
            <Loader2 size={iconSizeMap[size]} strokeWidth={2.2} />
          </span>
        ) : leftIcon ? (
          <span className="nexus-btn-core__icon" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}

        {children && <span className="nexus-btn-core__text">{children}</span>}

        {!isLoading && rightIcon && (
          <span className="nexus-btn-core__icon" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
