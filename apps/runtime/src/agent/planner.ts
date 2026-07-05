import {
  AgentTaskType,
  AgentPlan,
  AgentPlanStep,
  AgentPlanStatus,
  SkillDefinition
} from '@aster-code/shared';
import { TaskClassification } from './types.js';

/**
 * Classifies a user task description into a known task type.
 * MVP: rule-based classification (no LLM needed).
 */
export function classifyTask(description: string): TaskClassification {
  const lower = description.toLowerCase();

  // Explain requests
  if (
    lower.includes('explain') ||
    lower.includes('what is') ||
    lower.includes('how does') ||
    lower.includes('tell me about') ||
    lower.includes('describe')
  ) {
    return { taskType: 'explain', confidence: 0.9, reasoning: 'User asked for an explanation.' };
  }

  // Plan requests
  if (
    lower.includes('plan') ||
    lower.includes('architecture') ||
    lower.includes('design') ||
    lower.includes('how should i') ||
    lower.includes('recommend') ||
    lower.includes('suggest')
  ) {
    return { taskType: 'plan', confidence: 0.85, reasoning: 'User is asking for planning or design recommendations.' };
  }

  // UI fix
  if (
    lower.includes('style') ||
    lower.includes('css') ||
    lower.includes('layout') ||
    lower.includes('tailwind') ||
    lower.includes('color') ||
    lower.includes('padding') ||
    lower.includes('margin') ||
    lower.includes('responsive') ||
    lower.includes('alignment')
  ) {
    return { taskType: 'ui-fix', confidence: 0.8, reasoning: 'User is requesting UI/styling changes.' };
  }

  // Dependency fix
  if (
    lower.includes('install') ||
    lower.includes('package') ||
    lower.includes('dependency') ||
    lower.includes('npm') ||
    lower.includes('import error') ||
    lower.includes('module not found')
  ) {
    return { taskType: 'dependency-fix', confidence: 0.85, reasoning: 'User is dealing with dependency management.' };
  }

  // Debug / build fix
  if (
    lower.includes('debug') ||
    lower.includes('fix') ||
    lower.includes('error') ||
    lower.includes('bug') ||
    lower.includes('broken') ||
    lower.includes('failing') ||
    lower.includes('typecheck') ||
    lower.includes('build error') ||
    lower.includes('compiler')
  ) {
    return { taskType: 'debug-build', confidence: 0.75, reasoning: 'User is reporting a build or runtime issue.' };
  }

  // Documentation
  if (
    lower.includes('readme') ||
    lower.includes('document') ||
    lower.includes('doc') ||
    lower.includes('write about') ||
    lower.includes('comment')
  ) {
    return { taskType: 'docs', confidence: 0.85, reasoning: 'User is requesting documentation work.' };
  }

  // Default: edit-code (most common dev task)
  return { taskType: 'edit-code', confidence: 0.6, reasoning: 'General code modification request detected.' };
}

/**
 * Selects relevant skills for a given task type.
 * Returns skill IDs that are applicable.
 */
export function selectSkillsForTask(
  taskType: AgentTaskType,
  availableSkills: SkillDefinition[]
): string[] {
  const skillMap: Record<AgentTaskType, string[]> = {
    'explain': ['codebase-auditor'],
    'plan': ['project-planner', 'codebase-auditor'],
    'edit-code': ['project-planner', 'codebase-auditor'],
    'debug-build': ['build-fixer', 'codebase-auditor', 'dependency-checker'],
    'ui-fix': ['ui-debugger'],
    'dependency-fix': ['dependency-checker', 'build-fixer'],
    'docs': ['readme-writer', 'codebase-auditor'],
  };

  const recommended = skillMap[taskType] || ['codebase-auditor'];

  // Filter to only available/active skills
  return recommended.filter(skillId =>
    availableSkills.some(s => s.id === skillId && s.status === 'active')
  );
}

/**
 * Generates a deterministic, mock execution plan for the given task type.
 * MVP: returns hardcoded safe placeholder steps. No real LLM calls.
 */
