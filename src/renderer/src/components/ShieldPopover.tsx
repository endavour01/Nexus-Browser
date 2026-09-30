import React, { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Pause,
  Play,
  ExternalLink,
  X,
  AlertTriangle,
  Lock,
  Layers,
  EyeOff,
  Ban,
} from 'lucide-react';
import { TabShieldStats, NexusShieldSettings } from '@shared/types';

interface ShieldPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  activeTabId?: string | null;
  onOpenDashboard: () => void;
}

export const ShieldPopover: React.FC<ShieldPopoverProps> = ({
  isOpen,
  onClose,
  currentUrl,
  activeTabId,
  onOpenDashboard,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [tabStats, setTabStats] = useState<TabShieldStats | null>(null);
  const [settings, setSettings] = useState<NexusShieldSettings | null>(null);
  const [isSiteAllowed, setIsSiteAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const hostname = React.useMemo(() => {
    try {
      if (!currentUrl || currentUrl.startsWith('nexus://')) {
        return 'nexus://';
      }
      return new URL(currentUrl).hostname;
    } catch {
      return currentUrl || 'Current Site';
    }
  }, [currentUrl]);

  const isInternal = !currentUrl || currentUrl.startsWith('nexus://');

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [statsData, settingsData] = await Promise.all([
          window.nexusAPI.getTabShieldStats(activeTabId || undefined),
          window.nexusAPI.getShieldSettings(),
        ]);

        if (!mounted) return;
        setTabStats(statsData);
        setSettings(settingsData);

        if (settingsData && hostname && !isInternal) {
          setIsSiteAllowed(
            settingsData.allowlist.some(
              (site: string) => site.toLowerCase() === hostname.toLowerCase()
            )
          );
        }
      } catch (err) {
        console.error('Failed to load Shield popover data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    // Listen for tab stats updates
    const unsubscribeTabStats = window.nexusAPI.onTabShieldStatsUpdated((newStats) => {
      if (mounted && (!activeTabId || newStats.tabId === activeTabId)) {
        setTabStats(newStats);
      }
    });

    return () => {
      mounted = false;
      unsubscribeTabStats();
    };
  }, [isOpen, currentUrl, activeTabId, hostname, isInternal]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPaused = settings?.temporaryPauseUntil ? settings.temporaryPauseUntil > Date.now() : false;
  const isProtectedOnSite = !isInternal && !isSiteAllowed && !isPaused && (settings?.enabled ?? true);

  const handleToggleSite = async () => {
    if (isInternal) return;
    try {
      const nowAllowed = await window.nexusAPI.toggleShieldSite(hostname);
      setIsSiteAllowed(nowAllowed);
      const updatedSettings = await window.nexusAPI.getShieldSettings();
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to toggle shield site:', err);
    }
  };

  const handleTogglePause = async () => {
    try {
      if (isPaused) {
        await window.nexusAPI.resumeShield();
      } else {
        await window.nexusAPI.pauseShieldTemporarily(30); // 30 min pause
      }
      const updatedSettings = await window.nexusAPI.getShieldSettings();
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to pause/resume shield:', err);
    }
  };

  const totalTabBlocked = tabStats ? tabStats.totalBlocked : 0;

  return (
    <div className="shield-popover-container" ref={popoverRef}>
      {/* Popover Header */}
      <div className="shield-popover-header">
        <div className="shield-popover-title">
          <Shield
            size={18}
            className={
              isProtectedOnSite
                ? 'shield-icon-active'
                : isPaused
                ? 'shield-icon-paused'
                : 'shield-icon-disabled'
            }
          />
          <div>
            <div className="shield-popover-brand">NEXUS Shield</div>
            <div className="shield-popover-hostname" title={hostname}>
              {hostname}
            </div>
          </div>
        </div>
        <button
          className="shield-popover-close-btn"
          onClick={onClose}
          title="Close Shield menu"
        >
          <X size={15} />
        </button>
      </div>

      {/* Site Status Banner */}
      <div
        className={`shield-status-card ${
          isInternal
            ? 'internal'
            : isProtectedOnSite
            ? 'protected'
            : isPaused
            ? 'paused'
            : 'disabled'
        }`}
      >
        <div className="shield-status-info">
          {isInternal ? (
            <>
              <ShieldCheck size={16} className="text-accent" />
              <span>Internal Nexus page — safe environment</span>
            </>
          ) : isProtectedOnSite ? (
            <>
              <ShieldCheck size={16} className="text-success" />
              <div>
                <strong>Protection is Active</strong>
                <p>Blocking known ads, trackers, and malicious scripts</p>
              </div>
            </>
          ) : isPaused ? (
            <>
              <ShieldAlert size={16} className="text-warning" />
              <div>
                <strong>Protection is Paused</strong>
                <p>
                  Paused until{' '}
                  {settings?.temporaryPauseUntil
                    ? new Date(settings.temporaryPauseUntil).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'later'}
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldOff size={16} className="text-danger" />
              <div>
                <strong>Protection Disabled for Site</strong>
                <p>Added to your allowlist</p>
              </div>
            </>
          )}
        </div>

        {!isInternal && (
          <button
            type="button"
            className={`shield-site-toggle-btn ${isSiteAllowed ? 'off' : 'on'}`}
            onClick={handleToggleSite}
            title={
              isSiteAllowed
                ? 'Re-enable Shield protection for this site'
                : 'Pause Shield protection on this site'
            }
          >
            {isSiteAllowed ? 'Turn ON' : 'Turn OFF'}
          </button>
        )}
      </div>

      {/* Page Statistics (Actual items blocked) */}
      {!isInternal && (
        <div className="shield-stats-grid">
          <div className="shield-stat-cell">
            <div className="shield-stat-icon-wrapper ad-color">
              <Ban size={14} />
            </div>
            <div className="shield-stat-details">
              <span className="shield-stat-count">{tabStats?.adsBlocked ?? 0}</span>
              <span className="shield-stat-label">Ads Blocked</span>
            </div>
          </div>

          <div className="shield-stat-cell">
            <div className="shield-stat-icon-wrapper tracker-color">
              <EyeOff size={14} />
            </div>
            <div className="shield-stat-details">
              <span className="shield-stat-count">{tabStats?.trackersBlocked ?? 0}</span>
              <span className="shield-stat-label">Trackers Blocked</span>
            </div>
          </div>

          <div className="shield-stat-cell">
            <div className="shield-stat-icon-wrapper popup-color">
              <Layers size={14} />
            </div>
            <div className="shield-stat-details">
              <span className="shield-stat-count">{tabStats?.popupsBlocked ?? 0}</span>
              <span className="shield-stat-label">Pop-ups Stopped</span>
            </div>
          </div>

          <div className="shield-stat-cell">
            <div className="shield-stat-icon-wrapper threat-color">
              <AlertTriangle size={14} />
            </div>
            <div className="shield-stat-details">
              <span className="shield-stat-count">{tabStats?.threatsBlocked ?? 0}</span>
              <span className="shield-stat-label">Threats Stopped</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pause Action */}
      {!isInternal && (
        <div className="shield-popover-actions">
          <button
            type="button"
            className="shield-action-btn pause-btn"
            onClick={handleTogglePause}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            <span>{isPaused ? 'Resume Protection' : 'Pause for 30 minutes'}</span>
          </button>
        </div>
      )}

      {/* Footer Link to Full Dashboard */}
      <div className="shield-popover-footer">
        <button
          type="button"
          className="shield-dashboard-link-btn"
          onClick={() => {
            onClose();
            onOpenDashboard();
          }}
        >
          <span>Open Shield Dashboard</span>
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
};
