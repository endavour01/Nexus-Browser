import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';
import { ModeTelemetry, NexusBrowserMode, ModeBehaviorConfig } from '../shared/types';
import type { TabManager } from './tab-manager';

export class ModeOptimizer extends EventEmitter {
  private currentMode: NexusBrowserMode = 'default';
  private mainWindow?: BrowserWindow;
  private tabManager?: TabManager;
  private autoSuspensionTimer?: NodeJS.Timeout;
  private checkIntervalMs: number = 15000; // 15 seconds

  private config: ModeBehaviorConfig = {
    tabInactivityThresholdMs: 180000, // 3 minutes default
    autoSuspendEnabled: true,
    backgroundThrottlingEnabled: true,
    suspendPinnedTabs: false,
    lightweightUIEnabled: true,
    distractionReductionEnabled: false,
    minimalToolbarEnabled: false,
  };

  constructor(mainWindowOrTabManager?: BrowserWindow | TabManager, tabManager?: TabManager) {
    super();
    if (mainWindowOrTabManager && 'webContents' in mainWindowOrTabManager) {
      this.mainWindow = mainWindowOrTabManager as BrowserWindow;
      this.tabManager = tabManager;
    } else if (mainWindowOrTabManager) {
      this.tabManager = mainWindowOrTabManager as TabManager;
      this.mainWindow = undefined;
    }
  }

  public setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  public setTabManager(tm: TabManager): void {
    this.tabManager = tm;
  }

  public getMode(): NexusBrowserMode {
    return this.currentMode;
  }

