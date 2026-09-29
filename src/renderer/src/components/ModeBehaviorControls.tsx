import React from 'react';
import {
  NexusBrowserMode,
  ModeTelemetry,
  BrowserSettings,
  ModeBehaviorConfig,
} from '@shared/types';
import {
  Zap,
  Flame,
  Target,
  Shield,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sliders,
  EyeOff,
  Sparkles,
  Info,
} from 'lucide-react';

interface ModeBehaviorControlsProps {
  currentMode: NexusBrowserMode;
  settings: BrowserSettings;
  telemetry: ModeTelemetry | null;
  onUpdateSettings: (settings: Partial<BrowserSettings>) => void;
  onUpdateModeConfig?: (config: Partial<ModeBehaviorConfig>) => void;
  onRestoreDefaults?: () => void;
  onEnterFocusWorkspace?: () => void;
  onOptimizeMemory?: () => Promise<{ freedMemoryMB: number; suspendedCount: number }>;
}

export const ModeBehaviorControls: React.FC<ModeBehaviorControlsProps> = ({
  currentMode,
  settings,
  telemetry,
  onUpdateSettings,
  onUpdateModeConfig,
  onRestoreDefaults,
  onEnterFocusWorkspace,
  onOptimizeMemory,
}) => {
  const [optimizing, setOptimizing] = React.useState(false);
  const [optimizeMessage, setOptimizeMessage] = React.useState<string | null>(null);

  const handleOptimize = async () => {
    if (!onOptimizeMemory) return;
    setOptimizing(true);
    try {
      const res = await onOptimizeMemory();
      setOptimizeMessage(
        res.suspendedCount > 0
          ? `Freed ~${res.freedMemoryMB} MB by suspending ${res.suspendedCount} tab${
              res.suspendedCount > 1 ? 's' : ''
            }`
          : 'All eligible tabs are already optimized!'
      );
      setTimeout(() => setOptimizeMessage(null), 3500);
    } finally {
      setOptimizing(false);
    }
  };

  const handleTimeoutChange = (ms: number) => {
    onUpdateSettings({ performanceTabDiscardTimeout: ms });
    onUpdateModeConfig?.({
      tabInactivityThresholdMs: ms,
      autoSuspendEnabled: ms > 0,
    });
  };

  const handleToggleAutoSuspend = (enabled: boolean) => {
    onUpdateSettings({ performanceAutoSuspend: enabled });
    onUpdateModeConfig?.({ autoSuspendEnabled: enabled });
  };

  const handleToggleThrottling = (enabled: boolean) => {
    onUpdateSettings({ performanceBackgroundThrottling: enabled });
    onUpdateModeConfig?.({ backgroundThrottlingEnabled: enabled });
  };

  const handleToggleSuspendPinned = (enabled: boolean) => {
    onUpdateSettings({ performanceSuspendPinned: enabled });
    onUpdateModeConfig?.({ suspendPinnedTabs: enabled });
  };

  const handleToggleLightweightUI = (enabled: boolean) => {
    onUpdateSettings({ performanceLightweightUI: enabled });
    onUpdateModeConfig?.({ lightweightUIEnabled: enabled });
  };

  const handleToggleDistractionReduction = (enabled: boolean) => {
    onUpdateSettings({ balancedDistractionReduction: enabled });
    onUpdateModeConfig?.({ distractionReductionEnabled: enabled });
  };

  const handleToggleMinimalToolbar = (enabled: boolean) => {
    onUpdateSettings({ balancedMinimalToolbar: enabled });
    onUpdateModeConfig?.({ minimalToolbarEnabled: enabled });
  };

  return (
    <div className="mode-behavior-section">
      {/* ---------------- BALANCED MODE CONTROLS ---------------- */}
      {currentMode === 'balanced' && (
        <>
          <div className="mode-behavior-title">
            <Sparkles size={13} style={{ color: '#F5C542' }} />
            <span>Focus & Productivity Settings</span>
          </div>

          <div className="mode-control-row">
            <div className="mode-control-label">
              <span>Distraction Reduction</span>
              <span className="mode-control-sublabel">
                Minimizes UI clutter and suppresses nonessential badge counters
              </span>
            </div>
            <input
              type="checkbox"
              className="nexus-checkbox"
              checked={!!settings.balancedDistractionReduction}
              onChange={(e) => handleToggleDistractionReduction(e.target.checked)}
              aria-label="Distraction Reduction"
            />
          </div>

          <div className="mode-control-row">
            <div className="mode-control-label">
              <span>Minimal Focus Toolbar</span>
              <span className="mode-control-sublabel">
                Hides secondary buttons to keep the workspace clean
              </span>
            </div>
            <input
              type="checkbox"
              className="nexus-checkbox"
              checked={!!settings.balancedMinimalToolbar}
              onChange={(e) => handleToggleMinimalToolbar(e.target.checked)}
              aria-label="Minimal Focus Toolbar"
            />
          </div>

          {onEnterFocusWorkspace && (
            <button
              className="hud-optimize-btn"
              style={{
                background: 'linear-gradient(135deg, #F5C542, #D4A72C)',
                color: '#0C0B08',
                marginTop: '4px',
              }}
              onClick={onEnterFocusWorkspace}
            >
              <Target size={13} />
              <span>Launch Focus Workspace</span>
            </button>
          )}
        </>
      )}

      {/* ---------------- PERFORMANCE MODE CONTROLS ---------------- */}
      {currentMode === 'performance' && (
        <>
          <div className="mode-behavior-title">
            <Flame size={13} style={{ color: '#F02D43' }} />
            <span>Resource Efficiency Controls</span>
          </div>

          <div className="mode-control-row">
            <div className="mode-control-label">
              <span>Idle Tab Suspension</span>
              <span className="mode-control-sublabel">
                Unloads background renderer memory after inactivity
              </span>
            </div>
            <select
              className="mode-select"
              value={settings.performanceTabDiscardTimeout ?? 180000}
              onChange={(e) => handleTimeoutChange(Number(e.target.value))}
              aria-label="Inactivity Timeout"
            >
              <option value={60000}>After 1 minute</option>
              <option value={180000}>After 3 minutes (recommended)</option>
              <option value={300000}>After 5 minutes</option>
              <option value={900000}>After 15 minutes</option>
              <option value={1800000}>After 30 minutes</option>
              <option value={0}>Disabled</option>
            </select>
          </div>

          <div className="mode-control-row">
            <div className="mode-control-label">
              <span>Background Tab Throttling</span>
              <span className="mode-control-sublabel">
                Limits background Chromium timers and animation frames
              </span>
            </div>
            <input
              type="checkbox"
              className="nexus-checkbox"
              checked={settings.performanceBackgroundThrottling !== false}
              onChange={(e) => handleToggleThrottling(e.target.checked)}
              aria-label="Background Throttling"
            />
          </div>

          <div className="mode-control-row">
            <div className="mode-control-label">
              <span>Lightweight Interface</span>
              <span className="mode-control-sublabel">
                Bypasses GPU backdrop filters, blurs, and shadows
              </span>
            </div>
            <input
              type="checkbox"
              className="nexus-checkbox"
              checked={settings.performanceLightweightUI !== false}
              onChange={(e) => handleToggleLightweightUI(e.target.checked)}
              aria-label="Lightweight Interface"
            />
          </div>

          <div className="mode-control-row">
            <div className="mode-control-label">
              <span>Protect Pinned Tabs</span>
              <span className="mode-control-sublabel">
                Exclude pinned tabs from automatic memory suspension
              </span>
            </div>
            <input
              type="checkbox"
              className="nexus-checkbox"
              checked={!settings.performanceSuspendPinned}
              onChange={(e) => handleToggleSuspendPinned(!e.target.checked)}
              aria-label="Protect Pinned Tabs"
            />
          </div>

          {/* Active Safeguards Banner */}
          <div
            style={{
              padding: '6px 8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--status-green)' }} />
              <span>Playing audio & video are never suspended</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--status-green)' }} />
              <span>Active downloads & network tasks are preserved</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--status-green)' }} />
              <span>Foreground active tab is always responsive</span>
            </div>
          </div>

          {onOptimizeMemory && (
            <button
              className="hud-optimize-btn"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              <Zap size={13} />
              <span>{optimizing ? 'Reclaiming Memory...' : 'Suspend Inactive Tabs Now'}</span>
            </button>
          )}

          {optimizeMessage && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginTop: '2px',
              }}
            >
              {optimizeMessage}
            </div>
          )}
        </>
      )}

      {/* ---------------- TELEMETRY HUD ---------------- */}
      {telemetry && (
        <div className="performance-hud-card" style={{ marginTop: '4px' }}>
          <div className="hud-header">
            <span className="hud-title">
              <Info size={12} />
              <span>Engine Metrics & Telemetry</span>
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Mode: <strong style={{ color: 'var(--text-primary)' }}>{currentMode}</strong>
            </span>
          </div>

          <div className="hud-metrics-row">
            <div className="hud-metric">
              <div className="hud-metric-val">{telemetry.memoryUsageMB} MB</div>
              <div className="hud-metric-label">
                RSS <span className="metric-tag-measured">MEASURED</span>
              </div>
            </div>
            <div className="hud-metric">
              <div className="hud-metric-val">
                {telemetry.activeTabsCount || (telemetry.totalTabsCount - telemetry.suspendedTabsCount)} /{' '}
                {telemetry.totalTabsCount}
              </div>
              <div className="hud-metric-label">
                Active Tabs <span className="metric-tag-measured">MEASURED</span>
              </div>
            </div>
            <div className="hud-metric">
              <div className="hud-metric-val text-emerald-400">
                ~{telemetry.estimatedMemorySavedMB} MB
              </div>
              <div className="hud-metric-label">
                Savings <span className="metric-tag-estimated">ESTIMATED</span>
              </div>
            </div>
          </div>

          {telemetry.heapUsedMB > 0 && (
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginBottom: '4px',
              }}
            >
              Heap Allocation: {telemetry.heapUsedMB} MB
              {telemetry.heapTotalMB ? ` of ${telemetry.heapTotalMB} MB` : ''}{' '}
              <span className="metric-tag-measured">MEASURED</span>
            </div>
          )}
        </div>
      )}

      {/* ---------------- RESTORE DEFAULTS OPTION ---------------- */}
      {onRestoreDefaults && (
        <button
          className="mode-restore-btn"
          onClick={onRestoreDefaults}
          title="Reset all mode configurations to standard defaults"
        >
          <RotateCcw size={12} />
          <span>Restore Standard Behavior</span>
        </button>
      )}
    </div>
  );
};
