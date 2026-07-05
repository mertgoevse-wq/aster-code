# Next Steps — After v0.1.0 Release Candidate

Date: 2026-07-05
Commit: `0d477c7`
Status: ✅ Release candidate ready. Installer at `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe`

---

## ✅ Completed: v0.1.0 Release Candidate

### Release Candidate Audit
- Full pipeline verified: `npm run release:local` passes
- All 7 output artifacts verified
- Smoke tests: 4/4 suites pass
- `RELEASE_CANDIDATE_REPORT.md` created with full audit

### Agent Planning Quality
- German + English intent classification with language detection
- Enriched plan steps (inspectionTargets, mayChange, verifyStep)
- Approval gating UI with risk explanations
- 37 example prompts documented

### Local Persistence
- Namespaced `aster-code:` localStorage with auto-migration
- Reset local data from Settings
- No secrets stored in frontend

### Security Audit
- No hardcoded secrets found
- `.gitignore` covers `.env.*` and `workspaces/`
- Electron `contextIsolation: true`, `nodeIntegration: false`

### Automated Testing
- 4 smoke test suites: runtime, web build, desktop package, repo hygiene
- `release:local` pipeline includes test verification

---

## Immediate Priority: Phase 3 (Real Execution + LLM)

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

### Step 5: Optimize Installer Size
- Current runtime node_modules adds ~50MB
- Consider bundling runtime with esbuild or using a single-entry approach
- Or add `--production` only node_modules

### Step 6: Custom App Icon
- Create Aster Code icon (SVG/PNG/ICO)
- Configure electron-builder to use it

### Step 7: macOS/Linux Installers
- Add `mac` and `linux` targets to electron-builder config
- Test on macOS and Linux

### Step 8: Implement Real OAuth Flow
- Token exchange (code → access_token), user profile fetch, session creation
- Enable login buttons in SettingsScreen when OAuth is configured

### Step 9: Real MCP Execution
- Replace mock tool generation with real MCP JSON-RPC tool discovery
- Implement stdio process management for local MCP servers

### Step 10: Session Persistence
- Replace in-memory `sessionStore` with file-based or SQLite storage

### Step 11: Monaco Editor Integration
- Replace `<textarea>` in WorkbenchScreen with Monaco Editor

### Step 12: Fix npm Vulnerabilities
- Run `npm audit fix` to address transitive dependency issues

### Step 13: Add Unit Tests
- Test the agent planner, session store, policies engine, skills registry

---

## Previously Completed

- ✅ Agent skill routing (intent classifier, skill router, routing preview)
- ✅ External repo research (29 repos analyzed)
- ✅ Dev workflow (app:dev colored output, scripts/dev-start.mjs)
- ✅ Auth scaffolding (GitHub/Google OAuth placeholders)
- ✅ MCP gateway scaffolding (registry, policies, audit)
- ✅ Local test workflow (npm run check, docs/LOCAL_TESTING.md)
- ✅ Electron desktop app shell
- ✅ UI foundation fix (PostCSS, theme.css rewrite)
- ✅ System prompt library (CRUD, tags, export/import)
- ✅ Model picker UX (provider filter, detail popover, auto-refresh)
- ✅ Workbench MVP polish (multi-tab editor, status bar, file tree, preview)
