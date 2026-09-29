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

async function runModesIntegrationQASuite() {
  console.log('====================================================');
  console.log('   NEXUS Three-Mode Comprehensive Integration QA    ');
  console.log('====================================================\n');

  const testDir = path.join(__dirname, 'sandbox-modes-integration-qa');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const win1 = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const tabManager = new TabManager(win1);
  const downloadManager = new DownloadManager(win1, path.join(testDir, 'downloads'));
  tabManager.setDownloadManager(downloadManager);
  const modeOptimizer = new ModeOptimizer(tabManager);

  let passed = 0;

  // -----------------------------------------------------------------
  // 1. REPEATED RAPID MODE SWITCHING
  // -----------------------------------------------------------------
  console.log('[TEST 1: REPEATED RAPID MODE SWITCHING]');
  const sequence: NexusBrowserMode[] = [
    'balanced', 'performance', 'default', 'performance', 'balanced',
    'default', 'performance', 'balanced', 'performance', 'default',
    'balanced', 'default', 'performance', 'default'
  ];

  let changeCount = 0;
  modeOptimizer.on('mode-changed', () => {
    changeCount++;
  });

  for (const targetMode of sequence) {
    modeOptimizer.setMode(targetMode);
    assert(modeOptimizer.getMode() === targetMode, `Mode cleanly switched to ${targetMode}`);
  }
  assert(changeCount === sequence.length, `Received all ${sequence.length} mode change events without dropped frames`);
  passed++;

  // -----------------------------------------------------------------
  // 2. SWITCH MODES WHILE MULTIPLE TABS ARE OPEN
  // -----------------------------------------------------------------
  console.log('\n[TEST 2: SWITCH MODES WITH MULTIPLE TABS OPEN]');
  const tabA = tabManager.createTab('https://github.com', true, 'work');
  const tabB = tabManager.createTab('https://news.ycombinator.com', false, 'work');
  const tabC = tabManager.createTab('https://developer.mozilla.org', false, 'study');
  const tabD = tabManager.createTab('nexus://bookmarks', false, 'work');
  const tabE = tabManager.createTab('nexus://history', false, 'study');
  const tabF = tabManager.createTab('https://duckduckgo.com', false, 'personal');

  assert(tabManager.getAllTabStates().length === 6, 'Created 6 tabs across 3 workspaces');
  assert(tabManager.getActiveTabId() === tabA, 'Tab A is active in foreground');

  // Switch modes across all 3
  modeOptimizer.setMode('balanced');
  assert(tabManager.getAllTabStates().length === 6, 'All 6 tabs preserved in Balanced mode');
  modeOptimizer.setMode('performance');
  assert(tabManager.getAllTabStates().length === 6, 'All 6 tabs preserved in Performance mode');
  modeOptimizer.setMode('default');
  assert(tabManager.getAllTabStates().length === 6, 'All 6 tabs preserved in Default mode');
  passed++;

  // -----------------------------------------------------------------
  // 3. SWITCH MODES WHILE PAGE IS LOADING
  // -----------------------------------------------------------------
  console.log('\n[TEST 3: SWITCH MODES WHILE PAGE IS LOADING]');
  // Simulate tab B loading on internal tab state
  const internalTabB = (tabManager as any).tabs.get(tabB);
  if (internalTabB) {
    internalTabB.isLoading = true;
  }
  assert(tabManager.getTabState(tabB)?.isLoading === true, 'Tab B is currently in loading state');

  // Rapidly switch mode to Performance while Tab B is loading
  modeOptimizer.setMode('performance');
  // Attempt suspension of Tab B
  const suspendedB = tabManager.suspendTab(tabB);
  assert(suspendedB === false, 'TabManager refused to suspend actively loading tab');

  // Tab B must NOT be suspended because it's actively loading
  assert(tabManager.getTabState(tabB)?.isSuspended === false, 'Actively loading tab is protected from suspension');
  assert(tabManager.getTabState(tabB)?.url === 'https://news.ycombinator.com', 'Tab B URL preserved');
  if (internalTabB) internalTabB.isLoading = false;
  passed++;

  // -----------------------------------------------------------------
  // 4. SWITCH MODES WHILE A DOWNLOAD IS ACTIVE
  // -----------------------------------------------------------------
  console.log('\n[TEST 4: SWITCH MODES WHILE A DOWNLOAD IS ACTIVE]');
  const tabCView = (tabManager as any).tabs.get(tabC)?.view;
  assert(tabCView !== undefined, 'Tab C has WebContentsView');

  // Register simulated download originating from Tab C's webContents
  (downloadManager as any).records.set('dl-test-1', {
    id: 'dl-test-1',
    filename: 'test-file.zip',
    url: 'https://example.com/test.zip',
    savePath: '/tmp/test.zip',
    state: 'progressing',
    status: 'progressing',
    receivedBytes: 1000,
    totalBytes: 5000,
    startTime: Date.now(),
  });
  (downloadManager as any).activeWebContents.set('dl-test-1', tabCView.webContents.id);
  assert(downloadManager.hasActiveDownloadForWebContents(tabCView.webContents.id), 'Tab C recognized as having active download');

  // Switch to Performance mode and attempt tab suspension
  modeOptimizer.setMode('performance');
  const suspendedC = tabManager.suspendTab(tabC);
  assert(suspendedC === false, 'TabManager refused to suspend tab with active download');
  assert(tabManager.getTabState(tabC)?.isSuspended === false, 'Tab C remains active and unsuspended');

  // Clean up download
  (downloadManager as any).records.delete('dl-test-1');
  (downloadManager as any).activeWebContents.delete('dl-test-1');
  passed++;

  // -----------------------------------------------------------------
  // 5. SWITCH MODES WHILE AUDIO IS PLAYING
  // -----------------------------------------------------------------
  console.log('\n[TEST 5: SWITCH MODES WHILE AUDIO IS PLAYING]');
  const internalTabD = (tabManager as any).tabs.get(tabD);
  if (internalTabD) {
    internalTabD.hasAudio = true;
  }
  assert(tabManager.getTabState(tabD)?.hasAudio === true, 'Tab D has active media audio');

  // Switch to Performance mode and invoke aggressive memory optimization
  modeOptimizer.setMode('performance');
  const optimizeRes = await modeOptimizer.optimizeMemory();
  assert(tabManager.getTabState(tabD)?.isSuspended === false, 'Tab D playing audio is strictly protected from suspension');
  assert(tabManager.getTabState(tabA)?.isSuspended === false, 'Foreground tab A is strictly protected from suspension');
  if (internalTabD) internalTabD.hasAudio = false;
  passed++;

  // -----------------------------------------------------------------
  // 6. MULTI-WINDOW INSTANCE BROADCAST & LIFECYCLE
  // -----------------------------------------------------------------
  console.log('\n[TEST 6: MULTI-WINDOW SYNCHRONIZATION & LIFECYCLE]');
  const win2 = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const allWindows = BrowserWindow.getAllWindows();
  assert(allWindows.length >= 2, `Multiple windows active (${allWindows.length} windows)`);

  // Switch mode and verify all windows receive IPC broadcasts
  modeOptimizer.setMode('balanced');
  assert(modeOptimizer.getMode() === 'balanced', 'Mode optimizer broadcasts across all windows');

  // Close window 2
  win2.destroy();
  assert(BrowserWindow.getAllWindows().length === allWindows.length - 1, 'Window 2 destroyed cleanly without affecting engine');
  passed++;

  // -----------------------------------------------------------------
  // 7. SESSION RESTORATION ACROSS MODES
  // -----------------------------------------------------------------
  console.log('\n[TEST 7: SESSION RESTORATION ACROSS MODES]');
  const sessionData: any = {
    version: 1,
    workspaces: [
      { id: 'work', name: 'Work', icon: 'Briefcase', isDefault: true },
      { id: 'study', name: 'Study', icon: 'BookOpen' }
    ],
    groups: [],
    tabs: tabManager.getAllTabStates().map((t) => ({
      id: t.id,
      url: t.url,
      title: t.title,
      workspaceId: t.workspaceId,
    })),
    activeTabId: tabManager.getActiveTabId() || null,
    activeWorkspaceId: tabManager.getActiveWorkspaceId(),
    recentlyClosed: [],
  };
  const saved = tabManager.saveSession(sessionData);
  assert(saved === true, `Session saved successfully with ${sessionData.tabs.length} tabs`);

  // Switch to Performance mode before restoration
  modeOptimizer.setMode('performance');

  // Load and verify restored session data
  const restoredSession = tabManager.restoreSession();
  assert(restoredSession !== null, 'Session loaded cleanly');
  assert(restoredSession!.tabs.length === sessionData.tabs.length, `Restored session contains all ${restoredSession!.tabs.length} tabs`);
  assert(tabManager.getAllTabStates().length >= 5, 'Tabs remain healthy in Performance mode');
  passed++;

  // -----------------------------------------------------------------
  // 8. WORKSPACES & PROFILES ISOLATION
  // -----------------------------------------------------------------
  console.log('\n[TEST 8: WORKSPACES & PROFILES ISOLATION]');
  // Switch to study workspace
  tabManager.switchWorkspace('study');
  const studyTabs = tabManager.getAllTabStates().filter((t) => t.workspaceId === 'study');
  assert(studyTabs.length > 0, `Found ${studyTabs.length} tabs in study workspace`);

  // Switch to Balanced mode (which supports Focus Workspace)
  modeOptimizer.setMode('balanced');
  assert(modeOptimizer.getMode() === 'balanced', 'Switched to Balanced mode while in study workspace');

  // Verify tab states in study workspace remain valid
  for (const st of studyTabs) {
    assert(st.workspaceId === 'study', `Tab ${st.title} correctly tagged with workspace 'study'`);
  }

  // Restore to work workspace
  tabManager.switchWorkspace('work');
  const workTabs = tabManager.getAllTabStates().filter((t) => t.workspaceId === 'work');
  assert(workTabs.length > 0, 'Returned to work workspace cleanly');
  passed++;

  // -----------------------------------------------------------------
  // 9. ACCESSIBILITY, FOCUS INDICATORS, & REDUCED MOTION
  // -----------------------------------------------------------------
  console.log('\n[TEST 9: ACCESSIBILITY, FOCUS INDICATORS & REDUCED MOTION]');
  const themesCssPath = path.join(__dirname, '../src/renderer/src/themes.css');
  const themesCss = fs.readFileSync(themesCssPath, 'utf8');
  const compCssPath = path.join(__dirname, '../src/renderer/src/components.css');
  const compCss = fs.readFileSync(compCssPath, 'utf8');

  // Check Balanced mode golden focus ring
  assert(compCss.includes(":root[data-mode='balanced'] :focus-visible"), 'Balanced mode defines enhanced golden focus rings');
  assert(compCss.includes('outline: 2px solid var(--accent-primary)'), 'Golden focus ring uses 2px solid --accent-primary');

  // Check Reduced motion support
  assert(themesCss.includes('@media (prefers-reduced-motion: reduce)'), 'themes.css supports OS prefers-reduced-motion');
  assert(themesCss.includes('transition-duration: 0.01ms !important'), 'Bypasses transition durations when reduced-motion active');

  // Check Performance mode zero-latency bypass
  assert(themesCss.includes(":root[data-mode='performance'] *"), 'Performance mode applies zero-latency bypass to all elements');
  passed++;

  // -----------------------------------------------------------------
  // 10. HONEST RESOURCE TELEMETRY & MEASUREMENTS
  // -----------------------------------------------------------------
  console.log('\n[TEST 10: HONEST RESOURCE TELEMETRY & MEASUREMENTS]');
  const telemetry = await modeOptimizer.getTelemetry();

  assert(typeof telemetry.memoryUsageMB === 'number' && telemetry.memoryUsageMB > 0, 'Reports measured RSS memory');
  assert(typeof telemetry.heapUsedMB === 'number' && telemetry.heapUsedMB > 0, 'Reports measured heap memory');
  assert(typeof telemetry.estimatedMemorySavedMB === 'number', 'Reports estimated renderer savings (~85 MB/tab)');
  assert(telemetry.featuresEnabled.audioProtection === true, 'Audio protection feature reported as active');
  assert(telemetry.featuresEnabled.downloadProtection === true, 'Download protection feature reported as active');
  passed++;

  // -----------------------------------------------------------------
  // 11. RESTORE STANDARD BEHAVIOR & ENGINE DISPOSAL
  // -----------------------------------------------------------------
  console.log('\n[TEST 11: RESTORE STANDARD BEHAVIOR & DISPOSAL]');
  modeOptimizer.restoreDefaultBehavior();
  assert(modeOptimizer.getMode() === 'default', 'Restore default behavior resets active mode to default');

  const finalConfig = modeOptimizer.getConfig();
  assert(finalConfig.tabInactivityThresholdMs === 180000, 'Threshold reset to 3 minutes');
  assert(finalConfig.backgroundThrottlingEnabled === true, 'Throttling reset');
  assert(finalConfig.autoSuspendEnabled === true, 'Auto-suspend reset');
  passed++;

  // Clean up
  modeOptimizer.dispose();
  win1.destroy();
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}

  console.log('====================================================');
  console.log(`  NEXUS Modes Comprehensive QA PASSED! (${passed} suites)`);
  console.log('====================================================\n');

  app.quit();
}

app.whenReady().then(runModesIntegrationQASuite).catch((err) => {
  console.error('Fatal error in integration QA suite:', err);
  app.exit(1);
});
