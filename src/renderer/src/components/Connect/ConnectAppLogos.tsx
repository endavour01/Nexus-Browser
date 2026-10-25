import React from 'react';
import { ConnectApp } from '@shared/types';

export interface ConnectLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// 1. Core Default Registry Brand Logos (13 Default Apps)
// ============================================================================

/**
 * Official Discord Clyde Logo (#5865F2 squircle with white Clyde emblem)
 */
export const DiscordLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Discord logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#5865F2" />
    <path
      d="M18.8 6.5A13.8 13.8 0 0 0 15.3 5.4a.1.1 0 0 0-.1 0c-.2.3-.3.7-.5 1-1.1-.2-2.3-.2-3.4 0-.2-.3-.4-.7-.5-1a.1.1 0 0 0-.1 0 13.8 13.8 0 0 0-3.5 1.1.1.1 0 0 0 0 .1c-2.2 3.3-2.8 6.6-2.5 9.8 0 0 0 .1.1.1 1.5 1.1 2.9 1.7 4.3 2.1a.1.1 0 0 0 .1 0c.3-.5.7-1 1-1.5a.1.1 0 0 0-.1-.1c-.5-.2-.9-.4-1.3-.7a.1.1 0 0 1 0-.1c.1-.1.2-.2.3-.2a.1.1 0 0 1 .1 0c2.8 1.3 5.8 1.3 8.6 0a.1.1 0 0 1 .1 0c.1.1.2.2.3.2a.1.1 0 0 1 0 .1c-.4.3-.9.5-1.3.7a.1.1 0 0 0-.1.1c.3.5.7 1 1 1.5a.1.1 0 0 0 .1 0c1.4-.4 2.8-1 4.3-2.1 0 0 .1-.1.1-.1.4-3.8-.6-7.1-2.5-9.8 0 0 0 0 0 0zM9.5 14.3c-.8 0-1.5-.8-1.5-1.7 0-.9.7-1.7 1.5-1.7s1.6.8 1.5 1.7c0 .9-.7 1.7-1.5 1.7zm5 0c-.8 0-1.5-.8-1.5-1.7 0-.9.7-1.7 1.5-1.7s1.6.8 1.5 1.7c0 .9-.7 1.7-1.5 1.7z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Telegram Logo (#229ED9 circle with authentic paper airplane)
 */
export const TelegramLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Telegram logo"
  >
    <circle cx="12" cy="12" r="11" fill="#229ED9" />
    <path
      d="M5.2 11.7l11.4-4.4c.5-.2 1 .1.8.7l-1.9 9.1c-.1.5-.7.7-1.1.4l-3.3-2.4-1.6 1.5c-.2.2-.4.3-.6.3l.2-3.3 6-5.4c.3-.2 0-.4-.3-.2l-7.4 4.7-3.2-1c-.6-.2-.6-.7.1-.9z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official WhatsApp Web Logo (#25D366 speech bubble with white telephone handset)
 */
export const WhatsAppLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="WhatsApp logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#25D366" />
    <path
      d="M12 4.5a7.5 7.5 0 0 0-6.5 11.2L4.5 19.5l4-1a7.5 7.5 0 1 0 3.5-14zm0 13.6c-1.2 0-2.3-.3-3.3-.9l-.2-.1-2.4.6.6-2.3-.2-.3a6.2 6.2 0 1 1 5.3 3z"
      fill="#FFFFFF"
    />
    <path
      d="M15.4 13.6c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1s-.6.7-.7.9-.2.2-.4.1a5.6 5.6 0 0 1-2.6-2.3c-.2-.3 0-.5.1-.6l.3-.4c.1-.1.1-.3 0-.4l-.6-1.5c-.2-.4-.4-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s1 2.4 1.1 2.6c.1.2 1.9 3 4.6 4.1 2.7 1.1 2.7.7 3.2.7.5 0 1.6-.7 1.8-1.3.3-.6.3-1.2.2-1.3-.1-.1-.3-.2-.5-.3z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Reddit Logo (#FF4500 circle with Snoo alien)
 */
