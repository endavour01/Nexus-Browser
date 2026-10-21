import React, { useState, useEffect, memo } from 'react';
import { TabState, TabGroup, Workspace, NexusBrowserMode } from '@shared/types';
import { NexusLogo } from './NexusLogo';
import { TabGroupContextMenu } from './TabGroupContextMenu';
import {
  Plus,
  X,
  Globe,
  Copy,
  Loader2,
  RotateCw,
  Volume2,
  VolumeX,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  EyeOff,
  Layers,
} from 'lucide-react';

interface TitleBarProps {
  tabs: TabState[];
  tabGroups: TabGroup[];
  workspaces: Workspace[];
  activeTabId: string | null;
  activeWorkspaceId: string;
  isMaximized: boolean;
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
  onCreateGroup: (tabId?: string, anchorRect?: { top: number; left: number; bottom: number; right: number }) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onEditGroup: (groupId: string, anchorRect?: { top: number; left: number; bottom: number; right: number }) => void;
  onDeleteGroup: (groupId: string) => void;
  onUngroupGroup: (groupId?: string) => void;
  onCloseGroup: (groupId: string) => void;
  onNewTabInGroup?: (groupId: string) => void;
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

interface TabGroupBlock {
  type: 'group';
  group: TabGroup;
  tabs: TabState[];
}

interface SingleTabBlock {
  type: 'tab';
  tab: TabState;
}

type TabStripItem = TabGroupBlock | SingleTabBlock;

export const TitleBar: React.FC<TitleBarProps> = memo(({
  tabs,
  tabGroups,
  workspaces,
  activeTabId,
  activeWorkspaceId,
  isMaximized,
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
  onNewTabInGroup,
  onMinimize,
  onMaximize,
  onCloseWindow,
  onGoHome,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
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

  // Build contiguous TabStrip items
  const groupMap = new Map<string, TabGroup>();
  for (const g of tabGroups) {
    groupMap.set(g.id, g);
  }

  const stripItems: TabStripItem[] = [];
  const groupBlocks = new Map<string, TabGroupBlock>();

  for (const tab of unpinnedTabs) {
    if (tab.groupId && groupMap.has(tab.groupId)) {
      const group = groupMap.get(tab.groupId)!;
      const existing = groupBlocks.get(group.id);
      if (existing) {
        existing.tabs.push(tab);
      } else {
        const block: TabGroupBlock = {
          type: 'group',
          group,
          tabs: [tab],
        };
        groupBlocks.set(group.id, block);
        stripItems.push(block);
      }
    } else {
      stripItems.push({ type: 'tab', tab });
    }
  }

  // Preserve any freshly created group that hasn't received tabs yet
  for (const g of tabGroups) {
    if (!groupBlocks.has(g.id)) {
      stripItems.push({
        type: 'group',
        group: g,
        tabs: [],
      });
    }
  }

  // Tab drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTabId(id);
    setDraggedGroupId(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== id) {
      setDragOverTabId(id);
    } else if (draggedGroupId) {
      setDragOverTabId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTabId(null);
    setDragOverGroupId(null);

    if (draggedTabId && draggedTabId !== targetId) {
      const currentOrder = workspaceTabs.map((t) => t.id);
      const sourceIndex = currentOrder.indexOf(draggedTabId);
      const targetIndex = currentOrder.indexOf(targetId);
      const targetTab = workspaceTabs.find((t) => t.id === targetId);
      const sourceTab = workspaceTabs.find((t) => t.id === draggedTabId);

      // Group membership sync on drop
      if (targetTab && sourceTab) {
        if (targetTab.groupId && sourceTab.groupId !== targetTab.groupId) {
          onSetTabGroup(draggedTabId, targetTab.groupId);
        } else if (!targetTab.groupId && sourceTab.groupId) {
          onSetTabGroup(draggedTabId, undefined);
        }
      }

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...currentOrder];
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, draggedTabId);
        onReorderTabs(newOrder);
      }
    } else if (draggedGroupId) {
      const currentOrder = workspaceTabs.map((t) => t.id);
      const groupTabIds = workspaceTabs.filter((t) => t.groupId === draggedGroupId).map((t) => t.id);
      if (groupTabIds.length > 0) {
        const remaining = currentOrder.filter((id) => !groupTabIds.includes(id));
        const targetIdx = remaining.indexOf(targetId);
        if (targetIdx !== -1) {
          remaining.splice(targetIdx, 0, ...groupTabIds);
          onReorderTabs(remaining);
        }
      }
    }

    setDraggedTabId(null);
    setDraggedGroupId(null);
  };

