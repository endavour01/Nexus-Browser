import React, { useState, useEffect, useRef } from 'react';
import { TabState } from '@shared/types';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Home,
  Lock,
  Globe,
  Terminal,
  Code2,
  Copy,
  Check,
  Star,
} from 'lucide-react';

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
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
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
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          className="nexus-icon-btn"
          disabled={!activeTab?.canGoBack}
          onClick={onGoBack}
          title="Back (Alt+Left)"
        >
          <ArrowLeft size={15} />
        </button>
        <button
          className="nexus-icon-btn"
          disabled={!activeTab?.canGoForward}
          onClick={onGoForward}
          title="Forward (Alt+Right)"
        >
          <ArrowRight size={15} />
        </button>
        {activeTab?.isLoading ? (
          <button
            className="nexus-icon-btn"
            onClick={onStop}
            title="Stop loading"
          >
            <X size={15} />
          </button>
        ) : (
          <button
            className="nexus-icon-btn"
            onClick={onReload}
            title="Reload (Ctrl+R / F5)"
          >
            <RotateCw size={15} />
          </button>
        )}
        <button
          className="nexus-icon-btn"
          onClick={onGoHome}
          title="Home / New Tab"
        >
          <Home size={15} />
        </button>
      </div>

      {/* Combined Omnibox (Address & Search Bar) */}
      <form className={`omnibox ${isFocused ? 'focused' : ''}`} onSubmit={handleSubmit}>
        {/* Security / Protocol Badge */}
        <div className="omnibox-badge">
          {isNexusScheme ? (
            <Terminal size={14} className="scheme-nexus" />
          ) : isHttps ? (
            <Lock size={13} className="scheme-secure" />
          ) : (
            <Globe size={13} className="scheme-insecure" />
          )}
        </div>

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
        <button
          className="nexus-icon-btn devtools-btn"
          onClick={onToggleDevTools}
          title="Toggle Web Inspector / DevTools (Ctrl+Shift+I)"
        >
          <Code2 size={16} />
        </button>
      </div>
    </div>
  );
};