export const RedditLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Reddit logo"
  >
    <circle cx="12" cy="12" r="11" fill="#FF4500" />
    <path
      d="M18.8 11.5a1.5 1.5 0 0 0-2.4-1.1c-1.1-.8-2.6-1.3-4.3-1.3l.9-4.1 2.8.6a1.2 1.2 0 1 0 1.2-1.1 1.2 1.2 0 0 0-1.1.7l-3.2-.7a.3.3 0 0 0-.4.2l-1 4.7c-1.8 0-3.3.5-4.4 1.3a1.5 1.5 0 1 0-1.8 2.3c-.1.3-.1.6-.1.9 0 2.5 2.6 4.5 5.8 4.5s5.8-2 5.8-4.5c0-.3 0-.6-.1-.9a1.5 1.5 0 0 0 1-1.5zM9.4 12.3a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm5.2 3.5c-.8.8-2.4.8-2.6.8s-1.8 0-2.6-.8a.3.3 0 0 1 .4-.4c.6.6 1.8.6 2.2.6s1.6 0 2.2-.6a.3.3 0 0 1 .4.4zm0-2.5a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Google Meet Logo (authentic 4-color camera symbol)
 */
export const GoogleMeetLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Google Meet logo"
  >
    {/* Background rounded container for dark mode contrast */}
    <rect width="24" height="24" rx="5.5" fill="#1E232E" />
    {/* Yellow top-left corner */}
    <path d="M12.5 6.5H5.8A1.8 1.8 0 0 0 4 8.3v4.2l2.5 1.5L12.5 12V6.5z" fill="#00AC47" />
    {/* Blue bottom-left corner */}
    <path d="M4 12.5v3.2A1.8 1.8 0 0 0 5.8 17.5h6.7V12H6.5L4 12.5z" fill="#0066DA" />
    {/* Red top corner */}
    <path d="M12.5 6.5h3a1.8 1.8 0 0 1 1.8 1.8V12h-4.8V6.5z" fill="#EA4335" />
    {/* Amber right middle */}
    <path d="M12.5 12h4.8v3.7a1.8 1.8 0 0 1-1.8 1.8h-3V12z" fill="#2684FC" />
    {/* Camera nozzle triangles */}
    <path d="M17.3 10.3l2.8-2.1a.9.9 0 0 1 1.4.7v6.2a.9.9 0 0 1-1.4.7l-2.8-2.1V10.3z" fill="#FFBA00" />
    <path d="M17.3 12l4.2 3.8v-2L17.3 12z" fill="#00AC47" />
  </svg>
);

/**
 * Official Slack Logo (authentic 4-color octothorpe)
 */
export const SlackLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Slack logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#1A1D21" />
    {/* Blue / Cyan */}
    <path d="M7.3 10.7a1.3 1.3 0 0 1-1.3-1.3 1.3 1.3 0 0 1 1.3-1.4h1.4v1.4a1.3 1.3 0 0 1-1.4 1.3z" fill="#36C5F0" />
    <path d="M9.9 10.7a1.3 1.3 0 0 1 1.4-1.3 1.3 1.3 0 0 1 1.3 1.3v3.3a1.3 1.3 0 0 1-1.3 1.3 1.3 1.3 0 0 1-1.4-1.3v-3.3z" fill="#36C5F0" />
    {/* Green */}
    <path d="M10.7 7.3a1.3 1.3 0 0 1-1.3-1.3 1.3 1.3 0 0 1 1.3-1.3 1.3 1.3 0 0 1 1.3 1.3v1.3H10.7z" fill="#2EB67D" />
    <path d="M10.7 9.9a1.3 1.3 0 0 1-1.3 1.4 1.3 1.3 0 0 1-1.3-1.4V6.6a1.3 1.3 0 0 1 1.3-1.3 1.3 1.3 0 0 1 1.3 1.3v3.3z" fill="#2EB67D" />
    {/* Amber / Yellow */}
    <path d="M16.7 13.3a1.3 1.3 0 0 1 1.3 1.3 1.3 1.3 0 0 1-1.3 1.4h-1.4v-1.4a1.3 1.3 0 0 1 1.4-1.3z" fill="#ECB22E" />
    <path d="M14.1 13.3a1.3 1.3 0 0 1-1.4 1.3 1.3 1.3 0 0 1-1.3-1.3V10a1.3 1.3 0 0 1 1.3-1.3 1.3 1.3 0 0 1 1.4 1.3v3.3z" fill="#ECB22E" />
    {/* Red / Ruby */}
    <path d="M13.3 16.7a1.3 1.3 0 0 1 1.3 1.3 1.3 1.3 0 0 1-1.3 1.3 1.3 1.3 0 0 1-1.3-1.3v-1.3h1.3z" fill="#E01E5A" />
    <path d="M13.3 14.1a1.3 1.3 0 0 1 1.3-1.4 1.3 1.3 0 0 1 1.3 1.4v3.3a1.3 1.3 0 0 1-1.3 1.3 1.3 1.3 0 0 1-1.3-1.3v-3.3z" fill="#E01E5A" />
  </svg>
);

