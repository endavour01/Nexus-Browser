import { BrowserWindow } from 'electron';
import { NotesManager } from './notes-manager';
import { TodoManager } from './todo-manager';
import { SettingsManager } from './settings-manager';
import { SupabaseAuthProvider } from './supabase-auth-provider';
import {
  NexusNote,
  NexusTodo,
  SyncStatus,
  SyncTelemetry,
  NexusAccount,
} from '../shared/types';

export interface SyncManagerOptions {
  notesManager?: NotesManager;
  todoManager?: TodoManager;
  settingsManager?: SettingsManager;
  authProvider?: SupabaseAuthProvider;
  mainWindow?: BrowserWindow | null;
}

/**
 * Local-First Cross-Device Synchronization Engine
 */
export class SyncManager {
  private notesManager?: NotesManager;
  private todoManager?: TodoManager;
  private settingsManager?: SettingsManager;
  private authProvider?: SupabaseAuthProvider;
  private mainWindow: BrowserWindow | null = null;

  private currentStatus: SyncStatus = 'idle';
  private lastSyncedAt: number | null = null;
  private errorMessage?: string;
  private pendingChangesCount: number = 0;

  private activeAccount: NexusAccount | null = null;
  private debouncedSyncTimer: NodeJS.Timeout | null = null;
  private periodicSyncInterval: NodeJS.Timeout | null = null;
  private isSyncInProgress: boolean = false;

