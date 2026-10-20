import React from 'react';
import { TabGroup } from '@shared/types';
import { ChevronDown, ChevronRight, Layers, Pencil, Trash2, X, Plus } from 'lucide-react';

interface TabGroupContextMenuProps {
  group: TabGroup;
  tabCount: number;
  x: number;
  y: number;
  onEdit: (groupId: string, anchorRect?: { top: number; left: number; bottom: number; right: number }) => void;
  onToggleCollapse: (groupId: string) => void;
  onNewTabInGroup?: (groupId: string) => void;
  onUngroup: (groupId?: string) => void;
  onDelete: (groupId: string) => void;
  onCloseGroup: (groupId: string) => void;
  onDismiss: () => void;
}

export const TabGroupContextMenu: React.FC<TabGroupContextMenuProps> = ({
  group,
  tabCount,
  x,
  y,
  onEdit,
  onToggleCollapse,
  onNewTabInGroup,
  onUngroup,
  onDelete,
  onCloseGroup,
  onDismiss,
}) => {
  const run = (action: () => void) => {
    action();
    onDismiss();
  };

  return (
    <div
      className="tab-context-menu tab-group-context-menu no-drag"
      style={{
        position: 'fixed',
        top: Math.min(y, window.innerHeight - 280),
        left: Math.min(x, window.innerWidth - 220),
        zIndex: 9999,
      }}
      onClick={(event) => event.stopPropagation()}
      role="menu"
      aria-label={`${group.name} group actions`}
    >
      <button
        className="context-menu-item"
        role="menuitem"
        onClick={() => run(() => onEdit(group.id, { top: y, bottom: y + 24, left: x, right: x + 100 }))}
      >
        <Pencil size={13} />
        <span>Rename or change color</span>
      </button>

      {onNewTabInGroup && (
        <button
          className="context-menu-item"
          role="menuitem"
          onClick={() => run(() => onNewTabInGroup(group.id))}
        >
          <Plus size={13} />
          <span>New tab in group</span>
        </button>
      )}

      <button
        className="context-menu-item"
        role="menuitem"
        onClick={() => run(() => onToggleCollapse(group.id))}
      >
        {group.collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        <span>{group.collapsed ? 'Expand group' : 'Collapse group'}</span>
      </button>

      <div className="context-menu-divider" />

      <button
        className="context-menu-item"
        role="menuitem"
        onClick={() => run(() => onUngroup(group.id))}
      >
        <Layers size={13} />
        <span>Ungroup tabs</span>
      </button>

      <button
        className="context-menu-item item-danger"
        role="menuitem"
        disabled={tabCount === 0}
        onClick={() => run(() => onCloseGroup(group.id))}
      >
        <X size={13} />
        <span>Close group ({tabCount})</span>
      </button>
    </div>
  );
};