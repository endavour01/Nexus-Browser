import React, { forwardRef } from 'react';
import './card.css';

export type CardVariant = 'default' | 'elevated' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const classNames = [
      'nexus-card-core',
      `nexus-card-core--${variant}`,
      `nexus-card-core--p-${padding}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...rest}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children, ...rest }) => (
  <div className={`nexus-card-core__header ${className}`.trim()} {...rest}>
    {children}
  </div>
);

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  children?: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ as: Component = 'h3', className = '', children, ...rest }) => (
  <Component className={`nexus-card-core__title ${className}`.trim()} {...rest}>
    {children}
  </Component>
);

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ className = '', children, ...rest }) => (
  <p className={`nexus-card-core__description ${className}`.trim()} {...rest}>
    {children}
  </p>
);

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ className = '', children, ...rest }) => (
  <div className={`nexus-card-core__body ${className}`.trim()} {...rest}>
    {children}
  </div>
);

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className = '', children, ...rest }) => (
  <div className={`nexus-card-core__footer ${className}`.trim()} {...rest}>
    {children}
  </div>
);
