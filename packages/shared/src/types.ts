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
  isSystemDefault?: boolean;
  createdAt: string;
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
