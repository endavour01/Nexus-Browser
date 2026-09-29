export interface TabState {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  workspaceId: string;
  isPinned?: boolean;
  groupId?: string;
  isMuted?: boolean;
  hasAudio?: boolean;
  isSecure?: boolean;
  isPrivate?: boolean;
  errorCode?: number;
  errorDescription?: string;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed?: boolean;
}

export interface PinnedSiteItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface WorkspaceLayout {
  sidebarCollapsed?: boolean;
  tabLayout?: 'horizontal' | 'vertical';
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  isolatedSession?: boolean;
  pinnedSites?: PinnedSiteItem[];
  layout?: WorkspaceLayout;
}

export interface RecentlyClosedTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  workspaceId: string;
  groupId?: string;
  closedAt: number;
}

export interface SavedSessionData {
  version: number;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  groups: TabGroup[];
  tabs: Array<{
    id: string;
    url: string;
    title: string;
    favicon?: string;
    workspaceId: string;
    groupId?: string;
    isPinned?: boolean;
    isMuted?: boolean;
  }>;
  activeTabId: string | null;
  recentlyClosed: RecentlyClosedTab[];
}

export interface ContentBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface BookmarkItem {
  id: string;
  type: 'bookmark' | 'folder';
  title: string;
  url?: string;
  favicon?: string;
  parentId?: string | null; // 'toolbar' | 'other' | custom folder id | null
  createdAt: number;
  updatedAt?: number;
}

export type Bookmark = BookmarkItem;

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  timestamp: number;
  visitCount: number;
}

export interface ClearDataOptions {
  timeRange: '1h' | '24h' | '7d' | '4w' | 'all';
  history: boolean;
  downloads: boolean;
  cookies: boolean;
  cache: boolean;
}

export interface DownloadRecord {
  id: string;
  filename: string;
  url: string;
  savePath: string;
  mimeType?: string;
  receivedBytes: number;
  totalBytes: number;
  filesize: string;
  speed: string;
  progress: number; // 0 - 100
  status: 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted';
  stateReason?: string;
  startTime: number;
  endTime?: number;
  canResume: boolean;
}

export type DownloadItem = DownloadRecord;

export interface ExtensionCompatibility {
  status: 'compatible' | 'partially_compatible' | 'incompatible';
  notes: string[];
  unsupportedPermissions: string[];
}

export interface ExtensionPermissionWarning {
  permission: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface InstalledExtension {
  id: string;
  name: string;
  version: string;
  description: string;
  path: string;
  enabled: boolean;
  manifestVersion: number;
  permissions: string[];
  hostPermissions: string[];
  icons?: Record<string, string>;
  iconDataUrl?: string;
  action?: {
    title?: string;
    popup?: string;
    icon?: string;
  };
  homepageUrl?: string;
  installedAt: number;
  compatibility: ExtensionCompatibility;
  error?: string;
}

export type ExtensionItem = InstalledExtension;

export interface ExtensionValidationResult {
  valid: boolean;
  name: string;
  version: string;
  description: string;
  manifestVersion: number;
  path: string;
  permissions: string[];
  hostPermissions: string[];
  warnings: ExtensionPermissionWarning[];
  compatibility: ExtensionCompatibility;
  action?: {
    title?: string;
    popup?: string;
    icon?: string;
  };
  iconDataUrl?: string;
  error?: string;
}

export interface BrowserSettings {
  searchEngine: 'duckduckgo' | 'google' | 'brave' | 'bing';
  defaultZoom: number;
  openDevToolsOnStart: boolean;
  hardwareAcceleration: boolean;
  restoreSessionOnStartup: boolean;
  tabLayout: 'horizontal' | 'vertical';
  showBookmarksBar?: boolean;
  defaultDownloadDirectory?: string;
}

export interface SystemInfo {
  electron: string;
  chrome: string;
  node: string;
  platform: string;
  arch: string;
}

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Tabs' | 'Navigation' | 'Workspaces' | 'Tools' | 'Bookmarks & History' | 'Developer';
  shortcut?: string;
  icon?: string;
  action: () => void;
}

export interface RecentPage {
  title: string;
  url: string;
  timestamp: number;
}

export type SidePanelType = 'bookmarks' | 'downloads' | 'extensions' | 'profiles' | 'settings' | 'history' | null;

