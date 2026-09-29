import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  Code2,
  Terminal,
  Shield,
  Cpu,
  Globe,
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  Edit2,
} from 'lucide-react';
import { UserProfile } from '@shared/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSwitched?: (profile: UserProfile) => void;
}

const AVAILABLE_ICONS = [
  { id: 'User', icon: User, label: 'User' },
  { id: 'Briefcase', icon: Briefcase, label: 'Work' },
  { id: 'Code2', icon: Code2, label: 'Code' },
  { id: 'Terminal', icon: Terminal, label: 'CLI' },
  { id: 'Shield', icon: Shield, label: 'Secure' },
  { id: 'Cpu', icon: Cpu, label: 'Hardware' },
  { id: 'Globe', icon: Globe, label: 'Web' },
  { id: 'Sparkles', icon: Sparkles, label: 'AI' },
];

const PRESET_COLORS = [
  '#A78BFA', // Violet / Purple
  '#38BDF8', // Cyan / Sky
  '#34D399', // Emerald
  '#F43F5E', // Rose
  '#FBBF24', // Amber
  '#EC4899', // Pink
  '#818CF8', // Indigo
  '#2DD4BF', // Teal
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileSwitched,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('User');
  const [formColor, setFormColor] = useState('#A78BFA');

  const loadProfiles = async () => {
    try {
      const list = await window.nexusAPI.getProfiles();
      const active = await window.nexusAPI.getActiveProfile();
      setProfiles(list);
      setActiveProfile(active);
    } catch (e) {
      console.error('Failed to load profiles:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      setIsCreating(false);
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setFormName('');
    setFormIcon('User');
    setFormColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setIsCreating(true);
    setEditingId(null);
  };

  const handleStartEdit = (profile: UserProfile) => {
    setFormName(profile.name);
    setFormIcon(profile.icon);
    setFormColor(profile.color);
    setEditingId(profile.id);
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (isCreating) {
      try {
        const created = await window.nexusAPI.createProfile(formName.trim(), formIcon, formColor);
        await loadProfiles();
        setIsCreating(false);
      } catch (err) {
        console.error('Failed to create profile:', err);
      }
    } else if (editingId) {
      try {
        await window.nexusAPI.updateProfile(editingId, {
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
        });
        await loadProfiles();
        setEditingId(null);
      } catch (err) {
        console.error('Failed to update profile:', err);
      }
    }
  };

  const handleSwitch = async (profileId: string) => {
    try {
      const success = await window.nexusAPI.switchProfile(profileId);
      if (success) {
        await loadProfiles();
        const active = await window.nexusAPI.getActiveProfile();
        onProfileSwitched?.(active);
        onClose();
      }
    } catch (err) {
      console.error('Failed to switch profile:', err);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (profiles.length <= 1) return;
    if (window.confirm('Are you sure you want to delete this profile and all its browsing data?')) {
      try {
        await window.nexusAPI.deleteProfile(profileId);
        await loadProfiles();
      } catch (err) {
        console.error('Failed to delete profile:', err);
      }
    }
  };

  const renderIcon = (iconName: string, size = 18, color?: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.id === iconName);
    const IconComp = found ? found.icon : User;
    return <IconComp size={size} style={{ color }} />;
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div>
            <h2 className="profile-modal-title">Browser Profiles</h2>
            <p className="profile-modal-subtitle">
              Manage isolated sessions, cookies, and browsing data for distinct workflows.
            </p>
          </div>
          <button className="nexus-icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="profile-modal-content">
          {/* List of profiles */}
          {!isCreating && !editingId && (
            <>
              <div className="profiles-grid">
                {profiles.map((p) => {
                  const isActive = activeProfile?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`profile-card ${isActive ? 'active' : ''}`}
                      style={{ borderLeftColor: p.color }}
                    >
                      <div className="profile-card-left">
                        <div
                          className="profile-avatar"
                          style={{ backgroundColor: `${p.color}25`, borderColor: p.color }}
                        >
                          {renderIcon(p.icon, 20, p.color)}
                        </div>
                        <div className="profile-info">
                          <div className="profile-name">
                            {p.name}
                            {isActive && <span className="active-badge">Active</span>}
                          </div>
                          <div className="profile-created">
                            Created {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="profile-card-actions">
                        {!isActive ? (
                          <button
                            className="nexus-btn-ghost switch-btn"
                            onClick={() => handleSwitch(p.id)}
                            title="Switch to this profile"
                          >
                            Switch
                          </button>
                        ) : null}
                        <button
                          className="nexus-icon-btn"
                          onClick={() => handleStartEdit(p)}
                          title="Edit profile"
                        >
                          <Edit2 size={14} />
                        </button>
                        {profiles.length > 1 && (
                          <button
                            className="nexus-icon-btn danger"
                            onClick={() => handleDelete(p.id)}
                            title="Delete profile"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="profile-modal-footer">
                <button className="nexus-btn-primary add-profile-btn" onClick={handleStartCreate}>
                  <Plus size={15} />
                  <span>Create New Profile</span>
                </button>
              </div>
            </>
          )}

          {/* Create or Edit Form */}
          {(isCreating || editingId) && (
            <form onSubmit={handleSave} className="profile-form">
              <h3 className="form-title">
                {isCreating ? 'Create New Profile' : 'Edit Profile'}
              </h3>

              <div className="form-group">
                <label className="form-label">Profile Name</label>
                <input
                  type="text"
                  className="nexus-input"
                  placeholder="e.g. Work, Client Projects, Security Research"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Icon</label>
                <div className="icon-picker-grid">
                  {AVAILABLE_ICONS.map((item) => {
                    const isSelected = formIcon === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`icon-picker-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setFormIcon(item.id)}
                        title={item.label}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Accent Color</label>
                <div className="color-picker-row">
                  {PRESET_COLORS.map((col) => {
                    const isSelected = formColor.toLowerCase() === col.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={col}
                        className={`color-picker-dot ${isSelected ? 'selected' : ''}`}
                        style={{ backgroundColor: col }}
                        onClick={() => setFormColor(col)}
                      >
                        {isSelected && <Check size={12} color="#0B0D12" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="nexus-btn-ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="nexus-btn-primary">
                  {isCreating ? 'Create Profile' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
