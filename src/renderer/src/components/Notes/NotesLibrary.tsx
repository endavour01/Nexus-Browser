import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Folder,
  FolderPlus,
  Plus,
  Star,
  Pin,
  Archive,
  Trash2,
  Search,
  Tag,
  Calendar,
  FileText,
  MoreVertical,
  Copy,
  RotateCcw,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { NexusNote, NexusNotebook, NexusFolder } from '@shared/types';

interface NotesLibraryProps {
  notes: NexusNote[];
  notebooks: NexusNotebook[];
  folders: NexusFolder[];
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: (notebookId?: string, folderId?: string | null) => void;
  onDuplicateNote: (noteId: string) => void;
  onDeleteNote: (noteId: string, permanent?: boolean) => void;
  onRestoreNote: (noteId: string) => void;
  onPurgeNote: (noteId: string) => void;
  onEmptyTrash: () => void;
  onTogglePin: (note: NexusNote) => void;
  onToggleFavorite: (note: NexusNote) => void;
  onToggleArchive: (note: NexusNote) => void;
  onCreateNotebook: (name: string, color?: string) => void;
  onDeleteNotebook: (notebookId: string) => void;
  onCreateFolder: (name: string, notebookId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

type NavigationCategory = 'all' | 'favorites' | 'pinned' | 'archived' | 'trash';

export const NotesLibrary: React.FC<NotesLibraryProps> = ({
  notes,
  notebooks,
  folders,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDuplicateNote,
  onDeleteNote,
  onRestoreNote,
  onPurgeNote,
  onEmptyTrash,
  onTogglePin,
  onToggleFavorite,
  onToggleArchive,
  onCreateNotebook,
  onDeleteNotebook,
  onCreateFolder,
  onDeleteFolder,
}) => {
  const [category, setCategory] = useState<NavigationCategory>('all');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);

  // Compute counts
  const counts = useMemo(() => {
    const nonTrash = notes.filter((n) => !n.inTrash);
    return {
      all: nonTrash.filter((n) => !n.isArchived).length,
      favorites: nonTrash.filter((n) => n.isFavorite && !n.isArchived).length,
      pinned: nonTrash.filter((n) => n.isPinned && !n.isArchived).length,
      archived: nonTrash.filter((n) => n.isArchived).length,
      trash: notes.filter((n) => n.inTrash).length,
    };
  }, [notes]);

  // Extract all distinct tags with counts
  const tagList = useMemo(() => {
    const map = new Map<string, number>();
    notes
      .filter((n) => !n.inTrash && !n.isArchived)
      .forEach((n) => {
        (n.tags || []).forEach((t) => {
          const lower = t.toLowerCase();
          map.set(lower, (map.get(lower) || 0) + 1);
        });
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Filter notes based on category, notebook, folder, tag, search
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Trash view
      if (category === 'trash') {
        if (!note.inTrash) return false;
      } else {
        if (note.inTrash) return false;
        if (category === 'archived') {
          if (!note.isArchived) return false;
        } else {
          if (note.isArchived) return false;
          if (category === 'favorites' && !note.isFavorite) return false;
          if (category === 'pinned' && !note.isPinned) return false;
        }
      }

      // Notebook filter
      if (selectedNotebookId && note.notebookId !== selectedNotebookId) {
        return false;
      }

      // Folder filter
      if (selectedFolderId !== null && note.folderId !== selectedFolderId) {
        return false;
      }

      // Tag filter
      if (selectedTag && (!note.tags || !note.tags.some((t) => t.toLowerCase() === selectedTag))) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = note.title.toLowerCase().includes(q);
        const contentMatch = note.content.toLowerCase().includes(q);
        const tagMatch = note.tags && note.tags.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [notes, category, selectedNotebookId, selectedFolderId, selectedTag, searchQuery]);

  // Sort notes
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'created') {
        return b.createdAt - a.createdAt;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [filteredNotes, sortBy]);

  const toggleNotebookExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotebooks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateNewNotebookPrompt = () => {
    const name = prompt('Enter notebook name:');
    if (name && name.trim()) {
      onCreateNotebook(name.trim());
    }
  };

  const handleCreateNewFolderPrompt = (notebookId: string) => {
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      onCreateFolder(name.trim(), notebookId);
    }
  };

  const getCleanSnippet = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 95);
  };

