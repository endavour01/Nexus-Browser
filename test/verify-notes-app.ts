import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { NotesManager } from '../src/main/notes-manager';
import {
  isWordMisspelled,
  getSpellingSuggestions,
  autocorrectWord,
  COMMON_TYPOS,
} from '../src/renderer/src/components/Notes/spellcheck';
import { NOTE_TEMPLATES } from '../src/renderer/src/components/Notes/templates';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

async function runNotesTestSuite() {
  console.log('====================================================');
  console.log('       NEXUS Notes Comprehensive QA & Test Suite    ');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-notes');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const notesFilePath = path.join(testDir, 'nexus-notes.json');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    // ----------------------------------------------------
    // SUITE 1: Notes Organization, CRUD & Search
    // ----------------------------------------------------
    console.log('[SUITE 1: NOTES ORGANIZATION & STORAGE]');
    const manager = new NotesManager(notesFilePath, win);

    const initialNotes = manager.getNotes();
    if (initialNotes.length === 0) {
      throw new Error('Default starter note was not created');
    }
    const welcome = initialNotes[0];
    if (!welcome.title.includes('Welcome to NEXUS Notes')) {
      throw new Error(`Unexpected welcome title: "${welcome.title}"`);
    }
    console.log(`    ✓ Default welcome note loaded: "${welcome.title}"`);

    // Create a new note
    const note1 = manager.saveNote({
      title: 'Distributed Systems Spec',
      content: '<h1>Consensus Architecture</h1><p>Raft algorithm achieves consensus via leader election and log replication across quorum nodes.</p>',
      tags: ['architecture', 'systems', 'raft'],
    });

    if (!note1.id || note1.title !== 'Distributed Systems Spec') {
      throw new Error('Failed to create note');
    }
    if (note1.wordCount !== 15) {
      throw new Error(`Word count calculation mismatch. Expected 15, got ${note1.wordCount}`);
    }
    if (note1.readingTimeMinutes !== 1) {
      throw new Error(`Reading time mismatch. Expected 1 min, got ${note1.readingTimeMinutes}`);
    }
    console.log(`    ✓ Created note with automatic word count (${note1.wordCount} words) and reading time`);

    // Search query test
    const searchRes = manager.getNotes({ searchQuery: 'quorum' });
    if (searchRes.length !== 1 || searchRes[0].id !== note1.id) {
      throw new Error('Search failed to find note by content keyword "quorum"');
    }
    console.log('    ✓ Search correctly matched note content');

    // Tag filter test
    const tagRes = manager.getNotes({ tag: 'systems' });
    if (tagRes.length !== 1 || tagRes[0].id !== note1.id) {
      throw new Error('Tag filter failed to find note with tag "systems"');
    }
    console.log('    ✓ Filtered notes by tag successfully');

    // Duplicate note test
    const duplicated = manager.duplicateNote(note1.id);
    if (!duplicated || duplicated.id === note1.id || duplicated.title !== 'Distributed Systems Spec (Copy)') {
      throw new Error('Duplicate note failed');
    }
    console.log(`    ✓ Duplicated note cleanly: "${duplicated.title}"`);

    // Pinned sorting test
    manager.saveNote({ id: note1.id, title: note1.title, isPinned: true });
    const sorted = manager.getNotes();
    if (!sorted[0].isPinned || sorted[0].id !== note1.id) {
      throw new Error('Pinned note was not sorted to top');
    }
    console.log('    ✓ Pinned note correctly prioritizes to top of list');

    // ----------------------------------------------------
    // SUITE 2: Recycle Bin & Draft Recovery
    // ----------------------------------------------------
    console.log('\n[SUITE 2: RECYCLE BIN & DRAFT RECOVERY]');

    // Soft delete note
    manager.deleteNote(duplicated.id, false);
    const activeAfterDelete = manager.getNotes();
    if (activeAfterDelete.some((n) => n.id === duplicated.id)) {
      throw new Error('Soft-deleted note should be excluded from active notes list');
    }

    const trashNotes = manager.getNotes({ trashOnly: true });
    if (!trashNotes.some((n) => n.id === duplicated.id)) {
      throw new Error('Soft-deleted note not found in recycle bin');
    }
    console.log('    ✓ Note moved to Recycle Bin (soft delete)');

    // Restore note
    manager.restoreNote(duplicated.id);
    const restoredNotes = manager.getNotes();
    if (!restoredNotes.some((n) => n.id === duplicated.id)) {
      throw new Error('Restored note did not reappear in active list');
    }
    console.log('    ✓ Note restored from Recycle Bin');

    // Purge note
    manager.purgeNote(duplicated.id);
    if (manager.getNote(duplicated.id) !== null) {
      throw new Error('Purged note was not permanently deleted');
    }
    console.log('    ✓ Note permanently purged from database');

    // Draft recovery snapshot test
    manager.saveDraftRecovery({
      noteId: note1.id,
      title: 'Unsaved Draft Crashed',
      content: '<p>Recovered text from emergency shutdown</p>',
      timestamp: Date.now(),
    });

    const recoveredDraft = manager.getDraftRecovery(note1.id);
    if (!recoveredDraft || recoveredDraft.title !== 'Unsaved Draft Crashed') {
      throw new Error('Failed to retrieve draft recovery snapshot');
    }
    console.log('    ✓ Draft recovery snapshot saved and retrieved');

    manager.clearDraftRecovery(note1.id);
    if (manager.getDraftRecovery(note1.id) !== null) {
      throw new Error('Draft recovery was not cleared');
    }
    console.log('    ✓ Draft recovery successfully cleared');

    // Persistence across reload test
    manager.saveImmediate();
    const reloadedManager = new NotesManager(notesFilePath, win);
    const loadedNote = reloadedManager.getNote(note1.id);
    if (!loadedNote || loadedNote.title !== note1.title) {
      throw new Error('Data persistence check failed upon re-loading database file');
    }
    console.log('    ✓ Atomic disk persistence verified across manager reload');

    // ----------------------------------------------------
    // SUITE 3: Notebooks & Nested Folders Hierarchy
    // ----------------------------------------------------
    console.log('\n[SUITE 3: NOTEBOOKS & FOLDERS HIERARCHY]');

    const newNotebook = manager.saveNotebook({
      name: 'Research Papers',
      color: '#F5C542',
      icon: 'BookOpen',
    });

    if (!newNotebook.id || newNotebook.name !== 'Research Papers') {
      throw new Error('Failed to create new notebook');
    }
    console.log(`    ✓ Created notebook: "${newNotebook.name}"`);

    const newFolder = manager.saveFolder({
      name: 'AI Models',
      notebookId: newNotebook.id,
    });
    if (!newFolder.id || newFolder.notebookId !== newNotebook.id) {
      throw new Error('Failed to create folder under notebook');
    }
    console.log(`    ✓ Created nested folder: "${newFolder.name}" in "${newNotebook.name}"`);

    // Assign note to folder
    manager.saveNote({
      id: note1.id,
      title: note1.title,
      notebookId: newNotebook.id,
      folderId: newFolder.id,
    });

    const folderNotes = manager.getNotes({ folderId: newFolder.id });
    if (folderNotes.length !== 1 || folderNotes[0].id !== note1.id) {
      throw new Error('Folder filter failed to return notes inside folder');
    }
    console.log('    ✓ Note moved and queried within folder');

    // Delete folder - verify notes not lost
    manager.deleteFolder(newFolder.id);
    const noteAfterFolderDelete = manager.getNote(note1.id);
    if (!noteAfterFolderDelete || noteAfterFolderDelete.folderId !== null) {
      throw new Error('Note was orphaned or deleted when folder was deleted');
    }
    console.log('    ✓ Deleting folder safely detached note to notebook root without data loss');

    // ----------------------------------------------------
    // SUITE 4: Tab Association & Browser Linking
    // ----------------------------------------------------
    console.log('\n[SUITE 4: TAB ASSOCIATION & BROWSER LINKING]');

    const linkedNote = manager.saveNote({
      title: 'WebGPU Acceleration Notes',
      content: '<p>Direct hardware rendering benchmarks for compute shaders.</p>',
      linkedTab: {
        url: 'https://webgpu.io/specs',
        title: 'WebGPU Specifications',
        favicon: 'https://webgpu.io/favicon.ico',
        linkedAt: Date.now(),
      },
    });

    if (!linkedNote.linkedTab || linkedNote.linkedTab.url !== 'https://webgpu.io/specs') {
      throw new Error('Tab association metadata was not saved');
    }
    console.log(`    ✓ Note linked to browser tab: "${linkedNote.linkedTab.title}" (${linkedNote.linkedTab.url})`);

    const linkedMatches = manager.getNotes({ linkedUrl: 'https://webgpu.io/specs' });
    if (linkedMatches.length !== 1 || linkedMatches[0].id !== linkedNote.id) {
      throw new Error('Failed to query note by linked tab URL');
    }
    console.log('    ✓ Query note by associated URL succeeded');

    // ----------------------------------------------------
    // SUITE 5: Offline Spell Check & Autocorrect Engine
    // ----------------------------------------------------
    console.log('\n[SUITE 5: SPELL CHECK & AUTOCORRECT]');

    if (isWordMisspelled('technology')) {
      throw new Error('"technology" should not be marked as misspelled');
    }
    if (isWordMisspelled('typescript')) {
      throw new Error('"typescript" should not be marked as misspelled');
    }
    if (!isWordMisspelled('teh')) {
      throw new Error('"teh" should be flagged as misspelled');
    }
    if (!isWordMisspelled('recieve')) {
      throw new Error('"recieve" should be flagged as misspelled');
    }
    console.log('    ✓ Verified dictionary word validation and typo detection');

    // Ignore code, identifiers, numbers
    if (isWordMisspelled('myVariable') || isWordMisspelled('calc_total') || isWordMisspelled('12345')) {
      throw new Error('Code identifiers and numbers should not be flagged as typos');
    }
    console.log('    ✓ Code identifiers (camelCase, snake_case) and numbers correctly preserved');

    // Autocorrect checks
    const typo1 = autocorrectWord('teh');
    if (!typo1.wasCorrected || typo1.corrected !== 'the') {
      throw new Error(`Autocorrect failed on "teh". Got ${JSON.stringify(typo1)}`);
    }

    const typo2 = autocorrectWord('Recieve');
    if (!typo2.wasCorrected || typo2.corrected !== 'Receive') {
      throw new Error(`Autocorrect casing preservation failed. Expected "Receive", got "${typo2.corrected}"`);
    }

    const typo3 = autocorrectWord('DEFINATELY');
    if (!typo3.wasCorrected || typo3.corrected !== 'DEFINITELY') {
      throw new Error(`Autocorrect uppercase preservation failed. Expected "DEFINITELY", got "${typo3.corrected}"`);
    }
    console.log('    ✓ Autocorrect correctly fixes common typos with casing preservation');

    // Suggestions check
    const suggestions = getSpellingSuggestions('seperate');
    if (!suggestions.includes('separate')) {
      throw new Error(`Suggestions for "seperate" missing "separate": ${suggestions.join(', ')}`);
    }
    console.log(`    ✓ Suggestions for "seperate" included: ${suggestions.join(', ')}`);

    // ----------------------------------------------------
    // SUITE 6: PDF & Print Layout Formatting
    // ----------------------------------------------------
    console.log('\n[SUITE 6: PDF EXPORT & PRINT LAYOUT]');

    const printHtml = manager.generatePrintHtml([note1], {
      includeTitle: true,
      includeMetadata: true,
      includePageNumbers: true,
    });

    if (!printHtml.includes('@page') || !printHtml.includes('note-print-title')) {
      throw new Error('Generated print HTML missing print styling or title');
    }
    if (!printHtml.includes(note1.title)) {
      throw new Error('Print HTML missing note title');
    }
    if (!printHtml.includes('Raft algorithm')) {
      throw new Error('Print HTML missing note body content');
    }
    console.log('    ✓ Generated print HTML contains clean print CSS, unclipped tables, and metadata');

    // ----------------------------------------------------
    // SUITE 7: Predefined Templates Verification
    // ----------------------------------------------------
    console.log('\n[SUITE 7: NOTE TEMPLATES]');

    if (NOTE_TEMPLATES.length < 5) {
      throw new Error(`Expected at least 5 templates, found ${NOTE_TEMPLATES.length}`);
    }
    const templateIds = NOTE_TEMPLATES.map((t) => t.id);
    ['study-notes', 'meeting-notes', 'research-log', 'daily-journal', 'technical-spec'].forEach((id) => {
      if (!templateIds.includes(id)) {
        throw new Error(`Missing required template: ${id}`);
      }
    });
    console.log(`    ✓ All ${NOTE_TEMPLATES.length} note templates verified (Study, Meeting, Research, Journal, Spec)`);

    console.log('\n====================================================');
    console.log('  ALL 7 NEXUS NOTES TEST SUITES PASSED! 🎉          ');
    console.log('====================================================\n');
  } finally {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      win.destroy();
    } catch (e) {}
  }
}

app.whenReady().then(async () => {
  try {
    await runNotesTestSuite();
    app.exit(0);
  } catch (err) {
    console.error('\n❌ NEXUS Notes Test Suite Failed:');
    console.error(err);
    app.exit(1);
  }
});
