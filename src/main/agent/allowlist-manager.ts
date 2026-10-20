/**
 * NEXUS AI Browser Assistant — Per-Site Allowlist Manager
 * Ensures the agent only acts on domains that the user has explicitly approved.
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export class AllowlistManager {
  private filePath: string;
  private allowedHostnames: Set<string> = new Set();

  constructor(customStorageDir?: string) {
    try {
      const baseDir = customStorageDir || app.getPath('userData');
      this.filePath = path.join(baseDir, 'nexus-agent-allowlist.json');
    } catch {
      this.filePath = path.join(process.cwd(), '.nexus-agent-allowlist.json');
    }
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (typeof item === 'string' && item.trim()) {
            this.allowedHostnames.add(this.normalizeHostname(item));
          }
        }
      }
    } catch (err) {
      console.error('[AllowlistManager] Failed to load allowlist from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.allowedHostnames);
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[AllowlistManager] Failed to save allowlist to disk:', err);
    }
  }

  public normalizeHostname(input: string): string {
    if (!input || typeof input !== 'string') return '';
    let host = input.trim().toLowerCase();
    try {
      if (host.startsWith('http://') || host.startsWith('https://') || host.startsWith('nexus://')) {
        const u = new URL(host);
        return u.hostname || host;
      }
      // If port is present without protocol e.g. localhost:8080
      if (host.includes(':')) {
        host = host.split(':')[0];
      }
      // Remove path segments
      host = host.split('/')[0];
      return host;
    } catch {
      return host;
    }
  }

  public isAllowed(urlOrHostname: string): boolean {
    const host = this.normalizeHostname(urlOrHostname);
    if (!host) return false;
    return this.allowedHostnames.has(host);
  }

  public allowSite(urlOrHostname: string): string {
    const host = this.normalizeHostname(urlOrHostname);
    if (host) {
      this.allowedHostnames.add(host);
      this.saveToDisk();
    }
    return host;
  }

  public removeSite(urlOrHostname: string): boolean {
    const host = this.normalizeHostname(urlOrHostname);
    const removed = this.allowedHostnames.delete(host);
    if (removed) {
      this.saveToDisk();
    }
    return removed;
  }

  public getAllowedSites(): string[] {
    return Array.from(this.allowedHostnames).sort();
  }

  public clearAll() {
    this.allowedHostnames.clear();
    this.saveToDisk();
  }
}
