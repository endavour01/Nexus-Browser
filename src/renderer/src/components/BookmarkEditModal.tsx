import React, { useState, useEffect } from 'react';
import { BookmarkItem } from '@shared/types';
import { X, Star, Trash2, FolderPlus } from 'lucide-react';

interface BookmarkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmark: BookmarkItem | null;
  folders: BookmarkItem[];
  currentUrl?: string;
  currentTitle?: string;
  currentFavicon?: string;
  onSave: (item: {
    id?: string;
    title: string;
    url?: string;
    favicon?: string;
    parentId?: string | null;
    type?: 'bookmark' | 'folder';
  }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onCreateFolder: (title: string, parentId?: string | null) => Promise<BookmarkItem>;
}

export const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({
  isOpen,
  onClose,
  bookmark,
  folders,
  currentUrl,
  currentTitle,
  currentFavicon,
  onSave,
  onRemove,
  onCreateFolder,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [parentId, setParentId] = useState<string>('toolbar');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url || '');
      setParentId(bookmark.parentId || 'toolbar');
    } else {
      setTitle(currentTitle || currentUrl || '');
      setUrl(currentUrl || '');
      setParentId('toolbar');
    }
    setIsCreatingFolder(false);
    setNewFolderName('');
  }, [bookmark, currentTitle, currentUrl, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setSaving(true);
    try {
      let targetParent = parentId;
      if (isCreatingFolder && newFolderName.trim()) {
        const folder = await onCreateFolder(newFolderName.trim(), parentId);
        targetParent = folder.id;
      }

      await onSave({
        id: bookmark ? bookmark.id : undefined,
        title: title.trim(),
        url: url.trim(),
        favicon: bookmark?.favicon || currentFavicon,
        parentId: targetParent,
        type: 'bookmark',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (bookmark) {
      setSaving(true);
      try {
        await onRemove(bookmark.id);
        onClose();
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="nexus-modal-overlay" onClick={onClose}>
      <div className="nexus-modal-card max-w-[440px]" onClick={(e) => e.stopPropagation()}>
        <div className="nexus-modal-header">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-accent fill-accent" />
            <h3 className="text-sm font-semibold text-primary">
              {bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
            </h3>
          </div>
          <button className="nexus-icon-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-secondary block mb-1">Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="nexus-input w-full text-xs"
              placeholder="Bookmark name"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-secondary block mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="nexus-input w-full text-xs font-mono text-[11px]"
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-secondary">Folder</label>
              <button
                type="button"
                className="text-[10px] text-accent hover:underline flex items-center gap-1"
                onClick={() => setIsCreatingFolder((prev) => !prev)}
              >
                <FolderPlus size={11} />
                <span>{isCreatingFolder ? 'Cancel New Folder' : 'New Folder'}</span>
              </button>
            </div>

            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="nexus-input w-full text-xs bg-[#191D28]"
            >
              <option value="toolbar">Bookmarks Bar</option>
              <option value="other">Other Bookmarks</option>
              {folders
                .filter((f) => f.id !== 'toolbar' && f.id !== 'other')
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.title}
                  </option>
                ))}
            </select>

            {isCreatingFolder && (
              <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Subfolder name..."
                  className="nexus-input w-full text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
            {bookmark ? (
              <button
                type="button"
                className="nexus-btn-danger text-xs flex items-center gap-1.5 px-3 py-1.5"
                onClick={handleRemove}
                disabled={saving}
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="nexus-btn-secondary text-xs px-3 py-1.5"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="nexus-btn-primary text-xs px-4 py-1.5 font-medium"
                disabled={saving || !title.trim() || !url.trim()}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
