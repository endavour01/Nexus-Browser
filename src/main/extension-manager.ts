import { app, session, BrowserWindow, WebContentsView } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  InstalledExtension,
  ExtensionValidationResult,
  ExtensionCompatibility,
  ExtensionPermissionWarning,
} from '../shared/types';

const KNOWN_UNSUPPORTED_APIS = [
  'bookmarks',
  'history',
  'downloads',
  'management',
  'identity',
  'notifications',
  'tts',
  'privacy',
  'topSites',
  'vpnProvider',
  'proxy',
  'omnibox',
  'pageCapture',
  'tabCapture',
  'desktopCapture',
  'system.cpu',
  'system.memory',
  'system.storage',
];

const KNOWN_SUPPORTED_APIS = [
  'storage',
  'contextMenus',
  'webRequest',
  'tabs',
  'activeTab',
  'scripting',
  'alarms',
  'cookies',
  'unlimitedStorage',
];

export class ExtensionManager {
  private filePath: string;
  private extensions: Map<string, InstalledExtension> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private popupWindow: BrowserWindow | null = null;

  constructor(mainWindow?: BrowserWindow) {
    this.mainWindow = mainWindow || null;
    try {
      const userData = app.getPath('userData');
      this.filePath = path.join(userData, 'nexus-extensions.json');
    } catch {
      this.filePath = path.join(process.cwd(), '.nexus-extensions.json');
    }
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public getFilePath(): string {
    return this.filePath;
  }

  /**
   * Initializes the extension manager on startup and reloads enabled extensions into defaultSession.
   */
  public async init(): Promise<void> {
    this.loadFromDisk();

    for (const ext of this.extensions.values()) {
      if (ext.enabled) {
        try {
          if (!fs.existsSync(ext.path)) {
            ext.error = 'Extension directory no longer exists on disk';
            ext.enabled = false;
            continue;
          }
          await session.defaultSession.loadExtension(ext.path, { allowFileAccess: true });
          ext.error = undefined;
        } catch (err: any) {
          console.warn(`[NEXUS ExtensionManager] Could not reload extension "${ext.name}":`, err.message);
          ext.error = err.message || 'Failed to load extension into session';
        }
      }
    }

    this.saveToDisk();
    this.notifyExtensionsUpdated();
  }

  /**
   * Reads, parses and validates an unpacked extension's manifest.json from local disk.
   */
  public async validateManifest(folderPath: string): Promise<ExtensionValidationResult> {
    if (!folderPath || typeof folderPath !== 'string') {
      return {
        valid: false,
        name: '',
        version: '',
        description: '',
        manifestVersion: 0,
        path: folderPath || '',
        permissions: [],
        hostPermissions: [],
        warnings: [],
        compatibility: {
          status: 'incompatible',
          notes: ['Invalid path specified.'],
          unsupportedPermissions: [],
        },
        error: 'Invalid directory path specified.',
      };
    }

    const resolvedPath = path.resolve(folderPath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        valid: false,
        name: '',
        version: '',
        description: '',
        manifestVersion: 0,
        path: resolvedPath,
        permissions: [],
        hostPermissions: [],
        warnings: [],
        compatibility: {
          status: 'incompatible',
          notes: ['Directory does not exist.'],
          unsupportedPermissions: [],
        },
        error: `Directory does not exist: ${resolvedPath}`,
      };
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return {
        valid: false,
        name: '',
        version: '',
        description: '',
        manifestVersion: 0,
        path: resolvedPath,
        permissions: [],
        hostPermissions: [],
        warnings: [],
        compatibility: {
          status: 'incompatible',
          notes: ['Path is not a directory.'],
          unsupportedPermissions: [],
        },
        error: 'Specified path is a file, not an extension directory.',
      };
    }

    const manifestFile = path.join(resolvedPath, 'manifest.json');
    if (!fs.existsSync(manifestFile)) {
      return {
        valid: false,
        name: path.basename(resolvedPath),
        version: '',
        description: '',
        manifestVersion: 0,
        path: resolvedPath,
        permissions: [],
        hostPermissions: [],
        warnings: [],
        compatibility: {
          status: 'incompatible',
          notes: ['manifest.json not found in extension directory.'],
          unsupportedPermissions: [],
        },
        error: 'manifest.json file not found in specified directory.',
      };
    }

    let manifest: any;
    try {
      const rawContent = fs.readFileSync(manifestFile, 'utf8');
      manifest = JSON.parse(rawContent);
    } catch (err: any) {
      return {
        valid: false,
        name: path.basename(resolvedPath),
        version: '',
        description: '',
        manifestVersion: 0,
        path: resolvedPath,
        permissions: [],
        hostPermissions: [],
        warnings: [],
        compatibility: {
          status: 'incompatible',
          notes: ['manifest.json is not valid JSON.'],
          unsupportedPermissions: [],
        },
        error: `Failed to parse manifest.json: ${err.message}`,
      };
    }

    const manifestVersion = Number(manifest.manifest_version);
    if (manifestVersion !== 2 && manifestVersion !== 3) {
      return {
        valid: false,
        name: manifest.name || path.basename(resolvedPath),
        version: manifest.version || '0.0.0',
        description: manifest.description || '',
        manifestVersion: manifestVersion || 0,
        path: resolvedPath,
        permissions: [],
        hostPermissions: [],
        warnings: [],
        compatibility: {
          status: 'incompatible',
          notes: ['Only Manifest V2 and Manifest V3 are supported in Electron.'],
          unsupportedPermissions: [],
        },
        error: `Unsupported manifest_version: ${manifest.manifest_version}. Only V2 and V3 are supported.`,
      };
    }

    const name = manifest.name || path.basename(resolvedPath);
    const version = manifest.version || '1.0.0';
    const description = manifest.description || '';

    // Collect permissions
    const rawPermissions: string[] = Array.isArray(manifest.permissions) ? manifest.permissions : [];
    const optionalPermissions: string[] = Array.isArray(manifest.optional_permissions)
      ? manifest.optional_permissions
      : [];
    const hostPermissions: string[] = Array.isArray(manifest.host_permissions)
      ? manifest.host_permissions
      : [];

    const allPermissions = Array.from(new Set([...rawPermissions, ...optionalPermissions]));

    // Evaluate compatibility
    const unsupportedPermissions: string[] = [];
    const compatibilityNotes: string[] = [];

    for (const perm of allPermissions) {
      if (KNOWN_UNSUPPORTED_APIS.includes(perm.toLowerCase())) {
        unsupportedPermissions.push(perm);
      }
    }

    let compatibilityStatus: 'compatible' | 'partially_compatible' | 'incompatible' = 'compatible';

    if (unsupportedPermissions.length > 0) {
      compatibilityStatus = 'partially_compatible';
      compatibilityNotes.push(
        `Uses permissions not supported by Electron: ${unsupportedPermissions.join(', ')}`
      );
    }

    if (manifestVersion === 3 && manifest.background?.service_worker) {
      compatibilityNotes.push('Uses Manifest V3 Background Service Worker (supported in Electron 33).');
    }

    if (manifestVersion === 2 && manifest.background?.scripts) {
      compatibilityNotes.push('Uses Manifest V2 Background Scripts (supported in Electron).');
    }

    // Permission warnings with risk breakdown
    const warnings: ExtensionPermissionWarning[] = [];

    // Host permissions warning
    const combinedHosts = [
      ...hostPermissions,
      ...rawPermissions.filter((p) => p.includes('://') || p === '<all_urls>'),
    ];

    if (combinedHosts.includes('<all_urls>') || combinedHosts.some((h) => h.includes('*://*/*'))) {
      warnings.push({
        permission: '<all_urls>',
        title: 'Full Website Access',
        description: 'Can read and modify your data on all websites you visit.',
        severity: 'high',
      });
    } else if (combinedHosts.length > 0) {
      warnings.push({
        permission: combinedHosts.join(', '),
        title: 'Specific Website Access',
        description: `Can read and modify data on: ${combinedHosts.slice(0, 3).join(', ')}${
          combinedHosts.length > 3 ? '...' : ''
        }`,
        severity: 'medium',
      });
    }

    if (allPermissions.includes('webRequest') || allPermissions.includes('webRequestBlocking')) {
      warnings.push({
        permission: 'webRequest',
        title: 'Network Traffic Interception',
        description: 'Can inspect, block, or modify network requests and headers.',
        severity: 'high',
      });
    }

    if (allPermissions.includes('cookies')) {
      warnings.push({
        permission: 'cookies',
        title: 'Cookies & Authentication',
        description: 'Can access and change cookies stored by websites.',
        severity: 'medium',
      });
    }

    if (allPermissions.includes('storage') || allPermissions.includes('unlimitedStorage')) {
      warnings.push({
        permission: 'storage',
        title: 'Browser Storage',
        description: 'Can store and retrieve settings and data locally.',
        severity: 'low',
      });
    }

    if (allPermissions.includes('tabs') || allPermissions.includes('activeTab')) {
      warnings.push({
        permission: 'tabs',
        title: 'Tab Details & Navigation',
        description: 'Can read active tab URL, title, and perform script injections.',
        severity: 'medium',
      });
    }

    if (allPermissions.includes('contextMenus')) {
      warnings.push({
        permission: 'contextMenus',
        title: 'Custom Context Menus',
        description: 'Can add custom menu items to right-click menus.',
        severity: 'low',
      });
    }

    if (allPermissions.includes('scripting')) {
      warnings.push({
        permission: 'scripting',
        title: 'Script Execution',
        description: 'Can inject and execute JavaScript into web pages.',
        severity: 'medium',
      });
    }

    // Action popup
    const actionObj = manifest.action || manifest.browser_action || manifest.page_action || {};
    let actionInfo: { title?: string; popup?: string; icon?: string } | undefined;
    if (actionObj.default_popup || actionObj.default_title || actionObj.default_icon) {
      actionInfo = {
        title: actionObj.default_title || name,
        popup: actionObj.default_popup,
        icon: typeof actionObj.default_icon === 'string' ? actionObj.default_icon : undefined,
      };
    }

    // Try reading extension icon as base64
    let iconDataUrl: string | undefined;
    const iconsObj = manifest.icons || {};
    const iconCandidates = [iconsObj['128'], iconsObj['48'], iconsObj['32'], iconsObj['16'], actionInfo?.icon].filter(
      Boolean
    );

    for (const iconRel of iconCandidates) {
      try {
        const fullIconPath = path.join(resolvedPath, iconRel);
        if (fs.existsSync(fullIconPath)) {
          const buf = fs.readFileSync(fullIconPath);
          const ext = path.extname(fullIconPath).replace('.', '').toLowerCase() || 'png';
          iconDataUrl = `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${buf.toString('base64')}`;
          break;
        }
      } catch {
        // Ignore icon read error
      }
    }

    const compatibility: ExtensionCompatibility = {
      status: compatibilityStatus,
      notes: compatibilityNotes,
      unsupportedPermissions,
    };

    return {
      valid: true,
      name,
      version,
      description,
      manifestVersion,
      path: resolvedPath,
      permissions: allPermissions,
      hostPermissions: combinedHosts,
      warnings,
      compatibility,
      action: actionInfo,
      iconDataUrl,
    };
  }

