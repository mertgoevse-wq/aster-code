# Start Here — Aster Code

The fastest way to get Aster Code running on your machine.

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm 9+** (included with Node.js)
- **Windows 10/11**, macOS, or Linux

## Step 1: Navigate to the Project

```powershell
cd aster-code
```

*(Adjust the path if you cloned elsewhere.)*

## Step 2: Install Dependencies

```powershell
npm install
```

Install all dependencies for the web app, runtime server, and desktop app.

> **Optional verification:** Run `npm run check` to typecheck and build everything. Should complete with no errors.

## Step 3: Start Aster Code

```powershell
npm run app:dev
```

One command starts **all three servers**:

| Server | URL |
|--------|-----|
| 🔵 **Runtime** | `http://localhost:3001` — API, model registry, agent loop |
| 🟣 **Web App** | `http://localhost:5173` — React/Vite frontend |
| 🟡 **Desktop** | Electron window opens automatically |

## Step 4: Test the App

When the app opens:

1. **Sidebar** — Click through Chat Studio, Workbench, Model Registry, Agent Skills, Settings
2. **Status bar** — Bottom shows runtime status badge (starting/online/offline/error), URL, model count
3. **Chat** — Type a task (e.g. "explain this project") and verify a plan is generated
4. **Models** — Check if provider models are listed
5. **Settings** — Toggle providers, edit system prompts, check Runtime Server panel

> If the Electron window doesn't open, just use `http://localhost:5173` in your browser — the web app works without Electron.

## Building

```powershell
# Build everything for distribution
npm run app:build

# Package Windows installer (builds web + runtime + desktop)
npm run desktop:dist
```

Output: `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Port in use** | Kill the process: `npx kill-port 3001 5173` |
| **Blank Electron window** | Wait ~5s, Vite may not be ready yet |
| **Runtime "offline"** | Check `http://localhost:3001/health` returns OK, or restart from Settings |
| **Missing modules** | Run `npm install` from project root |
| **Windows blocks installer** | Click "More info" → "Run anyway" (unsigned app) |
| **Runtime logs** | View in Settings → Runtime Server → Runtime Logs |

## Key Docs

| File | Covers |
|------|--------|
| `docs/LOCAL_TESTING.md` | Smoke test checklist |
| `docs/DESKTOP_APP.md` | Electron setup, packaging, runtime management |
| `docs/DESKTOP_RUNTIME.md` | Runtime IPC API, lifecycle, health monitoring |
| `docs/AGENT_ARCHITECTURE.md` | Agent loop and routing |
| `docs/SECURITY.md` | Security model |
