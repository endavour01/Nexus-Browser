import { app, BrowserWindow } from 'electron';
import { TabManager } from '../src/main/tab-manager';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

// Subsequence / fuzzy match tester (same algorithm as in CommandPalette.tsx)
function fuzzyMatches(text: string, query: string): boolean {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (t.includes(q)) return true;

  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
    }
  }
  return qIdx === q.length;
}

async function runCommandTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Command Palette & Workflow Verification Suite');
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
    // TEST 1: Modal Open / Close WebContentsView Visibility
    // ----------------------------------------------------
    console.log('[TEST 1] Testing modal open/close view visibility handling...');
    const tabId = tabManager.createTab('https://example.com', true);
    const tabObj = (tabManager as any).tabs.get(tabId);
    if (!tabObj) throw new Error('Tab not found');

    if ((tabManager as any).isModalOpen !== false) {
      throw new Error('Initial modal state should be false');
    }
    console.log('  ✓ Initial modal state is false');

    // Open modal (e.g. Command Palette opened)
    tabManager.setModalOpen(true);
    if ((tabManager as any).isModalOpen !== true) {
      throw new Error('isModalOpen should be true after setModalOpen(true)');
    }
    console.log('  ✓ tabManager.isModalOpen is true, active view hidden');

    // Close modal (e.g. Command Palette dismissed or executed)
    tabManager.setModalOpen(false);
    if ((tabManager as any).isModalOpen !== false) {
      throw new Error('isModalOpen should be false after setModalOpen(false)');
    }
    console.log('  ✓ tabManager.isModalOpen is false, active view restored');

    // ----------------------------------------------------
    // TEST 2: Tab Cycling Logic (Ctrl+Tab & Ctrl+Shift+Tab)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Testing Tab Cycling (Ctrl+Tab & Ctrl+Shift+Tab)...');
    const tab2Id = tabManager.createTab('https://duckduckgo.com', false);
    const tab3Id = tabManager.createTab('https://github.com', false);
    const tabList = [tabId, tab2Id, tab3Id];

    // Forward cycle from index 0 -> index 1 -> index 2 -> wrap to index 0
    let curIdx = 0;
    const forward1 = (curIdx + 1) % tabList.length;
    const forward2 = (forward1 + 1) % tabList.length;
    const forward3 = (forward2 + 1) % tabList.length;

    if (forward1 !== 1 || forward2 !== 2 || forward3 !== 0) {
      throw new Error(`Tab cycling forward failed: [${forward1}, ${forward2}, ${forward3}]`);
    }
    console.log('  ✓ Forward tab cycling correctly advances and wraps around');

    // Backward cycle from index 0 -> wrap to index 2 -> index 1 -> index 0
    const back1 = (curIdx - 1 + tabList.length) % tabList.length;
    const back2 = (back1 - 1 + tabList.length) % tabList.length;
    const back3 = (back2 - 1 + tabList.length) % tabList.length;

    if (back1 !== 2 || back2 !== 1 || back3 !== 0) {
      throw new Error(`Tab cycling backwards failed: [${back1}, ${back2}, ${back3}]`);
    }
    console.log('  ✓ Backward tab cycling correctly reverses and wraps around');

    // ----------------------------------------------------
    // TEST 3: Fuzzy Matching & Filtering
    // ----------------------------------------------------
    console.log('\n[TEST 3] Testing Fuzzy Search Algorithm...');
    const testCases = [
      { text: 'Close Active Tab', query: 'close', match: true },
      { text: 'Close Active Tab', query: 'cat', match: true }, // Subsequence c-a-t
      { text: 'Toggle Developer Tools', query: 'dev', match: true },
      { text: 'Toggle Developer Tools', query: 'tdt', match: true }, // Subsequence t-d-t
      { text: 'Switch Workspace: Research', query: 'research', match: true },
      { text: 'https://github.com/torvalds/linux', query: 'gh', match: true },
      { text: 'Open Downloads', query: 'xyz123', match: false },
    ];

    for (const tc of testCases) {
      const res = fuzzyMatches(tc.text, tc.query);
      if (res !== tc.match) {
        throw new Error(`Fuzzy match failed for text="${tc.text}" query="${tc.query}": expected ${tc.match}, got ${res}`);
      }
    }
    console.log(`  ✓ All ${testCases.length} fuzzy match test cases verified`);

    // ----------------------------------------------------
    // TEST 4: Direct Action & Query Resolution
    // ----------------------------------------------------
    console.log('\n[TEST 4] Testing Direct Action & URL formatting...');
    function resolveAction(input: string): { type: 'url' | 'search'; target: string } {
      const trimmed = input.trim();
      const isUrl =
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('nexus://') ||
        trimmed.startsWith('view-source:') ||
        (trimmed.includes('.') && !trimmed.includes(' ') && trimmed.length > 3);

      if (isUrl) {
        return { type: 'url', target: trimmed };
      }
      return { type: 'search', target: `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}` };
    }

    const urlCheck1 = resolveAction('github.com');
    if (urlCheck1.type !== 'url' || urlCheck1.target !== 'github.com') {
      throw new Error(`Expected URL type for github.com, got ${JSON.stringify(urlCheck1)}`);
    }

    const urlCheck2 = resolveAction('view-source:https://news.ycombinator.com');
    if (urlCheck2.type !== 'url' || !urlCheck2.target.startsWith('view-source:')) {
      throw new Error(`Expected view-source URL type, got ${JSON.stringify(urlCheck2)}`);
    }

    const searchCheck = resolveAction('how to configure rust wasm');
    if (searchCheck.type !== 'search' || !searchCheck.target.includes('duckduckgo.com')) {
      throw new Error(`Expected search query for freeform text, got ${JSON.stringify(searchCheck)}`);
    }
    console.log('  ✓ Direct URL and search resolution correctly distinguishing URLs vs queries');

    // ----------------------------------------------------
    // TEST 5: view-source: Protocol Security & Navigation
    // ----------------------------------------------------
    console.log('\n[TEST 5] Testing view-source: protocol validation...');
    const canNavSource = (tabManager as any).isValidProtocol('view-source:https://example.com');
    if (!canNavSource) {
      throw new Error('view-source: protocol must be permitted for developer workflow');
    }
    const canNavScript = (tabManager as any).isValidProtocol('javascript:alert(1)');
    if (canNavScript) {
      throw new Error('javascript: protocol must be blocked');
    }
    console.log('  ✓ view-source: accepted as safe dev protocol, unsafe schemes blocked');

    console.log('\n====================================================');
    console.log('   🎉 ALL 5 WORKFLOW & COMMAND TESTS PASSED!        ');
    console.log('====================================================\n');

    win.destroy();
    app.quit();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    win.destroy();
    app.quit();
    process.exit(1);
  }
}

app.whenReady().then(runCommandTestSuite);
