import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button, Input } from '../ui';
import { AccountSession, SignUpCredentials } from '@shared/types';

interface SignUpFormProps {
  onSuccess: (session: AccountSession, requiresVerification: boolean) => void;
  onSignIn: () => void;
  isProviderConfigured?: boolean;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onSignIn,
  isProviderConfigured = false,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Password rules evaluation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const validate = (): boolean => {
    let valid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
    setTermsError(null);
    setGeneralError(null);

    const cleanName = displayName.trim();
    if (!cleanName) {
      setNameError('Display name is required');
      valid = false;
    } else if (cleanName.length < 2) {
      setNameError('Display name must be at least 2 characters');
      valid = false;
    }

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
    } else if (!hasMinLength || !hasLetter || !hasNumber) {
      setPasswordError('Password must meet all complexity requirements');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    if (!agreeTerms) {
      setTermsError('You must agree to the Terms of Service & Privacy Policy');
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
      if (!window.nexusAPI?.signUpAccount) {
        setGeneralError('Account services are not accessible in this environment.');
        return;
      }

      const credentials: SignUpCredentials = {
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        agreedToTerms: agreeTerms,
      };

      const res = await window.nexusAPI.signUpAccount(credentials);

      if (res.success && res.session) {
        onSuccess(res.session, !!res.requiresVerification);
      } else {
        setGeneralError(res.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'An unexpected error occurred during account creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="nexus-account-form space-y-3.5" noValidate>
      {!isProviderConfigured && (
        <div className="nexus-account-notice" role="status">
          <AlertCircle size={15} className="text-amber-400 shrink-0" />
          <div className="text-2xs leading-relaxed">
            <span className="font-semibold text-primary block mb-0.5">Authentication Provider Not Configured</span>
            <span className="text-secondary">
              Account registration requires a connected authentication backend. Local browser features continue to operate normally without an account.
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
        <label className="nexus-account-label" htmlFor="nexus-signup-name">
          Display Name
        </label>
        <Input
          id="nexus-signup-name"
          type="text"
          size="md"
          placeholder="e.g. Alex Vance"
          autoFocus
          autoComplete="name"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (nameError) setNameError(null);
          }}
          leftIcon={<User size={15} />}
          error={nameError || undefined}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label className="nexus-account-label" htmlFor="nexus-signup-email">
          Email Address
        </label>
        <Input
          id="nexus-signup-email"
          type="email"
          size="md"
          placeholder="name@example.com"
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
        <label className="nexus-account-label" htmlFor="nexus-signup-password">
          Password
        </label>
        <Input
          id="nexus-signup-password"
          type={showPassword ? 'text' : 'password'}
          size="md"
          placeholder="••••••••"
          autoComplete="new-password"
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

        {/* Real-time Password Strength Criteria */}
        <div className="nexus-password-rules-box" aria-live="polite">
          <div className={`nexus-rule-item ${hasMinLength ? 'met' : ''}`}>
            <CheckCircle2 size={11} className={hasMinLength ? 'text-emerald-400' : 'text-muted'} />
            <span>At least 8 characters</span>
          </div>
          <div className={`nexus-rule-item ${hasLetter ? 'met' : ''}`}>
            <CheckCircle2 size={11} className={hasLetter ? 'text-emerald-400' : 'text-muted'} />
            <span>Contains a letter</span>
          </div>
          <div className={`nexus-rule-item ${hasNumber ? 'met' : ''}`}>
            <CheckCircle2 size={11} className={hasNumber ? 'text-emerald-400' : 'text-muted'} />
            <span>Contains a number</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="nexus-account-label" htmlFor="nexus-signup-confirm">
          Confirm Password
        </label>
        <Input
          id="nexus-signup-confirm"
          type={showPassword ? 'text' : 'password'}
          size="md"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmError) setConfirmError(null);
          }}
          leftIcon={<Lock size={15} />}
          error={confirmError || undefined}
          disabled={isSubmitting}
        />
      </div>

      {/* Terms Agreement */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer text-2xs text-secondary">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (termsError) setTermsError(null);
            }}
            className="rounded border-subtle text-accent mt-0.5 focus:ring-0"
            disabled={isSubmitting}
          />
          <span>
            I agree to the NEXUS{' '}
            <span className="text-primary hover:underline">Terms of Service</span> and{' '}
            <span className="text-primary hover:underline">Privacy Policy</span>.
          </span>
        </label>
        {termsError && <div className="text-3xs text-rose-400 mt-1">{termsError}</div>}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        isLoading={isSubmitting}
        rightIcon={<ArrowRight size={14} />}
      >
        Create Account
      </Button>

      <div className="text-center pt-2 border-t border-subtle">
        <span className="text-2xs text-secondary">
          Already have an account?{' '}
          <button
            type="button"
            className="text-accent font-semibold hover:underline transition-colors"
            onClick={onSignIn}
          >
            Sign In
          </button>
        </span>
      </div>
    </form>
  );
};
