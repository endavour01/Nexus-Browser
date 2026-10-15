import { BrowserWindow, safeStorage, app } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  AccountSession,
  AccountUpdatePayload,
  AuthResponse,
  NexusAccount,
  PasswordResetRequest,
  SignInCredentials,
  SignUpCredentials,
} from '../shared/types';

/**
 * Interface that all external or local authentication providers must implement.
 */
export interface AuthProvider {
  name: string;
  isConfigured(): boolean;
  signIn(credentials: SignInCredentials): Promise<AuthResponse>;
  signUp(credentials: SignUpCredentials): Promise<AuthResponse>;
  signOut(): Promise<void>;
  requestPasswordReset(req: PasswordResetRequest): Promise<AuthResponse>;
  resendVerificationEmail(email: string): Promise<AuthResponse>;
  updateProfile(account: NexusAccount, payload: AccountUpdatePayload): Promise<AuthResponse>;
  restoreSession?(): Promise<AccountSession | null>;
}

/**
 * Standard RFC-5322 compliant email validator.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  if (clean.length < 5 || clean.length > 254) return false;
  // Standard robust email pattern
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(clean);
}

/**
 * Enforces strong, production-grade password rules:
 * - Minimum 8 characters
 * - Contains at least one letter
 * - Contains at least one digit
 */
export function validatePasswordRules(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one number' };
  }
  return { valid: true };
}

/**
 * Default provider when no external authentication backend is wired.
 * Honestly informs the user and developer that authentication is unconfigured.
 */
export class UnconfiguredAuthProvider implements AuthProvider {
  public name = 'None';

  public isConfigured(): boolean {
    return false;
  }

  public async signIn(_credentials: SignInCredentials): Promise<AuthResponse> {
    return {
      success: false,
      error:
        'Authentication provider is not configured. Connect a supported authentication service (Supabase, Firebase, or custom OIDC) to enable online accounts.',
    };
  }

  public async signUp(_credentials: SignUpCredentials): Promise<AuthResponse> {
    return {
      success: false,
      error:
        'Account registration is currently unavailable because no authentication backend is configured.',
    };
  }

  public async signOut(): Promise<void> {
    // No-op
  }

  public async requestPasswordReset(_req: PasswordResetRequest): Promise<AuthResponse> {
    return {
      success: false,
      error:
        'Password recovery is unavailable because no authentication backend is configured.',
    };
  }

  public async resendVerificationEmail(_email: string): Promise<AuthResponse> {
    return {
      success: false,
      error:
        'Verification emails are unavailable because no authentication backend is configured.',
    };
  }

  public async updateProfile(_account: NexusAccount, _payload: AccountUpdatePayload): Promise<AuthResponse> {
    return {
      success: false,
      error: 'Profile updates require an active authentication provider.',
    };
  }
}

/**
 * In-memory Mock Provider for automated tests and development verification.
 */
export class MockAuthProvider implements AuthProvider {
  public name = 'NEXUS Test Provider';
  private users: Map<string, { account: NexusAccount; passwordHash: string }> = new Map();
  private pendingVerifications: Set<string> = new Set();

  public isConfigured(): boolean {
    return true;
  }

  public async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    const email = credentials.email.trim().toLowerCase();
    if (this.users.has(email)) {
      return { success: false, error: 'An account with this email address already exists' };
    }

