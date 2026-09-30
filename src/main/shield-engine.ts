import { app, BrowserWindow, Session } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  NexusShieldSettings,
  NexusShieldStats,
  TabShieldStats,
  ShieldFilterList,
  ThreatType,
  TrackingProtectionMode,
  TrackingProtectionSettings,
} from '../shared/types';
import {
  DEFAULT_FILTER_LISTS,
  BUNDLED_AD_DOMAINS,
  BUNDLED_TRACKER_DOMAINS,
  BUNDLED_POPUP_DOMAINS,
  BUNDLED_MALICIOUS_DOMAINS,
  BUNDLED_AD_PATTERNS,
} from './shield-rules-data';
import type { NetworkMonitor } from './network-monitor';

export class ShieldEngine {
  private settingsPath: string;
  private statsPath: string;
  private rulesCachePath: string;

  private settings: NexusShieldSettings;
  private stats: NexusShieldStats;

  // In-memory sets for O(1) matching
  private adDomains: Set<string> = new Set();
  private trackerDomains: Set<string> = new Set();
  private popupDomains: Set<string> = new Set();
  private maliciousDomains: Set<string> = new Set();
  private adPatterns: string[] = [];

  // Temporary threat bypasses granted by user for this session
  private threatBypasses: Set<string> = new Set();

  // Tab-level blocking telemetry: key = webContentsId (number) or tabId (string)
  private tabStats: Map<
    number | string,
    { ads: number; trackers: number; popups: number; threats: number }
  > = new Map();

  // Mapping from webContentsId to tabId
  private wcToTabId: Map<number, string> = new Map();
  // Mapping from tabId to current origin
  private tabOrigins: Map<string, string> = new Map();

  private attachedSessions: Set<Session> = new Set();
  private mainWindow: BrowserWindow | null = null;
  private broadcastStatsTimer?: NodeJS.Timeout;
  private pendingTargetWcId?: number | string;

  constructor(mainWindow?: BrowserWindow | null, customStorageDir?: string) {
    this.mainWindow = mainWindow || null;

    let storageDir: string;
    try {
      storageDir = customStorageDir || app.getPath('userData');
    } catch {
      storageDir = customStorageDir || path.join(process.cwd(), '.nexus-storage');
    }

    this.settingsPath = path.join(storageDir, 'nexus-shield-settings.json');
    this.statsPath = path.join(storageDir, 'nexus-shield-stats.json');
    this.rulesCachePath = path.join(storageDir, 'nexus-shield-rules.json');

    this.settings = this.loadSettings();
    this.stats = this.loadStats();

    this.initRuleSets();
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public registerTab(tabId: string, webContentsId: number, url?: string) {
    this.wcToTabId.set(webContentsId, tabId);
    if (url) {
      try {
        this.tabOrigins.set(tabId, new URL(url).origin);
      } catch {}
    }
  }

  public unregisterTab(tabId: string, webContentsId?: number) {
    if (webContentsId) {
      this.wcToTabId.delete(webContentsId);
      this.tabStats.delete(webContentsId);
    }
    this.tabStats.delete(tabId);
    this.tabOrigins.delete(tabId);
  }

  // -----------------------------------------------------------------
  // 1. RULE INITIALIZATION & LOADING
  // -----------------------------------------------------------------
  private initRuleSets() {
    // Populate bundled rules
    for (const d of BUNDLED_AD_DOMAINS) this.adDomains.add(d.toLowerCase());
    for (const d of BUNDLED_TRACKER_DOMAINS) this.trackerDomains.add(d.toLowerCase());
    for (const d of BUNDLED_POPUP_DOMAINS) this.popupDomains.add(d.toLowerCase());
    for (const d of BUNDLED_MALICIOUS_DOMAINS) this.maliciousDomains.add(d.toLowerCase());
    this.adPatterns = [...BUNDLED_AD_PATTERNS];

    // Load any locally cached custom rules
    try {
      if (fs.existsSync(this.rulesCachePath)) {
        const raw = fs.readFileSync(this.rulesCachePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.customAds)) {
          for (const d of parsed.customAds) this.adDomains.add(d.toLowerCase());
        }
        if (Array.isArray(parsed.customTrackers)) {
          for (const d of parsed.customTrackers) this.trackerDomains.add(d.toLowerCase());
        }
        if (Array.isArray(parsed.customMalicious)) {
          for (const d of parsed.customMalicious) this.maliciousDomains.add(d.toLowerCase());
        }
      }
    } catch (err) {
      console.warn('[NEXUS Shield] Could not load cached rules:', err);
    }
  }

