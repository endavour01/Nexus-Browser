import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { HistoryEntry } from '../shared/types';

export class HistoryStore {
  private filePath: string;
  private entries: HistoryEntry[] = [];
  private maxEntries: number = 5000;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      try {
        const userData = app.getPath('userData');
        this.filePath = path.join(userData, 'nexus-history.json');
      } catch {
        this.filePath = path.join(process.cwd(), '.nexus-history.json');
      }
    }
    this.load();
  }

  public getFilePath(): string {
    return this.filePath;
  }

  public load(): HistoryEntry[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.entries = [];
        return [];
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);

      if (!Array.isArray(data)) {
        console.warn('[NEXUS History] Invalid history schema, starting fresh');
        this.entries = [];
        return [];
      }

      this.entries = data
        .filter((item) => item && item.id && item.url)
        .map((item) => ({
          id: item.id,
          title: item.title || item.url,
          url: item.url,
          favicon: item.favicon,
          timestamp: item.timestamp || Date.now(),
          visitCount: typeof item.visitCount === 'number' ? item.visitCount : 1,
        }));

      return this.entries;
    } catch (err) {
      console.error('[NEXUS History] Failed to load history, resetting:', err);
      this.entries = [];
      return [];
    }
  }

  public save(): boolean {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.entries, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error('[NEXUS History] Failed to save history:', err);
      return false;
    }
  }

  public addEntry(
    title: string,
    url: string,
    favicon?: string,
    customTimestamp?: number
  ): HistoryEntry | null {
    const trimmed = (url || '').trim();
    if (!trimmed) return null;

    // Filter out internal and invalid schemes
    if (
      trimmed.startsWith('nexus://') ||
      trimmed.startsWith('about:') ||
      trimmed.startsWith('data:text/html') ||
      trimmed.startsWith('chrome-extension://')
    ) {
      return null;
    }

    // Check if the URL already exists
    const existingIndex = this.entries.findIndex((e) => e.url === trimmed);
    const now = customTimestamp || Date.now();

    let entry: HistoryEntry;

    if (existingIndex >= 0) {
      const existing = this.entries[existingIndex];
      entry = {
        ...existing,
        title: title && title !== 'Loading...' && title !== 'Untitled' ? title : existing.title,
        favicon: favicon || existing.favicon,
        timestamp: now,
        visitCount: (existing.visitCount || 1) + 1,
      };
      // Remove previous position and put updated entry at the front
      this.entries.splice(existingIndex, 1);
      this.entries.unshift(entry);
    } else {
      entry = {
        id: `hist-${now}-${Math.random().toString(36).substring(2, 7)}`,
        title: title || trimmed,
        url: trimmed,
        favicon,
        timestamp: now,
        visitCount: 1,
      };
      this.entries.unshift(entry);
    }

    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }

    this.save();
    return entry;
  }

  public recordVisit(
    url: string,
    title: string,
    favicon?: string,
    timestamp?: number
  ): HistoryEntry {
    const entry = this.addEntry(title, url, favicon, timestamp);
    if (!entry) throw new Error('Invalid URL for recordVisit: ' + url);
    return entry;
  }

  public getAll(limit?: number): HistoryEntry[] {
    if (typeof limit === 'number' && limit > 0) {
      return this.entries.slice(0, limit);
    }
    return [...this.entries];
  }

  public search(query: string, limit?: number): HistoryEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll(limit);

    const matches = this.entries.filter((entry) => {
      const titleMatch = entry.title.toLowerCase().includes(q);
      const urlMatch = entry.url.toLowerCase().includes(q);
      return titleMatch || urlMatch;
    });

    if (typeof limit === 'number' && limit > 0) {
      return matches.slice(0, limit);
    }
    return matches;
  }

  public deleteEntry(id: string): boolean {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.entries.splice(idx, 1);
    this.save();
    return true;
  }

  public deleteRange(startTime: number, endTime: number): number {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter(
      (entry) => entry.timestamp < startTime || entry.timestamp > endTime
    );
    const removedCount = initialLength - this.entries.length;
    if (removedCount > 0) {
      this.save();
    }
    return removedCount;
  }

  public clearAll(): boolean {
    this.entries = [];
    return this.save();
  }

  public clear(): boolean {
    return this.clearAll();
  }
}
