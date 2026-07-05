# Next Steps — After Agent Loop MVP

Date: 2026-07-05
Based on: Agent Loop MVP implementation

---

## Immediate Priority: Phase 3 (Real Execution + LLM)

The agent loop architecture is in place but execution is simulated. The next prompts should focus on connecting real capabilities.

### Step 1: Real LLM Completion Endpoint
- **File**: `apps/runtime/src/server.ts`, new file `apps/runtime/src/agent/completer.ts`
- **Action**: Add `POST /chat/completions` that routes to provider adapters
- Use `ModelRegistry` to resolve model → adapter → API call
- Return streaming response (SSE or chunked)

### Step 2: Real Plan Generation via LLM
- **File**: `apps/runtime/src/agent/planner.ts`
- **Action**: Replace rule-based `classifyTask` / `generatePlan` with LLM-based planning
- Send system prompt + task to LLM, parse structured plan response
- Keep rule-based fallback for offline mode

### Step 3: Real Step Execution
- **File**: `apps/runtime/src/agent/loop.ts`
- **Action**: Replace `simulateWork()` with actual file reads via workspace API
- For write/command steps: require user approval, then execute via workspace/commands modules
- Add real error handling and rollback hints

### Step 4: Real Anthropic SDK Integration
- Replace the placeholder Anthropic adapter with actual `@anthropic-ai/sdk`
- Add proper streaming support for Claude models
- Implement tool-use response parsing

---

## Medium Priority

### Step 5: Implement Real OAuth Flow
- **File**: `apps/runtime/src/auth/githubOAuth.ts`, `googleOAuth.ts`
- **Action**: Implement token exchange (code → access_token), user profile fetch, session creation
- Add CSRF state validation (store generated states, verify on callback)
- Add PKCE support for web/client-side flows
- Enable login buttons in SettingsScreen when OAuth is configured

### Step 6: Real MCP Execution
- **File**: `apps/runtime/src/mcp/gateway.ts`
- **Action**: Replace mock tool generation with real MCP JSON-RPC tool discovery
- Implement stdio process management for local MCP servers
- Add real tool invocation routing through the gateway
- Add persistent audit log storage (SQLite or file-based)

### Step 6: Session Persistence
- Replace in-memory `sessionStore` with file-based or SQLite storage
- Add session list endpoint (`GET /agent/sessions`)

### Step 6: Monaco Editor Integration
- Replace `<textarea>` in WorkbenchScreen with Monaco Editor
- Add syntax highlighting, autocomplete, diff view

### Step 7: Fix npm Vulnerabilities
- Run `npm audit fix` to address transitive dependency issues

### Step 8: Add Unit Tests
- Test the agent planner (classification, skill selection)
- Test the session store (CRUD operations)
- Test the policies engine (permission checks)
- Test the skills registry and runner

---

## Completed: Agent Skill Routing ✅
- `apps/runtime/src/agent/intentClassifier.ts` — 14-intent classifier
- `apps/runtime/src/agent/skillRouter.ts` — intent-to-skill mapping with confidence/risk
- `apps/runtime/src/agent/agentRouter.ts` — full routing pipeline
- `apps/web/src/components/AgentRoutingPreview.tsx` — routing visualization
- ChatScreen shows routing preview before plan

## Completed: External Repo Research ✅
- 29 repos analyzed, 12 cloned shallowly into `_research/import-candidates/`
- `docs/EXTERNAL_REPO_RESEARCH.md`, `SKILL_CANDIDATE_MATRIX.md`, `REPO_LICENSE_REVIEW.md`
- 8 placeholder skill candidates added to registry (all `inactive`)
- See `docs/SKILL_CANDIDATE_MATRIX.md` for Tier 1 priority candidates

## Completed: Auth Scaffolding ✅
- `apps/runtime/src/auth/types.ts` — Auth types
- `apps/runtime/src/auth/oauthConfig.ts` — GitHub + Google OAuth config
- `apps/runtime/src/auth/sessionStore.ts` — In-memory auth session store
- `apps/runtime/src/auth/githubOAuth.ts` — GitHub OAuth handler (placeholder)
- `apps/runtime/src/auth/googleOAuth.ts` — Google OAuth handler (placeholder)
- 6 new API endpoints: status, logout, github/start, google/start, callback
- Frontend SettingsScreen: auth section with disabled login buttons, local-first indicator
- `docs/AUTH_ARCHITECTURE.md` — Full architecture documentation

## Completed: MCP Gateway Scaffold ✅
- `apps/runtime/src/mcp/types.ts` — Internal MCP types
- `apps/runtime/src/mcp/policies.ts` — Access control, categorization, risk assessment, audit
- `apps/runtime/src/mcp/registry.ts` — Server config registry with CRUD, 4 default servers (all disabled)
- `apps/runtime/src/mcp/gateway.ts` — Tool discovery filtering, governed invocation, mock tool generation
- `apps/runtime/src/mcp/mcpoClient.ts` — mcpo OpenAPI bridge placeholder
- 8 new API endpoints on server (server CRUD + discovery + audit)
- `docs/MCP_GATEWAY.md` and `docs/MCP_SECURITY_POLICY.md`

## Completed: Local Test Workflow ✅
- `npm run check` runs typecheck + build + runtime:build
- `npm run runtime:dev` starts the runtime with hot reload
- `docs/LOCAL_TESTING.md` has Windows PowerShell instructions and smoke test checklist
