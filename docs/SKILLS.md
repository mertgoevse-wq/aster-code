# Agent Skills Architecture

Aster Code features a robust agent skills configuration system. Every action an agent performs is constrained by a "skill configuration" checking sandbox scopes, security logs, and user confirmation.

## Backend Skills Registry

The skills registry lives in `apps/runtime/src/skills/registry.ts` and serves as the single source of truth for all skill definitions. The frontend fetches from `GET /api/agent/skills` and updates via `PATCH /api/agent/skills/:id`.

## Design Philosophy

Agents should not run arbitrary workspace modifications without visible validation. The skills schema requires:
- Clear, readable descriptions of what the tool accomplishes.
- A list of required permission scopes.
- Execution modes setting user interaction requirements.

## Permission Scopes

The runtime enforces the following permission parameters:
- `read_workspace`: Read contents of folders/files inside the project workspace directory.
- `write_workspace`: Create or modify files. Deletions require explicit approval warnings.
- `execute_commands`: Run local build tools, package installations, or command tests.
- `execute_url`: Request remote service endpoints.

## Execution Modes

1. **Auto-Approve (`auto`)**:
   - The agent executes this skill immediately. Useful for read-only actions (like codebase audits) or writing simple documentation files.
2. **Requires Approval (`ask`)**:
   - The studio blocks execution and presents the user with a prompt card detailing the exact command or file edit request. The agent cannot proceed until the user clicks "Approve".

## Skill Selection in Agent Loop

When a user submits a task, the planner (
`apps/runtime/src/agent/planner.ts`) automatically selects relevant skills:

| Task Type | Recommended Skills |
|-----------|-------------------|
| explain | codebase-auditor |
| plan | project-planner, codebase-auditor |
| edit-code | project-planner, codebase-auditor |
| debug-build | build-fixer, codebase-auditor, dependency-checker |
| ui-fix | ui-debugger |
| dependency-fix | dependency-checker, build-fixer |
| docs | readme-writer, codebase-auditor |

Only active skills are selected. Users can toggle skills on/off in the Skills screen.

## Built-in Skills

- **Project Planner**: Generates lists and step guides before execution (`auto`).
- **Codebase Auditor**: Scans project files and folders for structural feedback (`auto`).
- **UI Debugger**: Reviews CSS/Tailwind parameters for alignment fixes (`ask`).
- **Dependency Checker**: Runs vulnerability reviews on packages (`ask`).
- **Build Fixer**: Checks build compiler errors and attempts to fix modules (`ask`).
- **Test Writer**: Autogenerates unit and integration files (`auto`).
- **README Writer**: Updates project guides and summaries (`auto`).
- **Android APK Helper**: Checks local mobile SDK tools (`ask`).