  public getConfig(): ModeBehaviorConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<ModeBehaviorConfig>): void {
    this.config = { ...this.config, ...partial };

    if (this.tabManager) {
      this.tabManager.setMode(this.currentMode, this.config.backgroundThrottlingEnabled);
    }

    if (this.currentMode === 'performance' && this.config.autoSuspendEnabled) {
      this.startAutoSuspension();
    } else {
      this.stopAutoSuspension();
    }

    this.broadcastTelemetry();
  }

  public restoreDefaultBehavior(): void {
    this.config = {
      tabInactivityThresholdMs: 180000,
      autoSuspendEnabled: true,
      backgroundThrottlingEnabled: true,
      suspendPinnedTabs: false,
      lightweightUIEnabled: true,
      distractionReductionEnabled: false,
      minimalToolbarEnabled: false,
    };

    if (this.tabManager) {
      this.tabManager.setMode(this.currentMode, true);
    }

    if (this.currentMode === 'performance') {
      this.startAutoSuspension();
    } else {
      this.stopAutoSuspension();
    }

    this.broadcastTelemetry();
  }

  public setMode(mode: NexusBrowserMode): void {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    if (this.tabManager) {
      this.tabManager.setMode(mode, this.config.backgroundThrottlingEnabled);
    }

    if (mode === 'performance' && this.config.autoSuspendEnabled) {
      this.startAutoSuspension();
    } else {
      this.stopAutoSuspension();
    }

    this.emit('mode-changed', mode);

    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('modes:changed', mode);
      }
    }
    this.broadcastTelemetry();
  }

  public setTabInactivityThreshold(ms: number): void {
    this.config.tabInactivityThresholdMs = Math.max(10000, ms);
  }

  public startAutoSuspension(): void {
    this.stopAutoSuspension();
    this.autoSuspensionTimer = setInterval(() => {
      this.checkAndSuspendInactiveTabs();
    }, this.checkIntervalMs);
  }

  public stopAutoSuspension(): void {
    if (this.autoSuspensionTimer) {
      clearInterval(this.autoSuspensionTimer);
      this.autoSuspensionTimer = undefined;
    }
  }

  public checkAndSuspendInactiveTabs(): number {
    if (this.currentMode !== 'performance' || !this.tabManager || !this.config.autoSuspendEnabled) {
      return 0;
    }

    let suspendedCount = 0;
    const tabs = this.tabManager.getAllTabStates();
    const activeTabId = this.tabManager.getActiveTabId();
    const now = Date.now();

    for (const tab of tabs) {
      if (tab.id === activeTabId) continue;
      if (tab.isPinned && !this.config.suspendPinnedTabs) continue;
      if (tab.hasAudio) continue;
      if (this.tabManager.hasActiveDownload(tab.id)) continue;
      if (tab.isSuspended) continue;
      if (tab.url.startsWith('nexus://') || !tab.url) continue;

      const lastActive = this.tabManager.getTabLastActiveTime(tab.id) || now;
      if (now - lastActive >= this.config.tabInactivityThresholdMs) {
        const success = this.tabManager.suspendTab(tab.id, this.config.suspendPinnedTabs);
        if (success) {
          suspendedCount++;
        }
      }
    }

    if (suspendedCount > 0) {
      this.broadcastTelemetry();
    }

    return suspendedCount;
  }

  public async getTelemetry(): Promise<ModeTelemetry> {
    const mem = process.memoryUsage();
    const rssMB = Math.round(mem.rss / (1024 * 1024));
    const heapUsedMB = Math.round(mem.heapUsed / (1024 * 1024));
    const heapTotalMB = Math.round(mem.heapTotal / (1024 * 1024));

    let totalTabsCount = 0;
    let suspendedTabsCount = 0;

    if (this.tabManager) {
      const tabs = this.tabManager.getAllTabStates();
      totalTabsCount = tabs.length;
      suspendedTabsCount = tabs.filter((t) => t.isSuspended).length;
    }

    const activeTabsCount = totalTabsCount - suspendedTabsCount;
    // Average Chrome/Electron render process saves ~85MB when suspended
    const estimatedMemorySavedMB = suspendedTabsCount * 85;

    return {
      activeMode: this.currentMode,
      memoryUsageMB: rssMB,
      heapUsedMB: heapUsedMB,
      heapTotalMB: heapTotalMB,
      suspendedTabsCount,
      totalTabsCount,
      activeTabsCount,
      estimatedMemorySavedMB,
      backgroundThrottlingEnabled:
        this.currentMode === 'performance' && this.config.backgroundThrottlingEnabled,
      autoSuspensionEnabled: this.config.autoSuspendEnabled,
      inactivityThresholdMs: this.config.tabInactivityThresholdMs,
      lightweightUIEnabled:
        this.currentMode === 'performance' && this.config.lightweightUIEnabled,
      featuresEnabled: {
        backgroundThrottling:
          this.currentMode === 'performance' && this.config.backgroundThrottlingEnabled,
        autoTabSuspension:
          this.currentMode === 'performance' && this.config.autoSuspendEnabled,
        lightweightUI:
          this.currentMode === 'performance' && this.config.lightweightUIEnabled,
        distractionReduction:
          this.currentMode === 'balanced' && this.config.distractionReductionEnabled,
        pinnedProtection: !this.config.suspendPinnedTabs,
        audioProtection: true,
        downloadProtection: true,
      },
    };
  }

  public async optimizeMemory(): Promise<{ freedMemoryMB: number; suspendedCount: number }> {
    if (!this.tabManager) {
      return { freedMemoryMB: 0, suspendedCount: 0 };
    }

    let suspendedCount = 0;
    const tabs = this.tabManager.getAllTabStates();
    const activeTabId = this.tabManager.getActiveTabId();

    for (const tab of tabs) {
      if (tab.id === activeTabId) continue;
      if (tab.hasAudio) continue;
      if (tab.isPinned && !this.config.suspendPinnedTabs) continue;
      if (this.tabManager.hasActiveDownload(tab.id)) continue;
      if (tab.isSuspended) continue;
      if (tab.url.startsWith('nexus://') || !tab.url) continue;

      const success = this.tabManager.suspendTab(tab.id, this.config.suspendPinnedTabs);
      if (success) {
        suspendedCount++;
      }
    }

    if (typeof (global as any).gc === 'function') {
      try {
        (global as any).gc();
      } catch (e) {}
    }

    const freedMemoryMB = suspendedCount * 85;
    this.broadcastTelemetry();

    return { freedMemoryMB, suspendedCount };
  }

  public broadcastTelemetry(): void {
    this.getTelemetry()
      .then((telemetry) => {
        this.emit('telemetry-updated', telemetry);
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send('modes:telemetry', telemetry);
          }
        }
      })
      .catch(() => {});
  }

  public dispose(): void {
    this.stopAutoSuspension();
    this.removeAllListeners();
  }
}
