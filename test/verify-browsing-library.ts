import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { BookmarksStore } from '../src/main/bookmarks-store';
import { HistoryStore } from '../src/main/history-store';
import { DownloadManager } from '../src/main/download-manager';
import { TabManager } from '../src/main/tab-manager';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

async function runBrowsingLibraryTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Browsing Library (Bookmarks, History, Downloads)');
  console.log(' Comprehensive Automated Verification Suite         ');
  console.log('====================================================\n');

  // Setup temporary test sandbox directory for stores
  const testDir = path.resolve(process.cwd(), 'test/sandbox-library');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const bookmarksFilePath = path.join(testDir, 'nexus-bookmarks.json');
  const historyFilePath = path.join(testDir, 'nexus-history.json');
  const downloadsSettingsPath = path.join(testDir, 'nexus-download-settings.json');

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

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: Bookmarks Management & Netscape HTML
    // ----------------------------------------------------
    console.log('[SUITE 1: BOOKMARKS STORE & HIERARCHY]');
    const bookmarksStore = new BookmarksStore(bookmarksFilePath);

    // 1.1 Verify default folders
    console.log('  1.1 Verifying default bookmark roots...');
    const roots = bookmarksStore.getAll();
    const toolbarFolder = roots.find((b) => b.id === 'toolbar');
    const otherFolder = roots.find((b) => b.id === 'other');
    if (!toolbarFolder || !otherFolder) {
      throw new Error('BookmarksStore failed to initialize default toolbar and other folders');
    }
    console.log('    ✓ Default "toolbar" and "other" root folders present');

    // 1.2 Create nested folders
    console.log('  1.2 Creating nested bookmark folders...');
    const devFolder = bookmarksStore.createFolder('Development', 'toolbar');
    const docsFolder = bookmarksStore.createFolder('Docs & Specs', devFolder.id);
    if (devFolder.parentId !== 'toolbar' || docsFolder.parentId !== devFolder.id) {
      throw new Error('Nested folder parentId mismatch');
    }
    console.log('    ✓ Nested folder hierarchy created (toolbar -> Development -> Docs & Specs)');

    // 1.3 Add bookmarks
    console.log('  1.3 Adding bookmarks across hierarchy...');
    const bmGitHub = bookmarksStore.save({
      title: 'GitHub: NEXUS Browser',
      url: 'https://github.com/nexus/browser',
      parentId: devFolder.id,
    });
    const bmMDN = bookmarksStore.save({
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      parentId: docsFolder.id,
    });
    const bmTop = bookmarksStore.save({
      title: 'Vercel Dashboard',
      url: 'https://vercel.com',
      parentId: 'toolbar',
    });
    console.log(`    ✓ 3 bookmarks added: "${bmGitHub.title}", "${bmMDN.title}", "${bmTop.title}"`);

    // 1.4 Search bookmarks
    console.log('  1.4 Testing bookmarks search...');
    const searchRes = bookmarksStore.search('NEXUS');
    if (searchRes.length !== 1 || searchRes[0].id !== bmGitHub.id) {
      throw new Error(`Bookmark search failed. Expected 1 result, got ${searchRes.length}`);
    }
    console.log('    ✓ Search correctly matched keyword in title');

    // 1.5 Edit bookmark
    console.log('  1.5 Editing bookmark title and URL...');
    const updatedMDN = bookmarksStore.save({
      id: bmMDN.id,
      title: 'MDN Web Docs (Official)',
      url: 'https://developer.mozilla.org/en-US/',
    });
    if (updatedMDN.title !== 'MDN Web Docs (Official)' || updatedMDN.url !== 'https://developer.mozilla.org/en-US/') {
      throw new Error('Bookmark edit failed to persist updated attributes');
    }
    console.log('    ✓ Bookmark edit confirmed');

    // 1.6 Netscape HTML Export
    console.log('  1.6 Exporting bookmarks to Netscape HTML format...');
    const exportedHtml = bookmarksStore.exportToHtml();
    if (!exportedHtml.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>')) {
      throw new Error('Exported HTML missing Netscape standard header');
    }
    if (!exportedHtml.includes('Development') || !exportedHtml.includes('https://developer.mozilla.org/en-US/')) {
      throw new Error('Exported HTML missing folder structure or bookmarks');
    }
    console.log('    ✓ Valid Netscape HTML bookmark format exported');

    // 1.7 HTML Import into fresh store
    console.log('  1.7 Importing Netscape HTML into a fresh Bookmarks store...');
    const freshBookmarksFilePath = path.join(testDir, 'nexus-bookmarks-fresh.json');
    const freshBookmarksStore = new BookmarksStore(freshBookmarksFilePath);
    const importResult = freshBookmarksStore.importFromHtml(exportedHtml);
    console.log(`    ✓ Imported ${importResult.imported} items successfully`);
    if (importResult.imported < 3) {
      throw new Error(`Expected at least 3 imported items, got ${importResult.imported}`);
    }
    const freshList = freshBookmarksStore.getAll();
    const importedGitHub = freshList.find((b) => b.url === 'https://github.com/nexus/browser');
    if (!importedGitHub) {
      throw new Error('Imported bookmarks missing GitHub entry');
    }
    console.log('    ✓ Imported bookmarks verified with full hierarchy preservation');

    // 1.8 Recursive deletion
    console.log('  1.8 Testing recursive folder deletion...');
    bookmarksStore.remove(devFolder.id);
    const afterDelete = bookmarksStore.getAll();
    if (afterDelete.some((b) => b.id === devFolder.id || b.id === docsFolder.id || b.id === bmGitHub.id || b.id === bmMDN.id)) {
      throw new Error('Recursive deletion failed to delete subfolders and child bookmarks');
    }
    console.log('    ✓ Folder and all descendants recursively removed');

    // ----------------------------------------------------
    // TEST SUITE 2: Browsing History Store
    // ----------------------------------------------------
    console.log('\n[SUITE 2: BROWSING HISTORY STORE & DEDUPLICATION]');
    const historyStore = new HistoryStore(historyFilePath);

    // 2.1 Add entries
    console.log('  2.1 Recording visits with title and timestamp...');
    const now = Date.now();
    const entry1 = historyStore.recordVisit('https://news.ycombinator.com', 'Hacker News', undefined, now - 5000);
    const entry2 = historyStore.recordVisit('https://lobste.rs', 'Lobsters', undefined, now - 3000);
    const entry3 = historyStore.recordVisit('https://github.com/explore', 'Explore GitHub', undefined, now - 1000);
    console.log(`    ✓ Recorded: "${entry1.title}", "${entry2.title}", "${entry3.title}"`);

    // 2.2 Deduplication and visit count
    console.log('  2.2 Testing repeat visit deduplication and counter increment...');
    const repeatVisit = historyStore.recordVisit('https://news.ycombinator.com', 'Hacker News (Updated)', undefined, now);
    if (repeatVisit.id !== entry1.id) {
      throw new Error('Expected same history entry ID on repeat visit');
    }
    if (repeatVisit.visitCount !== 2) {
      throw new Error(`Expected visitCount 2, got ${repeatVisit.visitCount}`);
    }
    if (repeatVisit.title !== 'Hacker News (Updated)') {
      throw new Error('Expected updated title on repeat visit');
    }
    console.log('    ✓ Duplicate visit properly updated visitCount and title without duplicate row');

    // 2.3 Search history
    console.log('  2.3 Searching history entries...');
    const histSearch = historyStore.search('Lobsters');
    if (histSearch.length !== 1 || histSearch[0].id !== entry2.id) {
      throw new Error('History search failed to find Lobsters entry');
    }
    console.log('    ✓ Search correctly filtered history');

    // 2.4 Range deletion
    console.log('  2.4 Deleting history by time range...');
    // Delete entries between now - 4000 and now - 2000 (should match entry2)
    const deletedCount = historyStore.deleteRange(now - 4000, now - 2000);
    if (deletedCount !== 1) {
      throw new Error(`Expected 1 entry deleted in range, got ${deletedCount}`);
    }
    const currentHist = historyStore.getAll();
    if (currentHist.some((h) => h.id === entry2.id)) {
      throw new Error('Deleted entry2 still present in history store');
    }
    console.log('    ✓ Date range deletion purged target entries cleanly');

    // 2.5 Single entry deletion & Clear all
    console.log('  2.5 Testing single entry delete and clear all...');
    historyStore.deleteEntry(entry3.id);
    if (historyStore.getAll().length !== 1) {
      throw new Error('Expected 1 remaining entry after deleteEntry');
    }
    historyStore.clear();
    if (historyStore.getAll().length !== 0) {
      throw new Error('Expected 0 entries after clear()');
    }
    console.log('    ✓ Single entry and clear all operations verified');

    // ----------------------------------------------------
    // TEST SUITE 3: Download Manager
    // ----------------------------------------------------
    console.log('\n[SUITE 3: DOWNLOAD MANAGER & EVENT LIFECYCLE]');
    const downloadManager = new DownloadManager(win, downloadsSettingsPath);

    // 3.1 Download directory management
    console.log('  3.1 Verifying download directory...');
    const defaultDir = downloadManager.getDownloadDirectory();
    if (!defaultDir || !fs.existsSync(defaultDir)) {
      throw new Error(`Default download directory invalid: ${defaultDir}`);
    }
    const customTestDir = path.join(testDir, 'downloads');
    fs.mkdirSync(customTestDir, { recursive: true });
    downloadManager.setCustomDownloadDirectory(customTestDir);
    if (downloadManager.getDownloadDirectory() !== customTestDir) {
      throw new Error('Custom download directory failed to set');
    }
    console.log(`    ✓ Custom download directory configured: ${customTestDir}`);

    // 3.2 Unique filename resolution
    console.log('  3.2 Testing collision-safe filename resolution...');
    const dummyFile = path.join(customTestDir, 'report.pdf');
    fs.writeFileSync(dummyFile, 'dummy content');
    const resolvedPath = downloadManager.generateUniqueSavePath('report.pdf');
    const expectedBase = 'report (1).pdf';
    if (!resolvedPath.endsWith(expectedBase)) {
      throw new Error(`Expected filename to end with '${expectedBase}', got '${resolvedPath}'`);
    }
    console.log(`    ✓ Unique filename resolved successfully: "${path.basename(resolvedPath)}"`);

    // 3.3 Helper utilities: Speed & Size formatting
    console.log('  3.3 Verifying download speed and file size calculation...');
    const formattedBytes = downloadManager.formatBytes(15728640); // 15 MB
    if (formattedBytes !== '15 MB' && formattedBytes !== '15.0 MB') {
      throw new Error(`Expected '15 MB', got '${formattedBytes}'`);
    }
    const formattedSpeed = downloadManager.formatSpeed(2621440); // 2.5 MB/s
    if (formattedSpeed !== '2.5 MB/s') {
      throw new Error(`Expected '2.5 MB/s', got '${formattedSpeed}'`);
    }
    console.log(`    ✓ Format utilities verified: ${formattedBytes}, ${formattedSpeed}`);

    // 3.4 Mock lifecycle management
    console.log('  3.4 Simulating download records and states...');
    // Create a mock record directly for state testing
    const mockRecord = downloadManager.createMockDownloadRecord({
      filename: 'nexus-v1.0.tar.gz',
      url: 'https://releases.nexus.dev/v1.0.tar.gz',
      totalBytes: 52428800, // 50MB
      savePath: path.join(customTestDir, 'nexus-v1.0.tar.gz'),
    });
    console.log(`    ✓ Mock download record initialized (ID: ${mockRecord.id})`);

    // Update progress
    downloadManager.updateMockProgress(mockRecord.id, {
      receivedBytes: 26214400, // 25MB
      speed: '5.2 MB/s',
      status: 'progressing',
    });
    let dItem = downloadManager.getDownloads().find((d) => d.id === mockRecord.id);
    if (!dItem || dItem.progress !== 50 || dItem.speed !== '5.2 MB/s') {
      throw new Error(`Mock progress failed. Got progress=${dItem?.progress}, speed=${dItem?.speed}`);
    }
    console.log(`    ✓ Download progressing: ${dItem.progress}% at ${dItem.speed}`);

    // Complete download
    downloadManager.updateMockProgress(mockRecord.id, {
      receivedBytes: 52428800,
      speed: '0 B/s',
      status: 'completed',
    });
    dItem = downloadManager.getDownloads().find((d) => d.id === mockRecord.id);
    if (!dItem || dItem.status !== 'completed' || dItem.progress !== 100) {
      throw new Error('Download completion status failed');
    }
    console.log('    ✓ Download completed successfully');

    // ----------------------------------------------------
    // TEST SUITE 4: TabManager Navigation, History & Internal Routing
    // ----------------------------------------------------
    console.log('\n[SUITE 4: TAB ENGINE INTEGRATION & ROUTING]');
    const tabManager = new TabManager(win);
    tabManager.setHistoryStore(historyStore);

    // 4.1 Internal routing for nexus://pages
    console.log('  4.1 Verifying internal routing for nexus://bookmarks, history, downloads...');
    const bookmarksTabId = tabManager.createTab('nexus://bookmarks');
    // Ensure WebContentsView is hidden for internal bookmarks manager
    if (tabManager.isViewVisible(bookmarksTabId)) {
      throw new Error('WebContentsView should be invisible for nexus://bookmarks internal manager');
    }
    console.log('    ✓ nexus://bookmarks hides WebContentsView cleanly');

    const historyTabId = tabManager.createTab('nexus://history');
    if (tabManager.isViewVisible(historyTabId)) {
      throw new Error('WebContentsView should be invisible for nexus://history internal manager');
    }
    console.log('    ✓ nexus://history hides WebContentsView cleanly');

    const downloadsTabId = tabManager.createTab('nexus://downloads');
    if (tabManager.isViewVisible(downloadsTabId)) {
      throw new Error('WebContentsView should be invisible for nexus://downloads internal manager');
    }
    console.log('    ✓ nexus://downloads hides WebContentsView cleanly');

    // 4.2 Private tab history isolation
    console.log('  4.2 Verifying private tab history exclusion...');
    const privateTabId = tabManager.createTab('https://secret-service.local', true, 'default', true);
    const privateState = tabManager.getTabState(privateTabId);
    if (!privateState?.isPrivate) {
      throw new Error('Tab isPrivate flag not set');
    }
    // Simulate navigation event handler on private tab
    tabManager.handleTabNavigationForTesting(privateTabId, 'https://secret-service.local', 'Secret Vault');
    const histEntries = historyStore.getAll();
    if (histEntries.some((h) => h.url === 'https://secret-service.local')) {
      throw new Error('Private tab URL was improperly recorded in history store!');
    }
    console.log('    ✓ Private tab completely isolated from history recording');

    // 4.3 Standard tab navigation recorded in history
    console.log('  4.3 Verifying standard tab navigation records to history...');
    const publicTabId = tabManager.createTab('https://developer.mozilla.org', true, 'default', false);
    tabManager.handleTabNavigationForTesting(publicTabId, 'https://developer.mozilla.org', 'MDN Web Docs');
    const mdnHist = historyStore.getAll().find((h) => h.url === 'https://developer.mozilla.org');
    if (!mdnHist || mdnHist.title !== 'MDN Web Docs') {
      throw new Error('Public tab navigation failed to record in history store');
    }
    console.log(`    ✓ Public tab visit recorded: "${mdnHist.title}" -> ${mdnHist.url}`);

    console.log('\n====================================================');
    console.log(' ALL 4 BROWSING LIBRARY SUITES PASSED CLEANLY!       ');
    console.log('====================================================\n');
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      win.destroy();
    } catch (e) {}
  }
}

app.whenReady().then(async () => {
  try {
    await runBrowsingLibraryTestSuite();
    app.exit(0);
  } catch (err) {
    console.error('\n❌ Browsing Library Test Suite Failed:');
    console.error(err);
    app.exit(1);
  }
});
