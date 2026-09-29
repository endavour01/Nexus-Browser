import { app, BrowserWindow, session, WebContents } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  PermissionType,
  PermissionDecision,
  SitePermissionRule,
  PermissionPromptRequest,
} from '../shared/types';

export class PermissionManager {
  private filePath: string;
  private rules: Map<string, SitePermissionRule> = new Map(); // key: `${origin}:${permission}`
  private mainWindow: BrowserWindow | null = null;
  private pendingRequests: Map<
    string,
    { callback: (allowed: boolean) => void; origin: string; permission: PermissionType }
  > = new Map();

  constructor(customPath?: string, mainWindow?: BrowserWindow | null) {
    this.mainWindow = mainWindow || null;

    if (customPath) {
      this.filePath = customPath;
    } else {
      let baseDir = process.cwd();
      try {
        baseDir = app.getPath('userData');
      } catch {
        baseDir = path.join(process.cwd(), '.nexus-data');
      }
      this.filePath = path.join(baseDir, 'nexus-site-permissions.json');
    }

    this.load();
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  private getKey(origin: string, permission: PermissionType): string {
    return `${origin.toLowerCase()}:${permission}`;
  }

  public normalizeOrigin(urlOrOrigin: string): string {
    if (!urlOrOrigin) return 'unknown';
    try {
      const u = new URL(urlOrOrigin);
      return u.origin;
    } catch {
      return urlOrOrigin.trim().toLowerCase();
    }
  }

  public load(): SitePermissionRule[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.rules.clear();
        return [];
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);

      this.rules.clear();
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.origin && item.permission && item.decision) {
            const key = this.getKey(item.origin, item.permission);
            this.rules.set(key, {
              origin: item.origin,
              permission: item.permission,
              decision: item.decision,
              updatedAt: item.updatedAt || Date.now(),
            });
          }
        }
      }
      return this.getAll();
    } catch (err) {
      console.error('[NEXUS Permissions] Failed to load permissions:', err);
      this.rules.clear();
      return [];
    }
  }

  public save(): boolean {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const list = Array.from(this.rules.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error('[NEXUS Permissions] Failed to save permissions:', err);
      return false;
    }
  }

  public getAll(): SitePermissionRule[] {
    return Array.from(this.rules.values());
  }

  public getForOrigin(originInput: string): SitePermissionRule[] {
    const origin = this.normalizeOrigin(originInput);
    return Array.from(this.rules.values()).filter((r) => r.origin === origin);
  }

  public getRule(originInput: string, permission: PermissionType): SitePermissionRule | undefined {
    const origin = this.normalizeOrigin(originInput);
    const key = this.getKey(origin, permission);
    return this.rules.get(key);
  }

  public getDecision(originInput: string, permission: PermissionType): PermissionDecision {
    const origin = this.normalizeOrigin(originInput);
    const key = this.getKey(origin, permission);
    const rule = this.rules.get(key);
    return rule ? rule.decision : 'ask';
  }

  public setRule(
    originInput: string,
    permission: PermissionType,
    decision: PermissionDecision
  ): SitePermissionRule {
    const origin = this.normalizeOrigin(originInput);
    const key = this.getKey(origin, permission);
    const rule: SitePermissionRule = {
      origin,
      permission,
      decision,
      updatedAt: Date.now(),
    };

    this.rules.set(key, rule);
    this.save();
    return rule;
  }

  public removeRule(originInput: string, permission: PermissionType): boolean {
    const origin = this.normalizeOrigin(originInput);
    const key = this.getKey(origin, permission);
    const existed = this.rules.delete(key);
    if (existed) {
      this.save();
    }
    return existed;
  }

  public clearAll(): boolean {
    this.rules.clear();
    return this.save();
  }

  public mapElectronPermission(perm: string): PermissionType | null {
    switch (perm) {
      case 'media':
      case 'video-capture':
        return 'camera';
      case 'audio-capture':
        return 'microphone';
      case 'geolocation':
        return 'geolocation';
      case 'notifications':
        return 'notifications';
      case 'midi':
      case 'midiSysex':
        return 'midi';
      case 'pointerLock':
        return 'pointerLock';
      case 'fullscreen':
        return 'fullscreen';
      case 'openExternal':
        return 'openExternal';
      default:
        return null;
    }
  }

  public attachToSession(sess: Electron.Session) {
    if (!sess) return;

    // Check handler (synchronous)
    sess.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
      // Safe common web permissions allowed by default
      if (['fullscreen', 'clipboard-read', 'clipboard-sanitized-write'].includes(permission)) {
        return true;
      }

      const mapped = this.mapElectronPermission(permission);
      if (!mapped) return false;

      const origin = this.normalizeOrigin(requestingOrigin || (webContents ? webContents.getURL() : ''));
      const decision = this.getDecision(origin, mapped);
      return decision === 'allow';
    });

    // Request handler (asynchronous, prompt-capable)
    sess.setPermissionRequestHandler((webContents, permission, callback, details) => {
      // Fast path: safe permissions
      if (['fullscreen', 'clipboard-read', 'clipboard-sanitized-write'].includes(permission)) {
        callback(true);
        return;
      }

      const mapped = this.mapElectronPermission(permission);
      if (!mapped) {
        console.warn(`[NEXUS Permissions] Blocked unmapped permission request: ${permission}`);
        callback(false);
        return;
      }

      const url = details?.requestingUrl || (webContents ? webContents.getURL() : '');
      const origin = this.normalizeOrigin(url);

      // Check stored rule
      const decision = this.getDecision(origin, mapped);
      if (decision === 'allow') {
        callback(true);
        return;
      }
      if (decision === 'deny') {
        callback(false);
        return;
      }

      // If 'ask' and we have a UI window, prompt the user
      this.promptUser(webContents, origin, mapped, callback);
    });
  }

  private promptUser(
    webContents: WebContents | null,
    origin: string,
    permission: PermissionType,
    callback: (allowed: boolean) => void
  ) {
    const requestId = `perm-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.pendingRequests.set(requestId, { callback, origin, permission });

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const prompt: PermissionPromptRequest = {
        requestId,
        tabId: webContents ? `tab-wc-${webContents.id}` : '',
        origin,
        permission,
        title: webContents ? webContents.getTitle() : origin,
      };
      this.mainWindow.webContents.send('permissions:prompt', prompt);
    } else {
      // No UI available to prompt, deny by default
      callback(false);
      this.pendingRequests.delete(requestId);
    }
  }

  public handlePromptResponse(requestId: string, allow: boolean, remember: boolean): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) return false;

    if (remember) {
      this.setRule(pending.origin, pending.permission, allow ? 'allow' : 'deny');
    }

    pending.callback(allow);
    this.pendingRequests.delete(requestId);
    return true;
  }

  public resolvePrompt(requestId: string, allow: boolean, remember: boolean): boolean {
    return this.handlePromptResponse(requestId, allow, remember);
  }
}
