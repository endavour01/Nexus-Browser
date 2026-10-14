import React, { useState } from 'react';
import { ConnectApp } from '@shared/types';
import {
  ExternalLink,
  Pin,
  Star,
  CheckSquare,
  Edit2,
  Trash2,
  Globe,
  MessageCircle,
  Send,
  MessageSquare,
  Flame,
  Video,
  Hash,
  Users,
  Phone,
  Code2,
  Layout,
  FileText,
  File,
  BellOff,
  MoreVertical,
} from 'lucide-react';
import { Button, IconButton, Badge } from '../ui';

interface ConnectAppCardProps {
  app: ConnectApp;
  onOpen: (app: ConnectApp, pinned?: boolean) => void;
  onAddTodo: (app: ConnectApp) => void;
  onToggleFavorite: (app: ConnectApp) => void;
  onEdit: (app: ConnectApp) => void;
  onDelete: (app: ConnectApp) => void;
}

export const ConnectAppCard: React.FC<ConnectAppCardProps> = ({
  app,
  onOpen,
  onAddTodo,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const renderIcon = (iconName?: string) => {
    const size = 18;
    switch (iconName) {
      case 'MessageCircle':
        return <MessageCircle size={size} />;
      case 'Send':
        return <Send size={size} />;
      case 'MessageSquare':
        return <MessageSquare size={size} />;
      case 'Flame':
        return <Flame size={size} />;
      case 'Video':
        return <Video size={size} />;
      case 'Hash':
        return <Hash size={size} />;
      case 'Users':
        return <Users size={size} />;
      case 'Phone':
        return <Phone size={size} />;
      case 'Code2':
        return <Code2 size={size} />;
      case 'Layout':
        return <Layout size={size} />;
      case 'FileText':
        return <FileText size={size} />;
      case 'File':
        return <File size={size} />;
      default:
        return <Globe size={size} />;
    }
  };

  const domain = (() => {
    try {
      return new URL(app.url).hostname;
    } catch {
      return app.url;
    }
  })();

  return (
    <div
      className="connect-app-card group relative"
      role="article"
      aria-label={`${app.name} (${app.category})`}
    >
      {/* 1. Header: Identity & Classification */}
      <div className="connect-card-header">
        <div className="connect-card-identity">
          <div className="connect-card-icon-box">
            {renderIcon(app.icon)}
          </div>
          <div className="connect-card-title-group">
            <h3 className="connect-card-title">
              <span>{app.name}</span>
              {app.isCustom && (
                <span className="text-3xs font-normal text-muted bg-surface px-1 py-0.2 rounded border border-subtle/50 shrink-0">
                  Custom
                </span>
              )}
            </h3>
            <Badge variant="neutral" size="sm" className="mt-0.5 uppercase font-mono tracking-wider">
              {app.category}
            </Badge>
          </div>
        </div>

        {/* Favorite Star & Actions Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            variant="ghost"
            size="xs"
            className={app.isFavorite ? 'text-amber-400' : 'text-secondary hover:text-primary'}
            onClick={() => onToggleFavorite(app)}
            icon={<Star size={13} fill={app.isFavorite ? 'currentColor' : 'none'} />}
            aria-label={app.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={app.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          />

          <div className="relative">
            <IconButton
              variant="ghost"
              size="xs"
              onClick={() => setMenuOpen(!menuOpen)}
              icon={<MoreVertical size={13} />}
              aria-label="More actions"
              title="More actions"
            />

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 w-36 py-1 bg-elevated border border-subtle rounded-lg shadow-xl z-30 text-xs">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-secondary hover:text-primary hover:bg-surface-hover flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(app);
                    }}
                  >
                    <Edit2 size={12} />
                    <span>Edit App</span>
                  </button>
                  {app.isCustom && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-surface-hover flex items-center gap-2"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(app);
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Delete App</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Description (2-line clamped, min 34px) */}
      <p className="connect-card-desc">
        {app.description || app.url}
      </p>

      {/* 3. Metadata: Honest Notification Status & Domain */}
      <div className="connect-card-meta-row">
        <span className="flex items-center gap-1">
          <BellOff size={10} />
          <span>Notifications unavailable</span>
        </span>
        <span className="font-mono text-muted/60 truncate max-w-[120px]">
          {domain}
        </span>
      </div>

      {/* 4. Actions: Primary Open, Pin, Todo */}
      <div className="connect-card-actions-row">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          leftIcon={<ExternalLink size={12} />}
          onClick={() => onOpen(app, false)}
          title={`Open ${app.name} in a tab`}
        >
          Open
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pin size={11} />}
          onClick={() => onOpen(app, true)}
          title={`Open ${app.name} as a pinned app tab`}
        >
          Pin
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<CheckSquare size={11} />}
          onClick={() => onAddTodo(app)}
          title={`Add task for ${app.name}`}
        >
          Todo
        </Button>
      </div>
    </div>
  );
};
