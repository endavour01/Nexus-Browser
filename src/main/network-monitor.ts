import { BrowserWindow, Session } from 'electron';
import { NetworkLogEntry } from '../shared/types';

export class NetworkMonitor {
  private logsByTab: Map<string, NetworkLogEntry[]> = new Map();
  private pendingRequests: Map<number, Partial<NetworkLogEntry>> = new Map();
  private attachedSessions: Set<Session> = new Set();
  private mainWindow: BrowserWindow | null = null;
  private tabResolver?: (webContentsId: number) => string | undefined;
  private maxLogsPerTab = 200;

  constructor(mainWindow?: BrowserWindow) {
    if (mainWindow) {
      this.mainWindow = mainWindow;
    }
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public setTabResolver(resolver: (webContentsId: number) => string | undefined) {
    this.tabResolver = resolver;
  }

  public attachToSession(targetSession: Session) {
    if (this.attachedSessions.has(targetSession)) return;
    this.attachedSessions.add(targetSession);

    const filter = { urls: ['*://*/*'] };

    targetSession.webRequest.onBeforeRequest(filter, (details, callback) => {
      try {
        const tabId = details.webContentsId && this.tabResolver
          ? this.tabResolver(details.webContentsId) || `wc_${details.webContentsId}`
          : `wc_${details.webContentsId || 0}`;

        const entry: Partial<NetworkLogEntry> = {
          id: `req_${details.id}`,
          tabId,
          url: details.url,
          method: details.method,
          resourceType: details.resourceType || 'other',
          startTime: Date.now(),
        };

        this.pendingRequests.set(details.id, entry);
      } catch (err) {
        console.error('[NetworkMonitor] error in onBeforeRequest:', err);
      }
      callback({});
    });

    targetSession.webRequest.onResponseStarted(filter, (details) => {
      try {
        const entry = this.pendingRequests.get(details.id);
        if (entry) {
          entry.statusCode = details.statusCode;
          entry.statusLine = details.statusLine;
          entry.ip = (details as any).ip as string | undefined;
          if (details.responseHeaders) {
            const cl = details.responseHeaders['content-length'] || details.responseHeaders['Content-Length'];
            if (cl && cl[0]) {
              const parsed = parseInt(cl[0], 10);
              if (!isNaN(parsed)) entry.size = parsed;
            }
          }
        }
      } catch (err) {
        console.error('[NetworkMonitor] error in onResponseStarted:', err);
      }
    });

    targetSession.webRequest.onCompleted(filter, (details) => {
      try {
        const partial = this.pendingRequests.get(details.id);
        const now = Date.now();
        const tabId = partial?.tabId || (details.webContentsId && this.tabResolver
          ? this.tabResolver(details.webContentsId) || `wc_${details.webContentsId}`
          : `wc_${details.webContentsId || 0}`);

        const completedEntry: NetworkLogEntry = {
          id: `req_${details.id}`,
          tabId,
          url: details.url,
          method: details.method,
          statusCode: details.statusCode,
          statusLine: details.statusLine,
          resourceType: details.resourceType || partial?.resourceType || 'other',
          startTime: partial?.startTime || now,
          endTime: now,
          duration: partial?.startTime ? Math.max(0, now - partial.startTime) : 0,
          ip: (details as any).ip as string | undefined || partial?.ip,
          size: partial?.size,
        };

        this.pendingRequests.delete(details.id);
        this.addLog(completedEntry);
      } catch (err) {
        console.error('[NetworkMonitor] error in onCompleted:', err);
      }
    });

    targetSession.webRequest.onErrorOccurred(filter, (details) => {
      try {
        const partial = this.pendingRequests.get(details.id);
        const now = Date.now();
        const tabId = partial?.tabId || (details.webContentsId && this.tabResolver
          ? this.tabResolver(details.webContentsId) || `wc_${details.webContentsId}`
          : `wc_${details.webContentsId || 0}`);

        const errorEntry: NetworkLogEntry = {
          id: `req_${details.id}`,
          tabId,
          url: details.url,
          method: details.method,
          statusCode: partial?.statusCode,
          statusLine: partial?.statusLine,
          resourceType: details.resourceType || partial?.resourceType || 'other',
          startTime: partial?.startTime || now,
          endTime: now,
          duration: partial?.startTime ? Math.max(0, now - partial.startTime) : 0,
          error: details.error,
          ip: partial?.ip,
          size: partial?.size,
        };

        this.pendingRequests.delete(details.id);
        this.addLog(errorEntry);
      } catch (err) {
        console.error('[NetworkMonitor] error in onErrorOccurred:', err);
      }
    });
  }

  private addLog(entry: NetworkLogEntry) {
    if (!this.logsByTab.has(entry.tabId)) {
      this.logsByTab.set(entry.tabId, []);
    }
    const tabLogs = this.logsByTab.get(entry.tabId)!;
    tabLogs.push(entry);

    if (tabLogs.length > this.maxLogsPerTab) {
      tabLogs.splice(0, tabLogs.length - this.maxLogsPerTab);
    }

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('devtools:networkActivity', entry);
    }
  }

  public getLogs(tabId: string): NetworkLogEntry[] {
    return this.logsByTab.get(tabId) ? [...this.logsByTab.get(tabId)!] : [];
  }

  public clearLogs(tabId?: string) {
    if (tabId) {
      this.logsByTab.delete(tabId);
    } else {
      this.logsByTab.clear();
      this.pendingRequests.clear();
    }
  }
}
