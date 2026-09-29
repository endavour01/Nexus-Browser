import { BrowserWindow, WebContentsView } from 'electron';
import {
  CookieItem,
  DevicePreset,
  NetworkLogEntry,
  PageInfoDetails,
  ReaderResult,
  SiteZoomPreference,
  StorageData,
} from '../shared/types';
import { TabManager } from './tab-manager';
import { NetworkMonitor } from './network-monitor';
import { ZoomManager } from './zoom-manager';
import { SecurityManager } from './security-manager';

export class DeveloperToolsManager {
  private tabManager: TabManager;
  private networkMonitor: NetworkMonitor;
  private zoomManager: ZoomManager;
  private securityManager?: SecurityManager;
  private mainWindow: BrowserWindow;

  constructor(
    mainWindow: BrowserWindow,
    tabManager: TabManager,
    networkMonitor: NetworkMonitor,
    zoomManager: ZoomManager,
    securityManager?: SecurityManager
  ) {
    this.mainWindow = mainWindow;
    this.tabManager = tabManager;
    this.networkMonitor = networkMonitor;
    this.zoomManager = zoomManager;
    this.securityManager = securityManager;
  }

  public setSecurityManager(sm: SecurityManager) {
    this.securityManager = sm;
  }

  private getTargetWebContents(tabId?: string) {
    const targetId = tabId || this.tabManager.getActiveTabId();
    if (!targetId) return null;
    const view = this.tabManager.getView(targetId);
    if (!view || !view.webContents || view.webContents.isDestroyed()) return null;
    return { tabId: targetId, view, wc: view.webContents };
  }

  public async inspectElement(tabId?: string): Promise<void> {
    const target = this.getTargetWebContents(tabId);
    if (!target) return;
    if (target.wc.isDevToolsOpened()) {
      target.wc.devToolsWebContents?.focus();
    } else {
      target.wc.openDevTools({ mode: 'detach' });
    }
  }

  public async viewPageSource(tabId?: string): Promise<void> {
    const targetId = tabId || this.tabManager.getActiveTabId();
    if (!targetId) return;
    const state = this.tabManager.getTabState(targetId);
    if (!state || !state.url) return;

    if (state.url.startsWith('view-source:')) return;
    const sourceUrl = `view-source:${state.url}`;
    await this.tabManager.createTab(sourceUrl, true, state.workspaceId, !!state.isPrivate);
  }

  public async getPageInfo(tabId?: string): Promise<PageInfoDetails | null> {
    const target = this.getTargetWebContents(tabId);
    if (!target) return null;

    const state = this.tabManager.getTabState(target.tabId);
    const url = state?.url || target.wc.getURL();
    const title = state?.title || target.wc.getTitle() || 'Untitled';

    let viewportSize = { width: 1200, height: 800 };
    let contentType = 'text/html';
    let cookieCount = 0;
    let storageCount = 0;

    if (!url.startsWith('nexus://')) {
      try {
        const vp = await target.wc.executeJavaScript(`
          (() => ({
            width: window.innerWidth,
            height: window.innerHeight,
            contentType: document.contentType || 'text/html'
          }))()
        `);
        if (vp) {
          viewportSize = { width: vp.width, height: vp.height };
          contentType = vp.contentType;
        }
      } catch {
        // Fallback to view size if script execution fails
      }

      try {
        const cookies = await target.wc.session.cookies.get({ url });
        cookieCount = cookies.length;
      } catch {
        cookieCount = 0;
      }

      try {
        const counts = await target.wc.executeJavaScript(`
          (() => ({
            ls: typeof localStorage !== 'undefined' ? localStorage.length : 0,
            ss: typeof sessionStorage !== 'undefined' ? sessionStorage.length : 0
          }))()
        `);
        if (counts) {
          storageCount = (counts.ls || 0) + (counts.ss || 0);
        }
      } catch {
        storageCount = 0;
      }
    }

    const security = this.securityManager?.getSiteSecurityInfo(url, 0) || {
      url,
      origin: 'unknown',
      isSecure: url.startsWith('https://'),
      status: url.startsWith('https://') ? 'secure' : 'insecure',
      blockedTrackersCount: 0,
    };

    return {
      url,
      title,
      viewportSize,
      contentType,
      security,
      cookieCount,
      storageCount,
    };
  }

