import React, { useEffect, useRef, useState } from 'react';
import { NexusBrowserMode } from '@shared/types';
import { Compass, Sun, Zap, Check, Sliders, X } from 'lucide-react';

interface ModePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: NexusBrowserMode;
  onSelectMode: (mode: NexusBrowserMode) => void;
  onOpenSettings?: () => void;
}

interface ModeOption {
  id: NexusBrowserMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  palette: string[];
}

const ModePopoverComponent: React.FC<ModePopoverProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  onOpenSettings,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const modes: ModeOption[] = [
    {
      id: 'default',
      name: 'Default Mode',
      description: 'Balanced contrast, fluid animations, and standard multitasking.',
      icon: <Compass size={17} style={{ color: '#A78BFA' }} />,
      accentColor: '#A78BFA',
      palette: ['#0B0D12', '#12151D', '#191D28', '#A78BFA'],
    },
    {
      id: 'balanced',
      name: 'Balanced Mode',
      description: 'Warm ambient contrast, reduced eye strain, and focus enhancements.',
      icon: <Sun size={17} style={{ color: '#F5C542' }} />,
      accentColor: '#F5C542',
      palette: ['#090909', '#14120C', '#211B0D', '#F5C542'],
    },
    {
      id: 'performance',
      name: 'Performance Mode',
      description: 'Low-latency UI, background tab throttling, and memory optimization.',
      icon: <Zap size={17} style={{ color: '#F02D43' }} />,
      accentColor: '#F02D43',
      palette: ['#080809', '#121214', '#1C1719', '#F02D43'],
    },
  ];

  // Track focused card index for keyboard navigation
  const currentIndex = modes.findIndex((m) => m.id === currentMode);
  const [focusedIndex, setFocusedIndex] = useState<number>(currentIndex >= 0 ? currentIndex : 0);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = (prev + 1) % modes.length;
          cardRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = (prev - 1 + modes.length) % modes.length;
          cardRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
        cardRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const last = modes.length - 1;
        setFocusedIndex(last);
        cardRefs.current[last]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetMode = modes[focusedIndex]?.id;
        if (targetMode) {
          onSelectMode(targetMode);
          onClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Use mousedown with timeout so the initial button click doesn't instantly dismiss
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timeoutId);
    };
  }, [isOpen, focusedIndex, modes, onClose, onSelectMode]);

  // Focus active card initially when opened
  useEffect(() => {
    if (isOpen) {
      const idx = modes.findIndex((m) => m.id === currentMode);
      const targetIdx = idx >= 0 ? idx : 0;
      setFocusedIndex(targetIdx);
      setTimeout(() => {
        cardRefs.current[targetIdx]?.focus();
      }, 50);
    }
  }, [isOpen, currentMode]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="mode-popover"
      role="dialog"
      aria-label="Browser Mode Switcher"
      aria-modal="false"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Header */}
      <div className="mode-popover-header">
        <div className="mode-popover-title-group">
          <span className="mode-popover-title">Browser Mode</span>
          <span className="mode-popover-subtitle">Active visual & performance profile</span>
        </div>
        <button
          className="nexus-icon-btn mode-popover-close-btn"
          onClick={onClose}
          title="Close switcher (Esc)"
          aria-label="Close mode switcher"
        >
          <X size={14} />
        </button>
      </div>

      {/* Popover Mode Cards (Radiogroup) */}
      <div
        className="mode-popover-list"
        role="radiogroup"
        aria-label="NEXUS Modes"
      >
        {modes.map((m, idx) => {
          const isActive = currentMode === m.id;
          return (
            <div
              key={m.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              tabIndex={0}
              role="radio"
              aria-checked={isActive}
              aria-label={`${m.name}: ${m.description}`}
              className={`mode-popover-card mode-card-${m.id} ${isActive ? 'active' : ''}`}
              onClick={() => {
                onSelectMode(m.id);
                onClose();
              }}
            >
              {/* Card Header */}
              <div className="mode-popover-card-header">
                <div className="mode-popover-card-title-group">
                  <div
                    className="mode-popover-icon-box"
                    style={{
                      background: `${m.accentColor}18`,
                      borderColor: `${m.accentColor}33`,
                    }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <div className="mode-popover-card-name">{m.name}</div>
                  </div>
                </div>

                {isActive ? (
                  <span
                    className="mode-popover-active-badge"
                    style={{
                      backgroundColor: m.accentColor,
                      color: m.id === 'default' ? '#0B0D12' : m.id === 'balanced' ? '#0C0B08' : '#FFFFFF',
                    }}
                  >
                    <Check size={11} strokeWidth={2.5} />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="mode-popover-select-hint">Select</span>
                )}
              </div>

              {/* Card Description */}
              <p className="mode-popover-card-desc">{m.description}</p>

              {/* Miniature Color Swatches Preview */}
              <div className="mode-popover-palette" aria-hidden="true">
                {m.palette.map((color, i) => (
                  <div
                    key={i}
                    className="mode-popover-swatch"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popover Footer */}
      {onOpenSettings && (
        <div className="mode-popover-footer">
          <button
            type="button"
            className="mode-popover-settings-btn"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
          >
            <Sliders size={13} />
            <span>More Mode Settings & Telemetry</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const ModePopover = React.memo<ModePopoverProps>(ModePopoverComponent);
