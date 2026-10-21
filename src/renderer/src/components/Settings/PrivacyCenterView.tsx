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
  Sliders,
  Database,
  Globe,
  Camera,
  Mic,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Button, Badge } from '../ui';

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
    try {
      await window.nexusAPI.setSitePermission(rule.origin, rule.permission, nextDecision);
      setPermissions((prev) =>
        prev.map((p) =>
          p.origin === rule.origin && p.permission === rule.permission
            ? { ...p, decision: nextDecision }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to toggle permission:', err);
    }
  };

  const handleRemovePermission = async (origin: string, permission: PermissionType) => {
    if (!window.nexusAPI?.removeSitePermission) return;
    try {
      await window.nexusAPI.removeSitePermission(origin, permission);
      setPermissions((prev) =>
        prev.filter((p) => !(p.origin === origin && p.permission === permission))
      );
    } catch (err) {
      console.error('Failed to remove permission:', err);
    }
  };

  // Derive live real-time statuses from settings
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

  const allowedCount = permissions.filter((p) => p.decision === 'allow').length;
  const blockedCount = permissions.filter((p) => p.decision === 'deny').length;

  const renderStatusBadge = (status: PrivacyStateStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="privacy-badge badge-active"><CheckCircle2 size={11} style={{ marginRight: '4px' }} />ACTIVE</span>;
      case 'BLOCKED':
        return <span className="privacy-badge badge-blocked"><ShieldCheck size={11} style={{ marginRight: '4px' }} />BLOCKED</span>;
      case 'ALLOWED':
        return <span className="privacy-badge badge-allowed"><AlertTriangle size={11} style={{ marginRight: '4px' }} />ALLOWED</span>;
      case 'DISABLED':
        return <span className="privacy-badge badge-disabled"><XCircle size={11} style={{ marginRight: '4px' }} />DISABLED</span>;
      case 'NOT AVAILABLE':
      default:
        return <span className="privacy-badge badge-not-available">NOT AVAILABLE</span>;
    }
  };

  return (
    <div className="settings-section-block">
      {/* Privacy Center Hero Header */}
      <div className="settings-group-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} className="text-accent" />
              <h2 className="settings-header-title" style={{ fontSize: '18px' }}>NEXUS Privacy Center</h2>
            </div>
            <p className="settings-header-desc" style={{ marginTop: '4px' }}>
              Real-time audit of your browser privacy protections, active shield engines, site permissions, and data boundaries.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('nexus://shield')}
              title="Open full NEXUS Shield dashboard"
            >
              Shield Dashboard
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Trash2 size={12} />}
              onClick={onOpenClearDataModal}
              title="Clear history, cookies, and cache"
            >
              Clear Browsing Data
            </Button>
          </div>
        </div>
      </div>

      {/* Real-Time Protection Matrix Grid */}
      <div className="settings-matrix-grid">
        {/* Tracker Protection */}
        <div className="settings-matrix-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EyeOff size={16} style={{ color: '#34D399' }} />
              <span className="settings-row-label">Tracker Blocking</span>
            </div>
            {renderStatusBadge(trackerStatus)}
          </div>
          <p className="settings-row-desc" style={{ marginTop: '8px', lineHeight: 1.45 }}>
            Blocks cross-site trackers and fingerprinting scripts using local EasyPrivacy sets. Mode: <code className="text-accent">{settings.trackingProtectionMode || 'standard'}</code>.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)' }}>In-Memory Engine</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onUpdateSettings({
                trackingProtectionMode: settings.trackingProtectionMode === 'off' ? 'standard' : 'off',
                shieldTrackerBlocking: settings.trackingProtectionMode === 'off',
              })}
            >
              {trackerStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* Ad Blocking */}
        <div className="settings-matrix-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: '#60A5FA' }} />
              <span className="settings-row-label">Ad Blocking</span>
            </div>
            {renderStatusBadge(adBlockStatus)}
          </div>
          <p className="settings-row-desc" style={{ marginTop: '8px', lineHeight: 1.45 }}>
            Eliminates intrusive advertising networks and banner injection before network requests hit the network stack.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)' }}>EasyList Rules</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onUpdateSettings({ shieldAdBlocking: !(settings.shieldAdBlocking ?? true) })}
            >
              {adBlockStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* Pop-up Blocking */}
        <div className="settings-matrix-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} style={{ color: '#C084FC' }} />
              <span className="settings-row-label">Pop-up Blocker</span>
            </div>
            {renderStatusBadge(popupStatus)}
          </div>
          <p className="settings-row-desc" style={{ marginTop: '8px', lineHeight: 1.45 }}>
            Suppresses unauthorized window opening, deceptive pop-unders, and modal redirect loops automatically.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)' }}>Window Intercept</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onUpdateSettings({
                popupsBlocked: !(settings.popupsBlocked ?? true),
                shieldPopupBlocking: !(settings.shieldPopupBlocking ?? true),
              })}
            >
              {popupStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* Scam & Deceptive Protection */}
        <div className="settings-matrix-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} style={{ color: '#FBBF24' }} />
              <span className="settings-row-label">Scam Protection</span>
            </div>
            {renderStatusBadge(scamStatus)}
          </div>
          <p className="settings-row-desc" style={{ marginTop: '8px', lineHeight: 1.45 }}>
            Warns and interrupts navigation if an origin matches verified phishing, malware, or credential harvesting hashes.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)' }}>Safe Browsing</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onUpdateSettings({ shieldPhishingProtection: !(settings.shieldPhishingProtection ?? true) })}
            >
              {scamStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="settings-matrix-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cookie size={16} style={{ color: '#FCD34D' }} />
              <span className="settings-row-label">Third-Party Cookies</span>
            </div>
            {renderStatusBadge(cookiesStatus)}
          </div>
          <p className="settings-row-desc" style={{ marginTop: '8px', lineHeight: 1.45 }}>
            Prevents third-party trackers from persisting cookie jars across multiple independent website domains.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)' }}>Partition Storage</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onUpdateSettings({ thirdPartyCookiesBlocked: !(settings.thirdPartyCookiesBlocked ?? true) })}
            >
              {cookiesStatus === 'BLOCKED' ? 'Allow' : 'Block'}
            </Button>
          </div>
        </div>

        {/* Do Not Track Header */}
        <div className="settings-matrix-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} style={{ color: '#FB7185' }} />
              <span className="settings-row-label">Do Not Track (DNT)</span>
            </div>
            {renderStatusBadge(dntStatus)}
          </div>
          <p className="settings-row-desc" style={{ marginTop: '8px', lineHeight: 1.45 }}>
            Transmits the <code className="text-accent">DNT: 1</code> header with all HTTP network requests to signal non-tracking preference.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)' }}>HTTP Header</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onUpdateSettings({ doNotTrack: !(settings.doNotTrack ?? true) })}
            >
              {dntStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </div>

      {/* Permissions Memory & Site Permission Inspector */}
      <div className="settings-group-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} className="text-accent" />
              <h3 className="settings-row-label" style={{ fontSize: '14px', fontWeight: 600 }}>Site Permissions Memory</h3>
            </div>
            <p className="settings-row-desc" style={{ marginTop: '2px' }}>
              Decisions you grant or deny are remembered permanently across sessions so you aren't asked repeatedly.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              {allowedCount} Allowed
            </span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
              {blockedCount} Denied
            </span>
            <button
              type="button"
              className="nexus-icon-btn"
              style={{ padding: '6px', color: 'var(--nexus-text-secondary, #9298A8)' }}
              onClick={loadPermissions}
              title="Refresh permissions list"
            >
              <RefreshCw size={13} className={loadingPerms ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Permissions Table */}
        {permissions.length > 0 ? (
          <div className="settings-table-container">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Origin / Website</th>
                  <th>Permission</th>
                  <th>Current Decision</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((rule) => (
                  <tr key={`${rule.origin}:${rule.permission}`}>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--nexus-text-primary, #F4F4F5)', fontWeight: 500 }}>
                      {rule.origin}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{rule.permission}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(rule)}
                        className={`perm-decision-pill ${rule.decision}`}
                        title="Click to toggle decision"
                      >
                        {rule.decision.toUpperCase()}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: 'var(--nexus-text-secondary, #9298A8)', cursor: 'pointer', padding: '4px' }}
                        onClick={() => handleRemovePermission(rule.origin, rule.permission)}
                        title="Revoke and delete this remembered permission rule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--nexus-text-secondary, #9298A8)', fontSize: '12px', border: '1px dashed var(--nexus-border-subtle, #1C202C)', borderRadius: '8px' }}>
            No remembered site permissions yet. When websites request camera, microphone, or notifications, your answers will be displayed and manageable here.
          </div>
        )}
      </div>

      {/* Clear on Exit & Direct Privacy Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="settings-group-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} className="text-accent" />
            <h4 className="settings-row-label">Session Cleanup</h4>
          </div>
          <p className="settings-row-desc">
            Automatically wipe transient browsing cache, active cookies, and closed tab history whenever you close NEXUS Browser.
          </p>
          <div className="settings-row" style={{ paddingTop: '8px' }}>
            <div className="settings-row-label">Clear browsing data on exit</div>
            <div className="settings-row-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.clearDataOnExit ?? false}
                  onChange={(e) => onUpdateSettings({ clearDataOnExit: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        <div className="settings-group-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} style={{ color: '#F87171' }} />
            <h4 className="settings-row-label">On-Demand Sanitization</h4>
          </div>
          <p className="settings-row-desc">
            Permanently erase your browsing footprint with configurable time ranges (last hour, 24 hours, 7 days, or all time).
          </p>
          <div style={{ paddingTop: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<Trash2 size={12} />}
              onClick={onOpenClearDataModal}
            >
              Launch Clear Browsing Data Dialog...
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
