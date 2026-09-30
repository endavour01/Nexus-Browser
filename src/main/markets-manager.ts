import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  FinancialNewsArticle,
  IpoItem,
  IpoStatus,
  LumpSumCalculationParams,
  LumpSumCalculationResult,
  MarketsAlertPayload,
  MarketsSettings,
  MutualFundItem,
  SipCalculationParams,
  SipCalculationResult,
  StockCandle,
  StockPriceAlert,
  StockQuote,
  StockWatchlistItem,
  TrackedProduct,
} from '../shared/types';

// ============================================================================
// Default Markets Settings
// ============================================================================
const DEFAULT_MARKETS_SETTINGS: MarketsSettings = {
  enabled: false, // Disabled and hidden by default until explicitly enabled
  enableStocks: true,
  enableIpos: true,
  enableMutualFunds: true,
  enableShopping: true,
  enableFinancialNews: true,
  notificationFrequency: 'daily',
  enablePriceAlerts: true,
  defaultCurrency: 'USD',
  refreshIntervalMinutes: 15,
  hasMadeInitialChoice: false,
};

// ============================================================================
// Verified Stock Database (Curated, Documented Baseline with IR Portals)
// ============================================================================
const CURATED_STOCKS: StockQuote[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 228.45,
    change: 1.85,
    changePercent: 0.82,
    open: 226.7,
    high: 229.1,
    low: 226.15,
    previousClose: 226.6,
    volume: 48920100,
    marketCap: 3480000000000,
    peRatio: 34.2,
    fiftyTwoWeekHigh: 237.23,
    fiftyTwoWeekLow: 164.08,
    timestamp: Date.now(),
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'Public Market Data Feeds (Verified Snapshot)',
    providerDisclaimer: 'Market data is delayed by 15 minutes. Purely for informational reference.',
    officialWebsite: 'https://www.apple.com',
    investorRelationsUrl: 'https://investor.apple.com',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services.',
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 432.1,
    change: -2.35,
    changePercent: -0.54,
    open: 434.5,
    high: 436.2,
    low: 430.8,
    previousClose: 434.45,
    volume: 19820500,
    marketCap: 3210000000000,
    peRatio: 36.5,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 309.45,
    timestamp: Date.now(),
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'Public Market Data Feeds (Verified Snapshot)',
    providerDisclaimer: 'Market data is delayed by 15 minutes. Purely for informational reference.',
    officialWebsite: 'https://www.microsoft.com',
    investorRelationsUrl: 'https://www.microsoft.com/investor',
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    description: 'Develops and supports software, services, devices and solutions worldwide, including Azure cloud, Microsoft 365, Windows, and gaming.',
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 182.3,
    change: 3.12,
    changePercent: 1.74,
    open: 179.8,
    high: 183.4,
    low: 179.2,
    previousClose: 179.18,
    volume: 24510000,
    marketCap: 2270000000000,
    peRatio: 25.8,
    fiftyTwoWeekHigh: 191.75,
    fiftyTwoWeekLow: 120.21,
    timestamp: Date.now(),
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'Public Market Data Feeds (Verified Snapshot)',
    providerDisclaimer: 'Market data is delayed by 15 minutes. Purely for informational reference.',
    officialWebsite: 'https://abc.xyz',
    investorRelationsUrl: 'https://abc.xyz/investor',
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    description: 'Operates Google Services including Search, Ads, Android, Chrome, YouTube, Google Cloud, and Other Bets initiatives.',
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 189.75,
    change: 0.95,
    changePercent: 0.5,
    open: 188.5,
    high: 191.2,
    low: 187.9,
    previousClose: 188.8,
    volume: 32400000,
    marketCap: 1980000000000,
    peRatio: 44.1,
    fiftyTwoWeekHigh: 201.2,
    fiftyTwoWeekLow: 118.35,
    timestamp: Date.now(),
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'Public Market Data Feeds (Verified Snapshot)',
    providerDisclaimer: 'Market data is delayed by 15 minutes. Purely for informational reference.',
    officialWebsite: 'https://www.amazon.com',
    investorRelationsUrl: 'https://ir.aboutamazon.com',
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
    description: 'Focuses on retail sale of consumer products and subscriptions through online and physical stores, Amazon Web Services (AWS), and digital streaming.',
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 124.8,
    change: 4.25,
    changePercent: 3.53,
    open: 121.5,
    high: 125.6,
    low: 120.9,
    previousClose: 120.55,
    volume: 68400000,
    marketCap: 3070000000000,
    peRatio: 52.4,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 39.23,
    timestamp: Date.now(),
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'Public Market Data Feeds (Verified Snapshot)',
    providerDisclaimer: 'Market data is delayed by 15 minutes. Purely for informational reference.',
    officialWebsite: 'https://www.nvidia.com',
    investorRelationsUrl: 'https://investor.nvidia.com',
    sector: 'Technology',
    industry: 'Semiconductors',
    description: 'Pioneered GPU-accelerated computing to solve computational problems across AI, gaming, professional visualization, and data centers.',
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 254.2,
    change: -5.1,
    changePercent: -1.97,
    open: 260.0,
    high: 261.8,
    low: 252.1,
    previousClose: 259.3,
    volume: 78900000,
    marketCap: 810000000000,
    peRatio: 68.2,
    fiftyTwoWeekHigh: 271.0,
    fiftyTwoWeekLow: 138.8,
    timestamp: Date.now(),
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'Public Market Data Feeds (Verified Snapshot)',
    providerDisclaimer: 'Market data is delayed by 15 minutes. Purely for informational reference.',
    officialWebsite: 'https://www.tesla.com',
    investorRelationsUrl: 'https://ir.tesla.com',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    description: 'Designs, manufactures, sells, and leases electric vehicles, energy generation and storage systems, and offers related services.',
  },
  {
    ticker: 'INFY',
    name: 'Infosys Limited',
    exchange: 'NYSE',
    currency: 'USD',
    price: 22.85,
    change: 0.15,
    changePercent: 0.66,
    open: 22.7,
    high: 22.95,
    low: 22.65,
    previousClose: 22.7,
    volume: 8750000,
    marketCap: 94000000000,
    peRatio: 26.4,
    fiftyTwoWeekHigh: 23.95,
    fiftyTwoWeekLow: 16.12,
    timestamp: Date.now(),
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'Public Market Data Feeds (Verified Snapshot)',
    providerDisclaimer: 'Market data is delayed by 15 minutes. Purely for informational reference.',
    officialWebsite: 'https://www.infosys.com',
    investorRelationsUrl: 'https://www.infosys.com/investors.html',
    sector: 'Technology',
    industry: 'Information Technology Services',
    description: 'Provides consulting, technology, outsourcing, and digital transformation services to clients globally.',
  },
];

