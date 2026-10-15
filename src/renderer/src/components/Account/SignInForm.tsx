import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { Button, Input } from '../ui';
import { AccountSession, SignInCredentials } from '@shared/types';

interface SignInFormProps {
  onSuccess?: (session: AccountSession) => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  isProviderConfigured?: boolean;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSuccess,
  onForgotPassword,
  onCreateAccount,
  isProviderConfigured = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Email is required');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setEmailError('Please enter a valid email address');
        valid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      if (!window.nexusAPI?.signInAccount) {
        setGeneralError('Account services are not accessible in this environment.');
        return;
      }

      const credentials: SignInCredentials = {
        email: email.trim(),
        password,
      };

      const res = await window.nexusAPI.signInAccount(credentials);

      if (res.success && res.session) {
        onSuccess?.(res.session);
      } else {
        setGeneralError(res.error || 'Failed to sign in. Please verify your credentials.');
        // User-entered email is deliberately preserved for retry
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'An unexpected error occurred while contacting the authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="nexus-account-form space-y-4" noValidate>
      {!isProviderConfigured && (
        <div className="nexus-account-notice" role="status">
          <AlertCircle size={15} className="text-amber-400 shrink-0" />
          <div className="text-2xs leading-relaxed">
            <span className="font-semibold text-primary block mb-0.5">Authentication Provider Not Configured</span>
            <span className="text-secondary">
              NEXUS is currently operating in local-only mode. Live authentication requires connecting a supported auth provider.
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

      <div className="space-y-1">
        <label className="nexus-account-label" htmlFor="nexus-signin-email">
          Email Address
        </label>
        <Input
          id="nexus-signin-email"
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

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="nexus-account-label" htmlFor="nexus-signin-password">
            Password
          </label>
          <button
            type="button"
            className="text-3xs text-accent hover:underline font-medium transition-colors"
            onClick={onForgotPassword}
            tabIndex={0}
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="nexus-signin-password"
          type={showPassword ? 'text' : 'password'}
          size="md"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
          }}
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              className="nexus-password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          error={passwordError || undefined}
          disabled={isSubmitting}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        isLoading={isSubmitting}
        rightIcon={<ArrowRight size={14} />}
      >
        Sign In
      </Button>

      <div className="text-center pt-2 border-t border-subtle">
        <span className="text-2xs text-secondary">
          Don&apos;t have a NEXUS Account?{' '}
          <button
            type="button"
            className="text-accent font-semibold hover:underline transition-colors"
            onClick={onCreateAccount}
          >
            Create an Account
          </button>
        </span>
      </div>
    </form>
  );
};
