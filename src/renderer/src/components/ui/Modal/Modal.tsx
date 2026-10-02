import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';
import './modal.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  footer,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="nexus-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={containerRef}
        className={`nexus-modal-container nexus-modal-container--${size} ${className}`.trim()}
      >
        {title && (
          <div className="nexus-modal-header">
            <h2 className="nexus-modal-title">{title}</h2>
            <IconButton
              icon={<X size={16} strokeWidth={2} />}
              aria-label="Close dialog"
              variant="ghost"
              size="sm"
              onClick={onClose}
            />
          </div>
        )}

        <div className="nexus-modal-body">{children}</div>

        {footer && <div className="nexus-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`nexus-modal-header ${className}`.trim()}>{children}</div>;

export const ModalTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h2 className={`nexus-modal-title ${className}`.trim()}>{children}</h2>;

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`nexus-modal-body ${className}`.trim()}>{children}</div>;

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`nexus-modal-footer ${className}`.trim()}>{children}</div>;