export interface NexusAPI {
  // Tab Management
  createTab: (url?: string, workspaceId?: string, isPrivate?: boolean) => Promise<string>;
  createBackgroundTab: (url: string, workspaceId?: string) => Promise<string>;
  duplicateTab: (id: string) => Promise<string | null>;
  reopenClosedTab: () => Promise<string | null>;
  closeTab: (id: string) => Promise<void>;
  switchTab: (id: string) => Promise<void>;
  navigate: (id: string, url: string) => Promise<void>;
  goBack: (id: string) => Promise<void>;
  goForward: (id: string) => Promise<void>;
  reload: (id: string) => Promise<void>;
  stop: (id: string) => Promise<void>;
  toggleDevTools: (id?: string) => Promise<void>;
  
  // Tab Controls & Grouping
  muteTab: (id: string) => Promise<boolean>;
  pinTab: (id: string) => Promise<boolean>;
  setTabGroup: (id: string, groupId?: string) => Promise<void>;
  reorderTabs: (orderedIds: string[]) => Promise<void>;
  moveTabToWorkspace: (id: string, workspaceId: string) => Promise<void>;

  // Workspaces & Sessions
  switchWorkspace: (workspaceId: string, tabId?: string) => Promise<void>;
  saveSession: (data: SavedSessionData) => Promise<void>;
  restoreSession: () => Promise<SavedSessionData | null>;
  clearSession: () => Promise<void>;
  
  // Layout Bounds & Modal Visibility
  updateContentBounds: (bounds: ContentBounds) => Promise<void>;
  setModalOpen: (isOpen: boolean) => Promise<void>;

  // Zoom & Storage
  setZoomLevel: (level: number) => Promise<number>;
  getZoomLevel: () => Promise<number>;
  clearBrowsingData: () => Promise<void>;
  clearBrowsingDataDetailed: (options: ClearDataOptions) => Promise<void>;
  getSystemInfo: () => Promise<SystemInfo>;

  // Window Controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;

  // Extensions Management
  selectExtensionDirectory: () => Promise<string | null>;
  validateExtension: (folderPath: string) => Promise<ExtensionValidationResult>;
  installExtension: (folderPath: string) => Promise<InstalledExtension>;
  uninstallExtension: (extensionId: string) => Promise<boolean>;
  toggleExtension: (extensionId: string, enabled: boolean) => Promise<boolean>;
  reloadExtension: (extensionId: string) => Promise<boolean>;
  getInstalledExtensions: () => Promise<InstalledExtension[]>;
  openExtensionPopup: (extensionId: string) => Promise<void>;

  // Bookmarks Management
  getBookmarks: () => Promise<BookmarkItem[]>;
  saveBookmark: (item: { id?: string; title: string; url?: string; favicon?: string; parentId?: string | null; type?: 'bookmark' | 'folder' }) => Promise<BookmarkItem>;
  createBookmarkFolder: (title: string, parentId?: string | null) => Promise<BookmarkItem>;
  removeBookmark: (id: string) => Promise<boolean>;
  exportBookmarksHtml: () => Promise<string>;
  importBookmarksHtml: (htmlContent: string) => Promise<{ imported: number }>;

  // History Management
  getHistory: (limit?: number) => Promise<HistoryEntry[]>;
  searchHistory: (query: string, limit?: number) => Promise<HistoryEntry[]>;
  deleteHistoryEntry: (id: string) => Promise<boolean>;
  deleteHistoryRange: (startTime: number, endTime: number) => Promise<number>;
  clearAllHistory: () => Promise<boolean>;

  // Downloads Management
  getDownloads: () => Promise<DownloadRecord[]>;
  pauseDownload: (id: string) => Promise<boolean>;
  resumeDownload: (id: string) => Promise<boolean>;
  cancelDownload: (id: string) => Promise<boolean>;
  openDownloadFile: (id: string) => Promise<boolean>;
  showDownloadInFolder: (id: string) => Promise<boolean>;
  getDownloadDirectory: () => Promise<string>;
  setDownloadDirectory: () => Promise<string | null>;
  clearDownloadsList: () => Promise<void>;
  removeDownloadEntry: (id: string) => Promise<boolean>;

  // Event Listeners
  onTabsUpdated: (callback: (tabs: TabState[], activeTabId: string) => void) => () => void;
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  onExtensionsUpdated: (callback: (extensions: InstalledExtension[]) => void) => () => void;
  onBookmarksUpdated: (callback: (bookmarks: BookmarkItem[]) => void) => () => void;
  onHistoryUpdated: (callback: (history: HistoryEntry[]) => void) => () => void;
  onDownloadsUpdated: (callback: (downloads: DownloadRecord[]) => void) => () => void;
}

declare global {
  interface Window {
    nexusAPI: NexusAPI;
  }
}


