import React, { useState, useEffect, useRef, memo } from 'react';
import { TabState, NexusBrowserMode } from '@shared/types';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Home,
  Lock,
  Globe,
  Code2,
  Copy,
  Check,
  Star,
  Compass,
  Sun,
  Zap,
  Shield,
} from 'lucide-react';
import { NexusLogo } from './NexusLogo';
import { ModePopover } from './ModePopover';
import { ShieldPopover } from './ShieldPopover';
import { TabShieldStats } from '@shared/types';

interface NavigationBarProps {
  activeTab: TabState | null;
  onNavigate: (url: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onGoHome: () => void;
  onToggleDevTools: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  focusOmniboxTrigger?: number;
  onToggleSecurityPopover?: () => void;
  currentMode?: NexusBrowserMode;
  onSelectMode?: (mode: NexusBrowserMode) => void;
  onOpenSettings?: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = memo(({
  activeTab,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
  onGoHome,
  onToggleDevTools,
  isBookmarked,
  onToggleBookmark,
  focusOmniboxTrigger,
  onToggleSecurityPopover,
  currentMode = 'default',
  onSelectMode,
  onOpenSettings,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModePopoverOpen, setIsModePopoverOpen] = useState(false);
  const [isShieldPopoverOpen, setIsShieldPopoverOpen] = useState(false);
  const [tabShieldStats, setTabShieldStats] = useState<TabShieldStats | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load and listen for Shield telemetry for active tab
  useEffect(() => {
    let mounted = true;
    if (activeTab?.id) {
      window.nexusAPI
        .getTabShieldStats(activeTab.id)
        .then((stats) => {
          if (mounted) setTabShieldStats(stats);
        })
        .catch(() => {});
    }

    const unsub = window.nexusAPI.onTabShieldStatsUpdated((stats) => {
      if (mounted && stats.tabId === activeTab?.id) {
        setTabShieldStats(stats);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [activeTab?.id, activeTab?.url]);

  const totalBlockedOnTab = tabShieldStats ? tabShieldStats.totalBlocked : 0;

  // Focus and select all text when focusOmniboxTrigger changes
  useEffect(() => {
    if (focusOmniboxTrigger && focusOmniboxTrigger > 0) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusOmniboxTrigger]);

  // Sync input value with activeTab.url when not actively typing/focusing
  useEffect(() => {
    if (!isFocused && activeTab) {
      if (activeTab.url === 'nexus://newtab') {
        setInputValue('');
      } else {
        setInputValue(activeTab.url);
      }
    }
  }, [activeTab?.url, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue.trim());
      inputRef.current?.blur();
    }
  };

  const handleCopyUrl = async () => {
    if (activeTab?.url && activeTab.url !== 'nexus://newtab') {
      await navigator.clipboard.writeText(activeTab.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const isHttps = activeTab?.url.startsWith('https://');
  const isNexusScheme = activeTab?.url.startsWith('nexus://') || !activeTab?.url;
  const isWebPage = activeTab?.url && activeTab.url !== 'nexus://newtab';

  return (
    <div className="navbar-container">
      {/* History & Home Controls */}
      <div className="nav-history-group">
        <button
          className="nexus-icon-btn nav-glass-btn"
          disabled={!activeTab?.canGoBack}
          onClick={onGoBack}
          title="Back (Alt+Left)"
        >
          <ArrowLeft size={15} />
        </button>
        <button
          className="nexus-icon-btn nav-glass-btn"
          disabled={!activeTab?.canGoForward}
          onClick={onGoForward}
          title="Forward (Alt+Right)"
        >
          <ArrowRight size={15} />
        </button>
        {activeTab?.isLoading ? (
          <button
            className="nexus-icon-btn nav-glass-btn"
            onClick={onStop}
            title="Stop loading"
          >
            <X size={15} />
          </button>
        ) : (
          <button
            className="nexus-icon-btn nav-glass-btn"
            onClick={onReload}
            title="Reload (Ctrl+R / F5)"
          >
            <RotateCw size={15} />
          </button>
        )}
        <button
          className="nexus-icon-btn nav-glass-btn"
          onClick={onGoHome}
          title="Home / New Tab"
        >
          <Home size={15} />
        </button>
      </div>

      {/* Combined Omnibox (Address & Search Bar) */}
      <form className={`omnibox ${isFocused ? 'focused' : ''}`} onSubmit={handleSubmit}>
        {/* Security / Protocol Badge */}
        <button
          type="button"
          className={`omnibox-badge-btn ${isNexusScheme ? 'nexus' : isHttps ? 'secure' : 'insecure'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isNexusScheme && onToggleSecurityPopover) {
              onToggleSecurityPopover();
            }
          }}
          title={
            isNexusScheme
              ? 'NEXUS Internal Page'
              : isHttps
              ? 'Connection is secure — Click to view certificate & permissions'
              : 'Not secure — Click to view warnings'
          }
        >
          {isNexusScheme ? (
            <NexusLogo mode={currentMode} size={15} title="NEXUS" />
          ) : isHttps ? (
            <Lock size={13} className="scheme-secure" />
          ) : (
            <Globe size={13} className="scheme-insecure" />
          )}
        </button>

        {/* URL / Query Input */}
        <input
          ref={inputRef}
          type="text"
          className="omnibox-input"
          value={inputValue}
          placeholder="Search DuckDuckGo or enter URL..."
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            inputRef.current?.select();
          }}
          onBlur={() => setIsFocused(false)}
          spellCheck={false}
          autoComplete="off"
        />

        {/* Trailing Actions inside Omnibox */}
        <div className="omnibox-actions">
          {inputValue && isFocused && (
            <button
              type="button"
              className="omnibox-action-btn"
              onClick={() => {
                setInputValue('');
                inputRef.current?.focus();
              }}
              title="Clear text"
            >
              <X size={13} />
            </button>
          )}

          {/* Shield Popover Anchor & Button */}
          <div className="shield-popover-anchor">
            <button
              type="button"
              className={`omnibox-action-btn shield-btn ${isShieldPopoverOpen ? 'active' : ''} ${
                totalBlockedOnTab > 0 ? 'has-blocks' : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsShieldPopoverOpen((prev) => !prev);
              }}
              title={`NEXUS Shield: ${
                totalBlockedOnTab > 0
                  ? `${totalBlockedOnTab} items blocked on this page`
                  : 'Privacy & Security Protection'
              }`}
            >
              <Shield size={13} className={totalBlockedOnTab > 0 ? 'text-accent' : ''} />
              {totalBlockedOnTab > 0 && (
                <span className="shield-nav-badge">
                  {totalBlockedOnTab > 99 ? '99+' : totalBlockedOnTab}
                </span>
              )}
            </button>

            {isShieldPopoverOpen && (
              <ShieldPopover
                isOpen={isShieldPopoverOpen}
                onClose={() => setIsShieldPopoverOpen(false)}
                currentUrl={activeTab?.url || ''}
                activeTabId={activeTab?.id}
                onOpenDashboard={() => {
                  setIsShieldPopoverOpen(false);
                  onNavigate('nexus://shield');
                }}
              />
            )}
          </div>

          {isWebPage && (
            <>
              {/* Bookmark Star Button */}
              <button
                type="button"
                className={`omnibox-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={onToggleBookmark}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page (Ctrl+D)'}
              >
                <Star
                  size={13}
                  className={isBookmarked ? 'fill-accent text-accent' : ''}
                />
              </button>

              {/* Copy URL Button */}
              <button
                type="button"
                className="omnibox-action-btn"
                onClick={handleCopyUrl}
                title="Copy URL"
              >
                {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Power Tools Group */}
      <div className="nav-tools-group">
        {/* Browser Mode Switcher & Popover */}
        <div className="mode-switcher-wrapper">
          <button
            type="button"
            className={`nexus-icon-btn nav-glass-btn mode-switcher-btn mode-switcher-${currentMode || 'default'} ${
              isModePopoverOpen ? 'active' : ''
            }`}
            onClick={() => setIsModePopoverOpen((prev) => !prev)}
            title={`Current Mode: ${
              currentMode === 'performance'
                ? 'Performance'
                : currentMode === 'balanced'
                ? 'Balanced'
                : 'Default'
            }. Click to switch.`}
            aria-haspopup="dialog"
            aria-expanded={isModePopoverOpen}
            aria-label={`Switch browser mode. Currently ${
              currentMode === 'performance'
                ? 'Performance'
                : currentMode === 'balanced'
                ? 'Balanced'
                : 'Default'
            }`}
          >
            {currentMode === 'performance' ? (
              <Zap size={14} className="text-[#F02D43]" />
            ) : currentMode === 'balanced' ? (
              <Sun size={14} className="text-[#F5C542]" />
            ) : (
              <Compass size={14} className="text-[#A78BFA]" />
            )}
            <span className="mode-switcher-label">
              {currentMode === 'performance'
                ? 'Performance'
                : currentMode === 'balanced'
                ? 'Balanced'
                : 'Default'}
            </span>
          </button>

          {isModePopoverOpen && (
            <ModePopover
              isOpen={isModePopoverOpen}
              onClose={() => setIsModePopoverOpen(false)}
              currentMode={currentMode || 'default'}
              onSelectMode={(mode) => {
                onSelectMode?.(mode);
                setIsModePopoverOpen(false);
              }}
              onOpenSettings={() => {
                setIsModePopoverOpen(false);
                onOpenSettings?.();
              }}
            />
          )}
        </div>

        <button
          className="nexus-icon-btn nav-glass-btn devtools-btn"
          onClick={onToggleDevTools}
          title="Toggle Web Inspector / DevTools (Ctrl+Shift+I)"
        >
          <Code2 size={16} />
        </button>
      </div>

      {/* Loading Progress Bar */}
      {activeTab?.isLoading && <div className="navbar-loading-bar" />}
    </div>
  );
});
