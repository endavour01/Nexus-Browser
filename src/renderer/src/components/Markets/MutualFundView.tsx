import React, { useState, useMemo } from 'react';
import { MutualFundItem } from '@shared/types';
import { Search, Calculator, Check, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';

interface MutualFundViewProps {
  funds: MutualFundItem[];
  onCalculateSip?: (params: { monthlyAmount: number; durationYears: number; expectedAnnualReturnRate: number }) => any;
  onCalculateLumpSum?: (params: { principalAmount: number; durationYears: number; expectedAnnualReturnRate: number }) => any;
}

export const MutualFundView: React.FC<MutualFundViewProps> = ({ funds }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFundId, setSelectedFundId] = useState<string | null>(funds[0]?.id || null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);

  // Calculator State
  const [calcMode, setCalcMode] = useState<'sip' | 'lumpsum'>('sip');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500);
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(10000);
  const [durationYears, setDurationYears] = useState<number>(10);
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(12);

  const categories = [
    { label: 'All Funds', value: 'all' },
    { label: 'Index Funds', value: 'index' },
    { label: 'Large Cap', value: 'large' },
    { label: 'Flexi Cap', value: 'flexi' },
    { label: 'Small Cap', value: 'small' },
    { label: 'Fixed Income / Debt', value: 'debt' },
  ];

  const filteredFunds = useMemo(() => {
    return funds.filter((f) => {
      const matchesCat =
        selectedCategory === 'all' ||
        f.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesQuery =
        searchQuery === '' ||
        f.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.fundHouse.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [funds, selectedCategory, searchQuery]);

  const activeFund = useMemo(() => {
    return funds.find((f) => f.id === selectedFundId) || funds[0] || null;
  }, [funds, selectedFundId]);

  // Calculator Math
  const calculationResults = useMemo(() => {
    if (calcMode === 'sip') {
      const P = Math.max(1, monthlyAmount);
      const n = Math.max(1, durationYears) * 12;
      const i = Math.max(0.1, expectedReturnRate) / 12 / 100;
      const futureValue = Math.round(P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)));
      const invested = Math.round(P * n);
      return {
        invested,
        futureValue,
        wealthGain: Math.max(0, futureValue - invested),
      };
    } else {
      const P = Math.max(1, lumpSumAmount);
      const r = Math.max(0.1, expectedReturnRate);
      const futureValue = Math.round(P * Math.pow(1 + r / 100, Math.max(1, durationYears)));
      return {
        invested: P,
        futureValue,
        wealthGain: Math.max(0, futureValue - P),
      };
    }
  }, [calcMode, monthlyAmount, lumpSumAmount, durationYears, expectedReturnRate]);

  const toggleCompare = (id: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const comparedFunds = useMemo(() => {
    return funds.filter((f) => comparisonIds.includes(f.id));
  }, [funds, comparisonIds]);

  return (
    <div className="markets-section-container">
      {/* Informational Disclaimer Box */}
      <div className="markets-disclaimer-box mb-4">
        <AlertCircle size={15} className="text-secondary flex-shrink-0" />
        <span className="text-xs text-secondary leading-relaxed">
          <strong>Non-Advisory Mutual Fund Repository:</strong> NAV values, expense ratios, and historical series are verified historical records. Historical performance does not guarantee future results. NEXUS Markets does not recommend funds or guarantee investment returns.
        </span>
      </div>

      {/* Header Bar: Search, Category Filters, and Calculator Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
          <button
            className={`nexus-btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 ${
              showCalculator ? 'text-accent border-accent' : ''
            }`}
            onClick={() => setShowCalculator((prev) => !prev)}
          >
            <Calculator size={13} />
            <span>SIP & Lump-Sum Calculator</span>
          </button>

          <div className="markets-search-box">
            <Search size={14} className="text-secondary" />
            <input
              type="text"
              placeholder="Search scheme name or fund house..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="markets-input"
            />
          </div>
        </div>
      </div>

      {/* Interactive SIP & Lump-Sum Calculator Panel */}
      {showCalculator && (
        <div className="markets-calculator-panel mb-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-subtle pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-accent" />
              <h3 className="text-sm font-bold text-primary">
                Mathematical Investment Projection Calculator
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                className={`filter-pill ${calcMode === 'sip' ? 'active' : ''}`}
                onClick={() => setCalcMode('sip')}
              >
                SIP (Monthly)
              </button>
              <button
                className={`filter-pill ${calcMode === 'lumpsum' ? 'active' : ''}`}
                onClick={() => setCalcMode('lumpsum')}
              >
                Lump-Sum (One-Time)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="space-y-4">
              {calcMode === 'sip' ? (
                <div>
                  <label className="text-xs text-secondary block mb-1">
                    Monthly Investment Amount ($)
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={50}
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                    className="markets-input w-full"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-secondary block mb-1">
                    One-Time Lump-Sum Investment ($)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={500}
                    value={lumpSumAmount}
                    onChange={(e) => setLumpSumAmount(Number(e.target.value))}
                    className="markets-input w-full"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-secondary block mb-1">
                  Duration (Years): <span className="text-primary font-semibold">{durationYears} years</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={35}
                  value={durationYears}
                  onChange={(e) => setDurationYears(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-secondary block mb-1">
                  Hypothetical Expected Annual Return: <span className="text-accent font-semibold">{expectedReturnRate}%</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={0.5}
                  value={expectedReturnRate}
                  onChange={(e) => setExpectedReturnRate(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Results Display */}
            <div className="md:col-span-2 bg-surface/50 border border-subtle rounded-lg p-4 flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-app/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary mb-1">Invested Capital</div>
                  <div className="text-lg font-bold font-mono text-primary">
                    ${calculationResults.invested.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-app/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary mb-1">Wealth Gain</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    +${calculationResults.wealthGain.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-app/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary mb-1">Projected Total Value</div>
                  <div className="text-lg font-bold font-mono text-accent">
                    ${calculationResults.futureValue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Allocation bar */}
              <div className="mb-3">
                <div className="flex justify-between text-2xs text-secondary mb-1">
                  <span>Invested: {Math.round((calculationResults.invested / calculationResults.futureValue) * 100)}%</span>
                  <span>Gain: {Math.round((calculationResults.wealthGain / calculationResults.futureValue) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-zinc-500 h-full"
                    style={{
                      width: `${(calculationResults.invested / calculationResults.futureValue) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${(calculationResults.wealthGain / calculationResults.futureValue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-2xs text-secondary/80 leading-relaxed italic">
                * Note: Compound interest calculation assumes consistent monthly contribution with annualized compounding rate. Does not adjust for inflation, taxation, or market fluctuations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Fund Scheme List and Detail / Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Fund List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
            Available Schemes ({filteredFunds.length})
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredFunds.map((fund) => {
              const isSelected = fund.id === selectedFundId;
              const isCompared = comparisonIds.includes(fund.id);

              return (
                <div
                  key={fund.id}
                  onClick={() => setSelectedFundId(fund.id)}
                  className={`markets-fund-card ${isSelected ? 'active' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-medium text-xs text-primary leading-tight">
                      {fund.schemeName}
                    </div>
                    <button
                      className={`compare-checkbox-btn ${isCompared ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(fund.id);
                      }}
                      title="Compare this fund"
                    >
                      {isCompared && <Check size={11} />}
                    </button>
                  </div>

                  <div className="text-2xs text-secondary mb-2">{fund.fundHouse} • {fund.category}</div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-subtle">
                    <div>
                      <span className="text-2xs text-secondary">NAV: </span>
                      <span className="font-mono text-xs font-semibold text-primary">
                        ${fund.nav.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-2xs text-secondary">Exp: {fund.expenseRatio}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed View & Comparison */}
        <div className="lg:col-span-2">
          {comparisonIds.length > 1 ? (
            /* Multi-Fund Comparison View */
            <div className="markets-card p-5">
              <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-accent" />
                  <h3 className="text-sm font-bold text-primary">
                    Comparing {comparedFunds.length} Funds Side-by-Side
                  </h3>
                </div>
                <button
                  className="text-xs text-secondary hover:text-primary"
                  onClick={() => setComparisonIds([])}
                >
                  Clear Comparison
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparedFunds.map((fund) => (
                  <div key={fund.id} className="p-3 bg-surface rounded border border-subtle space-y-2">
                    <div className="font-semibold text-xs text-primary">{fund.schemeName}</div>
                    <div className="text-2xs text-secondary">{fund.category}</div>
                    <div className="text-sm font-mono font-bold text-accent">${fund.nav.toFixed(2)}</div>
                    <div className="text-2xs text-secondary space-y-1 pt-2 border-t border-subtle">
                      <div>Expense Ratio: <span className="font-mono">{fund.expenseRatio}%</span></div>
                      <div>AUM: <span>{fund.aum || '—'}</span></div>
                      <div>Benchmark: <span>{fund.benchmark || '—'}</span></div>
                      <div>Risk Level: <span>{fund.riskLevel || '—'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeFund ? (
            /* Single Fund Deep Dive */
            <div className="markets-card p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-subtle pb-3">
                <div>
                  <h2 className="text-base font-bold text-primary">{activeFund.schemeName}</h2>
                  <div className="text-xs text-secondary mt-0.5">
                    {activeFund.fundHouse} • {activeFund.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-bold text-accent">
                    ${activeFund.nav.toFixed(2)}
                  </div>
                  <div className="text-2xs text-secondary">NAV Date: {activeFund.navDate}</div>
                </div>
              </div>

              {/* Fund Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">Expense Ratio</div>
                  <div className="text-sm font-mono font-semibold text-primary">
                    {activeFund.expenseRatio}%
                  </div>
                </div>
                <div className="p-2.5 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">AUM</div>
                  <div className="text-sm font-semibold text-primary">{activeFund.aum || '—'}</div>
                </div>
                <div className="p-2.5 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">Benchmark</div>
                  <div className="text-xs font-medium text-primary truncate" title={activeFund.benchmark}>
                    {activeFund.benchmark || '—'}
                  </div>
                </div>
                <div className="p-2.5 bg-surface/60 rounded border border-subtle">
                  <div className="text-2xs text-secondary">Risk Profile</div>
                  <div className="text-xs font-semibold text-amber-400">
                    {activeFund.riskLevel || 'Moderate'}
                  </div>
                </div>
              </div>

              {/* Historical NAV Series Table */}
              <div>
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Verified Historical NAV Records ({activeFund.navHistory.length} checkpoints)
                </div>
                <div className="markets-table-wrapper max-h-[220px] overflow-y-auto">
                  <table className="markets-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>NAV ($)</th>
                        <th>Provider & Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeFund.navHistory.map((point, idx) => (
                        <tr key={idx} className="markets-table-row">
                          <td className="text-xs font-mono">{point.date}</td>
                          <td className="text-xs font-mono font-semibold text-primary">
                            ${point.nav.toFixed(2)}
                          </td>
                          <td className="text-2xs text-secondary">{activeFund.provider}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
