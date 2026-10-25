import assert from 'assert';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_CONNECT_APPS } from '../src/main/connect-manager';
import {
  resolveConnectBrand,
  getBrandLogoComponent,
  ConnectAppLogo,
  renderConnectAppLogo,
  DiscordLogo,
  TelegramLogo,
  WhatsAppLogo,
  RedditLogo,
  GoogleMeetLogo,
  SlackLogo,
  TeamsLogo,
  ZoomLogo,
  SkypeLogo,
  GitHubLogo,
  FigmaLogo,
  NotionLogo,
  GoogleDocsLogo,
  LinearLogo,
  TrelloLogo,
  AsanaLogo,
  JiraLogo,
  GoogleDriveLogo,
  GoogleSheetsLogo,
  GmailLogo,
  XTwitterLogo,
  LinkedInLogo,
  YouTubeLogo,
  SpotifyLogo,
  ArXivLogo,
  ConnectFallbackLogo,
} from '../src/renderer/src/components/Connect/ConnectAppLogos';

console.log('====================================================');
console.log('  NEXUS Connect — Brand Icons QA Verification Suite ');
console.log('====================================================\n');

let passedChecks = 0;

function check(desc: string, condition: boolean) {
  assert(condition, `FAILED: ${desc}`);
  console.log(`  ✓ ${desc}`);
  passedChecks++;
}

// ----------------------------------------------------------------------------
// SUITE 1: All 13 Default Connect Apps Resolve to Official Brand Logos
// ----------------------------------------------------------------------------
console.log('[SUITE 1: 13 DEFAULT CONNECT APPS RESOLUTION]');

const expectedBrands: Record<string, string> = {
  'app-discord': 'discord',
  'app-telegram': 'telegram',
  'app-whatsapp': 'whatsapp',
  'app-reddit': 'reddit',
  'app-meet': 'meet',
  'app-slack': 'slack',
  'app-teams': 'teams',
  'app-zoom': 'zoom',
  'app-skype': 'skype',
  'app-github': 'github',
  'app-figma': 'figma',
  'app-notion': 'notion',
  'app-docs': 'docs',
};

check(`DEFAULT_CONNECT_APPS contains 13 apps`, DEFAULT_CONNECT_APPS.length === 13);

for (const app of DEFAULT_CONNECT_APPS) {
  const brand = resolveConnectBrand(app);
  const expected = expectedBrands[app.id];
  check(`App "${app.name}" (${app.id}) resolves to brand "${expected}"`, brand === expected);
}

// ----------------------------------------------------------------------------
// SUITE 2: Multi-Factor Intelligent Brand Resolution
// ----------------------------------------------------------------------------
console.log('\n[SUITE 2: MULTI-FACTOR BRAND RESOLUTION]');

// By ID
check('Resolves by ID "app-meet"', resolveConnectBrand('app-meet') === 'meet');
check('Resolves by ID "app-zoom"', resolveConnectBrand('app-zoom') === 'zoom');
check('Resolves by ID "discord"', resolveConnectBrand('discord') === 'discord');

// By Name
check('Resolves by Name "Google Meet"', resolveConnectBrand({ id: 'custom-1', name: 'Google Meet', url: 'https://other.com', category: 'work' } as any) === 'meet');
check('Resolves by Name "WhatsApp Web"', resolveConnectBrand({ id: 'custom-2', name: 'WhatsApp Web', url: 'https://other.com', category: 'chill' } as any) === 'whatsapp');
check('Resolves by Name "Microsoft Teams"', resolveConnectBrand({ id: 'custom-3', name: 'Microsoft Teams', url: 'https://other.com', category: 'work' } as any) === 'teams');

// By Hostname
check('Resolves by URL "https://meet.google.com/abc-def-ghi"', resolveConnectBrand({ id: 'custom-4', name: 'Meeting Room', url: 'https://meet.google.com/abc-def-ghi', category: 'work' } as any) === 'meet');
check('Resolves by URL "https://app.zoom.us/wc/join"', resolveConnectBrand({ id: 'custom-5', name: 'Video Call', url: 'https://app.zoom.us/wc/join', category: 'work' } as any) === 'zoom');
check('Resolves by URL "https://github.com/trending"', resolveConnectBrand({ id: 'custom-6', name: 'Code Vault', url: 'https://github.com/trending', category: 'create' } as any) === 'github');