  // Group header pill drag handlers
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroupId(groupId);
    setDraggedTabId(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', groupId);
  };

  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (draggedTabId || (draggedGroupId && draggedGroupId !== groupId)) {
      setDragOverGroupId(groupId);
    }
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    setDragOverTabId(null);
    setDragOverGroupId(null);

    if (draggedTabId) {
      // Tab dragged onto group header pill: add tab to that group!
      onSetTabGroup(draggedTabId, targetGroupId);
      const currentOrder = workspaceTabs.map((t) => t.id);
      const sourceIndex = currentOrder.indexOf(draggedTabId);
      const otherGroupTabs = workspaceTabs.filter((t) => t.groupId === targetGroupId && t.id !== draggedTabId);
      if (sourceIndex !== -1) {
        const newOrder = [...currentOrder];
        newOrder.splice(sourceIndex, 1);
        if (otherGroupTabs.length > 0) {
          const lastGroupTab = otherGroupTabs[otherGroupTabs.length - 1];
          const targetIdx = newOrder.indexOf(lastGroupTab.id) + 1;
          newOrder.splice(targetIdx, 0, draggedTabId);
        } else {
          newOrder.push(draggedTabId);
        }
        onReorderTabs(newOrder);
      }
    } else if (draggedGroupId && draggedGroupId !== targetGroupId) {
      // Reorder entire group before targetGroup
      const currentOrder = workspaceTabs.map((t) => t.id);
      const groupTabIds = workspaceTabs.filter((t) => t.groupId === draggedGroupId).map((t) => t.id);
      const targetGroupTabIds = workspaceTabs.filter((t) => t.groupId === targetGroupId).map((t) => t.id);
      if (groupTabIds.length > 0 && targetGroupTabIds.length > 0) {
        const remaining = currentOrder.filter((id) => !groupTabIds.includes(id));
        const firstTargetIdx = remaining.indexOf(targetGroupTabIds[0]);
        if (firstTargetIdx !== -1) {
          remaining.splice(firstTargetIdx, 0, ...groupTabIds);
          onReorderTabs(remaining);
        }
      }
    }

    setDraggedTabId(null);
    setDraggedGroupId(null);
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

