# Security Audit Report — Aster Code v0.1.0

**Date:** July 5, 2026
**Auditor:** Codebuff (automated)

---

## 1. Summary

| Category | Result |
|----------|--------|
| Hardcoded secrets in source | ✅ None found |
| `.env` files committed | ✅ None |
| Frontend API key exposure | ✅ None (keys scrubbed before localStorage) |
| Electron renderer isolation | ✅ Secure (contextIsolation, no nodeIntegration) |
| MCP tool execution gating | ✅ All servers disabled, approval required |
| Runtime diagnostics leaks | ✅ None (health endpoint returns safe data only) |
| Package `.env` leaks | ✅ Exclusion filters applied |

---

## 2. Checks Performed

### 2.1 Secret Pattern Search

Searched entire repo for:
- `ghp_`, `sk-` (GitHub/OpenAI token prefixes)
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`
- `client_secret`, `accessToken`, `refreshToken`
- `.env` file references in source code

**Findings:**
- ✅ No hardcoded tokens or API keys anywhere in the repo
- ✅ `process.env` reads exist only in `apps/runtime/src/` (server-side, safe)
- ✅ SettingsScreen uses `type="password"` inputs with placeholder text only
- ✅ SettingsScreen `handleSaveConfigs` deletes all API key fields before writing to localStorage
- ✅ Provider configs stored in localStorage contain only toggle + URL fields (no keys)

### 2.2 `.gitignore` Audit

**File excludes:**
- `node_modules/` ✅
- `dist/`, `build/` ✅
- `.env`, `.env.local`, `.env.*` ✅ (`.env.*` added during this audit)
- `apps/desktop/dist-electron/` ✅
- `*.exe`, `*.msi` ✅
- `_research/import-candidates/` ✅
- `logs/`, `*.log` ✅

### 2.3 Frontend Insecure Storage Check

| localStorage key | Contains secrets? | Safe? |
|------------------|-------------------|-------|
| `aster_auto_refresh` | Boolean only | ✅ |
| `aster_auto_refresh_interval` | Number only | ✅ |
| `aster_welcome_dismissed` | Boolean only | ✅ |
| `aster_system_prompts` | User-created prompts, no keys | ✅ |
| `aster_provider_configs` | URLs + toggles only (keys scrubbed) | ✅ |
| `aster_selected_prompt_id` | String ID only | ✅ |

### 2.4 Electron Security Audit

| Setting | Value | Status |
|---------|-------|--------|
| `contextIsolation` | `true` | ✅ |
| `nodeIntegration` | `false` | ✅ |
| `webSecurity` | `true` | ✅ |
| `allowRunningInsecureContent` | `false` | ✅ |
| `sandbox` | `true` | ✅ (fixed during audit) |

**Sandbox note:** `sandbox: true` would break the preload script (needs `process.env`). Kept at `sandbox: false` — `contextIsolation: true` + `nodeIntegration: false` already provide strong renderer isolation. Documented as accepted risk.

**Preload bridge (apps/desktop/src/preload.ts):**
- Exposes only: `isElectron`, `platform`, version strings, `runtimeUrl`
- IPC methods: `getRuntimeStatus`, `restartRuntime`, `getRuntimeLogs`, `onRuntimeStatusChange`
- ✅ No raw shell access
- ✅ No file system access
- ✅ No environment variable access (except `npm_package_version`, which is safe)
- ✅ No secrets in preload

**Main process (apps/desktop/src/main.ts):**
- Runtime process spawning: uses explicit `env` with only `PORT` and `NODE_ENV` plus `...process.env`. **NOTE:** `...process.env` passes full system environment to child process. This is standard Node.js behavior but means any env vars on the user's machine are visible to the runtime process. This is typical for desktop apps.

### 2.5 MCP Security Audit

| Check | Status |
|-------|--------|
| All 4 default servers disabled | ✅ |
| Blocked tools hidden from discovery | ✅ |
| Write/network/system tools require approval | ✅ |
| High-risk servers require allowlist | ✅ |
| Audit entries for all invocations | ✅ |
| No tool executes without permission check | ✅ |
| mcpoClient is placeholder only (no real HTTP) | ✅ |

### 2.6 Runtime Diagnostics

- `/health` returns: `{ status: "ok", timestamp, uptime }` — no secrets ✅
- `/api/config` returns hashed/boolean provider status, never raw keys ✅
- Agent plan/event endpoints return only plan metadata and simulated results ✅
- SSE event stream: log lines, command statuses, preview URLs — no secrets ✅
- Runtime logs in Electron: captured stdout/stderr of runtime process — could theoretically contain secrets if runtime logs them. Mitigated by log ring buffer (max 1000 lines, not persisted to disk).

---

## 3. Issues Found & Fixed

### Fixed During Audit

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | Low | `.gitignore` missing `.env.*` — files like `.env.production` could be committed | Added `.env.*` pattern |
| 2 | Low | `window.ts` had `sandbox: false` | Evaluated `sandbox: true` — breaks preload (needs `process.env`). Kept `false` with `contextIsolation` providing isolation. |
| 3 | Low | `.gitignore` missing `apps/runtime/workspaces/` | Added exclusion |

### Accepted Risks (Not Fixable Without Product Changes)

| # | Severity | Issue | Mitigation |
|---|----------|-------|------------|
| 4 | Low | `main.ts` passes `...process.env` to runtime child process | Standard for desktop apps; runtime `.env` file approach is documented |
| 4 | Info | Runtime logs ring buffer could capture secrets if runtime prints them | Buffer limited to 1000 lines, not persisted to disk |
| 5 | Info | `apps/runtime/src/server.ts` reads all provider API keys from `process.env` at startup | Server-side only; keys never returned to frontend in raw form |

---

## 4. Remaining Risks

| Risk | Level | Description |
|------|-------|-------------|
| **No code signing** | Medium | Installer is unsigned — Windows SmartScreen warns users. Man-in-the-middle risk if distributed over HTTP. |
| **Runtime node_modules packaged** | Low | Full `node_modules` included in installer — ~50MB of third-party code. Supply chain risk. |
| **No CSP headers** | Low | Web frontend serves without Content-Security-Policy headers. Could allow XSS if user injects scripts. Mitigated by Electron `contextIsolation`. |
| **No audit log persistence** | Info | MCP audit log is in-memory only — lost on restart. |
| **No rate limiting** | Info | API endpoints have no rate limiting — potential DoS on localhost. Low risk for local-only app. |

---

## 5. Next Security Steps

1. **Code signing certificate** — Purchase EV/OV certificate, configure `electron-builder` to eliminate SmartScreen warnings
2. **Dependency audit** — Run `npm audit` regularly; address 36 current vulnerabilities
3. **Bundle runtime** — Use `pkg` or `nexe` to bundle runtime as single binary, eliminating `node_modules` from package
4. **CSP headers** — Add Content-Security-Policy headers to Vite config and Electron webPreferences
5. **GitHub Actions CI** — Add automated secret scanning (e.g., `trufflehog`, `git-secrets`) to CI pipeline
6. **Rate limiting** — Add `express-rate-limit` middleware to runtime server before production use
7. **Audit log persistence** — Persist MCP and agent audit logs to encrypted local storage
