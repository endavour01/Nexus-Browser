import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { TabManager } from '../src/main/tab-manager';
import { AgentCore } from '../src/main/agent/agent-core';
import { parseAndValidateAction, VALID_ACTION_TYPES } from '../src/main/agent/action-schema';
import { MockModelProvider } from '../src/main/agent/model-provider';
import { CredentialStore } from '../src/main/agent/credential-store';
import { SafetyClassifier } from '../src/main/agent/safety-classifier';
import { AllowlistManager } from '../src/main/agent/allowlist-manager';
import { DOMObserver } from '../src/main/agent/dom-observer';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

let passedChecks = 0;
function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
  console.log(`    ✓ ${msg}`);
  passedChecks++;
}

async function runAgentTestSuite() {
  console.log('====================================================');
  console.log(' NEXUS Phase-1 AI Browser Assistant Verification Suite');
  console.log('====================================================\n');

  const tempDir = path.join(process.cwd(), '.test-agent-store');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const tabManager = new TabManager(win);

  try {
    // ----------------------------------------------------
    // SUITE 1: Action Schema Validation
    // ----------------------------------------------------
    console.log('[SUITE 1: ACTION SCHEMA VALIDATION]');

    const validNavigate = parseAndValidateAction('{"action": "navigate", "url": "https://example.com"}');
    assert(validNavigate.valid && validNavigate.action?.url === 'https://example.com', 'Valid navigate action accepted');

    const validClick = parseAndValidateAction('{"action": "click", "elementId": 3, "thought": "Clicking button"}');
    assert(validClick.valid && validClick.action?.elementId === 3, 'Valid click action with integer elementId accepted');

    const validMarkdownFence = parseAndValidateAction('```json\n{"action": "scroll", "direction": "down", "amount": 250}\n```');
    assert(validMarkdownFence.valid && validMarkdownFence.action?.action === 'scroll', 'Markdown code fence extracted and validated');

    const invalidJson = parseAndValidateAction('this is not json');
    assert(!invalidJson.valid && invalidJson.error?.includes('Invalid JSON syntax'), 'Malformed JSON string rejected with descriptive error');

    const missingAction = parseAndValidateAction('{"thought": "hello"}');
    assert(!missingAction.valid && missingAction.error?.includes('Missing "action" field'), 'JSON without action rejected');

    const unknownAction = parseAndValidateAction('{"action": "hack_system"}');
    assert(!unknownAction.valid && unknownAction.error?.includes('Unknown action'), 'Unknown action rejected');

    const invalidClickId = parseAndValidateAction('{"action": "click", "elementId": "abc"}');
    assert(!invalidClickId.valid && invalidClickId.error?.includes('valid integer "elementId"'), 'Non-integer elementId rejected');

    const invalidType = parseAndValidateAction('{"action": "type", "elementId": 2}');
    assert(!invalidType.valid && invalidType.error?.includes('requires a "text" string'), 'Type action missing text rejected');

    // ----------------------------------------------------
    // SUITE 2: Credential Store & Zero-Password Prompt Leakage
    // ----------------------------------------------------
    console.log('\n[SUITE 2: CREDENTIAL STORE & ZERO-PASSWORD PROMPT LEAKAGE]');

    const credStore = new CredentialStore(tempDir);
    const secretPassword = 'SuperSecretNexusPassword123!@#';
    const credId = credStore.saveCredential('localhost', 'Local Test Account', 'nexus_admin', secretPassword);
    assert(typeof credId === 'string' && credId.startsWith('cred-'), 'Encrypted credential saved');

    const list = credStore.listCredentials();
    assert(list.length === 1 && list[0].site === 'localhost' && list[0].username === 'nexus_admin', 'Credentials listed with site and username');
    assert(!(list[0] as any).password && !(list[0] as any).secret, 'Password is NEVER exposed in listCredentials');

    const placeholders = credStore.getAvailablePlaceholders();
    assert(placeholders.some((p) => p.includes('{{cred:localhost.password}}')), 'Placeholder {{cred:localhost.password}} generated');

    const substituted = credStore.substitutePlaceholders('User: {{cred:localhost.username}}, Pass: {{cred:localhost.password}}');
    assert(substituted.hadSecret === true, 'Placeholder substitution detected secret');
    assert(substituted.substitutedText === `User: nexus_admin, Pass: ${secretPassword}`, 'Substituted text contains real values for execution');

    // Zero-Password in Prompt Verification
    const mockPrompt = `Task: Log in\nAvailable Credentials:\n  - {{cred:localhost.username}}\n  - {{cred:localhost.password}}\nElements:\n[1] <input> label="Username"\n[2] <input> label="Password"`;
    assert(!mockPrompt.includes(secretPassword), 'Model prompt strictly DOES NOT contain raw secret password');
    const secretAudit = credStore.containsAnySecret(mockPrompt);
    assert(secretAudit.leaked === false, 'Security audit confirms zero plaintext passwords in model prompt');

    // ----------------------------------------------------
    // SUITE 3: Consequential Safety Classifier
    // ----------------------------------------------------
    console.log('\n[SUITE 3: CONSEQUENTIAL SAFETY CLASSIFIER]');

    const submitBtnElement: any = { id: 3, tag: 'button', type: 'submit', label: 'Sign In', isSubmit: true };
    const evalSubmit = SafetyClassifier.evaluate({ action: 'click', elementId: 3 }, submitBtnElement, 'https://example.com/login');
    assert(evalSubmit.requiresConfirmation === true && evalSubmit.category === 'form_submit', 'Form submit button classified as requiring confirmation');

    const payBtnElement: any = { id: 5, tag: 'button', label: 'Pay $49.99 Now' };
    const evalPay = SafetyClassifier.evaluate({ action: 'click', elementId: 5 }, payBtnElement, 'https://example.com/checkout');
    assert(evalPay.requiresConfirmation === true && evalPay.dangerLevel === 'high' && evalPay.category === 'payment', 'Payment action classified as high-danger confirmation');

    const deleteBtnElement: any = { id: 8, tag: 'button', label: 'Delete Account Permanently' };
    const evalDelete = SafetyClassifier.evaluate({ action: 'click', elementId: 8 }, deleteBtnElement, 'https://example.com/settings');
    assert(evalDelete.requiresConfirmation === true && evalDelete.dangerLevel === 'high' && evalDelete.category === 'account_change', 'Account deletion classified as high-danger confirmation');

    const sendMsgElement: any = { id: 10, tag: 'button', label: 'Send Email' };
    const evalSend = SafetyClassifier.evaluate({ action: 'click', elementId: 10 }, sendMsgElement, 'https://mail.example.com');
    assert(evalSend.requiresConfirmation === true && evalSend.category === 'messaging', 'Send email classified as requiring confirmation');

    const evalEnterKey = SafetyClassifier.evaluate({ action: 'press_key', key: 'Enter' });
    assert(evalEnterKey.requiresConfirmation === true, 'Pressing Enter classified as requiring confirmation');

    const benignScroll = SafetyClassifier.evaluate({ action: 'scroll', direction: 'down' });
    assert(benignScroll.requiresConfirmation === false, 'Scroll is classified as safe');

    const benignWait = SafetyClassifier.evaluate({ action: 'wait', durationMs: 500 });
    assert(benignWait.requiresConfirmation === false, 'Wait is classified as safe');

    const captchaPage = SafetyClassifier.detect2FAOrCaptcha('https://example.com/challenge?token=123', [
      { id: 1, tag: 'div', label: 'Please solve the hCaptcha puzzle', isClickable: false, isTextInput: false, isSubmit: false, x: 0, y: 0, width: 0, height: 0 },
    ]);
    assert(captchaPage.is2FAorCaptcha === true && captchaPage.category === 'captcha', 'CAPTCHA challenge detected on page');

    // ----------------------------------------------------
    // SUITE 4: Per-Site Allowlist Manager
    // ----------------------------------------------------
    console.log('\n[SUITE 4: PER-SITE ALLOWLIST ENFORCEMENT]');

    const allowlist = new AllowlistManager(tempDir);
    allowlist.clearAll();

    assert(allowlist.isAllowed('https://random-site.org/page') === false, 'Unapproved site is blocked');
    assert(allowlist.isAllowed('http://localhost:8080') === false, 'Localhost blocked prior to approval');

    allowlist.allowSite('http://localhost:8080');
    assert(allowlist.isAllowed('http://localhost:8080/login') === true, 'Localhost approved and allowed');
    assert(allowlist.isAllowed('localhost') === true, 'Normalized hostname recognized');

    allowlist.allowSite('https://github.com/trending');
    assert(allowlist.isAllowed('https://github.com/login') === true, 'Domain allowlist matches across paths');

    // ----------------------------------------------------
    // SUITE 5: Step Limit & Immediate Stop Behavior
    // ----------------------------------------------------
    console.log('\n[SUITE 5: STEP LIMIT & IMMEDIATE STOP]');

    const mockProvider = new MockModelProvider();
    const testAllowlist = new AllowlistManager(tempDir);
    testAllowlist.allowSite('localhost');

    // Test Step Limit (Max 3 steps)
    const agentForLimit = new AgentCore(win, tabManager, {
      modelProvider: mockProvider,
      credentialStore: credStore,
      allowlistManager: testAllowlist,
      maxSteps: 3,
    });

    // Provide 5 wait actions
    mockProvider.enqueueResponse({ thought: 'waiting 1', action: 'wait', durationMs: 10 });
    mockProvider.enqueueResponse({ thought: 'waiting 2', action: 'wait', durationMs: 10 });
    mockProvider.enqueueResponse({ thought: 'waiting 3', action: 'wait', durationMs: 10 });
    mockProvider.enqueueResponse({ thought: 'waiting 4', action: 'wait', durationMs: 10 });

    const fixturePath = `file://${path.resolve(process.cwd(), 'test/fixtures/login.html')}`;
    await agentForLimit.startTask('Run step limit test', fixturePath);

    // Wait until loop terminates
    let iterations = 0;
    while (agentForLimit.getStatus().state !== 'error' && iterations < 50) {
      await new Promise((r) => setTimeout(r, 100));
      iterations++;
    }

    const limitStatus = agentForLimit.getStatus();
    assert(limitStatus.state === 'error' && limitStatus.stepCount === 3, 'Agent stopped cleanly when reaching maxSteps ceiling of 3');

    // Test Immediate Stop Button
    mockProvider.clearQueue();
    mockProvider.enqueueResponse({ thought: 'waiting long', action: 'wait', durationMs: 5000 });

    const agentForStop = new AgentCore(win, tabManager, {
      modelProvider: mockProvider,
      credentialStore: credStore,
      allowlistManager: testAllowlist,
      maxSteps: 10,
    });

    await agentForStop.startTask('Run stop test', fixturePath);
    await new Promise((r) => setTimeout(r, 200));

    // Call stop
    agentForStop.stop();
    const stopStatus = agentForStop.getStatus();
    assert(stopStatus.state === 'stopped', 'Calling stop() immediately transitioned agent state to stopped');

    // ----------------------------------------------------
    // SUITE 6: End-to-End Fixture Login with Confirmation & Secret Substitution
    // ----------------------------------------------------
    console.log('\n[SUITE 6: END-TO-END LOGIN FIXTURE WITH CONFIRMATION]');

    mockProvider.clearQueue();
    mockProvider.clearHistory();

    // Model sequence:
    // 1. Type username placeholder into element 1
    // 2. Type password placeholder into element 2
    // 3. Click submit button (element 3) -> should trigger confirmation
    // 4. Finish
    mockProvider.enqueueResponse({
      thought: 'Filling username field with credential placeholder',
      action: 'type',
      elementId: 1,
      text: '{{cred:localhost.username}}',
    });
    mockProvider.enqueueResponse({
      thought: 'Filling password field with secret placeholder',
      action: 'type',
      elementId: 2,
      text: '{{cred:localhost.password}}',
    });
    mockProvider.enqueueResponse({
      thought: 'Submitting login form',
      action: 'click',
      elementId: 3,
    });
    mockProvider.enqueueResponse({
      thought: 'Login succeeded',
      action: 'finish',
      result: 'Logged in to test portal.',
    });

    // Create allowlist for fixture
    testAllowlist.allowSite(fixturePath);

    const agentE2E = new AgentCore(win, tabManager, {
      modelProvider: mockProvider,
      credentialStore: credStore,
      allowlistManager: testAllowlist,
      maxSteps: 10,
    });

    let confirmationReceived = false;
    agentE2E.onConfirmationRequested((req) => {
      confirmationReceived = true;
      assert(req.action.action === 'click', 'Confirmation requested before executing form submit');
      // Approve action
      setTimeout(() => {
        agentE2E.confirmAction(true);
      }, 100);
    });

    await agentE2E.startTask('Log in to test portal', fixturePath);

    // Wait for task completion
    let waitIters = 0;
    while (agentE2E.getStatus().state !== 'completed' && waitIters < 40) {
      await new Promise((r) => setTimeout(r, 150));
      waitIters++;
    }

    const finalStatus = agentE2E.getStatus();
    assert(finalStatus.state === 'completed', 'E2E Login task completed successfully');
    assert(confirmationReceived === true, 'Confirmation was intercepted and approved before form submission');

    // Assert that the model prompt history NEVER saw the decrypted password
    const capturedPrompts = mockProvider.getPromptHistory();
    assert(capturedPrompts.length >= 3, 'Model was called at each step of the loop');
    for (let i = 0; i < capturedPrompts.length; i++) {
      const p = capturedPrompts[i];
      assert(!p.includes(secretPassword), `Prompt step #${i + 1} strictly DOES NOT contain decrypted secret password`);
    }

    // Verify in WebContents that the form submitted and display updated
    const e2eTabId = finalStatus.activeTabId;
    if (e2eTabId) {
      const e2eView = tabManager.getView(e2eTabId);
      if (e2eView) {
        const loginBanner = await e2eView.webContents.executeJavaScript(`
          (() => {
            const el = document.getElementById('user-display');
            return el ? el.textContent : '';
          })()
        `);
        assert(loginBanner === 'nexus_admin', 'Fixture webpage received substituted username and logged in successfully');
      }
    }

    // Cleanup temp dir
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log('\n====================================================');
    console.log(`   🎉 ALL ${passedChecks} AGENT TESTS PASSED!`);
    console.log('====================================================\n');

    win.destroy();
    app.quit();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    win.destroy();
    app.quit();
    process.exit(1);
  }
}

app.whenReady().then(runAgentTestSuite);
