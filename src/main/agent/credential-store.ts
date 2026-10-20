/**
 * NEXUS AI Browser Assistant — Credential Store
 * Encrypted with Electron safeStorage (OS keychain).
 * Credentials are represented to the AI as {{cred:site.password}} placeholders.
 * The model NEVER receives real passwords or decrypted values.
 */

import { app, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { StoredCredentialMetadata } from '../../shared/types';

interface EncryptedCredentialRecord {
  id: string;
  site: string;
  name: string;
  username: string;
  encryptedSecret: string; // Base64 of encrypted buffer
  isSafeStorage: boolean;
  createdAt: number;
}

export class CredentialStore {
  private filePath: string;
  private memoryFallbackKey: Buffer;
  private records: Map<string, EncryptedCredentialRecord> = new Map();

  constructor(customStorageDir?: string) {
    try {
      const baseDir = customStorageDir || app.getPath('userData');
      this.filePath = path.join(baseDir, 'nexus-credentials.json');
    } catch {
      this.filePath = path.join(process.cwd(), '.nexus-credentials.json');
    }
    // Fixed deterministic fallback key for test environments where safeStorage is unavailable
    this.memoryFallbackKey = crypto.createHash('sha256').update('nexus-credential-fallback-key').digest();
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const rec of list) {
          if (rec && typeof rec.id === 'string' && typeof rec.site === 'string') {
            this.records.set(rec.id, rec);
          }
        }
      }
    } catch (err) {
      console.error('[CredentialStore] Failed to load credentials from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.records.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[CredentialStore] Failed to save credentials to disk:', err);
    }
  }

  private encrypt(secret: string): { encryptedSecret: string; isSafeStorage: boolean } {
    try {
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        const buffer = safeStorage.encryptString(secret);
        return { encryptedSecret: buffer.toString('base64'), isSafeStorage: true };
      }
    } catch {
      // Fall through to fallback
    }

    // Fallback using AES-256-GCM when OS keychain / safeStorage is not available (e.g. CI headless)
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.memoryFallbackKey, iv);
    const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, enc]);
    return { encryptedSecret: combined.toString('base64'), isSafeStorage: false };
  }

  private decrypt(record: EncryptedCredentialRecord): string {
    const buffer = Buffer.from(record.encryptedSecret, 'base64');
    if (record.isSafeStorage) {
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(buffer);
      }
      throw new Error('safeStorage encryption is not available in current environment');
    }

    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const data = buffer.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.memoryFallbackKey, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
  }

  public saveCredential(site: string, name: string, username: string, secret: string): string {
    const id = `cred-${crypto.randomUUID()}`;
    const cleanSite = site.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const { encryptedSecret, isSafeStorage } = this.encrypt(secret);

    const record: EncryptedCredentialRecord = {
      id,
      site: cleanSite,
      name: name.trim() || cleanSite,
      username: username.trim(),
      encryptedSecret,
      isSafeStorage,
      createdAt: Date.now(),
    };

    this.records.set(id, record);
    this.saveToDisk();
    return id;
  }

  public listCredentials(): StoredCredentialMetadata[] {
    return Array.from(this.records.values()).map((r) => ({
      id: r.id,
      site: r.site,
      name: r.name,
      username: r.username,
      createdAt: r.createdAt,
    }));
  }

  public getCredentialById(id: string): StoredCredentialMetadata | null {
    const r = this.records.get(id);
    if (!r) return null;
    return {
      id: r.id,
      site: r.site,
      name: r.name,
      username: r.username,
      createdAt: r.createdAt,
    };
  }

  public deleteCredential(id: string): boolean {
    const deleted = this.records.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  public clearAll() {
    this.records.clear();
    this.saveToDisk();
  }

  public getDecryptedSecret(id: string): string | null {
    const r = this.records.get(id);
    if (!r) return null;
    try {
      return this.decrypt(r);
    } catch (err) {
      console.error(`[CredentialStore] Decryption failed for credential ${id}:`, err);
      return null;
    }
  }

  /**
   * Generates sanitized placeholders for the model prompt.
   * Format: {{cred:<site>.username}}, {{cred:<site>.password}}
   */
  public getAvailablePlaceholders(): string[] {
    const placeholders: string[] = [];
    for (const r of this.records.values()) {
      placeholders.push(`{{cred:${r.site}.username}} (User: "${r.username}")`);
      placeholders.push(`{{cred:${r.site}.password}} (Password for ${r.site})`);
      if (r.name && r.name !== r.site) {
        const slug = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        placeholders.push(`{{cred:${slug}.password}}`);
      }
    }
    return placeholders;
  }

  /**
   * Resolves any {{cred:...}} placeholders in a text string into real values.
   * Used strictly by Executor immediately before dispatching input events.
   */
  public substitutePlaceholders(text: string): { substitutedText: string; hadSecret: boolean } {
    let result = text;
    let hadSecret = false;

    // Pattern matches {{cred:<identifier>.<field>}}
    const pattern = /\{\{cred:([^.]+)\.([^}]+)\}\}/g;
    result = result.replace(pattern, (match, siteOrName, field) => {
      const normalizedQuery = siteOrName.trim().toLowerCase();
      const normalizedField = field.trim().toLowerCase();

      // Find matching record by site or name
      const record = Array.from(this.records.values()).find(
        (r) =>
          r.site.toLowerCase() === normalizedQuery ||
          r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalizedQuery ||
          r.id === normalizedQuery
      );

      if (!record) {
        return match; // Keep placeholder if unknown
      }

      if (normalizedField === 'username' || normalizedField === 'user' || normalizedField === 'login') {
        return record.username;
      }

      if (normalizedField === 'password' || normalizedField === 'secret') {
        const secret = this.getDecryptedSecret(record.id);
        if (secret !== null) {
          hadSecret = true;
          return secret;
        }
      }

      return match;
    });

    return { substitutedText: result, hadSecret };
  }

  /**
   * Security audit check: asserts that none of the decrypted secrets in the store
   * appear in the given text string. Used to verify zero-password prompt leakage.
   */
  public containsAnySecret(text: string): { leaked: boolean; site?: string } {
    if (!text) return { leaked: false };
    for (const record of this.records.values()) {
      try {
        const secret = this.decrypt(record);
        if (secret && secret.length >= 4 && text.includes(secret)) {
          return { leaked: true, site: record.site };
        }
      } catch {}
    }
    return { leaked: false };
  }
}
