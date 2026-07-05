# Desktop App — Aster Code (Electron)

The Aster Code desktop app wraps the web UI in a native Electron window with automatic runtime management for a seamless desktop experience.

## Architecture

```
apps/desktop/
├── src/
│   ├── main.ts       # Main process: window creation, lifecycle, runtime management
│   ├── preload.ts    # Safe bridge: exposes IPC API + runtime controls to renderer
│   └── window.ts     # BrowserWindow factory with ivory theme defaults
├── assets/
│   └── icon.png      # App icon (placeholder SVG planned)
├── package.json      # Electron + electron-builder config
└── tsconfig.json     # TypeScript config
```

## How it Works

### Runtime Auto-Start

When the desktop app launches:

1. The main process checks if the runtime server at `http://localhost:3001` is already running
2. If not running, it spawns the runtime as a child process:
   - **In dev mode:** Uses `npx tsx watch src/server.ts` pointing to `apps/runtime/`
   - **In production:** Uses `node dist/server.js` from the packaged `extraResources`
3. A health monitor pings `GET /health` every 5 seconds
4. On app exit, any runtime process started by Electron is gracefully stopped

### API Connectivity

The frontend no longer relies on Vite's dev proxy for API calls. Instead:

- **In Electron (dev or production):** API calls use `http://localhost:3001` directly via the `apiFetch()` helper in `apps/web/src/api.ts`
- **In browser dev mode:** Vite's proxy still handles `/api/*` → `localhost:3001`
- **The `api.ts` helper** automatically detects the environment and resolves the correct URL

This means the packaged desktop app will work without a running Vite dev server or proxy.

### Safe Preload IPC

The preload script exposes these runtime management methods to the renderer:

| Method | Description |
|--------|-------------|
| `getRuntimeStatus()` | Returns `{ state, pid, url, uptime }` |
| `restartRuntime()` | Stops and restarts the runtime server |
| `getRuntimeLogs()` | Returns last 200 lines of runtime logs |
| `onRuntimeStatusChange(cb)` | Subscribe to status changes (returns unsubscribe) |

**Security:** All runtime management is done via `ipcRenderer.invoke()` — the renderer never has direct shell or file system access.

## Prerequisites

- Node.js 18+
- npm 9+
- Windows 10/11 (build outputs are Windows-targeted by default)

## Development

### Run everything together (recommended)

```powershell
npm run app:dev
```

This starts three concurrent processes:
- **Runtime** (`localhost:3001`) — API, model registry, agent loop
- **Web** (`localhost:5173`) — React/Vite frontend
- **Desktop** — Electron window

### Run components separately

```powershell
# Terminal 1: Runtime server
npm run dev:runtime    # http://localhost:3001

# Terminal 2: Web dev server  
npm run dev:web        # http://localhost:5173

# Terminal 3: Electron
npm run desktop:dev    # Opens Electron window loading :5173
```

**Note:** When running via `app:dev`, the runtime is started by concurrently. When running `desktop:dev` standalone, Electron will auto-start the runtime if it's not already running.

## Build

### Build the desktop app TypeScript

```powershell
npm run desktop:build
```

Compiles `apps/desktop/src/` → `apps/desktop/dist/`.

### Build everything (web + runtime + desktop)

```powershell
npm run app:build
```

Runs: typecheck + build (all workspaces) + desktop:build.

### Package for distribution

```powershell
npm run desktop:dist
```

This runs:
1. `npm run build --workspace=apps/web` — build React/Vite app
2. `npm run build --workspace=apps/runtime` — compile runtime server
3. `tsc && electron-builder --win --config` — package Electron

**Output:**
- **Installer:** `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe`
- **Unpacked:** `apps/desktop/dist-electron/win-unpacked/`

### What's in the package

| Resource | Source | Destination |
|----------|--------|-------------|
| Electron main process | `apps/desktop/dist/` | App bundle |
| Web UI | `apps/web/dist/` | `resources/web/dist/` |
| Runtime server | `apps/runtime/dist/` | `resources/runtime/dist/` |
| Runtime deps | `apps/runtime/node_modules/` | `resources/runtime/node_modules/` |
| Runtime package.json | `apps/runtime/package.json` | `resources/runtime/package.json` |

## Window Settings

| Setting | Value |
|---------|-------|
| Default size | 1440 × 900 |
| Minimum size | 1024 × 700 |
| Background | Warm ivory (#FAF9F6) |
| Title | "Aster Code" |
| Menu | Hidden in production, visible in dev |
| DevTools | Open in dev mode only |

## Security

- **contextIsolation: true** — renderer cannot access Node.js APIs directly
- **nodeIntegration: false** — no `require()` or `process` in the web page
- **Minimal preload** — only exposes platform info, version, `isElectron` flag, and safe runtime IPC
- **No shell access** — no arbitrary commands from the renderer (IPC allowlist only)
- **No secrets in renderer** — API keys are never exposed to the web page
- **No arbitrary file access** — only specific IPC methods are exposed
- **External links** — opened in default browser, not in the Electron window

## Runtime Management UI

The desktop app provides runtime management through the Settings screen:

1. **Runtime Server panel** — Shows status (online/offline/starting/error), URL, PID
2. **Restart Runtime button** — Stops and restarts the runtime server
3. **Runtime Logs panel** — Toggle to view live runtime logs (last 200 lines)
4. **Status bar** — Shows runtime status badge and connection state at the bottom of the window

## Troubleshooting

### Blank/white window

**Cause:** The Electron window is trying to load the Vite dev server but it's not running.

**Fix:** Start the web dev server first:
```powershell
npm run dev:web
```
Then restart the desktop app or run `npm run app:dev` (which starts both).

### Runtime offline in production

**Cause:** The runtime failed to start. Check the logs in Settings → Runtime Server → Runtime Logs.

**Fix:** Restart the runtime using the "Restart Runtime" button in Settings. If it persists, start the runtime manually:
```powershell
npm run dev:runtime
```

### Windows Defender warning

**Cause:** The `.exe` is unsigned (self-signed/code signing cert not configured).

**Fix:** 
1. Click "More info" → "Run anyway" in the SmartScreen dialog
2. For production: obtain a code signing certificate and add it to the electron-builder config

### TypeScript errors during desktop:build

**Cause:** Node.js types not installed or wrong module resolution.

**Fix:**
```powershell
cd apps/desktop
npm install
```

### Electron fails to start: "Cannot find module"

**Cause:** The desktop TypeScript hasn't been compiled yet.

**Fix:**
```powershell
npm run desktop:build
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run desktop:dev` | TypeScript compile + launch Electron (dev mode) |
| `npm run desktop:build` | Compile TypeScript only |
| `npm run desktop:dist` | Build web + runtime + package Windows installer |
| `npm run app:dev` | Runtime + web + desktop (all in one) |
| `npm run app:build` | Build web + runtime + desktop |
| `npm run check` | Typecheck + build everything |

## Known Limitations

- The packaged runtime's `.env` is not included. Configure providers via Settings UI after launch.
- The runtime node_modules directory adds ~50MB to the installer size. A future optimization could bundle the runtime more efficiently.
- No macOS or Linux installer targets yet (only Windows NSIS).
- Default Electron icon used (custom Aster Code icon planned).
