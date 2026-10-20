import React, { useState, useEffect, useRef } from 'react';
import { TabGroup, TAB_GROUP_COLORS } from '@shared/types';
import { Plus, Layers, X, Trash2 } from 'lucide-react';

export interface TabGroupPopoverProps {
  group: TabGroup;
  tabCount: number;
  anchorRect?: { top: number; left: number; bottom: number; right: number; width?: number; height?: number } | null;
  onUpdateGroup: (groupId: string, updates: { name?: string; color?: string }) => void;
  onNewTabInGroup: (groupId: string) => void;
  onUngroup: (groupId: string) => void;
  onCloseGroup: (groupId: string) => void;
  onClose: () => void;
}

const PRESET_NAMES = ['Work', 'Study', 'Personal', 'Entertainment'] as const;

export const TabGroupPopover: React.FC<TabGroupPopoverProps> = ({
  group,
  tabCount,
  anchorRect,
  onUpdateGroup,
  onNewTabInGroup,
  onUngroup,
  onCloseGroup,
  onClose,
}) => {
  const [name, setName] = useState(group.name);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(group.name);
  }, [group.name]);

  useEffect(() => {
    // Focus and select input on mount
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Dismiss on click outside or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNameBlur();
        onClose();
      }
    };

    const handlePointerDownOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handlePointerDownOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handlePointerDownOutside);
    };
  }, [name, group.id]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = e.target.value;
    setName(nextName);
    onUpdateGroup(group.id, { name: nextName.trim() || 'New group' });
  };

  const handleNameBlur = () => {
    const finalName = name.trim() || 'New group';
    setName(finalName);
    onUpdateGroup(group.id, { name: finalName });
  };

  const handlePresetClick = (preset: string) => {
    setName(preset);
    onUpdateGroup(group.id, { name: preset });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleColorSelect = (colorValue: string) => {
    onUpdateGroup(group.id, { color: colorValue });
  };

  // Compute position relative to anchorRect
  const popoverWidth = 260;
  const popoverHeight = 280;
  let top = 44;
  let left = 120;

  if (anchorRect) {
    top = (anchorRect.bottom || anchorRect.top + 26) + 4;
    left = Math.max(10, Math.min(anchorRect.left, window.innerWidth - popoverWidth - 16));
    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(10, (anchorRect.top || 44) - popoverHeight - 4);
    }
  }

  return (
    <div
      ref={popoverRef}
      className="nexus-group-popover no-drag"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
      }}
      role="dialog"
      aria-label="Edit Tab Group"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header / Name Input */}
      <div className="group-popover-header">
        <input
          ref={inputRef}
          type="text"
          className="group-popover-input"
          placeholder="Group name"
          value={name}
          maxLength={32}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          aria-label="Tab group name"
        />
      </div>

      {/* Preset Chips */}
      <div className="group-popover-presets">
        {PRESET_NAMES.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`group-preset-chip ${name === preset ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Color Swatches (8 Chrome Colors) */}
      <div className="group-popover-colors" role="radiogroup" aria-label="Group color">
        {TAB_GROUP_COLORS.map((c) => {
          const isSelected = group.color.toLowerCase() === c.value.toLowerCase();
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={c.name}
              title={c.name}
              className={`group-color-swatch ${isSelected ? 'selected' : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => handleColorSelect(c.value)}
            />
          );
        })}
      </div>

      <div className="group-popover-divider" />

      {/* Action Options */}
      <div className="group-popover-actions">
        <button
          type="button"
          className="group-action-row"
          onClick={() => {
            onNewTabInGroup(group.id);
            onClose();
          }}
        >
          <Plus size={13} />
          <span>New tab in group</span>
        </button>

        <button
          type="button"
          className="group-action-row"
          onClick={() => {
            onUngroup(group.id);
            onClose();
          }}
        >
          <Layers size={13} />
          <span>Ungroup tabs</span>
        </button>

        <button
          type="button"
          className="group-action-row item-danger"
          onClick={() => {
            onCloseGroup(group.id);
            onClose();
          }}
        >
          <X size={13} />
          <span>Close group ({tabCount})</span>
        </button>
      </div>
    </div>
  );
};
