# Desktop App — Aster Code (Electron)

The Aster Code desktop app wraps the web UI in a native Electron window for a proper desktop experience.

## Architecture

```
apps/desktop/
├── src/
│   ├── main.ts       # Main process: window creation, lifecycle, security
│   ├── preload.ts    # Safe bridge: exposes minimal API to renderer
│   └── window.ts     # BrowserWindow factory with ivory theme defaults
├── assets/
│   └── icon.png      # App icon (placeholder SVG planned)
├── package.json      # Electron + electron-builder config
└── tsconfig.json     # TypeScript config
```

## Prerequisites

- Node.js 18+
- npm 9+
- Windows 10/11 (build outputs are Windows-targeted by default)

## Development

### Option A: Run everything together

```powershell
# Terminal 1: Start runtime server
npm run dev:runtime

# Terminal 2: Start web dev server + Electron
npm run app:dev
```

The Electron window will open automatically and connect to the Vite dev server at `http://localhost:5173`.

### Option B: Run separately

```powershell
# Terminal 1: Runtime server
npm run dev:runtime    # http://localhost:3001

# Terminal 2: Web dev server  
npm run dev:web        # http://localhost:5173

# Terminal 3: Electron (optional - or use browser)
npm run desktop:dev    # Opens Electron window loading :5173
```

**Note:** The runtime server (`:3001`) must be running for API calls to work, even in Electron. The web app proxies `/api/*` to the runtime.

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

Runs: `npm run build` (all workspaces) + `runtime:build` + `desktop:build`.

### Package for distribution

```powershell
# Step 1: Build the web app first
npm run build             # Builds apps/web → apps/web/dist/

# Step 2: Package the desktop app
npm run desktop:dist
```

Output:
- **Installer:** `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe`
- **Unpacked:** `apps/desktop/dist-electron/win-unpacked/`

The installer wraps:
- The compiled Electron main process (`apps/desktop/dist/`)
- The built web app (`apps/web/dist/`)
- Chromium runtime (bundled by Electron)

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
- **Minimal preload** — only exposes platform info, version, `isElectron` flag
- **No shell access** — no arbitrary commands from the renderer
- **External links** — opened in default browser, not in the Electron window
- **No runtime auto-start** — the user must start the runtime server manually (or via future orchestration)

## Troubleshooting

### Blank/white window

**Cause:** The Electron window is trying to load the Vite dev server but it's not running.

**Fix:** Start the web dev server first:
```powershell
npm run dev:web
```
Then restart the desktop app or run `npm run app:dev` (which starts both).

### Runtime offline

**Cause:** The runtime server at `localhost:3001` is not running.

**Fix:** Start the runtime:
```powershell
npm run dev:runtime
```
The API proxy in Vite forwards `/api/*` → `localhost:3001`.

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
This installs `@types/node` (a transitive dependency of Electron).

### Electron fails to start: "Cannot find module"

**Cause:** The desktop TypeScript hasn't been compiled yet.

**Fix:**
```powershell
npm run desktop:build
```

## Runtime Not Auto-Started

The desktop app does **not** auto-start the runtime server. This is intentional for safety:

- The user controls when the backend runs
- No hidden processes
- Clear separation of concerns

Future versions may add a "Start Runtime" button in the desktop UI or use Electron's `child_process` to manage the runtime lifecycle safely.

## Future: Runtime Orchestration

Planned for Phase 2:
- Electron spawns the runtime as a child process
- Status indicator shows runtime health
- Auto-restart on crash
- Shared lifecycle: close Electron → stop runtime

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run desktop:dev` | TypeScript compile + launch Electron (dev mode) |
| `npm run desktop:build` | Compile TypeScript only |
| `npm run desktop:dist` | Package Windows installer (requires web build first) |
| `npm run app:dev` | Runtime + web + desktop (all in one) |
| `npm run app:build` | Build web + runtime + desktop |

## Known MVP Limitations

### Production API proxy

In development, Vite's dev server proxies `/api/*` → `localhost:3001`. In the packaged production Electron app, web assets are loaded via `file://` and there is no proxy. API calls to `/api/*` will fail.

**Workaround:** Start the runtime server on `localhost:3001` before launching the packaged app. The web app's fetch calls will still use `/api/*` paths, which resolve relative to the `file://` origin and fail.

**Planned fix (Phase 2):** Either have the Electron main process spawn the runtime as a child process, or configure the web build to use `http://localhost:3001` directly when running in Electron.

### App icon

The Electron app uses the default Electron icon. A custom Aster Code icon is planned.

### Race condition on `app:dev`

The `concurrently` command starts runtime, web, and desktop simultaneously. Electron may open before Vite is ready — if you see a blank window, wait a few seconds and Electron will auto-reconnect (or restart the desktop).
