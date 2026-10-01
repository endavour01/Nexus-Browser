import path from 'path';
import fs from 'fs';
import { ConnectManager } from '../src/main/connect-manager';
import { TodoManager } from '../src/main/todo-manager';
import { HubCardId, NexusTodo, ConnectApp, ConnectWorkspace } from '../src/shared/types';

async function runConnectHubTodoTestSuite() {
  console.log('====================================================');
  console.log('  NEXUS Connect + Hub + Todo QA Verification Suite  ');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-connect-hub-todo');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const connectManager = new ConnectManager(testDir);
  const todoManager = new TodoManager(testDir);

  try {
    // ----------------------------------------------------
    // SUITE 1: Connect Default State & Initialization
    // ----------------------------------------------------
    console.log('[SUITE 1: CONNECT DEFAULT STATE & INITIALIZATION]');

    const defaultApps = connectManager.getApps();
    if (defaultApps.length !== 13) {
      throw new Error(`Expected 13 default apps, received: ${defaultApps.length}`);
    }
    console.log(`    ✓ Loaded 13 default apps correctly`);

    // Verify categories
    const chillApps = defaultApps.filter((a) => a.category === 'chill');
    const workApps = defaultApps.filter((a) => a.category === 'work');
    const createApps = defaultApps.filter((a) => a.category === 'create');

    if (chillApps.length < 4 || workApps.length < 5 || createApps.length < 4) {
      throw new Error('Default apps do not have expected category distributions');
    }
    console.log(`    ✓ Default categories verified: Chill (${chillApps.length}), Work (${workApps.length}), Create (${createApps.length})`);

    const defaultWorkspaces = connectManager.getWorkspaces();
    if (defaultWorkspaces.length !== 3) {
      throw new Error(`Expected 3 default workspaces, received: ${defaultWorkspaces.length}`);
    }
    const wsNames = defaultWorkspaces.map((w) => w.name);
    if (!wsNames.includes('STUDY') || !wsNames.includes('WORK') || !wsNames.includes('CHILL')) {
      throw new Error(`Default workspaces missing expected names: ${wsNames.join(', ')}`);
    }
    console.log(`    ✓ Default workspaces verified: ${wsNames.join(', ')}`);

    // ----------------------------------------------------
    // SUITE 2: Connect URL Validation & Security
    // ----------------------------------------------------
    console.log('\n[SUITE 2: CONNECT URL VALIDATION & SECURITY]');

    const validUrls = [
      'https://discord.com/app',
      'http://localhost:3000',
      'https://teams.microsoft.com',
      'https://github.com',
    ];

    for (const url of validUrls) {
      const res = ConnectManager.validateUrl(url);
      if (!res.valid) {
        throw new Error(`Expected valid URL to pass: ${url} (${res.error})`);
      }
    }
    console.log(`    ✓ Valid HTTP/HTTPS URLs pass validation`);

    const maliciousUrls = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'blob:https://example.com/uuid',
      'not-a-url',
      'http://',
      '',
    ];

    for (const url of maliciousUrls) {
      const res = ConnectManager.validateUrl(url);
      if (res.valid) {
        throw new Error(`Expected malicious/invalid URL to fail: ${url}`);
      }
    }
    console.log(`    ✓ Malicious/invalid URL schemes (javascript:, data:, file:) successfully blocked`);

    // ----------------------------------------------------
    // SUITE 3: Connect App CRUD & Reordering
    // ----------------------------------------------------
    console.log('\n[SUITE 3: CONNECT APP CRUD & REORDERING]');

    // 3.1 Create custom app
    const customApp = connectManager.saveApp({
      name: 'Custom Research Tool',
      url: 'https://arxiv.org',
      category: 'create',
      isCustom: true,
      isFavorite: true,
    });

    if (!customApp.id || customApp.name !== 'Custom Research Tool') {
      throw new Error('Failed to create custom Connect app');
    }
    console.log(`    ✓ Created custom Connect app with ID: ${customApp.id}`);

    // Verify it exists in getApps
    if (!connectManager.getApps().some((a) => a.id === customApp.id)) {
      throw new Error('Custom app not found in getApps()');
    }

    // 3.2 Update app (toggle favorite)
    const updatedApp = connectManager.saveApp({
      id: customApp.id,
      name: 'Custom Research Tool (Updated)',
      url: 'https://arxiv.org/abs/2103.00020',
      category: 'create',
      isFavorite: false,
    });

    if (updatedApp.isFavorite !== false || updatedApp.name !== 'Custom Research Tool (Updated)') {
      throw new Error('Failed to update Connect app');
    }
    console.log(`    ✓ Updated custom Connect app properties`);

    // 3.3 Reorder apps
    const allApps = connectManager.getApps();
    const reversedIds = allApps.map((a) => a.id).reverse();
    const reordered = connectManager.reorderApps(reversedIds);
    if (reordered[0].id !== reversedIds[0]) {
      throw new Error('Failed to reorder Connect apps');
    }
    console.log(`    ✓ Reordered Connect apps successfully`);

    // 3.4 Delete custom app
    const deleted = connectManager.deleteApp(customApp.id);
    if (!deleted || connectManager.getApps().some((a) => a.id === customApp.id)) {
      throw new Error('Failed to delete Connect app');
    }
    console.log(`    ✓ Deleted custom Connect app successfully`);

    // 3.5 Reset to default apps
    const resetApps = connectManager.resetDefaultApps();
    if (resetApps.length !== 13) {
      throw new Error(`Reset apps failed, count: ${resetApps.length}`);
    }
    console.log(`    ✓ Reset to 13 default Connect apps`);

    // ----------------------------------------------------
    // SUITE 4: Connect Workspace CRUD
    // ----------------------------------------------------
    console.log('\n[SUITE 4: CONNECT WORKSPACE CRUD]');

    // 4.1 Create workspace
    const newWs = connectManager.saveWorkspace({
      name: 'DEVELOPMENT',
      description: 'Dev tools and collaboration apps',
      appIds: ['connect-github', 'connect-slack'],
      color: '#38BDF8',
    });

    if (!newWs.id || newWs.name !== 'DEVELOPMENT' || newWs.appIds.length !== 2) {
      throw new Error('Failed to create new Connect workspace');
    }
    console.log(`    ✓ Created Connect workspace: ${newWs.name} (${newWs.appIds.length} apps)`);

    // 4.2 Update workspace
    const updatedWs = connectManager.saveWorkspace({
      id: newWs.id,
      name: 'DEV & RESEARCH',
      appIds: ['connect-github', 'connect-slack', 'connect-notion'],
      color: '#34D399',
    });

    if (updatedWs.name !== 'DEV & RESEARCH' || updatedWs.appIds.length !== 3) {
      throw new Error('Failed to update Connect workspace');
    }
    console.log(`    ✓ Updated Connect workspace to: ${updatedWs.name}`);

    // 4.3 Delete workspace
    const wsDeleted = connectManager.deleteWorkspace(newWs.id);
    if (!wsDeleted || connectManager.getWorkspaces().some((w) => w.id === newWs.id)) {
      throw new Error('Failed to delete Connect workspace');
    }
    console.log(`    ✓ Deleted Connect workspace successfully`);

    // ----------------------------------------------------
    // SUITE 5: Todo Linkages (Connect, Workspace, Note, URL)
    // ----------------------------------------------------
    console.log('\n[SUITE 5: TODO LINKAGES WITH CONNECT & WORKSPACES]');

    // 5.1 Create task linked to Connect App
    const linkedTodo = todoManager.saveTodo({
      title: 'Review Discord developer server feedback',
      description: 'Check channels for bug reports regarding NEXUS modes',
      priority: 'high',
      category: 'Work',
      associatedUrl: 'https://discord.com/app',
      associatedTitle: 'Discord',
      associatedConnectAppId: 'connect-discord',
      associatedConnectAppName: 'Discord',
      associatedWorkspaceId: 'ws-chill',
      associatedWorkspaceName: 'CHILL',
      associatedNoteId: 'note-123',
      associatedNoteTitle: 'Performance Profiling Notes',
    });

    if (
      linkedTodo.associatedConnectAppId !== 'connect-discord' ||
      linkedTodo.associatedConnectAppName !== 'Discord' ||
      linkedTodo.associatedWorkspaceName !== 'CHILL' ||
      linkedTodo.associatedNoteTitle !== 'Performance Profiling Notes'
    ) {
      throw new Error('Todo failed to persist linkage fields correctly');
    }
    console.log(`    ✓ Todo persisted with Connect App and Workspace linkages`);

    // 5.2 Search by linked app name
    const searchAppResults = todoManager.getTodos({ query: 'Discord' });
    if (searchAppResults.length === 0 || !searchAppResults.some((t) => t.id === linkedTodo.id)) {
      throw new Error('Failed to search Todo by associated Connect app name');
    }
    console.log(`    ✓ Searching Todos by associatedConnectAppName returned matching task`);

    // 5.3 Search by linked workspace name
    const searchWsResults = todoManager.getTodos({ query: 'CHILL' });
    if (searchWsResults.length === 0 || !searchWsResults.some((t) => t.id === linkedTodo.id)) {
      throw new Error('Failed to search Todo by associated Workspace name');
    }
    console.log(`    ✓ Searching Todos by associatedWorkspaceName returned matching task`);

    // 5.4 Search by linked note title
    const searchNoteResults = todoManager.getTodos({ query: 'Profiling Notes' });
    if (searchNoteResults.length === 0 || !searchNoteResults.some((t) => t.id === linkedTodo.id)) {
      throw new Error('Failed to search Todo by associated Note title');
    }
    console.log(`    ✓ Searching Todos by associatedNoteTitle returned matching task`);

    // ----------------------------------------------------
    // SUITE 6: Hub Preferences & Connect Card Support
    // ----------------------------------------------------
    console.log('\n[SUITE 6: HUB PREFERENCES & CONNECT CARD SUPPORT]');

    const hubPrefs = todoManager.getHubPreferences();
    if (!hubPrefs.cardOrder.includes('connect')) {
      throw new Error('DEFAULT_HUB_PREFERENCES does not include "connect" in cardOrder');
    }
    console.log(`    ✓ Hub cardOrder includes "connect": [${hubPrefs.cardOrder.join(', ')}]`);

    if (!hubPrefs.recentTools.includes('connect')) {
      throw new Error('DEFAULT_HUB_PREFERENCES does not include "connect" in recentTools');
    }
    console.log(`    ✓ Hub recentTools includes "connect": [${hubPrefs.recentTools.join(', ')}]`);

    // Update Hub Preferences (reorder and hide)
    const updatedHub = todoManager.updateHubPreferences({
      cardOrder: ['connect', ...hubPrefs.cardOrder.filter((c) => c !== 'connect')],
      hiddenCards: ['notes'],
    });

    if (updatedHub.cardOrder[0] !== 'connect' || !updatedHub.hiddenCards.includes('notes')) {
      throw new Error('Failed to update Hub preferences with Connect in first position');
    }
    console.log(`    ✓ Successfully reordered Connect card to top position in Hub`);

    // ----------------------------------------------------
    // SUITE 7: Storage Resilience & Recovery
    // ----------------------------------------------------
    console.log('\n[SUITE 7: STORAGE RESILIENCE & RECOVERY]');

    const connectFilePath = path.join(testDir, 'nexus-connect.json');
    // Corrupt file
    fs.writeFileSync(connectFilePath, '{ INVALID JSON CORRUPTED DATA !!!', 'utf-8');

    // Create a new manager instance pointing to the corrupted file
    const resilientManager = new ConnectManager(testDir);
    const recoveredApps = resilientManager.getApps();

    if (recoveredApps.length !== 13) {
      throw new Error(`Corrupted storage did not self-heal with default apps, got ${recoveredApps.length}`);
    }
    console.log(`    ✓ Resilient recovery: corrupted nexus-connect.json self-healed to defaults`);

    console.log('\n====================================================');
    console.log('  ALL SUITES PASSED: CONNECT + HUB + TODO VERIFIED  ');
    console.log('====================================================\n');
  } finally {
    // Cleanup sandbox
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

runConnectHubTodoTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
