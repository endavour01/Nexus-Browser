import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { TabManager } from './tab-manager';
import { ExtensionManager } from './extension-manager';

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

  tabManager = new TabManager(mainWindow);
  extensionManager = new ExtensionManager(mainWindow);
  extensionManager.init().catch((err) => {
    console.error('[NEXUS] Failed to initialize extension manager:', err);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
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
