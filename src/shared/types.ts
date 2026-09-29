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
  sitePermissions?: boolean;
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

export type ThemePreference = 'dark' | 'light' | 'system';

export interface BrowserSettings {
  searchEngine: 'duckduckgo' | 'google' | 'brave' | 'bing';
  theme?: ThemePreference;
  reducedMotion?: boolean;
  defaultZoom: number;
  openDevToolsOnStart: boolean;
  hardwareAcceleration: boolean;
  restoreSessionOnStartup: boolean;
  tabLayout: 'horizontal' | 'vertical';
  showBookmarksBar?: boolean;
  defaultDownloadDirectory?: string;
  trackingProtectionMode?: TrackingProtectionMode;
  javascriptEnabled?: boolean;
  popupsBlocked?: boolean;
  thirdPartyCookiesBlocked?: boolean;
}

export interface SystemInfo {
  electron: string;
  chrome: string;
  node: string;
  platform: string;
  arch: string;
}

// User Profiles
export interface UserProfile {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: number;
  isDefault?: boolean;
}

// Site Permissions & Content Settings
export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'midi'
  | 'pointerLock'
  | 'fullscreen'
  | 'openExternal';

export type PermissionDecision = 'allow' | 'deny' | 'ask';

export interface SitePermissionRule {
  origin: string;
  permission: PermissionType;
  decision: PermissionDecision;
  updatedAt: number;
}

export interface PermissionPromptRequest {
  requestId: string;
  tabId: string;
  origin: string;
  permission: PermissionType;
  title: string;
}

// Security & Certificate Info
export interface CertificateInfo {
  subjectName: string;
  issuerName: string;
  validFrom: number;
  validTo: number;
  fingerprint: string;
  serialNumber: string;
  protocol?: string;
  cipher?: string;
}

export interface SiteSecurityInfo {
  url: string;
  origin: string;
  isSecure: boolean;
  status: 'secure' | 'insecure' | 'warning';
  certificate?: CertificateInfo;
  error?: string;
  blockedTrackersCount: number;
}

export interface CertificateErrorDetails {
  url: string;
  error: string;
  errorDescription: string;
  certificate?: CertificateInfo;
}

// Tracking Protection
export type TrackingProtectionMode = 'off' | 'standard' | 'strict';

export interface TrackingProtectionSettings {
  mode: TrackingProtectionMode;
  totalBlocked: number;
  exceptions: string[];
}

export interface ContentSettings {
  javascriptEnabled: boolean;
  popupsBlocked: boolean;
  thirdPartyCookiesBlocked: boolean;
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

export type SidePanelType = 'bookmarks' | 'downloads' | 'extensions' | 'profiles' | 'settings' | 'history' | 'devtools' | null;

// Developer Tools Types
export interface NetworkLogEntry {
  id: string;
  tabId: string;
  url: string;
  method: string;
  statusCode?: number;
  statusLine?: string;
  resourceType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  size?: number;
  error?: string;
  ip?: string;
}

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  session: boolean;
  expirationDate?: number;
  sameSite: 'unspecified' | 'no_restriction' | 'lax' | 'strict';
}

export interface StorageItem {
  key: string;
  value: string;
}

export interface StorageData {
  localStorage: StorageItem[];
  sessionStorage: StorageItem[];
}

export interface PageInfoDetails {
  url: string;
  title: string;
  viewportSize: { width: number; height: number };
  contentType?: string;
  security: SiteSecurityInfo;
  cookieCount: number;
  storageCount: number;
}

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
  userAgent?: string;
}

export interface ReaderArticle {
  title: string;
  byline?: string;
  siteName?: string;
  content: string;
  textContent: string;
  length: number;
  excerpt?: string;
  readingTimeMinutes: number;
}

export interface ReaderResult {
  success: boolean;
  article?: ReaderArticle;
  reason?: string;
}

export interface SiteZoomPreference {
  origin: string;
  zoomFactor: number;
  updatedAt: number;
}

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

  // Profiles Management
  getProfiles: () => Promise<UserProfile[]>;
  getActiveProfile: () => Promise<UserProfile>;
  createProfile: (name: string, icon: string, color: string) => Promise<UserProfile>;
  updateProfile: (id: string, updates: Partial<Pick<UserProfile, 'name' | 'icon' | 'color'>>) => Promise<UserProfile | null>;
  deleteProfile: (id: string) => Promise<boolean>;
  switchProfile: (id: string) => Promise<boolean>;

  // Site Permissions & Content Settings
  getSitePermissions: () => Promise<SitePermissionRule[]>;
  setSitePermission: (origin: string, permission: PermissionType, decision: PermissionDecision) => Promise<SitePermissionRule>;
  removeSitePermission: (origin: string, permission: PermissionType) => Promise<boolean>;
  clearAllSitePermissions: () => Promise<boolean>;
  respondPermissionPrompt: (requestId: string, allow: boolean, remember: boolean) => Promise<void>;

  // Security & Certificates
  getSiteSecurityInfo: (url: string) => Promise<SiteSecurityInfo>;

  // Tracking Protection
  getTrackingSettings: () => Promise<TrackingProtectionSettings>;
  setTrackingMode: (mode: TrackingProtectionMode) => Promise<void>;
  toggleTrackingException: (origin: string) => Promise<boolean>;

  // Developer Tools
  inspectElement: (tabId?: string) => Promise<void>;
  getPageInfo: (tabId?: string) => Promise<PageInfoDetails | null>;
  setDeviceEmulation: (tabId: string, preset: DevicePreset | null) => Promise<void>;
  viewPageSource: (tabId?: string) => Promise<void>;
  getCookiesForTab: (tabId?: string) => Promise<CookieItem[]>;
  removeCookie: (url: string, name: string) => Promise<boolean>;
  getStorageForTab: (tabId?: string) => Promise<StorageData>;
  clearStorageForTab: (tabId?: string, type?: 'all' | 'localStorage' | 'sessionStorage') => Promise<boolean>;
  getNetworkLogs: (tabId?: string) => Promise<NetworkLogEntry[]>;
  clearNetworkLogs: (tabId?: string) => Promise<void>;
  extractReaderMode: (tabId?: string) => Promise<ReaderResult>;
  getSiteZoom: (origin: string) => Promise<number>;
  setSiteZoom: (origin: string, zoomFactor: number) => Promise<void>;
  getAllSiteZooms: () => Promise<SiteZoomPreference[]>;

  // Event Listeners
  onTabsUpdated: (callback: (tabs: TabState[], activeTabId: string) => void) => () => void;
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  onExtensionsUpdated: (callback: (extensions: InstalledExtension[]) => void) => () => void;
  onBookmarksUpdated: (callback: (bookmarks: BookmarkItem[]) => void) => () => void;
  onHistoryUpdated: (callback: (history: HistoryEntry[]) => void) => () => void;
  onDownloadsUpdated: (callback: (downloads: DownloadRecord[]) => void) => () => void;
  onProfileSwitched: (callback: (profile: UserProfile) => void) => () => void;
  onPermissionPrompt: (callback: (prompt: PermissionPromptRequest) => void) => () => void;
  onTrackingStatsUpdated: (callback: (stats: { totalBlocked: number }) => void) => () => void;
  onNetworkActivity: (callback: (entry: NetworkLogEntry) => void) => () => void;
}

declare global {
  interface Window {
    nexusAPI: NexusAPI;
  }
}


