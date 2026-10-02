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

  const handleOpenChromeWebStore = () => {
    const url = 'https://chromewebstore.google.com';
    if (typeof window !== 'undefined' && window.nexusAPI?.createTab) {
      window.nexusAPI.createTab(url);
    } else {
      window.open(url, '_blank');
    }
  };

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
            Manage local unpacked extensions & Chrome Web Store addons
          </p>
        </div>

        <div className="extensions-header-actions">
          <button className="nexus-btn nexus-btn-secondary" onClick={handleOpenChromeWebStore}>
            <ExternalLink size={15} />
            <span>Chrome Web Store</span>
          </button>
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

      {/* Chrome Web Store & Installation Instructions Card */}
      <div className="p-4 mb-4 rounded-lg border border-border-subtle bg-surface/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">Download Extensions from Chrome Web Store</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">Manifest V2 / V3</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Find extensions on the Chrome Web Store, extract the extension files, and click Load Unpacked to apply them in Nexus.
            </p>
          </div>
          <button
            className="nexus-btn nexus-btn-primary nexus-btn-sm shrink-0 flex items-center gap-1.5"
            onClick={handleOpenChromeWebStore}
          >
            <ExternalLink size={13} />
            <span>Open Chrome Web Store</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border-subtle/60 text-xs">
          <div className="flex items-start gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-[11px] shrink-0">1</span>
            <div className="text-muted-foreground">
              <strong className="text-foreground block font-medium">Find Extension</strong>
              Browse the <button onClick={handleOpenChromeWebStore} className="text-accent underline inline-block">Chrome Web Store</button> and find your desired tool or theme.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-[11px] shrink-0">2</span>
            <div className="text-muted-foreground">
              <strong className="text-foreground block font-medium">Download & Extract</strong>
              Download the extension files (or extract using a CRX extractor) into a local folder.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-[11px] shrink-0">3</span>
            <div className="text-muted-foreground">
              <strong className="text-foreground block font-medium">Load in Nexus</strong>
              Click <strong className="text-foreground">&ldquo;Load Unpacked&rdquo;</strong> above and select the folder with <code className="text-accent text-[11px] bg-secondary/15 px-1 py-0.5 rounded">manifest.json</code>.
            </div>
          </div>
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
                  Browse the Chrome Web Store or add an unpacked extension from your device.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <button className="nexus-btn nexus-btn-secondary" onClick={handleOpenChromeWebStore}>
                    <ExternalLink size={15} />
                    <span>Chrome Web Store</span>
                  </button>
                  <button className="nexus-btn nexus-btn-primary" onClick={onInstallUnpacked}>
                    <FolderPlus size={15} />
                    <span>Load Unpacked Extension</span>
                  </button>
                  <button className="nexus-btn nexus-btn-secondary" onClick={onOpenCompatibility}>
                    <HelpCircle size={15} />
                    <span>Extension support</span>
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