// By Custom Icon Name
check('Resolves by Icon "Figma"', resolveConnectBrand({ id: 'custom-7', name: 'Design Tool', url: 'https://internal.corp/tool', category: 'create', icon: 'Figma' } as any) === 'figma');
check('Resolves by Icon "Slack"', resolveConnectBrand({ id: 'custom-8', name: 'Team Chat', url: 'https://internal.corp/chat', category: 'work', icon: 'Slack' } as any) === 'slack');

// ----------------------------------------------------------------------------
// SUITE 3: Extended Popular Workspace Brands
// ----------------------------------------------------------------------------
console.log('\n[SUITE 3: EXTENDED POPULAR WORKSPACE BRANDS]');

const extendedApps = [
  { name: 'Linear', url: 'https://linear.app', expected: 'linear' },
  { name: 'Trello', url: 'https://trello.com/b/123', expected: 'trello' },
  { name: 'Asana', url: 'https://app.asana.com', expected: 'asana' },
  { name: 'Jira', url: 'https://mycompany.atlassian.net', expected: 'jira' },
  { name: 'Google Drive', url: 'https://drive.google.com', expected: 'drive' },
  { name: 'Google Sheets', url: 'https://sheets.google.com', expected: 'sheets' },
  { name: 'Gmail', url: 'https://mail.google.com', expected: 'gmail' },
  { name: 'X', url: 'https://x.com/home', expected: 'xtwitter' },
  { name: 'LinkedIn', url: 'https://linkedin.com/feed', expected: 'linkedin' },
  { name: 'YouTube', url: 'https://youtube.com', expected: 'youtube' },
  { name: 'Spotify', url: 'https://open.spotify.com', expected: 'spotify' },
  { name: 'ArXiv', url: 'https://arxiv.org', expected: 'arxiv' },
];

for (const ext of extendedApps) {
  const brand = resolveConnectBrand({ id: `custom-${ext.expected}`, name: ext.name, url: ext.url, category: 'work' } as any);
  check(`Extended app "${ext.name}" resolves to brand "${ext.expected}"`, brand === ext.expected);
}

// Fallback for unknown app
const unknownBrand = resolveConnectBrand({ id: 'custom-unknown', name: 'Unknown Portal', url: 'https://example.local', category: 'work' } as any);
check('Unrecognized app returns null for graceful fallback logo', unknownBrand === null);

// ----------------------------------------------------------------------------
// SUITE 4: SVG Component Rendering & Accessibility
// ----------------------------------------------------------------------------
console.log('\n[SUITE 4: SVG COMPONENT RENDERING & ACCESSIBILITY]');

const allLogoComponents: [string, React.FC<any>][] = [
  ['DiscordLogo', DiscordLogo],
  ['TelegramLogo', TelegramLogo],
  ['WhatsAppLogo', WhatsAppLogo],
  ['RedditLogo', RedditLogo],
  ['GoogleMeetLogo', GoogleMeetLogo],
  ['SlackLogo', SlackLogo],
  ['TeamsLogo', TeamsLogo],
  ['ZoomLogo', ZoomLogo],
  ['SkypeLogo', SkypeLogo],
  ['GitHubLogo', GitHubLogo],
  ['FigmaLogo', FigmaLogo],
  ['NotionLogo', NotionLogo],
  ['GoogleDocsLogo', GoogleDocsLogo],
  ['LinearLogo', LinearLogo],
  ['TrelloLogo', TrelloLogo],
  ['AsanaLogo', AsanaLogo],
  ['JiraLogo', JiraLogo],
  ['GoogleDriveLogo', GoogleDriveLogo],
  ['GoogleSheetsLogo', GoogleSheetsLogo],
  ['GmailLogo', GmailLogo],
  ['XTwitterLogo', XTwitterLogo],
  ['LinkedInLogo', LinkedInLogo],
  ['YouTubeLogo', YouTubeLogo],
  ['SpotifyLogo', SpotifyLogo],
  ['ArXivLogo', ArXivLogo],
  ['ConnectFallbackLogo', ConnectFallbackLogo],
];

