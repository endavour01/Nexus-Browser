import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  NexusNote,
  NexusNotebook,
  NexusFolder,
  NexusDraftRecovery,
  NotesFilterOptions,
  NotesExportOptions,
  NexusNotesData,
} from '../shared/types';

export class NotesManager {
  private filePath: string;
  private mainWindow: BrowserWindow | null = null;
  private notes: Map<string, NexusNote> = new Map();
  private notebooks: Map<string, NexusNotebook> = new Map();
  private folders: Map<string, NexusFolder> = new Map();
  private drafts: Map<string, NexusDraftRecovery> = new Map();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(customPath?: string, mainWindow?: BrowserWindow | null) {
    this.mainWindow = mainWindow || null;

    if (customPath) {
      this.filePath = customPath;
    } else {
      let baseDir = process.cwd();
      try {
        baseDir = app.getPath('userData');
      } catch {
        baseDir = path.join(process.cwd(), '.nexus-data');
      }
      this.filePath = path.join(baseDir, 'nexus-notes.json');
    }

    this.load();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  public getFilePath(): string {
    return this.filePath;
  }

  private initDefaults() {
    this.notes.clear();
    this.notebooks.clear();
    this.folders.clear();
    this.drafts.clear();

    const now = Date.now();

    // Default primary notebook
    const defaultNotebook: NexusNotebook = {
      id: 'default-notebook',
      name: 'General Notes',
      description: 'Quick thoughts, research logs, and scratchpad',
      color: '#A78BFA',
      icon: 'BookOpen',
      createdAt: now,
      updatedAt: now,
    };
    this.notebooks.set(defaultNotebook.id, defaultNotebook);

    // Default project folder
    const starterFolder: NexusFolder = {
      id: 'folder-welcome',
      notebookId: defaultNotebook.id,
      name: 'Getting Started',
      createdAt: now,
    };
    this.folders.set(starterFolder.id, starterFolder);

    // Welcome starter note
    const welcomeNote: NexusNote = {
      id: 'note-welcome',
      title: 'Welcome to NEXUS Notes 🚀',
      notebookId: defaultNotebook.id,
      folderId: starterFolder.id,
      tags: ['guide', 'welcome', 'nexus'],
      isFavorite: true,
      isPinned: true,
      isArchived: false,
      inTrash: false,
      trashedAt: null,
      createdAt: now,
      updatedAt: now,
      linkedTab: {
        url: 'nexus://notes',
        title: 'NEXUS Notes Hub',
        linkedAt: now,
      },
      drawingData: null,
      wordCount: 165,
      readingTimeMinutes: 1,
      content: `<h1>Welcome to NEXUS Notes</h1>
<p>NEXUS Notes is your built-in, private, offline workspace for capturing research, code snippets, project specs, and visual thoughts.</p>
<h2>✨ Key Features</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Tiptap Rich-Text Editor</strong>: Headings, task lists, tables, code blocks, and multi-color highlighting.</div></li>
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Visual Sketch Canvas</strong>: Freehand pens, highlighters, geometric shapes, flowcharts, and charts.</div></li>
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Offline Spell Check &amp; Autocorrect</strong>: Instant typo correction with undo support.</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><strong>One-Click Tab Linking</strong>: Save source URL, page title, and timestamps from your active tab.</div></li>
</ul>
<h2>📊 Quick Reference Table</h2>
<table>
  <tbody>
    <tr><th>Feature</th><th>Shortcut</th><th>Purpose</th></tr>
    <tr><td>Toggle Side Panel</td><td>Ctrl+Shift+N</td><td>Take notes side-by-side with web browsing</td></tr>
    <tr><td>In-Note Search</td><td>Ctrl+F</td><td>Quickly find and replace terms inside active note</td></tr>
    <tr><td>Export to PDF</td><td>Top Toolbar &gt; Export</td><td>Clean, unclipped document printing with page numbers</td></tr>
  </tbody>
</table>
<pre><code class="language-typescript">// All notes are saved 100% offline in your NEXUS profile
console.log("Welcome to distraction-free note taking!");
</code></pre>`,
    };
    this.notes.set(welcomeNote.id, welcomeNote);

    this.saveImmediate();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const data: NexusNotesData = JSON.parse(raw);

        this.notes.clear();
        this.notebooks.clear();
        this.folders.clear();
        this.drafts.clear();

        if (Array.isArray(data.notebooks)) {
          data.notebooks.forEach((nb) => this.notebooks.set(nb.id, nb));
        }
        if (Array.isArray(data.folders)) {
          data.folders.forEach((f) => this.folders.set(f.id, f));
        }
        if (Array.isArray(data.notes)) {
          data.notes.forEach((n) => this.notes.set(n.id, n));
        }
        if (data.drafts && typeof data.drafts === 'object') {
          Object.entries(data.drafts).forEach(([k, v]) => this.drafts.set(k, v));
        }

        // Ensure at least one default notebook exists
        if (this.notebooks.size === 0) {
          const defaultNotebook: NexusNotebook = {
            id: 'default-notebook',
            name: 'General Notes',
            description: 'Default notes collection',
            color: '#A78BFA',
            icon: 'BookOpen',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          this.notebooks.set(defaultNotebook.id, defaultNotebook);
          this.saveImmediate();
        }
      } else {
        this.initDefaults();
      }
    } catch (err) {
      console.error('[NEXUS Notes] Failed to load notes database, initializing defaults:', err);
      this.initDefaults();
    }
  }

