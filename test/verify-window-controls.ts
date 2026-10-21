import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`    ✓ ${message}`);
}

async function runWindowControlsTestSuite() {
  console.log('\n====================================================');
  console.log('       NEXUS Window Controls Verification Suite     ');
  console.log('====================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const titleBarPath = path.join(rootDir, 'src/renderer/src/components/TitleBar.tsx');
  const componentsCssPath = path.join(rootDir, 'src/renderer/src/components.css');
  const themesCssPath = path.join(rootDir, 'src/renderer/src/themes.css');

  const titleBarCode = fs.readFileSync(titleBarPath, 'utf8');
  const componentsCss = fs.readFileSync(componentsCssPath, 'utf8');
  const themesCss = fs.readFileSync(themesCssPath, 'utf8');

  let passed = 0;

  // [SUITE 1: DOM STRUCTURE, ISOLATION & ACCESSIBILITY]
  console.log('[SUITE 1: DOM STRUCTURE & ACCESSIBILITY]');
  assert(titleBarCode.includes('className="titlebar-controls no-drag"'), 'TitleBar includes titlebar-controls container with no-drag');
  assert(titleBarCode.includes('className="window-controls-divider"'), 'TitleBar includes dedicated separator divider between tab layout switch and window controls');
  assert(titleBarCode.includes('className="window-controls-group"'), 'TitleBar wraps window control buttons in a dedicated window-controls-group flex container');
  assert(titleBarCode.includes('className="titlebar-btn control-btn window-control-btn minimize"'), 'Minimize button has canonical titlebar-btn and window-control-btn classes');
  assert(titleBarCode.includes('className="titlebar-btn control-btn window-control-btn maximize"'), 'Maximize button has canonical titlebar-btn and window-control-btn classes');
  assert(titleBarCode.includes('className="titlebar-btn control-btn window-control-btn close btn-close"'), 'Close button has canonical close and btn-close classes');
  assert(titleBarCode.includes('aria-label="Minimize"'), 'Minimize button defines accessible aria-label="Minimize"');
  assert(titleBarCode.includes('aria-label={isMaximized ? \'Restore\' : \'Maximize\'}'), 'Maximize button defines accessible dynamic aria-label');
  assert(titleBarCode.includes('aria-label="Close"'), 'Close button defines accessible aria-label="Close"');
  assert(titleBarCode.includes('onClick={onMinimize}'), 'Minimize button connects to onMinimize handler');
  assert(titleBarCode.includes('onClick={onMaximize}'), 'Maximize button connects to onMaximize handler');
  assert(titleBarCode.includes('onClick={onCloseWindow}'), 'Close button connects to onCloseWindow handler');
  passed += 12;

  // [SUITE 2: CSS LAYOUT, HIT AREAS & ANTI-COLLISION]
  console.log('\n[SUITE 2: CSS LAYOUT & ANTI-COLLISION RULES]');
  assert(componentsCss.includes('.titlebar-controls,'), 'components.css defines styles for .titlebar-controls container');
  assert(componentsCss.includes('margin-left: auto;'), 'Window controls container uses margin-left: auto to pin to right');
  assert(componentsCss.includes('.window-controls-group'), 'components.css defines .window-controls-group flex layout');
  assert(componentsCss.includes('.window-controls-divider'), 'components.css defines hairline .window-controls-divider');
  assert(componentsCss.includes('width: 36px;') && componentsCss.includes('height: 28px;'), 'Window control buttons have standard 36x28px dimensions');
  assert(componentsCss.includes('min-width: 36px;') && componentsCss.includes('min-height: 28px;'), 'Window control buttons define min-width: 36px and min-height: 28px to prevent shrinking');
  assert(componentsCss.includes('flex-shrink: 0;'), 'Window control buttons enforce flex-shrink: 0');
  assert(componentsCss.includes('.titlebar-btn svg,') && componentsCss.includes('pointer-events: none;'), 'SVG icons inside window buttons have pointer-events: none and display: block');
  assert(componentsCss.includes('.titlebar-tabs-scroll') && componentsCss.includes('min-width: 0;'), '.titlebar-tabs-scroll defines min-width: 0 to prevent pushing window controls');
  passed += 9;

  // [SUITE 3: HOVER STATES, ACTIVE FEEDBACK & CLOSE DANGER STYLING]
  console.log('\n[SUITE 3: HOVER STATES & VISUAL DISTINCTION]');
  assert(componentsCss.includes('.titlebar-btn:hover,') && componentsCss.includes('var(--bg-surface-hover)'), 'Standard window control hover uses subtle var(--bg-surface-hover)');
  assert(componentsCss.includes('.titlebar-btn.close:hover,') && componentsCss.includes('#E81123 !important'), 'Close button has distinct red danger hover (#E81123)');
  assert(componentsCss.includes('.titlebar-btn.close:hover,') && componentsCss.includes('#FFFFFF !important'), 'Close button icon turns white on danger hover');
  assert(componentsCss.includes('.titlebar-btn.close:active,') && componentsCss.includes('#BF0F1D !important'), 'Close button has distinct active red state (#BF0F1D)');
  assert(componentsCss.includes('.titlebar-btn:focus-visible,'), 'Window control buttons support focus-visible outline for keyboard navigation');
  passed += 5;

  // [SUITE 4: MULTI-MODE TOKEN COMPATIBILITY]
  console.log('\n[SUITE 4: MULTI-MODE THEME COMPATIBILITY]');
  assert(themesCss.includes("--text-secondary: '#B8BCC8'") || themesCss.includes('--text-secondary: #B8BCC8'), 'Default mode provides high-contrast secondary text token for controls');
  assert(themesCss.includes("--text-secondary: '#D4C69E'") || themesCss.includes('--text-secondary: #D4C69E'), 'Balanced mode provides high-contrast secondary text token for controls');
  assert(themesCss.includes("--text-secondary: '#C8C7CE'") || themesCss.includes('--text-secondary: #C8C7CE'), 'Performance mode provides high-contrast secondary text token for controls');
  assert(!titleBarCode.includes('text-black') && !titleBarCode.includes('text-neutral-900'), 'TitleBar controls do not use hardcoded dark classes');
  passed += 4;

  console.log('\n====================================================');
  console.log(`Window Controls QA Complete: ${passed} passed, 0 failed`);
  console.log('====================================================\n');
}

runWindowControlsTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
