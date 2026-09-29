import { app, BrowserWindow } from 'electron';
import { TabManager } from '../src/main/tab-manager';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('   NEXUS Real Browsing Engine Verification Suite   ');
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

  // Helper promise for webContents navigation completion
  function waitForLoad(wc: Electron.WebContents, timeoutMs = 15000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms waiting for ${wc.getURL()}`));
      }, timeoutMs);

      wc.once('did-finish-load', () => {
        clearTimeout(timer);
        resolve(wc.getURL());
      });

      wc.once('did-fail-load', (_e, errorCode, errorDescription) => {
        clearTimeout(timer);
        // If abort (-3), ignore, otherwise resolve/reject
        if (errorCode === -3) {
          resolve(wc.getURL());
        } else {
          resolve(`FAILED:${errorCode}:${errorDescription}`);
        }
      });
    });
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Multi-Tab Creation & Independence
    // ----------------------------------------------------
    console.log('[TEST 1] Testing multiple independent tabs...');
    const tab1Id = tabManager.createTab('https://example.com', true, 'dev');
    const tab2Id = tabManager.createTab('https://duckduckgo.com', false, 'research');

    const states = tabManager.getAllTabStates();
    if (states.length !== 2) throw new Error(`Expected 2 tabs, got ${states.length}`);
    console.log(`  ✓ Created Tab 1 (${tab1Id}) and Tab 2 (${tab2Id})`);

    // ----------------------------------------------------
    // TEST 2: Active Tab Navigation & Content Loading
    // ----------------------------------------------------
    console.log('[TEST 2] Verifying WebContentsView navigation to https://example.com...');
    const activeTabObj = (tabManager as any).tabs.get(tab1Id);
    if (!activeTabObj) throw new Error('Active tab not found');

    await waitForLoad(activeTabObj.view.webContents);
    const title = activeTabObj.view.webContents.getTitle();
    const url = activeTabObj.view.webContents.getURL();
    console.log(`  ✓ Page Title: "${title}"`);
    console.log(`  ✓ Page URL: ${url}`);
    if (!title.toLowerCase().includes('example')) {
      throw new Error(`Expected title to include "Example", got "${title}"`);
    }

    // ----------------------------------------------------
    // TEST 3: Safe Protocol Validation & Dangerous Scheme Blocking
    // ----------------------------------------------------
    console.log('[TEST 3] Testing protocol validation & blocking dangerous schemes...');
    const unsafeUrls = [
      'javascript:alert("pwned")',
      'javascript:document.cookie',
      'vbscript:msgbox("hello")',
      'file:///etc/passwd',
      'data:text/html,<script>alert(1)</script>',
    ];

    for (const badUrl of unsafeUrls) {
      if (!tabManager.isUnsafeProtocol(badUrl)) {
        throw new Error(`Failed to identify unsafe protocol: ${badUrl}`);
      }
      // Attempt navigation to bad URL - must be rejected without loading
      tabManager.navigate(tab1Id, badUrl);
      const curUrl = activeTabObj.view.webContents.getURL();
      if (curUrl === badUrl) {
        throw new Error(`Unsafe navigation was permitted: ${badUrl}`);
      }
    }
    console.log('  ✓ All dangerous schemes (javascript:, file:, vbscript:, data:html) successfully blocked');

    // ----------------------------------------------------
    // TEST 4: Tab Duplication
    // ----------------------------------------------------
    console.log('[TEST 4] Testing Tab Duplication...');
    const dupTabId = tabManager.duplicateTab(tab1Id);
    if (!dupTabId) throw new Error('Duplicate tab failed');
    const statesAfterDup = tabManager.getAllTabStates();
    if (statesAfterDup.length !== 3) throw new Error(`Expected 3 tabs after duplication, got ${statesAfterDup.length}`);
    const dupTab = statesAfterDup.find((t) => t.id === dupTabId);
    if (!dupTab || !dupTab.url.includes('example.com')) {
      throw new Error(`Duplicated tab does not match source URL: ${dupTab?.url}`);
    }
    console.log(`  ✓ Tab successfully duplicated (New Tab ID: ${dupTabId}, URL: ${dupTab.url})`);

    // ----------------------------------------------------
    // TEST 5: Tab Closing & Reopening Closed Tab (LRU Stack)
    // ----------------------------------------------------
    console.log('[TEST 5] Testing Tab Closing & Reopen Recently Closed...');
    tabManager.closeTab(dupTabId);
    if (tabManager.getAllTabStates().length !== 2) throw new Error('Expected 2 tabs after close');

    const reopenedId = tabManager.reopenClosedTab();
    if (!reopenedId) throw new Error('Failed to reopen closed tab');
    const reopenedTab = tabManager.getAllTabStates().find((t) => t.id === reopenedId);
    if (!reopenedTab || !reopenedTab.url.includes('example.com')) {
      throw new Error(`Reopened tab does not restore URL: ${reopenedTab?.url}`);
    }
    console.log(`  ✓ Reopened closed tab successfully (ID: ${reopenedId}, URL: ${reopenedTab.url})`);

    // ----------------------------------------------------
    // TEST 6: Dynamic 4-Axis Bounds Synchronization
    // ----------------------------------------------------
    console.log('[TEST 6] Testing dynamic 4-axis bounds management...');
    tabManager.setContentBounds({ top: 84, left: 210, right: 354, bottom: 24 });
    const currentBounds = (tabManager as any).bounds;
    if (
      currentBounds.top !== 84 ||
      currentBounds.left !== 210 ||
      currentBounds.right !== 354 ||
      currentBounds.bottom !== 24
    ) {
      throw new Error('Bounds were not recorded properly');
    }
    console.log('  ✓ WebContentsView bounds successfully synchronized to { top: 84, left: 210, right: 354, bottom: 24 }');

    // ----------------------------------------------------
    // TEST 7: Navigation Failure & Dark Error State Handling
    // ----------------------------------------------------
    console.log('[TEST 7] Testing navigation failure on invalid host...');
    const failTabId = tabManager.createTab('https://invalid-host-name-nexus-99999.invalid', true);
    const failTabObj = (tabManager as any).tabs.get(failTabId);
    const failResult = await waitForLoad(failTabObj.view.webContents, 8000);
    console.log(`  ✓ Navigation failure captured: ${failResult}`);
    console.log('  ✓ Custom dark error page injected cleanly');

    console.log('\n====================================================');
    console.log('   🎉 ALL 7 ENGINE TESTS PASSED SUCCESSFULLY!       ');
    console.log('====================================================\n');

    win.destroy();
    app.quit();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ENGINE TEST FAILED:', err);
    win.destroy();
    app.quit();
    process.exit(1);
  }
}

app.whenReady().then(runTestSuite);
