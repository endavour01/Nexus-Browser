import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ConnectApp,
  ConnectWorkspace,
  NexusNote,
  NexusTodo,
  NexusTodoFilter,
  TodoPriority,
} from '@shared/types';
import { TodoItemCard } from './TodoItemCard';
import './todo.css';
import {
  CheckSquare,
  Plus,
  Trash2,
  Bookmark,
  ArrowUpDown,
  Link,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Layers,
  FileText,
} from 'lucide-react';
import { Button, IconButton, Input, SearchInput, Select, Badge, Modal, Tabs, PanelHeader } from '../ui';

export interface TodoPrefill {
  title?: string;
  description?: string;
  category?: string;
  associatedUrl?: string;
  associatedTitle?: string;
  associatedConnectAppId?: string;
  associatedConnectAppName?: string;
  associatedWorkspaceId?: string;
  associatedWorkspaceName?: string;
  associatedNoteId?: string;
  associatedNoteTitle?: string;
}

interface TodoWorkspaceProps {
  onNavigate?: (url: string) => void;
  currentPageUrl?: string;
  currentPageTitle?: string;
  isCompact?: boolean;
  initialPrefill?: TodoPrefill | null;
  onClearPrefill?: () => void;
}

const DEFAULT_CATEGORIES = ['Work', 'Research', 'Reading', 'Personal', 'General'];

