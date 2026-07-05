# Security Architecture Model

Security is built into Aster Code from day one. Since agent studios execute code locally, we enforce strict boundaries to prevent data leaks or unvetted local operations.

## Core Rules

### 1. No Credentials in Frontend UI
- Frontend React applications must never have permanent access to API keys.
- API keys reside solely inside the backend `apps/runtime/.env` file.
- Keys entered in the Settings panel are sent directly to the backend runtime server in-memory configurations. The frontend client explicitly scrubs all API keys before writing to `localStorage` to prevent key exposure via browser data dumps.
- When querying model capabilities or listing adapters, the runtime only sends mock statuses or configuration booleans (e.g. `configured: true` or `configured: false`) to the frontend, never raw keys.

### 2. Sandbox Execution Directories
- All workspace files modification and command execution must be bounded.
- The command runner in the runtime must validate that any target directory parameter is nested inside the verified project workspace root. Paths like `..` or root references are rejected.

### 3. Shell Command Vetting
- Command executions (`execute_commands`) must run through a command parser.
- Commands are matched against an allowlist (e.g. `npm run`, `git status`, `tsc`, `gradlew`).
- Interactive prompts (which could hang the backend thread or prompt for raw passwords) are disabled by default.

### 4. Sandbox Permissions Approval Loop
- High-risk operations (e.g. executing commands or writing files) default to `Requires Approval` (`ask`) mode.
- Users can review the target files and exact bash command inputs in the UI before approving.

### 5. Agent Loop Safety Invariants

The agent loop (`apps/runtime/src/agent/loop.ts`) enforces:

- **No autonomous execution**: All plan steps must be explicitly approved via the `/agent/session/:id/approve` endpoint.
- **Permission hierarchy**: Five permission tiers (`read-only` → `dangerous-disabled`) are checked before every action.
- **Permanently blocked actions**: `dangerous-disabled` permission level actions are ALWAYS blocked, regardless of user approval.
- **Deterministic plans**: MVP uses rule-based classification and mock plans — no real LLM calls.
- **Simulated execution**: File writes and shell commands are logged as events but NOT actually executed in MVP.
- **In-memory sessions**: No data persists to disk, preventing stale or leaked session data.

### 6. Skill-Level Permission Mapping

Each skill maps to a permission level based on its required scopes:

| Skill Permissions | Effective Permission Level |
|------------------|---------------------------|
| `read_workspace` only | `read-only` or `suggest-edits` |
| + `write_workspace` | `apply-edits-after-approval` |
| + `execute_commands` | `run-safe-commands-after-approval` |

Skills with `executionMode: 'ask'` require additional explicit approval before running, even at low permission levels.

### 7. Authentication Security

Aster Code supports **optional** OAuth login (GitHub, Google) for cloud features. Auth is never required for local use.

- **Local-first by default**: The full application works without login. Auth only unlocks cloud integrations.
- **No OAuth secrets in frontend**: Client secrets are runtime `.env` only. The frontend only receives public client IDs.
- **CSRF protection**: OAuth flows use signed state tokens with nonce + timestamp to prevent replay attacks.
- **Token storage rules**:
  - Access tokens NEVER stored in plaintext on disk
  - MVP: tokens in-memory only (lost on restart)
  - Future: encrypted at rest using OS keychain / Android Keystore
  - No tokens ever in browser localStorage, sessionStorage, or cookies accessible to JavaScript
- **Scoped permissions**: Only minimum required OAuth scopes are requested
- **No login wall**: The app cannot be locked behind authentication — local mode always works
- **MVP status**: OAuth endpoints are scaffolded but token exchange is not implemented yet

### Auth Endpoint Security

| Endpoint | Auth Required | Notes |
|----------|--------------|-------|
| GET `/auth/status` | No | Returns current auth state, never exposes tokens |
| POST `/auth/logout` | No | Clears in-memory session |
| GET `/auth/github/start` | No | Returns authorize URL, state param for CSRF |
| GET `/auth/google/start` | No | Returns authorize URL, state param for CSRF |
| GET `/auth/callback` | No | Validates state, exchanges code (placeholder) |
