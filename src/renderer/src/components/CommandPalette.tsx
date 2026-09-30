import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TabState, Workspace, SidePanelType, NexusBrowserMode } from '@shared/types';
import {
  Search,
  Globe,
  Plus,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Home,
  Bookmark,
  History,
  Download,
  Layers,
  Code2,
  Settings,
  Trash2,
  ZoomIn,
  ZoomOut,
  Command,
  X,
  Compass,
  Sun,
  Sidebar as SidebarIcon,
  Maximize2,
  FileCode,
  Sparkles,
  Zap,
  Flame,
  BookOpen,
  Coins,
  Newspaper,
} from 'lucide-react';

export interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabState[];
  activeTabId: string | null;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectTab: (id: string) => void;
  onNewTab: (url?: string) => void;
  onDuplicateTab: (id: string) => void;
  onReopenClosedTab: () => void;
  onCloseTab: (id: string) => void;
  onNavigate: (url: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onGoHome: () => void;
  onToggleDevTools: () => void;
  onClearCache: () => Promise<void>;
  onSelectWorkspace: (id: string) => void;
  onTogglePanel: (panel: SidePanelType) => void;
  onToggleBookmark: () => void;
  onToggleSidebar: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFocusOmnibox: () => void;
  onInspectElement?: () => void;
  onToggleResponsive?: () => void;
  onOpenReaderMode?: () => void;
  onOpenJsonFormatter?: () => void;
  onOpenColorPicker?: () => void;
  onSelectMode?: (mode: NexusBrowserMode) => void;
  onOptimizeMemory?: () => Promise<{ freedMemoryMB: number; suspendedCount: number }> | void;
  onOpenModeSelector?: () => void;
}

