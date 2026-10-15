import React from 'react';
import { TabGroup } from '@shared/types';
import { ChevronDown, ChevronRight, Layers, Pencil, Trash2, X } from 'lucide-react';

interface TabGroupContextMenuProps {
  group: TabGroup;
  tabCount: number;
  x: number;
  y: number;
  onEdit: (groupId: string) => void;
  onToggleCollapse: (groupId: string) => void;
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
      className="tab-context-menu tab-group-context-menu"
      style={{ top: Math.min(y, window.innerHeight - 260), left: Math.min(x, window.innerWidth - 220) }}
      onClick={(event) => event.stopPropagation()}
      role="menu"
      aria-label={`${group.name} group actions`}
    >
      <button className="context-menu-item" role="menuitem" onClick={() => run(() => onEdit(group.id))}>
        <Pencil size={13} /><span>Rename or change color</span>
      </button>
      <button className="context-menu-item" role="menuitem" onClick={() => run(() => onToggleCollapse(group.id))}>
        {group.collapsed ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span>{group.collapsed ? 'Expand group' : 'Collapse group'}</span>
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item" role="menuitem" onClick={() => run(() => onUngroup(group.id))}>
        <Layers size={13} /><span>Ungroup tabs</span>
      </button>
      <button className="context-menu-item" role="menuitem" onClick={() => run(() => onUngroup())}>
        <Layers size={13} /><span>Ungroup all tabs</span>
      </button>
      <button
        className="context-menu-item"
        role="menuitem"
        disabled={tabCount === 0}
        onClick={() => run(() => onCloseGroup(group.id))}
      >
        <X size={13} /><span>Close group ({tabCount})</span>
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item item-danger" role="menuitem" onClick={() => run(() => onDelete(group.id))}>
        <Trash2 size={13} /><span>Delete group</span>
      </button>
    </div>
  );
};