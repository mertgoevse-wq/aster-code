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
