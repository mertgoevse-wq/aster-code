# MCP Gateway

Aster Code's **Model Context Protocol Gateway** provides a governed layer between AI agents and MCP servers. All MCP tool access flows through this gateway for policy enforcement, permission checks, and audit logging.

## Architecture

```
Agent (Planner) → Gateway (Policies) → MCP Server → External Tools
                    ↓
               Audit Log
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Registry** | `apps/runtime/src/mcp/registry.ts` | Manages MCP server configs (CRUD) |
| **Policies** | `apps/runtime/src/mcp/policies.ts` | Access control, risk assessment, approval rules |
| **Gateway** | `apps/runtime/src/mcp/gateway.ts` | Tool discovery, filtering, invocation, audit |
| **mcpo Client** | `apps/runtime/src/mcp/mcpoClient.ts` | OpenAPI-to-MCP bridge (MVP placeholder) |
| **Types** | `apps/runtime/src/mcp/types.ts` + `packages/shared/src/types.ts` | All MCP type definitions |

## Safety Invariants

1. **All servers disabled by default** — must be explicitly enabled in settings
2. **Blocked tools are never exposed** — filtered before agent sees them
3. **Allowlist mode** — if `allowedTools` is non-empty, only those tools are visible
4. **Write/network/system tools require approval** — always ask the user
5. **High-risk servers require explicit allowlist** — no blanket access for dangerous servers
6. **Every invocation is audit-logged** — immutable record of all tool calls

## Server Config Schema

```typescript
interface MCPServerConfig {
  id: string;            // Unique ID (auto-generated)
  name: string;          // Human-readable name
  transport: 'stdio' | 'http' | 'sse' | 'mcpo-openapi';
  command?: string;      // For stdio transport
  url?: string;          // For http/sse/mcpo-openapi
  enabled: boolean;      // Default: false
  riskLevel: 'low' | 'medium' | 'high';
  allowedTools: string[]; // If non-empty, only these tools are visible
  blockedTools: string[]; // These tools are always hidden
  requiresApproval: boolean; // Server-level approval gate
}
```

### Default Servers (MVP)

| Server | Transport | Risk | Default Tools |
|--------|-----------|------|---------------|
| Filesystem MCP | stdio | Medium | read_file, list_directory (write/delete blocked) |
| GitHub MCP | http | Medium | search_repositories, get_file_contents (create/delete blocked) |
| Postman API (mcpo) | mcpo-openapi | High | None (requires allowlist) |
| Memory MCP | stdio | Low | read_graph, search_nodes (write blocked) |

## Tool Discovery Flow

```
1. Server enabled? → No → Skip
2. High-risk without allowlist? → Skip
3. Fetch tool list (mock in MVP)
4. Remove blocked tools
5. Apply allowlist filter (if set)
6. Categorize each tool (read/write/network/compute/system)
7. Assess risk per tool
8. Check approval requirements
9. Return visible tool definitions
```

## Tool Categories & Risk

| Category | Risk | Examples | Approval |
|----------|------|----------|----------|
| `read` | Low | read_file, search_nodes, list_items | Auto (if read-only enabled) |
| `write` | Medium | write_file, create_issue, delete_file | Required |
| `compute` | Medium | run_model, train, embed | Required |
| `network` | High | fetch_url, api_request, download | Required |
| `system` | High | exec_command, spawn_process, kill | Required |
| `unknown` | Medium | uncategorized tools | Required |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/mcp/servers` | List all MCP server configs |
| POST | `/mcp/servers` | Add a new server config |
| PATCH | `/mcp/servers/:id` | Update a server config |
| DELETE | `/mcp/servers/:id` | Remove a server config |
| POST | `/mcp/servers/:id/discover` | Discover tools from one server |
| POST | `/mcp/servers/discover-all` | Discover tools from all enabled servers |
| GET | `/mcp/audit` | Retrieve full audit log |
| DELETE | `/mcp/audit` | Clear audit log |

## Audit Log Schema

```typescript
interface MCPAuditEntry {
  id: string;
  serverId: string;
  toolName: string;
  timestamp: string;
  inputSummary: string;  // Truncated to 200 chars for privacy
  resultStatus: 'success' | 'error' | 'blocked' | 'pending-approval';
  userApproved: boolean;
  error?: string;
}
```

## mcpo (OpenAPI Bridge) — Future

The mcpo bridge will allow Aster Code to treat any REST API as an MCP server:

1. User provides an OpenAPI spec URL
2. mcpo parses endpoints into MCP tool definitions
3. Gateway applies all standard policies (allowlist, approval, risk)
4. REST calls are routed through the gateway with governance

**MVP status:** Placeholder only. No real OpenAPI parsing or HTTP calls.

## MVP Limitations

- **No real MCP discovery** — tools are mock/placeholder definitions
- **No real tool execution** — all invocations return simulated responses
- **No stdio process management** — stdio transport is config-only
- **No persistent storage** — audit log is in-memory, lost on restart

## Next Steps

1. Implement real MCP JSON-RPC tool discovery for stdio and HTTP transports
2. Add persistent audit log storage
3. Implement real tool execution with stdio process management
4. Build OpenAPI spec parser for mcpo bridge
5. Add MCP server management UI in the frontend