for (const [name, Component] of allLogoComponents) {
  const html = renderToStaticMarkup(React.createElement(Component, { size: 24 }));
  check(`${name} renders valid SVG (<svg)`, html.startsWith('<svg'));
  check(`${name} includes role="img"`, html.includes('role="img"'));
  check(`${name} includes aria-label`, html.includes('aria-label='));
  check(`${name} includes connect-brand-icon class`, html.includes('connect-brand-icon'));
}

// Test ConnectAppLogo wrapper
const renderedMeet = renderToStaticMarkup(React.createElement(ConnectAppLogo, { app: DEFAULT_CONNECT_APPS[4], size: 22 }));
check('ConnectAppLogo renders Google Meet SVG for app-meet', renderedMeet.includes('Google Meet logo'));

const renderedFallback = renderToStaticMarkup(React.createElement(ConnectAppLogo, { app: { id: 'test', name: 'Custom Tool', url: 'https://corp.internal', category: 'work' } as any, size: 22 }));
check('ConnectAppLogo renders fallback for unknown custom app', renderedFallback.includes('Custom Tool icon'));

// ----------------------------------------------------------------------------
// SUITE 5: Source Files Integration & Styling Integrity
// ----------------------------------------------------------------------------
console.log('\n[SUITE 5: SOURCE FILES INTEGRATION]');

const connectAppCardSrc = fs.readFileSync(path.resolve(__dirname, '../src/renderer/src/components/Connect/ConnectAppCard.tsx'), 'utf-8');
check('ConnectAppCard imports ConnectAppLogo', connectAppCardSrc.includes("import { ConnectAppLogo } from './ConnectAppLogos'"));
check('ConnectAppCard renders <ConnectAppLogo app={app}', connectAppCardSrc.includes('<ConnectAppLogo app={app}'));

const connectWorkspaceSrc = fs.readFileSync(path.resolve(__dirname, '../src/renderer/src/components/Connect/ConnectWorkspace.tsx'), 'utf-8');
check('ConnectWorkspace imports ConnectAppLogo', connectWorkspaceSrc.includes("import { ConnectAppLogo } from './ConnectAppLogos'"));
check('ConnectWorkspace renders <ConnectAppLogo app={app} in modal list', connectWorkspaceSrc.includes('<ConnectAppLogo app={app} size={16} />'));
check('ConnectWorkspace provides Brand Icons in select options', connectWorkspaceSrc.includes('label="Brand Icons"'));

const hubWorkspaceSrc = fs.readFileSync(path.resolve(__dirname, '../src/renderer/src/components/Hub/HubWorkspace.tsx'), 'utf-8');
check('HubWorkspace defines renderConnectIcon', hubWorkspaceSrc.includes('renderConnectIcon'));
check('HubWorkspace preserves Lucide icon import', hubWorkspaceSrc.includes("import * as Icons from 'lucide-react'"));
check('HubWorkspace uses resolveConnectBrand for brand logos', hubWorkspaceSrc.includes('resolveConnectBrand'));

const connectIndexSrc = fs.readFileSync(path.resolve(__dirname, '../src/renderer/src/components/Connect/index.ts'), 'utf-8');
check('Connect/index.ts exports ConnectAppLogo', connectIndexSrc.includes('ConnectAppLogo'));
check('Connect/index.ts exports renderConnectAppLogo', connectIndexSrc.includes('renderConnectAppLogo'));

const componentsCss = fs.readFileSync(path.resolve(__dirname, '../src/renderer/src/components.css'), 'utf-8');
check('components.css defines .connect-brand-icon', componentsCss.includes('.connect-brand-icon'));
check('components.css defines .connect-modal-app-icon', componentsCss.includes('.connect-modal-app-icon'));
check('components.css defines hover micro-interaction for brand icon', componentsCss.includes('.connect-app-card:hover .connect-brand-icon'));

console.log(`\n====================================================`);
console.log(`  ALL ${passedChecks} CHECKS PASSED SUCCESSFULLY!`);
console.log(`====================================================\n`);
