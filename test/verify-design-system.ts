// ==========================================================================
// NEXUS Design System Foundation Verification Suite
// ==========================================================================

import * as fs from 'fs';
import * as path from 'path';

function runDesignSystemAudit() {
  console.log('====================================================');
  console.log('   NEXUS Design System Foundation Verification      ');
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

  // 1. Verify CSS Files and Token Architecture
  console.log('[SUITE 1: CANONICAL DESIGN TOKENS ARCHITECTURE]');
  const themesCssPath = path.resolve(__dirname, '../src/renderer/src/themes.css');
  const indexCssPath = path.resolve(__dirname, '../src/renderer/src/index.css');

  assert(fs.existsSync(themesCssPath), 'themes.css exists');
  assert(fs.existsSync(indexCssPath), 'index.css exists');

  const themesCss = fs.readFileSync(themesCssPath, 'utf8');
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');

  // Verify Default Tokens
  assert(themesCss.includes('--nexus-bg-canvas: var(--bg-app)'), 'Default mode maps --nexus-bg-canvas');
  assert(themesCss.includes('--nexus-bg-surface: var(--bg-surface)'), 'Default mode maps --nexus-bg-surface');
  assert(themesCss.includes('--nexus-accent-primary: var(--accent-primary)'), 'Default mode maps --nexus-accent-primary');
  assert(themesCss.includes('--nexus-border-subtle: var(--border-subtle)'), 'Default mode maps --nexus-border-subtle');
  assert(themesCss.includes('--nexus-text-primary: var(--text-primary)'), 'Default mode maps --nexus-text-primary');

  // Verify Balanced Mode Tokens & Gold Identity
  const balancedIndex = themesCss.indexOf(":root[data-mode='balanced']");
  assert(balancedIndex !== -1, 'Balanced mode block exists in themes.css');
  const balancedSection = themesCss.slice(balancedIndex, balancedIndex + 2500);
  assert(balancedSection.includes('--accent-primary: #F5C542'), 'Balanced mode uses Metallic Gold accent (#F5C542)');
  assert(balancedSection.includes('--nexus-bg-canvas: var(--bg-app)'), 'Balanced mode maps --nexus-bg-canvas');
  assert(balancedSection.includes('--nexus-accent-primary: var(--accent-primary)'), 'Balanced mode maps --nexus-accent-primary');

  // Verify Performance Mode Tokens & Crimson Identity
  const perfIndex = themesCss.indexOf(":root[data-mode='performance']");
  assert(perfIndex !== -1, 'Performance mode block exists in themes.css');
  const perfSection = themesCss.slice(perfIndex, perfIndex + 2500);
  assert(perfSection.includes('--accent-primary: #F02D43'), 'Performance mode uses Redline Crimson accent (#F02D43)');
  assert(perfSection.includes('--nexus-bg-canvas: var(--bg-app)'), 'Performance mode maps --nexus-bg-canvas');
  assert(perfSection.includes('--nexus-accent-primary: var(--accent-primary)'), 'Performance mode maps --nexus-accent-primary');

  // Verify Universal Scale Tokens in index.css
  console.log('\n[SUITE 2: UNIVERSAL SCALE TOKENS & RESETS]');
  assert(indexCss.includes('--nexus-space-xs: 4px'), 'index.css defines --nexus-space-xs');
  assert(indexCss.includes('--nexus-space-sm: 8px'), 'index.css defines --nexus-space-sm');
  assert(indexCss.includes('--nexus-space-md: 12px'), 'index.css defines --nexus-space-md');
  assert(indexCss.includes('--nexus-space-lg: 16px'), 'index.css defines --nexus-space-lg');
  assert(indexCss.includes('--nexus-space-xl: 24px'), 'index.css defines --nexus-space-xl');
  assert(indexCss.includes('--nexus-space-2xl: 32px'), 'index.css defines --nexus-space-2xl');

  assert(indexCss.includes('--nexus-font-display: 20px'), 'index.css defines --nexus-font-display');
  assert(indexCss.includes('--nexus-font-page-title: 16px'), 'index.css defines --nexus-font-page-title');
  assert(indexCss.includes('--nexus-font-section-title: 14px'), 'index.css defines --nexus-font-section-title');
  assert(indexCss.includes('--nexus-font-card-title: 13px'), 'index.css defines --nexus-font-card-title');
  assert(indexCss.includes('--nexus-font-body: 13px'), 'index.css defines --nexus-font-body');
  assert(indexCss.includes('--nexus-font-secondary: 12px'), 'index.css defines --nexus-font-secondary');
  assert(indexCss.includes('--nexus-font-metadata: 11px'), 'index.css defines --nexus-font-metadata');
  assert(indexCss.includes('--nexus-font-micro: 10px'), 'index.css defines --nexus-font-micro');

  // Verify Resets
  assert(indexCss.includes('-webkit-appearance: none') && indexCss.includes('button {'), 'Universal button reset removes native appearance');
  assert(indexCss.includes('button:focus-visible {'), 'Universal button reset includes focus-visible');
  assert(indexCss.includes('select option {'), 'Universal select reset colors options dark');

  // 3. Verify Reusable UI Primitives
  console.log('\n[SUITE 3: REUSABLE UI PRIMITIVES EXISTENCE]');
  const uiDir = path.resolve(__dirname, '../src/renderer/src/components/ui');
  assert(fs.existsSync(uiDir), 'src/renderer/src/components/ui directory exists');

  const requiredComponents = [
    'Button/Button.tsx',
    'Button/button.css',
    'IconButton/IconButton.tsx',
    'IconButton/icon-button.css',
    'Card/Card.tsx',
    'Card/card.css',
    'Input/Input.tsx',
    'Input/input.css',
    'SearchInput/SearchInput.tsx',
    'SearchInput/search-input.css',
    'Select/Select.tsx',
    'Select/select.css',
    'Badge/Badge.tsx',
    'Badge/badge.css',
    'PanelHeader/PanelHeader.tsx',
    'PanelHeader/panel-header.css',
    'Modal/Modal.tsx',
    'Modal/modal.css',
    'Tabs/Tabs.tsx',
    'Tabs/tabs.css',
    'index.ts',
    'README.md',
  ];

  for (const comp of requiredComponents) {
    const fullPath = path.join(uiDir, comp);
    assert(fs.existsSync(fullPath), `UI primitive component file exists: ${comp}`);
  }

  // 4. Verify Component Contracts & Architecture
  console.log('\n[SUITE 4: COMPONENT CONTRACTS & BARREL EXPORTS]');
  const barrelContent = fs.readFileSync(path.join(uiDir, 'index.ts'), 'utf8');
  assert(barrelContent.includes("export * from './Button/Button'"), 'index.ts exports Button');
  assert(barrelContent.includes("export * from './IconButton/IconButton'"), 'index.ts exports IconButton');
  assert(barrelContent.includes("export * from './Card/Card'"), 'index.ts exports Card');
  assert(barrelContent.includes("export * from './Input/Input'"), 'index.ts exports Input');
  assert(barrelContent.includes("export * from './SearchInput/SearchInput'"), 'index.ts exports SearchInput');
  assert(barrelContent.includes("export * from './Select/Select'"), 'index.ts exports Select');
  assert(barrelContent.includes("export * from './Badge/Badge'"), 'index.ts exports Badge');
  assert(barrelContent.includes("export * from './PanelHeader/PanelHeader'"), 'index.ts exports PanelHeader');
  assert(barrelContent.includes("export * from './Modal/Modal'"), 'index.ts exports Modal');
  assert(barrelContent.includes("export * from './Tabs/Tabs'"), 'index.ts exports Tabs');

  const buttonCss = fs.readFileSync(path.join(uiDir, 'Button/button.css'), 'utf8');
  assert(buttonCss.includes('.nexus-btn-core--primary'), 'button.css defines primary variant');
  assert(buttonCss.includes('.nexus-btn-core--secondary'), 'button.css defines secondary variant');
  assert(buttonCss.includes('.nexus-btn-core--ghost'), 'button.css defines ghost variant');
  assert(buttonCss.includes('.nexus-btn-core--danger'), 'button.css defines danger variant');
  assert(buttonCss.includes('.nexus-btn-core--xs'), 'button.css defines xs size');
  assert(buttonCss.includes('.nexus-btn-core--sm'), 'button.css defines sm size');
  assert(buttonCss.includes('.nexus-btn-core--md'), 'button.css defines md size');
  assert(buttonCss.includes('.nexus-btn-core--lg'), 'button.css defines lg size');
  assert(buttonCss.includes('var(--nexus-accent-primary'), 'button.css relies on dynamic --nexus-accent-primary');

  const modalCss = fs.readFileSync(path.join(uiDir, 'Modal/modal.css'), 'utf8');
  assert(modalCss.includes('backdrop-filter: blur(8px)'), 'modal.css includes backdrop blur');
  assert(modalCss.includes('.nexus-modal-footer'), 'modal.css includes modal footer slot');

  const readmeContent = fs.readFileSync(path.join(uiDir, 'README.md'), 'utf8');
  assert(readmeContent.includes('ALL NEW NEXUS FEATURES MUST REUSE THIS SHARED UI SYSTEM'), 'README enforces reuse rule');

  console.log('\n[SUITE 5: PHASE 3 CONTROLLED MIGRATION INTEGRITY]');
  const rootDir = path.resolve(__dirname, '..');
  const notesPanel = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/Notes/NotesSidePanel.tsx'), 'utf8');
  assert(notesPanel.includes("from '../ui'") || notesPanel.includes('from "../ui"'), 'NotesSidePanel imports from ui primitives');
  assert(notesPanel.includes('<IconButton'), 'NotesSidePanel uses canonical <IconButton>');
  assert(notesPanel.includes('<SearchInput'), 'NotesSidePanel uses canonical <SearchInput>');

  const notesEditor = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/Notes/NotesEditor.tsx'), 'utf8');
  assert(notesEditor.includes("from '../ui'") || notesEditor.includes('from "../ui"'), 'NotesEditor imports from ui primitives');
  assert(notesEditor.includes('<Button'), 'NotesEditor uses canonical <Button>');
  assert(!notesEditor.includes('color-clear-btn-white'), 'NotesEditor has no white clear buttons');

  const todoWorkspace = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/Todo/TodoWorkspace.tsx'), 'utf8');
  assert(todoWorkspace.includes("from '../ui'") || todoWorkspace.includes('from "../ui"'), 'TodoWorkspace imports from ui primitives');
  assert(todoWorkspace.includes('<Modal'), 'TodoWorkspace uses canonical <Modal>');
  assert(todoWorkspace.includes('<Tabs'), 'TodoWorkspace uses canonical <Tabs>');
  assert(todoWorkspace.includes('<SearchInput'), 'TodoWorkspace uses canonical <SearchInput>');
  assert(todoWorkspace.includes('<Badge'), 'TodoWorkspace uses canonical <Badge>');

  const todoCard = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/Todo/TodoItemCard.tsx'), 'utf8');
  assert(todoCard.includes("from '../ui'") || todoCard.includes('from "../ui"'), 'TodoItemCard imports from ui primitives');
  assert(todoCard.includes('<Badge'), 'TodoItemCard uses canonical <Badge>');
  assert(todoCard.includes('<IconButton'), 'TodoItemCard uses canonical <IconButton>');

  const dictView = fs.readFileSync(path.join(rootDir, 'src/renderer/src/components/Intelligence/DictionaryView.tsx'), 'utf8');
  assert(dictView.includes("from '../ui'") || dictView.includes('from "../ui"'), 'DictionaryView imports from ui primitives');
  assert(dictView.includes('<Tabs'), 'DictionaryView uses canonical <Tabs>');
  assert(dictView.includes('<SearchInput'), 'DictionaryView uses canonical <SearchInput>');
  assert(dictView.includes('<Select'), 'DictionaryView uses canonical <Select>');
  assert(dictView.includes('<Card'), 'DictionaryView uses canonical <Card>');
  assert(dictView.includes('<Button'), 'DictionaryView uses canonical <Button>');
  assert(dictView.includes('<IconButton'), 'DictionaryView uses canonical <IconButton>');
  assert(dictView.includes('<Badge'), 'DictionaryView uses canonical <Badge>');

  console.log('\n====================================================');
  if (failed === 0) {
    console.log(`  NEXUS Design System Verification PASSED! (${passed} checks passed)`);
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error(`  FAILURES DETECTED: ${failed} failed, ${passed} passed`);
    console.log('====================================================\n');
    process.exit(1);
  }
}

runDesignSystemAudit();
