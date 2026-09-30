import React, { useState, useEffect } from 'react';
import {
  Code,
  Globe,
  Shield,
  Layers,
  Activity,
  HardDrive,
  ZoomIn,
  Pipette,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Smartphone,
  Info,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  CookieItem,
  NetworkLogEntry,
  PageInfoDetails,
  SiteZoomPreference,
  StorageData,
} from '../../../shared/types';

interface DeveloperToolsPanelProps {
  currentUrl?: string;
  activeTabId: string | null;
  onNavigate: (url: string) => void;
  onToggleDevTools: () => void;
  onInspectElement: () => void;
  onViewSource: () => void;
  onToggleResponsive: () => void;
  onOpenReaderMode: () => void;
  onOpenJsonFormatter: () => void;
  onOpenDevDashboard: () => void;
}

type TabCategory = 'info' | 'network' | 'storage' | 'zoom';

export const DeveloperToolsPanel: React.FC<DeveloperToolsPanelProps> = ({
  currentUrl,
  activeTabId,
  onNavigate,
  onToggleDevTools,
  onInspectElement,
  onViewSource,
  onToggleResponsive,
  onOpenReaderMode,
  onOpenJsonFormatter,
  onOpenDevDashboard,
}) => {
  const [activeCategory, setActiveCategory] = useState<TabCategory>('info');
  const [pageInfo, setPageInfo] = useState<PageInfoDetails | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  // Network logs
  const [networkLogs, setNetworkLogs] = useState<NetworkLogEntry[]>([]);
  const [networkFilter, setNetworkFilter] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Storage & Cookies
  const [storageCategory, setStorageCategory] = useState<'cookies' | 'local' | 'session'>('cookies');
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [storageData, setStorageData] = useState<StorageData>({ localStorage: [], sessionStorage: [] });
  const [storageFilter, setStorageFilter] = useState('');

  // Zoom preferences
  const [currentZoom, setCurrentZoom] = useState(1.0);
  const [allSiteZooms, setAllSiteZooms] = useState<SiteZoomPreference[]>([]);

  // Color picker state
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [hasCopiedColor, setHasCopiedColor] = useState(false);

  const api = window.nexusAPI;

  const loadPageInfo = async () => {
    if (!api || !activeTabId) return;
    setIsLoadingInfo(true);
    try {
      const info = await api.getPageInfo(activeTabId);
      setPageInfo(info);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const loadNetworkLogs = async () => {
    if (!api || !activeTabId) return;
    try {
      const logs = await api.getNetworkLogs(activeTabId);
      setNetworkLogs(logs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStorage = async () => {
    if (!api || !activeTabId) return;
    try {
      const c = await api.getCookiesForTab(activeTabId);
      setCookies(c);
      const s = await api.getStorageForTab(activeTabId);
      setStorageData(s);
    } catch (e) {
      console.error(e);
    }
  };

  const loadZoom = async () => {
    if (!api) return;
    try {
      if (currentUrl) {
        const z = await api.getSiteZoom(currentUrl);
        setCurrentZoom(z);
      }
      const zooms = await api.getAllSiteZooms();
      setAllSiteZooms(zooms);
    } catch (e) {
      console.error(e);
    }
  };

  // Initial tab category loading
  useEffect(() => {
    loadPageInfo();
    loadNetworkLogs();
    loadStorage();
    loadZoom();
  }, [activeTabId, currentUrl]);

  // Real-time network listener
  useEffect(() => {
    if (!api) return;
    const unsub = api.onNetworkActivity((entry) => {
      if (entry.tabId === activeTabId || entry.tabId.startsWith('wc_')) {
        setNetworkLogs((prev) => [...prev.slice(-199), entry]);
      }
    });
    return () => unsub();
  }, [api, activeTabId]);

  const handlePickColor = async () => {
    if ((window as any).EyeDropper) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          setPickedColor(result.sRGBHex);
        }
      } catch (err) {
        console.warn('EyeDropper cancelled or failed:', err);
      }
    } else {
      alert('The color picker is not available in this session.');
    }
  };

  const handleCopyColor = () => {
    if (pickedColor) {
      navigator.clipboard.writeText(pickedColor);
      setHasCopiedColor(true);
      setTimeout(() => setHasCopiedColor(false), 2000);
    }
  };

  const handleUpdateZoom = async (delta: number) => {
    if (!api || !currentUrl) return;
    const nextZoom = Math.round((currentZoom + delta) * 100) / 100;
    await api.setSiteZoom(currentUrl, nextZoom);
    setCurrentZoom(nextZoom);
    loadZoom();
  };

  const handleResetZoom = async () => {
    if (!api || !currentUrl) return;
    await api.setSiteZoom(currentUrl, 1.0);
    setCurrentZoom(1.0);
    loadZoom();
  };

  const handleClearCookies = async () => {
    if (!api || !currentUrl) return;
    for (const cookie of cookies) {
      await api.removeCookie(currentUrl, cookie.name);
    }
    loadStorage();
  };

  const handleClearStorage = async (type: 'all' | 'localStorage' | 'sessionStorage') => {
    if (!api || !activeTabId) return;
    await api.clearStorageForTab(activeTabId, type);
    loadStorage();
  };

  return (
    <div className="devtools-panel">
      {/* Category Tabs */}
      <div className="devtools-category-tabs">
        <button
          className={`devtools-cat-btn ${activeCategory === 'info' ? 'active' : ''}`}
          onClick={() => {
            setActiveCategory('info');
            loadPageInfo();
          }}
          title="Page overview"
        >
          <Info size={14} />
          <span>Overview</span>
        </button>
        <button
          className={`devtools-cat-btn ${activeCategory === 'network' ? 'active' : ''}`}
          onClick={() => {
            setActiveCategory('network');
            loadNetworkLogs();
          }}
          title="Network Traffic"
        >
          <Activity size={14} />
          <span>Network</span>
        </button>
        <button
          className={`devtools-cat-btn ${activeCategory === 'storage' ? 'active' : ''}`}
          onClick={() => {
            setActiveCategory('storage');
            loadStorage();
          }}
          title="Cookies & Storage"
        >
          <HardDrive size={14} />
          <span>Storage</span>
        </button>
        <button
          className={`devtools-cat-btn ${activeCategory === 'zoom' ? 'active' : ''}`}
          onClick={() => {
            setActiveCategory('zoom');
            loadZoom();
          }}
          title="Zoom & Display"
        >
          <ZoomIn size={14} />
          <span>Display</span>
        </button>
      </div>

      {/* Panel Body */}
      <div className="devtools-panel-content">
        {/* 1. Page Info & Shortcuts */}
        {activeCategory === 'info' && (
          <div className="devtools-section">
            <div className="devtools-header-actions">
              <span className="devtools-subhead">Page overview</span>
              <button className="nexus-icon-btn devtools-refresh-btn" onClick={loadPageInfo} title="Refresh page details" aria-label="Refresh page details">
                <RefreshCw size={13} className={isLoadingInfo ? 'spin' : ''} />
              </button>
            </div>

            <div className="devtools-info-card">
              <div className="devtools-info-row">
                <span className="devtools-info-label">Title</span>
                <span className="devtools-info-val" title={pageInfo?.title}>
                  {pageInfo?.title || 'Unknown'}
                </span>
              </div>
              <div className="devtools-info-row">
                <span className="devtools-info-label">URL</span>
                <span className="devtools-info-val font-mono" title={pageInfo?.url}>
                  {pageInfo?.url || currentUrl || 'nexus://'}
                </span>
              </div>
              <div className="devtools-info-row">
                <span className="devtools-info-label">Viewport</span>
                <span className="devtools-info-val font-mono">
                  {pageInfo?.viewportSize.width} × {pageInfo?.viewportSize.height} px
                </span>
              </div>
              <div className="devtools-info-row">
                <span className="devtools-info-label">Security</span>
                <span className={`devtools-badge ${pageInfo?.security.isSecure ? 'badge-secure' : 'badge-warning'}`}>
                  {pageInfo?.security.isSecure ? 'HTTPS Secure' : 'Non-Secure HTTP'}
                </span>
              </div>
            </div>

            <span className="devtools-subhead" style={{ marginTop: '16px' }}>Developer Actions</span>
            <div className="devtools-grid-actions">
              <button className="devtools-action-tile" onClick={onToggleDevTools}>
                <Code size={16} />
                <div>
                  <strong>Browser DevTools</strong>
                  <small>F12 / Ctrl+Shift+I</small>
                </div>
              </button>

              <button className="devtools-action-tile" onClick={onInspectElement}>
                <Layers size={16} />
                <div>
                  <strong>Inspect Element</strong>
                  <small>Ctrl+Shift+C</small>
                </div>
              </button>

              <button className="devtools-action-tile" onClick={onToggleResponsive}>
                <Smartphone size={16} />
                <div>
                  <strong>Responsive Mode</strong>
                  <small>Mobile & tablet preview</small>
                </div>
              </button>

              <button className="devtools-action-tile" onClick={onViewSource}>
                <ExternalLink size={16} />
                <div>
                  <strong>View Source</strong>
                  <small>view-source: syntax</small>
                </div>
              </button>

              <button className="devtools-action-tile" onClick={onOpenReaderMode}>
                <BookOpen size={16} />
                <div>
                  <strong>Reader Mode</strong>
                  <small>Distraction-free article</small>
                </div>
              </button>

              <button className="devtools-action-tile" onClick={onOpenJsonFormatter}>
                <Code size={16} />
                <div>
                  <strong>JSON Formatter</strong>
                  <small>Format & inspect JSON</small>
                </div>
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                className="devtools-wide-btn"
                onClick={onOpenDevDashboard}
              >
                <Globe size={14} />
                <span>Open Developer Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Network Activity */}
        {activeCategory === 'network' && (
          <div className="devtools-section">
            <div className="devtools-filter-bar">
              <div className="search-input-wrap">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Filter by URL or type..."
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value)}
                />
              </div>
              <button
                className="icon-btn-small"
                onClick={() => {
                  api?.clearNetworkLogs(activeTabId || undefined);
                  setNetworkLogs([]);
                }}
                title="Clear Logs"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="devtools-network-table-wrap">
              <table className="devtools-network-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {networkLogs
                    .filter(
                      (n) =>
                        !networkFilter ||
                        n.url.toLowerCase().includes(networkFilter.toLowerCase()) ||
                        n.resourceType.toLowerCase().includes(networkFilter.toLowerCase())
                    )
                    .map((log) => {
                      const is2xx = log.statusCode && log.statusCode >= 200 && log.statusCode < 300;
                      const is3xx = log.statusCode && log.statusCode >= 300 && log.statusCode < 400;
                      const isErr = (log.statusCode && log.statusCode >= 400) || log.error;

                      let statusClass = 'status-default';
                      if (is2xx) statusClass = 'status-success';
                      else if (is3xx) statusClass = 'status-redirect';
                      else if (isErr) statusClass = 'status-error';

                      const filename = log.url.split('/').pop()?.split('?')[0] || log.url;

                      return (
                        <tr key={log.id} title={`${log.method} ${log.url}`}>
                          <td>
                            <span className={`status-pill ${statusClass}`}>
                              {log.error ? 'ERR' : log.statusCode || '...'}
                            </span>
                          </td>
                          <td className="font-mono">{log.method}</td>
                          <td className="network-url-cell" title={log.url}>
                            {filename.length > 28 ? filename.slice(0, 28) + '...' : filename}
                          </td>
                          <td className="font-dim">{log.resourceType}</td>
                          <td className="font-mono font-dim">{log.duration ? `${log.duration}ms` : '-'}</td>
                        </tr>
                      );
                    })}
                  {networkLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-table-row">
                        No network activity recorded for this tab yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Cookies & Storage */}
        {activeCategory === 'storage' && (
          <div className="devtools-section">
            <div className="devtools-subtabs">
              <button
                className={`devtools-subtab-btn ${storageCategory === 'cookies' ? 'active' : ''}`}
                onClick={() => setStorageCategory('cookies')}
              >
                Cookies ({cookies.length})
              </button>
              <button
                className={`devtools-subtab-btn ${storageCategory === 'local' ? 'active' : ''}`}
                onClick={() => setStorageCategory('local')}
              >
                LocalStorage ({storageData.localStorage.length})
              </button>
              <button
                className={`devtools-subtab-btn ${storageCategory === 'session' ? 'active' : ''}`}
                onClick={() => setStorageCategory('session')}
              >
                SessionStorage ({storageData.sessionStorage.length})
              </button>
            </div>

            {storageCategory === 'cookies' && (
              <div className="devtools-storage-view">
                <div className="devtools-storage-toolbar">
                  <span className="font-dim text-xs">Origin Cookies</span>
                  <button className="devtools-btn-danger text-xs" onClick={handleClearCookies}>
                    <Trash2 size={12} />
                    <span>Clear Cookies</span>
                  </button>
                </div>
                <div className="devtools-items-list">
                  {cookies.map((c, i) => (
                    <div key={`${c.name}_${i}`} className="devtools-kv-card">
                      <div className="devtools-kv-header">
                        <strong className="font-mono text-purple">{c.name}</strong>
                        <div className="devtools-badges-inline">
                          {c.secure && <span className="micro-badge">Secure</span>}
                          {c.httpOnly && <span className="micro-badge">HttpOnly</span>}
                          <button
                            className="icon-btn-micro text-danger"
                            onClick={async () => {
                              if (currentUrl) {
                                await api?.removeCookie(currentUrl, c.name);
                                loadStorage();
                              }
                            }}
                            title="Delete cookie"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="devtools-kv-val font-mono" title={c.value}>
                        {c.value.length > 80 ? c.value.slice(0, 80) + '...' : c.value}
                      </div>
                      <div className="devtools-kv-meta">
                        <span>Domain: {c.domain}</span>
                        <span>Path: {c.path}</span>
                      </div>
                    </div>
                  ))}
                  {cookies.length === 0 && (
                    <div className="empty-storage-msg">No cookies stored for this origin.</div>
                  )}
                </div>
              </div>
            )}

            {storageCategory === 'local' && (
              <div className="devtools-storage-view">
                <div className="devtools-storage-toolbar">
                  <span className="font-dim text-xs">localStorage Items</span>
                  <button
                    className="devtools-btn-danger text-xs"
                    onClick={() => handleClearStorage('localStorage')}
                  >
                    <Trash2 size={12} />
                    <span>Clear LocalStorage</span>
                  </button>
                </div>
                <div className="devtools-items-list">
                  {storageData.localStorage.map((item, i) => (
                    <div key={`ls_${i}`} className="devtools-kv-card">
                      <div className="devtools-kv-header">
                        <strong className="font-mono text-blue">{item.key}</strong>
                        <button
                          className="icon-btn-micro"
                          onClick={() => navigator.clipboard.writeText(item.value)}
                          title="Copy value"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                      <div className="devtools-kv-val font-mono">{item.value}</div>
                    </div>
                  ))}
                  {storageData.localStorage.length === 0 && (
                    <div className="empty-storage-msg">localStorage is empty.</div>
                  )}
                </div>
              </div>
            )}

            {storageCategory === 'session' && (
              <div className="devtools-storage-view">
                <div className="devtools-storage-toolbar">
                  <span className="font-dim text-xs">sessionStorage Items</span>
                  <button
                    className="devtools-btn-danger text-xs"
                    onClick={() => handleClearStorage('sessionStorage')}
                  >
                    <Trash2 size={12} />
                    <span>Clear SessionStorage</span>
                  </button>
                </div>
                <div className="devtools-items-list">
                  {storageData.sessionStorage.map((item, i) => (
                    <div key={`ss_${i}`} className="devtools-kv-card">
                      <div className="devtools-kv-header">
                        <strong className="font-mono text-green">{item.key}</strong>
                        <button
                          className="icon-btn-micro"
                          onClick={() => navigator.clipboard.writeText(item.value)}
                          title="Copy value"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                      <div className="devtools-kv-val font-mono">{item.value}</div>
                    </div>
                  ))}
                  {storageData.sessionStorage.length === 0 && (
                    <div className="empty-storage-msg">sessionStorage is empty.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Zoom & Color Picker */}
        {activeCategory === 'zoom' && (
          <div className="devtools-section">
            <span className="devtools-subhead">Per-Site Zoom Control</span>
            <div className="devtools-zoom-control-card">
              <span className="text-sm">Current Site Zoom:</span>
              <div className="devtools-zoom-stepper">
                <button className="stepper-btn" onClick={() => handleUpdateZoom(-0.1)}>
                  -
                </button>
                <span className="zoom-val font-mono">{Math.round(currentZoom * 100)}%</span>
                <button className="stepper-btn" onClick={() => handleUpdateZoom(0.1)}>
                  +
                </button>
                <button className="devtools-pill-btn" onClick={handleResetZoom}>
                  Reset
                </button>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <span className="devtools-subhead">Saved Site Zoom Preferences</span>
              <div className="devtools-zoom-list">
                {allSiteZooms.map((pref) => (
                  <div key={pref.origin} className="devtools-zoom-item">
                    <span className="font-mono text-sm">{pref.origin}</span>
                    <div className="devtools-zoom-actions">
                      <span className="zoom-badge font-mono">{Math.round(pref.zoomFactor * 100)}%</span>
                      <button
                        className="icon-btn-micro text-danger"
                        onClick={async () => {
                          await api?.setSiteZoom(pref.origin, 1.0);
                          loadZoom();
                        }}
                        title="Remove zoom preference"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
                {allSiteZooms.length === 0 && (
                  <div className="empty-storage-msg">No custom per-site zoom preferences saved.</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <span className="devtools-subhead">Color Inspector (Eyedropper)</span>
              <div className="devtools-eyedropper-card">
                <button className="devtools-action-btn" onClick={handlePickColor}>
                  <Pipette size={14} />
                  <span>Pick Color From Screen</span>
                </button>

                {pickedColor && (
                  <div className="devtools-color-preview">
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: pickedColor }}
                    />
                    <span className="font-mono text-sm">{pickedColor}</span>
                    <button className="icon-btn-small" onClick={handleCopyColor} title="Copy HEX">
                      {hasCopiedColor ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
