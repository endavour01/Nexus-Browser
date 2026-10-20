import React from 'react';
import { NexusBrowserMode } from '@shared/types';
import { getNexusBotImage, getNexusModeAccent } from '../assets/nexusBotAssets';

export interface NexusBotAvatarProps {
  mode?: NexusBrowserMode;
  size?: number;
  className?: string;
  showGlow?: boolean;
  bordered?: boolean;
  title?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export const NexusBotAvatar: React.FC<NexusBotAvatarProps> = ({
  mode = 'default',
  size = 40,
  className = '',
  showGlow = false,
  bordered = false,
  title,
  alt = 'NEXUS Bot avatar',
  style,
}) => {
  const imgSrc = getNexusBotImage(mode);
  const accentColor = getNexusModeAccent(mode);
  const activeTitle = title || `NEXUS Bot (${mode} mode)`;

  return (
    <span
      className={`nexus-bot-avatar-wrapper nexus-bot-avatar-${mode} ${className}`}
      title={activeTitle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: size >= 48 ? '14px' : size >= 32 ? '10px' : '6px',
        backgroundColor: bordered ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
        border: bordered ? `1px solid ${accentColor}33` : 'none',
        boxShadow: showGlow ? `0 0 ${Math.round(size / 3)}px ${accentColor}25` : undefined,
        lineHeight: 0,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <img
        src={imgSrc}
        alt={alt}
        width={size}
        height={size}
        className="nexus-bot-avatar-img"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          filter: showGlow ? `drop-shadow(0 2px 6px ${accentColor}30)` : undefined,
        }}
      />
    </span>
  );
};
