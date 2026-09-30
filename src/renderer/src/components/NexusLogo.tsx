import React from 'react';
import { NexusBrowserMode } from '@shared/types';
import { NEXUS_MODE_LOGOS } from '../assets/logoAssets';

interface NexusLogoProps {
  mode?: NexusBrowserMode;
  size?: number;
  className?: string;
  title?: string;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  mode = 'default',
  size = 24,
  className = '',
  title = 'NEXUS Home',
}) => {
  const logoSrc = NEXUS_MODE_LOGOS[mode] || NEXUS_MODE_LOGOS.default;

  return (
    <span
      className={`nexus-logo-wrapper nexus-logo-${mode} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <img
        src={logoSrc}
        alt={title}
        width={size}
        height={size}
        className="nexus-brand-emblem-img"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
};
