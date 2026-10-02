import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ConnectApp,
  ConnectWorkspace,
  NexusNote,
  NexusTodo,
  NexusTodoFilter,
  TodoPriority,
} from '@shared/types';
import { TodoItemCard } from './TodoItemCard';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Bookmark,
  Calendar,
  Tag,
  ArrowUpDown,
  X,
  Link,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Layers,
  FileText,
} from 'lucide-react';
import { Button, IconButton, Input, SearchInput, Select, Badge, Modal, Tabs } from '../ui';

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
    if (!api?.getTodos) return;
    try {
      setLoading(true);
      const list = await api.getTodos();
      setTodos(list);
    } catch (err) {
      console.error('Failed to load todos:', err);
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
    if (!api?.saveTodo || !formTitle.trim()) return;

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
    }
  };

  const isCurrentPageAddable =
    currentPageUrl &&
    !currentPageUrl.startsWith('nexus://') &&
    currentPageUrl.startsWith('http');

  return (
    <div className={`nexus-fullpage-container todo-workspace-container ${isCompact ? 'compact-mode p-4' : 'p-6'}`}>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Workspace Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-4">
          <div className="flex items-center gap-3">
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
            <div>
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-accent" />
                <h1 className="text-base font-semibold text-primary tracking-tight">NEXUS Todo</h1>
                <Badge variant="neutral" size="sm">
                  {activeCount} Active • {completedCount} Completed
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenAddModal}
            >
              Add Task
            </Button>
          </div>
        </div>

        {/* Filter, Search & Status Bar */}
        <div className="space-y-3 bg-surface/50 p-3.5 rounded-lg border border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Tabs */}
            <Tabs
              variant="segmented"
              size="sm"
              activeTab={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              tabs={[
                { id: 'all', label: `All (${todos.length})` },
                { id: 'active', label: `Active (${activeCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
              ]}
            />

            {/* Search Input */}
            <div className="flex-1 max-w-xs">
              <SearchInput
                size="sm"
                placeholder="Search tasks, descriptions, or URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--nexus-text-secondary,#9298A8)]">
              <ArrowUpDown size={12} />
              <div className="w-44">
                <Select
                  size="sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  options={[
                    { value: 'createdAt', label: 'Sort by Date Added' },
                    { value: 'dueDate', label: 'Sort by Due Date' },
                    { value: 'priority', label: 'Sort by Priority' },
                    { value: 'title', label: 'Sort by Title' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Categories & Priority Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-subtle">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-xs text-secondary uppercase font-semibold mr-1">Category:</span>
              {categories.map((cat) => {
                const isActive = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    className="px-2.5 py-1 text-xs font-medium rounded-full border transition-colors capitalize"
                    style={{
                      backgroundColor: isActive ? 'var(--nexus-accent-dim, rgba(167, 139, 250, 0.12))' : 'var(--nexus-bg-surface, #12151D)',
                      color: isActive ? 'var(--nexus-accent-primary, #A78BFA)' : 'var(--nexus-text-secondary, #9298A8)',
                      borderColor: isActive ? 'var(--nexus-accent-primary, #A78BFA)' : 'var(--nexus-border-subtle, #1C202C)',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-secondary uppercase font-semibold mr-1">Priority:</span>
              {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => {
                const isActive = priorityFilter === p;
                return (
                  <button
                    key={p}
                    type="button"
                    className="px-2.5 py-1 text-xs font-medium rounded border capitalize transition-colors"
                    style={{
                      backgroundColor: isActive ? 'var(--nexus-accent-dim, rgba(167, 139, 250, 0.12))' : 'var(--nexus-bg-surface, #12151D)',
                      color: isActive ? 'var(--nexus-accent-primary, #A78BFA)' : 'var(--nexus-text-secondary, #9298A8)',
                      borderColor: isActive ? 'var(--nexus-accent-primary, #A78BFA)' : 'var(--nexus-border-subtle, #1C202C)',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    onClick={() => setPriorityFilter(p)}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task List Section */}
        <div className="space-y-2" role="list" aria-label="Task list">
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

          {/* Empty State */}
          {filteredTodos.length === 0 && !loading && (
            <div className="text-center py-12 px-4 border border-subtle rounded-lg bg-surface/30 space-y-3">
              <CheckSquare size={32} className="mx-auto text-secondary/40" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-primary">No tasks match your filter</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try clearing your filters or search query to see more tasks.'
                    : 'Your workspace is clear. Create a task or link a webpage to get started.'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={handleOpenAddModal}
              >
                Add Your First Task
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        {completedCount > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-subtle text-xs text-secondary">
            <span>{completedCount} completed task{completedCount > 1 ? 's' : ''} stored locally</span>
            <Button
              variant="danger"
              size="xs"
              leftIcon={<Trash2 size={13} />}
              onClick={handleClearCompleted}
            >
              Clear Completed Tasks
            </Button>
          </div>
        )}
      </div>

      {/* Task Creation / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <CheckSquare size={16} className="text-accent" />
            {editingTodo ? 'Edit Task' : 'Add New Task'}
          </span>
        }
        size="md"
      >
        <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
          <div>
            <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
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
            <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add notes, key highlights, or action items..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="nexus-input w-full text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
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
              <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
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
              <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
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
          <div className="p-3 bg-surface/50 rounded border border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-secondary text-2xs font-semibold uppercase tracking-wider flex items-center gap-1">
                <Link size={11} /> Associated Webpage URL (Optional)
              </label>
              {isCurrentPageAddable && !formUrl && (
                <button
                  type="button"
                  className="text-3xs text-accent hover:underline"
                  onClick={() => {
                    setFormUrl(currentPageUrl);
                    setFormUrlTitle(currentPageTitle || currentPageUrl);
                  }}
                >
                  Use Active Tab
                </button>
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
            <p className="text-3xs text-secondary/70">
              Explicit user linkage only. NEXUS never collects browser history automatically.
            </p>
          </div>

          {/* Workspace & App Linkages */}
          <div className="p-3 bg-surface/50 rounded border border-subtle space-y-3">
            <div className="text-secondary text-2xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-accent" />
              <span>NEXUS Workspace & App Linkages (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-secondary text-3xs mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={10} className="text-indigo-400" />
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
                <label className="block text-secondary text-3xs mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Layers size={10} className="text-accent" />
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
                <label className="block text-secondary text-3xs mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <FileText size={10} className="text-blue-400" />
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

          <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
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
            >
              {editingTodo ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