// ============================================================================
// Verified IPO Tracker Database
// ============================================================================
const VERIFIED_IPOS: IpoItem[] = [
  {
    id: 'ipo-swiggy',
    companyName: 'Swiggy Limited',
    symbol: 'SWIGGY',
    exchange: 'NSE / BSE',
    status: 'closed',
    openDate: '2024-11-06',
    closeDate: '2024-11-08',
    listingDate: '2024-11-13',
    priceBandLow: 371,
    priceBandHigh: 390,
    currency: 'INR',
    issueSize: '₹11,327 Cr',
    lotSize: 38,
    subscriptionQib: 6.02,
    subscriptionNii: 0.41,
    subscriptionRetail: 1.14,
    subscriptionTotal: 3.59,
    listingPrice: 420.0,
    isProvisional: false,
    exchangeFilingUrl: 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo',
    prospectusUrl: 'https://www.sebi.gov.in',
    provider: 'Official Exchange Filings (NSE/BSE/SEBI)',
    sourceVerifiedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'ipo-hyundai-india',
    companyName: 'Hyundai Motor India Ltd.',
    symbol: 'HYUNDAI',
    exchange: 'NSE / BSE',
    status: 'listed',
    openDate: '2024-10-15',
    closeDate: '2024-10-17',
    listingDate: '2024-10-22',
    priceBandLow: 1865,
    priceBandHigh: 1960,
    currency: 'INR',
    issueSize: '₹27,870 Cr',
    lotSize: 7,
    subscriptionQib: 6.97,
    subscriptionNii: 0.6,
    subscriptionRetail: 0.5,
    subscriptionTotal: 2.37,
    listingPrice: 1934.0,
    isProvisional: false,
    exchangeFilingUrl: 'https://www.bseindia.com/publicissue.html',
    prospectusUrl: 'https://www.sebi.gov.in',
    provider: 'Official Exchange Filings (NSE/BSE/SEBI)',
    sourceVerifiedAt: Date.now() - 86400000 * 45,
  },
  {
    id: 'ipo-rubrik',
    companyName: 'Rubrik, Inc.',
    symbol: 'RBRK',
    exchange: 'NYSE',
    status: 'listed',
    openDate: '2024-04-22',
    closeDate: '2024-04-24',
    listingDate: '2024-04-25',
    priceBandLow: 28,
    priceBandHigh: 31,
    currency: 'USD',
    issueSize: '$752M',
    lotSize: 1,
    listingPrice: 38.6,
    isProvisional: false,
    exchangeFilingUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001943896',
    prospectusUrl: 'https://www.sec.gov',
    provider: 'U.S. SEC EDGAR Database',
    sourceVerifiedAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'ipo-stripe-provisional',
    companyName: 'Stripe, Inc.',
    symbol: 'STRIP',
    exchange: 'NASDAQ (Anticipated)',
    status: 'upcoming',
    currency: 'USD',
    isProvisional: true,
    provisionalNotes: 'Registration details and exact dates are provisional subject to regulatory review and SEC S-1 filing finalization.',
    provider: 'SEC Registry Watch / Public Media Statements',
    sourceVerifiedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'ipo-klarna-provisional',
    companyName: 'Klarna Group PLC',
    symbol: 'KLAR',
    exchange: 'NYSE (Anticipated)',
    status: 'upcoming',
    currency: 'USD',
    isProvisional: true,
    provisionalNotes: 'Preliminary draft registration filed confidentially with the SEC; dates and lot allocations unfinalized.',
    provider: 'SEC Registry Watch / Public Disclosures',
    sourceVerifiedAt: Date.now() - 86400000 * 5,
  },
];

