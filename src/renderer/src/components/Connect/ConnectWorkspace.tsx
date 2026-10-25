import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConnectApp, ConnectCategory, ConnectWorkspace as IConnectWorkspace, NexusTodo } from '@shared/types';
import { ConnectAppCard } from './ConnectAppCard';
import { ConnectAppLogo } from './ConnectAppLogos';
import {
  Share2,
  Plus,
  Layers,
  Star,
  RotateCcw,
  X,
  Trash2,
  Edit3,
  FolderPlus,
  Play,
} from 'lucide-react';
import { Button, IconButton, Badge, Tabs, SearchInput } from '../ui';

interface ConnectWorkspaceProps {
  onNavigate?: (url: string) => void;
  onOpenTab?: (url: string, pinned?: boolean) => void;
  onAddTodo?: (app: ConnectApp, workspace?: IConnectWorkspace) => void;
  onOpenTodoWithLink?: (todoData: Partial<NexusTodo>) => void;
  initialCategory?: string;
  initialWorkspaceId?: string;
}

export const ConnectWorkspace: React.FC<ConnectWorkspaceProps> = ({
  onNavigate,
  onOpenTab,
  onAddTodo,
  onOpenTodoWithLink,
  initialCategory = 'all',
  initialWorkspaceId,
}) => {
  const api = window.nexusAPI;

  const [apps, setApps] = useState<ConnectApp[]>([]);
  const [workspaces, setWorkspaces] = useState<IConnectWorkspace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<string>(initialWorkspaceId ? `ws:${initialWorkspaceId}` : initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // App Modal State (Add / Edit)
  const [isAppModalOpen, setIsAppModalOpen] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<ConnectApp | null>(null);
  const [appName, setAppName] = useState<string>('');
  const [appUrl, setAppUrl] = useState<string>('');
  const [appCategory, setAppCategory] = useState<ConnectCategory>('work');
  const [appIcon, setAppIcon] = useState<string>('Globe');
  const [appDescription, setAppDescription] = useState<string>('');
  const [appIsFavorite, setAppIsFavorite] = useState<boolean>(false);
  const [appFormError, setAppFormError] = useState<string | null>(null);

  // Workspace Modal State (Create / Edit)
  const [isWsModalOpen, setIsWsModalOpen] = useState<boolean>(false);
  const [editingWs, setEditingWs] = useState<IConnectWorkspace | null>(null);
  const [wsName, setWsName] = useState<string>('');
  const [wsDescription, setWsDescription] = useState<string>('');
  const [wsSelectedAppIds, setWsSelectedAppIds] = useState<string[]>([]);
  const [wsFormError, setWsFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      if (api.getConnectApps) {
        const appList = await api.getConnectApps();
        setApps(appList);
      }
      if (api.getConnectWorkspaces) {
        const wsList = await api.getConnectWorkspaces();
        setWorkspaces(wsList);
      }
    } catch (err) {
      console.error('Failed to load Connect data:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();

    if (api?.onConnectUpdated) {
      const unsub = api.onConnectUpdated((data) => {
        if (data.apps) setApps(data.apps);
        if (data.workspaces) setWorkspaces(data.workspaces);
      });
      return unsub;
    }
    return undefined;
  }, [api, loadData]);

  // Derived active workspace if a workspace tab is selected
  const activeWorkspace = useMemo(() => {
    if (activeTab.startsWith('ws:')) {
      const wsId = activeTab.replace('ws:', '');
      return workspaces.find((w) => w.id === wsId) || null;
    }
    return null;
  }, [activeTab, workspaces]);

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // 1. Favorites filter
      if (onlyFavorites && !app.isFavorite) return false;

      // 2. Tab Filter (Category vs Workspace)
      if (activeWorkspace) {
        if (!activeWorkspace.appIds.includes(app.id)) return false;
      } else if (activeTab !== 'all') {
        if (app.category.toLowerCase() !== activeTab.toLowerCase()) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = app.name.toLowerCase().includes(q);
        const matchCat = app.category.toLowerCase().includes(q);
        const matchDesc = app.description?.toLowerCase().includes(q);
        const matchUrl = app.url.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc && !matchUrl) return false;
      }

      return true;
    });
  }, [apps, activeTab, activeWorkspace, onlyFavorites, searchQuery]);

  // Handlers for App Execution
  const handleOpenApp = (app: ConnectApp, pinned = false) => {
    if (onOpenTab) {
      onOpenTab(app.url, pinned);
    } else if (onNavigate) {
      onNavigate(app.url);
    } else {
      window.open(app.url, '_blank');
    }
    // Record tool usage
    if (api?.recordToolUsage) {
      api.recordToolUsage('connect');
    }
  };

  const handleToggleFavorite = async (app: ConnectApp) => {
    if (!api?.saveConnectApp) return;
    try {
      const updated = await api.saveConnectApp({
        id: app.id,
        name: app.name,
        url: app.url,
        isFavorite: !app.isFavorite,
      });
      setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Add Todo Integration
  const handleAddTodoForApp = (app: ConnectApp) => {
    if (onAddTodo) {
      onAddTodo(app, activeWorkspace || undefined);
    } else if (onOpenTodoWithLink) {
      const wsTitle = activeWorkspace ? activeWorkspace.name : undefined;
      const todoPayload: Partial<NexusTodo> = {
        title: `Prepare for ${app.name}`,
        category: app.category === 'work' ? 'Work' : app.category === 'create' ? 'Project' : 'Personal',
        associatedUrl: app.url,
        associatedTitle: app.name,
        associatedConnectAppId: app.id,
        associatedConnectAppName: app.name,
        associatedWorkspaceId: activeWorkspace ? activeWorkspace.id : undefined,
        associatedWorkspaceName: wsTitle,
      };
      onOpenTodoWithLink(todoPayload);
    } else if (onNavigate) {
      onNavigate('nexus://todo');
    }
  };

  // App Modal Actions
  const handleOpenAddAppModal = () => {
    setEditingApp(null);
    setAppName('');
    setAppUrl('');
    setAppCategory(activeWorkspace ? 'work' : activeTab === 'all' ? 'work' : (activeTab as ConnectCategory));
    setAppIcon('Globe');
    setAppDescription('');
    setAppIsFavorite(false);
    setAppFormError(null);
    setIsAppModalOpen(true);
  };

  const handleOpenEditAppModal = (app: ConnectApp) => {
    setEditingApp(app);
    setAppName(app.name);
    setAppUrl(app.url);
    setAppCategory(app.category);
    setAppIcon(app.icon || 'Globe');
    setAppDescription(app.description || '');
    setAppIsFavorite(!!app.isFavorite);
    setAppFormError(null);
    setIsAppModalOpen(true);
  };

  const handleSaveAppForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppFormError(null);

    if (!appName.trim()) {
      setAppFormError('Application name is required');
      return;
    }

    if (!appUrl.trim()) {
      setAppFormError('Application URL is required');
      return;
    }

    // Strict URL validation
    let formattedUrl = appUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const parsed = new URL(formattedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setAppFormError('Only HTTP and HTTPS URLs are permitted');
        return;
      }
    } catch {
      setAppFormError('Malformed URL. Please enter a valid web address');
      return;
    }

    if (!api?.saveConnectApp) return;

    try {
      const saved = await api.saveConnectApp({
        id: editingApp ? editingApp.id : undefined,
        name: appName.trim(),
        url: formattedUrl,
        category: appCategory,
        icon: appIcon,
        description: appDescription.trim() || undefined,
        isFavorite: appIsFavorite,
      });

      // If we are currently in a workspace, automatically add this new app to that workspace
      if (activeWorkspace && !editingApp && api.saveConnectWorkspace) {
        await api.saveConnectWorkspace({
          id: activeWorkspace.id,
          name: activeWorkspace.name,
          appIds: [...activeWorkspace.appIds, saved.id],
        });
      }

      await loadData();
      setIsAppModalOpen(false);
    } catch (err: any) {
      setAppFormError(err.message || 'Failed to save application');
    }
  };

  const handleDeleteApp = async (app: ConnectApp) => {
    if (!window.confirm(`Delete application "${app.name}"?`)) return;
    if (!api?.deleteConnectApp) return;
    try {
      await api.deleteConnectApp(app.id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete app:', err);
    }
  };

  const handleResetDefaultApps = async () => {
    if (!window.confirm('Reset all NEXUS Connect apps to system defaults? Custom apps will be restored.')) return;
    if (!api?.resetDefaultConnectApps) return;
    try {
      const res = await api.resetDefaultConnectApps();
      setApps(res);
    } catch (err) {
      console.error('Failed to reset defaults:', err);
    }
  };

  // Workspace Actions
  const handleOpenAddWorkspaceModal = () => {
    setEditingWs(null);
    setWsName('');
    setWsDescription('');
    setWsSelectedAppIds([]);
    setWsFormError(null);
    setIsWsModalOpen(true);
  };

  const handleOpenEditWorkspaceModal = (ws: IConnectWorkspace) => {
    setEditingWs(ws);
    setWsName(ws.name);
    setWsDescription(ws.description || '');
    setWsSelectedAppIds([...ws.appIds]);
    setWsFormError(null);
    setIsWsModalOpen(true);
  };

  const handleSaveWorkspaceForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setWsFormError(null);

    const clean = wsName.trim();
    if (!clean) {
      setWsFormError('Workspace group name is required');
      return;
    }

    if (!api?.saveConnectWorkspace) return;

    try {
      const saved = await api.saveConnectWorkspace({
        id: editingWs ? editingWs.id : undefined,
        name: clean,
        description: wsDescription.trim() || undefined,
        appIds: wsSelectedAppIds,
      });

      await loadData();
      setIsWsModalOpen(false);
      setActiveTab(`ws:${saved.id}`);
    } catch (err: any) {
      setWsFormError(err.message || 'Failed to save workspace');
    }
  };

  const handleDeleteWorkspace = async (ws: IConnectWorkspace) => {
    if (!window.confirm(`Delete workspace group "${ws.name}"? Apps will remain in your library.`)) return;
    if (!api?.deleteConnectWorkspace) return;
    try {
      await api.deleteConnectWorkspace(ws.id);
      await loadData();
      setActiveTab('all');
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  };

  const handleLaunchAllWorkspaceApps = () => {
    if (!activeWorkspace) return;
    const wsApps = apps.filter((a) => activeWorkspace.appIds.includes(a.id));
    if (wsApps.length === 0) return;

    if (window.confirm(`Launch all ${wsApps.length} applications in the "${activeWorkspace.name}" workspace?`)) {
      wsApps.forEach((app) => {
        if (onOpenTab) {
          onOpenTab(app.url, false);
        } else if (onNavigate) {
          onNavigate(app.url);
        } else {
          window.open(app.url, '_blank');
        }
      });
    }
  };

  return (
    <div className="nexus-fullpage-container connect-workspace-container">
      <div className="connect-content-wrap">
        {/* Header & Quick Action Launchpad */}
        <div className="connect-header">
          <div className="connect-header-title-group">
            <div className="connect-header-title-row">
              <Share2 size={22} className="text-accent" />
              <h1 className="connect-header-title">NEXUS Connect</h1>
            </div>
            <p className="connect-header-desc">
              Unified launcher and collaboration workspace for messaging, video meetings, and productivity tools.
            </p>
          </div>

          <div className="connect-header-actions">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FolderPlus size={13} />}
              onClick={handleOpenAddWorkspaceModal}
              title="Create new workspace group"
            >
              New Workspace
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={handleOpenAddAppModal}
              title="Add web application"
            >
              Add App
            </Button>
          </div>
        </div>

        {/* Navigation & Workspace Groups Strip */}
        <div className="connect-toolbar">
          <div className="connect-toolbar-top">
            <div className="connect-toolbar-left">
              <Tabs
                variant="segmented"
                size="sm"
                activeTab={activeTab.startsWith('ws:') ? '' : activeTab}
                onChange={(tabId) => setActiveTab(tabId)}
                tabs={[
                  { id: 'all', label: `All Apps (${apps.length})` },
                  { id: 'chill', label: 'Chill' },
                  { id: 'work', label: 'Work' },
                  { id: 'create', label: 'Create / Productivity' },
                ]}
              />
            </div>

            <div className="connect-toolbar-right">
              <Button
                variant={onlyFavorites ? 'primary' : 'secondary'}
                size="sm"
                leftIcon={<Star size={12} fill={onlyFavorites ? 'currentColor' : 'none'} />}
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                title="Show starred apps only"
              >
                Favorites
              </Button>

              <IconButton
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={13} />}
                onClick={handleResetDefaultApps}
                aria-label="Reset default apps"
                title="Reset default apps"
              />
            </div>
          </div>

          {/* Custom Workspace Groups */}
          {workspaces.length > 0 && (
            <div className="connect-workspaces-strip">
              <span className="text-3xs uppercase font-mono text-muted mr-1.5 font-semibold tracking-wider">
                Workspaces:
              </span>
              {workspaces.map((ws) => {
                const isSelected = activeTab === `ws:${ws.id}`;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    className={`connect-ws-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveTab(`ws:${ws.id}`)}
                    title={ws.description || `Open ${ws.name} workspace`}
                  >
                    <Layers size={12} />
                    <span>{ws.name}</span>
                    <span
                      className={`text-3xs px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-black/20 text-current' : 'bg-surface text-muted'
                      }`}
                    >
                      {ws.appIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Workspace Banner (if a workspace is active) */}
        {activeWorkspace && (
          <div className="connect-active-ws-banner">
            <div>
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-accent" />
                <h2 className="text-sm font-bold text-primary tracking-tight">
                  {activeWorkspace.name} Workspace
                </h2>
                <Badge variant="accent" size="sm" className="font-mono">
                  {activeWorkspace.appIds.length} Apps
                </Badge>
              </div>
              {activeWorkspace.description && (
                <p className="text-2xs text-secondary mt-0.5">{activeWorkspace.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play size={12} />}
                onClick={handleLaunchAllWorkspaceApps}
                title="Launch all apps in tabs"
              >
                Launch All Apps
              </Button>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 size={12} />}
                onClick={() => handleOpenEditWorkspaceModal(activeWorkspace)}
                title="Edit workspace properties"
              >
                Edit
              </Button>

              <IconButton
                variant="ghost"
                size="sm"
                className="text-secondary hover:text-rose-400"
                icon={<Trash2 size={13} />}
                onClick={() => handleDeleteWorkspace(activeWorkspace)}
                aria-label="Delete workspace group"
                title="Delete workspace group"
              />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <SearchInput
          size="sm"
          placeholder="Search applications by name, category, or domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />

        {/* Apps Grid */}
        {filteredApps.length > 0 ? (
          <div className="connect-app-grid">
            {filteredApps.map((app) => (
              <ConnectAppCard
                key={app.id}
                app={app}
                onOpen={handleOpenApp}
                onAddTodo={handleAddTodoForApp}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleOpenEditAppModal}
                onDelete={handleDeleteApp}
              />
            ))}
          </div>
        ) : (
          /* Empty States (Guaranteed non-fabricated, actionable) */
          <div className="p-12 text-center rounded-2xl border border-dashed border-subtle bg-surface/30 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
              <Share2 size={24} />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-sm font-semibold text-primary">No applications found</h3>
                <p className="text-2xs text-secondary max-w-sm mx-auto">
                  No applications matched your search query "{searchQuery}".
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              </>
            ) : activeWorkspace ? (
              <>
                <h3 className="text-sm font-semibold text-primary">No apps in this workspace</h3>
                <p className="text-2xs text-secondary max-w-sm mx-auto">
                  Add applications to "{activeWorkspace.name}" to build your focused launcher group.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={13} />}
                  onClick={() => handleOpenEditWorkspaceModal(activeWorkspace)}
                >
                  Manage Workspace Apps
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-primary">No apps added yet</h3>
                <p className="text-2xs text-secondary max-w-sm mx-auto">
                  Add your favorite communication, meeting, or productivity web applications.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={13} />}
                  onClick={handleOpenAddAppModal}
                >
                  Add your first app
                </Button>
              </>
            )}
          </div>
        )}

        {/* Modal: Add / Edit App */}
        {isAppModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="markets-card w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-subtle pb-3">
                <h3 className="text-sm font-bold text-primary">
                  {editingApp ? 'Edit Application' : 'Add Web Application'}
                </h3>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<X size={15} />}
                  onClick={() => setIsAppModalOpen(false)}
                  aria-label="Close"
                />
              </div>

              <form onSubmit={handleSaveAppForm} className="space-y-4 text-xs">
                {appFormError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-2xs">
                    {appFormError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                    Application Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Linear, Google Meet, Asana"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="nexus-input w-full text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                    Official Web URL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://app.linear.app"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    className="nexus-input w-full text-xs font-mono"
                  />
                  <span className="block text-3xs text-muted">
                    Only valid HTTP and HTTPS URLs are permitted. Scripts are blocked.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={appCategory}
                      onChange={(e) => setAppCategory(e.target.value as any)}
                      className="nexus-input w-full text-xs"
                    >
                      <option value="chill">Chill</option>
                      <option value="work">Work</option>
                      <option value="create">Create / Productivity</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                      Icon
                    </label>
                    <select
                      value={appIcon}
                      onChange={(e) => setAppIcon(e.target.value)}
                      className="nexus-input w-full text-xs"
                    >
                      <option value="Globe">Default / Globe</option>
                      <optgroup label="Brand Icons">
                        <option value="Discord">Discord</option>
                        <option value="Telegram">Telegram</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Reddit">Reddit</option>
                        <option value="GoogleMeet">Google Meet</option>
                        <option value="Slack">Slack</option>
                        <option value="MicrosoftTeams">Microsoft Teams</option>
                        <option value="Zoom">Zoom</option>
                        <option value="Skype">Skype</option>
                        <option value="GitHub">GitHub</option>
                        <option value="Figma">Figma</option>
                        <option value="Notion">Notion</option>
                        <option value="GoogleDocs">Google Docs</option>
                        <option value="Linear">Linear</option>
                        <option value="Trello">Trello</option>
                        <option value="Asana">Asana</option>
                        <option value="Jira">Jira</option>
                        <option value="GoogleDrive">Google Drive</option>
                        <option value="GoogleSheets">Google Sheets</option>
                        <option value="Gmail">Gmail</option>
                        <option value="X">X / Twitter</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Spotify">Spotify</option>
                        <option value="ArXiv">ArXiv</option>
                      </optgroup>
                      <optgroup label="Generic Icons">
                        <option value="MessageCircle">Message Circle</option>
                        <option value="Send">Paper Plane</option>
                        <option value="MessageSquare">Message Square</option>
                        <option value="Video">Video Camera</option>
                        <option value="Hash">Hash Tag</option>
                        <option value="Users">Users / Team</option>
                        <option value="Code2">Code Bracket</option>
                        <option value="Layout">Design Layout</option>
                        <option value="FileText">Document Text</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                    Short Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of this workspace tool..."
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    className="nexus-input w-full text-xs resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={appIsFavorite}
                    onChange={(e) => setAppIsFavorite(e.target.checked)}
                    className="rounded border-subtle text-accent"
                  />
                  <span className="text-2xs text-primary font-medium">Add to Favorites bar</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAppModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    {editingApp ? 'Save Changes' : 'Add Application'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create / Edit Workspace Group */}
        {isWsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="markets-card w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-subtle pb-3">
                <h3 className="text-sm font-bold text-primary">
                  {editingWs ? `Edit Workspace: ${editingWs.name}` : 'Create Workspace Group'}
                </h3>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<X size={15} />}
                  onClick={() => setIsWsModalOpen(false)}
                  aria-label="Close"
                />
              </div>

              <form onSubmit={handleSaveWorkspaceForm} className="space-y-4 text-xs">
                {wsFormError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-2xs">
                    {wsFormError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STUDY, RESEARCH, DEV SPRINT"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="nexus-input w-full text-xs uppercase font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Workspace purpose or project description..."
                    value={wsDescription}
                    onChange={(e) => setWsDescription(e.target.value)}
                    className="nexus-input w-full text-xs"
                  />
                </div>

                {/* Apps Multi-Selection */}
                <div className="space-y-2">
                  <label className="block text-2xs font-semibold text-secondary uppercase tracking-wider">
                    Included Applications ({wsSelectedAppIds.length} Selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-subtle rounded-xl p-2 bg-surface/50 grid grid-cols-2 gap-2">
                    {apps.map((app) => {
                      const isChecked = wsSelectedAppIds.includes(app.id);
                      return (
                        <label
                          key={app.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-accent/15 border-accent/30 text-primary font-medium'
                              : 'bg-surface border-subtle/60 text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWsSelectedAppIds((prev) => [...prev, app.id]);
                              } else {
                                setWsSelectedAppIds((prev) => prev.filter((id) => id !== app.id));
                              }
                            }}
                            className="rounded border-subtle text-accent"
                          />
                          <span className="connect-modal-app-icon shrink-0">
                            <ConnectAppLogo app={app} size={16} />
                          </span>
                          <span className="truncate text-2xs">{app.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsWsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    {editingWs ? 'Save Workspace' : 'Create Workspace'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
