import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BookmarkItem,
  BrowserSettings,
  ClearDataOptions,
  DownloadRecord,
  ExtensionItem,
  HistoryEntry,
  RecentPage,
  RecentlyClosedTab,
  SavedSessionData,
  SystemInfo,
  TabGroup,
  TabState,
  Workspace,
  ExtensionValidationResult,
  InstalledExtension,
  UserProfile,
  PermissionPromptRequest,
} from '@shared/types';
import { TitleBar } from './components/TitleBar';
import { NavigationBar } from './components/NavigationBar';
import { BookmarksBar } from './components/BookmarksBar';
import { Sidebar } from './components/Sidebar';
import { VerticalTabBar } from './components/VerticalTabBar';
import { RightToolbar, SidePanelType } from './components/RightToolbar';
import { SidePanel } from './components/SidePanel';
import { StatusBar } from './components/StatusBar';
import { NewTabWorkspace } from './components/NewTabWorkspace';
import { CommandPalette } from './components/CommandPalette';
import { WorkspaceModal } from './components/WorkspaceModal';
import { TabSearchModal } from './components/TabSearchModal';
import { ExtensionsPage } from './components/ExtensionsPage';
import { ExtensionPermissionModal } from './components/ExtensionPermissionModal';
import { ExtensionCompatibilityModal } from './components/ExtensionCompatibilityModal';
import { BookmarksPage } from './components/BookmarksPage';
import { BookmarkEditModal } from './components/BookmarkEditModal';
import { HistoryPage } from './components/HistoryPage';
import { ClearBrowsingDataModal } from './components/ClearBrowsingDataModal';
import { DownloadsPage } from './components/DownloadsPage';
import { SiteSecurityPopover } from './components/SiteSecurityPopover';
import { SitePermissionPromptModal } from './components/SitePermissionPromptModal';
import { ProfileModal } from './components/ProfileModal';
import { PermissionsPage } from './components/PermissionsPage';
import { ResponsiveDeviceBar } from './components/ResponsiveDeviceBar';
import { ReaderView } from './components/ReaderView';
import { JsonFormatterModal } from './components/JsonFormatterModal';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { ShieldDashboard } from './components/ShieldDashboard';
import { MaliciousWarningPage } from './components/MaliciousWarningPage';
import { ModeSelectorModal } from './components/ModeSelectorModal';
import { NotesPage } from './components/Notes/NotesPage';
import { IntelligenceModal, IntelligencePage, IntelligenceTab } from './components/Intelligence';
import { MarketsDashboard } from './components/Markets';
import { HubWorkspace } from './components/Hub';
import { TodoWorkspace, TodoPrefill } from './components/Todo';
import { ConnectWorkspace } from './components/Connect';
import { SettingsWorkspace } from './components/Settings';
import { useTheme } from './hooks/useTheme';
import { useBrowserMode, applyDistractionReduction } from './hooks/useBrowserMode';

