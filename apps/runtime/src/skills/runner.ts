import { SkillDefinition, AgentPlanStep } from '@aster-code/shared';
import { skillsRegistry } from './registry.js';
import { checkPermission, getSkillPermissionLevel } from '../agent/policies.js';

export interface SkillExecutionRequest {
  step: AgentPlanStep;
  sessionId: string;
}

export interface SkillExecutionResult {
  success: boolean;
  message: string;
  blocked: boolean;
  requiresApproval: boolean;
}

/**
 * Skills runner validates and routes skill execution requests.
 *
 * MVP behavior:
 * - Validates that the skill exists and is active.
 * - Checks permissions against the policy engine.
 * - Returns success/failure, but does NOT execute real mutations.
 * - File writes and commands are simulated (logged only).
 */
class SkillsRunner {
  /**
   * Validates whether a skill can be executed for a given step.
   */
  validateExecution(request: SkillExecutionRequest): SkillExecutionResult {
    const { step, sessionId } = request;

    // 1. Find the skill
    const skill = skillsRegistry.getSkill(step.skillId);
    if (!skill) {
      return {
        success: false,
        message: `Skill "${step.skillId}" not found in registry.`,
        blocked: true,
        requiresApproval: false,
      };
    }

    // 2. Check if skill is active
    if (skill.status !== 'active') {
      return {
        success: false,
        message: `Skill "${skill.name}" is currently disabled. Enable it in Agent Skills before running.`,
        blocked: true,
        requiresApproval: false,
      };
    }

    // 3. Check permission level
    const currentLevel = getSkillPermissionLevel(skill);
    const permissionCheck = checkPermission(step.permissionLevel, currentLevel);

    if (!permissionCheck.allowed) {
      return {
        success: false,
        message: permissionCheck.reason,
        blocked: true,
        requiresApproval: false,
      };
    }

    // 4. Determine if approval is needed
    const requiresApproval =
      skill.executionMode === 'ask' || permissionCheck.requiresApproval;

    return {
      success: true,
      message: requiresApproval
        ? `Skill "${skill.name}" requires user approval before execution.`
        : `Skill "${skill.name}" validated successfully.`,
      blocked: false,
      requiresApproval,
    };
  }

  /**
   * Runs a skill execution (MVP: simulated, no real mutations).
   */
  async runSkill(request: SkillExecutionRequest): Promise<SkillExecutionResult> {
    const validation = this.validateExecution(request);

    if (!validation.success) {
      return validation;
    }

    if (validation.requiresApproval) {
      return {
        success: false,
        message: `Approval required before executing "${request.step.skillId}".`,
        blocked: true,
        requiresApproval: true,
      };
    }

    // MVP: Simulate execution
    console.log(`[SkillsRunner] Simulating execution of skill: ${request.step.skillId} for step: ${request.step.id}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      message: `Skill "${request.step.skillId}" executed (simulated in MVP).`,
      blocked: false,
      requiresApproval: false,
    };
  }
}

export const skillsRunner = new SkillsRunner();