/**
 * Official Microsoft Teams Logo (authentic dual purple tiles with "T")
 */
export const TeamsLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Microsoft Teams logo"
  >
    {/* Background tile with team avatars */}
    <rect x="7" y="4.5" width="13" height="15" rx="3" fill="#505AC9" />
    <circle cx="16" cy="9" r="2" fill="#8B95F6" />
    <path d="M13.5 16.5c0-1.9 1.6-3 3.5-3s3.5 1.1 3.5 3v.5h-7v-.5z" fill="#8B95F6" />
    <circle cx="12" cy="8" r="1.5" fill="#C5CBFB" />
    <path d="M10 14c0-1.4 1.1-2.2 2.5-2.2s2.5.8 2.5 2.2v.5h-5V14z" fill="#C5CBFB" />
    {/* Foreground tile with bold T */}
    <rect x="4" y="6" width="10" height="12" rx="2.5" fill="#464EB8" stroke="#373D92" strokeWidth="0.5" />
    <path d="M6.5 9h5v1.6H9.8v5.4H8.2v-5.4H6.5V9z" fill="#FFFFFF" />
  </svg>
);

/**
 * Official Zoom Logo (#2D8CFF squircle with white camera)
 */
export const ZoomLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Zoom logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#2D8CFF" />
    <rect x="5.5" y="8" width="9" height="8" rx="2" fill="#FFFFFF" />
    <path d="M15 10.3l3-2.1a.6.6 0 0 1 .9.5v6.6a.6.6 0 0 1-.9.5L15 13.7v-3.4z" fill="#FFFFFF" />
  </svg>
);

/**
 * Official Skype Logo (#00AFF0 circle with curved "S")
 */
export const SkypeLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Skype logo"
  >
    <circle cx="12" cy="12" r="11" fill="#00AFF0" />
    <path
      d="M17.1 13.4c-.1 2.4-1.9 3.8-4.5 3.8-3 0-4.9-1.6-4.9-3.8 0-1.3.8-2.2 2.3-2.6l2.1-.5c1.2-.3 1.6-.7 1.6-1.3 0-.8-.8-1.3-2-1.3-1.4 0-2.1.6-2.2 1.6H7.1c.1-2.2 1.8-3.5 4.3-3.5 2.7 0 4.5 1.5 4.5 3.6 0 1.2-.7 2.1-2.1 2.5l-2.2.5c-1.3.3-1.8.8-1.8 1.4 0 .9.9 1.4 2.2 1.4 1.5 0 2.3-.7 2.4-1.7h2.7z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official GitHub Invertocat Logo (dark squircle with white Invertocat)
 */
export const GitHubLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="GitHub logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#24292F" stroke="#343A40" strokeWidth="0.5" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 4.5C7.86 4.5 4.5 7.86 4.5 12c0 3.31 2.15 6.12 5.13 7.11.38.07.51-.16.51-.36 0-.18-.01-.78-.01-1.42-2.09.45-2.53-.89-2.53-.89-.34-.87-.83-1.1-.83-1.1-.68-.46.05-.45.05-.45.75.05 1.15.77 1.15.77.67 1.15 1.76.82 2.19.63.07-.49.26-.82.48-1.01-1.67-.19-3.42-.83-3.42-3.71 0-.82.29-1.49.77-2.02-.08-.19-.33-.95.07-1.99 0 0 .63-.2 2.07.77.6-.17 1.25-.25 1.89-.25.64 0 1.29.08 1.89.25 1.44-.97 2.07-.77 2.07-.77.4 1.04.15 1.8.07 1.99.48.53.77 1.2.77 2.02 0 2.89-1.76 3.52-3.44 3.71.27.23.51.69.51 1.39 0 1-.01 1.81-.01 2.06 0 .2.14.44.52.36 2.98-1 5.12-3.8 5.12-7.11 0-4.14-3.36-7.5-7.5-7.5z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Figma Logo (authentic 5-color geometric components)
 */
