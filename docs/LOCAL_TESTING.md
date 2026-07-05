# Local Testing Guide — Aster Code

This guide helps you verify that Aster Code builds and runs correctly on your local machine.

---

## Prerequisites

- **Node.js 18+** installed ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Windows Terminal** or **PowerShell**
- **Git** (optional, for version control)

---

## Quick Start (Windows PowerShell)

Open **PowerShell** and run each step:

### 1. Navigate to the project

```powershell
cd C:\Users\mertg\aster-code
```

### 2. Install dependencies

```powershell
npm install
```

Expected: installs all workspace dependencies (shared, web, runtime).

### 3. Run the full check suite

```powershell
npm run check
```

This runs three checks:
- `npm run typecheck` — TypeScript type checking across all workspaces
- `npm run build` — production build of all workspaces
- `npm run runtime:build` — explicit runtime server compilation

Expected: all three steps pass with **0 errors**.

### 4. Start the runtime server (terminal 1)

```powershell
npm run runtime:dev
```

Expected output:
```
========================================
Aster Code Runtime Server listening on port 3001
Health endpoint: http://localhost:3001/health
========================================
```

Verify the health endpoint in a browser or with curl:

```powershell
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"...","uptime":...}`

### 5. Start the web frontend (terminal 2)

Open a **second** PowerShell terminal, then:

```powershell
cd C:\Users\mertg\aster-code
npm run dev:web
```

Expected: Vite dev server starts at `http://localhost:5173`.

### 6. Open the app

Navigate to **http://localhost:5173** in your browser.

---

## Smoke Test Checklist

After opening the app at http://localhost:5173, verify each of these:

| # | Check | How to verify |
|---|-------|--------------|
| 1 | **App opens** | The Aster Code UI loads with sidebar, top bar, and chat screen |
| 2 | **Navigation works** | Click each sidebar item: Chat Studio, Workbench, Model Registry, Agent Skills, Settings — each screen loads |
| 3 | **Chat screen works** | Type a task (e.g. "explain how this project works"), press Enter — a session is created and a plan is shown |
| 4 | **Workbench screen works** | Click Workbench — file tree loads (or shows empty state if no workspace files), terminal is idle, preview shows empty state |
| 5 | **Models screen works** | Click Model Registry — shows provider filter, model dropdown, connection matrix |
| 6 | **Skills screen works** | Click Agent Skills — 8 built-in skills are listed with active/inactive toggles |
| 7 | **Settings screen works** | Click Settings — provider configs shown, system prompt library with 3 defaults |
| 8 | **Runtime health** | Visit http://localhost:3001/health — returns `{"status":"ok"}` |

---

### Alternative: Single Terminal

You can also start both servers at once with:

```powershell
npm run dev
```

This runs `runtime:dev` and `dev:web` concurrently in one terminal. Configure your `.env` file first if you need API keys.

---

## All Available Scripts

| Command | Description |
|---------|-------------|
| `npm run check` | Full validation: typecheck + build + runtime:build |
| `npm run typecheck` | TypeScript type checking (all workspaces) |
| `npm run build` | Production build (all workspaces) |
| `npm run runtime:build` | Runtime server compilation only |
| `npm run runtime:dev` | Start runtime server with hot reload |
| `npm run dev:web` | Start web frontend dev server |
| `npm run dev` | Start both runtime + web concurrently |

---

## URLs

| Service | URL |
|---------|-----|
| Web frontend | http://localhost:5173 |
| Runtime server | http://localhost:3001 |
| Runtime health | http://localhost:3001/health |

---

## Troubleshooting

### "Port 3001 already in use"

```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Port 5173 already in use"

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### "npm install fails"

- Make sure you're in the correct directory: `cd C:\Users\mertg\aster-code`
- Try deleting `node_modules` and `package-lock.json`, then re-run `npm install`
- Check that Node.js 18+ is installed: `node --version`

### TypeScript errors after install

```powershell
# Clear TypeScript build caches
npx tsc --build --clean
# Then rebuild
npm run typecheck
```

### "Runtime server won't start"

- Check that no other process is using port 3001
- Verify the `.env` file exists in `apps/runtime/` (use `apps/runtime/.env.example` as template if needed)
- Look for error messages in the terminal output

---

## Current Status

As of 2026-07-05:
- ✅ All 3 workspaces typecheck with 0 errors
- ✅ All 3 workspaces build successfully
- ✅ Runtime server starts and responds to health checks
- ✅ Web app loads and all 5 screens render
- ⚠️ Agent plans are deterministic/mock (no real LLM calls yet)
- ⚠️ File writes and commands are simulated in MVP
