import React, { useState } from 'react';
import { Bookmark, BrowserSettings, DownloadItem, ExtensionItem, RecentPage, SystemInfo } from '@shared/types';
import { SidePanelType } from './RightToolbar';
import {
  X,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Check,
  ShieldCheck,
  RotateCw,
  HardDrive,
  FolderOpen,
  UserCheck,
  CheckCircle2,
  Clock,
  FolderPlus,
  HelpCircle,
  Puzzle,
} from 'lucide-react';

interface SidePanelProps {
  type: SidePanelType;
  onClose: () => void;
  bookmarks: Bookmark[];
  onAddBookmark: () => void;
  onRemoveBookmark: (id: string) => void;
  onNavigate: (url: string) => void;
  downloads: DownloadItem[];
  onClearDownloads: () => void;
  extensions: ExtensionItem[];
  onToggleExtension: (id: string, enabled?: boolean) => void;
  onOpenExtensionsPage?: () => void;
  onInstallUnpacked?: () => void;
  onOpenCompatibility?: () => void;
  onReloadExtension?: (id: string) => void;
  onUninstallExtension?: (id: string) => void;
  settings: BrowserSettings;
  onUpdateSettings: (newSettings: Partial<BrowserSettings>) => void;
  onClearCache: () => Promise<void>;
  systemInfo: SystemInfo | null;
  currentUrl?: string;
  isBookmarked: boolean;
  history?: RecentPage[];
  onClearHistory?: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  type,
  onClose,
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onNavigate,
  downloads,
  onClearDownloads,
  extensions,
  onToggleExtension,
  onOpenExtensionsPage,
  onInstallUnpacked,
  onOpenCompatibility,
  onReloadExtension,
  onUninstallExtension,
  settings,
  onUpdateSettings,
  onClearCache,
  systemInfo,
  isBookmarked,
  history = [],
  onClearHistory,
}) => {
  const [bookmarkQuery, setBookmarkQuery] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  if (!type) return null;

  const handleClearCacheClick = async () => {
    setClearingCache(true);
    await onClearCache();
    setClearingCache(false);
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(bookmarkQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(bookmarkQuery.toLowerCase())
  );

  const filteredHistory = history.filter(
    (h) =>
      h.title.toLowerCase().includes(historyQuery.toLowerCase()) ||
      h.url.toLowerCase().includes(historyQuery.toLowerCase())
  );

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="nexus-side-panel">
      {/* Header */}
      <div className="side-panel-header">
        <h3 className="side-panel-title">
          {type === 'bookmarks' && 'Bookmarks'}
          {type === 'history' && 'Browsing History'}
          {type === 'downloads' && 'Downloads'}
          {type === 'extensions' && 'Extensions'}
          {type === 'profiles' && 'Profiles'}
          {type === 'settings' && 'Settings'}
        </h3>
        <button className="nexus-icon-btn panel-close-btn" onClick={onClose} title="Close panel">
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="side-panel-body">
        {/* ================= Bookmarks View ================= */}
        {type === 'bookmarks' && (
          <div className="panel-section">
            <div className="panel-actions-row">
              <div className="panel-search-box">
                <Search size={13} className="panel-search-icon" />
                <input
                  type="text"
                  placeholder="Filter bookmarks..."
                  value={bookmarkQuery}
                  onChange={(e) => setBookmarkQuery(e.target.value)}
                  className="panel-search-input"
                />
              </div>
              <button
                className="panel-action-btn-primary"
                onClick={onAddBookmark}
                title={isBookmarked ? 'Already bookmarked' : 'Add current tab'}
              >
                {isBookmarked ? <Check size={13} /> : <Plus size={13} />}
                <span>{isBookmarked ? 'Saved' : 'Add'}</span>
              </button>
            </div>

            <div className="panel-list">
              {filteredBookmarks.length === 0 ? (
                <div className="panel-empty-state">No bookmarks found</div>
              ) : (
                filteredBookmarks.map((b) => (
                  <div key={b.id} className="panel-list-item" onClick={() => onNavigate(b.url)}>
                    <div className="item-meta">
                      <span className="item-title">{b.title}</span>
                      <span className="item-sub">{b.url}</span>
                    </div>
                    <button
                      className="item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(b.id);
                      }}
                      title="Delete bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= History View ================= */}
        {type === 'history' && (
          <div className="panel-section">
            <div className="panel-actions-row">
              <div className="panel-search-box">
                <Search size={13} className="panel-search-icon" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  className="panel-search-input"
                />
              </div>
              {history.length > 0 && onClearHistory && (
                <button
                  className="panel-text-btn"
                  onClick={onClearHistory}
                  title="Clear all browsing history"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="panel-list">
              {filteredHistory.length === 0 ? (
                <div className="panel-empty-state">No history records found</div>
              ) : (
                filteredHistory.map((item, idx) => (
                  <div
                    key={`${item.url}-${item.timestamp}-${idx}`}
                    className="panel-list-item history-list-item"
                    onClick={() => onNavigate(item.url)}
                  >
                    <div className="item-meta">
                      <span className="item-title">{item.title || item.url}</span>
                      <span className="item-sub">{item.url}</span>
                    </div>
                    <div className="history-item-badge">
                      <Clock size={11} className="text-secondary" />
                      <span className="history-timestamp">{formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= Downloads View ================= */}
        {type === 'downloads' && (
          <div className="panel-section">
            <div className="panel-actions-row justify-between">
              <span className="text-secondary text-xs">{downloads.length} items</span>
              {downloads.length > 0 && (
                <button className="panel-text-btn" onClick={onClearDownloads}>
                  Clear all
                </button>
              )}
            </div>

            <div className="panel-list">
              {downloads.length === 0 ? (
                <div className="panel-empty-state">No recent downloads</div>
              ) : (
                downloads.map((d) => (
                  <div key={d.id} className="download-item-card">
                    <div className="download-info">
                      <span className="download-filename">{d.filename}</span>
                      <span className="download-size">{d.filesize}</span>
                    </div>
                    {d.status === 'in_progress' ? (
                      <div className="download-progress-track">
                        <div
                          className="download-progress-bar"
                          style={{ width: `${d.progress}%` }}
                        />
                      </div>
                    ) : (
                      <div className="download-status-done">
                        <CheckCircle2 size={13} className="text-green" />
                        <span>Finished</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= Extensions View ================= */}
        {type === 'extensions' && (
          <div className="panel-section">
            <div className="panel-banner" style={{ justifyContent: 'space-between' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-accent" />
                <span>Developer Extensions</span>
              </div>
              <span className="text-[10px] text-muted">
                {extensions.filter((e) => e.enabled).length}/{extensions.length} active
              </span>
            </div>

            <div className="flex items-center gap-2 my-2 px-1">
              <button
                className="nexus-btn-sm nexus-btn-primary flex-1 flex items-center justify-center gap-1.5 py-1.5"
                onClick={onInstallUnpacked}
              >
                <FolderPlus size={13} />
                <span>Load Unpacked</span>
              </button>
              <button
                className="nexus-btn-sm nexus-btn-secondary flex items-center justify-center gap-1.5 py-1.5 px-2.5"
                onClick={onOpenExtensionsPage}
                title="Open full extensions page (nexus://extensions)"
              >
                <ExternalLink size={13} />
                <span>Full Page</span>
              </button>
            </div>

            <div className="panel-list">
              {extensions.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted">
                  <p>No extensions installed yet.</p>
                  <button
                    className="text-accent hover:underline mt-2 inline-flex items-center gap-1"
                    onClick={onInstallUnpacked}
                  >
                    <FolderPlus size={12} />
                    <span>Install your first extension</span>
                  </button>
                </div>
              ) : (
                extensions.map((ext) => (
                  <div key={ext.id} className="extension-card">
                    <div className="extension-header">
                      <div className="flex items-center gap-2 min-w-0">
                        {ext.iconDataUrl ? (
                          <img
                            src={ext.iconDataUrl}
                            alt={ext.name}
                            style={{ width: '16px', height: '16px', borderRadius: '2px', objectFit: 'contain' }}
                          />
                        ) : (
                          <Puzzle size={14} className="text-accent flex-shrink-0" />
                        )}
                        <span className="extension-name truncate" title={ext.name}>
                          {ext.name}
                        </span>
                        <span className="extension-version">v{ext.version}</span>
                      </div>
                      {/* Toggle Switch */}
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={ext.enabled}
                          onChange={(e) => onToggleExtension(ext.id, e.target.checked)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                    {ext.description && <p className="extension-desc">{ext.description}</p>}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      <span
                        className={`text-[10px] ${
                          ext.compatibility?.status === 'compatible'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {ext.compatibility?.status === 'compatible' ? 'Compatible' : 'Partial'}
                      </span>
                      <div className="flex items-center gap-2">
                        {onReloadExtension && (
                          <button
                            className="text-xs text-muted hover:text-primary"
                            onClick={() => onReloadExtension(ext.id)}
                            title="Reload"
                          >
                            <RotateCw size={12} />
                          </button>
                        )}
                        {onUninstallExtension && (
                          <button
                            className="text-xs text-muted hover:text-red-400"
                            onClick={() => onUninstallExtension(ext.id)}
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 px-1">
              <button
                className="w-full text-center text-xs text-muted hover:text-accent flex items-center justify-center gap-1 py-1"
                onClick={onOpenCompatibility}
              >
                <HelpCircle size={12} />
                <span>View Electron API Compatibility Guide</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= Profiles View ================= */}
        {type === 'profiles' && (
          <div className="panel-section">
            <div className="profile-active-card">
              <div className="profile-avatar">DEV</div>
              <div className="profile-details">
                <span className="profile-name">Developer Workspace</span>
                <span className="profile-role">Primary Profile (Isolated)</span>
              </div>
              <UserCheck size={16} className="text-accent" />
            </div>

            <div className="panel-sub-header">Switch Profile</div>
            <div className="panel-list">
              <div className="profile-option-card">
                <div className="profile-opt-avatar">P</div>
                <div className="profile-opt-info">
                  <span className="profile-opt-name">Personal</span>
                  <span className="profile-opt-desc">Standard cookies & history</span>
                </div>
              </div>
              <div className="profile-option-card">
                <div className="profile-opt-avatar">G</div>
                <div className="profile-opt-info">
                  <span className="profile-opt-name">Guest / Ephemeral</span>
                  <span className="profile-opt-desc">Zero tracking, temporary session</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= Settings View ================= */}
        {type === 'settings' && (
          <div className="panel-section settings-section">
            {/* Search Engine */}
            <div className="setting-group">
              <label className="setting-label">Default Search Engine</label>
              <select
                className="setting-select"
                value={settings.searchEngine}
                onChange={(e) =>
                  onUpdateSettings({
                    searchEngine: e.target.value as BrowserSettings['searchEngine'],
                  })
                }
              >
                <option value="duckduckgo">DuckDuckGo (Privacy)</option>
                <option value="google">Google Search</option>
                <option value="brave">Brave Search</option>
                <option value="bing">Microsoft Bing</option>
              </select>
            </div>

            {/* Startup Session Behavior */}
            <div className="setting-group">
              <label className="setting-label">On Startup</label>
              <select
                className="setting-select"
                value={settings.restoreSessionOnStartup ? 'restore' : 'fresh'}
                onChange={(e) =>
                  onUpdateSettings({
                    restoreSessionOnStartup: e.target.value === 'restore',
                  })
                }
              >
                <option value="restore">Restore previous session</option>
                <option value="fresh">Start fresh with new tab</option>
              </select>
            </div>

            {/* Tab Layout Preference */}
            <div className="setting-group">
              <label className="setting-label">Tab Strip Layout</label>
              <select
                className="setting-select"
                value={settings.tabLayout || 'horizontal'}
                onChange={(e) =>
                  onUpdateSettings({
                    tabLayout: e.target.value as 'horizontal' | 'vertical',
                  })
                }
              >
                <option value="horizontal">Horizontal Tabs (Top)</option>
                <option value="vertical">Vertical Tabs (Left Sidebar)</option>
              </select>
            </div>

            {/* Extensions & Tools Management */}
            <div className="setting-group">
              <label className="setting-label">Extensions & Plugins</label>
              <div className="flex gap-2">
                <button
                  className="setting-action-btn flex-1"
                  onClick={onOpenExtensionsPage}
                  title="Open Extensions Manager (nexus://extensions)"
                >
                  <Puzzle size={13} />
                  <span>Manage</span>
                </button>
                <button
                  className="setting-action-btn flex-1"
                  onClick={onOpenCompatibility}
                  title="View Electron API Compatibility Guide"
                >
                  <HelpCircle size={13} />
                  <span>API Guide</span>
                </button>
              </div>
            </div>

            {/* Default Zoom Preset */}
            <div className="setting-group">
              <label className="setting-label">Default Page Zoom</label>
              <select
                className="setting-select"
                value={settings.defaultZoom}
                onChange={(e) => onUpdateSettings({ defaultZoom: Number(e.target.value) })}
              >
                <option value="0.8">80%</option>
                <option value="0.9">90%</option>
                <option value="1">100% (Standard)</option>
                <option value="1.1">110%</option>
                <option value="1.25">125%</option>
              </select>
            </div>

            {/* Clear Browsing Data */}
            <div className="setting-group">
              <label className="setting-label">Storage & Cache</label>
              <button
                className="setting-action-btn"
                onClick={handleClearCacheClick}
                disabled={clearingCache}
              >
                {clearingCache ? (
                  <RotateCw size={13} className="animate-spin" />
                ) : cacheCleared ? (
                  <Check size={13} className="text-green" />
                ) : (
                  <HardDrive size={13} />
                )}
                <span>
                  {clearingCache
                    ? 'Clearing...'
                    : cacheCleared
                    ? 'Cache Cleared!'
                    : 'Clear Cache & Storage'}
                </span>
              </button>
            </div>

            {/* System Diagnostic Information */}
            {systemInfo && (
              <div className="setting-group">
                <label className="setting-label">Environment Architecture</label>
                <div className="system-info-box">
                  <div className="sys-row">
                    <span>Engine:</span>
                    <code>Chromium v{systemInfo.chrome}</code>
                  </div>
                  <div className="sys-row">
                    <span>Shell:</span>
                    <code>Electron v{systemInfo.electron}</code>
                  </div>
                  <div className="sys-row">
                    <span>Runtime:</span>
                    <code>Node.js v{systemInfo.node}</code>
                  </div>
                  <div className="sys-row">
                    <span>Platform:</span>
                    <code>
                      {systemInfo.platform} ({systemInfo.arch})
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
