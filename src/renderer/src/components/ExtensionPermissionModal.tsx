import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Folder,
  Layers,
  X,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ExtensionValidationResult } from '@shared/types';

interface ExtensionPermissionModalProps {
  isOpen: boolean;
  validation: ExtensionValidationResult | null;
  onConfirm: () => void;
  onCancel: () => void;
  isInstalling?: boolean;
}

export const ExtensionPermissionModal: React.FC<ExtensionPermissionModalProps> = ({
  isOpen,
  validation,
  onConfirm,
  onCancel,
  isInstalling = false,
}) => {
  if (!isOpen || !validation) return null;

  const hasHighRisk = validation.warnings.some((w) => w.severity === 'high');

  return (
    <div className="nexus-modal-overlay" onClick={onCancel}>
      <div
        className="nexus-modal-content extension-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="nexus-modal-header">
          <div className="flex items-center gap-2">
            {hasHighRisk ? (
              <ShieldAlert className="text-amber-400" size={20} />
            ) : (
              <ShieldCheck className="text-accent" size={20} />
            )}
            <h2 className="nexus-modal-title">Install Unpacked Extension</h2>
          </div>
          <button className="nexus-icon-btn" onClick={onCancel} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="nexus-modal-body">
          {/* Extension Header Info */}
          <div className="extension-install-meta">
            {validation.iconDataUrl ? (
              <img
                src={validation.iconDataUrl}
                alt={validation.name}
                className="extension-install-icon"
              />
            ) : (
              <div className="extension-install-icon-placeholder">
                <Layers size={22} className="text-accent" />
              </div>
            )}
            <div className="extension-install-details">
              <div className="flex items-center gap-2">
                <span className="extension-install-name">{validation.name}</span>
                <span className="extension-version-pill">v{validation.version}</span>
                <span className="extension-mv-pill">MV{validation.manifestVersion}</span>
              </div>
              {validation.description && (
                <p className="extension-install-desc">{validation.description}</p>
              )}
            </div>
          </div>

          {/* Directory path */}
          <div className="extension-install-path">
            <Folder size={14} className="text-muted flex-shrink-0" />
            <span className="truncate" title={validation.path}>
              {validation.path}
            </span>
          </div>

          {/* Compatibility Assessment */}
          <div className="extension-compatibility-box">
            <div className="flex items-center gap-2">
              {validation.compatibility.status === 'compatible' ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={16} className="text-amber-400" />
              )}
              <span className="font-medium text-xs">
                {validation.compatibility.status === 'compatible'
                  ? 'Ready to install'
                  : 'Partial Compatibility Notice'}
              </span>
            </div>
            {validation.compatibility.notes.length > 0 && (
              <ul className="extension-compat-notes">
                {validation.compatibility.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Permissions Warning Section */}
          <div className="extension-permissions-section">
            <h3 className="extension-section-title">
              Permissions Requested ({validation.warnings.length || validation.permissions.length})
            </h3>

            {validation.warnings.length > 0 ? (
              <div className="extension-warnings-list">
                {validation.warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className={`extension-warning-card severity-${warn.severity}`}
                  >
                    <div className="warning-card-header">
                      <span className="warning-title">{warn.title}</span>
                      <span className={`warning-severity-badge badge-${warn.severity}`}>
                        {warn.severity}
                      </span>
                    </div>
                    <p className="warning-desc">{warn.description}</p>
                    <code className="warning-perm-code">{warn.permission}</code>
                  </div>
                ))}
              </div>
            ) : (
              <div className="extension-safe-notice">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>No sensitive host or network permissions requested.</span>
              </div>
            )}
          </div>

          {/* Security Disclaimer */}
          <div className="extension-security-disclaimer">
            <p>
              NEXUS does not silently grant permissions. Only install unpacked extensions from
              sources you trust.
            </p>
          </div>
        </div>

        <div className="nexus-modal-footer">
          <button className="nexus-btn nexus-btn-secondary" onClick={onCancel} disabled={isInstalling}>
            Cancel
          </button>
          <button
            className="nexus-btn nexus-btn-primary"
            onClick={onConfirm}
            disabled={isInstalling}
          >
            {isInstalling ? 'Installing...' : 'Grant Permissions & Install'}
          </button>
        </div>
      </div>
    </div>
  );
};
