import React, { useState, useEffect } from 'react';
import {
  Search,
  Command,
  Clock,
  History,
  Trash2,
  ExternalLink,
  Code2,
  Terminal,
  Cpu,
  BookOpen,
  FileText,
  Compass,
  Zap,
} from 'lucide-react';

interface RecentPage {
  title: string;
  url: string;
  timestamp: number;
}

interface NewTabWorkspaceProps {
  onNavigate: (url: string) => void;
  recentPages: RecentPage[];
  onClearRecentPages: () => void;
}

interface PinnedApp {
  name: string;
  url: string;
  category: string;
  icon: React.ReactNode;
}

const pinnedApps: PinnedApp[] = [
  { name: 'GitHub', url: 'https://github.com', category: 'Source Code', icon: <GithubIcon size={16} /> },
  { name: 'Linear', url: 'https://linear.app', category: 'Issue Tracker', icon: <Zap size={16} /> },
  { name: 'Vercel', url: 'https://vercel.com', category: 'Deployment', icon: <Terminal size={16} /> },
  { name: 'MDN Docs', url: 'https://developer.mozilla.org', category: 'Documentation', icon: <BookOpen size={16} /> },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Q&A', icon: <Cpu size={16} /> },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', category: 'Tech Feed', icon: <Code2 size={16} /> },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', category: 'Search Engine', icon: <Compass size={16} /> },
];

export const NewTabWorkspace: React.FC<NewTabWorkspaceProps> = ({
  onNavigate,
  recentPages,
  onClearRecentPages,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scratchpadText, setScratchpadText] = useState<string>(() => {
    return localStorage.getItem('nexus_scratchpad') || '';
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScratchpadText(val);
    localStorage.setItem('nexus_scratchpad', val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(searchQuery.trim());
    }
  };

  return (
    <div className="nexus-newtab-container">
      <div className="newtab-content-wrapper">
        {/* Top Header */}
        <div className="newtab-top-bar">
          <div className="discreet-clock">
            <Clock size={13} className="text-secondary" />
            <span className="clock-time">{time}</span>
            <span className="clock-separator">·</span>
            <span className="clock-date">{date}</span>
          </div>

        </div>

        {/* Large but Restrained NEXUS Wordmark */}
        <div className="nexus-brand-section">
          <h1 className="nexus-wordmark">
            NEXUS
          </h1>
          <p className="nexus-tagline">A calmer place to browse</p>
        </div>

        {/* Centered Search / Address Box */}
        <form className="newtab-search-box" onSubmit={handleSearchSubmit}>
          <Search size={16} className="newtab-search-icon" />
          <input
            type="text"
            className="newtab-search-input"
            placeholder="Search the web or type a URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            spellCheck={false}
          />
          <div className="newtab-search-kbd">
            <Command size={11} />
            <span>Enter</span>
          </div>
        </form>

        {/* Compact Grid of Pinned Websites */}
        <div className="newtab-section">
          <div className="newtab-section-header">
            <span className="section-label">Quick Access</span>
          </div>
          <div className="pinned-grid">
            {pinnedApps.map((app) => (
              <button
                key={app.url}
                className="pinned-card"
                onClick={() => onNavigate(app.url)}
              >
                <div className="pinned-card-icon">{app.icon}</div>
                <div className="pinned-card-meta">
                  <span className="pinned-card-name">{app.name}</span>
                  <span className="pinned-card-cat">{app.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Lower Section: Recently Visited + Productivity Scratchpad */}
        <div className="newtab-columns">
          {/* Recently Visited */}
          <div className="newtab-col-card">
            <div className="col-header">
              <div className="col-title">
                <History size={13} className="text-secondary" />
                <span>Recent History</span>
              </div>
              {recentPages.length > 0 && (
                <button
                  className="col-action-btn"
                  onClick={onClearRecentPages}
                  title="Clear history"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            <div className="recent-list">
              {recentPages.length === 0 ? (
                <div className="recent-empty">No recent pages yet</div>
              ) : (
                recentPages.slice(0, 5).map((page, idx) => (
                  <div
                    key={`${page.url}-${idx}`}
                    className="recent-item"
                    onClick={() => onNavigate(page.url)}
                  >
                    <div className="recent-info">
                      <span className="recent-title">{page.title || page.url}</span>
                      <span className="recent-url">{page.url}</span>
                    </div>
                    <ExternalLink size={11} className="recent-ext-icon" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Productivity Scratchpad */}
          <div className="newtab-col-card">
            <div className="col-header">
              <div className="col-title">
                <FileText size={13} className="text-secondary" />
                <span>Dev Scratchpad</span>
              </div>
              <span className="col-badge">Local Notes</span>
            </div>
            <textarea
              className="scratchpad-textarea"
              placeholder="Paste snippets, scratch notes, curl commands, or TODOs..."
              value={scratchpadText}
              onChange={handleScratchpadChange}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function GithubIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}
