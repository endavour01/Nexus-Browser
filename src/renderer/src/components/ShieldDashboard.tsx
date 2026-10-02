import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Ban,
  EyeOff,
  Layers,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  Lock,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import {
  NexusShieldSettings,
  NexusShieldStats,
  ShieldFilterList,
  TrackingProtectionMode,
} from '@shared/types';
import { NexusState } from './NexusState';

interface ShieldDashboardProps {
  onNavigate?: (url: string) => void;
  onOpenClearDataModal?: () => void;
}

export const ShieldDashboard: React.FC<ShieldDashboardProps> = ({
  onNavigate,
  onOpenClearDataModal,
}) => {
  const [settings, setSettings] = useState<NexusShieldSettings | null>(null);
  const [stats, setStats] = useState<NexusShieldStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingFilters, setUpdatingFilters] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ message: string; isError?: boolean } | null>(null);

  // Custom filter list form state
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListUrl, setNewListUrl] = useState('');
  const [newListType, setNewListType] = useState<'ad' | 'tracker' | 'malware' | 'popup'>('ad');

  // Allowlist search / add state
  const [allowlistSearch, setAllowlistSearch] = useState('');
  const [newAllowedDomain, setNewAllowedDomain] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, statsData] = await Promise.all([
        window.nexusAPI.getShieldSettings(),
        window.nexusAPI.getShieldStats(),
      ]);
      setSettings(settingsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load Shield dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = window.nexusAPI.onShieldStatsUpdated((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateSettings = async (partial: Partial<NexusShieldSettings>) => {
    try {
      const updated = await window.nexusAPI.updateShieldSettings(partial);
      setSettings(updated);
    } catch (err) {
      console.error('Failed to update Shield settings:', err);
    }
  };

  const handleCheckFilterUpdates = async () => {
    try {
      setUpdatingFilters(true);
      setUpdateResult(null);
      const res = await window.nexusAPI.updateShieldFilterLists();
      if (res.success) {
        setUpdateResult({
          message: `Successfully updated ${res.updatedCount} filter list(s).`,
        });
      } else {
        setUpdateResult({
          message: `Filter update finished with issues: ${res.errors.join(', ')}`,
          isError: true,
        });
      }
      // Reload settings to get updated rule counts
      const updated = await window.nexusAPI.getShieldSettings();
      setSettings(updated);
    } catch (err: any) {
      setUpdateResult({
        message: `Failed to update filter lists: ${err.message || err}`,
        isError: true,
      });
    } finally {
      setUpdatingFilters(false);
      setTimeout(() => setUpdateResult(null), 6000);
    }
  };

  const handleToggleFilterList = async (listId: string, currentEnabled: boolean) => {
    if (!settings) return;
    const updatedLists = settings.filterLists.map((l) =>
      l.id === listId ? { ...l, enabled: !currentEnabled } : l
    );
    await handleUpdateSettings({ filterLists: updatedLists });
  };

  const handleAddCustomList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !newListName.trim() || !newListUrl.trim()) return;

    const newList: ShieldFilterList = {
      id: `custom-${Date.now()}`,
      name: newListName.trim(),
      description: 'Custom subscription list',
      url: newListUrl.trim(),
      enabled: true,
      ruleCount: 0,
      lastUpdated: Date.now(),
      format: 'adblock',
    };

    const updatedLists = [...settings.filterLists, newList];
    await handleUpdateSettings({ filterLists: updatedLists });
    setNewListName('');
    setNewListUrl('');
    setShowAddList(false);
  };

  const handleRemoveCustomList = async (listId: string) => {
    if (!settings) return;
    const updatedLists = settings.filterLists.filter((l) => l.id !== listId);
    await handleUpdateSettings({ filterLists: updatedLists });
  };

  const handleAddAllowedSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllowedDomain.trim()) return;
    let clean = newAllowedDomain.trim().toLowerCase();
    try {
      if (clean.includes('://')) {
        clean = new URL(clean).hostname;
      }
    } catch {}

    await window.nexusAPI.toggleShieldSite(clean);
    setNewAllowedDomain('');
    const updated = await window.nexusAPI.getShieldSettings();
    setSettings(updated);
  };

  const handleRemoveAllowedSite = async (domain: string) => {
    await window.nexusAPI.toggleShieldSite(domain);
    const updated = await window.nexusAPI.getShieldSettings();
    setSettings(updated);
  };

  const handleResetStats = async () => {
    if (window.confirm('Reset all Shield blocked item statistics to zero?')) {
      await window.nexusAPI.resetShieldStats();
      const newStats = await window.nexusAPI.getShieldStats();
      setStats(newStats);
    }
  };

  if (loading && !settings) {
    return (
      <div className="shield-dashboard-page">
        <NexusState variant="loading" title="Loading NEXUS Shield..." />
      </div>
    );
  }

  const isPaused = settings?.temporaryPauseUntil ? settings.temporaryPauseUntil > Date.now() : false;
  const filteredAllowedSites = (settings?.allowlist || []).filter((s: string) =>
    s.toLowerCase().includes(allowlistSearch.toLowerCase())
  );

  return (
    <div className="shield-dashboard-page">
      <div className="shield-dashboard-content">
        {/* Hero Header */}
        <div className="shield-dashboard-header">
          <div className="shield-dashboard-header-left">
            <div className="shield-hero-badge">
              <Shield
                size={28}
                className={
                  settings?.enabled && !isPaused
                    ? 'shield-icon-active'
                    : isPaused
                    ? 'shield-icon-paused'
                    : 'shield-icon-disabled'
                }
              />
            </div>
            <div>
              <h1 className="shield-title">NEXUS Shield</h1>
              <p className="shield-subtitle">
                Privacy-first ad blocker, tracking defender, and destination threat protection
              </p>
            </div>
          </div>

          <div className="shield-dashboard-header-actions">
            <button
              type="button"
              className={`nexus-btn-toggle ${settings?.enabled ? 'active' : ''}`}
              onClick={() => handleUpdateSettings({ enabled: !settings?.enabled })}
            >
              <Shield size={15} />
              <span>{settings?.enabled ? 'Shield Enabled' : 'Shield Disabled'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Metrics */}
        <div className="shield-metrics-grid">
          <div className="shield-metric-card">
            <div className="metric-icon-wrap ad-color">
              <Ban size={20} />
            </div>
            <div className="metric-text">
              <div className="metric-value">{(stats?.totalAdsBlocked ?? 0).toLocaleString()}</div>
              <div className="metric-label">Ads Blocked</div>
              <div className="metric-caption">Network banner, video & script ads</div>
            </div>
          </div>

          <div className="metric-card-wrapper shield-metric-card">
            <div className="metric-icon-wrap tracker-color">
              <EyeOff size={20} />
            </div>
            <div className="metric-text">
              <div className="metric-value">{(stats?.totalTrackersBlocked ?? 0).toLocaleString()}</div>
              <div className="metric-label">Trackers Blocked</div>
              <div className="metric-caption">Telemetry beacons, cookies & fingerprinting</div>
            </div>
          </div>

          <div className="shield-metric-card">
            <div className="metric-icon-wrap popup-color">
              <Layers size={20} />
            </div>
            <div className="metric-text">
              <div className="metric-value">{(stats?.totalPopupsBlocked ?? 0).toLocaleString()}</div>
              <div className="metric-label">Pop-ups Stopped</div>
              <div className="metric-caption">Unsolicited new windows & hijack redirects</div>
            </div>
          </div>

          <div className="shield-metric-card">
            <div className="metric-icon-wrap threat-color">
              <AlertTriangle size={20} />
            </div>
            <div className="metric-text">
              <div className="metric-value">{(stats?.totalThreatsBlocked ?? 0).toLocaleString()}</div>
              <div className="metric-label">Threats Prevented</div>
              <div className="metric-caption">Phishing feeds & known malicious hosts</div>
            </div>
          </div>
        </div>

        {/* Global Protection Controls */}
        <section className="shield-section-card">
          <h2 className="section-title">Protection Modules</h2>
          <div className="shield-controls-list">
            <div className="shield-control-row">
              <div className="control-info">
                <strong>Ad Blocking</strong>
                <p>Block banner ads, video promotions, invasive interstitials, and sponsored injections.</p>
              </div>
              <label className="nexus-switch">
                <input
                  type="checkbox"
                  checked={settings?.adBlockingEnabled ?? true}
                  onChange={(e) => handleUpdateSettings({ adBlockingEnabled: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="shield-control-row">
              <div className="control-info">
                <strong>Enhanced Tracking Protection</strong>
                <p>Prevent analytics crawlers, user profiling beacons, and behavioral monitoring scripts.</p>
                <div className="mode-selection-pills">
                  <button
                    type="button"
                    className={`mode-pill ${!settings?.strictMode ? 'selected' : ''}`}
                    onClick={() => {
                      handleUpdateSettings({ strictMode: false });
                      window.nexusAPI.setTrackingMode('standard');
                    }}
                  >
                    Standard (Recommended)
                  </button>
                  <button
                    type="button"
                    className={`mode-pill ${settings?.strictMode ? 'selected' : ''}`}
                    onClick={() => {
                      handleUpdateSettings({ strictMode: true });
                      window.nexusAPI.setTrackingMode('strict');
                    }}
                  >
                    Strict (Maximum Privacy)
                  </button>
                </div>
              </div>
              <label className="nexus-switch">
                <input
                  type="checkbox"
                  checked={settings?.trackerBlockingEnabled ?? true}
                  onChange={(e) => handleUpdateSettings({ trackerBlockingEnabled: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="shield-control-row">
              <div className="control-info">
                <strong>Malicious Website & Phishing Defense</strong>
                <p>Intercept navigations to known phishing domains, scam landing pages, and deceptive portals.</p>
              </div>
              <label className="nexus-switch">
                <input
                  type="checkbox"
                  checked={settings?.phishingProtectionEnabled ?? true}
                  onChange={(e) => handleUpdateSettings({ phishingProtectionEnabled: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="shield-control-row">
              <div className="control-info">
                <strong>Unsolicited Pop-ups & Redirect Protection</strong>
                <p>Disallow unauthorized window.open triggers and aggressive tab-under redirections.</p>
              </div>
              <label className="nexus-switch">
                <input
                  type="checkbox"
                  checked={settings?.popupBlockingEnabled ?? true}
                  onChange={(e) => handleUpdateSettings({ popupBlockingEnabled: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="shield-control-row">
              <div className="control-info">
                <div className="flex-row items-center gap-1">
                  <Lock size={15} className="text-accent" />
                  <strong>Strict SSL / Certificate Verification</strong>
                </div>
                <p>Always enforce valid HTTPS certificates. Untrusted certificates cannot be bypassed silently.</p>
              </div>
              <span className="shield-status-tag active">Enforced</span>
            </div>
          </div>
        </section>

        {/* Filter Lists Management */}
        <section className="shield-section-card">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Content Filter Lists</h2>
              <p className="section-desc">
                High-efficiency rule sets compiled into memory trie indices for zero-latency blocking.
              </p>
            </div>
            <div className="section-actions-row">
              <button
                type="button"
                className="nexus-btn-ghost"
                onClick={handleCheckFilterUpdates}
                disabled={updatingFilters}
              >
                <RotateCw size={14} className={updatingFilters ? 'animate-spin' : ''} />
                <span>{updatingFilters ? 'Updating...' : 'Update Lists'}</span>
              </button>
              <button
                type="button"
                className="nexus-btn-primary"
                onClick={() => setShowAddList(!showAddList)}
              >
                <Plus size={14} />
                <span>{showAddList ? 'Cancel' : 'Add Custom List'}</span>
              </button>
            </div>
          </div>

          {updateResult && (
            <div className={`shield-alert-banner ${updateResult.isError ? 'error' : 'success'}`}>
              {updateResult.isError ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
              <span>{updateResult.message}</span>
            </div>
          )}

          {/* Add custom list form */}
          {showAddList && (
            <form className="add-filter-card" onSubmit={handleAddCustomList}>
              <h3 className="card-title">Add Custom Filter List URL</h3>
              <div className="filter-form-grid">
                <div className="form-group">
                  <label className="form-label">List Name</label>
                  <input
                    type="text"
                    className="nexus-input"
                    placeholder="e.g., Regional AdBlock"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subscription URL (HTTPS)</label>
                  <input
                    type="url"
                    className="nexus-input"
                    placeholder="https://example.com/filters.txt"
                    value={newListUrl}
                    onChange={(e) => setNewListUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Filter Category</label>
                  <select
                    className="nexus-select"
                    value={newListType}
                    onChange={(e) => setNewListType(e.target.value as any)}
                  >
                    <option value="ad">Ad Blocking</option>
                    <option value="tracker">Tracker Protection</option>
                    <option value="malware">Malware / Phishing</option>
                    <option value="popup">Pop-ups</option>
                  </select>
                </div>
              </div>
              <div className="form-actions-right">
                <button
                  type="button"
                  className="nexus-btn-ghost"
                  onClick={() => setShowAddList(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="nexus-btn-primary">
                  Subscribe List
                </button>
              </div>
            </form>
          )}

          {/* Filter list rows */}
          <div className="filter-lists-table">
            {(settings?.filterLists || []).map((list) => (
              <div key={list.id} className="filter-list-row">
                <div className="filter-list-meta">
                  <div className="filter-list-title-wrap">
                    <span className="filter-list-name">{list.name}</span>
                    <span className={`filter-list-tag ${list.format || 'hosts'}`}>
                      {(list.format || 'HOSTS').toUpperCase()}
                    </span>
                  </div>
                  <div className="filter-list-details">
                    <span>
                      {list.ruleCount > 0
                        ? `${list.ruleCount.toLocaleString()} rules active`
                        : 'Active'}
                    </span>
                    {list.lastUpdated && (
                      <span>
                        • Updated {new Date(list.lastUpdated).toLocaleDateString()}{' '}
                        {new Date(list.lastUpdated).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="filter-list-actions">
                  {list.id.startsWith('custom-') && (
                    <button
                      type="button"
                      className="filter-remove-btn"
                      onClick={() => handleRemoveCustomList(list.id)}
                      title="Remove custom list"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <label className="nexus-switch">
                    <input
                      type="checkbox"
                      checked={list.enabled}
                      onChange={() => handleToggleFilterList(list.id, list.enabled)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Per-Site Allowlist */}
        <section className="shield-section-card">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Site Allowlists</h2>
              <p className="section-desc">
                Websites where NEXUS Shield protections are disabled at your request.
              </p>
            </div>
          </div>

          <form className="add-allowlist-form" onSubmit={handleAddAllowedSite}>
            <input
              type="text"
              className="nexus-input"
              placeholder="Add website (e.g. news.ycombinator.com)..."
              value={newAllowedDomain}
              onChange={(e) => setNewAllowedDomain(e.target.value)}
            />
            <button type="submit" className="nexus-btn nexus-btn-primary h-9 px-4 text-xs font-semibold shrink-0">
              <Plus size={14} />
              <span>Allow Site</span>
            </button>
          </form>

          {filteredAllowedSites.length === 0 ? (
            <div className="empty-allowlist-state">
              <ShieldCheck size={28} className="text-muted" />
              <p>No site exceptions configured. Protection is active everywhere.</p>
            </div>
          ) : (
            <div className="allowlist-items">
              {filteredAllowedSites.map((site) => (
                <div key={site} className="allowlist-item-row">
                  <span className="allowlist-domain">{site}</span>
                  <button
                    type="button"
                    className="nexus-btn nexus-btn-ghost text-xs px-2.5 py-1 text-danger hover:bg-danger/10"
                    onClick={() => handleRemoveAllowedSite(site)}
                    title="Remove exception and re-protect this site"
                  >
                    <Trash2 size={13} />
                    <span>Re-enable Protection</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Data Sanitization & Reset Section */}
        <section className="shield-section-card">
          <h2 className="section-title">Privacy & Data Sanitation</h2>
          <p className="section-desc">
            Clearing your browser storage destroys trackers stored in cookies, local storage, and cached HTTP responses.
          </p>

          <div className="sanitation-actions-row">
            <button
              type="button"
              className="nexus-btn-primary"
              onClick={onOpenClearDataModal}
            >
              Clear Browsing Data
            </button>
            <button
              type="button"
              className="nexus-btn-ghost danger-text"
              onClick={handleResetStats}
            >
              Reset Shield Statistics
            </button>
          </div>
        </section>

        {/* Honest Technical Disclaimers */}
        <div className="shield-disclaimer-card">
          <div className="disclaimer-header">
            <Info size={16} className="text-accent" />
            <strong>What NEXUS Shield Does & Does Not Do</strong>
          </div>
          <div className="disclaimer-body">
            <p>
              • <strong>Local Privacy Protection:</strong> Filter list evaluations happen entirely on your machine.
              Your full browsing history is never transmitted to external cloud servers for blocking decisions.
            </p>
            <p>
              • <strong>Technical Honesty:</strong> No software can detect or block 100% of malicious threats, scams,
              or zero-day exploits. NEXUS Shield blocks known advertising networks, trackers, and confirmed threat feeds,
              but cannot guarantee immunity from unknown malicious destinations.
            </p>
            <p>
              • <strong>Strict Transport Security:</strong> SSL/TLS certificate errors indicate compromised or invalid
              encryption keys and are never bypassed silently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
