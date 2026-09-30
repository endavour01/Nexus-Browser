import React from 'react';
import { TrendingUp, ShieldCheck, BarChart3, Building2, PieChart, ShoppingBag, Newspaper, CheckCircle2 } from 'lucide-react';

interface MarketsOnboardingSplashProps {
  onEnable: () => void;
}

export const MarketsOnboardingSplash: React.FC<MarketsOnboardingSplashProps> = ({ onEnable }) => {
  return (
    <div className="markets-onboarding-container animate-fade-in">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-2">
          <TrendingUp size={36} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Welcome to NEXUS Markets
          </h1>
          <p className="text-sm text-secondary max-w-xl mx-auto leading-relaxed">
            An informational, data-driven financial and shopping research workspace designed for power users. Strictly research-focused — no trading, no speculative hype, and zero data fabrication.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left my-6">
          <div className="p-3.5 rounded-xl bg-surface/60 border border-subtle flex items-start gap-3">
            <BarChart3 size={18} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-primary">Stocks & OHLCV Charts</div>
              <div className="text-2xs text-secondary mt-0.5">
                Delayed and historical pricing with genuine volume data and investor relations links.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface/60 border border-subtle flex items-start gap-3">
            <Building2 size={18} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-primary">IPO Filing Tracker</div>
              <div className="text-2xs text-secondary mt-0.5">
                Verified SEC/exchange filings, price bands, and subscription data with provisional tags.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface/60 border border-subtle flex items-start gap-3">
            <PieChart size={18} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-primary">Mutual Funds & Calculators</div>
              <div className="text-2xs text-secondary mt-0.5">
                Verified historical NAVs, multi-scheme comparison, and mathematical SIP calculators.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface/60 border border-subtle flex items-start gap-3">
            <ShoppingBag size={18} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-primary">Shopping Price Tracker</div>
              <div className="text-2xs text-secondary mt-0.5">
                Monitors genuine price checkpoints from date of addition with target price drop alerts.
              </div>
            </div>
          </div>
        </div>

        {/* Local Storage Notice */}
        <div className="p-3.5 rounded-xl bg-surface/40 border border-subtle flex items-center justify-center gap-2 text-2xs text-secondary">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Hidden by default • All watchlists and price alerts remain 100% on your local machine</span>
        </div>

        {/* CTA Button */}
        <div>
          <button
            className="nexus-btn-primary px-6 py-2.5 text-sm font-semibold rounded-lg shadow-lg hover:scale-102 transition-transform"
            onClick={onEnable}
          >
            Enable NEXUS Markets
          </button>
        </div>
      </div>
    </div>
  );
};
