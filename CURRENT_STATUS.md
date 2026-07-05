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
2. **Vite bundling** — Production React app builds in ~1.26s
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

### Frontend UI
1. **Layout** — AppShell + Sidebar + TopBar navigation works
2. **Chat Screen** — Message display, text input, agent activity timeline (simulated)
3. **Workbench Screen** — File tree explorer, text editor, terminal panel, live preview iframe
4. **Models Screen** — Provider filter, model selector, capability badges, context window slider
5. **Skills Screen** — Skill cards with toggleable status + execution mode
6. **Settings Screen** — Provider config forms (toggles, URLs, API keys), system prompt library
7. **Theme** — Consistent ivory/sand/clay palette (Claude-like, not neon/cyberpunk)
8. **SSE connection** — Workbench listens for live log/preview events via EventSource
9. **Runtime connectivity** — Health polling every 8 seconds, graceful offline state

---

## What's Broken / Missing ❌

### Build Dependencies
1. **2 npm vulnerabilities** (1 moderate, 1 high) — In transitive deps, run `npm audit fix` to address
2. **`esbuild` package scripts** require manual approval via `npm approve-scripts` on some systems

### Missing Packages
1. **`packages/skills`** — Does not exist. The `workspaces` config in `package.json` references `packages/*` which only resolves to `packages/shared`. The SkillsScreen in the frontend uses hardcoded `SkillDefinition[]` data with no backend registry.

### Stubbed / Simulated Functionality
1. **ChatScreen agent loop** — Not connected to real LLMs. The chat messages and agent activity steps are fully simulated with hardcoded mock data (`mockSteps` array, hardcoded assistant responses).
2. **Agent completion** — No LLM inference endpoint exists. There's no `/api/chat/completions` or similar endpoint.
3. **File editing** — Workbench editor shows files but the "Agent" cannot read or edit files programmatically yet.
4. **Skills backend** — No backend registry for skills. SkillsScreen data is hardcoded in React state.
5. **Provider adapters** — `anthropic` adapter wraps OpenAI-Compatible adapter with placeholder URL. No real Anthropic SDK integration.
6. **Model fallback** — Registry hardcodes Claude 3.5 Sonnet and GPT-4o as fallback models even when no providers are configured.

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
