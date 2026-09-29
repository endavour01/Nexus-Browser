import { BrowserWindow, WebContentsView, session } from 'electron';
import { ContentBounds, TabState } from '../shared/types';

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
  isSecure: boolean;
  errorCode?: number;
  errorDescription?: string;
  view: WebContentsView;
}

interface ClosedTabRecord {
  url: string;
  title: string;
  workspaceId: string;
}

export class TabManager {
  private tabs: Map<string, ManagedTab> = new Map();
  private closedTabs: ClosedTabRecord[] = [];
  private activeTabId: string | null = null;
  private mainWindow: BrowserWindow;
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
    // Explicit permission handling: block sensitive hardware by default, allow safe web features
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

  public getActiveTabId(): string | null {
    return this.activeTabId;
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
      isSecure: t.isSecure,
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

  public createTab(initialUrl?: string, makeActive: boolean = true, workspaceId: string = 'default'): string {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const url = initialUrl || 'nexus://newtab';
    const isNewTab = url === 'nexus://newtab' || url === '';

    const view = new WebContentsView({
      webPreferences: {
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
      title: isNewTab ? 'New Tab' : 'Loading...',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      workspaceId,
      isPinned: false,
      isSecure: url.startsWith('https://'),
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
      this.notifyTabsUpdated();
    });

    wc.on('page-title-updated', (_event, title) => {
      tab.title = title || 'Untitled';
      this.notifyTabsUpdated();
    });

    wc.on('page-favicon-updated', (_event, favicons) => {
      if (favicons && favicons.length > 0) {
        tab.favicon = favicons[0];
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-navigate', (_event, navigatedUrl) => {
      tab.url = navigatedUrl;
      tab.isSecure = navigatedUrl.startsWith('https://');
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      this.notifyTabsUpdated();
    });

    wc.on('did-navigate-in-page', (_event, inPageUrl) => {
      tab.url = inPageUrl;
      tab.isSecure = inPageUrl.startsWith('https://');
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      this.notifyTabsUpdated();
    });

    // Error handling: catch navigation failures and present styled dark error page
    wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // Ignore aborts (e.g. user stopped load or redirected)
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
            <title>Connection Error</title>
            <style>
              body {
                background-color: #0B0D12;
                color: #F4F4F5;
                font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                user-select: none;
              }
              .error-card {
                max-width: 480px;
                padding: 36px 32px;
                background-color: #12151D;
                border: 1px solid #1C202C;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
              }
              .error-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: rgba(248, 113, 113, 0.12);
                color: #F87171;
                margin-bottom: 16px;
                font-size: 20px;
                font-weight: 700;
              }
              h2 {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                color: #F4F4F5;
              }
              p {
                margin: 0 0 20px 0;
                font-size: 13px;
                color: #9298A8;
                line-height: 1.5;
                word-break: break-all;
              }
              .code-badge {
                display: inline-block;
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                background: #0B0D12;
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid #1C202C;
                color: #A78BFA;
                margin-top: 8px;
              }
              .btn-row {
                display: flex;
                gap: 10px;
                justify-content: center;
              }
              button {
                background: #A78BFA;
                color: #0B0D12;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 120ms ease;
              }
              button:hover { opacity: 0.9; }
              .btn-secondary {
                background: #191D28;
                color: #F4F4F5;
                border: 1px solid #272C3D;
              }
            </style>
          </head>
          <body>
            <div class="error-card">
              <div class="error-icon">!</div>
              <h2>Unable to connect</h2>
              <p>NEXUS couldn't establish a secure connection to<br><strong>${validatedURL}</strong><br><span class="code-badge">${errorDescription} (${errorCode})</span></p>
              <div class="btn-row">
                <button onclick="location.reload()">Retry Connection</button>
              </div>
            </div>
          </body>
          </html>
        `;

        wc.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`).catch(() => {});
        this.notifyTabsUpdated();
      }
    });

    // Window open & target="_blank" handler
    wc.setWindowOpenHandler((details) => {
      if (this.isUnsafeProtocol(details.url)) {
        console.warn(`[NEXUS Security] Blocked window.open with unsafe URL: ${details.url}`);
        return { action: 'deny' };
      }

      // Check disposition for background tabs
      const isBackground = details.disposition === 'background-tab';
      this.createTab(details.url, !isBackground, tab.workspaceId);
      return { action: 'deny' };
    });

    this.tabs.set(id, tab);

    // Initial load
    if (!isNewTab) {
      const formatted = this.formatUrl(url);
      tab.url = formatted;
      tab.isSecure = formatted.startsWith('https://');
      wc.loadURL(formatted).catch((err) => {
        console.error(`Failed to load initial URL ${url}:`, err);
      });
    }

    if (makeActive || !this.activeTabId) {
      this.switchTab(id);
    } else {
      this.notifyTabsUpdated();
    }

    return id;
  }

  public switchTab(id: string) {
    if (!this.tabs.has(id)) return;

    if (this.activeTabId && this.activeTabId !== id) {
      const prevTab = this.tabs.get(this.activeTabId);
      if (prevTab) {
        try {
          if (typeof prevTab.view.setVisible === 'function') {
            prevTab.view.setVisible(false);
          } else {
            this.mainWindow.contentView.removeChildView(prevTab.view);
          }
        } catch (e) {
          console.warn('Error hiding view:', e);
        }
      }
    }

    this.activeTabId = id;
    const currentTab = this.tabs.get(id);

    if (currentTab) {
      const isNewTab = currentTab.url === 'nexus://newtab' || currentTab.url === '';

      try {
        const children = this.mainWindow.contentView.children;
        if (!children.includes(currentTab.view)) {
          this.mainWindow.contentView.addChildView(currentTab.view);
        }

        if (isNewTab) {
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

  public duplicateTab(id: string): string | null {
    const tab = this.tabs.get(id);
    if (!tab) return null;
    return this.createTab(tab.url, true, tab.workspaceId);
  }

  public reopenClosedTab(): string | null {
    if (this.closedTabs.length === 0) return null;
    const record = this.closedTabs.pop();
    if (!record) return null;
    return this.createTab(record.url, true, record.workspaceId);
  }

  public closeTab(id: string) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    // Record in closed tabs stack if valid URL
    if (tab.url && tab.url !== 'nexus://newtab') {
      this.closedTabs.push({
        url: tab.url,
        title: tab.title,
        workspaceId: tab.workspaceId,
      });
      if (this.closedTabs.length > 25) {
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
      const remainingTabIds = Array.from(this.tabs.keys());
      if (remainingTabIds.length > 0) {
        this.switchTab(remainingTabIds[remainingTabIds.length - 1]);
      } else {
        this.activeTabId = null;
        this.createTab('nexus://newtab', true, tab.workspaceId);
      }
    } else {
      this.notifyTabsUpdated();
    }
  }

  public navigate(id: string, input: string) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    // Validate unsafe protocols
    if (this.isUnsafeProtocol(input)) {
      console.warn(`[NEXUS Security] Navigation blocked for unsafe protocol: ${input}`);
      return;
    }

    const formatted = this.formatUrl(input);
    tab.url = formatted;
    tab.isSecure = formatted.startsWith('https://');

    if (formatted === 'nexus://newtab') {
      tab.title = 'New Tab';
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

  public updateActiveTabBounds() {
    if (!this.activeTabId) return;
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.url === 'nexus://newtab') return;

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

    // Already has protocol
    if (/^[a-zA-Z]+:\/\//.test(trimmed)) {
      return trimmed;
    }

    // IP address or localhost
    if (trimmed.startsWith('localhost') || /^127\.0\.0\.1(:\d+)?/.test(trimmed)) {
      return `http://${trimmed}`;
    }

    // Has a valid domain extension or looks like a URL
    if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Search engines
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
}