  /**
   * Installs an extension into defaultSession, saves metadata to disk, and notifies the UI.
   */
  public async install(folderPath: string): Promise<InstalledExtension> {
    const validation = await this.validateManifest(folderPath);
    if (!validation.valid) {
      throw new Error(validation.error || 'Extension validation failed.');
    }

    // Load into Electron's session
    let loadedExt: Electron.Extension;
    try {
      loadedExt = await session.defaultSession.loadExtension(validation.path, {
        allowFileAccess: true,
      });
    } catch (err: any) {
      throw new Error(`Electron failed to load extension: ${err.message}`);
    }

    const installed: InstalledExtension = {
      id: loadedExt.id,
      name: validation.name || loadedExt.name,
      version: validation.version || loadedExt.version,
      description: validation.description,
      path: validation.path,
      enabled: true,
      manifestVersion: validation.manifestVersion,
      permissions: validation.permissions,
      hostPermissions: validation.hostPermissions,
      icons: (loadedExt.manifest as any)?.icons,
      iconDataUrl: validation.iconDataUrl,
      action: validation.action,
      homepageUrl: (loadedExt.manifest as any)?.homepage_url,
      installedAt: Date.now(),
      compatibility: validation.compatibility,
    };

    this.extensions.set(installed.id, installed);
    this.saveToDisk();
    this.notifyExtensionsUpdated();

    return installed;
  }

