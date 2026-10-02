import React, { forwardRef } from 'react';
import './icon-button.css';

export type IconButtonVariant = 'ghost' | 'secondary' | 'primary' | 'danger';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type IconButtonShape = 'square' | 'rounded' | 'circle';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  isActive?: boolean;
  tooltip?: string;
  shortcut?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      shape = 'rounded',
      isActive = false,
      tooltip,
      shortcut,
      disabled = false,
      className = '',
      title,
      ...rest
    },
    ref
  ) => {
    const classNames = [
      'nexus-icon-btn-core',
      `nexus-icon-btn-core--${variant}`,
      `nexus-icon-btn-core--${size}`,
      `nexus-icon-btn-core--${shape}`,
      isActive ? 'nexus-icon-btn-core--active active' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const computedTitle = title || tooltip ? (shortcut ? `${tooltip || title} (${shortcut})` : (tooltip || title)) : ariaLabel;

    const buttonNode = (
      <button
        ref={ref}
        type={rest.type || 'button'}
        className={classNames}
        aria-label={ariaLabel}
        aria-pressed={isActive || undefined}
        title={computedTitle}
        disabled={disabled}
        {...rest}
      >
        {icon}
      </button>
    );

    if (tooltip) {
      return (
        <span className="nexus-tooltip-wrap">
          {buttonNode}
          <span className="nexus-tooltip" role="tooltip">
            <span>{tooltip}</span>
            {shortcut && <kbd className="nexus-tooltip-kbd">{shortcut}</kbd>}
          </span>
        </span>
      );
    }

    return buttonNode;
  }
);

IconButton.displayName = 'IconButton';