  constructor(options?: SyncManagerOptions) {
    if (options) {
      this.notesManager = options.notesManager;
      this.todoManager = options.todoManager;
      this.settingsManager = options.settingsManager;
      this.authProvider = options.authProvider;
      this.mainWindow = options.mainWindow || null;
    }
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  public setAuthProvider(provider: SupabaseAuthProvider) {
    this.authProvider = provider;
  }

  public setManagers(
    notes: NotesManager,
    todos: TodoManager,
    settings: SettingsManager
  ) {
    this.notesManager = notes;
    this.todoManager = todos;
    this.settingsManager = settings;
  }

  public onAccountSignedIn(account: NexusAccount) {
    this.activeAccount = account;
    this.currentStatus = 'idle';
    this.errorMessage = undefined;

    // Start background sync interval (every 5 minutes)
    if (this.periodicSyncInterval) clearInterval(this.periodicSyncInterval);
    this.periodicSyncInterval = setInterval(() => {
      this.syncNow().catch((err) =>
        console.warn('[SyncManager] Background sync error:', err.message)
      );
    }, 300000);

    // Trigger immediate first sync
    this.syncNow().catch((err) =>
      console.warn('[SyncManager] Initial sign-in sync error:', err.message)
    );
  }

  public onAccountSignedOut() {
    this.activeAccount = null;
    this.currentStatus = 'idle';
    this.errorMessage = undefined;
    if (this.debouncedSyncTimer) clearTimeout(this.debouncedSyncTimer);
    if (this.periodicSyncInterval) clearInterval(this.periodicSyncInterval);
    this.broadcastStatus();
  }

  public getTelemetry(): SyncTelemetry {
    const notesCount = this.notesManager ? this.notesManager.getNotes().length : 0;
    const todosCount = this.todoManager ? this.todoManager.getTodos().length : 0;

    return {
      status: this.currentStatus,
      lastSyncedAt: this.lastSyncedAt,
      pendingChangesCount: this.pendingChangesCount,
      syncedNotesCount: notesCount,
      syncedTodosCount: todosCount,
      errorMessage: this.errorMessage,
    };
  }

  /**
   * Schedule a debounced push sync (e.g. after local user edits note/todo)
   */
  public queueLocalChange() {
    if (!this.activeAccount || !this.authProvider?.isConfigured()) return;
    this.pendingChangesCount++;
    this.broadcastStatus();

    if (this.debouncedSyncTimer) clearTimeout(this.debouncedSyncTimer);
    this.debouncedSyncTimer = setTimeout(() => {
      this.syncNow().catch((err) =>
        console.warn('[SyncManager] Debounced sync failed:', err.message)
      );
    }, 3000);
  }

  /**
   * Main synchronization routine:
   * 1. Check network & auth
   * 2. Bidirectional merge Notes
   * 3. Bidirectional merge Todos
   * 4. Bidirectional merge Preferences
   * 5. Update timestamps & notify UI
   */
  public async syncNow(): Promise<{ success: boolean; error?: string }> {
    if (!this.activeAccount) {
      return { success: false, error: 'Cannot synchronize without active account session' };
    }

    if (!this.authProvider || !this.authProvider.isConfigured()) {
      this.currentStatus = 'offline';
      this.broadcastStatus();
      return { success: false, error: 'Authentication provider is not configured for cloud sync' };
    }

    if (this.isSyncInProgress) {
      return { success: true };
    }

    this.isSyncInProgress = true;
    this.currentStatus = 'syncing';
    this.errorMessage = undefined;
    this.broadcastStatus();

    try {
      const tokens = this.authProvider.getTokens();
      if (!tokens.accessToken) {
        throw new Error('No valid access token available for synchronization');
      }

      // Sync Notes
      await this.syncNotes(tokens.accessToken);

      // Sync Todos
      await this.syncTodos(tokens.accessToken);

      // Sync Preferences
      await this.syncPreferences(tokens.accessToken);

      this.currentStatus = 'idle';
      this.lastSyncedAt = Date.now();
      this.pendingChangesCount = 0;
      this.errorMessage = undefined;
      this.broadcastStatus();

      return { success: true };
    } catch (err: any) {
      const isNetwork =
        err.message?.includes('fetch failed') ||
        err.message?.includes('ENOTFOUND') ||
        err.message?.includes('network');

      this.currentStatus = isNetwork ? 'offline' : 'error';
      this.errorMessage = err.message || 'Synchronization failed';
      this.broadcastStatus();

      return { success: false, error: this.errorMessage };
    } finally {
      this.isSyncInProgress = false;
    }
  }

  /**
   * Safe Additive Notes Synchronization
   */
  private async syncNotes(accessToken: string) {
    if (!this.notesManager || !this.activeAccount) return;

    const supabaseUrl = (this.authProvider as any).supabaseUrl;
    const anonKey = (this.authProvider as any).anonKey;
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    // 1. Fetch remote notes
    const res = await fetch(`${supabaseUrl}/rest/v1/notes?select=*`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to fetch remote notes: ${err.message || res.statusText}`);
    }

    const remoteNotes: any[] = await res.json();
    const remoteNotesMap = new Map<string, any>();
    remoteNotes.forEach((rn) => remoteNotesMap.set(rn.id, rn));

    const localNotes = this.notesManager.getNotes();
    const localNotesMap = new Map<string, NexusNote>();
    localNotes.forEach((ln) => localNotesMap.set(ln.id, ln));

    const notesToUpsertRemote: any[] = [];

    // 2. Additive Merge: Local to Remote
    for (const localNote of localNotes) {
      const remote = remoteNotesMap.get(localNote.id);

      if (!remote) {
        // Exists only locally -> Upload to remote
        notesToUpsertRemote.push(this.mapLocalNoteToRemote(localNote, this.activeAccount.id));
      } else {
        // Exists in both -> Check updatedAt timestamp
        const remoteUpdated = new Date(remote.updated_at).getTime();
        if (localNote.updatedAt > remoteUpdated) {
          notesToUpsertRemote.push(this.mapLocalNoteToRemote(localNote, this.activeAccount.id));
        } else if (remoteUpdated > localNote.updatedAt) {
          // Remote is newer -> Update local note
          this.applyRemoteNoteToLocal(remote);
        }
      }
    }

    // 3. Additive Merge: Remote to Local (New items created on other devices)
    for (const remoteNote of remoteNotes) {
      if (!localNotesMap.has(remoteNote.id) && !remoteNote.deleted_at) {
        this.applyRemoteNoteToLocal(remoteNote);
      }
    }

    // 4. Batch push changes to Supabase
    if (notesToUpsertRemote.length > 0) {
      const upsertRes = await fetch(`${supabaseUrl}/rest/v1/notes`, {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(notesToUpsertRemote),
      });

      if (!upsertRes.ok) {
        const err = await upsertRes.json().catch(() => ({}));
        throw new Error(`Failed to push notes: ${err.message || upsertRes.statusText}`);
      }
    }
  }

  /**
   * Safe Additive Todos Synchronization
   */
  private async syncTodos(accessToken: string) {
    if (!this.todoManager || !this.activeAccount) return;

    const supabaseUrl = (this.authProvider as any).supabaseUrl;
    const anonKey = (this.authProvider as any).anonKey;
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    // 1. Fetch remote todos
    const res = await fetch(`${supabaseUrl}/rest/v1/todos?select=*`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to fetch remote todos: ${err.message || res.statusText}`);
    }

    const remoteTodos: any[] = await res.json();
    const remoteTodosMap = new Map<string, any>();
    remoteTodos.forEach((rt) => remoteTodosMap.set(rt.id, rt));

    const localTodos = this.todoManager.getTodos();
    const localTodosMap = new Map<string, NexusTodo>();
    localTodos.forEach((lt) => localTodosMap.set(lt.id, lt));

    const todosToUpsertRemote: any[] = [];

    // 2. Additive Merge: Local to Remote
    for (const localTodo of localTodos) {
      const remote = remoteTodosMap.get(localTodo.id);

      if (!remote) {
        todosToUpsertRemote.push(this.mapLocalTodoToRemote(localTodo, this.activeAccount.id));
      } else {
        const remoteUpdated = new Date(remote.updated_at).getTime();
        if (localTodo.updatedAt > remoteUpdated) {
          todosToUpsertRemote.push(this.mapLocalTodoToRemote(localTodo, this.activeAccount.id));
        } else if (remoteUpdated > localTodo.updatedAt) {
          this.applyRemoteTodoToLocal(remote);
        }
      }
    }

    // 3. Additive Merge: Remote to Local
    for (const remoteTodo of remoteTodos) {
      if (!localTodosMap.has(remoteTodo.id) && !remoteTodo.deleted_at) {
        this.applyRemoteTodoToLocal(remoteTodo);
      }
    }

    // 4. Batch push to Supabase
    if (todosToUpsertRemote.length > 0) {
      const upsertRes = await fetch(`${supabaseUrl}/rest/v1/todos`, {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(todosToUpsertRemote),
      });

      if (!upsertRes.ok) {
        const err = await upsertRes.json().catch(() => ({}));
        throw new Error(`Failed to push todos: ${err.message || upsertRes.statusText}`);
      }
    }
  }

