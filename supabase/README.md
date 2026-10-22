# NEXUS Browser — Supabase Backend & Database Setup Guide

This guide details how to configure Supabase Auth, PostgreSQL, Row Level Security (RLS), and Social Login providers (Google & Apple) for NEXUS Browser.

---

## 1. Supabase Project Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Note your **Project URL** (`https://<project-ref>.supabase.co`) and **Public Anon Key** (`eyJ...`) from **Settings > API**.
3. Create a `.env` file in the root of the NEXUS Browser project (modeled after `.env.example`):

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
NEXUS_AUTH_REDIRECT_PORT=42427
```

---

## 2. Database Migrations & Row Level Security (RLS)

Execute the migration file located at `supabase/migrations/20261022000000_nexus_account_schema.sql` via:
- **Supabase CLI**: `supabase db push` or `supabase migration up`
- Or copy-paste into the **Supabase Dashboard > SQL Editor**.

### Tables Created & Secured
- **`profiles`**: Linked directly to `auth.users(id)` via foreign key with cascade deletion. Includes an automatic Postgres trigger `handle_new_user()` on `auth.users` insert.
- **`user_preferences`**: JSONB-backed settings for syncable browser preferences.
- **`notes`**: Synchronized user notes with soft deletion (`deleted_at`), rich-text content, tags, and timestamps.
- **`todos`**: Synchronized user tasks with priority, completion state, and due dates.
- **`bookmarks`**: Synchronized bookmarks with hierarchy.

### Security Guarantees
- **Row Level Security (RLS)** is strictly enabled on every user-owned table.
- Policies enforce `auth.uid() = user_id` for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Server-side authorization ensures no client can read or modify another user's data.
- The `anon` key is safe to ship in client configuration because database access is governed exclusively by RLS with valid JWT bearer tokens.

---

## 3. Google Sign-In (OAuth 2.0 PKCE with Loopback)

NEXUS Browser uses Authorization Code Flow with PKCE and opens the user's default system browser for secure authentication without embedded webviews:

1. In the [Google Cloud Console](https://console.cloud.google.com):
   - Navigate to **APIs & Services > Credentials**.
   - Create an **OAuth 2.0 Client ID** of type **Web Application**.
   - Under **Authorized redirect URIs**, add:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. In the **Supabase Dashboard > Authentication > Providers > Google**:
   - Enable the Google provider.
   - Enter your **Client ID** and **Client Secret**.
3. Under **Authentication > URL Configuration**:
   - Set **Site URL** to `http://localhost:42427` (or your production app protocol).
   - Under **Redirect URLs**, add:
     - `http://localhost:42427/callback`
     - `http://127.0.0.1:42427/callback`

---

## 4. Apple Sign-In (OAuth 2.0)

1. In the [Apple Developer Portal](https://developer.apple.com):
   - Register an **App ID** and a **Services ID** (e.g. `com.nexus.browser.auth`).
   - Configure **Sign In with Apple** on the Services ID.
   - Add the Supabase callback domain:
     - Domains: `<your-project-ref>.supabase.co`
     - Return URLs: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Generate a private key (`.p8` file) for Sign In with Apple and record the **Key ID** and **Team ID**.
2. In the **Supabase Dashboard > Authentication > Providers > Apple**:
   - Enable Apple.
   - Enter your **Services ID (Client ID)**, **Team ID**, **Key ID**, and paste the `.p8` private key.
3. Apple provides user name and email **only on the very first login**. The `handle_new_user()` database trigger automatically preserves this first-time metadata in the `profiles` table. Private relay emails (`@privaterelay.appleid.com`) are fully supported.

---

## 5. Local Development & Testing

When external credentials are not configured, NEXUS Browser:
- Honestly reports `Authentication Provider Not Configured` with clear setup guidance.
- Allows running tests using the built-in `MockAuthProvider` by setting `NEXUS_USE_MOCK_AUTH=1` in test environments.
