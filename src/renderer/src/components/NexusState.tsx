import React from 'react';
import { AlertCircle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';

type NexusStateVariant = 'empty' | 'loading' | 'error' | 'success';

interface NexusStateProps {
  variant: NexusStateVariant;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const icons: Record<NexusStateVariant, React.ReactNode> = {
  empty: <Inbox size={22} strokeWidth={1.75} aria-hidden />,
  loading: <Loader2 size={22} className="nexus-state-spin" aria-hidden />,
  error: <AlertCircle size={22} aria-hidden />,
  success: <CheckCircle2 size={22} aria-hidden />,
};

export const NexusState: React.FC<NexusStateProps> = ({
  variant,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`nexus-state nexus-state--${variant} ${className}`.trim()}
    role={variant === 'loading' ? 'status' : 'region'}
    aria-live={variant === 'loading' ? 'polite' : undefined}
  >
    <div className="nexus-state-icon">{icons[variant]}</div>
    <p className="nexus-state-title">{title}</p>
    {description ? <p className="nexus-state-desc">{description}</p> : null}
    {action ? <div className="nexus-state-action">{action}</div> : null}
  </div>
);
