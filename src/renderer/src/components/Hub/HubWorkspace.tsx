import React, { useState, useEffect, useCallback } from 'react';
import {
  BookmarkItem,
  ConnectApp,
  DownloadRecord,
  HistoryEntry,
  HubCardId,
  HubPreferences,
  HubShortcut,
  NexusNote,
  NexusTodo,
  StockWatchlistItem,
} from '@shared/types';
import { HubCard } from './HubCard';
import * as Icons from 'lucide-react';
import {
  LayoutGrid,
  CheckSquare,
  Bookmark,
  Download,
  FileText,
  TrendingUp,
  Compass,
  Shield,
  Code2,
  Settings,
  Plus,
  Sliders,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Trash2,
  RotateCcw,
  Sparkles,
  Zap,
  Globe,
  X,
  Check,
  MessageSquare,
  Music,
} from 'lucide-react';
import { Button, IconButton, Badge } from '../ui';

const renderConnectIcon = (iconName?: string, size = 13) => {
  if (!iconName) return null;
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
  if (IconComponent) {
    return <IconComponent size={size} className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />;
  }
  return null;
};

interface HubWorkspaceProps {
  onNavigate?: (url: string) => void;
  onOpenSettings?: () => void;
}

const DEFAULT_CARD_LABELS: Record<HubCardId, { title: string; icon: React.ReactNode }> = {
  tools: { title: 'NEXUS Utilities', icon: <Compass size={15} /> },
  connect: { title: 'NEXUS Connect', icon: <MessageSquare size={15} /> },
  todos: { title: 'Active Tasks', icon: <CheckSquare size={15} /> },
  shortcuts: { title: 'Saved Shortcuts', icon: <Globe size={15} /> },
  bookmarks: { title: 'Recent Bookmarks', icon: <Bookmark size={15} /> },
  downloads: { title: 'Recent Downloads', icon: <Download size={15} /> },
  notes: { title: 'Recent Notes', icon: <FileText size={15} /> },
  watchlists: { title: 'Market Watchlist', icon: <TrendingUp size={15} /> },
};

