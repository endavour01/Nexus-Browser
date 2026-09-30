import type { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { BrowserSettings, NexusFeedback } from '../shared/types';

export const DEFAULT_BROWSER_SETTINGS: BrowserSettings = {
  // General
  searchEngine: 'duckduckgo',
  startupBehavior: 'new_tab',
  newTabBehavior: 'new_tab',
  language: 'en-US',
  spellcheckEnabled: true,
  defaultDownloadDirectory: '',
  askDownloadLocation: false,

  // Appearance & Mode (Strictly Decoupled)
  theme: 'dark',
  mode: 'default',
  reducedMotion: false,
  uiDensity: 'comfortable',
  defaultZoom: 1,
  tabLayout: 'horizontal',
  showBookmarksBar: true,

  // System & Performance
  hardwareAcceleration: false,
  openDevToolsOnStart: false,
  restoreSessionOnStartup: true,
  performanceTabDiscardTimeout: 30,
  performanceAutoSuspend: true,
  performanceBackgroundThrottling: true,
  performanceSuspendPinned: false,
  performanceLightweightUI: false,
  balancedDistractionReduction: false,
  balancedMinimalToolbar: false,

  // Privacy & Shield
  trackingProtectionMode: 'standard',
  javascriptEnabled: true,
  popupsBlocked: true,
  thirdPartyCookiesBlocked: true,
  clearDataOnExit: false,
  doNotTrack: true,
  httpsOnlyMode: false,
  shieldEnabled: true,
  shieldAdBlocking: true,
  shieldTrackerBlocking: true,
  shieldPopupBlocking: true,
  shieldPhishingProtection: true,
  shieldStrictMode: false,

  // Workspaces & Tools
  notesEnabled: true,
  todoEnabled: true,
  exploreEnabled: true,
  marketsEnabled: false, // Strict opt-in
  hubEnabled: true,
  devToolsEnabled: true,
  extensionsEnabled: true,

  // Notifications (Strictly Opt-In)
  notificationsEnabled: false,
  notifyMarketsAlerts: false,
  notifyDownloadComplete: true,
  notifyShieldThreats: true,
  notifyTodoReminders: true,
  notificationFrequency: 'daily',
};

export class SettingsManager {
  private storageDir: string;
  private mainWindow: BrowserWindow | null = null;
  private settingsFilePath: string;
  private feedbackFilePath: string;

  private settings: BrowserSettings = { ...DEFAULT_BROWSER_SETTINGS };
  private feedbackList: NexusFeedback[] = [];

  constructor(storageDir?: string, mainWindow?: BrowserWindow | null) {
    this.storageDir = storageDir || path.join(process.cwd(), 'userData');
    this.mainWindow = mainWindow || null;

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        console.error('[SettingsManager] Failed to create storage dir:', err);
      }
    }

    this.settingsFilePath = path.join(this.storageDir, 'nexus-settings.json');
    this.feedbackFilePath = path.join(this.storageDir, 'nexus-feedback.json');

    this.loadState();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  /**
   * Safe loading of settings and feedback with corruption recovery
   */
  private loadState() {
    // 1. Load Settings
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          this.settings = {
            ...DEFAULT_BROWSER_SETTINGS,
            ...parsed,
            // Ensure mode and theme stay distinct
            theme: parsed.theme || DEFAULT_BROWSER_SETTINGS.theme,
            mode: parsed.mode || DEFAULT_BROWSER_SETTINGS.mode,
            // Markets is strictly opt-in unless explicitly set
            marketsEnabled: parsed.marketsEnabled === true,
          };
        } else {
          console.warn('[SettingsManager] Corrupted settings JSON format, resetting to default');
          this.settings = { ...DEFAULT_BROWSER_SETTINGS };
        }
      } else {
        this.settings = { ...DEFAULT_BROWSER_SETTINGS };
        this.saveSettings();
      }
    } catch (err) {
      console.error('[SettingsManager] Failed to read or parse nexus-settings.json:', err);
      this.settings = { ...DEFAULT_BROWSER_SETTINGS };
    }

    // 2. Load Feedback
    try {
      if (fs.existsSync(this.feedbackFilePath)) {
        const raw = fs.readFileSync(this.feedbackFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.feedbackList = parsed;
        } else {
          this.feedbackList = [];
        }
      } else {
        this.feedbackList = [];
      }
    } catch (err) {
      console.error('[SettingsManager] Failed to read nexus-feedback.json:', err);
      this.feedbackList = [];
    }
  }

  private saveSettings() {
    try {
      const tempPath = `${this.settingsFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.settings, null, 2), 'utf8');
      fs.renameSync(tempPath, this.settingsFilePath);
    } catch (err) {
      console.error('[SettingsManager] Failed to save settings to disk:', err);
    }
  }

  private saveFeedback() {
    try {
      const tempPath = `${this.feedbackFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.feedbackList, null, 2), 'utf8');
      fs.renameSync(tempPath, this.feedbackFilePath);
    } catch (err) {
      console.error('[SettingsManager] Failed to save feedback to disk:', err);
    }
  }

  private notifyUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('settings:updated', { ...this.settings });
    }
  }

  // ==========================================================================
  // Public Settings API
  // ==========================================================================

  public getSettings(): BrowserSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    // Preserve strict decoupling between theme and mode
    const updatedTheme = partial.theme !== undefined ? partial.theme : this.settings.theme;
    const updatedMode = partial.mode !== undefined ? partial.mode : this.settings.mode;

    this.settings = {
      ...this.settings,
      ...partial,
      theme: updatedTheme,
      mode: updatedMode,
    };

    this.saveSettings();
    this.notifyUpdate();
    return { ...this.settings };
  }

  public resetSettings(): BrowserSettings {
    this.settings = { ...DEFAULT_BROWSER_SETTINGS };
    this.saveSettings();
    this.notifyUpdate();
    return { ...this.settings };
  }

  // ==========================================================================
  // Public Feedback API
  // ==========================================================================

  public submitFeedback(input: Omit<NexusFeedback, 'id' | 'createdAt'>): { success: boolean; id: string } {
    const now = Date.now();
    const id = `feedback-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: NexusFeedback = {
      id,
      category: input.category || 'general',
      title: (input.title || '').trim(),
      description: (input.description || '').trim(),
      includeDiagnostics: !!input.includeDiagnostics,
      diagnostics: input.diagnostics || undefined,
      createdAt: now,
    };

    this.feedbackList = [newEntry, ...this.feedbackList];
    this.saveFeedback();
    return { success: true, id };
  }

  public getFeedbackList(): NexusFeedback[] {
    return [...this.feedbackList];
  }

  public getFeedback(): NexusFeedback[] {
    return this.getFeedbackList();
  }
}

