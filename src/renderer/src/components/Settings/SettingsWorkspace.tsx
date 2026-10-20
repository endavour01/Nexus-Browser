import React, { useState, useEffect, useMemo } from 'react';
import {
  BrowserSettings,
  NexusBrowserMode,
  ThemePreference,
  TrackingProtectionMode,
  AccountSession,
  SidePanelId,
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
  User,
  ShieldCheck,
} from 'lucide-react';
import { Button, Select, Badge, Card } from '../ui';
import { AccountProfileView, AccountModal } from '../Account';
import { NexusBotProfileSection } from '../NexusBotProfileSection';
import { PrivacyCenterView } from './PrivacyCenterView';
import { DataTransparencyView } from './DataTransparencyView';
import { AboutNexusView } from './AboutNexusView';
import { FeedbackView } from './FeedbackView';
import { SIDE_PANEL_OPTIONS } from '../side-panel-options';

export type SettingsSectionId =
  | 'general'
  | 'account'
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

  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalView, setAccountModalView] = useState<'sign-in' | 'sign-up'>('sign-in');

  useEffect(() => {
    let isMounted = true;
    window.nexusAPI?.getAccountSession?.().then((sess) => {
      if (isMounted) setAccountSession(sess);
    }).catch(() => {});

    const unsub = window.nexusAPI?.onAccountUpdated?.((sess) => {
      if (isMounted) setAccountSession(sess);
    });

    return () => {
      isMounted = false;
      unsub?.();
    };
  }, []);

  const navItems: { id: SettingsSectionId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'general', label: 'General', icon: <Sliders size={15} /> },
    {
      id: 'account',
      label: 'NEXUS Account',
      icon: <User size={15} />,
      badge: accountSession?.account ? 'Active' : undefined,
    },
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
    <div className="nexus-fullpage-container settings-workspace-container">
      <div className="settings-content-wrap">
        {/* Settings Header */}
        <div className="settings-header">
          <div className="settings-header-title-group">
            <div className="settings-header-title-row">
              <Settings size={22} className="text-accent" />
              <h1 className="settings-header-title">Settings & Privacy Center</h1>
            </div>
            <p className="settings-header-desc">
              Configure browser startup, appearance themes, privacy engines, notification memory, and local workspaces.
            </p>
          </div>

          <div className="settings-header-actions">
            {saveBanner && (
              <span className="settings-save-banner">
                <Check size={11} /> {saveBanner}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw size={12} />}
              onClick={handleResetDefaults}
              title="Reset all settings to defaults"
            >
              Reset Defaults
            </Button>
          </div>
        </div>

        {/* Master 2-Pane Layout: Navigation Rail + Content Area */}
        <div className="settings-body-layout">
          {/* Settings Left Navigation Rail */}
          <nav className="settings-nav-rail" aria-label="Settings navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`settings-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <div className="settings-nav-btn-content">
                    <span className="settings-nav-btn-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="settings-nav-badge">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Settings Content Area */}
          <main className="settings-content-area">
            {/* 1. GENERAL SECTION */}
            {activeSection === 'general' && (
              <div className="settings-section-block">
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">General Configuration</h3>
                    <p className="settings-section-desc">Startup behavior, search engine, downloads, and languages.</p>
                  </div>
                </div>

                <div className="settings-group-card">
                  {/* Startup Behavior */}
                  <div className="settings-row-stacked">
                    <div className="settings-row-label">On Startup</div>
                    <div className="settings-radio-group">
                      <label className="settings-radio-label">
                        <input
                          type="radio"
                          name="startupBehavior"
                          className="settings-radio-input"
                          value="new_tab"
                          checked={(settings.startupBehavior || 'new_tab') === 'new_tab'}
                          onChange={() => handleSettingChange({ startupBehavior: 'new_tab' }, 'Startup')}
                        />
                        <span>Open the New Tab page</span>
                      </label>
                      <label className="settings-radio-label">
                        <input
                          type="radio"
                          name="startupBehavior"
                          className="settings-radio-input"
                          value="restore_previous"
                          checked={settings.startupBehavior === 'restore_previous'}
                          onChange={() => handleSettingChange({ startupBehavior: 'restore_previous' }, 'Startup')}
                        />
                        <span>Continue where you left off (Restore tabs)</span>
                      </label>
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* New Tab Behavior */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">New Tab Content</div>
                      <div className="settings-row-desc">Default page displayed when launching a new tab</div>
                    </div>
                    <div className="settings-row-control" style={{ width: '280px' }}>
                      <Select
                        size="sm"
                        value={settings.newTabBehavior || 'new_tab'}
                        onChange={(e) => handleSettingChange({ newTabBehavior: e.target.value as any }, 'New Tab')}
                        options={[
                          { value: 'new_tab', label: 'NEXUS Speed Dial (nexus://newtab)' },
                          { value: 'hub', label: 'NEXUS Hub Launchpad (nexus://hub)' },
                          { value: 'blank', label: 'Blank Minimal Page' },
                        ]}
                      />
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Search Engine */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Default Search Engine</div>
                      <div className="settings-row-desc">Used when queries without protocol prefixes are entered in the omnibox</div>
                    </div>
                    <div className="settings-row-control" style={{ width: '280px' }}>
                      <Select
                        size="sm"
                        value={settings.searchEngine || 'duckduckgo'}
                        onChange={(e) => handleSettingChange({ searchEngine: e.target.value as any }, 'Search Provider')}
                        options={[
                          { value: 'duckduckgo', label: 'DuckDuckGo (Privacy-focused)' },
                          { value: 'brave', label: 'Brave Search (Independent index)' },
                          { value: 'google', label: 'Google Search' },
                          { value: 'bing', label: 'Microsoft Bing' },
                        ]}
                      />
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Downloads Behavior */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Ask Download Location</div>
                      <div className="settings-row-desc">Prompt where to save each file before downloading</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.askDownloadLocation ?? false}
                          onChange={(e) => handleSettingChange({ askDownloadLocation: e.target.checked }, 'Downloads')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Language & Spellcheck */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Display Language</div>
                      <div className="settings-row-desc">Primary locale for browser interface text</div>
                    </div>
                    <div className="settings-row-control" style={{ width: '280px' }}>
                      <Select
                        size="sm"
                        value={settings.language || 'en-US'}
                        onChange={(e) => handleSettingChange({ language: e.target.value }, 'Language')}
                        options={[
                          { value: 'en-US', label: 'English (United States)' },
                          { value: 'en-GB', label: 'English (United Kingdom)' },
                          { value: 'es', label: 'Español' },
                          { value: 'fr', label: 'Français' },
                          { value: 'de', label: 'Deutsch' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="settings-row" style={{ paddingTop: 0 }}>
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Spellcheck Verification</div>
                      <div className="settings-row-desc">Check spelling as you type in notes and input forms</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.spellcheckEnabled ?? true}
                          onChange={(e) => handleSettingChange({ spellcheckEnabled: e.target.checked }, 'Spellcheck')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1.5. NEXUS ACCOUNT & IDENTITY SECTION */}
            {activeSection === 'account' && (
              <div className="settings-section-block">
                <div style={{ marginBottom: '16px' }}>
                  <NexusBotProfileSection
                    mode={settings.mode}
                    onSelectMode={(m) => handleSettingChange({ mode: m }, `Mode switched to ${m}`)}
                  />
                </div>
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">NEXUS Account & User Identity</h3>
                    <p className="settings-section-desc">
                      Manage online identity credentials, security sessions, and workspace boundaries.
                    </p>
                  </div>
                </div>

                {accountSession?.account ? (
                  <AccountProfileView
                    session={accountSession}
                    onSignOut={() => setAccountSession(null)}
                    onAccountUpdated={(acc) =>
                      setAccountSession((prev) => (prev ? { ...prev, account: acc } : null))
                    }
                    onOpenSignIn={() => {
                      setAccountModalView('sign-in');
                      setIsAccountModalOpen(true);
                    }}
                  />
                ) : (
                  <div className="settings-group-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: 'rgba(167, 139, 250, 0.12)',
                          border: '1px solid rgba(167, 139, 250, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--nexus-accent-primary, #A78BFA)',
                          flexShrink: 0,
                        }}
                      >
                        <User size={24} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 className="settings-row-label" style={{ fontSize: '14px', fontWeight: 700 }}>
                          Connect Your NEXUS Account
                        </h4>
                        <p className="settings-row-desc" style={{ maxWidth: '600px', lineHeight: 1.5 }}>
                          Sign in or register an account to secure your user identity. Future releases will support end-to-end encrypted workspace, history, and bookmark synchronization across your authorized devices.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          setAccountModalView('sign-in');
                          setIsAccountModalOpen(true);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          setAccountModalView('sign-up');
                          setIsAccountModalOpen(true);
                        }}
                      >
                        Create an Account
                      </Button>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--nexus-border-subtle, #1C202C)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        fontSize: '11px',
                        color: 'var(--nexus-text-secondary, #9298A8)',
                        lineHeight: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--nexus-text-primary, #F4F4F5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={13} className="text-accent" />
                        Local Data Isolation
                      </div>
                      <div>
                        NEXUS is designed with strict local privacy. Even without an account, all browser tabs, cookies, bookmarks, and extensions remain 100% operational on this machine.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. APPEARANCE & MODES SECTION (Strictly Decoupled) */}
            {activeSection === 'appearance' && (
              <div className="settings-section-block">
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">Appearance & NEXUS Modes</h3>
                    <p className="settings-section-desc">
                      Theme appearance controls color tone, while NEXUS modes optimize system performance and visual rendering.
                    </p>
                  </div>
                </div>

                <div className="settings-group-card">
                  {/* Theme Selection */}
                  <div className="settings-row-stacked">
                    <div className="settings-row-label">Color Theme</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '420px', paddingTop: '4px' }}>
                      {(['dark', 'light', 'system'] as ThemePreference[]).map((theme) => {
                        const isCurrent = (settings.theme || 'dark') === theme;
                        return (
                          <button
                            key={theme}
                            type="button"
                            className={`settings-nav-btn ${isCurrent ? 'active' : ''}`}
                            style={{
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              textAlign: 'center',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              borderRadius: '8px',
                              border: isCurrent ? '1px solid var(--nexus-accent-primary, #A78BFA)' : '1px solid var(--nexus-border-subtle, #1C202C)',
                              background: isCurrent ? 'rgba(167, 139, 250, 0.12)' : 'transparent',
                            }}
                            onClick={() => handleSettingChange({ theme }, 'Theme')}
                          >
                            <Monitor size={16} className={isCurrent ? 'text-accent' : ''} />
                            <span>{theme}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* NEXUS Browsing Mode (Decoupled from Theme) */}
                  <div className="settings-row-stacked">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="settings-row-label">NEXUS Engine Mode</div>
                      <span style={{ fontSize: '11px', color: 'var(--nexus-text-secondary, #9298A8)' }}>Independent from theme</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '4px' }}>
                      {/* Default Mode */}
                      <button
                        type="button"
                        className={`settings-nav-btn ${(settings.mode || 'default') === 'default' ? 'active' : ''}`}
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '6px',
                          borderRadius: '8px',
                          border: (settings.mode || 'default') === 'default'
                            ? '1px solid rgba(167, 139, 250, 0.4)'
                            : '1px solid var(--nexus-border-subtle, #1C202C)',
                          background: (settings.mode || 'default') === 'default'
                            ? 'rgba(167, 139, 250, 0.12)'
                            : 'transparent',
                        }}
                        onClick={() => handleSettingChange({ mode: 'default' }, 'Mode: Default')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A78BFA', fontWeight: 600, fontSize: '13px' }}>
                          <Sparkles size={14} />
                          <span>Default Mode</span>
                        </div>
                        <p className="settings-row-desc">
                          Obsidian & violet aesthetic with balanced memory allocation and full visual animations.
                        </p>
                      </button>

                      {/* Balanced Mode */}
                      <button
                        type="button"
                        className={`settings-nav-btn ${settings.mode === 'balanced' ? 'active' : ''}`}
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '6px',
                          borderRadius: '8px',
                          border: settings.mode === 'balanced'
                            ? '1px solid rgba(245, 197, 66, 0.4)'
                            : '1px solid var(--nexus-border-subtle, #1C202C)',
                          background: settings.mode === 'balanced'
                            ? 'rgba(245, 197, 66, 0.12)'
                            : 'transparent',
                        }}
                        onClick={() => handleSettingChange({ mode: 'balanced' }, 'Mode: Balanced')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F5C542', fontWeight: 600, fontSize: '13px' }}>
                          <Layers size={14} />
                          <span>Balanced Mode</span>
                        </div>
                        <p className="settings-row-desc">
                          Metallic gold accents, reduced distraction toolbar, and energy-conserving optimizations.
                        </p>
                      </button>

                      {/* Performance Mode */}
                      <button
                        type="button"
                        className={`settings-nav-btn ${settings.mode === 'performance' ? 'active' : ''}`}
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '6px',
                          borderRadius: '8px',
                          border: settings.mode === 'performance'
                            ? '1px solid rgba(240, 45, 67, 0.4)'
                            : '1px solid var(--nexus-border-subtle, #1C202C)',
                          background: settings.mode === 'performance'
                            ? 'rgba(240, 45, 67, 0.12)'
                            : 'transparent',
                        }}
                        onClick={() => handleSettingChange({ mode: 'performance' }, 'Mode: Performance')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F02D43', fontWeight: 600, fontSize: '13px' }}>
                          <Zap size={14} />
                          <span>Performance Mode</span>
                        </div>
                        <p className="settings-row-desc">
                          Redline mode: disables backdrop filters, eliminates shadows, and aggressively suspends tabs.
                        </p>
                      </button>
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Motion & UI Density */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Reduced Motion</div>
                      <div className="settings-row-desc">Minimize window and tab transition animations</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.reducedMotion ?? false}
                          onChange={(e) => handleSettingChange({ reducedMotion: e.target.checked }, 'Reduced Motion')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">UI Density</div>
                      <div className="settings-row-desc">Control vertical rhythm and component padding across views</div>
                    </div>
                    <div className="settings-row-control" style={{ width: '280px' }}>
                      <Select
                        size="sm"
                        value={settings.uiDensity || 'comfortable'}
                        onChange={(e) => handleSettingChange({ uiDensity: e.target.value as any }, 'UI Density')}
                        options={[
                          { value: 'comfortable', label: 'Comfortable (Standard spacing)' },
                          { value: 'compact', label: 'Compact (Tighter padding for small screens)' },
                        ]}
                      />
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Tab Strip Layout */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Tab Strip Orientation</div>
                      <div className="settings-row-desc">Choose between classic top tab strip or left vertical tab list</div>
                    </div>
                    <div className="settings-row-control" style={{ width: '280px' }}>
                      <Select
                        size="sm"
                        value={settings.tabLayout || 'horizontal'}
                        onChange={(e) => handleSettingChange({ tabLayout: e.target.value as any }, 'Tab Layout')}
                        options={[
                          { value: 'horizontal', label: 'Horizontal (Top Tab Strip)' },
                          { value: 'vertical', label: 'Vertical (Left Sidebar Tab List)' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRIVACY & SECURITY SECTION */}
            {activeSection === 'privacy' && (
              <div className="settings-section-block">
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">Privacy & Security</h3>
                    <p className="settings-section-desc">Control tracking protection, ad blocking, and cookie isolation.</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ExternalLink size={12} />}
                    onClick={() => setActiveSection('privacy-center')}
                  >
                    View Privacy Center
                  </Button>
                </div>

                <div className="settings-group-card">
                  {/* Tracking Mode */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Tracking Protection Mode</div>
                      <div className="settings-row-desc">Enforce local blocklist rules against advertising trackers</div>
                    </div>
                    <div className="settings-row-control" style={{ width: '300px' }}>
                      <Select
                        size="sm"
                        value={settings.trackingProtectionMode || 'standard'}
                        onChange={(e) => {
                          const mode = e.target.value as TrackingProtectionMode;
                          handleSettingChange({ trackingProtectionMode: mode }, 'Tracking Protection');
                          if (window.nexusAPI?.setTrackingMode) {
                            window.nexusAPI.setTrackingMode(mode);
                          }
                        }}
                        options={[
                          { value: 'standard', label: 'Standard (Blocks known trackers)' },
                          { value: 'strict', label: 'Strict (Maximum privacy blocking)' },
                          { value: 'off', label: 'Off (Allow third-party tracking)' },
                        ]}
                      />
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Shield Core Toggles */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Ad Blocking</div>
                      <div className="settings-row-desc">Block advertising networks and intrusive banners</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.shieldAdBlocking ?? true}
                          onChange={(e) => handleSettingChange({ shieldAdBlocking: e.target.checked }, 'Ad Blocking')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Pop-up Blocking</div>
                      <div className="settings-row-desc">Block unauthorized pop-ups and deceptive redirects</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.shieldPopupBlocking ?? true}
                          onChange={(e) => handleSettingChange({ shieldPopupBlocking: e.target.checked }, 'Pop-up Blocking')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Scam & Phishing Protection</div>
                      <div className="settings-row-desc">Enable safe browsing scam & malware protection</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.shieldPhishingProtection ?? true}
                          onChange={(e) => handleSettingChange({ shieldPhishingProtection: e.target.checked }, 'Scam Protection')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Block Third-Party Cookies</div>
                      <div className="settings-row-desc">Isolate cross-site cookies to prevent tracking across domains</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.thirdPartyCookiesBlocked ?? true}
                          onChange={(e) => handleSettingChange({ thirdPartyCookiesBlocked: e.target.checked }, 'Cookie Partitioning')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Do Not Track (DNT)</div>
                      <div className="settings-row-desc">Send "Do Not Track" header with outgoing HTTP requests</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.doNotTrack ?? true}
                          onChange={(e) => handleSettingChange({ doNotTrack: e.target.checked }, 'Do Not Track')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Clear Data Action */}
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label">Browsing Data</div>
                      <div className="settings-row-desc">Clear history, cached images, download logs, and cookies</div>
                    </div>
                    <div className="settings-row-control">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onOpenClearDataModal}
                      >
                        Clear Browsing Data...
                      </Button>
                    </div>
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
              <div className="settings-section-block">
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">Workspaces & Native Tools</h3>
                    <p className="settings-section-desc">
                      Enable or disable internal tools. Optional tools (like Markets) remain strictly disabled unless voluntarily turned on.
                    </p>
                  </div>
                </div>

                <div className="settings-group-card">
                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layout size={14} className="text-accent" />
                        <span>NEXUS Hub</span>
                      </div>
                      <div className="settings-row-desc">Central launchpad with customizable card layout (nexus://hub)</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.hubEnabled ?? true}
                          onChange={(e) => handleSettingChange({ hubEnabled: e.target.checked }, 'Hub')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={14} style={{ color: '#818CF8' }} />
                        <span>NEXUS Connect</span>
                      </div>
                      <div className="settings-row-desc">Communication, messaging & productivity web app launcher (nexus://connect)</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.connectEnabled ?? true}
                          onChange={(e) => handleSettingChange({ connectEnabled: e.target.checked }, 'Connect')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckSquare size={14} style={{ color: '#34D399' }} />
                        <span>NEXUS Todo</span>
                      </div>
                      <div className="settings-row-desc">Privacy-first task manager with webpage linking (nexus://todo)</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.todoEnabled ?? true}
                          onChange={(e) => handleSettingChange({ todoEnabled: e.target.checked }, 'Todo')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} style={{ color: '#60A5FA' }} />
                        <span>NEXUS Notes</span>
                      </div>
                      <div className="settings-row-desc">Rich-text markdown notebook and study logs (nexus://notes)</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notesEnabled ?? true}
                          onChange={(e) => handleSettingChange({ notesEnabled: e.target.checked }, 'Notes')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Compass size={14} style={{ color: '#C084FC' }} />
                        <span>NEXUS Explore (Dictionary & Context)</span>
                      </div>
                      <div className="settings-row-desc">Contextual word clarification and vocabulary builder (nexus://explore)</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.exploreEnabled ?? true}
                          onChange={(e) => handleSettingChange({ exploreEnabled: e.target.checked }, 'Explore')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={14} style={{ color: '#FBBF24' }} />
                        <span>NEXUS Markets (Optional External Data)</span>
                      </div>
                      <div className="settings-row-desc">
                        Informational stocks, IPOs, and shopping tracker. Uses external data providers (nexus://markets)
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
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
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Code2 size={14} className="text-accent" />
                        <span>Developer Toolkit</span>
                      </div>
                      <div className="settings-row-desc">Network monitor, CSS inspector, reader view, and JSON formatter</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.devToolsEnabled ?? true}
                          onChange={(e) => handleSettingChange({ devToolsEnabled: e.target.checked }, 'DevTools')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Puzzle size={14} style={{ color: '#F472B6' }} />
                        <span>Extensions Runtime</span>
                      </div>
                      <div className="settings-row-desc">Manifest V3 chrome extensions manager (nexus://extensions)</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.extensionsEnabled ?? true}
                          onChange={(e) => handleSettingChange({ extensionsEnabled: e.target.checked }, 'Extensions')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-group-card">
                  <div>
                    <h4 className="settings-row-label">Side Panel Rail</h4>
                    <p className="settings-row-desc" style={{ marginTop: '4px' }}>
                      Choose which panels appear in the searchable toolbar rail. Hidden panels remain available elsewhere in NEXUS.
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {SIDE_PANEL_OPTIONS.map((panel) => {
                      const isVisible = !(settings.hiddenSidePanels ?? []).includes(panel.id);
                      return (
                        <label key={panel.id} className="side-panel-setting-option">
                          <span className="side-panel-setting-icon">{panel.icon}</span>
                          <span className="side-panel-setting-label">{panel.label}</span>
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(event) => {
                              const hiddenPanels = new Set<SidePanelId>(settings.hiddenSidePanels ?? []);
                              if (event.target.checked) hiddenPanels.delete(panel.id);
                              else hiddenPanels.add(panel.id);
                              handleSettingChange({ hiddenSidePanels: Array.from(hiddenPanels) }, `${panel.label} visibility`);
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 6. NOTIFICATIONS SECTION */}
            {activeSection === 'notifications' && (
              <div className="settings-section-block">
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">Notification Preferences</h3>
                    <p className="settings-section-desc">Control browser notifications and alert frequencies.</p>
                  </div>
                </div>

                <div className="settings-group-card">
                  {/* Master Switch */}
                  <div className="settings-row" style={{ padding: '8px 0' }}>
                    <div className="settings-row-label-group">
                      <div className="settings-row-label" style={{ fontWeight: 600 }}>Allow NEXUS Notifications</div>
                      <div className="settings-row-desc">Global toggle for all in-app and desktop notifications</div>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notificationsEnabled ?? true}
                          onChange={(e) => handleSettingChange({ notificationsEnabled: e.target.checked }, 'Master Notifications')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <hr className="settings-divider" />

                  {/* Sub Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: !(settings.notificationsEnabled ?? true) ? 0.4 : 1, pointerEvents: !(settings.notificationsEnabled ?? true) ? 'none' : 'auto' }}>
                    <div className="settings-row">
                      <div className="settings-row-label-group">
                        <div className="settings-row-label">Download Completion Alerts</div>
                        <div className="settings-row-desc">Notify when background file downloads finish successfully</div>
                      </div>
                      <div className="settings-row-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.notifyDownloadComplete ?? true}
                            onChange={(e) => handleSettingChange({ notifyDownloadComplete: e.target.checked }, 'Download Alerts')}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    </div>

                    <div className="settings-row">
                      <div className="settings-row-label-group">
                        <div className="settings-row-label">Security & Threat Warnings</div>
                        <div className="settings-row-desc">Immediate alerts for detected phishing or malware URLs</div>
                      </div>
                      <div className="settings-row-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.notifyShieldThreats ?? true}
                            onChange={(e) => handleSettingChange({ notifyShieldThreats: e.target.checked }, 'Threat Alerts')}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    </div>

                    <div className="settings-row">
                      <div className="settings-row-label-group">
                        <div className="settings-row-label">NEXUS Todo Due Date Reminders</div>
                        <div className="settings-row-desc">Alerts for pending tasks and due dates</div>
                      </div>
                      <div className="settings-row-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.notifyTodoReminders ?? true}
                            onChange={(e) => handleSettingChange({ notifyTodoReminders: e.target.checked }, 'Todo Reminders')}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    </div>

                    <div className="settings-row">
                      <div className="settings-row-label-group">
                        <div className="settings-row-label">NEXUS Markets Price Drop Alerts</div>
                        <div className="settings-row-desc">Optional price alerts for watchlist symbols</div>
                      </div>
                      <div className="settings-row-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.notifyMarketsAlerts ?? false}
                            onChange={(e) => handleSettingChange({ notifyMarketsAlerts: e.target.checked }, 'Market Alerts')}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    </div>

                    <hr className="settings-divider" />

                    <div className="settings-row">
                      <div className="settings-row-label-group">
                        <div className="settings-row-label">Notification Frequency</div>
                        <div className="settings-row-desc">How often aggregated digest notifications should appear</div>
                      </div>
                      <div className="settings-row-control" style={{ width: '280px' }}>
                        <Select
                          size="sm"
                          value={settings.notificationFrequency || 'instant'}
                          onChange={(e) => handleSettingChange({ notificationFrequency: e.target.value as any }, 'Alert Frequency')}
                          options={[
                            { value: 'instant', label: 'Instant (Deliver as events occur)' },
                            { value: 'daily', label: 'Daily Digest' },
                            { value: 'weekly', label: 'Weekly Summary' },
                          ]}
                        />
                      </div>
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
          </main>
        </div>
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        initialView={accountModalView}
        mode={settings.mode}
        onSessionChange={(newSession) => setAccountSession(newSession)}
      />
    </div>
  );
};