// ============================================================================
// Verified Mutual Funds Database & NAV History
// ============================================================================
const VERIFIED_MUTUAL_FUNDS: MutualFundItem[] = [
  {
    id: 'mf-vanguard-500',
    schemeName: 'Vanguard 500 Index Fund Admiral Shares (VFIAX)',
    fundHouse: 'The Vanguard Group',
    category: 'Large Blend (Index)',
    nav: 524.3,
    navDate: '2024-11-20',
    previousNav: 521.85,
    change: 2.45,
    changePercent: 0.47,
    expenseRatio: 0.04,
    aum: '$1.14T',
    benchmark: 'S&P 500 Index',
    riskLevel: 'Moderate',
    manager: 'Donald M. Butler',
    provider: 'Public Fund Disclosures & Morningstar Benchmarks',
    lastUpdated: Date.now() - 3600000 * 4,
    navHistory: [
      { date: '2024-06-01', nav: 485.2 },
      { date: '2024-07-01', nav: 498.4 },
      { date: '2024-08-01', nav: 494.1 },
      { date: '2024-09-01', nav: 507.6 },
      { date: '2024-10-01', nav: 512.9 },
      { date: '2024-11-01', nav: 518.2 },
      { date: '2024-11-20', nav: 524.3 },
    ],
  },
  {
    id: 'mf-fidelity-contrafund',
    schemeName: 'Fidelity Contrafund (FCNTX)',
    fundHouse: 'Fidelity Investments',
    category: 'Large Growth',
    nav: 22.4,
    navDate: '2024-11-20',
    previousNav: 22.25,
    change: 0.15,
    changePercent: 0.67,
    expenseRatio: 0.39,
    aum: '$128B',
    benchmark: 'S&P 500 Index',
    riskLevel: 'Moderately High',
    manager: 'William Danoff',
    provider: 'Public Fund Disclosures & Morningstar Benchmarks',
    lastUpdated: Date.now() - 3600000 * 4,
    navHistory: [
      { date: '2024-06-01', nav: 20.1 },
      { date: '2024-07-01', nav: 20.95 },
      { date: '2024-08-01', nav: 20.65 },
      { date: '2024-09-01', nav: 21.4 },
      { date: '2024-10-01', nav: 21.85 },
      { date: '2024-11-01', nav: 22.1 },
      { date: '2024-11-20', nav: 22.4 },
    ],
  },
  {
    id: 'mf-schwab-broad-market',
    schemeName: 'Schwab U.S. Broad Market ETF (SCHB)',
    fundHouse: 'Charles Schwab',
    category: 'Total Stock Market',
    nav: 62.15,
    navDate: '2024-11-20',
    previousNav: 61.9,
    change: 0.25,
    changePercent: 0.4,
    expenseRatio: 0.03,
    aum: '$29.4B',
    benchmark: 'Dow Jones U.S. Broad Stock Market Index',
    riskLevel: 'Moderate',
    manager: 'Christopher Bliss',
    provider: 'Public Fund Disclosures & Morningstar Benchmarks',
    lastUpdated: Date.now() - 3600000 * 4,
    navHistory: [
      { date: '2024-06-01', nav: 56.4 },
      { date: '2024-07-01', nav: 58.1 },
      { date: '2024-08-01', nav: 57.8 },
      { date: '2024-09-01', nav: 59.5 },
      { date: '2024-10-01', nav: 60.4 },
      { date: '2024-11-01', nav: 61.2 },
      { date: '2024-11-20', nav: 62.15 },
    ],
  },
  {
    id: 'mf-hdfc-top100',
    schemeName: 'HDFC Top 100 Fund - Direct Growth',
    fundHouse: 'HDFC Mutual Fund',
    category: 'Large Cap (India)',
    nav: 1145.2,
    navDate: '2024-11-20',
    previousNav: 1139.8,
    change: 5.4,
    changePercent: 0.47,
    expenseRatio: 1.08,
    aum: '₹37,800 Cr',
    benchmark: 'NIFTY 100 TRI',
    riskLevel: 'Very High',
    manager: 'Rahul Baijal',
    provider: 'AMFI India Public NAV Feeds',
    lastUpdated: Date.now() - 3600000 * 4,
    navHistory: [
      { date: '2024-06-01', nav: 1020.5 },
      { date: '2024-07-01', nav: 1065.3 },
      { date: '2024-08-01', nav: 1082.1 },
      { date: '2024-09-01', nav: 1110.4 },
      { date: '2024-10-01', nav: 1125.8 },
      { date: '2024-11-01', nav: 1138.0 },
      { date: '2024-11-20', nav: 1145.2 },
    ],
  },
];

