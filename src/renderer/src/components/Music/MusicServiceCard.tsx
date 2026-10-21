import React, { useState } from 'react';
import { MusicService } from '@shared/types';
import {
  Pin,
  Star,
  MoreVertical,
  LogOut,
  Radio,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button, IconButton, Badge } from '../ui';
import { renderMusicServiceLogo } from './MusicServiceLogos';

interface MusicServiceCardProps {
  service: MusicService;
  isOpenInTab?: boolean;
  onOpen: (service: MusicService, pinned?: boolean) => void;
  onSwitchToTab?: (service: MusicService) => void;
  onToggleFavorite: (service: MusicService) => void;
  onDisconnect?: (service: MusicService) => void;
}

export const MusicServiceCard: React.FC<MusicServiceCardProps> = ({
  service,
  isOpenInTab = false,
  onOpen,
  onSwitchToTab,
  onToggleFavorite,
  onDisconnect,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const domain = (() => {
    try {
      return new URL(service.url).hostname;
    } catch {
      return service.url;
    }
  })();

  const renderStatusBadge = () => {
    if (isOpenInTab) {
      return (
        <span className="music-status-badge active flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active in Tab</span>
        </span>
      );
    }

    switch (service.connectionState) {
      case 'connected':
        return (
          <span className="music-status-badge connected flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Connected</span>
          </span>
        );
      case 'connecting':
        return (
          <span className="music-status-badge connecting flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Connecting...</span>
          </span>
        );
      case 'unavailable':
        return (
          <span className="music-status-badge unavailable flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Unavailable</span>
          </span>
        );
      case 'error':
        return (
          <span className="music-status-badge error flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Error</span>
          </span>
        );
      case 'not_connected':
        return (
          <span className="music-status-badge not-connected flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-medium bg-surface text-secondary border border-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary/60" />
            <span>Sign-in Optional</span>
          </span>
        );
      case 'available':
      default:
        return (
          <span className="music-status-badge available flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/25">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Web Player Ready</span>
          </span>
        );
    }
  };

  return (
    <div
      className="connect-app-card music-app-card group relative"
      role="article"
      aria-label={`${service.name} (${service.category})`}
      style={{
        borderColor: isOpenInTab ? 'var(--nexus-accent-primary)' : undefined,
      }}
    >
      {/* 1. Header: Authentic Logo, Name, Category & Favorite Toggle */}
      <div className="connect-card-header">
        <div className="connect-card-identity">
          <div
            className="connect-card-icon-box music-logo-box shrink-0"
            style={{
              boxShadow: `0 0 14px ${service.brandColor}22`,
            }}
          >
            {renderMusicServiceLogo(service.id, 24)}
          </div>
          <div className="connect-card-title-group">
            <h3 className="connect-card-title flex items-center gap-1.5">
              <span>{service.name}</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="neutral" size="sm" className="uppercase font-mono tracking-wider text-3xs">
                {service.category}
              </Badge>
              {service.supportsWebPlayer && (
                <span className="text-3xs text-secondary flex items-center gap-0.5 font-medium">
                  <ShieldCheck size={10} className="text-emerald-400" />
                  <span>Web Player</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Favorite Star & Context Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            variant="ghost"
            size="xs"
            className={service.isFavorite ? 'text-amber-400' : 'text-secondary hover:text-primary'}
            onClick={() => onToggleFavorite(service)}
            icon={<Star size={13} fill={service.isFavorite ? 'currentColor' : 'none'} />}
            aria-label={service.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={service.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          />

          <div className="relative">
            <IconButton
              variant="ghost"
              size="xs"
              onClick={() => setMenuOpen(!menuOpen)}
              icon={<MoreVertical size={13} />}
              aria-label="More options"
              title="More options"
            />

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 w-40 py-1 bg-elevated border border-subtle rounded-lg shadow-xl z-30 text-xs">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-secondary hover:text-primary hover:bg-surface-hover flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpen(service, true);
                    }}
                  >
                    <Pin size={12} />
                    <span>Open as Pinned Tab</span>
                  </button>
                  {service.connectionState === 'connected' && onDisconnect && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-surface-hover flex items-center gap-2"
                      onClick={() => {
                        setMenuOpen(false);
                        onDisconnect(service);
                      }}
                    >
                      <LogOut size={12} />
                      <span>Disconnect Service</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Description */}
      <p className="connect-card-desc min-h-[34px]">
        {service.description}
      </p>

      {/* 3. Metadata: Honest Status Badge & Domain */}
      <div className="connect-card-meta-row flex items-center justify-between gap-2 mt-auto">
        {renderStatusBadge()}
        <span className="font-mono text-3xs text-secondary/70 truncate max-w-[130px]" title={domain}>
          {domain}
        </span>
      </div>

      {/* 4. Actions: Primary Open/Switch, Pin Tab */}
      <div className="connect-card-actions-row flex items-center gap-2 mt-2">
        {isOpenInTab && onSwitchToTab ? (
          <Button
            variant="primary"
            size="sm"
            className="flex-1 font-semibold"
            leftIcon={<ArrowRight size={13} />}
            onClick={() => onSwitchToTab(service)}
            title={`Switch to open tab for ${service.name}`}
          >
            Switch to Tab
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="flex-1 font-semibold"
            onClick={() => onOpen(service, false)}
            title={`Open ${service.name} inside NEXUS Browser`}
          >
            Open
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pin size={11} />}
          onClick={() => onOpen(service, true)}
          title={`Open ${service.name} as a pinned music tab`}
        >
          Pin
        </Button>
      </div>
    </div>
  );
};