export const FigmaLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Figma logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#1E1E1E" />
    {/* Top left: Orange-Red */}
    <path d="M8.5 7.5a2.5 2.5 0 0 1 2.5-2.5h2.5v5H11a2.5 2.5 0 0 1-2.5-2.5z" fill="#F24E1E" />
    {/* Top right: Salmon */}
    <path d="M13.5 5h2a2.5 2.5 0 1 1 0 5h-2V5z" fill="#FF7262" />
    {/* Middle right: Cyan */}
    <path d="M13.5 10h2a2.5 2.5 0 1 1 0 5h-2v-5z" fill="#1ABCFE" />
    {/* Middle left: Purple */}
    <path d="M8.5 12.5A2.5 2.5 0 0 1 11 10h2.5v5H11a2.5 2.5 0 0 1-2.5-2.5z" fill="#A259FF" />
    {/* Bottom left: Green */}
    <path d="M8.5 17.5A2.5 2.5 0 0 1 11 15h2.5v2.5a2.5 2.5 0 0 1-5 0z" fill="#0ACF83" />
  </svg>
);

/**
 * Official Notion Logo (isometric block with stylized "N")
 */
export const NotionLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Notion logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#191919" stroke="#333333" strokeWidth="0.5" />
    <path
      d="M6.2 5.5l9.5-.7c1 .1 1.4.6 2 1.4l2.1 3.2c.2.4.2.8.2 1.2v7.7c0 .9-.5 1.5-1.5 1.6l-9.8.6c-.8 0-1.4-.4-1.9-1.2l-2-3c-.3-.5-.4-.9-.4-1.4V7c0-.9.6-1.5 1.8-1.5zm3.4 3.7c-.5 0-.7.3-.7.7v6.6c0 .4.2.6.7.6.4 0 .6-.2.8-.5l3.8-5.7v5.5c0 .4.2.6.7.6.4 0 .6-.2.6-.6V8.3c0-.4-.2-.6-.7-.6-.4 0-.6.2-.8.5L10.2 14V9.8c0-.4-.2-.6-.6-.6z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Google Docs Logo (#4285F4 document with fold and white text lines)
 */
export const GoogleDocsLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Google Docs logo"
  >
    {/* Page base */}
    <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h6.7l5.3 5.3v11.2a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 6 19.5V4.5z" fill="#4285F4" />
    {/* Dog-ear fold */}
    <path d="M14.2 3v4a1.3 1.3 0 0 0 1.3 1.3h4l-5.3-5.3z" fill="#A1C2FA" />
    {/* Text lines */}
    <rect x="8.5" y="11" width="7" height="1.4" rx="0.7" fill="#FFFFFF" />
    <rect x="8.5" y="13.7" width="7" height="1.4" rx="0.7" fill="#FFFFFF" />
    <rect x="8.5" y="16.4" width="4.5" height="1.4" rx="0.7" fill="#FFFFFF" />
  </svg>
);

// ============================================================================
// 2. Extended Workspace & Productivity Brand Logos
// ============================================================================

/**
 * Official Linear Logo (#5E6AD2 square with white compass fold)
 */
export const LinearLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Linear logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#5E6AD2" />
    <path
      d="M5.5 15.3l3.2 3.2c.4.4 1 .4 1.4 0l8.4-8.4c.4-.4.4-1 0-1.4l-3.2-3.2c-.4-.4-1-.4-1.4 0L5.5 13.9c-.4.4-.4 1 0 1.4zm3.8 2.3l-2.4-2.4 7.2-7.2 2.4 2.4-7.2 7.2z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Trello Logo (#0079BF blue board with two cards)
 */
export const TrelloLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Trello logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#0079BF" />
    <rect x="5.5" y="6" width="5" height="11" rx="1.2" fill="#FFFFFF" />
    <rect x="13.5" y="6" width="5" height="7.5" rx="1.2" fill="#FFFFFF" />
  </svg>
);

/**
 * Official Asana Logo (#F06A6A coral with 3 dots)
 */
