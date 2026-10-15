import React, { useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Edit2,
  Check,
  X,
  HardDrive,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Button, Input, Badge } from '../ui';
import { NexusAccount, AccountSession } from '@shared/types';

interface AccountProfileViewProps {
  session?: AccountSession | null;
  account?: NexusAccount | null;
  onSignOut?: () => void;
  onAccountUpdated?: (updatedAccount: NexusAccount) => void;
  onOpenSignIn?: () => void;
  className?: string;
}

export const AccountProfileView: React.FC<AccountProfileViewProps> = ({
  session,
  account: propAccount,
  onSignOut,
  onAccountUpdated,
  onOpenSignIn,
  className = '',
}) => {
  const currentAccount = propAccount || session?.account;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentAccount?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (!currentAccount) {
    return (
      <div className={`nexus-account-profile-empty ${className}`}>
        <div className="text-center py-8 px-4 max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-subtle flex items-center justify-center mx-auto text-secondary shadow-sm">
            <User size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-primary">No Active NEXUS Account</h3>
            <p className="text-2xs text-secondary leading-relaxed">
              Connect a NEXUS Account to manage your user identity, future workspace synchronization, and cloud preferences.
            </p>
          </div>
          {onOpenSignIn && (
            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={onOpenSignIn}>
                Sign In or Register
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isVerified = currentAccount.isEmailVerified;
  const isPending = !currentAccount.isEmailVerified;

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'NX';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setNameError('Display name cannot be empty');
      return;
    }
    if (cleanName.length < 2) {
      setNameError('Display name must be at least 2 characters');
      return;
    }

    setIsSavingName(true);
    setNameError(null);

    try {
      if (!window.nexusAPI?.updateAccountProfile) {
        setNameError('Account API is unavailable.');
        return;
      }

      const res = await window.nexusAPI.updateAccountProfile({ displayName: cleanName });
      if (res.success && res.account) {
        setIsEditingName(false);
        onAccountUpdated?.(res.account);
      } else {
        setNameError(res.error || 'Failed to update display name.');
      }
    } catch (err: any) {
      setNameError(err?.message || 'Error saving display name.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleResendVerification = async () => {
    if (isResendingEmail) return;
    setIsResendingEmail(true);
    setResendSuccess(null);
    setResendError(null);

    try {
      if (!window.nexusAPI?.resendVerificationEmail) {
        setResendError('Verification service unavailable.');
        return;
      }

      const res = await window.nexusAPI.resendVerificationEmail();
      if (res.success) {
        setResendSuccess('Verification email dispatched! Please check your inbox.');
      } else {
        setResendError(res.error || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setResendError(err?.message || 'Unexpected error dispatching verification.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      if (!window.nexusAPI?.signOutAccount) {
        setSignOutError('Account service unavailable.');
        return;
      }

      const res = await window.nexusAPI.signOutAccount();
      if (res.success) {
        onSignOut?.();
      } else {
        setSignOutError('Failed to sign out.');
      }
    } catch (err: any) {
      setSignOutError(err?.message || 'Unexpected error signing out.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className={`nexus-account-profile-container space-y-6 ${className}`}>
      {/* 1. Header Card with Avatar & Identity */}
      <div className="nexus-account-profile-header p-5 rounded-xl border border-subtle bg-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="nexus-account-avatar-wrapper">
              <div className="nexus-account-avatar-circle">
                {currentAccount.avatarUrl ? (
                  <img
                    src={currentAccount.avatarUrl}
                    alt={currentAccount.displayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="nexus-account-initials font-mono font-bold text-sm">
                    {getInitials(currentAccount.displayName)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              {!isEditingName ? (
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-primary tracking-tight">
                    {currentAccount.displayName}
                  </h2>
                  <button
                    type="button"
                    className="nexus-account-icon-action"
                    onClick={() => {
                      setNameInput(currentAccount.displayName);
                      setIsEditingName(true);
                    }}
                    title="Edit display name"
                    aria-label="Edit display name"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveDisplayName} className="flex items-center gap-1.5 pt-0.5">
                  <Input
                    size="sm"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="New display name"
                    autoFocus
                    disabled={isSavingName}
                    error={nameError || undefined}
                    className="w-48"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSavingName}
                    title="Save name"
                  >
                    <Check size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameError(null);
                    }}
                    disabled={isSavingName}
                    title="Cancel"
                  >
                    <X size={13} />
                  </Button>
                </form>
              )}

              <div className="flex flex-wrap items-center gap-2 text-2xs text-secondary">
                <span className="flex items-center gap-1 font-mono text-primary">
                  <Mail size={12} className="text-muted" />
                  {currentAccount.email}
                </span>

                <span className="text-subtle">•</span>

                {isVerified ? (
                  <Badge variant="success" size="sm" dot>
                    Verified
                  </Badge>
                ) : isPending ? (
                  <Badge variant="warning" size="sm" dot>
                    Pending Verification
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button
              variant="danger"
              size="sm"
              onClick={handleSignOut}
              isLoading={isSigningOut}
              leftIcon={<LogOut size={13} />}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {signOutError && (
          <div className="nexus-account-error-banner mt-3" role="alert">
            <AlertTriangle size={13} />
            <span>{signOutError}</span>
          </div>
        )}
      </div>

      {/* 2. Verification Pending Notice Banner */}
      {!isVerified && (
        <div className="nexus-account-card-notice p-4 rounded-xl border border-amber-500/25 bg-amber-500/10 space-y-2.5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-semibold text-primary">Email Verification Required</h4>
              <p className="text-2xs text-secondary leading-relaxed">
                A verification link was dispatched to <strong className="text-primary font-mono">{currentAccount.email}</strong>. Please confirm your email address to enable security alerts and full identity recovery.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 pl-7">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResendVerification}
              isLoading={isResendingEmail}
              leftIcon={<RefreshCw size={12} className={isResendingEmail ? 'animate-spin' : ''} />}
            >
              Resend Verification Email
            </Button>

            {resendSuccess && (
              <span className="text-3xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} />
                {resendSuccess}
              </span>
            )}
            {resendError && (
              <span className="text-3xs text-rose-400 flex items-center gap-1 font-medium">
                <AlertTriangle size={12} />
                {resendError}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Account Details & Session Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Metadata */}
        <div className="p-4 rounded-xl border border-subtle bg-surface space-y-3">
          <div className="flex items-center gap-2 border-b border-subtle pb-2">
            <User size={14} className="text-accent" />
            <h4 className="text-xs font-semibold text-primary">Identity Details</h4>
          </div>

          <div className="space-y-2 text-2xs">
            <div className="flex items-center justify-between py-1 border-b border-subtle/50">
              <span className="text-secondary flex items-center gap-1.5">
                <Calendar size={12} /> Registered On
              </span>
              <span className="text-primary font-mono">
                {currentAccount.createdAt ? new Date(currentAccount.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }) : 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-subtle/50">
              <span className="text-secondary flex items-center gap-1.5">
                <KeyRound size={12} /> Account Identifier
              </span>
              <span className="text-primary font-mono truncate max-w-[140px]" title={currentAccount.id}>
                {currentAccount.id}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-secondary flex items-center gap-1.5">
                <ShieldCheck size={12} /> Security Status
              </span>
              <span className="text-emerald-400 font-medium">Protected (Local Keychain)</span>
            </div>
          </div>
        </div>

        {/* Local Security & Session Info */}
        <div className="p-4 rounded-xl border border-subtle bg-surface space-y-3">
          <div className="flex items-center gap-2 border-b border-subtle pb-2">
            <ShieldCheck size={14} className="text-accent" />
            <h4 className="text-xs font-semibold text-primary">Active Session Protection</h4>
          </div>

          <div className="space-y-2 text-2xs">
            <div className="flex items-center justify-between py-1 border-b border-subtle/50">
              <span className="text-secondary">Token Encryption</span>
              <span className="text-primary font-mono text-3xs bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">
                safeStorage (AES-256 GCM)
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-subtle/50">
              <span className="text-secondary">Renderer Storage</span>
              <span className="text-emerald-400">Zero In-Browser Credentials</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-secondary">Session Mode</span>
              <span className="text-primary">IPC Authenticated Channel</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cloud Sync Boundary & Local Data Isolation Disclaimer */}
      <div className="p-4 rounded-xl border border-subtle bg-surface/80 space-y-2.5">
        <div className="flex items-center gap-2">
          <HardDrive size={15} className="text-accent" />
          <h4 className="text-xs font-semibold text-primary">Data Boundary & Synchronization Notice</h4>
        </div>

        <p className="text-2xs text-secondary leading-relaxed">
          NEXUS is currently operating in <strong className="text-primary">Local Storage Only</strong> mode. Cloud Synchronization is planned for upcoming releases. All browsing history, cookies, bookmarks, workspace notes, and todo items remain strictly isolated to this physical device.
        </p>

        <div className="text-3xs text-secondary/80 bg-surface-hover/50 p-2.5 rounded-lg border border-subtle flex items-start gap-2">
          <ShieldCheck size={13} className="text-accent shrink-0 mt-0.5" />
          <span>
            <strong>Data Safety Guarantee:</strong> Signing out will terminate your authenticated online session, but will <em>never</em> alter or delete your local browsing data or active tabs.
          </span>
        </div>
      </div>
    </div>
  );
};
