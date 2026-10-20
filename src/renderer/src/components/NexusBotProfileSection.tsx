import React from 'react';
import { NexusBrowserMode } from '@shared/types';
import { Sparkles, Compass, Sun, Zap, ChevronRight } from 'lucide-react';
import { NexusBotAvatar } from './NexusBotAvatar';
import {
  getNexusModeLabel,
  getNexusModeAccent,
  getNexusModeSubtitle,
} from '../assets/nexusBotAssets';

export interface NexusBotProfileSectionProps {
  mode?: NexusBrowserMode;
  onSelectMode?: (mode: NexusBrowserMode) => void;
  onOpenModeModal?: () => void;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const NexusBotProfileSection: React.FC<NexusBotProfileSectionProps> = ({
  mode = 'default',
  onSelectMode,
  onOpenModeModal,
  compact = false,
  className = '',
  style,
}) => {
  const activeMode: NexusBrowserMode = mode || 'default';
  const modeLabel = getNexusModeLabel(activeMode);
  const accentColor = getNexusModeAccent(activeMode);
  const modeSubtitle = getNexusModeSubtitle(activeMode);

  const getModeIcon = (m: NexusBrowserMode) => {
    switch (m) {
      case 'performance':
        return <Zap size={11} strokeWidth={2.5} style={{ color: accentColor }} />;
      case 'balanced':
        return <Sun size={11} strokeWidth={2.5} style={{ color: accentColor }} />;
      case 'default':
      default:
        return <Compass size={11} strokeWidth={2.5} style={{ color: accentColor }} />;
    }
  };

  const cycleMode = () => {
    if (!onSelectMode) return;
    if (activeMode === 'default') onSelectMode('balanced');
    else if (activeMode === 'balanced') onSelectMode('performance');
    else onSelectMode('default');
  };

  return (
    <div
      className={`nexus-bot-profile-card nexus-bot-profile-${activeMode} ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: compact ? '10px 12px' : '12px 14px',
        background: 'var(--nexus-bg-surface, #12151D)',
        border: '1px solid var(--nexus-border-subtle, #1C202C)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 'var(--nexus-radius-md, 8px)',
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        boxShadow: `0 4px 16px -4px ${accentColor}12`,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {/* Top Row: Avatar + Title & Subtitle */}
      <div
        className="nexus-bot-profile-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          minWidth: 0,
        }}
      >
        <NexusBotAvatar
          mode={activeMode}
          size={compact ? 42 : 52}
          showGlow={true}
          bordered={true}
        />

        <div
          className="nexus-bot-profile-info"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            gap: '2px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              width: '100%',
            }}
          >
            <div
              className="nexus-bot-profile-title"
              style={{
                fontSize: compact ? '13px' : '14px',
                fontWeight: 650,
                color: 'var(--nexus-text-primary, #F4F4F5)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>NEXUS Bot</span>
              <Sparkles size={11} style={{ color: accentColor }} />
            </div>

            {/* Mode switch helper / button if callback available */}
            {onSelectMode && (
              <button
                type="button"
                className="nexus-bot-cycle-btn"
                onClick={cycleMode}
                title="Switch to next browser mode (Default -> Balanced -> Performance)"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--nexus-border-subtle, #1C202C)',
                  borderRadius: '4px',
                  color: 'var(--nexus-text-secondary, #9298A8)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  lineHeight: 1.2,
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}
              >
                <span>Cycle</span>
                <ChevronRight size={10} />
              </button>
            )}
          </div>

          <span
            className="nexus-bot-profile-subtitle"
            style={{
              fontSize: '11px',
              color: 'var(--nexus-text-secondary, #9298A8)',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Your browsing companion
          </span>
        </div>
      </div>

      {/* Mode Status Pill & Ambient Lighting Indicator */}
      <div
        className="nexus-bot-mode-pill-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
          minWidth: 0,
          paddingTop: '6px',
          borderTop: '1px solid var(--nexus-border-subtle, #1C202C)',
        }}
      >
        <div
          className="nexus-bot-mode-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '12px',
            backgroundColor: `${accentColor}14`,
            border: `1px solid ${accentColor}33`,
            color: accentColor,
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {getModeIcon(activeMode)}
          <span>{modeLabel}</span>
        </div>

        <span
          className="nexus-bot-mode-desc-text"
          style={{
            fontSize: '10.5px',
            color: 'var(--nexus-text-muted, #5A6072)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'right',
            flex: 1,
            minWidth: 0,
          }}
          title={modeSubtitle}
        >
          {activeMode === 'default'
            ? 'Everyday Web'
            : activeMode === 'balanced'
            ? 'Productivity'
            : 'Speed & Optimization'}
        </span>
      </div>
    </div>
  );
};
