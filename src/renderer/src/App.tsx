import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Bookmark,
  BrowserSettings,
  DownloadItem,
  ExtensionItem,
  RecentPage,
  SystemInfo,
  TabState,
  Workspace,
} from '@shared/types';
import { TitleBar } from './components/TitleBar';
import { NavigationBar } from './components/NavigationBar';
import { Sidebar } from './components/Sidebar';
import { RightToolbar, SidePanelType } from './components/RightToolbar';
import { SidePanel } from './components/SidePanel';
import { StatusBar } from './components/StatusBar';
import { NewTabWorkspace } from './components/NewTabWorkspace';
import { CommandPalette } from './components/CommandPalette';

const defaultWorkspaces: Workspace[] = [
  { id: 'default', name: 'Personal', icon: 'User', color: '#A78BFA' },
  { id: 'dev', name: 'Development', icon: 'Code', color: '#38BDF8' },
  { id: 'research', name: 'Research', icon: 'BookOpen', color: '#34D399' },
];

const initialExtensions: ExtensionItem[] = [
  {
    id: 'react-devtools',
    name: 'React Developer Tools',
    version: '5.2.0',
    description: 'Inspect React component hierarchies, props, state and hooks.',
    enabled: true,
    icon: 'Code2',
  },
  {
    id: 'ublock-core',
    name: 'uBlock Core Defender',
    version: '1.58.0',
    description: 'High-performance ad & tracker blocking engine.',
    enabled: true,
    icon: 'Shield',
  },
  {
    id: 'json-viewer',
    name: 'JSON Viewer Pro',
    version: '2.1.4',
    description: 'Syntax highlighting, folding, and path copying for JSON endpoints.',
    enabled: true,
    icon: 'FileCode',
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader Mode',
    version: '4.9.80',
    description: 'Inverts colors on websites without native dark mode support.',
    enabled: false,
    icon: 'Moon',
  },
];

