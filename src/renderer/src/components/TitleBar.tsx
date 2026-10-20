import React, { useState, useEffect, memo } from 'react';
import { TabState, TabGroup, Workspace, NexusBrowserMode } from '@shared/types';
import { NexusLogo } from './NexusLogo';
import { TabGroupContextMenu } from './TabGroupContextMenu';
import {
  Plus,
  X,
  Globe,
  Minus,
  Square,
  Copy,
  Loader2,
  RotateCw,
  Pin,
  Volume2,
  VolumeX,
  FolderPlus,
  Sidebar,
  Columns,
  ChevronRight,
  ChevronDown,
  EyeOff,
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
  onCreateGroup: (tabId?: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onEditGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUngroupGroup: (groupId?: string) => void;
  onCloseGroup: (groupId: string) => void;
  onToggleTabLayout: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onCloseWindow: () => void;
  onGoHome?: () => void;
  currentMode?: NexusBrowserMode;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string;
}

export const TitleBar: React.FC<TitleBarProps> = memo(({
  tabs,
  tabGroups,
  workspaces,
  activeTabId,
  activeWorkspaceId,
  isMaximized,
  tabLayout,
  currentMode = 'default',
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
  onCreateGroup,
  onToggleGroupCollapse,
  onEditGroup,
  onDeleteGroup,
  onUngroupGroup,
  onCloseGroup,
  onToggleTabLayout,
  onMinimize,
  onMaximize,
  onCloseWindow,
  onGoHome,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tabId: '',
  });
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; groupId: string } | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleCloseMenu = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
      setGroupContextMenu(null);
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

  const handleGroupContextMenu = (event: React.MouseEvent, groupId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setGroupContextMenu({ x: event.clientX, y: event.clientY, groupId });
  };

  const targetTab = tabs.find((t) => t.id === contextMenu.tabId);

  // Group collapsed lookup map
  const collapsedGroups = new Set(
    tabGroups.filter((g) => g.collapsed).map((g) => g.id)
  );
  const visibleUnpinnedTabs = unpinnedTabs.filter(
    (tab) => !tab.groupId || !collapsedGroups.has(tab.groupId) || tab.id === activeTabId
  );

  return (
    <div className="titlebar-container drag-region">
      {/* Brand Icon / Logo (Mode-Adaptive N Emblem with Ring) - Acts as Home Button */}
      <button
        type="button"
        className="titlebar-brand titlebar-home-btn no-drag"
        onClick={onGoHome}
        title="Go to Home / New Tab (nexus://newtab)"
        aria-label="NEXUS Home"
      >
        <NexusLogo mode={currentMode} size={24} className="brand-emblem" />
      </button>

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
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tab.id)}
                  onDragOver={(e) => handleDragOver(e, tab.id)}
                  onDrop={(e) => handleDrop(e, tab.id)}
                  className={`nexus-tab nexus-pinned-tab ${isActive ? 'active' : ''} ${
                    tab.isPrivate ? 'tab-item-private' : ''
                  } ${tab.isSuspended ? 'is-suspended' : ''} ${
                    dragOverTabId === tab.id ? 'drag-over' : ''
                  }`}
                  onClick={() => onSelectTab(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTab(tab.id);
                    } else if (e.key === 'Delete') {
                      e.preventDefault();
                      onCloseTab(tab.id);
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      onCloseTab(tab.id);
                    }
                  }}
                  title={`${tab.title}\n${tab.url}${tab.isSuspended ? '\nSuspended to save memory. Click to restore.' : ''}`}
                >
                  {isActive && <div className="tab-active-indicator" />}
                  <div className={`tab-icon ${tab.isSuspended ? 'is-suspended' : ''}`}>
                    {tab.isLoading ? (
                      <Loader2 size={13} className="animate-spin text-accent" />
                    ) : tab.favicon ? (
                      <img src={tab.favicon} alt="" className="tab-favicon" />
                    ) : tab.isPrivate ? (
                      <EyeOff size={13} className="tab-private-icon" />
                    ) : (
                      <Globe size={13} />
                    )}
                    {tab.isSuspended && <span className="tab-suspended-indicator" aria-hidden="true" />}
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
            {visibleUnpinnedTabs.map((tab, idx) => {
              const isActive = tab.id === activeTabId;
              const group = tabGroups.find((g) => g.id === tab.groupId);
              const isGroupCollapsed = group && collapsedGroups.has(group.id);

              // Render Group header pill before the first tab of that group
              const prevTab = visibleUnpinnedTabs[idx - 1];
              const isFirstOfGroup = group && (!prevTab || prevTab.groupId !== group.id);

              return (
                <React.Fragment key={tab.id}>
                  {isFirstOfGroup && (
                    <button
                      type="button"
                      className="tab-group-pill"
                      style={{ borderColor: group.color, '--group-color': group.color } as React.CSSProperties}
                      onClick={() => onToggleGroupCollapse(group.id)}
                      onContextMenu={(event) => handleGroupContextMenu(event, group.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                          event.preventDefault();
                          const bounds = event.currentTarget.getBoundingClientRect();
                          setGroupContextMenu({ x: bounds.left, y: bounds.bottom, groupId: group.id });
                        }
                      }}
                      aria-expanded={!isGroupCollapsed}
                      title={`Tab Group: ${group.name} (Click to toggle)`}
                    >
                      <span className="tab-group-dot" style={{ backgroundColor: group.color }} />
                      <span className="tab-group-title">{group.name}</span>
                      {isGroupCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}

                  <div
                    role="tab"
                    tabIndex={0}
                    aria-selected={isActive}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tab.id)}
                    onDragOver={(e) => handleDragOver(e, tab.id)}
                    onDrop={(e) => handleDrop(e, tab.id)}
                    className={`nexus-tab ${isActive ? 'active' : ''} ${
                      tab.isPrivate ? 'tab-item-private' : ''
                    } ${
                      tab.errorCode ? 'has-error' : ''
                    } ${tab.isSuspended ? 'is-suspended' : ''} ${dragOverTabId === tab.id ? 'drag-over' : ''}`}
                    style={group ? { borderTopColor: group.color } : undefined}
                    onClick={() => onSelectTab(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTab(tab.id);
                      } else if (e.key === 'Delete') {
                        e.preventDefault();
                        onCloseTab(tab.id);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, tab.id)}
                    onAuxClick={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        onCloseTab(tab.id);
                      }
                    }}
                    title={`${tab.title || tab.url}\n${tab.url}${tab.isSuspended ? '\nSuspended to save memory. Click to restore.' : ''}`}
                  >
                    {isActive && (
                      <div
                        className="tab-active-indicator"
                        style={group ? { backgroundColor: group.color } : undefined}
                      />
                    )}

                    <div className={`tab-icon ${tab.isSuspended ? 'is-suspended' : ''}`}>
                      {tab.isLoading ? (
                        <Loader2 size={13} className="animate-spin text-accent" />
                      ) : tab.favicon ? (
                        <img src={tab.favicon} alt="" className="tab-favicon" />
                      ) : tab.isPrivate ? (
                        <EyeOff size={13} className="tab-private-icon" />
                      ) : (
                        <Globe size={13} />
                      )}
                      {tab.isSuspended && <span className="tab-suspended-indicator" aria-hidden="true" />}
                    </div>

                    <span className="tab-title">
                      {tab.isPrivate && tab.favicon && (
                        <EyeOff size={10} className="tab-private-prefix-icon" style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle', opacity: 0.8 }} />
                      )}
                      {tab.title || 'New Tab'}
                    </span>

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

            {tabGroups.filter((group) => !unpinnedTabs.some((tab) => tab.groupId === group.id)).map((group) => (
              <button
                key={`empty-${group.id}`}
                type="button"
                className="tab-group-pill tab-group-pill-empty"
                style={{ borderColor: group.color, '--group-color': group.color } as React.CSSProperties}
                onClick={() => onToggleGroupCollapse(group.id)}
                onContextMenu={(event) => handleGroupContextMenu(event, group.id)}
                onKeyDown={(event) => {
                  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                    event.preventDefault();
                    const bounds = event.currentTarget.getBoundingClientRect();
                    setGroupContextMenu({ x: bounds.left, y: bounds.bottom, groupId: group.id });
                  }
                }}
                aria-expanded={!group.collapsed}
                title={`Empty group: ${group.name}`}
              >
                <span className="tab-group-dot" style={{ backgroundColor: group.color }} />
                <span className="tab-group-title">{group.name}</span>
                {group.collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
              </button>
            ))}
          </div>

          {/* New Tab Action */}
          <div className="titlebar-tab-actions">
            <button
              className="nexus-icon-btn new-tab-btn"
              onClick={() => onNewTab()}
              title="New Tab (Ctrl+T)"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Vertical Tab Mode Banner in TitleBar */
        <div className="titlebar-vtab-indicator no-drag">
          <span className="vtab-active-indicator-text">
            {workspaceTabs.length} tabs in active workspace
          </span>
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

        <div className="window-controls" role="group" aria-label="Window controls">
          <button
            type="button"
            className="window-control-btn btn-minimize"
            onClick={onMinimize}
            title="Minimize"
            aria-label="Minimize window"
          >
            <Minus size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="window-control-btn btn-maximize"
            onClick={onMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
          >
            {isMaximized ? (
              <Copy size={11} strokeWidth={1.8} className="rotate-90" />
            ) : (
              <Square size={11} strokeWidth={1.8} />
            )}
          </button>
          <button
            type="button"
            className="window-control-btn btn-close"
            onClick={onCloseWindow}
            title="Close"
            aria-label="Close window"
          >
            <X size={13} strokeWidth={2} />
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
              onCreateGroup(targetTab.id);
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

      {groupContextMenu && (() => {
        const group = tabGroups.find((item) => item.id === groupContextMenu.groupId);
        if (!group) return null;
        return (
          <TabGroupContextMenu
            group={group}
            tabCount={tabs.filter((tab) => tab.groupId === group.id).length}
            x={groupContextMenu.x}
            y={groupContextMenu.y}
            onEdit={onEditGroup}
            onToggleCollapse={onToggleGroupCollapse}
            onUngroup={onUngroupGroup}
            onDelete={onDeleteGroup}
            onCloseGroup={onCloseGroup}
            onDismiss={() => setGroupContextMenu(null)}
          />
        );
      })()}
    </div>
  );
});
