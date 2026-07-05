import {
  AgentTaskType,
  AgentPlanStatus,
  AgentStepStatus,
  AgentPlanStep,
  AgentPlan,
  AgentSessionInfo,
  AgentEvent,
  PermissionLevel,
  SkillDefinition
} from '@aster-code/shared';

// Re-export shared types for convenience
export type {
  AgentTaskType,
  AgentPlanStatus,
  AgentStepStatus,
  AgentPlanStep,
  AgentPlan,
  AgentSessionInfo,
  AgentEvent,
  PermissionLevel,
};

// Internal session representation (extends shared info)
export interface Session {
  info: AgentSessionInfo;
  plan: AgentPlan | null;
  events: AgentEvent[];
}

// Task classifier result
export interface TaskClassification {
  taskType: AgentTaskType;
  confidence: number;
  reasoning: string;
}

// Plan execution context
export interface ExecutionContext {
  sessionId: string;
  plan: AgentPlan;
  approvedBy: string;
  approvedAt: string;
}
