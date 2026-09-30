import React, { useState, useEffect, useMemo } from 'react';
import {
  FinancialNewsArticle,
  IpoItem,
  MarketsSettings,
  MutualFundItem,
  StockCandle,
  StockQuote,
  StockWatchlistItem,
  TrackedProduct,
} from '@shared/types';
import {
  TrendingUp,
  BarChart3,
  Building2,
  PieChart,
  ShoppingBag,
  Newspaper,
  Settings,
  Search,
  ExternalLink,
  BookmarkPlus,
  Star,
  Bell,
  ChevronLeft,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { StockChartView } from './StockChartView';
import { IpoTableView } from './IpoTableView';
import { MutualFundView } from './MutualFundView';
import { ShoppingTrackerView } from './ShoppingTrackerView';
import { FinancialNewsView } from './FinancialNewsView';
import { MarketsSettingsView } from './MarketsSettingsView';
import { MarketsOnboardingSplash } from './MarketsOnboardingSplash';

export type MarketsTab = 'stocks' | 'ipos' | 'funds' | 'shopping' | 'news' | 'settings';

interface MarketsDashboardProps {
  initialTab?: MarketsTab;
  onNavigate?: (url: string) => void;
  onSendToNotes?: (text: string, title?: string) => void;
}

export const MarketsDashboard: React.FC<MarketsDashboardProps> = ({
  initialTab = 'stocks',
  onNavigate,
  onSendToNotes,
}) => {
  const api = window.nexusAPI;

  const [settings, setSettings] = useState<MarketsSettings | null>(null);
  const [activeTab, setActiveTab] = useState<MarketsTab>(initialTab);
  const [loading, setLoading] = useState<boolean>(true);

  // Stocks State
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [activeTicker, setActiveTicker] = useState<string>('AAPL');
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [stockCandles, setStockCandles] = useState<StockCandle[]>([]);
  const [candleRange, setCandleRange] = useState<string>('1M');
  const [watchlist, setWatchlist] = useState<StockWatchlistItem[]>([]);

  // Other Modules State
  const [ipos, setIpos] = useState<IpoItem[]>([]);
  const [funds, setFunds] = useState<MutualFundItem[]>([]);
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [news, setNews] = useState<FinancialNewsArticle[]>([]);

  // Fetch Settings on Mount
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      if (!api) return;
      try {
        const s = await api.getMarketsSettings();
        if (mounted) {
          setSettings(s);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load markets settings:', err);
        if (mounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => {
      mounted = false;
    };
  }, [api]);

  // Load Data When Enabled
  useEffect(() => {
    if (!api || !settings?.enabled) return;

    let mounted = true;
    const loadAll = async () => {
      try {
        const [stList, wList, ipoList, fundList, prodList, newsList] = await Promise.all([
          api.searchStocks(''),
          api.getStockWatchlist(),
          api.getIpos(),
          api.getMutualFunds(),
          api.getTrackedProducts(),
          api.getFinancialNews(),
        ]);

        if (mounted) {
          setStocks(stList);
          setWatchlist(wList);
          setIpos(ipoList);
          setFunds(fundList);
          setTrackedProducts(prodList);
          setNews(newsList);
        }
      } catch (err) {
        console.error('Failed to load markets data:', err);
      }
    };

    loadAll();
    return () => {
      mounted = false;
    };
  }, [api, settings?.enabled]);

  // Load Active Stock Details & Candles
  useEffect(() => {
    if (!api || !settings?.enabled || !activeTicker) return;

    let mounted = true;
    const loadStock = async () => {
      try {
        const [q, c] = await Promise.all([
          api.getStockQuote(activeTicker),
          api.getStockCandles(activeTicker, candleRange),
        ]);
        if (mounted) {
          setStockQuote(q);
          setStockCandles(c);
        }
      } catch (err) {
        console.error(`Failed to load stock quote for ${activeTicker}:`, err);
      }
    };

    loadStock();
    return () => {
      mounted = false;
    };
  }, [api, settings?.enabled, activeTicker, candleRange]);

  const handleEnableMarkets = async () => {
    if (!api) return;
    try {
      const updated = await api.updateMarketsSettings({ enabled: true });
      setSettings(updated);
    } catch (err) {
      console.error('Failed to enable markets:', err);
    }
  };

  const handleUpdateSettings = async (partial: Partial<MarketsSettings>) => {
    if (!api) return;
    try {
      const updated = await api.updateMarketsSettings(partial);
      setSettings(updated);
    } catch (err) {
      console.error('Failed to update markets settings:', err);
    }
  };

  // Watchlist Helpers
  const isWatched = useMemo(() => {
    return watchlist.some((w) => w.ticker.toUpperCase() === activeTicker.toUpperCase());
  }, [watchlist, activeTicker]);

  const toggleWatchlist = async () => {
    if (!api || !stockQuote) return;
    if (isWatched) {
      await api.removeStockFromWatchlist(stockQuote.ticker);
      setWatchlist((prev) => prev.filter((w) => w.ticker !== stockQuote.ticker));
    } else {
      const added = await api.addStockToWatchlist({
        ticker: stockQuote.ticker,
        name: stockQuote.name,
        exchange: stockQuote.exchange,
      });
      setWatchlist((prev) => [added, ...prev]);
    }
  };

  const handleSaveProduct = async (product: any) => {
    if (!api) return;
    const saved = await api.saveTrackedProduct(product);
    const updated = await api.getTrackedProducts();
    setTrackedProducts(updated);
    return saved;
  };

  const handleRecordPricePoint = async (productId: string, price: number, inStock?: boolean) => {
    if (!api) return;
    const updated = await api.recordProductPricePoint(productId, price, inStock);
    const list = await api.getTrackedProducts();
    setTrackedProducts(list);
    return updated;
  };

  const handleDeleteProduct = async (id: string) => {
    if (!api) return;
    await api.deleteTrackedProduct(id);
    setTrackedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="nexus-fullpage-container flex items-center justify-center">
        <div className="text-secondary text-sm animate-pulse">Initializing NEXUS Markets...</div>
      </div>
    );
  }

  // If Markets is disabled, show onboarding opt-in splash
  if (!settings?.enabled) {
    return (
      <div className="nexus-fullpage-container overflow-y-auto p-6">
        <MarketsOnboardingSplash onEnable={handleEnableMarkets} />
      </div>
    );
  }

  const isPositive = stockQuote ? stockQuote.change >= 0 : true;

  return (
    <div className="nexus-fullpage-container markets-page-container">
      {/* Page Header */}
      <div className="markets-page-header">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              className="nexus-icon-btn"
              onClick={() => onNavigate('nexus://newtab')}
              title="Return to Workspace"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div className="markets-brand-icon">
            <TrendingUp size={18} className="text-accent" />
          </div>

          <div>
            <h1 className="page-heading">NEXUS Markets</h1>
            <p className="page-subheading">
              Stocks, funds, IPOs, shopping, and financial news
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="markets-page-tabs">
          {settings.enableStocks && (
            <button
              className={`filter-pill ${activeTab === 'stocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('stocks')}
            >
              <BarChart3 size={13} />
              <span>Stocks</span>
            </button>
          )}
          {settings.enableIpos && (
            <button
              className={`filter-pill ${activeTab === 'ipos' ? 'active' : ''}`}
              onClick={() => setActiveTab('ipos')}
            >
              <Building2 size={13} />
              <span>IPO Tracker</span>
            </button>
          )}
          {settings.enableMutualFunds && (
            <button
              className={`filter-pill ${activeTab === 'funds' ? 'active' : ''}`}
              onClick={() => setActiveTab('funds')}
            >
              <PieChart size={13} />
              <span>Mutual Funds</span>
            </button>
          )}
          {settings.enableShopping && (
            <button
              className={`filter-pill ${activeTab === 'shopping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shopping')}
            >
              <ShoppingBag size={13} />
              <span>Shopping Tracker</span>
            </button>
          )}
          {settings.enableFinancialNews && (
            <button
              className={`filter-pill ${activeTab === 'news' ? 'active' : ''}`}
              onClick={() => setActiveTab('news')}
            >
              <Newspaper size={13} />
              <span>Financial News</span>
            </button>
          )}
          <button
            className={`filter-pill ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={13} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main View Body */}
      <div className="markets-page-body">
        {/* ================================================================= */}
        {/* 1. Stocks View */}
        {/* ================================================================= */}
        {activeTab === 'stocks' && (
          <div className="space-y-4">
            {/* Informational Disclaimer Box */}
            <div className="markets-disclaimer-box">
              <AlertCircle size={15} className="text-secondary flex-shrink-0" />
              <span className="text-xs text-secondary leading-relaxed">
                Quotes may be delayed by at least 15 minutes. For research only; not investment advice.
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Search & Watchlist */}
              <div className="space-y-4">
                {/* Search Stocks Box */}
                <div className="markets-search-box w-full">
                  <Search size={14} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="Search ticker, name, or sector..."
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    className="markets-input w-full"
                  />
                </div>

                {/* Stock Watchlist List */}
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                    Watchlist ({watchlist.length})
                  </div>

                  {watchlist.map((w) => {
                    const q = stocks.find((s) => s.ticker === w.ticker);
                    const isSelected = w.ticker === activeTicker;
                    const changePositive = q ? q.change >= 0 : true;

                    return (
                      <div
                        key={w.ticker}
                        onClick={() => setActiveTicker(w.ticker)}
                        className={`markets-fund-card ${isSelected ? 'active' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold font-mono text-sm text-primary">
                            {w.ticker}
                          </span>
                          <span className="font-mono text-xs font-semibold text-primary">
                            ${q ? q.price.toFixed(2) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-2xs text-secondary">
                          <span className="truncate max-w-[130px]">{w.name}</span>
                          <span className={changePositive ? 'text-emerald-400' : 'text-red-400'}>
                            {q ? `${changePositive ? '+' : ''}${q.changePercent.toFixed(2)}%` : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Stock Details & Chart */}
              <div className="lg:col-span-2 space-y-4">
                {stockQuote ? (
                  <div className="markets-card p-5 space-y-4">
                    {/* Stock Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-subtle pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold font-mono text-primary">
                            {stockQuote.ticker}
                          </span>
                          <span className="text-2xs text-secondary uppercase bg-surface px-1.5 py-0.5 rounded border border-subtle">
                            {stockQuote.exchange}
                          </span>
                          <span className="markets-badge badge-delayed">
                            <Clock size={10} /> Delayed ({stockQuote.delayMinutes || 15}m)
                          </span>
                        </div>
                        <h2 className="text-sm font-semibold text-secondary mt-0.5">
                          {stockQuote.name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className={`nexus-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5 ${
                            isWatched ? 'text-amber-400' : ''
                          }`}
                          onClick={toggleWatchlist}
                          title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          <Star size={13} fill={isWatched ? 'currentColor' : 'none'} />
                          <span>{isWatched ? 'Watched' : 'Watch'}</span>
                        </button>

                        {stockQuote.investorRelationsUrl && (
                          <button
                            className="nexus-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1"
                            onClick={() => window.open(stockQuote.investorRelationsUrl, '_blank')}
                            title="Official Investor Relations Portal"
                          >
                            <span>Investor Relations</span>
                            <ExternalLink size={12} />
                          </button>
                        )}

                        {onSendToNotes && (
                          <button
                            className="nexus-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1"
                            onClick={() =>
                              onSendToNotes(
                                `${stockQuote.name} (${stockQuote.ticker}): Current Price $${stockQuote.price.toFixed(2)}, Market Cap: $${(stockQuote.marketCap ? stockQuote.marketCap / 1e9 : 0).toFixed(1)}B, P/E: ${stockQuote.peRatio}`,
                                `${stockQuote.ticker} Financial Note`
                              )
                            }
                            title="Save summary to NEXUS Notes"
                          >
                            <BookmarkPlus size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Price & Change Banner */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-mono font-bold text-primary">
                        ${stockQuote.price.toFixed(2)}
                      </span>
                      <span
                        className={`text-sm font-mono font-semibold ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {stockQuote.change.toFixed(2)} ({isPositive ? '+' : ''}
                        {stockQuote.changePercent.toFixed(2)}%)
                      </span>
                    </div>

                    {/* Interactive SVG Chart */}
                    <StockChartView
                      candles={stockCandles}
                      currentPrice={stockQuote.price}
                      currency="$"
                      activeRange={candleRange}
                      onRangeChange={setCandleRange}
                    />

                    {/* OHLCV & Fundamentals Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                        <div className="text-2xs text-secondary">Open</div>
                        <div className="text-xs font-mono font-semibold text-primary">
                          ${stockQuote.open?.toFixed(2) || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                        <div className="text-2xs text-secondary">High / Low</div>
                        <div className="text-xs font-mono font-semibold text-primary">
                          ${stockQuote.high?.toFixed(2)} / ${stockQuote.low?.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                        <div className="text-2xs text-secondary">Previous Close</div>
                        <div className="text-xs font-mono font-semibold text-primary">
                          ${stockQuote.previousClose?.toFixed(2) || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                        <div className="text-2xs text-secondary">Volume</div>
                        <div className="text-xs font-mono font-semibold text-primary">
                          {stockQuote.volume?.toLocaleString() || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                        <div className="text-2xs text-secondary">Market Cap</div>
                        <div className="text-xs font-mono font-semibold text-primary">
                          ${stockQuote.marketCap ? (stockQuote.marketCap / 1e9).toFixed(1) + 'B' : '—'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                        <div className="text-2xs text-secondary">P/E Ratio</div>
                        <div className="text-xs font-mono font-semibold text-primary">
                          {stockQuote.peRatio || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 bg-surface/50 rounded border border-subtle col-span-2">
                        <div className="text-2xs text-secondary">52-Week Range</div>
                        <div className="text-xs font-mono font-semibold text-primary">
                          ${stockQuote.fiftyTwoWeekLow?.toFixed(2)} - ${stockQuote.fiftyTwoWeekHigh?.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Company Profile Description */}
                    {stockQuote.description && (
                      <div className="text-2xs text-secondary leading-relaxed pt-3 border-t border-subtle">
                        <strong>Company Overview:</strong> {stockQuote.description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-secondary border border-subtle rounded-lg">
                    Select a stock from the watchlist to view quote metrics and historical charts.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. IPO Tracker View */}
        {/* ================================================================= */}
        {activeTab === 'ipos' && <IpoTableView ipos={ipos} onOpenLink={onNavigate} />}

        {/* ================================================================= */}
        {/* 3. Mutual Funds View */}
        {/* ================================================================= */}
        {activeTab === 'funds' && <MutualFundView funds={funds} />}

        {/* ================================================================= */}
        {/* 4. Shopping Price Tracker View */}
        {/* ================================================================= */}
        {activeTab === 'shopping' && (
          <ShoppingTrackerView
            products={trackedProducts}
            onSaveProduct={handleSaveProduct}
            onRecordPricePoint={handleRecordPricePoint}
            onDeleteProduct={handleDeleteProduct}
            onOpenLink={onNavigate}
          />
        )}

        {/* ================================================================= */}
        {/* 5. Financial News View */}
        {/* ================================================================= */}
        {activeTab === 'news' && (
          <FinancialNewsView
            articles={news}
            onOpenLink={onNavigate}
            onSendToNotes={onSendToNotes}
          />
        )}

        {/* ================================================================= */}
        {/* 6. Settings View */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <MarketsSettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </div>
    </div>
  );
};
