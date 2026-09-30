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
    <div className="space-y-4">
      {/* Top Banner Disclaimer */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2.5 text-xs text-blue-300">
        <ShieldAlert size={16} className="shrink-0 mt-0.5 text-blue-400" />
        <div>
          <strong>Mutual Fund Analytics & Calculator Notice:</strong> NAV values, expense ratios, and historical trajectories are derived from public disclosures and AMFI/benchmark registries. Past performance does not guarantee future results. Projections are mathematical illustrations only.
        </div>
      </div>

      {/* Sub Tabs: Schemes vs Calculators */}
      <div className="flex items-center justify-between border-b border-subtle pb-2">
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'schemes'
                ? 'bg-primary text-background'
                : 'text-secondary hover:text-primary hover:bg-surface'
            }`}
            onClick={() => setActiveTab('schemes')}
          >
            <PieChart size={14} />
            <span>Mutual Fund Schemes</span>
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'calculator'
                ? 'bg-primary text-background'
                : 'text-secondary hover:text-primary hover:bg-surface'
            }`}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Scheme List & Categories */}
          <div className="space-y-3">
            {/* Category Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-2xs font-semibold rounded capitalize whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-surface text-primary border border-primary/50'
                      : 'text-secondary hover:text-primary bg-surface/50 border border-subtle'
                  }`}
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
                            ? 'bg-primary text-background border-primary'
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
          <div className="lg:col-span-2 space-y-4">
            {compareFundIds.length > 0 ? (
              /* Comparison Mode */
              <div className="markets-card p-5 space-y-4">
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-subtle text-secondary text-2xs uppercase">
                        <th className="p-2">Metric</th>
                        {compareFundIds.map((id) => {
                          const f = funds.find((item) => item.id === id);
                          return (
                            <th key={id} className="p-2 text-primary font-semibold max-w-[160px] truncate">
                              {f?.schemeName}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle font-mono text-xs">
                      <tr>
                        <td className="p-2 text-secondary font-sans text-2xs">Category</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="p-2 font-sans">{funds.find((f) => f.id === id)?.category}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2 text-secondary font-sans text-2xs">Current NAV</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="p-2 font-bold">${funds.find((f) => f.id === id)?.nav.toFixed(2)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2 text-secondary font-sans text-2xs">Expense Ratio</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="p-2">{funds.find((f) => f.id === id)?.expenseRatio}%</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2 text-secondary font-sans text-2xs">AUM</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="p-2">{funds.find((f) => f.id === id)?.aum}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2 text-secondary font-sans text-2xs">Benchmark</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="p-2 font-sans text-2xs">{funds.find((f) => f.id === id)?.benchmark}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2 text-secondary font-sans text-2xs">Risk Level</td>
                        {compareFundIds.map((id) => (
                          <td key={id} className="p-2 font-sans text-2xs font-semibold">{funds.find((f) => f.id === id)?.riskLevel}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeFund ? (
              /* Single Fund Deep Dive */
              <div className="markets-card p-5 space-y-4">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                    <div className="text-2xs text-secondary">Expense Ratio</div>
                    <div className="text-xs font-mono font-semibold text-primary">{activeFund.expenseRatio}%</div>
                  </div>
                  <div className="p-2.5 bg-surface/50 rounded border border-subtle">
                    <div className="text-2xs text-secondary">AUM</div>
                    <div className="text-xs font-mono font-semibold text-primary">{activeFund.aum}</div>
                  </div>
                  <div className="p-2.5 bg-surface/50 rounded border border-subtle col-span-2">
                    <div className="text-2xs text-secondary">Benchmark</div>
                    <div className="text-xs font-mono font-semibold text-primary truncate">{activeFund.benchmark}</div>
                  </div>
                </div>

                {/* NAV History Table */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Historical NAV Milestones</div>
                  <div className="overflow-x-auto rounded border border-subtle">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface/50 text-secondary text-2xs uppercase">
                          <th className="p-2">Date</th>
                          <th className="p-2 text-right">NAV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-subtle font-mono text-xs">
                        {activeFund.navHistory.map((h, idx) => (
                          <tr key={idx} className="hover:bg-surface/30">
                            <td className="p-2">{h.date}</td>
                            <td className="p-2 text-right font-semibold">${h.nav.toFixed(2)}</td>
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
        <div className="markets-card p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-subtle pb-3">
            <button
              onClick={() => setCalcMode('sip')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                calcMode === 'sip'
                  ? 'bg-primary text-background'
                  : 'text-secondary hover:text-primary bg-surface'
              }`}
            >
              SIP (Systematic Monthly Investment)
            </button>
            <button
              onClick={() => setCalcMode('lumpsum')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                calcMode === 'lumpsum'
                  ? 'bg-primary text-background'
                  : 'text-secondary hover:text-primary bg-surface'
              }`}
            >
              Lump-Sum (One-Time Investment)
            </button>
          </div>

          {calcMode === 'sip' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-secondary mb-1">
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

                <div>
                  <div className="flex justify-between text-xs font-medium text-secondary mb-1">
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

                <div>
                  <div className="flex justify-between text-xs font-medium text-secondary mb-1">
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
              <div className="bg-surface/50 p-5 rounded-lg border border-subtle space-y-4">
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider">SIP Projection Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs py-1 border-b border-subtle">
                    <span className="text-secondary">Total Invested Amount:</span>
                    <span className="font-mono font-bold text-primary">${sipResult?.investedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-subtle">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-secondary mb-1">
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

                <div>
                  <div className="flex justify-between text-xs font-medium text-secondary mb-1">
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

                <div>
                  <div className="flex justify-between text-xs font-medium text-secondary mb-1">
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
              <div className="bg-surface/50 p-5 rounded-lg border border-subtle space-y-4">
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider">Lump-Sum Projection Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs py-1 border-b border-subtle">
                    <span className="text-secondary">Initial Principal:</span>
                    <span className="font-mono font-bold text-primary">${lumpSumResult?.principalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-subtle">
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
