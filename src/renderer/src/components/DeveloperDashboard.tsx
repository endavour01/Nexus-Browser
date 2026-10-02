import React, { useState, useEffect } from 'react';
import {
  Code,
  Terminal,
  Cpu,
  Layers,
  Globe,
  ExternalLink,
  Smartphone,
  Pipette,
  BookOpen,
  Shield,
  Activity,
  Box,
  Copy,
  Check,
} from 'lucide-react';
import { SystemInfo, TabState } from '../../../shared/types';

interface DeveloperDashboardProps {
  systemInfo: SystemInfo | null;
  tabs: TabState[];
  onSelectTab: (id: string) => void;
  onNavigate: (url: string) => void;
  onToggleDevTools: () => void;
  onInspectElement: () => void;
  onToggleResponsive: () => void;
  onOpenJsonFormatter: () => void;
}

interface DevLink {
  title: string;
  url: string;
  category: string;
  desc: string;
}

const DEV_LINKS: DevLink[] = [
  {
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    category: 'Documentation',
    desc: 'Resources for developers, by developers',
  },
  {
    title: 'DevDocs.io',
    url: 'https://devdocs.io',
    category: 'Documentation',
    desc: 'Fast, offline API documentation browser',
  },
  {
    title: 'GitHub',
    url: 'https://github.com',
    category: 'Development',
    desc: 'Code hosting and version control',
  },
  {
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    category: 'Community',
    desc: 'Q&A for computer programmers',
  },
  {
    title: 'npm',
    url: 'https://www.npmjs.com',
    category: 'Registry',
    desc: 'JavaScript package registry',
  },
  {
    title: 'Bundlephobia',
    url: 'https://bundlephobia.com',
    category: 'Tooling',
    desc: 'Find the cost of adding a npm package',
  },
  {
    title: 'Regex101',
    url: 'https://regex101.com',
    category: 'Tooling',
    desc: 'Regular expression tester and debugger',
  },
  {
    title: 'Can I Use',
    url: 'https://caniuse.com',
    category: 'Compatibility',
    desc: 'Browser support tables for modern web APIs',
  },
];

