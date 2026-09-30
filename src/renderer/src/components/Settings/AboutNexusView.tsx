import React, { useState } from 'react';
import { Sparkles, Terminal, Code2, ShieldCheck, Heart, ExternalLink, Check, Copy } from 'lucide-react';
import { NexusLogo } from '../NexusLogo';

export const AboutNexusView: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const buildDetails = {
    name: 'NEXUS Browser',
    version: '1.0.0',
    buildEnvironment: 'Linux / Electron / Chromium',
    status: 'Active Development / Beta',
    creator: 'Vikalp Soni',
    license: 'MIT License',
  };

  const handleCopyBuildInfo = () => {
    const text = `NEXUS Browser v${buildDetails.version}
Status: ${buildDetails.status}
Creator: ${buildDetails.creator}
License: ${buildDetails.license}
Platform: ${navigator.userAgent}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Brand & Creator Header Card */}
      <div className="p-6 rounded-xl border border-subtle bg-surface/60 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-4">
          <NexusLogo size={48} />
          <div>
            <h2 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
              <span>{buildDetails.name}</span>
              <span className="text-3xs uppercase font-mono bg-accent/15 text-accent px-2 py-0.5 rounded border border-accent/30 font-semibold">
                v{buildDetails.version}
              </span>
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Minimal, premium, nerd-friendly desktop web browser built for power users, researchers, and developers.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-secondary">
            <span>Architected & Developed by:</span>
            <span className="font-semibold text-primary px-2 py-0.5 rounded bg-surface border border-subtle">
              {buildDetails.creator}
            </span>
          </div>

          <button
            type="button"
            className="nexus-btn-ghost text-2xs px-2.5 py-1 flex items-center gap-1.5"
            onClick={handleCopyBuildInfo}
            title="Copy build and diagnostic details to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Version Info'}</span>
          </button>
        </div>
      </div>

      {/* Specifications & License Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-subtle bg-surface space-y-2">
          <div className="text-2xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={12} className="text-accent" />
            <span>Runtime Specifications</span>
          </div>
          <div className="space-y-1.5 text-2xs font-mono">
            <div className="flex justify-between py-1 border-b border-subtle/40">
              <span className="text-muted">Application</span>
              <span className="text-primary font-medium">{buildDetails.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle/40">
              <span className="text-muted">Release</span>
              <span className="text-primary font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle/40">
              <span className="text-muted">Status</span>
              <span className="text-emerald-400 font-medium">{buildDetails.status}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Architecture</span>
              <span className="text-secondary font-mono">WebContentsView Multi-Engine</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-subtle bg-surface space-y-2">
          <div className="text-2xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Code2 size={12} className="text-accent" />
            <span>Open-Source & Licensing</span>
          </div>
          <div className="space-y-1.5 text-2xs">
            <div className="flex justify-between py-1 border-b border-subtle/40">
              <span className="text-muted">License</span>
              <span className="text-primary font-mono font-medium">{buildDetails.license}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle/40">
              <span className="text-muted">Data Governance</span>
              <span className="text-primary font-medium">Local-by-Default</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Telemetry</span>
              <span className="text-emerald-400 font-medium">Zero Remote Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Statement */}
      <div className="p-4 rounded-xl border border-subtle bg-surface/40 text-2xs text-secondary leading-relaxed space-y-1.5">
        <div className="font-semibold text-primary flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-accent" />
          <span>Core Engineering Tenets</span>
        </div>
        <p>
          NEXUS is designed with an uncompromising commitment to local storage, user agency, zero fabricated telemetry, and three distinct operating modes: Default (Obsidian & Violet), Balanced (Metallic Gold), and Performance (Redline High-FPS).
        </p>
      </div>
    </div>
  );
};
