import React, { useState, useMemo, useRef } from 'react';
import { BookmarkItem } from '@shared/types';
import {
  Bookmark as BookmarkIcon,
  Folder,
  FolderPlus,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  Globe,
  ArrowUpDown,
} from 'lucide-react';
import { BookmarkEditModal } from './BookmarkEditModal';
import { NexusState } from './NexusState';

interface BookmarksPageProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
  onSaveBookmark: (item: {
    id?: string;
    title: string;
    url?: string;
    favicon?: string;
    parentId?: string | null;
    type?: 'bookmark' | 'folder';
  }) => Promise<void>;
  onCreateFolder: (title: string, parentId?: string | null) => Promise<BookmarkItem>;
  onRemoveBookmark: (id: string) => Promise<void>;
  onExportHtml: () => Promise<string>;
  onImportHtml: (htmlContent: string) => Promise<{ imported: number }>;
}

type SortOrder = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc' | 'url';

const BookmarksPageComponent: React.FC<BookmarksPageProps> = ({
  bookmarks,
  onNavigate,
  onSaveBookmark,
  onCreateFolder,
  onRemoveBookmark,
  onExportHtml,
  onImportHtml,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('toolbar');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = useMemo(() => {
    return bookmarks.filter((b) => b.type === 'folder');
  }, [bookmarks]);

  // Compute children counts per folder
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bookmarks) {
      if (b.parentId) {
        counts.set(b.parentId, (counts.get(b.parentId) || 0) + 1);
      }
    }
    return counts;
  }, [bookmarks]);

  // Items to display in the main panel
  const displayedItems = useMemo(() => {
    let items: BookmarkItem[];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || (b.url && b.url.toLowerCase().includes(q))
      );
    } else {
      items = bookmarks.filter((b) => b.parentId === selectedFolderId);
    }

    // Sort items (folders first, then by sortOrder)
    return [...items].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      switch (sortOrder) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'date-desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'date-asc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'url':
          return (a.url || '').localeCompare(b.url || '');
        default:
          return 0;
      }
    });
  }, [bookmarks, selectedFolderId, searchQuery, sortOrder]);

  const activeFolder = useMemo(() => {
    return folders.find((f) => f.id === selectedFolderId) || {
      id: selectedFolderId,
      title: 'Bookmarks',
    };
  }, [folders, selectedFolderId]);

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:');
    if (name && name.trim()) {
      await onCreateFolder(name.trim(), selectedFolderId);
    }
  };

  const handleAddBookmark = () => {
    setEditingBookmark(null);
    setIsEditModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const html = await onExportHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_bookmarks_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export bookmarks:', err);
      alert('Error exporting bookmarks HTML');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await onImportHtml(text);
      alert(`Successfully imported ${result.imported} bookmarks!`);
    } catch (err) {
      console.error('Failed to import bookmarks:', err);
      alert('Failed to parse bookmarks HTML file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="nexus-manager-page">
      {/* Hidden File Input for Netscape HTML Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".html,.htm"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* Top Banner */}
      <div className="nexus-page-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-accent">
            <BookmarkIcon size={20} />
          </div>
          <div>
            <h1 className="nexus-page-title">Bookmarks Manager</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="nexus-btn-sm nexus-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm cursor-pointer"
            onClick={handleAddBookmark}
          >
            <Plus size={13} />
            <span>Add Bookmark</span>
          </button>
        </div>
      </div>

      {/* Content Split: Sidebar Tree & Items List */}
      <div className="nexus-manager-body">
        {/* Left: Folders Sidebar */}
        <div className="nexus-manager-sidebar">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">
            <span>Folders</span>
            <button
              type="button"
              className="ml-auto px-2.5 py-1 rounded-md bg-[#191D28] hover:bg-[#222838] text-[#F4F4F5] border border-[#272C3D] transition-colors flex items-center gap-1.5 text-xs font-medium mr-1.5 shadow-sm cursor-pointer"
              onClick={handleCreateFolder}
              title="Create new folder"
            >
              <FolderPlus size={13} />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-0.5">
            {/* Standard Roots */}
            <div
              className={`folder-tree-item ${selectedFolderId === 'toolbar' ? 'active' : ''}`}
              onClick={() => {
                setSelectedFolderId('toolbar');
                setSearchQuery('');
              }}
            >
              <Folder size={13} className="text-accent flex-shrink-0" />
              <span className="truncate flex-1">Bookmarks Bar</span>
              <span className="folder-count">{folderCounts.get('toolbar') || 0}</span>
            </div>

            <div
              className={`folder-tree-item ${selectedFolderId === 'other' ? 'active' : ''}`}
              onClick={() => {
                setSelectedFolderId('other');
                setSearchQuery('');
              }}
            >
              <Folder size={13} className="text-secondary flex-shrink-0" />
              <span className="truncate flex-1">Other Bookmarks</span>
              <span className="folder-count">{folderCounts.get('other') || 0}</span>
            </div>

            {/* Custom User Folders */}
            {folders
              .filter((f) => f.id !== 'toolbar' && f.id !== 'other')
              .map((folder) => (
                <div
                  key={folder.id}
                  className={`folder-tree-item ${selectedFolderId === folder.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setSearchQuery('');
                  }}
                >
                  <Folder size={13} className="text-accent flex-shrink-0" />
                  <span className="truncate flex-1">{folder.title}</span>
                  <span className="folder-count">{folderCounts.get(folder.id) || 0}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Right: Items Main Panel */}
        <div className="nexus-manager-main">
          {/* Controls Bar: Search & Sort */}
          <div className="manager-toolbar">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">{activeFolder.title}</span>
              <span className="text-xs text-muted">({displayedItems.length} items)</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="panel-search-box max-w-[240px]">
                <Search size={13} className="panel-search-icon" />
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="panel-search-input"
                />
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 text-xs text-secondary ml-1">
                <ArrowUpDown size={12} className="text-[#9298A8]" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="nexus-select text-xs py-1.5 px-3 rounded-md bg-[#12151D] hover:bg-[#1A1E29] border border-[#1C202C] hover:border-[#272C3D] text-[#F4F4F5] font-medium cursor-pointer transition-colors outline-none shadow-sm"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="url">URL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Table / List */}
          <div className="manager-items-container">
            {displayedItems.length === 0 ? (
              <NexusState
                variant="empty"
                title="No bookmarks found in this folder"
                description={searchQuery ? `No bookmarks matched "${searchQuery}".` : undefined}
                action={
                  <button
                    className="nexus-btn-sm nexus-btn-primary flex items-center gap-1.5 text-xs"
                    onClick={handleAddBookmark}
                  >
                    <Plus size={12} />
                    <span>Add your first bookmark</span>
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {displayedItems.map((item) => (
                  <div
                    key={item.id}
                    className="manager-item-row group hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    {/* Item Icon */}
                    <div className="flex-shrink-0">
                      {item.type === 'folder' ? (
                        <Folder size={15} className="text-accent" />
                      ) : item.favicon ? (
                        <img
                          src={item.favicon}
                          alt=""
                          className="w-4 h-4 rounded-sm object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe size={15} className="text-secondary" />
                      )}
                    </div>

                    {/* Title & URL / Subtitle */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        if (item.type === 'folder') {
                          setSelectedFolderId(item.id);
                        } else if (item.url) {
                          onNavigate(item.url);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary hover:text-accent truncate">
                          {item.title}
                        </span>
                        {item.type === 'folder' && (
                          <span className="text-[10px] text-muted">
                            ({folderCounts.get(item.id) || 0} items)
                          </span>
                        )}
                      </div>
                      {item.url && (
                        <span className="text-[11px] text-secondary font-mono truncate block">
                          {item.url}
                        </span>
                      )}
                    </div>

                    {/* Date Tag */}
                    <div className="text-[10px] text-muted whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.url && (
                        <button
                          className="nexus-icon-btn text-muted hover:text-primary"
                          onClick={() => onNavigate(item.url!)}
                          title="Open URL"
                        >
                          <ExternalLink size={13} />
                        </button>
                      )}
                      <button
                        className="nexus-icon-btn text-muted hover:text-primary"
                        onClick={() => {
                          setEditingBookmark(item);
                          setIsEditModalOpen(true);
                        }}
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="nexus-icon-btn text-muted hover:text-red-400"
                        onClick={() => onRemoveBookmark(item.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Bookmark Modal */}
      <BookmarkEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBookmark(null);
        }}
        bookmark={editingBookmark}
        folders={folders}
        onSave={onSaveBookmark}
        onRemove={onRemoveBookmark}
        onCreateFolder={onCreateFolder}
      />
    </div>
  );
};

export const BookmarksPage = React.memo<BookmarksPageProps>(BookmarksPageComponent);
