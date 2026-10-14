import React from 'react';
import { HubCardId } from '@shared/types';
import { ChevronUp, ChevronDown, EyeOff, ExternalLink } from 'lucide-react';
import { IconButton } from '../ui';

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
    <div className="hub-card relative group" role="region" aria-label={title}>
      {/* Card Header */}
      <div className="hub-card-header">
        <div className="hub-card-title-group">
          <div className="text-accent shrink-0 flex items-center">{icon}</div>
          <h3 className="hub-card-title" title={title}>{title}</h3>
          {badge}
        </div>

        {/* Card Controls & Link */}
        <div className="hub-card-controls">
          {actionText && onAction && (
            <button
              type="button"
              className="text-3xs text-secondary hover:text-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-hover transition-colors font-medium"
              onClick={onAction}
            >
              <span>{actionText}</span>
              <ExternalLink size={10} />
            </button>
          )}

          {/* Reordering & Visibility Controls */}
          {(onMoveUp || onMoveDown || onHide) && (
            <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity ml-1 pl-1 border-l border-subtle">
              {onMoveUp && (
                <IconButton
                  icon={<ChevronUp size={12} />}
                  aria-label="Move card up"
                  tooltip="Move card up"
                  variant="ghost"
                  size="xs"
                  disabled={isFirst}
                  onClick={onMoveUp}
                />
              )}
              {onMoveDown && (
                <IconButton
                  icon={<ChevronDown size={12} />}
                  aria-label="Move card down"
                  tooltip="Move card down"
                  variant="ghost"
                  size="xs"
                  disabled={isLast}
                  onClick={onMoveDown}
                />
              )}
              {onHide && (
                <IconButton
                  icon={<EyeOff size={12} />}
                  aria-label="Hide card"
                  tooltip="Hide this card"
                  variant="ghost"
                  size="xs"
                  onClick={onHide}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="hub-card-body">{children}</div>
    </div>
  );
};
