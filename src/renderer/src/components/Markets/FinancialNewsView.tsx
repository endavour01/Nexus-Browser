import React, { useState } from 'react';
import { FinancialArticleType, FinancialNewsArticle } from '@shared/types';
import { ExternalLink, FileText, Newspaper, MessageSquare, PenTool, Search, BookmarkPlus } from 'lucide-react';

interface FinancialNewsViewProps {
  articles: FinancialNewsArticle[];
  onOpenLink?: (url: string) => void;
  onSendToNotes?: (text: string, title?: string) => void;
}

export const FinancialNewsView: React.FC<FinancialNewsViewProps> = ({
  articles,
  onOpenLink,
  onSendToNotes,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { label: 'All News & Filings', value: 'all' },
    { label: 'Official Filings', value: 'filings' },
    { label: 'Company Updates', value: 'companies' },
    { label: 'Markets & Trading', value: 'markets' },
    { label: 'Macro Economy', value: 'economy' },
  ];

  const popularTickers = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA'];

  const filteredArticles = articles.filter((a) => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesTicker =
      !selectedTicker || a.relatedTickers.includes(selectedTicker.toUpperCase());
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesTicker && matchesSearch;
  });

  const getArticleBadge = (type: FinancialArticleType) => {
    switch (type) {
      case 'filing':
        return (
          <span className="markets-badge badge-filing">
            <FileText size={11} /> Official Filing
          </span>
        );
      case 'reporting':
        return (
          <span className="markets-badge badge-reporting">
            <Newspaper size={11} /> Reporting
          </span>
        );
      case 'commentary':
        return (
          <span className="markets-badge badge-commentary">
            <MessageSquare size={11} /> Commentary
          </span>
        );
      case 'opinion':
        return (
          <span className="markets-badge badge-opinion">
            <PenTool size={11} /> Opinion
          </span>
        );
      default:
        return <span className="markets-badge">{type}</span>;
    }
  };

  const handleLinkClick = (url: string) => {
    if (onOpenLink) {
      onOpenLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="markets-section-container">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              className={`filter-pill ${selectedCategory === c.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="markets-search-box">
          <Search size={14} className="text-secondary" />
          <input
            type="text"
            placeholder="Search news & filings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="markets-input"
          />
        </div>
      </div>

      {/* Quick Ticker Filter Pills */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
        <span className="text-secondary text-2xs uppercase tracking-wider mr-1">Filter by Ticker:</span>
        <button
          className={`ticker-filter-pill ${!selectedTicker ? 'active' : ''}`}
          onClick={() => setSelectedTicker('')}
        >
          All Tickers
        </button>
        {popularTickers.map((t) => (
          <button
            key={t}
            className={`ticker-filter-pill ${selectedTicker === t ? 'active' : ''}`}
            onClick={() => setSelectedTicker(selectedTicker === t ? '' : t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Articles Feed */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center text-xs text-secondary border border-dashed border-subtle rounded-lg">
            No financial news or regulatory filings found matching your active filters.
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div key={article.id} className="markets-news-card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getArticleBadge(article.articleType)}
                  <span className="text-2xs text-secondary">{article.sourceName}</span>
                  <span className="text-2xs text-secondary">•</span>
                  <span className="text-2xs text-secondary">
                    {new Date(article.publishedAt).toLocaleDateString()} {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onSendToNotes && (
                    <button
                      className="nexus-btn-ghost text-xs px-2 py-1 flex items-center gap-1"
                      onClick={() => onSendToNotes(article.summary, article.title)}
                      title="Add to NEXUS Notes"
                    >
                      <BookmarkPlus size={12} />
                      <span>Note</span>
                    </button>
                  )}
                  <button
                    className="nexus-btn-ghost text-xs px-2 py-1 flex items-center gap-1"
                    onClick={() => handleLinkClick(article.originalUrl)}
                    title="Read Original Article or Filing"
                  >
                    <span>Read</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              <h3
                className="font-bold text-sm text-primary hover:text-accent cursor-pointer transition-colors leading-snug mb-1.5"
                onClick={() => handleLinkClick(article.originalUrl)}
              >
                {article.title}
              </h3>

              <p className="text-xs text-secondary leading-relaxed line-clamp-3 mb-3">
                {article.summary}
              </p>

              {article.relatedTickers.length > 0 && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-subtle">
                  <span className="text-2xs text-secondary">Related:</span>
                  {article.relatedTickers.map((tick) => (
                    <span
                      key={tick}
                      className="ticker-pill cursor-pointer"
                      onClick={() => setSelectedTicker(tick)}
                    >
                      {tick}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
