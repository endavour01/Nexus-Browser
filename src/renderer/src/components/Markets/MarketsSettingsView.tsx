import React from 'react';
import { MarketsSettings } from '@shared/types';
import { ShieldCheck, Bell, HardDrive, RotateCcw, AlertCircle } from 'lucide-react';

interface MarketsSettingsViewProps {
  settings: MarketsSettings;
  onUpdateSettings: (settings: Partial<MarketsSettings>) => Promise<any>;
}

export const MarketsSettingsView: React.FC<MarketsSettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleToggle = (key: keyof MarketsSettings) => {
    onUpdateSettings({ [key]: !settings[key] });
  };

  const handleFrequencyChange = (freq: 'realtime' | 'daily' | 'weekly' | 'disabled') => {
    onUpdateSettings({ notificationFrequency: freq });
  };

  return (
    <div className="markets-section-container max-w-3xl space-y-6">
      {/* Privacy Guarantee Header */}
      <div className="markets-card p-5 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-primary">Local Storage & Privacy Guarantee</h3>
            <p className="text-xs text-secondary leading-relaxed">
              NEXUS Markets is an informational research workspace, not an order execution platform or brokerage. All your watchlists, tracked shopping URLs, alert thresholds, and cached rate tables are saved locally on your personal machine in <code>nexus-markets-*.json</code>. No portfolio data is broadcast to external advertising networks.
            </p>
          </div>
        </div>
      </div>

      {/* Module Controls */}
      <div className="markets-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-primary border-b border-subtle pb-2">
          Modular Feature Toggles
        </h3>
        <p className="text-xs text-secondary">
          Customize which market modules are active in your research workspace:
        </p>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between p-2.5 rounded bg-surface/50 border border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">Stocks & Interactive Charts</div>
              <div className="text-2xs text-secondary">Search equities, inspect OHLCV charts, and maintain watchlists</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableStocks}
              onChange={() => handleToggle('enableStocks')}
              className="nexus-switch"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded bg-surface/50 border border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">IPO Tracker & Filings</div>
              <div className="text-2xs text-secondary">Track upcoming, open, closed, and listed IPO prospectuses</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableIpos}
              onChange={() => handleToggle('enableIpos')}
              className="nexus-switch"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded bg-surface/50 border border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">Mutual Funds & SIP Calculator</div>
              <div className="text-2xs text-secondary">AMFI/MFAPI verified NAVs, fund comparisons, and compound calculators</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableMutualFunds}
              onChange={() => handleToggle('enableMutualFunds')}
              className="nexus-switch"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded bg-surface/50 border border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">Shopping Price Tracker</div>
              <div className="text-2xs text-secondary">Track product price checkpoints and configure target price drop alerts</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableShopping}
              onChange={() => handleToggle('enableShopping')}
              className="nexus-switch"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded bg-surface/50 border border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">Financial News & Filings</div>
              <div className="text-2xs text-secondary">Curated chronological feed classified into filings, reports, and commentary</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableFinancialNews}
              onChange={() => handleToggle('enableFinancialNews')}
              className="nexus-switch"
            />
          </div>
        </div>
      </div>

      {/* Notifications & Price Alerts */}
      <div className="markets-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-subtle pb-2">
          <Bell size={16} className="text-accent" />
          <h3 className="text-sm font-bold text-primary">Notifications & Update Frequency</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary">Update & Refresh Frequency</span>
            <div className="flex gap-1.5">
              {(['realtime', 'daily', 'weekly', 'disabled'] as const).map((freq) => (
                <button
                  key={freq}
                  className={`filter-pill text-xs ${
                    settings.notificationFrequency === freq ? 'active' : ''
                  }`}
                  onClick={() => handleFrequencyChange(freq)}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">Price Drop & Target Alerts</div>
              <div className="text-2xs text-secondary">Trigger notification badges when watched stock or shopping prices reach targets</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enablePriceAlerts}
              onChange={() => handleToggle('enablePriceAlerts')}
              className="nexus-switch"
            />
          </div>
        </div>
      </div>

      {/* Reset & Disable Controls */}
      <div className="markets-card p-5 flex items-center justify-between border-subtle">
        <div>
          <div className="text-xs font-semibold text-primary">Disable NEXUS Markets</div>
          <div className="text-2xs text-secondary">Hides the markets hub and prevents automated background data refreshes</div>
        </div>
        <button
          className="nexus-btn-ghost px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
          onClick={() => onUpdateSettings({ enabled: false })}
        >
          Disable Markets
        </button>
      </div>
    </div>
  );
};
