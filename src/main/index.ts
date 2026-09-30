import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { TabManager } from './tab-manager';
import { ExtensionManager } from './extension-manager';
import { BookmarksStore } from './bookmarks-store';
import { HistoryStore } from './history-store';
import { DownloadManager } from './download-manager';
import { ProfileManager } from './profile-manager';
import { PermissionManager } from './permission-manager';
import { SecurityManager } from './security-manager';
import { TrackingProtection } from './tracking-protection';
import { ShieldEngine } from './shield-engine';
import { NetworkMonitor } from './network-monitor';
import { ZoomManager } from './zoom-manager';
import { DeveloperToolsManager } from './developer-tools-manager';
import { ModeOptimizer } from './mode-optimizer';
import { NotesManager } from './notes-manager';
import { IntelligenceManager } from './intelligence-manager';
import { MarketsManager } from './markets-manager';
import { TodoManager } from './todo-manager';
import { VpnManager } from './vpn-manager';
import { ClearDataOptions, PermissionType, PermissionDecision, TrackingProtectionMode, NexusBrowserMode, ModeBehaviorConfig } from '../shared/types';

// Ensure smooth launch on Linux systems without hardware GPU or SUID sandbox helper
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let mainWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;
let extensionManager: ExtensionManager | null = null;
let bookmarksStore: BookmarksStore | null = null;
let downloadManager: DownloadManager | null = null;
let profileManager: ProfileManager | null = null;
let permissionManager: PermissionManager | null = null;
let securityManager: SecurityManager | null = null;
let trackingProtection: TrackingProtection | null = null;
let shieldEngine: ShieldEngine | null = null;
let networkMonitor: NetworkMonitor | null = null;
let zoomManager: ZoomManager | null = null;
let developerToolsManager: DeveloperToolsManager | null = null;
let modeOptimizer: ModeOptimizer | null = null;
let notesManager: NotesManager | null = null;
let intelligenceManager: IntelligenceManager | null = null;
let marketsManager: MarketsManager | null = null;
let todoManager: TodoManager | null = null;
const vpnManager = new VpnManager();

const isDev = process.env.ELECTRON_IS_DEV === '1';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 840,
    minHeight: 520,
    frame: false, // Frameless window for custom dark power-user titlebar
    backgroundColor: '#0b0d11',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  profileManager = new ProfileManager();
  permissionManager = new PermissionManager(undefined, mainWindow);
  securityManager = new SecurityManager(mainWindow);

  const activeProfile = profileManager.getActiveProfile();
  const profilePaths = profileManager.getProfileDataPaths(activeProfile.id);

  const storageDir = profilePaths.downloads ? path.dirname(profilePaths.downloads) : undefined;
  shieldEngine = new ShieldEngine(mainWindow, storageDir);
  trackingProtection = shieldEngine as any;

  bookmarksStore = new BookmarksStore(profilePaths.bookmarks);
  tabManager = new TabManager(mainWindow);
  tabManager.setHistoryStore(new HistoryStore(profilePaths.history));
  tabManager.setProfileManager(profileManager);
  tabManager.setPermissionManager(permissionManager);
  tabManager.setSecurityManager(securityManager);
  tabManager.setShieldEngine(shieldEngine);
  tabManager.setTrackingProtection(trackingProtection);

  networkMonitor = new NetworkMonitor(mainWindow);
  zoomManager = new ZoomManager();
  developerToolsManager = new DeveloperToolsManager(
    mainWindow,
    tabManager,
    networkMonitor,
    zoomManager,
    securityManager
  );
  tabManager.setZoomManager(zoomManager);
  tabManager.setNetworkMonitor(networkMonitor);

  notesManager = new NotesManager(profilePaths.notes, mainWindow);
  intelligenceManager = new IntelligenceManager(storageDir, mainWindow);
  marketsManager = new MarketsManager(storageDir, mainWindow);
  todoManager = new TodoManager(storageDir, mainWindow);
  downloadManager = new DownloadManager(mainWindow, profilePaths.downloads);
  tabManager.setDownloadManager(downloadManager);
  modeOptimizer = new ModeOptimizer(mainWindow, tabManager);
  extensionManager = new ExtensionManager(mainWindow);
  extensionManager.init().catch((err) => {
    console.error('[NEXUS] Failed to initialize extension manager:', err);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      if (process.env.NEXUS_MEASURE_STARTUP === '1') {
        console.log('NEXUS_STARTUP_READY');
      }
      mainWindow.show();
      // Initialize with a default new tab
      tabManager?.createTab('nexus://newtab', true);
    }
  });

  // Track window resizing for WebContentsView bounds
  mainWindow.on('resize', () => {
    tabManager?.updateActiveTabBounds();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximizedChange', true);
    tabManager?.updateActiveTabBounds();
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximizedChange', false);
    tabManager?.updateActiveTabBounds();
  });

  // Load the React UI
  const prodHtml = path.join(__dirname, '../renderer/index.html');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else if (fs.existsSync(prodHtml)) {
    mainWindow.loadFile(prodHtml);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    tabManager = null;
    extensionManager = null;
    bookmarksStore = null;
    downloadManager = null;
    networkMonitor = null;
    zoomManager = null;
    developerToolsManager = null;
    notesManager = null;
  });
}

