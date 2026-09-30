import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Highlighter,
  Undo2,
  Redo2,
  Search,
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  Trash2,
  Check,
  ChevronDown,
  X,
  FileText,
  Bookmark,
} from 'lucide-react';

import { NexusNote } from '@shared/types';
import { SketchCanvasModal } from './SketchCanvasModal';
import { NOTE_TEMPLATES, NoteTemplate } from './templates';
import { autocorrectWord, getSpellingSuggestions, isWordMisspelled } from './spellcheck';

interface NotesEditorProps {
  note: NexusNote | null;
  onSave: (updates: Partial<NexusNote>) => void;
  onLinkActiveTab?: () => void;
  onRemoveTabLink?: () => void;
  onOpenUrl?: (url: string) => void;
  activeTabUrl?: string;
  activeTabTitle?: string;
  activeTabFavicon?: string;
  onExportPdf?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  readOnly?: boolean;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  note,
  onSave,
  onLinkActiveTab,
  onRemoveTabLink,
  onOpenUrl,
  activeTabUrl,
  activeTabTitle,
  activeTabFavicon,
  onExportPdf,
  isFocusMode = false,
  onToggleFocusMode,
  readOnly = false,
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isSketchOpen, setIsSketchOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [autocorrectEnabled, setAutocorrectEnabled] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // Spell suggestions popover state
  const [spellPopover, setSpellPopover] = useState<{
    word: string;
    suggestions: string[];
    x: number;
    y: number;
  } | null>(null);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentNoteIdRef = useRef<string | null>(null);

  const paletteColors = [
    '#A78BFA', // Violet
    '#F5C542', // Golden
    '#F02D43', // Redline
    '#38BDF8', // Cyan
    '#34D399', // Emerald
    '#FB923C', // Amber
    '#F43F5E', // Rose
    '#E2E8F0', // Light slate
    '#64748B', // Slate
    '#0F172A', // Dark slate
  ];