const defaultWorkspaces: Workspace[] = [
  { id: 'default', name: 'Personal', icon: 'User', color: '#A78BFA', layout: { sidebarCollapsed: false, tabLayout: 'horizontal' } },
  { id: 'dev', name: 'Development', icon: 'Code', color: '#38BDF8', layout: { sidebarCollapsed: false, tabLayout: 'horizontal' } },
  { id: 'research', name: 'Research', icon: 'BookOpen', color: '#34D399', layout: { sidebarCollapsed: false, tabLayout: 'horizontal' } },
];

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<SidePanelType>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('default');
  const [hoveredUrl] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // Modals & Overlays
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isTabSearchOpen, setIsTabSearchOpen] = useState(false);
  const [focusOmniboxTrigger, setFocusOmniboxTrigger] = useState(0);

  // Browsing Library Modals
  const [isBookmarkEditModalOpen, setIsBookmarkEditModalOpen] = useState(false);
  const [editingBookmarkItem, setEditingBookmarkItem] = useState<BookmarkItem | null>(null);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  // NEXUS Intelligence state
  const [isIntelligenceModalOpen, setIsIntelligenceModalOpen] = useState(false);
  const [intelligenceModalTab, setIntelligenceModalTab] = useState<IntelligenceTab>('dictionary');
  const [intelligenceInitialText, setIntelligenceInitialText] = useState<string>('');

  // NEXUS Todo integration prefill state
  const [todoPrefill, setTodoPrefill] = useState<TodoPrefill | null>(null);

  // Persistent user data
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_workspaces');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultWorkspaces;
  });

  const [tabGroups, setTabGroups] = useState<TabGroup[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_tab_groups');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'core', name: 'Dev Core', color: '#A78BFA', collapsed: false },
      { id: 'docs', name: 'Reference', color: '#38BDF8', collapsed: false },
    ];
  });

  const [recentlyClosed, setRecentlyClosed] = useState<RecentlyClosedTab[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_recently_closed');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [downloadDirectory, setDownloadDirectory] = useState<string>('');

  const [extensions, setExtensions] = useState<InstalledExtension[]>([]);
  const [permissionValidation, setPermissionValidation] = useState<ExtensionValidationResult | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isCompatibilityModalOpen, setIsCompatibilityModalOpen] = useState(false);
  const [isInstallingExtension, setIsInstallingExtension] = useState(false);

  // Profiles, Permissions & Security
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [permissionPrompt, setPermissionPrompt] = useState<PermissionPromptRequest | null>(null);
  const [isSecurityPopoverOpen, setIsSecurityPopoverOpen] = useState(false);

  // Developer Toolkit State
  const [isResponsiveBarOpen, setIsResponsiveBarOpen] = useState(false);
  const [isReaderModeOpen, setIsReaderModeOpen] = useState(false);
  const [readerArticle, setReaderArticle] = useState<import('@shared/types').ReaderArticle | null>(null);
  const [isJsonFormatterOpen, setIsJsonFormatterOpen] = useState(false);

  const [settings, setSettings] = useState<BrowserSettings>(() => {
    try {
      const saved = localStorage.getItem('nexus_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      searchEngine: 'duckduckgo',
      defaultZoom: 1,
      openDevToolsOnStart: false,
      hardwareAcceleration: false,
      restoreSessionOnStartup: true,
      tabLayout: 'horizontal',
      showBookmarksBar: true,
      theme: 'dark',
      reducedMotion: false,
      mode: 'default',
    };
  });

  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isModePopoverOpen, setIsModePopoverOpen] = useState(false);

  const handleUpdateSettings = useCallback((newSettings: Partial<BrowserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      try {
        localStorage.setItem('nexus_settings', JSON.stringify(next));
      } catch (e) {}
      if (window.nexusAPI?.updateBrowserSettings) {
        window.nexusAPI.updateBrowserSettings(newSettings);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (window.nexusAPI?.getBrowserSettings) {
      window.nexusAPI.getBrowserSettings().then((loaded) => {
        if (loaded) {
          setSettings((prev) => ({ ...prev, ...loaded }));
        }
      }).catch(console.error);
    }

    if (window.nexusAPI?.onSettingsUpdated) {
      const unsub = window.nexusAPI.onSettingsUpdated((updated) => {
        setSettings((prev) => ({ ...prev, ...updated }));
      });
      return unsub;
    }
    return undefined;
  }, []);

  const {
    mode: browserMode,
    setMode: setBrowserMode,
    telemetry: modeTelemetry,
    optimizeMemory,
    suspendTab,
    wakeTab,
    updateModeConfig,
    restoreDefaults: restoreModeDefaults,
  } = useBrowserMode(settings.mode, handleUpdateSettings);

  useTheme(settings.theme);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion =
      settings.reducedMotion ? 'true' : 'false';
  }, [settings.reducedMotion]);

  useEffect(() => {
    const isDistractionFree = browserMode === 'balanced' && !!settings.balancedDistractionReduction;
    applyDistractionReduction(isDistractionFree);
    if (isDistractionFree) {
      setSidebarCollapsed(true);
    }
  }, [browserMode, settings.balancedDistractionReduction]);

  const handleEnterFocusWorkspace = useCallback(() => {
    const existingFocus = workspaces.find((w) => w.id === 'focus');
    if (existingFocus) {
      setActiveWorkspaceId('focus');
    } else {
      const focusWs: Workspace = {
        id: 'focus',
        name: 'Focus Session',
        icon: 'Target',
        color: '#F5C542',
        layout: { sidebarCollapsed: true, tabLayout: 'horizontal' },
      };
      const updated = [...workspaces, focusWs];
      setWorkspaces(updated);
      localStorage.setItem('nexus_workspaces', JSON.stringify(updated));
      setActiveWorkspaceId('focus');
    }
    setSidebarCollapsed(true);
  }, [workspaces]);

  // Save workspaces & settings changes to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('nexus_tab_groups', JSON.stringify(tabGroups));
  }, [tabGroups]);

  useEffect(() => {
    localStorage.setItem('nexus_recently_closed', JSON.stringify(recentlyClosed));
  }, [recentlyClosed]);

  useEffect(() => {
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
  }, [settings]);

  const api = window.nexusAPI;

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || null,
    [tabs, activeTabId]
  );

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );

  const activeBookmark = useMemo(() => {
    if (!activeTab || !activeTab.url || activeTab.url.startsWith('nexus://')) return null;
    return bookmarks.find((b) => b.type === 'bookmark' && b.url === activeTab.url) || null;
  }, [bookmarks, activeTab]);

  const isBookmarked = useMemo(() => {
    return !!activeBookmark;
  }, [activeBookmark]);

  // Sync System Info & Listeners
  useEffect(() => {
    if (!api) return;

    api.getSystemInfo().then(setSystemInfo).catch(console.error);

    api.getInstalledExtensions().then((extList) => {
      if (Array.isArray(extList)) {
        setExtensions(extList);
      }
    }).catch(console.error);

    // Initial load for browsing library & profiles
    api.getBookmarks().then(setBookmarks).catch(console.error);
    api.getHistory().then(setHistoryEntries).catch(console.error);
    api.getDownloads().then(setDownloads).catch(console.error);
    api.getDownloadDirectory().then(setDownloadDirectory).catch(console.error);
    if (api.getProfiles) {
      api.getProfiles().then(setProfiles).catch(console.error);
    }
    if (api.getActiveProfile) {
      api.getActiveProfile().then(setActiveProfile).catch(console.error);
    }

    const unsubscribeTabs = api.onTabsUpdated((updatedTabs, activeId) => {
      setTabs(updatedTabs);
      setActiveTabId(activeId);
    });

    const unsubscribeMax = api.onWindowMaximizedChange((maximized) => {
      setIsMaximized(maximized);
    });

    const unsubscribeExtensions = api.onExtensionsUpdated ? api.onExtensionsUpdated((updatedList) => {
      setExtensions(updatedList);
    }) : () => {};

    const unsubscribeBookmarks = api.onBookmarksUpdated ? api.onBookmarksUpdated((bList) => {
      setBookmarks(bList);
    }) : () => {};

    const unsubscribeHistory = api.onHistoryUpdated ? api.onHistoryUpdated((hList) => {
      setHistoryEntries(hList);
    }) : () => {};

    const unsubscribeDownloads = api.onDownloadsUpdated ? api.onDownloadsUpdated((dList) => {
      setDownloads(dList);
    }) : () => {};

    const unsubscribeProfile = api.onProfileSwitched ? api.onProfileSwitched((prof) => {
      setActiveProfile(prof);
      api.getProfiles().then(setProfiles).catch(() => {});
      api.getBookmarks().then(setBookmarks).catch(() => {});
      api.getHistory().then(setHistoryEntries).catch(() => {});
      api.getDownloads().then(setDownloads).catch(() => {});
    }) : () => {};

    const unsubscribePrompt = api.onPermissionPrompt ? api.onPermissionPrompt((req) => {
      setPermissionPrompt(req);
    }) : () => {};

    const unsubscribeExplain = api.onExplainSelectionRequested
      ? api.onExplainSelectionRequested((data) => {
          setIntelligenceInitialText(data.text);
          setIntelligenceModalTab('dictionary');
          setIsIntelligenceModalOpen(true);
        })
      : () => {};

    const unsubscribeSendToNotes = api.onSendToNotesRequested
      ? api.onSendToNotesRequested(async (data) => {
          try {
            const title = data.sourceTitle ? `Selection from ${data.sourceTitle}` : 'Webpage Selection';
            const content = `<blockquote><p>${data.text}</p></blockquote><p><small>Source: <a href="${data.sourceUrl || '#'}">${data.sourceUrl || 'Webpage'}</a> — Captured ${new Date().toLocaleString()}</small></p>`;
            await api.saveNote({
              title,
              content,
              linkedTab: data.sourceUrl
                ? {
                    url: data.sourceUrl,
                    title: data.sourceTitle || 'Webpage',
                    linkedAt: Date.now(),
                  }
                : undefined,
            });
            setActiveSidePanel('notes');
          } catch (e) {
            console.error('[App] Failed to save selection to notes:', e);
          }
        })
      : () => {};

    api.isWindowMaximized().then(setIsMaximized).catch(console.error);

    return () => {
      unsubscribeTabs();
      unsubscribeMax();
      unsubscribeExtensions();
      unsubscribeBookmarks();
      unsubscribeHistory();
      unsubscribeDownloads();
      unsubscribeProfile();
      unsubscribePrompt();
      unsubscribeExplain();
      unsubscribeSendToNotes();
    };
  }, [api]);

  // Session Auto-Save to Disk
  useEffect(() => {
    if (!api || tabs.length === 0) return;
    const sessionData: SavedSessionData = {
      version: 1,
      workspaces,
      activeWorkspaceId,
      groups: tabGroups,
      tabs: tabs.map((t) => ({
        id: t.id,
        url: t.url,
        title: t.title,
        favicon: t.favicon,
        workspaceId: t.workspaceId,
        groupId: t.groupId,
        isPinned: t.isPinned,
        isMuted: t.isMuted,
      })),
      activeTabId,
      recentlyClosed,
    };
    api.saveSession(sessionData).catch(console.error);
  }, [api, tabs, workspaces, activeWorkspaceId, tabGroups, activeTabId, recentlyClosed]);

  // Update Dynamic 4-Axis Bounds for WebContentsView
  useEffect(() => {
    if (!api) return;

    const baseSidebarWidth = sidebarCollapsed ? 48 : 210;
    const vtabWidth = settings.tabLayout === 'vertical' ? 220 : 0;
    const leftWidth = baseSidebarWidth + vtabWidth;
    const rightWidth = (activeSidePanel ? 310 : 0) + 44;
    const topHeight = 84 + (settings.showBookmarksBar ? 28 : 0);

    api.updateContentBounds({
      top: topHeight,
      left: leftWidth,
      right: rightWidth,
      bottom: 24,
    });
  }, [api, sidebarCollapsed, activeSidePanel, settings.tabLayout, settings.showBookmarksBar]);

  // Modal Visibility Sync to prevent WebContentsView occlusion
  const isAnyModalOpen =
    isCommandPaletteOpen ||
    isWorkspaceModalOpen ||
    isTabSearchOpen ||
    isPermissionModalOpen ||
    isCompatibilityModalOpen ||
    isBookmarkEditModalOpen ||
    isClearDataModalOpen ||
    isProfileModalOpen ||
    permissionPrompt !== null ||
    isSecurityPopoverOpen ||
    isModePopoverOpen;

  useEffect(() => {
    if (api && api.setModalOpen) {
      api.setModalOpen(isAnyModalOpen);
    }
  }, [api, isAnyModalOpen]);

  const handleRespondPermissionPrompt = useCallback(async (allow: boolean, remember: boolean) => {
    if (permissionPrompt && api.respondPermissionPrompt) {
      await api.respondPermissionPrompt(permissionPrompt.requestId, allow, remember);
    }
    setPermissionPrompt(null);
  }, [permissionPrompt, api]);

  const handleSwitchProfile = useCallback(async (id: string) => {
    if (!api) return;
    await api.switchProfile(id);
    const prof = await api.getActiveProfile();
    setActiveProfile(prof);
    const list = await api.getProfiles();
    setProfiles(list);
  }, [api]);

  // Tab Operations
  const handleSelectTab = useCallback(
    (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (tab && tab.workspaceId && tab.workspaceId !== activeWorkspaceId) {
        setActiveWorkspaceId(tab.workspaceId);
      }
      api?.switchTab(id);
    },
    [api, tabs, activeWorkspaceId]
  );

  const handleNewTab = useCallback(
    (url?: string, isPrivate: boolean = false) => {
      api?.createTab(url || 'nexus://newtab', activeWorkspaceId, isPrivate);
    },
    [api, activeWorkspaceId]
  );

  const handleDuplicateTab = useCallback(
    (id: string) => {
      api?.duplicateTab(id);
    },
    [api]
  );

  const handleReopenClosedTab = useCallback(() => {
    if (recentlyClosed.length > 0) {
      const last = recentlyClosed[0];
      setRecentlyClosed((prev) => prev.slice(1));
      api?.createTab(last.url, last.workspaceId);
    } else {
      api?.reopenClosedTab();
    }
  }, [api, recentlyClosed]);

  const handleCloseTab = useCallback(
    (id: string) => {
      const closingTab = tabs.find((t) => t.id === id);
      if (closingTab && closingTab.url && closingTab.url !== 'nexus://newtab' && !closingTab.isPrivate) {
        setRecentlyClosed((prev) => [
          {
            id: `closed-${Date.now()}`,
            url: closingTab.url,
            title: closingTab.title,
            favicon: closingTab.favicon,
            workspaceId: closingTab.workspaceId,
            groupId: closingTab.groupId,
            closedAt: Date.now(),
          },
          ...prev,
        ].slice(0, 30));
      }
      api?.closeTab(id);
    },
    [api, tabs]
  );

  const handleTogglePinTab = useCallback(
    (id: string) => {
      api?.pinTab(id);
    },
    [api]
  );

  const handleToggleMuteTab = useCallback(
    (id: string) => {
      api?.muteTab(id);
    },
    [api]
  );

  const handleSetTabGroup = useCallback(
    (id: string, groupId?: string) => {
      api?.setTabGroup(id, groupId);
    },
    [api]
  );

  const handleReorderTabs = useCallback(
    (orderedIds: string[]) => {
      api?.reorderTabs(orderedIds);
    },
    [api]
  );

  const handleMoveTabToWorkspace = useCallback(
    (id: string, workspaceId: string) => {
      api?.moveTabToWorkspace(id, workspaceId);
    },
    [api]
  );

  const handleSwitchWorkspace = useCallback(
    (workspaceId: string, tabId?: string) => {
      setActiveWorkspaceId(workspaceId);
      api?.switchWorkspace(workspaceId, tabId);
    },
    [api]
  );

  // Tab Groups
  const handleCreateGroup = useCallback(() => {
    const colors = ['#A78BFA', '#38BDF8', '#34D399', '#FBBF24', '#F43F5E', '#E879F9'];
    const newGroup: TabGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${tabGroups.length + 1}`,
      color: colors[tabGroups.length % colors.length],
      collapsed: false,
    };
    setTabGroups((prev) => [...prev, newGroup]);
  }, [tabGroups]);

  const handleToggleGroupCollapse = useCallback((groupId: string) => {
    setTabGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g))
    );
  }, []);

  // Workspaces CRUD
  const handleSaveWorkspace = useCallback(
    (workspace: Workspace) => {
      setWorkspaces((prev) => {
        const exists = prev.some((w) => w.id === workspace.id);
        if (exists) {
          return prev.map((w) => (w.id === workspace.id ? workspace : w));
        }
        return [...prev, workspace];
      });
    },
    []
  );

  const handleDeleteWorkspace = useCallback(
    (id: string) => {
      if (id === 'default') return;

      // Reassign tabs in deleted workspace to default
      for (const tab of tabs) {
        if (tab.workspaceId === id) {
          api?.moveTabToWorkspace(tab.id, 'default');
        }
      }

      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      if (activeWorkspaceId === id) {
        handleSwitchWorkspace('default');
      }
    },
    [activeWorkspaceId, tabs, api, handleSwitchWorkspace]
  );

  // Navigation
  const handleNavigate = useCallback(
    (url: string) => {
      if (activeTabId) {
        api?.navigate(activeTabId, url);
      } else {
        api?.createTab(url, activeWorkspaceId);
      }
    },
    [api, activeTabId, activeWorkspaceId]
  );

  const handleGoBack = useCallback(() => {
    if (activeTabId) api?.goBack(activeTabId);
  }, [api, activeTabId]);

  const handleGoForward = useCallback(() => {
    if (activeTabId) api?.goForward(activeTabId);
  }, [api, activeTabId]);

  const handleReload = useCallback(() => {
    if (activeTabId) api?.reload(activeTabId);
  }, [api, activeTabId]);

  const handleStop = useCallback(() => {
    if (activeTabId) api?.stop(activeTabId);
  }, [api, activeTabId]);

  const handleGoHome = useCallback(() => {
    if (activeTabId) api?.navigate(activeTabId, 'nexus://newtab');
  }, [api, activeTabId]);

  const handleToggleDevTools = useCallback(() => {
    api?.toggleDevTools(activeTabId || undefined);
  }, [api, activeTabId]);

  const handleInspectElement = useCallback(() => {
    if (activeTabId) api?.inspectElement(activeTabId);
  }, [api, activeTabId]);

  const handleOpenReaderMode = useCallback(async () => {
    if (!api || !activeTabId) return;
    const result = await api.extractReaderMode(activeTabId);
    if (result?.success && result.article) {
      setReaderArticle(result.article);
      setIsReaderModeOpen(true);
    }
  }, [api, activeTabId]);

  const handleToggleResponsive = useCallback(() => {
    setIsResponsiveBarOpen((prev) => !prev);
  }, []);

  const handleOpenJsonFormatter = useCallback(() => {
    setIsJsonFormatterOpen(true);
  }, []);

  const handleOpenDevDashboard = useCallback(() => {
    if (activeTabId) api?.navigate(activeTabId, 'nexus://dev');
  }, [api, activeTabId]);

  const handleOpenColorPicker = useCallback(async () => {
    // Use Chromium EyeDropper API if available
    try {
      const eyeDropper = new (window as any).EyeDropper();
      await eyeDropper.open();
    } catch {
      // EyeDropper not supported or cancelled — silently ignore
    }
  }, []);

  const handleZoomIn = useCallback(async () => {
    if (!api) return;
    const current = await api.getZoomLevel();
    await api.setZoomLevel(Math.min(current + 0.5, 3));
  }, [api]);

  const handleZoomOut = useCallback(async () => {
    if (!api) return;
    const current = await api.getZoomLevel();
    await api.setZoomLevel(Math.max(current - 0.5, -3));
  }, [api]);

  const handleResetZoom = useCallback(async () => {
    if (!api) return;
    await api.setZoomLevel(0);
  }, [api]);

  const handleMinimize = useCallback(() => api?.minimizeWindow(), [api]);
  const handleMaximize = useCallback(() => api?.maximizeWindow(), [api]);
  const handleCloseWindow = useCallback(() => api?.closeWindow(), [api]);

  // Bookmarking Handlers
  const handleToggleBookmark = useCallback(() => {
    if (!activeTab || activeTab.url === 'nexus://newtab' || activeTab.url.startsWith('nexus://')) return;
    setEditingBookmarkItem(activeBookmark);
    setIsBookmarkEditModalOpen(true);
  }, [activeTab, activeBookmark]);

  const handleOpenBookmarksPage = useCallback(() => {
    if (activeTabId) {
      api?.navigate(activeTabId, 'nexus://bookmarks');
    } else {
      api?.createTab('nexus://bookmarks', activeWorkspaceId);
    }
  }, [api, activeTabId, activeWorkspaceId]);

  const handleSaveBookmark = useCallback(
    async (item: {
      id?: string;
      title: string;
      url?: string;
      favicon?: string;
      parentId?: string | null;
      type?: 'bookmark' | 'folder';
    }) => {
      if (!api) return;
      await api.saveBookmark(item);
      const updated = await api.getBookmarks();
      setBookmarks(updated);
    },
    [api]
  );

  const handleCreateBookmarkFolder = useCallback(
    async (title: string, parentId?: string | null) => {
      if (!api) throw new Error('API unavailable');
      const folder = await api.createBookmarkFolder(title, parentId);
      const updated = await api.getBookmarks();
      setBookmarks(updated);
      return folder;
    },
    [api]
  );

  const handleRemoveBookmark = useCallback(
    async (id: string) => {
      if (!api) return;
      await api.removeBookmark(id);
      const updated = await api.getBookmarks();
      setBookmarks(updated);
    },
    [api]
  );

  const handleExportBookmarksHtml = useCallback(async () => {
    if (!api) return '';
    return await api.exportBookmarksHtml();
  }, [api]);

  const handleImportBookmarksHtml = useCallback(
    async (html: string) => {
      if (!api) return { imported: 0 };
      const res = await api.importBookmarksHtml(html);
      const updated = await api.getBookmarks();
      setBookmarks(updated);
      return res;
    },
    [api]
  );

  // History Handlers
  const handleOpenHistoryPage = useCallback(() => {
    if (activeTabId) {
      api?.navigate(activeTabId, 'nexus://history');
    } else {
      api?.createTab('nexus://history', activeWorkspaceId);
    }
  }, [api, activeTabId, activeWorkspaceId]);

  const handleDeleteHistoryEntry = useCallback(
    async (id: string) => {
      if (!api) return false;
      const ok = await api.deleteHistoryEntry(id);
      const updated = await api.getHistory();
      setHistoryEntries(updated);
      return ok;
    },
    [api]
  );

  const handleDeleteHistoryRange = useCallback(
    async (startTime: number, endTime: number) => {
      if (!api) return 0;
      const count = await api.deleteHistoryRange(startTime, endTime);
      const updated = await api.getHistory();
      setHistoryEntries(updated);
      return count;
    },
    [api]
  );

  const handleClearAllHistory = useCallback(async () => {
    if (!api) return false;
    const ok = await api.clearAllHistory();
    setHistoryEntries([]);
    return ok;
  }, [api]);

  const handleClearBrowsingDataDetailed = useCallback(
    async (options: ClearDataOptions) => {
      if (!api) return;
      await api.clearBrowsingDataDetailed(options);
      const updatedHist = await api.getHistory();
      setHistoryEntries(updatedHist);
      const updatedDl = await api.getDownloads();
      setDownloads(updatedDl);
    },
    [api]
  );

  // Downloads Handlers
  const handleOpenDownloadsPage = useCallback(() => {
    if (activeTabId) {
      api?.navigate(activeTabId, 'nexus://downloads');
    } else {
      api?.createTab('nexus://downloads', activeWorkspaceId);
    }
  }, [api, activeTabId, activeWorkspaceId]);

  const handlePauseDownload = useCallback(
    async (id: string) => {
      if (!api) return false;
      return await api.pauseDownload(id);
    },
    [api]
  );

  const handleResumeDownload = useCallback(
    async (id: string) => {
      if (!api) return false;
      return await api.resumeDownload(id);
    },
    [api]
  );

  const handleCancelDownload = useCallback(
    async (id: string) => {
      if (!api) return false;
      return await api.cancelDownload(id);
    },
    [api]
  );

  const handleOpenFile = useCallback(
    async (id: string) => {
      if (!api) return false;
      return await api.openDownloadFile(id);
    },
    [api]
  );

  const handleShowInFolder = useCallback(
    async (id: string) => {
      if (!api) return false;
      return await api.showDownloadInFolder(id);
    },
    [api]
  );

  const handleChangeDownloadDirectory = useCallback(async () => {
    if (!api) return null;
    const chosen = await api.setDownloadDirectory();
    if (chosen) setDownloadDirectory(chosen);
    return chosen;
  }, [api]);

  const handleClearDownloadsList = useCallback(async () => {
    if (!api) return;
    await api.clearDownloadsList();
    const updated = await api.getDownloads();
    setDownloads(updated);
  }, [api]);

  const handleRemoveDownloadEntry = useCallback(
    async (id: string) => {
      if (!api) return false;
      const ok = await api.removeDownloadEntry(id);
      const updated = await api.getDownloads();
      setDownloads(updated);
      return ok;
    },
    [api]
  );

  // Extensions Handlers
  const handleOpenExtensionsPage = useCallback(() => {
    if (activeTabId) {
      api?.navigate(activeTabId, 'nexus://extensions');
    } else {
      api?.createTab('nexus://extensions', activeWorkspaceId);
    }
  }, [api, activeTabId, activeWorkspaceId]);

  const handleOpenCompatibilityGuide = useCallback(() => {
    setIsCompatibilityModalOpen(true);
  }, []);

  const handleInstallUnpacked = useCallback(async () => {
    if (!api) return;
    try {
      const folderPath = await api.selectExtensionDirectory();
      if (!folderPath) return;

      const validation = await api.validateExtension(folderPath);
      if (!validation.valid) {
        alert(validation.error || 'Invalid extension directory or manifest.json');
        return;
      }

      setPermissionValidation(validation);
      setIsPermissionModalOpen(true);
    } catch (err: any) {
      console.error('Failed to validate extension:', err);
      alert(err.message || 'Error validating extension directory');
    }
  }, [api]);

  const handleConfirmInstall = useCallback(async () => {
    if (!api || !permissionValidation) return;
    setIsInstallingExtension(true);
    try {
      await api.installExtension(permissionValidation.path);
      setIsPermissionModalOpen(false);
      setPermissionValidation(null);
    } catch (err: any) {
      console.error('Failed to install extension:', err);
      alert(err.message || 'Error installing extension');
    } finally {
      setIsInstallingExtension(false);
    }
  }, [api, permissionValidation]);

  const handleToggleExtension = useCallback(
    (id: string, enabled?: boolean) => {
      if (!api) return;
      const ext = extensions.find((e) => e.id === id);
      const targetEnabled = typeof enabled === 'boolean' ? enabled : !(ext?.enabled);
      api.toggleExtension(id, targetEnabled).catch(console.error);
    },
    [api, extensions]
  );

  const handleReloadExtension = useCallback(
    (id: string) => {
      api?.reloadExtension(id).catch(console.error);
    },
    [api]
  );

  const handleUninstallExtension = useCallback(
    (id: string) => {
      api?.uninstallExtension(id).catch(console.error);
    },
    [api]
  );

  const handleOpenExtensionPopup = useCallback(
    (id: string) => {
      api?.openExtensionPopup(id).catch(console.error);
    },
    [api]
  );

  const handleClearCache = useCallback(async () => {
    if (api) {
      await api.clearBrowsingData();
    }
  }, [api]);

  // Tab Cycling Shortcuts
  const workspaceTabs = useMemo(
    () => tabs.filter((t) => t.workspaceId === activeWorkspaceId),
    [tabs, activeWorkspaceId]
  );

  const handleNextTab = useCallback(() => {
    if (workspaceTabs.length <= 1) return;
    const currentIndex = workspaceTabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % workspaceTabs.length;
    handleSelectTab(workspaceTabs[nextIndex].id);
  }, [workspaceTabs, activeTabId, handleSelectTab]);

  const handlePrevTab = useCallback(() => {
    if (workspaceTabs.length <= 1) return;
    const currentIndex = workspaceTabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + workspaceTabs.length) % workspaceTabs.length;
    handleSelectTab(workspaceTabs[prevIndex].id);
  }, [workspaceTabs, activeTabId, handleSelectTab]);

  const handleFocusOmnibox = useCallback(() => {
    setFocusOmniboxTrigger((prev) => prev + 1);
  }, []);

  const handleViewSource = useCallback(() => {
    if (activeTab && activeTab.url && activeTab.url !== 'nexus://newtab') {
      const srcUrl = activeTab.url.startsWith('view-source:')
        ? activeTab.url
        : `view-source:${activeTab.url}`;
      handleNavigate(srcUrl);
    }
  }, [activeTab, handleNavigate]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Ctrl+Shift+P: Command Palette
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+Shift+A: Tab Search
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsTabSearchOpen((prev) => !prev);
      }
      // Ctrl+L: Focus address bar
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleFocusOmnibox();
      }
      // Ctrl+Tab / Ctrl+Shift+Tab: Tab cycling
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrevTab();
        } else {
          handleNextTab();
        }
      }
      // Ctrl+Shift+T: Reopen Closed Tab
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleReopenClosedTab();
      }
      // Ctrl+T: New Tab
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+W: Close Tab
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) handleCloseTab(activeTabId);
      }
      // Ctrl+R / F5: Reload
      else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') || e.key === 'F5') {
        e.preventDefault();
        handleReload();
      }
      // Ctrl+Shift+I / F12: Web DevTools
      else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') || e.key === 'F12') {
        e.preventDefault();
        handleToggleDevTools();
      }
      // Alt+Left: Back
      else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      }
      // Alt+Right: Forward
      else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      }
      // Ctrl+B: Bookmarks panel
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setActiveSidePanel((prev) => (prev === 'bookmarks' ? null : 'bookmarks'));
      }
      // Ctrl+H: History panel
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveSidePanel((prev) => (prev === 'history' ? null : 'history'));
      }
      // Ctrl+J: Downloads panel
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setActiveSidePanel((prev) => (prev === 'downloads' ? null : 'downloads'));
      }
      // Ctrl+Shift+N: Notes Companion panel
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveSidePanel((prev) => (prev === 'notes' ? null : 'notes'));
      }
      // Ctrl+D: Bookmark page
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleToggleBookmark();
      }
      // Ctrl+U: View Source
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleViewSource();
      }
      // Ctrl+Shift+S: Toggle sidebar
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
      // Ctrl+Shift+M: Toggle responsive device preview bar
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleResponsive();
      }
      // Ctrl+Plus: Zoom In
      else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
      }
      // Ctrl+Minus: Zoom Out
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      // Ctrl+0: Reset Zoom
      else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
      // Escape: Dismiss active overlays
      else if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
        } else if (isTabSearchOpen) {
          e.preventDefault();
          setIsTabSearchOpen(false);
        } else if (isWorkspaceModalOpen) {
          e.preventDefault();
          setIsWorkspaceModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNewTab,
    handleCloseTab,
    handleReload,
    handleToggleDevTools,
    handleGoBack,
    handleGoForward,
    handleToggleBookmark,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleReopenClosedTab,
    handleNextTab,
    handlePrevTab,
    handleFocusOmnibox,
    handleViewSource,
    handleToggleResponsive,
    activeTabId,
    isCommandPaletteOpen,
    isTabSearchOpen,
    isWorkspaceModalOpen,
  ]);

  const isNewTab = !activeTab || activeTab.url === 'nexus://newtab' || activeTab.url === '';
  const isExtensionsPage =
    activeTab?.url === 'nexus://extensions' || activeTab?.url?.startsWith('nexus://extensions');
  const isCompatibilityPage =
    activeTab?.url === 'nexus://compatibility' || activeTab?.url?.startsWith('nexus://compatibility');
  const isBookmarksPage =
    activeTab?.url === 'nexus://bookmarks' || activeTab?.url?.startsWith('nexus://bookmarks');
  const isHistoryPage =
    activeTab?.url === 'nexus://history' || activeTab?.url?.startsWith('nexus://history');
  const isDownloadsPage =
    activeTab?.url === 'nexus://downloads' || activeTab?.url?.startsWith('nexus://downloads');
  const isPermissionsPage =
    activeTab?.url === 'nexus://permissions' || activeTab?.url?.startsWith('nexus://permissions');
  const isDevDashboard =
    activeTab?.url === 'nexus://dev' || activeTab?.url?.startsWith('nexus://dev');
  const isShieldPage =
    activeTab?.url === 'nexus://shield' || activeTab?.url?.startsWith('nexus://shield');
  const isNotesPage =
    activeTab?.url === 'nexus://notes' || activeTab?.url?.startsWith('nexus://notes');
  const isIntelligencePage =
    activeTab?.url === 'nexus://explore' ||
    activeTab?.url?.startsWith('nexus://explore') ||
    activeTab?.url === 'nexus://dictionary' ||
    activeTab?.url?.startsWith('nexus://dictionary') ||
    activeTab?.url === 'nexus://intelligence' ||
    activeTab?.url?.startsWith('nexus://intelligence');
  const isNewsPage =
    activeTab?.url === 'nexus://news' || activeTab?.url?.startsWith('nexus://news');
  const isMarketsPage =
    activeTab?.url === 'nexus://markets' || activeTab?.url?.startsWith('nexus://markets');
  const isHubPage =
    activeTab?.url === 'nexus://hub' || activeTab?.url?.startsWith('nexus://hub');
  const isConnectPage =
    activeTab?.url === 'nexus://connect' || activeTab?.url?.startsWith('nexus://connect');
  const isTodoPage =
    activeTab?.url === 'nexus://todo' || activeTab?.url?.startsWith('nexus://todo');
  const isSettingsPage =
    activeTab?.url === 'nexus://settings' || activeTab?.url?.startsWith('nexus://settings');
  const isPrivacyPage =
    activeTab?.url === 'nexus://privacy' || activeTab?.url?.startsWith('nexus://privacy');
  const isWarningPage =
    activeTab?.url === 'nexus://warning' || activeTab?.url?.startsWith('nexus://warning');

  return (
    <div className="nexus-app">
      {/* 1. Compact Top Tab Strip & Frameless Controls */}
      <TitleBar
        tabs={tabs}
        tabGroups={tabGroups}
        workspaces={workspaces}
        activeTabId={activeTabId}
        activeWorkspaceId={activeWorkspaceId}
        isMaximized={isMaximized}
        tabLayout={settings.tabLayout || 'horizontal'}
        currentMode={browserMode}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        onDuplicateTab={handleDuplicateTab}
        onReopenClosedTab={handleReopenClosedTab}
        onReloadTab={handleReload}
        onTogglePinTab={handleTogglePinTab}
        onToggleMuteTab={handleToggleMuteTab}
        onSetTabGroup={handleSetTabGroup}
        onMoveTabToWorkspace={handleMoveTabToWorkspace}
        onReorderTabs={handleReorderTabs}
        onCreateGroup={handleCreateGroup}
        onToggleGroupCollapse={handleToggleGroupCollapse}
        onToggleTabLayout={() => {
          handleUpdateSettings({
            tabLayout: settings.tabLayout === 'vertical' ? 'horizontal' : 'vertical',
          });
        }}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onCloseWindow={handleCloseWindow}
        onGoHome={handleGoHome}
      />

      {/* 2. Navigation Toolbar & Omnibox */}
      <div className="navbar-wrapper relative">
        <NavigationBar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onReload={handleReload}
          onStop={handleStop}
          onGoHome={handleGoHome}
          onToggleDevTools={handleToggleDevTools}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
          focusOmniboxTrigger={focusOmniboxTrigger}
          onToggleSecurityPopover={() => setIsSecurityPopoverOpen((prev) => !prev)}
          currentMode={browserMode}
          onSelectMode={setBrowserMode}
          onModePopoverOpenChange={setIsModePopoverOpen}
          onOpenSettings={() => setActiveSidePanel('settings')}
        />

        <SiteSecurityPopover
          url={activeTab?.url || ''}
          isOpen={isSecurityPopoverOpen}
          onClose={() => setIsSecurityPopoverOpen(false)}
          onOpenPermissionsPage={() => {
            setIsSecurityPopoverOpen(false);
            handleNavigate('nexus://permissions');
          }}
        />
      </div>

      {/* 2b. Bookmarks Bar (Toolbar) */}
      {settings.showBookmarksBar !== false && (
        <BookmarksBar
          bookmarks={bookmarks}
          onNavigate={handleNavigate}
          onOpenBookmarksManager={handleOpenBookmarksPage}
          onCreateFolder={handleCreateBookmarkFolder}
        />
      )}

      {/* Body: Left Sidebar + Central Content + Right Toolbar / SidePanel */}
      <div className="browser-body-layout">
        {/* 4. Collapsible Left Sidebar (Workspaces) */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectWorkspace={handleSwitchWorkspace}
          onCreateWorkspace={() => {
            setEditingWorkspace(null);
            setIsWorkspaceModalOpen(true);
          }}
          onEditWorkspace={(ws) => {
            setEditingWorkspace(ws);
            setIsWorkspaceModalOpen(true);
          }}
          tabGroups={tabGroups}
          onCreateGroup={handleCreateGroup}
          onNavigate={handleNavigate}
          pinnedCount={workspaceTabs.filter((t) => t.isPinned).length}
        />

        {/* Optional Vertical Tab Strip */}
        {settings.tabLayout === 'vertical' && (
          <VerticalTabBar
            tabs={tabs}
            tabGroups={tabGroups}
            workspaces={workspaces}
            activeTabId={activeTabId}
            activeWorkspaceId={activeWorkspaceId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
            onDuplicateTab={handleDuplicateTab}
            onReloadTab={handleReload}
            onTogglePinTab={handleTogglePinTab}
            onToggleMuteTab={handleToggleMuteTab}
            onSetTabGroup={handleSetTabGroup}
            onMoveTabToWorkspace={handleMoveTabToWorkspace}
            onReorderTabs={handleReorderTabs}
            onCreateGroup={handleCreateGroup}
            onToggleGroupCollapse={handleToggleGroupCollapse}
          />
        )}

        {/* 5. Central Browser Content Area */}
        <main className="browser-content-host">
          {isNewTab && (
            <NewTabWorkspace
              onNavigate={handleNavigate}
              recentPages={historyEntries.slice(0, 10).map((h) => ({
                title: h.title,
                url: h.url,
                timestamp: h.timestamp,
              }))}
              onClearRecentPages={handleClearAllHistory}
            />
          )}

          {(isExtensionsPage || isCompatibilityPage) && (
            <ExtensionsPage
              extensions={extensions}
              onInstallUnpacked={handleInstallUnpacked}
              onToggleExtension={handleToggleExtension}
              onReloadExtension={handleReloadExtension}
              onUninstallExtension={handleUninstallExtension}
              onOpenPopup={handleOpenExtensionPopup}
              onOpenCompatibility={handleOpenCompatibilityGuide}
            />
          )}

          {isBookmarksPage && (
            <BookmarksPage
              bookmarks={bookmarks}
              onNavigate={handleNavigate}
              onSaveBookmark={handleSaveBookmark}
              onCreateFolder={handleCreateBookmarkFolder}
              onRemoveBookmark={handleRemoveBookmark}
              onExportHtml={handleExportBookmarksHtml}
              onImportHtml={handleImportBookmarksHtml}
            />
          )}

          {isHistoryPage && (
            <HistoryPage
              history={historyEntries}
              onNavigate={handleNavigate}
              onDeleteEntry={handleDeleteHistoryEntry}
              onDeleteRange={handleDeleteHistoryRange}
              onClearAll={handleClearAllHistory}
              onOpenClearDialog={() => setIsClearDataModalOpen(true)}
            />
          )}

          {isDownloadsPage && (
            <DownloadsPage
              downloads={downloads}
              downloadDirectory={downloadDirectory}
              onChangeDownloadDirectory={handleChangeDownloadDirectory}
              onPauseDownload={handlePauseDownload}
              onResumeDownload={handleResumeDownload}
              onCancelDownload={handleCancelDownload}
              onOpenFile={handleOpenFile}
              onShowInFolder={handleShowInFolder}
              onClearDownloads={handleClearDownloadsList}
              onRemoveDownload={handleRemoveDownloadEntry}
            />
          )}

          {isPermissionsPage && (
            <PermissionsPage onNavigate={handleNavigate} />
          )}

          {isShieldPage && (
            <ShieldDashboard
              onNavigate={handleNavigate}
              onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
            />
          )}

          {isNotesPage && (
            <NotesPage
              onNavigate={handleNavigate}
              activeTabUrl={activeTab?.url}
              activeTabTitle={activeTab?.title}
              activeTabFavicon={activeTab?.favicon}
            />
          )}

          {isIntelligencePage && (
            <IntelligencePage
              initialTab="dictionary"
              onNavigate={handleNavigate}
              onSendToNotes={(text, title) => {
                if (api) {
                  api.saveNote({
                    title: title || 'Note from Explore',
                    content: `<p>${text}</p>`,
                  });
                }
              }}
            />
          )}

          {isNewsPage && (
            <IntelligencePage
              initialTab="news"
              onNavigate={handleNavigate}
              onSendToNotes={(text, title) => {
                if (api) {
                  api.saveNote({
                    title: title || 'Note from News',
                    content: `<p>${text}</p>`,
                  });
                }
              }}
            />
          )}

          {isMarketsPage && (
            <MarketsDashboard
              onNavigate={handleNavigate}
              onSendToNotes={(text, title) => {
                if (api) {
                  api.saveNote({
                    title: title || 'Note from Markets',
                    content: `<p>${text}</p>`,
                  });
                }
              }}
            />
          )}

          {isHubPage && (
            <HubWorkspace
              onNavigate={handleNavigate}
              onOpenSettings={() => setActiveSidePanel('settings')}
            />
          )}

          {isConnectPage && (
            <ConnectWorkspace
              onNavigate={handleNavigate}
              onOpenTab={async (url, pinned) => {
                const tabId = await api?.createTab(url, activeWorkspaceId, false);
                if (pinned && tabId && api?.pinTab) {
                  await api.pinTab(tabId);
                }
              }}
              onAddTodo={(app, workspace) => {
                setTodoPrefill({
                  title: `Follow up on ${app.name}`,
                  category: workspace?.name || (app.category === 'chill' ? 'Personal' : 'Work'),
                  associatedUrl: app.url,
                  associatedTitle: app.name,
                  associatedConnectAppId: app.id,
                  associatedConnectAppName: app.name,
                  associatedWorkspaceId: workspace?.id,
                  associatedWorkspaceName: workspace?.name,
                });
                handleNavigate('nexus://todo');
              }}
            />
          )}

          {isTodoPage && (
            <TodoWorkspace
              onNavigate={handleNavigate}
              currentPageUrl={activeTab?.url}
              currentPageTitle={activeTab?.title}
              initialPrefill={todoPrefill}
              onClearPrefill={() => setTodoPrefill(null)}
            />
          )}

          {(isSettingsPage || isPrivacyPage) && (
            <SettingsWorkspace
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNavigate={handleNavigate}
              onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
              initialSection={isPrivacyPage ? 'privacy-center' : 'general'}
            />
          )}

          {isWarningPage && (
            <MaliciousWarningPage
              url={activeTab?.url || ''}
              onNavigate={handleNavigate}
              onGoBack={handleGoBack}
            />
          )}

          {isDevDashboard && (
            <DeveloperDashboard
              systemInfo={systemInfo}
              tabs={tabs}
              onSelectTab={handleSelectTab}
              onNavigate={handleNavigate}
              onToggleDevTools={handleToggleDevTools}
              onInspectElement={handleInspectElement}
              onToggleResponsive={handleToggleResponsive}
              onOpenJsonFormatter={handleOpenJsonFormatter}
            />
          )}
        </main>

        {/* Responsive Device Emulation Bar */}
        {isResponsiveBarOpen && activeTabId && (
          <ResponsiveDeviceBar
            activeTabId={activeTabId}
            onClose={() => setIsResponsiveBarOpen(false)}
          />
        )}

        {/* Reader Mode Overlay */}
        {isReaderModeOpen && readerArticle && (
          <ReaderView
            article={readerArticle}
            onClose={() => { setIsReaderModeOpen(false); setReaderArticle(null); }}
          />
        )}

        {/* JSON Formatter Modal */}
        <JsonFormatterModal
          isOpen={isJsonFormatterOpen}
          onClose={() => setIsJsonFormatterOpen(false)}
        />

        {/* 3. Right Side Panel (Flyout drawer) */}
        {activeSidePanel && (
          <SidePanel
            type={activeSidePanel}
            onClose={() => setActiveSidePanel(null)}
            bookmarks={bookmarks}
            onAddBookmark={handleToggleBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            onNavigate={handleNavigate}
            onOpenBookmarksPage={handleOpenBookmarksPage}
            downloads={downloads}
            onClearDownloads={handleClearDownloadsList}
            onPauseDownload={handlePauseDownload}
            onResumeDownload={handleResumeDownload}
            onCancelDownload={handleCancelDownload}
            onOpenFile={handleOpenFile}
            onShowInFolder={handleShowInFolder}
            onOpenDownloadsPage={handleOpenDownloadsPage}
            onChangeDownloadDirectory={handleChangeDownloadDirectory}
            downloadDirectory={downloadDirectory}
            extensions={extensions}
            onToggleExtension={handleToggleExtension}
            onOpenExtensionsPage={handleOpenExtensionsPage}
            onInstallUnpacked={handleInstallUnpacked}
            onOpenCompatibility={handleOpenCompatibilityGuide}
            onReloadExtension={handleReloadExtension}
            onUninstallExtension={handleUninstallExtension}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearCache={handleClearCache}
            currentUrl={activeTab?.url}
            isBookmarked={isBookmarked}
            history={historyEntries}
            onDeleteHistoryEntry={handleDeleteHistoryEntry}
            onClearHistory={handleClearAllHistory}
            onOpenHistoryPage={handleOpenHistoryPage}
            onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
            profiles={profiles}
            activeProfile={activeProfile}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onSwitchProfile={handleSwitchProfile}
            onOpenPermissionsPage={() => handleNavigate('nexus://permissions')}
            activeTabId={activeTabId}
            onToggleDevTools={handleToggleDevTools}
            onInspectElement={handleInspectElement}
            onViewSource={handleViewSource}
            onToggleResponsive={handleToggleResponsive}
            onOpenReaderMode={handleOpenReaderMode}
            onOpenJsonFormatter={handleOpenJsonFormatter}
            onOpenDevDashboard={handleOpenDevDashboard}
            telemetry={modeTelemetry}
            onOptimizeMemory={optimizeMemory}
            onSelectMode={setBrowserMode}
            onUpdateModeConfig={updateModeConfig}
            onRestoreDefaults={restoreModeDefaults}
            onEnterFocusWorkspace={handleEnterFocusWorkspace}
            activeTabTitle={activeTab?.title}
            activeTabFavicon={activeTab?.favicon}
          />
        )}

        {/* 3. Right-side Toolbar Action Buttons */}
        <RightToolbar
          activePanel={activeSidePanel}
          onTogglePanel={setActiveSidePanel}
          downloadCount={downloads.filter((d) => d.status === 'progressing').length}
          bookmarkCount={bookmarks.length}
          extensions={extensions}
          onOpenExtensionPopup={handleOpenExtensionPopup}
          onOpenVpnService={handleNewTab}
          minimal={browserMode === 'balanced' && !!settings.balancedMinimalToolbar}
        />
      </div>

      {/* 6. Minimal Bottom Status Bar */}
      <StatusBar
        activeTab={activeTab}
        activeWorkspaceName={activeWorkspace.name}
        hoveredUrl={hoveredUrl}
        currentMode={browserMode}
        telemetry={modeTelemetry}
        onToggleModeSelector={() => setIsModeSelectorOpen(true)}
      />

      {/* 7. Command Palette & Quick Tab Switcher Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tabs={tabs}
        activeTabId={activeTabId}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectTab={handleSelectTab}
        onNewTab={handleNewTab}
        onDuplicateTab={handleDuplicateTab}
        onReopenClosedTab={handleReopenClosedTab}
        onCloseTab={handleCloseTab}
        onNavigate={handleNavigate}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
        onStop={handleStop}
        onGoHome={handleGoHome}
        onToggleDevTools={handleToggleDevTools}
        onClearCache={handleClearCache}
        onSelectWorkspace={handleSwitchWorkspace}
        onTogglePanel={(panel) => setActiveSidePanel(panel)}
        onToggleBookmark={handleToggleBookmark}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFocusOmnibox={handleFocusOmnibox}
        onInspectElement={handleInspectElement}
        onToggleResponsive={handleToggleResponsive}
        onOpenReaderMode={handleOpenReaderMode}
        onOpenJsonFormatter={handleOpenJsonFormatter}
        onOpenColorPicker={handleOpenColorPicker}
        onSelectMode={setBrowserMode}
        onOptimizeMemory={optimizeMemory}
        onOpenModeSelector={() => setIsModeSelectorOpen(true)}
      />

      {/* 8. Workspace Management Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => {
          setIsWorkspaceModalOpen(false);
          setEditingWorkspace(null);
        }}
        workspaces={workspaces}
        editingWorkspace={editingWorkspace}
        onSaveWorkspace={handleSaveWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      {/* 9. Tab Search & Recently Closed Modal */}
      <TabSearchModal
        isOpen={isTabSearchOpen}
        onClose={() => setIsTabSearchOpen(false)}
        tabs={tabs}
        workspaces={workspaces}
        tabGroups={tabGroups}
        recentlyClosed={recentlyClosed}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onRestoreClosedTab={(closedTab) => {
          api?.createTab(closedTab.url, closedTab.workspaceId);
          setRecentlyClosed((prev) => prev.filter((c) => c !== closedTab));
        }}
        onClearRecentlyClosed={() => setRecentlyClosed([])}
      />

      {/* 10. Extension Permission Warning Modal */}
      <ExtensionPermissionModal
        isOpen={isPermissionModalOpen}
        validation={permissionValidation}
        onConfirm={handleConfirmInstall}
        onCancel={() => {
          setIsPermissionModalOpen(false);
          setPermissionValidation(null);
        }}
        isInstalling={isInstallingExtension}
      />

      {/* 11. Extension Compatibility Guide Modal */}
      <ExtensionCompatibilityModal
        isOpen={isCompatibilityModalOpen}
        onClose={() => setIsCompatibilityModalOpen(false)}
      />

      {/* 12. Bookmark Edit Modal */}
      <BookmarkEditModal
        isOpen={isBookmarkEditModalOpen}
        bookmark={editingBookmarkItem}
        folders={bookmarks.filter((b) => b.type === 'folder')}
        currentUrl={activeTab?.url}
        currentTitle={activeTab?.title}
        currentFavicon={activeTab?.favicon}
        onSave={handleSaveBookmark}
        onRemove={handleRemoveBookmark}
        onCreateFolder={handleCreateBookmarkFolder}
        onClose={() => {
          setIsBookmarkEditModalOpen(false);
          setEditingBookmarkItem(null);
        }}
      />

      {/* 13. Clear Browsing Data Modal */}
      <ClearBrowsingDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onClear={handleClearBrowsingDataDetailed}
      />

      {/* 14. Site Permission Interactive Prompt */}
      <SitePermissionPromptModal
        prompt={permissionPrompt}
        onRespond={handleRespondPermissionPrompt}
      />

      {/* 15. User Profile Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileSwitched={(prof) => {
          setActiveProfile(prof);
          api?.getProfiles().then(setProfiles).catch(() => {});
        }}
      />

      {/* 16. Browser Mode Selector Modal */}
      <ModeSelectorModal
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
        currentMode={browserMode}
        onSelectMode={setBrowserMode}
        telemetry={modeTelemetry}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onUpdateModeConfig={updateModeConfig}
        onRestoreDefaults={restoreModeDefaults}
        onEnterFocusWorkspace={handleEnterFocusWorkspace}
        onOptimizeMemory={optimizeMemory}
      />

      {/* 17. NEXUS Intelligence Modal */}
      <IntelligenceModal
        isOpen={isIntelligenceModalOpen}
        onClose={() => setIsIntelligenceModalOpen(false)}
        initialTab={intelligenceModalTab}
        initialText={intelligenceInitialText}
        autoLookup={Boolean(intelligenceInitialText)}
        onNavigate={handleNavigate}
        onSendToNotes={(text, title) => {
          if (api) {
            api.saveNote({
              title: title || 'Note from Explore',
              content: `<p>${text}</p>`,
            });
          }
        }}
      />
    </div>
  );
};
