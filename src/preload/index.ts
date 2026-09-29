import { contextBridge, ipcRenderer } from 'electron';
import { ContentBounds, NexusAPI, SystemInfo, TabState } from '../shared/types';

const api: NexusAPI = {
  createTab: (url?: string, workspaceId?: string, isPrivate?: boolean) => ipcRenderer.invoke('tabs:create', url, workspaceId, isPrivate),
  createBackgroundTab: (url: string, workspaceId?: string) => ipcRenderer.invoke('tabs:createBackground', url, workspaceId),
  duplicateTab: (id: string) => ipcRenderer.invoke('tabs:duplicate', id),
  reopenClosedTab: () => ipcRenderer.invoke('tabs:reopenClosed'),
  closeTab: (id: string) => ipcRenderer.invoke('tabs:close', id),
  switchTab: (id: string) => ipcRenderer.invoke('tabs:switch', id),
  navigate: (id: string, url: string) => ipcRenderer.invoke('tabs:navigate', id, url),
  goBack: (id: string) => ipcRenderer.invoke('tabs:goBack', id),
  goForward: (id: string) => ipcRenderer.invoke('tabs:goForward', id),
  reload: (id: string) => ipcRenderer.invoke('tabs:reload', id),
  stop: (id: string) => ipcRenderer.invoke('tabs:stop', id),
  toggleDevTools: (id?: string) => ipcRenderer.invoke('tabs:toggleDevTools', id),

  // Tab Controls & Grouping
  muteTab: (id: string) => ipcRenderer.invoke('tabs:mute', id),
  pinTab: (id: string) => ipcRenderer.invoke('tabs:pin', id),
  setTabGroup: (id: string, groupId?: string) => ipcRenderer.invoke('tabs:setGroup', id, groupId),
  reorderTabs: (orderedIds: string[]) => ipcRenderer.invoke('tabs:reorder', orderedIds),
  moveTabToWorkspace: (id: string, workspaceId: string) => ipcRenderer.invoke('tabs:moveToWorkspace', id, workspaceId),

  // Workspaces & Sessions
  switchWorkspace: (workspaceId: string, tabId?: string) => ipcRenderer.invoke('tabs:switchWorkspace', workspaceId, tabId),
  saveSession: (data: any) => ipcRenderer.invoke('session:save', data),
  restoreSession: () => ipcRenderer.invoke('session:restore'),
  clearSession: () => ipcRenderer.invoke('session:clear'),

  updateContentBounds: (bounds: ContentBounds) => ipcRenderer.invoke('bounds:update', bounds),
  setModalOpen: (isOpen: boolean) => ipcRenderer.invoke('modal:set', isOpen),

  setZoomLevel: (level: number) => ipcRenderer.invoke('zoom:set', level),
  getZoomLevel: () => ipcRenderer.invoke('zoom:get'),
  clearBrowsingData: () => ipcRenderer.invoke('storage:clear'),
  clearBrowsingDataDetailed: (options: any) => ipcRenderer.invoke('storage:clearDetailed', options),
  getSystemInfo: (): Promise<SystemInfo> => ipcRenderer.invoke('system:info'),

  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Bookmarks
  getBookmarks: () => ipcRenderer.invoke('bookmarks:get'),
  saveBookmark: (item: any) => ipcRenderer.invoke('bookmarks:save', item),
  createBookmarkFolder: (title: string, parentId?: string | null) => ipcRenderer.invoke('bookmarks:createFolder', title, parentId),
  removeBookmark: (id: string) => ipcRenderer.invoke('bookmarks:remove', id),
  exportBookmarksHtml: () => ipcRenderer.invoke('bookmarks:exportHtml'),
  importBookmarksHtml: (htmlContent: string) => ipcRenderer.invoke('bookmarks:importHtml', htmlContent),

  // History
  getHistory: (limit?: number) => ipcRenderer.invoke('history:get', limit),
  searchHistory: (query: string, limit?: number) => ipcRenderer.invoke('history:search', query, limit),
  deleteHistoryEntry: (id: string) => ipcRenderer.invoke('history:delete', id),
  deleteHistoryRange: (startTime: number, endTime: number) => ipcRenderer.invoke('history:deleteRange', startTime, endTime),
  clearAllHistory: () => ipcRenderer.invoke('history:clear'),

  // Downloads
  getDownloads: () => ipcRenderer.invoke('downloads:get'),
  pauseDownload: (id: string) => ipcRenderer.invoke('downloads:pause', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('downloads:resume', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('downloads:cancel', id),
  openDownloadFile: (id: string) => ipcRenderer.invoke('downloads:openFile', id),
  showDownloadInFolder: (id: string) => ipcRenderer.invoke('downloads:showInFolder', id),
  getDownloadDirectory: () => ipcRenderer.invoke('downloads:getDirectory'),
  setDownloadDirectory: () => ipcRenderer.invoke('downloads:setDirectory'),
  clearDownloadsList: () => ipcRenderer.invoke('downloads:clear'),
  removeDownloadEntry: (id: string) => ipcRenderer.invoke('downloads:remove', id),

  onTabsUpdated: (callback: (tabs: TabState[], activeTabId: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tabs: TabState[], activeTabId: string) => {
      callback(tabs, activeTabId);
    };
    ipcRenderer.on('tabs:updated', handler);
    return () => {
      ipcRenderer.removeListener('tabs:updated', handler);
    };
  },

  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => {
      callback(isMaximized);
    };
    ipcRenderer.on('window:maximizedChange', handler);
    return () => {
      ipcRenderer.removeListener('window:maximizedChange', handler);
    };
  },

  // Extensions
  selectExtensionDirectory: () => ipcRenderer.invoke('extensions:select-directory'),
  validateExtension: (folderPath: string) => ipcRenderer.invoke('extensions:validate', folderPath),
  installExtension: (folderPath: string) => ipcRenderer.invoke('extensions:install', folderPath),
  uninstallExtension: (extensionId: string) => ipcRenderer.invoke('extensions:uninstall', extensionId),
  toggleExtension: (extensionId: string, enabled: boolean) => ipcRenderer.invoke('extensions:toggle', extensionId, enabled),
  reloadExtension: (extensionId: string) => ipcRenderer.invoke('extensions:reload', extensionId),
  getInstalledExtensions: () => ipcRenderer.invoke('extensions:list'),
  openExtensionPopup: (extensionId: string) => ipcRenderer.invoke('extensions:open-popup', extensionId),

  onExtensionsUpdated: (callback: (extensions: any[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, extensions: any[]) => {
      callback(extensions);
    };
    ipcRenderer.on('extensions:updated', handler);
    return () => {
      ipcRenderer.removeListener('extensions:updated', handler);
    };
  },

  onBookmarksUpdated: (callback: (bookmarks: any[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, bookmarks: any[]) => {
      callback(bookmarks);
    };
    ipcRenderer.on('bookmarks:updated', handler);
    return () => {
      ipcRenderer.removeListener('bookmarks:updated', handler);
    };
  },

  onHistoryUpdated: (callback: (history: any[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, history: any[]) => {
      callback(history);
    };
    ipcRenderer.on('history:updated', handler);
    return () => {
      ipcRenderer.removeListener('history:updated', handler);
    };
  },

  onDownloadsUpdated: (callback: (downloads: any[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, downloads: any[]) => {
      callback(downloads);
    };
    ipcRenderer.on('downloads:updated', handler);
    return () => {
      ipcRenderer.removeListener('downloads:updated', handler);
    };
  },

  // Profiles Management
  getProfiles: () => ipcRenderer.invoke('profiles:get'),
  getActiveProfile: () => ipcRenderer.invoke('profiles:getActive'),
  createProfile: (name: string, icon: string, color: string) =>
    ipcRenderer.invoke('profiles:create', name, icon, color),
  updateProfile: (id: string, updates: any) =>
    ipcRenderer.invoke('profiles:update', id, updates),
  deleteProfile: (id: string) => ipcRenderer.invoke('profiles:delete', id),
  switchProfile: (id: string) => ipcRenderer.invoke('profiles:switch', id),

  // Site Permissions & Content Settings
  getSitePermissions: () => ipcRenderer.invoke('permissions:get'),
  setSitePermission: (origin: string, permission: any, decision: any) =>
    ipcRenderer.invoke('permissions:set', origin, permission, decision),
  removeSitePermission: (origin: string, permission: any) =>
    ipcRenderer.invoke('permissions:remove', origin, permission),
  clearAllSitePermissions: () => ipcRenderer.invoke('permissions:clearAll'),
  respondPermissionPrompt: (requestId: string, allow: boolean, remember: boolean) =>
    ipcRenderer.invoke('permissions:respondPrompt', requestId, allow, remember),

  // Security & Certificates
  getSiteSecurityInfo: (url: string) =>
    ipcRenderer.invoke('security:getSiteDetails', url),

  // Tracking Protection
  getTrackingSettings: () => ipcRenderer.invoke('tracking:getSettings'),
  setTrackingMode: (mode: any) => ipcRenderer.invoke('tracking:setMode', mode),
  toggleTrackingException: (origin: string) =>
    ipcRenderer.invoke('tracking:toggleException', origin),

  // Listeners
  onProfileSwitched: (callback: (profile: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, profile: any) => {
      callback(profile);
    };
    ipcRenderer.on('profile:switched', handler);
    return () => {
      ipcRenderer.removeListener('profile:switched', handler);
    };
  },

  onPermissionPrompt: (callback: (prompt: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, prompt: any) => {
      callback(prompt);
    };
    ipcRenderer.on('permissions:prompt', handler);
    return () => {
      ipcRenderer.removeListener('permissions:prompt', handler);
    };
  },

  onTrackingStatsUpdated: (callback: (stats: { totalBlocked: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, stats: { totalBlocked: number }) => {
      callback(stats);
    };
    ipcRenderer.on('tracking:statsUpdated', handler);
    return () => {
      ipcRenderer.removeListener('tracking:statsUpdated', handler);
    };
  },

  // Developer Tools
  inspectElement: (tabId?: string) => ipcRenderer.invoke('devtools:inspectElement', tabId),
  getPageInfo: (tabId?: string) => ipcRenderer.invoke('devtools:getPageInfo', tabId),
  setDeviceEmulation: (tabId: string, preset: any) => ipcRenderer.invoke('devtools:setDeviceEmulation', tabId, preset),
  viewPageSource: (tabId?: string) => ipcRenderer.invoke('devtools:viewPageSource', tabId),
  getCookiesForTab: (tabId?: string) => ipcRenderer.invoke('devtools:getCookies', tabId),
  removeCookie: (url: string, name: string) => ipcRenderer.invoke('devtools:removeCookie', url, name),
  getStorageForTab: (tabId?: string) => ipcRenderer.invoke('devtools:getStorage', tabId),
  clearStorageForTab: (tabId?: string, type?: any) => ipcRenderer.invoke('devtools:clearStorage', tabId, type),
  getNetworkLogs: (tabId?: string) => ipcRenderer.invoke('devtools:getNetworkLogs', tabId),
  clearNetworkLogs: (tabId?: string) => ipcRenderer.invoke('devtools:clearNetworkLogs', tabId),
  extractReaderMode: (tabId?: string) => ipcRenderer.invoke('devtools:extractReaderMode', tabId),
  getSiteZoom: (origin: string) => ipcRenderer.invoke('devtools:getSiteZoom', origin),
  setSiteZoom: (origin: string, zoomFactor: number) => ipcRenderer.invoke('devtools:setSiteZoom', origin, zoomFactor),
  getAllSiteZooms: () => ipcRenderer.invoke('devtools:getAllSiteZooms'),

  onNetworkActivity: (callback: (entry: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, entry: any) => {
      callback(entry);
    };
    ipcRenderer.on('devtools:networkActivity', handler);
    return () => {
      ipcRenderer.removeListener('devtools:networkActivity', handler);
    };
  },
};

contextBridge.exposeInMainWorld('nexusAPI', api);
