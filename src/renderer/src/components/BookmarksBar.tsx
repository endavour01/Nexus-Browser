import React, { useState, useRef, useEffect } from 'react';
import { BookmarkItem } from '@shared/types';
import { Folder, Globe, ChevronDown, Plus } from 'lucide-react';

interface BookmarksBarProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
  onOpenBookmarksManager: () => void;
  onCreateFolder: (title: string, parentId?: string | null) => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onOpenBookmarksManager,
  onCreateFolder,
}) => {
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenFolderId(null);
      }
    };
    if (openFolderId) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openFolderId]);

  // Bookmarks on the toolbar (parentId === 'toolbar')
  const toolbarItems = bookmarks.filter((b) => b.parentId === 'toolbar');

  const getFolderChildren = (folderId: string): BookmarkItem[] => {
    return bookmarks.filter((b) => b.parentId === folderId);
  };

  return (
    <div className="nexus-bookmarks-bar" ref={dropdownRef}>
      <div className="bookmarks-bar-items">
        {toolbarItems.map((item) => {
          if (item.type === 'folder') {
            const children = getFolderChildren(item.id);
            const isOpen = openFolderId === item.id;

            return (
              <div key={item.id} className="bookmarks-bar-folder-container">
                <button
                  className={`bookmarks-bar-item folder-btn ${isOpen ? 'active' : ''}`}
                  onClick={() => setOpenFolderId(isOpen ? null : item.id)}
                  title={`${item.title} (${children.length} items)`}
                >
                  <Folder size={12} className="text-accent" />
                  <span className="truncate">{item.title}</span>
                  <ChevronDown size={10} className="text-secondary" />
                </button>

                {isOpen && (
                  <div className="bookmarks-dropdown-menu">
                    {children.length === 0 ? (
                      <div className="dropdown-empty">Folder is empty</div>
                    ) : (
                      children.map((child) => (
                        <div
                          key={child.id}
                          className="dropdown-item"
                          onClick={() => {
                            if (child.type === 'bookmark' && child.url) {
                              onNavigate(child.url);
                              setOpenFolderId(null);
                            }
                          }}
                        >
                          {child.type === 'folder' ? (
                            <Folder size={12} className="text-accent flex-shrink-0" />
                          ) : child.favicon ? (
                            <img
                              src={child.favicon}
                              alt=""
                              className="dropdown-favicon"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Globe size={12} className="text-secondary flex-shrink-0" />
                          )}
                          <span className="dropdown-title truncate">{child.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          }

          // Bookmark link
          return (
            <button
              key={item.id}
              className="bookmarks-bar-item"
              onClick={() => item.url && onNavigate(item.url)}
              title={`${item.title} - ${item.url}`}
            >
              {item.favicon ? (
                <img
                  src={item.favicon}
                  alt=""
                  className="bar-favicon"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe size={12} className="text-secondary flex-shrink-0" />
              )}
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className="bookmarks-bar-actions">
        <button
          className="bookmarks-bar-action-btn"
          onClick={() => {
            const name = prompt('Enter new folder name:');
            if (name && name.trim()) {
              onCreateFolder(name.trim(), 'toolbar');
            }
          }}
          title="Add Folder to Bar"
        >
          <Plus size={11} />
        </button>
        <button
          className="bookmarks-bar-action-btn text-[11px] px-1.5"
          onClick={onOpenBookmarksManager}
          title="Open Bookmarks Manager (nexus://bookmarks)"
        >
          All
        </button>
      </div>
    </div>
  );
};
