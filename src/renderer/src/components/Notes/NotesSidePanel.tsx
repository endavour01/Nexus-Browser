import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Button, IconButton, SearchInput } from '../ui';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside dropdown cleanly without screen-freezing invisible backdrops
  useEffect(() => {
    if (!isNoteListOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNoteListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNoteListOpen]);

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
        linkedTab: null,
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
    <div className="notes-sidepanel-root flex flex-col h-full w-full bg-[var(--nexus-bg-surface,#12151D)] overflow-hidden">
      {/* Streamlined Note Selector & Actions Bar (no duplicate title header) */}
      <div ref={dropdownRef} className="sidepanel-note-selector relative flex items-center gap-2 p-2.5 bg-[var(--nexus-bg-canvas,#0E1017)] border-b border-[var(--nexus-border-subtle,#1C202C)]">
        <button
          type="button"
          className="note-selector-toggle flex-1 flex items-center justify-between px-3 py-1.5 rounded-md bg-[var(--nexus-bg-surface,#12151D)] hover:bg-[var(--nexus-bg-hover,#1A1E29)] border border-[var(--nexus-border-subtle,#1C202C)] text-[var(--nexus-text-primary,#F4F4F5)] text-xs font-medium cursor-pointer transition-colors"
          onClick={() => setIsNoteListOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-2 truncate">
            {activeNote?.isPinned && <Pin size={12} className="text-accent" />}
            <span className="truncate">{activeNote?.title || 'Select a note...'}</span>
          </div>
          <ChevronDown size={14} className="flex-shrink-0 text-[var(--nexus-text-secondary,#9298A8)] ml-1" />
        </button>

        <IconButton
          icon={<Plus size={15} />}
          aria-label="Create New Note"
          tooltip="Create New Note"
          variant="secondary"
          size="sm"
          onClick={() => handleCreateNote(false)}
        />

        <IconButton
          icon={<Maximize2 size={14} />}
          aria-label="Open Full Workspace (nexus://notes)"
          tooltip="Open Full Workspace (nexus://notes)"
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('nexus://notes')}
        />

        {isNoteListOpen && (
          <div className="note-selector-popover absolute top-full left-2.5 right-2.5 mt-1.5 bg-[var(--nexus-bg-elevated,#191D28)] border border-[var(--nexus-border-prominent,#272C3D)] rounded-lg shadow-2xl z-50 flex flex-col max-h-64 overflow-hidden">
            <div className="selector-search-box p-2 border-b border-[var(--nexus-border-subtle,#1C202C)] bg-[var(--nexus-bg-surface,#12151D)]">
              <SearchInput
                size="sm"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                autoFocus
              />
            </div>

            <div className="selector-list overflow-y-auto p-1.5 flex flex-col gap-1 max-h-48">
              {filteredNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`selector-item flex items-center justify-between p-2 rounded text-left text-xs transition-colors ${
                    n.id === activeNoteId
                      ? 'bg-[var(--nexus-accent-dim,rgba(167,139,250,0.12))] text-[var(--nexus-accent-primary,#A78BFA)] font-medium'
                      : 'text-[var(--nexus-text-secondary,#9298A8)] hover:bg-[var(--nexus-bg-surface,#12151D)] hover:text-[var(--nexus-text-primary,#F4F4F5)]'
                  }`}
                  onClick={() => {
                    setActiveNoteId(n.id);
                    setIsNoteListOpen(false);
                  }}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {n.isPinned && <Pin size={12} className="text-accent" />}
                    <span className="truncate">{n.title || 'Untitled Note'}</span>
                  </div>
                  <span className="text-[var(--nexus-text-muted,#575D6E)] text-[10px] ml-2 shrink-0">
                    {new Date(n.updatedAt).toLocaleDateString(undefined, {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                </button>
              ))}
              {filteredNotes.length === 0 && (
                <div className="selector-empty p-3 text-center text-xs text-[var(--nexus-text-muted,#575D6E)]">No matching notes found.</div>
              )}
            </div>

            <div className="selector-footer p-2 border-t border-[var(--nexus-border-subtle,#1C202C)] bg-[var(--nexus-bg-surface,#12151D)]">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={<Plus size={13} />}
                onClick={() => handleCreateNote(false)}
              >
                New Note
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Streamlined Editor */}
      <div className="sidepanel-editor-host flex-1 overflow-hidden">
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
