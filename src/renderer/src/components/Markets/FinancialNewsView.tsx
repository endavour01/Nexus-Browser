import React, { useState, useMemo } from 'react';
import { FinancialNewsArticle, FinancialArticleType } from '@shared/types';
import {
  Newspaper,
  ExternalLink,
  BookmarkPlus,
  Filter,
  FileCheck,
  CheckCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

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
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      const matchType = selectedType === 'all' || a.articleType === selectedType;
      const matchSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.relatedTickers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchType && matchSearch;
    });
  }, [articles, selectedCategory, selectedType, searchQuery]);

  const getArticleTypeBadge = (type: FinancialArticleType) => {
    switch (type) {
      case 'filing':
        return (
          <span className="markets-badge bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase flex items-center gap-1">
            <FileCheck size={11} /> Regulatory Filing
          </span>
        );
      case 'reporting':
        return (
          <span className="markets-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase flex items-center gap-1">
            <CheckCircle size={11} /> Reporting
          </span>
        );
      case 'commentary':
        return (
          <span className="markets-badge bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold uppercase flex items-center gap-1">
            <MessageSquare size={11} /> Commentary
          </span>
        );
      case 'opinion':
        return (
          <span className="markets-badge bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase flex items-center gap-1">
            <Sparkles size={11} /> Opinion
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Editorial Transparency Notice */}
      <div className="p-3 bg-surface border border-subtle rounded-lg text-xs text-secondary flex items-start gap-2.5">
        <Newspaper size={16} className="shrink-0 mt-0.5 text-primary" />
        <div>
          <strong>Journalistic Integrity Standards:</strong> NEXUS Markets explicitly tags the editorial nature of every financial wire entry — distinguishing official regulatory filings (SEC/EDGAR) from factual investigative reporting, market commentary, and subjective opinion columns.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-subtle">
        <div className="flex flex-wrap items-center gap-2">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'markets', 'companies', 'economy', 'filings'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-2xs font-semibold rounded capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-background'
                    : 'text-secondary hover:text-primary hover:bg-surface/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-subtle mx-1" />

          {/* Article Types */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'filing', 'reporting', 'commentary', 'opinion'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 text-2xs font-semibold rounded capitalize transition-colors ${
                  selectedType === t
                    ? 'bg-surface text-primary border border-primary/50'
                    : 'text-secondary hover:text-primary bg-surface/50 border border-subtle'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Search news or ticker (e.g. AAPL)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="nexus-input text-xs w-60 max-w-full"
        />
      </div>

      {/* Articles Feed */}
      <div className="space-y-3">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="markets-card p-4 space-y-2 hover:border-primary/40 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {getArticleTypeBadge(art.articleType)}
                <span className="text-2xs text-secondary font-mono">
                  {art.sourceName} • {new Date(art.publishedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onSendToNotes && (
                  <button
                    className="nexus-icon-btn p-1 text-secondary hover:text-primary"
                    onClick={() =>
                      onSendToNotes(
                        `**${art.title}**\n*Source: ${art.sourceName} (${new Date(art.publishedAt).toLocaleDateString()})*\n\n${art.summary}\n\nRelated Tickers: ${art.relatedTickers.join(', ')}\nLink: ${art.originalUrl}`,
                        `Financial News: ${art.title.slice(0, 30)}...`
                      )
                    }
                    title="Save story to NEXUS Notes"
                  >
                    <BookmarkPlus size={14} />
                  </button>
                )}

                <button
                  className="nexus-icon-btn p-1 text-secondary hover:text-primary"
                  onClick={() => onOpenLink ? onOpenLink(art.originalUrl) : window.open(art.originalUrl, '_blank')}
                  title="Open source article"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-sm text-primary leading-snug">{art.title}</h3>
            <p className="text-xs text-secondary leading-relaxed">{art.summary}</p>

            {art.relatedTickers && art.relatedTickers.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-3xs text-secondary uppercase font-semibold">Tickers:</span>
                {art.relatedTickers.map((t) => (
                  <span
                    key={t}
                    className="text-3xs font-mono font-bold bg-surface px-1.5 py-0.5 rounded border border-subtle text-primary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="p-12 text-center text-secondary border border-subtle rounded-lg">
            No financial news matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
};