export const AsanaLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Asana logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#201C24" />
    <circle cx="12" cy="8.2" r="2.8" fill="#F06A6A" />
    <circle cx="7.6" cy="15.2" r="2.8" fill="#F06A6A" />
    <circle cx="16.4" cy="15.2" r="2.8" fill="#F06A6A" />
  </svg>
);

/**
 * Official Jira Logo (#0052CC diamonds)
 */
export const JiraLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Jira logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#0052CC" />
    <path d="M12 5.5l5 5-5 5-1.5-1.5 3.5-3.5-3.5-3.5L12 5.5z" fill="#FFFFFF" fillOpacity="0.75" />
    <path d="M8.5 9l5 5-5 5-1.5-1.5 3.5-3.5L7 10.5 8.5 9z" fill="#FFFFFF" />
  </svg>
);

/**
 * Official Google Drive Logo (tricolor triangle loop)
 */
export const GoogleDriveLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Google Drive logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#1C212B" />
    <path d="M9.1 5.5h5.8l4.6 8-2.9 5H10.8L9.1 5.5z" fill="#FFBA00" />
    <path d="M4.5 13.5l2.9-5 5.8 10H7.4a2 2 0 0 1-1.7-1l-1.2-4z" fill="#00AC47" />
    <path d="M14.9 5.5H9.1L4.5 13.5l2.9 5 4.6-8 2.9-5z" fill="#0066DA" />
  </svg>
);

/**
 * Official Google Sheets Logo (#0F9D58 with table grid)
 */
export const GoogleSheetsLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Google Sheets logo"
  >
    <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h6.7l5.3 5.3v11.2a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 6 19.5V4.5z" fill="#0F9D58" />
    <path d="M14.2 3v4a1.3 1.3 0 0 0 1.3 1.3h4l-5.3-5.3z" fill="#87CEAB" />
    <rect x="8.5" y="11" width="7" height="6.5" rx="0.5" fill="#FFFFFF" fillOpacity="0.2" />
    <path d="M8.5 13.2h7M8.5 15.3h7M12 11v6.5" stroke="#FFFFFF" strokeWidth="1" />
  </svg>
);

/**
 * Official Gmail Logo (4-color envelope lettermark)
 */
export const GmailLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Gmail logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#1C212B" />
    <path d="M5.5 8.2v8.3c0 .6.4 1 1 1h2.2v-6.5L5.5 8.2z" fill="#4285F4" />
    <path d="M15.3 17.5h2.2c.6 0 1-.4 1-1V8.2l-3.2 2.8v6.5z" fill="#34A853" />
    <path d="M15.3 11v-4l-3.3 2.5-3.3-2.5v4l3.3 2.5 3.3-2.5z" fill="#EA4335" />
    <path d="M5.5 8.2L8.7 11V7l-2.4-1.8c-.5-.4-.8-.1-.8.4v2.6z" fill="#C5221F" />
    <path d="M18.5 8.2L15.3 11V7l2.4-1.8c.5-.4.8-.1.8.4v2.6z" fill="#FBBC04" />
  </svg>
);

/**
 * Official X / Twitter Logo (modern minimal X on dark tile)
 */
export const XTwitterLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="X logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#000000" stroke="#2F3336" strokeWidth="0.5" />
    <path
      d="M14.6 6.5h2.2l-4.8 5.5 5.6 7.5h-4.4l-3.4-4.5-3.9 4.5H3.6l5.1-5.8L3.3 6.5h4.5l3.1 4.1 3.7-4.1zm-.8 11.7h1.2L7.3 7.7H6l7.8 10.5z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official LinkedIn Logo (#0A66C2 with white "in")
 */
export const LinkedInLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="LinkedIn logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#0A66C2" />
    <circle cx="7.7" cy="8" r="1.3" fill="#FFFFFF" />
    <rect x="6.5" y="10.5" width="2.4" height="7" rx="0.5" fill="#FFFFFF" />
    <path
      d="M10.8 10.5h2.3v1c.4-.6 1.2-1.2 2.4-1.2 2.1 0 2.8 1.4 2.8 3.5v3.7H16v-3.3c0-1-.4-1.7-1.3-1.7-.8 0-1.2.6-1.4 1.1-.1.2-.1.5-.1.8v3.1h-2.4v-7z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official YouTube Logo (#FF0000 squircle with white play triangle)
 */
