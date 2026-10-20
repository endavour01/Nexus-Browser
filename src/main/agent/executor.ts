/**
 * NEXUS AI Browser Assistant — Action Executor
 * Translates model actions into real input events via Electron webContents.sendInputEvent
 * with fallback to executeJavaScript. Safely substitutes credential placeholders
 * strictly in memory immediately before typing.
 */

import { WebContents } from 'electron';
import { AgentAction } from '../../shared/types';
import { ObservedElement } from './dom-observer';
import { CredentialStore } from './credential-store';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  substitutedSecret?: boolean;
}

export class Executor {
  private wc: WebContents;
  private credentialStore: CredentialStore;

  constructor(wc: WebContents, credentialStore: CredentialStore) {
    this.wc = wc;
    this.credentialStore = credentialStore;
  }

  public async execute(action: AgentAction, elements: ObservedElement[]): Promise<ExecutionResult> {
    if (this.wc.isDestroyed()) {
      return { success: false, error: 'Target web contents is destroyed' };
    }

    try {
      switch (action.action) {
        case 'navigate':
          return await this.executeNavigate(action.url!);

        case 'click':
          return await this.executeClick(action.elementId!, elements);

        case 'type':
          return await this.executeType(action.elementId!, action.text || '', elements);

        case 'press_key':
          return await this.executePressKey(action.key!);

        case 'scroll':
          return await this.executeScroll(action.direction || 'down', action.amount || 300);

        case 'wait':
          return await this.executeWait(action.durationMs || 1000);

        case 'ask_user':
        case 'finish':
          return { success: true };

        default:
          return { success: false, error: `Unsupported action type: ${(action as any).action}` };
      }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  private async executeNavigate(url: string): Promise<ExecutionResult> {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !/^nexus:\/\//i.test(finalUrl) && !/^file:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    await this.wc.loadURL(finalUrl);
    // Wait brief grace period for initial DOM paint
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true };
  }

  private async executeClick(elementId: number, elements: ObservedElement[]): Promise<ExecutionResult> {
    const el = elements.find((e) => e.id === elementId);
    if (!el) {
      return { success: false, error: `Element [${elementId}] not found in observed page elements.` };
    }

    try {
      // 1. Primary: Real coordinate-based input event
      this.wc.sendInputEvent({
        type: 'mouseDown',
        x: el.x,
        y: el.y,
        button: 'left',
        clickCount: 1,
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      this.wc.sendInputEvent({
        type: 'mouseUp',
        x: el.x,
        y: el.y,
        button: 'left',
        clickCount: 1,
      });

      // 2. Secondary fallback via executeJavaScript click to ensure event handlers fire
      await this.wc.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-nexus-agent-id="${elementId}"]');
          if (el) {
            el.focus();
            if (typeof el.click === 'function') {
              el.click();
            }
          }
        })()
      `).catch(() => {});

      await new Promise((resolve) => setTimeout(resolve, 400));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Failed to click element [${elementId}]: ${err.message}` };
    }
  }

  private async executeType(
    elementId: number,
    text: string,
    elements: ObservedElement[]
  ): Promise<ExecutionResult> {
    const el = elements.find((e) => e.id === elementId);
    if (!el) {
      return { success: false, error: `Target element [${elementId}] not found for typing.` };
    }

    // Substitute credential placeholders in memory right before typing
    const { substitutedText, hadSecret } = this.credentialStore.substitutePlaceholders(text);

    try {
      // 1. Focus element
      this.wc.sendInputEvent({
        type: 'mouseDown',
        x: el.x,
        y: el.y,
        button: 'left',
        clickCount: 1,
      });
      this.wc.sendInputEvent({
        type: 'mouseUp',
        x: el.x,
        y: el.y,
        button: 'left',
        clickCount: 1,
      });

      await this.wc.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-nexus-agent-id="${elementId}"]');
          if (el) {
            el.focus();
            if ('select' in el && typeof el.select === 'function') {
              el.select();
            }
          }
        })()
      `).catch(() => {});

      await new Promise((resolve) => setTimeout(resolve, 50));

      // 2. Type characters via real input events
      for (const char of substitutedText) {
        this.wc.sendInputEvent({
          type: 'char',
          keyCode: char,
        });
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      // 3. Fallback: also ensure value is set directly and triggers input/change events
      const safeJsValue = JSON.stringify(substitutedText);
      await this.wc.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-nexus-agent-id="${elementId}"]');
          if (el) {
            if ('value' in el) {
              el.value = ${safeJsValue};
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        })()
      `).catch(() => {});

      await new Promise((resolve) => setTimeout(resolve, 150));
      return { success: true, substitutedSecret: hadSecret };
    } catch (err: any) {
      return { success: false, error: `Failed to type into element [${elementId}]: ${err.message}` };
    }
  }

  private async executePressKey(key: string): Promise<ExecutionResult> {
    try {
      const keyCode = key.trim();
      this.wc.sendInputEvent({ type: 'keyDown', keyCode });
      await new Promise((resolve) => setTimeout(resolve, 30));
      this.wc.sendInputEvent({ type: 'keyUp', keyCode });

      // Fallback for Enter in form
      if (keyCode.toLowerCase() === 'enter') {
        await this.wc.executeJavaScript(`
          (() => {
            const active = document.activeElement;
            if (active && active.form) {
              const submitBtn = active.form.querySelector('[type="submit"]') || active.form.querySelector('button');
              if (submitBtn) {
                submitBtn.click();
              } else if (typeof active.form.requestSubmit === 'function') {
                active.form.requestSubmit();
              }
            }
          })()
        `).catch(() => {});
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Failed to press key "${key}": ${err.message}` };
    }
  }

  private async executeScroll(direction: 'up' | 'down', amount: number): Promise<ExecutionResult> {
    const deltaY = direction === 'down' ? amount : -amount;
    await this.wc.executeJavaScript(`
      window.scrollBy({ top: ${deltaY}, behavior: 'smooth' });
    `).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true };
  }

  private async executeWait(durationMs: number): Promise<ExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, Math.min(durationMs, 10000)));
    return { success: true };
  }
}
