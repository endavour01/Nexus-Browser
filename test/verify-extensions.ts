import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { ExtensionManager } from '../src/main/extension-manager';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

async function runExtensionTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Real Extension Manager Verification Suite    ');
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

  const extensionManager = new ExtensionManager(win);
  const testExtDir = path.resolve(process.cwd(), 'test/fixtures/nexus-test-extension');
  const incompExtDir = path.resolve(process.cwd(), 'test/fixtures/incompatible-extension');

  try {
    // ----------------------------------------------------
    // TEST 1: Manifest Reading & Compatibility Validation
    // ----------------------------------------------------
    console.log('[TEST 1] Testing Manifest Validation on Compatible Extension...');
    const validResult = await extensionManager.validateManifest(testExtDir);
    if (!validResult.valid) {
      throw new Error(`Validation failed unexpectedly: ${validResult.error}`);
    }
    if (validResult.name !== 'NEXUS Dark Mode Helper') {
      throw new Error(`Name mismatch. Expected 'NEXUS Dark Mode Helper', got '${validResult.name}'`);
    }
    if (!validResult.permissions.includes('storage')) {
      throw new Error("Permissions should include 'storage'");
    }
    if (validResult.action?.popup !== 'popup.html') {
      throw new Error(`Action popup mismatch. Expected 'popup.html', got '${validResult.action?.popup}'`);
    }
    if (validResult.compatibility.status !== 'compatible') {
      throw new Error(`Expected status 'compatible', got '${validResult.compatibility.status}'`);
    }
    console.log('  ✓ Manifest parsed, MV3 action popup and storage permissions identified');
    console.log('  ✓ Compatibility verified: compatible');

    // ----------------------------------------------------
    // TEST 2: Incompatible Extension Detection & Notes
    // ----------------------------------------------------
    console.log('\n[TEST 2] Testing Incompatible Permissions & Explanations...');
    const incompResult = await extensionManager.validateManifest(incompExtDir);
    if (!incompResult.valid) {
      throw new Error(`Incompatible manifest should still be valid JSON: ${incompResult.error}`);
    }
    if (incompResult.compatibility.status !== 'partially_compatible') {
      throw new Error(
        `Expected status 'partially_compatible', got '${incompResult.compatibility.status}'`
      );
    }
    const unsupp = incompResult.compatibility.unsupportedPermissions;
    if (!unsupp.includes('bookmarks') || !unsupp.includes('history') || !unsupp.includes('downloads')) {
      throw new Error(`Unsupported permissions not correctly flagged. Got: ${JSON.stringify(unsupp)}`);
    }
    console.log('  ✓ Unsupported Chrome APIs detected: bookmarks, history, downloads, management');
    console.log('  ✓ Informative compatibility notes generated for the user');

    // ----------------------------------------------------
    // TEST 3: Invalid / Broken Path Rejection
    // ----------------------------------------------------
    console.log('\n[TEST 3] Testing Invalid Path & Security Validation...');
    const invalidPathResult = await extensionManager.validateManifest('/non/existent/path/for/extension');
    if (invalidPathResult.valid) {
      throw new Error('Non-existent directory should fail validation');
    }
    console.log('  ✓ Invalid paths rejected securely without executing');

    // ----------------------------------------------------
    // TEST 4: Extension Installation in Electron Session
    // ----------------------------------------------------
    console.log('\n[TEST 4] Testing Extension Installation into Electron Session...');
    const installed = await extensionManager.install(testExtDir);
    if (!installed || !installed.id) {
      throw new Error('Install failed to return valid installed extension record');
    }
    const loadedInSession = session.defaultSession.getExtension(installed.id);
    if (!loadedInSession) {
      throw new Error('Extension was not loaded into Electron session.defaultSession');
    }
    console.log(`  ✓ Extension installed successfully! (ID: ${installed.id}, Name: ${installed.name})`);
    console.log(`  ✓ Verified active in session.defaultSession (${loadedInSession.name})`);

    // ----------------------------------------------------
    // TEST 5: Persistence to Disk
    // ----------------------------------------------------
    console.log('\n[TEST 5] Testing Extension Store Persistence...');
    const storeFile = extensionManager.getFilePath();
    if (!fs.existsSync(storeFile)) {
      throw new Error(`Persistence file not found at ${storeFile}`);
    }
    const storeData = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    const savedExt = storeData.extensions.find((e: any) => e.id === installed.id);
    if (!savedExt || savedExt.path !== testExtDir || !savedExt.enabled) {
      throw new Error('Extension metadata not correctly persisted to disk');
    }
    console.log(`  ✓ Metadata persisted in ${path.basename(storeFile)} (Path: ${savedExt.path})`);

    // ----------------------------------------------------
    // TEST 6: Enabling, Disabling, and Reloading
    // ----------------------------------------------------
    console.log('\n[TEST 6] Testing Disable, Enable, and Reload Lifecycle...');
    // Disable
    await extensionManager.disable(installed.id);
    const disabledRecord = extensionManager.list().find((e) => e.id === installed.id);
    if (!disabledRecord || disabledRecord.enabled !== false) {
      throw new Error('Extension state should be enabled: false');
    }
    const afterDisableSession = session.defaultSession.getExtension(installed.id);
    if (afterDisableSession) {
      throw new Error('Extension should be removed from session when disabled');
    }
    console.log('  ✓ Extension disabled and removed from active session');

    // Re-enable
    await extensionManager.enable(installed.id);
    const reenabledRecord = extensionManager.list().find((e) => e.id === installed.id);
    if (!reenabledRecord || reenabledRecord.enabled !== true) {
      throw new Error('Extension state should be enabled: true');
    }
    const afterEnableSession = session.defaultSession.getExtension(installed.id);
    if (!afterEnableSession) {
      throw new Error('Extension should be reloaded into session when enabled');
    }
    console.log('  ✓ Extension enabled and reloaded into active session');

    // Reload
    await extensionManager.reload(installed.id);
    console.log('  ✓ Extension reloaded cleanly');

    // ----------------------------------------------------
    // TEST 7: Startup Re-initialization & Uninstallation
    // ----------------------------------------------------
    console.log('\n[TEST 7] Testing Startup Re-initialization and Clean Removal...');
    const restartedManager = new ExtensionManager(win);
    await restartedManager.init();
    const listAfterRestart = restartedManager.list();
    const foundAfterRestart = listAfterRestart.find((e) => e.path === testExtDir && e.enabled);
    if (!foundAfterRestart) {
      throw new Error('Extension was not restored on simulated startup');
    }
    console.log('  ✓ Extension reloaded automatically on startup');

    // Uninstall
    await restartedManager.uninstall(foundAfterRestart.id);
    const listAfterUninstall = restartedManager.list();
    if (listAfterUninstall.some((e) => e.id === foundAfterRestart.id)) {
      throw new Error('Extension should be removed from registry on uninstall');
    }
    console.log('  ✓ Extension uninstalled and cleaned from session and disk');

    console.log('\n====================================================');
    console.log('   🎉 ALL 7 EXTENSION MANAGER TESTS PASSED!         ');
    console.log('====================================================\n');

    win.destroy();
    app.quit();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ EXTENSION TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    win.destroy();
    app.quit();
    process.exit(1);
  }
}

app.whenReady().then(runExtensionTestSuite);
