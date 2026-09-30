import React, { useState } from 'react';
import {
  BookmarkItem,
  BrowserSettings,
  DownloadRecord,
  ExtensionItem,
  HistoryEntry,
  SystemInfo,
  UserProfile,
  TrackingProtectionMode,
  ModeTelemetry,
  NexusBrowserMode,
  ModeBehaviorConfig,
} from '@shared/types';
import { SidePanelType } from './RightToolbar';
import { DeveloperToolsPanel } from './DeveloperToolsPanel';
import { NotesSidePanel } from './Notes/NotesSidePanel';
import { NexusState } from './NexusState';
import { ModeBehaviorControls } from './ModeBehaviorControls';
import {
  X,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Check,
  ShieldCheck,
  Shield,
  RotateCw,
  HardDrive,
  FolderOpen,
  UserCheck,
  CheckCircle2,
  Clock,
  FolderPlus,
  HelpCircle,
  Puzzle,
  Pause,
  Play,
  XCircle,
  Folder,
  Globe,
  FileCheck,
  Bookmark as BookmarkIcon,
  User,
  Sparkles,
  Zap,
  Flame,
  Compass,
  Sun,
} from 'lucide-react';

interface SidePanelProps {
  type: SidePanelType;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  onAddBookmark: () => void;
  onRemoveBookmark: (id: string) => void;
  onNavigate: (url: string) => void;
  onOpenBookmarksPage?: () => void;
  downloads: DownloadRecord[];
  onClearDownloads: () => void;
  onPauseDownload?: (id: string) => void;
  onResumeDownload?: (id: string) => void;
  onCancelDownload?: (id: string) => void;
  onOpenFile?: (id: string) => void;
  onShowInFolder?: (id: string) => void;
  onOpenDownloadsPage?: () => void;
  onChangeDownloadDirectory?: () => void;
  downloadDirectory?: string;
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
  history?: HistoryEntry[];
  onDeleteHistoryEntry?: (id: string) => void;
  onClearHistory?: () => void;
  onOpenHistoryPage?: () => void;
  onOpenClearDataModal?: () => void;
  profiles?: UserProfile[];
  activeProfile?: UserProfile | null;
  onOpenProfileModal?: () => void;
  onSwitchProfile?: (id: string) => void;
  onOpenPermissionsPage?: () => void;
  activeTabId?: string | null;
  onToggleDevTools?: () => void;
  onInspectElement?: () => void;
  onViewSource?: () => void;
  onToggleResponsive?: () => void;
  onOpenReaderMode?: () => void;
  onOpenJsonFormatter?: () => void;
  onOpenDevDashboard?: () => void;
  telemetry?: ModeTelemetry | null;
  onOptimizeMemory?: () => Promise<{ freedMemoryMB: number; suspendedCount: number }>;
  onSelectMode?: (mode: NexusBrowserMode) => void;
  onUpdateModeConfig?: (config: Partial<ModeBehaviorConfig>) => void;
  onRestoreDefaults?: () => void;
  onEnterFocusWorkspace?: () => void;
  activeTabTitle?: string;
  activeTabFavicon?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  type,
  onClose,
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onNavigate,
  onOpenBookmarksPage,
  downloads,
  onClearDownloads,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onOpenFile,
  onShowInFolder,
  onOpenDownloadsPage,
  onChangeDownloadDirectory,
  downloadDirectory,
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
  onDeleteHistoryEntry,
  onClearHistory,
  onOpenHistoryPage,
  onOpenClearDataModal,
  profiles = [],
  activeProfile,
  onOpenProfileModal,
  onSwitchProfile,
  onOpenPermissionsPage,
  activeTabId,
  onToggleDevTools,
  onInspectElement,
  onViewSource,
  onToggleResponsive,
  onOpenReaderMode,
  onOpenJsonFormatter,
  onOpenDevDashboard,
  currentUrl,
  telemetry,
  onOptimizeMemory,
  onSelectMode,
  onUpdateModeConfig,
  onRestoreDefaults,
  onEnterFocusWorkspace,
  activeTabTitle,
  activeTabFavicon,
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
      (b.url && b.url.toLowerCase().includes(bookmarkQuery.toLowerCase()))
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
          {type === 'devtools' && 'Developer Toolkit'}
          {type === 'notes' && 'Notes Companion'}
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
              <div className="panel-search-box flex-1">
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
                title={isBookmarked ? 'Edit bookmark' : 'Bookmark current tab'}
              >
                {isBookmarked ? <Check size={13} /> : <Plus size={13} />}
                <span>{isBookmarked ? 'Saved' : 'Add'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between px-1 my-2">
              <span className="text-[11px] text-muted">{filteredBookmarks.length} items</span>
              {onOpenBookmarksPage && (
                <button
                  className="text-[11px] text-accent hover:underline flex items-center gap-1"
                  onClick={onOpenBookmarksPage}
                >
                  <ExternalLink size={11} />
                  <span>Open Full Manager</span>
                </button>
              )}
            </div>

            <div className="panel-list">
              {filteredBookmarks.length === 0 ? (
                <NexusState variant="empty" title="No bookmarks yet" description="Save pages from the star in the address bar or import HTML." />
              ) : (
                filteredBookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="panel-list-item"
                    onClick={() => b.url && onNavigate(b.url)}
                  >
                    <div className="flex-shrink-0 mr-1.5 mt-0.5">
                      {b.type === 'folder' ? (
                        <Folder size={13} className="text-accent" />
                      ) : b.favicon ? (
                        <img
                          src={b.favicon}
                          alt=""
                          className="w-3.5 h-3.5 rounded-sm object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe size={13} className="text-secondary" />
                      )}
                    </div>
                    <div className="item-meta">
                      <span className="item-title">{b.title}</span>
                      {b.url && <span className="item-sub font-mono">{b.url}</span>}
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
              <div className="panel-search-box flex-1">
                <Search size={13} className="panel-search-icon" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  className="panel-search-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1 my-2">
              {onOpenClearDataModal && (
                <button
                  className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                  onClick={onOpenClearDataModal}
                >
                  <Trash2 size={11} />
                  <span>Clear data...</span>
                </button>
              )}
              {onOpenHistoryPage && (
                <button
                  className="text-[11px] text-accent hover:underline flex items-center gap-1"
                  onClick={onOpenHistoryPage}
                >
                  <ExternalLink size={11} />
                  <span>Full History</span>
                </button>
              )}
            </div>

            <div className="panel-list">
              {filteredHistory.length === 0 ? (
                <NexusState variant="empty" title="No history yet" description="Pages you visit will appear here (private tabs excluded)." />
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="panel-list-item history-list-item"
                    onClick={() => onNavigate(item.url)}
                  >
                    <div className="item-meta">
                      <span className="item-title">{item.title || item.url}</span>
                      <span className="item-sub font-mono">{item.url}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="history-item-badge">
                        <Clock size={11} className="text-secondary" />
                        <span className="history-timestamp">{formatTime(item.timestamp)}</span>
                      </div>
                      {onDeleteHistoryEntry && (
                        <button
                          className="item-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistoryEntry(item.id);
                          }}
                          title="Delete from history"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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
              <span className="text-secondary text-xs">{downloads.length} downloads</span>
              <div className="flex items-center gap-2">
                {downloads.length > 0 && (
                  <button className="panel-text-btn" onClick={onClearDownloads}>
                    Clear finished
                  </button>
                )}
                {onOpenDownloadsPage && (
                  <button
                    className="text-[11px] text-accent hover:underline flex items-center gap-1"
                    onClick={onOpenDownloadsPage}
                  >
                    <ExternalLink size={11} />
                    <span>Full page</span>
                  </button>
                )}
              </div>
            </div>

            <div className="panel-list">
              {downloads.length === 0 ? (
                <NexusState variant="empty" title="No downloads" description="Files you download will show up here with progress and actions." />
              ) : (
                downloads.map((d) => {
                  const isProgressing = d.status === 'progressing';
                  const isPaused = d.status === 'paused';
                  const isCompleted = d.status === 'completed';

                  return (
                    <div key={d.id} className="download-item-card">
                      <div className="download-info">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isCompleted ? (
                            <FileCheck size={13} className="text-emerald-400 flex-shrink-0" />
                          ) : (
                            <FolderOpen size={13} className="text-secondary flex-shrink-0" />
                          )}
                          <span className="download-filename truncate" title={d.filename}>
                            {d.filename}
                          </span>
                        </div>
                        <span className="download-size">{d.filesize}</span>
                      </div>

                      {isProgressing || isPaused ? (
                        <div className="space-y-1 mt-1.5">
                          <div className="download-progress-track">
                            <div
                              className={`download-progress-bar ${isPaused ? 'bg-amber-400' : ''}`}
                              style={{ width: `${d.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted">
                            <span>{d.progress}%</span>
                            {d.speed && <span className="font-mono text-accent">{d.speed}</span>}
                            <div className="flex items-center gap-1">
                              {isProgressing && onPauseDownload && (
                                <button
                                  className="text-muted hover:text-primary"
                                  onClick={() => onPauseDownload(d.id)}
                                  title="Pause"
                                >
                                  <Pause size={10} />
                                </button>
                              )}
                              {isPaused && onResumeDownload && (
                                <button
                                  className="text-muted hover:text-primary"
                                  onClick={() => onResumeDownload(d.id)}
                                  title="Resume"
                                >
                                  <Play size={10} />
                                </button>
                              )}
                              {onCancelDownload && (
                                <button
                                  className="text-muted hover:text-red-400"
                                  onClick={() => onCancelDownload(d.id)}
                                  title="Cancel"
                                >
                                  <XCircle size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : isCompleted ? (
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 size={11} />
                            <span>Finished</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {onOpenFile && (
                              <button
                                className="text-accent hover:underline"
                                onClick={() => onOpenFile(d.id)}
                              >
                                Open
                              </button>
                            )}
                            {onShowInFolder && (
                              <button
                                className="text-muted hover:text-primary"
                                onClick={() => onShowInFolder(d.id)}
                              >
                                Show
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-red-400 mt-1">Interrupted</div>
                      )}
                    </div>
                  );
                })
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
            {activeProfile && (
              <div
                className="profile-active-card"
                style={{ borderLeft: `3px solid ${activeProfile.color}` }}
              >
                <div
                  className="profile-avatar"
                  style={{
                    backgroundColor: `${activeProfile.color}25`,
                    color: activeProfile.color,
                  }}
                >
                  <User size={16} />
                </div>
                <div className="profile-details">
                  <span className="profile-name">{activeProfile.name}</span>
                  <span className="profile-role">Active Session & Data</span>
                </div>
                <UserCheck size={16} style={{ color: activeProfile.color }} />
              </div>
            )}

            <div className="panel-sub-header">Switch Profile</div>
            <div className="panel-list">
              {profiles
                .filter((p) => p.id !== activeProfile?.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className="profile-option-card"
                    onClick={() => onSwitchProfile?.(p.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      className="profile-opt-avatar"
                      style={{
                        backgroundColor: `${p.color}20`,
                        color: p.color,
                      }}
                    >
                      <User size={14} />
                    </div>
                    <div className="profile-opt-info">
                      <span className="profile-opt-name">{p.name}</span>
                      <span className="profile-opt-desc">Isolated cookies & history</span>
                    </div>
                    <button
                      className="nexus-btn-ghost text-xs px-2 py-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchProfile?.(p.id);
                      }}
                    >
                      Switch
                    </button>
                  </div>
                ))}
            </div>

            <div className="pt-3">
              <button
                className="nexus-btn-secondary w-full flex items-center justify-center gap-1.5 py-1.5 text-xs"
                onClick={onOpenProfileModal}
              >
                <Plus size={13} />
                <span>Manage & Create Profiles...</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= Settings View ================= */}
        {type === 'settings' && (
          <div className="panel-section settings-section">
            {/* Browser Mode */}
            <div className="setting-group modes-settings-group">
              <div className="flex items-center justify-between mb-2">
                <label className="setting-label text-[13px] font-semibold text-primary">Browser Modes</label>
                <span className="text-[11px] text-muted">1-Click Visual & Behavioral Profiles</span>
              </div>
              <div className="mode-cards-container" role="radiogroup" aria-label="Browser Modes">
                {/* Default Mode Card */}
                <div
                  tabIndex={0}
                  role="radio"
                  aria-checked={!settings.mode || settings.mode === 'default'}
                  aria-label="Default Mode"
                  className={`mode-card mode-card-default ${(!settings.mode || settings.mode === 'default') ? 'active' : ''}`}
                  onClick={() => onSelectMode ? onSelectMode('default') : onUpdateSettings({ mode: 'default' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMode ? onSelectMode('default') : onUpdateSettings({ mode: 'default' });
                    }
                  }}
                >
                  <div className="mode-card-header">
                    <div className="mode-card-title-group">
                      <div className="mode-icon-box" style={{ background: '#A78BFA18', borderColor: '#A78BFA33' }}>
                        <Compass size={14} className="text-[#A78BFA]" />
                      </div>
                      <div>
                        <span className="mode-card-title">Default Mode</span>
                      </div>
                    </div>
                    {(!settings.mode || settings.mode === 'default') && (
                      <span className="mode-active-pill" style={{ background: '#A78BFA', color: '#0B0D12' }}>
                        <Check size={10} strokeWidth={2.5} /> Active
                      </span>
                    )}
                  </div>

                  {/* Large Miniature Browser Chrome Preview */}
                  <div className="mode-mini-browser mode-mini-default">
                    <div className="mini-browser-bar">
                      <div className="mini-dots">
                        <span className="mini-dot red" />
                        <span className="mini-dot yellow" />
                        <span className="mini-dot green" />
                      </div>
                      <div className="mini-tabs">
                        <div className="mini-tab active-default">NEXUS</div>
                        <div className="mini-tab">Tab</div>
                      </div>
                    </div>
                    <div className="mini-browser-content">
                      <div className="mini-omnibox mini-omnibox-default">
                        <span className="mini-badge-dot" style={{ backgroundColor: '#A78BFA' }} />
                        <span className="mini-url">nexus://newtab</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual & Functional Breakdown */}
                  <div className="mode-details-block">
                    <div className="mode-detail-item">
                      <span className="mode-detail-tag">Visual:</span>
                      <span className="mode-detail-text">Dark surfaces, fluid 150ms transitions, full backdrop blur and glowing accents.</span>
                    </div>
                    <div className="mode-detail-item">
                      <span className="mode-detail-tag">Functional:</span>
                      <span className="mode-detail-text">Standard Chromium background timers. Retains all background tabs in renderer memory.</span>
                    </div>
                  </div>

                  <div className="mode-palette-preview">
                    {['#0B0D12', '#12151D', '#191D28', '#A78BFA'].map((c, i) => (
                      <div key={i} className="mode-palette-swatch" style={{ backgroundColor: c }} title={c}>
                        <span className="swatch-hex">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balanced Mode Card */}
                <div
                  tabIndex={0}
                  role="radio"
                  aria-checked={settings.mode === 'balanced'}
                  aria-label="Balanced Mode"
                  className={`mode-card mode-card-balanced ${settings.mode === 'balanced' ? 'active' : ''}`}
                  onClick={() => onSelectMode ? onSelectMode('balanced') : onUpdateSettings({ mode: 'balanced' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMode ? onSelectMode('balanced') : onUpdateSettings({ mode: 'balanced' });
                    }
                  }}
                >
                  <div className="mode-card-header">
                    <div className="mode-card-title-group">
                      <div className="mode-icon-box" style={{ background: '#F5C54218', borderColor: '#F5C54233' }}>
                        <Sun size={14} style={{ color: '#F5C542' }} />
                      </div>
                      <div>
                        <span className="mode-card-title">Balanced Mode</span>
                      </div>
                    </div>
                    {settings.mode === 'balanced' && (
                      <span className="mode-active-pill" style={{ background: '#F5C542', color: '#0C0B08' }}>
                        <Check size={10} strokeWidth={2.5} /> Active
                      </span>
                    )}
                  </div>

                  {/* Large Miniature Browser Chrome Preview */}
                  <div className="mode-mini-browser mode-mini-balanced">
                    <div className="mini-browser-bar">
                      <div className="mini-dots">
                        <span className="mini-dot red" />
                        <span className="mini-dot yellow" />
                        <span className="mini-dot green" />
                      </div>
                      <div className="mini-tabs">
                        <div className="mini-tab active-balanced">Focus</div>
                        <div className="mini-tab">Study</div>
                      </div>
                    </div>
                    <div className="mini-browser-content">
                      <div className="mini-omnibox mini-omnibox-balanced">
                        <span className="mini-badge-dot" style={{ backgroundColor: '#F5C542' }} />
                        <span className="mini-url">nexus://focus</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual & Functional Breakdown */}
                  <div className="mode-details-block">
                    <div className="mode-detail-item">
                      <span className="mode-detail-tag">Visual:</span>
                      <span className="mode-detail-text">Warm dark surfaces with rich gold accents and 2px golden focus rings.</span>
                    </div>
                    <div className="mode-detail-item">
                      <span className="mode-detail-tag">Functional:</span>
                      <span className="mode-detail-text">Distraction reduction, optional Focus Session workspace, and collapsible minimalist toolbar.</span>
                    </div>
                  </div>

                  <div className="mode-palette-preview">
                    {['#090909', '#14120C', '#211B0D', '#F5C542'].map((c, i) => (
                      <div key={i} className="mode-palette-swatch" style={{ backgroundColor: c }} title={c}>
                        <span className="swatch-hex">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Mode Card */}
                <div
                  tabIndex={0}
                  role="radio"
                  aria-checked={settings.mode === 'performance'}
                  aria-label="Performance Mode"
                  className={`mode-card mode-card-performance ${settings.mode === 'performance' ? 'active' : ''}`}
                  onClick={() => onSelectMode ? onSelectMode('performance') : onUpdateSettings({ mode: 'performance' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMode ? onSelectMode('performance') : onUpdateSettings({ mode: 'performance' });
                    }
                  }}
                >
                  <div className="mode-card-header">
                    <div className="mode-card-title-group">
                      <div className="mode-icon-box" style={{ background: '#F02D4318', borderColor: '#F02D4333' }}>
                        <Zap size={14} style={{ color: '#F02D43' }} />
                      </div>
                      <div>
                        <span className="mode-card-title">Performance Mode</span>
                      </div>
                    </div>
                    {settings.mode === 'performance' && (
                      <span className="mode-active-pill" style={{ background: '#F02D43', color: '#FFFFFF' }}>
                        <Check size={10} strokeWidth={2.5} /> Active
                      </span>
                    )}
                  </div>

                  {/* Large Miniature Browser Chrome Preview */}
                  <div className="mode-mini-browser mode-mini-performance">
                    <div className="mini-browser-bar">
                      <div className="mini-dots">
                        <span className="mini-dot red" />
                        <span className="mini-dot yellow" />
                        <span className="mini-dot green" />
                      </div>
                      <div className="mini-tabs">
                        <div className="mini-tab active-performance">Fast</div>
                        <div className="mini-tab">Sleep</div>
                      </div>
                    </div>
                    <div className="mini-browser-content">
                      <div className="mini-omnibox mini-omnibox-performance">
                        <span className="mini-badge-dot" style={{ backgroundColor: '#F02D43' }} />
                        <span className="mini-url">0.01ms latency</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual & Functional Breakdown */}
                  <div className="mode-details-block">
                    <div className="mode-detail-item">
                      <span className="mode-detail-tag">Visual:</span>
                      <span className="mode-detail-text">Deep carbon surfaces with crimson accents. Zero-latency (0.01ms) instant bypass; disables GPU filters and shadows.</span>
                    </div>
                    <div className="mode-detail-item">
                      <span className="mode-detail-tag">Functional:</span>
                      <span className="mode-detail-text">Aggressive background tab throttling and configurable inactivity tab memory unloading.</span>
                    </div>
                  </div>

                  <div className="mode-palette-preview">
                    {['#080809', '#121214', '#1C1719', '#F02D43'].map((c, i) => (
                      <div key={i} className="mode-palette-swatch" style={{ backgroundColor: c }} title={c}>
                        <span className="swatch-hex">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mode Behavioral Settings & Telemetry */}
              <ModeBehaviorControls
                currentMode={settings.mode || 'default'}
                settings={settings}
                telemetry={telemetry || null}
                onUpdateSettings={onUpdateSettings}
                onUpdateModeConfig={onUpdateModeConfig}
                onRestoreDefaults={onRestoreDefaults}
                onEnterFocusWorkspace={onEnterFocusWorkspace}
                onOptimizeMemory={onOptimizeMemory}
              />
            </div>

            {/* Appearance */}
            <div className="setting-group">
              <label className="setting-label">Theme Contrast</label>
              <select
                className="setting-select"
                value={settings.theme || 'dark'}
                onChange={(e) =>
                  onUpdateSettings({
                    theme: e.target.value as BrowserSettings['theme'],
                  })
                }
                aria-label="Color theme"
              >
                <option value="dark">Dark (default)</option>
                <option value="light">Light</option>
                <option value="system">Match system</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={settings.reducedMotion ?? false}
                  onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                />
                <span className="text-xs text-primary">Reduce motion (overrides OS preference)</span>
              </label>
            </div>

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

            {/* Bookmarks Bar Visibility */}
            <div className="setting-group">
              <label className="setting-label">Bookmarks Bar</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={settings.showBookmarksBar ?? true}
                  onChange={(e) => onUpdateSettings({ showBookmarksBar: e.target.checked })}
                />
                <span className="text-xs text-primary">Always show bookmarks bar</span>
              </label>
            </div>

            {/* Download Location */}
            <div className="setting-group">
              <label className="setting-label">Downloads Folder</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={downloadDirectory || 'Default Downloads folder'}
                  className="nexus-input text-xs font-mono flex-1 bg-[var(--bg-elevated)] text-muted truncate"
                />
                {onChangeDownloadDirectory && (
                  <button
                    className="nexus-btn-sm nexus-btn-secondary text-xs px-2 py-1 flex-shrink-0"
                    onClick={onChangeDownloadDirectory}
                  >
                    Change
                  </button>
                )}
              </div>
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

            {/* NEXUS Shield & Protection */}
            <div className="setting-group">
              <div className="flex-row items-center justify-between mb-1">
                <label className="setting-label">NEXUS Shield</label>
                <button
                  type="button"
                  className="nexus-btn-ghost text-xs py-0 px-1"
                  onClick={() => onNavigate('nexus://shield')}
                  title="Open full Shield dashboard"
                >
                  Dashboard
                </button>
              </div>
              <button
                type="button"
                className="setting-action-btn mb-2"
                onClick={() => onNavigate('nexus://shield')}
                title="View blocked ads, trackers, and filter lists"
              >
                <ShieldCheck size={14} className="text-accent" />
                <span>Shield Dashboard (nexus://shield)</span>
              </button>

              <label className="setting-label text-xs text-muted">Tracking Protection Mode</label>
              <select
                className="setting-select"
                value={settings.trackingProtectionMode || 'standard'}
                onChange={(e) => {
                  const mode = e.target.value as TrackingProtectionMode;
                  onUpdateSettings({ trackingProtectionMode: mode });
                  window.nexusAPI.setTrackingMode(mode);
                }}
              >
                <option value="standard">Standard (Recommended - Blocks known trackers)</option>
                <option value="strict">Strict (Maximum Privacy Protection)</option>
                <option value="off">Off (Allow All Trackers)</option>
              </select>
            </div>

            {/* Site Permissions */}
            <div className="setting-group">
              <label className="setting-label">Site Permissions</label>
              <button
                className="setting-action-btn"
                onClick={onOpenPermissionsPage || (() => onNavigate('nexus://permissions'))}
                title="Manage camera, microphone, geolocation, and notification permissions"
              >
                <Shield size={13} className="text-accent" />
                <span>Manage Site Permissions (nexus://permissions)</span>
              </button>
            </div>

            {/* Clear Browsing Data Dialog Button */}
            <div className="setting-group">
              <label className="setting-label">Privacy & Data</label>
              <button
                className="setting-action-btn"
                onClick={onOpenClearDataModal || handleClearCacheClick}
              >
                <Trash2 size={13} className="text-red-400" />
                <span>Clear Browsing Data...</span>
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

        {type === 'devtools' && (
          <DeveloperToolsPanel
            currentUrl={currentUrl}
            activeTabId={activeTabId || null}
            onNavigate={onNavigate}
            onToggleDevTools={onToggleDevTools || (() => {})}
            onInspectElement={onInspectElement || (() => {})}
            onViewSource={onViewSource || (() => {})}
            onToggleResponsive={onToggleResponsive || (() => {})}
            onOpenReaderMode={onOpenReaderMode || (() => {})}
            onOpenJsonFormatter={onOpenJsonFormatter || (() => {})}
            onOpenDevDashboard={onOpenDevDashboard || (() => onNavigate('nexus://dev'))}
          />
        )}

        {type === 'notes' && (
          <NotesSidePanel
            onNavigate={onNavigate}
            activeTabUrl={currentUrl}
            activeTabTitle={activeTabTitle}
            activeTabFavicon={activeTabFavicon}
          />
        )}
      </div>
    </div>
  );
};
