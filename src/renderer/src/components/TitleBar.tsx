import React from 'react';
import { TabState } from '@shared/types';
import { Plus, X, Globe, Minus, Square, Copy, Terminal, Loader2 } from 'lucide-react';

interface TitleBarProps {
  tabs: TabState[];
  activeTabId: string | null;
  isMaximized: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onCloseWindow: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  tabs,
  activeTabId,
  isMaximized,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onMinimize,
  onMaximize,
  onCloseWindow,
}) => {
  return (
    <div className="titlebar-container drag-region">
      {/* Brand Icon / Logo */}
      <div className="titlebar-brand no-drag" title="NEXUS Browser">
        <div className="brand-badge">
          <Terminal size={14} className="brand-icon" />
          <span className="brand-text">NEXUS</span>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="titlebar-tabs-scroll no-drag">
        <div className="titlebar-tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`nexus-tab ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(tab.id)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    // Middle click to close tab
                    e.preventDefault();
                    onCloseTab(tab.id);
                  }
                }}
                title={tab.title || tab.url}
              >
                {/* Active Indicator Line */}
                {isActive && <div className="tab-active-indicator" />}

                {/* Tab Icon / Spinner */}
                <div className="tab-icon">
                  {tab.isLoading ? (
                    <Loader2 size={13} className="tab-spinner animate-spin" />
                  ) : tab.favicon ? (
                    <img
                      src={tab.favicon}
                      alt=""
                      className="tab-favicon"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe size={13} className="tab-fallback-icon" />
                  )}
                </div>

                {/* Tab Title */}
                <span className="tab-title">
                  {tab.url === 'nexus://newtab' ? 'New Tab' : tab.title || 'Untitled'}
                </span>

                {/* Close Tab Button */}
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
          })}

          {/* New Tab Button */}
          <button
            className="new-tab-btn"
            onClick={onNewTab}
            title="Open new tab (Ctrl+T)"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Window Controls (Frameless) */}
      <div className="window-controls no-drag">
        <button
          className="window-btn minimize"
          onClick={onMinimize}
          title="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          className="window-btn maximize"
          onClick={onMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy size={11} /> : <Square size={11} />}
        </button>
        <button
          className="window-btn close"
          onClick={onCloseWindow}
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
