import React from 'react';
import { Database, ShieldCheck, Globe, Check, X, AlertCircle } from 'lucide-react';

interface TransparencyEntry {
  feature: string;
  provider: string;
  isExternal: boolean;
  dataSent: string;
  purpose: string;
  worksWithoutProvider: boolean;
  storesLocally: boolean;
  localFiles: string[];
}

const TRANSPARENCY_AUDIT: TransparencyEntry[] = [
  {
    feature: 'Web Search Omnibox',
    provider: 'User-selected Engine (DuckDuckGo, Google, Brave, Bing)',
    isExternal: true,
    dataSent: 'Typed search query keywords over HTTPS only when submitting search.',
    purpose: 'Retrieve search engine results pages (SERPs).',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-history.json (unless in Private Window)'],
  },
  {
    feature: 'NEXUS Explore (Dictionary)',
    provider: 'Free Dictionary API (api.dictionaryapi.dev)',
    isExternal: true,
    dataSent: 'The specific word requested when clicking "Explain" or searching.',
    purpose: 'Retrieve phonetics, part of speech, definitions, and synonyms.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-notes.json (saved vocabulary words)'],
  },
  {
    feature: 'NEXUS Markets (Stocks & Quotes)',
    provider: 'Public Market APIs & SEC EDGAR (Yahoo Finance, AMFI, SEC)',
    isExternal: true,
    dataSent: 'Ticker symbol query strings (e.g. AAPL) on quote refresh or chart range click.',
    purpose: 'Fetch delayed equity quotes, historical OHLCV candles, and fund NAVs.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-markets-settings.json', 'nexus-markets-watchlists.json'],
  },
  {
    feature: 'NEXUS Shield (Protection Engine)',
    provider: 'Local In-Memory Ruleset (EasyList, EasyPrivacy, Peter Lowe)',
    isExternal: false,
    dataSent: 'Zero data sent externally. 100% evaluated in local memory.',
    purpose: 'Evaluates URL patterns and domain hashes against local blocklists.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-shield-rules.json', 'nexus-shield-settings.json', 'nexus-shield-stats.json'],
  },
  {
    feature: 'NEXUS Notes',
    provider: 'Local Storage Engine (No External Service)',
    isExternal: false,
    dataSent: 'Zero data sent externally.',
    purpose: 'Create and organize rich text notes, code snippets, and research tables.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-notes.json'],
  },
  {
    feature: 'NEXUS Todo',
    provider: 'Local Storage Engine (No External Service)',
    isExternal: false,
    dataSent: 'Zero data sent externally.',
    purpose: 'Track browser tasks, prioritize todo items, and link to active tabs.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-todo.json'],
  },
  {
    feature: 'NEXUS Connect (Launcher)',
    provider: 'Direct Origin Connection to Target Apps',
    isExternal: true,
    dataSent: 'Standard web session cookies directly to Slack, Zoom, GitHub, etc.',
    purpose: 'Load web application sessions inside isolated browser views.',
    worksWithoutProvider: false,
    storesLocally: true,
    localFiles: ['nexus-connect-apps.json', 'nexus-connect-workspaces.json'],
  },
  {
    feature: 'Browser Crash Reports',
    provider: 'Local Disk Only (No Telemetry Service)',
    isExternal: false,
    dataSent: 'Zero telemetry or diagnostic bundles sent externally.',
    purpose: 'Save error logs locally to allow troubleshooting via DevTools.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-crash-reports.json'],
  },
];

export const DataTransparencyView: React.FC = () => {
  return (
    <div className="settings-section-block">
      {/* Header */}
      <div className="settings-section-header">
        <div>
          <h3 className="settings-section-title">Data Transparency Audit</h3>
          <p className="settings-section-desc">
            Complete architectural disclosure of external network connections, data transmission, and local storage files.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="settings-table-container">
        <table className="settings-table">
          <thead>
            <tr>
              <th>Feature Area</th>
              <th>Provider / Service</th>
              <th>Data Sent Outbound</th>
              <th>Purpose</th>
              <th style={{ textAlign: 'center' }}>Works Offline</th>
              <th>Local Storage Files</th>
            </tr>
          </thead>
          <tbody>
            {TRANSPARENCY_AUDIT.map((item) => (
              <tr key={item.feature}>
                <td style={{ fontWeight: 600, color: 'var(--nexus-text-primary, #F4F4F5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.isExternal ? (
                      <Globe size={13} style={{ color: '#FBBF24', flexShrink: 0 }} />
                    ) : (
                      <ShieldCheck size={13} style={{ color: '#34D399', flexShrink: 0 }} />
                    )}
                    <span>{item.feature}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--nexus-text-primary, #F4F4F5)' }}>{item.provider}</div>
                  <span style={{ fontSize: '10px', color: 'var(--nexus-text-secondary, #9298A8)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {item.isExternal ? 'External Network Call' : '100% Local In-Memory'}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', maxWidth: '240px', lineHeight: 1.4 }}>
                  {item.dataSent}
                </td>
                <td style={{ maxWidth: '240px', lineHeight: 1.4 }}>
                  {item.purpose}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {item.worksWithoutProvider ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34D399', fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <Check size={10} /> Yes
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FB7185', fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                      <X size={10} /> Requires Net
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: 'var(--nexus-accent-primary, #A78BFA)' }}>
                    {item.localFiles.map((f) => (
                      <code key={f} style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--nexus-border-subtle, #1C202C)' }}>
                        {f}
                      </code>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Note */}
      <div className="settings-group-card" style={{ padding: '14px 16px', flexDirection: 'row', alignItems: 'flex-start', gap: '12px' }}>
        <AlertCircle size={16} className="text-accent" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: 'var(--nexus-text-secondary, #9298A8)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--nexus-text-primary, #F4F4F5)' }}>Privacy Principles:</strong> Optional features with external network connections (such as NEXUS Markets) are explicitly disabled by default and require voluntary opt-in. Data files are stored strictly on your local disk in your user data directory and are never synchronized to any proprietary cloud.
        </div>
      </div>
    </div>
  );
};
