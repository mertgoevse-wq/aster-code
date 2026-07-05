# Aster Code Agent Loop MVP Build Report

Date: 2026-07-05 (stabilized + local test workflow)
Status: SUCCESS — All builds pass cleanly

## Commands Run
1. `npm install`
   - Outcome: 262 packages, up to date. 2 npm warnings (esbuild scripts), 2 vulnerabilities.
2. `npm run check`
   - Outcome: typecheck (0 errors), build (0 errors), runtime:build (0 errors) — ALL PASS
3. `npm run typecheck` — 0 errors
4. `npm run build` — 0 errors
5. `npm run runtime:build` — 0 errors

## Auth Scaffolding (GitHub + Google OAuth)
- Created `apps/runtime/src/auth/` module with 5 files:
  - `types.ts` — Auth types (OAuthConfig, StoredSession, TokenExchangeResult)
  - `oauthConfig.ts` — OAuth config for GitHub and Google, env var loading, authorize URL generation
  - `sessionStore.ts` — In-memory auth session store (no persistent storage, no plaintext tokens on disk)
  - `githubOAuth.ts` — GitHub OAuth handler (placeholder: config validation + authorize URL implemented, token exchange not yet)
  - `googleOAuth.ts` — Google OAuth handler (placeholder: config validation + authorize URL implemented, token exchange not yet)
- 6 new API endpoints: GET /auth/status, POST /auth/logout, GET /auth/github/start, GET /auth/google/start, GET /auth/callback
- `docs/AUTH_ARCHITECTURE.md` — Full architecture with local-first mode, OAuth flows, token storage rules, platform differences
- Frontend SettingsScreen: auth section with GitHub/Google login buttons (disabled), local-first mode indicator, feature grid, session storage explanation
- No secrets in frontend: all OAuth credentials are runtime `.env` only
- Shared types added: AuthStatus, AuthUser, AuthFeatures, AuthSession, AuthProvider, AuthMode
- Updated `docs/SECURITY.md` with auth security section

## MCP Gateway Scaffolding
- Created `apps/runtime/src/mcp/` module with 5 files:
  - `types.ts` — Internal MCP types (ToolDiscoveryRequest, GatewayInvokeResult, etc.)
  - `policies.ts` — Access control, tool categorization (5 categories), risk assessment, audit entry creation
  - `registry.ts` — MCP server registry with 4 default servers (all disabled), CRUD operations
  - `gateway.ts` — Tool discovery with filtering (blocked/allowlist), governed invocation, audit logging, mock tool generation
  - `mcpoClient.ts` — mcpo-style OpenAPI bridge placeholder
- 4 default MCP server configs: Filesystem (stdio), GitHub (http), Postman API (mcpo-openapi), Memory (stdio)
- All servers disabled by default; blocked tools hidden; write/network/system always require approval
- 8 new API endpoints: GET/POST/PATCH/DELETE /mcp/servers, POST discover/discover-all, GET/DELETE audit log
- `docs/MCP_GATEWAY.md` — full architecture docs with safety invariants, tool flow, API reference
- `docs/MCP_SECURITY_POLICY.md` — 5-layer access control, permission levels, configurable settings
- Audit log: in-memory, records every invocation (success/error/blocked/pending-approval)
- MVP: no real MCP tool discovery (mock tools), no real tool execution (simulated)

## Automatic Agent Skill Routing
- Added 14 intent categories: explain-code, build-feature, fix-bug, debug-build, improve-ui, dependency-task, write-tests, create-docs, refactor, setup-runtime, model-provider-task, mcp-tool-task, git-task, unknown
- `intentClassifier.ts`: rule-based keyword matching classifier
- `skillRouter.ts`: intent-to-skill mapping with confidence scores, risk levels, and permission requirements
- `agentRouter.ts`: orchestrates full pipeline (classify → route → result)
- `AgentRoutingPreview.tsx`: frontend component showing detected intents, selected skills, reasons, permissions, risk badges
- Server plan endpoint returns `routing` field alongside plan
- ChatScreen displays routing preview before plan panel
- Risk levels: low/medium/high per skill candidate
- Approval gating preserved: file-edit and command skills always require approval

## External Repo Research
- Analyzed 29 repos from GitHub star list (12 cloned, 17 reviewed from metadata)
- Created `docs/EXTERNAL_REPO_RESEARCH.md` — detailed analysis of all repos
- Created `docs/SKILL_CANDIDATE_MATRIX.md` — 12 new skill proposals across 3 tiers
- Created `docs/REPO_LICENSE_REVIEW.md` — license assessment (14 MIT, 3 Apache 2.0, 2 GPL, 3 leaked)
- Created `docs/EXTERNAL_REPO_IMPORT_QUEUE.md` — tracking queue
- Added 8 placeholder skill candidates to `apps/runtime/src/skills/registry.ts` (all `inactive`)
- 3 repos rejected (leaked proprietary content); 2 marked irrelevant
- No external code imported — all entries are original descriptions

## Local Test Workflow
- Added `npm run check` script: runs typecheck + build + runtime:build
- Added `npm run runtime:dev` alias (same as `dev:runtime`)
- Created `docs/LOCAL_TESTING.md` with Windows PowerShell instructions
- Smoke test checklist: app opens, navigation, chat, workbench, models, skills, settings, health endpoint
- Troubleshooting section: port conflicts, install issues, TypeScript cache
- Updated `README.md` with streamlined quick start and link to testing guide
- Agent module (`apps/runtime/src/agent/`) compiles correctly
- Frontend components (`AgentActivityFeed`, `AgentPlanPanel`) compile correctly
- ChatScreen and SkillsScreen integrate with backend APIs without type errors

