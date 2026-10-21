import type { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { MusicService, MusicState, MusicConnectionState } from '../shared/types';

// ============================================================================
// Default NEXUS Music Services
// ============================================================================
export const DEFAULT_MUSIC_SERVICES: MusicService[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com',
    brandColor: '#1DB954',
    description: 'Stream millions of songs, curated playlists, and podcasts via Spotify Web Player',
    category: 'streaming',
    connectionState: 'available',
    statusText: 'Web Player Ready',
    requiresAuth: true,
    supportsWebPlayer: true,
    isFavorite: true,
    isPinned: false,
    order: 0,
    createdAt: 1700000000000,
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    url: 'https://music.youtube.com',
    brandColor: '#FF0000',
    description: 'Official music tracks, full albums, live performances, and video mixes from YouTube',
    category: 'streaming',
    connectionState: 'available',
    statusText: 'Web Player Ready',
    requiresAuth: true,
    supportsWebPlayer: true,
    isFavorite: true,
    isPinned: false,
    order: 1,
    createdAt: 1700000000001,
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    url: 'https://music.apple.com',
    brandColor: '#FA243C',
    description: 'Over 100 million songs, spatial audio, curated radio stations, and personal library',
    category: 'streaming',
    connectionState: 'available',
    statusText: 'Web Player Ready',
    requiresAuth: true,
    supportsWebPlayer: true,
    isFavorite: false,
    isPinned: false,
    order: 2,
    createdAt: 1700000000002,
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    url: 'https://soundcloud.com',
    brandColor: '#FF5500',
    description: 'Discover independent artists, electronic sets, underground remixes, and podcasts',
    category: 'indie',
    connectionState: 'available',
    statusText: 'Web Player Ready',
    requiresAuth: false,
    supportsWebPlayer: true,
    isFavorite: true,
    isPinned: false,
    order: 3,
    createdAt: 1700000000003,
  },
  {
    id: 'amazon-music',
    name: 'Amazon Music',
    url: 'https://music.amazon.com',
    brandColor: '#00A8E1',
    description: 'Curated playlists, top podcasts, Prime Music access, and HD audio streaming',
    category: 'streaming',
    connectionState: 'available',
    statusText: 'Web Player Ready',
    requiresAuth: true,
    supportsWebPlayer: true,
    isFavorite: false,
    isPinned: false,
    order: 4,
    createdAt: 1700000000004,
  },
  {
    id: 'deezer',
    name: 'Deezer',
    url: 'https://www.deezer.com',
    brandColor: '#A238FF',
    description: 'Personalized Flow recommendations, high-fidelity sound, and global music catalog',
    category: 'hifi',
    connectionState: 'available',
    statusText: 'Web Player Ready',
    requiresAuth: true,
    supportsWebPlayer: true,
    isFavorite: false,
    isPinned: false,
    order: 5,
    createdAt: 1700000000005,
  },
];

// ============================================================================
// MusicManager Class
// ============================================================================
export class MusicManager {
  private storageDir: string;
  private filePath: string;
  private mainWindow: BrowserWindow | null = null;
  private services: MusicService[] = [];

  constructor(storageDir?: string, mainWindow?: BrowserWindow | null) {
    this.storageDir = storageDir || path.join(process.cwd(), 'userData');
    this.mainWindow = mainWindow || null;

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (err) {
        console.error('[MusicManager] Failed to create storage directory:', err);
      }
    }