const initialDownloads: DownloadItem[] = [
  {
    id: 'dl-1',
    filename: 'nexus-linux-x64.tar.gz',
    url: 'https://nexus.dev/builds/latest',
    filesize: '78.4 MB',
    progress: 100,
    status: 'completed',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'dl-2',
    filename: 'docker-compose.yml',
    url: 'https://raw.githubusercontent.com/...',
    filesize: '2.4 KB',
    progress: 100,
    status: 'completed',
    timestamp: Date.now() - 7200000,
  },
];

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<SidePanelType>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('default');
  const [workspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [hoveredUrl] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [focusOmniboxTrigger, setFocusOmniboxTrigger] = useState(0);

  // Persistent user data
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'bm-1', title: 'GitHub: Let’s build from here', url: 'https://github.com', createdAt: Date.now() },
      { id: 'bm-2', title: 'Hacker News', url: 'https://news.ycombinator.com', createdAt: Date.now() },
      { id: 'bm-3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', createdAt: Date.now() },
    ];
  });

  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_downloads');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialDownloads;
  });

  const [extensions, setExtensions] = useState<ExtensionItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_extensions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialExtensions;
  });

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
    };
  });

  const [recentPages, setRecentPages] = useState<RecentPage[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { title: 'Example Domain', url: 'https://example.com', timestamp: Date.now() - 100000 },
      { title: 'GitHub: Let’s build from here', url: 'https://github.com', timestamp: Date.now() - 200000 },
    ];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('nexus_downloads', JSON.stringify(downloads));
  }, [downloads]);

  useEffect(() => {
    localStorage.setItem('nexus_extensions', JSON.stringify(extensions));
  }, [extensions]);

  useEffect(() => {
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('nexus_history', JSON.stringify(recentPages));
  }, [recentPages]);

  const api = window.nexusAPI;

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || null,
    [tabs, activeTabId]
  );

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );

  const isBookmarked = useMemo(() => {
    if (!activeTab || activeTab.url === 'nexus://newtab') return false;
    return bookmarks.some((b) => b.url === activeTab.url);
  }, [bookmarks, activeTab]);

  // Sync System Info & Listeners
  useEffect(() => {
    if (!api) return;

    api.getSystemInfo().then(setSystemInfo).catch(console.error);

    const unsubscribeTabs = api.onTabsUpdated((updatedTabs, activeId) => {
      setTabs(updatedTabs);
      setActiveTabId(activeId);

      // Track recent page history when a tab loads a real website
      const current = updatedTabs.find((t) => t.id === activeId);
      if (current && current.url && current.url !== 'nexus://newtab') {
        setRecentPages((prev) => {
          const filtered = prev.filter((p) => p.url !== current.url);
          return [
            {
              title: current.title || current.url,
              url: current.url,
              timestamp: Date.now(),
            },
            ...filtered,
          ].slice(0, 20);
        });
      }
    });

    const unsubscribeMax = api.onWindowMaximizedChange(setIsMaximized);
    api.isWindowMaximized().then(setIsMaximized);

    return () => {
      unsubscribeTabs();
      unsubscribeMax();
    };
  }, [api]);

  // Dynamic 4-Axis Bounds Synchronization with Electron WebContentsView
  useEffect(() => {
    if (!api) return;

    const sidebarWidth = sidebarCollapsed ? 48 : 210;
    const rightToolbarWidth = 44;
    const sidePanelWidth = activeSidePanel ? 310 : 0;
    const topOffset = 84; // TitleBar (40px) + NavigationBar (44px)
    const bottomOffset = 24; // StatusBar (24px)

    api.updateContentBounds({
      top: topOffset,
      left: sidebarWidth,
      right: rightToolbarWidth + sidePanelWidth,
      bottom: bottomOffset,
    });
  }, [api, sidebarCollapsed, activeSidePanel]);

  // Tab Handlers
  const handleSelectTab = useCallback(
    (id: string) => {
      api?.switchTab(id);
    },
    [api]
  );

  const handleCloseTab = useCallback(
    (id: string) => {
      api?.closeTab(id);
    },
    [api]
  );

  const handleNewTab = useCallback(() => {
    api?.createTab('nexus://newtab', activeWorkspaceId);
  }, [api, activeWorkspaceId]);

  const handleDuplicateTab = useCallback(
    (id: string) => {
      api?.duplicateTab(id);
    },
    [api]
  );

  const handleReopenClosedTab = useCallback(() => {
    api?.reopenClosedTab();
  }, [api]);

  const handleNavigate = useCallback(
    (url: string) => {
      if (activeTabId) {
        api?.navigate(activeTabId, url);
      }
    },
    [api, activeTabId]
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
    if (activeTabId) api?.toggleDevTools(activeTabId);
  }, [api, activeTabId]);

  // Zoom Handlers
  const handleZoomIn = useCallback(async () => {
    const next = zoomLevel + 0.2;
    if (next <= 3.0) {
      const applied = await api?.setZoomLevel(next);
      if (typeof applied === 'number') setZoomLevel(applied);
    }
  }, [api, zoomLevel]);

  const handleZoomOut = useCallback(async () => {
    const next = zoomLevel - 0.2;
    if (next >= -2.0) {
      const applied = await api?.setZoomLevel(next);
      if (typeof applied === 'number') setZoomLevel(applied);
    }
  }, [api, zoomLevel]);

  const handleResetZoom = useCallback(async () => {
    const applied = await api?.setZoomLevel(0);
    if (typeof applied === 'number') setZoomLevel(applied);
  }, [api]);

  // Window Controls
  const handleMinimize = useCallback(() => api?.minimizeWindow(), [api]);
  const handleMaximize = useCallback(() => api?.maximizeWindow(), [api]);
  const handleCloseWindow = useCallback(() => api?.closeWindow(), [api]);

  // Bookmarking Handlers
  const handleToggleBookmark = useCallback(() => {
    if (!activeTab || activeTab.url === 'nexus://newtab') return;
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
    } else {
      setBookmarks((prev) => [
        {
          id: `bm-${Date.now()}`,
          title: activeTab.title || activeTab.url,
          url: activeTab.url,
          favicon: activeTab.favicon,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    }
  }, [activeTab, isBookmarked]);

  const handleRemoveBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleClearDownloads = useCallback(() => {
    setDownloads([]);
  }, []);

  const handleToggleExtension = useCallback((id: string) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, enabled: !ext.enabled } : ext))
    );
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<BrowserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const handleClearCache = useCallback(async () => {
    if (api) {
      await api.clearBrowsingData();
    }
  }, [api]);

  // Sync modal open state to main process so WebContentsView is hidden/shown cleanly
  useEffect(() => {
    if (api && api.setModalOpen) {
      api.setModalOpen(isCommandPaletteOpen);
    }
  }, [api, isCommandPaletteOpen]);

  // Tab Cycling Shortcuts
  const handleNextTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    handleSelectTab(tabs[nextIndex].id);
  }, [tabs, activeTabId, handleSelectTab]);

  const handlePrevTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    handleSelectTab(tabs[prevIndex].id);
  }, [tabs, activeTabId, handleSelectTab]);

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
      // Escape: Dismiss Command Palette
      else if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
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
    activeTabId,
    isCommandPaletteOpen,
  ]);

  const isNewTab = !activeTab || activeTab.url === 'nexus://newtab' || activeTab.url === '';

  return (
    <div className="nexus-app">
      {/* 1. Compact Top Tab Strip & Frameless Controls */}
      <TitleBar
        tabs={tabs}
        activeTabId={activeTabId}
        isMaximized={isMaximized}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        onDuplicateTab={handleDuplicateTab}
        onReopenClosedTab={handleReopenClosedTab}
        onReloadTab={handleReload}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onCloseWindow={handleCloseWindow}
      />

      {/* 2. Navigation Toolbar & Omnibox */}
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
      />

      {/* Body: Left Sidebar + Central Content + Right Toolbar / SidePanel */}
      <div className="browser-body-layout">
        {/* 4. Collapsible Left Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectWorkspace={setActiveWorkspaceId}
          onNavigate={handleNavigate}
          pinnedCount={tabs.length}
        />

        {/* 5. Central Browser Content Area */}
        <main className="browser-content-host">
          {isNewTab && (
            <NewTabWorkspace
              onNavigate={handleNavigate}
              systemInfo={systemInfo}
              recentPages={recentPages}
              onClearRecentPages={() => setRecentPages([])}
            />
          )}
        </main>

        {/* 3. Right Side Panel (Flyout drawer) */}
        {activeSidePanel && (
          <SidePanel
            type={activeSidePanel}
            onClose={() => setActiveSidePanel(null)}
            bookmarks={bookmarks}
            onAddBookmark={handleToggleBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            onNavigate={handleNavigate}
            downloads={downloads}
            onClearDownloads={handleClearDownloads}
            extensions={extensions}
            onToggleExtension={handleToggleExtension}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearCache={handleClearCache}
            systemInfo={systemInfo}
            currentUrl={activeTab?.url}
            isBookmarked={isBookmarked}
            history={recentPages}
            onClearHistory={() => setRecentPages([])}
          />
        )}

        {/* 3. Right-side Toolbar Action Buttons */}
        <RightToolbar
          activePanel={activeSidePanel}
          onTogglePanel={setActiveSidePanel}
          downloadCount={downloads.filter((d) => d.status === 'in_progress').length}
          bookmarkCount={bookmarks.length}
        />
      </div>

      {/* 6. Minimal Bottom Status Bar */}
      <StatusBar
        activeTab={activeTab}
        activeWorkspaceName={activeWorkspace.name}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleDevTools={handleToggleDevTools}
        hoveredUrl={hoveredUrl}
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
        onSelectWorkspace={setActiveWorkspaceId}
        onTogglePanel={(panel) => setActiveSidePanel(panel)}
        onToggleBookmark={handleToggleBookmark}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFocusOmnibox={handleFocusOmnibox}
      />
    </div>
  );
};
