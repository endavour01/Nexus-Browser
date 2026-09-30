import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Plus,
  ExternalLink,
  Search,
  Star,
  Pin,
  Trash2,
  Check,
  ChevronDown,
  Maximize2,
} from 'lucide-react';
import { NexusNote } from '@shared/types';
import { NotesEditor } from './NotesEditor';

interface NotesSidePanelProps {
  onNavigate: (url: string) => void;
  activeTabUrl?: string;
  activeTabTitle?: string;
  activeTabFavicon?: string;
}

export const NotesSidePanel: React.FC<NotesSidePanelProps> = ({
  onNavigate,
  activeTabUrl,
  activeTabTitle,
  activeTabFavicon,
}) => {
  const [notes, setNotes] = useState<NexusNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNoteListOpen, setIsNoteListOpen] = useState(false);

  const api = typeof window !== 'undefined' ? window.nexusAPI : null;

  const refreshNotes = useCallback(async () => {
    if (!api) return;
    try {
      const allNotes = await api.getNotes();
      setNotes(allNotes || []);
      setActiveNoteId((prevId) => {
        if (prevId && allNotes.some((n) => n.id === prevId && !n.inTrash)) {
          return prevId;
        }
        const first = allNotes.find((n) => !n.inTrash && !n.isArchived);
        return first ? first.id : allNotes[0]?.id || null;
      });
    } catch (err) {
      console.error('[NEXUS Notes SidePanel] Failed to load notes:', err);
    }
  }, [api]);

  useEffect(() => {
    refreshNotes();
    if (!api?.onNotesUpdated) return;
    const unsub = api.onNotesUpdated(() => {
      refreshNotes();
    });
    return () => unsub();
  }, [refreshNotes, api]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => !n.inTrash && !n.isArchived)
      .filter((n) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, searchQuery]);

  const handleCreateNote = async (linkCurrentTab: boolean = false) => {
    if (!api) return;
    try {
      const newNote = await api.saveNote({
        title: linkCurrentTab && activeTabTitle ? `Notes: ${activeTabTitle}` : 'Quick Note',
        content: '<p></p>',
        linkedTab:
          linkCurrentTab && activeTabUrl
            ? {
                url: activeTabUrl,
                title: activeTabTitle || activeTabUrl,
                favicon: activeTabFavicon,
                linkedAt: Date.now(),
              }
            : null,
      });
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setIsNoteListOpen(false);
    } catch (err) {
      console.error('[NEXUS Notes SidePanel] Failed to create quick note:', err);
    }
  };

  const handleSaveNote = async (updates: Partial<NexusNote>) => {
    if (!api || !updates.id) return;
    try {
      const saved = await api.saveNote(updates as any);
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    } catch (err) {
      console.error('[NEXUS Notes SidePanel] Failed to save note:', err);
    }
  };

  const handleLinkActiveTab = () => {
    if (!activeNote || !activeTabUrl) return;
    handleSaveNote({
      id: activeNote.id,
      linkedTab: {
        url: activeTabUrl,
        title: activeTabTitle || activeTabUrl,
        favicon: activeTabFavicon,
        linkedAt: Date.now(),
      },
    });
  };

  const handleRemoveTabLink = () => {
    if (!activeNote) return;
    handleSaveNote({
      id: activeNote.id,
      linkedTab: null,
    });
  };

  return (
    <div className="notes-sidepanel-root">
      {/* SidePanel Header */}
      <div className="sidepanel-notes-header">
        <div className="flex items-center gap-2">
          <FileText size={17} className="text-accent" />
          <span className="sidepanel-header-title">Notes Companion</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="nexus-icon-btn btn-sm"
            onClick={() => handleCreateNote(false)}
            title="Create New Note"
          >
            <Plus size={16} />
          </button>
          <button
            className="nexus-icon-btn btn-sm"
            onClick={() => onNavigate('nexus://notes')}
            title="Open Full Workspace (nexus://notes)"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Note Selector Dropdown */}
      <div className="sidepanel-note-selector relative">
        <button
          className="note-selector-toggle"
          onClick={() => setIsNoteListOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-2 truncate">
            {activeNote?.isPinned && <Pin size={12} className="text-accent" />}
            <span className="truncate">{activeNote?.title || 'Select a note...'}</span>
          </div>
          <ChevronDown size={14} className="flex-shrink-0" />
        </button>

        {isNoteListOpen && (
          <div className="note-selector-popover">
            <div className="selector-search-box">
              <Search size={14} className="text-secondary" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="selector-list">
              {filteredNotes.map((n) => (
                <button
                  key={n.id}
                  className={`selector-item ${n.id === activeNoteId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNoteId(n.id);
                    setIsNoteListOpen(false);
                  }}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {n.isPinned && <Pin size={12} className="text-accent" />}
                    <span className="truncate">{n.title || 'Untitled Note'}</span>
                  </div>
                  <span className="text-secondary" style={{ fontSize: '10px' }}>
                    {new Date(n.updatedAt).toLocaleDateString(undefined, {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                </button>
              ))}
              {filteredNotes.length === 0 && (
                <div className="selector-empty">No matching notes found.</div>
              )}
            </div>

            <div className="selector-footer">
              <button
                className="nexus-btn btn-secondary btn-xs w-full"
                onClick={() => handleCreateNote(false)}
              >
                <Plus size={13} />
                New Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Tab Linker Quick Action */}
      {activeTabUrl && activeTabUrl !== 'nexus://notes' && activeTabUrl !== 'nexus://newtab' && (
        <div className="sidepanel-tab-link-action">
          {activeNote?.linkedTab?.url === activeTabUrl ? (
            <div className="tab-linked-badge">
              <Check size={12} />
              <span className="truncate">Linked to active tab</span>
            </div>
          ) : (
            <button className="link-active-tab-action" onClick={handleLinkActiveTab}>
              <ExternalLink size={12} />
              <span className="truncate">Link current tab to this note</span>
            </button>
          )}
        </div>
      )}

      {/* Embedded Streamlined Editor */}
      <div className="sidepanel-editor-host">
        <NotesEditor
          note={activeNote}
          onSave={handleSaveNote}
          onLinkActiveTab={handleLinkActiveTab}
          onRemoveTabLink={handleRemoveTabLink}
          onOpenUrl={onNavigate}
          activeTabUrl={activeTabUrl}
          activeTabTitle={activeTabTitle}
          activeTabFavicon={activeTabFavicon}
        />
      </div>
    </div>
  );
};
