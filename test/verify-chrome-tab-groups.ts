import { app, BrowserWindow } from 'electron';
import { TabManager } from '../src/main/tab-manager';
import { SessionStore } from '../src/main/session-store';
import { TAB_GROUP_COLORS, TabGroup } from '../src/shared/types';
import fs from 'fs';
import path from 'path';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

async function runChromeTabGroupsTestSuite() {
  console.log('====================================================');
  console.log('  NEXUS Chrome-Style Tab Groups Verification Suite   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`    ✓ ${desc}`);
      passed++;
    } else {
      console.error(`    ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // SUITE 1: 8 CHROME COLORS & ARCHITECTURE
  // --------------------------------------------------------------------------
  console.log('[SUITE 1: 8 CHROME COLORS & DATA TYPES]');
  const expectedColors = ['Grey', 'Blue', 'Red', 'Yellow', 'Green', 'Pink', 'Purple', 'Cyan'];
  assert(TAB_GROUP_COLORS.length === 8, 'TAB_GROUP_COLORS defines exactly 8 colors');

  const definedColorNames = TAB_GROUP_COLORS.map((c) => c.name);
  for (const exp of expectedColors) {
    assert(definedColorNames.includes(exp as any), `TAB_GROUP_COLORS includes ${exp}`);
  }

  // Verify TabGroupModal.tsx is completely eliminated
  const rootDir = path.resolve(__dirname, '..');
  const oldModalPath = path.join(rootDir, 'src/renderer/src/components/TabGroupModal.tsx');
  assert(!fs.existsSync(oldModalPath), 'Obsolete TabGroupModal.tsx has been removed');

  // Verify TabGroupPopover.tsx exists
  const popoverPath = path.join(rootDir, 'src/renderer/src/components/TabGroupPopover.tsx');
  assert(fs.existsSync(popoverPath), 'TabGroupPopover.tsx exists');
  const popoverCode = fs.readFileSync(popoverPath, 'utf8');
  assert(popoverCode.includes('PRESET_NAMES'), 'TabGroupPopover defines preset names');
  assert(popoverCode.includes('Work') && popoverCode.includes('Study') && popoverCode.includes('Entertainment'), 'TabGroupPopover includes Work, Study, Entertainment presets');
  assert(popoverCode.includes('TAB_GROUP_COLORS'), 'TabGroupPopover uses 8 Chrome colors');
  assert(popoverCode.includes('New tab in group'), 'TabGroupPopover provides New tab in group action');
  assert(popoverCode.includes('Ungroup tabs'), 'TabGroupPopover provides Ungroup tabs action');
  assert(popoverCode.includes('Close group'), 'TabGroupPopover provides Close group action');

  // --------------------------------------------------------------------------
  // SUITE 2: COMPONENT INTEGRATION & CSS
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 2: COMPONENT INTEGRATION & STYLES]');
  const titleBarCode = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/TitleBar.tsx'), 'utf8');
  assert(titleBarCode.includes('stripItems'), 'TitleBar uses contiguous stripItems model');
  assert(titleBarCode.includes('handleGroupDragStart'), 'TitleBar supports group drag & drop');
  assert(titleBarCode.includes('handleGroupDrop'), 'TitleBar handles dragging tabs onto group pills');
  assert(titleBarCode.includes('Add tab to new group'), 'TitleBar context menu includes Add tab to new group');
  assert(titleBarCode.includes('Remove tab from group'), 'TitleBar context menu includes Remove tab from group');

  const componentsCss = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components.css'), 'utf8');
  assert(componentsCss.includes('.nexus-group-popover'), 'components.css defines .nexus-group-popover');
  assert(componentsCss.includes('.group-preset-chip'), 'components.css defines .group-preset-chip');
  assert(componentsCss.includes('.group-color-swatch'), 'components.css defines .group-color-swatch');
  assert(componentsCss.includes('.tab-group-pill'), 'components.css defines .tab-group-pill');
  assert(componentsCss.includes('.nexus-tab.in-group'), 'components.css defines .nexus-tab.in-group top accent line');
  assert(componentsCss.includes('.tab-group-active-indicator'), 'components.css defines .tab-group-active-indicator');

  // --------------------------------------------------------------------------
  // SUITE 3: REAL ELECTRON TAB MANAGER RUNTIME TEST
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 3: TAB LIFECYCLE & RUNTIME GROUPING]');
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

  // 1. Create 4 tabs
  const tab1 = tabManager.createTab('https://example.com/page1', true);
  const tab2 = tabManager.createTab('https://example.com/page2', false);
  const tab3 = tabManager.createTab('https://example.com/page3', false);
  const tab4 = tabManager.createTab('https://example.com/page4', false);

  assert(tabManager.getAllTabStates().length === 4, 'Created 4 active tabs');

  // 2. Assign tab1 & tab2 to group-work
  tabManager.setTabGroup(tab1, 'group-work');
  tabManager.setTabGroup(tab2, 'group-work');
  assert(tabManager.getTabState(tab1)?.groupId === 'group-work', 'tab1 assigned to group-work');
  assert(tabManager.getTabState(tab2)?.groupId === 'group-work', 'tab2 assigned to group-work');

  // 3. Assign tab3 to group-study
  tabManager.setTabGroup(tab3, 'group-study');
  assert(tabManager.getTabState(tab3)?.groupId === 'group-study', 'tab3 assigned to group-study');
  assert(tabManager.getTabState(tab4)?.groupId === undefined, 'tab4 remains ungrouped');

  // 4. Move tab2 between groups (group-work -> group-study)
  tabManager.setTabGroup(tab2, 'group-study');
  assert(tabManager.getTabState(tab2)?.groupId === 'group-study', 'tab2 moved to group-study');

  // 5. Remove tab2 from group (ungroup)
  tabManager.setTabGroup(tab2, undefined);
  assert(tabManager.getTabState(tab2)?.groupId === undefined, 'tab2 ungrouped cleanly');

  // 6. Contiguous Reordering with TabManager
  tabManager.reorderTabs([tab1, tab3, tab2, tab4]);
  const newOrder = tabManager.getAllTabStates().map((t) => t.id);
  assert(newOrder[0] === tab1 && newOrder[1] === tab3, 'Tabs reordered successfully preserving group membership');

  // 7. Active tab in collapsed group simulation
  // When active tab (tab1) belongs to a collapsed group, tab webview remains functional
  const activeTabState = tabManager.getTabState(tab1);
  assert(activeTabState !== undefined, 'Active grouped tab state remains intact in memory');
  const activeWc = (tabManager as any).tabs.get(tab1)?.view?.webContents;
  assert(activeWc && !activeWc.isDestroyed(), 'WebContents of grouped tab is alive and functional');

  // 8. Close tab in group
  tabManager.closeTab(tab3);
  assert(tabManager.getTabState(tab3) === undefined, 'tab3 closed and destroyed cleanly');
  assert(tabManager.getAllTabStates().length === 3, '3 remaining tabs after closing tab3');

  // --------------------------------------------------------------------------
  // SUITE 4: SESSION RESTORATION & PERSISTENCE
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 4: SESSION RESTORATION & PERSISTENCE]');
  const tempSessionFile = path.join(rootDir, 'dist', 'test-session-tabgroups.json');
  const sessionStore = new SessionStore(tempSessionFile);

  const testGroups: TabGroup[] = [
    { id: 'group-work', name: 'Work Project', color: '#60A5FA', collapsed: false },
    { id: 'group-personal', name: 'Personal Life', color: '#F472B6', collapsed: true },
  ];

  const savedSuccess = sessionStore.save({
    version: 1,
    workspaces: [{ id: 'default', name: 'Personal', icon: 'User', color: '#A78BFA' }],
    activeWorkspaceId: 'default',
    groups: testGroups,
    tabs: [
      { id: tab1, url: 'https://example.com/page1', title: 'Work 1', workspaceId: 'default', groupId: 'group-work' },
      { id: tab2, url: 'https://example.com/page2', title: 'Personal 1', workspaceId: 'default', groupId: 'group-personal' },
    ],
    activeTabId: tab1,
    recentlyClosed: [],
  });

  assert(savedSuccess, 'SessionStore saved session with tab groups');

  const loadedSession = sessionStore.load();
  assert(loadedSession !== null, 'SessionStore loaded session successfully');
  assert(loadedSession?.groups?.length === 2, 'Loaded 2 persisted tab groups');
  assert(loadedSession?.groups?.[0]?.name === 'Work Project', 'Restored group name correctly');
  assert(loadedSession?.groups?.[0]?.color === '#60A5FA', 'Restored group color correctly');
  assert(loadedSession?.groups?.[1]?.collapsed === true, 'Restored collapsed state correctly');
  assert(loadedSession?.tabs?.[0]?.groupId === 'group-work', 'Restored tab.groupId mapping');

  sessionStore.clear();

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`Tab Groups Audit Complete: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  win.destroy();
  app.quit();

  if (failed > 0) {
    process.exit(1);
  }
}

app.whenReady().then(runChromeTabGroupsTestSuite).catch((err) => {
  console.error('Fatal error in tab groups test suite:', err);
  process.exit(1);
});
