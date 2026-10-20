import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot,
  Play,
  Square,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Key,
  Plus,
  Trash2,
  Clock,
  Globe,
  Loader2,
  Check,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  AgentAction,
  AgentStatusResponse,
  AgentStepLog,
  ConfirmationRequest,
  StoredCredentialMetadata,
  NexusBrowserMode,
} from '@shared/types';
import { Button, IconButton, Input, Card, Badge, Modal, Tabs } from './ui';
import { PanelHeader } from './ui/PanelHeader/PanelHeader';
import { NexusBotAvatar } from './NexusBotAvatar';
import { getNexusModeLabel, getNexusModeAccent } from '../assets/nexusBotAssets';

interface AssistantPanelProps {
  onClose: () => void;
  onNavigate?: (url: string) => void;
  mode?: NexusBrowserMode;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ onClose, onNavigate, mode = 'default' }) => {
  const [activeTab, setActiveTab] = useState<'task' | 'credentials' | 'allowlist'>('task');
  const [taskInput, setTaskInput] = useState('');
  const [status, setStatus] = useState<AgentStatusResponse>({
    state: 'idle',
    stepCount: 0,
    maxSteps: 25,
  });
  const [stepLogs, setStepLogs] = useState<AgentStepLog[]>([]);
  const [confirmationReq, setConfirmationReq] = useState<ConfirmationRequest | null>(null);
  const [askUserPrompt, setAskUserPrompt] = useState<string | null>(null);
  const [userReplyInput, setUserReplyInput] = useState('');
  const [allowlistPrompt, setAllowlistPrompt] = useState<{ site: string; url: string; step: number } | null>(null);

  // Credentials & Allowlist state
  const [credentials, setCredentials] = useState<StoredCredentialMetadata[]>([]);
  const [isAddCredModalOpen, setIsAddCredModalOpen] = useState(false);
  const [newCredSite, setNewCredSite] = useState('');
  const [newCredName, setNewCredName] = useState('');
  const [newCredUsername, setNewCredUsername] = useState('');
  const [newCredPassword, setNewCredPassword] = useState('');
  const [credError, setCredError] = useState('');

  const [allowedSites, setAllowedSites] = useState<string[]>([]);
  const [newSiteInput, setNewSiteInput] = useState('');

  const logEndRef = useRef<HTMLDivElement>(null);
  const api = typeof window !== 'undefined' ? window.nexusAPI : null;

  const isRunning =
    status.state === 'observing' ||
    status.state === 'thinking' ||
    status.state === 'executing' ||
    status.state === 'waiting_confirmation' ||
    status.state === 'waiting_user_input' ||
    status.state === 'waiting_allowlist';

  // Load initial status and register listeners
  useEffect(() => {
    if (!api) return;

    api.agentGetStatus().then(setStatus).catch(console.error);
    api.agentListCredentials().then(setCredentials).catch(console.error);
    api.agentGetAllowlist().then(setAllowedSites).catch(console.error);

    const unsubStatus = api.onAgentStatusChanged((newStatus) => {
      setStatus(newStatus);
      if (newStatus.state === 'completed' || newStatus.state === 'stopped' || newStatus.state === 'error') {
        setConfirmationReq(null);
        setAskUserPrompt(null);
        setAllowlistPrompt(null);
      }
    });

    const unsubStep = api.onAgentStepLogged((log) => {
      setStepLogs((prev) => [...prev, log]);
      setTimeout(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    const unsubConfirm = api.onAgentConfirmationRequested((req) => {
      setConfirmationReq(req);
    });

    const unsubAsk = api.onAgentAskUser((data) => {
      setAskUserPrompt(data.question);
    });

    return () => {
      unsubStatus();
      unsubStep();
      unsubConfirm();
      unsubAsk();
    };
  }, [api]);

  const handleStartTask = async (taskText?: string) => {
    const text = taskText || taskInput;
    if (!text.trim() || !api) return;

    setStepLogs([]);
    setConfirmationReq(null);
    setAskUserPrompt(null);
    setAllowlistPrompt(null);

    const res = await api.agentStartTask({ task: text.trim() });
    if (!res.success) {
      alert(`Could not start Nexus Bot task: ${res.error || 'Unknown error'}`);
    }
  };

  const handleStopTask = async () => {
    if (!api) return;
    await api.agentStopTask();
  };

  const handleConfirmAction = async (approved: boolean) => {
    if (!api) return;
    setConfirmationReq(null);
    await api.agentConfirmAction({ approved });
  };

  const handleReplyToUser = async () => {
    if (!api || !userReplyInput.trim()) return;
    const text = userReplyInput.trim();
    setUserReplyInput('');
    setAskUserPrompt(null);
    await api.agentReplyToUser({ response: text });
  };

  const handleApproveAllowlist = async (site: string, approve: boolean) => {
    if (!api) return;
    setAllowlistPrompt(null);
    if (approve) {
      await api.agentApproveSite({ site });
      const sites = await api.agentGetAllowlist();
      setAllowedSites(sites);
    } else {
      await api.agentStopTask();
    }
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    if (!newCredSite.trim() || !newCredUsername.trim() || !newCredPassword) {
      setCredError('Site, username, and password are required.');
      return;
    }
    if (!api) return;

    const res = await api.agentSaveCredential({
      site: newCredSite.trim(),
      name: newCredName.trim() || newCredSite.trim(),
      username: newCredUsername.trim(),
      secret: newCredPassword,
    });

    if (res.success) {
      setIsAddCredModalOpen(false);
      setNewCredSite('');
      setNewCredName('');
      setNewCredUsername('');
      setNewCredPassword('');
      const updated = await api.agentListCredentials();
      setCredentials(updated);
    } else {
      setCredError(res.error || 'Failed to encrypt credential with safeStorage.');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!api) return;
    await api.agentDeleteCredential({ id });
    const updated = await api.agentListCredentials();
    setCredentials(updated);
  };

  const handleAddAllowedSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteInput.trim() || !api) return;
    await api.agentApproveSite({ site: newSiteInput.trim() });
    setNewSiteInput('');
    const sites = await api.agentGetAllowlist();
    setAllowedSites(sites);
  };

  const getStatusBadge = () => {
    switch (status.state) {
      case 'idle':
        return <Badge variant="neutral">Idle</Badge>;
      case 'observing':
        return <Badge variant="info">Observing DOM</Badge>;
      case 'thinking':
        return <Badge variant="info">Thinking</Badge>;
      case 'executing':
        return <Badge variant="accent">Executing</Badge>;
      case 'waiting_confirmation':
        return <Badge variant="warning">Confirmation Needed</Badge>;
      case 'waiting_user_input':
        return <Badge variant="warning">Awaiting 2FA / Input</Badge>;
      case 'waiting_allowlist':
        return <Badge variant="warning">Site Approval</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'stopped':
        return <Badge variant="neutral">Stopped</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
    }
  };

  return (
    <div className="nexus-assistant-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)' }}>
      <PanelHeader
        title="Nexus Bot"
        icon={<NexusBotAvatar mode={mode} size={20} showGlow={true} />}
        description="Autonomous single-task browser agent"
        onClose={onClose}
      />

      {/* Tabs */}
      <div style={{ padding: '8px 12px 0 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Tabs
          variant="segmented"
          size="sm"
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
          tabs={[
            { id: 'task', label: 'Agent Task' },
            { id: 'credentials', label: `Credentials (${credentials.length})` },
            { id: 'allowlist', label: `Allowed Sites (${allowedSites.length})` },
          ]}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTab === 'task' && (
          <>
            {/* Status Header & Working Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isRunning && <Loader2 size={13} className="animate-spin text-accent" />}
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {isRunning ? 'Agent is working' : 'Agent Ready'}
                </span>
                {getStatusBadge()}
                <span
                  style={{
                    fontSize: '9.5px',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    background: `${getNexusModeAccent(mode)}18`,
                    color: getNexusModeAccent(mode),
                    border: `1px solid ${getNexusModeAccent(mode)}33`,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                  }}
                  title={`NEXUS Active Mode: ${getNexusModeLabel(mode)}`}
                >
                  {getNexusModeLabel(mode)}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Step {status.stepCount} / {status.maxSteps}
              </span>
            </div>

            {/* Consequential Action Confirmation Prompt */}
            {confirmationReq && (
              <Card
                variant="elevated"
                padding="md"
                style={{
                  borderLeft: '3px solid var(--status-amber)',
                  background: 'rgba(251, 191, 36, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={15} style={{ color: 'var(--status-amber)' }} />
                  <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                    Confirmation Required
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {confirmationReq.reason}
                </p>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: '6px 8px',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '10px',
                    color: 'var(--accent-primary)',
                    wordBreak: 'break-all',
                  }}
                >
                  Target: {confirmationReq.targetSummary}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant={confirmationReq.dangerLevel === 'high' ? 'danger' : 'primary'}
                    size="sm"
                    fullWidth
                    onClick={() => handleConfirmAction(true)}
                  >
                    Confirm & Proceed
                  </Button>
                  <Button variant="secondary" size="sm" fullWidth onClick={() => handleConfirmAction(false)}>
                    Deny & Stop
                  </Button>
                </div>
              </Card>
            )}

            {/* 2FA / User Input Challenge Prompt */}
            {askUserPrompt && (
              <Card
                variant="elevated"
                padding="md"
                style={{
                  borderLeft: '3px solid var(--accent-primary)',
                  background: 'rgba(167, 139, 250, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ShieldCheck size={15} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                    Input / 2FA Verification
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {askUserPrompt}
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Input
                    size="sm"
                    value={userReplyInput}
                    onChange={(e) => setUserReplyInput(e.target.value)}
                    placeholder="Enter 2FA code or reply..."
                    onKeyDown={(e) => e.key === 'Enter' && handleReplyToUser()}
                  />
                  <Button variant="primary" size="sm" onClick={handleReplyToUser}>
                    Submit
                  </Button>
                </div>
              </Card>
            )}

            {/* Allowlist Approval Prompt */}
            {allowlistPrompt && (
              <Card
                variant="elevated"
                padding="md"
                style={{
                  borderLeft: '3px solid var(--status-amber)',
                  background: 'rgba(251, 191, 36, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Globe size={15} style={{ color: 'var(--status-amber)' }} />
                  <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                    Site Approval Required
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  Nexus Bot wants to act on <strong>{allowlistPrompt.site}</strong>. Allow this site?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleApproveAllowlist(allowlistPrompt.site, true)}
                  >
                    Allow Site
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleApproveAllowlist(allowlistPrompt.site, false)}
                  >
                    Block & Stop
                  </Button>
                </div>
              </Card>
            )}

            {/* Task Input Section (When Idle) */}
            {!isRunning ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Enter a task (e.g., 'Log in to http://localhost:8080 with my saved credentials and submit the form')..."
                  style={{
                    width: '100%',
                    minHeight: '72px',
                    padding: '8px 10px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.4,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleStartTask();
                    }
                  }}
                />

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    leftIcon={<Play size={13} fill="currentColor" />}
                    onClick={() => handleStartTask()}
                    disabled={!taskInput.trim()}
                  >
                    Run Task in New Tab
                  </Button>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    QUICK PRESETS
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskInput('Navigate to http://localhost:8080 and log in with my test credentials');
                      handleStartTask('Navigate to http://localhost:8080 and log in with my test credentials');
                    }}
                    style={{
                      padding: '5px 8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    🔑 Log in to local test page with credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskInput('Navigate to https://news.ycombinator.com and view the top headline');
                      handleStartTask('Navigate to https://news.ycombinator.com and view the top headline');
                    }}
                    style={{
                      padding: '5px 8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    📰 Browse top Hacker News headline
                  </button>
                </div>
              </div>
            ) : (
              /* Emergency Stop Button */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  leftIcon={<Square size={13} fill="currentColor" />}
                  onClick={handleStopTask}
                >
                  Stop Nexus Bot Immediately
                </Button>
              </div>
            )}

            {/* Error Banner */}
            {status.lastError && (
              <div
                style={{
                  padding: '8px 10px',
                  background: 'rgba(248, 113, 113, 0.08)',
                  border: '1px solid var(--status-red)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11.5px',
                  color: 'var(--status-red)',
                  lineHeight: 1.4,
                }}
              >
                {status.lastError}
              </div>
            )}

            {/* Live Step Log */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '160px', marginTop: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ACTION LOG ({stepLogs.length})
                </span>
                {stepLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepLogs([])}
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-secondary)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    Clear log
                  </button>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {stepLogs.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '11.5px',
                    }}
                  >
                    No actions logged yet. Start a task above.
                  </div>
                ) : (
                  stepLogs.map((log) => (
                    <div
                      key={log.step}
                      style={{
                        padding: '6px 8px',
                        background: 'var(--bg-base)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              background: 'var(--bg-elevated)',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            #{log.step}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '11.5px', color: 'var(--accent-primary)' }}>
                            {log.action.action.toUpperCase()}
                          </span>
                        </div>
                        {log.status === 'success' && <CheckCircle2 size={12} style={{ color: 'var(--status-green)' }} />}
                        {log.status === 'failed' && <XCircle size={12} style={{ color: 'var(--status-red)' }} />}
                        {log.status === 'cancelled' && <AlertTriangle size={12} style={{ color: 'var(--status-amber)' }} />}
                      </div>

                      {log.targetDescription && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={log.targetDescription}
                        >
                          {log.targetDescription}
                        </div>
                      )}

                      {log.action.text && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          Text: {log.action.text}
                        </div>
                      )}

                      {log.error && (
                        <div style={{ fontSize: '10.5px', color: 'var(--status-red)' }}>
                          Error: {log.error}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          </>
        )}

        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ENCRYPTED CREDENTIALS
              </span>
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<Plus size={12} />}
                onClick={() => setIsAddCredModalOpen(true)}
              >
                Add Credential
              </Button>
            </div>

            <div
              style={{
                padding: '8px',
                background: 'rgba(167, 139, 250, 0.05)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              🔒 Passwords are encrypted on disk with your OS Keychain (Electron safeStorage). The AI model only receives placeholders like <code>{`{{cred:site.password}}`}</code> and never sees real passwords.
            </div>

            {credentials.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No credentials stored yet. Add one to enable password substitution during tasks.
              </div>
            ) : (
              credentials.map((cred) => (
                <div
                  key={cred.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={12} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                        {cred.site}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({cred.name})</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      User: {cred.username} • Secret: ••••••••
                    </span>
                  </div>
                  <IconButton
                    icon={<Trash2 size={13} />}
                    aria-label={`Delete credential for ${cred.site}`}
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDeleteCredential(cred.id)}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Allowed Sites Tab */}
        {activeTab === 'allowlist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              PER-SITE ACTION ALLOWLIST
            </span>

            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Nexus Bot will strictly pause and ask for your approval before taking any action on sites not in this allowlist.
            </p>

            <form onSubmit={handleAddAllowedSite} style={{ display: 'flex', gap: '6px' }}>
              <Input
                size="sm"
                placeholder="e.g. localhost or github.com"
                value={newSiteInput}
                onChange={(e) => setNewSiteInput(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="sm" disabled={!newSiteInput.trim()}>
                Add Site
              </Button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {allowedSites.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                  No sites currently allowlisted. Nexus Bot will ask permission on first interaction.
                </div>
              ) : (
                allowedSites.map((site) => (
                  <div
                    key={site}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '11.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={12} style={{ color: 'var(--status-green)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{site}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Credential Modal */}
      <Modal
        isOpen={isAddCredModalOpen}
        onClose={() => setIsAddCredModalOpen(false)}
        title="Store Encrypted Credential"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setIsAddCredModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" form="add-cred-form" type="submit">
              Save Encrypted
            </Button>
          </div>
        }
      >
        <form id="add-cred-form" onSubmit={handleSaveCredential} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {credError && (
            <div style={{ color: 'var(--status-red)', fontSize: '11.5px' }}>{credError}</div>
          )}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Site Domain (e.g. localhost, github.com)
            </label>
            <Input
              size="sm"
              value={newCredSite}
              onChange={(e) => setNewCredSite(e.target.value)}
              placeholder="e.g. localhost:8080 or github.com"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Account Name (optional)
            </label>
            <Input
              size="sm"
              value={newCredName}
              onChange={(e) => setNewCredName(e.target.value)}
              placeholder="e.g. Test Account"
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Username or Email
            </label>
            <Input
              size="sm"
              value={newCredUsername}
              onChange={(e) => setNewCredUsername(e.target.value)}
              placeholder="e.g. admin@example.com"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Password (stored securely with safeStorage)
            </label>
            <Input
              size="sm"
              type="password"
              value={newCredPassword}
              onChange={(e) => setNewCredPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
