import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';
import './panel-header.css';

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  onClose?: () => void;
  closeTooltip?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon,
  description,
  actions,
  onClose,
  closeTooltip = 'Close panel',
  className = '',
  ...rest
}) => {
  return (
    <div className={`nexus-panel-header-core ${className}`.trim()} {...rest}>
      <div className="nexus-panel-header-core__left">
        {icon && (
          <span className="nexus-panel-header-core__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="nexus-panel-header-core__titles">
          <h2 className="nexus-panel-header-core__title" title={title}>
            {title}
          </h2>
          {description && (
            <p className="nexus-panel-header-core__description" title={description}>
              {description}
            </p>
          )}
        </div>
      </div>

      {(actions || onClose) && (
        <div className="nexus-panel-header-core__actions">
          {actions}
          {actions && onClose && (
            <span className="nexus-panel-header-core__divider" aria-hidden="true" />
          )}
          {onClose && (
            <IconButton
              icon={<X size={15} strokeWidth={2} />}
              aria-label={closeTooltip}
              tooltip={closeTooltip}
              variant="ghost"
              size="sm"
              onClick={onClose}
            />
          )}
        </div>
      )}
    </div>
  );
};
