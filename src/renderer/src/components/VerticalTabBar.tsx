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
  Search,
  Copy,
  RotateCw,
  FolderKanban,
} from 'lucide-react';

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
  onOpenTabSearch: () => void;
  onCreateGroup: () => void;
  onToggleGroupCollapse: (groupId: string) => void;
}

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
  onOpenTabSearch,
  onCreateGroup,
  onToggleGroupCollapse,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string;
  }>({ visible: false, x: 0, y: 0, tabId: '' });

  // Filter tabs for active workspace
  const workspaceTabs = tabs.filter((t) => t.workspaceId === activeWorkspaceId);
  const pinnedTabs = workspaceTabs.filter((t) => t.isPinned);
  const unpinnedTabs = workspaceTabs.filter((t) => !t.isPinned);

  // Group unpinned tabs by groupId
  const groupedTabsMap = new Map<string | undefined, TabState[]>();
  for (const tab of unpinnedTabs) {
    const list = groupedTabsMap.get(tab.groupId) || [];
    list.push(tab);
    groupedTabsMap.set(tab.groupId, list);
  }

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

  return (
    <aside className="nexus-vertical-tabs-bar">
      {/* Top Header */}
      <div className="vtabs-header">
        <div className="vtabs-title-wrap">
          <FolderKanban size={13} className="text-accent" />
          <span className="vtabs-heading">Vertical Tabs</span>
        </div>
        <div className="vtabs-actions">
          <button
            className="nexus-icon-btn vtab-action-btn"
            onClick={onOpenTabSearch}
            title="Search Tabs (Ctrl+Shift+A)"
          >
            <Search size={14} />
          </button>
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
                  className={`vtab-pinned-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(tab.id)}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  title={`${tab.title} (${tab.url})`}
                >
                  {tab.isLoading ? (
                    <Loader2 size={13} className="animate-spin text-accent" />
                  ) : tab.favicon ? (
                    <img src={tab.favicon} alt="" className="vtab-pinned-favicon" />
                  ) : (
                    <Globe size={13} className="text-secondary" />
                  )}
                  {tab.hasAudio && (
                    <span className="vtab-pinned-audio-dot" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs List with Groups */}
      <div className="vtabs-scroll-list">
        {/* Render Formally Grouped Tabs */}
        {tabGroups.map((group) => {
          const groupTabs = groupedTabsMap.get(group.id) || [];
          const isCollapsed = !!group.collapsed;

          return (
            <div key={group.id} className="vtab-group-container">
              <div
                className="vtab-group-header"
                onClick={() => onToggleGroupCollapse(group.id)}
                style={{ borderLeftColor: group.color }}
              >
                <span className="vtab-group-dot" style={{ backgroundColor: group.color }} />
                <span className="vtab-group-name">{group.name}</span>
                <span className="vtab-group-count">{groupTabs.length}</span>
                <div className="vtab-group-chevron">
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </div>
              </div>

              {!isCollapsed && (
                <div className="vtab-group-items">
                  {groupTabs.map((tab) => (
                    <div
                      key={tab.id}
                      role="tab"
                      tabIndex={0}
                      aria-selected={tab.id === activeTabId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tab.id)}
                      onDragOver={(e) => handleDragOver(e, tab.id)}
                      onDrop={(e) => handleDrop(e, tab.id)}
                      className={`vtab-item ${tab.id === activeTabId ? 'active' : ''} ${
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
                    >
                      <div className="vtab-favicon-slot">
                        {tab.isLoading ? (
                          <Loader2 size={13} className="animate-spin text-accent" />
                        ) : tab.favicon ? (
                          <img src={tab.favicon} alt="" className="vtab-favicon-img" />
                        ) : (
                          <Globe size={13} className="text-secondary" />
                        )}
                      </div>

                      <span className="vtab-title-text" title={tab.title}>
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
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Render Ungrouped Tabs */}
        {(groupedTabsMap.get(undefined) || []).map((tab) => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            aria-selected={tab.id === activeTabId}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDrop={(e) => handleDrop(e, tab.id)}
            className={`vtab-item ${tab.id === activeTabId ? 'active' : ''} ${
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
          >
            <div className="vtab-favicon-slot">
              {tab.isLoading ? (
                <Loader2 size={13} className="animate-spin text-accent" />
              ) : tab.favicon ? (
                <img src={tab.favicon} alt="" className="vtab-favicon-img" />
              ) : (
                <Globe size={13} className="text-secondary" />
              )}
            </div>

            <span className="vtab-title-text" title={tab.title}>
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
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && targetTab && (
        <div
          className="tab-context-menu"
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

          {/* Grouping Options */}
          <div className="context-menu-submenu-title">Tab Groups</div>
          {tabGroups.map((g) => (
            <button
              key={g.id}
              className="context-menu-item"
              onClick={() => {
                onSetTabGroup(targetTab.id, targetTab.groupId === g.id ? undefined : g.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <span className="vtab-group-dot" style={{ backgroundColor: g.color }} />
              <span>{targetTab.groupId === g.id ? `Remove from ${g.name}` : `Move to ${g.name}`}</span>
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

          {/* Move to Workspace */}
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
              <span className="vtab-group-dot" style={{ backgroundColor: ws.color }} />
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
    </aside>
  );
};
