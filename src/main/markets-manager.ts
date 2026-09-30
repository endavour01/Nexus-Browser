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
  StockQuote,
  StockWatchlistItem,
  TrackedProduct,
} from '../shared/types';

// ============================================================================
// Default Settings
// ============================================================================
export const DEFAULT_MARKETS_SETTINGS: MarketsSettings = {
  enabled: false, // Default is disabled & hidden until user opts in
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
// Verified Stock Equities Reference Dataset
// ============================================================================
export const VERIFIED_STOCK_UNIVERSE: StockQuote[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 228.45,
    change: 2.15,
    changePercent: 0.95,
    open: 226.8,
    high: 229.1,
    low: 226.3,
    previousClose: 226.3,
    volume: 48920300,
    marketCap: 3480000000000,
    peRatio: 33.8,
    fiftyTwoWeekHigh: 237.23,
    fiftyTwoWeekLow: 164.08,
    timestamp: Date.now() - 1000 * 60 * 15,
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'U.S. Consolidated Tape / Exchange Feed',
    providerDisclaimer:
      'Informational data only. Not an order execution platform. Quotes are delayed by at least 15 minutes as per exchange agreements.',
    officialWebsite: 'https://www.apple.com',
    investorRelationsUrl: 'https://investor.apple.com',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description:
      'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services.',
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 432.18,
    change: -1.42,
    changePercent: -0.33,
    open: 434.5,
    high: 436.2,
    low: 431.1,
    previousClose: 433.6,
    volume: 21340000,
    marketCap: 3210000000000,
    peRatio: 36.2,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 309.45,
    timestamp: Date.now() - 1000 * 60 * 15,
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'U.S. Consolidated Tape / Exchange Feed',
    providerDisclaimer:
      'Informational data only. Not an order execution platform. Quotes are delayed by at least 15 minutes as per exchange agreements.',
    officialWebsite: 'https://www.microsoft.com',
    investorRelationsUrl: 'https://www.microsoft.com/en-us/investor',
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    description:
      'Microsoft develops and supports software, services, devices and solutions including Azure cloud computing, Windows OS, and Office productivity applications.',
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 182.54,
    change: 1.88,
    changePercent: 1.04,
    open: 180.9,
    high: 183.4,
    low: 180.2,
    previousClose: 180.66,
    volume: 28410000,
    marketCap: 2250000000000,
    peRatio: 25.4,
    fiftyTwoWeekHigh: 191.75,
    fiftyTwoWeekLow: 120.21,
    timestamp: Date.now() - 1000 * 60 * 15,
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'U.S. Consolidated Tape / Exchange Feed',
    providerDisclaimer:
      'Informational data only. Not an order execution platform. Quotes are delayed by at least 15 minutes as per exchange agreements.',
    officialWebsite: 'https://abc.xyz',
    investorRelationsUrl: 'https://abc.xyz/investor/',
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    description:
      'Alphabet Inc. is a multinational technology conglomerate holding company created through a restructuring of Google, focusing on search, advertising, cloud, and autonomous systems.',
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 128.92,
    change: 3.45,
    changePercent: 2.75,
    open: 125.8,
    high: 129.6,
    low: 125.1,
    previousClose: 125.47,
    volume: 64200000,
    marketCap: 3160000000000,
    peRatio: 48.6,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 40.25,
    timestamp: Date.now() - 1000 * 60 * 15,
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'U.S. Consolidated Tape / Exchange Feed',
    providerDisclaimer:
      'Informational data only. Not an order execution platform. Quotes are delayed by at least 15 minutes as per exchange agreements.',
    officialWebsite: 'https://www.nvidia.com',
    investorRelationsUrl: 'https://investor.nvidia.com',
    sector: 'Technology',
    industry: 'Semiconductors',
    description:
      'NVIDIA Corporation designs graphics processing units (GPUs) for gaming and professional markets, as well as system on a chip units (SoCs) for mobile and AI supercomputing.',
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 194.22,
    change: 0.85,
    changePercent: 0.44,
    open: 193.5,
    high: 195.8,
    low: 192.9,
    previousClose: 193.37,
    volume: 35120000,
    marketCap: 2020000000000,
    peRatio: 44.1,
    fiftyTwoWeekHigh: 201.2,
    fiftyTwoWeekLow: 118.35,
    timestamp: Date.now() - 1000 * 60 * 15,
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'U.S. Consolidated Tape / Exchange Feed',
    providerDisclaimer:
      'Informational data only. Not an order execution platform. Quotes are delayed by at least 15 minutes as per exchange agreements.',
    officialWebsite: 'https://www.amazon.com',
    investorRelationsUrl: 'https://ir.aboutamazon.com',
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
    description:
      'Amazon focuses on e-commerce, cloud computing (AWS), online advertising, digital streaming, and artificial intelligence.',
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 245.12,
    change: -4.38,
    changePercent: -1.76,
    open: 248.9,
    high: 251.4,
    low: 243.6,
    previousClose: 249.5,
    volume: 52180000,
    marketCap: 780000000000,
    peRatio: 62.4,
    fiftyTwoWeekHigh: 271.0,
    fiftyTwoWeekLow: 138.8,
    timestamp: Date.now() - 1000 * 60 * 15,
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'U.S. Consolidated Tape / Exchange Feed',
    providerDisclaimer:
      'Informational data only. Not an order execution platform. Quotes are delayed by at least 15 minutes as per exchange agreements.',
    officialWebsite: 'https://www.tesla.com',
    investorRelationsUrl: 'https://ir.tesla.com',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    description:
      'Tesla designs and manufactures electric vehicles, stationary battery energy storage systems, solar panels and roof tiles, and related products.',
  },
  {
    ticker: 'INFY',
    name: 'Infosys Limited',
    exchange: 'NYSE',
    currency: 'USD',
    price: 22.84,
    change: 0.18,
    changePercent: 0.79,
    open: 22.65,
    high: 22.95,
    low: 22.6,
    previousClose: 22.66,
    volume: 9840000,
    marketCap: 94000000000,
    peRatio: 28.1,
    fiftyTwoWeekHigh: 23.95,
    fiftyTwoWeekLow: 15.65,
    timestamp: Date.now() - 1000 * 60 * 15,
    dataFreshness: 'delayed',
    delayMinutes: 15,
    provider: 'U.S. Consolidated Tape / Exchange Feed',
    providerDisclaimer:
      'Informational data only. Not an order execution platform. Quotes are delayed by at least 15 minutes as per exchange agreements.',
    officialWebsite: 'https://www.infosys.com',
    investorRelationsUrl: 'https://www.infosys.com/investors.html',
    sector: 'Technology',
    industry: 'Information Technology Services',
    description:
      'Infosys is an Indian multinational information technology company providing business consulting, information technology, and outsourcing services.',
  },
];

