import http from 'http';
import url from 'url';
import crypto from 'crypto';
import { shell } from 'electron';
import {
  AccountDeletionResult,
  AccountSession,
  AccountUpdatePayload,
  AuthResponse,
  NexusAccount,
  PasswordResetRequest,
  SignInCredentials,
  SignUpCredentials,
} from '../shared/types';
import { AuthProvider } from './account-manager';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  redirectPort?: number;
}

/**
 * Generates a high-entropy PKCE Code Verifier (RFC 7636).
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Computes SHA-256 Code Challenge from Verifier (RFC 7636).
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Production-ready Supabase Auth Provider with OAuth 2.0 PKCE loopback server.
 */
export class SupabaseAuthProvider implements AuthProvider {
  public name = 'Supabase';
  private supabaseUrl: string;
  private anonKey: string;
  private redirectPort: number;

  private currentTokens: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  } = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };

  private activeOAuthServer: http.Server | null = null;

  constructor(config?: Partial<SupabaseConfig>) {
    const rawUrl =
      config?.supabaseUrl ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      '';
    const rawKey =
      config?.supabaseAnonKey ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    this.supabaseUrl = rawUrl.trim().replace(/\/+$/, '');
    this.anonKey = rawKey.trim();
    this.redirectPort =
      config?.redirectPort ||
      Number(process.env.NEXUS_AUTH_REDIRECT_PORT) ||
      42427;
  }

  public isConfigured(): boolean {
    if (!this.supabaseUrl || !this.anonKey) return false;
    if (this.supabaseUrl.includes('your-project-ref')) return false;
    if (this.anonKey.includes('example_key')) return false;
    return this.supabaseUrl.startsWith('https://') || this.supabaseUrl.startsWith('http://localhost');
  }

  public getTokens() {
    return { ...this.currentTokens };
  }

  public setTokens(tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }) {
    this.currentTokens.accessToken = tokens.accessToken;
    if (tokens.refreshToken) this.currentTokens.refreshToken = tokens.refreshToken;
    if (tokens.expiresIn) {
      this.currentTokens.expiresAt = Date.now() + tokens.expiresIn * 1000;
    }
  }

  /**
   * Helper to execute Supabase Auth REST calls
   */
  private async authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const fullUrl = `${this.supabaseUrl}/auth/v1${endpoint}`;
    const headers: Record<string, string> = {
      'apikey': this.anonKey,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.currentTokens.accessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.currentTokens.accessToken}`;
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMsg = data?.error_description || data?.msg || data?.message || data?.error || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  }

  /**
   * Translates Supabase Auth User object into a canonical NexusAccount.
   */
  private mapSupabaseUserToAccount(user: any): NexusAccount {
    const meta = user.user_metadata || {};
    const appMeta = user.app_metadata || {};

    let provider: 'email' | 'google' | 'apple' = 'email';
    const rawProvider = (appMeta.provider || (appMeta.providers && appMeta.providers[0]) || '').toLowerCase();
    if (rawProvider.includes('google')) provider = 'google';
    else if (rawProvider.includes('apple')) provider = 'apple';

    const displayName =
      meta.full_name ||
      meta.name ||
      meta.display_name ||
      (user.email ? user.email.split('@')[0] : 'NEXUS User');

    return {
      id: user.id,
      email: user.email || '',
      displayName,
      avatarUrl: meta.avatar_url || meta.picture || undefined,
      isEmailVerified: Boolean(user.email_confirmed_at || user.confirmed_at),
      createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
      lastLoginAt: user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : Date.now(),
      provider,
      authProviderId: user.id,
    };
  }

  /**
   * Email Sign In
   */
  public async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Authentication provider is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to connect your backend.',
      };
    }

    try {
      const data = await this.authFetch('/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });

      this.setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      });

      const account = this.mapSupabaseUserToAccount(data.user);
      const isVerified = account.isEmailVerified;

      const session: AccountSession = {
        account,
        isAuthenticated: true,
        isConfigured: true,
        providerName: this.name,
        status: isVerified ? 'authenticated' : 'verification-pending',
        syncStatus: 'idle',
        lastSyncedAt: Date.now(),
      };

      return {
        success: true,
        session,
        account,
        requiresVerification: !isVerified,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to sign in. Please verify your email and password.',
      };
    }
  }

  /**
   * Email Sign Up
   */
  public async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Registration is unavailable because no backend is configured. Provide Supabase credentials in .env to enable registration.',
      };
    }

    try {
      const data = await this.authFetch('/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
          data: {
            full_name: credentials.displayName.trim(),
          },
        }),
      });

      const user = data.user || data;
      if (data.access_token) {
        this.setTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        });
      }

      const account = this.mapSupabaseUserToAccount(user);
      const requiresVerification = !account.isEmailVerified;

      const session: AccountSession = {
        account,
        isAuthenticated: Boolean(data.access_token),
        isConfigured: true,
        providerName: this.name,
        status: requiresVerification ? 'verification-pending' : 'authenticated',
        syncStatus: 'idle',
      };

      return {
        success: true,
        account,
        session,
        requiresVerification,
        message: requiresVerification
          ? 'Registration successful. A verification link has been sent to your email.'
          : 'Registration successful. You are now signed in.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to create account.',
      };
    }
  }

  /**
   * OAuth 2.0 PKCE Flow (Google & Apple)
   */
  public async signInWithOAuth(provider: 'google' | 'apple'): Promise<AuthResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: `Sign-in with ${provider === 'google' ? 'Google' : 'Apple'} requires a configured Supabase backend. Please configure .env.`,
      };
    }

    // Cancel any previous server
    if (this.activeOAuthServer) {
      try {
        this.activeOAuthServer.close();
      } catch {}
      this.activeOAuthServer = null;
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const redirectUri = `http://127.0.0.1:${this.redirectPort}/callback`;

    return new Promise<AuthResponse>((resolve) => {
      let resolved = false;

      const finish = (result: AuthResponse) => {
        if (resolved) return;
        resolved = true;
        if (this.activeOAuthServer) {
          try {
            this.activeOAuthServer.close();
          } catch {}
          this.activeOAuthServer = null;
        }
        resolve(result);
      };

      // 3-minute timeout for user to complete OAuth
      const timeoutTimer = setTimeout(() => {
        finish({
          success: false,
          error: 'Authentication request timed out. Please try signing in again.',
        });
      }, 180000);

      const server = http.createServer(async (req, res) => {
        try {
          const parsedUrl = url.parse(req.url || '', true);
          if (parsedUrl.pathname !== '/callback') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
          }

          const query = parsedUrl.query;
          const authCode = (query.code as string) || '';
          const authError = (query.error_description as string) || (query.error as string) || '';

          if (authError || !authCode) {
            clearTimeout(timeoutTimer);
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(this.renderCallbackHtml(false, authError || 'Authentication was cancelled.'));
            finish({
              success: false,
              error: authError || 'Authentication cancelled by user.',
            });
            return;
          }

          // Exchange auth code for tokens via PKCE
          const tokenData = await this.authFetch('/token?grant_type=pkce', {
            method: 'POST',
            body: JSON.stringify({
              auth_code: authCode,
              code_verifier: codeVerifier,
            }),
          });

          clearTimeout(timeoutTimer);

          this.setTokens({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
          });

          const account = this.mapSupabaseUserToAccount(tokenData.user);
          account.provider = provider;

          // Apple first login detection: If Apple provided user profile in query
          if (provider === 'apple' && query.user) {
            try {
              const appleUser = JSON.parse(query.user as string);
              if (appleUser?.name?.firstName || appleUser?.name?.lastName) {
                const fullName = `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim();
                if (fullName) {
                  account.displayName = fullName;
                  await this.updateProfile(account, { displayName: fullName });
                }
              }
            } catch {}
          }

          const session: AccountSession = {
            account,
            isAuthenticated: true,
            isConfigured: true,
            providerName: this.name,
            status: 'authenticated',
            syncStatus: 'idle',
            lastSyncedAt: Date.now(),
          };

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderCallbackHtml(true, 'Authentication successful! You can now close this tab.'));

          finish({
            success: true,
            account,
            session,
            message: `Successfully signed in with ${provider === 'google' ? 'Google' : 'Apple'}.`,
          });
        } catch (err: any) {
          clearTimeout(timeoutTimer);
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderCallbackHtml(false, err.message || 'Token exchange failed'));
          finish({
            success: false,
            error: err.message || 'Failed to exchange authorization code for tokens.',
          });
        }
      });

      server.on('error', (err: any) => {
        clearTimeout(timeoutTimer);
        finish({
          success: false,
          error: `Could not start local authorization listener on port ${this.redirectPort}: ${err.message}`,
        });
      });

      server.listen(this.redirectPort, '127.0.0.1', () => {
        this.activeOAuthServer = server;

        // Construct Supabase OAuth authorization URL
        const authUrl = `${this.supabaseUrl}/auth/v1/authorize?provider=${provider}&code_challenge=${codeChallenge}&code_challenge_method=s256&redirect_to=${encodeURIComponent(redirectUri)}`;

        // Open user's default system browser for secure authentication
        shell.openExternal(authUrl).catch((err) => {
          clearTimeout(timeoutTimer);
          finish({
            success: false,
            error: `Failed to open system browser: ${err.message}`,
          });
        });
      });
    });
  }

  /**
   * Sign Out
   */
  public async signOut(): Promise<void> {
    if (this.currentTokens.accessToken) {
      try {
        await this.authFetch('/logout', { method: 'POST' });
      } catch {}
    }
    this.currentTokens = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
  }

  /**
   * Request Password Reset
   */
  public async requestPasswordReset(req: PasswordResetRequest): Promise<AuthResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Password recovery is unavailable because no backend is configured.',
      };
    }

    try {
      await this.authFetch('/recover', {
        method: 'POST',
        body: JSON.stringify({ email: req.email.trim() }),
      });
      return {
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been sent.',
      };
    } catch (err: any) {
      // Privacy-preserving error suppression
      return {
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been sent.',
      };
    }
  }

  /**
   * Resend Verification Email
   */
  public async resendVerificationEmail(email: string): Promise<AuthResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Verification emails are unavailable because no backend is configured.',
      };
    }

    try {
      await this.authFetch('/resend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'signup',
          email: email.trim(),
        }),
      });
      return {
        success: true,
        message: 'A new verification link has been sent to your email address.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to resend verification email.',
      };
    }
  }

  /**
   * Update Profile
   */
  public async updateProfile(account: NexusAccount, payload: AccountUpdatePayload): Promise<AuthResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Backend is not configured.' };
    }

    try {
      // Update in Supabase Auth user metadata
      const updateBody: any = { data: {} };
      if (payload.displayName) updateBody.data.full_name = payload.displayName.trim();
      if (payload.avatarUrl) updateBody.data.avatar_url = payload.avatarUrl;

      const user = await this.authFetch('/user', {
        method: 'PUT',
        body: JSON.stringify(updateBody),
      });

      const updatedAccount = this.mapSupabaseUserToAccount(user);
      return {
        success: true,
        account: updatedAccount,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to update profile.',
      };
    }
  }

  /**
   * Safe Account Deletion
   * Purges all cloud records owned by the authenticated user in PostgreSQL
   */
  public async deleteAccount(): Promise<AccountDeletionResult> {
    if (!this.isConfigured() || !this.currentTokens.accessToken) {
      return { success: false, error: 'Not authenticated or backend unavailable.' };
    }

    try {
      // Call Postgres RPC function public.delete_user_account()
      const rpcUrl = `${this.supabaseUrl}/rest/v1/rpc/delete_user_account`;
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.currentTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || `HTTP ${res.status} during account purge`);
      }

      await this.signOut();

      return {
        success: true,
        message: 'Your account and all synchronized cloud records have been permanently deleted.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to delete account on backend.',
      };
    }
  }

  /**
   * Helper to render liquid-glass styled browser callback page.
   */
  private renderCallbackHtml(success: boolean, message: string): string {
    const title = success ? 'Authentication Successful' : 'Authentication Failed';
    const accent = success ? '#A78BFA' : '#EF4444';
    const icon = success ? '✓' : '✕';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} — NEXUS Browser</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0B0D12;
      color: #E2E8F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(18, 20, 29, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(167, 139, 250, 0.15);
      backdrop-filter: blur(16px);
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(167, 139, 250, 0.12);
      border: 2px solid ${accent};
      color: ${accent};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      margin: 0 auto 20px auto;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      color: #F8FAFC;
    }
    p {
      font-size: 14px;
      color: #94A3B8;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      font-size: 12px;
      color: #CBD5E1;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="badge">You can close this tab and return to NEXUS Browser</div>
  </div>
  <script>
    setTimeout(function() {
      try { window.close(); } catch(e) {}
    }, 3000);
  </script>
</body>
</html>`;
  }
}