  // -----------------------------------------------------------------
  // 2. SETTINGS & STATS PERSISTENCE
  // -----------------------------------------------------------------
  private loadSettings(): NexusShieldSettings {
    const defaults: NexusShieldSettings = {
      enabled: true,
      adBlockingEnabled: true,
      trackerBlockingEnabled: true,
      popupBlockingEnabled: true,
      phishingProtectionEnabled: true,
      strictMode: false,
      filterLists: [...DEFAULT_FILTER_LISTS],
      allowlist: [],
      popupAllowlist: [],
      temporaryPauseUntil: null,
    };

    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...defaults,
          ...parsed,
          filterLists: Array.isArray(parsed.filterLists) ? parsed.filterLists : defaults.filterLists,
          allowlist: Array.isArray(parsed.allowlist) ? parsed.allowlist : [],
          popupAllowlist: Array.isArray(parsed.popupAllowlist) ? parsed.popupAllowlist : [],
        };
      }
    } catch (err) {
      console.warn('[NEXUS Shield] Failed to read settings, using defaults:', err);
    }

    return defaults;
  }

  public saveSettings(): boolean {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[NEXUS Shield] Failed to save settings:', err);
      return false;
    }
  }

  private loadStats(): NexusShieldStats {
    const defaults: NexusShieldStats = {
      totalAdsBlocked: 0,
      totalTrackersBlocked: 0,
      totalPopupsBlocked: 0,
      totalThreatsBlocked: 0,
      totalBlocked: 0,
      lastUpdated: Date.now(),
    };

    try {
      if (fs.existsSync(this.statsPath)) {
        const raw = fs.readFileSync(this.statsPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...defaults,
          ...parsed,
        };
      }
    } catch (err) {
      console.warn('[NEXUS Shield] Could not load stats:', err);
    }

    return defaults;
  }

  private saveStats() {
    try {
      const dir = path.dirname(this.statsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.stats.totalBlocked =
        this.stats.totalAdsBlocked +
        this.stats.totalTrackersBlocked +
        this.stats.totalPopupsBlocked +
        this.stats.totalThreatsBlocked;
      this.stats.lastUpdated = Date.now();
      fs.writeFileSync(this.statsPath, JSON.stringify(this.stats, null, 2), 'utf8');
    } catch (err) {
      console.error('[NEXUS Shield] Failed to save stats:', err);
    }
  }

  // -----------------------------------------------------------------
  // 3. SETTINGS GETTERS / SETTERS & CONTROLS
  // -----------------------------------------------------------------
  public getSettings(): NexusShieldSettings {
    return {
      ...this.settings,
      filterLists: [...this.settings.filterLists],
      allowlist: [...this.settings.allowlist],
      popupAllowlist: [...this.settings.popupAllowlist],
    };
  }

  public updateSettings(partial: Partial<NexusShieldSettings>): NexusShieldSettings {
    this.settings = {
      ...this.settings,
      ...partial,
    };
    this.saveSettings();
    this.broadcastStats();
    return this.getSettings();
  }

  public getStats(): NexusShieldStats {
    return {
      ...this.stats,
      totalBlocked:
        this.stats.totalAdsBlocked +
        this.stats.totalTrackersBlocked +
        this.stats.totalPopupsBlocked +
        this.stats.totalThreatsBlocked,
    };
  }

  public resetStats(): void {
    this.stats = {
      totalAdsBlocked: 0,
      totalTrackersBlocked: 0,
      totalPopupsBlocked: 0,
      totalThreatsBlocked: 0,
      totalBlocked: 0,
      lastUpdated: Date.now(),
    };
    this.tabStats.clear();
    this.saveStats();
    this.broadcastStats();
  }

  public isPaused(): boolean {
    if (this.settings.temporaryPauseUntil === null) return false;
    if (Date.now() > this.settings.temporaryPauseUntil) {
      // Pause expired, clear it
      this.settings.temporaryPauseUntil = null;
      this.saveSettings();
      return false;
    }
    return true;
  }

  public pauseTemporarily(durationMinutes: number): number {
    const pauseUntil = Date.now() + durationMinutes * 60 * 1000;
    this.settings.temporaryPauseUntil = pauseUntil;
    this.saveSettings();
    this.broadcastStats();
    return pauseUntil;
  }

  public resume(): void {
    this.settings.temporaryPauseUntil = null;
    this.saveSettings();
    this.broadcastStats();
  }

  public toggleSiteAllowlist(originOrUrl: string): boolean {
    const origin = this.normalizeOrigin(originOrUrl);
    if (!origin) return false;

    const index = this.settings.allowlist.indexOf(origin);
    let isNowAllowlisted = false;

    if (index >= 0) {
      this.settings.allowlist.splice(index, 1);
      isNowAllowlisted = false;
    } else {
      this.settings.allowlist.push(origin);
      isNowAllowlisted = true;
    }

    this.saveSettings();
    this.broadcastStats();
    return isNowAllowlisted;
  }

  public isSiteAllowlisted(originOrUrl: string): boolean {
    const origin = this.normalizeOrigin(originOrUrl);
    if (!origin) return false;
    return this.settings.allowlist.includes(origin);
  }

  public togglePopupAllowlist(originOrUrl: string): boolean {
    const origin = this.normalizeOrigin(originOrUrl);
    if (!origin) return false;

    const index = this.settings.popupAllowlist.indexOf(origin);
    let isNowAllowed = false;

    if (index >= 0) {
      this.settings.popupAllowlist.splice(index, 1);
      isNowAllowed = false;
    } else {
      this.settings.popupAllowlist.push(origin);
      isNowAllowed = true;
    }

    this.saveSettings();
    return isNowAllowed;
  }

  public isPopupAllowlisted(originOrUrl: string): boolean {
    const origin = this.normalizeOrigin(originOrUrl);
    if (!origin) return false;
    return this.settings.popupAllowlist.includes(origin);
  }

  public allowThreatBypass(originOrUrl: string): void {
    const origin = this.normalizeOrigin(originOrUrl);
    if (origin) {
      this.threatBypasses.add(origin);
    }
    this.threatBypasses.add(originOrUrl.trim().toLowerCase());
  }

  public isThreatBypassed(originOrUrl: string): boolean {
    const origin = this.normalizeOrigin(originOrUrl);
    if (origin && this.threatBypasses.has(origin)) return true;
    return this.threatBypasses.has(originOrUrl.trim().toLowerCase());
  }

  // -----------------------------------------------------------------
  // 4. MATCHING ENGINE & CLASSIFICATION
  // -----------------------------------------------------------------
  public normalizeOrigin(urlOrOrigin: string): string {
    if (!urlOrOrigin) return '';
    try {
      return new URL(urlOrOrigin).origin.toLowerCase();
    } catch {
      return urlOrOrigin.trim().toLowerCase();
    }
  }

  public extractHostname(url: string): string {
    if (!url) return '';
    try {
      const formatted = url.includes('://') ? url : `https://${url}`;
      return new URL(formatted).hostname.toLowerCase();
    } catch {
      return url.split('/')[0].split(':')[0].toLowerCase();
    }
  }

  /**
   * Fast domain matching against a Set of blocked hostnames,
   * checking the exact host as well as parent domain suffixes.
   */
  public matchesDomainSet(hostname: string, domainSet: Set<string>): boolean {
    if (!hostname) return false;
    const lowerHost = hostname.toLowerCase();

    // Exact match
    if (domainSet.has(lowerHost)) return true;

    // Check parent domains (e.g. sub.doubleclick.net -> doubleclick.net)
    const parts = lowerHost.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parentDomain = parts.slice(i).join('.');
      if (domainSet.has(parentDomain)) {
        return true;
      }
    }

    return false;
  }

  public isAdUrl(url: string): boolean {
    const host = this.extractHostname(url);
    if (host && this.matchesDomainSet(host, this.adDomains)) {
      return true;
    }

    const lower = url.toLowerCase();
    for (const pattern of this.adPatterns) {
      if (lower.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  public isTrackerUrl(url: string): boolean {
    const host = this.extractHostname(url);
    if (host && this.matchesDomainSet(host, this.trackerDomains)) {
      return true;
    }

    // Heuristics for common tracking telemetry endpoints
    const lower = url.toLowerCase();
    if (
      lower.includes('/telemetry') ||
      lower.includes('/analytics.js') ||
      lower.includes('google-analytics.com') ||
      lower.includes('googletagmanager.com') ||
      lower.includes('clarity.ms/tag')
    ) {
      return true;
    }

    return false;
  }

  public isPopupUrl(url: string): boolean {
    const host = this.extractHostname(url);
    return host ? this.matchesDomainSet(host, this.popupDomains) : false;
  }

  public isPopupDomain(domainOrUrl: string): boolean {
    return this.isPopupUrl(domainOrUrl);
  }

  public checkMaliciousUrl(url: string): { isMalicious: boolean; threat?: ThreatType; reason?: string } {
    if (!url || url.startsWith('nexus://')) {
      return { isMalicious: false };
    }

    if (this.isThreatBypassed(url)) {
      return { isMalicious: false };
    }

    const host = this.extractHostname(url);
    if (host && this.matchesDomainSet(host, this.maliciousDomains)) {
      let threat: ThreatType = 'malware';
      if (host.includes('phish') || host.includes('login') || host.includes('verify')) {
        threat = 'phishing';
      } else if (
        host.includes('scam') ||
        host.includes('giftcard') ||
        host.includes('winner') ||
        host.includes('crypto') ||
        host.includes('drainer')
      ) {
        threat = 'scam';
      } else if (host.includes('patch') || host.includes('update') || host.includes('alert')) {
        threat = 'deceptive';
      }

      return {
        isMalicious: true,
        threat,
        reason: `NEXUS Shield detected this destination matching known ${threat} signatures (${host}).`,
      };
    }

    return { isMalicious: false };
  }

  public checkThreat(url: string): { isThreat: boolean; isMalicious: boolean; threat?: ThreatType; reason?: string } {
    const res = this.checkMaliciousUrl(url);
    return {
      isThreat: res.isMalicious,
      isMalicious: res.isMalicious,
      threat: res.threat,
      reason: res.reason,
    };
  }

  // -----------------------------------------------------------------
  // 5. REQUEST INTERCEPTION & NETWORK HOOKS
  // -----------------------------------------------------------------
  public attachToSession(sess: Session, networkMonitor?: NetworkMonitor) {
    if (!sess || this.attachedSessions.has(sess)) return;
    this.attachedSessions.add(sess);

    sess.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      // 1. Relay to NetworkMonitor for devtools network tracking if present
      if (networkMonitor && typeof (networkMonitor as any).handleBeforeRequest === 'function') {
        try {
          (networkMonitor as any).handleBeforeRequest(details);
        } catch {}
      }

      // 2. Internal nexus:// scheme resources are always allowed
      if (details.url.startsWith('nexus://')) {
        callback({ cancel: false });
        return;
      }

      // 3. If Shield is turned off globally or temporarily paused, permit all
      if (!this.settings.enabled || this.isPaused()) {
        callback({ cancel: false });
        return;
      }

      // 4. Check if initiator / referrer origin is on the allowlist
      const referrerOrOrigin = details.referrer || (details as any).initiator || '';
      if (referrerOrOrigin && this.isSiteAllowlisted(referrerOrOrigin)) {
        callback({ cancel: false });
        return;
      }

      // 5. Evaluate ad & tracker blocking
      let blockedType: 'ad' | 'tracker' | null = null;

      if (this.settings.adBlockingEnabled && this.isAdUrl(details.url)) {
        blockedType = 'ad';
      } else if (this.settings.trackerBlockingEnabled && this.isTrackerUrl(details.url)) {
        blockedType = 'tracker';
      }

      if (blockedType) {
        // Record blocking metrics
        if (blockedType === 'ad') {
          this.stats.totalAdsBlocked++;
        } else {
          this.stats.totalTrackersBlocked++;
        }

        const wcId = details.webContentsId;
        if (wcId) {
          const tabStat = this.getOrCreateTabStat(wcId);
          if (blockedType === 'ad') tabStat.ads++;
          else tabStat.trackers++;
        }

        this.saveStats();
        this.broadcastStats(details.webContentsId);

        // Cancel the network request
        callback({ cancel: true });
        return;
      }

      // Allow all other normal requests
      callback({ cancel: false });
    });
  }

  public getCanonicalTabKey(key: number | string): string {
    if (typeof key === 'string') return key;
    return this.wcToTabId.get(key) || `wc_${key}`;
  }

  public recordBlock(
    tabIdOrWcId: string | number,
    url: string,
    type: 'ad' | 'tracker' | 'popup' | 'threat'
  ): void {
    if (type === 'ad') {
      this.stats.totalAdsBlocked++;
      const tabStat = this.getOrCreateTabStat(tabIdOrWcId);
      tabStat.ads++;
    } else if (type === 'tracker') {
      this.stats.totalTrackersBlocked++;
      const tabStat = this.getOrCreateTabStat(tabIdOrWcId);
      tabStat.trackers++;
    } else if (type === 'popup') {
      this.recordBlockedPopup(tabIdOrWcId, url, this.extractHostname(url));
      return;
    } else if (type === 'threat') {
      this.recordBlockedThreat(tabIdOrWcId);
      return;
    }
    this.saveStats();
    this.broadcastStats(typeof tabIdOrWcId === 'number' ? tabIdOrWcId : undefined);
  }

  public recordBlockedPopup(tabIdOrWcId: string | number, url: string, origin: string): void {
    this.stats.totalPopupsBlocked++;
    const tabStat = this.getOrCreateTabStat(tabIdOrWcId);
    tabStat.popups++;
    this.saveStats();
    this.broadcastStats(tabIdOrWcId);

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('shield:popupBlocked', {
        tabId: typeof tabIdOrWcId === 'string' ? tabIdOrWcId : this.wcToTabId.get(tabIdOrWcId) || `wc_${tabIdOrWcId}`,
        url,
        origin,
      });
    }
  }

  public recordBlockedThreat(tabIdOrWcId: string | number): void {
    this.stats.totalThreatsBlocked++;
    const tabStat = this.getOrCreateTabStat(tabIdOrWcId);
    tabStat.threats++;
    this.saveStats();
    this.broadcastStats(tabIdOrWcId);
  }

  private getOrCreateTabStat(key: number | string) {
    const canonical = this.getCanonicalTabKey(key);
    let stat = this.tabStats.get(canonical);
    if (!stat) {
      stat = { ads: 0, trackers: 0, popups: 0, threats: 0 };
      this.tabStats.set(canonical, stat);
    }
    return stat;
  }

  public getTabStats(tabIdOrWcId?: string | number): TabShieldStats {
    const canonical = tabIdOrWcId !== undefined ? this.getCanonicalTabKey(tabIdOrWcId) : 'default';
    const stat = this.tabStats.get(canonical) || { ads: 0, trackers: 0, popups: 0, threats: 0 };
    const tabId = canonical;
    const origin = this.tabOrigins.get(tabId) || '';

    return {
      tabId,
      url: origin,
      origin,
      adsBlocked: stat.ads,
      trackersBlocked: stat.trackers,
      popupsBlocked: stat.popups,
      threatsBlocked: stat.threats,
      totalBlocked: stat.ads + stat.trackers + stat.popups + stat.threats,
      isAllowlisted: this.isSiteAllowlisted(origin),
      isPaused: this.isPaused(),
    };
  }

  // -----------------------------------------------------------------
  // 6. SAFE FILTER LIST UPDATER
  // -----------------------------------------------------------------
  public async updateFilterLists(): Promise<{
    success: boolean;
    updatedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updatedCount = 0;

    for (const list of this.settings.filterLists) {
      if (!list.enabled) continue;

      try {
        // Attempt HTTPS fetch with 8s timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(list.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NEXUS-Shield/1.0; +https://nexus-browser.org)',
          },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n');
        let newRules = 0;

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith('!') || line.startsWith('#')) continue;

          // Parse hosts format: "0.0.0.0 domain.com" or "127.0.0.1 domain.com"
          const hostMatch = line.match(/^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (hostMatch) {
            const domain = hostMatch[1].toLowerCase();
            if (list.id.includes('phish') || list.id.includes('malware')) {
              this.maliciousDomains.add(domain);
            } else if (list.id.includes('privacy')) {
              this.trackerDomains.add(domain);
            } else {
              this.adDomains.add(domain);
            }
            newRules++;
            continue;
          }

          // Parse adblock format: "||domain.com^"
          const adblockMatch = line.match(/^\|\|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\^/);
          if (adblockMatch) {
            const domain = adblockMatch[1].toLowerCase();
            if (list.id.includes('privacy')) {
              this.trackerDomains.add(domain);
            } else {
              this.adDomains.add(domain);
            }
            newRules++;
            continue;
          }
        }

        list.ruleCount = Math.max(list.ruleCount, newRules);
        list.lastUpdated = Date.now();
        updatedCount++;
      } catch (err: any) {
        errors.push(`Failed to update ${list.name}: ${err?.message || err}`);
      }
    }

    this.saveSettings();
    this.saveRulesCache();
    this.broadcastStats();

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    };
  }

  private saveRulesCache() {
    try {
      const data = {
        customAds: Array.from(this.adDomains),
        customTrackers: Array.from(this.trackerDomains),
        customMalicious: Array.from(this.maliciousDomains),
      };
      fs.writeFileSync(this.rulesCachePath, JSON.stringify(data), 'utf8');
    } catch (e) {
      console.warn('[NEXUS Shield] Could not write rules cache:', e);
    }
  }

  // -----------------------------------------------------------------
  // 7. IPC NOTIFICATIONS & BROADCASTS
  // -----------------------------------------------------------------
  public broadcastStats(targetWcId?: number | string, immediate: boolean = false) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    if (targetWcId) {
      this.pendingTargetWcId = targetWcId;
    }

    if (immediate) {
      if (this.broadcastStatsTimer) {
        clearTimeout(this.broadcastStatsTimer);
        this.broadcastStatsTimer = undefined;
      }
      this.executeBroadcastStats();
      return;
    }

    if (!this.broadcastStatsTimer) {
      this.broadcastStatsTimer = setTimeout(() => {
        this.broadcastStatsTimer = undefined;
        this.executeBroadcastStats();
      }, 50);
    }
  }

  private executeBroadcastStats() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    const stats = this.getStats();
    this.mainWindow.webContents.send('shield:statsUpdated', stats);

    // Also support legacy tracking listener for backward compatibility
    this.mainWindow.webContents.send('tracking:statsUpdated', {
      totalBlocked: stats.totalBlocked,
    });

    if (this.pendingTargetWcId) {
      const tabStat = this.getTabStats(this.pendingTargetWcId);
      this.mainWindow.webContents.send('shield:tabStatsUpdated', tabStat);
      this.pendingTargetWcId = undefined;
    }
  }

  // -----------------------------------------------------------------
  // 8. BACKWARD COMPATIBILITY WITH LEGACY TrackingProtection
  // -----------------------------------------------------------------
  public getBlockedCountForTab(key: number | string): number {
    const stat = this.tabStats.get(key);
    return stat ? stat.ads + stat.trackers + stat.popups + stat.threats : 0;
  }

  public resetTabCounter(key: number | string): void {
    this.tabStats.delete(key);
  }

  public getTrackingSettings(): TrackingProtectionSettings {
    let legacyMode: TrackingProtectionMode = 'standard';
    if (!this.settings.enabled) legacyMode = 'off';
    else if (this.settings.strictMode) legacyMode = 'strict';

    return {
      mode: legacyMode,
      totalBlocked: this.stats.totalBlocked,
      exceptions: [...this.settings.allowlist],
    };
  }

  public setTrackingMode(mode: TrackingProtectionMode): void {
    if (mode === 'off') {
      this.settings.enabled = false;
    } else if (mode === 'strict') {
      this.settings.enabled = true;
      this.settings.strictMode = true;
    } else {
      this.settings.enabled = true;
      this.settings.strictMode = false;
    }
    this.saveSettings();
    this.broadcastStats();
  }

  public toggleException(origin: string): boolean {
    return this.toggleSiteAllowlist(origin);
  }

  public isOriginExcepted(urlOrOrigin: string): boolean {
    return this.isSiteAllowlisted(urlOrOrigin);
  }
}
