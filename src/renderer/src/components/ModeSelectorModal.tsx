import React from 'react';
import {
  NexusBrowserMode,
  ModeTelemetry,
  BrowserSettings,
  ModeBehaviorConfig,
} from '@shared/types';
import {
  Compass,
  Sun,
  Zap,
  X,
  Check,
  Cpu,
  Layers,
  HardDrive,
  Flame,
} from 'lucide-react';
import { ModeBehaviorControls } from './ModeBehaviorControls';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: NexusBrowserMode;
  onSelectMode: (mode: NexusBrowserMode) => void;
  telemetry: ModeTelemetry | null;
  settings?: BrowserSettings;
  onUpdateSettings?: (settings: Partial<BrowserSettings>) => void;
  onUpdateModeConfig?: (config: Partial<ModeBehaviorConfig>) => void;
  onRestoreDefaults?: () => void;
  onEnterFocusWorkspace?: () => void;
  onOptimizeMemory: () => Promise<{ freedMemoryMB: number; suspendedCount: number }>;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  telemetry,
  settings,
  onUpdateSettings,
  onUpdateModeConfig,
  onRestoreDefaults,
  onEnterFocusWorkspace,
  onOptimizeMemory,
}) => {
  const [optimizing, setOptimizing] = React.useState(false);
  const [optimizeMessage, setOptimizeMessage] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await onOptimizeMemory();
      setOptimizeMessage(
        res.suspendedCount > 0
          ? `Freed ~${res.freedMemoryMB} MB by suspending ${res.suspendedCount} tab${res.suspendedCount > 1 ? 's' : ''}`
          : 'All background tabs are already optimized!'
      );
      setTimeout(() => setOptimizeMessage(null), 3000);
    } finally {
      setOptimizing(false);
    }
  };

  const modes: Array<{
    id: NexusBrowserMode;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    swatches: string[];
    accentColor: string;
  }> = [
    {
      id: 'default',
      title: 'Default Mode',
      subtitle: 'Standard dark theme',
      description:
        'Standard contrast with fluid animations and balanced resource management.',
      icon: <Compass size={16} style={{ color: '#A78BFA' }} />,
      swatches: ['#0B0D12', '#12151D', '#191D28', '#A78BFA'],
      accentColor: '#A78BFA',
    },
    {
      id: 'balanced',
      title: 'Balanced Mode',
      subtitle: 'Warm dark palette',
      description:
        'Warm gold accents, comfortable dark surfaces, and golden focus rings designed for extended browsing.',
      icon: <Sun size={16} style={{ color: '#F5C542' }} />,
      swatches: ['#090909', '#14120C', '#211B0D', '#F5C542'],
      accentColor: '#F5C542',
    },
    {
      id: 'performance',
      title: 'Performance Mode',
      subtitle: 'Low-latency profile',
      description:
        'High-contrast crimson and deep carbon surfaces. Zero UI transition latency (0.01ms), aggressive idle tab suspension, and memory recovery.',
      icon: <Zap size={16} style={{ color: '#F02D43' }} />,
      swatches: ['#080809', '#121214', '#1C1719', '#F02D43'],
      accentColor: '#F02D43',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Cpu size={16} className="text-accent" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Browser Modes
            </h3>
          </div>
          <button className="nexus-icon-btn" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Switch instantly between browser modes. Your tabs, history, and active sessions are preserved without restarting.
          </p>

          <div className="mode-cards-container">
            {modes.map((m) => {
              const isActive = currentMode === m.id;
              return (
                <div
                  key={m.id}
                  className={`mode-card ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectMode(m.id)}
                  style={{
                    borderColor: isActive ? m.accentColor : undefined,
                  }}
                >
                  <div className="mode-card-header">
                    <div className="mode-card-title-group">
                      <div
                        className="mode-icon-box"
                        style={{
                          background: `${m.accentColor}18`,
                          border: `1px solid ${m.accentColor}33`,
                        }}
                      >
                        {m.icon}
                      </div>
                      <div>
                        <span className="mode-card-title">{m.title}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginLeft: '8px',
                          }}
                        >
                          {m.subtitle}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <span
                        className="mode-active-pill"
                        style={{
                          background: m.accentColor,
                          color: '#0B0D12',
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>

                  <p className="mode-card-desc">{m.description}</p>

                  {/* Swatches preview */}
                  <div className="mode-palette-preview">
                    {m.swatches.map((color, idx) => (
                      <div
                        key={idx}
                        className="mode-palette-swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mode Behavior Controls & Telemetry */}
          {settings && onUpdateSettings && (
            <ModeBehaviorControls
              currentMode={currentMode}
              settings={settings}
              telemetry={telemetry}
              onUpdateSettings={onUpdateSettings}
              onUpdateModeConfig={onUpdateModeConfig}
              onRestoreDefaults={onRestoreDefaults}
              onEnterFocusWorkspace={onEnterFocusWorkspace}
              onOptimizeMemory={onOptimizeMemory}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="nexus-btn-sm nexus-btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
