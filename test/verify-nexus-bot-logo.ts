import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {
  NEXUS_BOT_IMAGES,
  NEXUS_MODE_LABELS,
  NEXUS_MODE_ACCENTS,
  getNexusBotImage,
  getNexusModeLabel,
  getNexusModeAccent,
} from '../src/renderer/src/assets/nexusBotAssets';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`    ✓ ${message}`);
  }
}

async function runVerification() {
  console.log('====================================================');
  console.log(' NEXUS Mode-Aware Bot Logo & Profile Verification   ');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: Asset Files Existence & Integrity
  // ----------------------------------------------------
  console.log('[SUITE 1: ASSET FILES EXISTENCE & INTEGRITY]');
  const assetsDir = path.join(__dirname, '../src/renderer/src/assets');
  const violetPath = path.join(assetsDir, 'icon3_obsidian_violet_1024.png');
  const amberPath = path.join(assetsDir, 'icon3_black_amber_gold_1024.png');
  const crimsonPath = path.join(assetsDir, 'icon3_black_crimson_red_1024.png');

  assert(fs.existsSync(violetPath), 'Default violet bot image exists in assets directory');
  assert(fs.existsSync(amberPath), 'Balanced amber/gold bot image exists in assets directory');
  assert(fs.existsSync(crimsonPath), 'Performance crimson-red bot image exists in assets directory');

  const violetStat = fs.statSync(violetPath);
  const amberStat = fs.statSync(amberPath);
  const crimsonStat = fs.statSync(crimsonPath);

  assert(violetStat.size > 500000, `Violet bot image has valid size (${Math.round(violetStat.size / 1024)} KB)`);
  assert(amberStat.size > 500000, `Amber bot image has valid size (${Math.round(amberStat.size / 1024)} KB)`);
  assert(crimsonStat.size > 500000, `Crimson bot image has valid size (${Math.round(crimsonStat.size / 1024)} KB)`);

  // Verify PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const checkPngHeader = (filePath: string, name: string) => {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    assert(isPng, `${name} has valid PNG signature`);
  };

  checkPngHeader(violetPath, 'icon3_obsidian_violet_1024.png');
  checkPngHeader(amberPath, 'icon3_black_amber_gold_1024.png');
  checkPngHeader(crimsonPath, 'icon3_black_crimson_red_1024.png');

  // ----------------------------------------------------
  // SUITE 2: Mode-to-Image Mapping & Accessor Logic
  // ----------------------------------------------------
  console.log('\n[SUITE 2: MODE-TO-IMAGE MAPPING & ACCESSORS]');
  assert(
    getNexusBotImage('default').includes('icon3_obsidian_violet_1024'),
    'Default mode maps to icon3_obsidian_violet_1024'
  );
  assert(
    getNexusBotImage('balanced').includes('icon3_black_amber_gold_1024'),
    'Balanced mode maps to icon3_black_amber_gold_1024'
  );
  assert(
    getNexusBotImage('performance').includes('icon3_black_crimson_red_1024'),
    'Performance mode maps to icon3_black_crimson_red_1024'
  );

  // Fallback testing
  assert(
    getNexusBotImage(undefined as any).includes('icon3_obsidian_violet_1024'),
    'Undefined mode safely falls back to default violet image'
  );
  assert(
    getNexusBotImage('' as any).includes('icon3_obsidian_violet_1024'),
    'Empty mode safely falls back to default violet image'
  );
  assert(
    getNexusBotImage('unknown-mode' as any).includes('icon3_obsidian_violet_1024'),
    'Invalid mode safely falls back to default violet image'
  );

  // Label testing
  assert(getNexusModeLabel('default') === 'DEFAULT · EVERYDAY', 'Default label is DEFAULT · EVERYDAY');
  assert(getNexusModeLabel('balanced') === 'BALANCED · PRODUCTIVITY', 'Balanced label is BALANCED · PRODUCTIVITY');
  assert(getNexusModeLabel('performance') === 'PERFORMANCE · SPEED', 'Performance label is PERFORMANCE · SPEED');
  assert(getNexusModeLabel('unknown' as any) === 'DEFAULT · EVERYDAY', 'Invalid mode falls back to default label');

  // Accent testing
  assert(getNexusModeAccent('default') === '#A78BFA', 'Default accent is #A78BFA (Violet)');
  assert(getNexusModeAccent('balanced') === '#F5C542', 'Balanced accent is #F5C542 (Amber Gold)');
  assert(getNexusModeAccent('performance') === '#F02D43', 'Performance accent is #F02D43 (Crimson Red)');

  // ----------------------------------------------------
  // SUITE 3: Production Bundle & WebContents Verification
  // ----------------------------------------------------
  console.log('\n[SUITE 3: PRODUCTION BUNDLE & WEB ELEMENTS]');
  const distAssetsDir = path.join(__dirname, '../dist/renderer/assets');
  assert(fs.existsSync(distAssetsDir), 'dist/renderer/assets directory exists');

  const distFiles = fs.readdirSync(distAssetsDir);
  const bundledViolet = distFiles.find((f) => f.startsWith('icon3_obsidian_violet_1024') && f.endsWith('.png'));
  const bundledAmber = distFiles.find((f) => f.startsWith('icon3_black_amber_gold_1024') && f.endsWith('.png'));
  const bundledCrimson = distFiles.find((f) => f.startsWith('icon3_black_crimson_red_1024') && f.endsWith('.png'));

  assert(Boolean(bundledViolet), `Bundled violet asset exists in dist: ${bundledViolet}`);
  assert(Boolean(bundledAmber), `Bundled amber asset exists in dist: ${bundledAmber}`);
  assert(Boolean(bundledCrimson), `Bundled crimson asset exists in dist: ${bundledCrimson}`);

  // Headless window inspection
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: false,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const htmlPath = path.join(__dirname, '../dist/renderer/index.html');
  await win.loadFile(htmlPath);

  // Verify DOM styling and CSS rules for NEXUS Bot components
  const cssCheck = await win.webContents.executeJavaScript(`
    (() => {
      const card = document.createElement('div');
      card.className = 'nexus-bot-profile-card nexus-bot-profile-default';
      document.body.appendChild(card);
      const s = getComputedStyle(card);
      const res = {
        display: s.display,
        borderLeftColor: s.borderLeftColor,
      };
      document.body.removeChild(card);
      return res;
    })()
  `);

  assert(cssCheck.borderLeftColor === 'rgb(167, 139, 250)', 'Default bot profile card has violet border-left');

  const balancedCssCheck = await win.webContents.executeJavaScript(`
    (() => {
      const card = document.createElement('div');
      card.className = 'nexus-bot-profile-card nexus-bot-profile-balanced';
      document.body.appendChild(card);
      const s = getComputedStyle(card);
      const res = {
        borderLeftColor: s.borderLeftColor,
      };
      document.body.removeChild(card);
      return res;
    })()
  `);
  assert(balancedCssCheck.borderLeftColor === 'rgb(245, 197, 66)', 'Balanced bot profile card has amber border-left');

  const perfCssCheck = await win.webContents.executeJavaScript(`
    (() => {
      const card = document.createElement('div');
      card.className = 'nexus-bot-profile-card nexus-bot-profile-performance';
      document.body.appendChild(card);
      const s = getComputedStyle(card);
      const res = {
        borderLeftColor: s.borderLeftColor,
      };
      document.body.removeChild(card);
      return res;
    })()
  `);
  assert(perfCssCheck.borderLeftColor === 'rgb(240, 45, 67)', 'Performance bot profile card has crimson border-left');

  win.close();

  console.log('\n====================================================');
  console.log('  🎉 ALL MODE-AWARE BOT LOGO CHECKS PASSED!         ');
  console.log('====================================================\n');
}

app.whenReady().then(async () => {
  try {
    await runVerification();
    app.exit(0);
  } catch (err) {
    console.error('Test suite failed:', err);
    app.exit(1);
  }
});
