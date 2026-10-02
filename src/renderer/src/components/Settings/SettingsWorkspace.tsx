import React, { useState, useEffect, useMemo } from 'react';
import {
  BrowserSettings,
  NexusBrowserMode,
  ThemePreference,
  TrackingProtectionMode,
} from '@shared/types';
import {
  Settings,
  Shield,
  Eye,
  Sliders,
  Bell,
  Wrench,
  Database,
  HelpCircle,
  MessageSquare,
  Search,
  RotateCcw,
  Check,
  Globe,
  Monitor,
  Layout,
  Download,
  Folder,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  CheckSquare,
  Compass,
  Code2,
  Puzzle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { PrivacyCenterView } from './PrivacyCenterView';
import { DataTransparencyView } from './DataTransparencyView';
import { AboutNexusView } from './AboutNexusView';
import { FeedbackView } from './FeedbackView';

export type SettingsSectionId =
  | 'general'
  | 'appearance'
  | 'privacy'
  | 'privacy-center'
  | 'tools'
  | 'notifications'
  | 'transparency'
  | 'feedback'
  | 'about';

interface SettingsWorkspaceProps {
  settings: BrowserSettings;
  onUpdateSettings: (newSettings: Partial<BrowserSettings>) => void;
  onNavigate: (url: string) => void;
  onOpenClearDataModal: () => void;
  initialSection?: SettingsSectionId;
}

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
  onOpenClearDataModal,
  initialSection = 'general',
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleSettingChange = (patch: Partial<BrowserSettings>, label?: string) => {
    onUpdateSettings(patch);
    if (window.nexusAPI?.updateBrowserSettings) {
      window.nexusAPI.updateBrowserSettings(patch);
    }
    if (label) {
      setSaveBanner(`Saved: ${label}`);
      setTimeout(() => setSaveBanner(null), 1800);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all NEXUS settings to their default values?')) {
      if (window.nexusAPI?.resetBrowserSettings) {
        const defaults = await window.nexusAPI.resetBrowserSettings();
        onUpdateSettings(defaults);
      }
      setSaveBanner('Settings restored to defaults');
      setTimeout(() => setSaveBanner(null), 2500);
    }
  };

  const navItems: { id: SettingsSectionId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'general', label: 'General', icon: <Sliders size={15} /> },
    { id: 'appearance', label: 'Appearance & Modes', icon: <Eye size={15} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={15} /> },
    { id: 'privacy-center', label: 'Privacy Center', icon: <Lock size={15} />, badge: 'Audit' },
    { id: 'tools', label: 'Workspaces & Tools', icon: <Wrench size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
    { id: 'transparency', label: 'Data Transparency', icon: <Database size={15} /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={15} /> },
    { id: 'about', label: 'About NEXUS', icon: <HelpCircle size={15} /> },
  ];

  return (
    <div className="nexus-fullpage-container settings-workspace-container p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Settings Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-subtle pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Settings size={22} className="text-accent" />
              <h1 className="text-xl font-bold text-primary tracking-tight">Settings & Privacy Center</h1>
            </div>
            <p className="text-xs text-secondary mt-1 max-w-xl">
              Configure browser startup, appearance themes, privacy engines, notification memory, and local workspaces.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveBanner && (
              <span className="text-2xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1 transition-all">
                <Check size={11} /> {saveBanner}
              </span>
            )}
            <button
              type="button"
              className="nexus-btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 text-secondary hover:text-rose-400"
              onClick={handleResetDefaults}
              title="Reset all settings to defaults"
            >
              <RotateCcw size={12} />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Master Layout: Navigation Sidebar + Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Settings Left Navigation Tabs */}
          <div className="space-y-1 bg-surface/60 border border-subtle p-2 rounded-xl sticky top-4">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-accent/15 text-primary font-semibold border border-accent/30'
                      : 'text-secondary hover:text-primary hover:bg-surface-hover/60 border border-transparent'
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-accent' : 'text-secondary'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-3xs font-mono px-1.5 py-0.2 rounded bg-accent/20 text-accent font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Content Area */}
          <div className="md:col-span-3 space-y-6">
            {/* 1. GENERAL SECTION */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div className="border-b border-subtle pb-3">
                  <h3 className="text-sm font-semibold text-primary">General Configuration</h3>
                  <p className="text-2xs text-secondary mt-0.5">Startup behavior, search engine, downloads, and languages.</p>
                </div>

                <div className="p-5 rounded-xl border border-subtle bg-surface space-y-5">
                  {/* Startup Behavior */}
                  <div className="space-y-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      On Startup
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="startupBehavior"
                          value="new_tab"
                          checked={(settings.startupBehavior || 'new_tab') === 'new_tab'}
                          onChange={() => handleSettingChange({ startupBehavior: 'new_tab' }, 'Startup')}
                        />
                        <span className="text-xs text-primary">Open the New Tab page</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="startupBehavior"
                          value="restore_previous"
                          checked={settings.startupBehavior === 'restore_previous'}
                          onChange={() => handleSettingChange({ startupBehavior: 'restore_previous' }, 'Startup')}
                        />
                        <span className="text-xs text-primary">Continue where you left off (Restore tabs)</span>
                      </label>
                    </div>
                  </div>

                  <hr className="border-subtle" />

                  {/* New Tab Behavior */}
                  <div className="space-y-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      New Tab Content
                    </label>
                    <select
                      className="setting-select max-w-sm"
                      value={settings.newTabBehavior || 'new_tab'}
                      onChange={(e) => handleSettingChange({ newTabBehavior: e.target.value as any }, 'New Tab')}
                    >
                      <option value="new_tab">NEXUS Speed Dial (nexus://newtab)</option>
                      <option value="hub">NEXUS Hub Launchpad (nexus://hub)</option>
                      <option value="blank">Blank Minimal Page</option>
                    </select>
                  </div>

                  <hr className="border-subtle" />

                  {/* Search Engine */}
                  <div className="space-y-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      Default Search Engine
                    </label>
                    <select
                      className="setting-select max-w-sm"
                      value={settings.searchEngine || 'duckduckgo'}
                      onChange={(e) => handleSettingChange({ searchEngine: e.target.value as any }, 'Search Provider')}
                    >
                      <option value="duckduckgo">DuckDuckGo (Privacy-focused)</option>
                      <option value="brave">Brave Search (Independent index)</option>
                      <option value="google">Google Search</option>
                      <option value="bing">Microsoft Bing</option>
                    </select>
                    <p className="text-3xs text-secondary">
                      Used when queries without protocol prefixes are entered in the omnibox.
                    </p>
                  </div>

                  <hr className="border-subtle" />

                  {/* Downloads Behavior */}
                  <div className="space-y-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      Downloads
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={settings.askDownloadLocation ?? false}
                        onChange={(e) => handleSettingChange({ askDownloadLocation: e.target.checked }, 'Downloads')}
                        className="rounded border-subtle"
                      />
                      <span className="text-xs text-primary">Ask where to save each file before downloading</span>
                    </label>
                  </div>

                  <hr className="border-subtle" />

                  {/* Language & Spellcheck */}
                  <div className="space-y-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      Language & Spellcheck
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        className="setting-select max-w-xs"
                        value={settings.language || 'en-US'}
                        onChange={(e) => handleSettingChange({ language: e.target.value }, 'Language')}
                      >
                        <option value="en-US">English (United States)</option>
                        <option value="en-GB">English (United Kingdom)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.spellcheckEnabled ?? true}
                          onChange={(e) => handleSettingChange({ spellcheckEnabled: e.target.checked }, 'Spellcheck')}
                        />
                        <span className="text-xs text-primary">Check spelling as you type in notes and forms</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE & MODES SECTION (Strictly Decoupled) */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="border-b border-subtle pb-3">
                  <h3 className="text-sm font-semibold text-primary">Appearance & NEXUS Modes</h3>
                  <p className="text-2xs text-secondary mt-0.5">
                    Theme appearance controls color tone, while NEXUS modes optimize system performance and visual rendering.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-subtle bg-surface space-y-5">
                  {/* Theme Selection */}
                  <div className="space-y-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      Color Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3 max-w-md">
                      {(['dark', 'light', 'system'] as ThemePreference[]).map((theme) => {
                        const isCurrent = (settings.theme || 'dark') === theme;
                        return (
                          <button
                            key={theme}
                            type="button"
                            className={`p-3 rounded-lg border text-xs font-semibold capitalize flex flex-col items-center gap-1.5 transition-all ${
                              isCurrent
                                ? 'border-accent bg-accent/15 text-primary'
                                : 'border-subtle bg-base text-secondary hover:border-subtle/80 hover:text-primary'
                            }`}
                            onClick={() => handleSettingChange({ theme }, 'Theme')}
                          >
                            <Monitor size={15} className={isCurrent ? 'text-accent' : ''} />
                            <span>{theme}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="border-subtle" />

                  {/* NEXUS Browsing Mode (Decoupled from Theme) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                        NEXUS Engine Mode
                      </label>
                      <span className="text-3xs text-muted">Independent from theme</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Default Mode */}
                      <button
                        type="button"
                        className={`p-3.5 rounded-lg border text-left space-y-1 transition-all ${
                          (settings.mode || 'default') === 'default'
                            ? 'border-purple-500/60 bg-purple-500/10 text-primary'
                            : 'border-subtle bg-base text-secondary hover:border-subtle/80'
                        }`}
                        onClick={() => handleSettingChange({ mode: 'default' }, 'Mode: Default')}
                      >
                        <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-xs">
                          <Sparkles size={14} />
                          <span>Default Mode</span>
                        </div>
                        <p className="text-3xs text-secondary leading-relaxed">
                          Obsidian & violet aesthetic with balanced memory allocation and full visual animations.
                        </p>
                      </button>

                      {/* Balanced Mode */}
                      <button
                        type="button"
                        className={`p-3.5 rounded-lg border text-left space-y-1 transition-all ${
                          settings.mode === 'balanced'
                            ? 'border-amber-500/60 bg-amber-500/10 text-primary'
                            : 'border-subtle bg-base text-secondary hover:border-subtle/80'
                        }`}
                        onClick={() => handleSettingChange({ mode: 'balanced' }, 'Mode: Balanced')}
                      >
                        <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                          <Layers size={14} />
                          <span>Balanced Mode</span>
                        </div>
                        <p className="text-3xs text-secondary leading-relaxed">
                          Metallic gold accents, reduced distraction toolbar, and energy-conserving optimizations.
                        </p>
                      </button>

                      {/* Performance Mode */}
                      <button
                        type="button"
                        className={`p-3.5 rounded-lg border text-left space-y-1 transition-all ${
                          settings.mode === 'performance'
                            ? 'border-rose-500/60 bg-rose-500/10 text-primary'
                            : 'border-subtle bg-base text-secondary hover:border-subtle/80'
                        }`}
                        onClick={() => handleSettingChange({ mode: 'performance' }, 'Mode: Performance')}
                      >
                        <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                          <Zap size={14} />
                          <span>Performance Mode</span>
                        </div>
                        <p className="text-3xs text-secondary leading-relaxed">
                          Redline mode: disables backdrop filters, eliminates shadows, and aggressively suspends tabs.
                        </p>
                      </button>
                    </div>
                  </div>

                  <hr className="border-subtle" />

                  {/* Reduced Motion & UI Density */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                        Motion Preferences
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.reducedMotion ?? false}
                          onChange={(e) => handleSettingChange({ reducedMotion: e.target.checked }, 'Reduced Motion')}
                        />
                        <span className="text-xs text-primary">Prefer reduced motion (Minimize UI animations)</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                        UI Density
                      </label>
                      <select
                        className="setting-select"
                        value={settings.uiDensity || 'comfortable'}
                        onChange={(e) => handleSettingChange({ uiDensity: e.target.value as any }, 'UI Density')}
                      >
                        <option value="comfortable">Comfortable (Standard spacing)</option>
                        <option value="compact">Compact (Tighter padding for small screens)</option>
                      </select>
                    </div>
                  </div>

                  {/* Tab Strip Layout */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      Tab Layout
                    </label>
                    <select
                      className="setting-select max-w-xs"
                      value={settings.tabLayout || 'horizontal'}
                      onChange={(e) => handleSettingChange({ tabLayout: e.target.value as any }, 'Tab Layout')}
                    >
                      <option value="horizontal">Horizontal (Top Tab Strip)</option>
                      <option value="vertical">Vertical (Left Sidebar Tab List)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRIVACY & SECURITY SECTION */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div className="border-b border-subtle pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-primary">Privacy & Security</h3>
                    <p className="text-2xs text-secondary mt-0.5">Control tracking protection, ad blocking, and cookie isolation.</p>
                  </div>
                  <button
                    type="button"
                    className="nexus-btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 text-accent"
                    onClick={() => setActiveSection('privacy-center')}
                  >
                    <span>View Privacy Center</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                <div className="p-5 rounded-xl border border-subtle bg-surface space-y-4">
                  {/* Tracking Mode */}
                  <div className="space-y-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      Tracking Protection Mode
                    </label>
                    <select
                      className="setting-select max-w-sm"
                      value={settings.trackingProtectionMode || 'standard'}
                      onChange={(e) => {
                        const mode = e.target.value as TrackingProtectionMode;
                        handleSettingChange({ trackingProtectionMode: mode }, 'Tracking Protection');
                        if (window.nexusAPI?.setTrackingMode) {
                          window.nexusAPI.setTrackingMode(mode);
                        }
                      }}
                    >
                      <option value="standard">Standard (Recommended - Blocks known trackers)</option>
                      <option value="strict">Strict (Maximum privacy blocking)</option>
                      <option value="off">Off (Allow third-party tracking)</option>
                    </select>
                  </div>

                  <hr className="border-subtle" />

                  {/* Shield Core Toggles */}
                  <div className="space-y-3">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary">
                      Shield Protections
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.shieldAdBlocking ?? true}
                        onChange={(e) => handleSettingChange({ shieldAdBlocking: e.target.checked }, 'Ad Blocking')}
                      />
                      <span className="text-xs text-primary">Block advertising networks and intrusive banners</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.shieldPopupBlocking ?? true}
                        onChange={(e) => handleSettingChange({ shieldPopupBlocking: e.target.checked }, 'Pop-up Blocking')}
                      />
                      <span className="text-xs text-primary">Block unauthorized pop-ups and deceptive redirects</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.shieldPhishingProtection ?? true}
                        onChange={(e) => handleSettingChange({ shieldPhishingProtection: e.target.checked }, 'Scam Protection')}
                      />
                      <span className="text-xs text-primary">Enable safe browsing scam & malware protection</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.thirdPartyCookiesBlocked ?? true}
                        onChange={(e) => handleSettingChange({ thirdPartyCookiesBlocked: e.target.checked }, 'Cookie Partitioning')}
                      />
                      <span className="text-xs text-primary">Block third-party cookies across sites</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.doNotTrack ?? true}
                        onChange={(e) => handleSettingChange({ doNotTrack: e.target.checked }, 'Do Not Track')}
                      />
                      <span className="text-xs text-primary">Send "Do Not Track" header with HTTP requests</span>
                    </label>
                  </div>

                  <hr className="border-subtle" />

                  {/* Clear Data Action */}
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-primary">Browsing Data</div>
                      <p className="text-2xs text-secondary">Clear history, cached images, download logs, and cookies.</p>
                    </div>
                    <button
                      type="button"
                      className="setting-action-btn"
                      onClick={onOpenClearDataModal}
                    >
                      <span>Clear Browsing Data...</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PRIVACY CENTER VIEW */}
            {activeSection === 'privacy-center' && (
              <PrivacyCenterView
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                onOpenClearDataModal={onOpenClearDataModal}
                onNavigate={onNavigate}
              />
            )}

            {/* 5. TOOLS & WORKSPACES SECTION */}
            {activeSection === 'tools' && (
              <div className="space-y-6">
                <div className="border-b border-subtle pb-3">
                  <h3 className="text-sm font-semibold text-primary">Workspaces & Native Tools</h3>
                  <p className="text-2xs text-secondary mt-0.5">
                    Enable or disable internal tools. Optional tools (like Markets) remain strictly disabled unless voluntarily turned on.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-subtle bg-surface space-y-4">
                  <label className="flex items-center justify-between cursor-pointer py-1.5 border-b border-subtle/50">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <Layout size={13} className="text-accent" />
                        <span>NEXUS Hub</span>
                      </div>
                      <div className="text-3xs text-secondary">Central launchpad with customizable card layout (nexus://hub)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.hubEnabled ?? true}
                      onChange={(e) => handleSettingChange({ hubEnabled: e.target.checked }, 'Hub')}
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1.5 border-b border-subtle/50">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-indigo-400" />
                        <span>NEXUS Connect</span>
                      </div>
                      <div className="text-3xs text-secondary">Communication, messaging & productivity web app launcher (nexus://connect)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.connectEnabled ?? true}
                      onChange={(e) => handleSettingChange({ connectEnabled: e.target.checked }, 'Connect')}
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1.5 border-b border-subtle/50">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <CheckSquare size={13} className="text-emerald-400" />
                        <span>NEXUS Todo</span>
                      </div>
                      <div className="text-3xs text-secondary">Privacy-first task manager with webpage linking (nexus://todo)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.todoEnabled ?? true}
                      onChange={(e) => handleSettingChange({ todoEnabled: e.target.checked }, 'Todo')}
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1.5 border-b border-subtle/50">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <FileText size={13} className="text-blue-400" />
                        <span>NEXUS Notes</span>
                      </div>
                      <div className="text-3xs text-secondary">Rich-text markdown notebook and study logs (nexus://notes)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notesEnabled ?? true}
                      onChange={(e) => handleSettingChange({ notesEnabled: e.target.checked }, 'Notes')}
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1.5 border-b border-subtle/50">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <Compass size={13} className="text-purple-400" />
                        <span>NEXUS Explore (Dictionary & Context)</span>
                      </div>
                      <div className="text-3xs text-secondary">Contextual word clarification and vocabulary builder (nexus://explore)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.exploreEnabled ?? true}
                      onChange={(e) => handleSettingChange({ exploreEnabled: e.target.checked }, 'Explore')}
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1.5 border-b border-subtle/50">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-amber-400" />
                        <span>NEXUS Markets (Optional External Data)</span>
                      </div>
                      <div className="text-3xs text-secondary">
                        Informational stocks, IPOs, and shopping tracker. Uses external data providers (nexus://markets)
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.marketsEnabled ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleSettingChange({ marketsEnabled: checked }, 'Markets');
                        if (window.nexusAPI?.updateMarketsSettings) {
                          window.nexusAPI.updateMarketsSettings({ enabled: checked });
                        }
                      }}
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1.5 border-b border-subtle/50">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <Code2 size={13} className="text-accent" />
                        <span>Developer Toolkit</span>
                      </div>
                      <div className="text-3xs text-secondary">Network monitor, CSS inspector, reader view, and JSON formatter</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.devToolsEnabled ?? true}
                      onChange={(e) => handleSettingChange({ devToolsEnabled: e.target.checked }, 'DevTools')}
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1.5">
                    <div>
                      <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <Puzzle size={13} className="text-pink-400" />
                        <span>Extensions Runtime</span>
                      </div>
                      <div className="text-3xs text-secondary">Manifest V3 chrome extensions manager (nexus://extensions)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.extensionsEnabled ?? true}
                      onChange={(e) => handleSettingChange({ extensionsEnabled: e.target.checked }, 'Extensions')}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 6. NOTIFICATIONS SECTION */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="border-b border-subtle pb-3">
                  <h3 className="text-sm font-semibold text-primary">Notification Preferences</h3>
                  <p className="text-2xs text-secondary mt-0.5">Control browser notifications and alert frequencies.</p>
                </div>

                <div className="p-5 rounded-xl border border-subtle bg-surface space-y-4">
                  {/* Master Switch */}
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-subtle bg-base">
                    <div>
                      <span className="text-xs font-semibold text-primary">Allow NEXUS Notifications</span>
                      <p className="text-3xs text-secondary">Global toggle for all in-app and desktop notifications.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notificationsEnabled ?? true}
                      onChange={(e) => handleSettingChange({ notificationsEnabled: e.target.checked }, 'Master Notifications')}
                    />
                  </label>

                  {/* Sub Toggles */}
                  <div className={`space-y-3 pt-2 ${!(settings.notificationsEnabled ?? true) ? 'opacity-40 pointer-events-none' : ''}`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-primary">Download completion alerts</span>
                      <input
                        type="checkbox"
                        checked={settings.notifyDownloadComplete ?? true}
                        onChange={(e) => handleSettingChange({ notifyDownloadComplete: e.target.checked }, 'Download Alerts')}
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-primary">Security warnings & malware threat alerts</span>
                      <input
                        type="checkbox"
                        checked={settings.notifyShieldThreats ?? true}
                        onChange={(e) => handleSettingChange({ notifyShieldThreats: e.target.checked }, 'Threat Alerts')}
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-primary">NEXUS Todo task due date reminders</span>
                      <input
                        type="checkbox"
                        checked={settings.notifyTodoReminders ?? true}
                        onChange={(e) => handleSettingChange({ notifyTodoReminders: e.target.checked }, 'Todo Reminders')}
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-primary">NEXUS Markets price drop alerts (Optional)</span>
                      <input
                        type="checkbox"
                        checked={settings.notifyMarketsAlerts ?? false}
                        onChange={(e) => handleSettingChange({ notifyMarketsAlerts: e.target.checked }, 'Market Alerts')}
                      />
                    </label>

                    <div className="pt-2 border-t border-subtle">
                      <label className="block text-2xs font-semibold uppercase tracking-wider text-secondary mb-1">
                        Notification Frequency
                      </label>
                      <select
                        className="setting-select max-w-xs"
                        value={settings.notificationFrequency || 'instant'}
                        onChange={(e) => handleSettingChange({ notificationFrequency: e.target.value as any }, 'Alert Frequency')}
                      >
                        <option value="instant">Instant (Deliver as events occur)</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Summary</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. DATA TRANSPARENCY VIEW */}
            {activeSection === 'transparency' && <DataTransparencyView />}

            {/* 8. FEEDBACK VIEW */}
            {activeSection === 'feedback' && <FeedbackView />}

            {/* 9. ABOUT NEXUS VIEW */}
            {activeSection === 'about' && <AboutNexusView />}
          </div>
        </div>
      </div>
    </div>
  );
};