export function generatePlan(
  sessionId: string,
  taskDescription: string,
  taskType: AgentTaskType,
  selectedSkillIds: string[]
): AgentPlan {
  const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stepId = () => `step-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`;

  const baseSteps: AgentPlanStep[] = [
    {
      id: stepId(),
      title: 'Analyze workspace structure',
      description: 'Survey the project directory, identify key files, and validate project conventions.',
      reason: 'Agent needs to understand the codebase before acting.',
      skillId: 'codebase-auditor',
      permissionLevel: 'read-only',
      affectedFiles: ['**/*'],
      toolName: 'list_files',
      status: 'pending'
    }
  ];

  switch (taskType) {
    case 'explain':
      baseSteps.push({
        id: stepId(),
        title: 'Generate explanation',
        description: 'Provide a clear, concise explanation of the requested concepts or code.',
        reason: 'User asked for explanation — no edits needed.',
        skillId: 'codebase-auditor',
        permissionLevel: 'read-only',
        affectedFiles: [],
        toolName: 'explain',
        status: 'pending'
      });
      break;

    case 'plan':
      baseSteps.push({
        id: stepId(),
        title: 'Create architectural plan',
        description: 'Design the system architecture, component tree, and data flow.',
        reason: 'User asked for a design plan.',
        skillId: 'project-planner',
        permissionLevel: 'suggest-edits',
        affectedFiles: [],
        toolName: 'plan',
        status: 'pending'
      });
      baseSteps.push({
        id: stepId(),
        title: 'Generate implementation checklist',
        description: 'Create a step-by-step implementation checklist with file-level detail.',
        reason: 'Detailed planning requires actionable steps.',
        skillId: 'project-planner',
        permissionLevel: 'suggest-edits',
        affectedFiles: ['docs/*.md'],
        toolName: 'write_plan_doc',
        status: 'pending'
      });
      break;

    case 'edit-code':
      baseSteps.push({
        id: stepId(),
        title: 'Plan code modifications',
        description: 'Identify the exact files and functions to modify based on the request.',
        reason: 'Code edits require precise file targeting.',
        skillId: 'project-planner',
        permissionLevel: 'suggest-edits',
        affectedFiles: [],
        toolName: 'plan_edits',
        status: 'pending'
      });
      baseSteps.push({
        id: stepId(),
        title: 'Draft file edits',
        description: 'Prepare suggested file modifications with before/after comparisons.',
        reason: 'User must review all edits before they are applied.',
        skillId: 'codebase-auditor',
        permissionLevel: 'apply-edits-after-approval',
        affectedFiles: ['(determined by analysis)'],
        toolName: 'write_file',
        status: 'pending'
      });
      break;

    case 'debug-build':
      baseSteps.push({
        id: stepId(),
        title: 'Run diagnostic checks',
        description: 'Run typecheck and build to identify exact errors.',
        reason: 'Build issues require exact error messages to fix.',
        skillId: 'build-fixer',
        permissionLevel: 'run-safe-commands-after-approval',
        affectedFiles: [],
        toolName: 'run_command',
        status: 'pending'
      });
      baseSteps.push({
        id: stepId(),
        title: 'Propose fixes',
        description: 'Suggest fixes for each build error found.',
        reason: 'Each error needs a targeted fix.',
        skillId: 'build-fixer',
        permissionLevel: 'apply-edits-after-approval',
        affectedFiles: ['(files with errors)'],
        toolName: 'write_file',
        status: 'pending'
      });
      break;

    case 'ui-fix':
      baseSteps.push({
        id: stepId(),
        title: 'Analyze current styling',
        description: 'Review existing CSS/Tailwind classes and layout structure.',
        reason: 'UI fixes require understanding the current design system.',
        skillId: 'ui-debugger',
        permissionLevel: 'read-only',
        affectedFiles: ['**/*.css', '**/*.tsx'],
        toolName: 'read_file',
        status: 'pending'
      });
      baseSteps.push({
        id: stepId(),
        title: 'Apply style fixes',
        description: 'Modify styling to fix the reported visual issue.',
        reason: 'Visual fix needs to be applied to the relevant component.',
        skillId: 'ui-debugger',
        permissionLevel: 'apply-edits-after-approval',
        affectedFiles: ['(component files)'],
        toolName: 'write_file',
        status: 'pending'
      });
      break;

    case 'dependency-fix':
      baseSteps.push({
        id: stepId(),
        title: 'Audit package dependencies',
        description: 'Check package.json for version conflicts and security issues.',
        reason: 'Dependency issues require package analysis first.',
        skillId: 'dependency-checker',
        permissionLevel: 'read-only',
        affectedFiles: ['package.json', '**/package.json'],
        toolName: 'read_file',
        status: 'pending'
      });
      baseSteps.push({
        id: stepId(),
        title: 'Update dependency declarations',
        description: 'Modify package.json to fix dependency issues.',
        reason: 'Package changes need approval before applying.',
        skillId: 'dependency-checker',
        permissionLevel: 'apply-edits-after-approval',
        affectedFiles: ['package.json'],
        toolName: 'write_file',
        status: 'pending'
      });
      break;

    case 'docs':
      baseSteps.push({
        id: stepId(),
        title: 'Review existing documentation',
        description: 'Read existing docs to avoid duplication.',
        reason: 'New docs should build on existing content.',
        skillId: 'codebase-auditor',
        permissionLevel: 'read-only',
        affectedFiles: ['docs/*.md', 'README.md'],
        toolName: 'read_file',
        status: 'pending'
      });
      baseSteps.push({
        id: stepId(),
        title: 'Write documentation',
        description: 'Create or update documentation files.',
        reason: 'Documentation changes need user review.',
        skillId: 'readme-writer',
        permissionLevel: 'apply-edits-after-approval',
        affectedFiles: ['docs/*.md'],
        toolName: 'write_file',
        status: 'pending'
      });
      break;
  }

  const plan: AgentPlan = {
    id: planId,
    sessionId,
    taskType,
    selectedSkillIds,
    steps: baseSteps,
    status: 'pending-approval',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return plan;
}
