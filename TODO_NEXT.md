# Next Steps — After Desktop Packaging + Runtime Connectivity

Date: 2026-07-05
Based on: Desktop packaging and runtime connectivity implementation

---

## ✅ Completed: Desktop Packaging + Runtime Connectivity

### API Connectivity Fix
- Created `apps/web/src/api.ts` — API base URL resolver (Electron: `http://localhost:3001`, browser: Vite proxy)
- Updated all 6 frontend files to use `apiFetch()` / `apiEventSource()` wrappers
- No more fragile `file://` relative API paths in production

### Runtime Auto-Start
- Electron main process detects/connects to runtime at `localhost:3001`
- If not running, spawns runtime as child process (tsx in dev, node in production)
- Health monitoring every 5 seconds
- Captures stdout/stderr logs
- Graceful shutdown on app exit

### Safe Preload IPC
- `window.asterDesktop.getRuntimeStatus()`
- `window.asterDesktop.restartRuntime()`
- `window.asterDesktop.getRuntimeLogs()`
- `window.asterDesktop.onRuntimeStatusChange()`
- No raw shell commands, no secrets, no file access

### UI Runtime Controls
- Status bar shows runtime state with colored badges
- Settings → Runtime Server panel: status info, restart button, logs viewer

### Packaging
- electron-builder includes web dist, runtime dist, runtime deps as extraResources
- Windows NSIS installer target preserved

### Documentation
- `docs/DESKTOP_APP.md` — Updated with runtime management
- `docs/DESKTOP_RUNTIME.md` — New: runtime IPC API, lifecycle docs
- `docs/START_HERE.md` — Updated
- `README.md` — Updated

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