export const YouTubeLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="YouTube logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#FF0000" />
    <path d="M10 8.5l5.5 3.5-5.5 3.5v-7z" fill="#FFFFFF" />
  </svg>
);

/**
 * Official Spotify Logo (#1DB954 green circle with soundwaves)
 */
export const SpotifyLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="Spotify logo"
  >
    <circle cx="12" cy="12" r="11" fill="#1DB954" />
    <path
      d="M16.9 15.3c-.2.3-.5.4-.8.2-2.4-1.5-5.5-1.8-9.1-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.4-.5 10 1.2.3.2.4.6.2.9zm1.2-2.7c-.2.4-.7.5-1.1.3-2.8-1.7-7-2.2-10.3-1.2-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.8-1.1 8.5-.6 11.7 1.4.3.2.5.7.2 1zm.1-2.8c-3.3-2-8.8-2.2-12-1.2-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 3.7-1.1 9.8-.9 13.6 1.4.5.3.6.9.3 1.3-.3.5-.9.6-1.3.3z"
      fill="#000000"
    />
  </svg>
);

/**
 * Official ArXiv Logo (amber/crimson stylized smile mark)
 */
export const ArXivLogo: React.FC<ConnectLogoProps> = ({ size = 22, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`connect-brand-icon ${className}`}
    style={style}
    role="img"
    aria-label="ArXiv logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#B31B1B" />
    <path
      d="M6 7l4.5 5L6 17h2.2l3.4-3.8 3.4 3.8h2.2l-4.5-5 4.5-5H15l-3.4 3.8L8.2 7H6z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Neutral Modern Fallback Logo (for custom / unrecognized applications)
 */
export const ConnectFallbackLogo: React.FC<ConnectLogoProps & { label?: string }> = ({
  size = 22,
  className = '',
  style,
  label = 'App',
}) => {
  const initial = (label || 'A').trim().charAt(0).toUpperCase() || 'A';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`connect-brand-icon ${className}`}
      style={style}
      role="img"
      aria-label={`${label} icon`}
    >
      <rect width="24" height="24" rx="5.5" fill="#222736" stroke="#333A4D" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="7" stroke="#6366F1" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#E0E7FF"
      >
        {initial}
      </text>
    </svg>
  );
};

// ============================================================================
// 3. Intelligent Brand Resolution & Dispatcher
// ============================================================================

export type SupportedConnectBrand =
  | 'discord'
  | 'telegram'
  | 'whatsapp'
  | 'reddit'
  | 'meet'
  | 'slack'
  | 'teams'
  | 'zoom'
  | 'skype'
  | 'github'
  | 'figma'
  | 'notion'
  | 'docs'
  | 'linear'
  | 'trello'
  | 'asana'
  | 'jira'
  | 'drive'
  | 'sheets'
  | 'gmail'
  | 'xtwitter'
  | 'linkedin'
  | 'youtube'
  | 'spotify'
  | 'arxiv';

/**
 * Resolves a ConnectApp object, app ID string, or custom metadata to a known brand identifier.
 */
