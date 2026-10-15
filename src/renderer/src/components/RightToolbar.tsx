import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutGrid,
  Puzzle,
  ShieldCheck,
  MapPin,
  Loader2,
  X,
} from 'lucide-react';
import { InstalledExtension, SidePanelId, SidePanelType, VpnFreeLocation, VpnStatus } from '@shared/types';
import { IconButton, SearchInput } from './ui';
import { SIDE_PANEL_OPTIONS } from './side-panel-options';

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
  hiddenPanels?: SidePanelId[];
  onTogglePanelVisibility?: (panel: SidePanelId, visible: boolean) => void;
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
  hiddenPanels = [],
  onTogglePanelVisibility,
}) => {
  const [isVpnMenuOpen, setIsVpnMenuOpen] = useState(false);
  const [vpnStatus, setVpnStatus] = useState<VpnStatus | null>(null);
  const [vpnLocations, setVpnLocations] = useState<VpnFreeLocation[]>([]);
  const [vpnBusy, setVpnBusy] = useState(false);
  const [vpnError, setVpnError] = useState('');
  const vpnControlRef = useRef<HTMLDivElement>(null);
  const panelRailRef = useRef<HTMLDivElement>(null);
  const [isPanelRailOpen, setIsPanelRailOpen] = useState(false);
  const [isManagingPanels, setIsManagingPanels] = useState(false);
  const [panelQuery, setPanelQuery] = useState('');

  const matchingPanels = SIDE_PANEL_OPTIONS.filter((panel) =>
    panel.label.toLowerCase().includes(panelQuery.trim().toLowerCase())
  );
  const visiblePanels = matchingPanels.filter((panel) => !hiddenPanels.includes(panel.id));
  const railPanels = minimal
    ? visiblePanels.filter((panel) => !['extensions', 'devtools', 'profiles'].includes(panel.id))
    : visiblePanels;

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
    if (!isPanelRailOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!panelRailRef.current?.contains(event.target as Node)) {
        setIsPanelRailOpen(false);
        setIsManagingPanels(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPanelRailOpen(false);
        setIsManagingPanels(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isPanelRailOpen]);

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

  const selectPanel = (panel: SidePanelId) => {
    toggle(panel);
    setIsPanelRailOpen(false);
  };

  return (
    <aside className="nexus-right-toolbar">
      <div className="side-panel-rail-control" ref={panelRailRef}>
        <button
          type="button"
          className={`nexus-icon-btn toolbar-action-btn ${isPanelRailOpen || !!activePanel ? 'active' : ''}`}
          onClick={() => setIsPanelRailOpen((open) => !open)}
          title="Side panels"
          aria-label="Search side panels"
          aria-haspopup="dialog"
          aria-expanded={isPanelRailOpen}
        >
          <LayoutGrid size={17} />
          {(bookmarkCount > 0 || downloadCount > 0) && <span className="toolbar-dot-badge" />}
        </button>
        {isPanelRailOpen && (
          <div className="side-panel-rail-popover" role="dialog" aria-label="Side panels">
            <div className="side-panel-rail-search">
              <SearchInput
                size="sm"
                value={panelQuery}
                onChange={(event) => setPanelQuery(event.target.value)}
                onClear={() => setPanelQuery('')}
                placeholder="Search panels"
                aria-label="Search side panels by name"
                autoFocus
              />
              <IconButton
                icon={<X size={14} />}
                aria-label="Close side panel rail"
                tooltip="Close"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPanelRailOpen(false);
                  setIsManagingPanels(false);
                }}
              />
            </div>

            {isManagingPanels ? (
              <div className="side-panel-rail-list side-panel-rail-manage" aria-label="Visible side panels">
                {matchingPanels.map((panel) => (
                  <label className="side-panel-rail-visibility" key={panel.id}>
                    <span className="side-panel-rail-icon">{panel.icon}</span>
                    <span className="side-panel-rail-label">{panel.label}</span>
                    <input
                      type="checkbox"
                      checked={!hiddenPanels.includes(panel.id)}
                      onChange={(event) => onTogglePanelVisibility?.(panel.id, event.target.checked)}
                      aria-label={`Show ${panel.label}`}
                    />
                  </label>
                ))}
                {matchingPanels.length === 0 && <p className="side-panel-rail-empty">No panels match "{panelQuery}".</p>}
              </div>
            ) : (
              <div className="side-panel-rail-list" aria-label="Available side panels">
                {railPanels.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    aria-pressed={activePanel === panel.id}
                    className={`side-panel-rail-item ${activePanel === panel.id ? 'active' : ''}`}
                    onClick={() => selectPanel(panel.id)}
                  >
                    <span className="side-panel-rail-icon">{panel.icon}</span>
                    <span className="side-panel-rail-label">{panel.label}</span>
                    {panel.id === 'bookmarks' && bookmarkCount > 0 && <span className="side-panel-rail-dot" aria-label={`${bookmarkCount} bookmarks`} />}
                    {panel.id === 'downloads' && downloadCount > 0 && <span className="side-panel-rail-count">{downloadCount}</span>}
                  </button>
                ))}
                {railPanels.length === 0 && <p className="side-panel-rail-empty">No visible panels match "{panelQuery}".</p>}
              </div>
            )}

            <button
              type="button"
              className="side-panel-rail-manage-toggle"
              onClick={() => setIsManagingPanels((managing) => !managing)}
            >
              {isManagingPanels ? 'Done' : 'Manage visible panels'}
            </button>
          </div>
        )}
      </div>

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

      <div className="toolbar-spacer" />
    </aside>
  );
};
