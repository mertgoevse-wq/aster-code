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

### Step 5: Session Persistence
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
