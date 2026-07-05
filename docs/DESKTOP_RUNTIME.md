# Desktop Runtime Management

The Aster Code desktop app manages the runtime server lifecycle automatically, providing a seamless experience where the backend starts and stops with the app.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Electron Main Process                      │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ App      │    │ Runtime       │    │ IPC Handlers     │  │
│  │ Lifecycle │───▶│  Manager     │◀───▶│                  │  │
│  │ (ready/  │    │              │    │ runtime:status   │  │
│  │  quit)   │    │ start/stop   │    │ runtime:restart  │  │
│  └──────────┘    │ restart      │    │ runtime:logs     │  │
│                  │ health check │    └────────┬─────────┘  │
│                  └──────┬───────┘             │            │
│                         │                     │            │
└─────────────────────────┼─────────────────────┼────────────┘
                          │                     │
                    ┌─────▼─────┐        ┌──────▼──────┐
                    │ Runtime    │        │  Renderer   │
                    │ Server     │        │  (Web UI)   │
                    │ :3001      │        │             │
                    └───────────┘        └─────────────┘
                     HTTP /health          IPC messages
```

## Runtime Manager States

| State | Description |
|-------|-------------|
| `offline` | Runtime is not running or we haven't checked yet |
| `starting` | Runtime process has been spawned, waiting for first health check |
| `online` | Runtime health endpoint responds successfully |
| `error` | Runtime process exited with non-zero code or failed to spawn |

## IPC API (Renderer → Main)

These methods are exposed via `window.asterDesktop.*` in the renderer process:

### `getRuntimeStatus()`

Returns the current runtime status object:

```typescript
interface RuntimeStatus {
  state: 'starting' | 'online' | 'offline' | 'error';
  pid: number | null;
  url: string;          // 'http://localhost:3001'
  uptime: number | null; // milliseconds since runtime start (null if offline)
}
```

### `restartRuntime()`

Stops the runtime process (if Electron started it) and starts it again after a 1-second delay. Returns the new `RuntimeStatus`.

### `getRuntimeLogs()`

Returns an array of the last 200 log lines from the runtime's stdout/stderr:

```typescript
Promise<string[]>
```

### `onRuntimeStatusChange(callback)`

Subscribe to runtime status changes. Returns an unsubscribe function:

```typescript
onRuntimeStatusChange((status: RuntimeStatus) => void): () => void
```

## Health Monitoring

The runtime manager pings `http://localhost:3001/health` every 5 seconds:

- If the endpoint responds with HTTP 200, the state transitions to `online`
- If the endpoint does not respond, the state transitions to `offline`
- Status changes are broadcast to all windows via IPC

## Spawning Logic

### Dev Mode (`app.isPackaged === false`)

```javascript
command: 'npx',
args: ['tsx', 'watch', 'src/server.ts'],
cwd: apps/runtime/   // relative to project root
```

Note: When using `npm run app:dev`, the runtime is started by concurrently, so Electron detects it as already running and skips spawning.

### Production (`app.isPackaged === true`)

```javascript
command: 'node',
args: ['dist/server.js'],
cwd: process.resourcesPath + '/runtime'
```

The runtime's compiled files and dependencies are bundled as `extraResources` in the installer.

## Environment

The runtime process inherits the Electron app's environment variables plus:

| Variable | Value |
|----------|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `development` or `production` |

**Note:** The runtime's `.env` file is NOT packaged in the installer (it may contain secrets). Users must configure API keys and provider settings through the Settings UI or by creating a `.env` file in the runtime directory manually.

## Logging

Runtime stdout and stderr are captured in an in-memory ring buffer (max 1000 lines). The last 200 lines are available via the `getRuntimeLogs()` IPC method and viewable in the Settings → Runtime Server → Runtime Logs panel.

Electron's own logs are written to:
- **File:** `%USERPROFILE%\AppData\Roaming\Aster Code\logs\main.log`
- **Console:** Visible in dev mode

## Lifecycle

```
App ready
  │
  ├── Check if runtime is already running
  │     ├── Yes → set status = 'online', monitor health
  │     └── No  → spawn runtime process
  │                 │
  │                 ├── process.stdout → capture logs
  │                 ├── process.stderr → capture logs
  │                 └── process 'exit' → set status = 'error'/'offline'
  │
  ├── Start health monitor (5s interval)
  │
  └── Register IPC handlers

App before-quit
  │
  └── If we started the runtime:
        ├── Send SIGTERM
        ├── Wait 5s
        └── If still alive: send SIGKILL
```

## Security Invariants

1. **No arbitrary shell execution** — The renderer can only call pre-approved IPC methods
2. **No environment secrets** — The runtime's API keys are never sent to the renderer
3. **No arbitrary file access** — The renderer cannot spawn arbitrary processes or read files
4. **Runtime isolation** — The runtime runs as a separate process; a crash does not crash the Electron UI
