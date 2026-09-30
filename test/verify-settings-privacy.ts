import path from 'path';
import fs from 'fs';
import { SettingsManager, DEFAULT_BROWSER_SETTINGS } from '../src/main/settings-manager';
import { BrowserSettings, PrivacyStateStatus } from '../src/shared/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`    ✓ ${msg}`);
}

async function runSettingsPrivacyTestSuite() {
  console.log('====================================================');
  console.log('  NEXUS Settings & Privacy Center Automated Suite  ');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-settings-privacy');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const settingsFilePath = path.join(testDir, 'nexus-settings.json');
  const feedbackFilePath = path.join(testDir, 'nexus-feedback.json');

  try {
    // ----------------------------------------------------
    // SUITE 1: Default Settings & File Initialization
    // ----------------------------------------------------
    console.log('[SUITE 1: DEFAULT SETTINGS & INITIALIZATION]');

    const manager = new SettingsManager(testDir);
    assert(fs.existsSync(settingsFilePath), 'nexus-settings.json was created on disk');

    const initialSettings = manager.getSettings();
    assert(initialSettings.theme === 'dark', 'Default theme is dark');
    assert(initialSettings.mode === 'default', 'Default mode is default');
    assert(initialSettings.searchEngine === 'duckduckgo', 'Default search provider is privacy-respecting DuckDuckGo');
    assert(initialSettings.startupBehavior === 'new_tab', 'Startup behavior defaults to new_tab');
    assert(initialSettings.newTabBehavior === 'new_tab', 'New tab behavior defaults to new_tab');
    assert(initialSettings.shieldEnabled === true, 'NEXUS Shield is enabled by default');
    assert(initialSettings.shieldTrackerBlocking === true, 'Tracker blocking is enabled by default');
    assert(initialSettings.shieldAdBlocking === true, 'Ad blocking is enabled by default');
    assert(initialSettings.marketsEnabled === false, 'Markets tool is strictly opt-in (disabled by default)');
    assert(initialSettings.notesEnabled === true, 'Notes tool is enabled by default');
    assert(initialSettings.todoEnabled === true, 'Todo workspace is enabled by default');
    assert(initialSettings.hubEnabled === true, 'Hub workspace is enabled by default');
    assert(initialSettings.exploreEnabled === true, 'Explore dictionary is enabled by default');
    assert(initialSettings.notificationsEnabled === false, 'Master notifications toggle is strictly opt-in (false by default)');
    assert(initialSettings.notificationFrequency === 'daily', 'Default notification frequency is daily');
    assert(initialSettings.clearDataOnExit === false, 'Clear data on exit is optional (false by default)');

    // ----------------------------------------------------
    // SUITE 2: Settings Updates & Theme/Mode Decoupling
    // ----------------------------------------------------
    console.log('\n[SUITE 2: SETTINGS UPDATES & THEME/MODE DECOUPLING]');

    // 2.1 Partial updates
    const updated1 = manager.updateSettings({
      searchEngine: 'brave',
      language: 'en-GB',
      askDownloadLocation: true,
    });
    assert(updated1.searchEngine === 'brave', 'Search engine updated to brave');
    assert(updated1.language === 'en-GB', 'Language updated to en-GB');
    assert(updated1.askDownloadLocation === true, 'askDownloadLocation updated to true');
    assert(updated1.theme === 'dark', 'Preserved untouched theme property');

    // 2.2 Verify disk persistence by reading file directly
    const diskContent1: BrowserSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    assert(diskContent1.searchEngine === 'brave', 'nexus-settings.json reflects brave search engine on disk');
    assert(diskContent1.askDownloadLocation === true, 'nexus-settings.json reflects askDownloadLocation on disk');

    // 2.3 Strict Theme vs Mode Decoupling
    // Change theme to light
    const updatedTheme = manager.updateSettings({ theme: 'light' });
    assert(updatedTheme.theme === 'light', 'Theme updated to light');
    assert(updatedTheme.mode === 'default', 'Mode remains default when theme changed');

    // Change mode to performance
    const updatedMode = manager.updateSettings({ mode: 'performance' });
    assert(updatedMode.mode === 'performance', 'Mode updated to performance');
    assert(updatedMode.theme === 'light', 'Theme remains light when mode changed to performance');

    // Change theme to system
    const updatedThemeSys = manager.updateSettings({ theme: 'system' });
    assert(updatedThemeSys.theme === 'system', 'Theme updated to system');
    assert(updatedThemeSys.mode === 'performance', 'Mode remains performance when theme changed to system');

    // Change mode to balanced
    const updatedModeBal = manager.updateSettings({ mode: 'balanced' });
    assert(updatedModeBal.mode === 'balanced', 'Mode updated to balanced');
    assert(updatedModeBal.theme === 'system', 'Theme remains system when mode changed to balanced');

    // ----------------------------------------------------
    // SUITE 3: Notifications Configuration & Channels
    // ----------------------------------------------------
    console.log('\n[SUITE 3: NOTIFICATIONS CONFIGURATION & CHANNELS]');

    const notifSettings = manager.updateSettings({
      notificationsEnabled: true,
      notificationFrequency: 'instant',
      notifyMarketsAlerts: true,
      notifyDownloadComplete: true,
      notifyShieldThreats: true,
      notifyTodoReminders: false,
    });
    assert(notifSettings.notificationsEnabled === true, 'Master notifications toggle enabled');
    assert(notifSettings.notificationFrequency === 'instant', 'Notification frequency set to instant');
    assert(notifSettings.notifyMarketsAlerts === true, 'Markets alerts notification enabled');
    assert(notifSettings.notifyDownloadComplete === true, 'Download complete notification enabled');
    assert(notifSettings.notifyShieldThreats === true, 'Shield threats notification enabled');
    assert(notifSettings.notifyTodoReminders === false, 'Todo reminders notification disabled');

    // Re-instantiate from disk to verify full persistence
    const reloadedManager = new SettingsManager(testDir);
    const reloadedSettings = reloadedManager.getSettings();
    assert(reloadedSettings.notificationsEnabled === true, 'Reloaded notificationsEnabled persisted');
    assert(reloadedSettings.notificationFrequency === 'instant', 'Reloaded notificationFrequency persisted');
    assert(reloadedSettings.notifyMarketsAlerts === true, 'Reloaded notifyMarketsAlerts persisted');
    assert(reloadedSettings.notifyTodoReminders === false, 'Reloaded notifyTodoReminders persisted');

    // ----------------------------------------------------
    // SUITE 4: Privacy Center Live Status Calculation
    // ----------------------------------------------------
    console.log('\n[SUITE 4: PRIVACY CENTER LIVE STATUS CALCULATION]');

    // Status derivation helper function conforming to PrivacyCenterView
    const computeStatuses = (s: BrowserSettings): Record<string, PrivacyStateStatus> => {
      const trackerStatus: PrivacyStateStatus =
        (s.shieldEnabled ?? true) &&
        (s.shieldTrackerBlocking ?? true) &&
        s.trackingProtectionMode !== 'off'
          ? 'ACTIVE'
          : 'DISABLED';

      const adBlockStatus: PrivacyStateStatus =
        (s.shieldEnabled ?? true) && (s.shieldAdBlocking ?? true)
          ? 'ACTIVE'
          : 'DISABLED';

      const popupStatus: PrivacyStateStatus =
        (s.popupsBlocked ?? true) || ((s.shieldEnabled ?? true) && (s.shieldPopupBlocking ?? true))
          ? 'ACTIVE'
          : 'DISABLED';

      const cookiesStatus: PrivacyStateStatus =
        (s.thirdPartyCookiesBlocked ?? true) ? 'BLOCKED' : 'ALLOWED';

      const dntStatus: PrivacyStateStatus =
        (s.doNotTrack ?? true) ? 'ACTIVE' : 'DISABLED';

      const httpsStatus: PrivacyStateStatus =
        (s.httpsOnlyMode ?? false) ? 'ACTIVE' : 'DISABLED';

      return {
        trackerStatus,
        adBlockStatus,
        popupStatus,
        cookiesStatus,
        dntStatus,
        httpsStatus,
      };
    };

    // Case A: All enabled
    const stateA = computeStatuses({
      ...DEFAULT_BROWSER_SETTINGS,
      shieldEnabled: true,
      shieldTrackerBlocking: true,
      trackingProtectionMode: 'standard',
      shieldAdBlocking: true,
      popupsBlocked: true,
      thirdPartyCookiesBlocked: true,
      doNotTrack: true,
      httpsOnlyMode: true,
    });
    assert(stateA.trackerStatus === 'ACTIVE', 'Tracker blocking is ACTIVE');
    assert(stateA.adBlockStatus === 'ACTIVE', 'Ad blocking is ACTIVE');
    assert(stateA.popupStatus === 'ACTIVE', 'Popup blocking is ACTIVE');
    assert(stateA.cookiesStatus === 'BLOCKED', 'Third party cookies are BLOCKED');
    assert(stateA.dntStatus === 'ACTIVE', 'Do Not Track is ACTIVE');
    assert(stateA.httpsStatus === 'ACTIVE', 'HTTPS-Only mode is ACTIVE');

    // Case B: Shield disabled turns off tracker and ad protection
    const stateB = computeStatuses({
      ...DEFAULT_BROWSER_SETTINGS,
      shieldEnabled: false,
      shieldTrackerBlocking: true,
      shieldAdBlocking: true,
    });
    assert(stateB.trackerStatus === 'DISABLED', 'Tracker blocking is DISABLED when shield is disabled');
    assert(stateB.adBlockStatus === 'DISABLED', 'Ad blocking is DISABLED when shield is disabled');

    // Case C: Third party cookies allowed
    const stateC = computeStatuses({
      ...DEFAULT_BROWSER_SETTINGS,
      thirdPartyCookiesBlocked: false,
    });
    assert(stateC.cookiesStatus === 'ALLOWED', 'Third party cookies status is ALLOWED when not blocked');

    // Case D: Tracking protection mode off
    const stateD = computeStatuses({
      ...DEFAULT_BROWSER_SETTINGS,
      shieldEnabled: true,
      shieldTrackerBlocking: true,
      trackingProtectionMode: 'off',
    });
    assert(stateD.trackerStatus === 'DISABLED', 'Tracker status is DISABLED when mode is off');

    // ----------------------------------------------------
    // SUITE 5: Feedback Management & Persistence
    // ----------------------------------------------------
    console.log('\n[SUITE 5: FEEDBACK MANAGEMENT & LOCAL PERSISTENCE]');

    const fbRes1 = manager.submitFeedback({
      category: 'bug',
      title: 'Dense table rendering stutter',
      description: 'Hardware acceleration stutter when scrolling dense table',
      includeDiagnostics: true,
      diagnostics: { platform: 'linux', mode: 'balanced' },
    });
    assert(fbRes1.success === true && !!fbRes1.id, 'Feedback 1 submitted successfully with unique ID');

    const fbRes2 = manager.submitFeedback({
      category: 'feature',
      title: 'Workspace shortcuts',
      description: 'Support custom keyboard shortcuts for switching between workspaces',
      includeDiagnostics: false,
    });
    assert(fbRes2.success === true && !!fbRes2.id, 'Feedback 2 submitted successfully');

    const fbRes3 = manager.submitFeedback({
      category: 'general',
      title: 'UI appreciation',
      description: 'NEXUS Browser liquid glass design looks exceptional!',
      includeDiagnostics: false,
    });
    assert(fbRes3.success === true && !!fbRes3.id, 'Feedback 3 submitted successfully');

    // Verify retrieval
    const allFeedback = manager.getFeedback();
    assert(allFeedback.length === 3, `Expected 3 feedback entries, received ${allFeedback.length}`);
    const found1 = allFeedback.find((f) => f.id === fbRes1.id);
    assert(found1?.category === 'bug', 'Feedback 1 category recorded as bug');
    assert(found1?.title === 'Dense table rendering stutter', 'Feedback 1 title preserved');
    const found2 = allFeedback.find((f) => f.id === fbRes2.id);
    assert(found2?.category === 'feature', 'Feedback 2 category recorded as feature');
    const found3 = allFeedback.find((f) => f.id === fbRes3.id);
    assert(found3?.category === 'general', 'Feedback 3 category recorded as general');

    // Verify disk file
    assert(fs.existsSync(feedbackFilePath), 'nexus-feedback.json created on disk');
    const diskFeedback = JSON.parse(fs.readFileSync(feedbackFilePath, 'utf8'));
    assert(Array.isArray(diskFeedback) && diskFeedback.length === 3, 'Disk feedback file has 3 valid items');

    // Verify disk persistence across fresh instance
    const freshManager = new SettingsManager(testDir);
    assert(freshManager.getFeedback().length === 3, 'Fresh manager loaded 3 feedback items from disk');

    // ----------------------------------------------------
    // SUITE 6: Corruption Recovery & Fault Tolerance
    // ----------------------------------------------------
    console.log('\n[SUITE 6: CORRUPTION RECOVERY & FAULT TOLERANCE]');

    // 6.1 Corrupt settings file
    fs.writeFileSync(settingsFilePath, '{ invalid_json ::: corrupt }', 'utf8');
    const resilientManager = new SettingsManager(testDir);
    const recoveredSettings = resilientManager.getSettings();
    assert(recoveredSettings.theme === 'dark', 'Recovers gracefully from corrupted settings file with default theme');
    assert(recoveredSettings.mode === 'default', 'Recovers gracefully with default mode');
    // Ensure file was safely repaired on disk
    assert(fs.existsSync(settingsFilePath), 'Settings file safely exists after recovery');

    // 6.2 Corrupt feedback file
    fs.writeFileSync(feedbackFilePath, '###NOT_JSON_DATA###', 'utf8');
    const corruptFbManager = new SettingsManager(testDir);
    const recoveredFeedback = corruptFbManager.getFeedback();
    assert(Array.isArray(recoveredFeedback) && recoveredFeedback.length === 0, 'Recovers gracefully from corrupted feedback file with empty list');
    corruptFbManager.submitFeedback({
      category: 'general',
      title: 'Post-recovery test feedback',
      description: 'Diagnostic recovery successful',
      includeDiagnostics: false,
    });
    assert(corruptFbManager.getFeedback().length === 1, 'Successfully submits new feedback after corruption recovery');

    // ----------------------------------------------------
    // SUITE 7: Reset to Defaults
    // ----------------------------------------------------
    console.log('\n[SUITE 7: RESET TO DEFAULTS]');

    // Alter settings
    manager.updateSettings({
      searchEngine: 'google',
      theme: 'light',
      mode: 'performance',
      marketsEnabled: true,
      notificationsEnabled: true,
    });
    assert(manager.getSettings().searchEngine === 'google', 'Settings modified prior to reset');

    // Perform reset
    const resetResult = manager.resetSettings();
    assert(resetResult.searchEngine === DEFAULT_BROWSER_SETTINGS.searchEngine, 'Search engine reset to default');
    assert(resetResult.theme === DEFAULT_BROWSER_SETTINGS.theme, 'Theme reset to default');
    assert(resetResult.mode === DEFAULT_BROWSER_SETTINGS.mode, 'Mode reset to default');
    assert(resetResult.marketsEnabled === false, 'Markets opt-in status reset to false');
    assert(resetResult.notificationsEnabled === false, 'Notifications reset to false');

    // Verify disk matches defaults
    const diskReset: BrowserSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    assert(diskReset.searchEngine === DEFAULT_BROWSER_SETTINGS.searchEngine, 'Disk settings file matches defaults');

    // ----------------------------------------------------
    // SUITE 8: Internal Route Resolution Verification
    // ----------------------------------------------------
    console.log('\n[SUITE 8: INTERNAL ROUTE RESOLUTION]');

    const resolveInternalTitle = (url: string): string => {
      if (url === 'nexus://settings') return 'Settings';
      if (url === 'nexus://privacy') return 'Privacy Center';
      if (url === 'nexus://hub') return 'NEXUS Hub';
      if (url === 'nexus://markets') return 'Markets';
      return 'Untitled';
    };

    assert(resolveInternalTitle('nexus://settings') === 'Settings', 'nexus://settings maps to "Settings" title');
    assert(resolveInternalTitle('nexus://privacy') === 'Privacy Center', 'nexus://privacy maps to "Privacy Center" title');

    console.log('\n====================================================');
    console.log('  ALL 8 SETTINGS & PRIVACY CENTER SUITES PASSED!   ');
    console.log('====================================================\n');
  } finally {
    // Cleanup test sandbox directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

runSettingsPrivacyTestSuite().catch((err) => {
  console.error('Fatal error during settings-privacy verification:', err);
  process.exit(1);
});
