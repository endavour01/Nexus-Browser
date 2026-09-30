import { BrowserWindow } from 'electron';
import { ShieldEngine } from './shield-engine';

/**
 * TrackingProtection is now powered by NEXUS Shield Engine.
 * Subclassed for seamless backward compatibility.
 */
export class TrackingProtection extends ShieldEngine {
  constructor(mainWindow?: BrowserWindow | null, customStorageDir?: string) {
    super(mainWindow, customStorageDir);
  }

  public setMode(mode: any): void {
    this.setTrackingMode(mode);
  }

  public override isTrackerUrl(url: string): boolean {
    return super.isTrackerUrl(url) || this.isAdUrl(url);
  }

  public override getSettings(): any {
    return this.getTrackingSettings();
  }
}

