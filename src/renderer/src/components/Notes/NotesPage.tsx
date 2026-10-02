import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NotesLibrary } from './NotesLibrary';
import { NotesEditor } from './NotesEditor';
import { NexusNote, NexusNotebook, NexusFolder } from '@shared/types';
import { FileText, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { Button, IconButton } from '../ui';

interface NotesPageProps {
  onNavigate: (url: string) => void;
  activeTabUrl?: string;
  activeTabTitle?: string;
  activeTabFavicon?: string;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  onNavigate,
  activeTabUrl,
  activeTabTitle,
  activeTabFavicon,
}) => {
  const [notes, setNotes] = useState<NexusNote[]>([]);
  const [notebooks, setNotebooks] = useState<NexusNotebook[]>([]);
  const [folders, setFolders] = useState<NexusFolder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const api = typeof window !== 'undefined' ? window.nexusAPI : null;

  // Refresh all notes, notebooks, and folders
  const refreshData = useCallback(async () => {
    if (!api) return;
    try {
      const [allNotes, allNotebooks, allFolders] = await Promise.all([
        api.getNotes(),
        api.getNotebooks(),
        api.getFolders(),
      ]);

      setNotes(allNotes || []);
      setNotebooks(allNotebooks || []);
      setFolders(allFolders || []);

      // If activeNoteId is not set or not in current notes, select the first non-trashed note
      setActiveNoteId((prevId) => {
        if (prevId && allNotes.some((n) => n.id === prevId && !n.inTrash)) {
          return prevId;
        }
        const firstActive = allNotes.find((n) => !n.inTrash && !n.isArchived);
        return firstActive ? firstActive.id : allNotes[0]?.id || null;
      });
    } catch (err) {
      console.error('[NEXUS Notes] Failed to fetch notes data:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refreshData();
    if (!api?.onNotesUpdated) return;
    const unsubscribe = api.onNotesUpdated(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData, api]);

  // Active note object
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Check draft recovery on note switch
  useEffect(() => {
    if (!activeNoteId || !api) return;
    api.getDraftRecovery(activeNoteId).then((draft) => {
      if (draft && draft.timestamp > (activeNote?.updatedAt || 0) + 1000) {
        if (
          confirm(
            `A newer unsaved draft of "${draft.title}" was recovered from an unexpected shutdown. Would you like to restore it?`
          )
        ) {
          handleSaveNote({
            id: draft.noteId,
            title: draft.title,
            content: draft.content,
          });
          api.clearDraftRecovery(draft.noteId);
        }
      }
    });
  }, [activeNoteId]);

  // Handlers
  const handleCreateNote = async (notebookId?: string, folderId?: string | null) => {
    if (!api) return;
    const defaultNotebook = notebookId || notebooks[0]?.id || 'default-notebook';
    try {
      const newNote = await api.saveNote({
        title: 'Untitled Note',
        content: '<p></p>',
        notebookId: defaultNotebook,
        folderId: folderId || null,
        tags: [],
      });
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    } catch (err) {
      console.error('[NEXUS Notes] Failed to create note:', err);
    }
  };

  const handleSaveNote = async (updates: Partial<NexusNote>) => {
    if (!api || !updates.id) return;
    try {
      const saved = await api.saveNote(updates as any);
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    } catch (err) {
      console.error('[NEXUS Notes] Failed to save note:', err);
    }
  };

  const handleDeleteNote = async (id: string, permanent: boolean = false) => {
    if (!api) return;
    try {
      await api.deleteNote(id, permanent);
      await refreshData();
    } catch (err) {
      console.error('[NEXUS Notes] Failed to delete note:', err);
    }
  };

  const handleRestoreNote = async (id: string) => {
    if (!api) return;
    try {
      await api.restoreNote(id);
      await refreshData();
    } catch (err) {
      console.error('[NEXUS Notes] Failed to restore note:', err);
    }
  };

  const handlePurgeNote = async (id: string) => {
    if (!api) return;
    if (confirm('Permanently delete this note? This action cannot be undone.')) {
      try {
        await api.purgeNote(id);
        await refreshData();
      } catch (err) {
        console.error('[NEXUS Notes] Failed to purge note:', err);
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (!api) return;
    try {
      await api.emptyTrash();
      await refreshData();
    } catch (err) {
      console.error('[NEXUS Notes] Failed to empty trash:', err);
    }
  };

  const handleDuplicateNote = async (id: string) => {
    if (!api) return;
    try {
      const duplicated = await api.duplicateNote(id);
      if (duplicated) {
        setNotes((prev) => [duplicated, ...prev]);
        setActiveNoteId(duplicated.id);
      }
    } catch (err) {
      console.error('[NEXUS Notes] Failed to duplicate note:', err);
    }
  };

  const handleTogglePin = async (note: NexusNote) => {
    await handleSaveNote({ id: note.id, isPinned: !note.isPinned });
  };

  const handleToggleFavorite = async (note: NexusNote) => {
    await handleSaveNote({ id: note.id, isFavorite: !note.isFavorite });
  };

  const handleToggleArchive = async (note: NexusNote) => {
    await handleSaveNote({ id: note.id, isArchived: !note.isArchived });
  };

  const handleCreateNotebook = async (name: string, color?: string) => {
    if (!api) return;
    try {
      const nb = await api.saveNotebook({ name, color: color || '#A78BFA' });
      setNotebooks((prev) => [...prev, nb]);
    } catch (err) {
      console.error('[NEXUS Notes] Failed to create notebook:', err);
    }
  };

  const handleDeleteNotebook = async (notebookId: string) => {
    if (!api) return;
    try {
      await api.deleteNotebook(notebookId);
      await refreshData();
    } catch (err) {
      console.error('[NEXUS Notes] Failed to delete notebook:', err);
    }
  };

  const handleCreateFolder = async (name: string, notebookId: string) => {
    if (!api) return;
    try {
      const folder = await api.saveFolder({ name, notebookId });
      setFolders((prev) => [...prev, folder]);
    } catch (err) {
      console.error('[NEXUS Notes] Failed to create folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!api) return;
    try {
      await api.deleteFolder(folderId);
      await refreshData();
    } catch (err) {
      console.error('[NEXUS Notes] Failed to delete folder:', err);
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

  const handleExportNotePdf = async () => {
    if (!api || !activeNote) return;
    const res = await api.exportNotePdf(activeNote.id, {
      includeTitle: true,
      includeMetadata: true,
      includePageNumbers: true,
    });
    if (res.success) {
      alert(`Note successfully exported to PDF:\n${res.filePath}`);
    } else if (res.error && res.error !== 'Export canceled by user') {
      alert(`PDF Export Failed: ${res.error}`);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await refreshData();
    setTimeout(() => setIsSyncing(false), 500);
  };

  return (
    <div className={`nexus-internal-page nexus-notes-page ${isFocusMode ? 'in-focus-mode' : ''}`}>
      {/* Top Header Bar */}
      {!isFocusMode && (
        <header className="notes-page-header">
          <div className="flex items-center gap-3">
            <IconButton
              icon={<ArrowLeft size={18} />}
              aria-label="Return to New Tab"
              tooltip="Return to New Tab"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('nexus://newtab')}
            />
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-accent" />
              <h2 className="notes-app-title">NEXUS Notes</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />}
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync & refresh local notes database"
            >
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
            {activeNote && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={14} />}
                onClick={handleExportNotePdf}
                title="Export active note to PDF"
              >
                Export Note PDF
              </Button>
            )}
          </div>
        </header>
      )}

      {/* Main Layout Area */}
      <div className="notes-page-body">
        {/* Navigation & Notes Library Columns */}
        {!isFocusMode && (
          <NotesLibrary
            notes={notes}
            notebooks={notebooks}
            folders={folders}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
            onDuplicateNote={handleDuplicateNote}
            onDeleteNote={handleDeleteNote}
            onRestoreNote={handleRestoreNote}
            onPurgeNote={handlePurgeNote}
            onEmptyTrash={handleEmptyTrash}
            onTogglePin={handleTogglePin}
            onToggleFavorite={handleToggleFavorite}
            onToggleArchive={handleToggleArchive}
            onCreateNotebook={handleCreateNotebook}
            onDeleteNotebook={handleDeleteNotebook}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        )}

        {/* Right Editor Pane */}
        <main className="notes-editor-pane">
          <NotesEditor
            note={activeNote}
            onSave={handleSaveNote}
            onLinkActiveTab={handleLinkActiveTab}
            onRemoveTabLink={handleRemoveTabLink}
            onOpenUrl={onNavigate}
            activeTabUrl={activeTabUrl}
            activeTabTitle={activeTabTitle}
            activeTabFavicon={activeTabFavicon}
            onExportPdf={handleExportNotePdf}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
          />
        </main>
      </div>
    </div>
  );
};
