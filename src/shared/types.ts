export interface TabState {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  workspaceId?: string;
  isPinned?: boolean;
  groupId?: string;
  isSecure?: boolean;
  errorCode?: number;
  errorDescription?: string;
}

export interface ContentBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: number;
  category?: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  filesize: string;
  progress: number; // 0 - 100
  status: 'completed' | 'in_progress' | 'cancelled';
  timestamp: number;
}

export interface ExtensionItem {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export interface BrowserSettings {
  searchEngine: 'duckduckgo' | 'google' | 'brave' | 'bing';
  defaultZoom: number;
  openDevToolsOnStart: boolean;
  hardwareAcceleration: boolean;
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
  createTab: (url?: string, workspaceId?: string) => Promise<string>;
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
  
  // Layout Bounds & Modal Visibility
  updateContentBounds: (bounds: ContentBounds) => Promise<void>;
  setModalOpen: (isOpen: boolean) => Promise<void>;

  // Zoom & Storage
  setZoomLevel: (level: number) => Promise<number>;
  getZoomLevel: () => Promise<number>;
  clearBrowsingData: () => Promise<void>;
  getSystemInfo: () => Promise<SystemInfo>;

  // Window Controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;

  // Event Listeners
  onTabsUpdated: (callback: (tabs: TabState[], activeTabId: string) => void) => () => void;
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    nexusAPI: NexusAPI;
  }
}
