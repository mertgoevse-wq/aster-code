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
│       ├── App.tsx         State management, routing, health polling
│       ├── components/     AppShell, Sidebar, TopBar
│       ├── screens/        ChatScreen, WorkbenchScreen, ModelsScreen,
│       │                   SkillsScreen, SettingsScreen
│       └── styles/         Tailwind CSS (ivory/sand/clay palette)
├── apps/runtime/           ← Express backend (port 3001)
│   └── src/
│       ├── server.ts       REST API endpoints + SSE
│       ├── commands.ts     Allowlisted command runner
│       ├── workspace.ts    File system sandbox (path-traversal safe)
│       ├── events.ts       SSE broadcaster
│       └── providers/      Model registry + adapters
│           ├── registry.ts  Central registry with caching/TTL
│           ├── types.ts     ProviderAdapter interface
│           ├── ollama.ts
│           ├── lmstudio.ts
│           ├── openrouter.ts
│           ├── nvidia.ts
│           └── openaiCompatible.ts
├── docs/                   Architecture, Providers, Security, Skills, Roadmap
├── tsconfig.base.json     Shared TS config (NodeNext module)
├── package.json           npm workspaces monorepo root
├── AGENTS.md              Rules for AI assistants
└── BUILD_REPORT.md        Build status
```

---

## What Works ✅

### Build & Type System
1. **TypeScript compilation** — All 3 workspaces typecheck with 0 errors
2. **Vite bundling** — Production React app builds cleanly
3. **Runtime compilation** — Express server builds with tsc to `dist/`
4. **npm workspace isolation** — Each workspace resolves its own deps
5. **Shared package re-exports** — `@aster-code/shared` types are correctly imported by web and runtime

### Backend API (Runtime Server)
1. **Health check** — `GET /health` returns uptime + status
2. **Provider endpoints** — `GET /providers`, `GET /models`, `POST /models/refresh` all functional
3. **Config update** — `POST /config` updates registry settings in memory
4. **Workspace CRUD** — `GET /workspace/files`, `GET/POST/DELETE /workspace/file`, `POST /workspace/folder`
5. **Command runner** — `POST /commands/run` with allowlist, `POST /commands/stop`
6. **SSE events** — `GET /events` broadcasts `log`, `command_status`, `preview_status`
7. **Model Registry** — Supports 5 adapters: Ollama, LM Studio, OpenRouter, NVIDIA, OpenAI-Compatible
8. **Registry caching** — TTL-based cache (default 5 min), background refresh, manual refresh
9. **Workspace boilerplate** — Creates Vite sandbox project if workspace empty
10. **🆕 Agent Loop API** — 8 endpoints for session management, plan generation, approval, execution
11. **🆕 Backend Skills Registry** — 8 built-in skills with runtime update support

### Frontend UI
1. **Layout** — AppShell + Sidebar + TopBar navigation works
2. **🆕 Chat Screen** — Connected to agent session APIs, plan approval flow, activity feed
3. **Workbench Screen** — File tree explorer, text editor, terminal panel, live preview iframe
4. **Models Screen** — Provider filter, model selector, capability badges, context window slider
5. **🆕 Skills Screen** — Fetches from backend API, supports toggle with PATCH updates
6. **Settings Screen** — Provider config forms (toggles, URLs, API keys), system prompt library
7. **Theme** — Consistent ivory/sand/clay palette (Claude-like, not neon/cyberpunk)
8. **SSE connection** — Workbench listens for live log/preview events via EventSource
9. **Runtime connectivity** — Health polling every 8 seconds, graceful offline state
10. **🆕 AgentActivityFeed** — Real-time step timeline with status icons, tool badges, timestamps
11. **🆕 AgentPlanPanel** — Expandable step list, permission badges, approve/reject buttons
12. **🆕 System Prompt Library** — Full CRUD with tags, duplicate, export/import JSON, localStorage persistence
13. **🆕 Chat prompt badge** — Active prompt displayed in chat, syncs across tabs
14. **🆕 Model Picker UX** — Provider + model dropdowns in TopBar, detail popover with all specs, auto-refresh timer (configurable interval), cache status

---

## What's Broken / Missing ❌

### MVP Limitations (Intentional)
1. **Plans are deterministic/mock** — Rule-based classification, no real LLM calls (Phase 2)
2. **Execution is simulated** — Steps appear in activity feed but don't actually modify files or run commands
3. **In-memory sessions** — Lost on server restart (Phase 2)
4. **No streaming** — Execution results returned as single response
5. **No real LLM completion** — No `/api/chat/completions` or similar endpoint
6. **Provider adapters** — `anthropic` adapter wraps OpenAI-Compatible adapter with placeholder URL

### Build Dependencies
1. **2 npm vulnerabilities** (1 moderate, 1 high) — In transitive deps, run `npm audit fix` to address

### Security Check
1. **No secrets in frontend** ✅ — API keys are only stored in runtime memory/.env, never in localStorage
2. **API key scrubbing** ✅ — SettingsScreen explicitly deletes keys before saving to localStorage
3. **Path traversal protection** ✅ — `workspace.ts` has `getSafePath()` that blocks `..` escapes

### UI Theme
1. **Ivory/Claude palette** ✅ — Colors use warm beige tones (#FAF9F6, #F5F2EC, #866854), not neon or cyberpunk
2. **Fonts** ✅ — Instrument Sans, Instrument Serif, JetBrains Mono

---

## Audit Checklist Results

| # | Check | Result |
|---|-------|--------|
| 1 | Web app starts/builds? | ✅ Builds successfully |
| 2 | Runtime server builds? | ✅ Builds successfully |
| 3 | Provider registry exists? | ✅ 5 adapters in registry.ts |
| 4 | Workbench/live preview MVP exists? | ✅ File explorer, editor, terminal, iframe preview |
| 5 | Skills registry exists? | ❌ Only frontend hardcoded data, no backend package |
| 6 | Broken imports? | ✅ None (typecheck passes) |
| 7 | Fake/stubbed functions? | ⚠️ Chat is fully simulated, no real LLM calls |
| 8 | Secrets in frontend files? | ✅ None found |
| 9 | UI calm ivory/Claude-like? | ✅ Warm beige palette, not cyberpunk |
