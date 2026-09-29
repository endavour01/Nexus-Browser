import React, { useState, useEffect } from 'react';
import {
  Shield,
  Camera,
  Mic,
  MapPin,
  Bell,
  Trash2,
  Plus,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Lock,
  LucideIcon,
} from 'lucide-react';
import { PermissionType, PermissionDecision, SitePermissionRule } from '@shared/types';

interface PermissionsPageProps {
  onNavigate?: (url: string) => void;
}

const PERMISSION_METAS: Record<
  PermissionType,
  { label: string; icon: LucideIcon }
> = {
  camera: { label: 'Camera', icon: Camera },
  microphone: { label: 'Microphone', icon: Mic },
  geolocation: { label: 'Location', icon: MapPin },
  notifications: { label: 'Notifications', icon: Bell },
  midi: { label: 'MIDI Devices', icon: Shield },
  pointerLock: { label: 'Pointer Lock', icon: Shield },
  fullscreen: { label: 'Full Screen', icon: Shield },
  openExternal: { label: 'Open External Apps', icon: ExternalLink },
};

export const PermissionsPage: React.FC<PermissionsPageProps> = () => {
  const [rules, setRules] = useState<SitePermissionRule[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Manual rule state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [newPermission, setNewPermission] = useState<PermissionType>('camera');
  const [newDecision, setNewDecision] = useState<PermissionDecision>('allow');

  const loadRules = async () => {
    try {
      setLoading(true);
      const list = await window.nexusAPI.getSitePermissions();
      setRules(list);
    } catch (e) {
      console.error('Failed to load site permissions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleUpdateDecision = async (
    origin: string,
    permission: PermissionType,
    decision: PermissionDecision
  ) => {
    try {
      await window.nexusAPI.setSitePermission(origin, permission, decision);
      await loadRules();
    } catch (e) {
      console.error('Failed to update permission decision:', e);
    }
  };

  const handleRemoveRule = async (origin: string, permission: PermissionType) => {
    try {
      await window.nexusAPI.removeSitePermission(origin, permission);
      await loadRules();
    } catch (e) {
      console.error('Failed to remove site permission:', e);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Reset all site permissions to system defaults?')) {
      try {
        await window.nexusAPI.clearAllSitePermissions();
        await loadRules();
      } catch (e) {
        console.error('Failed to clear permissions:', e);
      }
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin.trim()) return;

    let originClean = newOrigin.trim();
    try {
      originClean = new URL(originClean).origin;
    } catch {}

    try {
      await window.nexusAPI.setSitePermission(originClean, newPermission, newDecision);
      setNewOrigin('');
      setShowAddForm(false);
      await loadRules();
    } catch (e) {
      console.error('Failed to add site permission rule:', e);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.permission.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || r.permission === filterType;
    const matchesDecision = filterDecision === 'all' || r.decision === filterDecision;
    return matchesSearch && matchesType && matchesDecision;
  });

  return (
    <div className="permissions-page-container">
      <div className="permissions-page-content">
        {/* Header */}
        <div className="permissions-header">
          <div className="permissions-title-group">
            <div className="permissions-icon-badge">
              <Shield size={24} className="accent-icon" />
            </div>
            <div>
              <h1 className="permissions-title">Site Permissions & Privacy Controls</h1>
              <p className="permissions-subtitle">
                Configure origin-based access to device sensors, media streams, and system capabilities.
              </p>
            </div>
          </div>
          <div className="permissions-header-actions">
            <button
              className="nexus-btn-ghost danger"
              onClick={handleClearAll}
              disabled={rules.length === 0}
            >
              <Trash2 size={14} />
              <span>Reset All Permissions</span>
            </button>
            <button
              className="nexus-btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={14} />
              <span>{showAddForm ? 'Cancel' : 'Add Exception'}</span>
            </button>
          </div>
        </div>

        {/* Add Exception Form */}
        {showAddForm && (
          <form className="add-permission-card" onSubmit={handleAddRule}>
            <h3 className="card-title">Add Site Permission Exception</h3>
            <div className="add-permission-grid">
              <div className="form-group">
                <label className="form-label">Website Origin / URL</label>
                <input
                  type="text"
                  className="nexus-input"
                  placeholder="https://example.com"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permission Capability</label>
                <select
                  className="nexus-select"
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value as PermissionType)}
                >
                  {Object.entries(PERMISSION_METAS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Decision</label>
                <select
                  className="nexus-select"
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value as PermissionDecision)}
                >
                  <option value="allow">ALLOW</option>
                  <option value="deny">BLOCK / DENY</option>
                  <option value="ask">ASK EVERY TIME</option>
                </select>
              </div>
            </div>

            <div className="form-actions-right">
              <button
                type="button"
                className="nexus-btn-ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="nexus-btn-primary">
                Save Rule
              </button>
            </div>
          </form>
        )}

        {/* Filters and Search Bar */}
        <div className="permissions-filter-toolbar">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Filter by origin or permission..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select
              className="nexus-select small"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Permissions</option>
              {Object.entries(PERMISSION_METAS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            <select
              className="nexus-select small"
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
            >
              <option value="all">All Decisions</option>
              <option value="allow">Allowed</option>
              <option value="deny">Blocked</option>
              <option value="ask">Ask</option>
            </select>
          </div>
        </div>

        {/* Rules Table */}
        <div className="permissions-table-card">
          {filteredRules.length === 0 ? (
            <div className="empty-permissions-state">
              <Shield size={32} className="empty-icon" />
              <div className="empty-title">
                {rules.length === 0 ? 'No custom site permissions configured' : 'No matching permission rules'}
              </div>
              <p className="empty-desc">
                {rules.length === 0
                  ? 'Websites will prompt you explicitly whenever requesting sensitive capabilities.'
                  : 'Try modifying your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="rules-list">
              {filteredRules.map((rule) => {
                const meta = PERMISSION_METAS[rule.permission] || {
                  label: rule.permission,
                  icon: Shield,
                };
                const IconComp = meta.icon;
                return (
                  <div key={`${rule.origin}:${rule.permission}`} className="permission-rule-row">
                    <div className="rule-origin-group">
                      <Lock size={13} className="lock-icon" />
                      <span className="rule-origin">{rule.origin}</span>
                    </div>

                    <div className="rule-type-badge">
                      <IconComp size={14} className="perm-type-icon" />
                      <span>{meta.label}</span>
                    </div>

                    <div className="rule-decision-selector">
                      <select
                        className={`decision-select ${rule.decision}`}
                        value={rule.decision}
                        onChange={(e) =>
                          handleUpdateDecision(
                            rule.origin,
                            rule.permission,
                            e.target.value as PermissionDecision
                          )
                        }
                      >
                        <option value="allow">ALLOW</option>
                        <option value="deny">BLOCK</option>
                        <option value="ask">ASK</option>
                      </select>
                    </div>

                    <button
                      className="nexus-icon-btn danger delete-btn"
                      onClick={() => handleRemoveRule(rule.origin, rule.permission)}
                      title="Delete rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
