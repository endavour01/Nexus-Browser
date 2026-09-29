import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { ProfileManager } from '../src/main/profile-manager';
import { PermissionManager } from '../src/main/permission-manager';
import { SecurityManager } from '../src/main/security-manager';
import { TrackingProtection } from '../src/main/tracking-protection';
import { TabManager } from '../src/main/tab-manager';
import { HistoryStore } from '../src/main/history-store';

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

async function runPrivacySecurityTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Privacy, Security, Profiles & Tracking       ');
  console.log(' Comprehensive Automated Verification Suite         ');
  console.log('====================================================\n');

  // Setup temporary test sandbox directory
  const testDir = path.resolve(process.cwd(), 'test/sandbox-privacy-security');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const profilesFilePath = path.join(testDir, 'nexus-profiles.json');
  const permissionsFilePath = path.join(testDir, 'nexus-site-permissions.json');
  const historyFilePath = path.join(testDir, 'nexus-history.json');

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
    // SUITE 1: User Profiles & Session Isolation
    // ----------------------------------------------------
    console.log('[SUITE 1: USER PROFILES & DATA DIRECTORY ISOLATION]');
    const profileManager = new ProfileManager(profilesFilePath);

    // 1.1 Default profiles setup
    const allProfiles = profileManager.getAll();
    assert(allProfiles.length >= 2, 'Default profiles initialized with at least 2 profiles (Personal, Work)');
    const active = profileManager.getActiveProfile();
    assert(active.id === 'personal' || active.isDefault, `Active profile is default (${active.name})`);

    // 1.2 Profile creation
    const createdProfile = profileManager.createProfile('Security Research', 'Shield', '#34D399');
    assert(createdProfile.name === 'Security Research', 'New profile created: Security Research');
    assert(createdProfile.color === '#34D399', 'Profile assigned custom color #34D399');

    // 1.3 Persistent storage paths
    const paths = profileManager.getProfileDataPaths(createdProfile.id);
    assert(paths.bookmarks.includes(createdProfile.id), 'Profile bookmarks path is isolated');
    assert(paths.history.includes(createdProfile.id), 'Profile history path is isolated');
    assert(paths.downloads.includes(createdProfile.id), 'Profile downloads path is isolated');

    // 1.4 Partition name verification
    const partition = profileManager.getProfileSessionPartition(createdProfile.id);
    assert(partition === `persist:profile_${createdProfile.id}`, `Profile session partition format: ${partition}`);

    // 1.5 Profile updates
    const updated = profileManager.updateProfile(createdProfile.id, { name: 'Penetration Testing' });
    assert(updated?.name === 'Penetration Testing', 'Profile name updated successfully');

    // 1.6 Switching profiles
    const switched = profileManager.switchProfile(createdProfile.id);
    assert(switched?.id === createdProfile.id, 'Active profile switched to Penetration Testing');
    assert(profileManager.getActiveProfile().id === createdProfile.id, 'getActiveProfile reflects switched profile');

    // 1.7 Safe profile deletion
    const deleted = profileManager.deleteProfile(createdProfile.id);
    assert(deleted === true, 'Non-default profile deleted cleanly');
    assert(profileManager.getActiveProfile().id !== createdProfile.id, 'Active profile automatically reset upon deletion of active');
    console.log();

    // ----------------------------------------------------
    // SUITE 2: Origin-Based Site Permissions & Controls
    // ----------------------------------------------------
    console.log('[SUITE 2: SITE PERMISSIONS & PROMPT RESOLUTION]');
    const permissionManager = new PermissionManager(permissionsFilePath, win);

    // 2.1 Set and retrieve rules
    permissionManager.setRule('https://meet.google.com', 'camera', 'allow');
    permissionManager.setRule('https://meet.google.com', 'microphone', 'allow');
    permissionManager.setRule('https://sketchy-site.io', 'geolocation', 'deny');

    const googleCam = permissionManager.getRule('https://meet.google.com', 'camera');
    assert(googleCam?.decision === 'allow', 'Permission rule stored: meet.google.com camera -> allow');

    const sketchyGeo = permissionManager.getRule('https://sketchy-site.io', 'geolocation');
    assert(sketchyGeo?.decision === 'deny', 'Permission rule stored: sketchy-site.io geolocation -> deny');

    // 2.2 Unconfigured permission returns default 'ask'
    const unconfigured = permissionManager.getDecision('https://random.org', 'camera');
    assert(unconfigured === 'ask', 'Unconfigured origin returns default decision: ask');

    // 2.3 Interactive prompt resolution with persistence
    let promptCallbackResult: boolean | null = null;
    const testRequestId = 'test-prompt-req-1';
    (permissionManager as any).pendingRequests.set(testRequestId, {
      callback: (allowed: boolean) => {
        promptCallbackResult = allowed;
      },
      origin: 'https://video-call.internal',
      permission: 'camera',
    });

    // Simulate user clicking "Allow" and checking "Remember"
    permissionManager.resolvePrompt(testRequestId, true, true);
    assert(promptCallbackResult === true, 'Interactive prompt resolved: callback invoked with true');
    const rememberedRule = permissionManager.getRule('https://video-call.internal', 'camera');
    assert(rememberedRule?.decision === 'allow', 'Prompt decision was remembered and persisted to rule store');

    // 2.4 Removal of permission rule
    const removed = permissionManager.removeRule('https://sketchy-site.io', 'geolocation');
    assert(removed === true, 'Individual rule removed successfully');
    assert(permissionManager.getRule('https://sketchy-site.io', 'geolocation') === undefined, 'Removed rule no longer in store');

    // 2.5 Clear all permissions
    permissionManager.clearAll();
    assert(permissionManager.getAll().length === 0, 'clearAll successfully purged all site permission rules');
    console.log();

    // ----------------------------------------------------
    // SUITE 3: Security & Certificate Error Handling
    // ----------------------------------------------------
    console.log('[SUITE 3: CERTIFICATE VALIDATION & SECURITY HANDLING]');
    const securityManager = new SecurityManager(win);

    // 3.1 Extract Certificate Details
    const mockCert = {
      subjectName: 'CN=api.nexusbrowser.com, O=Nexus Tech',
      issuerName: 'CN=Let\'s Encrypt Authority X3, O=Let\'s Encrypt',
      validStart: Math.floor(Date.now() / 1000) - 3600,
      validExpiry: Math.floor(Date.now() / 1000) + 86400 * 90,
      fingerprint: 'SHA256:4A:8B:9C:0D:1E:2F:3A:4B:5C:6D:7E:8F:90:12:34:56',
      serialNumber: '03:FA:91:82:73:64',
    } as any;

    const certInfo = securityManager.extractCertificateInfo(mockCert);
    assert(certInfo.subjectName === mockCert.subjectName, 'Certificate subject name parsed correctly');
    assert(certInfo.issuerName === mockCert.issuerName, 'Certificate issuer name parsed correctly');
    assert(certInfo.fingerprint === mockCert.fingerprint, 'Certificate fingerprint preserved');

    // 3.2 Secure vs Insecure status evaluation
    const internalInfo = securityManager.getSiteSecurityInfo('nexus://permissions');
    assert(internalInfo.status === 'secure', 'Internal page nexus://permissions is secure');

    const httpInfo = securityManager.getSiteSecurityInfo('http://insecure-http-site.com');
    assert(httpInfo.status === 'insecure', 'Plain HTTP connection marked as insecure');

    // 3.3 Strict Certificate Error Handling (Never Silently Bypass)
    const certErrorDetails = securityManager.handleCertificateError(
      'https://expired-rsa-dv.badssl.com',
      'net::ERR_CERT_DATE_INVALID',
      mockCert
    );
    assert(certErrorDetails.error === 'net::ERR_CERT_DATE_INVALID', 'Certificate error recorded: ERR_CERT_DATE_INVALID');
    assert(certErrorDetails.errorDescription.includes('expired'), 'User-friendly explanation generated for expired cert');

    const warningInfo = securityManager.getSiteSecurityInfo('https://expired-rsa-dv.badssl.com');
    assert(warningInfo.status === 'warning', 'Site with certificate failure marked as warning status');
    assert(warningInfo.isSecure === false, 'Site with certificate failure isSecure marked false');
    console.log();

    // ----------------------------------------------------
    // SUITE 4: Enhanced Tracking Protection Engine
    // ----------------------------------------------------
    console.log('[SUITE 4: ENHANCED TRACKING PROTECTION]');
    const tracking = new TrackingProtection(win);

    // 4.1 Real tracker signature matching
    assert(tracking.isTrackerUrl('https://www.google-analytics.com/analytics.js') === true, 'Google Analytics matched as tracker');
    assert(tracking.isTrackerUrl('https://connect.facebook.net/en_US/fbevents.js') === true, 'Facebook Pixel matched as tracker');
    assert(tracking.isTrackerUrl('https://secure.doubleclick.net/pagead/id') === true, 'DoubleClick ad server matched as tracker');
    assert(tracking.isTrackerUrl('https://cdn.segment.com/analytics.js/v1/key') === true, 'Segment telemetry matched as tracker');
    assert(tracking.isTrackerUrl('https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/react.production.min.js') === false, 'Legitimate CDN script allowed');
    assert(tracking.isTrackerUrl('https://github.com/torvalds/linux') === false, 'Standard web page allowed');

    // 4.2 Exceptions handling
    const testSite = 'https://analytics-debug-partner.com';
    assert(tracking.isOriginExcepted(testSite) === false, 'Origin not excepted by default');
    tracking.toggleException(testSite);
    assert(tracking.isOriginExcepted(testSite) === true, 'Origin added to tracking exception list');
    tracking.toggleException(testSite);
    assert(tracking.isOriginExcepted(testSite) === false, 'Origin removed from tracking exception list on second toggle');

    // 4.3 Modes verification
    tracking.setMode('strict');
    assert(tracking.getSettings().mode === 'strict', 'Tracking mode successfully switched to strict');
    tracking.setMode('standard');
    assert(tracking.getSettings().mode === 'standard', 'Tracking mode successfully switched to standard');
    console.log();

    // ----------------------------------------------------
    // SUITE 5: Private Browsing & Data Categorization
    // ----------------------------------------------------
    console.log('[SUITE 5: PRIVATE BROWSING & DATA CLEARING CATEGORIES]');
    const tabManager = new TabManager(win);
    const historyStore = new HistoryStore(historyFilePath);
    tabManager.setHistoryStore(historyStore);
    tabManager.setProfileManager(profileManager);
    tabManager.setPermissionManager(permissionManager);
    tabManager.setSecurityManager(securityManager);
    tabManager.setTrackingProtection(tracking);

    // 5.1 Private Tab Isolation
    const privateTabId = tabManager.createTab('https://duckduckgo.com', true, 'default', true);
    const privateTabState = tabManager.getTabState(privateTabId);
    assert(privateTabState?.isPrivate === true, 'Private tab created with isPrivate: true');

    // Verify private tab navigation does not record to history
    tabManager.handleTabNavigationForTesting(privateTabId, 'https://private-search.org', 'Private Search');
    assert(historyStore.getAll().length === 0, 'Private tab navigation completely excluded from history recording');

    // Verify private tab is excluded from recently closed tabs
    tabManager.closeTab(privateTabId);
    assert(tabManager.getRecentlyClosedTabs().length === 0, 'Closed private tab excluded from recently closed session records');

    // 5.2 Public Tab Records History
    const publicTabId = tabManager.createTab('https://kernel.org', true, 'default', false);
    tabManager.handleTabNavigationForTesting(publicTabId, 'https://kernel.org', 'The Linux Kernel');
    assert(historyStore.getAll().length === 1, 'Standard public tab navigation recorded to history store');

    // 5.3 Categorized Data Clearing
    permissionManager.setRule('https://temporary.org', 'notifications', 'allow');
    assert(permissionManager.getAll().length === 1, 'Site permission set before test clear');

    await tabManager.clearBrowsingData({
      history: true,
      sitePermissions: true,
      cookies: true,
      cache: true,
    });

    assert(historyStore.getAll().length === 0, 'History cleared by category');
    assert(permissionManager.getAll().length === 0, 'Site permissions cleared by category');

    console.log('\n====================================================');
    console.log('   🎉 ALL 5 PRIVACY & SECURITY SUITES PASSED!       ');
    console.log('====================================================\n');

    win.destroy();
    app.quit();
  } catch (err) {
    console.error('Test execution failed with error:', err);
    win.destroy();
    process.exit(1);
  }
}

app.whenReady().then(runPrivacySecurityTestSuite);
