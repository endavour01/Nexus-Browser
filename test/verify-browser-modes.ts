import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { TabManager } from '../src/main/tab-manager';
import { ModeOptimizer } from '../src/main/mode-optimizer';
import { DownloadManager } from '../src/main/download-manager';
import { NexusBrowserMode } from '../src/shared/types';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`    ✓ ${message}`);
  }
}

async function runModesTestSuite() {
  console.log('====================================================');
  console.log('   NEXUS Three-Browser-Mode Verification Suite       ');
  console.log('====================================================\n');

  const testDir = path.join(__dirname, 'sandbox-modes-test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const tabManager = new TabManager(win);
  const downloadManager = new DownloadManager(win, testDir);
  tabManager.setDownloadManager(downloadManager);
  const modeOptimizer = new ModeOptimizer(tabManager);

  let passedChecks = 0;

  // ---------------------------------------------------------------
  // SUITE 1: MODE SWITCHING & STATE MANAGEMENT
  // ---------------------------------------------------------------
  console.log('[SUITE 1: MODE SWITCHING & OPTIMIZER STATE]');

  assert(modeOptimizer.getMode() === 'default', 'Initial mode defaults to "default"');
  passedChecks++;

  let modeChangeEmitted: NexusBrowserMode | null = null;
  modeOptimizer.on('mode-changed', (m: NexusBrowserMode) => {
    modeChangeEmitted = m;
  });

  modeOptimizer.setMode('balanced');
  assert(modeOptimizer.getMode() === 'balanced', 'Successfully switched to "balanced" mode');
  assert(modeChangeEmitted === 'balanced', 'mode-changed event correctly emitted for "balanced"');
  passedChecks++;

  modeOptimizer.setMode('performance');
  assert(modeOptimizer.getMode() === 'performance', 'Successfully switched to "performance" mode');
  assert(modeChangeEmitted === 'performance', 'mode-changed event correctly emitted for "performance"');
  passedChecks++;

  modeOptimizer.setMode('default');
  assert(modeOptimizer.getMode() === 'default', 'Reverted back to "default" mode without error');
  passedChecks++;

  // ---------------------------------------------------------------
  // SUITE 2: TELEMETRY & SYSTEM MONITORING
  // ---------------------------------------------------------------
  console.log('\n[SUITE 2: TELEMETRY & SYSTEM MONITORING]');

  const telemetryDefault = await modeOptimizer.getTelemetry();
  assert(typeof telemetryDefault.memoryUsageMB === 'number' && telemetryDefault.memoryUsageMB > 0, 'Memory telemetry reports valid positive number');
  assert(typeof telemetryDefault.heapUsedMB === 'number', 'Heap memory reported');
  assert(telemetryDefault.activeMode === 'default', 'Telemetry reflects current default mode');
  assert(telemetryDefault.backgroundThrottlingEnabled === false, 'Default mode background throttling disabled');
  assert(telemetryDefault.featuresEnabled.audioProtection === true, 'Audio protection feature active');
  assert(telemetryDefault.featuresEnabled.downloadProtection === true, 'Download protection feature active');
  passedChecks++;

  modeOptimizer.setMode('performance');
  const telemetryPerf = await modeOptimizer.getTelemetry();
  assert(telemetryPerf.activeMode === 'performance', 'Telemetry updates mode to "performance"');
  assert(telemetryPerf.backgroundThrottlingEnabled === true, 'Performance mode background throttling enabled');
  assert(telemetryPerf.autoSuspensionEnabled === true, 'Performance mode auto-suspension enabled by default');
  passedChecks++;

  // ---------------------------------------------------------------
  // SUITE 3: TAB SUSPENSION AND RESUMPTION LIFECYCLE
  // ---------------------------------------------------------------
  console.log('\n[SUITE 3: TAB SUSPENSION AND RESUMPTION LIFECYCLE]');

  // Create 3 tabs
  const tabA = tabManager.createTab('https://example.com', true, 'work');
  const tabB = tabManager.createTab('https://github.com', false, 'work');
  const tabC = tabManager.createTab('https://docs.github.com', false, 'work');
  const tabInternal = tabManager.createTab('nexus://bookmarks', false, 'work');

  assert(tabManager.getActiveTabId() === tabA, 'Tab A is the active foreground tab');
  assert(tabManager.getAllTabStates().length === 4, 'Created 4 tabs');
  passedChecks++;

  // 3.1 Active tab cannot be suspended
  const suspendActiveResult = tabManager.suspendTab(tabA);
  assert(suspendActiveResult === false, 'TabManager refused to suspend active foreground tab');
  const tabAState = tabManager.getTabState(tabA);
  assert(tabAState?.isSuspended !== true, 'Tab A remains active and unsuspended');
  passedChecks++;

  // 3.2 Internal nexus:// pages cannot be suspended
  const suspendInternalResult = tabManager.suspendTab(tabInternal);
  assert(suspendInternalResult === false, 'TabManager refused to suspend internal nexus:// tab');
  passedChecks++;

  // 3.3 Inactive background tab suspension
  const suspendBResult = tabManager.suspendTab(tabB);
  assert(suspendBResult === true, 'Successfully suspended background tab B');
  const tabBState = tabManager.getTabState(tabB);
  assert(tabBState?.isSuspended === true, 'Tab B state marks isSuspended === true');
  assert(typeof tabBState?.suspendedAt === 'number', 'Tab B has suspendedAt timestamp');
  assert(tabBState?.url === 'https://github.com', 'Tab B preserved its URL during suspension');
  passedChecks++;

  // Check telemetry counts
  const telemetryWithSuspended = await modeOptimizer.getTelemetry();
  assert(telemetryWithSuspended.suspendedTabsCount === 1, 'Telemetry counts 1 suspended tab');
  assert(telemetryWithSuspended.totalTabsCount === 4, 'Telemetry counts 4 total tabs');
  assert(telemetryWithSuspended.activeTabsCount === 3, 'Telemetry counts 3 active tabs');
  assert(telemetryWithSuspended.estimatedMemorySavedMB > 0, 'Estimated memory saved calculated');
  passedChecks++;

  // 3.4 Wake suspended tab on selection
  tabManager.switchTab(tabB);
  assert(tabManager.getActiveTabId() === tabB, 'Active tab is now Tab B');
  const tabBWokenState = tabManager.getTabState(tabB);
  assert(tabBWokenState?.isSuspended === false, 'Tab B isSuspended is false after being activated');
  assert(tabBWokenState?.suspendedAt === undefined, 'Tab B suspendedAt cleared upon wake');
  passedChecks++;

  // 3.5 Direct wake method
  const tabBRecord = (tabManager as any).tabs.get(tabB);
  if (tabBRecord) tabBRecord.isLoading = false;
  tabManager.switchTab(tabA); // Switch away so tab B can be suspended again
  tabManager.suspendTab(tabB);
  assert(tabManager.getTabState(tabB)?.isSuspended === true, 'Tab B suspended again');
  const wakeSuccess = tabManager.wakeTab(tabB);
  assert(wakeSuccess === true, 'Direct wakeTab(tabB) returns true');
  assert(tabManager.getTabState(tabB)?.isSuspended === false, 'Tab B is woke via wakeTab');
  passedChecks++;

  // 3.6 Closing a suspended tab safely
  tabManager.suspendTab(tabC);
  assert(tabManager.getTabState(tabC)?.isSuspended === true, 'Tab C suspended');
  tabManager.closeTab(tabC);
  assert(tabManager.getTabState(tabC) === undefined, 'Suspended Tab C closed cleanly without error');
  passedChecks++;

  // ---------------------------------------------------------------
  // SUITE 4: SAFEGUARDS — AUDIO, DOWNLOADS & PINNED TABS
  // ---------------------------------------------------------------
  console.log('\n[SUITE 4: AUDIO, DOWNLOADS & PINNED SAFEGUARDS]');

  // 4.1 Audio safeguard
  const tabAudio = tabManager.createTab('https://music.youtube.com', false, 'work');
  (tabManager as any).tabs.get(tabAudio).hasAudio = true;
  const audioSuspendResult = tabManager.suspendTab(tabAudio);
  assert(audioSuspendResult === false, 'Tab with playing audio is protected from suspension');
  assert(tabManager.getTabState(tabAudio)?.isSuspended !== true, 'Audio tab remains active');
  passedChecks++;

  // 4.2 Pinned tab safeguard
  const tabPinned = tabManager.createTab('https://linear.app', false, 'work');
  tabManager.togglePinTab(tabPinned);
  const pinnedSuspendResult = tabManager.suspendTab(tabPinned);
  assert(pinnedSuspendResult === false, 'Pinned tab is protected from suspension by default');
  assert(tabManager.getTabState(tabPinned)?.isSuspended !== true, 'Pinned tab remains active');
  passedChecks++;

  // 4.3 Download safeguard
  const tabDownloading = tabManager.createTab('https://speed.hetzner.de/100MB.bin', false, 'work');
  const dlWcId = (tabManager as any).tabs.get(tabDownloading).view?.webContents?.id;
  if (dlWcId) {
    (downloadManager as any).activeWebContents.set('dl-test-1', dlWcId);
    (downloadManager as any).records.set('dl-test-1', { status: 'progressing', id: 'dl-test-1' });
    const dlSuspendResult = tabManager.suspendTab(tabDownloading);
    assert(dlSuspendResult === false, 'Tab with active download is protected from suspension');
    assert(tabManager.getTabState(tabDownloading)?.isSuspended !== true, 'Downloading tab remains active');
    passedChecks++;
  }

  // ---------------------------------------------------------------
  // SUITE 5: CONFIGURABLE BEHAVIORS & ONE-CLICK RESTORATION
  // ---------------------------------------------------------------
  console.log('\n[SUITE 5: CONFIGURABLE BEHAVIORS & RESTORATION]');

  // Update config
  modeOptimizer.updateConfig({
    tabInactivityThresholdMs: 60000,
    backgroundThrottlingEnabled: false,
    autoSuspendEnabled: false,
  });

  const configAfterUpdate = modeOptimizer.getConfig();
  assert(configAfterUpdate.tabInactivityThresholdMs === 60000, 'Config honors 60s inactivity threshold');
  assert(configAfterUpdate.backgroundThrottlingEnabled === false, 'Background throttling can be disabled');
  assert(configAfterUpdate.autoSuspendEnabled === false, 'Auto-suspension can be disabled');
  passedChecks++;

  // One-click restore defaults
  modeOptimizer.restoreDefaultBehavior();
  const configRestored = modeOptimizer.getConfig();
  assert(configRestored.tabInactivityThresholdMs === 180000, 'Restored default 3-minute threshold');
  assert(configRestored.backgroundThrottlingEnabled === true, 'Restored background throttling');
  assert(configRestored.autoSuspendEnabled === true, 'Restored auto-suspension');
  passedChecks++;

  // ---------------------------------------------------------------
  // SUITE 6: CSS TOKENS & THEME FIDELITY VERIFICATION
  // ---------------------------------------------------------------
  console.log('\n[SUITE 6: CSS TOKENS & THEME FIDELITY]');

  const themesCssPath = path.join(__dirname, '../src/renderer/src/themes.css');
  const themesCss = fs.readFileSync(themesCssPath, 'utf8');

  // Verify Default Mode preserves obsidian & violet original tokens
  assert(themesCss.includes(":root[data-mode='default']"), 'themes.css defines :root[data-mode=\'default\']');
  assert(themesCss.includes('#0B0D12'), 'themes.css preserves obsidian #0B0D12 for default mode');
  assert(themesCss.includes('#A78BFA'), 'themes.css preserves violet #A78BFA for default mode');
  assert(themesCss.includes('--accent-contrast: #0B0D12;'), 'themes.css defines --accent-contrast for default mode');
  passedChecks++;

  // Verify Balanced Mode defines metallic gold tokens
  assert(themesCss.includes(":root[data-mode='balanced']"), 'themes.css defines :root[data-mode=\'balanced\']');
  assert(themesCss.includes('#090909'), 'themes.css defines #090909 background for balanced mode');
  assert(themesCss.includes('#F5C542'), 'themes.css defines #F5C542 primary gold accent for balanced mode');
  assert(themesCss.includes('#D4A72C'), 'themes.css defines #D4A72C secondary gold accent for balanced mode');
  assert(themesCss.includes('#FFF8E5'), 'themes.css defines #FFF8E5 primary text for balanced mode');
  assert(themesCss.includes('#B6A77C'), 'themes.css defines #B6A77C secondary text for balanced mode');
  passedChecks++;

  // Verify Performance Mode defines crimson & carbon tokens + zero latency
  assert(themesCss.includes(":root[data-mode='performance']"), 'themes.css defines :root[data-mode=\'performance\']');
  assert(themesCss.includes('#080809'), 'themes.css defines #080809 background for performance mode');
  assert(themesCss.includes('#F02D43'), 'themes.css defines #F02D43 primary crimson accent for performance mode');
  assert(themesCss.includes('#A9152A'), 'themes.css defines #A9152A secondary crimson accent for performance mode');
  assert(themesCss.includes('#F5F5F5'), 'themes.css defines #F5F5F5 primary text for performance mode');
  assert(themesCss.includes('0.01ms'), 'themes.css configures zero-latency transitions for performance mode');
  passedChecks++;

  // Clean up
  modeOptimizer.dispose();
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}

  console.log('\n====================================================');
  console.log(`  Three-Browser-Mode Verification Suite PASSED! (${passedChecks} checks)`);
  console.log('====================================================\n');

  win.destroy();
  app.quit();
}

app.whenReady().then(runModesTestSuite).catch((err) => {
  console.error('Fatal error in modes test suite:', err);
  app.exit(1);
});
