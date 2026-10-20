import React, { useState } from 'react';
import { EyeOff, ShieldCheck, Info, Search, ArrowRight, X, Lock } from 'lucide-react';
import { Card } from './ui/Card/Card';
import { Button } from './ui/Button/Button';

interface PrivateStartPageProps {
  onNavigate: (url: string) => void;
  onClosePrivateSession?: () => void;
}

export const PrivateStartPage: React.FC<PrivateStartPageProps> = ({
  onNavigate,
  onClosePrivateSession,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onNavigate(trimmed);
  };

  return (
    <div className="private-start-container">
      <div className="private-start-content">
        {/* Header Hero */}
        <div className="private-start-hero">
          <div className="private-start-badge-halo">
            <EyeOff size={36} className="private-start-halo-icon" />
          </div>
          <h1 className="private-start-title">You&apos;ve gone Incognito</h1>
          <p className="private-start-desc">
            Now you can browse privately. Other people who use this device won&apos;t see your activity.
          </p>
        </div>

        {/* Incognito Search / URL Bar */}
        <form className="private-start-search-form" onSubmit={handleSubmit}>
          <div className="private-start-search-box">
            <Search size={16} className="private-search-icon" />
            <input
              type="text"
              className="private-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search with DuckDuckGo or enter URL..."
              autoFocus
            />
            <button
              type="submit"
              className="private-search-submit"
              disabled={!query.trim()}
              title="Navigate"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Dual Disclosure Cards */}
        <div className="private-disclosure-grid">
          <Card variant="elevated" className="private-disclosure-card">
            <div className="disclosure-card-header">
              <div className="disclosure-icon-wrap disclosure-icon-wrap--positive">
                <ShieldCheck size={18} />
              </div>
              <h3 className="disclosure-card-title">What NEXUS Incognito does</h3>
            </div>
            <ul className="disclosure-list">
              <li>
                <span className="disclosure-dot disclosure-dot--positive" />
                <span>NEXUS won&apos;t save your browsing history</span>
              </li>
              <li>
                <span className="disclosure-dot disclosure-dot--positive" />
                <span>Cookies and site data are purged when all private tabs close</span>
              </li>
              <li>
                <span className="disclosure-dot disclosure-dot--positive" />
                <span>Form entries, credentials, and temporary caches are not retained</span>
              </li>
              <li>
                <span className="disclosure-dot disclosure-dot--positive" />
                <span>Isolated in-memory partition prevents cross-session tracking</span>
              </li>
            </ul>
          </Card>

          <Card variant="elevated" className="private-disclosure-card">
            <div className="disclosure-card-header">
              <div className="disclosure-icon-wrap disclosure-icon-wrap--neutral">
                <Info size={18} />
              </div>
              <h3 className="disclosure-card-title">What is NOT hidden</h3>
            </div>
            <ul className="disclosure-list">
              <li>
                <span className="disclosure-dot disclosure-dot--neutral" />
                <span>Websites you visit and services you sign in to</span>
              </li>
              <li>
                <span className="disclosure-dot disclosure-dot--neutral" />
                <span>Your internet service provider (ISP) or network administrator</span>
              </li>
              <li>
                <span className="disclosure-dot disclosure-dot--neutral" />
                <span>Files you download remain saved in your Downloads directory</span>
              </li>
              <li>
                <span className="disclosure-dot disclosure-dot--neutral" />
                <span>Bookmarks you explicitly choose to create will be preserved</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Session Actions Footer */}
        {onClosePrivateSession && (
          <div className="private-start-footer">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<X size={14} />}
              onClick={onClosePrivateSession}
              className="private-close-session-btn"
            >
              Close All Incognito Tabs
            </Button>
            <span className="private-shortcut-hint">
              Shortcut: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd> for a new private tab
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
