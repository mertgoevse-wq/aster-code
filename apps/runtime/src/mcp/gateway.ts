import {
  MCPServerConfig,
  MCPToolDefinition,
  MCPAuditEntry,
} from '@aster-code/shared';
import { GatewayInvokeRequest, GatewayInvokeResult, ToolDiscoveryResult } from './types.js';
import { mcpServerRegistry } from './registry.js';
import {
  checkServerAccess,
  checkToolAccess,
  categorizeTool,
  assessToolRisk,
  createAuditEntry,
} from './policies.js';

/**
 * MCP Gateway — governs all MCP tool discovery and invocation.
 *
 * Safety invariants:
 * - Tools are discovered but filtered through policies.
 * - Blocked tools are hidden from agent context entirely.
 * - Write/network/system tools require explicit user approval.
 * - Every invocation is audit-logged.
 * - MVP: no real tool execution — simulated safe responses only.
 */

const auditLog: MCPAuditEntry[] = [];

/**
 * Discovers tools from a given MCP server.
 * Filters tools through the policies: hides blocked, marks dangerous.
 */
export async function discoverTools(serverId: string): Promise<ToolDiscoveryResult> {
  const server = mcpServerRegistry.get(serverId);
  if (!server) {
    return { serverId, tools: [], error: `Server "${serverId}" not found.` };
  }

  const access = checkServerAccess(server);
  if (!access.allowed) {
    return { serverId, tools: [], error: access.reason };
  }

  // MVP: return simulated/placeholder tools based on server config
  const tools = generateMockTools(server);

  return { serverId, tools };
}

/**
 * Discovers tools from all enabled servers.
 */
export async function discoverAllTools(): Promise<ToolDiscoveryResult[]> {
  const enabled = mcpServerRegistry.getEnabled();
  const results = await Promise.all(enabled.map(s => discoverTools(s.id)));
  return results;
}

/**
 * Returns all visible tools (not blocked) from all enabled servers.
 * This is what the agent sees in its context.
 */
export async function getVisibleTools(): Promise<MCPToolDefinition[]> {
  const results = await discoverAllTools();
  return results.flatMap(r => r.tools).filter(t => t.allowed);
}

/**
 * Invokes a tool on an MCP server.
 * MVP: all invocations are simulated — no real tool execution.
 */
export async function invokeTool(request: GatewayInvokeRequest): Promise<GatewayInvokeResult> {
  const { serverId, toolName, args } = request;

  const server = mcpServerRegistry.get(serverId);
  if (!server) {
    const audit = createAuditEntry(serverId, toolName, JSON.stringify(args).slice(0, 100), 'error', false, 'Server not found');
    auditLog.push(audit);
    return { success: false, error: 'Server not found.', blocked: true, requiresApproval: false, auditId: audit.id };
  }

  // Check server access
  const serverAccess = checkServerAccess(server);
  if (!serverAccess.allowed) {
    const audit = createAuditEntry(serverId, toolName, JSON.stringify(args).slice(0, 100), 'blocked', false, serverAccess.reason);
    auditLog.push(audit);
    return { success: false, error: serverAccess.reason, blocked: true, requiresApproval: false, auditId: audit.id };
  }

  // Find the tool
  const tools = generateMockTools(server);
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    const audit = createAuditEntry(serverId, toolName, JSON.stringify(args).slice(0, 100), 'error', false, 'Tool not found on server');
    auditLog.push(audit);
    return { success: false, error: `Tool "${toolName}" not discovered on server "${server.name}".`, blocked: true, requiresApproval: false, auditId: audit.id };
  }

  // Check tool access
  const toolAccess = checkToolAccess(tool, server);
  if (!toolAccess.allowed) {
    const audit = createAuditEntry(serverId, toolName, JSON.stringify(args).slice(0, 100), 'blocked', false, toolAccess.reason);
    auditLog.push(audit);
    return { success: false, error: toolAccess.reason, blocked: true, requiresApproval: false, auditId: audit.id };
  }

  // If approval is required, return pending-approval
  if (toolAccess.requiresApproval) {
    const audit = createAuditEntry(serverId, toolName, JSON.stringify(args).slice(0, 100), 'pending-approval', false);
    auditLog.push(audit);
    return {
      success: true,
      status: 'pending-approval',
      error: toolAccess.reason,
      blocked: false,
      requiresApproval: true,
      auditId: audit.id,
    };
  }

  // MVP: Simulate safe tool execution
  console.log(`[MCP Gateway] Simulating tool invocation: ${toolName} on ${server.name}`);
  const audit = createAuditEntry(serverId, toolName, JSON.stringify(args).slice(0, 100), 'success', true);
  auditLog.push(audit);

  return {
    success: true,
    result: { simulated: true, message: `Tool "${toolName}" executed (simulated in MVP).` },
    blocked: false,
    requiresApproval: false,
    auditId: audit.id,
  };
}

