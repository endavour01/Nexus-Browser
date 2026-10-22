import React, { useState } from 'react';
import { Sparkles, Terminal, Code2, ShieldCheck, Heart, ExternalLink, Check, Copy, Scale } from 'lucide-react';
import { NexusLogo } from '../NexusLogo';
import { Button, Badge } from '../ui';
import { LegalDocumentView } from './LegalDocumentView';

export const AboutNexusView: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [legalDocument, setLegalDocument] = useState<'privacy' | 'terms' | null>(null);

  if (legalDocument) {
    return <LegalDocumentView document={legalDocument} onBack={() => setLegalDocument(null)} />;
  }

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
    <div className="settings-section-block" style={{ maxWidth: '780px' }}>
      {/* Brand & Creator Header Card */}
      <div className="settings-group-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NexusLogo size={48} />
          <div>
            <h2 className="settings-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{buildDetails.name}</span>
              <Badge variant="neutral" size="sm">
                v{buildDetails.version}
              </Badge>
            </h2>
            <p className="settings-header-desc" style={{ marginTop: '4px' }}>
              Minimal, premium, nerd-friendly desktop web browser built for power users, researchers, and developers.
            </p>
          </div>
        </div>

        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--nexus-border-subtle, #1C202C)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--nexus-text-secondary, #9298A8)' }}>
            <span>Architected & Developed by:</span>
            <span style={{ fontWeight: 600, color: 'var(--nexus-text-primary, #F4F4F5)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--nexus-border-subtle, #1C202C)' }}>
              {buildDetails.creator}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={copied ? <Check size={12} style={{ color: '#34D399' }} /> : <Copy size={12} />}
            onClick={handleCopyBuildInfo}
            title="Copy build and diagnostic details to clipboard"
          >
            {copied ? 'Copied' : 'Copy Version Info'}
          </Button>
        </div>
      </div>

      {/* Specifications & License Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="settings-group-card" style={{ gap: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--nexus-text-secondary, #9298A8)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} className="text-accent" />
            <span>Runtime Specifications</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--nexus-border-subtle, #1C202C)' }}>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>Application</span>
              <span style={{ color: 'var(--nexus-text-primary, #F4F4F5)', fontWeight: 500 }}>{buildDetails.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--nexus-border-subtle, #1C202C)' }}>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>Release</span>
              <span style={{ color: 'var(--nexus-text-primary, #F4F4F5)', fontWeight: 500 }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--nexus-border-subtle, #1C202C)' }}>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>Status</span>
              <span style={{ color: '#34D399', fontWeight: 500 }}>{buildDetails.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>Architecture</span>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>WebContentsView Multi-Engine</span>
            </div>
          </div>
        </div>

        <div className="settings-group-card" style={{ gap: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--nexus-text-secondary, #9298A8)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={12} className="text-accent" />
            <span>Open-Source & Licensing</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--nexus-border-subtle, #1C202C)' }}>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>License</span>
              <span style={{ color: 'var(--nexus-text-primary, #F4F4F5)', fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}>{buildDetails.license}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--nexus-border-subtle, #1C202C)' }}>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>Data Governance</span>
              <span style={{ color: 'var(--nexus-text-primary, #F4F4F5)', fontWeight: 500 }}>Local-by-Default</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--nexus-text-secondary, #9298A8)' }}>Telemetry</span>
              <span style={{ color: '#34D399', fontWeight: 500 }}>Zero Remote Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Statement */}
      <div className="settings-group-card" style={{ padding: '14px 16px', gap: '8px' }}>
        <div style={{ fontWeight: 600, color: 'var(--nexus-text-primary, #F4F4F5)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <ShieldCheck size={14} className="text-accent" />
          <span>Core Engineering Tenets</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--nexus-text-secondary, #9298A8)', lineHeight: 1.5 }}>
          NEXUS is designed with an uncompromising commitment to local storage, user agency, zero fabricated telemetry, and three distinct operating modes: Default (Obsidian & Violet), Balanced (Metallic Gold), and Performance (Redline High-FPS).
        </p>
      </div>

      <div className="settings-group-card legal-document-links">
        <div>
          <h3>Legal information</h3>
          <p>Review how NEXUS describes privacy and use of the browser.</p>
        </div>
        <div className="legal-document-link-actions">
          <Button variant="secondary" size="sm" leftIcon={<ShieldCheck size={13} />} onClick={() => setLegalDocument('privacy')}>
            Privacy Policy
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Scale size={13} />} onClick={() => setLegalDocument('terms')}>
            Terms of Use
          </Button>
        </div>
      </div>
    </div>
  );
};