  /**
   * Enables an installed extension.
   */
  public async enable(extensionId: string): Promise<boolean> {
    const ext = this.extensions.get(extensionId);
    if (!ext) return false;

    if (!fs.existsSync(ext.path)) {
      ext.error = 'Extension directory not found on disk';
      ext.enabled = false;
      this.saveToDisk();
      this.notifyExtensionsUpdated();
      return false;
    }

    try {
      await session.defaultSession.loadExtension(ext.path, { allowFileAccess: true });
      ext.enabled = true;
      ext.error = undefined;
      this.saveToDisk();
      this.notifyExtensionsUpdated();
      return true;
    } catch (err: any) {
      ext.error = err.message || 'Failed to enable extension';
      this.saveToDisk();
      this.notifyExtensionsUpdated();
      return false;
    }
  }

  /**
   * Disables an installed extension by removing it from the session.
   */
  public async disable(extensionId: string): Promise<boolean> {
    const ext = this.extensions.get(extensionId);
    if (!ext) return false;

    try {
      session.defaultSession.removeExtension(extensionId);
    } catch (err) {
      console.warn(`[NEXUS ExtensionManager] removeExtension warning for ${extensionId}:`, err);
    }

    ext.enabled = false;
    ext.error = undefined;
    this.saveToDisk();
    this.notifyExtensionsUpdated();
    return true;
  }

