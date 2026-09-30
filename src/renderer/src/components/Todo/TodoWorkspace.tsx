import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NexusTodo, NexusTodoFilter, TodoPriority } from '@shared/types';
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
} from 'lucide-react';

interface TodoWorkspaceProps {
  onNavigate?: (url: string) => void;
  currentPageUrl?: string;
  currentPageTitle?: string;
  isCompact?: boolean;
}

const DEFAULT_CATEGORIES = ['Work', 'Research', 'Reading', 'Personal', 'General'];

export const TodoWorkspace: React.FC<TodoWorkspaceProps> = ({
  onNavigate,
  currentPageUrl,
  currentPageTitle,
  isCompact = false,
}) => {
  const api = window.nexusAPI;

  const [todos, setTodos] = useState<NexusTodo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

    if (api?.onTodosUpdated) {
      const unsubscribe = api.onTodosUpdated((updated) => {
        setTodos(updated);
      });
      return unsubscribe;
    }
    return undefined;
  }, [api, loadTodos]);

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
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api?.saveTodo || !formTitle.trim()) return;

    try {
      const payload: Partial<NexusTodo> & { title: string } = {
        id: editingTodo ? editingTodo.id : undefined,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory.trim() || 'General',
        priority: formPriority,
        dueDate: formDueDate || undefined,
        associatedUrl: formUrl.trim() || undefined,
        associatedTitle: formUrlTitle.trim() || undefined,
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
              <button
                className="nexus-icon-btn"
                onClick={() => onNavigate('nexus://hub')}
                title="Return to NEXUS Hub"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-accent" />
                <h1 className="text-lg font-bold text-primary tracking-tight">NEXUS Todo</h1>
                <span className="text-2xs bg-surface px-2 py-0.5 rounded-full border border-subtle font-mono text-secondary">
                  {activeCount} Active • {completedCount} Completed
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Local-first task workspace. Associate tasks with research pages or offline todos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCurrentPageAddable && (
              <button
                type="button"
                className="nexus-btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 text-accent border border-accent/30"
                onClick={handleAddCurrentPage}
                title="Create task associated with active web page"
              >
                <Bookmark size={13} />
                <span>Link Current Page</span>
              </button>
            )}

            <button
              type="button"
              className="nexus-btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-sm"
              onClick={handleOpenAddModal}
            >
              <Plus size={14} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Status Bar */}
        <div className="space-y-3 bg-surface/50 p-3.5 rounded-lg border border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded border border-subtle">
              {(['all', 'active', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`px-3 py-1 text-2xs font-semibold rounded capitalize transition-colors ${
                    statusFilter === s
                      ? 'bg-primary text-background shadow-xs font-bold'
                      : 'text-secondary hover:text-primary hover:bg-surface/80'
                  }`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s} ({s === 'all' ? todos.length : s === 'active' ? activeCount : completedCount})
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                placeholder="Search tasks, descriptions, or URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nexus-input text-xs pl-8 pr-7 py-1 w-full"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <ArrowUpDown size={12} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="nexus-input text-2xs py-1 px-2 font-medium"
              >
                <option value="createdAt">Sort by Date Added</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>

          {/* Categories & Priority Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-subtle">
            {/* Category Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <span className="text-3xs text-secondary uppercase font-semibold mr-1">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`px-2 py-0.5 text-3xs font-medium rounded-full border transition-colors capitalize ${
                    categoryFilter === cat
                      ? 'bg-accent/15 text-accent border-accent/40 font-bold'
                      : 'bg-surface text-secondary border-subtle hover:text-primary'
                  }`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1">
              <span className="text-3xs text-secondary uppercase font-semibold mr-1">Priority:</span>
              {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`px-1.5 py-0.5 text-3xs font-medium rounded border capitalize transition-colors ${
                    priorityFilter === p
                      ? 'bg-primary text-background border-primary font-bold'
                      : 'bg-surface text-secondary border-subtle hover:text-primary'
                  }`}
                  onClick={() => setPriorityFilter(p)}
                >
                  {p}
                </button>
              ))}
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
              <button
                type="button"
                className="nexus-btn-primary text-xs px-3.5 py-1.5"
                onClick={handleOpenAddModal}
              >
                Add Your First Task
              </button>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        {completedCount > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-subtle text-xs text-secondary">
            <span>{completedCount} completed task{completedCount > 1 ? 's' : ''} stored locally</span>
            <button
              type="button"
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              onClick={handleClearCompleted}
            >
              <Trash2 size={13} />
              <span>Clear Completed Tasks</span>
            </button>
          </div>
        )}
      </div>

      {/* Task Creation / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
          }}
        >
          <div className="markets-card w-full max-w-lg p-6 space-y-4 relative" role="dialog" aria-modal="true" aria-labelledby="todo-modal-title">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 id="todo-modal-title" className="font-bold text-sm text-primary flex items-center gap-2">
                <CheckSquare size={16} className="text-accent" />
                {editingTodo ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button
                type="button"
                className="nexus-icon-btn p-1 text-secondary hover:text-primary"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Read research paper on distributed consensus"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="nexus-input w-full text-xs"
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
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TodoPriority)}
                    className="nexus-input w-full text-xs capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Work, Reading, etc."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="nexus-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="nexus-input w-full text-xs font-mono"
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
                <input
                  type="url"
                  placeholder="https://example.com/article"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="nexus-input w-full text-xs font-mono"
                />
                {formUrl && (
                  <input
                    type="text"
                    placeholder="Page Title / Label (e.g. Technical Whitepaper)"
                    value={formUrlTitle}
                    onChange={(e) => setFormUrlTitle(e.target.value)}
                    className="nexus-input w-full text-xs"
                  />
                )}
                <p className="text-3xs text-secondary/70">
                  Explicit user linkage only. NEXUS never collects browser history automatically.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
                <button
                  type="button"
                  className="nexus-btn-ghost text-xs px-3.5 py-1.5"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="nexus-btn-primary text-xs px-4 py-1.5 font-semibold"
                >
                  {editingTodo ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
