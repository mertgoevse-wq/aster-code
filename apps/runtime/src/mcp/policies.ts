import {
  MCPServerConfig,
  MCPToolDefinition,
  MCPAuditEntry,
  RiskLevel,
} from '@aster-code/shared';

/**
 * MCP Gateway Policies — governs all MCP tool access.
 *
 * Safety invariants:
 * - Disabled servers cannot be accessed.
 * - Blocked tools are never exposed to the agent.
 * - Write/network/system tools always require approval.
 * - Risk=high servers require explicit allowlist.
 * - No tool executes without permission check.
 */

/**
 * Checks if a server can be used based on its config.
 */
export function checkServerAccess(config: MCPServerConfig): {
  allowed: boolean;
  reason: string;
} {
  if (!config.enabled) {
    return {
      allowed: false,
      reason: `MCP server "${config.name}" is disabled. Enable it in settings first.`,
    };
  }

  if (config.riskLevel === 'high' && config.allowedTools.length === 0) {
    return {
      allowed: false,
      reason: `MCP server "${config.name}" is high-risk and has no allowlisted tools configured.`,
    };
  }

  return { allowed: true, reason: 'Server is accessible.' };
}

/**
 * Checks if a specific tool on a server can be accessed.
 */
export function checkToolAccess(
  tool: MCPToolDefinition,
  config: MCPServerConfig
): {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
} {
  // 1. Check blocked list
  if (config.blockedTools.includes(tool.name)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Tool "${tool.name}" is blocked on server "${config.name}".`,
    };
  }

  // 2. If server has an explicit allowlist, check it
  if (config.allowedTools.length > 0 && !config.allowedTools.includes(tool.name)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Tool "${tool.name}" is not in the allowlist for server "${config.name}".`,
    };
  }

  // 3. Write/network/system tools always require approval
  const dangerousCategories: MCPToolDefinition['category'][] = ['write', 'network', 'system'];
  const isDangerous = dangerousCategories.includes(tool.category);

  // 4. Server-level approval flag overrides tool-level
  const requiresApproval = config.requiresApproval || isDangerous || tool.riskLevel !== 'low';

  return {
    allowed: true,
    requiresApproval,
    reason: requiresApproval
      ? `Tool "${tool.name}" requires user approval (${isDangerous ? 'dangerous category: ' + tool.category : 'risk: ' + tool.riskLevel}).`
      : `Tool "${tool.name}" is safe for automatic execution.`,
  };
}

/**
 * Categorizes a tool based on its name and description.
 */
export function categorizeTool(name: string, description: string): MCPToolDefinition['category'] {
  const lower = (name + ' ' + description).toLowerCase();

  if (matchAny(lower, ['write', 'create', 'delete', 'update', 'insert', 'drop', 'truncate', 'modify', 'remove'])) {
    return 'write';
  }
  if (matchAny(lower, ['http', 'fetch', 'request', 'api', 'curl', 'download', 'upload', 'web', 'url'])) {
    return 'network';
  }
  if (matchAny(lower, ['exec', 'system', 'shell', 'bash', 'cmd', 'process', 'spawn', 'kill', 'signal'])) {
    return 'system';
  }
  if (matchAny(lower, ['compute', 'calculate', 'run', 'model', 'inference', 'train', 'embed'])) {
    return 'compute';
  }
  if (matchAny(lower, ['read', 'list', 'get', 'query', 'search', 'find', 'lookup', 'view', 'show'])) {
    return 'read';
  }
  return 'unknown';
}

/**
 * Assigns a risk level based on tool category and description.
 */
export function assessToolRisk(category: MCPToolDefinition['category']): RiskLevel {
  switch (category) {
    case 'system': return 'high';
    case 'network': return 'high';
    case 'write': return 'medium';
    case 'compute': return 'medium';
    case 'read': return 'low';
    default: return 'medium';
  }
}

/**
 * Creates an audit log entry for a tool invocation.
 */
export function createAuditEntry(
  serverId: string,
  toolName: string,
  inputSummary: string,
  resultStatus: MCPAuditEntry['resultStatus'],
  userApproved: boolean,
  error?: string
): MCPAuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    serverId,
    toolName,
    timestamp: new Date().toISOString(),
    inputSummary: inputSummary.slice(0, 200), // truncate for privacy
    resultStatus,
    userApproved,
    error,
  };
}

function matchAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}
