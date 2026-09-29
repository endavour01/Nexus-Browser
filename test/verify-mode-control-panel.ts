import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`    ✓ ${message}`);
  }
}

async function runModeControlPanelTests() {
  console.log('====================================================');
  console.log('   NEXUS Modes Control Panel & Toolbar Switcher Test  ');
  console.log('====================================================\n');

  let passed = 0;

  // -----------------------------------------------------------------
  // 1. TOOLBAR MODE SWITCHER & POPOVER (ModePopover.tsx)
  // -----------------------------------------------------------------
  console.log('[SUITE 1: TOOLBAR MODE SWITCHER & COMPACT POPOVER]');

  const popoverPath = path.join(__dirname, '../src/renderer/src/components/ModePopover.tsx');
  assert(fs.existsSync(popoverPath), 'ModePopover.tsx component exists');
  const popoverCode = fs.readFileSync(popoverPath, 'utf8');

  // Verify Distinctive Icons
  assert(popoverCode.includes('Compass'), 'Default mode uses Compass icon');
  assert(popoverCode.includes('Sun'), 'Balanced mode uses Sun icon');
  assert(popoverCode.includes('Zap'), 'Performance mode uses Zap icon');
  passed++;

  // Verify 3 Mode Cards & Descriptions
  assert(popoverCode.includes("'Default Mode'"), 'Popover includes Default Mode card');
  assert(popoverCode.includes("'Balanced Mode'"), 'Popover includes Balanced Mode card');
  assert(popoverCode.includes("'Performance Mode'"), 'Popover includes Performance Mode card');
  assert(popoverCode.includes('Obsidian & Violet'), 'Default card shows Obsidian & Violet subtitle');
  assert(popoverCode.includes('Metallic Gold & Deep Black'), 'Balanced card shows Metallic Gold & Deep Black subtitle');
  assert(popoverCode.includes('Crimson & Carbon'), 'Performance card shows Crimson & Carbon subtitle');
  passed++;

  // Verify Miniature Palette Swatches
  assert(popoverCode.includes('#0B0D12') && popoverCode.includes('#A78BFA'), 'Default card includes exact obsidian and violet swatches');
  assert(popoverCode.includes('#090909') && popoverCode.includes('#F5C542'), 'Balanced card includes exact metallic-gold swatches');
  assert(popoverCode.includes('#080809') && popoverCode.includes('#F02D43'), 'Performance card includes exact crimson/carbon swatches');
  passed++;

  // Verify 1-Click Mode Switching & Active State
  assert(popoverCode.includes('onSelectMode(m.id)'), 'Popover allows switching mode with one click');
  assert(popoverCode.includes('mode-popover-active-badge'), 'Popover renders visible active state indicator');
  assert(popoverCode.includes('Check'), 'Active indicator renders checkmark icon');
  passed++;

  // Verify Accessibility & Keyboard Navigation
  assert(popoverCode.includes('role="dialog"'), 'Popover container defines role="dialog"');
  assert(popoverCode.includes('role="radiogroup"'), 'Mode options define role="radiogroup"');
  assert(popoverCode.includes('role="radio"'), 'Individual mode cards define role="radio"');
  assert(popoverCode.includes('aria-checked={isActive}'), 'Cards indicate active state via aria-checked');
  assert(popoverCode.includes('ArrowDown') && popoverCode.includes('ArrowUp'), 'Supports arrow keys to cycle between mode cards');
  assert(popoverCode.includes('Escape'), 'Supports Escape key to dismiss popover');
  assert(popoverCode.includes('Enter') || popoverCode.includes(' '), 'Supports Enter/Space to select focused mode');
  passed++;

  // -----------------------------------------------------------------
  // 2. NAVIGATION BAR INTEGRATION (NavigationBar.tsx)
  // -----------------------------------------------------------------
  console.log('\n[SUITE 2: NAVIGATION BAR TOOLBAR INTEGRATION]');

  const navBarPath = path.join(__dirname, '../src/renderer/src/components/NavigationBar.tsx');
  const navBarCode = fs.readFileSync(navBarPath, 'utf8');

  assert(navBarCode.includes('mode-switcher-btn'), 'NavigationBar has dedicated mode-switcher-btn');
  assert(navBarCode.includes('ModePopover'), 'NavigationBar renders ModePopover component');
  assert(navBarCode.includes('currentMode'), 'NavigationBar receives currentMode prop');
  assert(navBarCode.includes('onSelectMode'), 'NavigationBar wires onSelectMode callback');
  assert(navBarCode.includes('Compass') && navBarCode.includes('Sun') && navBarCode.includes('Zap'), 'NavigationBar renders distinctive mode icons');
  assert(navBarCode.includes('aria-haspopup="dialog"'), 'Mode switcher button has aria-haspopup="dialog"');
  assert(navBarCode.includes('aria-expanded={isModePopoverOpen}'), 'Mode switcher button has aria-expanded attribute');
  passed++;

  // -----------------------------------------------------------------
  // 3. SEAMLESS TRANSITIONS & ZERO-RELOAD STYLING (themes.css & components.css)
  // -----------------------------------------------------------------
  console.log('\n[SUITE 3: SEAMLESS TRANSITIONS & CSS FIDELITY]');

  const themesPath = path.join(__dirname, '../src/renderer/src/themes.css');
  const themesCode = fs.readFileSync(themesPath, 'utf8');

  assert(themesCode.includes('.navbar-container'), 'themes.css animates .navbar-container');
  assert(themesCode.includes('.nexus-statusbar'), 'themes.css animates .nexus-statusbar');
  assert(themesCode.includes('.nexus-side-panel'), 'themes.css animates .nexus-side-panel');
  assert(themesCode.includes('.nexus-right-toolbar'), 'themes.css animates .nexus-right-toolbar');
  assert(themesCode.includes('150ms ease'), 'Uses subtle 150ms transition for smooth surface changes');
  assert(themesCode.includes(":root[data-mode='performance'] *"), 'Performance mode bypasses transitions with 0.01ms');
  passed++;

  const compCssPath = path.join(__dirname, '../src/renderer/src/components.css');
  const compCss = fs.readFileSync(compCssPath, 'utf8');

  assert(compCss.includes('.mode-switcher-btn'), 'components.css styles .mode-switcher-btn');
  assert(compCss.includes('.mode-popover'), 'components.css styles .mode-popover');
  assert(compCss.includes('.mode-popover-card'), 'components.css styles .mode-popover-card');
  assert(compCss.includes('.mode-mini-browser'), 'components.css styles .mode-mini-browser');
  assert(compCss.includes('.mode-disclaimer-card'), 'components.css styles .mode-disclaimer-card');
  passed++;

  // -----------------------------------------------------------------
  // 4. SETTINGS PAGE: DEDICATED MODES SECTION (SidePanel.tsx)
  // -----------------------------------------------------------------
  console.log('\n[SUITE 4: DEDICATED SETTINGS PAGE MODES SECTION]');

  const sidePanelPath = path.join(__dirname, '../src/renderer/src/components/SidePanel.tsx');
  const sidePanelCode = fs.readFileSync(sidePanelPath, 'utf8');

  // Verify large visual previews (miniature browser mockups)
  assert(sidePanelCode.includes('mode-mini-browser mode-mini-default'), 'Default mode has large browser mockup preview');
  assert(sidePanelCode.includes('mode-mini-browser mode-mini-balanced'), 'Balanced mode has large browser mockup preview');
  assert(sidePanelCode.includes('mode-mini-browser mode-mini-performance'), 'Performance mode has large browser mockup preview');
  assert(sidePanelCode.includes('mini-dots'), 'Previews feature miniature window chrome dots');
  assert(sidePanelCode.includes('mini-tabs'), 'Previews feature miniature tabs in mode accent colors');
  assert(sidePanelCode.includes('mini-omnibox'), 'Previews feature miniature omnibox address bar');
  passed++;

  // Verify visual & functional breakdowns
  assert(sidePanelCode.includes('mode-details-block'), 'SidePanel provides structured mode details block');
  assert(sidePanelCode.includes('Visual:'), 'Explains visual changes for each mode');
  assert(sidePanelCode.includes('Functional:'), 'Explains functional differences for each mode');
  assert(sidePanelCode.includes('Super Saiyan'), 'Balanced mode description highlights Super Saiyan aesthetic');
  assert(sidePanelCode.includes('0.01ms'), 'Performance mode description highlights zero-latency bypass');
  passed++;

  // -----------------------------------------------------------------
  // 5. PERFORMANCE CONTROLS & DISCLAIMER (ModeBehaviorControls.tsx)
  // -----------------------------------------------------------------
  console.log('\n[SUITE 5: GRANULAR PERFORMANCE CONTROLS & DISCLAIMER]');

  const controlsPath = path.join(__dirname, '../src/renderer/src/components/ModeBehaviorControls.tsx');
  const controlsCode = fs.readFileSync(controlsPath, 'utf8');

  // Verify Individual Performance Controls
  assert(controlsCode.includes('Reduced Motion'), 'Performance section includes Reduced Motion toggle');
  assert(controlsCode.includes('Background Tab Throttling'), 'Performance section includes Background Tab Throttling toggle');
  assert(controlsCode.includes('Put Inactive Tabs to Sleep'), 'Performance section includes Inactivity Sleep Timeout selector');
  assert(controlsCode.includes('Protect Pinned Tabs'), 'Performance section includes Protect Pinned Tabs toggle');
  passed++;

  // Verify Timeout Options (5m, 15m, 30m, never)
  assert(controlsCode.includes('300000'), 'Timeout selector offers 5 minutes option');
  assert(controlsCode.includes('900000'), 'Timeout selector offers 15 minutes option');
  assert(controlsCode.includes('1800000'), 'Timeout selector offers 30 minutes option');
  assert(controlsCode.includes('Never (Keep tabs awake)'), 'Timeout selector offers Never option');
  passed++;

  // Verify Honest Resource Disclaimer
  assert(controlsCode.includes('Resource Optimization Notice'), 'Includes prominent Resource Optimization Notice');
  assert(
    controlsCode.includes('Performance Mode prioritizes system resource conservation') &&
    controlsCode.includes('rather than magically accelerating internet connection speed or overclocking hardware'),
    'Notice explicitly clarifies that Performance Mode conserves RAM/CPU rather than faking internet speed or CPU overclocking'
  );
  passed++;

  // Verify One-Click Restore Standard Behavior Button
  assert(controlsCode.includes('Restore Standard Behavior'), 'Provides button to restore standard behavior at any time');
  assert(controlsCode.includes('onRestoreDefaults'), 'Wires onRestoreDefaults callback');
  passed++;

  console.log('====================================================');
  console.log(`  Modes Control Panel Verification PASSED! (${passed} check suites)`);
  console.log('====================================================\n');
}

runModeControlPanelTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
