import { contextBridge, ipcRenderer } from 'electron';
import { ContentBounds, NexusAPI, SystemInfo, TabState } from '../shared/types';

const api: NexusAPI = {
  createTab: (url?: string, workspaceId?: string) => ipcRenderer.invoke('tabs:create', url, workspaceId),
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

  updateContentBounds: (bounds: ContentBounds) => ipcRenderer.invoke('bounds:update', bounds),
  setModalOpen: (isOpen: boolean) => ipcRenderer.invoke('modal:set', isOpen),

  setZoomLevel: (level: number) => ipcRenderer.invoke('zoom:set', level),
  getZoomLevel: () => ipcRenderer.invoke('zoom:get'),
  clearBrowsingData: () => ipcRenderer.invoke('storage:clear'),
  getSystemInfo: (): Promise<SystemInfo> => ipcRenderer.invoke('system:info'),

  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),

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
};

contextBridge.exposeInMainWorld('nexusAPI', api);
