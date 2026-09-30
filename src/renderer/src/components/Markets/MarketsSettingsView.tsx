import React from 'react';
import { MarketsSettings } from '@shared/types';
import { Settings, Shield, Bell, DollarSign, Database, EyeOff, CheckCircle } from 'lucide-react';

interface MarketsSettingsViewProps {
  settings: MarketsSettings | null;
  onUpdateSettings: (partial: Partial<MarketsSettings>) => Promise<void>;
}

export const MarketsSettingsView: React.FC<MarketsSettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Privacy Guarantee Banner */}
      <div className="p-4 bg-surface border border-subtle rounded-lg flex items-start gap-3">
        <Shield size={20} className="shrink-0 text-emerald-400 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary">Privacy & Local-First Philosophy</h4>
          <p className="text-xs text-secondary leading-relaxed">
            All your stock watchlists, price drop alerts, and tracked shopping URLs are stored strictly on your local disk in <code>nexus-markets-*.json</code>. No personal financial queries or tracking habits are sent to third-party ad networks or brokers.
          </p>
        </div>
      </div>

      {/* Master Toggle */}
      <div className="markets-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-subtle pb-4">
          <div>
            <h3 className="font-semibold text-sm text-primary">Enable NEXUS Markets Workspace</h3>
            <p className="text-xs text-secondary mt-0.5">
              Activate the financial research, mutual fund, IPO, and shopping workspace in your browser.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => onUpdateSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Independent Module Controls */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Independent Module Visibility</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-surface/50 rounded border border-subtle cursor-pointer hover:bg-surface">
              <div>
                <div className="font-medium text-primary">Stocks & OHLCV Charts</div>
                <div className="text-2xs text-secondary">Quotes, fundamentals, watchlists</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableStocks}
                onChange={(e) => onUpdateSettings({ enableStocks: e.target.checked })}
                className="rounded border-subtle text-primary focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-surface/50 rounded border border-subtle cursor-pointer hover:bg-surface">
              <div>
                <div className="font-medium text-primary">IPO Tracker</div>
                <div className="text-2xs text-secondary">Exchange filings & subscription rates</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableIpos}
                onChange={(e) => onUpdateSettings({ enableIpos: e.target.checked })}
                className="rounded border-subtle text-primary focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-surface/50 rounded border border-subtle cursor-pointer hover:bg-surface">
              <div>
                <div className="font-medium text-primary">Mutual Funds & Calculators</div>
                <div className="text-2xs text-secondary">Schemes, comparisons, SIP & Lump-sum</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMutualFunds}
                onChange={(e) => onUpdateSettings({ enableMutualFunds: e.target.checked })}
                className="rounded border-subtle text-primary focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-surface/50 rounded border border-subtle cursor-pointer hover:bg-surface">
              <div>
                <div className="font-medium text-primary">Shopping Price Tracker</div>
                <div className="text-2xs text-secondary">Checkpoints & price drop alerts</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableShopping}
                onChange={(e) => onUpdateSettings({ enableShopping: e.target.checked })}
                className="rounded border-subtle text-primary focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-surface/50 rounded border border-subtle cursor-pointer hover:bg-surface col-span-full">
              <div>
                <div className="font-medium text-primary">Financial News & Filings</div>
                <div className="text-2xs text-secondary">Journalistic badge categories & SEC wire</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableFinancialNews}
                onChange={(e) => onUpdateSettings({ enableFinancialNews: e.target.checked })}
                className="rounded border-subtle text-primary focus:ring-0"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Notifications & Preferences */}
      <div className="markets-card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
          <Bell size={16} /> Alerts & Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-secondary text-2xs mb-1 font-medium">Notification Frequency</label>
            <select
              value={settings.notificationFrequency}
              onChange={(e) => onUpdateSettings({ notificationFrequency: e.target.value as any })}
              className="nexus-input w-full text-xs"
            >
              <option value="realtime">Real-time (Immediate notification)</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Summary</option>
              <option value="disabled">Disabled (No notifications)</option>
            </select>
          </div>

          <div>
            <label className="block text-secondary text-2xs mb-1 font-medium">Default Currency Symbol</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => onUpdateSettings({ defaultCurrency: e.target.value })}
              className="nexus-input w-full text-xs font-mono"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <div className="col-span-full">
            <label className="flex items-center gap-2 text-xs font-medium text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enablePriceAlerts}
                onChange={(e) => onUpdateSettings({ enablePriceAlerts: e.target.checked })}
                className="rounded border-subtle text-primary focus:ring-0"
              />
              <span>Enable Price Threshold Notifications for Stocks and Shopping items</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