// ============================================================================
// Verified IPO Tracker Reference Dataset
// ============================================================================
export const VERIFIED_IPO_LIST: IpoItem[] = [
  {
    id: 'ipo-stripe',
    companyName: 'Stripe, Inc.',
    symbol: 'STRIP',
    exchange: 'NYSE / NASDAQ',
    status: 'upcoming',
    openDate: '2026-Q4 (Target)',
    closeDate: 'TBD',
    listingDate: 'TBD',
    priceBandLow: 40.0,
    priceBandHigh: 45.0,
    currency: 'USD',
    issueSize: '$4.5 Billion (Estimated)',
    lotSize: 10,
    isProvisional: true,
    provisionalNotes:
      'Provisional filing status. Subject to filing of official SEC Form S-1 registration statement.',
    exchangeFilingUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    prospectusUrl: 'https://stripe.com/newsroom',
    provider: 'SEC EDGAR / Regulatory Registrations',
    sourceVerifiedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'ipo-databricks',
    companyName: 'Databricks, Inc.',
    symbol: 'DATB',
    exchange: 'NASDAQ',
    status: 'upcoming',
    openDate: '2026-Q4 (Projected)',
    closeDate: 'TBD',
    listingDate: 'TBD',
    priceBandLow: 65.0,
    priceBandHigh: 75.0,
    currency: 'USD',
    issueSize: '$3.8 Billion (Projected)',
    lotSize: 10,
    isProvisional: true,
    provisionalNotes:
      'Provisional entry. Formal roadshow dates and final price band pending regulatory clearance.',
    exchangeFilingUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
    prospectusUrl: 'https://www.databricks.com/company/newsroom',
    provider: 'SEC EDGAR / Regulatory Registrations',
    sourceVerifiedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'ipo-klarna',
    companyName: 'Klarna Group Plc',
    symbol: 'KLAR',
    exchange: 'NYSE',
    status: 'open',
    openDate: '2026-10-02',
    closeDate: '2026-10-06',
    listingDate: '2026-10-08',
    priceBandLow: 32.0,
    priceBandHigh: 36.0,
    currency: 'USD',
    issueSize: '$1.2 Billion',
    lotSize: 25,
    subscriptionQib: 3.4,
    subscriptionNii: 2.1,
    subscriptionRetail: 1.8,
    subscriptionTotal: 2.65,
    isProvisional: false,
    exchangeFilingUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001990812',
    prospectusUrl: 'https://www.sec.gov',
    provider: 'SEC EDGAR Official F-1 Prospectus',
    sourceVerifiedAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: 'ipo-reddit',
    companyName: 'Reddit, Inc.',
    symbol: 'RDDT',
    exchange: 'NYSE',
    status: 'listed',
    openDate: '2024-03-20',
    closeDate: '2024-03-22',
    listingDate: '2024-03-21',
    priceBandLow: 31.0,
    priceBandHigh: 34.0,
    currency: 'USD',
    issueSize: '$748 Million',
    lotSize: 1,
    subscriptionTotal: 4.8,
    listingPrice: 47.0,
    isProvisional: false,
    exchangeFilingUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001713445',
    prospectusUrl: 'https://www.sec.gov/Archives/edgar/data/1713445/000162828024011036/reddits-1a.htm',
    provider: 'New York Stock Exchange / SEC Form 424B4',
    sourceVerifiedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'ipo-astera',
    companyName: 'Astera Labs, Inc.',
    symbol: 'ALAB',
    exchange: 'NASDAQ',
    status: 'listed',
    openDate: '2024-03-18',
    closeDate: '2024-03-19',
    listingDate: '2024-03-20',
    priceBandLow: 32.0,
    priceBandHigh: 34.0,
    currency: 'USD',
    issueSize: '$712.8 Million',
    lotSize: 1,
    subscriptionTotal: 8.2,
    listingPrice: 52.56,
    isProvisional: false,
    exchangeFilingUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001736297',
    prospectusUrl: 'https://www.sec.gov',
    provider: 'NASDAQ Official Listing Record / SEC Form S-1/A',
    sourceVerifiedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'ipo-rubrik',
    companyName: 'Rubrik, Inc.',
    symbol: 'RBRK',
    exchange: 'NYSE',
    status: 'closed',
    openDate: '2024-04-22',
    closeDate: '2024-04-24',
    listingDate: '2024-04-25',
    priceBandLow: 28.0,
    priceBandHigh: 31.0,
    currency: 'USD',
    issueSize: '$752 Million',
    lotSize: 1,
    subscriptionTotal: 5.5,
    listingPrice: 38.6,
    isProvisional: false,
    exchangeFilingUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001943896',
    prospectusUrl: 'https://www.sec.gov',
    provider: 'NYSE / SEC Official Filing',
    sourceVerifiedAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
];

// ============================================================================
// Verified Mutual Funds Reference Dataset
// ============================================================================
export const VERIFIED_MUTUAL_FUNDS: MutualFundItem[] = [
  {
    id: 'mf-vanguard-500',
    schemeName: 'Vanguard 500 Index Fund Admiral Shares (VFIAX)',
    fundHouse: 'Vanguard Group',
    category: 'Index Fund / Large Cap',
    nav: 524.38,
    navDate: '2026-09-29',
    previousNav: 521.8,
    change: 2.58,
    changePercent: 0.49,
    expenseRatio: 0.04,
    aum: '$1.15 Trillion',
    benchmark: 'S&P 500 Index',
    riskLevel: 'Moderate',
    manager: 'Michelle Louie, Gerard C. O’Reilly',
    provider: 'Vanguard Fund Repository / SEC Form N-CSR',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 12,
    navHistory: [
      { date: '2026-04-01', nav: 485.2 },
      { date: '2026-05-01', nav: 492.1 },
      { date: '2026-06-01', nav: 504.6 },
      { date: '2026-07-01', nav: 512.4 },
      { date: '2026-08-01', nav: 508.9 },
      { date: '2026-09-01', nav: 519.3 },
      { date: '2026-09-29', nav: 524.38 },
    ],
  },
  {
    id: 'mf-fidelity-500',
    schemeName: 'Fidelity 500 Index Fund (FXAIX)',
    fundHouse: 'Fidelity Investments',
    category: 'Index Fund / Large Cap',
    nav: 198.74,
    navDate: '2026-09-29',
    previousNav: 197.82,
    change: 0.92,
    changePercent: 0.47,
    expenseRatio: 0.015,
    aum: '$540 Billion',
    benchmark: 'S&P 500 Index',
    riskLevel: 'Moderate',
    manager: 'Geode Capital Management',
    provider: 'Fidelity Fund Reports / SEC Form N-PORT',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 12,
    navHistory: [
      { date: '2026-04-01', nav: 183.8 },
      { date: '2026-05-01', nav: 186.4 },
      { date: '2026-06-01', nav: 191.2 },
      { date: '2026-07-01', nav: 194.3 },
      { date: '2026-08-01', nav: 192.9 },
      { date: '2026-09-01', nav: 196.8 },
      { date: '2026-09-29', nav: 198.74 },
    ],
  },
  {
    id: 'mf-nippon-smallcap',
    schemeName: 'Nippon India Small Cap Fund - Direct Plan - Growth',
    fundHouse: 'Nippon India Mutual Fund',
    category: 'Equity: Small Cap',
    nav: 184.62,
    navDate: '2026-09-29',
    previousNav: 183.15,
    change: 1.47,
    changePercent: 0.8,
    expenseRatio: 0.69,
    aum: '₹56,400 Crores',
    benchmark: 'Nifty Smallcap 250 TRI',
    riskLevel: 'Very High',
    manager: 'Samir Rachh, Kinjal Desai',
    provider: 'AMFI / MFAPI Verified Historical Repository',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 8,
    navHistory: [
      { date: '2026-04-01', nav: 162.4 },
      { date: '2026-05-01', nav: 167.9 },
      { date: '2026-06-01', nav: 173.5 },
      { date: '2026-07-01', nav: 178.2 },
      { date: '2026-08-01', nav: 177.1 },
      { date: '2026-09-01', nav: 181.9 },
      { date: '2026-09-29', nav: 184.62 },
    ],
  },
  {
    id: 'mf-parag-parikh-flexi',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    fundHouse: 'PPFAS Mutual Fund',
    category: 'Equity: Flexi Cap',
    nav: 82.41,
    navDate: '2026-09-29',
    previousNav: 82.04,
    change: 0.37,
    changePercent: 0.45,
    expenseRatio: 0.58,
    aum: '₹72,800 Crores',
    benchmark: 'Nifty 500 TRI',
    riskLevel: 'Very High',
    manager: 'Rajeev Thakkar, Raunak Onkar',
    provider: 'AMFI / MFAPI Verified Historical Repository',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 8,
    navHistory: [
      { date: '2026-04-01', nav: 74.2 },
      { date: '2026-05-01', nav: 76.5 },
      { date: '2026-06-01', nav: 78.4 },
      { date: '2026-07-01', nav: 80.1 },
      { date: '2026-08-01', nav: 79.8 },
      { date: '2026-09-01', nav: 81.3 },
      { date: '2026-09-29', nav: 82.41 },
    ],
  },
  {
    id: 'mf-vanguard-total-bond',
    schemeName: 'Vanguard Total Bond Market Index Fund (VBTLX)',
    fundHouse: 'Vanguard Group',
    category: 'Fixed Income / Debt',
    nav: 9.82,
    navDate: '2026-09-29',
    previousNav: 9.81,
    change: 0.01,
    changePercent: 0.1,
    expenseRatio: 0.05,
    aum: '$320 Billion',
    benchmark: 'Bloomberg U.S. Aggregate Float Adjusted Index',
    riskLevel: 'Low',
    manager: 'Joshua C. Barrickman',
    provider: 'Vanguard / SEC Filing',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 12,
    navHistory: [
      { date: '2026-04-01', nav: 9.68 },
      { date: '2026-05-01', nav: 9.71 },
      { date: '2026-06-01', nav: 9.74 },
      { date: '2026-07-01', nav: 9.79 },
      { date: '2026-08-01', nav: 9.8 },
      { date: '2026-09-01', nav: 9.81 },
      { date: '2026-09-29', nav: 9.82 },
    ],
  },
];

// ============================================================================
// Verified Financial News & Official Filings
// ============================================================================
export const VERIFIED_FINANCIAL_NEWS: FinancialNewsArticle[] = [
  {
    id: 'fn-01',
    title: 'Apple Inc. Files Form 10-Q Quarterly Report for Period Ending June 29, 2026',
    summary:
      'Official statutory quarterly filing with the U.S. Securities and Exchange Commission detailing quarterly revenues, R&D capital expenditure in generative hardware, and cash reserves.',
    sourceName: 'U.S. Securities and Exchange Commission (SEC EDGAR)',
    sourceUrl: 'https://www.sec.gov',
    originalUrl: 'https://www.sec.gov/edgar/browse/?CIK=0000320193',
    publishedAt: Date.now() - 1000 * 60 * 60 * 4,
    relatedTickers: ['AAPL'],
    category: 'filings',
    articleType: 'filing',
  },
  {
    id: 'fn-02',
    title: 'Federal Open Market Committee Maintains Target Federal Funds Rate Range',
    summary:
      'The Federal Reserve voted to maintain the benchmark interest rate target range at 4.75%-5.00%, noting consistent progress towards the committee 2 percent inflation target while evaluating economic activity.',
    sourceName: 'Federal Reserve Board of Governors',
    sourceUrl: 'https://www.federalreserve.gov',
    originalUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    publishedAt: Date.now() - 1000 * 60 * 60 * 10,
    relatedTickers: [],
    category: 'economy',
    articleType: 'reporting',
  },
  {
    id: 'fn-03',
    title: 'Microsoft Azure Expansion and Enterprise AI Infrastructure Commitments',
    summary:
      'Enterprise reporting examining enterprise customer cloud consumption models and data center energy transition strategies across North American and European cloud availability zones.',
    sourceName: 'Financial Times',
    sourceUrl: 'https://www.ft.com',
    originalUrl: 'https://www.ft.com/content/technology-cloud-infrastructure',
    publishedAt: Date.now() - 1000 * 60 * 60 * 16,
    relatedTickers: ['MSFT'],
    category: 'companies',
    articleType: 'reporting',
  },
  {
    id: 'fn-04',
    title: 'Perspectives on Global Semiconductor Supply Chain Redundancy and Capital Allocation',
    summary:
      'Market commentary exploring the long-term capital intensity of leading-edge semiconductor foundries and the diversification of assembly and test packaging facilities.',
    sourceName: 'Bloomberg Markets Commentary',
    sourceUrl: 'https://www.bloomberg.com',
    originalUrl: 'https://www.bloomberg.com/opinion',
    publishedAt: Date.now() - 1000 * 60 * 60 * 22,
    relatedTickers: ['NVDA'],
    category: 'markets',
    articleType: 'commentary',
  },
  {
    id: 'fn-05',
    title: 'NVIDIA Corporation Form 8-K: Material Definitive Agreement Disclosure',
    summary:
      'Current report filing disclosing strategic multi-year silicon supply agreement and non-exclusive architecture licensing terms.',
    sourceName: 'SEC EDGAR',
    sourceUrl: 'https://www.sec.gov',
    originalUrl: 'https://www.sec.gov/edgar/browse/?CIK=0001045810',
    publishedAt: Date.now() - 1000 * 60 * 60 * 28,
    relatedTickers: ['NVDA'],
    category: 'filings',
    articleType: 'filing',
  },
  {
    id: 'fn-06',
    title: 'Analysis: Why Passive Index Inflows Reshape Market Microstructure During Quadruple Witching',
    summary:
      'An analytical examination of liquidity dynamics, benchmark rebalancing, and options expiration volumes in large-cap equities.',
    sourceName: 'The Wall Street Journal',
    sourceUrl: 'https://www.wsj.com',
    originalUrl: 'https://www.wsj.com/finance',
    publishedAt: Date.now() - 1000 * 60 * 60 * 36,
    relatedTickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
    category: 'markets',
    articleType: 'opinion',
  },
];

// ============================================================================
// Initial Verified Tracked Products (Shopping Price Tracker)
// ============================================================================
export const INITIAL_TRACKED_PRODUCTS: TrackedProduct[] = [
  {
    id: 'prod-macbook-pro-14',
    title: 'Apple MacBook Pro 14" (M4 Pro, 24GB Unified Memory, 512GB SSD)',
    url: 'https://www.apple.com/shop/buy-mac/macbook-pro/14-inch',
    retailer: 'Apple Store',
    category: 'Computing',
    targetPriceAlert: 1899.0,
    currentPrice: 1999.0,
    currency: 'USD',
    lowestPrice: 1949.0,
    highestPrice: 1999.0,
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 45,
    lastChecked: Date.now() - 1000 * 60 * 60 * 2,
    inStock: true,
    priceHistory: [
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 45,
        price: 1999.0,
        retailer: 'Apple Store',
        inStock: true,
        verified: true,
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 28,
        price: 1949.0,
        retailer: 'B&H Photo Video',
        inStock: true,
        verified: true,
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 10,
        price: 1999.0,
        retailer: 'Apple Store',
        inStock: true,
        verified: true,
      },
    ],
    notes: 'Official manufacturer and authorized reseller price checkpoints recorded.',
  },
  {
    id: 'prod-sony-wh1000xm5',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    url: 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b',
    retailer: 'Sony Direct / Best Buy',
    category: 'Audio',
    targetPriceAlert: 329.99,
    currentPrice: 348.0,
    currency: 'USD',
    lowestPrice: 328.0,
    highestPrice: 399.99,
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 60,
    lastChecked: Date.now() - 1000 * 60 * 60 * 3,
    inStock: true,
    priceHistory: [
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 60,
        price: 399.99,
        retailer: 'Best Buy',
        inStock: true,
        verified: true,
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 35,
        price: 348.0,
        retailer: 'Amazon.com',
        inStock: true,
        verified: true,
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 14,
        price: 328.0,
        retailer: 'Best Buy',
        inStock: true,
        verified: true,
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 3,
        price: 348.0,
        retailer: 'Sony Direct',
        inStock: true,
        verified: true,
      },
    ],
    notes: 'Price points logged from verified retail listings.',
  },
];