export function resolveConnectBrand(
  appOrIdentifier?: ConnectApp | string | null
): SupportedConnectBrand | null {
  if (!appOrIdentifier) return null;

  let id = '';
  let name = '';
  let url = '';
  let icon = '';

  if (typeof appOrIdentifier === 'string') {
    id = appOrIdentifier.toLowerCase();
    name = appOrIdentifier.toLowerCase();
    icon = appOrIdentifier;
    url = appOrIdentifier;
  } else {
    id = (appOrIdentifier.id || '').toLowerCase();
    name = (appOrIdentifier.name || '').toLowerCase();
    icon = appOrIdentifier.icon || '';
    url = (appOrIdentifier.url || '').toLowerCase();
  }

  // 1. Direct ID matching (standard app registry ids)
  if (id === 'app-discord' || id === 'discord') return 'discord';
  if (id === 'app-telegram' || id === 'telegram') return 'telegram';
  if (id === 'app-whatsapp' || id === 'whatsapp') return 'whatsapp';
  if (id === 'app-reddit' || id === 'reddit') return 'reddit';
  if (id === 'app-meet' || id === 'google-meet' || id === 'meet') return 'meet';
  if (id === 'app-slack' || id === 'slack') return 'slack';
  if (id === 'app-teams' || id === 'microsoft-teams' || id === 'teams') return 'teams';
  if (id === 'app-zoom' || id === 'zoom') return 'zoom';
  if (id === 'app-skype' || id === 'skype') return 'skype';
  if (id === 'app-github' || id === 'github') return 'github';
  if (id === 'app-figma' || id === 'figma') return 'figma';
  if (id === 'app-notion' || id === 'notion') return 'notion';
  if (id === 'app-docs' || id === 'google-docs' || id === 'docs') return 'docs';

  // Extended app ids
  if (id.includes('linear')) return 'linear';
  if (id.includes('trello')) return 'trello';
  if (id.includes('asana')) return 'asana';
  if (id.includes('jira')) return 'jira';
  if (id.includes('drive')) return 'drive';
  if (id.includes('sheet')) return 'sheets';
  if (id.includes('gmail')) return 'gmail';
  if (id.includes('twitter') || id === 'x') return 'xtwitter';
  if (id.includes('linkedin')) return 'linkedin';
  if (id.includes('youtube')) return 'youtube';
  if (id.includes('spotify')) return 'spotify';
  if (id.includes('arxiv')) return 'arxiv';

  // 2. Name matching
  if (name.includes('discord')) return 'discord';
  if (name.includes('telegram')) return 'telegram';
  if (name.includes('whatsapp')) return 'whatsapp';
  if (name.includes('reddit')) return 'reddit';
  if (name.includes('meet')) return 'meet';
  if (name.includes('slack')) return 'slack';
  if (name.includes('teams')) return 'teams';
  if (name.includes('zoom')) return 'zoom';
  if (name.includes('skype')) return 'skype';
  if (name.includes('github')) return 'github';
  if (name.includes('figma')) return 'figma';
  if (name.includes('notion')) return 'notion';
  if (name.includes('doc')) return 'docs';
  if (name.includes('linear')) return 'linear';
  if (name.includes('trello')) return 'trello';
  if (name.includes('asana')) return 'asana';
  if (name.includes('jira')) return 'jira';
  if (name.includes('drive')) return 'drive';
  if (name.includes('sheet')) return 'sheets';
  if (name.includes('gmail')) return 'gmail';
  if (name.includes('twitter') || name === 'x') return 'xtwitter';
  if (name.includes('linkedin')) return 'linkedin';
  if (name.includes('youtube')) return 'youtube';
  if (name.includes('spotify')) return 'spotify';
  if (name.includes('arxiv')) return 'arxiv';

  // 3. URL / Hostname matching
  if (url) {
    try {
      const parsedUrl = url.startsWith('http') ? new URL(url) : new URL(`https://${url}`);
      const host = parsedUrl.hostname.toLowerCase();
      if (host.includes('discord.')) return 'discord';
      if (host.includes('telegram.')) return 'telegram';
      if (host.includes('whatsapp.')) return 'whatsapp';
      if (host.includes('reddit.')) return 'reddit';
      if (host.includes('meet.google.')) return 'meet';
      if (host.includes('slack.')) return 'slack';
      if (host.includes('teams.microsoft.') || host.includes('teams.live.')) return 'teams';
      if (host.includes('zoom.us')) return 'zoom';
      if (host.includes('skype.')) return 'skype';
      if (host.includes('github.')) return 'github';
      if (host.includes('figma.')) return 'figma';
      if (host.includes('notion.')) return 'notion';
      if (host.includes('docs.google.')) return 'docs';
      if (host.includes('linear.app')) return 'linear';
      if (host.includes('trello.com')) return 'trello';
      if (host.includes('asana.com')) return 'asana';
      if (host.includes('atlassian.net') || host.includes('jira.')) return 'jira';
      if (host.includes('drive.google.')) return 'drive';
      if (host.includes('sheets.google.')) return 'sheets';
      if (host.includes('mail.google.') || host.includes('gmail.')) return 'gmail';
      if (host.includes('twitter.com') || host.includes('x.com')) return 'xtwitter';
      if (host.includes('linkedin.com')) return 'linkedin';
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
      if (host.includes('spotify.com')) return 'spotify';
      if (host.includes('arxiv.org')) return 'arxiv';
    } catch {
      // not a parseable URL
    }
  }

  // 4. Icon name matching (if user picked brand as icon)
  const normalizedIcon = icon.toLowerCase();
  if (normalizedIcon === 'discord') return 'discord';
  if (normalizedIcon === 'telegram') return 'telegram';
  if (normalizedIcon === 'whatsapp') return 'whatsapp';
  if (normalizedIcon === 'reddit') return 'reddit';
  if (normalizedIcon === 'meet' || normalizedIcon === 'googlemeet') return 'meet';
  if (normalizedIcon === 'slack') return 'slack';
  if (normalizedIcon === 'teams' || normalizedIcon === 'microsoftteams') return 'teams';
  if (normalizedIcon === 'zoom') return 'zoom';
  if (normalizedIcon === 'skype') return 'skype';
  if (normalizedIcon === 'github') return 'github';
  if (normalizedIcon === 'figma') return 'figma';
  if (normalizedIcon === 'notion') return 'notion';
  if (normalizedIcon === 'docs' || normalizedIcon === 'googledocs') return 'docs';
  if (normalizedIcon === 'linear') return 'linear';
  if (normalizedIcon === 'trello') return 'trello';
  if (normalizedIcon === 'asana') return 'asana';
  if (normalizedIcon === 'jira') return 'jira';
  if (normalizedIcon === 'drive') return 'drive';
  if (normalizedIcon === 'sheets') return 'sheets';
  if (normalizedIcon === 'gmail') return 'gmail';
  if (normalizedIcon === 'xtwitter' || normalizedIcon === 'twitter' || normalizedIcon === 'x') return 'xtwitter';
  if (normalizedIcon === 'linkedin') return 'linkedin';
  if (normalizedIcon === 'youtube') return 'youtube';
  if (normalizedIcon === 'spotify') return 'spotify';
  if (normalizedIcon === 'arxiv') return 'arxiv';

  return null;
}