  const highlightColors = [
    '#fef08a', // Yellow
    '#bbf7d0', // Green
    '#bae6fd', // Blue
    '#fed7aa', // Orange
    '#fbcfe8', // Pink
    '#e9d5ff', // Purple
  ];

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'nexus-note-link',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note, paste images, or draw diagrams...',
      }),
    ],
    content: note?.content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      triggerAutoSave(editor.getHTML());
    },
  });

  // Keep editor content in sync when active note changes
  useEffect(() => {
    if (note && note.id !== currentNoteIdRef.current) {
      currentNoteIdRef.current = note.id;
      setTitle(note.title);
      if (editor && editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '', { emitUpdate: false });
      }
      setSaveStatus('saved');
    }
  }, [note, editor]);

  // Debounced auto-save
  const triggerAutoSave = useCallback(
    (htmlContent?: string) => {
      if (!note) return;
      setSaveStatus('saving');

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        const contentToSave = htmlContent !== undefined ? htmlContent : editor?.getHTML() || '';
        onSave({
          id: note.id,
          title: title.trim() || 'Untitled Note',
          content: contentToSave,
        });
        setSaveStatus('saved');
      }, 400);
    },
    [note, title, editor, onSave]
  );

  // Handle title edit
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('unsaved');
    triggerAutoSave();
  };

  // Keyboard shortcut listener for formatting and in-note search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autocorrect on Space / Enter
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (!autocorrectEnabled || !editor) return;

    if (e.key === ' ' || e.key === 'Enter') {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 30), from, ' ');
      const match = textBefore.match(/([a-zA-Z]+)$/);

      if (match) {
        const lastWord = match[1];
        const res = autocorrectWord(lastWord);
        if (res.wasCorrected) {
          const wordStart = from - lastWord.length;
          editor
            .chain()
            .focus()
            .deleteRange({ from: wordStart, to: from })
            .insertContent(res.corrected)
            .run();
        }
      }
    }
  };

  // Tag management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim() && note) {
      e.preventDefault();
      const cleanTag = customTagInput.trim().toLowerCase().replace(/^#/, '');
      const existingTags = note.tags || [];
      if (!existingTags.includes(cleanTag)) {
        const updatedTags = [...existingTags, cleanTag];
        onSave({ id: note.id, tags: updatedTags });
      }
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!note) return;
    const updatedTags = (note.tags || []).filter((t) => t !== tagToRemove);
    onSave({ id: note.id, tags: updatedTags });
  };

  // Insert template into note
  const handleApplyTemplate = (tmpl: NoteTemplate) => {
    if (!editor || !note) return;
    if (confirm('Apply this template? It will replace the current content.')) {
      setTitle(tmpl.defaultTitle);
      editor.commands.setContent(tmpl.content, { emitUpdate: true });
      onSave({
        id: note.id,
        title: tmpl.defaultTitle,
        content: tmpl.content,
        tags: Array.from(new Set([...(note.tags || []), ...tmpl.tags])),
      });
      setIsTemplatesOpen(false);
    }
  };

  // Insert image dialog
  const handleInsertImage = () => {
    const url = prompt('Enter image URL or paste data URI:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Insert link dialog
  const handleInsertLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = prompt('Enter hyperlink URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Insert drawing callback
  const handleInsertDrawing = (dataUrl: string) => {
    if (editor && note) {
      editor.chain().focus().setImage({ src: dataUrl, alt: 'NEXUS Drawing' }).run();
      onSave({ id: note.id, drawingData: dataUrl });
    }
  };

  // In-Note Search & Replace
  const handleFindNext = () => {
    if (!searchQuery || !editor) return;
    // Simple text-based navigation
    const text = editor.getText();
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx !== -1) {
      editor.commands.setTextSelection({ from: idx + 1, to: idx + 1 + searchQuery.length });
    }
  };

  const handleReplace = () => {
    if (!searchQuery || !editor) return;
    const html = editor.getHTML();
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(html)) {
      const updated = html.replace(regex, replaceQuery);
      editor.commands.setContent(updated, { emitUpdate: false });
      triggerAutoSave(updated);
    }
  };

  const handleReplaceAll = () => {
    if (!searchQuery || !editor) return;
    const html = editor.getHTML();
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const updated = html.replace(regex, replaceQuery);
    editor.commands.setContent(updated, { emitUpdate: false });
    triggerAutoSave(updated);
  };

  if (!note) {
    return (
      <div className="notes-empty-state">
        <FileText size={48} className="text-secondary" />
        <h3 className="empty-title">No Note Selected</h3>
        <p className="empty-desc">
          Select a note from the library or create a new note to start capturing your thoughts.
        </p>
      </div>
    );
  }

  return (
    <div className={`notes-editor-container ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* 1. Top Editor Toolbar */}
      <header className="notes-editor-toolbar">
        {/* Undo / Redo */}
        <div className="toolbar-btn-group">
          <button
            className="nexus-icon-btn editor-btn"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            className="nexus-icon-btn editor-btn"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Headings */}
        <div className="toolbar-btn-group">
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Inline Formatting */}
        <div className="toolbar-btn-group">
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('bold') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('italic') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('underline') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('strike') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('code') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleCode().run()}
            title="Inline Code"
          >
            <Code size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Text Alignment */}
        <div className="toolbar-btn-group">
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            title="Align Justify"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Lists & Task Lists */}
        <div className="toolbar-btn-group">
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('bulletList') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('orderedList') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('taskList') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            title="Task List / Checkbox"
          >
            <CheckSquare size={16} />
          </button>
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('blockquote') ? 'active' : ''}`}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <Quote size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Colors & Highlighting */}
        <div className="toolbar-btn-group relative">
          <button
            className="nexus-icon-btn editor-btn"
            onClick={() => {
              setIsColorMenuOpen((prev) => !prev);
              setIsHighlightMenuOpen(false);
            }}
            title="Text Color"
          >
            <Palette size={16} />
          </button>
          {isColorMenuOpen && (
            <div className="editor-dropdown-popover">
              <div className="popover-title">Text Color</div>
              <div className="color-swatches-grid">
                {paletteColors.map((c) => (
                  <button
                    key={c}
                    className="swatch-btn"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      editor?.chain().focus().setColor(c).run();
                      setIsColorMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('highlight') ? 'active' : ''}`}
            onClick={() => {
              setIsHighlightMenuOpen((prev) => !prev);
              setIsColorMenuOpen(false);
            }}
            title="Highlight Color"
          >
            <Highlighter size={16} />
          </button>
          {isHighlightMenuOpen && (
            <div className="editor-dropdown-popover">
              <div className="popover-title">Highlight</div>
              <div className="color-swatches-grid">
                {highlightColors.map((c) => (
                  <button
                    key={c}
                    className="swatch-btn"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      editor?.chain().focus().toggleHighlight({ color: c }).run();
                      setIsHighlightMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* Table Management */}
        <div className="toolbar-btn-group relative">
          <button
            className={`nexus-icon-btn editor-btn ${editor?.isActive('table') ? 'active' : ''}`}
            onClick={() => setIsTableMenuOpen((prev) => !prev)}
            title="Table Tools"
          >
            <TableIcon size={16} />
            <ChevronDown size={12} />
          </button>
          {isTableMenuOpen && (
            <div className="editor-dropdown-popover table-actions-popover">
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  setIsTableMenuOpen(false);
                }}
              >
                Insert 3x3 Table
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.chain().focus().addRowAfter().run();
                  setIsTableMenuOpen(false);
                }}
              >
                Add Row Below
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.chain().focus().addColumnAfter().run();
                  setIsTableMenuOpen(false);
                }}
              >
                Add Column Right
              </button>
              <button
                className="dropdown-item text-danger"
                onClick={() => {
                  editor?.chain().focus().deleteRow().run();
                  setIsTableMenuOpen(false);
                }}
              >
                Delete Row
              </button>
              <button
                className="dropdown-item text-danger"
                onClick={() => {
                  editor?.chain().focus().deleteColumn().run();
                  setIsTableMenuOpen(false);
                }}
              >
                Delete Column
              </button>
              <button
                className="dropdown-item text-danger"
                onClick={() => {
                  editor?.chain().focus().deleteTable().run();
                  setIsTableMenuOpen(false);
                }}
              >
                Delete Table
              </button>
            </div>
          )}
        </div>

        {/* Media & Embeds */}
        <div className="toolbar-btn-group">
          <button className="nexus-icon-btn editor-btn" onClick={handleInsertLink} title="Insert Link">
            <LinkIcon size={16} />
          </button>
          <button className="nexus-icon-btn editor-btn" onClick={handleInsertImage} title="Insert Image">
            <ImageIcon size={16} />
          </button>
          <button
            className="nexus-icon-btn editor-btn text-accent"
            onClick={() => setIsSketchOpen(true)}
            title="Open Sketch Canvas &amp; Diagrams"
          >
            <Sparkles size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Templates Dropdown */}
        <div className="toolbar-btn-group relative">
          <button
            className="nexus-icon-btn editor-btn"
            onClick={() => setIsTemplatesOpen((prev) => !prev)}
            title="Insert Template"
          >
            <Bookmark size={16} />
            <span style={{ fontSize: '11px', marginLeft: '4px' }}>Templates</span>
          </button>
          {isTemplatesOpen && (
            <div className="editor-dropdown-popover templates-popover">
              <div className="popover-title">Select Template</div>
              {NOTE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  className="template-item-btn"
                  onClick={() => handleApplyTemplate(tmpl)}
                >
                  <div className="template-item-title">{tmpl.name}</div>
                  <div className="template-item-desc">{tmpl.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-spacer" />

        {/* Right side toolbar tools */}
        <div className="toolbar-right-tools">
          {/* Autocorrect Toggle */}
          <button
            className={`autocorrect-toggle-btn ${autocorrectEnabled ? 'active' : ''}`}
            onClick={() => setAutocorrectEnabled((prev) => !prev)}
            title={autocorrectEnabled ? 'Autocorrect: Active (Click to disable)' : 'Autocorrect: Disabled'}
          >
            <span className="dot" />
            Autocorrect
          </button>

          {/* Search Toggle */}
          <button
            className={`nexus-icon-btn editor-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen((prev) => !prev)}
            title="Find &amp; Replace (Ctrl+F)"
          >
            <Search size={16} />
          </button>

          {/* PDF Export */}
          {onExportPdf && (
            <button
              className="nexus-icon-btn editor-btn"
              onClick={onExportPdf}
              title="Export Note to PDF"
            >
              <Download size={16} />
            </button>
          )}

          {/* Focus Mode */}
          {onToggleFocusMode && (
            <button
              className="nexus-icon-btn editor-btn"
              onClick={onToggleFocusMode}
              title={isFocusMode ? 'Exit Focus Mode' : 'Distraction-Free Focus Mode'}
            >
              {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </header>

      {/* 2. In-Note Search & Replace Bar */}
      {isSearchOpen && (
        <div className="in-note-search-bar">
          <div className="search-inputs">
            <input
              type="text"
              placeholder="Find in note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindNext()}
              className="search-input"
              autoFocus
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-actions">
            <button className="nexus-btn btn-secondary btn-sm" onClick={handleFindNext}>
              Find Next
            </button>
            <button className="nexus-btn btn-secondary btn-sm" onClick={handleReplace}>
              Replace
            </button>
            <button className="nexus-btn btn-secondary btn-sm" onClick={handleReplaceAll}>
              Replace All
            </button>
            <button className="nexus-icon-btn btn-sm" onClick={() => setIsSearchOpen(false)}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Linked Browser Tab Banner */}
      {note.linkedTab ? (
        <div className="linked-tab-banner">
          <div className="linked-tab-copy">
            <span className="tab-badge">Linked Tab</span>
            <span className="linked-tab-title" title={note.linkedTab.title}>
              {note.linkedTab.title || note.linkedTab.url}
            </span>
            <span className="linked-tab-url" title={note.linkedTab.url}>
              {note.linkedTab.url}
            </span>
          </div>
          <div className="linked-tab-actions">
            {onOpenUrl && (
              <button
                className="nexus-btn-sm nexus-btn-secondary linked-tab-open"
                onClick={() => onOpenUrl(note.linkedTab!.url)}
                title="Open source URL in browser tab"
              >
                <ExternalLink size={13} />
                Open
              </button>
            )}
            {onRemoveTabLink && (
              <button
                className="nexus-icon-btn linked-tab-remove"
                onClick={onRemoveTabLink}
                title="Unlink tab from this note"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ) : activeTabUrl && activeTabUrl !== 'nexus://notes' && onLinkActiveTab ? (
        <div className="link-tab-prompt">
          <button className="link-tab-btn" onClick={onLinkActiveTab}>
            <ExternalLink size={13} />
            Link current browser tab ({activeTabTitle || activeTabUrl})
          </button>
        </div>
      ) : null}

      {/* 4. Note Header: Title & Tags */}
      <div className="note-header-section">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="note-title-input"
          readOnly={readOnly}
        />

        {/* Tags bar */}
        <div className="note-tags-row">
          {(note.tags || []).map((t) => (
            <span key={t} className="note-tag-pill">
              #{t}
              {!readOnly && (
                <button
                  className="tag-remove-btn"
                  onClick={() => handleRemoveTag(t)}
                  title="Remove tag"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
          {!readOnly && (
            <input
              type="text"
              placeholder="+ add tag..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="tag-input"
            />
          )}
        </div>
      </div>

      {/* 5. Central Rich-Text Editor Content */}
      <div className="note-editor-body" onKeyDown={handleEditorKeyDown}>
        <EditorContent editor={editor} className="tiptap-content-host" />
      </div>

      {/* 6. Footer Status Bar */}
      <footer className="note-editor-footer">
        <div className="footer-left">
          <span className={`save-status-indicator ${saveStatus}`}>
            {saveStatus === 'saved' && <Check size={13} />}
            {saveStatus === 'saving' && <span className="saving-spinner" />}
            {saveStatus === 'unsaved' && <span className="unsaved-dot" />}
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
          </span>
        </div>

        <div className="footer-right">
          <span className="footer-metric">
            {editor?.getText().split(/\s+/).filter(Boolean).length || 0} words
          </span>
          <span className="footer-separator">•</span>
          <span className="footer-metric">{editor?.getText().length || 0} characters</span>
          <span className="footer-separator">•</span>
          <span className="footer-metric">
            {Math.max(1, Math.ceil((editor?.getText().split(/\s+/).filter(Boolean).length || 0) / 200))} min read
          </span>
        </div>
      </footer>

      {/* Sketch Canvas Modal */}
      <SketchCanvasModal
        isOpen={isSketchOpen}
        onClose={() => setIsSketchOpen(false)}
        onInsertDrawing={handleInsertDrawing}
        initialDataUrl={note.drawingData}
      />
    </div>
  );
};