    this.filePath = path.join(this.storageDir, 'nexus-music.json');
    this.loadState();
  }

  public setMainWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  /**
   * Safe URL validation helper
   * Disallows javascript:, data:, vbscript:, file: and requires valid host
   */
  public static validateUrl(inputUrl: string): { valid: boolean; cleanUrl?: string; error?: string } {
    if (!inputUrl || typeof inputUrl !== 'string') {
      return { valid: false, error: 'URL must be a non-empty string' };
    }

    let trimmed = inputUrl.trim();
    if (!trimmed) {
      return { valid: false, error: 'URL cannot be empty' };
    }

    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:') ||
      lower.startsWith('blob:')
    ) {
      return { valid: false, error: 'Invalid URL scheme. Only HTTP and HTTPS URLs are permitted.' };
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTP and HTTPS URLs are permitted.' };
      }
      if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
        if (parsed.hostname !== 'localhost') {
          return { valid: false, error: 'URL must have a valid domain hostname.' };
        }
      }
      return { valid: true, cleanUrl: parsed.toString() };
    } catch {
      return { valid: false, error: 'Malformed URL. Please enter a valid web address.' };
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const data: MusicState = JSON.parse(raw);

        if (Array.isArray(data.services) && data.services.length > 0) {
          // Merge defaults in case any new default service was added
          const existingIds = new Set(data.services.map((s) => s.id));
          const merged = [...data.services];
          for (const def of DEFAULT_MUSIC_SERVICES) {
            if (!existingIds.has(def.id)) {
              merged.push({ ...def });
            }
          }
          this.services = merged.sort((a, b) => a.order - b.order);
        } else {
          console.warn('[MusicManager] Corrupted schema in nexus-music.json, resetting to defaults');
          this.resetDefaultServices();
        }
      } else {
        this.resetDefaultServices();
      }
    } catch (err) {
      console.error('[MusicManager] Failed to read or parse nexus-music.json, resetting:', err);
      this.resetDefaultServices();
    }
  }

  public resetDefaultServices(): MusicService[] {
    this.services = JSON.parse(JSON.stringify(DEFAULT_MUSIC_SERVICES));
    this.saveState();
    this.notifyUpdate();
    return this.getServices();
  }

  private saveState() {
    try {
      const state: MusicState = {
        services: this.services,
      };

      const tempFile = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
      fs.renameSync(tempFile, this.filePath);
    } catch (err) {
      console.error('[MusicManager] Failed to save nexus-music.json:', err);
    }
  }

  private notifyUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('music:updated', {
        services: this.getServices(),
      });
    }
  }

  public getServices(): MusicService[] {
    return [...this.services].sort((a, b) => a.order - b.order);
  }

  public getService(id: string): MusicService | undefined {
    return this.services.find((s) => s.id === id);
  }

  public saveService(serviceData: Partial<MusicService> & { name: string; url: string }): MusicService {
    const val = MusicManager.validateUrl(serviceData.url);
    if (!val.valid || !val.cleanUrl) {
      throw new Error(val.error || 'Invalid URL');
    }

    if (serviceData.id) {
      const idx = this.services.findIndex((s) => s.id === serviceData.id);
      if (idx !== -1) {
        this.services[idx] = {
          ...this.services[idx],
          ...serviceData,
          url: val.cleanUrl,
          updatedAt: Date.now(),
        };
        this.saveState();
        this.notifyUpdate();
        return this.services[idx];
      }
    }

    const newService: MusicService = {
      id: serviceData.id || `custom-music-${Date.now()}`,
      name: serviceData.name.trim(),
      url: val.cleanUrl,
      brandColor: serviceData.brandColor || '#A78BFA',
      description: serviceData.description || 'Custom Web Music Streamer',
      category: serviceData.category || 'custom',
      connectionState: serviceData.connectionState || 'available',
      statusText: serviceData.statusText || 'Web Player Ready',
      requiresAuth: serviceData.requiresAuth ?? false,
      supportsWebPlayer: serviceData.supportsWebPlayer ?? true,
      isFavorite: !!serviceData.isFavorite,
      isPinned: !!serviceData.isPinned,
      order: this.services.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.services.push(newService);
    this.saveState();
    this.notifyUpdate();
    return newService;
  }

  public setConnectionState(id: string, state: MusicConnectionState, statusText?: string): boolean {
    const service = this.services.find((s) => s.id === id);
    if (!service) return false;

    service.connectionState = state;
    if (statusText) {
      service.statusText = statusText;
    } else {
      switch (state) {
        case 'available':
          service.statusText = 'Web Player Ready';
          break;
        case 'not_connected':
          service.statusText = 'Sign-in Optional';
          break;
        case 'connecting':
          service.statusText = 'Connecting...';
          break;
        case 'connected':
          service.statusText = 'Connected';
          break;
        case 'unavailable':
          service.statusText = 'Service Offline';
          break;
        case 'error':
          service.statusText = 'Connection Error';
          break;
      }
    }
    service.updatedAt = Date.now();
    this.saveState();
    this.notifyUpdate();
    return true;
  }

  public disconnectService(id: string): boolean {
    return this.setConnectionState(id, 'not_connected', 'Disconnected');
  }

  public toggleFavorite(id: string): boolean {
    const service = this.services.find((s) => s.id === id);
    if (!service) return false;

    service.isFavorite = !service.isFavorite;
    service.updatedAt = Date.now();
    this.saveState();
    this.notifyUpdate();
    return true;
  }

  public recordOpened(id: string): void {
    const service = this.services.find((s) => s.id === id);
    if (!service) return;

    service.lastOpenedAt = Date.now();
    service.updatedAt = Date.now();
    this.saveState();
    this.notifyUpdate();
  }
}
