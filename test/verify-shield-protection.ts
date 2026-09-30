import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { ShieldEngine } from '../src/main/shield-engine';
import { DownloadManager } from '../src/main/download-manager';
import { SecurityManager } from '../src/main/security-manager';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`    ✓ ${message}`);
}

async function runShieldTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Shield Ad-Blocking & Security Test Suite    ');
  console.log('====================================================\n');

  const testSandboxDir = path.join(__dirname, 'sandbox-shield');
  if (fs.existsSync(testSandboxDir)) {
    fs.rmSync(testSandboxDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testSandboxDir, { recursive: true });

  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true },
  });

  try {
    const shield = new ShieldEngine(win, testSandboxDir);

    // ----------------------------------------------------
    // SUITE 1: NETWORK-LEVEL AD BLOCKING
    // ----------------------------------------------------
    console.log('[SUITE 1: AD BLOCKING ENGINE]');
    assert(shield.isAdUrl('https://ad.doubleclick.net/ddm/track') === true, 'DoubleClick ad server blocked');
    assert(shield.isAdUrl('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') === true, 'Google AdSense / Syndication blocked');
    assert(shield.isAdUrl('https://secure.adnxs.com/seg?add=1') === true, 'AppNexus ad network blocked');
    assert(shield.isAdUrl('https://static.criteo.net/js/ld/ld.js') === true, 'Criteo retargeting ads blocked');
    assert(shield.isAdUrl('https://cdn.carbonads.com/carbon.js') === true, 'CarbonAds network blocked');
    assert(shield.isAdUrl('https://example.com/adserver/banner.png') === true, 'Ad path heuristics /adserver/ caught');
    assert(shield.isAdUrl('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css') === false, 'Legitimate library script allowed');
    assert(shield.isAdUrl('https://wikipedia.org/wiki/Computer_science') === false, 'Standard web page allowed');
    console.log();

    // ----------------------------------------------------
    // SUITE 2: TRACKER BLOCKING & PRIVACY DEFENSE
    // ----------------------------------------------------
    console.log('[SUITE 2: TRACKER BLOCKING & PRIVACY TELEMETRY]');
    assert(shield.isTrackerUrl('https://www.google-analytics.com/analytics.js') === true, 'Google Analytics blocked');
    assert(shield.isTrackerUrl('https://connect.facebook.net/en_US/fbevents.js') === true, 'Facebook Pixel tracking blocked');
    assert(shield.isTrackerUrl('https://cdn.segment.com/analytics.js/v1/token') === true, 'Segment analytics beacon blocked');
    assert(shield.isTrackerUrl('https://www.clarity.ms/tag/key') === true, 'Microsoft Clarity session recorder blocked');
    assert(shield.isTrackerUrl('https://static.hotjar.com/c/hotjar-123.js') === true, 'Hotjar user recorder blocked');
    assert(shield.isTrackerUrl('https://api.github.com/repos/electron/electron') === false, 'Legitimate developer API allowed');
    console.log();

    // ----------------------------------------------------
    // SUITE 3: MALICIOUS DESTINATION & PHISHING INTERCEPTION
    // ----------------------------------------------------
    console.log('[SUITE 3: MALICIOUS DESTINATION & PHISHING PROTECTION]');
    const phishingCheck = shield.checkThreat('https://phishing-bank-login.com/account/auth');
    assert(phishingCheck.isThreat === true, 'Phishing destination detected');
    assert(phishingCheck.threat === 'phishing', 'Threat classification is phishing');

    const malwareCheck = shield.checkThreat('https://malware-test.com/payload.exe');
    assert(malwareCheck.isThreat === true, 'Malware domain detected');
    assert(malwareCheck.threat === 'malware', 'Threat classification is malware');

    const cryptoCheck = shield.checkThreat('https://crypto-drainer.xyz/connect');
    assert(cryptoCheck.isThreat === true, 'Crypto scam detected');
    assert(cryptoCheck.threat === 'scam', 'Threat classification is scam');

    const safeCheck = shield.checkThreat('https://developer.mozilla.org/en-US/docs/Web');
    assert(safeCheck.isThreat === false, 'Legitimate documentation site passes cleanly');

    // Test Threat Bypass
    const testThreatUrl = 'https://phishing-bank-login.com/account/auth';
    shield.allowThreatBypass(testThreatUrl);
    const bypassedCheck = shield.checkThreat(testThreatUrl);
    assert(bypassedCheck.isThreat === false, 'User explicit bypass allows navigation past threat gate');
    console.log();

    // ----------------------------------------------------
    // SUITE 4: PER-SITE ALLOWLIST & TEMPORARY PAUSE
    // ----------------------------------------------------
    console.log('[SUITE 4: PER-SITE ALLOWLIST & TEMPORARY PAUSE]');
    const testSite = 'technews-special.com';
    assert(shield.isSiteAllowlisted(testSite) === false, 'Site not allowlisted by default');

    const nowAllowed = shield.toggleSiteAllowlist(testSite);
    assert(nowAllowed === true, 'Site added to allowlist via toggle');
    assert(shield.isSiteAllowlisted(testSite) === true, 'Site is recognized as allowlisted');

    const nowRemoved = shield.toggleSiteAllowlist(testSite);
    assert(nowRemoved === false, 'Site removed from allowlist on toggle');
    assert(shield.isSiteAllowlisted(testSite) === false, 'Site is protected once again');

    // Temporary pause test
    shield.pauseTemporarily(15); // 15 mins
    const pausedSettings = shield.getSettings();
    assert(pausedSettings.temporaryPauseUntil !== null, 'Temporary pause timestamp set');
    assert(pausedSettings.temporaryPauseUntil! > Date.now(), 'Pause expiration is in the future');

    shield.resume();
    const resumedSettings = shield.getSettings();
    assert(resumedSettings.temporaryPauseUntil === null, 'Resume cleared temporary pause');
    console.log();

    // ----------------------------------------------------
    // SUITE 5: POP-UP BLOCKING & TAB TELEMETRY
    // ----------------------------------------------------
    console.log('[SUITE 5: UNSOLICITED POP-UP & TAB TELEMETRY]');
    assert(shield.isPopupDomain('popads.net') === true, 'Known pop-up ad network popads.net blocked');
    assert(shield.isPopupDomain('popcash.net') === true, 'Known pop-up network popcash.net blocked');
    assert(shield.isPopupDomain('google.com') === false, 'Standard domain allowed for window.open');

    // Tab Telemetry
    shield.registerTab('tab-test-1', 101, 'https://example-news.com');
    shield.recordBlock(101, 'https://ad.doubleclick.net/ad', 'ad');
    shield.recordBlock(101, 'https://google-analytics.com/collect', 'tracker');
    shield.recordBlock(101, 'https://popads.net/popup', 'popup');

    const tabStats = shield.getTabStats('tab-test-1');
    assert(tabStats.adsBlocked === 1, 'Tab recorded 1 ad blocked');
    assert(tabStats.trackersBlocked === 1, 'Tab recorded 1 tracker blocked');
    assert(tabStats.popupsBlocked === 1, 'Tab recorded 1 popup blocked');
    assert(tabStats.totalBlocked === 3, 'Tab totalBlocked equals 3');

    const globalStats = shield.getStats();
    assert(globalStats.totalAdsBlocked >= 1, 'Global ads blocked recorded');
    assert(globalStats.totalTrackersBlocked >= 1, 'Global trackers blocked recorded');
    assert(globalStats.totalPopupsBlocked >= 1, 'Global popups blocked recorded');
    console.log();

    // ----------------------------------------------------
    // SUITE 6: EXECUTABLE DOWNLOAD SAFETY GUARD
    // ----------------------------------------------------
    console.log('[SUITE 6: EXECUTABLE DOWNLOAD SAFETY]');
    const dlManager = new DownloadManager(win, testSandboxDir);
    assert(dlManager.isExecutableFile('setup.exe') === true, '.exe recognized as executable file');
    assert(dlManager.isExecutableFile('package.msi') === true, '.msi recognized as executable installer');
    assert(dlManager.isExecutableFile('script.sh') === true, '.sh recognized as executable script');
    assert(dlManager.isExecutableFile('app.AppImage') === true, '.AppImage recognized as executable');
    assert(dlManager.isExecutableFile('macro.vbs') === true, '.vbs recognized as executable script');
    assert(dlManager.isExecutableFile('document.pdf') === false, '.pdf is safe document');
    assert(dlManager.isExecutableFile('archive.zip') === false, '.zip is archive (not directly executed)');
    assert(dlManager.isExecutableFile('photo.png') === false, '.png is safe image');
    console.log();

    // ----------------------------------------------------
    // SUITE 7: STRICT SSL / CERTIFICATE VERIFICATION
    // ----------------------------------------------------
    console.log('[SUITE 7: STRICT SSL VERIFICATION]');
    const securityManager = new SecurityManager();
    const mockBadCert = {
      subjectName: 'CN=expired.example.com',
      issuerName: 'CN=Example CA',
      validFrom: 1600000000,
      validTo: 1610000000,
      fingerprint: 'SHA256/abc1234567890',
      serialNumber: '998877',
    };

    const certError = securityManager.handleCertificateError(
      'https://expired.example.com',
      'net::ERR_CERT_COMMON_NAME_INVALID',
      mockBadCert
    );
    assert(certError.error === 'net::ERR_CERT_COMMON_NAME_INVALID', 'Strict certificate error trapped');
    const secDetails = securityManager.getSiteSecurityInfo('https://expired.example.com');
    assert(secDetails.isSecure === false, 'Insecure certificate connection strictly marked isSecure: false');
    assert(secDetails.status === 'warning', 'Security status marked warning');
    console.log();

    // ----------------------------------------------------
    // SUITE 8: LOCAL SETTINGS & FILTER LIST PERSISTENCE
    // ----------------------------------------------------
    console.log('[SUITE 8: LOCAL PERSISTENCE & PRIVACY GUARANTEE]');
    const settingsFile = path.join(testSandboxDir, 'nexus-shield-settings.json');
    assert(fs.existsSync(settingsFile), 'nexus-shield-settings.json exists in user profile dir');

    const statsFile = path.join(testSandboxDir, 'nexus-shield-stats.json');
    assert(fs.existsSync(statsFile), 'nexus-shield-stats.json exists in user profile dir');

    // Test Reset
    shield.resetStats();
    const resetStats = shield.getStats();
    assert(resetStats.totalBlocked === 0, 'Shield statistics successfully reset to 0');

    console.log('\n====================================================');
    console.log('   🎉 ALL 8 NEXUS SHIELD SUITES PASSED CLEANLY!     ');
    console.log('====================================================\n');

    win.destroy();
    app.quit();
  } catch (err) {
    console.error('Test execution failed with error:', err);
    win.destroy();
    process.exit(1);
  }
}

app.whenReady().then(runShieldTestSuite);
