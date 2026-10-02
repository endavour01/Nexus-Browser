import React, { useState } from 'react';
import { ConnectApp } from '@shared/types';
import {
  ExternalLink,
  Pin,
  Star,
  Plus,
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
        return <MessageCircle size={size} className="text-indigo-400" />;
      case 'Send':
        return <Send size={size} className="text-sky-400" />;
      case 'MessageSquare':
        return <MessageSquare size={size} className="text-emerald-400" />;
      case 'Flame':
        return <Flame size={size} className="text-orange-400" />;
      case 'Video':
        return <Video size={size} className="text-rose-400" />;
      case 'Hash':
        return <Hash size={size} className="text-amber-400" />;
      case 'Users':
        return <Users size={size} className="text-blue-400" />;
      case 'Phone':
        return <Phone size={size} className="text-cyan-400" />;
      case 'Code2':
        return <Code2 size={size} className="text-purple-400" />;
      case 'Layout':
        return <Layout size={size} className="text-pink-400" />;
      case 'FileText':
        return <FileText size={size} className="text-emerald-400" />;
      case 'File':
        return <File size={size} className="text-blue-400" />;
      default:
        return <Globe size={size} className="text-accent" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'chill':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'work':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/25';
      case 'create':
      case 'productivity':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/25';
      default:
        return 'text-accent bg-accent/10 border-accent/25';
    }
  };

  return (
    <div
      className="connect-app-card group relative p-4 rounded-xl border border-subtle bg-surface/60 hover:bg-surface/90 hover:border-accent/40 transition-all flex flex-col justify-between space-y-3.5 shadow-sm"
      role="article"
      aria-label={`${app.name} (${app.category})`}
    >
      {/* Top Header: Icon, Title, Category Badge, Favorite Star */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-surface-hover/80 border border-subtle/80 flex items-center justify-center shrink-0">
              {renderIcon(app.icon)}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-primary truncate tracking-tight flex items-center gap-1.5">
                <span>{app.name}</span>
                {app.isCustom && (
                  <span className="text-3xs font-normal text-muted bg-surface px-1 py-0.2 rounded border border-subtle/50">
                    Custom
                  </span>
                )}
              </h3>
              <span
                className={`inline-block text-3xs uppercase font-mono font-semibold px-1.5 py-0.2 rounded border mt-0.5 ${getCategoryBadgeClass(
                  app.category
                )}`}
              >
                {app.category}
              </span>
            </div>
          </div>

          {/* Star & Actions Menu */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className={`p-1 rounded hover:bg-surface-hover transition-colors ${
                app.isFavorite ? 'text-amber-400' : 'text-muted hover:text-secondary'
              }`}
              onClick={() => onToggleFavorite(app)}
              title={app.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={app.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={13} fill={app.isFavorite ? 'currentColor' : 'none'} />
            </button>

            <div className="relative">
              <button
                type="button"
                className="p-1 rounded text-muted hover:text-secondary hover:bg-surface-hover transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                title="More actions"
                aria-label="More actions"
              >
                <MoreVertical size={13} />
              </button>

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

        {/* Description or URL hint */}
        <p className="text-2xs text-secondary leading-relaxed mt-2.5 line-clamp-2">
          {app.description || app.url}
        </p>
      </div>

      {/* Footer: Notification Status & Actions */}
      <div className="space-y-2.5 pt-2 border-t border-subtle/50">
        {/* Honest Notification Indicator (Never fabricated) */}
        <div className="flex items-center justify-between text-3xs text-muted">
          <span className="flex items-center gap-1">
            <BellOff size={10} />
            <span>Notifications unavailable</span>
          </span>
          <span className="font-mono text-muted/60 truncate max-w-[120px]">
            {new URL(app.url).hostname}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="nexus-btn nexus-btn-primary nexus-btn-sm flex-1 font-semibold flex items-center justify-center gap-1.5"
            onClick={() => onOpen(app, false)}
            title={`Open ${app.name} in a tab`}
          >
            <ExternalLink size={12} />
            <span>Open</span>
          </button>

          <button
            type="button"
            className="nexus-btn nexus-btn-secondary nexus-btn-sm px-2.5 flex items-center justify-center gap-1"
            onClick={() => onOpen(app, true)}
            title={`Open ${app.name} as a pinned app tab`}
          >
            <Pin size={11} />
            <span>Pin</span>
          </button>

          <button
            type="button"
            className="nexus-btn nexus-btn-secondary nexus-btn-sm px-2.5 text-accent hover:text-accent flex items-center justify-center gap-1"
            onClick={() => onAddTodo(app)}
            title={`Add task for ${app.name}`}
          >
            <CheckSquare size={11} />
            <span>Todo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