  /**
   * Reloads an installed extension in the active session.
   */
  public async reload(extensionId: string): Promise<boolean> {
    const ext = this.extensions.get(extensionId);
    if (!ext) return false;

    try {
      session.defaultSession.removeExtension(extensionId);
    } catch {
      // Ignore removal failure if not currently active
    }

    try {
      const reloaded = await session.defaultSession.loadExtension(ext.path, { allowFileAccess: true });
      // Update fresh manifest info
      const validation = await this.validateManifest(ext.path);
      if (validation.valid) {
        ext.version = validation.version;
        ext.description = validation.description;
        ext.iconDataUrl = validation.iconDataUrl;
        ext.permissions = validation.permissions;
        ext.hostPermissions = validation.hostPermissions;
        ext.action = validation.action;
        ext.compatibility = validation.compatibility;
      }
      ext.id = reloaded.id;
      ext.enabled = true;
      ext.error = undefined;
      this.saveToDisk();
      this.notifyExtensionsUpdated();
      return true;
    } catch (err: any) {
      ext.error = err.message || 'Failed to reload extension';
      this.saveToDisk();
      this.notifyExtensionsUpdated();
      return false;
    }
  }

  /**
   * Uninstalls and permanently removes an extension.
   */
  public async uninstall(extensionId: string): Promise<boolean> {
    const ext = this.extensions.get(extensionId);
    if (!ext) return false;

    try {
      session.defaultSession.removeExtension(extensionId);
    } catch {
      // Ignore if not loaded
    }

    this.extensions.delete(extensionId);
    this.saveToDisk();
    this.notifyExtensionsUpdated();
    return true;
  }

  /**
   * Lists all installed extensions.
   */
  public list(): InstalledExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Opens an extension's action popup in a floating borderless window.
   */
  public async openPopup(extensionId: string): Promise<void> {
    const ext = this.extensions.get(extensionId);
    if (!ext || !ext.enabled || !ext.action?.popup) {
      console.warn(`[NEXUS ExtensionManager] No popup available for extension: ${extensionId}`);
      return;
    }

    // Close any previous popup
    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      this.popupWindow.close();
      this.popupWindow = null;
    }

    const popupHtml = ext.action.popup.replace(/^\/+/, '');
    const popupUrl = `chrome-extension://${extensionId}/${popupHtml}`;

    let x: number | undefined;
    let y: number | undefined;

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const [winX, winY] = this.mainWindow.getPosition();
      const [winW] = this.mainWindow.getSize();
      x = winX + winW - 380;
      y = winY + 84;
    }

    this.popupWindow = new BrowserWindow({
      width: 360,
      height: 480,
      x,
      y,
      show: false,
      frame: false,
      resizable: true,
      parent: this.mainWindow || undefined,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: '#12151D',
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.popupWindow.on('blur', () => {
      if (this.popupWindow && !this.popupWindow.isDestroyed()) {
        this.popupWindow.close();
        this.popupWindow = null;
      }
    });

    try {
      await this.popupWindow.loadURL(popupUrl);
      this.popupWindow.show();
    } catch (err: any) {
      console.error(`[NEXUS ExtensionManager] Failed to load popup URL (${popupUrl}):`, err.message);
      if (this.popupWindow && !this.popupWindow.isDestroyed()) {
        this.popupWindow.close();
        this.popupWindow = null;
      }
    }
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        return;
      }
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.extensions)) {
        this.extensions.clear();
        for (const ext of data.extensions) {
          if (ext && ext.id && ext.path) {
            this.extensions.set(ext.id, ext);
          }
        }
      }
    } catch (err) {
      console.error('[NEXUS ExtensionManager] Error reading extensions from disk:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        version: 1,
        extensions: Array.from(this.extensions.values()),
      };

      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[NEXUS ExtensionManager] Error saving extensions to disk:', err);
    }
  }

  private notifyExtensionsUpdated(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    const list = this.list();
    this.mainWindow.webContents.send('extensions:updated', list);
  }
}
