import { MCPServerConfig, MCPTransportType } from '@aster-code/shared';

/**
 * MCP Server Registry — manages MCP server configurations.
 * All servers are disabled by default for safety.
 */

const DEFAULT_SERVERS: MCPServerConfig[] = [
  {
    id: 'mcp-filesystem',
    name: 'Filesystem MCP',
    transport: 'stdio',
    command: 'npx -y @modelcontextprotocol/server-filesystem /workspace',
    enabled: false,
    riskLevel: 'medium',
    allowedTools: ['read_file', 'list_directory'],
    blockedTools: ['write_file', 'delete_file', 'create_directory'],
    requiresApproval: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mcp-github',
    name: 'GitHub MCP',
    transport: 'http',
    url: 'https://api.github.com',
    enabled: false,
    riskLevel: 'medium',
    allowedTools: ['search_repositories', 'get_file_contents'],
    blockedTools: ['create_repository', 'delete_repository'],
    requiresApproval: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mcpo-postman',
    name: 'Postman API (mcpo)',
    transport: 'mcpo-openapi',
    url: 'https://api.postman.com/collections',
    enabled: false,
    riskLevel: 'high',
    allowedTools: [],
    blockedTools: [],
    requiresApproval: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mcp-memory',
    name: 'Memory MCP',
    transport: 'stdio',
    command: 'npx -y @modelcontextprotocol/server-memory',
    enabled: false,
    riskLevel: 'low',
    allowedTools: ['read_graph', 'search_nodes'],
    blockedTools: ['create_entities', 'delete_entities'],
    requiresApproval: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MCPServerRegistry {
  private servers: Map<string, MCPServerConfig> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    for (const server of DEFAULT_SERVERS) {
      this.servers.set(server.id, { ...server });
    }
    console.log(`[MCP Registry] Initialized with ${this.servers.size} default server configs (all disabled).`);
  }

  /**
   * Returns all registered MCP server configs.
   */
  getAll(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Returns only enabled servers.
   */
  getEnabled(): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(s => s.enabled);
  }

  /**
   * Finds a server by ID.
   */
  get(id: string): MCPServerConfig | null {
    return this.servers.get(id) || null;
  }

  /**
   * Adds a new server config.
   */
  add(config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>): MCPServerConfig {
    const now = new Date().toISOString();
    const newServer: MCPServerConfig = {
      ...config,
      id: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      enabled: false, // always disabled by default
      createdAt: now,
      updatedAt: now,
    };
    this.servers.set(newServer.id, newServer);
    console.log(`[MCP Registry] Added server: ${newServer.name} (${newServer.id})`);
    return newServer;
  }

  /**
   * Updates an existing server config.
   */
  update(id: string, updates: Partial<Omit<MCPServerConfig, 'id' | 'createdAt'>>): MCPServerConfig | null {
    const server = this.servers.get(id);
    if (!server) return null;

    Object.assign(server, updates, { updatedAt: new Date().toISOString() });
    console.log(`[MCP Registry] Updated server: ${server.name}`);
    return server;
  }

  /**
   * Removes a server config.
   */
  remove(id: string): boolean {
    const deleted = this.servers.delete(id);
    if (deleted) {
      console.log(`[MCP Registry] Removed server: ${id}`);
    }
    return deleted;
  }

  /**
   * Resets to default configurations.
   */
  resetToDefaults(): void {
    this.servers.clear();
    this.initialize();
  }
}

export const mcpServerRegistry = new MCPServerRegistry();
