import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  HubCardId,
  HubPreferences,
  NexusTodo,
  NexusTodoFilter,
  TodoPriority,
} from '../shared/types';

// ============================================================================
// Default Hub Preferences
// ============================================================================
const DEFAULT_HUB_PREFERENCES: HubPreferences = {
  cardOrder: [
    'tools',
    'connect',
    'todos',
    'shortcuts',
    'bookmarks',
    'downloads',
    'notes',
    'watchlists',
  ],
  hiddenCards: [],
  customShortcuts: [
    { id: 'sc-1', title: 'GitHub', url: 'https://github.com', category: 'Development' },
    { id: 'sc-2', title: 'Hacker News', url: 'https://news.ycombinator.com', category: 'Tech' },
    { id: 'sc-3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'Documentation' },
  ],
  recentTools: ['connect', 'notes', 'markets', 'explore', 'shield'],
};

// Priority weight for sorting
const PRIORITY_WEIGHTS: Record<TodoPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ============================================================================
// TodoManager Class
// ============================================================================
export class TodoManager {
  private storageDir: string;
  private mainWindow: BrowserWindow | null = null;
  private todosFilePath: string;
  private hubPrefsFilePath: string;

  private todos: NexusTodo[] = [];
  private hubPreferences: HubPreferences = { ...DEFAULT_HUB_PREFERENCES };

  constructor(storageDir?: string, mainWindow?: BrowserWindow | null) {
    this.storageDir = storageDir || path.join(process.cwd(), 'userData');
    this.mainWindow = mainWindow || null;

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        console.error('[TodoManager] Failed to create storage dir:', err);
      }
    }

    this.todosFilePath = path.join(this.storageDir, 'nexus-todos.json');
    this.hubPrefsFilePath = path.join(this.storageDir, 'nexus-hub-preferences.json');

    this.loadState();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  /**
   * Safe loading with corruption tolerance
   */
  private loadState() {
    // 1. Load Todos
    try {
      if (fs.existsSync(this.todosFilePath)) {
        const raw = fs.readFileSync(this.todosFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.todos = parsed;
        } else {
          console.warn('[TodoManager] Corrupted todos format, resetting to empty array');
          this.todos = [];
        }
      } else {
        // Initial gentle starter task
        const now = Date.now();
        this.todos = [
          {
            id: `todo-${now}`,
            title: 'Explore NEXUS Hub and customize your workspace cards',
            description: 'Visit nexus://hub to arrange cards, shortcuts, and view live browser utilities.',
            completed: false,
            priority: 'medium',
            category: 'Getting Started',
            associatedUrl: 'nexus://hub',
            associatedTitle: 'NEXUS Hub',
            createdAt: now,
            updatedAt: now,
          },
        ];
        this.saveTodos();
      }
    } catch (err) {
      console.error('[TodoManager] Failed to read or parse nexus-todos.json:', err);
      this.todos = [];
    }

    // 2. Load Hub Preferences
    try {
      if (fs.existsSync(this.hubPrefsFilePath)) {
        const raw = fs.readFileSync(this.hubPrefsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.hubPreferences = {
          ...DEFAULT_HUB_PREFERENCES,
          ...parsed,
          cardOrder: Array.isArray(parsed.cardOrder) ? parsed.cardOrder : DEFAULT_HUB_PREFERENCES.cardOrder,
          hiddenCards: Array.isArray(parsed.hiddenCards) ? parsed.hiddenCards : [],
          customShortcuts: Array.isArray(parsed.customShortcuts) ? parsed.customShortcuts : DEFAULT_HUB_PREFERENCES.customShortcuts,
          recentTools: Array.isArray(parsed.recentTools) ? parsed.recentTools : DEFAULT_HUB_PREFERENCES.recentTools,
        };
      } else {
        this.hubPreferences = { ...DEFAULT_HUB_PREFERENCES };
        this.saveHubPreferences();
      }
    } catch (err) {
      console.error('[TodoManager] Failed to read or parse nexus-hub-preferences.json:', err);
      this.hubPreferences = { ...DEFAULT_HUB_PREFERENCES };
    }
  }

  private saveTodos() {
    try {
      fs.writeFileSync(this.todosFilePath, JSON.stringify(this.todos, null, 2), 'utf8');
    } catch (err) {
      console.error('[TodoManager] Failed to save todos:', err);
    }
  }

  private saveHubPreferences() {
    try {
      fs.writeFileSync(this.hubPrefsFilePath, JSON.stringify(this.hubPreferences, null, 2), 'utf8');
    } catch (err) {
      console.error('[TodoManager] Failed to save hub preferences:', err);
    }
  }

  private notifyUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('todos:updated', [...this.todos]);
    }
  }

  // ==========================================================================
  // Todo Operations
  // ==========================================================================

  public getTodos(filter?: NexusTodoFilter): NexusTodo[] {
    let list = [...this.todos];

    if (filter) {
      // 1. Status Filter
      if (filter.status === 'active') {
        list = list.filter((t) => !t.completed);
      } else if (filter.status === 'completed') {
        list = list.filter((t) => t.completed);
      }

      // 2. Category Filter
      if (filter.category && filter.category !== 'all') {
        const cat = filter.category.toLowerCase();
        list = list.filter((t) => t.category.toLowerCase() === cat);
      }

      // 3. Priority Filter
      if (filter.priority) {
        list = list.filter((t) => t.priority === filter.priority);
      }

      // 4. Text Search
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.trim().toLowerCase();
        list = list.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            t.category.toLowerCase().includes(q) ||
            (t.associatedUrl && t.associatedUrl.toLowerCase().includes(q)) ||
            (t.associatedTitle && t.associatedTitle.toLowerCase().includes(q)) ||
            (t.associatedConnectAppName && t.associatedConnectAppName.toLowerCase().includes(q)) ||
            (t.associatedWorkspaceName && t.associatedWorkspaceName.toLowerCase().includes(q)) ||
            (t.associatedNoteTitle && t.associatedNoteTitle.toLowerCase().includes(q))
        );
      }

      // 5. Sorting
      if (filter.sortBy) {
        list.sort((a, b) => {
          switch (filter.sortBy) {
            case 'dueDate': {
              if (!a.dueDate && !b.dueDate) return 0;
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return a.dueDate.localeCompare(b.dueDate);
            }
            case 'priority': {
              const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
              const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
              return weightB - weightA;
            }
            case 'title': {
              return a.title.localeCompare(b.title);
            }
            case 'createdAt':
            default: {
              return b.createdAt - a.createdAt;
            }
          }
        });
      }
    }

    return list;
  }

  public saveTodo(todo: Partial<NexusTodo> & { title: string }): NexusTodo {
    const now = Date.now();
    const cleanTitle = todo.title.trim();
    if (!cleanTitle) {
      throw new Error('Todo title cannot be empty');
    }

    if (todo.id) {
      const idx = this.todos.findIndex((t) => t.id === todo.id);
      if (idx !== -1) {
        const existing = this.todos[idx];
        const updated: NexusTodo = {
          ...existing,
          title: cleanTitle,
          description: todo.description !== undefined ? todo.description.trim() : existing.description,
          priority: todo.priority || existing.priority || 'medium',
          dueDate: todo.dueDate !== undefined ? todo.dueDate : existing.dueDate,
          category: todo.category ? todo.category.trim() : existing.category || 'General',
          associatedUrl: todo.associatedUrl !== undefined ? todo.associatedUrl : existing.associatedUrl,
          associatedTitle: todo.associatedTitle !== undefined ? todo.associatedTitle : existing.associatedTitle,
          associatedNoteId: todo.associatedNoteId !== undefined ? todo.associatedNoteId : existing.associatedNoteId,
          associatedNoteTitle: todo.associatedNoteTitle !== undefined ? todo.associatedNoteTitle : existing.associatedNoteTitle,
          associatedConnectAppId: todo.associatedConnectAppId !== undefined ? todo.associatedConnectAppId : existing.associatedConnectAppId,
          associatedConnectAppName: todo.associatedConnectAppName !== undefined ? todo.associatedConnectAppName : existing.associatedConnectAppName,
          associatedWorkspaceId: todo.associatedWorkspaceId !== undefined ? todo.associatedWorkspaceId : existing.associatedWorkspaceId,
          associatedWorkspaceName: todo.associatedWorkspaceName !== undefined ? todo.associatedWorkspaceName : existing.associatedWorkspaceName,
          completed: todo.completed !== undefined ? todo.completed : existing.completed,
          completedAt: todo.completed ? (existing.completedAt || now) : undefined,
          updatedAt: now,
        };

        this.todos[idx] = updated;
        this.saveTodos();
        this.notifyUpdate();
        return updated;
      }
    }

    // Create New
    const newId = `todo-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const newTodo: NexusTodo = {
      id: newId,
      title: cleanTitle,
      description: todo.description ? todo.description.trim() : undefined,
      completed: !!todo.completed,
      completedAt: todo.completed ? now : undefined,
      priority: todo.priority || 'medium',
      dueDate: todo.dueDate || undefined,
      category: todo.category ? todo.category.trim() : 'General',
      associatedUrl: todo.associatedUrl || undefined,
      associatedTitle: todo.associatedTitle || undefined,
      associatedNoteId: todo.associatedNoteId || undefined,
      associatedNoteTitle: todo.associatedNoteTitle || undefined,
      associatedConnectAppId: todo.associatedConnectAppId || undefined,
      associatedConnectAppName: todo.associatedConnectAppName || undefined,
      associatedWorkspaceId: todo.associatedWorkspaceId || undefined,
      associatedWorkspaceName: todo.associatedWorkspaceName || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.todos = [newTodo, ...this.todos];
    this.saveTodos();
    this.notifyUpdate();
    return newTodo;
  }

  public deleteTodo(id: string): boolean {
    const initialLen = this.todos.length;
    this.todos = this.todos.filter((t) => t.id !== id);
    if (this.todos.length !== initialLen) {
      this.saveTodos();
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  public toggleTodo(id: string, completed?: boolean): NexusTodo | null {
    const idx = this.todos.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const item = this.todos[idx];
    const isCompleted = completed !== undefined ? completed : !item.completed;
    const now = Date.now();

    const updated: NexusTodo = {
      ...item,
      completed: isCompleted,
      completedAt: isCompleted ? now : undefined,
      updatedAt: now,
    };

    this.todos[idx] = updated;
    this.saveTodos();
    this.notifyUpdate();
    return updated;
  }

  public clearCompletedTodos(): number {
    const completedCount = this.todos.filter((t) => t.completed).length;
    if (completedCount > 0) {
      this.todos = this.todos.filter((t) => !t.completed);
      this.saveTodos();
      this.notifyUpdate();
    }
    return completedCount;
  }

  // ==========================================================================
  // Hub Preferences Operations
  // ==========================================================================

  public getHubPreferences(): HubPreferences {
    return {
      cardOrder: [...this.hubPreferences.cardOrder],
      hiddenCards: [...this.hubPreferences.hiddenCards],
      customShortcuts: [...this.hubPreferences.customShortcuts],
      recentTools: [...this.hubPreferences.recentTools],
    };
  }

  public updateHubPreferences(partial: Partial<HubPreferences>): HubPreferences {
    this.hubPreferences = {
      ...this.hubPreferences,
      ...partial,
      cardOrder: partial.cardOrder ? [...partial.cardOrder] : this.hubPreferences.cardOrder,
      hiddenCards: partial.hiddenCards ? [...partial.hiddenCards] : this.hubPreferences.hiddenCards,
      customShortcuts: partial.customShortcuts ? [...partial.customShortcuts] : this.hubPreferences.customShortcuts,
      recentTools: partial.recentTools ? [...partial.recentTools] : this.hubPreferences.recentTools,
    };

    this.saveHubPreferences();
    return this.getHubPreferences();
  }

  public recordToolUsage(toolId: string) {
    if (!toolId) return;
    const cleanId = toolId.trim().toLowerCase();
    const updated = [cleanId, ...this.hubPreferences.recentTools.filter((t) => t !== cleanId)].slice(0, 8);
    this.hubPreferences.recentTools = updated;
    this.saveHubPreferences();
  }
}
