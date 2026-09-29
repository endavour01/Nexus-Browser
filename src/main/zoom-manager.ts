import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { SiteZoomPreference } from '../shared/types';

export class ZoomManager {
  private filePath: string;
  private preferences: Map<string, SiteZoomPreference> = new Map();

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const userDataDir = app?.getPath ? app.getPath('userData') : process.cwd();
      this.filePath = path.join(userDataDir, 'nexus-site-zoom.json');
    }
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data: SiteZoomPreference[] = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.preferences.clear();
          for (const item of data) {
            if (item && item.origin && typeof item.zoomFactor === 'number') {
              this.preferences.set(item.origin, item);
            }
          }
        }
      }
    } catch (err) {
      console.error('[ZoomManager] Error loading zoom preferences:', err);
    }
  }

  private save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.preferences.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ZoomManager] Error saving zoom preferences:', err);
    }
  }

  public extractHostOrOrigin(rawUrl: string): string {
    if (!rawUrl || rawUrl.startsWith('nexus://')) return '';
    try {
      const u = new URL(rawUrl);
      return u.hostname || u.origin;
    } catch {
      return '';
    }
  }

  public getSiteZoom(rawUrlOrHost: string): number {
    const key = rawUrlOrHost.includes('://') ? this.extractHostOrOrigin(rawUrlOrHost) : rawUrlOrHost;
    if (!key) return 1.0;
    const pref = this.preferences.get(key);
    return pref ? pref.zoomFactor : 1.0;
  }

  public setSiteZoom(rawUrlOrHost: string, zoomFactor: number): void {
    const key = rawUrlOrHost.includes('://') ? this.extractHostOrOrigin(rawUrlOrHost) : rawUrlOrHost;
    if (!key) return;

    // Constrain reasonable zoom factor bounds: 0.25 to 5.0
    const clamped = Math.min(5.0, Math.max(0.25, zoomFactor));

    if (Math.abs(clamped - 1.0) < 0.001) {
      // Default zoom, remove explicit preference to keep storage clean
      this.preferences.delete(key);
    } else {
      this.preferences.set(key, {
        origin: key,
        zoomFactor: clamped,
        updatedAt: Date.now(),
      });
    }
    this.save();
  }

  public getAllSiteZooms(): SiteZoomPreference[] {
    return Array.from(this.preferences.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public removeSiteZoom(rawUrlOrHost: string): boolean {
    const key = rawUrlOrHost.includes('://') ? this.extractHostOrOrigin(rawUrlOrHost) : rawUrlOrHost;
    if (!key) return false;
    const deleted = this.preferences.delete(key);
    if (deleted) this.save();
    return deleted;
  }

  public clearAll() {
    this.preferences.clear();
    this.save();
  }
}
