import React, { useState, useEffect } from 'react';
import { TabState, TabGroup, Workspace } from '@shared/types';
import {
  Plus,
  X,
  Globe,
  Minus,
  Square,
  Copy,
  Terminal,
  Loader2,
  RotateCw,
  Pin,
  Volume2,
  VolumeX,
  Search,
  FolderPlus,
  Sidebar,
  Columns,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface TitleBarProps {
  tabs: TabState[];
  tabGroups: TabGroup[];
  workspaces: Workspace[];
  activeTabId: string | null;
  activeWorkspaceId: string;
  isMaximized: boolean;
  tabLayout: 'horizontal' | 'vertical';
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: (url?: string) => void;
  onDuplicateTab: (id: string) => void;
  onReopenClosedTab: () => void;
  onReloadTab: (id: string) => void;
  onTogglePinTab: (id: string) => void;
  onToggleMuteTab: (id: string) => void;
  onSetTabGroup: (tabId: string, groupId?: string) => void;
  onMoveTabToWorkspace: (tabId: string, workspaceId: string) => void;
  onReorderTabs: (orderedIds: string[]) => void;
  onOpenTabSearch: () => void;
  onCreateGroup: () => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onToggleTabLayout: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onCloseWindow: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  tabs,
  tabGroups,
  workspaces,
  activeTabId,
  activeWorkspaceId,
  isMaximized,
  tabLayout,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onDuplicateTab,
  onReopenClosedTab,
  onReloadTab,
  onTogglePinTab,
  onToggleMuteTab,
  onSetTabGroup,
  onMoveTabToWorkspace,
  onReorderTabs,
  onOpenTabSearch,
  onCreateGroup,
  onToggleGroupCollapse,
  onToggleTabLayout,
  onMinimize,
  onMaximize,
  onCloseWindow,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tabId: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleCloseMenu = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('contextmenu', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('contextmenu', handleCloseMenu);
    };
  }, [contextMenu.visible]);

  // Tabs for the active workspace
  const workspaceTabs = tabs.filter((t) => t.workspaceId === activeWorkspaceId);
  const pinnedTabs = workspaceTabs.filter((t) => t.isPinned);
  const unpinnedTabs = workspaceTabs.filter((t) => !t.isPinned);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== id) {
      setDragOverTabId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTabId(null);
    if (!draggedTabId || draggedTabId === targetId) return;

    const currentOrder = workspaceTabs.map((t) => t.id);
    const sourceIndex = currentOrder.indexOf(draggedTabId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...currentOrder];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, draggedTabId);
      onReorderTabs(newOrder);
    }
    setDraggedTabId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  };

  const targetTab = tabs.find((t) => t.id === contextMenu.tabId);

  // Group collapsed lookup map
  const collapsedGroups = new Set(
    tabGroups.filter((g) => g.collapsed).map((g) => g.id)
  );

  return (
    <div className="titlebar-container drag-region">
      {/* Brand Icon / Logo */}
      <div className="titlebar-brand no-drag" title="NEXUS Browser">
        <div className="brand-badge">
          <Terminal size={14} className="brand-icon" />
          <span className="brand-text">NEXUS</span>
        </div>
      </div>

      {/* Tabs Container (Horizontal Mode) */}
      {tabLayout === 'horizontal' ? (
        <div className="titlebar-tabs-scroll no-drag">
          <div className="titlebar-tabs">
            {/* 1. Pinned Tabs (Compact Squares) */}
            {pinnedTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tab.id)}
                  onDragOver={(e) => handleDragOver(e, tab.id)}
                  onDrop={(e) => handleDrop(e, tab.id)}
                  className={`nexus-tab nexus-pinned-tab ${isActive ? 'active' : ''} ${
                    dragOverTabId === tab.id ? 'drag-over' : ''
                  }`}
                  onClick={() => onSelectTab(tab.id)}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      onCloseTab(tab.id);
                    }
                  }}
                  title={`${tab.title}\n${tab.url}`}
                >
                  {isActive && <div className="tab-active-indicator" />}
                  <div className="tab-icon">
                    {tab.isLoading ? (
                      <Loader2 size={13} className="animate-spin text-accent" />
                    ) : tab.favicon ? (
                      <img src={tab.favicon} alt="" className="tab-favicon" />
                    ) : (
                      <Globe size={13} />
                    )}
                  </div>
                  {tab.hasAudio && (
                    <span className="tab-audio-indicator">
                      {tab.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                    </span>
                  )}
                </div>
              );
            })}

            {pinnedTabs.length > 0 && <div className="pinned-tabs-divider" />}

            {/* 2. Unpinned Tabs & Tab Groups */}
            {unpinnedTabs.map((tab, idx) => {
              const isActive = tab.id === activeTabId;
              const group = tabGroups.find((g) => g.id === tab.groupId);
              const isGroupCollapsed = group && collapsedGroups.has(group.id);

              // If group is collapsed and this tab is not active, skip rendering
              if (isGroupCollapsed && !isActive) return null;

              // Render Group header pill before the first tab of that group
              const prevTab = unpinnedTabs[idx - 1];
              const isFirstOfGroup = group && (!prevTab || prevTab.groupId !== group.id);

              return (
                <React.Fragment key={tab.id}>
                  {isFirstOfGroup && (
                    <div
                      className="tab-group-pill"
                      style={{ borderColor: group.color, color: group.color }}
                      onClick={() => onToggleGroupCollapse(group.id)}
                      title={`Tab Group: ${group.name} (Click to toggle)`}
                    >
                      <span className="tab-group-dot" style={{ backgroundColor: group.color }} />
                      <span className="tab-group-title">{group.name}</span>
                      {isGroupCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                    </div>
                  )}

                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, tab.id)}
                    onDragOver={(e) => handleDragOver(e, tab.id)}
                    onDrop={(e) => handleDrop(e, tab.id)}
                    className={`nexus-tab ${isActive ? 'active' : ''} ${
                      tab.errorCode ? 'has-error' : ''
                    } ${dragOverTabId === tab.id ? 'drag-over' : ''}`}
                    style={group ? { borderTopColor: group.color } : undefined}
                    onClick={() => onSelectTab(tab.id)}
                    onContextMenu={(e) => handleContextMenu(e, tab.id)}
                    onAuxClick={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        onCloseTab(tab.id);
                      }
                    }}
                    title={`${tab.title || tab.url}\n${tab.url}`}
                  >
                    {isActive && (
                      <div
                        className="tab-active-indicator"
                        style={group ? { backgroundColor: group.color } : undefined}
                      />
                    )}

                    <div className="tab-icon">
                      {tab.isLoading ? (
                        <Loader2 size={13} className="animate-spin text-accent" />
                      ) : tab.favicon ? (
                        <img src={tab.favicon} alt="" className="tab-favicon" />
                      ) : (
                        <Globe size={13} />
                      )}
                    </div>

                    <span className="tab-title">{tab.title || 'New Tab'}</span>

                    {tab.hasAudio && (
                      <button
                        className="tab-audio-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMuteTab(tab.id);
                        }}
                        title={tab.isMuted ? 'Unmute' : 'Mute'}
                      >
                        {tab.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    )}

                    <button
                      className="tab-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                      title="Close tab (Ctrl+W)"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* New Tab & Search Tab Actions */}
          <div className="titlebar-tab-actions">
            <button
              className="nexus-icon-btn new-tab-btn"
              onClick={() => onNewTab()}
              title="New Tab (Ctrl+T)"
            >
              <Plus size={14} />
            </button>
            <button
              className="nexus-icon-btn search-tab-btn"
              onClick={onOpenTabSearch}
              title="Search Tabs & History (Ctrl+Shift+A)"
            >
              <Search size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Vertical Tab Mode Banner in TitleBar */
        <div className="titlebar-vtab-indicator no-drag">
          <span className="vtab-active-indicator-text">
            {workspaceTabs.length} tabs in active workspace
          </span>
          <button
            className="nexus-icon-btn search-tab-btn"
            onClick={onOpenTabSearch}
            title="Search Tabs & History (Ctrl+Shift+A)"
          >
            <Search size={14} />
          </button>
        </div>
      )}

      {/* Right Controls: Tab Layout Toggle & Window Minimise/Maximise/Close */}
      <div className="titlebar-controls no-drag">
        <button
          className={`nexus-icon-btn layout-toggle-btn ${tabLayout === 'vertical' ? 'active' : ''}`}
          onClick={onToggleTabLayout}
          title={tabLayout === 'horizontal' ? 'Switch to Vertical Tabs' : 'Switch to Horizontal Tabs'}
        >
          {tabLayout === 'horizontal' ? <Sidebar size={14} /> : <Columns size={14} />}
        </button>

        <div className="window-controls">
          <button
            className="window-control-btn btn-minimize"
            onClick={onMinimize}
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            className="window-control-btn btn-maximize"
            onClick={onMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Square size={11} />
          </button>
          <button
            className="window-control-btn btn-close"
            onClick={onCloseWindow}
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Tab Context Menu */}
      {contextMenu.visible && targetTab && (
        <div
          className="tab-context-menu"
          style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 220) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              onTogglePinTab(targetTab.id);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
            <Pin size={13} />
            <span>{targetTab.isPinned ? 'Unpin Tab' : 'Pin Tab'}</span>
          </button>

          <button
            className="context-menu-item"
            onClick={() => {
              onToggleMuteTab(targetTab.id);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
            {targetTab.isMuted ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{targetTab.isMuted ? 'Unmute Tab' : 'Mute Tab'}</span>
          </button>

          <button
            className="context-menu-item"
            onClick={() => {
              onDuplicateTab(targetTab.id);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
            <Copy size={13} />
            <span>Duplicate Tab</span>
          </button>

          <button
            className="context-menu-item"
            onClick={() => {
              onReloadTab(targetTab.id);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
            <RotateCw size={13} />
            <span>Reload Tab</span>
          </button>

          <div className="context-menu-divider" />

          {/* Tab Groups Menu */}
          <div className="context-menu-submenu-title">Tab Group</div>
          {tabGroups.map((g) => (
            <button
              key={g.id}
              className="context-menu-item"
              onClick={() => {
                onSetTabGroup(targetTab.id, targetTab.groupId === g.id ? undefined : g.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <span className="tab-group-dot" style={{ backgroundColor: g.color }} />
              <span>{targetTab.groupId === g.id ? `Remove from ${g.name}` : `Assign to ${g.name}`}</span>
            </button>
          ))}
          <button
            className="context-menu-item"
            onClick={() => {
              onCreateGroup();
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
            <FolderPlus size={13} />
            <span>New Tab Group...</span>
          </button>

          <div className="context-menu-divider" />

          {/* Workspace Move */}
          <div className="context-menu-submenu-title">Move to Workspace</div>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              className="context-menu-item"
              onClick={() => {
                onMoveTabToWorkspace(targetTab.id, ws.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <span className="tab-group-dot" style={{ backgroundColor: ws.color }} />
              <span>{ws.name}</span>
            </button>
          ))}

          <div className="context-menu-divider" />

          <button
            className="context-menu-item item-danger"
            onClick={() => {
              onCloseTab(targetTab.id);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
            <X size={13} />
            <span>Close Tab</span>
            <span className="context-shortcut">Ctrl+W</span>
          </button>
        </div>
      )}
    </div>
  );
};