  // Helper to render a single tab item
  const renderTab = (tab: TabState, group?: TabGroup) => {
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
        className={`nexus-tab ${group ? 'in-group' : ''} ${isActive ? 'active' : ''} ${
          tab.isPrivate ? 'tab-item-private' : ''
        } ${tab.errorCode ? 'has-error' : ''} ${tab.isSuspended ? 'is-suspended' : ''} ${
          dragOverTabId === tab.id ? 'drag-over' : ''
        }`}
        style={
          group
            ? ({
                borderTopColor: group.color,
                '--group-color': group.color,
              } as React.CSSProperties)
            : undefined
        }
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
        title={`${tab.title || tab.url}\n${tab.url}${
          tab.isSuspended ? '\nSuspended to save memory. Click to restore.' : ''
        }`}
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
            <EyeOff
              size={10}
              className="tab-private-prefix-icon"
              style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle', opacity: 0.8 }}
            />
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
    );
  };

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

      {/* Tabs Container */}
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
                  title={`${tab.title}\n${tab.url}${
                    tab.isSuspended ? '\nSuspended to save memory. Click to restore.' : ''
                  }`}
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
            {stripItems.map((item) => {
              if (item.type === 'tab') {
                return renderTab(item.tab);
              }

              // Group Block
              const isCollapsed = !!item.group.collapsed;
              const hasActiveTab = item.tabs.some((t) => t.id === activeTabId);

              return (
                <React.Fragment key={item.group.id}>
                  {/* Group Header Pill */}
                  <div
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => handleGroupDragStart(e, item.group.id)}
                    onDragOver={(e) => handleGroupDragOver(e, item.group.id)}
                    onDrop={(e) => handleGroupDrop(e, item.group.id)}
                    className={`tab-group-pill ${isCollapsed ? 'collapsed' : 'expanded'} ${
                      hasActiveTab && isCollapsed ? 'has-active-tab' : ''
                    } ${dragOverGroupId === item.group.id ? 'drag-over' : ''}`}
                    style={
                      {
                        borderColor: item.group.color,
                        '--group-color': item.group.color,
                      } as React.CSSProperties
                    }
                    onClick={() => onToggleGroupCollapse(item.group.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      onEditGroup(item.group.id, rect);
                    }}
                    onContextMenu={(e) => handleGroupContextMenu(e, item.group.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleGroupCollapse(item.group.id);
                      } else if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setGroupContextMenu({ x: rect.left, y: rect.bottom, groupId: item.group.id });
                      }
                    }}
                    aria-expanded={!isCollapsed}
                    aria-label={`Tab Group: ${item.group.name}, ${item.tabs.length} tabs`}
                    title={`Group: ${item.group.name} (${item.tabs.length} tabs)\nClick to ${
                      isCollapsed ? 'expand' : 'collapse'
                    }, double-click to edit`}
                  >
                    <span className="tab-group-dot" style={{ backgroundColor: item.group.color }} />
                    <span className="tab-group-title">{item.group.name}</span>
                    {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                    {isCollapsed && hasActiveTab && (
                      <span className="tab-group-active-indicator" title="Active tab is in this group" />
                    )}
                  </div>

                  {/* Render member tabs if not collapsed */}
                  {!isCollapsed && item.tabs.map((tab) => renderTab(tab, item.group))}
                </React.Fragment>
              );
            })}
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

      {/* Right Controls: Window Minimise/Maximise/Close */}
      <div className="titlebar-controls no-drag">
        <div className="window-controls-divider" />

        <div className="window-controls-group">
          <button
            className="titlebar-btn control-btn window-control-btn minimize"
            onClick={onMinimize}
            title="Minimize"
            aria-label="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1">
              <path fill="currentColor" d="M0 0h10v1H0z" />
            </svg>
          </button>
          <button
            className="titlebar-btn control-btn window-control-btn maximize"
            onClick={onMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  fill="currentColor"
                  d="M2.1 0v2H0v8h8V8h2V0H2.1zM7 9H1V3h6v6zm2-2h-1V2H3V1h6v6z"
                />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  fill="currentColor"
                  d="M0 0v10h10V0H0zm9 9H1V1h8v8z"
                />
              </svg>
            )}
          </button>
          <button
            className="titlebar-btn control-btn window-control-btn close btn-close"
            onClick={onCloseWindow}
            title="Close Window"
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                fill="currentColor"
                d="M10 .9L9.1 0 5 4.1.9 0 0 .9 4.1 5 0 9.1l.9.9 4.1-4.1 4.1 4.1.9-.9-4.1-4.1z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Context Menu */}
      {contextMenu.visible && targetTab && (
        <div
          className="tab-context-menu no-drag"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              onTogglePinTab(targetTab.id);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
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
          <button
            className="context-menu-item"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onCreateGroup(targetTab.id, rect);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
          >
            <FolderPlus size={13} />
            <span>Add tab to new group</span>
          </button>

          {tabGroups.length > 0 && (
            <div className="context-menu-group-list">
              {tabGroups.map((g) => (
                <button
                  key={g.id}
                  className="context-menu-item"
                  onClick={() => {
                    onSetTabGroup(targetTab.id, g.id);
                    setContextMenu((prev) => ({ ...prev, visible: false }));
                  }}
                >
                  <span className="tab-group-dot" style={{ backgroundColor: g.color }} />
                  <span>Add to {g.name}</span>
                  {targetTab.groupId === g.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {targetTab.groupId && (
            <button
              className="context-menu-item"
              onClick={() => {
                onSetTabGroup(targetTab.id, undefined);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <Layers size={13} />
              <span>Remove tab from group</span>
            </button>
          )}

          {targetTab.groupId && (
            <button
              className="context-menu-item item-danger"
              onClick={() => {
                onCloseGroup(targetTab.groupId!);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <X size={13} />
              <span>Close group</span>
            </button>
          )}

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

      {/* Group Context Menu */}
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
            onNewTabInGroup={onNewTabInGroup}
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
