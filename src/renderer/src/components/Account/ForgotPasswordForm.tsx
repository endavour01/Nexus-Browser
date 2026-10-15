import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import { Button, Input } from '../ui';
import { PasswordResetRequest } from '@shared/types';

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
  isProviderConfigured?: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToSignIn,
  isProviderConfigured = false,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setEmailError(null);
    setGeneralError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!window.nexusAPI?.requestPasswordReset) {
        setGeneralError('Password recovery services are not accessible.');
        return;
      }

      const req: PasswordResetRequest = { email: cleanEmail };
      const res = await window.nexusAPI.requestPasswordReset(req);

      if (res.success) {
        setIsSent(true);
      } else {
        setGeneralError(res.error || 'Failed to dispatch password recovery request.');
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'An unexpected error occurred during password recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="nexus-account-success-view text-center space-y-4 py-2">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle size={24} />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-primary">Instructions Dispatched</h3>
          <p className="text-2xs text-secondary leading-relaxed max-w-sm mx-auto">
            If an account is associated with <span className="font-mono text-primary font-medium">{email}</span>, password reset instructions have been dispatched. Please check your inbox and spam folder.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => setIsSent(false)}
          >
            Resend Email
          </Button>

          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onBackToSignIn}
            leftIcon={<ArrowLeft size={13} />}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="nexus-account-form space-y-4" noValidate>
      {!isProviderConfigured && (
        <div className="nexus-account-notice" role="status">
          <AlertCircle size={15} className="text-amber-400 shrink-0" />
          <div className="text-2xs leading-relaxed">
            <span className="font-semibold text-primary block mb-0.5">Password Recovery Unavailable</span>
            <span className="text-secondary">
              Password recovery requires an active online authentication provider.
            </span>
          </div>
        </div>
      )}

      {generalError && (
        <div className="nexus-account-error-banner" role="alert">
          <AlertCircle size={14} className="shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      <p className="text-2xs text-secondary leading-relaxed">
        Enter the email address linked to your NEXUS Account. We will send a secure link to reset your credentials.
      </p>

      <div className="space-y-1">
        <label className="nexus-account-label" htmlFor="nexus-forgot-email">
          Account Email Address
        </label>
        <Input
          id="nexus-forgot-email"
          type="email"
          size="md"
          placeholder="name@example.com"
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          leftIcon={<Mail size={15} />}
          error={emailError || undefined}
          disabled={isSubmitting}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        isLoading={isSubmitting}
        rightIcon={<Send size={13} />}
      >
        Send Reset Link
      </Button>

      <div className="text-center pt-2 border-t border-subtle">
        <button
          type="button"
          className="text-2xs text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5"
          onClick={onBackToSignIn}
        >
          <ArrowLeft size={12} />
          <span>Back to Sign In</span>
        </button>
      </div>
    </form>
  );
};
