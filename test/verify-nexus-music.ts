// ============================================================================
// NEXUS Music Automated QA Verification Suite
// ============================================================================

import path from 'path';
import fs from 'fs';
import { MusicManager, DEFAULT_MUSIC_SERVICES } from '../src/main/music-manager';
import { MusicService } from '../src/shared/types';

async function runMusicTestSuite() {
  console.log('====================================================');
  console.log('       NEXUS Music Comprehensive Verification       ');
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

  const testDir = path.resolve(process.cwd(), 'test/sandbox-music');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const musicManager = new MusicManager(testDir);

  // --------------------------------------------------------------------------
  // SUITE 1: 7 LAUNCH SERVICES & AUTHENTIC BRAND DATA
  // --------------------------------------------------------------------------
  console.log('[SUITE 1: 7 LAUNCH SERVICES & AUTHENTIC BRAND DATA]');

  assert(DEFAULT_MUSIC_SERVICES.length === 7, 'DEFAULT_MUSIC_SERVICES contains exactly 7 services');

  const spotify = DEFAULT_MUSIC_SERVICES.find((s) => s.id === 'spotify');
  assert(!!spotify, 'Spotify service is defined');
  assert(spotify?.url === 'https://open.spotify.com', 'Spotify URL is https://open.spotify.com');
  assert(spotify?.brandColor === '#1DB954', 'Spotify brand color is #1DB954');
  assert(spotify?.supportsWebPlayer === true, 'Spotify supportsWebPlayer is true');

  const ytMusic = DEFAULT_MUSIC_SERVICES.find((s) => s.id === 'youtube-music');
  assert(!!ytMusic, 'YouTube Music service is defined');
  assert(ytMusic?.url === 'https://music.youtube.com', 'YouTube Music URL is https://music.youtube.com');
  assert(ytMusic?.brandColor === '#FF0000', 'YouTube Music brand color is #FF0000');

  const appleMusic = DEFAULT_MUSIC_SERVICES.find((s) => s.id === 'apple-music');
  assert(!!appleMusic, 'Apple Music service is defined');
  assert(appleMusic?.url === 'https://music.apple.com', 'Apple Music URL is https://music.apple.com');
  assert(appleMusic?.brandColor === '#FA243C', 'Apple Music brand color is #FA243C');

  const soundcloud = DEFAULT_MUSIC_SERVICES.find((s) => s.id === 'soundcloud');
  assert(!!soundcloud, 'SoundCloud service is defined');
  assert(soundcloud?.url === 'https://soundcloud.com', 'SoundCloud URL is https://soundcloud.com');
  assert(soundcloud?.brandColor === '#FF5500', 'SoundCloud brand color is #FF5500');

  const amazonMusic = DEFAULT_MUSIC_SERVICES.find((s) => s.id === 'amazon-music');
  assert(!!amazonMusic, 'Amazon Music service is defined');
  assert(amazonMusic?.url === 'https://music.amazon.com', 'Amazon Music URL is https://music.amazon.com');
  assert(amazonMusic?.brandColor === '#00A8E1', 'Amazon Music brand color is #00A8E1');

  const deezer = DEFAULT_MUSIC_SERVICES.find((s) => s.id === 'deezer');
  assert(!!deezer, 'Deezer service is defined');
  assert(deezer?.url === 'https://www.deezer.com', 'Deezer URL is https://www.deezer.com');
  assert(deezer?.brandColor === '#A238FF', 'Deezer brand color is #A238FF');

  const jioSaavn = DEFAULT_MUSIC_SERVICES.find((s) => s.id === 'jiosaavn');
  assert(!!jioSaavn, 'JioSaavn service is defined');
  assert(jioSaavn?.name === 'JioSaavn', 'JioSaavn service name is correctly capitalized');
  assert(jioSaavn?.url === 'https://www.jiosaavn.com', 'JioSaavn URL is the official web player');
  assert(jioSaavn?.connectionState === 'available', 'JioSaavn starts available, not connected');
  assert(jioSaavn?.supportsWebPlayer === true, 'JioSaavn supports its web player');

  // --------------------------------------------------------------------------
  // SUITE 2: URL VALIDATION & SECURITY
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 2: URL VALIDATION & SECURITY]');

  const validUrls = [
    'https://open.spotify.com',
    'https://music.youtube.com',
    'https://music.apple.com',
    'https://soundcloud.com',
    'http://localhost:3000',
    'deezer.com', // should auto-prepend https
  ];

  for (const url of validUrls) {
    const res = MusicManager.validateUrl(url);
    assert(res.valid === true, `Valid URL accepted: ${url}`);
  }

  const blockedUrls = [
    'javascript:alert(1)',
    'data:text/html,<h1>XSS</h1>',
    'file:///etc/passwd',
    'blob:https://example.com/audio',
    'not_a_valid_domain',
    '',
  ];

  for (const url of blockedUrls) {
    const res = MusicManager.validateUrl(url);
    assert(res.valid === false, `Blocked dangerous or malformed URL: ${url}`);
  }

  // --------------------------------------------------------------------------
  // SUITE 3: STATE TRANSITIONS & PERSISTENCE
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 3: STATE TRANSITIONS & PERSISTENCE]');

  const loadedServices = musicManager.getServices();
  assert(loadedServices.length === 7, 'MusicManager loaded 7 default services from initialization');

  // Set connection state
  musicManager.setConnectionState('spotify', 'connected', 'In-Tab Active');
  let sp = musicManager.getService('spotify');
  assert(sp?.connectionState === 'connected', 'Spotify connectionState transitioned to connected');
  assert(sp?.statusText === 'In-Tab Active', 'Spotify statusText updated to In-Tab Active');

  // Disconnect
  musicManager.disconnectService('spotify');
  sp = musicManager.getService('spotify');
  assert(sp?.connectionState === 'not_connected', 'Spotify disconnected successfully');

  // Toggle favorite
  const initialFav = sp?.isFavorite ?? false;
  musicManager.toggleFavorite('spotify');
  sp = musicManager.getService('spotify');
  assert(sp?.isFavorite === !initialFav, 'Spotify favorite toggled successfully');

  // Verify file persistence
  const storageFilePath = path.join(testDir, 'nexus-music.json');
  assert(fs.existsSync(storageFilePath), 'nexus-music.json exists on disk');

  // Reload manager from disk
  const reloadedManager = new MusicManager(testDir);
  const reloadedSpotify = reloadedManager.getService('spotify');
  assert(reloadedSpotify?.isFavorite === !initialFav, 'Persisted favorite survived disk reload');
  assert(reloadedSpotify?.connectionState === 'not_connected', 'Persisted state survived disk reload');

  // Corruption tolerance test
  fs.writeFileSync(storageFilePath, '{"corrupted": true, "services": null}', 'utf8');
  const recoveryManager = new MusicManager(testDir);
  assert(recoveryManager.getServices().length === 7, 'Corrupt nexus-music.json recovered gracefully to defaults');

  // --------------------------------------------------------------------------
  // SUITE 4: COMPONENT FILES & SVG LOGO INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 4: COMPONENT FILES & SVG LOGO INTEGRITY]');

  const rootDir = process.cwd();
  const musicDir = path.join(rootDir, 'src/renderer/src/components/Music');

  assert(fs.existsSync(path.join(musicDir, 'MusicWorkspace.tsx')), 'MusicWorkspace.tsx exists');
  assert(fs.existsSync(path.join(musicDir, 'MusicServiceCard.tsx')), 'MusicServiceCard.tsx exists');
  assert(fs.existsSync(path.join(musicDir, 'MusicServiceLogos.tsx')), 'MusicServiceLogos.tsx exists');
  assert(fs.existsSync(path.join(musicDir, 'index.ts')), 'Music/index.ts exports exist');

  const logosContent = fs.readFileSync(path.join(musicDir, 'MusicServiceLogos.tsx'), 'utf8');
  assert(logosContent.includes('SpotifyLogo'), 'MusicServiceLogos exports SpotifyLogo');
  assert(logosContent.includes('YouTubeMusicLogo'), 'MusicServiceLogos exports YouTubeMusicLogo');
  assert(logosContent.includes('AppleMusicLogo'), 'MusicServiceLogos exports AppleMusicLogo');
  assert(logosContent.includes('SoundCloudLogo'), 'MusicServiceLogos exports SoundCloudLogo');
  assert(logosContent.includes('AmazonMusicLogo'), 'MusicServiceLogos exports AmazonMusicLogo');
  assert(logosContent.includes('DeezerLogo'), 'MusicServiceLogos exports DeezerLogo');
  assert(logosContent.includes('JioSaavnLogo'), 'MusicServiceLogos exports JioSaavnLogo');
  assert(logosContent.includes('renderMusicServiceLogo'), 'MusicServiceLogos exports renderMusicServiceLogo resolver');

  const cssContent = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components.css'), 'utf8');
  assert(cssContent.includes('.nexus-music-workspace'), 'components.css defines .nexus-music-workspace');
  assert(cssContent.includes('.music-header-banner'), 'components.css defines .music-header-banner');
  assert(cssContent.includes('.music-equalizer-bars'), 'components.css defines .music-equalizer-bars');
  assert(cssContent.includes('.music-active-strip'), 'components.css defines .music-active-strip');
  assert(cssContent.includes('.music-app-card'), 'components.css defines .music-app-card');

  // --------------------------------------------------------------------------
  // SUITE 5: IN-APP NAVIGATION & TAB DEDUPLICATION
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 5: IN-APP NAVIGATION & TAB DEDUPLICATION]');

  const tabManagerContent = fs.readFileSync(path.join(rootDir, 'src/main/tab-manager.ts'), 'utf8');
  assert(
    tabManagerContent.includes("url === 'nexus://music'"),
    "tab-manager.ts recognizes nexus://music in createTab"
  );
  assert(
    tabManagerContent.includes("formatted === 'nexus://music'"),
    "tab-manager.ts recognizes nexus://music in navigate"
  );

  const sidebarContent = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/Sidebar.tsx'), 'utf8');
  assert(
    sidebarContent.includes("onNavigate('nexus://music')"),
    "Sidebar.tsx provides 1-click button for nexus://music"
  );

  const cmdContent = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/CommandPalette.tsx'), 'utf8');
  assert(
    cmdContent.includes("id: 'music-open'"),
    "CommandPalette includes Open NEXUS Music command"
  );
  assert(
    cmdContent.includes("id: 'music-spotify'"),
    "CommandPalette includes Music: Spotify command"
  );
  assert(
    cmdContent.includes("id: 'music-youtube'"),
    "CommandPalette includes Music: YouTube Music command"
  );

  const appContent = fs.readFileSync(path.join(rootDir, 'src/renderer/src/App.tsx'), 'utf8');
  assert(
    appContent.includes("isMusicPage ="),
    "App.tsx defines isMusicPage router flag"
  );
  assert(
    appContent.includes("<MusicWorkspace"),
    "App.tsx renders MusicWorkspace component"
  );

  // Tab deduplication simulation
  const mockTabs = [
    { id: 'tab-1', url: 'https://nexus.local', title: 'New Tab' },
    { id: 'tab-2', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', title: 'Today\'s Top Hits' },
    { id: 'tab-3', url: 'nexus://music', title: 'NEXUS Music' },
  ];

  function findExistingServiceTab(serviceUrl: string, tabs: typeof mockTabs) {
    const sHost = new URL(serviceUrl).hostname.toLowerCase();
    return tabs.find((t) => {
      try {
        const tHost = new URL(t.url).hostname.toLowerCase();
        return tHost === sHost || tHost.endsWith(`.${sHost}`);
      } catch {
        return false;
      }
    });
  }

  const foundSpotify = findExistingServiceTab('https://open.spotify.com', mockTabs);
  assert(foundSpotify?.id === 'tab-2', 'Deduplication correctly found existing open Spotify tab (tab-2)');

  const foundYtMusic = findExistingServiceTab('https://music.youtube.com', mockTabs);
  assert(foundYtMusic === undefined, 'Deduplication correctly detected YouTube Music is not open');

  // Clean test artifacts
  fs.rmSync(testDir, { recursive: true, force: true });

  console.log('\n====================================================');
  console.log(`Music Hub QA Complete: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMusicTestSuite().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