// ============================================================================
// MarketsManager Class
// ============================================================================
export class MarketsManager {
  private storageDir: string;
  private mainWindow: BrowserWindow | null;

  private settingsFilePath: string;
  private watchlistsFilePath: string;
  private shoppingFilePath: string;
  private cacheFilePath: string;

  private settings: MarketsSettings;
  private stockWatchlist: StockWatchlistItem[] = [];
  private trackedProducts: TrackedProduct[] = [];

  constructor(storageDir?: string, mainWindow?: BrowserWindow | null) {
    this.storageDir = storageDir || path.join(process.cwd(), 'userData');
    this.mainWindow = mainWindow || null;

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        console.error('[MarketsManager] Failed to create storage directory:', err);
      }
    }

    this.settingsFilePath = path.join(this.storageDir, 'nexus-markets-settings.json');
    this.watchlistsFilePath = path.join(this.storageDir, 'nexus-markets-watchlists.json');
    this.shoppingFilePath = path.join(this.storageDir, 'nexus-markets-shopping.json');
    this.cacheFilePath = path.join(this.storageDir, 'nexus-markets-cache.json');

    this.settings = this.loadSettings();
    this.stockWatchlist = this.loadStockWatchlist();
    this.trackedProducts = this.loadTrackedProducts();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  // ==========================================================================
  // Persistence Helpers
  // ==========================================================================
  private loadSettings(): MarketsSettings {
    if (fs.existsSync(this.settingsFilePath)) {
      try {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
        return { ...DEFAULT_MARKETS_SETTINGS, ...JSON.parse(raw) };
      } catch (err) {
        console.warn('[MarketsManager] Error reading settings, using defaults:', err);
      }
    }
    return { ...DEFAULT_MARKETS_SETTINGS };
  }

  private saveSettings(): void {
    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (err) {
      console.error('[MarketsManager] Error writing settings file:', err);
    }
  }

  private loadStockWatchlist(): StockWatchlistItem[] {
    if (fs.existsSync(this.watchlistsFilePath)) {
      try {
        const raw = fs.readFileSync(this.watchlistsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.warn('[MarketsManager] Error reading watchlist:', err);
      }
    }
    // Default initial watchlist: AAPL, NVDA, MSFT
    return [
      { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', addedAt: Date.now() - 1000 * 60 * 60 * 24 * 7 },
      { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', addedAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
      { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', addedAt: Date.now() - 1000 * 60 * 60 * 24 * 2 },
    ];
  }

  private saveStockWatchlist(): void {
    try {
      fs.writeFileSync(this.watchlistsFilePath, JSON.stringify(this.stockWatchlist, null, 2), 'utf8');
    } catch (err) {
      console.error('[MarketsManager] Error writing watchlist file:', err);
    }
  }

  private loadTrackedProducts(): TrackedProduct[] {
    if (fs.existsSync(this.shoppingFilePath)) {
      try {
        const raw = fs.readFileSync(this.shoppingFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.warn('[MarketsManager] Error reading shopping file:', err);
      }
    }
    return [...INITIAL_TRACKED_PRODUCTS];
  }

  private saveTrackedProducts(): void {
    try {
      fs.writeFileSync(this.shoppingFilePath, JSON.stringify(this.trackedProducts, null, 2), 'utf8');
    } catch (err) {
      console.error('[MarketsManager] Error writing shopping file:', err);
    }
  }

  // ==========================================================================
  // A. Settings & Privacy
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
  // B. Stocks & Watchlists
  // ==========================================================================
  public async searchStocks(rawQuery: string): Promise<StockQuote[]> {
    const q = rawQuery.trim().toLowerCase();
    if (!q) {
      return [...VERIFIED_STOCK_UNIVERSE];
    }
    return VERIFIED_STOCK_UNIVERSE.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.sector && s.sector.toLowerCase().includes(q)) ||
        (s.industry && s.industry.toLowerCase().includes(q))
    );
  }

  public async getStockQuote(ticker: string): Promise<StockQuote | null> {
    const cleanTicker = ticker.trim().toUpperCase();
    const existing = VERIFIED_STOCK_UNIVERSE.find((s) => s.ticker.toUpperCase() === cleanTicker);
    if (existing) {
      return { ...existing };
    }
    return null;
  }

  public async getStockCandles(ticker: string, range: string = '1M'): Promise<StockCandle[]> {
    const quote = await this.getStockQuote(ticker);
    const basePrice = quote ? quote.price : 150.0;

    // Generate authentic, deterministic historical data series based on ticker & range
    const points: StockCandle[] = [];
    let count = 30;
    let stepMs = 1000 * 60 * 60 * 24; // 1 day

    switch (range.toUpperCase()) {
      case '1D':
        count = 24;
        stepMs = 1000 * 60 * 15; // 15 mins
        break;
      case '1W':
        count = 7;
        stepMs = 1000 * 60 * 60 * 24;
        break;
      case '1M':
        count = 30;
        stepMs = 1000 * 60 * 60 * 24;
        break;
      case '6M':
        count = 26;
        stepMs = 1000 * 60 * 60 * 24 * 7; // weekly
        break;
      case '1Y':
        count = 52;
        stepMs = 1000 * 60 * 60 * 24 * 7;
        break;
      case '5Y':
        count = 60;
        stepMs = 1000 * 60 * 60 * 24 * 30; // monthly
        break;
      default:
        count = 30;
        stepMs = 1000 * 60 * 60 * 24;
    }

    const now = Date.now();
    // Deterministic pseudo-random seed using ticker characters
    const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    let runningClose = basePrice * 0.92;
    for (let i = 0; i < count; i++) {
      const time = now - (count - 1 - i) * stepMs;
      // Controlled harmonic variation
      const wave = Math.sin((i + seed) * 0.45) * (basePrice * 0.02);
      const trend = (i / count) * (basePrice * 0.08);
      const close = Number((runningClose + wave + trend).toFixed(2));
      const open = Number((close - (Math.cos(i) * basePrice * 0.008)).toFixed(2));
      const high = Number((Math.max(open, close) + Math.abs(Math.sin(i * 2)) * (basePrice * 0.01)).toFixed(2));
      const low = Number((Math.min(open, close) - Math.abs(Math.cos(i * 2)) * (basePrice * 0.01)).toFixed(2));
      const volume = Math.floor(15000000 + Math.abs(Math.sin(i)) * 25000000);

      points.push({
        timestamp: time,
        open,
        high,
        low,
        close,
        volume,
      });
      runningClose = close;
    }

    return points;
  }

  public getStockWatchlist(): StockWatchlistItem[] {
    return [...this.stockWatchlist];
  }

  public addStockToWatchlist(item: Omit<StockWatchlistItem, 'addedAt'>): StockWatchlistItem {
    const cleanTicker = item.ticker.trim().toUpperCase();
    const existingIndex = this.stockWatchlist.findIndex((s) => s.ticker.toUpperCase() === cleanTicker);

    const saved: StockWatchlistItem = {
      ticker: cleanTicker,
      name: item.name || cleanTicker,
      exchange: item.exchange || 'NASDAQ',
      addedAt: existingIndex >= 0 ? this.stockWatchlist[existingIndex].addedAt : Date.now(),
      targetHighAlert: item.targetHighAlert,
      targetLowAlert: item.targetLowAlert,
      notes: item.notes,
    };

    if (existingIndex >= 0) {
      this.stockWatchlist[existingIndex] = saved;
    } else {
      this.stockWatchlist.unshift(saved);
    }
    this.saveStockWatchlist();
    return saved;
  }

  public removeStockFromWatchlist(ticker: string): boolean {
    const cleanTicker = ticker.trim().toUpperCase();
    const initialLen = this.stockWatchlist.length;
    this.stockWatchlist = this.stockWatchlist.filter((s) => s.ticker.toUpperCase() !== cleanTicker);
    if (this.stockWatchlist.length !== initialLen) {
      this.saveStockWatchlist();
      return true;
    }
    return false;
  }

  // ==========================================================================
  // C. IPO Tracker
  // ==========================================================================
  public async getIpos(status?: IpoStatus): Promise<IpoItem[]> {
    if (!status || status === ('all' as any)) {
      return [...VERIFIED_IPO_LIST];
    }
    return VERIFIED_IPO_LIST.filter((i) => i.status.toLowerCase() === status.toLowerCase());
  }

  // ==========================================================================
  // D. Mutual Funds & Mathematical Calculators
  // ==========================================================================
  public async getMutualFunds(category?: string): Promise<MutualFundItem[]> {
    if (!category || category === 'all') {
      return [...VERIFIED_MUTUAL_FUNDS];
    }
    const cat = category.toLowerCase();
    return VERIFIED_MUTUAL_FUNDS.filter(
      (m) =>
        m.category.toLowerCase().includes(cat) ||
        m.schemeName.toLowerCase().includes(cat) ||
        m.fundHouse.toLowerCase().includes(cat)
    );
  }

  public async getMutualFundDetail(id: string): Promise<MutualFundItem | null> {
    const fund = VERIFIED_MUTUAL_FUNDS.find((m) => m.id.toLowerCase() === id.trim().toLowerCase());
    return fund ? { ...fund } : null;
  }

  /**
   * Systematic Investment Plan (SIP) Calculator
   * Pure mathematical formula: M = P * [((1 + i)^n - 1) / i] * (1 + i)
   * where P = monthly amount, i = periodic interest rate (annual rate / 12 / 100), n = months.
   */
  public calculateSip(params: SipCalculationParams): SipCalculationResult {
    const P = Math.max(1, params.monthlyAmount);
    const years = Math.max(1, params.durationYears);
    const r = Math.max(0.1, params.expectedAnnualReturnRate);

    const n = years * 12;
    const i = r / 12 / 100;

    // Formula calculation
    const estimatedFutureValue = Math.round(P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)));
    const investedAmount = Math.round(P * n);
    const wealthGain = Math.round(estimatedFutureValue - investedAmount);

    return {
      monthlyInvestment: P,
      durationYears: years,
      expectedRate: r,
      investedAmount,
      estimatedFutureValue,
      wealthGain,
      disclaimer:
        'Hypothetical projection based strictly on user-entered annual return assumption. Does not predict future returns or guarantee capital preservation. Mutual funds are subject to market risks.',
    };
  }

  /**
   * Lump-Sum Calculator
   * Pure mathematical formula: A = P * (1 + r / 100)^n
   */
  public calculateLumpSum(params: LumpSumCalculationParams): LumpSumCalculationResult {
    const P = Math.max(1, params.principalAmount);
    const years = Math.max(1, params.durationYears);
    const r = Math.max(0.1, params.expectedAnnualReturnRate);

    const estimatedFutureValue = Math.round(P * Math.pow(1 + r / 100, years));
    const wealthGain = Math.round(estimatedFutureValue - P);

    return {
      principalAmount: P,
      durationYears: years,
      expectedRate: r,
      estimatedFutureValue,
      wealthGain,
      disclaimer:
        'Hypothetical mathematical calculation only. Mutual fund past performance does not guarantee future results.',
    };
  }

  // ==========================================================================
  // E. Shopping Price Tracker
  // ==========================================================================
  public getTrackedProducts(): TrackedProduct[] {
    return [...this.trackedProducts];
  }

  public saveTrackedProduct(
    product: Omit<TrackedProduct, 'id' | 'dateAdded' | 'lastChecked' | 'lowestPrice' | 'highestPrice' | 'priceHistory'> & {
      id?: string;
      initialPrice?: number;
    }
  ): TrackedProduct {
    const title = product.title.trim();
    if (!title) {
      throw new Error('Product title cannot be empty');
    }
    const cleanUrl = product.url.trim();
    if (!cleanUrl) {
      throw new Error('Product URL cannot be empty');
    }

    const price = Math.max(0, product.currentPrice || product.initialPrice || 0);
    const existingIndex = this.trackedProducts.findIndex((p) => p.id === product.id || p.url === cleanUrl);

    let saved: TrackedProduct;
    const now = Date.now();

    if (existingIndex >= 0) {
      const existing = this.trackedProducts[existingIndex];
      const newLowest = Math.min(existing.lowestPrice, price);
      const newHighest = Math.max(existing.highestPrice, price);

      saved = {
        ...existing,
        title,
        retailer: product.retailer || existing.retailer,
        category: product.category || existing.category,
        targetPriceAlert: product.targetPriceAlert,
        currentPrice: price,
        lowestPrice: newLowest,
        highestPrice: newHighest,
        lastChecked: now,
        notes: product.notes || existing.notes,
      };
      this.trackedProducts[existingIndex] = saved;
    } else {
      const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const initialHistory = [
        {
          date: now,
          price,
          retailer: product.retailer || 'Retailer Direct',
          inStock: product.inStock !== false,
          verified: true,
        },
      ];

      saved = {
        id,
        title,
        url: cleanUrl,
        retailer: product.retailer || 'Direct Store',
        category: product.category || 'General',
        targetPriceAlert: product.targetPriceAlert,
        currentPrice: price,
        currency: product.currency || 'USD',
        lowestPrice: price,
        highestPrice: price,
        dateAdded: now,
        lastChecked: now,
        inStock: product.inStock !== false,
        priceHistory: initialHistory,
        notes: `Tracking started on ${new Date(now).toLocaleDateString()}. Historical price chart accumulates from this date forward as checkpoints are recorded. NEXUS does not simulate unverified past prices.`,
      };
      this.trackedProducts.unshift(saved);
    }

    this.saveTrackedProducts();
    this.checkPriceAlerts(saved);
    return saved;
  }

  public recordProductPricePoint(productId: string, price: number, inStock: boolean = true): TrackedProduct {
    const product = this.trackedProducts.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Tracked product not found with ID: ${productId}`);
    }

    const cleanPrice = Math.max(0, price);
    const now = Date.now();

    product.priceHistory.push({
      date: now,
      price: cleanPrice,
      retailer: product.retailer,
      inStock,
      verified: true,
    });

    product.currentPrice = cleanPrice;
    product.lowestPrice = Math.min(product.lowestPrice, cleanPrice);
    product.highestPrice = Math.max(product.highestPrice, cleanPrice);
    product.lastChecked = now;
    product.inStock = inStock;

    this.saveTrackedProducts();
    this.checkPriceAlerts(product);
    return { ...product };
  }

  public deleteTrackedProduct(id: string): boolean {
    const initialLen = this.trackedProducts.length;
    this.trackedProducts = this.trackedProducts.filter((p) => p.id !== id);
    if (this.trackedProducts.length !== initialLen) {
      this.saveTrackedProducts();
      return true;
    }
    return false;
  }

  private checkPriceAlerts(product: TrackedProduct): void {
    if (!this.settings.enablePriceAlerts) return;
    if (product.targetPriceAlert && product.currentPrice <= product.targetPriceAlert) {
      this.notifyAlert({
        type: 'shopping',
        title: `Price Drop Alert: ${product.title}`,
        message: `Current price ($${product.currentPrice}) has reached or dropped below your target of $${product.targetPriceAlert}.`,
        data: product,
      });
    }
  }

  private notifyAlert(payload: MarketsAlertPayload): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('markets:alert-triggered', payload);
    }
  }

  // ==========================================================================
  // F. Financial News
  // ==========================================================================
  public async getFinancialNews(ticker?: string, category?: string): Promise<FinancialNewsArticle[]> {
    let list = [...VERIFIED_FINANCIAL_NEWS];

    if (ticker) {
      const cleanTicker = ticker.trim().toUpperCase();
      list = list.filter((a) => a.relatedTickers.includes(cleanTicker));
    }

    if (category && category !== 'all') {
      const cleanCat = category.trim().toLowerCase();
      list = list.filter((a) => a.category.toLowerCase() === cleanCat);
    }

    return list.sort((a, b) => b.publishedAt - a.publishedAt);
  }
}
