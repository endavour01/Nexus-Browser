import React from 'react';
import { TabState, NexusBrowserMode, ModeTelemetry } from '@shared/types';
import {
  Lock,
  Globe,
  Terminal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code2,
  Loader2,
  Layers,
  Compass,
  Sun,
  Zap,
} from 'lucide-react';

interface StatusBarProps {
  activeTab: TabState | null;
  activeWorkspaceName: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleDevTools: () => void;
  hoveredUrl: string | null;
  currentMode?: NexusBrowserMode;
  telemetry?: ModeTelemetry | null;
  onToggleModeSelector?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeTab,
  activeWorkspaceName,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleDevTools,
  hoveredUrl,
  currentMode = 'default',
  telemetry,
  onToggleModeSelector,
}) => {
  const isHttps = activeTab?.url.startsWith('https://');
  const isNexus = activeTab?.url.startsWith('nexus://') || !activeTab?.url;
  const zoomPercent = Math.round((zoomLevel + 1) * 100);

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
                <span>NEXUS Internal Engine</span>
              </>
            ) : isHttps ? (
              <>
                <Lock size={12} className="text-green" />
                <span>TLS 1.3 / Secure Connection</span>
              </>
            ) : (
              <>
                <Globe size={12} className="text-amber" />
                <span>Insecure Connection</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Workspace & Zoom Controls */}
      <div className="statusbar-center">
        <div className="statusbar-workspace-pill">
          <Layers size={11} className="text-accent" />
          <span>Space: {activeWorkspaceName}</span>
        </div>

        {/* Mode Pill */}
        <div
          className={`statusbar-mode-pill active-${currentMode || 'default'}`}
          onClick={onToggleModeSelector}
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

        <div className="statusbar-zoom-controls">
          <button
            className="statusbar-zoom-btn"
            onClick={onZoomOut}
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut size={12} />
          </button>
          <button
            className="statusbar-zoom-label"
            onClick={onResetZoom}
            title="Reset Zoom (Ctrl+0)"
          >
            <span>{zoomPercent}%</span>
            {zoomPercent !== 100 && <RotateCcw size={10} className="ml-1" />}
          </button>
          <button
            className="statusbar-zoom-btn"
            onClick={onZoomIn}
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn size={12} />
          </button>
        </div>
      </div>

      {/* Right: DevTools & Status */}
      <div className="statusbar-right">
        {activeTab?.isLoading && (
          <div className="statusbar-loading">
            <Loader2 size={12} className="animate-spin text-accent" />
            <span>Loading document...</span>
          </div>
        )}

        <button
          className="statusbar-btn devtools-trigger"
          onClick={onToggleDevTools}
          title="Toggle Chromium DevTools (Ctrl+Shift+I)"
        >
          <Code2 size={12} />
          <span>DevTools</span>
        </button>
      </div>
    </footer>
  );
};
