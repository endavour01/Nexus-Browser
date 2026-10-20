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
import { UserProfile, AccountSession, NexusBrowserMode } from '@shared/types';
import { Tabs } from './ui/Tabs/Tabs';
import { AccountProfileView, AccountModal } from './Account';
import { NexusBotProfileSection } from './NexusBotProfileSection';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSwitched?: (profile: UserProfile) => void;
  mode?: NexusBrowserMode;
  onSelectMode?: (mode: NexusBrowserMode) => void;
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
  mode,
  onSelectMode,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Tab & Account states
  const [activeModalTab, setActiveModalTab] = useState<'local' | 'account'>('local');
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalView, setAccountModalView] = useState<'sign-in' | 'sign-up'>('sign-in');

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
      window.nexusAPI?.getAccountSession?.().then(setAccountSession).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = window.nexusAPI?.onAccountUpdated?.((sess) => {
      setAccountSession(sess);
    });
    return () => {
      unsub?.();
    };
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
            <h2 className="profile-modal-title">Identity & Profiles</h2>
            <p className="profile-modal-subtitle">
              Manage local browser profiles and your authenticated online NEXUS Account.
            </p>
          </div>
          <button className="nexus-icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs: Local Profiles vs Online NEXUS Account */}
        <div className="px-5 pt-3 pb-2 border-b border-subtle bg-surface">
          <Tabs
            tabs={[
              { id: 'local', label: 'Local Profiles', icon: <User size={13} /> },
              {
                id: 'account',
                label: 'NEXUS Account',
                icon: <Shield size={13} />,
                badge: accountSession?.account ? 'Active' : undefined,
              },
            ]}
            activeTab={activeModalTab}
            onChange={(id) => {
              setIsCreating(false);
              setEditingId(null);
              setActiveModalTab(id as 'local' | 'account');
            }}
            variant="segmented"
            size="sm"
          />
        </div>

        {activeModalTab === 'account' ? (
          <div className="profile-modal-content">
            {accountSession?.account ? (
              <AccountProfileView
                session={accountSession}
                onSignOut={() => setAccountSession(null)}
                onAccountUpdated={(acc) =>
                  setAccountSession((prev) => (prev ? { ...prev, account: acc } : null))
                }
                onOpenSignIn={() => {
                  setAccountModalView('sign-in');
                  setIsAccountModalOpen(true);
                }}
              />
            ) : (
              <div className="py-6 px-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-surface border border-subtle flex items-center justify-center mx-auto text-accent shadow-sm">
                  <Shield size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-primary">NEXUS Online Account</h3>
                  <p className="text-2xs text-secondary leading-relaxed max-w-sm mx-auto">
                    Connect an authenticated online identity for cloud settings and future workspace synchronization.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    className="nexus-btn-primary px-4 py-1.5 text-xs font-semibold"
                    onClick={() => {
                      setAccountModalView('sign-in');
                      setIsAccountModalOpen(true);
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="nexus-btn-secondary px-4 py-1.5 text-xs font-semibold"
                    onClick={() => {
                      setAccountModalView('sign-up');
                      setIsAccountModalOpen(true);
                    }}
                  >
                    Create Account
                  </button>
                </div>
                <div className="text-3xs text-secondary/80 bg-surface/80 p-3 rounded-lg border border-subtle max-w-md mx-auto text-left leading-relaxed space-y-1">
                  <div className="font-semibold text-primary">Local Profiles vs. NEXUS Account</div>
                  <div>
                    Local browser profiles keep your cookies, history, and tabs separate on this computer. Signing into or out of a NEXUS Account never modifies or erases your local browser profile data.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="profile-modal-content">
            {/* List of profiles */}
            {!isCreating && !editingId && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <NexusBotProfileSection
                    mode={mode}
                    onSelectMode={onSelectMode}
                  />
                </div>
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
                            className="nexus-btn-sm nexus-btn-secondary switch-btn"
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
      )}
      </div>

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        initialView={accountModalView}
        onSessionChange={(sess) => setAccountSession(sess)}
      />
    </div>
  );
};
