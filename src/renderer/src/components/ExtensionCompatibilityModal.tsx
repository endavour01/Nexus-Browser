import React from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  Layers,
  Code2,
} from 'lucide-react';

interface ExtensionCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionCompatibilityModal: React.FC<ExtensionCompatibilityModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="nexus-modal-overlay" onClick={onClose}>
      <div
        className="nexus-modal-content extension-compat-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="nexus-modal-header">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-accent" />
            <h2 className="nexus-modal-title">Electron Extension API Compatibility</h2>
          </div>
          <button className="nexus-icon-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="nexus-modal-body" style={{ overflowY: 'auto' }}>
          <div className="compat-intro-banner">
            <Shield size={18} className="text-accent flex-shrink-0" />
            <p>
              NEXUS builds upon Electron&apos;s native extension architecture. While many popular developer
              tools and privacy content scripts function cleanly, Electron does not implement every
              proprietary Chrome Web Store API or Chromium browser shell feature.
            </p>
          </div>

          {/* Supported APIs */}
          <div className="compat-section">
            <h3 className="compat-section-title text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Supported Chrome Extension APIs</span>
            </h3>
            <div className="compat-grid">
              <div className="compat-card supported">
                <div className="compat-card-title">chrome.runtime</div>
                <p className="compat-card-desc">
                  Full messaging pipeline (sendMessage, onMessage, connect), getURL, getManifest, and lifecycle.
                </p>
              </div>
              <div className="compat-card supported">
                <div className="compat-card-title">chrome.storage</div>
                <p className="compat-card-desc">
                  storage.local, storage.sync, storage.session, and storage.managed for settings persistence.
                </p>
              </div>
              <div className="compat-card supported">
                <div className="compat-card-title">chrome.action / browserAction</div>
                <p className="compat-card-desc">
                  Toolbar popup triggers, icons, titles, and dynamic badge metadata.
                </p>
              </div>
              <div className="compat-card supported">
                <div className="compat-card-title">chrome.contextMenus</div>
                <p className="compat-card-desc">
                  Custom items and hierarchy in web page right-click context menus.
                </p>
              </div>
              <div className="compat-card supported">
                <div className="compat-card-title">chrome.webRequest</div>
                <p className="compat-card-desc">
                  Network request interception, header inspection, and URL blocking.
                </p>
              </div>
              <div className="compat-card supported">
                <div className="compat-card-title">content_scripts & CSS</div>
                <p className="compat-card-desc">
                  Matches patterns, isolated world DOM script injection, and stylesheet insertion.
                </p>
              </div>
              <div className="compat-card supported">
                <div className="compat-card-title">chrome.cookies</div>
                <p className="compat-card-desc">
                  Querying and updating HTTP cookie jars across matching origins.
                </p>
              </div>
              <div className="compat-card supported">
                <div className="compat-card-title">chrome.devtools</div>
                <p className="compat-card-desc">
                  Developer panels, inspect elements, and custom debugging extensions (React DevTools, etc.).
                </p>
              </div>
            </div>
          </div>

          {/* Unsupported APIs */}
          <div className="compat-section">
            <h3 className="compat-section-title text-rose-400">
              <XCircle size={16} />
              <span>Unsupported or Browser-Specific APIs</span>
            </h3>
            <div className="compat-grid">
              <div className="compat-card unsupported">
                <div className="compat-card-title">Chrome Web Store / CRX Auto-Install</div>
                <p className="compat-card-desc">
                  Extensions must be installed unpacked from local directory folders.
                </p>
              </div>
              <div className="compat-card unsupported">
                <div className="compat-card-title">chrome.bookmarks & chrome.history</div>
                <p className="compat-card-desc">
                  NEXUS manages its own independent bookmarks and history storage engines.
                </p>
              </div>
              <div className="compat-card unsupported">
                <div className="compat-card-title">chrome.downloads & chrome.omnibox</div>
                <p className="compat-card-desc">
                  Address bar keywords and native Chromium download managers are not bound.
                </p>
              </div>
              <div className="compat-card unsupported">
                <div className="compat-card-title">chrome.identity & Google Sync</div>
                <p className="compat-card-desc">
                  Google Account login sync and Chrome Web Store license payments are unavailable.
                </p>
              </div>
            </div>
          </div>

          {/* Developer Guidance */}
          <div className="compat-advice-box">
            <div className="flex items-center gap-2 mb-1">
              <Code2 size={16} className="text-accent" />
              <span className="font-medium text-xs text-primary">Power-User Developer Advice</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              If you are testing or porting an extension to NEXUS, prefer Manifest V3 using standard
              `chrome.storage`, `content_scripts`, and `chrome.action.default_popup`. Ensure your
              `manifest.json` does not declare unneeded permissions such as `bookmarks` or `management`.
            </p>
          </div>
        </div>

        <div className="nexus-modal-footer">
          <button className="nexus-btn nexus-btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