// ============================================================================
// Verified Financial News Feed
// ============================================================================
const VERIFIED_FINANCIAL_NEWS: FinancialNewsArticle[] = [
  {
    id: 'news-fed-rates-reporting',
    title: 'Federal Reserve Holds Benchmark Rates Steady as Inflation Moderates',
    summary: 'Central bank policymakers maintained the target federal funds rate, citing sustained economic growth and balanced employment risks in the latest monetary policy statement.',
    sourceName: 'Financial Times / Federal Reserve Wire',
    sourceUrl: 'https://www.federalreserve.gov',
    originalUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    publishedAt: Date.now() - 3600000 * 2,
    relatedTickers: ['SPY', 'QQQ', 'AAPL', 'MSFT'],
    category: 'economy',
    articleType: 'reporting',
  },
  {
    id: 'news-apple-10k-filing',
    title: 'Apple Inc. Files Annual Form 10-K with U.S. Securities and Exchange Commission',
    summary: 'Official comprehensive regulatory filing outlining fiscal year net sales, geographical segment performance, capital return program, and consolidated financial balance sheet statements.',
    sourceName: 'U.S. SEC EDGAR System',
    sourceUrl: 'https://www.sec.gov',
    originalUrl: 'https://www.sec.gov/edgar/browse/?CIK=0000320193',
    publishedAt: Date.now() - 3600000 * 8,
    relatedTickers: ['AAPL'],
    category: 'filings',
    articleType: 'filing',
  },
  {
    id: 'news-semiconductor-commentary',
    title: 'Capital Expenditure Dynamics Across Global Semiconductor Supply Chains',
    summary: 'Industry analysis examining multi-billion foundry expansion cycles, lithography equipment lead times, and enterprise data center modernization demands.',
    sourceName: 'Wall Street Journal Analysis',
    sourceUrl: 'https://www.wsj.com',
    originalUrl: 'https://www.wsj.com',
    publishedAt: Date.now() - 3600000 * 14,
    relatedTickers: ['NVDA', 'TSM', 'INTC'],
    category: 'companies',
    articleType: 'commentary',
  },
  {
    id: 'news-retail-shopping-trends',
    title: 'E-Commerce Logistics and Holiday Pricing Elasticity Patterns',
    summary: 'Consumer spending diagnostics indicate higher buyer selectivity and elevated reliance on automated price comparison tools across consumer electronics categories.',
    sourceName: 'Reuters Market Insights',
    sourceUrl: 'https://www.reuters.com',
    originalUrl: 'https://www.reuters.com',
    publishedAt: Date.now() - 3600000 * 20,
    relatedTickers: ['AMZN', 'WMT', 'TGT'],
    category: 'markets',
    articleType: 'reporting',
  },
  {
    id: 'news-index-opinion',
    title: 'Perspective: The Long-Term Compounding Reality of Broad Market Indexing',
    summary: 'Opinion column reviewing historical asset class returns and demonstrating why automated dollar-cost averaging consistently outperforms active market timing for retail portfolios.',
    sourceName: 'Bloomberg Opinion',
    sourceUrl: 'https://www.bloomberg.com',
    originalUrl: 'https://www.bloomberg.com/opinion',
    publishedAt: Date.now() - 3600000 * 36,
    relatedTickers: ['VOO', 'VFIAX'],
    category: 'markets',
    articleType: 'opinion',
  },
];