export const TodoWorkspace: React.FC<TodoWorkspaceProps> = ({
  onNavigate,
  currentPageUrl,
  currentPageTitle,
  isCompact = false,
  initialPrefill,
  onClearPrefill,
}) => {
  const api = window.nexusAPI;

  const [todos, setTodos] = useState<NexusTodo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const quickTaskInputRef = useRef<HTMLInputElement>(null);
  const [connectApps, setConnectApps] = useState<ConnectApp[]>([]);
  const [connectWorkspaces, setConnectWorkspaces] = useState<ConnectWorkspace[]>([]);
  const [notes, setNotes] = useState<NexusNote[]>([]);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title'>('createdAt');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTodo, setEditingTodo] = useState<NexusTodo | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('General');
  const [formPriority, setFormPriority] = useState<TodoPriority>('medium');
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formUrl, setFormUrl] = useState<string>('');
  const [formUrlTitle, setFormUrlTitle] = useState<string>('');
  const [formConnectAppId, setFormConnectAppId] = useState<string>('');
  const [formWorkspaceId, setFormWorkspaceId] = useState<string>('');
  const [formNoteId, setFormNoteId] = useState<string>('');

  const loadTodos = useCallback(async () => {
    if (!api?.getTodos) {
      setLoading(false);
      setLoadError('Todo storage is unavailable.');
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const list = await api.getTodos();
      setTodos(list);
    } catch (err) {
      console.error('Failed to load todos:', err);
      setLoadError('Tasks could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadTodos();

    if (api?.getConnectApps) {
      api.getConnectApps().then(setConnectApps).catch(() => {});
    }
    if (api?.getConnectWorkspaces) {
      api.getConnectWorkspaces().then(setConnectWorkspaces).catch(() => {});
    }
    if (api?.getNotes) {
      api.getNotes().then(setNotes).catch(() => {});
    }

    if (api?.onTodosUpdated) {
      const unsubscribe = api.onTodosUpdated((updated) => {
        setTodos(updated);
      });
      return unsubscribe;
    }
    return undefined;
  }, [api, loadTodos]);

  // Handle prefill from external workspace e.g. Connect
  useEffect(() => {
    if (initialPrefill) {
      setEditingTodo(null);
      setFormTitle(initialPrefill.title || '');
      setFormDescription(initialPrefill.description || '');
      setFormCategory(initialPrefill.category || 'General');
      setFormPriority('medium');
      setFormDueDate('');
      setFormUrl(initialPrefill.associatedUrl || '');
      setFormUrlTitle(initialPrefill.associatedTitle || '');
      setFormConnectAppId(initialPrefill.associatedConnectAppId || '');
      setFormWorkspaceId(initialPrefill.associatedWorkspaceId || '');
      setFormNoteId(initialPrefill.associatedNoteId || '');
      setIsModalOpen(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [initialPrefill, onClearPrefill]);

  // Derived stats
  const activeCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  // Dynamic Categories
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    todos.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['all', ...Array.from(set)];
  }, [todos]);

  // Filtered & Sorted Todos
  const filteredTodos = useMemo(() => {
    return todos
      .filter((t) => {
        if (statusFilter === 'active' && t.completed) return false;
        if (statusFilter === 'completed' && !t.completed) return false;
        if (categoryFilter !== 'all' && t.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchUrl = t.associatedUrl?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat && !matchUrl) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'dueDate': {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
          }
          case 'priority': {
            const weights: Record<TodoPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
            return weights[b.priority] - weights[a.priority];
          }
          case 'title':
            return a.title.localeCompare(b.title);
          case 'createdAt':
          default:
            return b.createdAt - a.createdAt;
        }
      });
  }, [todos, statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  // Actions
  const handleToggleTodo = async (id: string) => {
    if (!api?.toggleTodo) return;
    try {
      const updated = await api.toggleTodo(id);
      if (updated) {
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!api?.deleteTodo) return;
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  const handleClearCompleted = async () => {
    if (!api?.clearCompletedTodos) return;
    try {
      await api.clearCompletedTodos();
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      console.error('Failed to clear completed todos:', err);
    }
  };

  const handleOpenAddModal = () => {
    setSaveError(null);
    setEditingTodo(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('General');
    setFormPriority('medium');
    setFormDueDate('');
    setFormUrl('');
    setFormUrlTitle('');
    setFormConnectAppId('');
    setFormWorkspaceId('');
    setFormNoteId('');
    setIsModalOpen(true);
  };

  const handleAddCurrentPage = () => {
    if (!currentPageUrl) return;
    setEditingTodo(null);
    setFormTitle(currentPageTitle ? `Review: ${currentPageTitle}` : `Review: ${currentPageUrl}`);
    setFormDescription('');
    setFormCategory('Reading');
    setFormPriority('medium');
    setFormDueDate('');
    setFormUrl(currentPageUrl);
    setFormUrlTitle(currentPageTitle || currentPageUrl);
    setFormConnectAppId('');
    setFormWorkspaceId('');
    setFormNoteId('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (todo: NexusTodo) => {
    setSaveError(null);
    setEditingTodo(todo);
    setFormTitle(todo.title);
    setFormDescription(todo.description || '');
    setFormCategory(todo.category || 'General');
    setFormPriority(todo.priority);
    setFormDueDate(todo.dueDate || '');
    setFormUrl(todo.associatedUrl || '');
    setFormUrlTitle(todo.associatedTitle || '');
    setFormConnectAppId(todo.associatedConnectAppId || '');
    setFormWorkspaceId(todo.associatedWorkspaceId || '');
    setFormNoteId(todo.associatedNoteId || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api?.saveTodo || !formTitle.trim() || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const selectedApp = connectApps.find((a) => a.id === formConnectAppId);
      const selectedWs = connectWorkspaces.find((w) => w.id === formWorkspaceId);
      const selectedNote = notes.find((n) => n.id === formNoteId);

      const payload: Partial<NexusTodo> & { title: string } = {
        id: editingTodo ? editingTodo.id : undefined,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory.trim() || 'General',
        priority: formPriority,
        dueDate: formDueDate || undefined,
        associatedUrl: formUrl.trim() || undefined,
        associatedTitle: formUrlTitle.trim() || undefined,
        associatedConnectAppId: selectedApp?.id,
        associatedConnectAppName: selectedApp?.name,
        associatedWorkspaceId: selectedWs?.id,
        associatedWorkspaceName: selectedWs?.name,
        associatedNoteId: selectedNote?.id,
        associatedNoteTitle: selectedNote?.title,
      };

      const saved = await api.saveTodo(payload);
      if (editingTodo) {
        setTodos((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      } else {
        setTodos((prev) => [saved, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save todo:', err);
      setSaveError('Task could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTaskTitle.trim();
    if (!api?.saveTodo || !title || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await api.saveTodo({ title, category: 'General', priority: 'medium' });
      setTodos((prev) => [saved, ...prev.filter((todo) => todo.id !== saved.id)]);
      setQuickTaskTitle('');
    } catch (err) {
      console.error('Failed to create todo:', err);
      setSaveError('Task could not be created. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentPageAddable =
    currentPageUrl &&
    !currentPageUrl.startsWith('nexus://') &&
    currentPageUrl.startsWith('http');

  return (
    <div className={`nexus-fullpage-container todo-workspace-container ${isCompact ? 'compact-mode' : ''}`}>
      <main className="todo-workspace-shell">
        <PanelHeader
          className="todo-workspace-header"
          title="NEXUS Todo"
          icon={<CheckSquare size={16} />}
          actions={(
            <>
              <Badge variant="neutral" size="sm" aria-label={`${activeCount} active, ${completedCount} completed`}>
                {activeCount} active · {completedCount} done
              </Badge>
              {isCurrentPageAddable && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Bookmark size={13} />}
                  onClick={handleAddCurrentPage}
                  title="Create task associated with active web page"
                >
                  Link Current Page
                </Button>
              )}
              {onNavigate && !isCompact && (
                <IconButton
                  icon={<ChevronLeft size={16} />}
                  aria-label="Return to NEXUS Hub"
                  tooltip="Return to NEXUS Hub"
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('nexus://hub')}
                />
              )}
            </>
          )}
        />

        <section className="todo-quick-add-section" aria-label="Add a task">
          <form className="todo-quick-add" onSubmit={handleQuickAdd}>
            <Input
              ref={quickTaskInputRef}
              size="md"
              value={quickTaskTitle}
              onChange={(event) => setQuickTaskTitle(event.target.value)}
              placeholder="What needs to get done?"
              aria-label="New task title"
              required
              maxLength={240}
            />
            <Button type="submit" variant="primary" size="md" leftIcon={<Plus size={14} />} disabled={!quickTaskTitle.trim()} isLoading={isSaving}>
              Add task
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<FileText size={14} />}
              onClick={handleOpenAddModal}
            >
              Details
            </Button>
          </form>
          {saveError && <p className="todo-inline-error" role="alert">{saveError}</p>}
        </section>

        <section className="todo-filter-panel" aria-label="Search and filter tasks">
          <div className="todo-filter-primary">
            <Tabs
              className="todo-status-tabs"
              variant="segmented"
              size="sm"
              activeTab={statusFilter}
              onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'completed')}
              tabs={[
                { id: 'all', label: `All (${todos.length})` },
                { id: 'active', label: `Active (${activeCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
              ]}
            />
            <div className="todo-search-control">
              <SearchInput
                size="sm"
                placeholder="Search tasks, descriptions, or URLs"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClear={() => setSearchQuery('')}
                aria-label="Search tasks"
              />
            </div>
            <label className="todo-sort-control">
              <ArrowUpDown size={13} aria-hidden="true" />
              <span>Sort</span>
              <Select
                size="sm"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                aria-label="Sort tasks"
                options={[
                  { value: 'createdAt', label: 'Date added' },
                  { value: 'dueDate', label: 'Due date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'title', label: 'Title' },
                ]}
              />
            </label>
          </div>

          <div className="todo-filter-groups">
            <div className="todo-filter-group" aria-label="Filter by category">
              <span className="todo-filter-label">Category</span>
              <div className="todo-filter-options">
                {categories.map((cat) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`todo-filter-chip ${isActive ? 'is-active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => setCategoryFilter(cat)}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="todo-filter-group" aria-label="Filter by priority">
              <span className="todo-filter-label">Priority</span>
              <div className="todo-filter-options">
                {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((priority) => {
                  const isActive = priorityFilter === priority;
                  return (
                    <button
                      key={priority}
                      type="button"
                      className={`todo-filter-chip ${isActive ? 'is-active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => setPriorityFilter(priority)}
                    >
                      {priority === 'all' ? 'All' : priority}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {loadError && (
          <div className="todo-load-error" role="alert">
            <span>{loadError}</span>
            <Button variant="secondary" size="xs" onClick={loadTodos}>Retry</Button>
          </div>
        )}

        {loading && todos.length === 0 ? (
          <div className="todo-state" role="status">Loading tasks…</div>
        ) : (
          <section className="todo-task-list" role="list" aria-label="Task list">
            {filteredTodos.map((todo) => (
              <TodoItemCard
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTodo}
                onNavigate={onNavigate}
              />
            ))}

            {filteredTodos.length === 0 && !loading && !loadError && (
              <div className="todo-empty-state">
                <CheckSquare size={26} aria-hidden="true" />
                <div>
                  <h3>{todos.length === 0 ? 'No tasks yet' : 'No tasks match these filters'}</h3>
                  <p>{todos.length === 0 ? 'Add a task above to get started.' : 'Try adjusting your search or filters.'}</p>
                </div>
                {todos.length === 0 && (
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={13} />} onClick={() => quickTaskInputRef.current?.focus()}>
                    Add a task
                  </Button>
                )}
              </div>
            )}
          </section>
        )}

        {completedCount > 0 && (
          <footer className="todo-footer-actions">
            <span>{completedCount} completed task{completedCount === 1 ? '' : 's'}</span>
            <Button variant="danger" size="xs" leftIcon={<Trash2 size={13} />} onClick={handleClearCompleted}>
              Clear completed
            </Button>
          </footer>
        )}
      </main>

      {/* Task Creation / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <span className="todo-modal-title">
            <CheckSquare size={16} aria-hidden="true" />
            {editingTodo ? 'Edit Task' : 'Add New Task'}
          </span>
        }
        size="md"
      >
        <form onSubmit={handleSaveModal} className="todo-modal-form">
          <div>
            <label className="todo-field-label">
              Task Title *
            </label>
            <Input
              required
              autoFocus
              placeholder="e.g. Read research paper on distributed consensus"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              size="sm"
            />
          </div>

          <div>
            <label className="todo-field-label">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add notes, key highlights, or action items..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="nexus-input todo-textarea"
            />
          </div>

          <div className="todo-form-grid todo-form-grid--three">
            <div>
              <label className="todo-field-label">
                Priority
              </label>
              <Select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as TodoPriority)}
                size="sm"
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
            </div>

            <div>
              <label className="todo-field-label">
                Category
              </label>
              <Input
                placeholder="Work, Reading, etc."
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                size="sm"
              />
            </div>

            <div>
              <label className="todo-field-label">
                Due Date
              </label>
              <Input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                size="sm"
              />
            </div>
          </div>

          {/* Page / URL Association */}
          <div className="todo-form-section">
            <div className="todo-form-section-header">
              <label className="todo-field-label todo-field-label--inline">
                <Link size={11} /> Associated Webpage URL (Optional)
              </label>
              {isCurrentPageAddable && !formUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setFormUrl(currentPageUrl);
                    setFormUrlTitle(currentPageTitle || currentPageUrl);
                  }}
                >
                  Use Active Tab
                </Button>
              )}
            </div>
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              size="sm"
            />
            {formUrl && (
              <Input
                placeholder="Page Title / Label (e.g. Technical Whitepaper)"
                value={formUrlTitle}
                onChange={(e) => setFormUrlTitle(e.target.value)}
                size="sm"
              />
            )}
          </div>

          {/* Workspace & App Linkages */}
          <div className="todo-form-section">
            <div className="todo-form-section-title">
              <Sparkles size={12} aria-hidden="true" />
              <span>NEXUS Workspace & App Linkages (Optional)</span>
            </div>

            <div className="todo-form-grid todo-form-grid--three">
              <div>
                <label className="todo-field-label todo-field-label--inline">
                  <MessageSquare size={11} aria-hidden="true" />
                  <span>Connect App</span>
                </label>
                <Select
                  value={formConnectAppId}
                  onChange={(e) => {
                    const appId = e.target.value;
                    setFormConnectAppId(appId);
                    const app = connectApps.find((a) => a.id === appId);
                    if (app && !formUrl) {
                      setFormUrl(app.url);
                      setFormUrlTitle(app.name);
                    }
                  }}
                  size="sm"
                >
                  <option value="">None</option>
                  {connectApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.category})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="todo-field-label todo-field-label--inline">
                  <Layers size={11} aria-hidden="true" />
                  <span>Workspace</span>
                </label>
                <Select
                  value={formWorkspaceId}
                  onChange={(e) => setFormWorkspaceId(e.target.value)}
                  size="sm"
                >
                  <option value="">None</option>
                  {connectWorkspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="todo-field-label todo-field-label--inline">
                  <FileText size={11} aria-hidden="true" />
                  <span>NEXUS Note</span>
                </label>
                <Select
                  value={formNoteId}
                  onChange={(e) => setFormNoteId(e.target.value)}
                  size="sm"
                >
                  <option value="">None</option>
                  {notes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title || 'Untitled Note'}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {saveError && <p className="todo-inline-error" role="alert">{saveError}</p>}
          <div className="todo-modal-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!formTitle.trim() || isSaving}
              isLoading={isSaving}
            >
              {editingTodo ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
