import React, { useState, useEffect } from 'react';
import { Workspace } from '@shared/types';
import {
  X,
  Plus,
  Trash2,
  Check,
  Layers,
  Code,
  BookOpen,
  User,
  Briefcase,
  Terminal,
  Globe,
  Rocket,
  Shield,
  Lock,
} from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  editingWorkspace: Workspace | null;
  onSaveWorkspace: (workspace: Workspace) => void;
  onDeleteWorkspace: (id: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Violet', value: '#A78BFA' },
  { name: 'Sky', value: '#38BDF8' },
  { name: 'Emerald', value: '#34D399' },
  { name: 'Amber', value: '#FBBF24' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Fuchsia', value: '#E879F9' },
  { name: 'Indigo', value: '#818CF8' },
  { name: 'Slate', value: '#94A3B8' },
];

const ICON_OPTIONS = [
  { id: 'User', label: 'User', component: User },
  { id: 'Code', label: 'Dev', component: Code },
  { id: 'BookOpen', label: 'Research', component: BookOpen },
  { id: 'Briefcase', label: 'Work', component: Briefcase },
  { id: 'Terminal', label: 'Terminal', component: Terminal },
  { id: 'Globe', label: 'Web', component: Globe },
  { id: 'Rocket', label: 'Rocket', component: Rocket },
  { id: 'Shield', label: 'Security', component: Shield },
];

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  editingWorkspace,
  onSaveWorkspace,
  onDeleteWorkspace,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#A78BFA');
  const [icon, setIcon] = useState('User');
  const [isolatedSession, setIsolatedSession] = useState(false);

  useEffect(() => {
    if (editingWorkspace) {
      setName(editingWorkspace.name);
      setColor(editingWorkspace.color);
      setIcon(editingWorkspace.icon || 'User');
      setIsolatedSession(!!editingWorkspace.isolatedSession);
    } else {
      setName('');
      setColor(COLOR_PRESETS[workspaces.length % COLOR_PRESETS.length].value);
      setIcon('Briefcase');
      setIsolatedSession(false);
    }
  }, [editingWorkspace, workspaces, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const workspaceData: Workspace = {
      id: editingWorkspace ? editingWorkspace.id : `ws-${Date.now()}`,
      name: name.trim(),
      color,
      icon,
      isolatedSession,
      pinnedSites: editingWorkspace?.pinnedSites || [],
      layout: editingWorkspace?.layout || { sidebarCollapsed: false, tabLayout: 'horizontal' },
    };

    onSaveWorkspace(workspaceData);
    onClose();
  };

  const isDefaultOrOnly = editingWorkspace && (editingWorkspace.id === 'default' || workspaces.length <= 1);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card workspace-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Layers size={16} className="text-accent" />
            <h3 className="modal-title">
              {editingWorkspace ? `Edit Workspace: ${editingWorkspace.name}` : 'Create New Workspace'}
            </h3>
          </div>
          <button className="nexus-icon-btn modal-close-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Workspace Name */}
          <div className="form-group">
            <label className="form-label">Workspace Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Trading, Client Work, Side Project..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Accent Color Swatches */}
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-swatches">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.value}
                  className={`color-swatch-btn ${color === preset.value ? 'selected' : ''}`}
                  style={{ backgroundColor: preset.value }}
                  onClick={() => setColor(preset.value)}
                  title={preset.name}
                >
                  {color === preset.value && <Check size={12} className="swatch-check" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-selector-grid">
              {ICON_OPTIONS.map((opt) => {
                const IconComponent = opt.component;
                const isSelected = icon === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    className={`icon-choice-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setIcon(opt.id)}
                    title={opt.label}
                  >
                    <IconComponent size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Isolated Session Toggle */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isolatedSession}
                onChange={(e) => setIsolatedSession(e.target.checked)}
              />
              <div className="checkbox-text">
                <span className="checkbox-title">
                  <Lock size={12} className="inline mr-1 text-accent" />
                  Separate Session Partition (Isolated Cookies & Logins)
                </span>
                <span className="checkbox-sub">
                  Keeps tabs in this workspace in a separate cookie store. Useful for secondary Google/GitHub accounts.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="modal-actions-row">
            {editingWorkspace && !isDefaultOrOnly && (
              <button
                type="button"
                className="modal-btn-danger"
                onClick={() => {
                  onDeleteWorkspace(editingWorkspace.id);
                  onClose();
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="modal-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="modal-btn-primary" disabled={!name.trim()}>
                {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
