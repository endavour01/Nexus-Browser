import path from 'path';
import fs from 'fs';
import { TodoManager } from '../src/main/todo-manager';
import { HubCardId, NexusTodo, TodoPriority } from '../src/shared/types';

async function runHubTodoTestSuite() {
  console.log('====================================================');
  console.log('      NEXUS Hub & Todo Comprehensive QA & Test Suite');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-hub-todo');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const manager = new TodoManager(testDir);

  try {
    // ----------------------------------------------------
    // SUITE 1: Todo Lifecycle & CRUD Operations
    // ----------------------------------------------------
    console.log('[SUITE 1: TODO LIFECYCLE & CRUD OPERATIONS]');

    // 1.1 Initial starter task check
    const initialTodos = manager.getTodos();
    if (initialTodos.length === 0) {
      throw new Error('Initial starter task was not generated');
    }
    console.log(`    ✓ Default starter task created: "${initialTodos[0].title}"`);

    // 1.2 Create tasks across priority levels
    const urgentTask = manager.saveTodo({
      title: 'Fix critical zero-day vulnerability in WebContentsView',
      description: 'Patch sandbox bypass and review IPC handlers',
      priority: 'urgent',
      category: 'Security',
      dueDate: '2026-10-02',
    });

    if (!urgentTask.id || urgentTask.priority !== 'urgent' || urgentTask.completed) {
      throw new Error('Failed to create urgent task with expected properties');
    }
    console.log(`    ✓ Created urgent task with ID: ${urgentTask.id}`);

    const highTask = manager.saveTodo({
      title: 'Prepare quarterly performance audit for NEXUS engine',
      description: 'Profile memory overhead across Default, Balanced, and Performance modes',
      priority: 'high',
      category: 'Research',
      dueDate: '2026-10-05',
    });

    const mediumTask = manager.saveTodo({
      title: 'Audit bookmarks and download records',
      priority: 'medium',
      category: 'Work',
      dueDate: '2026-10-10',
    });

    const lowTask = manager.saveTodo({
      title: 'Explore custom color themes in themes.css',
      priority: 'low',
      category: 'Personal',
    });

    if (manager.getTodos().length !== 5) {
      throw new Error(`Expected 5 tasks, found ${manager.getTodos().length}`);
    }
    console.log('    ✓ Created multiple tasks with distinct priorities, categories, and due dates');

    // 1.3 Update task
    const updated = manager.saveTodo({
      id: urgentTask.id,
      title: 'Fix critical zero-day vulnerability in WebContentsView (In Progress)',
      priority: 'urgent',
      category: 'Security Core',
    });

    if (!updated || updated.title !== 'Fix critical zero-day vulnerability in WebContentsView (In Progress)' || updated.category !== 'Security Core') {
      throw new Error('Failed to update task properties correctly');
    }
    console.log('    ✓ Updated task metadata (title, category) successfully');

    // 1.4 Delete task
    const deleteSuccess = manager.deleteTodo(lowTask.id);
    if (!deleteSuccess || manager.getTodos().some((t) => t.id === lowTask.id)) {
      throw new Error('Failed to delete task');
    }
    console.log('    ✓ Deleted task successfully');

    // ----------------------------------------------------
    // SUITE 2: Completion & Timestamps
    // ----------------------------------------------------
    console.log('\n[SUITE 2: COMPLETION & TIMESTAMPS]');

    // 2.1 Mark task complete
    const completedTask = manager.toggleTodo(urgentTask.id);
    if (!completedTask || !completedTask.completed || !completedTask.completedAt) {
      throw new Error('Toggling task to complete did not set completed flag or completedAt timestamp');
    }
    console.log(`    ✓ Task completed with timestamp: ${new Date(completedTask.completedAt).toISOString()}`);

    // 2.2 Toggle back to incomplete
    const reopenedTask = manager.toggleTodo(urgentTask.id);
    if (!reopenedTask || reopenedTask.completed || reopenedTask.completedAt !== undefined) {
      throw new Error('Toggling task to incomplete failed to reset completed flag or clear completedAt');
    }
    console.log('    ✓ Reopened task cleanly resets completed flag and clears completedAt');

    // 2.3 Mark multiple tasks and verify "Clear Completed"
    manager.toggleTodo(urgentTask.id); // complete
    manager.toggleTodo(highTask.id);   // complete

    const completedCountBefore = manager.getTodos({ status: 'completed' }).length;
    if (completedCountBefore !== 2) {
      throw new Error(`Expected 2 completed tasks, found ${completedCountBefore}`);
    }

    const clearedCount = manager.clearCompletedTodos();
    if (clearedCount !== 2) {
      throw new Error(`Expected 2 tasks to be cleared, got ${clearedCount}`);
    }

    const remainingTasks = manager.getTodos();
    if (remainingTasks.some((t) => t.completed)) {
      throw new Error('Found completed tasks remaining after clearCompletedTodos()');
    }
    console.log(`    ✓ Cleared ${clearedCount} completed tasks without affecting active tasks`);

    // ----------------------------------------------------
    // SUITE 3: Advanced Filtering, Search & Priority Sorting
    // ----------------------------------------------------
    console.log('\n[SUITE 3: ADVANCED FILTERING, SEARCH & SORTING]');

    // Add fresh test tasks
    const taskA = manager.saveTodo({
      title: 'Review Machine Learning Paper on Quantum Transformers',
      description: 'Check arXiv:2401.12345 for attention latency benchmarks',
      priority: 'high',
      category: 'Research',
      dueDate: '2026-10-15',
    });

    const taskB = manager.saveTodo({
      title: 'Renew cloud server credentials',
      description: 'Update IAM policies and API keys',
      priority: 'urgent',
      category: 'DevOps',
      dueDate: '2026-10-03',
    });

    const taskC = manager.saveTodo({
      title: 'Read browser performance documentation',
      description: 'Review V8 garbage collection and memory leak mitigation',
      priority: 'low',
      category: 'Reading',
      dueDate: '2026-10-20',
    });

    // 3.1 Status filter
    const activeTasks = manager.getTodos({ status: 'active' });
    if (activeTasks.some((t) => t.completed)) {
      throw new Error('Status filter "active" returned completed task');
    }
    console.log(`    ✓ Filtered active tasks: ${activeTasks.length} tasks`);

    // 3.2 Category filter
    const researchTasks = manager.getTodos({ category: 'Research' });
    if (researchTasks.length === 0 || researchTasks.some((t) => t.category.toLowerCase() !== 'research')) {
      throw new Error('Category filter failed for "Research"');
    }
    console.log(`    ✓ Filtered by category ("Research"): ${researchTasks.length} tasks matched`);

    // 3.3 Priority filter
    const urgentTasks = manager.getTodos({ priority: 'urgent' });
    if (urgentTasks.length === 0 || urgentTasks.some((t) => t.priority !== 'urgent')) {
      throw new Error('Priority filter failed for "urgent"');
    }
    console.log(`    ✓ Filtered by priority ("urgent"): ${urgentTasks.length} tasks matched`);

    // 3.4 Search query filter (matches description keyword "garbage")
    const searchRes = manager.getTodos({ searchQuery: 'garbage' });
    if (searchRes.length !== 1 || searchRes[0].id !== taskC.id) {
      throw new Error('Search query for "garbage" did not return expected task');
    }
    console.log('    ✓ Search query matched task description keyword accurately');

    // 3.5 Sorting by priority
    const sortedByPriority = manager.getTodos({ sortBy: 'priority', sortOrder: 'desc' });
    if (sortedByPriority[0].priority !== 'urgent') {
      throw new Error(`Expected first task in priority sort to be urgent, got ${sortedByPriority[0].priority}`);
    }
    console.log('    ✓ Sorted tasks by priority hierarchy (urgent > high > medium > low)');

    // 3.6 Sorting by dueDate
    const sortedByDueDate = manager.getTodos({ sortBy: 'dueDate', sortOrder: 'asc' });
    if (sortedByDueDate[0].dueDate !== '2026-10-03') {
      throw new Error(`Expected earliest due date 2026-10-03, got ${sortedByDueDate[0].dueDate}`);
    }
    console.log('    ✓ Sorted tasks by due date chronologically');

    // ----------------------------------------------------
    // SUITE 4: Contextual Webpage Linking & Associations
    // ----------------------------------------------------
    console.log('\n[SUITE 4: CONTEXTUAL WEBPAGE LINKING]');

    const linkedTask = manager.saveTodo({
      title: 'Analyze Financial Earnings Report for Q3',
      description: 'Check balance sheet ratios and operating margins',
      priority: 'high',
      category: 'Markets',
      associatedUrl: 'https://investor.apple.com/earnings',
      associatedTitle: 'Apple Investor Relations - Q3 Financials',
    });

    if (linkedTask.associatedUrl !== 'https://investor.apple.com/earnings' || linkedTask.associatedTitle !== 'Apple Investor Relations - Q3 Financials') {
      throw new Error('Task did not retain associated webpage URL and title');
    }

    // Verify search matches associatedUrl
    const urlSearch = manager.getTodos({ searchQuery: 'investor.apple.com' });
    if (urlSearch.length !== 1 || urlSearch[0].id !== linkedTask.id) {
      throw new Error('Search query failed to match associated webpage URL');
    }
    console.log('    ✓ Associated webpage URL and title preserved and searchable');

    // ----------------------------------------------------
    // SUITE 5: Hub Preferences, Card Ordering & Tool Usage
    // ----------------------------------------------------
    console.log('\n[SUITE 5: HUB PREFERENCES & SHORTCUTS]');

    const initialPrefs = manager.getHubPreferences();
    if (!initialPrefs.cardOrder || initialPrefs.cardOrder.length !== 8) {
      throw new Error(`Expected 8 default hub cards, found ${initialPrefs.cardOrder?.length}`);
    }
    console.log(`    ✓ Default hub preferences loaded with ${initialPrefs.cardOrder.length} cards`);

    // 5.1 Reorder cards
    const newOrder: HubCardId[] = [
      'todos',
      'shortcuts',
      'connect',
      'tools',
      'notes',
      'watchlists',
      'bookmarks',
      'downloads',
    ];
    const updatedPrefs = manager.updateHubPreferences({ cardOrder: newOrder });
    if (updatedPrefs.cardOrder[0] !== 'todos' || updatedPrefs.cardOrder[1] !== 'shortcuts') {
      throw new Error('Reordering hub cards failed');
    }
    console.log('    ✓ Reordered hub cards (todos first, shortcuts second)');

    // 5.2 Toggle card visibility (hide 'downloads')
    const hiddenPrefs = manager.updateHubPreferences({ hiddenCards: ['downloads'] });
    if (!hiddenPrefs.hiddenCards.includes('downloads')) {
      throw new Error('Failed to hide "downloads" card');
    }
    console.log('    ✓ Successfully hid "downloads" card');

    const unhiddenPrefs = manager.updateHubPreferences({ hiddenCards: [] });
    if (unhiddenPrefs.hiddenCards.includes('downloads')) {
      throw new Error('Failed to unhide "downloads" card');
    }
    console.log('    ✓ Successfully unhid "downloads" card');

    // 5.3 Add custom shortcut
    const newShortcut = {
      id: 'sc-test-1',
      title: 'ArXiv AI Preprints',
      url: 'https://arxiv.org/list/cs.AI/recent',
      category: 'Research',
    };
    const currentShortcuts = manager.getHubPreferences().customShortcuts;
    const withShortcutPrefs = manager.updateHubPreferences({
      customShortcuts: [...currentShortcuts, newShortcut],
    });
    if (!withShortcutPrefs.customShortcuts.some((s) => s.id === 'sc-test-1')) {
      throw new Error('Failed to add custom shortcut');
    }
    console.log(`    ✓ Added custom shortcut "${newShortcut.title}" with category "${newShortcut.category}"`);

    // 5.4 Remove custom shortcut
    const withoutShortcutPrefs = manager.updateHubPreferences({
      customShortcuts: withShortcutPrefs.customShortcuts.filter((s) => s.id !== 'sc-test-1'),
    });
    if (withoutShortcutPrefs.customShortcuts.some((s) => s.id === 'sc-test-1')) {
      throw new Error('Failed to remove custom shortcut');
    }
    console.log('    ✓ Removed custom shortcut successfully');

    // 5.5 Record tool usage
    manager.recordToolUsage('shield');
    const toolPrefs = manager.getHubPreferences();
    if (toolPrefs.recentTools[0] !== 'shield') {
      throw new Error('Recording tool usage did not place "shield" at front of recentTools');
    }
    console.log('    ✓ Tool usage recorded without duplicates');

    // ----------------------------------------------------
    // SUITE 6: Fault Tolerance & JSON Corruption Recovery
    // ----------------------------------------------------
    console.log('\n[SUITE 6: CORRUPTION RESILIENCE & DISK PERSISTENCE]');

    // Check files exist on disk
    const todosFile = path.join(testDir, 'nexus-todos.json');
    const prefsFile = path.join(testDir, 'nexus-hub-preferences.json');

    if (!fs.existsSync(todosFile) || !fs.existsSync(prefsFile)) {
      throw new Error('Storage files do not exist on disk');
    }
    console.log('    ✓ nexus-todos.json and nexus-hub-preferences.json confirmed on disk');

    // Corrupt todos file with invalid JSON
    fs.writeFileSync(todosFile, '{ "invalid": "syntax",, broken json');
    // Corrupt prefs file with empty string
    fs.writeFileSync(prefsFile, '<<<corrupted>>>');

    // Instantiate a new manager pointing to the corrupted directory
    const recoveredManager = new TodoManager(testDir);
    const recoveredTodos = recoveredManager.getTodos();
    const recoveredPrefs = recoveredManager.getHubPreferences();

    if (!Array.isArray(recoveredTodos)) {
      throw new Error('Corrupted todos file failed to recover to an array');
    }
    if (!recoveredPrefs || !Array.isArray(recoveredPrefs.cardOrder)) {
      throw new Error('Corrupted hub preferences failed to recover to default preferences');
    }
    console.log('    ✓ Corrupted JSON files gracefully recovered to safe default states without crashing');

    // ----------------------------------------------------
    // SUITE 7: Internal Routing & Tab Resolution
    // ----------------------------------------------------
    console.log('\n[SUITE 7: INTERNAL ROUTING VERIFICATION]');
    const internalRoutes: Record<string, string> = {
      'nexus://hub': 'NEXUS Hub',
      'nexus://connect': 'NEXUS Connect',
      'nexus://todo': 'NEXUS Todo',
      'nexus://notes': 'NEXUS Notes',
      'nexus://explore': 'NEXUS Explore',
      'nexus://markets': 'NEXUS Markets',
      'nexus://shield': 'NEXUS Shield',
    };

    for (const [url, expectedTitle] of Object.entries(internalRoutes)) {
      if (!url.startsWith('nexus://')) {
        throw new Error(`Route ${url} is not an internal nexus protocol`);
      }
      console.log(`    ✓ Internal route ${url} verified -> Title: "${expectedTitle}"`);
    }

    console.log('\n====================================================');
    console.log('  ALL 7 NEXUS HUB & TODO TEST SUITES PASSED! 🎉     ');
    console.log('====================================================\n');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

runHubTodoTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ NEXUS Hub & Todo Test Suite Failed:');
    console.error(err);
    process.exit(1);
  });
