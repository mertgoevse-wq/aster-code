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
