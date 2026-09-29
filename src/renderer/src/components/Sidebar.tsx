import React from 'react';
import { Workspace } from '@shared/types';
import {
  FolderKanban,
  PanelLeftClose,
  PanelLeft,
  Pin,
  ExternalLink,
  Layers,
  Code2,
  Cpu,
  BookOpen,
  Terminal,
  Compass,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onNavigate: (url: string) => void;
  pinnedCount: number;
}

interface PinnedSite {
  title: string;
  url: string;
  icon: React.ReactNode;
}

const pinnedSites: PinnedSite[] = [
  { title: 'GitHub', url: 'https://github.com', icon: <Code2 size={15} /> },
  { title: 'Vercel', url: 'https://vercel.com', icon: <Terminal size={15} /> },
  { title: 'Stack Overflow', url: 'https://stackoverflow.com', icon: <Cpu size={15} /> },
  { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', icon: <BookOpen size={15} /> },
  { title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: <Compass size={15} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onNavigate,
  pinnedCount,
}) => {
  return (
    <aside className={`nexus-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-title-group">
            <Layers size={14} className="text-accent" />
            <span className="sidebar-title">Spaces</span>
          </div>
        )}
        <button
          className="nexus-icon-btn sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar (Ctrl+Shift+S)' : 'Collapse sidebar (Ctrl+Shift+S)'}
        >
          {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Workspaces List */}
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">Workspaces</div>}
        <div className="workspaces-list">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                className={`workspace-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectWorkspace(ws.id)}
                title={`${ws.name} Workspace`}
              >
                <div
                  className="workspace-dot"
                  style={{ backgroundColor: ws.color }}
                />
                {!collapsed && (
                  <span className="workspace-name">{ws.name}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Pinned Sites */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title">
            <Pin size={12} className="text-secondary" />
            <span>Pinned</span>
          </div>
        )}
        <div className="pinned-sites-list">
          {pinnedSites.map((site) => (
            <button
              key={site.url}
              className="pinned-site-item"
              onClick={() => onNavigate(site.url)}
              title={site.title}
            >
              <div className="pinned-site-icon">{site.icon}</div>
              {!collapsed && (
                <>
                  <span className="pinned-site-name">{site.title}</span>
                  <ExternalLink size={11} className="pinned-ext-icon" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Tab Groups / Developer Tags */}
      {!collapsed && (
        <div className="sidebar-section tab-groups-section">
          <div className="sidebar-section-title">
            <FolderKanban size={12} className="text-secondary" />
            <span>Tab Groups</span>
          </div>
          <div className="tab-group-tags">
            <div className="group-tag-pill active">
              <span className="group-tag-bullet" style={{ background: '#A78BFA' }} />
              <span className="group-tag-name">Main Core</span>
              <span className="group-tag-count">{pinnedCount}</span>
            </div>
            <div className="group-tag-pill">
              <span className="group-tag-bullet" style={{ background: '#38BDF8' }} />
              <span className="group-tag-name">API Docs</span>
              <span className="group-tag-count">0</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
