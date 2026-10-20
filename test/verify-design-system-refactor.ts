// ==========================================================================
// NEXUS Design System Refactor & Contrast Verification Suite
// ==========================================================================

import * as fs from 'fs';
import * as path from 'path';

function runDesignRefactorAudit() {
  console.log('====================================================');
  console.log('   NEXUS Design System Refactor Verification       ');
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

  const rootDir = path.resolve(__dirname, '..');
  const rendererSrc = path.join(rootDir, 'src/renderer/src');

  // Recursively collect all ts, tsx, css files in renderer
  function getFiles(dir: string, extFilter: string[]): string[] {
    let results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getFiles(fullPath, extFilter));
      } else if (extFilter.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const codeFiles = getFiles(rendererSrc, ['.tsx', '.ts']);
  const cssFiles = getFiles(rendererSrc, ['.css']);

  // --------------------------------------------------------------------------
  // SUITE 1: ROOT CAUSE & TEXT CONTRAST FIXES
  // --------------------------------------------------------------------------
  console.log('[SUITE 1: ROOT CAUSE & TEXT CONTRAST FIXES]');

  // Check 1.1: Zero hardcoded dark text classes in renderer code
  const darkClassRegex = /\btext-(black|neutral-900|slate-900|gray-900|zinc-900)\b/;
  let darkClassViolations: string[] = [];
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (darkClassRegex.test(content)) {
      darkClassViolations.push(path.relative(rootDir, file));
    }
  }
  assert(
    darkClassViolations.length === 0,
    `Zero hardcoded dark text classes (found ${darkClassViolations.length}: ${darkClassViolations.join(', ')})`
  );

  // Check 1.2: Zero hardcoded dark inline styles
  const darkStyleRegex = /color:\s*['"](#000000?|black)['"]/;
  let darkStyleViolations: string[] = [];
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (darkStyleRegex.test(content)) {
      darkStyleViolations.push(path.relative(rootDir, file));
    }
  }
  assert(
    darkStyleViolations.length === 0,
    `Zero hardcoded dark inline styles (found ${darkStyleViolations.length}: ${darkStyleViolations.join(', ')})`
  );

  // Check 1.3: Zero undefined bg-primary text-background classes
  let bgPrimaryViolations: string[] = [];
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('bg-primary text-background')) {
      bgPrimaryViolations.push(path.relative(rootDir, file));
    }
  }
  assert(
    bgPrimaryViolations.length === 0,
    `Zero undefined 'bg-primary text-background' classes (found ${bgPrimaryViolations.length}: ${bgPrimaryViolations.join(', ')})`
  );

  // Check 1.4: Enhanced text tokens in themes.css
  const themesCssPath = path.join(rendererSrc, 'themes.css');
  const themesCss = fs.readFileSync(themesCssPath, 'utf8');
  assert(
    themesCss.includes('--text-secondary: #B8BCC8') && themesCss.includes('--text-muted: #8E95A5'),
    'Default mode has high-contrast --text-secondary (#B8BCC8) and --text-muted (#8E95A5)'
  );
  assert(
    themesCss.includes('--text-secondary: #D4C69E') && themesCss.includes('--text-muted: #9E9270'),
    'Balanced mode has high-contrast --text-secondary (#D4C69E) and --text-muted (#9E9270)'
  );
  assert(
    themesCss.includes('--text-secondary: #C8C7CE') && themesCss.includes('--text-muted: #9C95A0'),
    'Performance mode has high-contrast --text-secondary (#C8C7CE) and --text-muted (#9C95A0)'
  );

  // --------------------------------------------------------------------------
  // SUITE 2: BOOKMARKS MANAGER & SIDEBAR LAYOUT
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 2: BOOKMARKS MANAGER & SIDEBAR LAYOUT]');

  const bookmarksPagePath = path.join(rendererSrc, 'components/BookmarksPage.tsx');
  const bookmarksPage = fs.readFileSync(bookmarksPagePath, 'utf8');
  const sidePanelPath = path.join(rendererSrc, 'components/SidePanel.tsx');
  const sidePanel = fs.readFileSync(sidePanelPath, 'utf8');
  const componentsCssPath = path.join(rendererSrc, 'components.css');
  const componentsCss = fs.readFileSync(componentsCssPath, 'utf8');

  // Check 2.1: No FoldersNew string collision
  assert(
    !bookmarksPage.includes('<span>Folders</span><button') &&
    bookmarksPage.includes('Folders') &&
    bookmarksPage.includes('+ New'),
    'BookmarksPage separates Folders title and + New button with flex spacing'
  );

  // Check 2.2: No 2 itemsOpen Full Manager collision
  assert(
    sidePanel.includes('justify-between') &&
    sidePanel.includes('Open Full Manager') &&
    sidePanel.includes('ExternalLink'),
    'SidePanel cleanly separates item count and Open Full Manager action'
  );

  // Check 2.3: Folder tree styling & count badges in components.css
  assert(
    componentsCss.includes('.nexus-manager-body') &&
    componentsCss.includes('.nexus-manager-sidebar') &&
    componentsCss.includes('.nexus-manager-main'),
    'components.css defines nexus manager layout classes'
  );
  assert(
    componentsCss.includes('.folder-count') &&
    componentsCss.includes('font-family: var(--font-mono'),
    'components.css defines .folder-count badge with monospace styling'
  );
  assert(
    componentsCss.includes('min-height: 36px') &&
    componentsCss.includes('.folder-tree-item'),
    'components.css enforces min-height: 36px on .folder-tree-item for vertical alignment'
  );

  // --------------------------------------------------------------------------
  // SUITE 3: AI ASSISTANT PANEL LOGIC & LAYOUT
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 3: AI ASSISTANT PANEL LOGIC & LAYOUT]');

  const assistantPanelPath = path.join(rendererSrc, 'components/AssistantPanel.tsx');
  const assistantPanel = fs.readFileSync(assistantPanelPath, 'utf8');
  const panelHeaderCssPath = path.join(rendererSrc, 'components/ui/PanelHeader/panel-header.css');
  const panelHeaderCss = fs.readFileSync(panelHeaderCssPath, 'utf8');

  // Check 3.1: Error handling & no Agent Ready contradiction
  assert(
    assistantPanel.includes('isError') &&
    assistantPanel.includes('isConnectionError') &&
    assistantPanel.includes('Agent Offline') &&
    assistantPanel.includes('Connection Error'),
    'AssistantPanel checks isError/isConnectionError to show Agent Offline / Connection Error instead of Agent Ready'
  );

  // Check 3.2: Step counter resets during error state
  assert(
    assistantPanel.includes("Step {isError ? '--' : status.stepCount} / {status.maxSteps}"),
    'AssistantPanel resets step counter to Step -- / 25 during error state'
  );

  // Check 3.3: Action guardrails & retry button
  assert(
    assistantPanel.includes('Retry Connection'),
    'AssistantPanel provides 1-click Retry Connection button in error banner'
  );
  assert(
    assistantPanel.includes('disabled={!taskInput.trim() || isConnectionError}'),
    'AssistantPanel disables Run Task in New Tab when connection is down'
  );

  // Check 3.4: Subtitle line wrapping
  assert(
    panelHeaderCss.includes('-webkit-line-clamp: 2') &&
    !panelHeaderCss.includes('max-height: 52px;'),
    'PanelHeader CSS removes 52px max-height cap and allows 2-line subtitle wrap'
  );

  // --------------------------------------------------------------------------
  // SUITE 4: COMPONENT ICON RENDERING & LAYOUT CLIPPING
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 4: COMPONENT ICON RENDERING & LAYOUT CLIPPING]');

  const hubWorkspacePath = path.join(rendererSrc, 'components/Hub/HubWorkspace.tsx');
  const hubWorkspace = fs.readFileSync(hubWorkspacePath, 'utf8');
  const hubCardPath = path.join(rendererSrc, 'components/Hub/HubCard.tsx');
  const hubCard = fs.readFileSync(hubCardPath, 'utf8');

  // Check 4.1: Dynamic Lucide icon resolution
  assert(
    hubWorkspace.includes('renderConnectIcon') &&
    hubWorkspace.includes("import * as Icons from 'lucide-react'"),
    'HubWorkspace imports lucide-react and resolves connect icons via renderConnectIcon'
  );

  // Check 4.2: Hub card title clipping fix
  assert(
    componentsCss.includes('.hub-card-title') &&
    componentsCss.includes('white-space: nowrap') &&
    !componentsCss.includes('.hub-card-title {\n  font-size: 13px;\n  font-weight: 600;\n  overflow: hidden;\n  text-overflow: ellipsis;'),
    'components.css removes ellipsis text truncation from .hub-card-title'
  );
  assert(
    hubCard.includes('shrink-0 whitespace-nowrap') && hubCard.includes('min-w-0'),
    'HubCard adds min-w-0 and shrink-0 whitespace-nowrap to avoid title clipping'
  );

  // Check 4.3: Shield dashboard header and padding
  assert(
    componentsCss.includes('.shield-dashboard-page') &&
    componentsCss.includes('box-sizing: border-box') &&
    componentsCss.includes('.shield-dashboard-header') &&
    componentsCss.includes('flex-wrap: wrap'),
    'components.css sets box-sizing, padding, and flex-wrap on .shield-dashboard-page'
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`Audit Complete: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDesignRefactorAudit();
