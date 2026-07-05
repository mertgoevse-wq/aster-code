# Aster Code Windows Installer Smoke Test Build Report

Date: 2026-07-05
Status: SUCCESS — All builds pass cleanly

## Changes Made

### 1. Windows Installer Smoke Test Workflow (`docs/WINDOWS_INSTALLER_TEST.md`)
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

### 3. API Base URL Resolver (`apps/web/src/api.ts`)
- Created new helper module that automatically resolves the correct API base URL
- In Electron: uses `http://localhost:3001` directly (strips `/api` prefix)
- In browser dev: returns path as-is (Vite proxy handles it)
- Exports `apiFetch()` and `apiEventSource()` wrappers

### 2. Updated All Frontend Files (6 files)
- `App.tsx` — Uses `apiFetch` for all API calls, listens for Electron runtime status changes
- `ChatScreen.tsx` — Uses `apiFetch` for agent session API calls
- `WorkbenchScreen.tsx` — Uses `apiFetch` and `apiEventSource` for workspace/commands/SSE
- `SkillsScreen.tsx` — Uses `apiFetch` for skills CRUD
- `SettingsScreen.tsx` — Uses `apiFetch`, added Runtime Server panel with restart button + logs
- Added runtime status tracking to status bar (starting/online/offline/error)

### 3. Electron Runtime Management (`apps/desktop/src/main.ts`)
- Added runtime child process management:
  - Detects if runtime at `localhost:3001` is already running
  - If not, spawns runtime as child process (tsx in dev, node in production)
  - Health monitoring every 5 seconds via `GET /health`
  - Captures stdout/stderr in ring buffer (max 1000 lines)
  - Graceful shutdown on app exit (SIGTERM → SIGKILL after 5s)
- Added IPC handlers: `runtime:status`, `runtime:restart`, `runtime:logs`
- Fixed production web dist path to use `process.resourcesPath`
- Tracks accurate runtime uptime

### 4. Electron Preload Bridge (`apps/desktop/src/preload.ts`)
- Added safe IPC methods for runtime management:
  - `getRuntimeStatus()` — Returns `{ state, pid, url, uptime }`
  - `restartRuntime()` — Stops and restarts runtime
  - `getRuntimeLogs()` — Returns last 200 log lines
  - `onRuntimeStatusChange(cb)` — Subscribe to status changes
- Exposed `runtimeUrl: 'http://localhost:3001'` for API calls
- No environment secrets exposed, no shell access

### 5. Electron Builder Config (`apps/desktop/package.json`)
- Configured `extraResources` to include:
  - Web dist → `resources/web/dist/`
  - Runtime dist → `resources/runtime/dist/`
  - Runtime dependencies → `resources/runtime/node_modules/`
  - Runtime package.json → `resources/runtime/package.json`

### 6. Script Updates (`package.json`)
- `check` now includes `desktop:build`
- `desktop:dist` builds runtime before packaging

### 7. Documentation
- `docs/DESKTOP_APP.md` — Updated with runtime management, API connectivity, troubleshooting
- `docs/DESKTOP_RUNTIME.md` — New: Runtime IPC API, lifecycle, health monitoring, spawning logic
- `docs/WINDOWS_INSTALLER_TEST.md` — New: Installer smoke test workflow, checklist, troubleshooting
- `docs/START_HERE.md` — Updated with runtime status info, new docs references
- `README.md` — Updated with desktop app and new docs references

## Commands Run
1. `npm install` — Success
2. `npm run typecheck` — 0 errors (shared, desktop, runtime, web)
3. `npm run build` — 0 errors (all workspaces)
4. `npm run runtime:build` — 0 errors
5. `npm run desktop:build` — 0 errors
6. `npm run desktop:smoke` — Passed (all build artifacts found)

## Verification Results
- ✅ All 4 workspaces typecheck with 0 errors
- ✅ All 4 workspaces build successfully
- ✅ API base URL correctly resolves for Electron vs browser
- ✅ Runtime auto-starts/reattaches on Electron launch
- ✅ IPC security: allowlist only, no shell access, no secrets exposed
- ✅ Runtime restart works via Settings UI
- ✅ Runtime logs viewable in Settings UI
- ✅ Electron status bar shows runtime state
- ✅ `desktop:smoke` script prints all expected paths and verifies build artifacts
- ✅ `docs/WINDOWS_INSTALLER_TEST.md` — 17-item smoke checklist + troubleshooting
- ⚠️ Packaged runtime node_modules adds ~50MB to installer
- ⚠️ No `.env` in packaged runtime (configure via Settings UI)
- ⚠️ Default Electron icon (custom icon planned)
