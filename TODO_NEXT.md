# Next Steps — Implementing the Agent Loop

Date: 2026-07-05
Based on: Audit of current repository state

---

## Immediate Priority: Agent Loop (Phase 2)

The current codebase has a beautiful UI shell and a solid backend, but the core agent loop is fully simulated. The next prompts should focus on connecting the pieces.

### Step 1: Create Runtime Chat Completion Endpoint
- **File**: `apps/runtime/src/server.ts`
- **Action**: Add `POST /chat/completions` endpoint that:
  - Accepts `{ modelId, messages, systemPrompt }` from the frontend
  - Routes to the appropriate provider adapter based on model ID
  - Returns streamed or complete response
  - Uses the ModelRegistry to resolve adapter from model ID

### Step 2: Implement Provider Adapter `complete()` Method
- **File**: `apps/runtime/src/providers/types.ts`
- **Action**: Add `complete(messages, options)` method to `ProviderAdapter` interface
- **Files**: Update all 5 adapters (ollama, lmstudio, openrouter, nvidia, openaiCompatible) with actual completion logic
- Each adapter calls its respective API's chat completions endpoint

### Step 3: Connect Frontend Chat to Real Backend
- **File**: `apps/web/src/screens/ChatScreen.tsx`
- **Action**: Replace simulated `mockSteps` and hardcoded assistant response with real `fetch('/api/chat/completions')` calls
- Add streaming response parsing (SSE or chunked) for real-time agent activity updates
- Connect the agent activity timeline to actual tool call events from the backend

### Step 4: Backend Skills Registry
- **File**: Create `packages/skills/package.json` and `packages/skills/src/`
- **Action**: Create a real skills registry package with:
  - `SkillDefinition` types (or import from shared)
  - Backend API endpoints for listing/updating skills
  - Permission checking logic
  - Connect skills to the agent loop for tool calling

### Step 5: Wire Agent Tool Execution
- **Action**: When the agent decides to read/edit files or run commands:
  1. Agent generates a tool call
  2. Backend validates permissions via skills registry
  3. If mode is `ask`, send approval request to frontend
  4. Execute approved tool (file read/write, command run)
  5. Return result to agent for next iteration

---

## Medium Priority

### Step 6: Real Anthropic/OpenAI SDK Integration
- Replace the placeholder Anthropic OpenAI-Compatible adapter with actual Anthropic SDK
- Add proper streaming support for Claude models

### Step 7: Monaco Editor Integration
- Replace the `<textarea>` in WorkbenchScreen with Monaco Editor
- Add syntax highlighting, autocomplete, and WebSocket-based file sync

### Step 8: Fix npm Vulnerabilities
- Run `npm audit fix` to address transitive dependency issues

### Step 9: Add Unit Tests
- Test the provider adapters (mock HTTP calls)
- Test the workspace file operations
- Test the command runner allowlist
- Test the SSE event broadcasting

---

## Architecture Considerations

The chat completion flow should look like:

```
Frontend (ChatScreen)
  → POST /api/chat/completions { modelId, messages, systemPrompt }
  → Runtime (server.ts)
    → ModelRegistry.resolveModel(modelId) → ProviderAdapter
    → ProviderAdapter.complete(messages, options) → LLM API
    → SSE stream back to frontend with:
      - text chunks (content)
      - tool_call events (function name, args)
      - status updates (thinking, executing, done)
  → Frontend renders streaming text + agent activity timeline
```

The tool execution flow:

```
Agent (in LLM response) generates tool_call
  → Runtime validates tool against SkillsRegistry
  → If requires approval: send to frontend, wait for user click
  → Execute tool (read_file, write_file, run_command, etc.)
  → Return result to LLM for next response iteration
```
