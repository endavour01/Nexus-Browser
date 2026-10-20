/**
 * NEXUS AI Browser Assistant — Agent Core Orchestrator
 * Controls the observation-prompt-validate-execute loop with strict step limits,
 * zero-password prompt guarantees, allowlist enforcement, and instant cancellation.
 */

import { BrowserWindow } from 'electron';
import {
  AgentAction,
  AgentStatusResponse,
  AgentStepLog,
  AgentTaskState,
  ConfirmationRequest,
} from '../../shared/types';
import { TabManager } from '../tab-manager';
import { AIModelProvider, OllamaProvider } from './model-provider';
import { AGENT_SYSTEM_PROMPT, parseAndValidateAction } from './action-schema';
import { CredentialStore } from './credential-store';
import { DOMObserver, PageObservation } from './dom-observer';
import { SafetyClassifier, SafetyEvaluation } from './safety-classifier';
import { AllowlistManager } from './allowlist-manager';
import { Executor } from './executor';

export interface AgentCoreOptions {
  modelProvider?: AIModelProvider;
  credentialStore?: CredentialStore;
  allowlistManager?: AllowlistManager;
  maxSteps?: number;
}

export class AgentCore {
  private mainWindow: BrowserWindow;
  private tabManager: TabManager;
  private modelProvider: AIModelProvider;
  private credentialStore: CredentialStore;
  private allowlistManager: AllowlistManager;

  private state: AgentTaskState = 'idle';
  private currentTask: string = '';
  private activeTabId: string | null = null;
  private stepCount: number = 0;
  private maxSteps: number = 25;
  private lastError?: string;
  private stepLogs: AgentStepLog[] = [];

  private abortController: AbortController | null = null;
  private isStopped: boolean = false;

  // Pending user response resolvers
  private pendingConfirmationResolver: ((approved: boolean) => void) | null = null;
  private pendingUserInputResolver: ((response: string) => void) | null = null;
  private pendingAllowlistResolver: ((approved: boolean) => void) | null = null;

  // Event callbacks
  private onStepLoggedCallbacks: Set<(log: AgentStepLog) => void> = new Set();
  private onConfirmationCallbacks: Set<(req: ConfirmationRequest) => void> = new Set();
  private onAskUserCallbacks: Set<(data: { question: string }) => void> = new Set();
  private onStatusCallbacks: Set<(status: AgentStatusResponse) => void> = new Set();

  constructor(mainWindow: BrowserWindow, tabManager: TabManager, options: AgentCoreOptions = {}) {
    this.mainWindow = mainWindow;
    this.tabManager = tabManager;
    this.modelProvider = options.modelProvider || new OllamaProvider();
    this.credentialStore = options.credentialStore || new CredentialStore();
    this.allowlistManager = options.allowlistManager || new AllowlistManager();
    this.maxSteps = options.maxSteps ?? 25;
  }

  public setModelProvider(provider: AIModelProvider) {
    this.modelProvider = provider;
  }

  public getModelProvider(): AIModelProvider {
    return this.modelProvider;
  }

  public getCredentialStore(): CredentialStore {
    return this.credentialStore;
  }

  public getAllowlistManager(): AllowlistManager {
    return this.allowlistManager;
  }

  public getStatus(): AgentStatusResponse {
    let currentUrl: string | undefined;
    if (this.activeTabId) {
      const state = this.tabManager.getTabState(this.activeTabId);
      currentUrl = state?.url;
    }

    return {
      state: this.state,
      currentTask: this.currentTask || undefined,
      stepCount: this.stepCount,
      maxSteps: this.maxSteps,
      activeTabId: this.activeTabId || undefined,
      currentUrl,
      lastError: this.lastError,
    };
  }

  public getLogs(): AgentStepLog[] {
    return [...this.stepLogs];
  }

  private setState(newState: AgentTaskState, error?: string) {
    this.state = newState;
    if (error) this.lastError = error;
    this.emitStatus();
  }

