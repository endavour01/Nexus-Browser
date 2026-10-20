/**
 * NEXUS AI Browser Assistant — Consequential Action Safety Classifier
 * Determines whether a pending browser action requires explicit user confirmation
 * before execution, detecting form submissions, payments, messaging, account changes,
 * and 2FA/CAPTCHA challenges.
 */

import { AgentAction } from '../../shared/types';
import { ObservedElement } from './dom-observer';

export interface SafetyEvaluation {
  requiresConfirmation: boolean;
  reason?: string;
  dangerLevel: 'low' | 'high';
  is2FAorCaptcha?: boolean;
  category?: 'form_submit' | 'payment' | 'messaging' | 'account_change' | 'security_2fa' | 'captcha';
}

export class SafetyClassifier {
  /**
   * Evaluates if a given action and its target element require confirmation.
   */
  public static evaluate(
    action: AgentAction,
    targetElement?: ObservedElement,
    pageUrl?: string,
    allElements?: ObservedElement[]
  ): SafetyEvaluation {
    // 1. Check if the page itself presents a 2FA or CAPTCHA challenge
    const captchaCheck = this.detect2FAOrCaptcha(pageUrl, allElements);
    if (captchaCheck.is2FAorCaptcha) {
      return captchaCheck;
    }

    // 2. Navigation, scroll, wait are non-destructive
    if (action.action === 'scroll' || action.action === 'wait' || action.action === 'finish') {
      return { requiresConfirmation: false, dangerLevel: 'low' };
    }

    // 3. Navigate is safe unless pointing to external destructive triggers
    if (action.action === 'navigate') {
      const url = (action.url || '').toLowerCase();
      if (url.includes('delete') || url.includes('unsubscribe') || url.includes('logout') || url.includes('signout')) {
        return {
          requiresConfirmation: true,
          reason: `Navigation to potentially consequential URL: "${action.url}"`,
          dangerLevel: 'low',
          category: 'account_change',
        };
      }
      return { requiresConfirmation: false, dangerLevel: 'low' };
    }

    // 4. Pressing Enter inside a form can submit the form
    if (action.action === 'press_key') {
      if (action.key?.toLowerCase() === 'enter') {
        return {
          requiresConfirmation: true,
          reason: 'Pressing Enter may submit form data.',
          dangerLevel: 'low',
          category: 'form_submit',
        };
      }
      return { requiresConfirmation: false, dangerLevel: 'low' };
    }

    // 5. Clicks and interactions with specific elements
    if (action.action === 'click' && targetElement) {
      const text = `${targetElement.label} ${targetElement.placeholder || ''} ${targetElement.type || ''}`.toLowerCase();
      const url = (pageUrl || '').toLowerCase();

      // Payments & Purchases
      if (/pay|checkout|purchase|buy now|place order|subscribe|charge|confirm payment|send money/i.test(text)) {
        return {
          requiresConfirmation: true,
          reason: `Financial or payment action detected on element: "${targetElement.label || targetElement.tag}"`,
          dangerLevel: 'high',
          category: 'payment',
        };
      }

      // Deleting account / altering core credentials
      if (/delete account|close account|erase data|remove user|deactivate|change password|reset password/i.test(text)) {
        return {
          requiresConfirmation: true,
          reason: `Account deletion or credential modification detected: "${targetElement.label || targetElement.tag}"`,
          dangerLevel: 'high',
          category: 'account_change',
        };
      }

      // Security and 2FA modifications
      if (/two-factor|2fa|mfa|authenticator app|backup codes|revoke access/i.test(text)) {
        return {
          requiresConfirmation: true,
          reason: `Security or 2FA settings change detected: "${targetElement.label || targetElement.tag}"`,
          dangerLevel: 'high',
          category: 'security_2fa',
        };
      }

      // Sending messages or emails
      if (/send message|compose message|send email|post comment|publish|submit review|dispatch/i.test(text)) {
        return {
          requiresConfirmation: true,
          reason: `Outbound message or email dispatch detected: "${targetElement.label || targetElement.tag}"`,
          dangerLevel: 'low',
          category: 'messaging',
        };
      }

      // General Form Submission (Login, Register, Save, Apply, Submit)
      if (
        targetElement.isSubmit ||
        targetElement.type === 'submit' ||
        /submit|sign in|log in|log on|register|sign up|save changes|update settings|confirm/i.test(text)
      ) {
        return {
          requiresConfirmation: true,
          reason: `Form submission detected: "${targetElement.label || 'Submit Button'}" on ${pageUrl || 'current page'}`,
          dangerLevel: 'low',
          category: 'form_submit',
        };
      }
    }

    // 6. Typing credentials or sensitive values into a field
    if (action.action === 'type' && targetElement) {
      // Typing text into a password field or submitting credentials
      if (targetElement.type === 'password' && action.text?.includes('{{cred:')) {
        // Typing credential placeholder is safe, but model will need to submit later
        return { requiresConfirmation: false, dangerLevel: 'low' };
      }
    }

    return { requiresConfirmation: false, dangerLevel: 'low' };
  }

  /**
   * Detects if the current page contains a 2FA or CAPTCHA challenge that requires user attention.
   */
  public static detect2FAOrCaptcha(pageUrl?: string, elements?: ObservedElement[]): SafetyEvaluation {
    const url = (pageUrl || '').toLowerCase();
    if (url.includes('recaptcha') || url.includes('hcaptcha') || url.includes('challenge') || url.includes('turnstile')) {
      return {
        requiresConfirmation: true,
        reason: 'CAPTCHA challenge detected in page URL. Please complete the verification.',
        dangerLevel: 'high',
        is2FAorCaptcha: true,
        category: 'captcha',
      };
    }

    if (!elements || elements.length === 0) {
      return { requiresConfirmation: false, dangerLevel: 'low' };
    }

    for (const el of elements) {
      const text = `${el.label} ${el.placeholder || ''}`.toLowerCase();
      if (/captcha|recaptcha|hcaptcha|robot|turnstile/i.test(text)) {
        return {
          requiresConfirmation: true,
          reason: 'CAPTCHA or verification puzzle detected on page. Please solve it manually.',
          dangerLevel: 'high',
          is2FAorCaptcha: true,
          category: 'captcha',
        };
      }
      if (/2fa code|two-factor code|authenticator code|sms code|verification code|one-time code|otp/i.test(text)) {
        return {
          requiresConfirmation: true,
          reason: 'Two-Factor Authentication (2FA/OTP) code requested. Please enter your code.',
          dangerLevel: 'high',
          is2FAorCaptcha: true,
          category: 'security_2fa',
        };
      }
    }

    return { requiresConfirmation: false, dangerLevel: 'low' };
  }
}
