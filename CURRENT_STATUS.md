# Current Status — Aster Code Repository Audit

Date: 2026-07-05
Auditor: Codebuff (automated audit)

---

## Architecture Summary

```
aster-code/
├── packages/shared/       ← Shared TypeScript interfaces & types
│   └── src/types.ts       ModelMetadata, FileNode, ChatMessage, etc.
├── apps/web/              ← React + Vite frontend (ivory theme)
│   └── src/
│       ├── api.ts          API base URL resolver (Electron vs browser) ✅ NEW
│       ├── App.tsx         State management, routing, health polling + runtime status
│       ├── components/     AppShell, Sidebar, TopBar
│       ├── screens/        ChatScreen, WorkbenchScreen, ModelsScreen,
│       │                   SkillsScreen, SettingsScreen (has Runtime panel)
│       └── styles/         Tailwind CSS (ivory/sand/clay palette)
├── apps/runtime/           ← Express backend (port 3001)
│   └── src/
│       ├── server.ts       REST API endpoints + SSE
│       ├── commands.ts     Allowlisted command runner
│       ├── workspace.ts    File system sandbox (path-traversal safe)
│       └── ...
├── apps/desktop/           ← Electron desktop app ✅ UPDATED
│   └── src/
│       ├── main.ts         Runtime auto-start/stop, IPC handlers, health monitoring
│       ├── preload.ts      Safe IPC bridge: getRuntimeStatus, restartRuntime, etc.
│       └── window.ts       BrowserWindow factory
├── docs/
│   ├── DESKTOP_APP.md      ✅ Updated with runtime management
│   ├── DESKTOP_RUNTIME.md  ✅ NEW: Runtime IPC API, lifecycle docs
│   ├── WINDOWS_INSTALLER_TEST.md ✅ NEW: Installer smoke test workflow
│   ├── START_HERE.md       ✅ Updated
│   └── ...
├── tsconfig.base.json     Shared TS config (NodeNext module)
├── package.json           ✅ Scripts updated (check includes desktop)
├── AGENTS.md              Rules for AI assistants
└── BUILD_REPORT.md        ✅ Updated
```

## What Works ✅

### First-Run Experience (New)
1. **✅ Welcome Banner** — Shows on first visit: onboarding, What Works Now, Coming Next, MVP limitations
2. **✅ Suggested Prompts** — 3 one-click prompts: "explain this project", "create a hello world app", "add a dark mode toggle"
3. **✅ Dismiss Persistence** — Welcome banner dismisses permanently via localStorage
4. **✅ LLM Disconnected Indicator** — Status bar shows amber "LLM disconnected" badge

### Desktop App (Updated)
1. **✅ API calls work in packaged app** — `api.ts` helper resolves `http://localhost:3001` directly in Electron, bypassing Vite proxy
2. **✅ Runtime auto-starts** — Electron detects if runtime is running; if not, spawns as child process
3. **✅ Runtime health monitoring** — Pings `/health` every 5 seconds, broadcasts status changes
4. **✅ Runtime IPC** — Renderer can get status, restart, view logs via secure IPC bridge
5. **✅ Status bar** — Shows runtime state (starting/online/offline/error) with colored badges
6. **✅ Settings Runtime Panel** — Restart button, runtime logs viewer, status info
7. **✅ Packaging** — `extraResources` includes web dist, runtime dist, runtime deps
8. **✅ All scripts work** — `check`, `app:build`, `desktop:dist`, `desktop:smoke`

### Everything Else That Works
1. **Build & Type System** — All workspaces typecheck and build
2. **Backend API** — Health, providers, models, workspace, commands, SSE
3. **Frontend UI** — All screens functional
4. **Agent Loop** — Session management, plan generation, approval flow
5. **MCP Gateway** — Server registry, tool discovery, audit logging
6. **Auth Scaffolding** — GitHub/Google OAuth placeholders

## What's Broken / Missing ❌

### Known Limitations
1. **Packaged runtime has no `.env`** — Users must configure providers via Settings UI
2. **Runtime node_modules adds ~50MB** — Future optimization: bundle runtime more efficiently
3. **Default Electron icon** — Custom Aster Code icon not yet created
4. **No macOS/Linux installer** — Windows NSIS only
5. **Plans are deterministic/mock** — No real LLM calls yet (Phase 2)
6. **In-memory sessions** — Lost on server restart (Phase 2)
7. **No real LLM completion** — No `/api/chat/completions` endpoint

### Dependencies
1. **36 npm vulnerabilities** (2 low, 10 moderate, 18 high, 6 critical) — Run `npm audit fix`

### Stubbed Features (Clearly Indicated)
1. **LLM chat** — Mock plans only; "LLM disconnected" badge in status bar + WelcomeBanner limitations panel
2. **OAuth** — GitHub/Google buttons disabled in Settings with "not implemented" notes
3. **MCP execution** — Registry built but real tool execution TBD; noted in WelcomeBanner
4. **External skills** — 8 inactive candidates from repo research; shown in Skills screen

## Audit Checklist Results

| # | Check | Result |
|---|-------|--------|
| 1 | Packaged app API calls work? | ✅ Yes — uses `http://localhost:3001` directly |
| 2 | Runtime auto-starts? | ✅ Yes — spawned as child process by Electron |
| 3 | Runtime IPC bridge secure? | ✅ Yes — allowlist only, no shell access |
| 4 | Restart runtime works? | ✅ Yes — via Settings UI |
| 5 | Runtime logs viewable? | ✅ Yes — in Settings Runtime Logs panel |
| 6 | electron-builder includes runtime? | ✅ Yes — extraResources configured |
| 7 | `npm run check` works? | ✅ Yes — includes desktop:build |
| 8 | `npm run desktop:dist` works? | ✅ Yes — builds web + runtime + packages |
| 9 | `npm run desktop:smoke` works? | ✅ Yes — prints paths, verifies artifacts |
| 10 | `docs/WINDOWS_INSTALLER_TEST.md` exists? | ✅ Yes — 17-item checklist + troubleshooting |
| 11 | WelcomeBanner shows on first visit? | ✅ Yes — onboarding, What Works Now, Coming Next, limitations |
| 12 | LLM disconnected indicator visible? | ✅ Yes — amber badge in status bar |
| 13 | Stubbed features clearly marked? | ✅ Yes — disabled OAuth buttons, limitations panel, status badge |