// Fuzzy matching algorithm
function fuzzyMatches(text: string, query: string): boolean {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (t.includes(q)) return true;

  // Subsequence match
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
    }
  }
  return qIdx === q.length;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  workspaces,
  onSelectTab,
  onNewTab,
  onDuplicateTab,
  onReopenClosedTab,
  onCloseTab,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
  onGoHome,
  onToggleDevTools,
  onClearCache,
  onSelectWorkspace,
  onTogglePanel,
  onToggleBookmark,
  onToggleSidebar,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFocusOmnibox,
  onInspectElement,
  onToggleResponsive,
  onOpenReaderMode,
  onOpenJsonFormatter,
  onOpenColorPicker,
  onSelectMode,
  onOptimizeMemory,
  onOpenModeSelector,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Active tab reference
  const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId) || null, [tabs, activeTabId]);

  // Reset query and focus when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
    }
  }, [isOpen]);

  // Construct standard command items list
  const standardCommands = useMemo<CommandPaletteItem[]>(() => {
    const cmds: CommandPaletteItem[] = [
      // --- Tabs ---
      {
        id: 'new-tab',
        title: 'New Tab',
        subtitle: 'Open an empty tab with the NEXUS workspace',
        category: 'Tabs',
        shortcut: 'Ctrl+T',
        icon: 'Plus',
        action: () => onNewTab(),
      },
      {
        id: 'close-active-tab',
        title: 'Close Active Tab',
        subtitle: activeTab ? `Close "${activeTab.title}"` : 'Close current tab',
        category: 'Tabs',
        shortcut: 'Ctrl+W',
        icon: 'X',
        action: () => {
          if (activeTabId) onCloseTab(activeTabId);
        },
      },
      {
        id: 'reopen-closed-tab',
        title: 'Reopen Closed Tab',
        subtitle: 'Restore the last closed tab in session',
        category: 'Tabs',
        shortcut: 'Ctrl+Shift+T',
        icon: 'RotateCw',
        action: () => onReopenClosedTab(),
      },
      {
        id: 'duplicate-tab',
        title: 'Duplicate Current Tab',
        subtitle: 'Open an identical copy of the active tab',
        category: 'Tabs',
        icon: 'Copy',
        action: () => {
          if (activeTabId) onDuplicateTab(activeTabId);
        },
      },

      // --- Navigation ---
      {
        id: 'focus-address-bar',
        title: 'Focus Address Bar',
        subtitle: 'Jump cursor to Omnibox input and select URL',
        category: 'Navigation',
        shortcut: 'Ctrl+L',
        icon: 'Globe',
        action: () => onFocusOmnibox(),
      },
      {
        id: 'nav-reload',
        title: 'Reload Page',
        subtitle: 'Refresh current page content',
        category: 'Navigation',
        shortcut: 'Ctrl+R',
        icon: 'RotateCw',
        action: () => onReload(),
      },
      {
        id: 'nav-back',
        title: 'Go Back',
        subtitle: 'Navigate back to previous history state',
        category: 'Navigation',
        shortcut: 'Alt+Left',
        icon: 'ArrowLeft',
        action: () => onGoBack(),
      },
      {
        id: 'nav-forward',
        title: 'Go Forward',
        subtitle: 'Navigate forward in history',
        category: 'Navigation',
        shortcut: 'Alt+Right',
        icon: 'ArrowRight',
        action: () => onGoForward(),
      },
      {
        id: 'nav-home',
        title: 'Go Home',
        subtitle: 'Return to NEXUS workspace',
        category: 'Navigation',
        shortcut: 'Alt+Home',
        icon: 'Home',
        action: () => onGoHome(),
      },
      {
        id: 'nav-stop',
        title: 'Stop Loading',
        subtitle: 'Halt ongoing network requests',
        category: 'Navigation',
        shortcut: 'Escape',
        icon: 'X',
        action: () => onStop(),
      },
      {
        id: 'nav-view-source',
        title: 'View Page Source',
        subtitle: activeTab?.url ? `Inspect raw HTML source of ${activeTab.url}` : 'View page source',
        category: 'Navigation',
        shortcut: 'Ctrl+U',
        icon: 'FileCode',
        action: () => {
          if (activeTab && activeTab.url && activeTab.url !== 'nexus://newtab') {
            const sourceUrl = activeTab.url.startsWith('view-source:')
              ? activeTab.url
              : `view-source:${activeTab.url}`;
            onNavigate(sourceUrl);
          }
        },
      },

      // --- Bookmarks & History ---
      {
        id: 'bookmark-current',
        title: 'Bookmark Active Page',
        subtitle: 'Add or remove the current page from bookmarks',
        category: 'Bookmarks & History',
        shortcut: 'Ctrl+D',
        icon: 'Bookmark',
        action: () => onToggleBookmark(),
      },
      {
        id: 'open-bookmarks',
        title: 'Open Bookmarks Library',
        subtitle: 'Toggle bookmarks side drawer',
        category: 'Bookmarks & History',
        shortcut: 'Ctrl+B',
        icon: 'Bookmark',
        action: () => onTogglePanel('bookmarks'),
      },
      {
        id: 'open-bookmarks-page',
        title: 'Bookmarks Manager Page',
        subtitle: 'Open full-page bookmarks tree & manager (nexus://bookmarks)',
        category: 'Bookmarks & History',
        icon: 'Bookmark',
        action: () => onNavigate('nexus://bookmarks'),
      },
      {
        id: 'open-history',
        title: 'Open Browsing History Drawer',
        subtitle: 'Toggle history side drawer',
        category: 'Bookmarks & History',
        shortcut: 'Ctrl+H',
        icon: 'History',
        action: () => onTogglePanel('history'),
      },
      {
        id: 'open-history-page',
        title: 'History Timeline Page',
        subtitle: 'Open full-page searchable history timeline (nexus://history)',
        category: 'Bookmarks & History',
        icon: 'History',
        action: () => onNavigate('nexus://history'),
      },
      {
        id: 'open-downloads',
        title: 'Open Downloads Drawer',
        subtitle: 'Toggle downloads side drawer',
        category: 'Bookmarks & History',
        shortcut: 'Ctrl+J',
        icon: 'Download',
        action: () => onTogglePanel('downloads'),
      },
      {
        id: 'open-downloads-page',
        title: 'Downloads Manager Page',
        subtitle: 'Open full-page downloads manager (nexus://downloads)',
        category: 'Bookmarks & History',
        icon: 'Download',
        action: () => onNavigate('nexus://downloads'),
      },
      {
        id: 'clear-browsing-data-dlg',
        title: 'Clear Browsing Data...',
        subtitle: 'Delete history, cache, cookies, and download records',
        category: 'Bookmarks & History',
        icon: 'Trash2',
        action: () => onClearCache(),
      },

      // --- Workspaces ---
      ...workspaces.map((ws) => ({
        id: `workspace-${ws.id}`,
        title: `Switch Workspace: ${ws.name}`,
        subtitle: `Filter tabs and context to ${ws.name}`,
        category: 'Workspaces',
        icon: 'Layers',
        action: () => onSelectWorkspace(ws.id),
      })),

      // --- Tools & Developer ---
      {
        id: 'toggle-devtools',
        title: 'Toggle Developer Tools',
        subtitle: 'Inspect DOM elements, network requests, and console',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+Shift+I',
        icon: 'Code2',
        action: () => onToggleDevTools(),
      },
      {
        id: 'toggle-sidebar',
        title: 'Toggle Sidebar',
        subtitle: 'Collapse or expand workspaces sidebar',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+Shift+S',
        icon: 'Sidebar',
        action: () => onToggleSidebar(),
      },
      {
        id: 'open-extensions',
        title: 'Open Extensions & Plugins',
        subtitle: 'Configure privacy shield, developer extensions',
        category: 'Developer & Tools',
        icon: 'Sparkles',
        action: () => onTogglePanel('extensions'),
      },
      {
        id: 'notes-open-workspace',
        title: 'Open NEXUS Notes Workspace',
        subtitle: 'Rich-text notes, diagrams, notebooks, and local offline library',
        category: 'Developer & Tools',
        icon: 'FileText',
        action: () => onNavigate('nexus://notes'),
      },
      {
        id: 'notes-toggle-companion',
        title: 'Toggle Notes Side Panel',
        subtitle: 'Take notes side-by-side with active browser tabs',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+Shift+N',
        icon: 'FileText',
        action: () => onTogglePanel('notes'),
      },
      {
        id: 'intelligence-hub',
        title: 'NEXUS Intelligence Hub (nexus://intelligence)',
        subtitle: 'Contextual research, dictionary, currency converter, and fact-focused news',
        category: 'Developer & Tools',
        icon: 'Sparkles',
        action: () => onNavigate('nexus://intelligence'),
      },
      {
        id: 'intelligence-dictionary',
        title: 'Contextual Dictionary & Vocabulary',
        subtitle: 'Look up words, pronunciation, plain language explanations',
        category: 'Developer & Tools',
        icon: 'BookOpen',
        action: () => onTogglePanel('intelligence'),
      },
      {
        id: 'intelligence-currency',
        title: 'Currency Converter',
        subtitle: 'Convert between global currencies with live ECB rates',
        category: 'Developer & Tools',
        icon: 'Coins',
        action: () => onNavigate('nexus://intelligence'),
      },
      {
        id: 'intelligence-news',
        title: 'Fact-Focused News (nexus://news)',
        subtitle: 'Verifiable reporting dashboard with neutral cross-source coverage',
        category: 'Developer & Tools',
        icon: 'Newspaper',
        action: () => onNavigate('nexus://news'),
      },
      {
        id: 'open-settings',
        title: 'Open Settings',
        subtitle: 'Configure search engine, hardware acceleration',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+,',
        icon: 'Settings',
        action: () => onTogglePanel('settings'),
      },
      {
        id: 'zoom-in',
        title: 'Zoom In',
        subtitle: 'Increase page scale (+25%)',
        category: 'Developer & Tools',
        shortcut: 'Ctrl++',
        icon: 'ZoomIn',
        action: () => onZoomIn(),
      },
      {
        id: 'zoom-out',
        title: 'Zoom Out',
        subtitle: 'Decrease page scale (-25%)',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+-',
        icon: 'ZoomOut',
        action: () => onZoomOut(),
      },
      {
        id: 'zoom-reset',
        title: 'Reset Zoom Level',
        subtitle: 'Restore the default page zoom',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+0',
        icon: 'Maximize2',
        action: () => onResetZoom(),
      },
      {
        id: 'clear-browsing-cache',
        title: 'Clear Cache & Storage',
        subtitle: 'Flush cookies, HTTP cache, and storage data',
        category: 'Developer & Tools',
        icon: 'Trash2',
        action: () => {
          onClearCache();
        },
      },

      // --- Developer Toolkit ---
      {
        id: 'dev-open-toolkit',
        title: 'Open Developer Toolkit Panel',
        subtitle: 'Network monitor, cookies, storage inspector, zoom controls',
        category: 'Developer & Tools',
        icon: 'Code2',
        action: () => onTogglePanel('devtools'),
      },
      {
        id: 'dev-inspect',
        title: 'Inspect Element',
        subtitle: 'Open DevTools focused on the selected element',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+Shift+C',
        icon: 'Code2',
        action: () => onInspectElement?.(),
      },
      {
        id: 'dev-responsive',
        title: 'Responsive / Device Emulation Mode',
        subtitle: 'Preview current page in mobile and tablet viewports',
        category: 'Developer & Tools',
        shortcut: 'Ctrl+Shift+M',
        icon: 'Maximize2',
        action: () => onToggleResponsive?.(),
      },
      {
        id: 'dev-reader',
        title: 'Reader Mode',
        subtitle: 'Extract article content in a distraction-free layout',
        category: 'Developer & Tools',
        icon: 'Globe',
        action: () => onOpenReaderMode?.(),
      },
      {
        id: 'dev-json',
        title: 'JSON Formatter & Inspector',
        subtitle: 'Paste, validate, format and inspect raw JSON',
        category: 'Developer & Tools',
        icon: 'FileCode',
        action: () => onOpenJsonFormatter?.(),
      },
      {
        id: 'dev-color-picker',
        title: 'Color Picker — EyeDropper',
        subtitle: 'Pick a color from anywhere on your screen',
        category: 'Developer & Tools',
        icon: 'Sparkles',
        action: () => onOpenColorPicker?.(),
      },
      {
        id: 'dev-dashboard',
        title: 'Developer Dashboard (nexus://dev)',
        subtitle: 'Open the full developer workbench page',
        category: 'Developer & Tools',
        icon: 'Globe',
        action: () => onNavigate('nexus://dev'),
      },

      // --- Browser Modes & Performance ---
      {
        id: 'mode-default',
        title: 'Switch to Default Mode',
        subtitle: 'Standard dark theme, balanced multitasking',
        category: 'Browser Modes',
        icon: 'Compass',
        action: () => onSelectMode?.('default'),
      },
      {
        id: 'mode-balanced',
        title: 'Switch to Balanced Mode',
        subtitle: 'Warm gold theme, enhanced focus and ambient contrast',
        category: 'Browser Modes',
        icon: 'Sun',
        action: () => onSelectMode?.('balanced'),
      },
      {
        id: 'mode-performance',
        title: 'Switch to Performance Mode',
        subtitle: 'Low-latency UI, background tab throttling and memory optimization',
        category: 'Browser Modes',
        icon: 'Zap',
        action: () => onSelectMode?.('performance'),
      },
      {
        id: 'mode-open-modal',
        title: 'Select Browser Mode...',
        subtitle: 'View detailed comparison of Default, Balanced, and Performance modes',
        category: 'Browser Modes',
        icon: 'Layers',
        action: () => onOpenModeSelector?.(),
      },
      {
        id: 'mode-optimize-memory',
        title: 'Optimize Memory / Suspend Inactive Tabs',
        subtitle: 'Free memory by suspending background tabs that have been idle',
        category: 'Browser Modes',
        icon: 'Trash2',
        action: () => {
          onOptimizeMemory?.();
        },
      },
    ];

    return cmds;
  }, [
    activeTab,
    activeTabId,
    workspaces,
    onNewTab,
    onCloseTab,
    onReopenClosedTab,
    onDuplicateTab,
    onFocusOmnibox,
    onReload,
    onGoBack,
    onGoForward,
    onGoHome,
    onStop,
    onNavigate,
    onToggleBookmark,
    onTogglePanel,
    onSelectWorkspace,
    onToggleDevTools,
    onToggleSidebar,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onClearCache,
    onInspectElement,
    onToggleResponsive,
    onOpenReaderMode,
    onOpenJsonFormatter,
    onOpenColorPicker,
    onSelectMode,
    onOptimizeMemory,
    onOpenModeSelector,
  ]);

  // Open Tab items for quick tab switcher
  const openTabItems = useMemo<CommandPaletteItem[]>(() => {
    return tabs.map((tab) => ({
      id: `tab-${tab.id}`,
      title: tab.title || 'Untitled Tab',
      subtitle: tab.url === 'nexus://newtab' ? 'NEXUS Workspace' : tab.url,
      category: 'Open Tabs',
      icon: 'Globe',
      action: () => onSelectTab(tab.id),
    }));
  }, [tabs, onSelectTab]);

  // Direct search / URL item when user inputs a query
  const directActionItem = useMemo<CommandPaletteItem | null>(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;

    const isUrl =
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('nexus://') ||
      trimmed.startsWith('view-source:') ||
      (trimmed.includes('.') && !trimmed.includes(' ') && trimmed.length > 3);

    if (isUrl) {
      return {
        id: 'direct-open-url',
        title: `Open URL: ${trimmed}`,
        subtitle: 'Navigate directly to web address',
        category: 'Direct Action',
        icon: 'Globe',
        action: () => onNavigate(trimmed),
      };
    } else {
      return {
        id: 'direct-search-query',
        title: `Search DuckDuckGo: "${trimmed}"`,
        subtitle: 'Search the web securely via DuckDuckGo',
        category: 'Direct Action',
        icon: 'Search',
        action: () => onNavigate(`https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`),
      };
    }
  }, [query, onNavigate]);

  // Filtered and aggregated list of items
  const filteredItems = useMemo<CommandPaletteItem[]>(() => {
    const results: CommandPaletteItem[] = [];

    // 1. Direct search / open action
    if (directActionItem) {
      results.push(directActionItem);
    }

    // 2. Open tabs that match query
    const matchingTabs = openTabItems.filter(
      (t) =>
        fuzzyMatches(t.title, query) ||
        (t.subtitle && fuzzyMatches(t.subtitle, query))
    );
    results.push(...matchingTabs);

    // 3. Standard commands that match query
    const matchingCommands = standardCommands.filter(
      (c) =>
        fuzzyMatches(c.title, query) ||
        (c.subtitle && fuzzyMatches(c.subtitle, query)) ||
        fuzzyMatches(c.category, query) ||
        (c.shortcut && fuzzyMatches(c.shortcut, query))
    );
    results.push(...matchingCommands);

    return results;
  }, [directActionItem, openTabItems, standardCommands, query]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('.palette-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside Command Palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        onClose();
        selected.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderIcon = (name?: string) => {
    switch (name) {
      case 'Globe': return <Globe size={15} />;
      case 'Plus': return <Plus size={15} />;
      case 'RotateCw': return <RotateCw size={15} />;
      case 'ArrowLeft': return <ArrowLeft size={15} />;
      case 'ArrowRight': return <ArrowRight size={15} />;
      case 'Home': return <Home size={15} />;
      case 'Bookmark': return <Bookmark size={15} />;
      case 'History': return <History size={15} />;
      case 'Download': return <Download size={15} />;
      case 'Layers': return <Layers size={15} />;
      case 'Code2': return <Code2 size={15} />;
      case 'Settings': return <Settings size={15} />;
      case 'Trash2': return <Trash2 size={15} />;
      case 'ZoomIn': return <ZoomIn size={15} />;
      case 'ZoomOut': return <ZoomOut size={15} />;
      case 'Sidebar': return <SidebarIcon size={15} />;
      case 'Maximize2': return <Maximize2 size={15} />;
      case 'FileCode': return <FileCode size={15} />;
      case 'Sparkles': return <Sparkles size={15} />;
      case 'BookOpen': return <BookOpen size={15} />;
      case 'Coins': return <Coins size={15} />;
      case 'Newspaper': return <Newspaper size={15} />;
      case 'Compass': return <Compass size={15} />;
      case 'Sun': return <Sun size={15} />;
      case 'Zap': return <Zap size={15} />;
      case 'Flame': return <Flame size={15} />;
      case 'Search': return <Search size={15} />;
      case 'X': return <X size={15} />;
      default: return <Command size={15} />;
    }
  };

  // Group items by category for visual organization
  let currentCategory = '';

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Box */}
        <div className="palette-search-wrapper">
          <div className="palette-search-icon">
            <Search size={16} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="palette-search-input"
            placeholder="Type a command, open tab title, or URL..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            spellCheck={false}
            autoComplete="off"
          />
          {query && (
            <button
              className="palette-clear-btn"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}
          <span className="palette-shortcut-badge">ESC</span>
        </div>

        {/* Items List */}
        <div className="palette-list" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="palette-empty-state">
              <Compass size={28} className="palette-empty-icon" />
              <span>No commands or tabs matching "{query}"</span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const showCategoryHeader = item.category !== currentCategory;
              if (showCategoryHeader) {
                currentCategory = item.category;
              }

              return (
                <React.Fragment key={item.id}>
                  {showCategoryHeader && (
                    <div className="palette-category-header">
                      {item.category}
                    </div>
                  )}
                  <div
                    className={`palette-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onClose();
                      item.action();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="palette-item-icon">
                      {renderIcon(item.icon)}
                    </div>
                    <div className="palette-item-content">
                      <span className="palette-item-title">{item.title}</span>
                      {item.subtitle && (
                        <span className="palette-item-sub">{item.subtitle}</span>
                      )}
                    </div>
                    {item.shortcut && (
                      <div className="palette-item-shortcut">
                        {item.shortcut.split('+').map((k, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="kbd-plus">+</span>}
                            <kbd>{k}</kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="palette-footer">
          <div className="footer-keys">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>esc</kbd> Dismiss</span>
          </div>
          <div className="footer-status">
            <span>{filteredItems.length} options</span>
          </div>
        </div>
      </div>
    </div>
  );
};