  public async setDeviceEmulation(tabId: string, preset: DevicePreset | null): Promise<void> {
    const target = this.getTargetWebContents(tabId);
    if (!target) return;

    if (!preset) {
      target.wc.disableDeviceEmulation();
      this.tabManager.updateActiveTabBounds();
      return;
    }

    target.wc.enableDeviceEmulation({
      screenPosition: 'mobile',
      screenSize: { width: preset.width, height: preset.height },
      viewPosition: { x: 0, y: 0 },
      deviceScaleFactor: preset.deviceScaleFactor || 1,
      viewSize: { width: preset.width, height: preset.height },
      scale: 1,
    });

    if (preset.userAgent) {
      target.wc.setUserAgent(preset.userAgent);
    }
  }

  public async getCookiesForTab(tabId?: string): Promise<CookieItem[]> {
    const target = this.getTargetWebContents(tabId);
    if (!target) return [];

    const url = target.wc.getURL();
    if (!url || url.startsWith('nexus://')) return [];

    try {
      const electronCookies = await target.wc.session.cookies.get({ url });
      return electronCookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || '',
        path: c.path || '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        session: !!c.session,
        expirationDate: c.expirationDate,
        sameSite: c.sameSite || 'unspecified',
      }));
    } catch (err) {
      console.error('[DeveloperTools] getCookiesForTab error:', err);
      return [];
    }
  }

  public async removeCookie(url: string, name: string): Promise<boolean> {
    try {
      const activeTarget = this.getTargetWebContents();
      const sess = activeTarget?.wc.session || this.mainWindow.webContents.session;
      await sess.cookies.remove(url, name);
      return true;
    } catch (err) {
      console.error('[DeveloperTools] removeCookie error:', err);
      return false;
    }
  }

  public async getStorageForTab(tabId?: string): Promise<StorageData> {
    const target = this.getTargetWebContents(tabId);
    if (!target) return { localStorage: [], sessionStorage: [] };

    const url = target.wc.getURL();
    if (!url || url.startsWith('nexus://')) {
      return { localStorage: [], sessionStorage: [] };
    }

    try {
      return await target.wc.executeJavaScript(`
        (() => {
          const ls = [];
          if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k !== null) ls.push({ key: k, value: localStorage.getItem(k) || '' });
            }
          }
          const ss = [];
          if (typeof sessionStorage !== 'undefined') {
            for (let i = 0; i < sessionStorage.length; i++) {
              const k = sessionStorage.key(i);
              if (k !== null) ss.push({ key: k, value: sessionStorage.getItem(k) || '' });
            }
          }
          return { localStorage: ls, sessionStorage: ss };
        })()
      `);
    } catch (err) {
      console.error('[DeveloperTools] getStorageForTab error:', err);
      return { localStorage: [], sessionStorage: [] };
    }
  }

  public async clearStorageForTab(
    tabId?: string,
    type: 'all' | 'localStorage' | 'sessionStorage' = 'all'
  ): Promise<boolean> {
    const target = this.getTargetWebContents(tabId);
    if (!target) return false;

    try {
      await target.wc.executeJavaScript(`
        (() => {
          if ('${type}' === 'all' || '${type}' === 'localStorage') {
            if (typeof localStorage !== 'undefined') localStorage.clear();
          }
          if ('${type}' === 'all' || '${type}' === 'sessionStorage') {
            if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
          }
          return true;
        })()
      `);
      return true;
    } catch (err) {
      console.error('[DeveloperTools] clearStorageForTab error:', err);
      return false;
    }
  }

  public getNetworkLogs(tabId?: string): NetworkLogEntry[] {
    const targetId = tabId || this.tabManager.getActiveTabId();
    if (!targetId) return [];
    return this.networkMonitor.getLogs(targetId);
  }

  public clearNetworkLogs(tabId?: string): void {
    const targetId = tabId || this.tabManager.getActiveTabId();
    this.networkMonitor.clearLogs(targetId || undefined);
  }

  public async extractReaderMode(tabId?: string): Promise<ReaderResult> {
    const target = this.getTargetWebContents(tabId);
    if (!target) {
      return { success: false, reason: 'No active web page available for reader mode.' };
    }

    const state = this.tabManager.getTabState(target.tabId);
    const url = state?.url || target.wc.getURL();

    if (!url || url.startsWith('nexus://')) {
      return { success: false, reason: 'Reader view is only available on external web articles.' };
    }

    try {
      const extracted = await target.wc.executeJavaScript(`
        (() => {
          try {
            // Find main content container
            const candidates = Array.from(document.querySelectorAll('article, [role="main"], main, .article-content, .post-content, .entry-content, #content'));
            let mainElem = candidates.length > 0 ? candidates[0] : document.body;

            // Extract title
            const h1 = document.querySelector('h1');
            const pageTitle = (h1 && h1.innerText.trim()) || document.title || 'Untitled Article';

            // Extract byline / author
            const authorMeta = document.querySelector('meta[name="author"], meta[property="article:author"], [rel="author"]');
            const byline = authorMeta ? (authorMeta.getAttribute('content') || (authorMeta as HTMLElement).innerText || '').trim() : undefined;

            // Extract site name
            const ogSite = document.querySelector('meta[property="og:site_name"]');
            const siteName = ogSite ? ogSite.getAttribute('content') || location.hostname : location.hostname;

            // Collect meaningful paragraphs
            const paragraphs = Array.from(mainElem.querySelectorAll('p, h2, h3, blockquote, pre'))
              .map(el => {
                const tag = el.tagName.toLowerCase();
                const text = el.innerText.trim();
                return { tag, text };
              })
              .filter(item => item.text.length > 20);

            const textContent = paragraphs.map(p => p.text).join('\\n\\n');
            const wordCount = textContent.split(/\\s+/).filter(Boolean).length;

            if (wordCount < 60) {
              return { success: false, reason: 'Content is too short or page is not an article.' };
            }

            const htmlContent = paragraphs.map(p => {
              if (p.tag === 'h2') return '<h2>' + p.text + '</h2>';
              if (p.tag === 'h3') return '<h3>' + p.text + '</h3>';
              if (p.tag === 'blockquote') return '<blockquote>' + p.text + '</blockquote>';
              if (p.tag === 'pre') return '<pre><code>' + p.text + '</code></pre>';
              return '<p>' + p.text + '</p>';
            }).join('\\n');

            const excerpt = paragraphs.length > 0 ? paragraphs[0].text.slice(0, 180) + '...' : undefined;
            const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

            return {
              success: true,
              article: {
                title: pageTitle,
                byline,
                siteName,
                content: htmlContent,
                textContent,
                length: wordCount,
                excerpt,
                readingTimeMinutes
              }
            };
          } catch (e) {
            return { success: false, reason: 'Failed to extract content: ' + String(e) };
          }
        })()
      `);

      return extracted || { success: false, reason: 'Extraction failed.' };
    } catch (err: any) {
      return { success: false, reason: `Reader mode failed: ${err.message || 'Cannot access page'}` };
    }
  }

  public getSiteZoom(origin: string): number {
    return this.zoomManager.getSiteZoom(origin);
  }

  public setSiteZoom(origin: string, zoomFactor: number): void {
    this.zoomManager.setSiteZoom(origin, zoomFactor);
    // Apply immediately to any open tab that matches this origin
    const allTabs = this.tabManager.getAllTabStates();
    for (const tab of allTabs) {
      if (tab.url && tab.url.includes(origin)) {
        const view = this.tabManager.getView(tab.id);
        if (view && !view.webContents.isDestroyed()) {
          view.webContents.setZoomFactor(zoomFactor);
        }
      }
    }
  }

  public getAllSiteZooms(): SiteZoomPreference[] {
    return this.zoomManager.getAllSiteZooms();
  }
}
