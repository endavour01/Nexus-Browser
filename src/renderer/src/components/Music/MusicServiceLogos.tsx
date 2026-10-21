import React from 'react';
import { Music, Radio, Disc } from 'lucide-react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Official Spotify Logo (authentic green circular icon with soundwaves)
 */
export const SpotifyLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Spotify Logo"
  >
    <circle cx="12" cy="12" r="12" fill="#1DB954" />
    <path
      d="M17.48 15.65c-.2.33-.63.43-.96.23-2.63-1.61-5.94-1.97-9.84-1.08-.38.09-.75-.15-.84-.52-.09-.38.15-.75.52-.84 4.27-.97 7.92-.57 10.89 1.25.33.2.43.63.23.96zm1.3-2.88c-.25.4-.78.53-1.18.28-3.01-1.85-7.6-2.39-11.16-1.31-.45.14-.93-.12-1.07-.57-.14-.45.12-.93.57-1.07 4.07-1.24 9.13-.64 12.56 1.48.4.25.53.78.28 1.19zm.12-3.01c-3.61-2.14-9.56-2.34-13.01-1.29-.55.17-1.14-.15-1.3-.7-.17-.55.15-1.14.7-1.3 3.97-1.2 10.54-.97 14.7 1.5.5.3.66.95.36 1.45-.3.49-.95.65-1.45.34z"
      fill="#000000"
    />
  </svg>
);

/**
 * Official YouTube Music Logo (authentic red disc with concentric rings and play triangle)
 */
export const YouTubeMusicLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="YouTube Music Logo"
  >
    <circle cx="12" cy="12" r="12" fill="#FF0000" />
    <circle cx="12" cy="12" r="7.5" stroke="#FFFFFF" strokeWidth="1.75" fill="none" />
    <path d="M10.2 8.7L15.3 12L10.2 15.3V8.7Z" fill="#FFFFFF" />
  </svg>
);

/**
 * Official Apple Music Logo (authentic vibrant gradient tile with double-beamed eighth note)
 */
export const AppleMusicLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Apple Music Logo"
  >
    <defs>
      <linearGradient id="appleMusicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FA243C" />
        <stop offset="100%" stopColor="#FC3C44" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="5.5" fill="url(#appleMusicGrad)" />
    <path
      d="M16.5 5.8c-.3-.1-.7-.1-.9.1l-6.2 1.8c-.4.1-.7.5-.7.9v7.6c-.6-.4-1.3-.6-2.1-.6-1.8 0-3.3 1.2-3.3 2.7 0 1.5 1.5 2.7 3.3 2.7 1.7 0 3.1-1.1 3.3-2.5l.1-.2v-8.2l5.6-1.6v5.8c-.6-.4-1.3-.6-2.1-.6-1.8 0-3.3 1.2-3.3 2.7 0 1.5 1.5 2.7 3.3 2.7 1.7 0 3.1-1.1 3.3-2.5l.1-.2V6.5c0-.4-.2-.6-.4-.7z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official SoundCloud Logo (authentic cloud with sound waveform lines)
 */
export const SoundCloudLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="SoundCloud Logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#FF5500" />
    <path
      d="M1.8 13.5c-.2 0-.3.1-.3.3v1.8c0 .2.1.3.3.3s.3-.1.3-.3v-1.8c0-.2-.1-.3-.3-.3zm1.2-1.8c-.2 0-.3.1-.3.3v4.2c0 .2.1.3.3.3s.3-.1.3-.3V12c0-.2-.1-.3-.3-.3zm1.2-1.2c-.2 0-.3.1-.3.3v6c0 .2.1.3.3.3s.3-.1.3-.3v-6c0-.2-.1-.3-.3-.3zm1.2 1.5c-.2 0-.3.1-.3.3v4.5c0 .2.1.3.3.3s.3-.1.3-.3V12.3c0-.2-.1-.3-.3-.3zm1.2-3.3c-.2 0-.3.1-.3.3v8.1c0 .2.1.3.3.3s.3-.1.3-.3V9c0-.2-.1-.3-.3-.3zm1.2-.6c-.2 0-.3.1-.3.3v9c0 .2.1.3.3.3s.3-.1.3-.3V8.7c0-.2-.1-.3-.3-.3zm1.2.6c-.2 0-.3.1-.3.3v8.4c0 .2.1.3.3.3s.3-.1.3-.3V9c0-.2-.1-.3-.3-.3zm1.2-.6c-.2 0-.3.1-.3.3v9c0 .2.1.3.3.3s.3-.1.3-.3V8.4c0-.2-.1-.3-.3-.3zm1.2 1.2c-.2 0-.3.1-.3.3v7.8c0 .2.1.3.3.3s.3-.1.3-.3V9.6c0-.2-.1-.3-.3-.3zm1.5-1.5c-.1 0-.3.1-.3.3v9c0 .2.1.3.3.3.3 0 .7 0 1-.02.1 0 .2-.1.2-.2v-9c-.3-.05-.7-.08-1.2-.08zm3.2-.2c-.3 0-.6.04-.9.12v9.3c.3.02.6.03.9.03 2.1 0 3.8-1.6 3.8-3.7 0-1.9-1.4-3.5-3.3-3.7-.1-1.2-1.2-2.1-2.5-2.1-.2 0-.4.02-.6.05l-.4.07-.1-.4c-.3-1.6-1.7-2.7-3.4-2.7-.4 0-.8.06-1.1.18v2.7c.3-.1.6-.15 1-.15 1.5 0 2.7 1.1 2.8 2.6l.1.5.5-.1c.3-.06.6-.1.9-.1 1.2 0 2.2.8 2.4 2l.1.5.5-.1c.1 0 .3-.02.4-.02 1.5 0 2.7 1.2 2.7 2.7s-1.2 2.7-2.7 2.7c-.3 0-.6-.05-.8-.13z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Amazon Music Logo (authentic dark/teal badge with Amazon smile & music note)
 */
