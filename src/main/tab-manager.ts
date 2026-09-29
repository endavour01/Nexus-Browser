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
  view: WebContentsView;
}

export class TabManager {
  private tabs: Map<string, ManagedTab> = new Map();
  private activeTabId: string | null = null;
  private mainWindow: BrowserWindow;
  private bounds: ContentBounds = {
    top: 84,
    left: 0,
    right: 0,
    bottom: 24,
  };
  private searchEngine: string = 'duckduckgo';

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
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
    }));
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
      view,
    };

    // Attach listeners to view.webContents
    const wc = view.webContents;

    wc.on('did-start-loading', () => {
      tab.isLoading = true;
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

    wc.on('did-navigate', (_event, url) => {
      tab.url = url;
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      this.notifyTabsUpdated();
    });

    wc.on('did-navigate-in-page', (_event, url) => {
      tab.url = url;
      tab.canGoBack = wc.canGoBack();
      tab.canGoForward = wc.canGoForward();
      this.notifyTabsUpdated();
    });

    // Intercept window.open / target="_blank"
    wc.setWindowOpenHandler((details) => {
      this.createTab(details.url, true, tab.workspaceId);
      return { action: 'deny' };
    });

    this.tabs.set(id, tab);

    // Initial load if not newtab
    if (!isNewTab) {
      wc.loadURL(this.formatUrl(url)).catch((err) => {
        console.error(`Failed to load URL ${url}:`, err);
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

    // Hide currently active view if different
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
        // Ensure child view is added
        const children = this.mainWindow.contentView.children;
        if (!children.includes(currentTab.view)) {
          this.mainWindow.contentView.addChildView(currentTab.view);
        }

        if (isNewTab) {
          // If on new tab workspace, hide the WebContentsView so the React dashboard is visible
          if (typeof currentTab.view.setVisible === 'function') {
            currentTab.view.setVisible(false);
          } else {
            this.mainWindow.contentView.removeChildView(currentTab.view);
          }
        } else {
          if (typeof currentTab.view.setVisible === 'function') {
            currentTab.view.setVisible(true);
          }
          this.updateActiveTabBounds();
        }
      } catch (err) {
        console.error('Error switching tab view:', err);
      }
    }

    this.notifyTabsUpdated();
  }

  public closeTab(id: string) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    try {
      this.mainWindow.contentView.removeChildView(tab.view);
      (tab.view.webContents as any).close?.();
    } catch (e) {
      console.warn('Error closing tab view:', e);
    }

    this.tabs.delete(id);

    // If closed tab was active, switch to adjacent tab
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

    const formatted = this.formatUrl(input);
    tab.url = formatted;

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

    // Ensure view is visible and added
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

  private formatUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return 'nexus://newtab';
    if (trimmed === 'nexus://newtab') return 'nexus://newtab';

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
