import React from 'react';
import {
  Bookmark,
  Download,
  Puzzle,
  Settings,
  User,
} from 'lucide-react';

export type SidePanelType = 'bookmarks' | 'downloads' | 'extensions' | 'profiles' | 'settings' | null;

interface RightToolbarProps {
  activePanel: SidePanelType;
  onTogglePanel: (panel: SidePanelType) => void;
  downloadCount: number;
  bookmarkCount: number;
}

export const RightToolbar: React.FC<RightToolbarProps> = ({
  activePanel,
  onTogglePanel,
  downloadCount,
  bookmarkCount,
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
      {/* Extensions Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'extensions' ? 'active' : ''}`}
        onClick={() => toggle('extensions')}
        title="Extensions & Tools"
      >
        <Puzzle size={17} />
      </button>

      {/* Downloads Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'downloads' ? 'active' : ''}`}
        onClick={() => toggle('downloads')}
        title="Downloads"
      >
        <Download size={17} />
        {downloadCount > 0 && <span className="toolbar-badge">{downloadCount}</span>}
      </button>

      {/* Bookmarks Button */}
      <button
        className={`nexus-icon-btn toolbar-action-btn ${activePanel === 'bookmarks' ? 'active' : ''}`}
        onClick={() => toggle('bookmarks')}
        title="Bookmarks Library (Ctrl+B)"
      >
        <Bookmark size={17} />
        {bookmarkCount > 0 && <span className="toolbar-dot-badge" />}
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