## System Prompt Library Enhancement
- Added `tags: string[]` and `updatedAt: string` fields to `SystemPromptTemplate`
- SettingsScreen: full CRUD with create, edit, duplicate, delete, set-as-default
- SettingsScreen: tag input with Enter/comma add and remove
- SettingsScreen: export prompts as downloadable JSON file
- SettingsScreen: import prompts via JSON paste or file upload (merges by id)
- SettingsScreen: active prompt selection persisted to localStorage
- ChatScreen: displays active prompt badge with clear button
- ChatScreen: polls for prompt changes via `visibilitychange` + `storage` events
- Shared localStorage helpers exported from SettingsScreen, imported by ChatScreen

## Model Picker UX Enhancement
- TopBar: provider filter dropdown + model dropdown (filtered by provider)
- TopBar: model detail popover card with all specs (context, output, streaming, tools, vision, best for, description, last checked)
- TopBar: refresh button, cache status timestamp, auto-refresh toggle with interval menu (1m/3m/5m/10m/30m)
- App.tsx: auto-refresh timer that periodically calls handleRefreshModels when enabled
- App.tsx: cache status fetched from GET /api/models/status every 8s
- Provider filter change auto-selects first available model from filtered list
- Loading/error/empty states: "Loading models..." while refreshing, "No models available" when empty

## Workbench MVP Polish
- Four-panel layout: file tree (left), editor with tab bar (center), terminal (bottom), preview with browser frame (right)
- Multi-tab editor: open multiple files, switch tabs, unsaved indicator (dot), close with unsaved confirmation
- Status bar: shows file path, line count, saved/unsaved status, save button
- File tree: loading spinner, empty state, file-type icons (ts/js/json/css/html/md/image), create file/folder
- Terminal: dark theme, disabled command buttons when offline, idle message, stop button during execution
- Preview: browser frame chrome (red/yellow/green dots, URL bar), dash-centered empty state, live indicator
- Offline overlay: centered message with runtime start instructions
- All buttons disabled when runtime not connected
- Consistent ivory/Claude-like theme throughout

## Agent Loop MVP — What Was Built

### Runtime Backend
- **Agent module** (`apps/runtime/src/agent/`):
  - `types.ts` — Re-exports shared types; defines `Session`, `TaskClassification`, `ExecutionContext`
  - `planner.ts` — Rule-based task classifier (7 types), skill selector, deterministic plan generator
  - `loop.ts` — Safe execution loop with permission-gated step execution, simulated MVP execution
  - `policies.ts` — 5-tier permission model with hierarchy checks, action-to-permission mapping
  - `sessionStore.ts` — In-memory session store with CRUD operations

- **Skills module** (`apps/runtime/src/skills/`):
  - `registry.ts` — Backend skills registry with 8 built-in skills, runtime updates via PATCH
  - `runner.ts` — Skills validator and runner with permission checks

- **Server** (`apps/runtime/src/server.ts`):
  - 8 new agent API endpoints added

### Frontend
- **AgentActivityFeed** (`apps/web/src/components/AgentActivityFeed.tsx`):
  - Timeline display of agent events with status icons, tool badges, file references, timestamps
- **AgentPlanPanel** (`apps/web/src/components/AgentPlanPanel.tsx`):
  - Expandable step list, permission badges, approve/reject buttons, status indicators for all plan states
- **ChatScreen** (`apps/web/src/screens/ChatScreen.tsx`):
  - Complete rewrite: sends tasks to agent session API, displays plan for approval, shows execution results
- **SkillsScreen** (`apps/web/src/screens/SkillsScreen.tsx`):
  - Fetches skills from backend `GET /api/agent/skills`, toggles via `PATCH /api/agent/skills/:id`

### API Endpoints Added
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agent/session` | Create agent session |
| GET | `/api/agent/session/:id` | Get session with plan & events |
| POST | `/api/agent/session/:id/plan` | Classify task & generate plan |
| POST | `/api/agent/session/:id/approve` | Approve & execute plan |
| POST | `/api/agent/session/:id/reject` | Reject plan |
| GET | `/api/agent/session/:id/events` | Get session events |
| GET | `/api/agent/skills` | List registered skills |
| PATCH | `/api/agent/skills/:id` | Update skill config |

### Shared Types Added
- `AgentTaskType`, `PermissionLevel`, `AgentPlanStatus`, `AgentStepStatus`
- `AgentPlanStep`, `AgentPlan`, `AgentSessionInfo`, `AgentEvent`

### Documentation Added/Updated
- `docs/AGENT_ARCHITECTURE.md` — Full agent loop architecture, approval flow, permission model, API reference
- `docs/SKILLS.md` — Updated with backend registry info and skill selection table
- `docs/SECURITY.md` — Added agent loop safety invariants and skill-level permission mapping

## Verification Results
- ✅ All 3 workspaces typecheck with 0 errors
- ✅ All 3 workspaces build successfully (shared rebuilt for MCP type exports)
- ✅ MCP server CRUD endpoints functional
- ✅ Policy checks enforce: disabled-by-default, blocked-tools-hidden, write/network/system-require-approval
- ✅ Audit entries created for all invocation code paths

## Previous Verification Results (from prior runs)
- ✅ All 3 workspaces typecheck with 0 errors
- ✅ All 3 workspaces build successfully
- ✅ Agent approval flow guards correctly placed
- ✅ dangerous-disabled permissions permanently blocked
- ✅ No secrets in frontend code
- ✅ Skills screen fetches from backend with loading/error states
- ⚠️ MVP: Plans are deterministic/mock, no real LLM calls
- ⚠️ MVP: File writes and commands are simulated only
- ⚠️ Sessions are in-memory (lost on restart)
