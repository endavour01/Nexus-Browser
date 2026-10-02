import React, { useState, useEffect } from 'react';
import { BrowserSettings, PrivacyStateStatus, SitePermissionRule, PermissionType, PermissionDecision } from '@shared/types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  EyeOff,
  Cookie,
  Trash2,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Sliders,
  Database,
  Globe,
  Camera,
  Mic,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface PrivacyCenterViewProps {
  settings: BrowserSettings;
  onUpdateSettings: (newSettings: Partial<BrowserSettings>) => void;
  onOpenClearDataModal: () => void;
  onNavigate: (url: string) => void;
}

export const PrivacyCenterView: React.FC<PrivacyCenterViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenClearDataModal,
  onNavigate,
}) => {
  const [permissions, setPermissions] = useState<SitePermissionRule[]>([]);
  const [loadingPerms, setLoadingPerms] = useState<boolean>(false);

  const loadPermissions = async () => {
    if (!window.nexusAPI?.getSitePermissions) return;
    try {
      setLoadingPerms(true);
      const list = await window.nexusAPI.getSitePermissions();
      setPermissions(list);
    } catch (err) {
      console.error('Failed to load site permissions:', err);
    } finally {
      setLoadingPerms(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleTogglePermission = async (rule: SitePermissionRule) => {
    if (!window.nexusAPI?.setSitePermission) return;
    const nextDecision: PermissionDecision = rule.decision === 'allow' ? 'deny' : 'allow';
    await window.nexusAPI.setSitePermission(rule.origin, rule.permission, nextDecision);
    loadPermissions();
  };

  const handleRemovePermission = async (origin: string, permission: PermissionType) => {
    if (!window.nexusAPI?.removeSitePermission) return;
    await window.nexusAPI.removeSitePermission(origin, permission);
    loadPermissions();
  };

  // Derive honest implementation statuses
  const trackerStatus: PrivacyStateStatus =
    (settings.shieldEnabled ?? true) &&
    (settings.shieldTrackerBlocking ?? true) &&
    settings.trackingProtectionMode !== 'off'
      ? 'ACTIVE'
      : 'DISABLED';

  const adBlockStatus: PrivacyStateStatus =
    (settings.shieldEnabled ?? true) && (settings.shieldAdBlocking ?? true)
      ? 'ACTIVE'
      : 'DISABLED';

  const popupStatus: PrivacyStateStatus =
    (settings.popupsBlocked ?? true) || ((settings.shieldEnabled ?? true) && (settings.shieldPopupBlocking ?? true))
      ? 'ACTIVE'
      : 'DISABLED';

  const scamStatus: PrivacyStateStatus =
    (settings.shieldEnabled ?? true) && (settings.shieldPhishingProtection ?? true)
      ? 'ACTIVE'
      : 'DISABLED';

  const cookiesStatus: PrivacyStateStatus =
    (settings.thirdPartyCookiesBlocked ?? true)
      ? 'BLOCKED'
      : 'ALLOWED';

  const dntStatus: PrivacyStateStatus =
    (settings.doNotTrack ?? true)
      ? 'ACTIVE'
      : 'DISABLED';

  const httpsStatus: PrivacyStateStatus =
    (settings.httpsOnlyMode ?? false)
      ? 'ACTIVE'
      : 'DISABLED';

  const allowedCount = permissions.filter((p) => p.decision === 'allow').length;
  const blockedCount = permissions.filter((p) => p.decision === 'deny').length;

  const renderStatusBadge = (status: PrivacyStateStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="privacy-badge badge-active"><CheckCircle2 size={11} className="mr-1 inline" />ACTIVE</span>;
      case 'BLOCKED':
        return <span className="privacy-badge badge-blocked"><ShieldCheck size={11} className="mr-1 inline" />BLOCKED</span>;
      case 'ALLOWED':
        return <span className="privacy-badge badge-allowed"><AlertTriangle size={11} className="mr-1 inline" />ALLOWED</span>;
      case 'DISABLED':
        return <span className="privacy-badge badge-disabled"><XCircle size={11} className="mr-1 inline" />DISABLED</span>;
      case 'NOT AVAILABLE':
      default:
        return <span className="privacy-badge badge-unavailable">NOT AVAILABLE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Center Hero Header */}
      <div className="p-5 rounded-xl border border-subtle bg-surface/50 backdrop-blur-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={22} className="text-accent" />
              <h2 className="text-lg font-bold text-primary tracking-tight">NEXUS Privacy Center</h2>
            </div>
            <p className="text-xs text-secondary mt-1 max-w-2xl leading-relaxed">
              Real-time audit of your browser privacy protections, active shield engines, site permissions, and data boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="nexus-btn nexus-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              onClick={() => onNavigate('nexus://shield')}
              title="Open full NEXUS Shield dashboard"
            >
              <ExternalLink size={12} />
              <span>Shield Dashboard</span>
            </button>
            <button
              type="button"
              className="nexus-btn nexus-btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
              onClick={onOpenClearDataModal}
              title="Clear history, cookies, and cache"
            >
              <Trash2 size={12} />
              <span>Clear Browsing Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Protection Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Tracker Protection */}
        <div className="p-4 rounded-lg border border-subtle bg-surface flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <EyeOff size={16} className="text-emerald-400" />
              <span className="text-xs font-semibold text-primary">Tracker Blocking</span>
            </div>
            {renderStatusBadge(trackerStatus)}
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Blocks cross-site trackers and fingerprinting scripts using local EasyPrivacy sets. Mode: <code className="text-accent">{settings.trackingProtectionMode || 'standard'}</code>.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-subtle/50 text-2xs">
            <span className="text-muted">In-Memory Engine</span>
            <button
              type="button"
              className="nexus-btn nexus-btn-secondary text-xs px-2.5 py-0.5 rounded font-medium"
              onClick={() => onUpdateSettings({
                trackingProtectionMode: settings.trackingProtectionMode === 'off' ? 'standard' : 'off',
                shieldTrackerBlocking: settings.trackingProtectionMode === 'off',
              })}
            >
              {trackerStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Ad Blocking */}
        <div className="p-4 rounded-lg border border-subtle bg-surface flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              <span className="text-xs font-semibold text-primary">Ad Blocking</span>
            </div>
            {renderStatusBadge(adBlockStatus)}
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Eliminates intrusive advertising networks and banner injection before network requests hit the network stack.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-subtle/50 text-2xs">
            <span className="text-muted">EasyList Rules</span>
            <button
              type="button"
              className="nexus-btn nexus-btn-secondary text-xs px-2.5 py-0.5 rounded font-medium"
              onClick={() => onUpdateSettings({ shieldAdBlocking: !(settings.shieldAdBlocking ?? true) })}
            >
              {adBlockStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Pop-up Blocking */}
        <div className="p-4 rounded-lg border border-subtle bg-surface flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-purple-400" />
              <span className="text-xs font-semibold text-primary">Pop-up Blocker</span>
            </div>
            {renderStatusBadge(popupStatus)}
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Suppresses unauthorized window opening, deceptive pop-unders, and modal redirect loops automatically.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-subtle/50 text-2xs">
            <span className="text-muted">Window Intercept</span>
            <button
              type="button"
              className="nexus-btn nexus-btn-secondary text-xs px-2.5 py-0.5 rounded font-medium"
              onClick={() => onUpdateSettings({
                popupsBlocked: !(settings.popupsBlocked ?? true),
                shieldPopupBlocking: !(settings.shieldPopupBlocking ?? true),
              })}
            >
              {popupStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Scam & Deceptive Protection */}
        <div className="p-4 rounded-lg border border-subtle bg-surface flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-400" />
              <span className="text-xs font-semibold text-primary">Scam Protection</span>
            </div>
            {renderStatusBadge(scamStatus)}
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Warns and interrupts navigation if an origin matches verified phishing, malware, or credential harvesting hashes.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-subtle/50 text-2xs">
            <span className="text-muted">Safe Browsing</span>
            <button
              type="button"
              className="nexus-btn nexus-btn-secondary text-xs px-2.5 py-0.5 rounded font-medium"
              onClick={() => onUpdateSettings({ shieldPhishingProtection: !(settings.shieldPhishingProtection ?? true) })}
            >
              {scamStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="p-4 rounded-lg border border-subtle bg-surface flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Cookie size={16} className="text-amber-300" />
              <span className="text-xs font-semibold text-primary">Third-Party Cookies</span>
            </div>
            {renderStatusBadge(cookiesStatus)}
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Prevents third-party trackers from persisting cookie jars across multiple independent website domains.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-subtle/50 text-2xs">
            <span className="text-muted">Partition Storage</span>
            <button
              type="button"
              className="nexus-btn nexus-btn-secondary text-xs px-2.5 py-0.5 rounded font-medium"
              onClick={() => onUpdateSettings({ thirdPartyCookiesBlocked: !(settings.thirdPartyCookiesBlocked ?? true) })}
            >
              {cookiesStatus === 'BLOCKED' ? 'Allow' : 'Block'}
            </button>
          </div>
        </div>

        {/* Do Not Track Header */}
        <div className="p-4 rounded-lg border border-subtle bg-surface flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-rose-400" />
              <span className="text-xs font-semibold text-primary">Do Not Track (DNT)</span>
            </div>
            {renderStatusBadge(dntStatus)}
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Transmits the <code className="text-accent">DNT: 1</code> header with all HTTP network requests to signal non-tracking preference.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-subtle/50 text-2xs">
            <span className="text-muted">HTTP Header</span>
            <button
              type="button"
              className="nexus-btn nexus-btn-secondary text-xs px-2.5 py-0.5 rounded font-medium"
              onClick={() => onUpdateSettings({ doNotTrack: !(settings.doNotTrack ?? true) })}
            >
              {dntStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Memory & Site Permission Inspector */}
      <div className="p-5 rounded-xl border border-subtle bg-surface space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-primary">Site Permissions Memory</h3>
            </div>
            <p className="text-2xs text-secondary mt-0.5">
              Decisions you grant or deny are remembered permanently across sessions so you aren't asked repeatedly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {allowedCount} Allowed
            </span>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {blockedCount} Denied
            </span>
            <button
              type="button"
              className="nexus-icon-btn p-1 text-secondary hover:text-primary"
              onClick={loadPermissions}
              title="Refresh permissions list"
            >
              <RefreshCw size={13} className={loadingPerms ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Permissions Table */}
        {permissions.length > 0 ? (
          <div className="overflow-x-auto border border-subtle rounded-lg">
            <table className="w-full text-left text-2xs">
              <thead className="bg-elevated text-secondary font-medium uppercase tracking-wider text-3xs border-b border-subtle">
                <tr>
                  <th className="p-2.5">Origin / Website</th>
                  <th className="p-2.5">Permission</th>
                  <th className="p-2.5">Current Decision</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {permissions.map((rule) => (
                  <tr key={`${rule.origin}:${rule.permission}`} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="p-2.5 font-mono text-primary font-medium">{rule.origin}</td>
                    <td className="p-2.5 capitalize text-secondary">{rule.permission}</td>
                    <td className="p-2.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(rule)}
                        className={`perm-decision-pill ${rule.decision} text-3xs font-semibold px-2 py-0.5 rounded`}
                        title="Click to toggle decision"
                      >
                        {rule.decision.toUpperCase()}
                      </button>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        className="text-secondary hover:text-rose-400 p-1"
                        onClick={() => handleRemovePermission(rule.origin, rule.permission)}
                        title="Revoke and delete this remembered permission rule"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-secondary text-xs rounded-lg border border-dashed border-subtle bg-base/50">
            No remembered site permissions yet. When websites request camera, microphone, or notifications, your answers will be displayed and manageable here.
          </div>
        )}
      </div>

      {/* Clear on Exit & Direct Privacy Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-subtle bg-surface space-y-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-accent" />
            <h4 className="text-xs font-semibold text-primary">Session Cleanup</h4>
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Automatically wipe transient browsing cache, active cookies, and closed tab history whenever you close NEXUS Browser.
          </p>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={settings.clearDataOnExit ?? false}
              onChange={(e) => onUpdateSettings({ clearDataOnExit: e.target.checked })}
              className="rounded border-subtle"
            />
            <span className="text-2xs text-primary font-medium">Clear browsing data on exit</span>
          </label>
        </div>

        <div className="p-4 rounded-xl border border-subtle bg-surface space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-red-400" />
            <h4 className="text-xs font-semibold text-primary">On-Demand Sanitization</h4>
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            Permanently erase your browsing footprint with configurable time ranges (last hour, 24 hours, 7 days, or all time).
          </p>
          <button
            type="button"
            className="setting-action-btn w-full mt-1"
            onClick={onOpenClearDataModal}
          >
            <Trash2 size={12} className="text-rose-400" />
            <span>Launch Clear Browsing Data Dialog...</span>
          </button>
        </div>
      </div>
    </div>
  );
};
