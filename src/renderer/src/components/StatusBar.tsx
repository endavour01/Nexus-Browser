import React from 'react';
import { TabState, NexusBrowserMode, ModeTelemetry } from '@shared/types';
import {
  Lock,
  Globe,
  Terminal,
  Loader2,
  Layers,
  Compass,
  Sun,
  Zap,
} from 'lucide-react';

interface StatusBarProps {
  activeTab: TabState | null;
  activeWorkspaceName: string;
  hoveredUrl: string | null;
  currentMode?: NexusBrowserMode;
  telemetry?: ModeTelemetry | null;
  onToggleModeSelector?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeTab,
  activeWorkspaceName,
  hoveredUrl,
  currentMode = 'default',
  telemetry,
  onToggleModeSelector,
}) => {
  const isHttps = activeTab?.url.startsWith('https://');
  const isNexus = activeTab?.url.startsWith('nexus://') || !activeTab?.url;

  return (
    <footer className="nexus-statusbar">
      {/* Left: Security and Link Preview */}
      <div className="statusbar-left">
        {hoveredUrl ? (
          <span className="statusbar-hover-link">{hoveredUrl}</span>
        ) : (
          <div className="statusbar-security-indicator">
            {isNexus ? (
              <>
                <Terminal size={12} className="text-accent" />
                <span>NEXUS page</span>
              </>
            ) : isHttps ? (
              <>
                <Lock size={12} className="text-green" />
                <span>Secure connection</span>
              </>
            ) : (
              <>
                <Globe size={12} className="text-amber" />
                <span>Connection not secure</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Workspace & Browser Mode */}
      <div className="statusbar-center">
        <div className="statusbar-workspace-pill">
          <Layers size={11} className="text-accent" />
          <span>Space: {activeWorkspaceName}</span>
        </div>

        {/* Mode Pill */}
        <div
          className={`statusbar-mode-pill active-${currentMode || 'default'}`}
          onClick={onToggleModeSelector}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggleModeSelector?.();
            }
          }}
          title={`Active Mode: ${currentMode === 'performance' ? 'Performance' : currentMode === 'balanced' ? 'Balanced' : 'Default'}. Click to switch mode or view telemetry.`}
        >
          {currentMode === 'performance' ? (
            <Zap size={11} className="text-[#EF4444]" />
          ) : currentMode === 'balanced' ? (
            <Sun size={11} className="text-[#EAB308]" />
          ) : (
            <Compass size={11} className="text-[#A78BFA]" />
          )}
          <span>
            {currentMode === 'performance'
              ? `Performance${telemetry?.suspendedTabsCount ? ` (${telemetry.suspendedTabsCount} suspended)` : ''}`
              : currentMode === 'balanced'
              ? 'Balanced'
              : 'Default'}
          </span>
        </div>

      </div>

      {/* Right: Status */}
      <div className="statusbar-right">
        {activeTab?.isLoading && (
          <div className="statusbar-loading">
            <Loader2 size={12} className="animate-spin text-accent" />
            <span>Loading document...</span>
          </div>
        )}

      </div>
    </footer>
  );
};
