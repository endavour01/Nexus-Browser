import { BrowserWindow, WebContentsView, session } from 'electron';
import { ContentBounds, SavedSessionData, TabState } from '../shared/types';
import { SessionStore } from './session-store';
import { HistoryStore } from './history-store';

interface ManagedTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  workspaceId: string;
  isPinned: boolean;
  groupId?: string;
  isMuted: boolean;
  hasAudio: boolean;
  isSecure: boolean;
  isPrivate: boolean;
  errorCode?: number;
  errorDescription?: string;
  view: WebContentsView;
}

interface ClosedTabRecord {
  url: string;
  title: string;
  workspaceId: string;
  favicon?: string;
  groupId?: string;
  closedAt: number;
}

export class TabManager {
  private tabs: Map<string, ManagedTab> = new Map();
  private closedTabs: ClosedTabRecord[] = [];
  private activeTabId: string | null = null;
  private activeWorkspaceId: string = 'default';
  private isolatedWorkspaces: Set<string> = new Set();
  private mainWindow: BrowserWindow;
  private sessionStore: SessionStore = new SessionStore();
  private historyStore: HistoryStore = new HistoryStore();
  private bounds: ContentBounds = {
    top: 84,
    left: 210,
    right: 44,
    bottom: 24,
  };
  private searchEngine: string = 'duckduckgo';
  private isModalOpen: boolean = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupPermissions();
  }

  public setModalOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (!this.activeTabId) return;
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return;
    const isNewTab = tab.url === 'nexus://newtab' || tab.url === '';

    if (isOpen) {
      try {
        if (typeof tab.view.setVisible === 'function') {
          tab.view.setVisible(false);
        } else {
          this.mainWindow.contentView.removeChildView(tab.view);
        }
      } catch (e) {}
    } else {
      if (!isNewTab) {
        try {
          const children = this.mainWindow.contentView.children;
          if (!children.includes(tab.view)) {
            this.mainWindow.contentView.addChildView(tab.view);
          }
          if (typeof tab.view.setVisible === 'function') {
            tab.view.setVisible(true);
          }
          this.updateActiveTabBounds();
        } catch (e) {}
      }
    }
  }

  private setupPermissions() {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      const allowedPermissions = ['fullscreen', 'clipboard-read', 'clipboard-sanitized-write'];
      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        console.warn(`[NEXUS Security] Blocked device permission request: ${permission}`);
        callback(false);
      }
    });
  }

  public setContentBounds(bounds: Partial<ContentBounds>) {
    this.bounds = {
      top: typeof bounds.top === 'number' ? bounds.top : this.bounds.top,
      left: typeof bounds.left === 'number' ? bounds.left : this.bounds.left,
      right: typeof bounds.right === 'number' ? bounds.right : this.bounds.right,
      bottom: typeof bounds.bottom === 'number' ? bounds.bottom : this.bounds.bottom,
    };
    this.updateActiveTabBounds();
  }

  public setSearchEngine(engine: string) {
    this.searchEngine = engine;
  }

  public setIsolatedWorkspaces(workspaceIds: string[]) {
    this.isolatedWorkspaces = new Set(workspaceIds);
  }

  public getActiveTabId(): string | null {
    return this.activeTabId;
  }

  public getActiveWorkspaceId(): string {
    return this.activeWorkspaceId;
  }

  public getTabState(tabId: string): TabState | undefined {
    const t = this.tabs.get(tabId);
    if (!t) return undefined;
    return {
      id: t.id,
      url: t.url,
      title: t.title,
      favicon: t.favicon,
      isLoading: t.isLoading,
      canGoBack: t.canGoBack,
      canGoForward: t.canGoForward,
      workspaceId: t.workspaceId,
      isPinned: t.isPinned,
      groupId: t.groupId,
      isMuted: t.isMuted,
      hasAudio: t.hasAudio,
      isSecure: t.isSecure,
      isPrivate: t.isPrivate,
      errorCode: t.errorCode,
      errorDescription: t.errorDescription,
    };
  }

  public getView(tabId: string): WebContentsView | undefined {
    return this.tabs.get(tabId)?.view;
  }

  public isViewVisible(tabId: string): boolean {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;
    if (this.activeTabId !== tabId) return false;
    const isInternal = tab.url.startsWith('nexus://') || tab.url === '';
    if (isInternal) return false;
    if (this.isModalOpen) return false;
    return this.mainWindow.contentView.children.includes(tab.view);
  }

  public handleTabNavigationForTesting(
    tabId: string,
    url: string,
    title?: string,
    favicon?: string
  ) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.url = url;
    if (title) tab.title = title;
    if (favicon) tab.favicon = favicon;
    if (!tab.isPrivate && tab.url && !tab.url.startsWith('nexus://')) {
      this.historyStore.addEntry(tab.title, tab.url, tab.favicon);
    }
    this.notifyTabsUpdated();
  }

  public getAllTabStates(): TabState[] {
    return Array.from(this.tabs.values()).map((t) => ({
      id: t.id,
      url: t.url,
      title: t.title,
      favicon: t.favicon,
      isLoading: t.isLoading,
      canGoBack: t.canGoBack,
      canGoForward: t.canGoForward,
      workspaceId: t.workspaceId,
      isPinned: t.isPinned,
      groupId: t.groupId,
      isMuted: t.isMuted,
      hasAudio: t.hasAudio,
      isSecure: t.isSecure,
      isPrivate: t.isPrivate,
      errorCode: t.errorCode,
      errorDescription: t.errorDescription,
    }));
  }

  public isValidProtocol(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('nexus://')) return true;
    if (trimmed.startsWith('https://')) return true;
    if (trimmed.startsWith('http://')) return true;
    if (trimmed.startsWith('view-source:')) return true;
    return false;
  }

  public isUnsafeProtocol(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    return (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('file:') ||
      trimmed.startsWith('data:text/html')
    );
  }

  public createTab(
    initialUrl?: string,
    makeActive: boolean = true,
    workspaceIdOrOptions: string | { workspaceId?: string; isPrivate?: boolean; isPinned?: boolean; groupId?: string } = 'default',
    isPrivate: boolean = false,
    isPinned: boolean = false,
    groupId?: string
  ): string {
    let workspaceId = 'default';
    let privateTab = isPrivate;
    let pinnedTab = isPinned;
    let tabGroupId = groupId;

    if (typeof workspaceIdOrOptions === 'object' && workspaceIdOrOptions !== null) {
      workspaceId = workspaceIdOrOptions.workspaceId || 'default';
      privateTab = workspaceIdOrOptions.isPrivate ?? isPrivate;
      pinnedTab = workspaceIdOrOptions.isPinned ?? isPinned;
      tabGroupId = workspaceIdOrOptions.groupId ?? groupId;
    } else if (typeof workspaceIdOrOptions === 'string') {
      workspaceId = workspaceIdOrOptions;
    }

    const id = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const url = initialUrl || 'nexus://newtab';
    const isInternalPage = url.startsWith('nexus://') || url === '';

    let initialTitle = 'New Tab';
    if (url === 'nexus://extensions') initialTitle = 'Extensions';
    else if (url === 'nexus://compatibility') initialTitle = 'Compatibility Guide';
    else if (url === 'nexus://bookmarks') initialTitle = 'Bookmarks';
    else if (url === 'nexus://history') initialTitle = 'History';
    else if (url === 'nexus://downloads') initialTitle = 'Downloads';
    else if (!isInternalPage) initialTitle = 'Loading...';

    // Separate session partition for isolated workspaces or private tabs
    let tabSession: Electron.Session = session.defaultSession;
    if (privateTab) {
      tabSession = session.fromPartition(`private_${id}`);
    } else if (this.isolatedWorkspaces.has(workspaceId)) {
      tabSession = session.fromPartition(`persist:workspace_${workspaceId}`);
    }

    const view = new WebContentsView({
      webPreferences: {
        session: tabSession,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: true,
        disableBlinkFeatures: 'Auxclick',
      },
    });

    const tab: ManagedTab = {
      id,
      url,
      title: initialTitle,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      workspaceId,
      isPinned: pinnedTab,
      groupId: tabGroupId,
      isMuted: false,
      hasAudio: false,
      isSecure: url.startsWith('https://'),
      isPrivate: privateTab,
      view,
    };

    const wc = view.webContents;

    // Security: Block unsafe protocols on will-navigate
    wc.on('will-navigate', (event, destinationUrl) => {
      if (this.isUnsafeProtocol(destinationUrl)) {
        console.warn(`[NEXUS Security] Blocked unsafe navigation to: ${destinationUrl}`);
        event.preventDefault();
        return;
      }
    });

    wc.on('will-redirect', (_event, destinationUrl) => {
      if (this.isUnsafeProtocol(destinationUrl)) {
        console.warn(`[NEXUS Security] Blocked unsafe redirect to: ${destinationUrl}`);
        _event.preventDefault();
      }
    });

    const recordHistory = () => {
      if (!tab.isPrivate && tab.url && !tab.url.startsWith('nexus://')) {
        this.historyStore.addEntry(tab.title, tab.url, tab.favicon);
      }
    };

    // Loading & Navigation events
    wc.on('did-start-loading', () => {
      tab.isLoading = true;
      tab.errorCode = undefined;
      tab.errorDescription = undefined;
      this.notifyTabsUpdated();
    });

    wc.on('did-stop-loading', () => {
      tab.isLoading = false;
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      recordHistory();
      this.notifyTabsUpdated();
    });

    wc.on('page-title-updated', (_event, title) => {
      tab.title = title || 'Untitled';
      recordHistory();
      this.notifyTabsUpdated();
    });

    wc.on('page-favicon-updated', (_event, favicons) => {
      if (favicons && favicons.length > 0) {
        tab.favicon = favicons[0];
        recordHistory();
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-navigate', (_event, navigatedUrl) => {
      tab.url = navigatedUrl;
      tab.isSecure = navigatedUrl.startsWith('https://');
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      recordHistory();
      this.notifyTabsUpdated();
    });

    wc.on('did-navigate-in-page', (_event, inPageUrl) => {
      tab.url = inPageUrl;
      tab.isSecure = inPageUrl.startsWith('https://');
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      recordHistory();
      this.notifyTabsUpdated();
    });

    // Audio indicators
    wc.on('media-started-playing', () => {
      tab.hasAudio = true;
      this.notifyTabsUpdated();
    });

    wc.on('media-paused', () => {
      tab.hasAudio = false;
      this.notifyTabsUpdated();
    });

    // Error handling: catch navigation failures and present styled dark error page
    wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (errorCode === -3) return;

      if (isMainFrame) {
        tab.isLoading = false;
        tab.errorCode = errorCode;
        tab.errorDescription = errorDescription;
        tab.title = 'Connection Failed';

        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Error Loading Page</title>
            <style>
              body {
                background: #0B0D12;
                color: #F4F4F5;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 24px;
                box-sizing: border-box;
              }
              .error-box {
                background: #12151D;
                border: 1px solid #272C3D;
                border-radius: 8px;
                padding: 32px;
                max-width: 480px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
              }
              .badge {
                display: inline-block;
                padding: 4px 10px;
                background: rgba(248, 113, 113, 0.15);
                color: #F87171;
                border: 1px solid rgba(248, 113, 113, 0.3);
                border-radius: 4px;
                font-family: monospace;
                font-size: 11px;
                margin-bottom: 16px;
                text-transform: uppercase;
              }
              h2 {
                margin: 0 0 12px;
                font-size: 18px;
                font-weight: 600;
              }
              p {
                margin: 0 0 20px;
                font-size: 13px;
                color: #9298A8;
                line-height: 1.5;
              }
              .url-display {
                background: #191D28;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                color: #A78BFA;
                word-break: break-all;
                margin-bottom: 24px;
                border: 1px solid #272C3D;
              }
              .retry-btn {
                background: #A78BFA;
                color: #0B0D12;
                border: none;
                border-radius: 4px;
                padding: 9px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 120ms;
              }
              .retry-btn:hover {
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="error-box">
              <div class="badge">Navigation Error ${errorCode}</div>
              <h2>Unable to load page</h2>
              <p>${errorDescription || 'A network error occurred while attempting to reach the server.'}</p>
              <div class="url-display">${validatedURL}</div>
              <button class="retry-btn" onclick="location.reload()">Retry Connection</button>
            </div>
          </body>
          </html>
        `;
        wc.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
        this.notifyTabsUpdated();
      }
    });

    // Handle target="_blank" window.open requests
    wc.setWindowOpenHandler((details) => {
      if (this.isValidProtocol(details.url)) {
        this.createTab(details.url, true, workspaceId, isPrivate);
      }
      return { action: 'deny' };
    });

    this.tabs.set(id, tab);

    // Initial load
    if (!isInternalPage) {
      const formatted = this.formatUrl(url);
      wc.loadURL(formatted).catch((err) => {
        console.warn('Initial load error for', formatted, err);
      });
    }

    if (makeActive) {
      this.switchTab(id);
    } else {
      this.notifyTabsUpdated();
    }

    return id;
  }

  public switchTab(id: string) {
    if (!this.tabs.has(id)) return;

    // Hide previously active view
    if (this.activeTabId && this.activeTabId !== id) {
      const prevTab = this.tabs.get(this.activeTabId);
      if (prevTab) {
        try {
          if (typeof prevTab.view.setVisible === 'function') {
            prevTab.view.setVisible(false);
          } else {
            this.mainWindow.contentView.removeChildView(prevTab.view);
          }
        } catch (e) {}
      }
    }

    this.activeTabId = id;
    const currentTab = this.tabs.get(id);

    if (currentTab) {
      // Sync active workspace if switching to a tab from another workspace
      if (currentTab.workspaceId) {
        this.activeWorkspaceId = currentTab.workspaceId;
      }

      const isInternalPage = currentTab.url.startsWith('nexus://') || currentTab.url === '';

      try {
        const children = this.mainWindow.contentView.children;
        if (!children.includes(currentTab.view)) {
          this.mainWindow.contentView.addChildView(currentTab.view);
        }

        if (isInternalPage) {
          if (typeof currentTab.view.setVisible === 'function') {
            currentTab.view.setVisible(false);
          } else {
            this.mainWindow.contentView.removeChildView(currentTab.view);
          }
        } else {
          if (typeof currentTab.view.setVisible === 'function') {
            currentTab.view.setVisible(!this.isModalOpen);
          }
          if (!this.isModalOpen) {
            this.updateActiveTabBounds();
          }
        }
      } catch (err) {
        console.error('Error switching tab view:', err);
      }
    }

    this.notifyTabsUpdated();
  }

  public toggleMuteTab(id: string): boolean {
    const tab = this.tabs.get(id);
    if (!tab) return false;
    const nextMuted = !tab.view.webContents.isAudioMuted();
    tab.view.webContents.setAudioMuted(nextMuted);
    tab.isMuted = nextMuted;
    this.notifyTabsUpdated();
    return tab.isMuted;
  }

  public togglePinTab(id: string): boolean {
    const tab = this.tabs.get(id);
    if (!tab) return false;
    tab.isPinned = !tab.isPinned;
    this.sortTabs();
    this.notifyTabsUpdated();
    return tab.isPinned;
  }

  public setTabGroup(id: string, groupId?: string): void {
    const tab = this.tabs.get(id);
    if (!tab) return;
    tab.groupId = groupId;
    this.notifyTabsUpdated();
  }

  public reorderTabs(orderedTabIds: string[]): void {
    const newTabsMap = new Map<string, ManagedTab>();
    for (const id of orderedTabIds) {
      const tab = this.tabs.get(id);
      if (tab) {
        newTabsMap.set(id, tab);
      }
    }
    for (const [id, tab] of this.tabs.entries()) {
      if (!newTabsMap.has(id)) {
        newTabsMap.set(id, tab);
      }
    }
    this.tabs = newTabsMap;
    this.notifyTabsUpdated();
  }

  public moveTabToWorkspace(id: string, targetWorkspaceId: string): void {
    const tab = this.tabs.get(id);
    if (!tab) return;
    tab.workspaceId = targetWorkspaceId;

    if (this.activeTabId === id && this.activeWorkspaceId !== targetWorkspaceId) {
      const remaining = Array.from(this.tabs.values()).filter(
        (t) => t.workspaceId === this.activeWorkspaceId && t.id !== id
      );
      if (remaining.length > 0) {
        this.switchTab(remaining[remaining.length - 1].id);
      } else {
        this.createTab('nexus://newtab', true, this.activeWorkspaceId);
      }
    } else {
      this.notifyTabsUpdated();
    }
  }

  public switchWorkspace(workspaceId: string, targetTabId?: string): void {
    this.activeWorkspaceId = workspaceId;

    // Hide views for all tabs outside the target workspace
    for (const tab of this.tabs.values()) {
      if (tab.workspaceId !== workspaceId) {
        try {
          if (typeof tab.view.setVisible === 'function') {
            tab.view.setVisible(false);
          } else {
            this.mainWindow.contentView.removeChildView(tab.view);
          }
        } catch (e) {}
      }
    }

    const workspaceTabs = Array.from(this.tabs.values()).filter(
      (t) => t.workspaceId === workspaceId
    );

    if (targetTabId && this.tabs.has(targetTabId)) {
      this.switchTab(targetTabId);
    } else if (workspaceTabs.length > 0) {
      this.switchTab(workspaceTabs[0].id);
    } else {
      this.createTab('nexus://newtab', true, workspaceId);
    }
  }

  private sortTabs() {
    const pinned: ManagedTab[] = [];
    const normal: ManagedTab[] = [];
    for (const tab of this.tabs.values()) {
      if (tab.isPinned) pinned.push(tab);
      else normal.push(tab);
    }
    const newMap = new Map<string, ManagedTab>();
    for (const t of pinned) newMap.set(t.id, t);
    for (const t of normal) newMap.set(t.id, t);
    this.tabs = newMap;
  }

  public duplicateTab(id: string): string | null {
    const tab = this.tabs.get(id);
    if (!tab) return null;
    return this.createTab(tab.url, true, tab.workspaceId, tab.isPrivate, tab.isPinned, tab.groupId);
  }

  public reopenClosedTab(): string | null {
    if (this.closedTabs.length === 0) return null;
    const record = this.closedTabs.pop();
    if (!record) return null;
    return this.createTab(record.url, true, record.workspaceId, false, false, record.groupId);
  }

  public getRecentlyClosedTabs(): ClosedTabRecord[] {
    return [...this.closedTabs].reverse();
  }

  public closeTab(id: string) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    // Do not record private tabs in recently closed
    if (!tab.isPrivate && tab.url && tab.url !== 'nexus://newtab') {
      this.closedTabs.push({
        url: tab.url,
        title: tab.title,
        workspaceId: tab.workspaceId,
        favicon: tab.favicon,
        groupId: tab.groupId,
        closedAt: Date.now(),
      });
      if (this.closedTabs.length > 30) {
        this.closedTabs.shift();
      }
    }

    try {
      this.mainWindow.contentView.removeChildView(tab.view);
      (tab.view.webContents as any).close?.();
    } catch (e) {
      console.warn('Error closing tab view:', e);
    }

    this.tabs.delete(id);

    if (this.activeTabId === id) {
      // Find remaining tab in same workspace first
      const remainingInWorkspace = Array.from(this.tabs.values()).filter(
        (t) => t.workspaceId === tab.workspaceId
      );
      if (remainingInWorkspace.length > 0) {
        this.switchTab(remainingInWorkspace[remainingInWorkspace.length - 1].id);
      } else {
        const anyRemaining = Array.from(this.tabs.keys());
        if (anyRemaining.length > 0) {
          this.switchTab(anyRemaining[anyRemaining.length - 1]);
        } else {
          this.activeTabId = null;
          this.createTab('nexus://newtab', true, tab.workspaceId);
        }
      }
    } else {
      this.notifyTabsUpdated();
    }
  }

  public navigate(id: string, input: string) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    if (this.isUnsafeProtocol(input)) {
      console.warn(`[NEXUS Security] Navigation blocked for unsafe protocol: ${input}`);
      return;
    }

    const formatted = this.formatUrl(input);
    tab.url = formatted;
    tab.isSecure = formatted.startsWith('https://');

    if (formatted.startsWith('nexus://')) {
      if (formatted === 'nexus://extensions') {
        tab.title = 'Extensions';
      } else if (formatted === 'nexus://compatibility') {
        tab.title = 'Compatibility Guide';
      } else if (formatted === 'nexus://bookmarks') {
        tab.title = 'Bookmarks';
      } else if (formatted === 'nexus://history') {
        tab.title = 'History';
      } else if (formatted === 'nexus://downloads') {
        tab.title = 'Downloads';
      } else {
        tab.title = 'New Tab';
      }
      try {
        if (typeof tab.view.setVisible === 'function') {
          tab.view.setVisible(false);
        } else {
          this.mainWindow.contentView.removeChildView(tab.view);
        }
      } catch (e) {}
      this.notifyTabsUpdated();
      return;
    }

    try {
      const children = this.mainWindow.contentView.children;
      if (!children.includes(tab.view)) {
        this.mainWindow.contentView.addChildView(tab.view);
      }
      if (typeof tab.view.setVisible === 'function') {
        tab.view.setVisible(true);
      }
      this.updateActiveTabBounds();
      tab.view.webContents.loadURL(formatted);
    } catch (e) {
      console.error('Error navigating tab:', e);
    }
    this.notifyTabsUpdated();
  }

  public goBack(id: string) {
    const tab = this.tabs.get(id);
    if (tab && tab.view.webContents.canGoBack()) {
      tab.view.webContents.goBack();
    }
  }

  public goForward(id: string) {
    const tab = this.tabs.get(id);
    if (tab && tab.view.webContents.canGoForward()) {
      tab.view.webContents.goForward();
    }
  }

  public reload(id: string) {
    const tab = this.tabs.get(id);
    if (tab && tab.url !== 'nexus://newtab') {
      tab.view.webContents.reload();
    }
  }

  public stop(id: string) {
    const tab = this.tabs.get(id);
    if (tab) {
      tab.view.webContents.stop();
    }
  }

  public toggleDevTools(id?: string) {
    const targetId = id || this.activeTabId;
    if (!targetId) return;
    const tab = this.tabs.get(targetId);
    if (tab) {
      if (tab.view.webContents.isDevToolsOpened()) {
        tab.view.webContents.closeDevTools();
      } else {
        tab.view.webContents.openDevTools({ mode: 'detach' });
      }
    }
  }

  public setZoomLevel(level: number): number {
    if (!this.activeTabId) return 0;
    const tab = this.tabs.get(this.activeTabId);
    if (tab) {
      tab.view.webContents.setZoomLevel(level);
      return tab.view.webContents.getZoomLevel();
    }
    return 0;
  }

  public getZoomLevel(): number {
    if (!this.activeTabId) return 0;
    const tab = this.tabs.get(this.activeTabId);
    if (tab) {
      return tab.view.webContents.getZoomLevel();
    }
    return 0;
  }

  public async clearBrowsingData(): Promise<void> {
    try {
      await session.defaultSession.clearCache();
      await session.defaultSession.clearStorageData();
    } catch (e) {
      console.error('Failed to clear browsing data:', e);
    }
  }

  public saveSession(data: SavedSessionData): boolean {
    return this.sessionStore.save(data);
  }

  public restoreSession(): SavedSessionData | null {
    return this.sessionStore.load();
  }

  public clearSession(): boolean {
    return this.sessionStore.clear();
  }

  public updateActiveTabBounds() {
    if (!this.activeTabId) return;
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.url.startsWith('nexus://')) return;

    try {
      const [width, height] = this.mainWindow.getContentSize();
      const x = Math.max(0, this.bounds.left);
      const y = Math.max(0, this.bounds.top);
      const w = Math.max(0, width - x - this.bounds.right);
      const h = Math.max(0, height - y - this.bounds.bottom);

      tab.view.setBounds({
        x,
        y,
        width: w,
        height: h,
      });
    } catch (err) {
      console.error('Failed to set tab bounds:', err);
    }
  }

  private notifyTabsUpdated() {
    if (this.mainWindow.isDestroyed()) return;
    const tabStates = this.getAllTabStates();
    this.mainWindow.webContents.send('tabs:updated', tabStates, this.activeTabId);
  }

  public formatUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'nexus://newtab') return 'nexus://newtab';
    if (trimmed.startsWith('view-source:')) {
      return trimmed;
    }

    if (/^[a-zA-Z]+:\/\//.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('localhost') || /^127\.0\.0\.1(:\d+)?/.test(trimmed)) {
      return `http://${trimmed}`;
    }

    if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      return `https://${trimmed}`;
    }

    const encoded = encodeURIComponent(trimmed);
    switch (this.searchEngine) {
      case 'google':
        return `https://www.google.com/search?q=${encoded}`;
      case 'brave':
        return `https://search.brave.com/search?q=${encoded}`;
      case 'bing':
        return `https://www.bing.com/search?q=${encoded}`;
      case 'duckduckgo':
      default:
        return `https://duckduckgo.com/?q=${encoded}`;
    }
  }

  public getHistoryStore(): HistoryStore {
    return this.historyStore;
  }

  public setHistoryStore(store: HistoryStore): void {
    this.historyStore = store;
  }
}
