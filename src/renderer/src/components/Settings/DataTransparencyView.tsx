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
    purpose: 'Private offline research notes and document authoring.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-notes.json'],
  },
  {
    feature: 'NEXUS Todo',
    provider: 'Local Storage Engine (No External Service)',
    isExternal: false,
    dataSent: 'Zero data sent externally.',
    purpose: 'Task organization and explicit webpage linking.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-todos.json'],
  },
  {
    feature: 'NEXUS Hub',
    provider: 'Local Storage Engine (No External Service)',
    isExternal: false,
    dataSent: 'Zero data sent externally.',
    purpose: 'Central dashboard aggregating local browser tools and shortcuts.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-hub-preferences.json'],
  },
  {
    feature: 'Site Permissions Memory',
    provider: 'Local Storage Engine (No External Service)',
    isExternal: false,
    dataSent: 'Zero data sent externally.',
    purpose: 'Remembers user camera/mic/notification decisions across sessions.',
    worksWithoutProvider: true,
    storesLocally: true,
    localFiles: ['nexus-site-permissions.json'],
  },
];

export const DataTransparencyView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-subtle bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-accent" />
          <h2 className="text-lg font-bold text-primary tracking-tight">Data Transparency & Boundary Audit</h2>
        </div>
        <p className="text-xs text-secondary mt-1 max-w-2xl leading-relaxed">
          NEXUS operates on an audited <strong>local-by-default</strong> architecture. We never claim "zero collection" without implementation evidence. The table below details every feature, external provider, network payload, and local storage artifact.
        </p>
      </div>

      {/* Transparency Table */}
      <div className="overflow-x-auto border border-subtle rounded-xl bg-surface">
        <table className="w-full text-left text-2xs">
          <thead className="bg-elevated text-secondary font-medium uppercase tracking-wider text-3xs border-b border-subtle">
            <tr>
              <th className="p-3">Feature Area</th>
              <th className="p-3">Provider & Architecture</th>
              <th className="p-3">Data Transmitted</th>
              <th className="p-3">Purpose</th>
              <th className="p-3 text-center">Works Offline</th>
              <th className="p-3">Local Storage Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {TRANSPARENCY_AUDIT.map((item) => (
              <tr key={item.feature} className="hover:bg-surface-hover/50 transition-colors">
                <td className="p-3 font-semibold text-primary">
                  <div className="flex items-center gap-1.5">
                    {item.isExternal ? (
                      <Globe size={13} className="text-amber-400 shrink-0" />
                    ) : (
                      <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                    )}
                    <span>{item.feature}</span>
                  </div>
                </td>
                <td className="p-3 text-secondary">
                  <div className="font-medium text-primary/90">{item.provider}</div>
                  <span className="text-3xs text-muted font-mono">
                    {item.isExternal ? 'External Network Call' : '100% Local In-Memory'}
                  </span>
                </td>
                <td className="p-3 font-mono text-secondary text-3xs leading-relaxed max-w-xs">
                  {item.dataSent}
                </td>
                <td className="p-3 text-secondary text-2xs leading-relaxed max-w-xs">
                  {item.purpose}
                </td>
                <td className="p-3 text-center">
                  {item.worksWithoutProvider ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-3xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <Check size={10} /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 text-3xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                      <X size={10} /> Requires Net
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1 font-mono text-3xs text-accent">
                    {item.localFiles.map((f) => (
                      <code key={f} className="bg-input/60 px-1.5 py-0.5 rounded border border-subtle">
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
      <div className="p-4 rounded-lg border border-subtle/80 bg-base/50 text-2xs text-secondary leading-relaxed flex items-start gap-2.5">
        <AlertCircle size={15} className="text-accent shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-primary">Privacy Principles:</span> Optional features with external network connections (such as NEXUS Markets) are explicitly disabled by default and require voluntary opt-in. Data files are stored strictly on your local disk in your user data directory and are never synchronized to any proprietary cloud.
        </div>
      </div>
    </div>
  );
};
