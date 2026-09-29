import { session, BrowserWindow } from 'electron';
import { TrackingProtectionMode, TrackingProtectionSettings } from '../shared/types';

// Verified list of common third-party tracking, profiling, and advertising telemetry host patterns
const TRACKER_PATTERNS: string[] = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'googlesyndication.com',
  'connect.facebook.net',
  'facebook.com/tr',
  'analytics.twitter.com',
  'criteo.com',
  'criteo.net',
  'hotjar.com',
  'hotjar.io',
  'mixpanel.com',
  'scorecardresearch.com',
  'segment.io',
  'segment.com',
  'clarity.ms',
  'quantserve.com',
  'outbrain.com',
  'taboola.com',
  'adnxs.com',
  'pubmatic.com',
  'rubiconproject.com',
  'adroll.com',
  'newrelic.com',
  'branch.io',
  'amplitude.com',
  'mouseflow.com',
  'fullstory.com',
];

export class TrackingProtection {
  private mode: TrackingProtectionMode = 'standard';
  private totalBlocked: number = 0;
  private exceptions: Set<string> = new Set(); // origins where tracking protection is paused
  private tabBlockedCounts: Map<number | string, number> = new Map();
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow?: BrowserWindow | null) {
    this.mainWindow = mainWindow || null;
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public getSettings(): TrackingProtectionSettings {
    return {
      mode: this.mode,
      totalBlocked: this.totalBlocked,
      exceptions: Array.from(this.exceptions),
    };
  }

  public setMode(mode: TrackingProtectionMode) {
    this.mode = mode;
  }

  public isTrackerUrl(requestUrl: string): boolean {
    const lower = requestUrl.toLowerCase();
    for (const pattern of TRACKER_PATTERNS) {
      if (lower.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  public toggleException(originInput: string): boolean {
    let origin = originInput.trim().toLowerCase();
    try {
      origin = new URL(originInput).origin;
    } catch {}

    if (this.exceptions.has(origin)) {
      this.exceptions.delete(origin);
      return false; // Not exempted anymore
    } else {
      this.exceptions.add(origin);
      return true; // Now exempted
    }
  }

  public isOriginExcepted(urlOrOrigin: string): boolean {
    if (!urlOrOrigin) return false;
    try {
      const origin = new URL(urlOrOrigin).origin;
      return this.exceptions.has(origin);
    } catch {
      return this.exceptions.has(urlOrOrigin.trim().toLowerCase());
    }
  }

  public getBlockedCountForTab(key: number | string): number {
    return this.tabBlockedCounts.get(key) || 0;
  }

  public resetTabCounter(key: number | string) {
    this.tabBlockedCounts.set(key, 0);
  }

  public attachToSession(sess: Electron.Session) {
    if (!sess) return;

    sess.webRequest.onBeforeRequest((details, callback) => {
      // If tracking protection is turned off, permit all
      if (this.mode === 'off') {
        callback({ cancel: false });
        return;
      }

      // Check if top-level frame origin is excepted
      const referrerOrOrigin = details.referrer || (details as any).initiator || '';
      if (referrerOrOrigin && this.isOriginExcepted(referrerOrOrigin)) {
        callback({ cancel: false });
        return;
      }

      // Check if requested resource matches known tracker signatures
      if (this.isTrackerUrl(details.url)) {
        // Increment statistics
        this.totalBlocked++;
        if (details.webContentsId) {
          const current = this.tabBlockedCounts.get(details.webContentsId) || 0;
          this.tabBlockedCounts.set(details.webContentsId, current + 1);
        }

        this.notifyStatsUpdated();

        // Block request
        callback({ cancel: true });
        return;
      }

      // Allow request
      callback({ cancel: false });
    });
  }

  private notifyStatsUpdated() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('tracking:statsUpdated', {
        totalBlocked: this.totalBlocked,
      });
    }
  }
}
