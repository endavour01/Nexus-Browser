import React, { useState } from 'react';
import { TabState, TabGroup, Workspace } from '@shared/types';
import {
  Plus,
  X,
  Globe,
  Pin,
  Volume2,
  VolumeX,
  Loader2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Copy,
  RotateCw,
  FolderKanban,
  EyeOff,
  Layers,
} from 'lucide-react';
import { TabGroupContextMenu } from './TabGroupContextMenu';

interface VerticalTabBarProps {
  tabs: TabState[];
  tabGroups: TabGroup[];
  workspaces: Workspace[];
  activeTabId: string | null;
  activeWorkspaceId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: (url?: string) => void;
  onDuplicateTab: (id: string) => void;
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

export const VerticalTabBar: React.FC<VerticalTabBarProps> = ({
  tabs,
  tabGroups,
  workspaces,
  activeTabId,
  activeWorkspaceId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onDuplicateTab,
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
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string;
  }>({ visible: false, x: 0, y: 0, tabId: '' });
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; groupId: string } | null>(null);

  // Filter tabs for active workspace
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

  // Group header drag handlers
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

  const renderVerticalTab = (tab: TabState, group?: TabGroup) => {
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
        className={`vtab-item ${group ? 'in-group' : ''} ${isActive ? 'active' : ''} ${
          tab.isPrivate ? 'tab-item-private' : ''
        } ${tab.isSuspended ? 'is-suspended' : ''} ${
          dragOverTabId === tab.id ? 'drag-over' : ''
        }`}
        style={group ? ({ '--group-color': group.color } as React.CSSProperties) : undefined}
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
        title={tab.isSuspended ? 'Suspended to save memory. Click to restore.' : tab.title}
      >
        <div className={`vtab-favicon-slot ${tab.isSuspended ? 'is-suspended' : ''}`}>
          {tab.isLoading ? (
            <Loader2 size={13} className="animate-spin text-accent" />
          ) : tab.favicon ? (
            <img
              src={tab.favicon}
              alt=""
              className={`vtab-favicon-img ${tab.isSuspended ? 'is-suspended' : ''}`}
            />
          ) : tab.isPrivate ? (
            <EyeOff size={13} className="text-secondary" />
          ) : (
            <Globe size={13} className="text-secondary" />
          )}
          {tab.isSuspended && <span className="tab-suspended-indicator" aria-hidden="true" />}
        </div>

        <span className="vtab-title-text" title={tab.title}>
          {tab.isPrivate && tab.favicon && (
            <EyeOff
              size={10}
              style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle', opacity: 0.8 }}
            />
          )}
          {tab.title || 'New Tab'}
        </span>

        <div className="vtab-trailing-actions">
          {tab.hasAudio && (
            <button
              className="vtab-audio-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMuteTab(tab.id);
              }}
              title={tab.isMuted ? 'Unmute tab' : 'Mute tab'}
            >
              {tab.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}
          <button
            className="vtab-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            title="Close tab (Ctrl+W)"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside className="nexus-vertical-tabs-bar" onClick={() => setGroupContextMenu(null)}>
      {/* Top Header */}
      <div className="vtabs-header">
        <div className="vtabs-title-wrap">
          <FolderKanban size={13} className="text-accent" />
          <span className="vtabs-heading">Vertical Tabs</span>
        </div>
        <div className="vtabs-actions">
          <button
            className="nexus-icon-btn vtab-action-btn"
            onClick={() => onNewTab()}
            title="New Tab (Ctrl+T)"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Pinned Tabs Strip */}
      {pinnedTabs.length > 0 && (
        <div className="vtabs-pinned-container">
          <div className="vtabs-section-label">
            <Pin size={10} className="text-secondary" />
            <span>Pinned</span>
          </div>
          <div className="vtabs-pinned-grid">
            {pinnedTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  className={`vtab-pinned-item ${isActive ? 'active' : ''} ${
                    tab.isPrivate ? 'tab-item-private' : ''
                  } ${tab.isSuspended ? 'is-suspended' : ''}`}
                  onClick={() => onSelectTab(tab.id)}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  title={`${tab.title} (${tab.url})${
                    tab.isSuspended ? ' - Suspended to save memory. Click to restore.' : ''
                  }`}
                >
                  {tab.isLoading ? (
                    <Loader2 size={13} className="animate-spin text-accent" />
                  ) : tab.favicon ? (
                    <img
                      src={tab.favicon}
                      alt=""
                      className={`vtab-pinned-favicon ${tab.isSuspended ? 'is-suspended' : ''}`}
                    />
                  ) : tab.isPrivate ? (
                    <EyeOff size={13} className="text-secondary" />
                  ) : (
                    <Globe size={13} className="text-secondary" />
                  )}
                  {tab.hasAudio && <span className="vtab-pinned-audio-dot" />}
                  {tab.isSuspended && <span className="tab-suspended-indicator" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs List with Groups */}
      <div className="vtabs-scroll-list">
        {stripItems.map((item) => {
          if (item.type === 'tab') {
            return renderVerticalTab(item.tab);
          }

          const isCollapsed = !!item.group.collapsed;
          const hasActiveTab = item.tabs.some((t) => t.id === activeTabId);

          return (
            <div key={item.group.id} className="vtab-group-container">
              <button
                type="button"
                draggable
                onDragStart={(e) => handleGroupDragStart(e, item.group.id)}
                onDragOver={(e) => handleGroupDragOver(e, item.group.id)}
                onDrop={(e) => handleGroupDrop(e, item.group.id)}
                className={`vtab-group-header ${dragOverGroupId === item.group.id ? 'drag-over' : ''}`}
                onClick={() => onToggleGroupCollapse(item.group.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  onEditGroup(item.group.id, rect);
                }}
                onContextMenu={(event) => handleGroupContextMenu(event, item.group.id)}
                onKeyDown={(event) => {
                  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                    event.preventDefault();
                    const bounds = event.currentTarget.getBoundingClientRect();
                    setGroupContextMenu({ x: bounds.left, y: bounds.bottom, groupId: item.group.id });
                  }
                }}
                style={
                  {
                    borderLeftColor: item.group.color,
                    '--group-color': item.group.color,
                  } as React.CSSProperties
                }
                aria-expanded={!isCollapsed}
                aria-label={`Tab Group: ${item.group.name}, ${item.tabs.length} tabs`}
              >
                <span className="vtab-group-dot" style={{ backgroundColor: item.group.color }} />
                <span className="vtab-group-name">{item.group.name}</span>
                <span className="vtab-group-count">{item.tabs.length}</span>
                {isCollapsed && hasActiveTab && (
                  <span className="vtab-group-active-dot" title="Active tab is in this group" />
                )}
                <div className="vtab-group-chevron">
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </div>
              </button>

              {!isCollapsed && (
                <div
                  className="vtab-group-items"
                  style={{ borderLeft: `2px solid ${item.group.color}33`, marginLeft: '6px' }}
                >
                  {item.tabs.map((tab) => renderVerticalTab(tab, item.group))}
                </div>
              )}
            </div>
          );
        })}
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
    </aside>
  );
};
