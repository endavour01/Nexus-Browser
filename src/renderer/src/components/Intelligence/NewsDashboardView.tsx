import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Newspaper,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User,
  Filter,
  Layers,
  ChevronRight,
  EyeOff,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  NewsArticle,
  NewsArticleType,
  NewsCluster,
  NewsSettings,
} from '@shared/types';
import { NexusState } from '../NexusState';

interface NewsDashboardViewProps {
  onNavigate?: (url: string) => void;
  compact?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'world', label: 'World' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'science', label: 'Science' },
  { id: 'environment', label: 'Environment' },
  { id: 'health', label: 'Health' },
];

export const NewsDashboardView: React.FC<NewsDashboardViewProps> = ({
  onNavigate,
  compact = false,
}) => {
  const [settings, setSettings] = useState<NewsSettings>({
    enabled: false,
    enabledCategories: ['world', 'technology', 'business', 'science', 'environment', 'health'],
    hiddenSources: [],
    refreshIntervalMinutes: 60,
  });

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [clusters, setClusters] = useState<NewsCluster[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'feed' | 'clusters'>('feed');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const api = typeof window !== 'undefined' ? window.nexusAPI : null;

  // Load news settings and feed
  const loadFeed = useCallback(async () => {
    if (!api) return;
    setIsLoading(true);
    try {
      const s = await api.getNewsSettings();
      setSettings(s);

      if (s.enabled) {
        const feed = await api.getNewsFeed();
        setArticles(feed.articles || []);
        setClusters(feed.clusters || []);
      } else {
        setArticles([]);
        setClusters([]);
      }
    } catch (err) {
      console.error('[NewsDashboard] Failed to fetch news:', err);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Master Enable/Disable Toggle
  const handleToggleEnabled = async (enabledState: boolean) => {
    if (!api) return;
    setIsLoading(true);
    try {
      const updated = await api.updateNewsSettings({ enabled: enabledState });
      setSettings(updated);
      if (updated.enabled) {
        const feed = await api.getNewsFeed(true);
        setArticles(feed.articles || []);
        setClusters(feed.clusters || []);
      } else {
        setArticles([]);
        setClusters([]);
      }
    } catch (err) {
      console.error('[NewsDashboard] Failed to toggle news enabled state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Category
  const handleToggleCategory = async (catId: string) => {
    if (!api) return;
    const current = new Set(settings.enabledCategories);
    if (current.has(catId)) {
      current.delete(catId);
    } else {
      current.add(catId);
    }
    const updated = await api.updateNewsSettings({
      enabledCategories: Array.from(current),
    });
    setSettings(updated);
    const feed = await api.getNewsFeed();
    setArticles(feed.articles || []);
    setClusters(feed.clusters || []);
  };

  // Unique sources
  const allSources = useMemo(() => {
    const s = new Set<string>();
    articles.forEach((a) => s.add(a.sourceName));
    return Array.from(s).sort();
  }, [articles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Category filter
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      // Source filter
      if (selectedSource !== 'all' && article.sourceName !== selectedSource) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesSummary = article.summary.toLowerCase().includes(q);
        const matchesSource = article.sourceName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesSource) return false;
      }
      return true;
    });
  }, [articles, selectedCategory, selectedSource, searchQuery]);

  // Render classification badge
  const renderClassificationBadge = (type: NewsArticleType) => {
    switch (type) {
      case 'reported-facts':
        return (
          <span className="news-badge badge-fact" title="Primary factual reporting with verified data">
            <CheckCircle2 size={11} /> Reported Fact
          </span>
        );
      case 'claims':
        return (
          <span className="news-badge badge-claim" title="Subject assertion or official statement">
            <AlertCircle size={11} /> Claim / Statement
          </span>
        );
      case 'analysis':
        return (
          <span className="news-badge badge-analysis" title="Analytical assessment and context breakdown">
            <Layers size={11} /> Analysis
          </span>
        );
      case 'opinion':
        return (
          <span className="news-badge badge-opinion" title="Commentary or column viewpoint">
            <FileText size={11} /> Opinion / Perspective
          </span>
        );
    }
  };

  // Open article
  const handleOpenArticle = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else if (api) {
      api.createTab(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // --------------------------------------------------------------------------
  // Opt-in Splash (Disabled by default)
  // --------------------------------------------------------------------------
  if (!settings.enabled) {
    return (
      <div className="nexus-news-disabled-splash">
        <div className="news-splash-card">
          <div className="news-splash-icon-wrapper">
            <Newspaper size={32} className="text-accent" />
          </div>
          <h2 className="news-splash-title">Fact-Focused News Dashboard</h2>
          <p className="news-splash-desc">
            NEXUS News is strictly fact-first and <strong>disabled by default</strong> to respect your focus and
            privacy. When enabled, it surfaces verified reporting directly cited from reputable syndication feeds.
          </p>

          <div className="news-splash-features">
            <div className="news-splash-feat-item">
              <CheckCircle2 size={15} className="text-success shrink-0" />
              <span>Verifiable primary reporting with direct links to original publishers</span>
            </div>
            <div className="news-splash-feat-item">
              <ShieldCheck size={15} className="text-accent shrink-0" />
              <span>Transparent classification of Reported Facts, Claims, Analysis, and Opinion</span>
            </div>
            <div className="news-splash-feat-item">
              <Layers size={15} className="text-secondary shrink-0" />
              <span>Side-by-side cross-source comparison without political bias scores or declared winners</span>
            </div>
          </div>

          <button
            className="nexus-btn-primary news-enable-btn"
            onClick={() => handleToggleEnabled(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Activating Feed...' : 'Enable Fact-Focused News'}
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Active News Dashboard
  // --------------------------------------------------------------------------
  return (
    <div className={`nexus-news-dashboard ${compact ? 'compact-mode' : ''}`}>
      {/* Header Bar */}
      <div className="news-dashboard-header">
        <div className="flex items-center gap-2">
          <div className="news-icon-badge">
            <Newspaper size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="news-dash-title">Fact-Focused News</h2>
            <p className="news-dash-subtitle">Verifiable reporting with direct attribution and neutral analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="news-view-toggle">
            <button
              className={`filter-pill ${viewMode === 'feed' ? 'active' : ''}`}
              onClick={() => setViewMode('feed')}
            >
              Chronological Feed
            </button>
            <button
              className={`filter-pill ${viewMode === 'clusters' ? 'active' : ''}`}
              onClick={() => setViewMode('clusters')}
            >
              Cross-Source Stories ({clusters.length})
            </button>
          </div>

          {/* Settings button */}
          <button
            className={`nexus-icon-btn ${isSettingsOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="News feed preferences"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Settings Drawer / Panel */}
      {isSettingsOpen && (
        <div className="news-settings-panel">
          <div className="news-settings-header justify-between">
            <span className="font-semibold text-sm">News Feed Settings</span>
            <button
              className="nexus-btn-danger nexus-btn-sm"
              onClick={() => handleToggleEnabled(false)}
            >
              Disable News Feed
            </button>
          </div>

          <div className="news-cat-toggles mt-2">
            <span className="text-xs text-secondary mb-1 block">Included Categories:</span>
            <div className="flex flex-wrap gap-1.5">
              {['world', 'technology', 'business', 'science', 'environment', 'health'].map((cat) => (
                <button
                  key={cat}
                  className={`dict-level-pill ${settings.enabledCategories.includes(cat) ? 'active' : ''}`}
                  onClick={() => handleToggleCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="news-filters-row">
        {/* Category Pills */}
        <div className="news-category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Source filter */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="news-search-wrapper">
            <Search size={13} className="text-secondary" />
            <input
              type="text"
              className="news-search-input"
              placeholder="Filter stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {allSources.length > 0 && (
            <select
              className="news-source-dropdown"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              <option value="all">All Sources</option>
              {allSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <NexusState
          variant="loading"
          title="Updating Fact-Focused Feed..."
          description="Fetching verified reporting from syndication outlets..."
          className="my-8"
        />
      )}

      {/* View: Chronological Feed */}
      {!isLoading && viewMode === 'feed' && (
        <div className="news-articles-grid">
          {filteredArticles.length === 0 ? (
            <NexusState
              variant="empty"
              title="No Articles Match Criteria"
              description="Adjust your search terms or category filters above."
              className="my-8"
            />
          ) : (
            filteredArticles.map((article) => (
              <div key={article.id} className="news-article-card">
                <div className="news-card-top justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="news-source-name">{article.sourceName}</span>
                    <span className="meta-bullet">•</span>
                    <span className="news-category-tag">{article.category}</span>
                  </div>
                  {renderClassificationBadge(article.articleType)}
                </div>

                <h3 className="news-card-title">{article.title}</h3>
                <p className="news-card-summary">{article.summary}</p>

                <div className="news-card-footer justify-between">
                  <div className="news-card-meta">
                    {article.author && (
                      <span className="flex items-center gap-1">
                        <User size={11} /> {article.author}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    className="news-direct-link-btn"
                    onClick={() => handleOpenArticle(article.originalUrl)}
                    title="Open original verified source"
                  >
                    <span>Source</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View: Cross-Source Story Comparison */}
      {!isLoading && viewMode === 'clusters' && (
        <div className="news-clusters-container">
          <div className="news-clusters-intro">
            <Layers size={15} className="text-accent shrink-0" />
            <p className="text-xs text-secondary">
              Cross-source comparison presents reporting from multiple independent outlets covering the same event
              side-by-side. NEXUS displays documented facts neutrally without political bias scores or winner labels.
            </p>
          </div>

          {clusters.length === 0 ? (
            <NexusState
              variant="empty"
              title="No Multi-Source Stories in Current Window"
              description="Switch to Chronological Feed to browse individual articles."
              className="my-8"
            />
          ) : (
            clusters.map((cluster) => (
              <div key={cluster.id} className="news-cluster-group">
                <div className="news-cluster-header">
                  <h3 className="news-cluster-title">{cluster.topicTitle}</h3>
                  <span className="news-cluster-count">{cluster.articles.length} Independent Outlets</span>
                </div>

                <div className="news-cluster-cards-row">
                  {cluster.articles.map((art) => (
                    <div key={art.id} className="news-cluster-subcard">
                      <div className="news-subcard-header justify-between">
                        <span className="news-source-name font-bold">{art.sourceName}</span>
                        {renderClassificationBadge(art.articleType)}
                      </div>
                      <h4 className="news-subcard-title">{art.title}</h4>
                      <p className="news-subcard-summary">{art.summary}</p>

                      <div className="news-card-footer justify-between mt-auto">
                        <span className="text-xs text-secondary">
                          {new Date(art.publishedAt).toLocaleDateString()}
                        </span>
                        <button
                          className="news-direct-link-btn"
                          onClick={() => handleOpenArticle(art.originalUrl)}
                        >
                          <span>Original</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
