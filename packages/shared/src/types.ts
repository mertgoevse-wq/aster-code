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

