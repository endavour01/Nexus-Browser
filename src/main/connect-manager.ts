import type { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { ConnectApp, ConnectCategory, ConnectState, ConnectWorkspace } from '../shared/types';

// ============================================================================
// Default Connect Apps & Workspaces
// ============================================================================
export const DEFAULT_CONNECT_APPS: ConnectApp[] = [
  // CHILL
  {
    id: 'app-discord',
    name: 'Discord',
    url: 'https://discord.com/app',
    category: 'chill',
    icon: 'MessageCircle',
    description: 'Voice, video, and text communication service',
    isFavorite: true,
    isPinned: false,
    order: 0,
    isCustom: false,
    createdAt: 1700000000000,
  },
  {
    id: 'app-telegram',
    name: 'Telegram',
    url: 'https://web.telegram.org',
    category: 'chill',
    icon: 'Send',
    description: 'Fast and secure cloud-based mobile and desktop messaging',
    isFavorite: false,
    isPinned: false,
    order: 1,
    isCustom: false,
    createdAt: 1700000000001,
  },
  {
    id: 'app-whatsapp',
    name: 'WhatsApp Web',
    url: 'https://web.whatsapp.com',
    category: 'chill',
    icon: 'MessageSquare',
    description: 'Simple, reliable, private messaging and calling',
    isFavorite: true,
    isPinned: false,
    order: 2,
    isCustom: false,
    createdAt: 1700000000002,
  },
  {
    id: 'app-reddit',
    name: 'Reddit',
    url: 'https://www.reddit.com',
    category: 'chill',
    icon: 'Flame',
    description: 'Dive into anything: discussions, communities, and trending news',
    isFavorite: false,
    isPinned: false,
    order: 3,
    isCustom: false,
    createdAt: 1700000000003,
  },

  // WORK
  {
    id: 'app-meet',
    name: 'Google Meet',
    url: 'https://meet.google.com',
    category: 'work',
    icon: 'Video',
    description: 'Real-time meetings by Google using your browser',
    isFavorite: true,
    isPinned: false,
    order: 4,
    isCustom: false,
    createdAt: 1700000000004,
  },
  {
    id: 'app-slack',
    name: 'Slack',
    url: 'https://app.slack.com',
    category: 'work',
    icon: 'Hash',
    description: 'Productivity platform transforming communication across teams',
    isFavorite: true,
    isPinned: false,
    order: 5,
    isCustom: false,
    createdAt: 1700000000005,
  },
  {
    id: 'app-teams',
    name: 'Microsoft Teams',
    url: 'https://teams.microsoft.com',
    category: 'work',
    icon: 'Users',
    description: 'Workspace chat, videoconferencing, and file collaboration',
    isFavorite: false,
    isPinned: false,
    order: 6,
    isCustom: false,
    createdAt: 1700000000006,
  },
  {
    id: 'app-zoom',
    name: 'Zoom',
    url: 'https://app.zoom.us/wc',
    category: 'work',
    icon: 'Video',
    description: 'Video conferencing, cloud phone, webinars, and chat',
    isFavorite: false,
    isPinned: false,
    order: 7,
    isCustom: false,
    createdAt: 1700000000007,
  },
  {
    id: 'app-skype',
    name: 'Skype',
    url: 'https://web.skype.com',
    category: 'work',
    icon: 'Phone',
    description: 'Stay in touch with free video calls and worldwide phone messaging',
    isFavorite: false,
    isPinned: false,
    order: 8,
    isCustom: false,
    createdAt: 1700000000008,
  },

  // CREATE / PRODUCTIVITY
  {
    id: 'app-github',
    name: 'GitHub',
    url: 'https://github.com',
    category: 'create',
    icon: 'Code2',
    description: 'Development platform to host, review, and manage code projects',
    isFavorite: true,
    isPinned: false,
    order: 9,
    isCustom: false,
    createdAt: 1700000000009,
  },
  {
    id: 'app-figma',
    name: 'Figma',
    url: 'https://www.figma.com',
    category: 'create',
    icon: 'Layout',
    description: 'Collaborative interface design and interactive prototyping tool',
    isFavorite: true,
    isPinned: false,
    order: 10,
    isCustom: false,
    createdAt: 1700000000010,
  },
  {
    id: 'app-notion',
    name: 'Notion',
    url: 'https://www.notion.so',
    category: 'create',
    icon: 'FileText',
    description: 'Connected workspace for wiki, docs, and project management',
    isFavorite: true,
    isPinned: false,
    order: 11,
    isCustom: false,
    createdAt: 1700000000011,
  },
  {
    id: 'app-docs',
    name: 'Google Docs',
    url: 'https://docs.google.com',
    category: 'create',
    icon: 'File',
    description: 'Online word processor with real-time multi-user editing',
    isFavorite: false,
    isPinned: false,
    order: 12,
    isCustom: false,
    createdAt: 1700000000012,
  },
];

export const DEFAULT_CONNECT_WORKSPACES: ConnectWorkspace[] = [
  {
    id: 'ws-study',
    name: 'STUDY',
    description: 'Academic and learning workspace with collaborative research tools',
    appIds: ['app-meet', 'app-notion', 'app-github', 'app-discord'],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: 'ws-work',
    name: 'WORK',
    description: 'Professional collaboration and team communication suite',
    appIds: ['app-slack', 'app-teams', 'app-meet', 'app-github'],
    createdAt: 1700000000001,
    updatedAt: 1700000000001,
  },
  {
    id: 'ws-chill',
    name: 'CHILL',
    description: 'Social discovery, discussion boards, and casual community hubs',
    appIds: ['app-discord', 'app-reddit', 'app-telegram'],
    createdAt: 1700000000002,
    updatedAt: 1700000000002,
  },
];

// ============================================================================
// ConnectManager Class
// ============================================================================
export class ConnectManager {
  private storageDir: string;
  private filePath: string;
  private mainWindow: BrowserWindow | null = null;

  private apps: ConnectApp[] = [];
  private workspaces: ConnectWorkspace[] = [];

  constructor(storageDir?: string, mainWindow?: BrowserWindow | null) {
    this.storageDir = storageDir || path.join(process.cwd(), 'userData');
    this.mainWindow = mainWindow || null;

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        console.error('[ConnectManager] Failed to create storage directory:', err);
      }
    }

    this.filePath = path.join(this.storageDir, 'nexus-connect.json');
    this.loadState();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  /**
   * Safe URL validation helper
   * Disallows javascript:, data:, vbscript:, file: and requires valid host
   */
  public static validateUrl(inputUrl: string): { valid: boolean; cleanUrl?: string; error?: string } {
    if (!inputUrl || typeof inputUrl !== 'string') {
      return { valid: false, error: 'URL must be a non-empty string' };
    }

    let trimmed = inputUrl.trim();
    if (!trimmed) {
      return { valid: false, error: 'URL cannot be empty' };
    }

    // Block dangerous schemes
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:') ||
      lower.startsWith('blob:')
    ) {
      return { valid: false, error: 'Invalid URL scheme. Only HTTP and HTTPS URLs are permitted.' };
    }

    // Auto-prepend https if missing scheme
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTP and HTTPS URLs are permitted.' };
      }
      if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
        // Allow localhost
        if (parsed.hostname !== 'localhost') {
          return { valid: false, error: 'URL must have a valid domain hostname.' };
        }
      }
      return { valid: true, cleanUrl: parsed.toString() };
    } catch {
      return { valid: false, error: 'Malformed URL. Please enter a valid web address.' };
    }
  }

  /**
   * Load state with corruption tolerance
   */
  private loadState() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const data: ConnectState = JSON.parse(raw);

        if (Array.isArray(data.apps) && Array.isArray(data.workspaces)) {
          this.apps = data.apps;
          this.workspaces = data.workspaces;
        } else {
          console.warn('[ConnectManager] Corrupted schema in nexus-connect.json, resetting to defaults');
          this.resetToDefaults();
        }
      } else {
        this.resetToDefaults();
      }
    } catch (err) {
      console.error('[ConnectManager] Failed to read or parse nexus-connect.json, resetting:', err);
      this.resetToDefaults();
    }
  }

  private resetToDefaults() {
    this.apps = JSON.parse(JSON.stringify(DEFAULT_CONNECT_APPS));
    this.workspaces = JSON.parse(JSON.stringify(DEFAULT_CONNECT_WORKSPACES));
    this.saveState();
  }

  private saveState() {
    try {
      const state: ConnectState = {
        apps: this.apps,
        workspaces: this.workspaces,
      };

      const tempFile = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
      fs.renameSync(tempFile, this.filePath);
    } catch (err) {
      console.error('[ConnectManager] Failed to save nexus-connect.json:', err);
    }
  }

  private notifyUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('connect:updated', {
        apps: this.getApps(),
        workspaces: this.getWorkspaces(),
      });
    }
  }

  // ==========================================================================
  // Apps Management
  // ==========================================================================

  public getApps(): ConnectApp[] {
    return [...this.apps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public saveApp(input: Partial<ConnectApp> & { name: string; url: string }): ConnectApp {
    const cleanName = (input.name || '').trim();
    if (!cleanName) {
      throw new Error('Application name is required');
    }

    const valResult = ConnectManager.validateUrl(input.url);
    if (!valResult.valid || !valResult.cleanUrl) {
      throw new Error(valResult.error || 'Invalid application URL');
    }

    const now = Date.now();

    if (input.id) {
      const idx = this.apps.findIndex((a) => a.id === input.id);
      if (idx !== -1) {
        const existing = this.apps[idx];
        const updated: ConnectApp = {
          ...existing,
          name: cleanName,
          url: valResult.cleanUrl,
          category: input.category || existing.category || 'work',
          icon: input.icon !== undefined ? input.icon : existing.icon,
          isFavorite: input.isFavorite !== undefined ? input.isFavorite : existing.isFavorite,
          isPinned: input.isPinned !== undefined ? input.isPinned : existing.isPinned,
          description: input.description !== undefined ? input.description.trim() : existing.description,
          order: input.order !== undefined ? input.order : existing.order,
          updatedAt: now,
        };

        this.apps[idx] = updated;
        this.saveState();
        this.notifyUpdate();
        return updated;
      }
    }

    // Create New Custom App
    const newId = `app-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const maxOrder = this.apps.reduce((max, a) => Math.max(max, a.order ?? 0), -1);

    const newApp: ConnectApp = {
      id: newId,
      name: cleanName,
      url: valResult.cleanUrl,
      category: input.category || 'work',
      icon: input.icon || 'Globe',
      isFavorite: !!input.isFavorite,
      isPinned: !!input.isPinned,
      description: input.description ? input.description.trim() : undefined,
      order: maxOrder + 1,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    this.apps.push(newApp);
    this.saveState();
    this.notifyUpdate();
    return newApp;
  }

  public deleteApp(id: string): boolean {
    const initialLen = this.apps.length;
    this.apps = this.apps.filter((a) => a.id !== id);

    if (this.apps.length !== initialLen) {
      // Clean up membership from workspaces
      this.workspaces = this.workspaces.map((ws) => ({
        ...ws,
        appIds: ws.appIds.filter((appId) => appId !== id),
      }));

      this.saveState();
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  public reorderApps(appIds: string[]): ConnectApp[] {
    const map = new Map(this.apps.map((a) => [a.id, a]));
    const reordered: ConnectApp[] = [];

    appIds.forEach((id, index) => {
      const app = map.get(id);
      if (app) {
        app.order = index;
        reordered.push(app);
        map.delete(id);
      }
    });

    // Append any apps not explicitly included in reorder array
    let nextOrder = reordered.length;
    map.forEach((app) => {
      app.order = nextOrder++;
      reordered.push(app);
    });

    this.apps = reordered;
    this.saveState();
    this.notifyUpdate();
    return this.getApps();
  }

  public resetDefaultApps(): ConnectApp[] {
    this.resetToDefaults();
    this.notifyUpdate();
    return this.getApps();
  }

  // ==========================================================================
  // Workspaces Management
  // ==========================================================================

  public getWorkspaces(): ConnectWorkspace[] {
    return [...this.workspaces];
  }

  public saveWorkspace(input: Partial<ConnectWorkspace> & { name: string }): ConnectWorkspace {
    const cleanName = (input.name || '').trim();
    if (!cleanName) {
      throw new Error('Workspace group name is required');
    }

    const now = Date.now();

    if (input.id) {
      const idx = this.workspaces.findIndex((w) => w.id === input.id);
      if (idx !== -1) {
        const existing = this.workspaces[idx];
        const updated: ConnectWorkspace = {
          ...existing,
          name: cleanName,
          description: input.description !== undefined ? input.description.trim() : existing.description,
          appIds: Array.isArray(input.appIds) ? [...new Set(input.appIds)] : existing.appIds,
          updatedAt: now,
        };

        this.workspaces[idx] = updated;
        this.saveState();
        this.notifyUpdate();
        return updated;
      }
    }

    // Create New Workspace Group
    const newId = `ws-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${now}`;
    const newWs: ConnectWorkspace = {
      id: newId,
      name: cleanName,
      description: input.description ? input.description.trim() : undefined,
      appIds: Array.isArray(input.appIds) ? [...new Set(input.appIds)] : [],
      createdAt: now,
      updatedAt: now,
    };

    this.workspaces.push(newWs);
    this.saveState();
    this.notifyUpdate();
    return newWs;
  }

  public deleteWorkspace(id: string): boolean {
    const initialLen = this.workspaces.length;
    this.workspaces = this.workspaces.filter((w) => w.id !== id);

    if (this.workspaces.length !== initialLen) {
      this.saveState();
      this.notifyUpdate();
      return true;
    }
    return false;
  }
}
