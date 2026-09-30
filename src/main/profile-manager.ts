import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { UserProfile } from '../shared/types';

export class ProfileManager {
  private filePath: string;
  private profilesDir: string;
  private profiles: Map<string, UserProfile> = new Map();
  private activeProfileId: string = 'personal';
  private mainWindow: BrowserWindow | null = null;

  constructor(customPath?: string, mainWindow?: BrowserWindow | null) {
    this.mainWindow = mainWindow || null;

    if (customPath) {
      this.filePath = customPath;
      this.profilesDir = path.join(path.dirname(customPath), 'profiles');
    } else {
      let baseDir = process.cwd();
      try {
        baseDir = app.getPath('userData');
      } catch {
        baseDir = path.join(process.cwd(), '.nexus-data');
      }
      this.filePath = path.join(baseDir, 'nexus-profiles.json');
      this.profilesDir = path.join(baseDir, 'profiles');
    }

    this.load();
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  private initDefaults() {
    const now = Date.now();
    const defaults: UserProfile[] = [
      {
        id: 'personal',
        name: 'Personal',
        icon: 'User',
        color: '#A78BFA',
        createdAt: now,
        isDefault: true,
      },
      {
        id: 'work',
        name: 'Work',
        icon: 'Briefcase',
        color: '#38BDF8',
        createdAt: now + 1,
      },
      {
        id: 'dev',
        name: 'Developer',
        icon: 'Code',
        color: '#34D399',
        createdAt: now + 2,
      },
    ];

    this.profiles.clear();
    for (const p of defaults) {
      this.profiles.set(p.id, p);
    }
    this.activeProfileId = 'personal';
  }

  public load(): UserProfile[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.initDefaults();
        this.save();
        return this.getAll();
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);

      if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
        this.profiles.clear();
        for (const p of data.profiles) {
          if (p && p.id && p.name) {
            this.profiles.set(p.id, {
              id: p.id,
              name: p.name,
              icon: p.icon || 'User',
              color: p.color || '#A78BFA',
              createdAt: p.createdAt || Date.now(),
              isDefault: !!p.isDefault,
            });
          }
        }
        if (data.activeProfileId && this.profiles.has(data.activeProfileId)) {
          this.activeProfileId = data.activeProfileId;
        } else {
          this.activeProfileId = this.profiles.keys().next().value || 'personal';
        }
      } else {
        this.initDefaults();
        this.save();
      }
      return this.getAll();
    } catch (err) {
      console.error('[NEXUS Profiles] Failed to load profiles file:', err);
      this.initDefaults();
      return this.getAll();
    }
  }

  public save(): boolean {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const payload = {
        activeProfileId: this.activeProfileId,
        profiles: Array.from(this.profiles.values()),
      };

      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error('[NEXUS Profiles] Failed to save profiles:', err);
      return false;
    }
  }

  public getAll(): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  public getById(id: string): UserProfile | undefined {
    return this.profiles.get(id);
  }

  public getActiveProfile(): UserProfile {
    return (
      this.profiles.get(this.activeProfileId) || {
        id: 'personal',
        name: 'Personal',
        icon: 'User',
        color: '#A78BFA',
        createdAt: Date.now(),
        isDefault: true,
      }
    );
  }

  public getProfileDataDir(profileId: string): string {
    const dir = path.join(this.profilesDir, profileId);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    return dir;
  }

  public getProfileDataPaths(profileId: string): { bookmarks: string; history: string; downloads: string; notes: string } {
    const dir = this.getProfileDataDir(profileId);
    return {
      bookmarks: path.join(dir, 'nexus-bookmarks.json'),
      history: path.join(dir, 'nexus-history.json'),
      downloads: path.join(dir, 'nexus-downloads.json'),
      notes: path.join(dir, 'nexus-notes.json'),
    };
  }

  public getProfileSessionPartition(profileId: string): string {
    return `persist:profile_${profileId}`;
  }

  public createProfile(name: string, icon: string = 'User', color: string = '#A78BFA'): UserProfile {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProfile: UserProfile = {
      id,
      name: name.trim() || 'New Profile',
      icon: icon || 'User',
      color: color || '#A78BFA',
      createdAt: Date.now(),
      isDefault: false,
    };

    this.profiles.set(id, newProfile);
    this.getProfileDataDir(id); // Ensure directory created
    this.save();
    return newProfile;
  }

  public updateProfile(
    id: string,
    updates: Partial<Pick<UserProfile, 'name' | 'icon' | 'color'>>
  ): UserProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    if (updates.name !== undefined) profile.name = updates.name.trim() || profile.name;
    if (updates.icon !== undefined) profile.icon = updates.icon;
    if (updates.color !== undefined) profile.color = updates.color;

    this.save();
    return profile;
  }

  public deleteProfile(id: string): boolean {
    if (this.profiles.size <= 1) {
      console.warn('[NEXUS Profiles] Cannot delete the only remaining profile');
      return false;
    }

    const target = this.profiles.get(id);
    if (!target) return false;

    // Delete in-memory
    this.profiles.delete(id);

    // If deleting active profile, switch to the first remaining profile
    if (this.activeProfileId === id) {
      this.activeProfileId = this.profiles.keys().next().value as string;
    }

    // Attempt to clean disk directory
    try {
      const dir = path.join(this.profilesDir, id);
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('[NEXUS Profiles] Could not delete profile directory:', e);
    }

    this.save();
    this.notifySwitched();
    return true;
  }

  public switchProfile(id: string): UserProfile | null {
    if (!this.profiles.has(id)) {
      console.warn(`[NEXUS Profiles] Profile ${id} not found`);
      return null;
    }

    this.activeProfileId = id;
    this.save();
    const active = this.getActiveProfile();
    this.notifySwitched();
    return active;
  }

  private notifySwitched() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const active = this.getActiveProfile();
      this.mainWindow.webContents.send('profiles:switched', active);
    }
  }
}
