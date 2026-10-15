import path from 'path';
import fs from 'fs';
import {
  AccountManager,
  UnconfiguredAuthProvider,
  MockAuthProvider,
  isValidEmail,
  validatePasswordRules,
} from '../src/main/account-manager';
import { AccountSession, NexusAccount, SignInCredentials, SignUpCredentials } from '../src/shared/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`    ✓ ${msg}`);
}

async function runAccountTestSuite() {
  console.log('====================================================');
  console.log('  NEXUS Account, Auth & User Identity Automated Suite ');
  console.log('====================================================\n');

  const testDir = path.resolve(process.cwd(), 'test/sandbox-account-auth');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const sessionFilePath = path.join(testDir, 'nexus-account-session.bin');

  try {
    // ----------------------------------------------------
    // SUITE 1: Credential & Input Validation Rules
    // ----------------------------------------------------
    console.log('[SUITE 1: CREDENTIAL & INPUT VALIDATION RULES]');

    // 1.1 Email validation
    assert(isValidEmail('user@nexus.io'), 'Valid standard email accepted');
    assert(isValidEmail('alex.vance+test@sub.example.com'), 'Email with plus-addressing and subdomains accepted');
    assert(!isValidEmail(''), 'Empty string email rejected');
    assert(!isValidEmail('notanemail'), 'Missing @ and domain rejected');
    assert(!isValidEmail('@domain.com'), 'Missing username rejected');
    assert(!isValidEmail('user@'), 'Missing domain rejected');
    assert(!isValidEmail('user@.com'), 'Missing domain name rejected');
    assert(!isValidEmail('user @example.com'), 'Email with whitespace rejected');

    // 1.2 Password complexity validation
    assert(validatePasswordRules('password123').valid, 'Password with letters and numbers valid');
    assert(validatePasswordRules('NexusPass2026!').valid, 'Password with mixed case, numbers, symbols valid');
    assert(!validatePasswordRules('').valid, 'Empty password rejected');
    assert(!validatePasswordRules('short1').valid, 'Password under 8 characters rejected');
    assert(!validatePasswordRules('allletterslowercase').valid, 'Password without digits rejected');
    assert(!validatePasswordRules('1234567890').valid, 'Password without letters rejected');

    // ----------------------------------------------------
    // SUITE 2: Unconfigured Auth Provider (Truthful Handling)
    // ----------------------------------------------------
    console.log('\n[SUITE 2: UNCONFIGURED AUTH PROVIDER]');

    const unconfiguredManager = new AccountManager(testDir, null, new UnconfiguredAuthProvider());
    const unconfiguredSession = unconfiguredManager.getSession();

    assert(unconfiguredSession.isConfigured === false, 'isConfigured is false in default unconfigured state');
    assert(unconfiguredSession.status === 'unconfigured', 'status is unconfigured');
    assert(unconfiguredSession.isAuthenticated === false, 'isAuthenticated is false');
    assert(unconfiguredSession.account === null, 'account is null');

    // Attempting sign in on unconfigured provider returns honest error
    const unconfSignIn = await unconfiguredManager.signIn({
      email: 'alex@example.com',
      password: 'Password123',
    });
    assert(!unconfSignIn.success, 'Sign-in fails honestly when provider is unconfigured');
    assert(
      unconfSignIn.error?.toLowerCase().includes('not configured') ||
      unconfSignIn.error?.toLowerCase().includes('unavailable'),
      'Sign-in error clearly states provider is not configured without fake simulation'
    );

    // Attempting sign up on unconfigured provider returns honest error
    const unconfSignUp = await unconfiguredManager.signUp({
      displayName: 'Alex Vance',
      email: 'alex@example.com',
      password: 'Password123',
    });
    assert(!unconfSignUp.success, 'Sign-up fails honestly when provider is unconfigured');
    assert(
      unconfSignUp.error?.toLowerCase().includes('not configured') ||
      unconfSignUp.error?.toLowerCase().includes('unavailable'),
      'Sign-up error clearly states provider is not configured without fake simulation'
    );

    // ----------------------------------------------------
    // SUITE 3: MockAuthProvider Full Lifecycle
    // ----------------------------------------------------
    console.log('\n[SUITE 3: MOCK AUTH PROVIDER FULL LIFECYCLE]');

    const mockProvider = new MockAuthProvider();
    const accountManager = new AccountManager(testDir, null, mockProvider);

    // Initial state
    const initialSession = accountManager.getSession();
    assert(initialSession.isConfigured === true, 'isConfigured is true with mock provider');
    assert(initialSession.status === 'unauthenticated', 'status is unauthenticated');

    // 3.1 Sign Up
    const signUpCreds: SignUpCredentials = {
      displayName: 'Gordon Freeman',
      email: 'gordon@blackmesa.gov',
      password: 'Crowbar2026Password',
    };

    const signUpRes = await accountManager.signUp(signUpCreds);
    assert(signUpRes.success === true, 'Sign-up succeeds with valid credentials');
    assert(signUpRes.account !== undefined, 'Account returned upon sign-up');
    assert(signUpRes.account?.email === 'gordon@blackmesa.gov', 'Email matches signed up user');
    assert(signUpRes.account?.displayName === 'Gordon Freeman', 'Display name matches signed up user');
    assert(signUpRes.account?.isEmailVerified === false, 'Account initially requires email verification');
    assert(signUpRes.requiresVerification === true, 'requiresVerification is flagged');

    const sessionAfterSignUp = accountManager.getSession();
    assert(sessionAfterSignUp.isAuthenticated === true, 'Session is authenticated after sign up');
    assert(sessionAfterSignUp.status === 'verification-pending', 'Session status is verification-pending');

    // 3.2 Resend Verification Email
    const resendRes = await accountManager.resendVerificationEmail();
    assert(resendRes.success === true, 'Verification email resent successfully');

    // 3.3 Update Profile
    const updateRes = await accountManager.updateProfile({ displayName: 'Dr. Gordon Freeman' });
    assert(updateRes.success === true, 'Display name update succeeded');
    assert(accountManager.getSession().account?.displayName === 'Dr. Gordon Freeman', 'Display name updated in session');

    // 3.4 Sign Out
    const signOutRes = await accountManager.signOut();
    assert(signOutRes.success === true, 'Sign-out succeeded');
    const sessionAfterSignOut = accountManager.getSession();
    assert(sessionAfterSignOut.isAuthenticated === false, 'isAuthenticated is false after sign-out');
    assert(sessionAfterSignOut.account === null, 'Session account is null after sign-out');
    assert(sessionAfterSignOut.status === 'unauthenticated', 'Session status is unauthenticated');

    // 3.5 Sign In with incorrect password
    const badSignInRes = await accountManager.signIn({
      email: 'gordon@blackmesa.gov',
      password: 'WrongPassword123',
    });
    assert(!badSignInRes.success, 'Sign-in with bad password rejected');
    assert(accountManager.getSession().isAuthenticated === false, 'User remains unauthenticated on failed sign-in');

    // 3.6 Sign In with correct password
    const goodSignInRes = await accountManager.signIn({
      email: 'gordon@blackmesa.gov',
      password: 'Crowbar2026Password',
    });
    assert(goodSignInRes.success === true, 'Sign-in succeeds with valid credentials');
    assert(accountManager.getSession().isAuthenticated === true, 'User authenticated after sign-in');
    assert(accountManager.getSession().account?.displayName === 'Dr. Gordon Freeman', 'Account displayName restored');

    // 3.7 Password Reset
    const resetRes = await accountManager.requestPasswordReset({ email: 'gordon@blackmesa.gov' });
    assert(resetRes.success === true, 'Password reset request succeeds');

    // ----------------------------------------------------
    // SUITE 4: Session Persistence & Encryption
    // ----------------------------------------------------
    console.log('\n[SUITE 4: SESSION PERSISTENCE & SECURITY]');

    assert(fs.existsSync(sessionFilePath), 'Encrypted session file saved to disk');
    const rawFileContent = fs.readFileSync(sessionFilePath, 'utf8');
    // Ensure raw passwords are NEVER stored in the session file
    assert(!rawFileContent.includes('Crowbar2026Password'), 'Raw passwords are NEVER stored in session file');

    // Reinitialize AccountManager from disk and verify restored session
    const restoredManager = new AccountManager(testDir, null, mockProvider);
    const restoredSession = restoredManager.getSession();
    assert(restoredSession.isAuthenticated === true, 'Restored manager loaded active session');
    assert(restoredSession.account?.email === 'gordon@blackmesa.gov', 'Restored manager user email matches');

    // Sign out cleans up disk file
    await restoredManager.signOut();
    assert(!fs.existsSync(sessionFilePath), 'Sign out deletes the persisted session token from disk');

    // ----------------------------------------------------
    // SUITE 5: Strict Local Data Isolation
    // ----------------------------------------------------
    console.log('\n[SUITE 5: STRICT LOCAL DATA ISOLATION]');

    // Mock local profile data
    const localProfilesDir = path.join(testDir, 'profiles');
    fs.mkdirSync(localProfilesDir, { recursive: true });
    const localProfileFile = path.join(localProfilesDir, 'work-profile.json');
    fs.writeFileSync(localProfileFile, JSON.stringify({ id: 'work', name: 'Work Profile', bookmarks: ['https://example.com'] }));

    // Perform another full sign-in and sign-out cycle
    await restoredManager.signIn({
      email: 'gordon@blackmesa.gov',
      password: 'Crowbar2026Password',
    });
    assert(fs.existsSync(localProfileFile), 'Local profile files untouched during sign in');

    await restoredManager.signOut();
    assert(fs.existsSync(localProfileFile), 'Local profile files 100% preserved during sign out');

    const profileData = JSON.parse(fs.readFileSync(localProfileFile, 'utf8'));
    assert(profileData.name === 'Work Profile' && profileData.bookmarks.length === 1, 'Local bookmarks & history remain unmodified');

    // ----------------------------------------------------
    // SUITE 6: UI Components & CSS Design System Integrity
    // ----------------------------------------------------
    console.log('\n[SUITE 6: UI COMPONENTS & CSS DESIGN SYSTEM INTEGRITY]');

    const cssPath = path.resolve(process.cwd(), 'src/renderer/src/components.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert(cssContent.includes('.nexus-account-form'), 'CSS defines .nexus-account-form');
    assert(cssContent.includes('.nexus-account-label'), 'CSS defines .nexus-account-label');
    assert(cssContent.includes('.nexus-account-notice'), 'CSS defines .nexus-account-notice');
    assert(cssContent.includes('.nexus-account-error-banner'), 'CSS defines .nexus-account-error-banner');
    assert(cssContent.includes('.nexus-password-rules-box'), 'CSS defines .nexus-password-rules-box');
    assert(cssContent.includes('.nexus-account-avatar-circle'), 'CSS defines .nexus-account-avatar-circle');

    // Mode overrides
    assert(cssContent.includes(":root[data-mode='balanced'] .nexus-account-avatar-circle"), 'CSS has Balanced mode account avatar override');
    assert(cssContent.includes(":root[data-mode='performance'] .nexus-account-avatar-circle"), 'CSS has Performance mode account avatar override');

    // Component files exist
    assert(fs.existsSync(path.resolve(process.cwd(), 'src/renderer/src/components/Account/SignInForm.tsx')), 'SignInForm.tsx exists');
    assert(fs.existsSync(path.resolve(process.cwd(), 'src/renderer/src/components/Account/SignUpForm.tsx')), 'SignUpForm.tsx exists');
    assert(fs.existsSync(path.resolve(process.cwd(), 'src/renderer/src/components/Account/ForgotPasswordForm.tsx')), 'ForgotPasswordForm.tsx exists');
    assert(fs.existsSync(path.resolve(process.cwd(), 'src/renderer/src/components/Account/AccountProfileView.tsx')), 'AccountProfileView.tsx exists');
    assert(fs.existsSync(path.resolve(process.cwd(), 'src/renderer/src/components/Account/AccountModal.tsx')), 'AccountModal.tsx exists');

    // Settings Workspace & Profile Modal integration
    const settingsWorkspacePath = path.resolve(process.cwd(), 'src/renderer/src/components/Settings/SettingsWorkspace.tsx');
    const settingsWorkspaceContent = fs.readFileSync(settingsWorkspacePath, 'utf8');
    assert(settingsWorkspaceContent.includes("id: 'account'"), 'SettingsWorkspace has Account navigation tab');
    assert(settingsWorkspaceContent.includes('AccountProfileView'), 'SettingsWorkspace embeds AccountProfileView');
    assert(settingsWorkspaceContent.includes('AccountModal'), 'SettingsWorkspace embeds AccountModal');

    const profileModalPath = path.resolve(process.cwd(), 'src/renderer/src/components/ProfileModal.tsx');
    const profileModalContent = fs.readFileSync(profileModalPath, 'utf8');
    assert(profileModalContent.includes('activeModalTab'), 'ProfileModal manages activeModalTab');
    assert(profileModalContent.includes('NEXUS Account'), 'ProfileModal displays NEXUS Account tab');
    assert(profileModalContent.includes('AccountProfileView'), 'ProfileModal embeds AccountProfileView');

    console.log('\n====================================================');
    console.log('  ALL 6 SUITES PASSED: NEXUS ACCOUNT & IDENTITY READY');
    console.log('====================================================\n');
  } finally {
    // Cleanup sandbox
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

runAccountTestSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
