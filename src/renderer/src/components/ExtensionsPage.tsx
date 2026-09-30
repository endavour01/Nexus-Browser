import React, { useState, useMemo } from 'react';
import {
  FolderPlus,
  HelpCircle,
  Search,
  RotateCw,
  Trash2,
  ExternalLink,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Folder,
  ShieldAlert,
  Code2,
  Lock,
} from 'lucide-react';
import { InstalledExtension } from '@shared/types';

interface ExtensionsPageProps {
  extensions: InstalledExtension[];
  onInstallUnpacked: () => void;
  onToggleExtension: (id: string, enabled: boolean) => void;
  onReloadExtension: (id: string) => void;
  onUninstallExtension: (id: string) => void;
  onOpenPopup: (id: string) => void;
  onOpenCompatibility: () => void;
}

const ExtensionsPageComponent: React.FC<ExtensionsPageProps> = ({
  extensions,
  onInstallUnpacked,
  onToggleExtension,
  onReloadExtension,
  onUninstallExtension,
  onOpenPopup,
  onOpenCompatibility,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExtensions = useMemo(() => {
    if (!searchQuery.trim()) return extensions;
    const q = searchQuery.toLowerCase().trim();
    return extensions.filter(
      (ext) =>
        ext.name.toLowerCase().includes(q) ||
        ext.description.toLowerCase().includes(q) ||
        ext.id.toLowerCase().includes(q) ||
        ext.permissions.some((p) => p.toLowerCase().includes(q))
    );
  }, [extensions, searchQuery]);

  return (
    <div className="nexus-extensions-page">
      {/* Top Header */}
      <div className="extensions-page-header">
        <div className="extensions-page-title-wrap">
          <div className="flex items-center gap-2">
            <Layers className="text-accent" size={24} />
            <h1 className="extensions-page-title">Extensions & Plugins</h1>
          </div>
          <p className="extensions-page-subtitle">
            Manage local unpacked extensions
          </p>
        </div>

        <div className="extensions-header-actions">
          <button className="nexus-btn nexus-btn-secondary" onClick={onOpenCompatibility}>
            <HelpCircle size={15} />
            <span>Compatibility Guide</span>
          </button>
          <button className="nexus-btn nexus-btn-primary" onClick={onInstallUnpacked}>
            <FolderPlus size={15} />
            <span>Load Unpacked</span>
          </button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="extensions-filter-bar">
        <div className="extensions-search-box">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder="Search installed extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="extensions-search-input"
          />
          {searchQuery && (
            <button
              className="text-xs text-muted hover:text-primary mr-1"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>

        <div className="extensions-stats">
          <span className="stats-pill">
            {extensions.length} {extensions.length === 1 ? 'Extension' : 'Extensions'}
          </span>
          <span className="stats-pill active">
            {extensions.filter((e) => e.enabled).length} Enabled
          </span>
        </div>
      </div>

      {/* Main Extension List Grid */}
      <div className="extensions-page-content">
        {filteredExtensions.length === 0 ? (
          <div className="extensions-empty-state">
            <div className="empty-icon-box">
              <Layers size={36} className="text-accent" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="empty-title">No extensions found</h3>
                <p className="empty-desc">
                  No installed extensions matched &ldquo;{searchQuery}&rdquo;. Try another search term.
                </p>
                <button
                  className="nexus-btn nexus-btn-secondary mt-3"
                  onClick={() => setSearchQuery('')}
                >
                  Reset search
                </button>
              </>
            ) : (
              <>
                <h3 className="empty-title">No Extensions Installed</h3>
                <p className="empty-desc">
                  Load compatible unpacked Manifest V2 or V3 extensions directly from your local folder.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button className="nexus-btn nexus-btn-primary" onClick={onInstallUnpacked}>
                    <FolderPlus size={15} />
                    <span>Load Unpacked Extension</span>
                  </button>
                  <button className="nexus-btn nexus-btn-secondary" onClick={onOpenCompatibility}>
                    <HelpCircle size={15} />
                    <span>View Supported APIs</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="extensions-grid">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.id}
                className={`nexus-ext-card ${ext.enabled ? 'enabled' : 'disabled'} ${
                  ext.error ? 'has-error' : ''
                }`}
              >
                {/* Error Banner */}
                {ext.error && (
                  <div className="ext-card-error">
                    <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                    <span className="truncate" title={ext.error}>
                      {ext.error}
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div className="ext-card-header">
                  <div className="ext-card-icon-wrap">
                    {ext.iconDataUrl ? (
                      <img src={ext.iconDataUrl} alt={ext.name} className="ext-card-img" />
                    ) : (
                      <div className="ext-card-img-placeholder">
                        <Layers size={20} className="text-accent" />
                      </div>
                    )}
                  </div>

                  <div className="ext-card-meta">
                    <div className="flex items-center gap-2">
                      <h3 className="ext-card-name" title={ext.name}>
                        {ext.name}
                      </h3>
                      <span className="ext-badge-ver">v{ext.version}</span>
                      <span className="ext-badge-mv">MV{ext.manifestVersion}</span>
                    </div>
                    <div className="ext-card-id" title={ext.id}>
                      ID: <code>{ext.id}</code>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="ext-toggle-wrap">
                    <label className="nexus-switch" title={ext.enabled ? 'Disable' : 'Enable'}>
                      <input
                        type="checkbox"
                        checked={ext.enabled}
                        onChange={(e) => onToggleExtension(ext.id, e.target.checked)}
                      />
                      <span className="nexus-slider" />
                    </label>
                  </div>
                </div>

                {/* Description */}
                <p className="ext-card-desc">{ext.description || 'No description provided.'}</p>

                {/* Compatibility and Path */}
                <div className="ext-card-details">
                  <div className="flex items-center gap-2">
                    {ext.compatibility.status === 'compatible' ? (
                      <span className="compat-pill green">
                        <CheckCircle2 size={12} />
                        <span>Compatible</span>
                      </span>
                    ) : (
                      <span
                        className="compat-pill amber"
                        title={ext.compatibility.notes.join('\n')}
                      >
                        <AlertTriangle size={12} />
                        <span>Partial Support</span>
                      </span>
                    )}

                    {ext.action?.popup && (
                      <span className="compat-pill violet" title="Provides toolbar popup">
                        Action Popup
                      </span>
                    )}
                  </div>

                  <div className="ext-path-line" title={ext.path}>
                    <Folder size={12} className="text-muted flex-shrink-0" />
                    <span className="truncate">{ext.path}</span>
                  </div>
                </div>

                {/* Permissions list */}
                {ext.permissions.length > 0 && (
                  <div className="ext-permissions-wrap">
                    <span className="text-[10px] uppercase font-semibold text-muted tracking-wider">
                      Permissions:
                    </span>
                    <div className="ext-perm-tags">
                      {ext.permissions.slice(0, 5).map((p, idx) => (
                        <span key={idx} className="ext-perm-tag">
                          {p}
                        </span>
                      ))}
                      {ext.permissions.length > 5 && (
                        <span className="ext-perm-tag more">
                          +{ext.permissions.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="ext-card-footer">
                  <div className="flex items-center gap-2">
                    {ext.action?.popup && ext.enabled && (
                      <button
                        className="nexus-btn-sm nexus-btn-secondary"
                        onClick={() => onOpenPopup(ext.id)}
                        title="Open Extension Action Popup"
                      >
                        <ExternalLink size={13} />
                        <span>Popup</span>
                      </button>
                    )}
                    <button
                      className="nexus-btn-sm nexus-btn-secondary"
                      onClick={() => onReloadExtension(ext.id)}
                      title="Reload Extension"
                    >
                      <RotateCw size={13} />
                      <span>Reload</span>
                    </button>
                  </div>

                  <button
                    className="nexus-btn-sm nexus-btn-danger"
                    onClick={() => onUninstallExtension(ext.id)}
                    title="Remove Extension"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ExtensionsPage = React.memo<ExtensionsPageProps>(ExtensionsPageComponent);
