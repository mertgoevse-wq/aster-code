# Auth Architecture — Aster Code

## Core Principle: Local-First, Optional Auth

Aster Code operates in two modes:

| Mode | Login Required | Features |
|------|---------------|----------|
| **Local** | No | Full agent loop, file editing, command execution, model providers, local skills. Everything works offline. |
| **Authenticated** | Yes (GitHub or Google) | All local features + GitHub repo sync, cloud settings sync, remote project storage (future) |

Authentication is **never required** to use the core application. Users can run Aster Code fully offline with no external accounts.

## OAuth Providers

### GitHub OAuth

**Scopes requested:**
- `read:user` — basic profile info (username, avatar, email)
- `repo` — read/write access to repositories (for sync feature)

**Use cases unlocked:**
- Sync workspace to/from GitHub repositories
- Clone templates from GitHub
- Push generated code to repos
- Pull request creation

### Google OAuth

**Scopes requested:**
- `openid` — OpenID Connect identity
- `userinfo.profile` — display name and avatar
- `userinfo.email` — email address
- `drive.file` — access to files created by Aster Code in Google Drive

**Use cases unlocked:**
- Cloud settings backup/sync
- Google Drive document integration
- Remote project storage

## OAuth Flow (Not Yet Implemented)

```
1. User clicks "Login with GitHub" in Settings
2. Frontend calls GET /auth/github/start
3. Runtime generates authorize URL with state + redirect_uri
4. User is redirected to GitHub authorize page
5. User approves scopes
6. GitHub redirects to /auth/callback?code=...&state=...
7. Runtime exchanges code for access token
8. Runtime fetches user profile
9. Runtime creates an auth session
10. Frontend polls GET /auth/status to detect login
```

### Implementation Status

| Step | Status |
|------|--------|
| OAuth config (env vars) | ✅ Scaffolded |
| Authorize URL generation | ✅ Implemented |
| CSRF state generation | ✅ Implemented |
| Callback endpoint | ✅ Placeholder |
| Token exchange | ❌ Not implemented |
| User profile fetch | ❌ Not implemented |
| Session creation | ✅ Session store ready |
| Frontend UI | ✅ Placeholder buttons |

## Token Storage Rules

1. **Access tokens are NEVER stored in plaintext on disk**
2. **MVP: tokens live only in-memory** during the server session
3. **No tokens in frontend** — the frontend never receives raw tokens
4. **No tokens in localStorage/sessionStorage**
5. **Future:** tokens will be encrypted at rest using platform-native secure storage:
   - **Desktop (Electron):** OS keychain (Windows Credential Store, macOS Keychain, Linux Secret Service)
   - **Web:** encrypted httpOnly cookies with short expiry
   - **Android:** EncryptedSharedPreferences or Android Keystore

## Session Persistence

- **MVP:** In-memory only. Sessions are lost on server restart.
- **Future:** Encrypted session tokens stored in a local SQLite database with AES-256-GCM encryption. The encryption key is derived from a machine-specific secret.

## Desktop vs Web Differences

| Concern | Desktop (Electron) | Web (Browser) |
|---------|-------------------|---------------|
| Redirect URI | `http://localhost:PORT/auth/callback` (loopback) | `https://app.aster-code.com/auth/callback` |
| Token storage | OS keychain | httpOnly encrypted cookie |
| CSRF | Loopback redirect to localhost is safe | PKCE + state parameter required |
| CORS | Not applicable | Required for OAuth endpoints |

## Android Future Considerations

- **Custom URI scheme:** `aster-code://auth/callback` for OAuth redirects
- **Chrome Custom Tabs:** For OAuth consent screens (better UX than WebView)
- **Biometric auth:** Fingerprint/PIN to unlock encrypted token storage
- **AccountManager:** Android's built-in account system for token management

## API Endpoints

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| GET | `/auth/status` | Current auth status, user info, enabled features | ✅ Implemented |
| POST | `/auth/logout` | End current session, return to local mode | ✅ Implemented |
| GET | `/auth/github/start` | Generate GitHub OAuth authorize URL | ✅ Implemented |
| GET | `/auth/google/start` | Generate Google OAuth authorize URL | ✅ Implemented |
| GET | `/auth/callback` | OAuth callback handler | ⚠️ Placeholder |

## Environment Variables

Place a `.env` file in `apps/runtime/`:

```bash
# GitHub OAuth (register at https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth (register at https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth redirect URI (defaults to http://localhost:3001/auth/callback)
OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback
```

Without these env vars, the auth buttons will show as "not configured" — local-only mode remains fully functional.

## Security Considerations

1. **No auth required for local use** — The app cannot be locked behind a login wall
2. **No secrets in frontend** — Client IDs are the only public values; secrets are runtime-only
3. **State parameter** — CSRF protection via signed state tokens
4. **No token leakage** — Tokens never appear in URLs, logs, or frontend network requests
5. **Audit trail** — Login/logout events are logged to console (MVP)
6. **Scoped permissions** — Only minimum required scopes are requested