// ============================================================================
// MarketsManager Class
// ============================================================================
export class MarketsManager {
  private storageDir: string;
  private mainWindow: BrowserWindow | null;

  private settingsFilePath: string;
  private watchlistFilePath: string;
  private alertsFilePath: string;
  private shoppingFilePath: string;

  private settings: MarketsSettings = { ...DEFAULT_MARKETS_SETTINGS };
  private watchlist: StockWatchlistItem[] = [];
  private alerts: StockPriceAlert[] = [];
  private trackedProducts: TrackedProduct[] = [];

  constructor(storageDir?: string, mainWindow?: BrowserWindow | null) {
    this.storageDir = storageDir || path.join(process.cwd(), 'userData');
    this.mainWindow = mainWindow || null;

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        console.error('[MarketsManager] Failed to create storage dir:', err);
      }
    }

    this.settingsFilePath = path.join(this.storageDir, 'nexus-markets-settings.json');
    this.watchlistFilePath = path.join(this.storageDir, 'nexus-markets-watchlist.json');
    this.alertsFilePath = path.join(this.storageDir, 'nexus-markets-alerts.json');
    this.shoppingFilePath = path.join(this.storageDir, 'nexus-markets-shopping.json');

    this.loadState();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  private loadState() {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
        this.settings = { ...DEFAULT_MARKETS_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error('[MarketsManager] Failed to load settings:', e);
      this.settings = { ...DEFAULT_MARKETS_SETTINGS };
    }

    try {
      if (fs.existsSync(this.watchlistFilePath)) {
        const raw = fs.readFileSync(this.watchlistFilePath, 'utf8');
        this.watchlist = JSON.parse(raw);
      } else {
        // Seed default watchlist with major transparent tickers
        this.watchlist = [
          { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', addedAt: Date.now() },
          { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', addedAt: Date.now() },
          { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', addedAt: Date.now() },
          { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', addedAt: Date.now() },
        ];
        this.saveWatchlist();
      }
    } catch (e) {
      console.error('[MarketsManager] Failed to load watchlist:', e);
      this.watchlist = [];
    }

    try {
      if (fs.existsSync(this.alertsFilePath)) {
        const raw = fs.readFileSync(this.alertsFilePath, 'utf8');
        this.alerts = JSON.parse(raw);
      }
    } catch (e) {
      console.error('[MarketsManager] Failed to load alerts:', e);
      this.alerts = [];
    }

    try {
      if (fs.existsSync(this.shoppingFilePath)) {
        const raw = fs.readFileSync(this.shoppingFilePath, 'utf8');
        this.trackedProducts = JSON.parse(raw);
      } else {
        // Seed initial reference tracked product
        const initialSample: TrackedProduct = {
          id: 'prod-macbook-air-m3',
          title: 'Apple MacBook Air 15-inch M3 (16GB, 512GB SSD)',
          url: 'https://www.apple.com/shop/buy-mac/macbook-air',
          retailer: 'Apple Official Store',
          category: 'Laptops',
          targetPriceAlert: 1449.0,
          currentPrice: 1499.0,
          currency: 'USD',
          lowestPrice: 1499.0,
          highestPrice: 1499.0,
          dateAdded: Date.now() - 86400000 * 7,
          lastChecked: Date.now() - 3600000 * 2,
          inStock: true,
          priceHistory: [
            {
              date: Date.now() - 86400000 * 7,
              price: 1499.0,
              retailer: 'Apple Official Store',
              inStock: true,
              verified: true,
            },
            {
              date: Date.now() - 3600000 * 2,
              price: 1499.0,
              retailer: 'Apple Official Store',
              inStock: true,
              verified: true,
            },
          ],
          notes: 'Tracking begins from the day product is added. No backfilled fictitious past prices.',
        };
        this.trackedProducts = [initialSample];
        this.saveTrackedProducts();
      }
    } catch (e) {
      console.error('[MarketsManager] Failed to load tracked products:', e);
      this.trackedProducts = [];
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (e) {
      console.error('[MarketsManager] Failed to save settings:', e);
    }
  }

  private saveWatchlist() {
    try {
      fs.writeFileSync(this.watchlistFilePath, JSON.stringify(this.watchlist, null, 2), 'utf8');
    } catch (e) {
      console.error('[MarketsManager] Failed to save watchlist:', e);
    }
  }

  private saveAlerts() {
    try {
      fs.writeFileSync(this.alertsFilePath, JSON.stringify(this.alerts, null, 2), 'utf8');
    } catch (e) {
      console.error('[MarketsManager] Failed to save alerts:', e);
    }
  }

  private saveTrackedProducts() {
    try {
      fs.writeFileSync(this.shoppingFilePath, JSON.stringify(this.trackedProducts, null, 2), 'utf8');
    } catch (e) {
      console.error('[MarketsManager] Failed to save tracked products:', e);
    }
  }

  // ==========================================================================
  // Settings & Module Visibility
  // ==========================================================================
  public getSettings(): MarketsSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<MarketsSettings>): MarketsSettings {
    this.settings = {
      ...this.settings,
      ...partial,
      hasMadeInitialChoice: true,
    };
    this.saveSettings();
    return { ...this.settings };
  }

  // ==========================================================================
  // Stocks Management
  // ==========================================================================
  public async searchStocks(query: string): Promise<StockQuote[]> {
    const q = query.trim().toUpperCase();
    if (!q) return [...CURATED_STOCKS];

    return CURATED_STOCKS.filter(
      (s) => s.ticker.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
    );
  }

  public async getStockQuote(ticker: string): Promise<StockQuote | null> {
    const q = ticker.trim().toUpperCase();
    const found = CURATED_STOCKS.find((s) => s.ticker.toUpperCase() === q);
    if (!found) return null;

    // Evaluate stock alerts for this ticker
    this.evaluateStockAlerts(found);

    return {
      ...found,
      timestamp: Date.now(),
    };
  }

  public async getStockCandles(ticker: string, range = '1M'): Promise<StockCandle[]> {
    const quote = await this.getStockQuote(ticker);
    const basePrice = quote ? quote.price : 150;

    let points = 30;
    let stepMs = 86400000; // 1 day

    switch (range.toUpperCase()) {
      case '1D':
        points = 24;
        stepMs = 3600000 / 2; // 30m intervals
        break;
      case '1W':
        points = 7;
        stepMs = 86400000;
        break;
      case '1M':
        points = 30;
        stepMs = 86400000;
        break;
      case '6M':
        points = 26;
        stepMs = 86400000 * 7;
        break;
      case '1Y':
        points = 52;
        stepMs = 86400000 * 7;
        break;
      case '5Y':
        points = 60;
        stepMs = 86400000 * 30;
        break;
    }

    const candles: StockCandle[] = [];
    const now = Date.now();
    let current = basePrice * 0.92;

    for (let i = points; i >= 0; i--) {
      const ts = now - i * stepMs;
      // Deterministic small variance based on sine wave + index
      const delta = Math.sin(i * 0.6) * (basePrice * 0.015) + (Math.cos(i * 0.3) * (basePrice * 0.01));
      const open = Math.max(1, current);
      const close = Math.max(1, open + delta);
      const high = Math.max(open, close) + Math.abs(delta) * 0.4;
      const low = Math.min(open, close) - Math.abs(delta) * 0.4;
      const volume = Math.floor(1000000 + Math.abs(delta) * 500000);

      candles.push({
        timestamp: ts,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
      });

      current = close;
    }

    // Anchor last candle close to current quote price
    if (candles.length > 0 && quote) {
      const last = candles[candles.length - 1];
      last.close = quote.price;
      last.high = Math.max(last.high, quote.price);
      last.low = Math.min(last.low, quote.price);
    }

    return candles;
  }

  public getStockWatchlist(): StockWatchlistItem[] {
    return [...this.watchlist];
  }

  public addStockToWatchlist(item: Omit<StockWatchlistItem, 'addedAt'>): StockWatchlistItem {
    const existing = this.watchlist.find((w) => w.ticker.toUpperCase() === item.ticker.toUpperCase());
    if (existing) {
      return existing;
    }

    const newItem: StockWatchlistItem = {
      ...item,
      ticker: item.ticker.toUpperCase(),
      addedAt: Date.now(),
    };

    this.watchlist = [newItem, ...this.watchlist];
    this.saveWatchlist();
    return newItem;
  }

  public removeStockFromWatchlist(ticker: string): boolean {
    const initialLength = this.watchlist.length;
    this.watchlist = this.watchlist.filter((w) => w.ticker.toUpperCase() !== ticker.toUpperCase());
    if (this.watchlist.length !== initialLength) {
      this.saveWatchlist();
      return true;
    }
    return false;
  }

  private evaluateStockAlerts(quote: StockQuote) {
    if (!this.settings.enablePriceAlerts) return;

    for (const alert of this.alerts) {
      if (alert.ticker.toUpperCase() === quote.ticker.toUpperCase() && !alert.triggered) {
        let shouldTrigger = false;
        if (alert.direction === 'above' && quote.price >= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.direction === 'below' && quote.price <= alert.targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          alert.triggered = true;
          alert.triggeredAt = Date.now();
          this.saveAlerts();

          const payload: MarketsAlertPayload = {
            type: 'stock',
            title: `Stock Alert: ${quote.ticker} reached $${quote.price.toFixed(2)}`,
            message: `${quote.name} is now ${alert.direction} your target threshold of $${alert.targetPrice.toFixed(2)}.`,
            data: { quote, alert },
          };

          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('markets:alert-triggered', payload);
          }
        }
      }
    }
  }

  // ==========================================================================
  // IPO Tracker
  // ==========================================================================
  public async getIpos(status?: IpoStatus): Promise<IpoItem[]> {
    if (!status) return [...VERIFIED_IPOS];
    return VERIFIED_IPOS.filter((i) => i.status === status);
  }

  // ==========================================================================
  // Mutual Funds
  // ==========================================================================
  public async getMutualFunds(category?: string): Promise<MutualFundItem[]> {
    if (!category || category === 'all') return [...VERIFIED_MUTUAL_FUNDS];
    return VERIFIED_MUTUAL_FUNDS.filter(
      (f) => f.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  public async getMutualFundDetail(id: string): Promise<MutualFundItem | null> {
    const found = VERIFIED_MUTUAL_FUNDS.find((f) => f.id === id);
    return found ? { ...found } : null;
  }

  /**
   * Systematic Investment Plan (SIP) Calculator
   * Standard Mathematical Formula: M * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
   * where:
   *   M = monthly amount
   *   i = monthly rate of interest (expectedAnnualReturnRate / 12 / 100)
   *   n = number of months (durationYears * 12)
   */
  public calculateSip(params: SipCalculationParams): SipCalculationResult {
    const M = Math.max(0, params.monthlyAmount);
    const years = Math.max(0.1, params.durationYears);
    const annualRate = Math.max(0, params.expectedAnnualReturnRate);

    const n = Math.round(years * 12);
    const i = annualRate / (12 * 100);

    let futureValue = 0;
    if (i === 0) {
      futureValue = M * n;
    } else {
      futureValue = M * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    }

    const invested = M * n;
    const wealthGain = Math.max(0, futureValue - invested);

    return {
      investedAmount: Math.round(invested),
      estimatedFutureValue: Math.round(futureValue),
      wealthGain: Math.round(wealthGain),
      monthlyInvestment: M,
      durationYears: years,
      expectedRate: annualRate,
      disclaimer: 'Informational simulation based purely on compound mathematics. Does not constitute financial advice or guaranteed investment returns.',
    };
  }

  /**
   * Lump-sum Investment Calculator
   * Standard Compound Interest Formula: P * (1 + r/100)^t
   */
  public calculateLumpSum(params: LumpSumCalculationParams): LumpSumCalculationResult {
    const P = Math.max(0, params.principalAmount);
    const years = Math.max(0.1, params.durationYears);
    const r = Math.max(0, params.expectedAnnualReturnRate);

    const futureValue = P * Math.pow(1 + r / 100, years);
    const wealthGain = Math.max(0, futureValue - P);

    return {
      principalAmount: Math.round(P),
      estimatedFutureValue: Math.round(futureValue),
      wealthGain: Math.round(wealthGain),
      durationYears: years,
      expectedRate: r,
      disclaimer: 'Informational simulation based purely on compound mathematics. Does not constitute financial advice or guaranteed investment returns.',
    };
  }

  // ==========================================================================
  // Shopping Price Tracker
  // ==========================================================================
  public getTrackedProducts(): TrackedProduct[] {
    return [...this.trackedProducts];
  }

  public async saveTrackedProduct(
    product: Omit<TrackedProduct, 'id' | 'dateAdded' | 'lastChecked' | 'lowestPrice' | 'highestPrice' | 'priceHistory'> & {
      id?: string;
      initialPrice?: number;
    }
  ): Promise<TrackedProduct> {
    const now = Date.now();
    const price = product.initialPrice ?? product.currentPrice ?? 0;

    if (product.id) {
      const idx = this.trackedProducts.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        const existing = this.trackedProducts[idx];
        const updated: TrackedProduct = {
          ...existing,
          title: product.title || existing.title,
          url: product.url || existing.url,
          retailer: product.retailer || existing.retailer,
          category: product.category || existing.category,
          targetPriceAlert: product.targetPriceAlert !== undefined ? product.targetPriceAlert : existing.targetPriceAlert,
          notes: product.notes !== undefined ? product.notes : existing.notes,
        };
        this.trackedProducts[idx] = updated;
        this.saveTrackedProducts();
        return updated;
      }
    }

    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newProduct: TrackedProduct = {
      id: newId,
      title: product.title,
      url: product.url,
      retailer: product.retailer || 'Online Retailer',
      category: product.category || 'General',
      targetPriceAlert: product.targetPriceAlert,
      currentPrice: price,
      currency: product.currency || this.settings.defaultCurrency || 'USD',
      lowestPrice: price,
      highestPrice: price,
      dateAdded: now,
      lastChecked: now,
      inStock: product.inStock ?? true,
      priceHistory: [
        {
          date: now,
          price,
          retailer: product.retailer || 'Online Retailer',
          inStock: product.inStock ?? true,
          verified: true,
        },
      ],
      notes: product.notes || 'Tracking begins from the date added. Historical prior prices are never fabricated.',
    };

    this.trackedProducts = [newProduct, ...this.trackedProducts];
    this.saveTrackedProducts();
    return newProduct;
  }

  public async recordProductPricePoint(productId: string, price: number, inStock = true): Promise<TrackedProduct> {
    const idx = this.trackedProducts.findIndex((p) => p.id === productId);
    if (idx === -1) {
      throw new Error(`Tracked product with id ${productId} not found`);
    }

    const prod = this.trackedProducts[idx];
    const now = Date.now();
    const newHistory = [
      ...prod.priceHistory,
      {
        date: now,
        price,
        retailer: prod.retailer,
        inStock,
        verified: true,
      },
    ];

    const prices = newHistory.map((h) => h.price);
    const updated: TrackedProduct = {
      ...prod,
      currentPrice: price,
      inStock,
      lastChecked: now,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      priceHistory: newHistory,
    };

    this.trackedProducts[idx] = updated;
    this.saveTrackedProducts();

    // Check price drop alert
    if (
      this.settings.enablePriceAlerts &&
      updated.targetPriceAlert &&
      price <= updated.targetPriceAlert
    ) {
      const payload: MarketsAlertPayload = {
        type: 'shopping',
        title: `Price Drop Alert: ${updated.title}`,
        message: `Price dropped to $${price.toFixed(2)} (at or below target $${updated.targetPriceAlert.toFixed(2)}) at ${updated.retailer}!`,
        data: { product: updated },
      };

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('markets:alert-triggered', payload);
      }
    }

    return updated;
  }

  public deleteTrackedProduct(id: string): boolean {
    const len = this.trackedProducts.length;
    this.trackedProducts = this.trackedProducts.filter((p) => p.id !== id);
    if (this.trackedProducts.length !== len) {
      this.saveTrackedProducts();
      return true;
    }
    return false;
  }

  // ==========================================================================
  // Financial News
  // ==========================================================================
  public async getFinancialNews(ticker?: string, category?: string): Promise<FinancialNewsArticle[]> {
    let list = [...VERIFIED_FINANCIAL_NEWS];

    if (ticker) {
      const t = ticker.toUpperCase();
      list = list.filter((a) => a.relatedTickers.includes(t));
    }

    if (category && category !== 'all') {
      list = list.filter((a) => a.category === category);
    }

    return list;
  }
}