  /**
   * Preferences Synchronization
   */
  private async syncPreferences(accessToken: string) {
    if (!this.settingsManager || !this.activeAccount) return;

    const supabaseUrl = (this.authProvider as any).supabaseUrl;
    const anonKey = (this.authProvider as any).anonKey;
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    const localSettings = this.settingsManager.getSettings();

    // Push local non-sensitive settings
    const safeSettings = {
      theme: localSettings.theme,
      mode: localSettings.mode,
      searchEngine: localSettings.searchEngine,
      defaultZoom: localSettings.defaultZoom,
      reducedMotion: localSettings.reducedMotion,
      showBookmarksBar: localSettings.showBookmarksBar,
    };

    await fetch(`${supabaseUrl}/rest/v1/user_preferences`, {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: this.activeAccount.id,
        preferences_json: safeSettings,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  private mapLocalNoteToRemote(note: NexusNote, userId: string) {
    return {
      id: note.id,
      user_id: userId,
      title: note.title,
      content: note.content,
      notebook_id: note.notebookId,
      folder_id: note.folderId,
      tags: note.tags || [],
      is_pinned: note.isPinned || false,
      is_favorite: note.isFavorite || false,
      is_archived: note.isArchived || false,
      in_trash: note.inTrash || false,
      created_at: new Date(note.createdAt).toISOString(),
      updated_at: new Date(note.updatedAt).toISOString(),
      deleted_at: null,
    };
  }

  private mapLocalTodoToRemote(todo: NexusTodo, userId: string) {
    return {
      id: todo.id,
      user_id: userId,
      title: todo.title,
      description: todo.description || null,
      completed: todo.completed,
      priority: todo.priority || 'medium',
      due_date: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
      tags: (todo as any).tags || [],
      created_at: new Date(todo.createdAt).toISOString(),
      updated_at: new Date(todo.updatedAt).toISOString(),
      deleted_at: null,
    };
  }

  private applyRemoteNoteToLocal(rn: any) {
    if (!this.notesManager) return;
    const existing = this.notesManager.getNote(rn.id);

    const updatedNote: NexusNote = {
      id: rn.id,
      notebookId: rn.notebook_id || 'default-notebook',
      folderId: rn.folder_id || null,
      title: rn.title,
      content: rn.content,
      tags: rn.tags || [],
      isPinned: Boolean(rn.is_pinned),
      isFavorite: Boolean(rn.is_favorite),
      isArchived: Boolean(rn.is_archived),
      inTrash: Boolean(rn.in_trash),
      trashedAt: null,
      createdAt: new Date(rn.created_at).getTime(),
      updatedAt: new Date(rn.updated_at).getTime(),
      wordCount: rn.content ? rn.content.split(/\s+/).length : 0,
      readingTimeMinutes: 1,
      linkedTab: existing?.linkedTab || null,
      drawingData: existing?.drawingData || null,
    };

    this.notesManager.saveNote(updatedNote);
  }

  private applyRemoteTodoToLocal(rt: any) {
    if (!this.todoManager) return;
    const existing = this.todoManager.getTodos().find((t) => t.id === rt.id);

    const updatedTodo: Partial<NexusTodo> & { title: string } = {
      id: rt.id,
      title: rt.title,
      description: rt.description || undefined,
      completed: Boolean(rt.completed),
      priority: rt.priority || 'medium',
      dueDate: rt.due_date ? new Date(rt.due_date).toISOString().split('T')[0] : undefined,
      category: rt.category || existing?.category || 'General',
      createdAt: new Date(rt.created_at).getTime(),
      updatedAt: new Date(rt.updated_at).getTime(),
    };

    this.todoManager.saveTodo(updatedTodo);
  }

  private broadcastStatus() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('sync:statusChanged', this.getTelemetry());
    }
  }
}
