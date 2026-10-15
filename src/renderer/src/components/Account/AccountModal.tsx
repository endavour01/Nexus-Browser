import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Modal, Button } from '../ui';
import { NexusLogo } from '../NexusLogo';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { AccountProfileView } from './AccountProfileView';
import { AccountSession, NexusAccount, NexusBrowserMode } from '@shared/types';

export type AccountModalView =
  | 'sign-in'
  | 'sign-up'
  | 'forgot-password'
  | 'profile'
  | 'verification-pending';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AccountModalView;
  mode?: NexusBrowserMode;
  onSessionChange?: (session: AccountSession | null) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  initialView = 'sign-in',
  mode = 'default',
  onSessionChange,
}) => {
  const [view, setView] = useState<AccountModalView>(initialView);
  const [session, setSession] = useState<AccountSession | null>(null);
  const [isProviderConfigured, setIsProviderConfigured] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');

  // Load session & status on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingSession(true);

    const init = async () => {
      try {
        if (window.nexusAPI?.getAccountSession) {
          const res = await window.nexusAPI.getAccountSession();
          if (isMounted) {
            setSession(res);
            setIsProviderConfigured(!!res.isConfigured);
            if (res.account) {
              setView('profile');
            } else {
              setView(initialView === 'profile' ? 'sign-in' : initialView);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load account session:', err);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    init();

    // Listen to main process account updates
    const unsubscribe = window.nexusAPI?.onAccountUpdated?.((newSession) => {
      if (isMounted) {
        setSession(newSession);
        onSessionChange?.(newSession);
        if (newSession?.account) {
          setView('profile');
        } else {
          setView('sign-in');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [isOpen, initialView]);

  const handleSignInSuccess = (newSession: AccountSession) => {
    setSession(newSession);
    onSessionChange?.(newSession);
    setView('profile');
  };

  const handleSignUpSuccess = (newSession: AccountSession, requiresVerification: boolean) => {
    setSession(newSession);
    onSessionChange?.(newSession);
    if (requiresVerification) {
      setPendingVerificationEmail(newSession.account?.email || '');
      setView('verification-pending');
    } else {
      setView('profile');
    }
  };

  const handleSignOut = () => {
    setSession(null);
    onSessionChange?.(null);
    setView('sign-in');
  };

  const handleAccountUpdated = (updatedAccount: NexusAccount) => {
    if (session) {
      const updatedSession: AccountSession = { ...session, account: updatedAccount };
      setSession(updatedSession);
      onSessionChange?.(updatedSession);
    }
  };

  const getModalTitle = () => {
    switch (view) {
      case 'sign-up':
        return 'Create NEXUS Account';
      case 'forgot-password':
        return 'Account Recovery';
      case 'verification-pending':
        return 'Verification Pending';
      case 'profile':
        return 'NEXUS Identity & Account';
      case 'sign-in':
      default:
        return 'Sign In to NEXUS';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
          <NexusLogo mode={mode} size={20} />
          <span className="font-semibold text-sm tracking-tight text-primary">
            {getModalTitle()}
          </span>
        </div>
      }
    >
      <div className="nexus-account-modal-body py-1">
        {isLoadingSession ? (
          <div className="flex items-center justify-center py-12 text-secondary text-2xs">
            <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full mr-2.5" />
            Loading account services...
          </div>
        ) : (
          <>
            {view === 'sign-in' && (
              <SignInForm
                onSuccess={handleSignInSuccess}
                onForgotPassword={() => setView('forgot-password')}
                onCreateAccount={() => setView('sign-up')}
                isProviderConfigured={isProviderConfigured}
              />
            )}

            {view === 'sign-up' && (
              <SignUpForm
                onSuccess={handleSignUpSuccess}
                onSignIn={() => setView('sign-in')}
                isProviderConfigured={isProviderConfigured}
              />
            )}

            {view === 'forgot-password' && (
              <ForgotPasswordForm
                onBackToSignIn={() => setView('sign-in')}
                isProviderConfigured={isProviderConfigured}
              />
            )}

            {view === 'verification-pending' && (
              <div className="nexus-account-success-view text-center space-y-4 py-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Mail size={24} />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-primary">Check Your Email</h3>
                  <p className="text-2xs text-secondary leading-relaxed max-w-sm mx-auto">
                    We have dispatched a confirmation link to{' '}
                    <span className="font-mono text-primary font-semibold">
                      {pendingVerificationEmail || session?.account?.email}
                    </span>
                    . Please verify your address to finalize account setup.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => setView('profile')}
                  >
                    Continue to Profile
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => setView('sign-in')}
                    leftIcon={<ArrowLeft size={13} />}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            )}

            {view === 'profile' && (
              <AccountProfileView
                session={session}
                onSignOut={handleSignOut}
                onAccountUpdated={handleAccountUpdated}
                onOpenSignIn={() => setView('sign-in')}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
