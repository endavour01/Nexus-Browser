import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MusicService, TabState, NexusBrowserMode } from '@shared/types';
import { MusicServiceCard } from './MusicServiceCard';
import {
  Music,
  Headphones,
  Search,
  Star,
  Radio,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Disc,
} from 'lucide-react';
import { Button, IconButton, Badge, SearchInput } from '../ui';
import { renderMusicServiceLogo } from './MusicServiceLogos';

interface MusicWorkspaceProps {
  tabs?: TabState[];
  activeWorkspaceId?: string;
  onNavigate?: (url: string) => void;
  onOpenTab?: (url: string, pinned?: boolean) => void;
  onSwitchTab?: (tabId: string) => void;
  browserMode?: NexusBrowserMode;
}

export const MusicWorkspace: React.FC<MusicWorkspaceProps> = ({
  tabs = [],
  activeWorkspaceId,
  onNavigate,
  onOpenTab,
  onSwitchTab,
  browserMode = 'default',
}) => {
  const api = window.nexusAPI;

  const [services, setServices] = useState<MusicService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'streaming' | 'connected'>('all');

  const loadServices = useCallback(async () => {
    if (!api?.getMusicServices) return;
    try {
      setLoading(true);
      const list = await api.getMusicServices();
      setServices(list);
    } catch (err) {
      console.error('Failed to load music services:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadServices();

    if (api?.onMusicUpdated) {
      const unsub = api.onMusicUpdated((data) => {
        if (data.services) {
          setServices(data.services);
        }
      });
      return unsub;
    }
    return undefined;
  }, [api, loadServices]);

  /**
   * Helper to check if a service is currently open in any browser tab
   */
  const findOpenTabForService = useCallback(
    (service: MusicService): TabState | undefined => {
      try {
        const serviceUrl = new URL(service.url);
        const serviceHost = serviceUrl.hostname.toLowerCase();
        return tabs.find((t) => {
          if (!t.url) return false;
          try {
            const tabUrl = new URL(t.url);
            return (
              tabUrl.hostname.toLowerCase() === serviceHost ||
              tabUrl.hostname.toLowerCase().endsWith(`.${serviceHost}`)
            );
          } catch {
            return t.url.toLowerCase().includes(serviceHost);
          }
        });
      } catch {
        return undefined;
      }
    },
    [tabs]
  );

  /**
   * Deduplicated open handler:
   * If the service is already open in a tab, switch to it; otherwise open it in a tab.
   */
  const handleOpenService = useCallback(
    async (service: MusicService, pinned = false) => {
      const existingTab = findOpenTabForService(service);
      if (existingTab) {
        if (onSwitchTab) {
          onSwitchTab(existingTab.id);
        } else if (api?.switchTab) {
          await api.switchTab(existingTab.id);
        }
        return;
      }

      if (onOpenTab) {
        onOpenTab(service.url, pinned);
      } else if (api?.createTab) {
        const tabId = await api.createTab(service.url, activeWorkspaceId, false);
        if (pinned && tabId && api?.pinTab) {
          await api.pinTab(tabId);
        }
      }

      if (api?.setMusicConnectionState && service.connectionState === 'available') {
        api.setMusicConnectionState(service.id, 'connected', 'In-Tab Session Active');
      }
    },
    [api, activeWorkspaceId, findOpenTabForService, onOpenTab, onSwitchTab]
  );

  const handleSwitchToTab = useCallback(
    async (service: MusicService) => {
      const existingTab = findOpenTabForService(service);
      if (existingTab) {
        if (onSwitchTab) {
          onSwitchTab(existingTab.id);
        } else if (api?.switchTab) {
          await api.switchTab(existingTab.id);
        }
      }
    },
    [api, findOpenTabForService, onSwitchTab]
  );

  const handleToggleFavorite = useCallback(
    async (service: MusicService) => {
      if (api?.toggleMusicFavorite) {
        await api.toggleMusicFavorite(service.id);
      }
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isFavorite: !s.isFavorite } : s))
      );
    },
    [api]
  );

  const handleDisconnect = useCallback(
    async (service: MusicService) => {
      if (api?.disconnectMusicService) {
        await api.disconnectMusicService(service.id);
      }
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id
            ? { ...s, connectionState: 'not_connected', statusText: 'Disconnected' }
            : s
        )
      );
    },
    [api]
  );

  // Collect active / open services
  const activeOpenServices = useMemo(() => {
    return services.filter((s) => findOpenTabForService(s) !== undefined);
  }, [services, findOpenTabForService]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesCat = s.category.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // 2. Tab filter
      if (activeFilter === 'favorites' && !s.isFavorite) return false;
      if (activeFilter === 'streaming' && s.category !== 'streaming') return false;
      if (activeFilter === 'connected') {
        const isOpen = findOpenTabForService(s) !== undefined;
        const isConn = s.connectionState === 'connected';
        if (!isOpen && !isConn) return false;
      }

      return true;
    });
  }, [services, searchQuery, activeFilter, findOpenTabForService]);

  return (
    <div className="nexus-music-workspace select-none">
      <div className="music-workspace-inner">
        {/* ================================================================= */}
        {/* 1. Header Banner & Equalizer Motif */}
        {/* ================================================================= */}
        <div className="music-header-banner">
          <div className="music-header-content">
            <div className="music-header-title-row">
              <div className="music-header-icon-box">
                <Music size={22} className="text-accent" />
              </div>
              <div className="music-header-titles">
                <h1 className="music-title">NEXUS Music</h1>
                <p className="music-subtitle">Your music, all in one place.</p>
              </div>

              {/* Futuristic Equalizer Bars */}
              <div className="music-equalizer-bars" aria-hidden="true">
                <span className="eq-bar eq-bar-1" />
                <span className="eq-bar eq-bar-2" />
                <span className="eq-bar eq-bar-3" />
                <span className="eq-bar eq-bar-4" />
                <span className="eq-bar eq-bar-5" />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="music-metrics-row">
              <div className="music-metric-chip">
                <span className="metric-dot available" />
                <span>{services.length} Supported Platforms</span>
              </div>
              {activeOpenServices.length > 0 && (
                <div className="music-metric-chip highlight">
                  <span className="metric-dot active animate-pulse" />
                  <span>{activeOpenServices.length} Active in Browser</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. Active Web Player Strip (if any tab is alive) */}
        {/* ================================================================= */}
        {activeOpenServices.length > 0 && (
          <div className="music-active-strip">
            <div className="music-active-strip-header">
              <div className="flex items-center gap-2">
                <Headphones size={15} className="text-accent" />
                <span className="text-xs font-semibold text-primary">Active Music Sessions</span>
              </div>
              <span className="text-3xs text-secondary">
                Click any service to return to its active tab
              </span>
            </div>

            <div className="music-active-pills-row">
              {activeOpenServices.map((service) => {
                const tab = findOpenTabForService(service);
                return (
                  <button
                    key={service.id}
                    type="button"
                    className="music-active-pill group"
                    onClick={() => tab && handleSwitchToTab(service)}
                    title={`Switch to open tab for ${service.name}`}
                  >
                    <div className="shrink-0">{renderMusicServiceLogo(service.id, 18)}</div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs font-semibold text-primary truncate">
                        {service.name}
                      </span>
                      <span className="text-3xs text-emerald-400 font-medium">In-Tab Active</span>
                    </div>
                    <ArrowRight
                      size={13}
                      className="text-secondary group-hover:text-primary transition-transform group-hover:translate-x-0.5 ml-1"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. Filter Controls & Search */}
        {/* ================================================================= */}
        <div className="music-toolbar">
          <div className="music-filter-tabs">
            <button
              type="button"
              className={`music-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Platforms ({services.length})
            </button>
            <button
              type="button"
              className={`music-filter-tab ${activeFilter === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveFilter('favorites')}
            >
              <Star size={12} className={activeFilter === 'favorites' ? 'fill-current' : ''} />
              Favorites ({services.filter((s) => s.isFavorite).length})
            </button>
            <button
              type="button"
              className={`music-filter-tab ${activeFilter === 'streaming' ? 'active' : ''}`}
              onClick={() => setActiveFilter('streaming')}
            >
              Streaming ({services.filter((s) => s.category === 'streaming').length})
            </button>
            <button
              type="button"
              className={`music-filter-tab ${activeFilter === 'connected' ? 'active' : ''}`}
              onClick={() => setActiveFilter('connected')}
            >
              Connected ({activeOpenServices.length})
            </button>
          </div>

          <div className="music-search-box">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search music platforms..."
              className="w-64"
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. Music Service Cards Grid */}
        {/* ================================================================= */}
        {loading ? (
          <div className="music-loading-state">
            <div className="music-spinner" />
            <span className="text-xs text-secondary">Loading music platforms...</span>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="connect-apps-grid music-grid">
            {filteredServices.map((service) => (
              <MusicServiceCard
                key={service.id}
                service={service}
                isOpenInTab={findOpenTabForService(service) !== undefined}
                onOpen={handleOpenService}
                onSwitchToTab={handleSwitchToTab}
                onToggleFavorite={handleToggleFavorite}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        ) : (
          <div className="music-empty-state">
            <Disc size={36} className="text-secondary/40 mb-2" />
            <div className="text-sm font-semibold text-primary">No music services found</div>
            <p className="text-xs text-secondary max-w-sm text-center mt-1">
              {searchQuery
                ? `No music platforms matching "${searchQuery}". Try a different search term or clear the filter.`
                : 'No music services available in this category.'}
            </p>
            {searchQuery && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
