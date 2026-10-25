import React, { useState, useMemo } from 'react';
import {
  MutualFundItem,
  SipCalculationParams,
  SipCalculationResult,
  LumpSumCalculationParams,
  LumpSumCalculationResult,
} from '@shared/types';
import { PieChart, Calculator, Layers, AlertCircle, ArrowUpRight, ArrowDownRight, ShieldAlert } from 'lucide-react';

interface MutualFundViewProps {
  funds: MutualFundItem[];
}

export const MutualFundView: React.FC<MutualFundViewProps> = ({ funds }) => {
  const api = window.nexusAPI;

  const [activeTab, setActiveTab] = useState<'schemes' | 'calculator'>('schemes');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFundId, setSelectedFundId] = useState<string>(funds[0]?.id || '');
  const [compareFundIds, setCompareFundIds] = useState<string[]>([]);

  // Calculator State
  const [calcMode, setCalcMode] = useState<'sip' | 'lumpsum'>('sip');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500);
  const [sipYears, setSipYears] = useState<number>(10);
  const [sipRate, setSipRate] = useState<number>(12);
  const [sipResult, setSipResult] = useState<SipCalculationResult | null>(null);

  const [lumpSumAmount, setLumpSumAmount] = useState<number>(10000);
  const [lumpSumYears, setLumpSumYears] = useState<number>(5);
  const [lumpSumRate, setLumpSumRate] = useState<number>(10);
  const [lumpSumResult, setLumpSumResult] = useState<LumpSumCalculationResult | null>(null);

  // Compute SIP calculation
  React.useEffect(() => {
    if (api?.calculateSip) {
      api.calculateSip({
        monthlyAmount,
        durationYears: sipYears,
        expectedAnnualReturnRate: sipRate,
      }).then(setSipResult).catch(console.error);
    } else {
      // Local fallback calculation
      const n = Math.round(sipYears * 12);
      const i = sipRate / (12 * 100);
      const fv = i === 0 ? monthlyAmount * n : monthlyAmount * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
      const invested = monthlyAmount * n;
      setSipResult({
        investedAmount: Math.round(invested),
        estimatedFutureValue: Math.round(fv),
        wealthGain: Math.round(Math.max(0, fv - invested)),
        monthlyInvestment: monthlyAmount,
        durationYears: sipYears,
        expectedRate: sipRate,
        disclaimer: 'Informational simulation based purely on compound mathematics. Does not constitute financial advice.',
      });
    }
  }, [api, monthlyAmount, sipYears, sipRate]);

  // Compute Lump-sum calculation
  React.useEffect(() => {
    if (api?.calculateLumpSum) {
      api.calculateLumpSum({
        principalAmount: lumpSumAmount,
        durationYears: lumpSumYears,
        expectedAnnualReturnRate: lumpSumRate,
      }).then(setLumpSumResult).catch(console.error);
    } else {
      const fv = lumpSumAmount * Math.pow(1 + lumpSumRate / 100, lumpSumYears);
      setLumpSumResult({
        principalAmount: Math.round(lumpSumAmount),
        estimatedFutureValue: Math.round(fv),
        wealthGain: Math.round(Math.max(0, fv - lumpSumAmount)),
        durationYears: lumpSumYears,
        expectedRate: lumpSumRate,
        disclaimer: 'Informational simulation based purely on compound mathematics. Does not constitute financial advice.',
      });
    }
  }, [api, lumpSumAmount, lumpSumYears, lumpSumRate]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    funds.forEach((f) => set.add(f.category));
    return ['all', ...Array.from(set)];
  }, [funds]);

  const filteredFunds = useMemo(() => {
    if (selectedCategory === 'all') return funds;
    return funds.filter((f) => f.category === selectedCategory);
  }, [funds, selectedCategory]);

  const activeFund = funds.find((f) => f.id === selectedFundId) || funds[0];

  const toggleCompare = (id: string) => {
    if (compareFundIds.includes(id)) {
      setCompareFundIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (compareFundIds.length >= 3) return; // Limit to 3 for comparison
      setCompareFundIds((prev) => [...prev, id]);
    }
  };

  return (
    <div className="markets-stack">
      {/* Top Banner Disclaimer */}
      <div className="markets-notice-banner notice-blue">
        <ShieldAlert size={16} className="shrink-0 mt-0.5 text-blue-400" />
        <div>
          <strong>Mutual Fund Analytics & Calculator Notice:</strong> NAV values, expense ratios, and historical trajectories are derived from public disclosures and AMFI/benchmark registries. Past performance does not guarantee future results. Projections are mathematical illustrations only.
        </div>
      </div>

      {/* Sub Tabs: Schemes vs Calculators */}
      <div className="markets-subtabs-bar">
        <div className="markets-subtab-group">
          <button
            className={`markets-subtab-btn ${activeTab === 'schemes' ? 'active' : ''}`}
            onClick={() => setActiveTab('schemes')}
          >
            <PieChart size={14} />
            <span>Mutual Fund Schemes</span>
          </button>
          <button
            className={`markets-subtab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={14} />
            <span>Investment Calculators (SIP & Lump-Sum)</span>
          </button>
        </div>

        {activeTab === 'schemes' && compareFundIds.length > 0 && (
          <div className="text-2xs text-secondary flex items-center gap-2">
            <span>Comparing {compareFundIds.length} funds</span>
            <button
              onClick={() => setCompareFundIds([])}
              className="text-xs text-red-400 hover:underline"
            >
              Clear Comparison
            </button>
          </div>
        )}
      </div>

      {/* View 1: Schemes Browser & Detail */}
      {activeTab === 'schemes' && (
        <div className="markets-grid-detail">
          {/* Left Column: Scheme List & Categories */}
          <div className="markets-stack-sm">
            {/* Category Filter */}
            <div className="markets-pill-group">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`markets-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scheme Cards List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredFunds.map((fund) => {
                const isSelected = fund.id === activeFund?.id;
                const isComparing = compareFundIds.includes(fund.id);
                const isPositive = (fund.change ?? 0) >= 0;

                return (
                  <div
                    key={fund.id}
                    onClick={() => setSelectedFundId(fund.id)}
                    className={`markets-fund-card ${isSelected ? 'active' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-semibold text-xs text-primary leading-tight">
                        {fund.schemeName}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(fund.id);
                        }}
                        className={`text-3xs px-1.5 py-0.5 rounded border transition-colors ${
                          isComparing
                            ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] font-semibold'
                            : 'text-secondary border-subtle hover:text-primary'
                        }`}
                        title="Compare with another fund"
                      >
                        {isComparing ? 'Comparing' : 'Compare'}
                      </button>
                    </div>

                    <div className="text-2xs text-secondary mb-2">{fund.fundHouse} • {fund.category}</div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-secondary text-2xs">NAV: </span>
                        <span className="font-bold text-primary">${fund.nav.toFixed(2)}</span>
                      </div>
                      <div className={`flex items-center text-2xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span>{isPositive ? '+' : ''}{fund.changePercent?.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Fund Details or Comparison Table */}
          <div className="markets-stack" style={{ minWidth: 0 }}>
            {compareFundIds.length > 0 ? (
              /* Comparison Mode */
              <div className="markets-card markets-stack">
                <div className="flex items-center justify-between border-b border-subtle pb-3">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                    <Layers size={16} /> Fund Comparison Matrix
                  </h3>
                  <button
                    onClick={() => setCompareFundIds([])}
                    className="text-xs text-secondary hover:text-primary"
                  >
                    Close Comparison
                  </button>
                </div>

                <div className="markets-table-wrapper">
                  <table className="markets-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        {compareFundIds.map((id) => {
                          const f = funds.find((item) => item.id === id);
                          return (
                            <th key={id} className="text-primary font-semibold max-w-[160px] truncate">
                              {f?.schemeName}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      <tr className="markets-table-row">
                        <td className="text-secondary font-sans text-2xs font-semibold">Category</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="font-sans">{funds.find((f) => f.id === id)?.category}</td>
                        ))}
                      </tr>
                      <tr className="markets-table-row">
                        <td className="text-secondary font-sans text-2xs font-semibold">Current NAV</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="font-bold text-primary">${funds.find((f) => f.id === id)?.nav.toFixed(2)}</td>
                        ))}
                      </tr>
                      <tr className="markets-table-row">
                        <td className="text-secondary font-sans text-2xs font-semibold">Expense Ratio</td>
                        {compareFundIds.map((id) => (
                          <td key={id}>{funds.find((f) => f.id === id)?.expenseRatio}%</td>
                        ))}
                      </tr>
                      <tr className="markets-table-row">
                        <td className="text-secondary font-sans text-2xs font-semibold">AUM</td>
                        {compareFundIds.map((id) => (
                          <td key={id}>{funds.find((f) => f.id === id)?.aum}</td>
                        ))}
                      </tr>
                      <tr className="markets-table-row">
                        <td className="text-secondary font-sans text-2xs font-semibold">Benchmark</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="font-sans text-2xs">{funds.find((f) => f.id === id)?.benchmark}</td>
                        ))}
                      </tr>
                      <tr className="markets-table-row">
                        <td className="text-secondary font-sans text-2xs font-semibold">Risk Level</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="font-sans text-2xs font-semibold">{funds.find((f) => f.id === id)?.riskLevel}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeFund ? (
              /* Single Fund Deep Dive */
              <div className="markets-card markets-stack">
                <div className="border-b border-subtle pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xs text-secondary uppercase bg-surface px-1.5 py-0.5 rounded border border-subtle">
                      {activeFund.category}
                    </span>
                    <span className="text-2xs text-secondary font-medium">Risk: {activeFund.riskLevel}</span>
                  </div>
                  <h2 className="text-base font-bold text-primary">{activeFund.schemeName}</h2>
                  <div className="text-xs text-secondary mt-0.5">{activeFund.fundHouse} • Managed by {activeFund.manager}</div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-mono font-bold text-primary">${activeFund.nav.toFixed(2)}</span>
                  <span className={`text-xs font-mono font-semibold ${(activeFund.change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(activeFund.change ?? 0) >= 0 ? '+' : ''}{activeFund.change?.toFixed(2)} ({(activeFund.changePercent ?? 0) >= 0 ? '+' : ''}{activeFund.changePercent?.toFixed(2)}%)
                  </span>
                  <span className="text-2xs text-secondary">as of {activeFund.navDate}</span>
                </div>

                {/* Key Fund Fundamentals */}
                <div className="markets-metrics-grid">
                  <div className="markets-metric-card">
                    <div className="markets-metric-label">Expense Ratio</div>
                    <div className="markets-metric-value">{activeFund.expenseRatio}%</div>
                  </div>
                  <div className="markets-metric-card">
                    <div className="markets-metric-label">AUM</div>
                    <div className="markets-metric-value">{activeFund.aum}</div>
                  </div>
                  <div className="markets-metric-card" style={{ gridColumn: 'span 2' }}>
                    <div className="markets-metric-label">Benchmark</div>
                    <div className="markets-metric-value truncate">{activeFund.benchmark}</div>
                  </div>
                </div>

                {/* NAV History Table */}
                <div className="markets-stack-sm pt-2">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wider">Historical NAV Milestones</div>
                  <div className="markets-table-wrapper">
                    <table className="markets-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>NAV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeFund.navHistory.map((h, idx) => (
                          <tr key={idx} className="markets-table-row">
                            <td className="font-mono">{h.date}</td>
                            <td className="font-mono font-semibold text-primary" style={{ textAlign: 'right' }}>${h.nav.toFixed(2)}</td>
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
      )}

      {/* View 2: SIP & Lump-sum Calculators */}
      {activeTab === 'calculator' && (
        <div className="markets-card markets-stack">
          <div className="markets-subtab-group border-b border-subtle pb-3">
            <button
              onClick={() => setCalcMode('sip')}
              className={`markets-subtab-btn ${calcMode === 'sip' ? 'active' : ''}`}
            >
              SIP (Systematic Monthly Investment)
            </button>
            <button
              onClick={() => setCalcMode('lumpsum')}
              className={`markets-subtab-btn ${calcMode === 'lumpsum' ? 'active' : ''}`}
            >
              Lump-Sum (One-Time Investment)
            </button>
          </div>

          {calcMode === 'sip' ? (
            <div className="markets-calc-grid">
              {/* Inputs */}
              <div className="markets-stack">
                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs font-medium text-secondary">
                    <span>Monthly Investment Amount</span>
                    <span className="font-mono text-primary font-bold">${monthlyAmount}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs font-medium text-secondary">
                    <span>Investment Period (Years)</span>
                    <span className="font-mono text-primary font-bold">{sipYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs font-medium text-secondary">
                    <span>Expected Annual Return Rate (%)</span>
                    <span className="font-mono text-primary font-bold">{sipRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={sipRate}
                    onChange={(e) => setSipRate(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="markets-card markets-stack-sm" style={{ background: 'var(--bg-app)' }}>
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider pb-1">SIP Projection Summary</div>
                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs py-1.5 border-b border-subtle">
                    <span className="text-secondary">Total Invested Amount:</span>
                    <span className="font-mono font-bold text-primary">${sipResult?.investedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-subtle">
                    <span className="text-secondary">Estimated Wealth Gain:</span>
                    <span className="font-mono font-bold text-emerald-400">+${sipResult?.wealthGain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                    <span className="font-semibold text-primary">Estimated Future Value:</span>
                    <span className="font-mono font-bold text-lg text-primary">${sipResult?.estimatedFutureValue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-3xs text-secondary/80 leading-relaxed border-t border-subtle pt-2">
                  {sipResult?.disclaimer}
                </div>
              </div>
            </div>
          ) : (
            <div className="markets-calc-grid">
              {/* Inputs */}
              <div className="markets-stack">
                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs font-medium text-secondary">
                    <span>Principal Amount</span>
                    <span className="font-mono text-primary font-bold">${lumpSumAmount}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={lumpSumAmount}
                    onChange={(e) => setLumpSumAmount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs font-medium text-secondary">
                    <span>Time Horizon (Years)</span>
                    <span className="font-mono text-primary font-bold">{lumpSumYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={lumpSumYears}
                    onChange={(e) => setLumpSumYears(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs font-medium text-secondary">
                    <span>Expected Annual Return Rate (%)</span>
                    <span className="font-mono text-primary font-bold">{lumpSumRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={lumpSumRate}
                    onChange={(e) => setLumpSumRate(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="markets-card markets-stack-sm" style={{ background: 'var(--bg-app)' }}>
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider pb-1">Lump-Sum Projection Summary</div>
                <div className="markets-stack-sm">
                  <div className="flex justify-between text-xs py-1.5 border-b border-subtle">
                    <span className="text-secondary">Initial Principal:</span>
                    <span className="font-mono font-bold text-primary">${lumpSumResult?.principalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-subtle">
                    <span className="text-secondary">Estimated Wealth Gain:</span>
                    <span className="font-mono font-bold text-emerald-400">+${lumpSumResult?.wealthGain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                    <span className="font-semibold text-primary">Estimated Future Value:</span>
                    <span className="font-mono font-bold text-lg text-primary">${lumpSumResult?.estimatedFutureValue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-3xs text-secondary/80 leading-relaxed border-t border-subtle pt-2">
                  {lumpSumResult?.disclaimer}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
