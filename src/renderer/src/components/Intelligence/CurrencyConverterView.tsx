import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Coins,
  ArrowRightLeft,
  RefreshCw,
  Clock,
  AlertTriangle,
  History,
  Trash2,
  TrendingUp,
  Info,
  Check,
} from 'lucide-react';
import {
  CurrencyConversionResult,
  CurrencyHistoryItem,
  CurrencyRateData,
} from '@shared/types';
import { NexusState } from '../NexusState';

const SUPPORTED_CURRENCIES: { code: string; name: string; symbol: string; flag: string }[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
];

interface CurrencyConverterViewProps {
  compact?: boolean;
}

export const CurrencyConverterView: React.FC<CurrencyConverterViewProps> = ({ compact = false }) => {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');

  const [conversion, setConversion] = useState<CurrencyConversionResult | null>(null);
  const [history, setHistory] = useState<CurrencyHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const api = typeof window !== 'undefined' ? window.nexusAPI : null;

  // Load conversion history
  const loadHistory = useCallback(async () => {
    if (!api) return;
    try {
      const items = await api.getCurrencyHistory();
      setHistory(items || []);
    } catch (err) {
      console.error('[CurrencyConverter] Failed to load history:', err);
    }
  }, [api]);

  // Execute currency conversion
  const handleConvert = useCallback(
    async (fromCode: string, toCode: string, amountVal: string) => {
      const parsedAmount = parseFloat(amountVal);
      if (isNaN(parsedAmount) || parsedAmount < 0 || !api) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await api.convertCurrency({
          from: fromCode,
          to: toCode,
          amount: parsedAmount,
        });
        setConversion(res);
        loadHistory();
      } catch (err: any) {
        console.error('[CurrencyConverter] Conversion failed:', err);
        setErrorMessage(err?.message || 'Currency conversion rates unavailable. Check network status.');
      } finally {
        setIsLoading(false);
      }
    },
    [api, loadHistory]
  );

  // Initial load
  useEffect(() => {
    handleConvert(fromCurrency, toCurrency, amount);
  }, []);

  // Quick swap
  const handleSwap = () => {
    const nextFrom = toCurrency;
    const nextTo = fromCurrency;
    setFromCurrency(nextFrom);
    setToCurrency(nextTo);
    handleConvert(nextFrom, nextTo, amount);
  };

  // Re-apply a historical conversion
  const handleApplyHistory = (item: CurrencyHistoryItem) => {
    setFromCurrency(item.from);
    setToCurrency(item.to);
    setAmount(item.amount.toString());
    handleConvert(item.from, item.to, item.amount.toString());
  };

  // Clear history
  const handleClearHistory = async () => {
    if (!api) return;
    await api.clearCurrencyHistory();
    setHistory([]);
  };

  // Format relative timestamp
  const formatTimeAgo = (timestamp: number): string => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const fromInfo = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === fromCurrency) || SUPPORTED_CURRENCIES[0],
    [fromCurrency]
  );
  const toInfo = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === toCurrency) || SUPPORTED_CURRENCIES[1],
    [toCurrency]
  );

  return (
    <div className={`nexus-currency-converter ${compact ? 'compact-mode' : ''}`}>
      {/* Header */}
      <div className="currency-header">
        <div className="flex items-center gap-2">
          <div className="currency-icon-badge">
            <Coins size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="currency-title">NEXUS Currency Converter</h2>
            <p className="currency-subtitle">Live exchange rates backed by European Central Bank references</p>
          </div>
        </div>

        <button
          className="nexus-icon-btn currency-refresh-btn"
          onClick={() => handleConvert(fromCurrency, toCurrency, amount)}
          disabled={isLoading}
          title="Refresh rates"
        >
          <RefreshCw size={14} className={isLoading ? 'nexus-state-spin' : ''} />
        </button>
      </div>

      {/* Main Conversion Workspace */}
      <div className="currency-card">
        {/* Input amount */}
        <div className="currency-input-row">
          <label className="currency-field-label">Amount</label>
          <div className="currency-amount-wrapper">
            <span className="currency-amount-symbol">{fromInfo.symbol}</span>
            <input
              type="number"
              min="0"
              step="any"
              className="currency-amount-input"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                handleConvert(fromCurrency, toCurrency, e.target.value);
              }}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Currency Selectors & Swap Button */}
        <div className="currency-selectors-grid">
          {/* Source Currency */}
          <div className="currency-select-box">
            <label className="currency-field-label">From</label>
            <div className="currency-select-wrapper">
              <span className="currency-flag">{fromInfo.flag}</span>
              <select
                className="currency-dropdown"
                value={fromCurrency}
                onChange={(e) => {
                  setFromCurrency(e.target.value);
                  handleConvert(e.target.value, toCurrency, amount);
                }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            className="currency-swap-btn"
            onClick={handleSwap}
            title="Swap source and target currencies"
          >
            <ArrowRightLeft size={16} />
          </button>

          {/* Target Currency */}
          <div className="currency-select-box">
            <label className="currency-field-label">To</label>
            <div className="currency-select-wrapper">
              <span className="currency-flag">{toInfo.flag}</span>
              <select
                className="currency-dropdown"
                value={toCurrency}
                onChange={(e) => {
                  setToCurrency(e.target.value);
                  handleConvert(fromCurrency, e.target.value, amount);
                }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Banner */}
        {isLoading && (
          <NexusState
            variant="loading"
            title="Fetching verified exchange rates..."
            className="my-4"
          />
        )}

        {errorMessage && !isLoading && (
          <NexusState
            variant="error"
            title="Exchange Rate Error"
            description={errorMessage}
            action={
              <button
                className="nexus-btn-secondary nexus-btn-sm mt-2"
                onClick={() => handleConvert(fromCurrency, toCurrency, amount)}
              >
                Retry Rate Query
              </button>
            }
            className="my-4"
          />
        )}

        {conversion && !isLoading && !errorMessage && (
          <div className="currency-result-display">
            <div className="currency-from-label">
              {conversion.amount.toLocaleString()} {conversion.from} =
            </div>
            <div className="currency-result-value">
              {conversion.result.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{' '}
              <span className="currency-target-code">{conversion.to}</span>
            </div>

            <div className="currency-rate-subtext">
              1 {conversion.from} = {conversion.rate.toLocaleString(undefined, { maximumFractionDigits: 5 })}{' '}
              {conversion.to}
            </div>

            {/* Provider, Timestamp & Stale Badge */}
            <div className="currency-meta-row">
              <div className="flex items-center gap-1.5 text-secondary">
                <Clock size={12} />
                <span>Updated {formatTimeAgo(conversion.timestamp)}</span>
                <span className="meta-bullet">•</span>
                <span>{conversion.provider}</span>
              </div>

              {conversion.isStale && (
                <div className="currency-stale-badge" title="Displayed rate may be older than 24 hours or from offline baseline cache">
                  <AlertTriangle size={12} className="text-amber" />
                  <span>Stale Rate (Offline Cache)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informational Disclaimer */}
        <div className="currency-disclaimer">
          <Info size={13} className="text-secondary shrink-0" />
          <span>
            Exchange rates are provided for informational purposes only. Do not use for commercial trading or
            settlement transactions. Rates are derived from authentic European Central Bank feeds and cached
            locally.
          </span>
        </div>
      </div>

      {/* Quick Session Conversion History */}
      <div className="currency-history-section">
        <div className="currency-history-header">
          <div className="flex items-center gap-2">
            <History size={14} className="text-secondary" />
            <h3 className="currency-history-title">Session Conversion History</h3>
          </div>
          {history.length > 0 && (
            <button
              className="nexus-icon-btn currency-clear-history-btn"
              onClick={handleClearHistory}
              title="Clear conversion history"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="currency-empty-history">No conversions in current session</div>
        ) : (
          <div className="currency-history-list">
            {history.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="currency-history-row"
                onClick={() => handleApplyHistory(item)}
                title="Click to apply"
              >
                <div className="currency-history-pair">
                  <span className="currency-history-amount">
                    {item.amount.toLocaleString()} {item.from}
                  </span>
                  <span className="currency-history-arrow">→</span>
                  <span className="currency-history-result">
                    {item.result.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.to}
                  </span>
                </div>
                <div className="currency-history-time">{formatTimeAgo(item.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
