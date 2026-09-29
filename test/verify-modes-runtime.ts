import { app, BrowserWindow } from 'electron';
import * as path from 'path';

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

async function testRuntimeVisualIdentities() {
  console.log('====================================================');
  console.log('   NEXUS Modes Runtime Visual Verification Suite    ');
  console.log('====================================================\n');

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

  // 1. Test Default Mode Runtime Tokens
  console.log('[RUN-CHECK 1: DEFAULT MODE RUNTIME TOKENS]');
  const defaultTokens = await win.webContents.executeJavaScript(`
    (() => {
      document.documentElement.dataset.mode = 'default';
      const s = getComputedStyle(document.documentElement);
      return {
        mode: document.documentElement.dataset.mode,
        bgApp: s.getPropertyValue('--bg-app').trim().toUpperCase(),
        bgSurface: s.getPropertyValue('--bg-surface').trim().toUpperCase(),
        accent: s.getPropertyValue('--accent-primary').trim().toUpperCase(),
        accentContrast: s.getPropertyValue('--accent-contrast').trim().toUpperCase(),
      };
    })()
  `);
  assert(defaultTokens.mode === 'default', 'DOM dataset.mode is "default"');
  assert(defaultTokens.bgApp === '#0B0D12', `Default --bg-app is #0B0D12 (got ${defaultTokens.bgApp})`);
  assert(defaultTokens.bgSurface === '#12151D', `Default --bg-surface is #12151D (got ${defaultTokens.bgSurface})`);
  assert(defaultTokens.accent === '#A78BFA', `Default --accent-primary is #A78BFA (got ${defaultTokens.accent})`);
  assert(defaultTokens.accentContrast === '#0B0D12', `Default --accent-contrast is #0B0D12 (got ${defaultTokens.accentContrast})`);

  // 2. Test Balanced Mode Runtime Tokens (Super Saiyan Golden Mode)
  console.log('\n[RUN-CHECK 2: BALANCED / GOLDEN MODE RUNTIME TOKENS]');
  const balancedTokens = await win.webContents.executeJavaScript(`
    (() => {
      document.documentElement.dataset.mode = 'balanced';
      const s = getComputedStyle(document.documentElement);
      return {
        mode: document.documentElement.dataset.mode,
        bgApp: s.getPropertyValue('--bg-app').trim().toUpperCase(),
        bgSurface: s.getPropertyValue('--bg-surface').trim().toUpperCase(),
        bgElevated: s.getPropertyValue('--bg-elevated').trim().toUpperCase(),
        accentPrimary: s.getPropertyValue('--accent-primary').trim().toUpperCase(),
        accentSecondary: s.getPropertyValue('--accent-secondary').trim().toUpperCase(),
        textPrimary: s.getPropertyValue('--text-primary').trim().toUpperCase(),
        textSecondary: s.getPropertyValue('--text-secondary').trim().toUpperCase(),
        accentContrast: s.getPropertyValue('--accent-contrast').trim().toUpperCase(),
      };
    })()
  `);
  assert(balancedTokens.mode === 'balanced', 'DOM dataset.mode is "balanced"');
  assert(balancedTokens.bgApp === '#090909', `Balanced --bg-app is #090909 (got ${balancedTokens.bgApp})`);
  assert(balancedTokens.bgSurface === '#14120C', `Balanced --bg-surface is #14120C (got ${balancedTokens.bgSurface})`);
  assert(balancedTokens.bgElevated === '#211B0D', `Balanced --bg-elevated is #211B0D (got ${balancedTokens.bgElevated})`);
  assert(balancedTokens.accentPrimary === '#F5C542', `Balanced --accent-primary is #F5C542 (got ${balancedTokens.accentPrimary})`);
  assert(balancedTokens.accentSecondary === '#D4A72C', `Balanced --accent-secondary is #D4A72C (got ${balancedTokens.accentSecondary})`);
  assert(balancedTokens.textPrimary === '#FFF8E5', `Balanced --text-primary is #FFF8E5 (got ${balancedTokens.textPrimary})`);
  assert(balancedTokens.textSecondary === '#B6A77C', `Balanced --text-secondary is #B6A77C (got ${balancedTokens.textSecondary})`);
  assert(balancedTokens.accentContrast === '#0C0B08', `Balanced --accent-contrast is #0C0B08 (got ${balancedTokens.accentContrast})`);

  // 3. Test Performance Mode Runtime Tokens (Redline Mode)
  console.log('\n[RUN-CHECK 3: PERFORMANCE / REDLINE MODE RUNTIME TOKENS]');
  const perfTokens = await win.webContents.executeJavaScript(`
    (() => {
      document.documentElement.dataset.mode = 'performance';
      const s = getComputedStyle(document.documentElement);
      const testEl = document.createElement('div');
      document.body.appendChild(testEl);
      const elStyle = getComputedStyle(testEl);
      const transDur = elStyle.transitionDuration;
      testEl.remove();

      return {
        mode: document.documentElement.dataset.mode,
        bgApp: s.getPropertyValue('--bg-app').trim().toUpperCase(),
        bgSurface: s.getPropertyValue('--bg-surface').trim().toUpperCase(),
        bgElevated: s.getPropertyValue('--bg-elevated').trim().toUpperCase(),
        accentPrimary: s.getPropertyValue('--accent-primary').trim().toUpperCase(),
        accentSecondary: s.getPropertyValue('--accent-secondary').trim().toUpperCase(),
        textPrimary: s.getPropertyValue('--text-primary').trim().toUpperCase(),
        textSecondary: s.getPropertyValue('--text-secondary').trim().toUpperCase(),
        accentContrast: s.getPropertyValue('--accent-contrast').trim().toUpperCase(),
        transDur: transDur,
      };
    })()
  `);
  assert(perfTokens.mode === 'performance', 'DOM dataset.mode is "performance"');
  assert(perfTokens.bgApp === '#080809', `Performance --bg-app is #080809 (got ${perfTokens.bgApp})`);
  assert(perfTokens.bgSurface === '#121214', `Performance --bg-surface is #121214 (got ${perfTokens.bgSurface})`);
  assert(perfTokens.bgElevated === '#1C1719', `Performance --bg-elevated is #1C1719 (got ${perfTokens.bgElevated})`);
  assert(perfTokens.accentPrimary === '#F02D43', `Performance --accent-primary is #F02D43 (got ${perfTokens.accentPrimary})`);
  assert(perfTokens.accentSecondary === '#A9152A', `Performance --accent-secondary is #A9152A (got ${perfTokens.accentSecondary})`);
  assert(perfTokens.textPrimary === '#F5F5F5', `Performance --text-primary is #F5F5F5 (got ${perfTokens.textPrimary})`);
  assert(perfTokens.textSecondary === '#A6A6AD', `Performance --text-secondary is #A6A6AD (got ${perfTokens.textSecondary})`);
  assert(perfTokens.accentContrast === '#FFFFFF', `Performance --accent-contrast is #FFFFFF (got ${perfTokens.accentContrast})`);
  assert(perfTokens.transDur.includes('1e-05') || perfTokens.transDur.includes('0.00001') || perfTokens.transDur.includes('0.01ms') || perfTokens.transDur === '0s', `Performance transition duration is suppressed (got ${perfTokens.transDur})`);

  console.log('\n====================================================');
  console.log('  ALL RUNTIME VISUAL IDENTITY CHECKS PASSED!');
  console.log('====================================================\n');

  win.destroy();
  app.quit();
}

app.whenReady().then(testRuntimeVisualIdentities).catch((err) => {
  console.error('Runtime visual test failed:', err);
  app.exit(1);
});
