import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { SavedSessionData } from '../shared/types';

export class SessionStore {
  private filePath: string;

  constructor() {
    try {
      const userData = app.getPath('userData');
      this.filePath = path.join(userData, 'nexus-session.json');
    } catch {
      // Fallback for tests running outside packaged electron environment
      this.filePath = path.join(process.cwd(), '.nexus-session.json');
    }
  }

  public getFilePath(): string {
    return this.filePath;
  }

  public save(data: SavedSessionData): boolean {
    try {
      // Do not restore private browsing tabs
      const sanitizedTabs = (data.tabs || []).filter((tab) => {
        // Exclude private tabs or empty invalid URLs
        return !tab.url.startsWith('nexus://private') && !(tab as any).isPrivate;
      });

      const sanitizedData: SavedSessionData = {
        ...data,
        version: 1,
        tabs: sanitizedTabs,
        workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
        recentlyClosed: Array.isArray(data.recentlyClosed) ? data.recentlyClosed : [],
      };

      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write atomically to temporary file first then rename
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(sanitizedData, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error('[NEXUS SessionStore] Failed to save session:', err);
      return false;
    }
  }

  public load(): SavedSessionData | null {
    try {
      if (!fs.existsSync(this.filePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as SavedSessionData;

      if (!parsed || !Array.isArray(parsed.tabs)) {
        console.warn('[NEXUS SessionStore] Invalid session schema detected');
        return null;
      }
      if (!Array.isArray(parsed.workspaces)) {
        parsed.workspaces = [];
      }
      if (!Array.isArray(parsed.groups)) {
        parsed.groups = [];
      }
      if (!Array.isArray(parsed.recentlyClosed)) {
        parsed.recentlyClosed = [];
      }
      return parsed;
    } catch (err) {
      console.error('[NEXUS SessionStore] Failed to load session:', err);
      return null;
    }
  }

  public clear(): boolean {
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
      return true;
    } catch (err) {
      console.error('[NEXUS SessionStore] Failed to clear session file:', err);
      return false;
    }
  }
}
