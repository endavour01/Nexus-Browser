import React from 'react';
import './badge.css';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...rest
}) => {
  const classNames = [
    'nexus-badge-core',
    `nexus-badge-core--${variant}`,
    `nexus-badge-core--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...rest}>
      {dot && <span className="nexus-badge-core__dot" aria-hidden="true" />}
      {leftIcon && <span className="nexus-badge-core__icon" aria-hidden="true">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="nexus-badge-core__icon" aria-hidden="true">{rightIcon}</span>}
    </span>
  );
};
