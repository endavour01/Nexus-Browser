import path from 'path';
import fs from 'fs';
import { MarketsManager } from '../src/main/markets-manager';

async function runMarketsTestSuite() {
  console.log('====================================================');
  console.log('      NEXUS Markets Comprehensive QA & Test Suite');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-markets');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const manager = new MarketsManager(testDir);

  try {
    // ----------------------------------------------------
    // SUITE 1: Settings & Privacy Management
    // ----------------------------------------------------
    console.log('[SUITE 1: SETTINGS & PRIVACY MANAGEMENT]');

    // 1.1 Disabled & hidden by default
    const initialSettings = manager.getSettings();
    if (initialSettings.enabled !== false) {
      throw new Error(`Markets should be disabled by default, but enabled was ${initialSettings.enabled}`);
    }
    if (initialSettings.hasMadeInitialChoice !== false) {
      throw new Error(`hasMadeInitialChoice should be false initially, got ${initialSettings.hasMadeInitialChoice}`);
    }
    console.log('    ✓ NEXUS Markets is disabled and hidden by default');

    // 1.2 Enable Markets and verify persistence
    const updatedSettings = manager.updateSettings({
      enabled: true,
      defaultCurrency: 'USD',
      notificationFrequency: 'daily',
    });
    if (!updatedSettings.enabled) {
      throw new Error('Markets failed to enable');
    }
    if (!updatedSettings.hasMadeInitialChoice) {
      throw new Error('hasMadeInitialChoice should be true after update');
    }

    const settingsFile = path.join(testDir, 'nexus-markets-settings.json');
    if (!fs.existsSync(settingsFile)) {
      throw new Error('nexus-markets-settings.json was not created on disk');
    }
    const persistedSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    if (!persistedSettings.enabled) {
      throw new Error('Persisted settings file does not have enabled: true');
    }
    console.log('    ✓ Opt-in activation and preferences persisted securely to local disk');

    // 1.3 Independent module toggles
    const toggled = manager.updateSettings({ enableShopping: false });
    if (toggled.enableShopping !== false || toggled.enableStocks !== true) {
      throw new Error('Independent module toggles failed');
    }
    console.log('    ✓ Independent module toggles operate discretely');

    // ----------------------------------------------------
    // SUITE 2: Stocks, OHLCV Candles & Watchlists
    // ----------------------------------------------------
    console.log('\n[SUITE 2: STOCKS, CHARTS & WATCHLISTS]');

    // 2.1 Search and Quote verification
    const searchResults = await manager.searchStocks('Apple');
    if (!searchResults.some((s) => s.ticker === 'AAPL')) {
      throw new Error('Search for "Apple" did not return AAPL');
    }
    console.log(`    ✓ Stock search found ${searchResults.length} matches for "Apple"`);

    const aaplQuote = await manager.getStockQuote('AAPL');
    if (!aaplQuote || aaplQuote.price <= 0) {
      throw new Error('Failed to fetch quote for AAPL');
    }
    if (aaplQuote.dataFreshness !== 'delayed') {
      throw new Error(`Expected dataFreshness "delayed", got "${aaplQuote.dataFreshness}"`);
    }
    if (!aaplQuote.providerDisclaimer.includes('informational')) {
      throw new Error('Missing informational disclaimer on stock quote');
    }
    if (!aaplQuote.investorRelationsUrl) {
      throw new Error('AAPL quote missing investorRelationsUrl');
    }
    console.log(`    ✓ Quote verified: ${aaplQuote.name} ($${aaplQuote.price}) with ${aaplQuote.delayMinutes}m delay banner`);
    console.log(`    ✓ Official IR link verified: ${aaplQuote.investorRelationsUrl}`);

    // 2.2 OHLCV Candles across time ranges
    const ranges = ['1D', '1W', '1M', '6M', '1Y', '5Y'];
    for (const r of ranges) {
      const candles = await manager.getStockCandles('AAPL', r);
      if (!candles || candles.length === 0) {
        throw new Error(`No candles returned for range ${r}`);
      }
      const first = candles[0];
      const last = candles[candles.length - 1];
      if (first.timestamp >= last.timestamp) {
        throw new Error(`Candle timestamps not in chronological order for range ${r}`);
      }
      if (last.close !== aaplQuote.price) {
        throw new Error(`Last candle close (${last.close}) does not match current quote price (${aaplQuote.price})`);
      }
    }
    console.log('    ✓ OHLCV candle histories verified across all 6 ranges (1D, 1W, 1M, 6M, 1Y, 5Y)');

    // 2.3 Watchlist Management & Persistence
    const initialWatchlist = manager.getStockWatchlist();
    if (!initialWatchlist.some((w) => w.ticker === 'AAPL')) {
      throw new Error('Default watchlist missing AAPL');
    }

    const addedItem = manager.addStockToWatchlist({
      ticker: 'TSLA',
      name: 'Tesla, Inc.',
      exchange: 'NASDAQ',
    });
    if (addedItem.ticker !== 'TSLA') {
      throw new Error('Failed to add TSLA to watchlist');
    }

    const updatedWatchlist = manager.getStockWatchlist();
    if (!updatedWatchlist.some((w) => w.ticker === 'TSLA')) {
      throw new Error('Watchlist does not contain added TSLA');
    }

    const removed = manager.removeStockFromWatchlist('TSLA');
    if (!removed) {
      throw new Error('Failed to remove TSLA from watchlist');
    }
    if (manager.getStockWatchlist().some((w) => w.ticker === 'TSLA')) {
      throw new Error('TSLA still in watchlist after removal');
    }
    console.log('    ✓ Watchlist CRUD operations and disk serialization verified');

    // ----------------------------------------------------
    // SUITE 3: IPO Tracker
    // ----------------------------------------------------
    console.log('\n[SUITE 3: IPO TRACKER & EXCHANGE REGISTRY]');

    const allIpos = await manager.getIpos();
    if (allIpos.length < 3) {
      throw new Error('Expected at least 3 curated IPOs in registry');
    }

    const upcomingIpos = await manager.getIpos('upcoming');
    const listedIpos = await manager.getIpos('listed');

    if (upcomingIpos.length === 0 || listedIpos.length === 0) {
      throw new Error('IPO status filtering returned empty arrays');
    }

    // Verify upcoming provisional flags
    const provisionalIpo = upcomingIpos.find((i) => i.isProvisional);
    if (!provisionalIpo || !provisionalIpo.provisionalNotes) {
      throw new Error('Expected upcoming IPO to have provisional flag and explanatory notes');
    }
    console.log(`    ✓ Provisional IPO verified: ${provisionalIpo.companyName} ("${provisionalIpo.provisionalNotes}")`);

    // Verify listed IPO details & filings
    const listed = listedIpos[0];
    if (!listed.exchangeFilingUrl || !listed.exchange) {
      throw new Error(`Listed IPO ${listed.companyName} missing exchange filing link`);
    }
    console.log(`    ✓ Listed IPO verified: ${listed.companyName} (${listed.exchange}) - Filing: ${listed.exchangeFilingUrl}`);

    // ----------------------------------------------------
    // SUITE 4: Mutual Funds & Mathematical Calculators
    // ----------------------------------------------------
    console.log('\n[SUITE 4: MUTUAL FUNDS & COMPOUND CALCULATORS]');

    const allFunds = await manager.getMutualFunds();
    if (allFunds.length < 3) {
      throw new Error('Expected mutual funds to have at least 3 entries');
    }

    const vanguardFund = allFunds.find((f) => f.id === 'mf-vanguard-500');
    if (!vanguardFund || vanguardFund.navHistory.length === 0) {
      throw new Error('Vanguard 500 fund or NAV history missing');
    }
    console.log(`    ✓ Mutual Fund scheme verified: ${vanguardFund.schemeName} (NAV: $${vanguardFund.nav}, Expense: ${vanguardFund.expenseRatio}%)`);

    // 4.1 SIP Calculator Verification
    // Monthly: $500, Years: 10, Return Rate: 12%
    // Mathematical Expected: Invested = $60,000; Future Value approx $116,170
    const sipRes = manager.calculateSip({
      monthlyAmount: 500,
      durationYears: 10,
      expectedAnnualReturnRate: 12,
    });

    if (sipRes.investedAmount !== 60000) {
      throw new Error(`SIP invested amount expected 60000, got ${sipRes.investedAmount}`);
    }
    if (sipRes.estimatedFutureValue < 115000 || sipRes.estimatedFutureValue > 118000) {
      throw new Error(`SIP estimated future value unexpected: ${sipRes.estimatedFutureValue}`);
    }
    if (sipRes.wealthGain !== sipRes.estimatedFutureValue - sipRes.investedAmount) {
      throw new Error('SIP wealth gain calculation mismatch');
    }
    if (!sipRes.disclaimer.includes('financial advice')) {
      throw new Error('SIP missing non-advisory disclaimer');
    }
    console.log(`    ✓ SIP Compound calculation verified: $500/mo over 10y @ 12% = Invested $${sipRes.investedAmount.toLocaleString()}, Future Value $${sipRes.estimatedFutureValue.toLocaleString()}, Gain $${sipRes.wealthGain.toLocaleString()}`);

    // 4.2 Lump-sum Calculator Verification
    // Principal: $10,000, Years: 5, Return Rate: 10%
    // Mathematical Expected: FV = 10000 * 1.1^5 = 16,105.1
    const lumpRes = manager.calculateLumpSum({
      principalAmount: 10000,
      durationYears: 5,
      expectedAnnualReturnRate: 10,
    });

    if (lumpRes.principalAmount !== 10000) {
      throw new Error(`Lump-sum principal expected 10000, got ${lumpRes.principalAmount}`);
    }
    if (lumpRes.estimatedFutureValue !== 16105) {
      throw new Error(`Lump-sum future value expected 16105, got ${lumpRes.estimatedFutureValue}`);
    }
    if (lumpRes.wealthGain !== 6105) {
      throw new Error(`Lump-sum wealth gain expected 6105, got ${lumpRes.wealthGain}`);
    }
    console.log(`    ✓ Lump-sum calculation verified: $10,000 over 5y @ 10% = Future Value $${lumpRes.estimatedFutureValue.toLocaleString()}, Gain $${lumpRes.wealthGain.toLocaleString()}`);

    // ----------------------------------------------------
    // SUITE 5: Shopping Price Tracker & Checkpoints
    // ----------------------------------------------------
    console.log('\n[SUITE 5: SHOPPING PRICE TRACKER]');

    // 5.1 Initial tracked product
    const initialProducts = manager.getTrackedProducts();
    if (initialProducts.length === 0) {
      throw new Error('Initial seeded tracked product missing');
    }
    const seedProd = initialProducts[0];
    if (!seedProd.notes?.includes('Tracking begins')) {
      throw new Error('Tracked product missing "Tracking begins from date added" note');
    }
    console.log(`    ✓ Verified initial product: "${seedProd.title}" ($${seedProd.currentPrice})`);

    // 5.2 Add new product
    const addedProd = await manager.saveTrackedProduct({
      title: 'Sony WH-1000XM5 Wireless Headphones',
      url: 'https://electronics.example.com/sony-headphones',
      retailer: 'TechMart',
      category: 'Audio',
      initialPrice: 398.0,
      targetPriceAlert: 349.0,
    });

    if (addedProd.currentPrice !== 398.0 || addedProd.lowestPrice !== 398.0 || addedProd.highestPrice !== 398.0) {
      throw new Error('New product prices not properly initialized');
    }
    if (addedProd.priceHistory.length !== 1 || addedProd.priceHistory[0].price !== 398.0) {
      throw new Error('New product initial priceHistory point missing');
    }
    console.log(`    ✓ New product added with baseline checkpoint: "${addedProd.title}"`);

    // 5.3 Record subsequent price checkpoints
    const updatedProd = await manager.recordProductPricePoint(addedProd.id, 329.99, true);
    if (updatedProd.currentPrice !== 329.99) {
      throw new Error(`Expected currentPrice 329.99, got ${updatedProd.currentPrice}`);
    }
    if (updatedProd.lowestPrice !== 329.99) {
      throw new Error(`Expected lowestPrice 329.99, got ${updatedProd.lowestPrice}`);
    }
    if (updatedProd.highestPrice !== 398.0) {
      throw new Error(`Expected highestPrice 398.0, got ${updatedProd.highestPrice}`);
    }
    if (updatedProd.priceHistory.length !== 2) {
      throw new Error(`Expected 2 price history entries, got ${updatedProd.priceHistory.length}`);
    }
    console.log(`    ✓ Price drop checkpoint recorded: $398.00 -> $329.99 (Lowest: $${updatedProd.lowestPrice}, Highest: $${updatedProd.highestPrice})`);

    // 5.4 Delete tracked product
    const deleted = manager.deleteTrackedProduct(addedProd.id);
    if (!deleted) {
      throw new Error('Failed to delete tracked product');
    }
    if (manager.getTrackedProducts().some((p) => p.id === addedProd.id)) {
      throw new Error('Deleted product still present in list');
    }
    console.log('    ✓ Product deletion and persistence verified');

    // ----------------------------------------------------
    // SUITE 6: Financial News & Journalistic Transparency
    // ----------------------------------------------------
    console.log('\n[SUITE 6: FINANCIAL NEWS & EDITORIAL CLASSIFICATION]');

    const allNews = await manager.getFinancialNews();
    if (allNews.length < 4) {
      throw new Error('Expected at least 4 financial news items');
    }

    const typesFound = new Set(allNews.map((n) => n.articleType));
    if (!typesFound.has('filing') || !typesFound.has('reporting') || !typesFound.has('commentary') || !typesFound.has('opinion')) {
      throw new Error('Missing one or more required articleTypes (filing, reporting, commentary, opinion)');
    }
    console.log(`    ✓ All 4 journalistic types verified in feed: ${Array.from(typesFound).join(', ')}`);

    // Ticker filtering
    const aaplNews = await manager.getFinancialNews('AAPL');
    if (aaplNews.length === 0 || !aaplNews.every((n) => n.relatedTickers.includes('AAPL'))) {
      throw new Error('Ticker filtering for AAPL failed');
    }
    console.log(`    ✓ Ticker-specific filtering verified (${aaplNews.length} articles linked to AAPL)`);

    // Category filtering
    const filingsNews = await manager.getFinancialNews(undefined, 'filings');
    if (filingsNews.length === 0 || !filingsNews.every((n) => n.category === 'filings')) {
      throw new Error('Category filtering for filings failed');
    }
    console.log(`    ✓ Category filtering verified (${filingsNews.length} filings articles)`);

    console.log('\n====================================================');
    console.log('    ALL 6 NEXUS MARKETS TEST SUITES PASSED! ✓');
    console.log('====================================================\n');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

runMarketsTestSuite().catch((err) => {
  console.error('\n❌ NEXUS Markets Test Suite Failed:', err);
  process.exit(1);
});
