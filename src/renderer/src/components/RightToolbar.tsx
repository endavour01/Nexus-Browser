import React from 'react';
import {
  Bookmark,
  Download,
  History,
  Puzzle,
  Settings,
  User,
} from 'lucide-react';
import { InstalledExtension, SidePanelType } from '@shared/types';

export { type SidePanelType };

interface RightToolbarProps {
  activePanel: SidePanelType;
  onTogglePanel: (panel: SidePanelType) => void;
  downloadCount: number;
  bookmarkCount: number;
  extensions?: InstalledExtension[];
  onOpenExtensionPopup?: (id: string) => void;
}

export const RightToolbar: React.FC<RightToolbarProps> = ({
  activePanel,
  onTogglePanel,
  downloadCount,
  bookmarkCount,
  extensions = [],
  onOpenExtensionPopup,
}) => {
  const toggle = (panel: SidePanelType) => {
    if (activePanel === panel) {
      onTogglePanel(null);
    } else {
      onTogglePanel(panel);
    }
  };

  return (
    <aside className="nexus-right-toolbar">
      {/* Bookmarks Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'bookmarks' ? 'active' : ''}`}
        onClick={() => toggle('bookmarks')}
        title="Bookmarks Library (Ctrl+B)"
      >
        <Bookmark size={17} />
        {bookmarkCount > 0 && <span className="toolbar-dot-badge" />}
      </button>

      {/* History Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'history' ? 'active' : ''}`}
        onClick={() => toggle('history')}
        title="Browsing History (Ctrl+H)"
      >
        <History size={17} />
      </button>

      {/* Downloads Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'downloads' ? 'active' : ''}`}
        onClick={() => toggle('downloads')}
        title="Downloads (Ctrl+J)"
      >
        <Download size={17} />
        {downloadCount > 0 && <span className="toolbar-badge">{downloadCount}</span>}
      </button>

      {/* Extension Action Buttons */}
      {extensions
        .filter((ext) => ext.enabled && ext.action?.popup)
        .map((ext) => (
          <button
            key={ext.id}
            className="nexus-icon-btn toolbar-action-btn extension-action-btn"
            onClick={() => onOpenExtensionPopup?.(ext.id)}
            title={`${ext.name}${ext.action?.title ? ` - ${ext.action.title}` : ''}`}
          >
            {ext.iconDataUrl ? (
              <img
                src={ext.iconDataUrl}
                alt={ext.name}
                style={{ width: '16px', height: '16px', borderRadius: '2px', objectFit: 'contain' }}
              />
            ) : (
              <Puzzle size={16} className="text-accent" />
            )}
          </button>
        ))}

      {/* Extensions Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'extensions' ? 'active' : ''}`}
        onClick={() => toggle('extensions')}
        title="Extensions & Tools"
      >
        <Puzzle size={17} />
      </button>

      <div className="toolbar-spacer" />

      {/* Profiles Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'profiles' ? 'active' : ''}`}
        onClick={() => toggle('profiles')}
        title="User Profiles"
      >
        <User size={17} />
      </button>

      {/* Settings Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'settings' ? 'active' : ''}`}
        onClick={() => toggle('settings')}
        title="Browser Settings"
      >
        <Settings size={17} />
      </button>
    </aside>
  );
};
