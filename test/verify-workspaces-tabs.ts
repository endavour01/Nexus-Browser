import { app, BrowserWindow } from 'electron';
import { TabManager } from '../src/main/tab-manager';
import { SessionStore } from '../src/main/session-store';
import { TabState } from '../src/shared/types';
import fs from 'fs';
import path from 'path';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

async function runWorkspacesTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Tab & Workspace Management Verification Suite');
  console.log('====================================================\n');

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

  try {
    // ----------------------------------------------------
    // TEST 1: Tab Pinning & Ordering
    // ----------------------------------------------------
    console.log('[TEST 1] Testing Tab Pinning...');
    const tab1 = tabManager.createTab('https://example.com', true);
    const tab2 = tabManager.createTab('https://example.org', false);

    let state1 = tabManager.getTabState(tab1);
    if (!state1 || state1.isPinned) {
      throw new Error('Tab 1 should initially not be pinned');
    }

    tabManager.togglePinTab(tab1);
    state1 = tabManager.getTabState(tab1);
    if (!state1 || !state1.isPinned) {
      throw new Error('Tab 1 should now be pinned');
    }
    console.log('  ✓ Tab 1 successfully pinned (isPinned: true)');

    tabManager.togglePinTab(tab1);
    state1 = tabManager.getTabState(tab1);
    if (!state1 || state1.isPinned) {
      throw new Error('Tab 1 should be unpinned after toggle');
    }
    console.log('  ✓ Tab 1 successfully unpinned on second toggle');

    // Re-pin tab1 for later tests
    tabManager.togglePinTab(tab1);

    // ----------------------------------------------------
    // TEST 2: Tab Audio Indicator & Muting
    // ----------------------------------------------------
    console.log('\n[TEST 2] Testing Tab Audio Muting...');
    const tabObj1 = (tabManager as any).tabs.get(tab1);
    if (!tabObj1) throw new Error('Tab 1 object missing');

    const initialMuted = tabObj1.view.webContents.isAudioMuted();
    if (initialMuted) throw new Error('Tab 1 should initially not be muted');

    tabManager.toggleMuteTab(tab1);
    if (!tabObj1.view.webContents.isAudioMuted()) {
      throw new Error('Tab 1 webContents should be muted');
    }
    state1 = tabManager.getTabState(tab1);
    if (!state1?.isMuted) {
      throw new Error('Tab 1 state should reflect isMuted: true');
    }
    console.log('  ✓ Tab 1 webContents audio muted and state updated');

    tabManager.toggleMuteTab(tab1);
    if (tabObj1.view.webContents.isAudioMuted()) {
      throw new Error('Tab 1 webContents should be unmuted');
    }
    console.log('  ✓ Tab 1 webContents audio unmuted cleanly');

    // ----------------------------------------------------
    // TEST 3: Tab Groups
    // ----------------------------------------------------
    console.log('\n[TEST 3] Testing Tab Groups Assignment...');
    tabManager.setTabGroup(tab1, 'group-dev');
    state1 = tabManager.getTabState(tab1);
    if (state1?.groupId !== 'group-dev') {
      throw new Error('Tab 1 should belong to group-dev');
    }
    console.log('  ✓ Tab 1 assigned to group-dev');

    tabManager.setTabGroup(tab1, undefined);
    state1 = tabManager.getTabState(tab1);
    if (state1?.groupId !== undefined) {
      throw new Error('Tab 1 should have group removed');
    }
    console.log('  ✓ Tab 1 group assignment cleared');

    // ----------------------------------------------------
    // TEST 4: Drag-and-Drop Tab Reordering
    // ----------------------------------------------------
    console.log('\n[TEST 4] Testing Tab Reordering...');
    const tab3 = tabManager.createTab('https://example.net', false);
    
    // Reorder to [tab3, tab2, tab1]
    tabManager.reorderTabs([tab3, tab2, tab1]);
    const orderedIds = tabManager.getAllTabStates().map((t) => t.id);
    if (orderedIds[0] !== tab3 || orderedIds[1] !== tab2 || orderedIds[2] !== tab1) {
      throw new Error(`Tab order mismatch. Got: ${JSON.stringify(orderedIds)}`);
    }
    console.log('  ✓ Tab order updated to [tab3, tab2, tab1]');

    // ----------------------------------------------------
    // TEST 5: Workspaces Isolation & Tab Switching
    // ----------------------------------------------------
    console.log('\n[TEST 5] Testing Workspaces Management & Switching...');
    // Create tab in research workspace
    const researchTab = tabManager.createTab('https://research.org', true, { workspaceId: 'research' });
    const researchState = tabManager.getTabState(researchTab);
    if (researchState?.workspaceId !== 'research') {
      throw new Error('researchTab should have workspaceId: research');
    }
    console.log('  ✓ Created tab in "research" workspace');

    // Switch workspace to research
    tabManager.switchWorkspace('research');
    if (tabManager.getActiveTabId() !== researchTab) {
      throw new Error('Active tab should be researchTab after switching to research workspace');
    }
    console.log('  ✓ Active tab switched to researchTab');

    // Move tab3 from default to research
    tabManager.moveTabToWorkspace(tab3, 'research');
    const movedState = tabManager.getTabState(tab3);
    if (movedState?.workspaceId !== 'research') {
      throw new Error('tab3 should now be in research workspace');
    }
    console.log('  ✓ Moved tab3 from default to research workspace');

    // Switch back to default
    tabManager.switchWorkspace('default');
    if (tabManager.getActiveTabId() === researchTab || tabManager.getActiveTabId() === tab3) {
      throw new Error('Active tab in default workspace should not be a research workspace tab');
    }
    console.log('  ✓ Switched back to default workspace with correct active tab');

    // ----------------------------------------------------
    // TEST 6: Private Tab Filtering & Recently Closed Tabs
    // ----------------------------------------------------
    console.log('\n[TEST 6] Testing Private Tab Handling...');
    const privTab = tabManager.createTab('nexus://private', false, { isPrivate: true });
    const privState = tabManager.getTabState(privTab);
    if (!privState?.isPrivate) {
      throw new Error('privTab should be flagged as isPrivate');
    }

    // Close private tab - it should NOT be in recently closed
    tabManager.closeTab(privTab);
    const recentlyClosed = tabManager.getRecentlyClosedTabs();
    const hasPriv = recentlyClosed.some((t) => t.isPrivate || t.url.includes('private'));
    if (hasPriv) {
      throw new Error('Private tab was incorrectly added to recently closed tabs');
    }
    console.log('  ✓ Private tab omitted from recently closed history');

    // ----------------------------------------------------
    // TEST 7: Session Persistence & Restoration
    // ----------------------------------------------------
    console.log('\n[TEST 7] Testing Session Store Serialization & Restoration...');
    const sessionStore = new SessionStore();
    
    // Save current session
    const currentTabs = tabManager.getAllTabStates();
    const testSessionData = {
      version: 1,
      workspaces: [
        { id: 'default', name: 'Default', icon: 'LayoutGrid', color: '#A78BFA', pinnedSites: [] },
        { id: 'research', name: 'Research', icon: 'Sparkles', color: '#10B981', pinnedSites: [] }
      ],
      activeWorkspaceId: 'default',
      groups: [],
      tabs: [
        ...currentTabs.map(t => ({
          id: t.id,
          url: t.url,
          title: t.title,
          favicon: t.favicon,
          workspaceId: t.workspaceId,
          groupId: t.groupId,
          isPinned: t.isPinned,
          isMuted: t.isMuted,
        })),
        {
          id: 'tab-dummy-private',
          url: 'nexus://private',
          title: 'Private Browsing',
          workspaceId: 'default',
          isPrivate: true,
        }
      ],
      activeTabId: tabManager.getActiveTabId(),
      recentlyClosed: tabManager.getRecentlyClosedTabs(),
    };

    tabManager.saveSession(testSessionData as any);

    // Verify session file exists
    const sessionFile = sessionStore.getFilePath();
    if (!fs.existsSync(sessionFile)) {
      throw new Error(`Session file not found at ${sessionFile}`);
    }

    const rawData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    if (!rawData.tabs || !Array.isArray(rawData.tabs)) {
      throw new Error('Session data missing tabs array');
    }

    // Ensure no private tabs saved
    const savedPrivate = rawData.tabs.filter((t: any) => t.isPrivate || t.url.startsWith('nexus://private'));
    if (savedPrivate.length > 0) {
      throw new Error('Private tab found in saved session file!');
    }
    console.log(`  ✓ Saved session on disk contains ${rawData.tabs.length} valid non-private tabs`);

    // Test restoring session into clean state
    const loadedData = tabManager.restoreSession();
    if (!loadedData || loadedData.tabs.length === 0) {
      throw new Error('Failed to load session data from store');
    }
    console.log('  ✓ Loaded session successfully verified');

    // Cleanup session file
    tabManager.clearSession();
    const afterClear = tabManager.restoreSession();
    if (afterClear !== null) {
      throw new Error('Session store clear failed');
    }
    console.log('  ✓ Session store clear verified');

    console.log('\n====================================================');
    console.log('   🎉 ALL 7 TAB & WORKSPACE TESTS PASSED!          ');
    console.log('====================================================\n');

    win.destroy();
    app.quit();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    win.destroy();
    app.quit();
    process.exit(1);
  }
}

app.whenReady().then(runWorkspacesTestSuite);
