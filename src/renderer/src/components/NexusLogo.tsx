import React from 'react';
import { NexusBrowserMode } from '@shared/types';

interface NexusLogoProps {
  mode?: NexusBrowserMode;
  size?: number;
  className?: string;
  title?: string;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  mode = 'default',
  size = 20,
  className = '',
  title = 'NEXUS',
}) => {
  // Mode-adaptive gradient and accent colors
  const gradientConfig = {
    default: {
      id: 'nexus-grad-default',
      ringId: 'nexus-ring-default',
      startColor: '#A78BFA',
      endColor: '#38BDF8',
      ringColor: '#A78BFA',
      ringOpacity: 0.75,
      glow: 'rgba(167, 139, 250, 0.4)',
    },
    balanced: {
      id: 'nexus-grad-balanced',
      ringId: 'nexus-ring-balanced',
      startColor: '#F5C542',
      endColor: '#D4A72C',
      ringColor: '#F5C542',
      ringOpacity: 0.85,
      glow: 'rgba(245, 197, 66, 0.45)',
    },
    performance: {
      id: 'nexus-grad-performance',
      ringId: 'nexus-ring-performance',
      startColor: '#F02D43',
      endColor: '#A9152A',
      ringColor: '#F02D43',
      ringOpacity: 0.85,
      glow: 'rgba(240, 45, 67, 0.45)',
    },
  }[mode] || {
    id: 'nexus-grad-default',
    ringId: 'nexus-ring-default',
    startColor: '#A78BFA',
    endColor: '#38BDF8',
    ringColor: '#A78BFA',
    ringOpacity: 0.75,
    glow: 'rgba(167, 139, 250, 0.4)',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`nexus-logo nexus-logo-${mode} ${className}`}
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <title>{title}</title>
      <defs>
        {/* N Emblem Gradient */}
        <linearGradient
          id={gradientConfig.id}
          x1="5"
          y1="5"
          x2="19"
          y2="19"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={gradientConfig.startColor} />
          <stop offset="100%" stopColor={gradientConfig.endColor} />
        </linearGradient>

        {/* Encircling Ring Gradient */}
        <linearGradient
          id={gradientConfig.ringId}
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={gradientConfig.startColor} stopOpacity={gradientConfig.ringOpacity} />
          <stop offset="50%" stopColor={gradientConfig.endColor} stopOpacity={gradientConfig.ringOpacity * 0.9} />
          <stop offset="100%" stopColor={gradientConfig.startColor} stopOpacity={gradientConfig.ringOpacity * 0.5} />
        </linearGradient>
      </defs>

      {/* Surrounding Ring */}
      <circle
        cx="12"
        cy="12"
        r="10.2"
        fill="none"
        stroke={`url(#${gradientConfig.ringId})`}
        strokeWidth="1.6"
        strokeDasharray="64"
        strokeDashoffset="0"
      />

      {/* Angular N Emblem */}
      <path
        d="M 6.6 17.4 L 6.6 6.6 L 9.2 6.6 L 14.8 14.6 L 14.8 6.6 L 17.4 6.6 L 17.4 17.4 L 14.8 17.4 L 9.2 9.4 L 9.2 17.4 Z"
        fill={`url(#${gradientConfig.id})`}
      />
    </svg>
  );
};
