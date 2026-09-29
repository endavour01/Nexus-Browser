import React, { useEffect, useState } from 'react';
import {
  Lock,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Mic,
  MapPin,
  Bell,
  X,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  SiteSecurityInfo,
  PermissionType,
  PermissionDecision,
  SitePermissionRule,
  TrackingProtectionSettings,
} from '@shared/types';

interface SiteSecurityPopoverProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenPermissionsPage: () => void;
}

export const SiteSecurityPopover: React.FC<SiteSecurityPopoverProps> = ({
  url,
  isOpen,
  onClose,
  onOpenPermissionsPage,
}) => {
  const [securityInfo, setSecurityInfo] = useState<SiteSecurityInfo | null>(null);
  const [permissions, setPermissions] = useState<Record<PermissionType, PermissionDecision>>({
    camera: 'ask',
    microphone: 'ask',
    geolocation: 'ask',
    notifications: 'ask',
    midi: 'ask',
    pointerLock: 'ask',
    fullscreen: 'allow',
    openExternal: 'ask',
  });
  const [trackingSettings, setTrackingSettings] = useState<TrackingProtectionSettings | null>(null);
  const [isExcepted, setIsExcepted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCertDetails, setShowCertDetails] = useState<boolean>(false);

  const origin = React.useMemo(() => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  }, [url]);

  useEffect(() => {
    if (!isOpen || !url || url.startsWith('nexus://')) return;

    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const secInfo = await window.nexusAPI.getSiteSecurityInfo(url);
        const allRules = await window.nexusAPI.getSitePermissions();
        const trk = await window.nexusAPI.getTrackingSettings();

        if (!mounted) return;

        setSecurityInfo(secInfo);
        setTrackingSettings(trk);
        setIsExcepted(trk.exceptions.includes(origin.toLowerCase()));

        // Populate rules for this origin
        const currentRules = allRules.filter((r) => r.origin.toLowerCase() === origin.toLowerCase());
        const mapped: Record<PermissionType, PermissionDecision> = {
          camera: 'ask',
          microphone: 'ask',
          geolocation: 'ask',
          notifications: 'ask',
          midi: 'ask',
          pointerLock: 'ask',
          fullscreen: 'allow',
          openExternal: 'ask',
        };
        for (const r of currentRules) {
          mapped[r.permission] = r.decision;
        }
        setPermissions(mapped);
      } catch (err) {
        console.error('Failed to load security popover data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [isOpen, url, origin]);

  if (!isOpen) return null;

  const handleTogglePermission = async (perm: PermissionType) => {
    const current = permissions[perm];
    const next: PermissionDecision = current === 'allow' ? 'deny' : current === 'deny' ? 'ask' : 'allow';

    try {
      await window.nexusAPI.setSitePermission(origin, perm, next);
      setPermissions((prev) => ({ ...prev, [perm]: next }));
    } catch (e) {
      console.error('Failed to toggle permission:', e);
    }
  };

  const handleToggleTracking = async () => {
    try {
      const exempted = await window.nexusAPI.toggleTrackingException(origin);
      setIsExcepted(exempted);
      const updated = await window.nexusAPI.getTrackingSettings();
      setTrackingSettings(updated);
    } catch (e) {
      console.error('Failed to toggle tracking exception:', e);
    }
  };

  const isHttps = url.startsWith('https://');
  const isSecure = securityInfo?.status === 'secure';
  const isWarning = securityInfo?.status === 'warning';
  const cert = securityInfo?.certificate;

  return (
    <div className="security-popover-overlay" onClick={onClose}>
      <div className="security-popover" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="security-popover-header">
          <div className="security-origin-info">
            <div className={`status-badge-icon ${isSecure ? 'secure' : isWarning ? 'warning' : 'insecure'}`}>
              {isSecure ? (
                <Lock size={16} />
              ) : isWarning ? (
                <AlertTriangle size={16} />
              ) : (
                <ShieldAlert size={16} />
              )}
            </div>
            <div>
              <div className="security-origin-title">{origin}</div>
              <div className="security-status-text">
                {isSecure
                  ? 'Connection is secure'
                  : isWarning
                  ? 'Security Warning (Untrusted)'
                  : 'Connection is not secure'}
              </div>
            </div>
          </div>
          <button className="nexus-icon-btn close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Status Description */}
        <div className="security-popover-body">
          {isSecure ? (
            <p className="security-desc">
              Your connection to this site is encrypted with a valid certificate. Passwords, messages,
              and private information remain secure in transit.
            </p>
          ) : isWarning ? (
            <div className="security-alert-box error">
              <div className="alert-title">Certificate Validation Failed</div>
              <div className="alert-msg">{securityInfo?.error || 'Untrusted SSL/TLS certificate.'}</div>
            </div>
          ) : (
            <div className="security-alert-box warning">
              <div className="alert-title">Unencrypted Connection (HTTP)</div>
              <div className="alert-msg">
                You should not enter any sensitive information (such as passwords or credit cards), as it
                could be intercepted on untrusted networks.
              </div>
            </div>
          )}

          {/* Certificate View Button / Section */}
          {cert && (
            <div className="security-section">
              <div className="section-header">
                <span className="section-title">SSL/TLS Certificate</span>
                <button
                  className="cert-toggle-btn"
                  onClick={() => setShowCertDetails(!showCertDetails)}
                >
                  {showCertDetails ? 'Hide details' : 'View details'}
                </button>
              </div>

              {showCertDetails && (
                <div className="cert-details-card">
                  <div className="cert-row">
                    <span className="cert-label">Subject:</span>
                    <span className="cert-val">{cert.subjectName || origin}</span>
                  </div>
                  <div className="cert-row">
                    <span className="cert-label">Issuer:</span>
                    <span className="cert-val">{cert.issuerName || 'Unknown CA'}</span>
                  </div>
                  <div className="cert-row">
                    <span className="cert-label">Validity:</span>
                    <span className="cert-val">
                      {new Date(cert.validFrom).toLocaleDateString()} –{' '}
                      {new Date(cert.validTo).toLocaleDateString()}
                    </span>
                  </div>
                  {cert.fingerprint && (
                    <div className="cert-row">
                      <span className="cert-label">SHA-256:</span>
                      <span className="cert-val mono">{cert.fingerprint}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Permissions Controls */}
          <div className="security-section">
            <div className="section-header">
              <span className="section-title">Site Permissions</span>
              <button
                className="cert-toggle-btn"
                onClick={() => {
                  onClose();
                  onOpenPermissionsPage();
                }}
              >
                Manage all
              </button>
            </div>

            <div className="permissions-quick-list">
              <div className="perm-item">
                <div className="perm-label">
                  <Camera size={14} className="perm-icon" />
                  <span>Camera</span>
                </div>
                <button
                  className={`perm-decision-pill ${permissions.camera}`}
                  onClick={() => handleTogglePermission('camera')}
                >
                  {permissions.camera.toUpperCase()}
                </button>
              </div>

              <div className="perm-item">
                <div className="perm-label">
                  <Mic size={14} className="perm-icon" />
                  <span>Microphone</span>
                </div>
                <button
                  className={`perm-decision-pill ${permissions.microphone}`}
                  onClick={() => handleTogglePermission('microphone')}
                >
                  {permissions.microphone.toUpperCase()}
                </button>
              </div>

              <div className="perm-item">
                <div className="perm-label">
                  <MapPin size={14} className="perm-icon" />
                  <span>Location</span>
                </div>
                <button
                  className={`perm-decision-pill ${permissions.geolocation}`}
                  onClick={() => handleTogglePermission('geolocation')}
                >
                  {permissions.geolocation.toUpperCase()}
                </button>
              </div>

              <div className="perm-item">
                <div className="perm-label">
                  <Bell size={14} className="perm-icon" />
                  <span>Notifications</span>
                </div>
                <button
                  className={`perm-decision-pill ${permissions.notifications}`}
                  onClick={() => handleTogglePermission('notifications')}
                >
                  {permissions.notifications.toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          {/* Tracking Protection */}
          <div className="security-section">
            <div className="section-header">
              <span className="section-title">Enhanced Tracking Protection</span>
              <span className="tracker-count-badge">
                {securityInfo?.blockedTrackersCount || 0} blocked
              </span>
            </div>
            <div className="tracking-popover-info">
              <div className="tracking-status-row">
                <div className="tracking-desc">
                  {isExcepted ? (
                    <span className="text-warning">Disabled for this site</span>
                  ) : (
                    <span>Active ({trackingSettings?.mode.toUpperCase() || 'STANDARD'})</span>
                  )}
                </div>
                <button
                  className={`tracking-toggle-btn ${isExcepted ? 'disabled' : 'enabled'}`}
                  onClick={handleToggleTracking}
                >
                  {isExcepted ? 'Enable Protection' : 'Pause on this site'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
