import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Download,
  History,
  Puzzle,
  Settings,
  User,
  Terminal,
  FileText,
  Compass,
  BookOpen,
  Sparkles,
  ShieldCheck,
  MapPin,
  Loader2,
} from 'lucide-react';
import { InstalledExtension, SidePanelType, VpnFreeLocation, VpnStatus } from '@shared/types';

export { type SidePanelType };

interface RightToolbarProps {
  activePanel: SidePanelType;
  onTogglePanel: (panel: SidePanelType) => void;
  downloadCount: number;
  bookmarkCount: number;
  extensions?: InstalledExtension[];
  onOpenExtensionPopup?: (id: string) => void;
  onOpenVpnService?: (url: string) => void;
  minimal?: boolean;
}

export const RightToolbar: React.FC<RightToolbarProps> = ({
  activePanel,
  onTogglePanel,
  downloadCount,
  bookmarkCount,
  extensions = [],
  onOpenExtensionPopup,
  onOpenVpnService,
  minimal = false,
}) => {
  const [isVpnMenuOpen, setIsVpnMenuOpen] = useState(false);
  const [vpnStatus, setVpnStatus] = useState<VpnStatus | null>(null);
  const [vpnLocations, setVpnLocations] = useState<VpnFreeLocation[]>([]);
  const [vpnBusy, setVpnBusy] = useState(false);
  const [vpnError, setVpnError] = useState('');
  const vpnControlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVpnMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!vpnControlRef.current?.contains(event.target as Node)) {
        setIsVpnMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsVpnMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isVpnMenuOpen]);

  useEffect(() => {
    if (!isVpnMenuOpen || !window.nexusAPI) return;
    setVpnError('');
    Promise.all([window.nexusAPI.getVpnStatus(), window.nexusAPI.getVpnFreeLocations()])
      .then(([status, locations]) => {
        setVpnStatus(status);
        setVpnLocations(locations);
      })
      .catch((error) => setVpnError(error?.message || 'Could not read VPN status.'));
  }, [isVpnMenuOpen]);

  const connectVpn = async (countryCode: string) => {
    if (!window.nexusAPI) return;
    setVpnBusy(true);
    setVpnError('');
    try {
      const status = await window.nexusAPI.connectVpn(countryCode);
      setVpnStatus(status);
      if (status.message) setVpnError(status.message);
    } catch (error: any) {
      setVpnError(error?.message || 'Could not connect to Windscribe.');
    } finally {
      setVpnBusy(false);
    }
  };

  const disconnectVpn = async () => {
    if (!window.nexusAPI) return;
    setVpnBusy(true);
    setVpnError('');
    try {
      setVpnStatus(await window.nexusAPI.disconnectVpn());
    } catch (error: any) {
      setVpnError(error?.message || 'Could not disconnect Windscribe.');
    } finally {
      setVpnBusy(false);
    }
  };

  const toggle = (panel: SidePanelType) => {
    if (activePanel === panel) {
      onTogglePanel(null);
    } else {
      onTogglePanel(panel);
    }
  };

  return (
    <aside className="nexus-right-toolbar">
      {/* Bookmarks Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'bookmarks' ? 'active' : ''}`}
        onClick={() => toggle('bookmarks')}
        title="Bookmarks Library (Ctrl+B)"
      >
        <Bookmark size={17} />
        {bookmarkCount > 0 && <span className="toolbar-dot-badge" />}
      </button>

      {/* History Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'history' ? 'active' : ''}`}
        onClick={() => toggle('history')}
        title="Browsing History (Ctrl+H)"
      >
        <History size={17} />
      </button>

      {/* Downloads Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'downloads' ? 'active' : ''}`}
        onClick={() => toggle('downloads')}
        title="Downloads (Ctrl+J)"
      >
        <Download size={17} />
        {downloadCount > 0 && <span className="toolbar-badge">{downloadCount}</span>}
      </button>

      {/* Notes Companion Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'notes' ? 'active' : ''}`}
        onClick={() => toggle('notes')}
        title="NEXUS Notes Companion (Ctrl+Shift+N)"
      >
        <FileText size={17} />
      </button>

      <div className="vpn-toolbar-control" ref={vpnControlRef}>
        <button
          type="button"
          className={`nexus-icon-btn toolbar-action-btn ${isVpnMenuOpen || vpnStatus?.connected ? 'active' : ''}`}
          onClick={() => setIsVpnMenuOpen((open) => !open)}
          title={vpnStatus?.connected ? `NEXUS VPN connected${vpnStatus.location ? `: ${vpnStatus.location}` : ''}` : 'NEXUS VPN'}
          aria-label="NEXUS VPN"
          aria-haspopup="dialog"
          aria-expanded={isVpnMenuOpen}
        >
          <ShieldCheck size={17} />
        </button>
        {isVpnMenuOpen && (
          <div className="vpn-services-popover" role="dialog" aria-label="NEXUS VPN">
            <div className="vpn-services-heading">
              <div>
                <strong>NEXUS VPN</strong>
                <span>Powered by Windscribe Free</span>
              </div>
              <button
                type="button"
                className="nexus-icon-btn vpn-services-close"
                onClick={() => setIsVpnMenuOpen(false)}
                title="Close VPN services"
                aria-label="Close VPN services"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className={`vpn-status-line ${vpnStatus?.connected ? 'connected' : ''}`}>
              <span className="vpn-status-indicator" />
              <span>{vpnStatus?.connected ? `Connected${vpnStatus.location ? ` · ${vpnStatus.location}` : ''}` : vpnStatus?.loggedIn ? 'Disconnected' : 'Not connected'}</span>
              {vpnBusy && <Loader2 size={13} className="vpn-spinner" aria-label="Working" />}
            </div>
            {!vpnStatus?.available && (
              <div className="vpn-setup-message">
                <span>{vpnStatus?.message || 'Install the official Windscribe app and sign in to use VPN controls here.'}</span>
                <button type="button" onClick={() => onOpenVpnService?.('https://windscribe.com/download')}>Get Windscribe</button>
              </div>
            )}
            {vpnStatus?.available && !vpnStatus.loggedIn && (
              <div className="vpn-setup-message">
                <span>Sign in to your free Windscribe account in its app, then choose a location here.</span>
              </div>
            )}
            {vpnStatus?.connected ? (
              <button className="vpn-disconnect-btn" type="button" onClick={disconnectVpn} disabled={vpnBusy}>Disconnect</button>
            ) : (
              <>
                <div className="vpn-location-label"><MapPin size={12} /> Free countries</div>
                <div className="vpn-location-list">
                  {vpnLocations.map((location) => (
                    <button key={location.code} type="button" className="vpn-location-option" onClick={() => connectVpn(location.code)} disabled={vpnBusy || !vpnStatus?.available || !vpnStatus?.loggedIn}>
                      <span>{location.country}</span><small>{location.region}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="vpn-footnote">Free plan: 10 countries · 10 GB/month with verified email</div>
            {vpnError && <div className="vpn-error" role="status">{vpnError}</div>}
          </div>
        )}
      </div>

      {/* Explore Tools Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'intelligence' ? 'active' : ''}`}
        onClick={() => toggle('intelligence')}
        title="NEXUS Explore"
      >
        <Compass size={17} />
      </button>

      {/* Extension Action Buttons */}
      {extensions
        .filter((ext) => ext.enabled && ext.action?.popup)
        .map((ext) => (
          <button
            key={ext.id}
            className="nexus-icon-btn toolbar-action-btn extension-action-btn"
            onClick={() => onOpenExtensionPopup?.(ext.id)}
            title={`${ext.name}${ext.action?.title ? ` - ${ext.action.title}` : ''}`}
          >
            {ext.iconDataUrl ? (
              <img
                src={ext.iconDataUrl}
                alt={ext.name}
                style={{ width: '16px', height: '16px', borderRadius: '2px', objectFit: 'contain' }}
              />
            ) : (
              <Puzzle size={16} className="text-accent" />
            )}
          </button>
        ))}

      {/* Extensions Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'extensions' ? 'active' : ''} ${minimal ? 'minimal-hidden' : ''}`}
        onClick={() => toggle('extensions')}
        title="Extensions & Tools"
      >
        <Puzzle size={17} />
      </button>

      {/* Developer Toolkit Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'devtools' ? 'active' : ''} ${minimal ? 'minimal-hidden' : ''}`}
        onClick={() => toggle('devtools')}
        title="Developer Toolkit"
      >
        <Terminal size={17} />
      </button>

      <div className="toolbar-spacer" />

      {/* Profiles Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'profiles' ? 'active' : ''} ${minimal ? 'minimal-hidden' : ''}`}
        onClick={() => toggle('profiles')}
        title="User Profiles"
      >
        <User size={17} />
      </button>

      {/* Settings Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'settings' ? 'active' : ''}`}
        onClick={() => toggle('settings')}
        title="Browser Settings"
      >
        <Settings size={17} />
      </button>
    </aside>
  );
};