const DeveloperDashboardComponent: React.FC<DeveloperDashboardProps> = ({
  systemInfo,
  tabs,
  onSelectTab,
  onNavigate,
  onToggleDevTools,
  onInspectElement,
  onToggleResponsive,
  onOpenJsonFormatter,
}) => {
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [hasCopiedColor, setHasCopiedColor] = useState<boolean>(false);

  const handlePickColor = async () => {
    if ((window as any).EyeDropper) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          setPickedColor(result.sRGBHex);
        }
      } catch (err) {
        console.warn('EyeDropper cancelled:', err);
      }
    } else {
      alert('EyeDropper API is not available.');
    }
  };

  const handleCopyColor = () => {
    if (pickedColor) {
      navigator.clipboard.writeText(pickedColor);
      setHasCopiedColor(true);
      setTimeout(() => setHasCopiedColor(false), 2000);
    }
  };

  return (
    <div className="dev-dashboard-container">
      {/* Top Banner */}
      <header className="dev-dashboard-header">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent/15 text-accent shrink-0">
              <Terminal size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">NEXUS Developer Dashboard</h1>
              <p className="text-xs text-muted-foreground">Developer workbench & telemetry</p>
            </div>
          </div>

          {/* System Info Chips */}
          {systemInfo && (
            <div className="dev-system-chips flex flex-wrap gap-2">
              <div className="dev-sys-chip" title="Chromium engine version">
                <span className="chip-label text-foreground font-medium">Chrome:</span>
                <span className="chip-val font-mono text-accent">{systemInfo.chrome}</span>
              </div>
              <div className="dev-sys-chip" title="Electron framework version">
                <span className="chip-label text-foreground font-medium">Electron:</span>
                <span className="chip-val font-mono text-accent">{systemInfo.electron}</span>
              </div>
              <div className="dev-sys-chip" title="Node.js runtime version">
                <span className="chip-label text-foreground font-medium">Node:</span>
                <span className="chip-val font-mono text-accent">{systemInfo.node}</span>
              </div>
              <div className="dev-sys-chip" title="Operating system and CPU architecture">
                <span className="chip-label text-foreground font-medium">Platform:</span>
                <span className="chip-val font-mono text-accent">
                  {systemInfo.platform} ({systemInfo.arch})
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Grid Content */}
      <div className="dev-dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Quick Launchpad & Open Tabs */}
        <div className="dev-grid-col flex flex-col gap-6">
          {/* Quick Launchpad */}
          <section className="dev-dashboard-card">
            <div className="card-header flex items-center gap-2 mb-3">
              <Code size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight m-0">Developer Toolkit Launchpad</h2>
            </div>
            <div className="dev-launchpad-grid">
              <button className="dev-tile-btn" onClick={onToggleDevTools}>
                <Code size={18} className="text-purple" />
                <span>DevTools</span>
                <small>F12</small>
              </button>
              <button className="dev-tile-btn" onClick={onInspectElement}>
                <Layers size={18} className="text-blue" />
                <span>Inspect</span>
                <small>Ctrl+Shift+C</small>
              </button>
              <button className="dev-tile-btn" onClick={onToggleResponsive}>
                <Smartphone size={18} className="text-green" />
                <span>Responsive</span>
                <small>Ctrl+Shift+M</small>
              </button>
              <button className="dev-tile-btn" onClick={onOpenJsonFormatter}>
                <Box size={18} className="text-yellow" />
                <span>JSON Formatter</span>
                <small>Validate</small>
              </button>
              <button className="dev-tile-btn" onClick={handlePickColor}>
                <Pipette size={18} className="text-red" />
                <span>Color Picker</span>
                <small>EyeDropper</small>
              </button>
              <button className="dev-tile-btn" onClick={() => onNavigate('nexus://permissions')}>
                <Shield size={18} className="text-purple" />
                <span>Permissions</span>
                <small>Site Rules</small>
              </button>
            </div>

            {pickedColor && (
              <div className="dev-picked-color-banner">
                <div className="color-swatch" style={{ backgroundColor: pickedColor }} />
                <span className="font-mono text-sm">{pickedColor}</span>
                <button className="icon-btn-small" onClick={handleCopyColor} title="Copy HEX">
                  {hasCopiedColor ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                </button>
              </div>
            )}
          </section>

          {/* Active Tabs Matrix */}
          <section className="dev-dashboard-card">
            <div className="card-header flex items-center gap-2 mb-3">
              <Layers size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight m-0">Active Tabs Monitor ({tabs.length})</h2>
            </div>
            <div className="dev-tabs-list">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className="dev-tab-row"
                  onClick={() => onSelectTab(tab.id)}
                  title={`Click to switch to tab: ${tab.title}`}
                >
                  <div className="dev-tab-row-left">
                    <span className={`status-dot ${tab.isLoading ? 'dot-loading' : 'dot-idle'}`} />
                    <span className="dev-tab-title">{tab.title}</span>
                  </div>
                  <div className="dev-tab-row-right">
                    {tab.isSecure && <span className="micro-badge badge-secure">HTTPS</span>}
                    {tab.isPinned && <span className="micro-badge">Pinned</span>}
                    {tab.isSuspended && (
                      <span
                        className="micro-badge"
                        style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        Suspended
                      </span>
                    )}
                    {tab.isPrivate && <span className="micro-badge badge-private">Incognito</span>}
                    <span className="dev-tab-url font-mono" title={tab.url}>
                      {tab.url}
                    </span>
                  </div>
                </div>
              ))}
              {tabs.length === 0 && <div className="font-dim text-sm">No open tabs found.</div>}
            </div>
          </section>
        </div>

        {/* Right Column: Pinned Developer Resources */}
        <div className="dev-grid-col">
          <section className="dev-dashboard-card">
            <div className="card-header flex items-center gap-2 mb-3">
              <Globe size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight m-0">Pinned Developer Documentation & Resources</h2>
            </div>
            <div className="dev-resources-list flex flex-col gap-3">
              {DEV_LINKS.map((link) => (
                <div
                  key={link.url}
                  className="dev-resource-card"
                  onClick={() => onNavigate(link.url)}
                  title={`Open ${link.url}`}
                >
                  <div className="resource-header">
                    <strong>{link.title}</strong>
                    <span className="resource-cat">{link.category}</span>
                  </div>
                  <p className="resource-desc">{link.desc}</p>
                  <div className="resource-footer font-mono text-xs">
                    <span>{link.url}</span>
                    <ExternalLink size={12} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const DeveloperDashboard = React.memo<DeveloperDashboardProps>(DeveloperDashboardComponent);