// Register IPC handlers
function registerIpcHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Tab operations
  ipcMain.handle('tabs:create', (_event, url?: string, workspaceId?: string, isPrivate?: boolean) => {
    return tabManager?.createTab(url, true, workspaceId, isPrivate);
  });

  ipcMain.handle('tabs:createBackground', (_event, url: string, workspaceId?: string) => {
    return tabManager?.createTab(url, false, workspaceId);
  });

  ipcMain.handle('tabs:duplicate', (_event, id: string) => {
    return tabManager?.duplicateTab(id);
  });

  ipcMain.handle('tabs:reopenClosed', () => {
    return tabManager?.reopenClosedTab();
  });

  ipcMain.handle('tabs:close', (_event, id: string) => {
    tabManager?.closeTab(id);
  });

  ipcMain.handle('tabs:switch', (_event, id: string) => {
    tabManager?.switchTab(id);
  });

  ipcMain.handle('tabs:navigate', (_event, id: string, url: string) => {
    tabManager?.navigate(id, url);
  });

  ipcMain.handle('tabs:goBack', (_event, id: string) => {
    tabManager?.goBack(id);
  });

  ipcMain.handle('tabs:goForward', (_event, id: string) => {
    tabManager?.goForward(id);
  });

  ipcMain.handle('tabs:reload', (_event, id: string) => {
    tabManager?.reload(id);
  });

  ipcMain.handle('tabs:stop', (_event, id: string) => {
    tabManager?.stop(id);
  });

  ipcMain.handle('tabs:toggleDevTools', (_event, id?: string) => {
    tabManager?.toggleDevTools(id);
  });

  // Tab controls & grouping
  ipcMain.handle('tabs:mute', (_event, id: string) => {
    return tabManager?.toggleMuteTab(id) ?? false;
  });

  ipcMain.handle('tabs:pin', (_event, id: string) => {
    return tabManager?.togglePinTab(id) ?? false;
  });

  ipcMain.handle('tabs:setGroup', (_event, id: string, groupId?: string) => {
    tabManager?.setTabGroup(id, groupId);
  });

  ipcMain.handle('tabs:reorder', (_event, orderedIds: string[]) => {
    tabManager?.reorderTabs(orderedIds);
  });

  ipcMain.handle('tabs:moveToWorkspace', (_event, id: string, workspaceId: string) => {
    tabManager?.moveTabToWorkspace(id, workspaceId);
  });

  // Workspaces & Sessions
  ipcMain.handle('tabs:switchWorkspace', (_event, workspaceId: string, tabId?: string) => {
    tabManager?.switchWorkspace(workspaceId, tabId);
  });

  ipcMain.handle('session:save', (_event, data: any) => {
    return tabManager?.saveSession(data);
  });

  ipcMain.handle('session:restore', () => {
    return tabManager?.restoreSession() ?? null;
  });

  ipcMain.handle('session:clear', () => {
    return tabManager?.clearSession();
  });

  ipcMain.handle('bounds:update', (_event, bounds: any) => {
    if (bounds) {
      tabManager?.setContentBounds(bounds);
    }
  });

  ipcMain.handle('modal:set', (_event, isOpen: boolean) => {
    tabManager?.setModalOpen(isOpen);
  });

  // Zoom & Storage
  ipcMain.handle('zoom:set', (_event, level: number) => {
    return tabManager?.setZoomLevel(level) ?? 0;
  });

  ipcMain.handle('zoom:get', () => {
    return tabManager?.getZoomLevel() ?? 0;
  });

  ipcMain.handle('storage:clear', async () => {
    await tabManager?.clearBrowsingData();
  });

  ipcMain.handle('storage:clearDetailed', async (_event, options: ClearDataOptions) => {
    const now = Date.now();
    let startTime = 0;
    if (options.timeRange === '1h') startTime = now - 3600 * 1000;
    else if (options.timeRange === '24h') startTime = now - 24 * 3600 * 1000;
    else if (options.timeRange === '7d') startTime = now - 7 * 24 * 3600 * 1000;
    else if (options.timeRange === '4w') startTime = now - 28 * 24 * 3600 * 1000;
    else if (options.timeRange === 'all') startTime = 0;

    await tabManager?.clearBrowsingData({
      history: options.history,
      cookies: options.cookies,
      cache: options.cache,
      sitePermissions: options.sitePermissions,
      timeRangeMs: startTime > 0 ? now - startTime : undefined,
    });

    if (options.downloads) {
      downloadManager?.clearHistory();
    }
  });

  // Bookmarks Management
  ipcMain.handle('bookmarks:get', () => {
    return bookmarksStore?.getAll() ?? [];
  });

  ipcMain.handle('bookmarks:save', (_event, item) => {
    if (!bookmarksStore) return null;
    if (item.id && bookmarksStore.getById(item.id)) {
      return bookmarksStore.updateItem(item.id, item);
    }
    return bookmarksStore.addBookmark(item);
  });

  ipcMain.handle('bookmarks:createFolder', (_event, title: string, parentId?: string | null) => {
    return bookmarksStore?.createFolder(title, parentId);
  });

  ipcMain.handle('bookmarks:remove', (_event, id: string) => {
    return bookmarksStore?.removeItem(id) ?? false;
  });

  ipcMain.handle('bookmarks:exportHtml', () => {
    return bookmarksStore?.exportHtml() ?? '';
  });

  ipcMain.handle('bookmarks:importHtml', (_event, htmlContent: string) => {
    return bookmarksStore?.importHtml(htmlContent) ?? { imported: 0 };
  });

  // History Management
  ipcMain.handle('history:get', (_event, limit?: number) => {
    return tabManager?.getHistoryStore().getAll(limit) ?? [];
  });

  ipcMain.handle('history:search', (_event, query: string, limit?: number) => {
    return tabManager?.getHistoryStore().search(query, limit) ?? [];
  });

  ipcMain.handle('history:delete', (_event, id: string) => {
    return tabManager?.getHistoryStore().deleteEntry(id) ?? false;
  });

  ipcMain.handle('history:deleteRange', (_event, startTime: number, endTime: number) => {
    return tabManager?.getHistoryStore().deleteRange(startTime, endTime) ?? 0;
  });

  ipcMain.handle('history:clear', () => {
    return tabManager?.getHistoryStore().clearAll() ?? false;
  });

  // Downloads Management
  ipcMain.handle('downloads:get', () => {
    return downloadManager?.getAll() ?? [];
  });

  ipcMain.handle('downloads:pause', (_event, id: string) => {
    return downloadManager?.pause(id) ?? false;
  });

  ipcMain.handle('downloads:resume', (_event, id: string) => {
    return downloadManager?.resume(id) ?? false;
  });

  ipcMain.handle('downloads:cancel', (_event, id: string) => {
    return downloadManager?.cancel(id) ?? false;
  });

  ipcMain.handle('downloads:openFile', async (_event, id: string) => {
    return (await downloadManager?.openFile(id)) ?? false;
  });

  ipcMain.handle('downloads:showInFolder', (_event, id: string) => {
    return downloadManager?.showInFolder(id) ?? false;
  });

  ipcMain.handle('downloads:getDirectory', () => {
    return downloadManager?.getDownloadDirectory() ?? '';
  });

  ipcMain.handle('downloads:setDirectory', async () => {
    return (await downloadManager?.selectDownloadDirectory()) ?? null;
  });

  ipcMain.handle('downloads:clear', () => {
    downloadManager?.clearHistory();
  });

  ipcMain.handle('downloads:remove', (_event, id: string) => {
    return downloadManager?.removeRecord(id) ?? false;
  });

  // VPN controls
  ipcMain.handle('vpn:get-status', () => vpnManager.getStatus());
  ipcMain.handle('vpn:get-free-locations', () => vpnManager.getFreeLocations());
  ipcMain.handle('vpn:connect', (_event, countryCode: string) => vpnManager.connect(countryCode));
  ipcMain.handle('vpn:disconnect', () => vpnManager.disconnect());

  // Extensions Management
  ipcMain.handle('extensions:select-directory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Unpacked Extension Directory',
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('extensions:validate', async (_event, folderPath: string) => {
    return extensionManager?.validateManifest(folderPath);
  });

  ipcMain.handle('extensions:install', async (_event, folderPath: string) => {
    return extensionManager?.install(folderPath);
  });

  ipcMain.handle('extensions:uninstall', async (_event, extensionId: string) => {
    return extensionManager?.uninstall(extensionId) ?? false;
  });

  ipcMain.handle('extensions:toggle', async (_event, extensionId: string, enabled: boolean) => {
    if (enabled) {
      return extensionManager?.enable(extensionId) ?? false;
    } else {
      return extensionManager?.disable(extensionId) ?? false;
    }
  });

  ipcMain.handle('extensions:reload', async (_event, extensionId: string) => {
    return extensionManager?.reload(extensionId) ?? false;
  });

  ipcMain.handle('extensions:list', () => {
    return extensionManager?.list() ?? [];
  });

  ipcMain.handle('extensions:open-popup', async (_event, extensionId: string) => {
    return extensionManager?.openPopup(extensionId);
  });

  ipcMain.handle('system:info', () => {
    return {
      electron: process.versions.electron || 'unknown',
      chrome: process.versions.chrome || 'unknown',
      node: process.versions.node || 'unknown',
      platform: process.platform,
      arch: process.arch,
    };
  });

  // Profiles Management
  ipcMain.handle('profiles:get', () => {
    return profileManager?.getAll() ?? [];
  });

  ipcMain.handle('profiles:getActive', () => {
    return (
      profileManager?.getActiveProfile() ?? {
        id: 'default',
        name: 'Default',
        icon: 'User',
        color: '#A78BFA',
        createdAt: Date.now(),
        isDefault: true,
      }
    );
  });

  ipcMain.handle('profiles:create', (_event, name: string, icon: string, color: string) => {
    return profileManager?.createProfile(name, icon, color);
  });

  ipcMain.handle('profiles:update', (_event, id: string, updates: any) => {
    return profileManager?.updateProfile(id, updates) ?? null;
  });

  ipcMain.handle('profiles:delete', (_event, id: string) => {
    return profileManager?.deleteProfile(id) ?? false;
  });

  ipcMain.handle('profiles:switch', async (_event, id: string) => {
    if (!profileManager) return false;
    const switched = profileManager.switchProfile(id);
    if (switched) {
      const profilePaths = profileManager.getProfileDataPaths(switched.id);
      bookmarksStore = new BookmarksStore(profilePaths.bookmarks);
      notesManager = new NotesManager(profilePaths.notes, mainWindow);
      intelligenceManager = new IntelligenceManager(path.dirname(profilePaths.notes), mainWindow);
      tabManager?.setHistoryStore(new HistoryStore(profilePaths.history));
      if (mainWindow) {
        downloadManager = new DownloadManager(mainWindow, profilePaths.downloads);
        tabManager?.setDownloadManager(downloadManager);
      }
      mainWindow?.webContents.send('profile:switched', switched);
      return true;
    }
    return false;
  });

  // Site Permissions
  ipcMain.handle('permissions:get', () => {
    return permissionManager?.getAll() ?? [];
  });

  ipcMain.handle(
    'permissions:set',
    (_event, origin: string, permission: PermissionType, decision: PermissionDecision) => {
      return (
        permissionManager?.setRule(origin, permission, decision) ?? {
          origin,
          permission,
          decision,
          updatedAt: Date.now(),
        }
      );
    }
  );

  ipcMain.handle('permissions:remove', (_event, origin: string, permission: PermissionType) => {
    return permissionManager?.removeRule(origin, permission) ?? false;
  });

  ipcMain.handle('permissions:clearAll', () => {
    return permissionManager?.clearAll() ?? false;
  });

  ipcMain.handle(
    'permissions:respondPrompt',
    (_event, requestId: string, allow: boolean, remember: boolean) => {
      permissionManager?.resolvePrompt(requestId, allow, remember);
    }
  );

  // Security & Site Details
  ipcMain.handle('security:getSiteDetails', (_event, url: string) => {
    const activeTabId = tabManager?.getActiveTabId();
    const activeTab = activeTabId ? tabManager?.getTabState(activeTabId) : undefined;
    const view = activeTabId ? tabManager?.getView(activeTabId) : undefined;
    const wcId = view?.webContents?.id;
    const blockedCount = wcId ? trackingProtection?.getBlockedCountForTab(wcId) ?? 0 : 0;
    return (
      securityManager?.getSiteSecurityInfo(url || activeTab?.url || '', blockedCount) ?? {
        url: url || '',
        origin: 'unknown',
        isSecure: false,
        status: 'insecure',
        blockedTrackersCount: 0,
      }
    );
  });

  // Tracking Protection (Legacy compatibility)
  ipcMain.handle('tracking:getSettings', () => {
    return (
      shieldEngine?.getTrackingSettings() ??
      trackingProtection?.getSettings() ?? {
        mode: 'standard',
        totalBlocked: 0,
        exceptions: [],
      }
    );
  });

  ipcMain.handle('tracking:setMode', (_event, mode: TrackingProtectionMode) => {
    shieldEngine?.setTrackingMode(mode);
    trackingProtection?.setMode(mode);
  });

  ipcMain.handle('tracking:toggleException', (_event, origin: string) => {
    return shieldEngine?.toggleException(origin) ?? trackingProtection?.toggleException(origin) ?? false;
  });

  // NEXUS Shield
  ipcMain.handle('shield:getSettings', () => {
    return shieldEngine?.getSettings();
  });

  ipcMain.handle('shield:updateSettings', (_event, partial) => {
    return shieldEngine?.updateSettings(partial);
  });

  ipcMain.handle('shield:getStats', () => {
    return shieldEngine?.getStats();
  });

  ipcMain.handle('shield:getTabStats', (_event, tabId?: string) => {
    const targetTabId = tabId || tabManager?.getActiveTabId() || undefined;
    return shieldEngine?.getTabStats(targetTabId);
  });

  ipcMain.handle('shield:toggleSite', (_event, origin: string) => {
    return shieldEngine?.toggleSiteAllowlist(origin) ?? false;
  });

  ipcMain.handle('shield:pauseTemporarily', (_event, durationMinutes: number) => {
    return shieldEngine?.pauseTemporarily(durationMinutes) ?? 0;
  });

  ipcMain.handle('shield:resume', () => {
    shieldEngine?.resume();
  });

  ipcMain.handle('shield:updateFilterLists', async () => {
    return (
      (await shieldEngine?.updateFilterLists()) ?? {
        success: false,
        updatedCount: 0,
        errors: [],
      }
    );
  });

  ipcMain.handle('shield:resetStats', () => {
    shieldEngine?.resetStats();
  });

  ipcMain.handle('shield:allowThreatBypass', (_event, originOrUrl: string) => {
    shieldEngine?.allowThreatBypass(originOrUrl);
  });

  // Developer Tools
  ipcMain.handle('devtools:inspectElement', async (_event, tabId?: string) => {
    return developerToolsManager?.inspectElement(tabId);
  });

  ipcMain.handle('devtools:getPageInfo', async (_event, tabId?: string) => {
    return developerToolsManager?.getPageInfo(tabId);
  });

  ipcMain.handle('devtools:setDeviceEmulation', async (_event, tabId: string, preset: any) => {
    return developerToolsManager?.setDeviceEmulation(tabId, preset);
  });

  ipcMain.handle('devtools:viewPageSource', async (_event, tabId?: string) => {
    return developerToolsManager?.viewPageSource(tabId);
  });

  ipcMain.handle('devtools:getCookies', async (_event, tabId?: string) => {
    return developerToolsManager?.getCookiesForTab(tabId) ?? [];
  });

  ipcMain.handle('devtools:removeCookie', async (_event, url: string, name: string) => {
    return developerToolsManager?.removeCookie(url, name) ?? false;
  });

  ipcMain.handle('devtools:getStorage', async (_event, tabId?: string) => {
    return (
      (await developerToolsManager?.getStorageForTab(tabId)) ?? {
        localStorage: [],
        sessionStorage: [],
      }
    );
  });

  ipcMain.handle('devtools:clearStorage', async (_event, tabId?: string, type?: any) => {
    return developerToolsManager?.clearStorageForTab(tabId, type) ?? false;
  });

  ipcMain.handle('devtools:getNetworkLogs', async (_event, tabId?: string) => {
    return developerToolsManager?.getNetworkLogs(tabId) ?? [];
  });

  ipcMain.handle('devtools:clearNetworkLogs', async (_event, tabId?: string) => {
    developerToolsManager?.clearNetworkLogs(tabId);
  });

  ipcMain.handle('devtools:extractReaderMode', async (_event, tabId?: string) => {
    return (
      (await developerToolsManager?.extractReaderMode(tabId)) ?? {
        success: false,
        reason: 'Developer tools manager not ready.',
      }
    );
  });

  ipcMain.handle('devtools:getSiteZoom', async (_event, origin: string) => {
    return developerToolsManager?.getSiteZoom(origin) ?? 1.0;
  });

  ipcMain.handle('devtools:setSiteZoom', async (_event, origin: string, zoomFactor: number) => {
    developerToolsManager?.setSiteZoom(origin, zoomFactor);
  });

  ipcMain.handle('devtools:getAllSiteZooms', async () => {
    return developerToolsManager?.getAllSiteZooms() ?? [];
  });

  // Mode Management & Performance Optimizations
  ipcMain.handle('modes:setMode', async (_event, mode: NexusBrowserMode) => {
    modeOptimizer?.setMode(mode);
  });

  ipcMain.handle('modes:getMode', async () => {
    return modeOptimizer?.getMode() ?? 'default';
  });

  ipcMain.handle('modes:getTelemetry', async () => {
    return (
      (await modeOptimizer?.getTelemetry()) ?? {
        activeMode: 'default',
        memoryUsageMB: 0,
        heapUsedMB: 0,
        suspendedTabsCount: 0,
        totalTabsCount: 0,
        estimatedMemorySavedMB: 0,
        backgroundThrottlingEnabled: false,
      }
    );
  });

  ipcMain.handle('modes:suspendTab', async (_event, tabId: string) => {
    return tabManager?.suspendTab(tabId) ?? false;
  });

  ipcMain.handle('modes:wakeTab', async (_event, tabId: string) => {
    return tabManager?.wakeTab(tabId) ?? false;
  });

  ipcMain.handle('modes:optimizeMemory', async () => {
    return (
      (await modeOptimizer?.optimizeMemory()) ?? {
        freedMemoryMB: 0,
        suspendedCount: 0,
      }
    );
  });

  ipcMain.handle('modes:getConfig', async () => {
    return modeOptimizer?.getConfig();
  });

  ipcMain.handle('modes:updateConfig', async (_event, config: Partial<ModeBehaviorConfig>) => {
    modeOptimizer?.updateConfig(config);
    return modeOptimizer?.getConfig();
  });

  ipcMain.handle('modes:restoreDefaultBehavior', async () => {
    modeOptimizer?.restoreDefaultBehavior();
    return modeOptimizer?.getConfig();
  });

  // NEXUS Notes Management
  ipcMain.handle('notes:getNotes', (_event, filter?: any) => {
    return notesManager?.getNotes(filter) ?? [];
  });

  ipcMain.handle('notes:getNote', (_event, id: string) => {
    return notesManager?.getNote(id) ?? null;
  });

  ipcMain.handle('notes:saveNote', (_event, note: any) => {
    if (!notesManager) throw new Error('NotesManager not initialized');
    return notesManager.saveNote(note);
  });

  ipcMain.handle('notes:deleteNote', (_event, id: string, permanent?: boolean) => {
    return notesManager?.deleteNote(id, permanent) ?? false;
  });

  ipcMain.handle('notes:restoreNote', (_event, id: string) => {
    return notesManager?.restoreNote(id) ?? false;
  });

  ipcMain.handle('notes:purgeNote', (_event, id: string) => {
    return notesManager?.purgeNote(id) ?? false;
  });

  ipcMain.handle('notes:emptyTrash', () => {
    return notesManager?.emptyTrash() ?? false;
  });

  ipcMain.handle('notes:duplicateNote', (_event, id: string) => {
    return notesManager?.duplicateNote(id) ?? null;
  });

  ipcMain.handle('notes:getNotebooks', () => {
    return notesManager?.getNotebooks() ?? [];
  });

  ipcMain.handle('notes:saveNotebook', (_event, notebook: any) => {
    if (!notesManager) throw new Error('NotesManager not initialized');
    return notesManager.saveNotebook(notebook);
  });

  ipcMain.handle('notes:deleteNotebook', (_event, id: string) => {
    return notesManager?.deleteNotebook(id) ?? false;
  });

  ipcMain.handle('notes:getFolders', (_event, notebookId?: string) => {
    return notesManager?.getFolders(notebookId) ?? [];
  });

  ipcMain.handle('notes:saveFolder', (_event, folder: any) => {
    if (!notesManager) throw new Error('NotesManager not initialized');
    return notesManager.saveFolder(folder);
  });

  ipcMain.handle('notes:deleteFolder', (_event, id: string) => {
    return notesManager?.deleteFolder(id) ?? false;
  });

  ipcMain.handle('notes:getDraftRecovery', (_event, noteId: string) => {
    return notesManager?.getDraftRecovery(noteId) ?? null;
  });

  ipcMain.handle('notes:saveDraftRecovery', (_event, draft: any) => {
    notesManager?.saveDraftRecovery(draft);
  });

  ipcMain.handle('notes:clearDraftRecovery', (_event, noteId: string) => {
    notesManager?.clearDraftRecovery(noteId);
  });

  ipcMain.handle('notes:exportPdf', async (_event, noteId: string, options?: any) => {
    if (!notesManager) return { success: false, error: 'NotesManager not initialized' };
    return notesManager.exportNotePdf(noteId, options, mainWindow || undefined);
  });

  ipcMain.handle('notes:exportNotebookPdf', async (_event, notebookId: string, options?: any) => {
    if (!notesManager) return { success: false, error: 'NotesManager not initialized' };
    return notesManager.exportNotebookPdf(notebookId, options, mainWindow || undefined);
  });

  // NEXUS Intelligence Handlers
  ipcMain.handle('intelligence:lookupDictionary', async (_event, word: string) => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.lookupDictionary(word);
  });

  ipcMain.handle('intelligence:explainSelection', async (_event, text: string, readingLevel?: any, targetLanguage?: string) => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.explainSelection(text, readingLevel, targetLanguage);
  });

  ipcMain.handle('intelligence:getVocabulary', async () => {
    return intelligenceManager?.getVocabulary() ?? [];
  });

  ipcMain.handle('intelligence:saveVocabularyItem', async (_event, item: any) => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.saveVocabularyItem(item);
  });

  ipcMain.handle('intelligence:deleteVocabularyItem', async (_event, id: string) => {
    return intelligenceManager?.deleteVocabularyItem(id) ?? false;
  });

  ipcMain.handle('intelligence:getCurrencyRates', async (_event, base?: string) => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.getCurrencyRates(base);
  });

  ipcMain.handle('intelligence:convertCurrency', async (_event, req: any) => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.convertCurrency(req);
  });

  ipcMain.handle('intelligence:getCurrencyHistory', async () => {
    return intelligenceManager?.getCurrencyHistory() ?? [];
  });

  ipcMain.handle('intelligence:clearCurrencyHistory', async () => {
    intelligenceManager?.clearCurrencyHistory();
    return true;
  });

  ipcMain.handle('intelligence:getNewsSettings', async () => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.getNewsSettings();
  });

  ipcMain.handle('intelligence:updateNewsSettings', async (_event, settings: any) => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.updateNewsSettings(settings);
  });

  ipcMain.handle('intelligence:getNewsFeed', async (_event, forceRefresh?: boolean) => {
    if (!intelligenceManager) throw new Error('IntelligenceManager not initialized');
    return intelligenceManager.getNewsFeed(forceRefresh);
  });

  // ==========================================
  // NEXUS Markets Handlers
  // ==========================================
  ipcMain.handle('markets:getSettings', async () => {
    return marketsManager?.getSettings() ?? null;
  });

  ipcMain.handle('markets:updateSettings', async (_event, settings: any) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.updateSettings(settings);
  });

  ipcMain.handle('markets:searchStocks', async (_event, query: string) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.searchStocks(query);
  });

  ipcMain.handle('markets:getStockQuote', async (_event, ticker: string) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.getStockQuote(ticker);
  });

  ipcMain.handle('markets:getStockCandles', async (_event, ticker: string, range?: string) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.getStockCandles(ticker, range);
  });

  ipcMain.handle('markets:getStockWatchlist', async () => {
    return marketsManager?.getStockWatchlist() ?? [];
  });

  ipcMain.handle('markets:addStockToWatchlist', async (_event, item: any) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.addStockToWatchlist(item);
  });

  ipcMain.handle('markets:removeStockFromWatchlist', async (_event, ticker: string) => {
    return marketsManager?.removeStockFromWatchlist(ticker) ?? false;
  });

  ipcMain.handle('markets:getIpos', async (_event, status?: any) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.getIpos(status);
  });

  ipcMain.handle('markets:getMutualFunds', async (_event, category?: string) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.getMutualFunds(category);
  });

  ipcMain.handle('markets:getMutualFundDetail', async (_event, id: string) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.getMutualFundDetail(id);
  });

  ipcMain.handle('markets:calculateSip', async (_event, params: any) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.calculateSip(params);
  });

  ipcMain.handle('markets:calculateLumpSum', async (_event, params: any) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.calculateLumpSum(params);
  });

  ipcMain.handle('markets:getTrackedProducts', async () => {
    return marketsManager?.getTrackedProducts() ?? [];
  });

  ipcMain.handle('markets:saveTrackedProduct', async (_event, product: any) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.saveTrackedProduct(product);
  });

  ipcMain.handle('markets:recordProductPricePoint', async (_event, productId: string, price: number, inStock?: boolean) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.recordProductPricePoint(productId, price, inStock);
  });

  ipcMain.handle('markets:deleteTrackedProduct', async (_event, id: string) => {
    return marketsManager?.deleteTrackedProduct(id) ?? false;
  });

  ipcMain.handle('markets:getFinancialNews', async (_event, ticker?: string, category?: string) => {
    if (!marketsManager) throw new Error('MarketsManager not initialized');
    return marketsManager.getFinancialNews(ticker, category);
  });

  // ==========================================
  // NEXUS Todo IPC Handlers
  // ==========================================
  ipcMain.handle('todos:getTodos', async (_event, filter?: any) => {
    return todoManager?.getTodos(filter) ?? [];
  });

  ipcMain.handle('todos:saveTodo', async (_event, todo: any) => {
    if (!todoManager) throw new Error('TodoManager not initialized');
    return todoManager.saveTodo(todo);
  });

  ipcMain.handle('todos:deleteTodo', async (_event, id: string) => {
    return todoManager?.deleteTodo(id) ?? false;
  });

  ipcMain.handle('todos:toggleTodo', async (_event, id: string, completed?: boolean) => {
    return todoManager?.toggleTodo(id, completed) ?? null;
  });

  ipcMain.handle('todos:clearCompleted', async () => {
    return todoManager?.clearCompletedTodos() ?? 0;
  });

  // ==========================================
  // NEXUS Hub IPC Handlers
  // ==========================================
  ipcMain.handle('hub:getPreferences', async () => {
    if (!todoManager) throw new Error('TodoManager not initialized');
    return todoManager.getHubPreferences();
  });

  ipcMain.handle('hub:updatePreferences', async (_event, prefs: any) => {
    if (!todoManager) throw new Error('TodoManager not initialized');
    return todoManager.updateHubPreferences(prefs);
  });

  ipcMain.handle('hub:recordToolUsage', async (_event, toolId: string) => {
    todoManager?.recordToolUsage(toolId);
  });
}

// App lifecycle
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