  return (
    <div className="notes-library-container">
      {/* Column 1: Left Navigation Drawer */}
      <aside className="notes-nav-column">
        {/* Navigation Categories */}
        <div className="notes-nav-section">
          <button
            className={`nav-category-item ${category === 'all' && !selectedNotebookId && !selectedTag ? 'active' : ''}`}
            onClick={() => {
              setCategory('all');
              setSelectedNotebookId(null);
              setSelectedFolderId(null);
              setSelectedTag(null);
            }}
          >
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>All Notes</span>
            </div>
            <span className="count-badge">{counts.all}</span>
          </button>

          <button
            className={`nav-category-item ${category === 'favorites' ? 'active' : ''}`}
            onClick={() => {
              setCategory('favorites');
              setSelectedNotebookId(null);
              setSelectedFolderId(null);
              setSelectedTag(null);
            }}
          >
            <div className="flex items-center gap-2">
              <Star size={16} className="text-warning" />
              <span>Favorites</span>
            </div>
            <span className="count-badge">{counts.favorites}</span>
          </button>

          <button
            className={`nav-category-item ${category === 'pinned' ? 'active' : ''}`}
            onClick={() => {
              setCategory('pinned');
              setSelectedNotebookId(null);
              setSelectedFolderId(null);
              setSelectedTag(null);
            }}
          >
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-accent" />
              <span>Pinned</span>
            </div>
            <span className="count-badge">{counts.pinned}</span>
          </button>

          <button
            className={`nav-category-item ${category === 'archived' ? 'active' : ''}`}
            onClick={() => {
              setCategory('archived');
              setSelectedNotebookId(null);
              setSelectedFolderId(null);
              setSelectedTag(null);
            }}
          >
            <div className="flex items-center gap-2">
              <Archive size={16} />
              <span>Archived</span>
            </div>
            <span className="count-badge">{counts.archived}</span>
          </button>

          <button
            className={`nav-category-item ${category === 'trash' ? 'active' : ''}`}
            onClick={() => {
              setCategory('trash');
              setSelectedNotebookId(null);
              setSelectedFolderId(null);
              setSelectedTag(null);
            }}
          >
            <div className="flex items-center gap-2">
              <Trash2 size={16} className="text-danger" />
              <span>Recycle Bin</span>
            </div>
            <span className="count-badge">{counts.trash}</span>
          </button>
        </div>

        <div className="nav-divider" />

        {/* Notebooks Section */}
        <div className="notes-nav-section">
          <div className="section-header">
            <span className="section-title">Notebooks</span>
            <button
              className="nexus-icon-btn btn-xs"
              onClick={handleCreateNewNotebookPrompt}
              title="Create Notebook"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="notebooks-tree">
            {notebooks.map((nb) => {
              const nbFolders = folders.filter((f) => f.notebookId === nb.id);
              const isExpanded = !!expandedNotebooks[nb.id];
              const isSelected = selectedNotebookId === nb.id && selectedFolderId === null;

              return (
                <div key={nb.id} className="notebook-tree-node">
                  <div
                    className={`notebook-tree-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedNotebookId(nb.id);
                      setSelectedFolderId(null);
                      setSelectedTag(null);
                      setCategory('all');
                    }}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {nbFolders.length > 0 ? (
                        <button
                          className="expand-caret-btn"
                          onClick={(e) => toggleNotebookExpand(nb.id, e)}
                        >
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                      ) : (
                        <span className="expand-spacer" />
                      )}
                      <span className="notebook-color-dot" style={{ backgroundColor: nb.color }} />
                      <span className="truncate">{nb.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        className="node-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateNewFolderPrompt(nb.id);
                        }}
                        title="Add Folder"
                      >
                        <FolderPlus size={13} />
                      </button>
                      {notebooks.length > 1 && (
                        <button
                          className="node-action-btn text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete notebook "${nb.name}"? Notes will be moved to default.`)) {
                              onDeleteNotebook(nb.id);
                            }
                          }}
                          title="Delete Notebook"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Folders in Notebook */}
                  {isExpanded && nbFolders.length > 0 && (
                    <div className="folders-sub-tree">
                      {nbFolders.map((folder) => (
                        <div
                          key={folder.id}
                          className={`folder-tree-item ${selectedFolderId === folder.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedNotebookId(nb.id);
                            setSelectedFolderId(folder.id);
                            setSelectedTag(null);
                            setCategory('all');
                          }}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Folder size={14} className="text-secondary" />
                            <span className="truncate">{folder.name}</span>
                          </div>
                          <button
                            className="node-action-btn text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete folder "${folder.name}"?`)) {
                                onDeleteFolder(folder.id);
                              }
                            }}
                            title="Delete Folder"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="nav-divider" />

        {/* Tags Section */}
        {tagList.length > 0 && (
          <div className="notes-nav-section">
            <div className="section-header">
              <span className="section-title">Tags</span>
              {selectedTag && (
                <button
                  className="nexus-btn btn-secondary btn-xs"
                  onClick={() => setSelectedTag(null)}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="tags-cloud">
              {tagList.map(([t, count]) => (
                <button
                  key={t}
                  className={`tag-chip ${selectedTag === t ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTag(selectedTag === t ? null : t);
                    setCategory('all');
                  }}
                >
                  #{t} <span className="tag-count">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Column 2: Notes List column */}
      <section className="notes-list-column">
        {/* Header & Search */}
        <div className="notes-list-header">
          <div className="notes-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search notes, tags, contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notes-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                &times;
              </button>
            )}
          </div>

          <div className="notes-list-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title (A-Z)</option>
            </select>

            <button
              className="nexus-btn btn-primary btn-sm flex-shrink-0"
              onClick={() => onCreateNote(selectedNotebookId || undefined, selectedFolderId)}
              title="Create New Note (Ctrl+N)"
            >
              <Plus size={15} />
              New Note
            </button>
          </div>
        </div>

        {/* Recycle Bin Top Notice */}
        {category === 'trash' && (
          <div className="trash-banner">
            <div className="flex items-center gap-2">
              <Trash2 size={16} className="text-danger" />
              <span>Notes in the recycle bin will be retained until purged.</span>
            </div>
            {counts.trash > 0 && (
              <button
                className="nexus-btn btn-danger btn-xs"
                onClick={() => {
                  if (confirm('Permanently purge all notes in the Recycle Bin?')) {
                    onEmptyTrash();
                  }
                }}
              >
                Empty Recycle Bin
              </button>
            )}
          </div>
        )}

        {/* Notes Cards List */}
        <div className="notes-cards-scroll">
          {sortedNotes.length === 0 ? (
            <div className="no-notes-state">
              <FileText size={32} className="text-secondary" />
              <p>No notes found in this view.</p>
              {category !== 'trash' && (
                <button
                  className="nexus-btn btn-secondary btn-sm"
                  onClick={() => onCreateNote(selectedNotebookId || undefined, selectedFolderId)}
                >
                  Create Note
                </button>
              )}
            </div>
          ) : (
            sortedNotes.map((note) => {
              const isSelected = activeNoteId === note.id;
              const dateStr = new Date(note.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={note.id}
                  className={`note-list-card ${isSelected ? 'active' : ''} ${note.inTrash ? 'trashed' : ''}`}
                  onClick={() => onSelectNote(note.id)}
                >
                  <div className="card-top-row">
                    <div className="card-title-group">
                      {note.isPinned && <Pin size={13} className="pin-icon text-accent" />}
                      <span className="card-title truncate">{note.title || 'Untitled Note'}</span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      {category === 'trash' ? (
                        <>
                          <button
                            className="nexus-icon-btn btn-xs"
                            onClick={() => onRestoreNote(note.id)}
                            title="Restore Note"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            className="nexus-icon-btn btn-xs text-danger"
                            onClick={() => onPurgeNote(note.id)}
                            title="Permanently Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={`nexus-icon-btn btn-xs ${note.isFavorite ? 'text-warning' : ''}`}
                            onClick={() => onToggleFavorite(note)}
                            title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
                          >
                            <Star size={13} fill={note.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            className={`nexus-icon-btn btn-xs ${note.isPinned ? 'text-accent' : ''}`}
                            onClick={() => onTogglePin(note)}
                            title={note.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin size={13} />
                          </button>
                          <button
                            className="nexus-icon-btn btn-xs"
                            onClick={() => onDuplicateNote(note.id)}
                            title="Duplicate Note"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            className="nexus-icon-btn btn-xs text-danger"
                            onClick={() => onDeleteNote(note.id)}
                            title="Move to Recycle Bin"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="card-snippet">{getCleanSnippet(note.content) || 'No additional text'}</p>

                  <div className="card-bottom-row">
                    <div className="flex items-center gap-1.5">
                      <span className="card-date">{dateStr}</span>
                      {note.linkedTab && (
                        <span className="card-badge linked-badge" title={`Linked to ${note.linkedTab.url}`}>
                          <ExternalLink size={10} />
                          Tab
                        </span>
                      )}
                    </div>

                    <div className="card-tags-row">
                      {(note.tags || []).slice(0, 3).map((t) => (
                        <span key={t} className="card-tag">
                          #{t}
                        </span>
                      ))}
                      {(note.tags || []).length > 3 && (
                        <span className="card-tag">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
