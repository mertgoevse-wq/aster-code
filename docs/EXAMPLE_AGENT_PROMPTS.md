# Example Agent Prompts

A curated list of prompts to test and demonstrate the Aster Code agent planning system.  
All plans are deterministic and read-only in MVP — no real LLM calls, no real file edits.

## Beginner Prompts

These prompts are designed to help new users understand the project.

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 1 | `explain this project` | explain-code | codebase-auditor |
| 2 | `what does the runtime server do?` | explain-code | codebase-auditor |
| 3 | `show me the project structure` | explain-code | codebase-auditor |
| 4 | `tell me about the agent loop` | explain-code | codebase-auditor |
| 5 | `how does the MCP gateway work?` | explain-code | codebase-auditor |
| 6 | `Was macht dieses Projekt?` (DE) | explain-code | codebase-auditor |
| 7 | `Erkläre die Architektur` (DE) | explain-code | codebase-auditor |

## Coding Prompts

Prompts that involve creating, editing, or refactoring code.

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 8 | `add a dark mode toggle to settings` | build-feature, improve-ui | project-planner, ui-debugger |
| 9 | `create a new API endpoint for user preferences` | build-feature | project-planner, codebase-auditor |
| 10 | `implement a file upload component` | build-feature | project-planner |
| 11 | `refactor the provider registry to use a plugin pattern` | refactor | codebase-auditor, project-planner |
| 12 | `Baue eine Suchleiste für die Skills-Seite` (DE) | build-feature | project-planner |

## Debugging Prompts

Prompts that involve fixing bugs or build errors.

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 13 | `fix the typecheck errors in agentRouter.ts` | fix-bug, debug-build | build-fixer, codebase-auditor |
| 14 | `debug why the build is failing` | debug-build | build-fixer, dependency-checker |
| 15 | `the health endpoint returns 500 — help` | fix-bug | codebase-auditor, build-fixer |
| 16 | `Fehler beim Kompilieren beheben` (DE) | debug-build | build-fixer |

## Build & Release Prompts

Prompts related to building, packaging, and releasing.

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 17 | `package a release for Windows` | build-feature, git-task | project-planner, codebase-auditor |
| 18 | `build the desktop app installer` | build-feature | project-planner |
| 19 | `run the full build pipeline` | debug-build | build-fixer |
| 20 | `test the installer before release` | write-tests | test-writer, codebase-auditor |

## Provider & Model Prompts

Prompts related to LLM providers and model configuration.

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 21 | `add Ollama support with llama3 model` | model-provider-task | codebase-auditor |
| 22 | `configure OpenAI as a provider` | model-provider-task | codebase-auditor |
| 23 | `why is NVIDIA NIM not showing any models?` | model-provider-task | codebase-auditor, dependency-checker |
| 24 | `set up OpenRouter with free models` | model-provider-task | codebase-auditor |

## UI & Workbench Prompts

Prompts related to the user interface and workbench experience.

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 25 | `fix the workbench layout on small screens` | improve-ui | ui-debugger |
| 26 | `improve the chat screen styling` | improve-ui | ui-debugger |
| 27 | `add animations to the sidebar navigation` | improve-ui | ui-debugger |
| 28 | `make the model picker dropdown prettier` | improve-ui | ui-debugger |

## Documentation Prompts

Prompts for generating or updating documentation.

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 29 | `write docs for the agent routing system` | create-docs | readme-writer, codebase-auditor |
| 30 | `update the README with the latest features` | create-docs | readme-writer |
| 31 | `create API documentation for the runtime server` | create-docs | readme-writer |
| 32 | `Dokumentation für die Desktop-App schreiben` (DE) | create-docs | readme-writer |

## MCP & Integration Prompts

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 33 | `set up MCP filesystem server` | mcp-tool-task | project-planner |
| 34 | `connect a GitHub MCP server` | mcp-tool-task | project-planner, codebase-auditor |

## Auth & Setup Prompts

| # | Prompt | Expected Intent | Expected Skills |
|---|--------|----------------|-----------------|
| 35 | `configure GitHub OAuth for the app` | setup-runtime | dependency-checker, codebase-auditor |
| 36 | `set up the runtime server from scratch` | setup-runtime | dependency-checker |
| 37 | `Auth für Google einrichten` (DE) | setup-runtime | dependency-checker |

## What the Agent Will NOT Do (MVP)

- ❌ Execute real LLM calls — plans are rule-generated
- ❌ Modify real files — file writes are simulated
- ❌ Run real shell commands — commands use mock output
- ✅ Classify your intent with keyword matching
- ✅ Recommend relevant skills with confidence scores
- ✅ Generate structured step-by-step execution plans
- ✅ Show risk levels and permission requirements
- ✅ Gate all write/command steps behind approval

## Testing the Agent

To test any prompt above:

1. Start the runtime server: `npm run dev:runtime`
2. Start the web app: `npm run dev:web`
3. Open the Chat tab
4. Paste a prompt from any category above
5. Review the routing preview (intents + skills detected)
6. Review the execution plan (steps, permissions, verification)
7. Approve or reject

## Expected Behavior by Category

### Explain → `plan-review` with read-only steps
The agent generates explanation steps without any edit permissions.

### Build / Edit → `plan-review` with approval-gated steps
The agent generates inspect → plan → edit → verify steps. Edit steps require approval.

### Debug → `plan-review` with command + edit steps
The agent generates diagnostic command steps followed by edit steps. Both require approval.

### UI Fix → `plan-review` with inspect → edit steps
The agent analyzes existing styling then proposes targeted style changes.