/**
 * Returns the full audit log.
 */
export async function getAuditLog(): Promise<MCPAuditEntry[]> {
  return [...auditLog];
}

/**
 * Clears the audit log.
 */
export async function clearAuditLog(): Promise<void> {
  auditLog.length = 0;
}

/**
 * Generates mock tools for a server based on its transport and config.
 * MVP: no real MCP discovery — returns placeholder tools from config analysis.
 */
function generateMockTools(server: MCPServerConfig): MCPToolDefinition[] {
  const toolNames = getMockToolNames(server);
  return toolNames
    .filter(name => !server.blockedTools.includes(name))
    .map(name => {
      const category = categorizeTool(name, `Mock tool on ${server.transport} transport`);
      const riskLevel = assessToolRisk(category);
      const access = checkToolAccess(
        { name, description: '', serverId: server.id, serverName: server.name, riskLevel, category, requiresApproval: server.requiresApproval, allowed: true },
        server
      );

      return {
        name,
        description: getMockToolDescription(name),
        serverId: server.id,
        serverName: server.name,
        riskLevel,
        category,
        requiresApproval: access.requiresApproval,
        allowed: access.allowed,
      };
    });
}

function getMockToolNames(server: MCPServerConfig): string[] {
  switch (server.id) {
    case 'mcp-filesystem':
      return ['read_file', 'write_file', 'list_directory', 'create_directory', 'delete_file', 'get_file_info', 'search_files', 'move_file'];
    case 'mcp-github':
      return ['search_repositories', 'get_file_contents', 'create_issue', 'list_issues', 'create_pull_request', 'get_user_profile', 'list_commits', 'create_repository'];
    case 'mcpo-postman':
      return ['list_collections', 'get_collection', 'create_collection', 'run_collection', 'get_environment', 'create_environment'];
    case 'mcp-memory':
      return ['read_graph', 'search_nodes', 'create_entities', 'create_relations', 'delete_entities', 'delete_relations', 'add_observations'];
    default:
      return ['read_data', 'write_data', 'list_items', 'search_items'];
  }
}

function getMockToolDescription(name: string): string {
  const map: Record<string, string> = {
    read_file: 'Read contents of a file from the filesystem.',
    write_file: 'Write or overwrite a file.',
    list_directory: 'List contents of a directory.',
    create_directory: 'Create a new directory.',
    delete_file: 'Delete a file or directory.',
    get_file_info: 'Get metadata about a file.',
    search_files: 'Search for files matching a pattern.',
    move_file: 'Move or rename a file.',
    search_repositories: 'Search GitHub repositories by query.',
    get_file_contents: 'Get contents of a file from a GitHub repository.',
    create_issue: 'Create a new GitHub issue.',
    list_issues: 'List issues in a repository.',
    create_pull_request: 'Create a new pull request.',
    get_user_profile: 'Get a GitHub user profile.',
    list_commits: 'List commits in a repository.',
    create_repository: 'Create a new GitHub repository.',
    list_collections: 'List Postman collections.',
    get_collection: 'Get a Postman collection by ID.',
    create_collection: 'Create a new Postman collection.',
    run_collection: 'Run a Postman collection.',
    get_environment: 'Get a Postman environment.',
    create_environment: 'Create a Postman environment.',
    read_graph: 'Read nodes from the knowledge graph.',
    search_nodes: 'Search for nodes in the knowledge graph.',
    create_entities: 'Create new entities in the knowledge graph.',
    create_relations: 'Create relations between entities.',
    delete_entities: 'Delete entities from the knowledge graph.',
    delete_relations: 'Delete relations between entities.',
    add_observations: 'Add observations to entities.',
  };
  return map[name] || `Tool: ${name}`;
}
