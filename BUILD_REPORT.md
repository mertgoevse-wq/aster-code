# Aster Code Beginner-Usable MVP Polish Build Report

Date: 2026-07-05
Status: SUCCESS — All builds pass cleanly

## Changes Made

### 1. Welcome Banner / First-Run Onboarding (`apps/web/src/components/WelcomeBanner.tsx`)
- Full-screen welcome card shown to first-time users on the Chat screen
- Hero section: What Aster Code is, runtime status callout (online/offline)
- "What Works Now" panel: 6 MVP features with descriptions (agent plans, skill routing, workbench, model registry, runtime, desktop)
- "Coming Next" panel: 5 roadmap items (real LLM chat, file edits, command execution, MCP, persistent sessions)
- "Current MVP Limitations" panel: highlights disabled features (LLM disconnected, OAuth placeholder, MCP mock, external skills inactive)
- 3 suggested prompt buttons: "explain this project", "create a hello world app", "add a dark mode toggle"
- Dismiss button persists to localStorage — welcome screen never shown again after dismissal

### 2. ChatScreen Empty State (`apps/web/src/screens/ChatScreen.tsx`)
- Replaced hardcoded welcome message with WelcomeBanner shown when `messages.length === 0`
- `handleSend` accepts optional prompt string for suggested prompt buttons
- Removed dead `hasWelcomed` state — visibility controlled by message count

### 3. LLM Disconnected Indicator (`apps/web/src/App.tsx`)
- Status bar now shows amber "LLM disconnected" badge between model count and local-first indicators
- Clear visual cue that no real LLM is connected yet

### 4. Windows Installer Smoke Test Workflow (`docs/WINDOWS_INSTALLER_TEST.md`)
- Created comprehensive smoke test documentation for the Windows NSIS installer
- Covers: build steps, installer output paths, installation instructions, uninstall instructions
- Launch paths: Desktop shortcut, Start Menu, install directory
- 17-item smoke test checklist: Electron launch, runtime connectivity, all 6 screens, runtime management
- Troubleshooting: SmartScreen warning, port 3001 conflict, missing installer, blank/white screen, runtime offline, logs location
- Quick build-and-test workflow section

### 2. Smoke Check Script (`scripts/desktop-smoke.mjs` + `npm run desktop:smoke`)
- Prints all expected build output paths with ✅/❌ existence checks
- Lists URLs (runtime API, health check, web dev server)
- Lists install locations (%LOCALAPPDATA%, %APPDATA%, Desktop, Start Menu)
- Lists relevant build scripts
- Exits non-zero if build artifacts are missing

### 5. API Base URL Resolver (`apps/web/src/api.ts`)
- Created new helper module that automatically resolves the correct API base URL
- In Electron: uses `http://localhost:3001` directly (strips `/api` prefix)
- In browser dev: returns path as-is (Vite proxy handles it)
- Exports `apiFetch()` and `apiEventSource()` wrappers

### 6. Updated All Frontend Files (6 files)
- `App.tsx` — Uses `apiFetch` for all API calls, listens for Electron runtime status changes
- `ChatScreen.tsx` — Uses `apiFetch` for agent session API calls
- `WorkbenchScreen.tsx` — Uses `apiFetch` and `apiEventSource` for workspace/commands/SSE
- `SkillsScreen.tsx` — Uses `apiFetch` for skills CRUD
- `SettingsScreen.tsx` — Uses `apiFetch`, added Runtime Server panel with restart button + logs
- Added runtime status tracking to status bar (starting/online/offline/error)

### 7. Electron Runtime Management (`apps/desktop/src/main.ts`)
- Added runtime child process management:
  - Detects if runtime at `localhost:3001` is already running
  - If not, spawns runtime as child process (tsx in dev, node in production)
  - Health monitoring every 5 seconds via `GET /health`
  - Captures stdout/stderr in ring buffer (max 1000 lines)
  - Graceful shutdown on app exit (SIGTERM → SIGKILL after 5s)
- Added IPC handlers: `runtime:status`, `runtime:restart`, `runtime:logs`
- Fixed production web dist path to use `process.resourcesPath`
- Tracks accurate runtime uptime

### 8. Electron Preload Bridge (`apps/desktop/src/preload.ts`)
- Added safe IPC methods for runtime management:
  - `getRuntimeStatus()` — Returns `{ state, pid, url, uptime }`
  - `restartRuntime()` — Stops and restarts runtime
  - `getRuntimeLogs()` — Returns last 200 log lines
  - `onRuntimeStatusChange(cb)` — Subscribe to status changes
- Exposed `runtimeUrl: 'http://localhost:3001'` for API calls
- No environment secrets exposed, no shell access

### 9. Electron Builder Config (`apps/desktop/package.json`)
- Configured `extraResources` to include:
  - Web dist → `resources/web/dist/`
  - Runtime dist → `resources/runtime/dist/`
  - Runtime dependencies → `resources/runtime/node_modules/`
  - Runtime package.json → `resources/runtime/package.json`

### 10. Script Updates (`package.json`)
- `check` now includes `desktop:build`
- `desktop:dist` builds runtime before packaging

### 11. Documentation
- `docs/DESKTOP_APP.md` — Updated with runtime management, API connectivity, troubleshooting
- `docs/DESKTOP_RUNTIME.md` — New: Runtime IPC API, lifecycle, health monitoring, spawning logic
- `docs/WINDOWS_INSTALLER_TEST.md` — New: Installer smoke test workflow, checklist, troubleshooting
- `docs/START_HERE.md` — Updated with runtime status info, new docs references
- `README.md` — Updated with desktop app and new docs references

## Commands Run
1. `npm run check` — 0 errors (typecheck + build all workspaces)
2. `npm run desktop:dist` — SUCCESS (installer created at `dist-electron/Aster Code Setup 0.1.0.exe`)
3. `npm run desktop:smoke` — Passed (all build artifacts found)

### desktop:dist Fix
- Pre-cleanup: `fs.rmSync('dist-electron', {recursive:true, force:true})` added to `dist` script — removes old output before building to avoid EBUSY file locks
- Config: `verifyUpdateCodeSignature: false` + `signAndEditExecutable: false` — skips ASAR integrity step that Windows Defender locks

## Verification Results
- ✅ All 4 workspaces typecheck with 0 errors
- ✅ All 4 workspaces build successfully
- ✅ WelcomeBanner renders on first visit, dismissable via localStorage
- ✅ "What Works Now" / "Coming Next" / "MVP Limitations" panels present
- ✅ 3 suggested prompt buttons that trigger agent plan generation
- ✅ "LLM disconnected" indicator visible in status bar
- ✅ OAuth placeholder buttons disabled in Settings (already existed)
- ✅ MCP mock mode noted in WelcomeBanner limitations panel
- ✅ Empty states for all screens (Chat: WelcomeBanner, Workbench: offline overlay+no-file, Models: no-selection, Skills: loading/error, Settings: forms always visible)
- ⚠️ Packaged runtime node_modules adds ~50MB to installer
- ⚠️ No `.env` in packaged runtime (configure via Settings UI)
- ⚠️ Default Electron icon (custom icon planned)