  private emitStatus() {
    const status = this.getStatus();
    this.onStatusCallbacks.forEach((cb) => {
      try {
        cb(status);
      } catch {}
    });
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('agent:statusChanged', status);
    }
  }

  private emitStepLog(log: AgentStepLog) {
    this.stepLogs.push(log);
    this.onStepLoggedCallbacks.forEach((cb) => {
      try {
        cb(log);
      } catch {}
    });
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('agent:stepLogged', log);
    }
  }

  public onStepLogged(cb: (log: AgentStepLog) => void): () => void {
    this.onStepLoggedCallbacks.add(cb);
    return () => this.onStepLoggedCallbacks.delete(cb);
  }

  public onConfirmationRequested(cb: (req: ConfirmationRequest) => void): () => void {
    this.onConfirmationCallbacks.add(cb);
    return () => this.onConfirmationCallbacks.delete(cb);
  }

  public onAskUser(cb: (data: { question: string }) => void): () => void {
    this.onAskUserCallbacks.add(cb);
    return () => this.onAskUserCallbacks.delete(cb);
  }

  public onStatusChanged(cb: (status: AgentStatusResponse) => void): () => void {
    this.onStatusCallbacks.add(cb);
    return () => this.onStatusCallbacks.delete(cb);
  }

  /**
   * Starts a new single-task execution in a new tab.
   */
  public async startTask(task: string, initialUrl?: string): Promise<{ success: boolean; error?: string }> {
    if (this.state !== 'idle' && this.state !== 'completed' && this.state !== 'stopped' && this.state !== 'error') {
      return { success: false, error: 'Agent is already running a task. Stop the current task first.' };
    }

    const trimmedTask = task.trim();
    if (!trimmedTask) {
      return { success: false, error: 'Task description cannot be empty.' };
    }

    this.currentTask = trimmedTask;
    this.stepCount = 0;
    this.stepLogs = [];
    this.lastError = undefined;
    this.isStopped = false;
    this.abortController = new AbortController();

    // Create a new dedicated tab for this task
    const startUrl = initialUrl || 'about:blank';
    this.activeTabId = this.tabManager.createTab(startUrl, true);
    if (!this.activeTabId) {
      this.setState('error', 'Failed to create dedicated tab for assistant task.');
      return { success: false, error: 'Failed to create tab' };
    }

    // Run the agent loop asynchronously
    this.runLoop().catch((err) => {
      console.error('[AgentCore] Unhandled loop error:', err);
      this.setState('error', err.message);
    });

    return { success: true };
  }

  /**
   * Immediately stops the running agent task at any step.
   */
  public stop(): { success: boolean } {
    this.isStopped = true;
    if (this.abortController) {
      this.abortController.abort();
    }

    // Cancel any pending resolvers
    if (this.pendingConfirmationResolver) {
      this.pendingConfirmationResolver(false);
      this.pendingConfirmationResolver = null;
    }
    if (this.pendingAllowlistResolver) {
      this.pendingAllowlistResolver(false);
      this.pendingAllowlistResolver = null;
    }
    if (this.pendingUserInputResolver) {
      this.pendingUserInputResolver('Task stopped by user.');
      this.pendingUserInputResolver = null;
    }

    this.setState('stopped', 'Task stopped by user.');
    return { success: true };
  }

  public confirmAction(approved: boolean): { success: boolean } {
    if (this.pendingConfirmationResolver) {
      const resolve = this.pendingConfirmationResolver;
      this.pendingConfirmationResolver = null;
      resolve(approved);
      return { success: true };
    }
    return { success: false };
  }

  public replyToUser(response: string): { success: boolean } {
    if (this.pendingUserInputResolver) {
      const resolve = this.pendingUserInputResolver;
      this.pendingUserInputResolver = null;
      resolve(response);
      return { success: true };
    }
    return { success: false };
  }

  public approveSite(site: string): { success: boolean } {
    this.allowlistManager.allowSite(site);
    if (this.pendingAllowlistResolver) {
      const resolve = this.pendingAllowlistResolver;
      this.pendingAllowlistResolver = null;
      resolve(true);
      return { success: true };
    }
    return { success: true };
  }

  /**
   * Main execution loop: Observe -> Allowlist -> 2FA/CAPTCHA -> Prompt -> Validate -> Confirm -> Execute -> Log.
   */
  private async runLoop() {
    while (!this.isStopped && this.stepCount < this.maxSteps) {
      this.stepCount++;

      if (!this.activeTabId) {
        this.setState('error', 'Target tab lost.');
        return;
      }

      const view = this.tabManager.getView(this.activeTabId);
      if (!view || !view.webContents || view.webContents.isDestroyed()) {
        this.setState('error', 'Web contents for active tab is not available.');
        return;
      }
      const wc = view.webContents;

      // 1. Observe Page
      this.setState('observing');
      let observation: PageObservation;
      try {
        observation = await DOMObserver.observe(wc);
      } catch (err: any) {
        this.setState('error', `Failed to observe page: ${err.message}`);
        return;
      }

      if (this.isStopped) return;

      // 2. Allowlist Check
      const currentUrl = observation.url;
      if (currentUrl && !currentUrl.startsWith('about:') && !currentUrl.startsWith('nexus://') && !currentUrl.startsWith('file://')) {
        const isAllowed = this.allowlistManager.isAllowed(currentUrl);
        if (!isAllowed) {
          this.setState('waiting_allowlist');
          const hostname = this.allowlistManager.normalizeHostname(currentUrl);
          
          const approved = await new Promise<boolean>((resolve) => {
            this.pendingAllowlistResolver = resolve;
            if (!this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('agent:allowlistRequested', {
                site: hostname,
                url: currentUrl,
                step: this.stepCount,
              });
            }
          });

          if (this.isStopped) return;
          if (!approved) {
            this.setState('stopped', `Interaction with site "${hostname}" was denied by user.`);
            return;
          }
        }
      }

      // 3. Detect 2FA or CAPTCHA Challenge on Page
      const challengeCheck = SafetyClassifier.detect2FAOrCaptcha(observation.url, observation.elements);
      if (challengeCheck.is2FAorCaptcha) {
        this.setState('waiting_user_input');
        const userPrompt = challengeCheck.reason || 'Security verification required. Please solve it and click Continue.';
        
        await new Promise<string>((resolve) => {
          this.pendingUserInputResolver = resolve;
          this.onAskUserCallbacks.forEach((cb) => cb({ question: userPrompt }));
          if (!this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('agent:askUser', { question: userPrompt });
          }
        });

        if (this.isStopped) return;
        // Re-observe after user solves puzzle
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      // 4. Build Model Prompt with Credentials Placeholders
      this.setState('thinking');
      const prompt = this.buildPrompt(observation);

      // Verify zero-password prompt leakage
      const secretCheck = this.credentialStore.containsAnySecret(prompt);
      if (secretCheck.leaked) {
        this.setState('error', `FATAL SAFETY VIOLATION: A decrypted password for ${secretCheck.site} leaked into the prompt. Halting execution.`);
        return;
      }

      // 5. Ask Model with Strict JSON Schema and up to 2 Retries
      let validAction: AgentAction | null = null;
      let lastModelError: string | null = null;
      let retriesLeft = 2;
      let currentPrompt = prompt;

      while (retriesLeft >= 0 && !this.isStopped) {
        let rawOutput: string;
        try {
          rawOutput = await this.modelProvider.generateAction(currentPrompt, undefined, {
            signal: this.abortController?.signal,
          });
        } catch (err: any) {
          if (this.isStopped) return;
          this.setState('error', `Model provider error: ${err.message}`);
          return;
        }

        if (this.isStopped) return;

        const validation = parseAndValidateAction(rawOutput);
        if (validation.valid && validation.action) {
          validAction = validation.action;
          break;
        } else {
          lastModelError = validation.error || 'Unknown schema error';
          retriesLeft--;
          if (retriesLeft >= 0) {
            currentPrompt = `${prompt}\n\n[ERROR: Your previous response was invalid: "${lastModelError}". You must respond ONLY with a valid JSON action matching the schema.]`;
          }
        }
      }

      if (this.isStopped) return;

      if (!validAction) {
        this.setState('error', `Model output failed schema validation after 2 retries: ${lastModelError}`);
        return;
      }

      // 6. Handle Ask User Action
      if (validAction.action === 'ask_user') {
        this.setState('waiting_user_input');
        const question = validAction.question || 'Please provide input:';
        
        const userReply = await new Promise<string>((resolve) => {
          this.pendingUserInputResolver = resolve;
          this.onAskUserCallbacks.forEach((cb) => cb({ question }));
          if (!this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('agent:askUser', { question });
          }
        });

        if (this.isStopped) return;

        this.emitStepLog({
          step: this.stepCount,
          timestamp: Date.now(),
          action: validAction,
          targetDescription: `Question: ${question}`,
          status: 'success',
        });
        continue;
      }

      // 7. Check Consequential Safety Classification
      const targetElement = validAction.elementId
        ? observation.elements.find((e) => e.id === validAction!.elementId)
        : undefined;

      const safety = SafetyClassifier.evaluate(
        validAction,
        targetElement,
        observation.url,
        observation.elements
      );

      if (safety.requiresConfirmation) {
        this.setState('waiting_confirmation');
        const req: ConfirmationRequest = {
          step: this.stepCount,
          action: validAction,
          reason: safety.reason || 'This action may submit or modify data.',
          dangerLevel: safety.dangerLevel,
          targetSummary: targetElement ? `[${targetElement.id}] ${targetElement.tag}: "${targetElement.label}"` : (validAction.url || validAction.action),
        };

        const approved = await new Promise<boolean>((resolve) => {
          this.pendingConfirmationResolver = resolve;
          this.onConfirmationCallbacks.forEach((cb) => cb(req));
          if (!this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('agent:confirmationRequested', req);
          }
        });

        if (this.isStopped) return;

        if (!approved) {
          this.emitStepLog({
            step: this.stepCount,
            timestamp: Date.now(),
            action: validAction,
            targetDescription: req.targetSummary,
            status: 'cancelled',
            error: 'User declined to confirm action.',
          });
          this.setState('stopped', 'Action cancelled by user.');
          return;
        }
      }

      // 8. Execute Action
      this.setState('executing');
      const executor = new Executor(wc, this.credentialStore);
      const result = await executor.execute(validAction, observation.elements);

      if (this.isStopped) return;

      // Sanitize action for logging (replace any accidental raw text with placeholder representation)
      const sanitizedAction: AgentAction = { ...validAction };
      if (sanitizedAction.text && result.substitutedSecret) {
        sanitizedAction.text = '•••••••• (Credential substituted)';
      }

      this.emitStepLog({
        step: this.stepCount,
        timestamp: Date.now(),
        action: sanitizedAction,
        targetDescription: targetElement ? `[${targetElement.id}] ${targetElement.tag}: "${targetElement.label}"` : (validAction.url || validAction.action),
        status: result.success ? 'success' : 'failed',
        error: result.error,
      });

      if (!result.success) {
        // If an execution fails, don't necessarily crash the whole task: allow model to re-observe next loop,
        // but if repeated or fatal, exit.
        console.warn(`[AgentCore] Step ${this.stepCount} execution failed:`, result.error);
      }

      // 9. Check Finish Condition
      if (validAction.action === 'finish') {
        this.setState('completed');
        return;
      }

      // Brief delay between steps to allow visual rendering
      await new Promise((r) => setTimeout(r, 600));
    }

    if (this.stepCount >= this.maxSteps && this.state !== 'completed') {
      this.setState('error', `Step limit of ${this.maxSteps} reached without task completion.`);
    }
  }

  private buildPrompt(observation: PageObservation): string {
    const placeholders = this.credentialStore.getAvailablePlaceholders();
    const credsSection =
      placeholders.length > 0
        ? `Available Credentials (Use these exact placeholder tags, NEVER try to guess passwords):\n${placeholders.map((p) => `  - ${p}`).join('\n')}`
        : 'Available Credentials: None saved.';

    const recentLogs = this.stepLogs.slice(-4);
    const historySection =
      recentLogs.length > 0
        ? `Recent Actions Performed:\n${recentLogs
            .map(
              (l) =>
                `  - Step ${l.step}: ${l.action.action} (${l.targetDescription || ''}) -> ${l.status}`
            )
            .join('\n')}`
        : 'Recent Actions: None yet. This is the first step.';

    return `${AGENT_SYSTEM_PROMPT}

====================================================
TASK TO ACCOMPLISH:
"${this.currentTask}"
====================================================

CURRENT STEP: ${this.stepCount} / ${this.maxSteps}

${credsSection}

${historySection}

CURRENT BROWSER STATE:
${observation.formattedSummary}

Decide the next action and return ONLY a JSON object:`;
  }
}
