import { app, BrowserWindow, dialog, session, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { DownloadRecord } from '../shared/types';

export class DownloadManager {
  private filePath: string;
  private settingsPath: string;
  private mainWindow: BrowserWindow | null = null;
  private records: Map<string, DownloadRecord> = new Map();
  private activeItems: Map<string, Electron.DownloadItem> = new Map();
  private speedTrackers: Map<string, { lastBytes: number; lastTime: number }> = new Map();
  private defaultDownloadDir: string;

  constructor(mainWindow?: BrowserWindow | null, customStorageDir?: string) {
    this.mainWindow = mainWindow || null;

    if (customStorageDir) {
      this.filePath = path.join(customStorageDir, 'nexus-downloads.json');
      this.settingsPath = path.join(customStorageDir, 'nexus-download-settings.json');
    } else {
      try {
        const userData = app.getPath('userData');
        this.filePath = path.join(userData, 'nexus-downloads.json');
        this.settingsPath = path.join(userData, 'nexus-download-settings.json');
      } catch {
        this.filePath = path.join(process.cwd(), '.nexus-downloads.json');
        this.settingsPath = path.join(process.cwd(), '.nexus-download-settings.json');
      }
    }

    try {
      this.defaultDownloadDir = app.getPath('downloads');
    } catch {
      this.defaultDownloadDir = path.join(process.cwd(), 'downloads');
    }

    this.loadSettings();
    this.load();
    this.setupDownloadHandler(session.defaultSession);
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  private loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.downloadDirectory === 'string' && fs.existsSync(parsed.downloadDirectory)) {
          this.defaultDownloadDir = parsed.downloadDirectory;
        }
      }
    } catch (err) {
      console.warn('[NEXUS Downloads] Could not read download settings:', err);
    }
  }

  public saveSettings(): boolean {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify({ downloadDirectory: this.defaultDownloadDir }, null, 2),
        'utf8'
      );
      return true;
    } catch (err) {
      console.error('[NEXUS Downloads] Failed to save download settings:', err);
      return false;
    }
  }

  public load(): DownloadRecord[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.records.clear();
        return [];
      }
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);

      if (!Array.isArray(data)) {
        this.records.clear();
        return [];
      }

      this.records.clear();
      for (const item of data) {
        if (item && item.id) {
          // If an item was marked in_progress when app exited, mark it interrupted
          const status =
            item.status === 'progressing' || item.status === 'paused'
              ? 'interrupted'
              : item.status;

          this.records.set(item.id, {
            ...item,
            status,
            speed: '',
            canResume: false,
          });
        }
      }
      return this.getAll();
    } catch (err) {
      console.error('[NEXUS Downloads] Failed to load download records:', err);
      this.records.clear();
      return [];
    }
  }

  public save(): boolean {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.records.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error('[NEXUS Downloads] Failed to save downloads file:', err);
      return false;
    }
  }

  public setupDownloadHandler(sess: Electron.Session) {
    if (!sess) return;

    sess.on('will-download', (event, item, webContents) => {
      const id = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const filename = item.getFilename();
      const savePath = this.resolveUniqueFilename(this.defaultDownloadDir, filename);

      item.setSavePath(savePath);

      const totalBytes = item.getTotalBytes() || 0;
      const initialRecord: DownloadRecord = {
        id,
        filename,
        url: item.getURL(),
        savePath,
        mimeType: item.getMimeType(),
        receivedBytes: 0,
        totalBytes,
        filesize: this.formatBytes(totalBytes),
        speed: '0 KB/s',
        progress: 0,
        status: 'progressing',
        startTime: Date.now(),
        canResume: item.canResume(),
      };

      this.records.set(id, initialRecord);
      this.activeItems.set(id, item);
      this.speedTrackers.set(id, { lastBytes: 0, lastTime: Date.now() });

      this.save();
      this.notifyUpdated();

      // Progress updates
      item.on('updated', (_event, state) => {
        const record = this.records.get(id);
        if (!record) return;

        const received = item.getReceivedBytes();
        const total = item.getTotalBytes() || record.totalBytes;
        const percent = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;

        // Speed calculation
        const tracker = this.speedTrackers.get(id);
        const now = Date.now();
        let speedStr = record.speed;

        if (tracker && now - tracker.lastTime >= 500) {
          const deltaBytes = received - tracker.lastBytes;
          const deltaSec = (now - tracker.lastTime) / 1000;
          if (deltaSec > 0 && deltaBytes >= 0) {
            speedStr = `${this.formatBytes(deltaBytes / deltaSec)}/s`;
          }
          tracker.lastBytes = received;
          tracker.lastTime = now;
        }

        record.receivedBytes = received;
        record.totalBytes = total;
        record.filesize = this.formatBytes(total || received);
        record.progress = percent;
        record.speed = speedStr;
        record.canResume = item.canResume();

        if (state === 'interrupted') {
          record.status = 'interrupted';
          record.stateReason = 'Download was interrupted';
        } else if (state === 'progressing') {
          record.status = item.isPaused() ? 'paused' : 'progressing';
        }

        this.notifyUpdated();
      });

      // Done (complete, cancelled, or failed)
      item.once('done', (_event, state) => {
        const record = this.records.get(id);
        if (record) {
          record.endTime = Date.now();
          record.speed = '';
          record.canResume = false;

          if (state === 'completed') {
            record.status = 'completed';
            record.progress = 100;
            record.receivedBytes = record.totalBytes || item.getReceivedBytes();
            record.filesize = this.formatBytes(record.receivedBytes);
          } else if (state === 'cancelled') {
            record.status = 'cancelled';
            record.stateReason = 'Download was cancelled by user';
          } else {
            record.status = 'interrupted';
            record.stateReason = 'Download failed or connection was lost';
          }
        }

        this.activeItems.delete(id);
        this.speedTrackers.delete(id);
        this.save();
        this.notifyUpdated();
      });
    });
  }

  public resolveUniqueFilename(targetDir: string, originalFilename: string): string {
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch {}
    }

    let resolvedPath = path.join(targetDir, originalFilename);
    if (!fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }

    const ext = path.extname(originalFilename);
    const base = path.basename(originalFilename, ext);
    let counter = 1;

    while (fs.existsSync(resolvedPath)) {
      resolvedPath = path.join(targetDir, `${base} (${counter})${ext}`);
      counter++;
    }
    return resolvedPath;
  }

  public getAll(): DownloadRecord[] {
    return Array.from(this.records.values()).sort((a, b) => b.startTime - a.startTime);
  }

  public getById(id: string): DownloadRecord | undefined {
    return this.records.get(id);
  }

  public pause(id: string): boolean {
    const item = this.activeItems.get(id);
    const record = this.records.get(id);
    if (item && !item.isPaused()) {
      item.pause();
      if (record) {
        record.status = 'paused';
        record.speed = '';
        this.notifyUpdated();
      }
      return true;
    }
    return false;
  }

  public resume(id: string): boolean {
    const item = this.activeItems.get(id);
    const record = this.records.get(id);
    if (item && item.canResume()) {
      item.resume();
      if (record) {
        record.status = 'progressing';
        this.notifyUpdated();
      }
      return true;
    }
    return false;
  }

  public cancel(id: string): boolean {
    const item = this.activeItems.get(id);
    const record = this.records.get(id);
    if (item) {
      item.cancel();
      if (record) {
        record.status = 'cancelled';
        record.speed = '';
        this.notifyUpdated();
      }
      return true;
    }
    return false;
  }

  public async openFile(id: string): Promise<boolean> {
    const record = this.records.get(id);
    if (!record || !record.savePath || !fs.existsSync(record.savePath)) {
      return false;
    }
    try {
      const err = await shell.openPath(record.savePath);
      return !err;
    } catch {
      return false;
    }
  }

  public showInFolder(id: string): boolean {
    const record = this.records.get(id);
    if (!record || !record.savePath || !fs.existsSync(record.savePath)) {
      return false;
    }
    try {
      shell.showItemInFolder(record.savePath);
      return true;
    } catch {
      return false;
    }
  }

  public getDownloadDirectory(): string {
    return this.defaultDownloadDir;
  }

  public async selectDownloadDirectory(): Promise<string | null> {
    if (!this.mainWindow) return null;
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: 'Select Default Download Directory',
      defaultPath: this.defaultDownloadDir,
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const chosen = result.filePaths[0];
    this.defaultDownloadDir = chosen;
    this.saveSettings();
    return chosen;
  }

  public setDownloadDirectory(dirPath: string): boolean {
    if (dirPath && fs.existsSync(dirPath)) {
      this.defaultDownloadDir = dirPath;
      this.saveSettings();
      return true;
    }
    return false;
  }

  public removeRecord(id: string): boolean {
    // If it's active, cancel it first
    if (this.activeItems.has(id)) {
      this.cancel(id);
    }
    const existed = this.records.delete(id);
    if (existed) {
      this.save();
      this.notifyUpdated();
    }
    return existed;
  }

  public clearHistory(): void {
    // Keep active downloads, delete finished/cancelled/interrupted
    for (const [id, record] of this.records.entries()) {
      if (record.status !== 'progressing' && record.status !== 'paused') {
        this.records.delete(id);
      }
    }
    this.save();
    this.notifyUpdated();
  }

  private notifyUpdated() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    const list = this.getAll();
    this.mainWindow.webContents.send('downloads:updated', list);
  }

  public formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  public formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec <= 0) return '0 B/s';
    return `${this.formatBytes(bytesPerSec)}/s`;
  }

  public generateUniqueSavePath(filename: string): string {
    return this.resolveUniqueFilename(this.defaultDownloadDir, filename);
  }

  public getDownloads(): DownloadRecord[] {
    return this.getAll();
  }

  public setCustomDownloadDirectory(dirPath: string): boolean {
    return this.setDownloadDirectory(dirPath);
  }

  public createMockDownloadRecord(params: {
    filename: string;
    url: string;
    totalBytes: number;
    savePath?: string;
  }): DownloadRecord {
    const id = `dl-mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const savePath = params.savePath || this.generateUniqueSavePath(params.filename);
    const record: DownloadRecord = {
      id,
      filename: params.filename,
      url: params.url,
      savePath,
      receivedBytes: 0,
      totalBytes: params.totalBytes,
      filesize: this.formatBytes(params.totalBytes),
      speed: '0 B/s',
      progress: 0,
      status: 'progressing',
      startTime: Date.now(),
      canResume: false,
    };
    this.records.set(id, record);
    this.save();
    this.notifyUpdated();
    return record;
  }

  public updateMockProgress(
    id: string,
    updates: Partial<DownloadRecord>
  ): DownloadRecord | null {
    const record = this.records.get(id);
    if (!record) return null;

    Object.assign(record, updates);
    if (record.totalBytes > 0 && typeof record.receivedBytes === 'number') {
      record.progress = Math.min(
        100,
        Math.round((record.receivedBytes / record.totalBytes) * 100)
      );
    }
    if (record.status === 'completed') {
      record.progress = 100;
      record.endTime = Date.now();
      record.speed = '';
    }

    this.save();
    this.notifyUpdated();
    return record;
  }
}
