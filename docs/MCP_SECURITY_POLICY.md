# MCP Security Policy

## Principle: Zero Trust by Default

Every MCP tool invocation is denied by default. Access is granted only through explicit configuration with layered approvals.

## Access Control Layers

### Layer 1: Server Enablement
- All MCP servers are **disabled** on creation
- User must explicitly enable each server
- High-risk servers additionally require a non-empty `allowedTools` list

### Layer 2: Tool Allowlist / Blocklist
- **Blocklist** (`blockedTools`): Tools that are never visible to agents, even if the server is enabled
- **Allowlist** (`allowedTools`): If set to a non-empty array, only these tools are discoverable
- If `allowedTools` is empty, all non-blocked tools are discoverable (for low/medium risk servers only)

### Layer 3: Tool Categorization
Every tool is categorized based on its name and description:

| Category | Description |
|----------|-------------|
| `read` | Read-only operations (get, list, search, find) |
| `write` | Mutating operations (create, update, delete) |
| `network` | External API calls, HTTP requests |
| `compute` | CPU/GPU operations, model inference |
| `system` | Process execution, shell commands |
| `unknown` | Uncategorized tools |

### Layer 4: Risk Assessment
Risk is automatically assigned based on category:

| Category | Risk Level | Auto-Approval |
|----------|------------|---------------|
| `read` | Low | Possible (if user enables Auto-Run Read-Only) |
| `write` | Medium | Never auto-approved |
| `compute` | Medium | Never auto-approved |
| `network` | High | Never auto-approved |
| `system` | High | Never auto-approved |
| `unknown` | Medium | Never auto-approved |

### Layer 5: Approval Gates
A tool requires user approval if **any** of these conditions are true:
1. Server `requiresApproval` is set to `true`
2. Tool category is `write`, `network`, `compute`, `system`, or `unknown`
3. Tool risk level is `medium` or higher

Tools are eligible for auto-approval if **all** of these conditions are true:
1. Server `requiresApproval` is `false`
2. Tool category is `read`
3. Tool risk level is `low`
4. User has enabled "Auto-Run Read-Only Skills" in settings

## Permission Levels

| Level | Description | Auto? |
|-------|-------------|-------|
| `read-only` | Can only read data, no mutations | Can be auto |
| `suggest-edits` | Can suggest file changes, user must approve | Requires approval |
| `apply-edits-after-approval` | Can write files after approval | Requires approval |
| `run-safe-commands-after-approval` | Can run commands after approval | Requires approval |
| `dangerous-disabled` | System/network tools, heavily restricted | Always requires approval |

## Hard Rules (Non-Configurable)

These rules cannot be overridden by the user:

1. **High-risk servers without allowlist are blocked** — no blanket high-risk access
2. **Blocked tools cannot be unblocked via settings** — they must be removed from `blockedTools`
3. **Every invocation is audit-logged** — immutable, no opt-out
4. **No secrets in frontend** — API keys and credentials only in runtime `.env`

## Configurable Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Auto-route skills | On | Automatically select skills based on intent |
| Auto-run read-only skills | Off | Auto-execute low-risk read operations |
| Require approval for file edits | On | Always ask before writing files |
| Require approval for commands | On | Always ask before running commands |
| Require approval for MCP tools | On | Always ask before MCP tool calls |

## What Happens When a Tool Is Denied?

1. The tool is **not invoked**
2. An audit entry is created with `resultStatus: 'blocked'`
3. The agent receives an error message explaining why
4. The user is notified in the frontend

## What Happens When Approval Is Required?

1. The tool invocation is paused
2. An audit entry is created with `resultStatus: 'pending-approval'`
3. The frontend shows an approval prompt with:
   - Tool name and server
   - Risk level and category
   - Input summary
   - Approve / Reject buttons
4. On approve: tool executes, audit updated to `success`/`error`
5. On reject: tool is not invoked, audit updated to `blocked`

## Security Risks Mitigated

| Risk | Mitigation |
|------|------------|
| Prompt injection via tool args | Input summary truncated to 200 chars in audit; tool categorization checks name/description |
| Arbitrary command execution | System-category tools always require approval, blocked by default |
| Data exfiltration via network tools | Network-category tools always require approval, high risk |
| Accidental file deletion | Write-category tools always require approval; blocked by default on filesystem server |
| Credential leakage | No secrets in frontend config; runtime-only `.env` access |

## Audit Trail

The audit log provides a complete record of all MCP tool activity:

- Every invocation attempt (successful, blocked, pending, errored)
- Tool name, server, timestamp
- Input summary (truncated for privacy)
- Whether the user approved
- Error details if applicable

**MVP limitation:** Audit log is in-memory and lost on server restart. Persistent storage is planned.
