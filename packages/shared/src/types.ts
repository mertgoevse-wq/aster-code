export interface ModelMetadata {
  id: string;
  displayName: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputModalities: string[];
  outputModalities: string[];
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  bestFor: string;
  description: string;
  deprecated?: boolean;
  lastCheckedAt: string;
  raw?: any;
}

export type ProviderId = 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'lmstudio' | 'openai-compatible' | 'nvidia';

export interface ProviderInfo {
  id: ProviderId;
  displayName: string;
  enabled: boolean;
  configured: boolean;
  baseUrl?: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  executionMode: 'auto' | 'ask';
  status: 'active' | 'inactive';
}

export interface SystemPromptTemplate {
  id: string;
  title: string;
  prompt: string;
  description?: string;
  tags: string[];
  isDefault?: boolean;
  isSystemDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface AgentActivityStep {
  id: string;
  timestamp: string;
  type: 'thought' | 'tool_call' | 'tool_response' | 'error' | 'success';
  title: string;
  message: string;
  meta?: Record<string, any>;
}

export interface ProviderConfigs {
  ollamaEnabled: boolean;
  ollamaUrl: string;
  lmstudioEnabled: boolean;
  lmstudioUrl: string;
  openaiCompatibleEnabled: boolean;
  openaiCompatibleUrl: string;
  openaiCompatibleApiKey?: string;
  openrouterEnabled: boolean;
  openrouterApiKey?: string;
  nvidiaEnabled: boolean;
  nvidiaApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface CommandStatusEvent {
  status: 'idle' | 'running' | 'success' | 'failed';
  command?: string;
  exitCode?: number | null;
  error?: string;
}

export interface PreviewStatusEvent {
  port?: number | null;
  url?: string | null;
  available: boolean;
}

/* ==========================================================================
   AGENT SYSTEM TYPES
   ========================================================================== */

export type AgentTaskType =
  | 'explain'
  | 'plan'
  | 'edit-code'
  | 'debug-build'
  | 'ui-fix'
  | 'dependency-fix'
  | 'docs';

export type AgentIntentType =
  | 'explain-code'
  | 'build-feature'
  | 'fix-bug'
  | 'debug-build'
  | 'improve-ui'
  | 'dependency-task'
  | 'write-tests'
  | 'create-docs'
  | 'refactor'
  | 'setup-runtime'
  | 'model-provider-task'
  | 'mcp-tool-task'
  | 'git-task'
  | 'unknown';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface SkillCandidate {
  skillId: string;
  skillName: string;
  confidence: number;
  reason: string;
  requiredPermissions: string[];
  riskLevel: RiskLevel;
}

export interface IntentMatch {
  intent: AgentIntentType;
  confidence: number;
  reason: string;
  candidates: SkillCandidate[];
}

export interface RoutingResult {
  intents: IntentMatch[];
  selectedSkills: SkillCandidate[];
  requiresApproval: boolean;
  summary: string;
}

export interface RoutingSettings {
  autoRoute: boolean;
  autoRunReadOnly: boolean;
  requireApprovalFileEdits: boolean;
  requireApprovalCommands: boolean;
  requireApprovalMcp: boolean;
}

/* ==========================================================================
   MCP GATEWAY TYPES
   ========================================================================== */

export type MCPTransportType = 'stdio' | 'http' | 'sse' | 'mcpo-openapi';

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: MCPTransportType;
  command?: string;
  url?: string;
  enabled: boolean;
  riskLevel: RiskLevel;
  allowedTools: string[];
  blockedTools: string[];
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  serverId: string;
  serverName: string;
  inputSchema?: Record<string, any>;
  riskLevel: RiskLevel;
  category: 'read' | 'write' | 'network' | 'compute' | 'system' | 'unknown';
  requiresApproval: boolean;
  allowed: boolean;
}

export interface MCPAuditEntry {
  id: string;
  serverId: string;
  toolName: string;
  timestamp: string;
  inputSummary: string;
  resultStatus: 'success' | 'error' | 'blocked' | 'pending-approval';
  userApproved: boolean;
  error?: string;
}

export type PermissionLevel =
  | 'read-only'
  | 'suggest-edits'
  | 'apply-edits-after-approval'
  | 'run-safe-commands-after-approval'
  | 'dangerous-disabled';

export type AgentPlanStatus = 'draft' | 'pending-approval' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error' | 'blocked';

export interface AgentPlanStep {
  id: string;
  title: string;
  description: string;
  reason: string;
  skillId: string;
  permissionLevel: PermissionLevel;
  affectedFiles: string[];
  toolName?: string;
  status: AgentStepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentPlan {
  id: string;
  sessionId: string;
  taskType: AgentTaskType;
  selectedSkillIds: string[];
  steps: AgentPlanStep[];
  status: AgentPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSessionInfo {
  id: string;
  taskDescription: string;
  status: 'created' | 'planning' | 'awaiting-approval' | 'executing' | 'completed' | 'rejected' | 'failed';
  taskType: AgentTaskType | null;
  planId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentEvent {
  id: string;
  sessionId: string;
  type: 'step-start' | 'step-complete' | 'step-error' | 'step-blocked' | 'plan-created' | 'approval-required' | 'execution-complete';
  title: string;
  message: string;
  stepId?: string;
  status: AgentStepStatus;
  affectedFile?: string;
  toolName?: string;
  timestamp: string;
}

/* ==========================================================================
   AUTH TYPES
   ========================================================================== */

export type AuthProvider = 'github' | 'google';

export type AuthMode = 'local' | 'authenticated';

export interface AuthStatus {
  authenticated: boolean;
  mode: AuthMode;
  provider?: AuthProvider;
  user?: AuthUser;
  sessionExpiresAt?: string;
  features: AuthFeatures;
}

export interface AuthUser {
  id: string;
  provider: AuthProvider;
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
}

export interface AuthFeatures {
  githubRepoSync: boolean;
  googleDriveSync: boolean;
  cloudSettingsSync: boolean;
  remoteProjects: boolean;
}

export interface AuthSession {
  id: string;
  userId: string;
  provider: AuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  createdAt: string;
  scopes: string[];
}
