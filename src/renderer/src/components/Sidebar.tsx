import React from 'react';
import { Workspace, TabGroup, PinnedSiteItem } from '@shared/types';
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
  Plus,
  Settings2,
  FolderPlus,
  Briefcase,
  Globe,
  User,
  Rocket,
  Shield,
  Lock,
  Sparkles,
  Newspaper,
  TrendingUp,
  LayoutGrid,
  CheckSquare,
  Settings,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: () => void;
  onEditWorkspace: (ws: Workspace) => void;
  tabGroups: TabGroup[];
  onCreateGroup: () => void;
  onNavigate: (url: string) => void;
  pinnedCount: number;
}

const defaultPinnedSites: PinnedSiteItem[] = [
  { id: 'pin-1', title: 'GitHub', url: 'https://github.com', icon: 'Code2' },
  { id: 'pin-2', title: 'Vercel', url: 'https://vercel.com', icon: 'Terminal' },
  { id: 'pin-3', title: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'Cpu' },
  { id: 'pin-4', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', icon: 'BookOpen' },
  { id: 'pin-5', title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: 'Compass' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  tabGroups,
  onCreateGroup,
  onNavigate,
  pinnedCount,
}) => {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const activePinnedSites = activeWorkspace?.pinnedSites && activeWorkspace.pinnedSites.length > 0
    ? activeWorkspace.pinnedSites
    : defaultPinnedSites;

  const renderWsIcon = (iconName: string, size = 14) => {
    switch (iconName) {
      case 'Code': return <Code2 size={size} />;
      case 'BookOpen': return <BookOpen size={size} />;
      case 'Briefcase': return <Briefcase size={size} />;
      case 'Terminal': return <Terminal size={size} />;
      case 'Globe': return <Globe size={size} />;
      case 'Rocket': return <Rocket size={size} />;
      case 'Shield': return <Shield size={size} />;
      case 'User':
      default:
        return <User size={size} />;
    }
  };

  const renderPinIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code2': return <Code2 size={14} />;
      case 'Terminal': return <Terminal size={14} />;
      case 'Cpu': return <Cpu size={14} />;
      case 'BookOpen': return <BookOpen size={14} />;
      case 'Compass': return <Compass size={14} />;
      default: return <Globe size={14} />;
    }
  };

  return (
    <aside className={`nexus-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-title-group">
            <Layers size={14} className="text-accent" />
            <span className="sidebar-title">Workspaces</span>
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

      {/* Workspaces Section */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title justify-between">
            <span>Spaces</span>
            <button
              className="sidebar-add-btn"
              onClick={onCreateWorkspace}
              title="Create New Workspace"
            >
              <Plus size={13} />
            </button>
          </div>
        )}
        <div className="workspaces-list">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <div
                key={ws.id}
                className={`workspace-item-wrapper ${isActive ? 'active' : ''}`}
                onClick={() => onSelectWorkspace(ws.id)}
                title={`${ws.name} Workspace ${ws.isolatedSession ? '(Isolated Session)' : ''}`}
              >
                <button className="workspace-item-main">
                  <div
                    className="workspace-dot"
                    style={{ backgroundColor: ws.color }}
                  />
                  {!collapsed && (
                    <div className="workspace-item-content">
                      <span className="workspace-name">{ws.name}</span>
                      {ws.isolatedSession && (
                        <span title="Isolated Session Partition" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Lock size={10} className="text-accent ml-1" />
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {!collapsed && (
                  <button
                    className="workspace-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditWorkspace(ws);
                    }}
                    title="Edit Workspace"
                  >
                    <Settings2 size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {!collapsed && (
            <button className="sidebar-create-row" onClick={onCreateWorkspace}>
              <Plus size={13} />
              <span>New Workspace</span>
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Pinned Sites */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title">
            <Pin size={12} className="text-secondary" />
            <span>Pinned Sites</span>
          </div>
        )}
        <div className="pinned-sites-list">
          {activePinnedSites.map((site) => (
            <button
              key={site.url}
              className="pinned-site-item"
              onClick={() => onNavigate(site.url)}
              title={site.title}
            >
              <div className="pinned-site-icon">{renderPinIcon(site.icon)}</div>
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

      {/* Tab Groups / Tags */}
      {!collapsed && (
        <div className="sidebar-section tab-groups-section">
          <div className="sidebar-section-title justify-between">
            <div className="flex items-center gap-1.5">
              <FolderKanban size={12} className="text-secondary" />
              <span>Tab Groups</span>
            </div>
            <button
              className="sidebar-add-btn"
              onClick={onCreateGroup}
              title="Create New Tab Group"
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="tab-group-tags">
            {tabGroups.length === 0 ? (
              <div className="sidebar-hint-text">No active tab groups</div>
            ) : (
              tabGroups.map((group) => (
                <div key={group.id} className="group-tag-pill">
                  <span className="group-tag-bullet" style={{ background: group.color }} />
                  <span className="group-tag-name">{group.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="sidebar-divider" />

      {/* Intelligence & Knowledge Tools */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title">
            <Sparkles size={12} className="text-secondary" />
            <span>Research & Tools</span>
          </div>
        )}
        <div className="pinned-sites-list">
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://hub')}
            title="NEXUS Hub"
          >
            <div className="pinned-site-icon"><LayoutGrid size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">NEXUS Hub</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://connect')}
            title="NEXUS Connect"
          >
            <div className="pinned-site-icon"><MessageSquare size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Connect</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://notes')}
            title="NEXUS Notes"
          >
            <div className="pinned-site-icon"><FileText size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Notes</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://todo')}
            title="NEXUS Todo"
          >
            <div className="pinned-site-icon"><CheckSquare size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Todo</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://shield')}
            title="NEXUS Shield"
          >
            <div className="pinned-site-icon"><Shield size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Shield</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://explore')}
            title="NEXUS Explore"
          >
            <div className="pinned-site-icon"><Compass size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Explore</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://markets')}
            title="NEXUS Markets"
          >
            <div className="pinned-site-icon"><TrendingUp size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Markets</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://privacy')}
            title="NEXUS Privacy Center"
          >
            <div className="pinned-site-icon"><Lock size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Privacy Center</span>}
          </button>
          <button
            className="pinned-site-item"
            onClick={() => onNavigate('nexus://settings')}
            title="NEXUS Settings"
          >
            <div className="pinned-site-icon"><Settings size={13} className="text-accent" /></div>
            {!collapsed && <span className="pinned-site-name">Settings</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
