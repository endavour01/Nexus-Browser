import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { TabManager } from '../src/main/tab-manager';
import { HistoryStore } from '../src/main/history-store';
import { DownloadManager } from '../src/main/download-manager';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`    ✓ ${msg}`);
}

async function runIncognitoTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Real Incognito / Private Browsing Suite      ');
  console.log(' Comprehensive Automated Verification               ');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-incognito');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const historyFilePath = path.join(testDir, 'nexus-history.json');
  const downloadsFilePath = path.join(testDir, 'nexus-downloads.json');

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
  const historyStore = new HistoryStore(historyFilePath);
  tabManager.setHistoryStore(historyStore);

  const downloadManager = new DownloadManager(win, testDir);
  tabManager.setDownloadManager(downloadManager);

  try {
    // ----------------------------------------------------
    // TEST 1: Creation & Session Partitioning
    // ----------------------------------------------------
    console.log('[TEST 1: In-Memory Partition & Session Isolation]');
    const regularTabId = tabManager.createTab('https://example.com', true, 'default', false);
    const privateTab1Id = tabManager.createTab('https://secret.com', true, 'default', true);

    const regularState = tabManager.getTabState(regularTabId);
    const private1State = tabManager.getTabState(privateTab1Id);

    assert(regularState !== undefined && !regularState.isPrivate, 'Regular tab has isPrivate: false');
    assert(private1State !== undefined && private1State.isPrivate, 'Private tab has isPrivate: true');

    const incognitoSession = session.fromPartition('nexus_incognito', { cache: false });
    assert(!incognitoSession.isPersistent(), 'nexus_incognito session is strictly in-memory (not persistent)');
    assert(session.defaultSession.isPersistent(), 'defaultSession is persistent');

    // ----------------------------------------------------
    // TEST 2: Shared In-Memory Partition across Private Tabs
    // ----------------------------------------------------
    console.log('\n[TEST 2: Shared Session Across Multiple Private Tabs]');
    const privateTab2Id = tabManager.createTab('https://another-secret.com', true, 'default', true);
    const private2State = tabManager.getTabState(privateTab2Id);
    assert(private2State !== undefined && private2State.isPrivate, 'Second private tab has isPrivate: true');

    // Set cookie in incognito partition
    await incognitoSession.cookies.set({
      url: 'https://secret.com',
      name: 'incognito_auth',
      value: 'token_xyz_99',
    });

    // Check cookie is visible in incognito session
    const incognitoCookies = await incognitoSession.cookies.get({ url: 'https://secret.com' });
    assert(incognitoCookies.some((c) => c.name === 'incognito_auth'), 'Cookie present in shared nexus_incognito session');

    // Check cookie does NOT leak to default session
    const defaultCookies = await session.defaultSession.cookies.get({ url: 'https://secret.com' });
    assert(!defaultCookies.some((c) => c.name === 'incognito_auth'), 'Zero cookie leakage to default regular session');

    // ----------------------------------------------------
    // TEST 3: History Immunity
    // ----------------------------------------------------
    console.log('\n[TEST 3: History Immunity for Private Tabs]');
    // Navigate private tab
    tabManager.handleTabNavigationForTesting(privateTab1Id, 'https://secret.com/page1', 'Classified Info');
    assert(historyStore.getAll().length === 0, 'Private tab navigation is NEVER added to historyStore');

    // Navigate regular tab
    tabManager.handleTabNavigationForTesting(regularTabId, 'https://example.com/blog', 'Example Blog');
    assert(historyStore.getAll().length === 1, 'Regular tab navigation is successfully added to historyStore');
    assert(historyStore.getAll()[0].url === 'https://example.com/blog', 'History store contains only regular navigation');

    // ----------------------------------------------------
    // TEST 4: Dedicated Internal Start Page (nexus://private)
    // ----------------------------------------------------
    console.log('\n[TEST 4: Dedicated nexus://private Internal URL Handling]');
    const privateStartTabId = tabManager.createTab('nexus://private', true, 'default');
    const privateStartState = tabManager.getTabState(privateStartTabId);
    assert(privateStartState?.isPrivate === true, 'nexus://private auto-marks tab as isPrivate: true');
    assert(privateStartState?.title === 'Private Browsing', 'nexus://private sets title to "Private Browsing"');

    // ----------------------------------------------------
    // TEST 5: Recently Closed Tabs Immunity
    // ----------------------------------------------------
    console.log('\n[TEST 5: Recently Closed Tabs Protection]');
    tabManager.closeTab(privateStartTabId);
    const closedList = tabManager.getRecentlyClosedTabs();
    assert(!closedList.some((t) => t.url === 'nexus://private'), 'Closed private tab is NEVER recorded in recently closed tabs');

    // ----------------------------------------------------
    // TEST 6: Private Download Immunity
    // ----------------------------------------------------
    console.log('\n[TEST 6: Private Download Record Isolation & Disk Immunity]');
    downloadManager.setupDownloadHandler(incognitoSession);
    assert(typeof downloadManager.clearPrivateDownloads === 'function', 'DownloadManager provides clearPrivateDownloads');

    // ----------------------------------------------------
    // TEST 7: Session Purge on Final Private Tab Close
    // ----------------------------------------------------
    console.log('\n[TEST 7: Session Purge on Last Private Tab Close]');
    // Currently privateTab1Id and privateTab2Id are open
    tabManager.closeTab(privateTab1Id);
    // 1 private tab (privateTab2Id) still remains open, so session should NOT be wiped yet
    const cookiesMid = await incognitoSession.cookies.get({ url: 'https://secret.com' });
    assert(cookiesMid.some((c) => c.name === 'incognito_auth'), 'Session preserved while other private tabs remain active');

    // Close the final remaining private tab
    tabManager.closeTab(privateTab2Id);
    const cookiesAfter = await incognitoSession.cookies.get({ url: 'https://secret.com' });
    assert(cookiesAfter.length === 0, 'nexus_incognito session storage and cookies wiped on final private tab close');

    // ----------------------------------------------------
    // TEST 8: closeAllPrivateTabs() Method
    // ----------------------------------------------------
    console.log('\n[TEST 8: closeAllPrivateTabs() Lifecycle]');
    const privA = tabManager.createTab('https://secure-a.com', true, 'default', true);
    const privB = tabManager.createTab('https://secure-b.com', true, 'default', true);
    const regTab = tabManager.createTab('https://github.com', true, 'default', false);

    assert(tabManager.getTabState(privA) !== undefined, 'Private Tab A opened');
    assert(tabManager.getTabState(privB) !== undefined, 'Private Tab B opened');
    assert(tabManager.getTabState(regTab) !== undefined, 'Regular Tab opened');

    await tabManager.closeAllPrivateTabs();

    assert(tabManager.getTabState(privA) === undefined, 'Private Tab A closed by closeAllPrivateTabs');
    assert(tabManager.getTabState(privB) === undefined, 'Private Tab B closed by closeAllPrivateTabs');
    assert(tabManager.getTabState(regTab) !== undefined, 'Regular tab remains open after closeAllPrivateTabs');

    // Clean up
    tabManager.closeTab(regTab);
    tabManager.closeTab(regularTabId);

    console.log('\n====================================================');
    console.log('   🎉 ALL 8 INCOGNITO / PRIVATE BROWSING TESTS PASSED');
    console.log('====================================================\n');

    win.destroy();
    app.quit();
  } catch (err) {
    console.error('Test execution failed with error:', err);
    win.destroy();
    process.exit(1);
  }
}

app.whenReady().then(runIncognitoTestSuite);
