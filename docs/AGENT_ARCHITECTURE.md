# Agent Architecture — Aster Code

## Overview

Aster Code implements a **safe, approval-gated agent loop** that ensures no autonomous file edits or shell commands execute without explicit user consent. The architecture is built on a clear separation between the runtime (backend execution engine) and the web frontend (approval UI).

## Agent Loop

```
┌──────────┐    task     ┌───────────┐   classify   ┌──────────┐   plan    ┌──────────┐
│  User    │ ──────────> │  Runtime   │ ──────────>  │ Planner  │ ────────> │  Plan    │
│ (Chat)   │             │ (server)  │              │          │           │ (steps)  │
└──────────┘             └───────────┘              └──────────┘           └──────────┘
                                │                                                │
                                │ show plan                                      │
                                v                                                v
                          ┌───────────┐                                  ┌──────────────┐
                          │ Frontend  │ <──── approve / reject ────────> │ PlanPanel UI │
                          │           │                                  └──────────────┘
                          └───────────┘
                                │
                          (if approved)
                                v
                          ┌───────────┐
                          │ Executor  │ ──> execute steps sequentially
                          │ (loop.ts) │     with permission checks
                          └───────────┘
                                │
                                v
                          ┌───────────┐
                          │ Activity  │  Shows step status, tool, file, timestamps
                          │ Feed UI   │
                          └───────────┘
```

### Flow Steps

1. **User submits task** via ChatScreen
2. **Runtime classifies task** into one of 7 types:
   - `explain` — explanation requests
   - `plan` — architecture/design planning
   - `edit-code` — code modification
   - `debug-build` — build/debug fixes
   - `ui-fix` — styling/layout fixes
   - `dependency-fix` — package management
   - `docs` — documentation work
3. **Runtime selects relevant skills** from the skills registry
4. **Runtime generates an execution plan** with ordered steps, each with:
   - Title, description, reasoning
   - Required skill and permission level
   - Affected files and tool name
   - Initial status: `pending`
5. **Frontend displays the plan** (AgentPlanPanel component)
6. **User approves or rejects** the plan
7. **After approval**, the agent executes only **safe placeholder steps** (MVP)
   - File writes and commands are simulated — logged but not actually performed
   - Steps with `dangerous-disabled` permission level are permanently blocked
8. **Activity feed** updates in real-time showing step progress

## Skills System

Skills define what the agent can do and at what permission level. Each skill has:

- **id**: Unique identifier (e.g., `codebase-auditor`)
- **name**: Human-readable name
- **description**: What the skill does
- **permissions**: Required permission scopes (`read_workspace`, `write_workspace`, `execute_commands`)
- **executionMode**: `auto` (runs without additional confirmation) or `ask` (requires explicit approval)
- **status**: `active` or `inactive`

### Built-in Skills

| Skill | Permissions | Mode |
|-------|------------|------|
| Project Planner | read, write | auto |
| Codebase Auditor | read | auto |
| UI Debugger | read, write | ask |
| Dependency Checker | read, commands | ask |
| Build Fixer | read, write, commands | ask |
| Test Writer | read, write | auto |
| README Writer | read, write | auto |
| Android APK Helper | read, commands | ask |

## Permission Model

Five tiers of permissions, from least to most permissive:

1. **read-only** — Can only read workspace files
2. **suggest-edits** — Can suggest edits (read + generate proposals)
3. **apply-edits-after-approval** — Can write files after user approval
4. **run-safe-commands-after-approval** — Can run allowlisted shell commands after approval
5. **dangerous-disabled** — Permanently blocked, regardless of approval

### Enforcement

- Every plan step carries a `permissionLevel`
- Before execution, `policies.ts` checks if the step's level is sufficient for the requested action
- `dangerous-disabled` actions are ALWAYS blocked — the agent cannot circumvent this
- File writes and commands require explicit approval (approve button in UI)

## Why Free Autonomous Execution Is Disabled

Autonomous agent execution is a significant security risk. Allowing an AI to freely edit files and run shell commands can lead to:

- **Data loss** — accidental deletion or corruption of source files
- **Supply chain attacks** — arbitrary package installs or script execution
- **Credential leaks** — accidental exposure of API keys or secrets
- **Workspace corruption** — cascading changes that break the build

Aster Code's safety-first approach ensures:
- The user is always in control
- Every action is visible before it happens
- No irreversible changes occur without explicit consent
- The approval gate cannot be bypassed by the agent

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/agent/session` | Create a new agent session |
| GET | `/agent/session/:id` | Retrieve session with plan and events |
| POST | `/agent/session/:id/plan` | Classify task and generate execution plan |
| POST | `/agent/session/:id/approve` | Approve plan and execute steps |
| POST | `/agent/session/:id/reject` | Reject plan (no actions taken) |
| GET | `/agent/session/:id/events` | Get session events (with optional `?since=` filter) |
| GET | `/agent/skills` | List all registered skills |
| PATCH | `/agent/skills/:id` | Update a skill's status or execution mode |

## MVP Limitations

- **In-memory sessions** — Lost on server restart
- **Deterministic mock plans** — Rule-based classification, no real LLM calls
- **Simulated execution** — Steps appear in activity feed but don't actually modify files or run commands
- **No streaming** — Execution results returned as single response
- **Single session** — No session list endpoint yet
