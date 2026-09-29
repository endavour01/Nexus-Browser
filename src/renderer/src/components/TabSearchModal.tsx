import React, { useState, useEffect, useRef } from 'react';
import { TabState, Workspace, TabGroup, RecentlyClosedTab } from '@shared/types';
import {
  Search,
  X,
  RotateCcw,
  Globe,
  Pin,
  Volume2,
  Trash2,
  Layers,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface TabSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabState[];
  workspaces: Workspace[];
  tabGroups: TabGroup[];
  recentlyClosed: RecentlyClosedTab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onRestoreClosedTab: (tab: RecentlyClosedTab) => void;
  onClearRecentlyClosed: () => void;
}

export const TabSearchModal: React.FC<TabSearchModalProps> = ({
  isOpen,
  onClose,
  tabs,
  workspaces,
  tabGroups,
  recentlyClosed,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onRestoreClosedTab,
  onClearRecentlyClosed,
}) => {
  const [activeView, setActiveView] = useState<'open' | 'closed'>('open');
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, activeView]);

  if (!isOpen) return null;

  const getWorkspaceName = (wsId: string) => {
    return workspaces.find((w) => w.id === wsId)?.name || 'Personal';
  };

  const getWorkspaceColor = (wsId: string) => {
    return workspaces.find((w) => w.id === wsId)?.color || '#A78BFA';
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return null;
    return tabGroups.find((g) => g.id === groupId);
  };

  const filteredOpenTabs = tabs.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.url.toLowerCase().includes(query.toLowerCase()) ||
      getWorkspaceName(t.workspaceId).toLowerCase().includes(query.toLowerCase())
  );

  const filteredClosedTabs = recentlyClosed.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.url.toLowerCase().includes(query.toLowerCase())
  );

  const formatClosedTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = activeView === 'open' ? filteredOpenTabs : filteredClosedTabs;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, list.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + list.length) % Math.max(1, list.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeView === 'open') {
        const item = filteredOpenTabs[selectedIndex];
        if (item) {
          onSelectTab(item.id);
          onClose();
        }
      } else {
        const item = filteredClosedTabs[selectedIndex];
        if (item) {
          onRestoreClosedTab(item);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card tab-search-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search & Tabs Header */}
        <div className="tab-search-header">
          <div className="tab-search-input-wrap">
            <Search size={15} className="text-accent flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="tab-search-input"
              placeholder={activeView === 'open' ? 'Search open tabs across workspaces...' : 'Search recently closed tabs...'}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
            />
            {query && (
              <button
                className="palette-clear-btn"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="tab-search-view-toggles">
            <button
              className={`view-toggle-pill ${activeView === 'open' ? 'active' : ''}`}
              onClick={() => setActiveView('open')}
            >
              Open Tabs ({tabs.length})
            </button>
            <button
              className={`view-toggle-pill ${activeView === 'closed' ? 'active' : ''}`}
              onClick={() => setActiveView('closed')}
            >
              Recently Closed ({recentlyClosed.length})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="tab-search-list">
          {activeView === 'open' ? (
            filteredOpenTabs.length === 0 ? (
              <div className="panel-empty-state">No open tabs matching "{query}"</div>
            ) : (
              filteredOpenTabs.map((tab, idx) => {
                const isSelected = idx === selectedIndex;
                const isActive = tab.id === activeTabId;
                const group = getGroupName(tab.groupId);
                const wsColor = getWorkspaceColor(tab.workspaceId);
                const wsName = getWorkspaceName(tab.workspaceId);

                return (
                  <div
                    key={tab.id}
                    className={`tab-search-item ${isSelected ? 'selected' : ''} ${isActive ? 'active-tab' : ''}`}
                    onClick={() => {
                      onSelectTab(tab.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="tab-search-item-left">
                      {tab.favicon ? (
                        <img src={tab.favicon} alt="" className="tab-favicon-img" />
                      ) : (
                        <Globe size={14} className="text-secondary" />
                      )}
                      <div className="tab-info-stack">
                        <div className="tab-title-line">
                          <span className="tab-item-title">{tab.title}</span>
                          {tab.isPinned && <Pin size={11} className="text-accent inline-icon" />}
                          {tab.hasAudio && <Volume2 size={11} className="text-secondary inline-icon" />}
                        </div>
                        <span className="tab-item-url">{tab.url}</span>
                      </div>
                    </div>

                    <div className="tab-search-item-meta">
                      {group && (
                        <span className="group-chip" style={{ borderColor: group.color, color: group.color }}>
                          {group.name}
                        </span>
                      )}
                      <span className="ws-chip" style={{ borderColor: wsColor }}>
                        <span className="ws-dot" style={{ backgroundColor: wsColor }} />
                        {wsName}
                      </span>
                      <button
                        className="tab-close-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseTab(tab.id);
                        }}
                        title="Close tab"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : filteredClosedTabs.length === 0 ? (
            <div className="panel-empty-state">No recently closed tabs</div>
          ) : (
            filteredClosedTabs.map((closed, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${closed.url}-${closed.closedAt}-${idx}`}
                  className={`tab-search-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onRestoreClosedTab(closed);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="tab-search-item-left">
                    {closed.favicon ? (
                      <img src={closed.favicon} alt="" className="tab-favicon-img" />
                    ) : (
                      <Globe size={14} className="text-secondary" />
                    )}
                    <div className="tab-info-stack">
                      <span className="tab-item-title">{closed.title || closed.url}</span>
                      <span className="tab-item-url">{closed.url}</span>
                    </div>
                  </div>

                  <div className="tab-search-item-meta">
                    <span className="closed-time-badge">
                      <Clock size={11} />
                      {formatClosedTime(closed.closedAt)}
                    </span>
                    <button
                      className="tab-restore-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreClosedTab(closed);
                        onClose();
                      }}
                      title="Restore tab"
                    >
                      <RotateCcw size={12} />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="tab-search-footer">
          <div className="footer-keys">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Switch / Restore</span>
            <span><kbd>esc</kbd> Close</span>
          </div>
          {activeView === 'closed' && recentlyClosed.length > 0 && (
            <button className="panel-text-btn text-danger" onClick={onClearRecentlyClosed}>
              Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