/**
 * Returns the brand logo component for a given brand key.
 */
export function getBrandLogoComponent(
  brand: SupportedConnectBrand
): React.FC<ConnectLogoProps> {
  switch (brand) {
    case 'discord':
      return DiscordLogo;
    case 'telegram':
      return TelegramLogo;
    case 'whatsapp':
      return WhatsAppLogo;
    case 'reddit':
      return RedditLogo;
    case 'meet':
      return GoogleMeetLogo;
    case 'slack':
      return SlackLogo;
    case 'teams':
      return TeamsLogo;
    case 'zoom':
      return ZoomLogo;
    case 'skype':
      return SkypeLogo;
    case 'github':
      return GitHubLogo;
    case 'figma':
      return FigmaLogo;
    case 'notion':
      return NotionLogo;
    case 'docs':
      return GoogleDocsLogo;
    case 'linear':
      return LinearLogo;
    case 'trello':
      return TrelloLogo;
    case 'asana':
      return AsanaLogo;
    case 'jira':
      return JiraLogo;
    case 'drive':
      return GoogleDriveLogo;
    case 'sheets':
      return GoogleSheetsLogo;
    case 'gmail':
      return GmailLogo;
    case 'xtwitter':
      return XTwitterLogo;
    case 'linkedin':
      return LinkedInLogo;
    case 'youtube':
      return YouTubeLogo;
    case 'spotify':
      return SpotifyLogo;
    case 'arxiv':
      return ArXivLogo;
    default:
      return ConnectFallbackLogo;
  }
}

/**
 * Master ConnectAppLogo component.
 * Automatically resolves and renders the brand logo, with accessible attributes and fallback.
 */
export const ConnectAppLogo: React.FC<{
  app: ConnectApp | string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ app, size = 22, className = '', style }) => {
  const brand = resolveConnectBrand(app);
  if (brand) {
    const Component = getBrandLogoComponent(brand);
    return <Component size={size} className={className} style={style} />;
  }

  const appName = typeof app === 'string' ? app : app.name || 'App';
  return <ConnectFallbackLogo size={size} className={className} style={style} label={appName} />;
};

/**
 * Functional render helper for dynamic contexts (e.g. JSX child or table cells).
 */
export function renderConnectAppLogo(
  app: ConnectApp | string,
  size = 22,
  className = '',
  style?: React.CSSProperties
): React.ReactElement {
  return <ConnectAppLogo app={app} size={size} className={className} style={style} />;
}
