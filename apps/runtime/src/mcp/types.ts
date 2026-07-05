import {
  MCPServerConfig,
  MCPToolDefinition,
  MCPAuditEntry,
  MCPTransportType,
  RiskLevel,
} from '@aster-code/shared';

export type {
  MCPServerConfig,
  MCPToolDefinition,
  MCPAuditEntry,
  MCPTransportType,
  RiskLevel,
};

/** Internal tool discovery request */
export interface ToolDiscoveryRequest {
  serverId: string;
  transport: MCPTransportType;
  command?: string;
  url?: string;
}

/** Internal tool discovery result */
export interface ToolDiscoveryResult {
  serverId: string;
  tools: MCPToolDefinition[];
  error?: string;
}

/** Gateway invocation request */
export interface GatewayInvokeRequest {
  serverId: string;
  toolName: string;
  args: Record<string, any>;
  userId?: string;
}

/** Gateway invocation result */
export interface GatewayInvokeResult {
  success: boolean;
  status?: 'pending-approval';
  result?: any;
  error?: string;
  blocked: boolean;
  requiresApproval: boolean;
  auditId: string;
}
