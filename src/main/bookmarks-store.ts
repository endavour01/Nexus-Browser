import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { BookmarkItem } from '../shared/types';

export class BookmarksStore {
  private filePath: string;
  private items: Map<string, BookmarkItem> = new Map();

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      try {
        const userData = app.getPath('userData');
        this.filePath = path.join(userData, 'nexus-bookmarks.json');
      } catch {
        this.filePath = path.join(process.cwd(), '.nexus-bookmarks.json');
      }
    }
    this.load();
  }

  public getFilePath(): string {
    return this.filePath;
  }

  private initDefaults() {
    this.items.clear();
    const now = Date.now();

    // Standard root folders
    const toolbarFolder: BookmarkItem = {
      id: 'toolbar',
      type: 'folder',
      title: 'Bookmarks Bar',
      parentId: null,
      createdAt: now,
    };
    const otherFolder: BookmarkItem = {
      id: 'other',
      type: 'folder',
      title: 'Other Bookmarks',
      parentId: null,
      createdAt: now,
    };

    // Starter items inside toolbar
    const starterBookmarks: BookmarkItem[] = [
      {
        id: 'bm-github',
        type: 'bookmark',
        title: 'GitHub',
        url: 'https://github.com',
        parentId: 'toolbar',
        createdAt: now,
      },
      {
        id: 'bm-hn',
        type: 'bookmark',
        title: 'Hacker News',
        url: 'https://news.ycombinator.com',
        parentId: 'toolbar',
        createdAt: now,
      },
      {
        id: 'bm-mdn',
        type: 'bookmark',
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        parentId: 'toolbar',
        createdAt: now,
      },
    ];

    this.items.set(toolbarFolder.id, toolbarFolder);
    this.items.set(otherFolder.id, otherFolder);
    for (const b of starterBookmarks) {
      this.items.set(b.id, b);
    }
  }

  public load(): BookmarkItem[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.initDefaults();
        this.save();
        return this.getAll();
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);

      if (!Array.isArray(data)) {
        console.warn('[NEXUS Bookmarks] Invalid schema in store, resetting defaults');
        this.initDefaults();
        this.save();
        return this.getAll();
      }

      this.items.clear();
      for (const item of data) {
        if (item && item.id && item.title) {
          this.items.set(item.id, {
            id: item.id,
            type: item.type === 'folder' ? 'folder' : 'bookmark',
            title: item.title,
            url: item.url,
            favicon: item.favicon,
            parentId: item.parentId !== undefined ? item.parentId : 'toolbar',
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt,
          });
        }
      }

      // Ensure root folders always exist
      if (!this.items.has('toolbar')) {
        this.items.set('toolbar', {
          id: 'toolbar',
          type: 'folder',
          title: 'Bookmarks Bar',
          parentId: null,
          createdAt: Date.now(),
        });
      }
      if (!this.items.has('other')) {
        this.items.set('other', {
          id: 'other',
          type: 'folder',
          title: 'Other Bookmarks',
          parentId: null,
          createdAt: Date.now(),
        });
      }

      return this.getAll();
    } catch (err) {
      console.error('[NEXUS Bookmarks] Failed to load bookmarks, recovering gracefully:', err);
      this.initDefaults();
      return this.getAll();
    }
  }

  public saveToDisk(): boolean {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const list = Array.from(this.items.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error('[NEXUS Bookmarks] Failed to write bookmarks store:', err);
      return false;
    }
  }

  public save(item?: {
    id?: string;
    title?: string;
    url?: string;
    favicon?: string;
    parentId?: string | null;
    type?: 'bookmark' | 'folder';
  }): any {
    if (item && (item.title || item.url || item.id)) {
      return this.saveBookmark({
        id: item.id,
        title: item.title || '',
        url: item.url,
        favicon: item.favicon,
        parentId: item.parentId,
        type: item.type,
      });
    }
    return this.saveToDisk();
  }

  public saveBookmark(input: {
    id?: string;
    title: string;
    url?: string;
    favicon?: string;
    parentId?: string | null;
    type?: 'bookmark' | 'folder';
  }): BookmarkItem {
    if (input.id && this.items.has(input.id)) {
      const updated = this.updateItem(input.id, input);
      if (updated) return updated;
    }
    if (input.type === 'folder') {
      return this.createFolder(input.title, input.parentId);
    }
    return this.addBookmark({
      id: input.id,
      title: input.title,
      url: input.url || '',
      favicon: input.favicon,
      parentId: input.parentId,
    });
  }

  public remove(id: string): boolean {
    return this.removeItem(id);
  }

  public exportToHtml(): string {
    return this.exportHtml();
  }

  public importFromHtml(html: string): { imported: number } {
    return this.importHtml(html);
  }

  public getAll(): BookmarkItem[] {
    return Array.from(this.items.values());
  }

  public getById(id: string): BookmarkItem | undefined {
    return this.items.get(id);
  }

  public addBookmark(input: {
    id?: string;
    title: string;
    url: string;
    favicon?: string;
    parentId?: string | null;
  }): BookmarkItem {
    const id = input.id || `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const parentId = input.parentId !== undefined ? input.parentId : 'toolbar';
    const item: BookmarkItem = {
      id,
      type: 'bookmark',
      title: input.title || input.url,
      url: input.url,
      favicon: input.favicon,
      parentId,
      createdAt: Date.now(),
    };
    this.items.set(id, item);
    this.save();
    return item;
  }

  public createFolder(title: string, parentId?: string | null): BookmarkItem {
    const id = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const item: BookmarkItem = {
      id,
      type: 'folder',
      title: title.trim() || 'New Folder',
      parentId: parentId !== undefined ? parentId : 'toolbar',
      createdAt: Date.now(),
    };
    this.items.set(id, item);
    this.save();
    return item;
  }

  public updateItem(
    id: string,
    updates: Partial<Pick<BookmarkItem, 'title' | 'url' | 'parentId' | 'favicon'>>
  ): BookmarkItem | null {
    const item = this.items.get(id);
    if (!item) return null;

    if (updates.title !== undefined) item.title = updates.title;
    if (updates.url !== undefined && item.type === 'bookmark') item.url = updates.url;
    if (updates.favicon !== undefined) item.favicon = updates.favicon;
    if (updates.parentId !== undefined) {
      // Prevent circular parenting if moving a folder into its own descendant
      if (item.type === 'folder' && updates.parentId) {
        if (updates.parentId === item.id || this.isDescendant(item.id, updates.parentId)) {
          console.warn('[NEXUS Bookmarks] Cannot set parent to descendant folder');
          return item;
        }
      }
      item.parentId = updates.parentId;
    }
    item.updatedAt = Date.now();
    this.save();
    return item;
  }

  private isDescendant(ancestorId: string, checkId: string): boolean {
    let current = this.items.get(checkId);
    while (current && current.parentId) {
      if (current.parentId === ancestorId) return true;
      current = this.items.get(current.parentId);
    }
    return false;
  }

  public removeItem(id: string): boolean {
    // Protect root folders from complete deletion
    if (id === 'toolbar' || id === 'other') {
      return false;
    }

    if (!this.items.has(id)) return false;

    // Collect all recursive descendants if this is a folder
    const toDelete = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      for (const item of this.items.values()) {
        if (item.parentId && toDelete.has(item.parentId) && !toDelete.has(item.id)) {
          toDelete.add(item.id);
          added = true;
        }
      }
    }

    for (const deleteId of toDelete) {
      this.items.delete(deleteId);
    }

    this.save();
    return true;
  }

  public search(query: string): BookmarkItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    return this.getAll().filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const urlMatch = item.url ? item.url.toLowerCase().includes(q) : false;
      return titleMatch || urlMatch;
    });
  }

  public clear(): boolean {
    this.initDefaults();
    return this.save();
  }

  /**
   * Generates standard Netscape Bookmark File Format (HTML)
   * Compatible with Chrome, Firefox, Safari, Edge, Brave
   */
  public exportHtml(): string {
    let out = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    const renderFolder = (folderId: string | null, indent: string): string => {
      let result = '';
      const children = Array.from(this.items.values()).filter((item) => item.parentId === folderId);

      for (const child of children) {
        if (child.type === 'folder') {
          const addDate = Math.floor(child.createdAt / 1000);
          result += `${indent}<DT><H3 ADD_DATE="${addDate}">${this.escapeHtml(child.title)}</H3>\n`;
          result += `${indent}<DL><p>\n`;
          result += renderFolder(child.id, `${indent}    `);
          result += `${indent}</DL><p>\n`;
        } else if (child.url) {
          const addDate = Math.floor(child.createdAt / 1000);
          const iconAttr = child.favicon ? ` ICON="${child.favicon}"` : '';
          result += `${indent}<DT><A HREF="${this.escapeHtml(child.url)}" ADD_DATE="${addDate}"${iconAttr}>${this.escapeHtml(child.title)}</A>\n`;
        }
      }
      return result;
    };

    // Export Bookmarks Bar first, then Other Bookmarks, then any remaining root items
    out += `    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Bar</H3>\n`;
    out += `    <DL><p>\n`;
    out += renderFolder('toolbar', '        ');
    out += `    </DL><p>\n`;

    out += `    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}">Other Bookmarks</H3>\n`;
    out += `    <DL><p>\n`;
    out += renderFolder('other', '        ');
    out += `    </DL><p>\n`;

    // Root-level custom items
    const otherRoots = Array.from(this.items.values()).filter(
      (item) => item.parentId === null && item.id !== 'toolbar' && item.id !== 'other'
    );
    for (const root of otherRoots) {
      if (root.type === 'folder') {
        out += `    <DT><H3 ADD_DATE="${Math.floor(root.createdAt / 1000)}">${this.escapeHtml(root.title)}</H3>\n`;
        out += `    <DL><p>\n`;
        out += renderFolder(root.id, '        ');
        out += `    </DL><p>\n`;
      } else if (root.url) {
        out += `    <DT><A HREF="${this.escapeHtml(root.url)}">${this.escapeHtml(root.title)}</A>\n`;
      }
    }

    out += `</DL><p>\n`;
    return out;
  }

  /**
   * Imports standard Netscape Bookmark File Format
   */
  public importHtml(htmlContent: string): { imported: number } {
    let importedCount = 0;
    const folderStack: string[] = ['toolbar'];

    // Normalize newlines and process line by line or token by token
    const lines = htmlContent.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Check if folder opens: <H3 ...>Folder Name</H3>
      const folderMatch = line.match(/<H3[^>]*>(.*?)<\/H3>/i);
      if (folderMatch) {
        const folderName = this.unescapeHtml(folderMatch[1].trim());
        const currentParent = folderStack[folderStack.length - 1] || 'toolbar';

        // Check if this is the Bookmarks bar or Other bookmarks root
        if (/PERSONAL_TOOLBAR_FOLDER/i.test(line) || folderName.toLowerCase() === 'bookmarks bar') {
          folderStack.push('toolbar');
        } else if (folderName.toLowerCase() === 'other bookmarks') {
          folderStack.push('other');
        } else {
          const newFolder = this.createFolder(folderName, currentParent);
          folderStack.push(newFolder.id);
          importedCount++;
        }
        continue;
      }

      // Check if folder closes: </DL>
      if (/<\/DL>/i.test(line)) {
        if (folderStack.length > 1) {
          folderStack.pop();
        }
        continue;
      }

      // Check if bookmark link: <A HREF="url" ...>Title</A>
      const bookmarkMatch = line.match(/<A\s+[^>]*HREF="([^"]+)"[^>]*>(.*?)<\/A>/i);
      if (bookmarkMatch) {
        const url = bookmarkMatch[1].trim();
        const title = this.unescapeHtml(bookmarkMatch[2].trim()) || url;
        const currentParent = folderStack[folderStack.length - 1] || 'toolbar';

        // Optional favicon icon
        let icon: string | undefined;
        const iconMatch = line.match(/ICON="([^"]+)"/i);
        if (iconMatch) {
          icon = iconMatch[1];
        }

        this.addBookmark({
          title,
          url,
          favicon: icon,
          parentId: currentParent,
        });
        importedCount++;
      }
    }

    this.save();
    return { imported: importedCount };
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private unescapeHtml(str: string): string {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }
}