export const HubWorkspace: React.FC<HubWorkspaceProps> = ({
  onNavigate,
  onOpenSettings,
}) => {
  const api = window.nexusAPI;

  const [preferences, setPreferences] = useState<HubPreferences | null>(null);
  const [connectApps, setConnectApps] = useState<ConnectApp[]>([]);
  const [todos, setTodos] = useState<NexusTodo[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [notes, setNotes] = useState<NexusNote[]>([]);
  const [watchlist, setWatchlist] = useState<StockWatchlistItem[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);

  // Modals
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
  const [isAddShortcutOpen, setIsAddShortcutOpen] = useState<boolean>(false);
  const [newShortcutTitle, setNewShortcutTitle] = useState<string>('');
  const [newShortcutUrl, setNewShortcutUrl] = useState<string>('');
  const [newShortcutCategory, setNewShortcutCategory] = useState<string>('Custom');

  const loadData = useCallback(async () => {
    if (!api) return;
    try {
      if (api.getHubPreferences) {
        const prefs = await api.getHubPreferences();
        setPreferences(prefs);
      }
      if (api.getConnectApps) {
        const apps = await api.getConnectApps();
        setConnectApps(apps);
      }
      if (api.getTodos) {
        const t = await api.getTodos({ status: 'active' });
        setTodos(t.slice(0, 5));
      }
      if (api.getBookmarks) {
        const b = await api.getBookmarks();
        setBookmarks(b.filter((item) => item.type === 'bookmark').slice(0, 5));
      }
      if (api.getDownloads) {
        const d = await api.getDownloads();
        setDownloads(d.slice(0, 5));
      }
      if (api.getNotes) {
        const n = await api.getNotes();
        setNotes(n.slice(0, 5));
      }
      if (api.getStockWatchlist) {
        const w = await api.getStockWatchlist();
        setWatchlist(w.slice(0, 5));
      }
      if (api.getHistory) {
        const h = await api.getHistory(6);
        setRecentHistory(h);
      }
    } catch (err) {
      console.error('Failed to load Hub data:', err);
    }
  }, [api]);

  useEffect(() => {
    loadData();

    const cleanups: (() => void)[] = [];

    if (api?.onTodosUpdated) {
      const unsub = api.onTodosUpdated((updated) => {
        setTodos(updated.filter((t) => !t.completed).slice(0, 5));
      });
      cleanups.push(unsub);
    }
    if (api?.onConnectUpdated) {
      const unsub = api.onConnectUpdated((state) => {
        setConnectApps(state.apps);
      });
      cleanups.push(unsub);
    }
    if (api?.onHistoryUpdated) {
      const unsub = api.onHistoryUpdated((hist) => {
        setRecentHistory(hist.slice(0, 6));
      });
      cleanups.push(unsub);
    }

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [api, loadData]);

  // Card Reordering & Visibility Handlers
  const handleMoveCard = async (index: number, direction: 'up' | 'down') => {
    if (!preferences || !api?.updateHubPreferences) return;
    const order = [...preferences.cardOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;

    const temp = order[index];
    order[index] = order[targetIdx];
    order[targetIdx] = temp;

    const updated = await api.updateHubPreferences({ cardOrder: order });
    setPreferences(updated);
  };

  const handleToggleHideCard = async (cardId: HubCardId) => {
    if (!preferences || !api?.updateHubPreferences) return;
    const hidden = preferences.hiddenCards.includes(cardId)
      ? preferences.hiddenCards.filter((c) => c !== cardId)
      : [...preferences.hiddenCards, cardId];

    const updated = await api.updateHubPreferences({ hiddenCards: hidden });
    setPreferences(updated);
  };

  const handleResetLayout = async () => {
    if (!api?.updateHubPreferences) return;
    const defaultOrder: HubCardId[] = [
      'tools',
      'connect',
      'todos',
      'shortcuts',
      'bookmarks',
      'downloads',
      'notes',
      'watchlists',
    ];
    const updated = await api.updateHubPreferences({
      cardOrder: defaultOrder,
      hiddenCards: [],
    });
    setPreferences(updated);
  };

  const handleAddShortcut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcutTitle.trim() || !newShortcutUrl.trim() || !api?.updateHubPreferences || !preferences) return;

    let url = newShortcutUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('nexus://')) {
      url = 'https://' + url;
    }

    const newShortcut: HubShortcut = {
      id: `sc-${Date.now()}`,
      title: newShortcutTitle.trim(),
      url,
      category: newShortcutCategory.trim() || 'Custom',
    };

    const updated = await api.updateHubPreferences({
      customShortcuts: [newShortcut, ...preferences.customShortcuts],
    });
    setPreferences(updated);
    setIsAddShortcutOpen(false);
    setNewShortcutTitle('');
    setNewShortcutUrl('');
  };

  const handleDeleteShortcut = async (id: string) => {
    if (!preferences || !api?.updateHubPreferences) return;
    const updated = await api.updateHubPreferences({
      customShortcuts: preferences.customShortcuts.filter((s) => s.id !== id),
    });
    setPreferences(updated);
  };

  const handleToggleTodo = async (id: string) => {
    if (!api?.toggleTodo) return;
    await api.toggleTodo(id);
    const updated = await api.getTodos({ status: 'active' });
    setTodos(updated.slice(0, 5));
  };

  const cardOrder = preferences?.cardOrder || [
    'tools',
    'connect',
    'todos',
    'shortcuts',
    'bookmarks',
    'downloads',
    'notes',
    'watchlists',
  ];
  const hiddenCards = preferences?.hiddenCards || [];
  const visibleCards = cardOrder.filter((id) => !hiddenCards.includes(id));

  return (
    <div className="nexus-fullpage-container hub-workspace-container">
      <div className="hub-content-wrap">
        {/* Hub Header & Quick Action Launchpad */}
        <div className="hub-header">
          <div className="hub-header-title-group">
            <div className="hub-header-title-row">
              <LayoutGrid size={22} className="text-accent" />
              <h1 className="hub-header-title">NEXUS Hub</h1>
            </div>
            <p className="hub-header-desc">
              Instant access to browser tools, notes, active tasks, downloads, and market watchlists.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sliders size={13} />}
              onClick={() => setIsCustomizeOpen(true)}
              title="Rearrange or hide Hub cards"
            >
              Customize Cards
            </Button>
          </div>
        </div>

        {/* Quick Utilities Action Bar */}
        <div className="hub-section-box">
          <div className="hub-section-header">
            <h2 className="hub-section-title">
              <Sparkles size={13} className="text-accent" />
              <span>Frequently Used Utilities</span>
            </h2>
          </div>

          <div className="hub-utilities-grid">
            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://newtab')}
              title="Open a new browser tab"
            >
              <div className="hub-utility-icon">
                <Plus size={18} />
              </div>
              <span className="hub-utility-label">New Tab</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://connect')}
              title="Open NEXUS Connect app launcher"
            >
              <div className="hub-utility-icon">
                <MessageSquare size={18} />
              </div>
              <span className="hub-utility-label">NEXUS Connect</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://music')}
              title="Open NEXUS Music hub"
            >
              <div className="hub-utility-icon">
                <Music size={18} />
              </div>
              <span className="hub-utility-label">NEXUS Music</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://todo')}
              title="Open NEXUS Todo workspace"
            >
              <div className="hub-utility-icon">
                <CheckSquare size={18} />
              </div>
              <span className="hub-utility-label">NEXUS Todo</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://notes')}
              title="Open NEXUS Notes"
            >
              <div className="hub-utility-icon">
                <FileText size={18} />
              </div>
              <span className="hub-utility-label">NEXUS Notes</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://shield')}
              title="Open NEXUS Shield security center"
            >
              <div className="hub-utility-icon">
                <Shield size={18} />
              </div>
              <span className="hub-utility-label">NEXUS Shield</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://explore')}
              title="Open NEXUS Explore dictionary and tools"
            >
              <div className="hub-utility-icon">
                <Compass size={18} />
              </div>
              <span className="hub-utility-label">NEXUS Explore</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://markets')}
              title="Open NEXUS Markets overview"
            >
              <div className="hub-utility-icon">
                <TrendingUp size={18} />
              </div>
              <span className="hub-utility-label">NEXUS Markets</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={() => onNavigate && onNavigate('nexus://dev')}
              title="Open NEXUS Developer Tools"
            >
              <div className="hub-utility-icon">
                <Code2 size={18} />
              </div>
              <span className="hub-utility-label">DevTools</span>
            </button>

            <button
              type="button"
              className="hub-utility-item"
              onClick={onOpenSettings}
              title="Open Browser Settings"
            >
              <div className="hub-utility-icon text-secondary">
                <Settings size={18} />
              </div>
              <span className="hub-utility-label">Settings</span>
            </button>
          </div>
        </div>

        {/* Continue where you left off */}
        <div className="hub-section-box">
          <div className="hub-section-header">
            <h2 className="hub-section-title">
              <Clock size={12} className="text-accent" />
              <span>Continue where you left off</span>
            </h2>
            {recentHistory.length > 0 && (
              <span className="text-3xs text-secondary font-mono">{recentHistory.length} recent</span>
            )}
          </div>

          {recentHistory.length > 0 ? (
            <div className="hub-continue-grid">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate && onNavigate(item.url)}
                  className="hub-continue-item group"
                  title={item.title || item.url}
                >
                  <div className="hub-continue-left">
                    <Globe size={14} className="text-secondary group-hover:text-accent shrink-0 transition-colors" />
                    <div className="hub-continue-text">
                      <div className="hub-continue-title">{item.title || item.url}</div>
                      <div className="hub-continue-url">{item.url}</div>
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-secondary/60 group-hover:text-primary shrink-0 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-secondary text-2xs flex flex-col items-center justify-center gap-1">
              <Clock size={16} className="text-secondary/40" />
              <span>No recent activity</span>
              <span className="text-3xs text-muted">Web pages you visit will appear here locally.</span>
            </div>
          )}
        </div>

        {/* Dynamic Rearrangeable Cards Grid */}
        <div className="hub-cards-grid">
          {visibleCards.map((cardId, index) => {
            const meta = DEFAULT_CARD_LABELS[cardId];
            if (!meta) return null;
            const isFirst = index === 0;
            const isLast = index === visibleCards.length - 1;

            switch (cardId) {
              // NEXUS Connect Card
              case 'connect': {
                const favoriteApps = connectApps.filter((a) => a.isFavorite);
                const displayApps = favoriteApps.length > 0 ? favoriteApps.slice(0, 6) : connectApps.slice(0, 6);
                return (
                  <HubCard
                    key="connect"
                    id="connect"
                    title={meta.title}
                    icon={meta.icon}
                    badge={
                      connectApps.length > 0 ? (
                        <Badge variant="neutral" size="sm">
                          {connectApps.length} Apps
                        </Badge>
                      ) : null
                    }
                    actionText="Open Connect"
                    onAction={() => onNavigate && onNavigate('nexus://connect')}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('connect')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    {displayApps.length > 0 ? (
                      <div className="hub-apps-grid">
                        {displayApps.map((app) => (
                          <div
                            key={app.id}
                            onClick={() => onNavigate && onNavigate(app.url)}
                            className="hub-connect-app flex items-center gap-2 p-2 rounded bg-surface/50 border border-subtle hover:border-accent/40 hover:bg-surface cursor-pointer transition-all group"
                          >
                            <div className="hub-connect-icon flex items-center justify-center text-accent">
                              {renderConnectIcon(app.icon, 13) || app.name.charAt(0)}
                            </div>
                            <div className="hub-connect-copy truncate flex-1">
                              <div className="hub-connect-name text-xs text-primary truncate flex items-center gap-1">
                                <span className="truncate">{app.name}</span>
                                {app.isFavorite && <span className="hub-connect-favorite">★</span>}
                              </div>
                              <div className="hub-connect-category text-3xs text-secondary capitalize truncate">{app.category}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hub-empty-state h-full flex flex-col items-center justify-center text-center p-3 text-secondary text-2xs space-y-1">
                        <MessageSquare size={20} className="text-secondary/40" />
                        <div>No Connect apps available.</div>
                        <button
                          className="text-accent hover:underline text-3xs font-semibold"
                          onClick={() => onNavigate && onNavigate('nexus://connect')}
                        >
                          Open NEXUS Connect
                        </button>
                      </div>
                    )}
                  </HubCard>
                );
              }

              // 1. Tools Card
              case 'tools':
                return (
                  <HubCard
                    key="tools"
                    id="tools"
                    title={meta.title}
                    icon={meta.icon}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('tools')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    <div className="hub-tool-list space-y-1.5 text-xs">
                      {[
                        { name: 'NEXUS Notes', url: 'nexus://notes', desc: 'Notebooks & Rich Docs' },
                        { name: 'NEXUS Markets', url: 'nexus://markets', desc: 'Stocks, IPOs & Shopping' },
                        { name: 'NEXUS Shield', url: 'nexus://shield', desc: 'Threat & Tracker Protection' },
                        { name: 'NEXUS Explore', url: 'nexus://explore', desc: 'Dictionary & ECB Rates' },
                      ].map((tool) => (
                        <div
                          key={tool.name}
                          onClick={() => onNavigate && onNavigate(tool.url)}
                          className="hub-tool-row flex items-center justify-between p-2 rounded hover:bg-surface cursor-pointer border border-transparent hover:border-subtle transition-all"
                        >
                          <div className="hub-tool-copy">
                            <div className="font-semibold text-primary">{tool.name}</div>
                            <div className="text-3xs text-secondary">{tool.desc}</div>
                          </div>
                          <ChevronRight size={13} className="text-secondary" />
                        </div>
                      ))}
                    </div>
                  </HubCard>
                );

              // 2. Active Tasks Card
              case 'todos':
                return (
                  <HubCard
                    key="todos"
                    id="todos"
                    title={meta.title}
                    icon={meta.icon}
                    badge={
                      todos.length > 0 ? (
                        <Badge variant="neutral" size="sm">
                          {todos.length} Active
                        </Badge>
                      ) : null
                    }
                    actionText="Open Workspace"
                    onAction={() => onNavigate && onNavigate('nexus://todo')}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('todos')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    {todos.length > 0 ? (
                      <div className="hub-task-list space-y-1.5">
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            className="hub-task-row flex items-center gap-2 p-1.5 rounded hover:bg-surface transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => handleToggleTodo(todo.id)}
                              className="rounded border-subtle text-accent focus:ring-0 shrink-0"
                            />
                            <span className="hub-task-title text-xs text-primary truncate flex-1">{todo.title}</span>
                            {todo.category && (
                              <span className="hub-task-category text-3xs text-secondary bg-surface px-1.5 py-0.5 rounded border border-subtle">
                                {todo.category}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hub-empty-state h-full flex flex-col items-center justify-center text-center p-3 text-secondary text-2xs space-y-1">
                        <CheckSquare size={20} className="text-secondary/40" />
                        <div>No active tasks.</div>
                        <button
                          className="text-accent hover:underline text-3xs font-semibold"
                          onClick={() => onNavigate && onNavigate('nexus://todo')}
                        >
                          + Create a new task
                        </button>
                      </div>
                    )}
                  </HubCard>
                );

              // 3. Saved Shortcuts Card
              case 'shortcuts':
                return (
                  <HubCard
                    key="shortcuts"
                    id="shortcuts"
                    title={meta.title}
                    icon={meta.icon}
                    actionText="+ Add Shortcut"
                    onAction={() => setIsAddShortcutOpen(true)}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('shortcuts')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    <div className="hub-shortcuts-grid">
                      {preferences?.customShortcuts.map((sc) => (
                        <div
                          key={sc.id}
                          className="hub-shortcut-item group/sc flex items-center justify-between p-2 rounded bg-surface/50 border border-subtle hover:border-accent/40 transition-colors"
                        >
                          <button
                            type="button"
                            className="hub-shortcut-open text-left truncate flex-1"
                            onClick={() => onNavigate && onNavigate(sc.url)}
                            title={sc.url}
                          >
                            <div className="hub-shortcut-title truncate">{sc.title}</div>
                            <div className="hub-shortcut-category truncate">{sc.category}</div>
                          </button>
                          <IconButton
                            variant="ghost"
                            size="xs"
                            className="opacity-0 group-hover/sc:opacity-100 text-secondary hover:text-red-400"
                            onClick={() => handleDeleteShortcut(sc.id)}
                            icon={<Trash2 size={12} />}
                            aria-label="Delete shortcut"
                          />
                        </div>
                      ))}
                    </div>
                  </HubCard>
                );

              // 4. Bookmarks Card
              case 'bookmarks':
                return (
                  <HubCard
                    key="bookmarks"
                    id="bookmarks"
                    title={meta.title}
                    icon={meta.icon}
                    actionText="All Bookmarks"
                    onAction={() => onNavigate && onNavigate('nexus://bookmarks')}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('bookmarks')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    {bookmarks.length > 0 ? (
                      <div className="hub-bookmark-list space-y-1">
                        {bookmarks.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => b.url && onNavigate && onNavigate(b.url)}
                            className="hub-bookmark-row flex items-center gap-2 p-1.5 rounded hover:bg-surface cursor-pointer text-xs transition-colors"
                          >
                            <Bookmark size={12} className="text-accent shrink-0" />
                            <span className="text-primary truncate flex-1">{b.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hub-empty-state h-full flex flex-col items-center justify-center text-center p-3 text-secondary text-2xs space-y-1">
                        <Bookmark size={20} className="text-secondary/40" />
                        <div>No bookmarks added yet.</div>
                        <span className="text-3xs text-muted">Use Ctrl+D to bookmark any webpage.</span>
                      </div>
                    )}
                  </HubCard>
                );

              // 5. Recent Downloads Card
              case 'downloads':
                return (
                  <HubCard
                    key="downloads"
                    id="downloads"
                    title={meta.title}
                    icon={meta.icon}
                    actionText="Downloads"
                    onAction={() => onNavigate && onNavigate('nexus://downloads')}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('downloads')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    {downloads.length > 0 ? (
                      <div className="hub-download-list space-y-1.5">
                        {downloads.map((d) => (
                          <div
                            key={d.id}
                            className="hub-download-row flex items-center justify-between p-1.5 rounded hover:bg-surface text-xs"
                          >
                            <div className="hub-download-name flex items-center gap-2 truncate">
                              <Download size={12} className="text-accent shrink-0" />
                              <span className="text-primary truncate">{d.filename}</span>
                            </div>
                            <span className="hub-download-status text-3xs text-secondary font-mono">{d.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hub-empty-state h-full flex flex-col items-center justify-center text-center p-3 text-secondary text-2xs space-y-1">
                        <Download size={20} className="text-secondary/40" />
                        <div>No recent downloads.</div>
                      </div>
                    )}
                  </HubCard>
                );

              // 6. Recent Notes Card
              case 'notes':
                return (
                  <HubCard
                    key="notes"
                    id="notes"
                    title={meta.title}
                    icon={meta.icon}
                    actionText="NEXUS Notes"
                    onAction={() => onNavigate && onNavigate('nexus://notes')}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('notes')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    {notes.length > 0 ? (
                      <div className="hub-note-list space-y-1">
                        {notes.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => onNavigate && onNavigate('nexus://notes')}
                            className="hub-note-row flex items-center justify-between p-1.5 rounded hover:bg-surface cursor-pointer text-xs"
                          >
                            <div className="hub-note-title flex items-center gap-2 truncate">
                              <FileText size={12} className="text-blue-400 shrink-0" />
                              <span className="text-primary truncate">{n.title || 'Untitled Note'}</span>
                            </div>
                            <span className="hub-note-date text-3xs text-secondary font-mono">
                              {new Date(n.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hub-empty-state h-full flex flex-col items-center justify-center text-center p-3 text-secondary text-2xs space-y-1">
                        <FileText size={20} className="text-secondary/40" />
                        <div>No notes created yet.</div>
                        <button
                          className="text-accent hover:underline text-3xs font-semibold"
                          onClick={() => onNavigate && onNavigate('nexus://notes')}
                        >
                          + Create first note
                        </button>
                      </div>
                    )}
                  </HubCard>
                );

              // 7. Watchlists Card
              case 'watchlists':
                return (
                  <HubCard
                    key="watchlists"
                    id="watchlists"
                    title={meta.title}
                    icon={meta.icon}
                    actionText="Markets Hub"
                    onAction={() => onNavigate && onNavigate('nexus://markets')}
                    onMoveUp={() => handleMoveCard(index, 'up')}
                    onMoveDown={() => handleMoveCard(index, 'down')}
                    onHide={() => handleToggleHideCard('watchlists')}
                    isFirst={isFirst}
                    isLast={isLast}
                  >
                    {watchlist.length > 0 ? (
                      <div className="hub-watchlist-list space-y-1">
                        {watchlist.map((w) => (
                          <div
                            key={w.ticker}
                            onClick={() => onNavigate && onNavigate('nexus://markets')}
                            className="hub-watchlist-row flex items-center justify-between p-1.5 rounded hover:bg-surface cursor-pointer text-xs"
                          >
                            <div className="hub-watchlist-identity">
                              <span className="hub-watchlist-ticker font-mono font-bold text-primary">{w.ticker}</span>
                              <span className="hub-watchlist-company text-3xs text-secondary truncate">{w.name}</span>
                            </div>
                            <span className="text-2xs text-secondary uppercase font-mono">{w.exchange}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hub-empty-state h-full flex flex-col items-center justify-center text-center p-3 text-secondary text-2xs space-y-1">
                        <TrendingUp size={20} className="text-secondary/40" />
                        <div>Watchlist empty.</div>
                        <button
                          className="text-accent hover:underline text-3xs font-semibold"
                          onClick={() => onNavigate && onNavigate('nexus://markets')}
                        >
                          Explore Stocks in Markets
                        </button>
                      </div>
                    )}
                  </HubCard>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>

      {/* Customize Cards Drawer / Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="markets-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Sliders size={16} className="text-accent" /> Customize Hub Cards
              </h3>
              <IconButton
                variant="ghost"
                size="sm"
                icon={<X size={15} />}
                onClick={() => setIsCustomizeOpen(false)}
                aria-label="Close"
              />
            </div>

            <p className="text-xs text-secondary">
              Toggle card visibility and reorder how sections appear in your central NEXUS Hub.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {cardOrder.map((id, index) => {
                const isHidden = hiddenCards.includes(id);
                const meta = DEFAULT_CARD_LABELS[id];
                if (!meta) return null;

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2.5 bg-surface/50 rounded border border-subtle text-xs"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => handleToggleHideCard(id)}
                        className="rounded border-subtle text-accent focus:ring-0"
                      />
                      <span className="font-medium text-primary flex items-center gap-1.5">
                        {meta.icon}
                        <span>{meta.title}</span>
                      </span>
                    </label>

                    <div className="flex items-center gap-1">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        disabled={index === 0}
                        icon={<ChevronUp size={13} />}
                        onClick={() => handleMoveCard(index, 'up')}
                        aria-label="Move Up"
                      />
                      <IconButton
                        variant="ghost"
                        size="xs"
                        disabled={index === cardOrder.length - 1}
                        icon={<ChevronDown size={13} />}
                        onClick={() => handleMoveCard(index, 'down')}
                        aria-label="Move Down"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-subtle text-xs">
              <Button
                variant="ghost"
                size="xs"
                onClick={handleResetLayout}
                leftIcon={<RotateCcw size={12} />}
              >
                Reset to Default Layout
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCustomizeOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shortcut Modal */}
      {isAddShortcutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="markets-card w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 className="font-bold text-sm text-primary">Add Saved Shortcut</h3>
              <IconButton
                variant="ghost"
                size="sm"
                icon={<X size={15} />}
                onClick={() => setIsAddShortcutOpen(false)}
                aria-label="Close"
              />
            </div>

            <form onSubmit={handleAddShortcut} className="space-y-3 text-xs">
              <div>
                <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
                  Shortcut Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Linear"
                  value={newShortcutTitle}
                  onChange={(e) => setNewShortcutTitle(e.target.value)}
                  className="nexus-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
                  URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={newShortcutUrl}
                  onChange={(e) => setNewShortcutUrl(e.target.value)}
                  className="nexus-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-secondary text-2xs mb-1 font-semibold uppercase tracking-wider">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Work, Dev, etc."
                  value={newShortcutCategory}
                  onChange={(e) => setNewShortcutCategory(e.target.value)}
                  className="nexus-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddShortcutOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Add Shortcut
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
