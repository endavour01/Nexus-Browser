import React from 'react';
import { HubCardId } from '@shared/types';
import { ChevronUp, ChevronDown, EyeOff, ExternalLink } from 'lucide-react';

interface HubCardProps {
  id: HubCardId;
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
}

export const HubCard: React.FC<HubCardProps> = ({
  title,
  icon,
  badge,
  actionText,
  onAction,
  onMoveUp,
  onMoveDown,
  onHide,
  isFirst,
  isLast,
  children,
}) => {
  return (
    <div className="markets-card hub-card flex flex-col justify-between p-4.5 space-y-3 relative group">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-subtle pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-accent shrink-0">{icon}</div>
          <h3 className="font-semibold text-xs text-primary truncate tracking-tight">{title}</h3>
          {badge}
        </div>

        {/* Card Controls & Link */}
        <div className="flex items-center gap-1">
          {actionText && onAction && (
            <button
              type="button"
              className="text-3xs text-secondary hover:text-primary flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-surface transition-colors"
              onClick={onAction}
            >
              <span>{actionText}</span>
              <ExternalLink size={10} />
            </button>
          )}

          {/* Reordering & Visibility Controls (visible on hover or focus) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 pl-1 border-l border-subtle">
            {onMoveUp && (
              <button
                type="button"
                disabled={isFirst}
                className="nexus-icon-btn p-1 text-secondary hover:text-primary disabled:opacity-20"
                onClick={onMoveUp}
                title="Move card up"
                aria-label="Move card up"
              >
                <ChevronUp size={12} />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                disabled={isLast}
                className="nexus-icon-btn p-1 text-secondary hover:text-primary disabled:opacity-20"
                onClick={onMoveDown}
                title="Move card down"
                aria-label="Move card down"
              >
                <ChevronDown size={12} />
              </button>
            )}
            {onHide && (
              <button
                type="button"
                className="nexus-icon-btn p-1 text-secondary hover:text-amber-400"
                onClick={onHide}
                title="Hide this card"
                aria-label="Hide card"
              >
                <EyeOff size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex-1 min-h-[90px]">{children}</div>
    </div>
  );
};