    const now = Date.now();
    const account: NexusAccount = {
      id: `acc_${now}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      displayName: credentials.displayName.trim() || email.split('@')[0],
      isEmailVerified: false,
      createdAt: now,
      lastLoginAt: now,
    };

    // Stored only in-memory in mock test provider
    this.users.set(email, { account, passwordHash: 'mock_hashed_' + credentials.password });
    this.pendingVerifications.add(email);

    return {
      success: true,
      account,
      requiresVerification: true,
      message: 'Registration successful. Please verify your email address to complete setup.',
      session: {
        account,
        isAuthenticated: true,
        isConfigured: true,
        providerName: this.name,
        status: 'verification-pending',
      },
    };
  }

  public async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    const email = credentials.email.trim().toLowerCase();
    const user = this.users.get(email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (user.passwordHash !== 'mock_hashed_' + credentials.password) {
      return { success: false, error: 'Invalid email or password' };
    }

    user.account.lastLoginAt = Date.now();
    const isPending = this.pendingVerifications.has(email);

    return {
      success: true,
      account: user.account,
      session: {
        account: user.account,
        isAuthenticated: true,
        isConfigured: true,
        providerName: this.name,
        status: isPending ? 'verification-pending' : 'authenticated',
      },
    };
  }

  public async signOut(): Promise<void> {
    // In-memory cleanup
  }

  public async requestPasswordReset(req: PasswordResetRequest): Promise<AuthResponse> {
    // Privacy-preserving: Always return success message regardless of whether email exists
    return {
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been sent.',
    };
  }

  public async resendVerificationEmail(email: string): Promise<AuthResponse> {
    const clean = email.trim().toLowerCase();
    if (!this.users.has(clean)) {
      return { success: false, error: 'Account not found' };
    }
    return {
      success: true,
      message: 'A new verification link has been sent to your email address.',
    };
  }

  public async updateProfile(account: NexusAccount, payload: AccountUpdatePayload): Promise<AuthResponse> {
    const user = this.users.get(account.email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Account not found' };
    }

    if (payload.displayName !== undefined) {
      user.account.displayName = payload.displayName.trim();
    }
    if (payload.avatarUrl !== undefined) {
      user.account.avatarUrl = payload.avatarUrl;
    }

    return {
      success: true,
      account: { ...user.account },
    };
  }

  // Test Helper: Manually mark email verified
  public verifyEmailForTesting(email: string) {
    const clean = email.trim().toLowerCase();
    const user = this.users.get(clean);
    if (user) {
      user.account.isEmailVerified = true;
      this.pendingVerifications.delete(clean);
    }
  }
}

/**
 * Main Process Account & Session Manager
 */
export class AccountManager {
  private mainWindow: BrowserWindow | null = null;
  private provider: AuthProvider;
  private sessionFilePath: string;
  private currentSession: AccountSession = {
    account: null,
    isAuthenticated: false,
    isConfigured: false,
    status: 'unconfigured',
  };

  constructor(customStorageDir?: string, mainWindow?: BrowserWindow | null, provider?: AuthProvider) {
    this.mainWindow = mainWindow || null;

    let baseDir = customStorageDir;
    if (!baseDir) {
      try {
        baseDir = app.getPath('userData');
      } catch {
        baseDir = path.join(process.cwd(), '.nexus-data');
      }
    }

    this.sessionFilePath = path.join(baseDir, 'nexus-account-session.bin');

    // Select provider: Custom injected -> Mock if test env -> Unconfigured by default
    if (provider) {
      this.provider = provider;
    } else if (process.env.NEXUS_USE_MOCK_AUTH === '1' || process.env.NODE_ENV === 'test') {
      this.provider = new MockAuthProvider();
    } else {
      this.provider = new UnconfiguredAuthProvider();
    }

    this.updateStatus();
    this.restoreSession();
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public setProvider(provider: AuthProvider) {
    this.provider = provider;
    this.updateStatus();
    this.notifyRenderer();
  }

  public getProvider(): AuthProvider {
    return this.provider;
  }

  private updateStatus() {
    const isConfigured = this.provider.isConfigured();
    this.currentSession.isConfigured = isConfigured;
    this.currentSession.providerName = this.provider.name;
    if (!this.currentSession.isAuthenticated) {
      this.currentSession.status = isConfigured ? 'unauthenticated' : 'unconfigured';
    }
  }

  public getSession(): AccountSession {
    return { ...this.currentSession };
  }

  public async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!credentials.password || credentials.password.length === 0) {
      return { success: false, error: 'Password cannot be empty' };
    }

    const res = await this.provider.signIn(credentials);
    if (res.success && res.session) {
      this.currentSession = res.session;
      this.persistSession();
      this.notifyRenderer();
    }
    return res;
  }

  public async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const pwdCheck = validatePasswordRules(credentials.password);
    if (!pwdCheck.valid) {
      return { success: false, error: pwdCheck.reason };
    }

    if (!credentials.displayName || credentials.displayName.trim().length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters long' };
    }

    const res = await this.provider.signUp(credentials);
    if (res.success && res.session) {
      this.currentSession = res.session;
      this.persistSession();
      this.notifyRenderer();
    }
    return res;
  }

  public async signOut(): Promise<{ success: boolean }> {
    try {
      await this.provider.signOut();
    } catch (e) {
      console.warn('[AccountManager] Provider sign-out error:', e);
    }

    // Clear session state in memory
    this.currentSession = {
      account: null,
      isAuthenticated: false,
      isConfigured: this.provider.isConfigured(),
      providerName: this.provider.name,
      status: this.provider.isConfigured() ? 'unauthenticated' : 'unconfigured',
    };

    // Remove persisted session token
    this.clearPersistedSession();

    // Broadcast immediate sign-out to renderer
    this.notifyRenderer();

    // Preserve 100% of local bookmarks, history, notes, and browser profile data!
    return { success: true };
  }

  public async requestPasswordReset(req: PasswordResetRequest): Promise<AuthResponse> {
    if (!isValidEmail(req.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    return await this.provider.requestPasswordReset(req);
  }

  public async resendVerificationEmail(): Promise<AuthResponse> {
    if (!this.currentSession.account?.email) {
      return { success: false, error: 'No active account session to verify' };
    }
    return await this.provider.resendVerificationEmail(this.currentSession.account.email);
  }

  public async updateProfile(payload: AccountUpdatePayload): Promise<AuthResponse> {
    if (!this.currentSession.account) {
      return { success: false, error: 'Not authenticated' };
    }

    if (payload.displayName !== undefined && payload.displayName.trim().length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters' };
    }

    const res = await this.provider.updateProfile(this.currentSession.account, payload);
    if (res.success && res.account) {
      this.currentSession.account = res.account;
      this.persistSession();
      this.notifyRenderer();
    }
    return res;
  }

  private persistSession() {
    if (!this.currentSession.account || !this.currentSession.isAuthenticated) {
      this.clearPersistedSession();
      return;
    }

    try {
      const dir = path.dirname(this.sessionFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const payload = JSON.stringify(this.currentSession);
      // Use Electron's safeStorage (OS Keychain / DPAPI) when available
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(payload);
        fs.writeFileSync(this.sessionFilePath, encrypted);
      } else {
        // Fallback for headless testing environments where OS keychain is unavailable
        const encoded = Buffer.from(payload, 'utf8').toString('base64');
        fs.writeFileSync(this.sessionFilePath, encoded, 'utf8');
      }
    } catch (err) {
      console.warn('[AccountManager] Could not persist session safely:', err);
    }
  }

  private restoreSession() {
    try {
      if (!fs.existsSync(this.sessionFilePath)) return;

      let rawString = '';
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        const encrypted = fs.readFileSync(this.sessionFilePath);
        rawString = safeStorage.decryptString(encrypted);
      } else {
        const encoded = fs.readFileSync(this.sessionFilePath, 'utf8');
        rawString = Buffer.from(encoded, 'base64').toString('utf8');
      }

      const parsed: AccountSession = JSON.parse(rawString);
      if (parsed && parsed.account && parsed.isAuthenticated) {
        this.currentSession = {
          ...parsed,
          isConfigured: this.provider.isConfigured(),
          providerName: this.provider.name,
        };
      }
    } catch (err) {
      console.warn('[AccountManager] Failed to restore session from storage:', err);
      this.clearPersistedSession();
    }
  }

  private clearPersistedSession() {
    try {
      if (fs.existsSync(this.sessionFilePath)) {
        fs.unlinkSync(this.sessionFilePath);
      }
    } catch {}
  }

  private notifyRenderer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('account:updated', this.getSession());
    }
  }
}