export const AmazonMusicLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Amazon Music Logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#141B24" />
    <path
      d="M18.8 17.5c-2.3 1.4-5.3 2-8.3 1.7-2.9-.3-5.3-1.4-7-3-.2-.2-.2-.5 0-.7.2-.2.6-.1.8.1 1.5 1.4 3.7 2.4 6.3 2.7 2.7.3 5.4-.3 7.5-1.5.3-.2.6-.1.8.1.1.3.1.6-.1.7zm1.1-.9c-.1-.2-.4-.2-.6-.1-.1.1-.3.2-.5.3-.3.1-.6 0-.8-.2-.2-.3-.1-.6.2-.8.3-.2.6-.3.9-.5.4-.2.8 0 .9.4.1.3.1.6-.1.9z"
      fill="#00A8E1"
    />
    <path
      d="M17.2 6.5c-.2-.1-.5 0-.7.2l-5.3 4.2c-.2.2-.3.4-.3.7v4.6c-.5-.3-1.2-.4-1.9-.4-1.8 0-3.3 1-3.3 2.3 0 1.3 1.5 2.3 3.3 2.3 1.7 0 3.1-.9 3.3-2.1v-6.9l4.5-3.6v3.8c-.5-.3-1.2-.4-1.9-.4-1.8 0-3.3 1-3.3 2.3 0 1.3 1.5 2.3 3.3 2.3 1.7 0 3.1-.9 3.3-2.1V7.1c0-.3-.1-.5-.3-.6z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Deezer Logo (authentic violet/equalizer wave badge)
 */
export const DeezerLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Deezer Logo"
  >
    <rect width="24" height="24" rx="5.5" fill="#A238FF" />
    {/* Equalizer Audio Frequency Bars */}
    <rect x="4.5" y="14" width="2" height="4.5" rx="1" fill="#FFFFFF" />
    <rect x="7.5" y="11" width="2" height="7.5" rx="1" fill="#FFFFFF" />
    <rect x="10.5" y="6.5" width="2" height="12" rx="1" fill="#FFFFFF" />
    <rect x="13.5" y="9" width="2" height="9.5" rx="1" fill="#FFFFFF" />
    <rect x="16.5" y="13" width="2" height="5.5" rx="1" fill="#FFFFFF" />
  </svg>
);

/** JioSaavn's teal logomark, sized to match the existing music service tiles. */
export const JioSaavnLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="JioSaavn Logo">
    <rect width="24" height="24" rx="5.5" fill="#2BC5B4" />
    <path d="M7.2 7.1c1.9-1.5 5.8-1.8 8.5-.2 2 1.2 2.9 3.1 2.9 5.2 0 3.3-2.6 5.8-6 5.8-2.7 0-4.9-1.6-5.7-3.9h3.3c.5.8 1.3 1.2 2.4 1.2 1.7 0 2.8-1.2 2.8-3.1 0-1.8-1.1-3.1-2.8-3.1-.9 0-1.7.4-2.2 1.1H7.1c.4-1.2 1.1-2.2 2.1-2.9Z" fill="#fff" />
  </svg>
);

/**
 * Resolver function to obtain authentic logo component based on service id
 */
export function renderMusicServiceLogo(serviceId: string, size = 22, className = ''): React.ReactNode {
  switch (serviceId.toLowerCase()) {
    case 'spotify':
      return <SpotifyLogo size={size} className={className} />;
    case 'youtube-music':
    case 'youtubemusic':
      return <YouTubeMusicLogo size={size} className={className} />;
    case 'apple-music':
    case 'applemusic':
      return <AppleMusicLogo size={size} className={className} />;
    case 'soundcloud':
      return <SoundCloudLogo size={size} className={className} />;
    case 'amazon-music':
    case 'amazonmusic':
      return <AmazonMusicLogo size={size} className={className} />;
    case 'deezer':
      return <DeezerLogo size={size} className={className} />;
    case 'jiosaavn':
      return <JioSaavnLogo size={size} className={className} />;
    default:
      return <Disc size={size} className={className} />;
  }
}