  public saveImmediate(): boolean {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const draftsObj: Record<string, NexusDraftRecovery> = {};
      this.drafts.forEach((val, key) => {
        draftsObj[key] = val;
      });

      const payload: NexusNotesData = {
        version: 1,
        notebooks: Array.from(this.notebooks.values()),
        folders: Array.from(this.folders.values()),
        notes: Array.from(this.notes.values()),
        drafts: draftsObj,
      };

      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error('[NEXUS Notes] Failed to write notes database:', err);
      return false;
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate();
      this.saveTimeout = null;
    }, 250);
  }

  private notifyRenderer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notes:updated');
    }
  }

  private computeMetrics(content: string): { wordCount: number; readingTimeMinutes: number } {
    // Strip HTML tags for clean word count
    const cleanText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return { wordCount: 0, readingTimeMinutes: 1 };
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    return { wordCount, readingTimeMinutes };
  }

  // --- Notes CRUD & Queries ---

  public getNotes(filter?: NotesFilterOptions): NexusNote[] {
    let list = Array.from(this.notes.values());

    // Trash filter: by default exclude inTrash unless trashOnly is explicitly true
    if (filter?.trashOnly) {
      list = list.filter((n) => n.inTrash);
    } else {
      list = list.filter((n) => !n.inTrash);
      if (filter?.archivedOnly) {
        list = list.filter((n) => n.isArchived);
      } else {
        list = list.filter((n) => !n.isArchived);
      }
    }

    if (filter?.notebookId) {
      list = list.filter((n) => n.notebookId === filter.notebookId);
    }

    if (filter?.folderId !== undefined) {
      list = list.filter((n) => n.folderId === filter.folderId);
    }

    if (filter?.tag) {
      const targetTag = filter.tag.toLowerCase();
      list = list.filter((n) => n.tags && n.tags.some((t) => t.toLowerCase() === targetTag));
    }

    if (filter?.favoriteOnly) {
      list = list.filter((n) => n.isFavorite);
    }

    if (filter?.pinnedOnly) {
      list = list.filter((n) => n.isPinned);
    }

    if (filter?.linkedUrl) {
      list = list.filter((n) => n.linkedTab && n.linkedTab.url === filter.linkedUrl);
    }

    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase().trim();
      list = list.filter((n) => {
        const titleMatch = n.title.toLowerCase().includes(q);
        const contentMatch = n.content.toLowerCase().includes(q);
        const tagMatch = n.tags && n.tags.some((t) => t.toLowerCase().includes(q));
        return titleMatch || contentMatch || tagMatch;
      });
    }

    // Sort: Pinned first, then newest updatedAt
    return list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
  }

  public getNote(id: string): NexusNote | null {
    return this.notes.get(id) || null;
  }

  public saveNote(data: Partial<NexusNote> & { title: string }): NexusNote {
    const now = Date.now();
    const id = data.id || `note-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const existing = this.notes.get(id);

    const content = data.content !== undefined ? data.content : existing?.content || '';
    const metrics = this.computeMetrics(content);

    const primaryNotebook = this.notebooks.keys().next().value || 'default-notebook';

    const note: NexusNote = {
      id,
      title: data.title.trim() || 'Untitled Note',
      content,
      notebookId: data.notebookId || existing?.notebookId || primaryNotebook,
      folderId: data.folderId !== undefined ? data.folderId : existing?.folderId || null,
      tags: Array.isArray(data.tags) ? data.tags : existing?.tags || [],
      isFavorite: data.isFavorite !== undefined ? data.isFavorite : existing?.isFavorite || false,
      isPinned: data.isPinned !== undefined ? data.isPinned : existing?.isPinned || false,
      isArchived: data.isArchived !== undefined ? data.isArchived : existing?.isArchived || false,
      inTrash: data.inTrash !== undefined ? data.inTrash : existing?.inTrash || false,
      trashedAt: data.trashedAt !== undefined ? data.trashedAt : existing?.trashedAt || null,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      linkedTab: data.linkedTab !== undefined ? data.linkedTab : existing?.linkedTab || null,
      drawingData: data.drawingData !== undefined ? data.drawingData : existing?.drawingData || null,
      wordCount: metrics.wordCount,
      readingTimeMinutes: metrics.readingTimeMinutes,
    };

    this.notes.set(id, note);
    // Clear draft snapshot upon successful save
    this.drafts.delete(id);
    this.scheduleSave();
    this.notifyRenderer();
    return note;
  }

  public deleteNote(id: string, permanent: boolean = false): boolean {
    const note = this.notes.get(id);
    if (!note) return false;

    if (permanent || note.inTrash) {
      this.notes.delete(id);
      this.drafts.delete(id);
    } else {
      note.inTrash = true;
      note.trashedAt = Date.now();
      note.isPinned = false;
      this.notes.set(id, note);
    }

    this.scheduleSave();
    this.notifyRenderer();
    return true;
  }

  public restoreNote(id: string): boolean {
    const note = this.notes.get(id);
    if (!note || !note.inTrash) return false;

    note.inTrash = false;
    note.trashedAt = null;
    note.updatedAt = Date.now();
    this.notes.set(id, note);

    this.scheduleSave();
    this.notifyRenderer();
    return true;
  }

  public purgeNote(id: string): boolean {
    return this.deleteNote(id, true);
  }

  public emptyTrash(): boolean {
    let removed = false;
    for (const [id, note] of Array.from(this.notes.entries())) {
      if (note.inTrash) {
        this.notes.delete(id);
        this.drafts.delete(id);
        removed = true;
      }
    }
    if (removed) {
      this.scheduleSave();
      this.notifyRenderer();
    }
    return removed;
  }

  public duplicateNote(id: string): NexusNote | null {
    const source = this.notes.get(id);
    if (!source) return null;

    const now = Date.now();
    const newId = `note-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const duplicate: NexusNote = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      inTrash: false,
      trashedAt: null,
    };

    this.notes.set(newId, duplicate);
    this.scheduleSave();
    this.notifyRenderer();
    return duplicate;
  }

  // --- Notebooks CRUD ---

  public getNotebooks(): NexusNotebook[] {
    return Array.from(this.notebooks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  public saveNotebook(data: Partial<NexusNotebook> & { name: string }): NexusNotebook {
    const now = Date.now();
    const id = data.id || `notebook-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const existing = this.notebooks.get(id);

    const notebook: NexusNotebook = {
      id,
      name: data.name.trim() || 'Untitled Notebook',
      description: data.description || existing?.description || '',
      color: data.color || existing?.color || '#A78BFA',
      icon: data.icon || existing?.icon || 'BookOpen',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.notebooks.set(id, notebook);
    this.scheduleSave();
    this.notifyRenderer();
    return notebook;
  }

  public deleteNotebook(id: string): boolean {
    if (this.notebooks.size <= 1) {
      // Keep at least one notebook
      return false;
    }
    if (!this.notebooks.has(id)) return false;

    this.notebooks.delete(id);

    // Fallback notebook for orphaned notes/folders
    const fallbackId: string = this.notebooks.keys().next().value || 'default-notebook';

    for (const [folderId, folder] of Array.from(this.folders.entries())) {
      if (folder.notebookId === id) {
        folder.notebookId = fallbackId;
        this.folders.set(folderId, folder);
      }
    }

    for (const [noteId, note] of Array.from(this.notes.entries())) {
      if (note.notebookId === id) {
        note.notebookId = fallbackId;
        this.notes.set(noteId, note);
      }
    }

    this.scheduleSave();
    this.notifyRenderer();
    return true;
  }

  // --- Folders CRUD ---

  public getFolders(notebookId?: string): NexusFolder[] {
    let list = Array.from(this.folders.values());
    if (notebookId) {
      list = list.filter((f) => f.notebookId === notebookId);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  public saveFolder(data: Partial<NexusFolder> & { name: string; notebookId: string }): NexusFolder {
    const now = Date.now();
    const id = data.id || `folder-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const existing = this.folders.get(id);

    const folder: NexusFolder = {
      id,
      notebookId: data.notebookId,
      name: data.name.trim() || 'New Folder',
      parentId: data.parentId || existing?.parentId || null,
      createdAt: existing ? existing.createdAt : now,
    };

    this.folders.set(id, folder);
    this.scheduleSave();
    this.notifyRenderer();
    return folder;
  }

  public deleteFolder(id: string): boolean {
    if (!this.folders.has(id)) return false;
    this.folders.delete(id);

    // Reset notes inside this folder to root of notebook
    for (const [noteId, note] of Array.from(this.notes.entries())) {
      if (note.folderId === id) {
        note.folderId = null;
        this.notes.set(noteId, note);
      }
    }

    this.scheduleSave();
    this.notifyRenderer();
    return true;
  }

  // --- Draft Recovery ---

  public getDraftRecovery(noteId: string): NexusDraftRecovery | null {
    return this.drafts.get(noteId) || null;
  }

  public saveDraftRecovery(draft: NexusDraftRecovery): void {
    if (!draft || !draft.noteId) return;
    this.drafts.set(draft.noteId, {
      ...draft,
      timestamp: Date.now(),
    });
    this.scheduleSave();
  }

  public clearDraftRecovery(noteId: string): void {
    if (this.drafts.has(noteId)) {
      this.drafts.delete(noteId);
      this.scheduleSave();
    }
  }

  // --- PDF & Print Export Engine ---

  public async exportNotePdf(
    noteId: string,
    options?: NotesExportOptions,
    customWindow?: BrowserWindow
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const note = this.notes.get(noteId);
    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    const targetWin = customWindow || this.mainWindow;
    const defaultFileName = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'nexus_note'}.pdf`;

    let targetPath: string | undefined;
    if (dialog?.showSaveDialog) {
      const res = await dialog.showSaveDialog(targetWin || undefined as any, {
        title: 'Export Note to PDF',
        defaultPath: path.join(app.getPath('documents') || app.getPath('downloads'), defaultFileName),
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });
      if (res.canceled || !res.filePath) {
        return { success: false, error: 'Export canceled by user' };
      }
      targetPath = res.filePath;
    } else {
      targetPath = path.join(process.cwd(), defaultFileName);
    }

    try {
      const htmlContent = this.generatePrintHtml([note], options);
      const pdfBuffer = await this.renderHtmlToPdf(htmlContent);
      fs.writeFileSync(targetPath, pdfBuffer);
      return { success: true, filePath: targetPath };
    } catch (err: any) {
      console.error('[NEXUS Notes] PDF export failed:', err);
      return { success: false, error: err.message || 'Failed to render PDF' };
    }
  }

  public async exportNotebookPdf(
    notebookId: string,
    options?: NotesExportOptions,
    customWindow?: BrowserWindow
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      return { success: false, error: 'Notebook not found' };
    }

    const notesInBook = Array.from(this.notes.values())
      .filter((n) => n.notebookId === notebookId && !n.inTrash && !n.isArchived)
      .sort((a, b) => a.title.localeCompare(b.title));

    if (notesInBook.length === 0) {
      return { success: false, error: 'Notebook contains no active notes to export' };
    }

    const targetWin = customWindow || this.mainWindow;
    const defaultFileName = `${notebook.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Notebook.pdf`;

    let targetPath: string | undefined;
    if (dialog?.showSaveDialog) {
      const res = await dialog.showSaveDialog(targetWin || undefined as any, {
        title: `Export Notebook "${notebook.name}" to PDF`,
        defaultPath: path.join(app.getPath('documents') || app.getPath('downloads'), defaultFileName),
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });
      if (res.canceled || !res.filePath) {
        return { success: false, error: 'Export canceled by user' };
      }
      targetPath = res.filePath;
    } else {
      targetPath = path.join(process.cwd(), defaultFileName);
    }

    try {
      const htmlContent = this.generatePrintHtml(notesInBook, options, notebook.name);
      const pdfBuffer = await this.renderHtmlToPdf(htmlContent);
      fs.writeFileSync(targetPath, pdfBuffer);
      return { success: true, filePath: targetPath };
    } catch (err: any) {
      console.error('[NEXUS Notes] Notebook PDF export failed:', err);
      return { success: false, error: err.message || 'Failed to render PDF' };
    }
  }

  public generatePrintHtml(notes: NexusNote[], options?: NotesExportOptions, notebookTitle?: string): string {
    const includeTitle = options?.includeTitle !== false;
    const includeMetadata = options?.includeMetadata !== false;
    const includePageNumbers = options?.includePageNumbers !== false;

    const sections = notes
      .map((note, index) => {
        const dateStr = new Date(note.updatedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const tagsHtml =
          note.tags && note.tags.length > 0
            ? `<div class="note-tags">${note.tags.map((t) => `<span class="tag">#${t}</span>`).join(' ')}</div>`
            : '';
        const tabHtml = note.linkedTab
          ? `<div class="note-tab">Linked Source: <a href="${note.linkedTab.url}">${note.linkedTab.title || note.linkedTab.url}</a> (${new Date(note.linkedTab.linkedAt).toLocaleDateString()})</div>`
          : '';

        const drawingHtml = note.drawingData
          ? `<div class="note-drawing"><img src="${note.drawingData}" alt="Note Drawing" style="max-width:100%; border:1px solid #ccc; border-radius:6px; margin-top:12px;" /></div>`
          : '';

        return `
        <article class="note-print-section ${index > 0 ? 'page-break' : ''}">
          ${includeTitle ? `<h1 class="note-print-title">${note.title}</h1>` : ''}
          ${
            includeMetadata
              ? `
          <div class="note-meta">
            <span>Last Updated: ${dateStr}</span>
            <span>Word Count: ${note.wordCount || 0}</span>
            ${tagsHtml}
            ${tabHtml}
          </div>`
              : ''
          }
          <div class="note-body">
            ${note.content}
            ${drawingHtml}
          </div>
        </article>
      `;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${notebookTitle ? `${notebookTitle} - ` : ''}NEXUS Notes Print</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 18mm 18mm 18mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .note-print-section {
      margin-bottom: 24px;
    }
    .note-print-title {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .note-meta {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .note-meta span {
      margin-right: 14px;
    }
    .note-tags {
      margin-top: 4px;
    }
    .tag {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5pt;
      margin-right: 4px;
    }
    .note-tab {
      margin-top: 4px;
      font-style: italic;
    }
    .note-body {
      color: #1e293b;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 14px 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
    }
    pre {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 9.5pt;
      white-space: pre-wrap;
      word-break: break-all;
      page-break-inside: avoid;
    }
    code {
      font-family: monospace;
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 9.5pt;
    }
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    ul[data-type="taskList"] li {
      display: flex;
      align-items: baseline;
      margin-bottom: 4px;
    }
    ul[data-type="taskList"] li label {
      margin-right: 8px;
    }
    blockquote {
      border-left: 4px solid #94a3b8;
      margin: 12px 0;
      padding-left: 12px;
      color: #475569;
      font-style: italic;
    }
    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
    }
    ${
      includePageNumbers
        ? `
    @page {
      @bottom-right {
        content: counter(page);
        font-size: 8pt;
        color: #94a3b8;
      }
    }`
        : ''
    }
  </style>
</head>
<body>
  ${sections}
</body>
</html>`;
  }

  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    const printWin = new BrowserWindow({
      show: false,
      width: 800,
      height: 1000,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      await printWin.loadURL(dataUri);

      const pdfData = await printWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          marginType: 'default',
        },
      });

      return Buffer.from(pdfData);
    } finally {
      printWin.destroy();
    }
  }
}
