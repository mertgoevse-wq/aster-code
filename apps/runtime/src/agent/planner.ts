import {
  AgentTaskType,
  AgentPlan,
  AgentPlanStep,
  AgentPlanStatus,
  AgentStepStatus,
  SkillDefinition,
  PermissionLevel
} from '@aster-code/shared';
import { TaskClassification } from './types.js';

/**
 * Classifies a user task description into a known task type.
 * MVP: rule-based classification (no LLM needed).
 * Supports both English and German prompts.
 */
export function classifyTask(description: string): TaskClassification {
  const lower = description.toLowerCase();

  // --- Explain requests ---
  if (
    lower.includes('explain') || lower.includes('what is') || lower.includes('how does') ||
    lower.includes('tell me about') || lower.includes('describe') ||
    lower.includes('erkläre') || lower.includes('erklär') || lower.includes('was ist') ||
    lower.includes('wie funktioniert') || lower.includes('beschreib') ||
    lower.includes('übersicht')
  ) {
    return { taskType: 'explain', confidence: 0.9, reasoning: 'User asked for an explanation or overview.' };
  }

  // --- Plan / design requests ---
  if (
    lower.includes('plan') || lower.includes('architecture') || lower.includes('design') ||
    lower.includes('how should i') || lower.includes('recommend') || lower.includes('suggest') ||
    lower.includes('architektur') || lower.includes('vorschlag') || lower.includes('empfehl')
  ) {
    return { taskType: 'plan', confidence: 0.85, reasoning: 'User is asking for planning or architectural recommendations.' };
  }

  // --- UI / styling ---
  if (
    lower.includes('style') || lower.includes('css') || lower.includes('layout') ||
    lower.includes('tailwind') || lower.includes('color') || lower.includes('padding') ||
    lower.includes('margin') || lower.includes('responsive') || lower.includes('alignment') ||
    lower.includes('design') || lower.includes('aussehen') || lower.includes('styling') ||
    lower.includes('animation') || lower.includes('ui') || lower.includes('workbench')
  ) {
    return { taskType: 'ui-fix', confidence: 0.82, reasoning: 'User is requesting UI/styling or workbench changes.' };
  }

  // --- Dependency ---
  if (
    lower.includes('install') || lower.includes('package') || lower.includes('dependency') ||
    lower.includes('npm') || lower.includes('import error') || lower.includes('module not found') ||
    lower.includes('installier') || lower.includes('paket')
  ) {
    return { taskType: 'dependency-fix', confidence: 0.85, reasoning: 'User is dealing with dependency or package management.' };
  }

  // --- Debug / build fix ---
  if (
    lower.includes('debug') || lower.includes('fix') || lower.includes('error') ||
    lower.includes('bug') || lower.includes('broken') || lower.includes('failing') ||
    lower.includes('typecheck') || lower.includes('build error') || lower.includes('compiler') ||
    lower.includes('fehler') || lower.includes('kaputt') || lower.includes('kompilier') ||
    lower.includes('absturz')
  ) {
    return { taskType: 'debug-build', confidence: 0.78, reasoning: 'User is reporting a build error, bug, or runtime issue.' };
  }

  // --- Documentation ---
  if (
    lower.includes('readme') || lower.includes('document') || lower.includes('doc') ||
    lower.includes('write about') || lower.includes('comment') || lower.includes('dokumentation') ||
    lower.includes('doku') || lower.includes('anleitung')
  ) {
    return { taskType: 'docs', confidence: 0.85, reasoning: 'User is requesting documentation work.' };
  }

  // --- Default: edit-code ---
  return {
    taskType: 'edit-code',
    confidence: 0.6,
    reasoning: 'General code modification request detected. Agent will plan edits based on project context.',
  };
}

/**
 * Selects relevant skills for a given task type.
 * Returns active skill IDs that are applicable.
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
    'ui-fix': ['ui-debugger', 'project-planner'],
    'dependency-fix': ['dependency-checker', 'build-fixer'],
    'docs': ['readme-writer', 'codebase-auditor'],
  };

  const recommended = skillMap[taskType] || ['codebase-auditor'];

  return recommended.filter(skillId =>
    availableSkills.some(s => s.id === skillId && s.status === 'active')
  );
}

// --- Step generation helpers ---

let stepCounter = 0;
const nextStepId = () => `step-${Date.now()}-${++stepCounter}-${Math.random().toString(36).slice(2, 5)}`;

function auditStep(
  what: string,
  reason: string,
  files: string[],
  skillId: string = 'codebase-auditor'
): AgentPlanStep {
  return {
    id: nextStepId(),
    title: `Inspect ${what}`,
    description: `Read and analyze ${what} to understand the current state before making any changes.`,
    reason,
    skillId,
    permissionLevel: 'read-only' as PermissionLevel,
    affectedFiles: files,
    toolName: 'read_file',
    status: 'pending' as AgentStepStatus,
    inspectionTargets: files,
    mayChange: [],
    verifyStep: `Confirm that ${what} has been read and the structure is understood.`,
  };
}

function editStep(
  what: string,
  reason: string,
  files: string[],
  changes: string[],
  skillId: string,
  verify: string,
  permissionLevel: PermissionLevel = 'apply-edits-after-approval'
): AgentPlanStep {
  return {
    id: nextStepId(),
    title: `Modify ${what}`,
    description: `Edit ${files.join(', ')} to ${changes.join('; ')}. This step requires your approval before any changes are applied.`,
    reason,
    skillId,
    permissionLevel,
    affectedFiles: files,
    toolName: 'write_file',
    status: 'pending' as AgentStepStatus,
    inspectionTargets: [],
    mayChange: changes,
    verifyStep: verify,
  };
}

function commandStep(
  command: string,
  reason: string,
  skillId: string,
  verify: string,
  permissionLevel: PermissionLevel = 'run-safe-commands-after-approval'
): AgentPlanStep {
  return {
    id: nextStepId(),
    title: `Run ${command}`,
    description: `Execute \`${command}\` to ${reason}. This step requires your explicit approval — the command will not run without it.`,
    reason,
    skillId,
    permissionLevel,
    affectedFiles: [],
    toolName: 'run_command',
    status: 'pending' as AgentStepStatus,
    inspectionTargets: [],
    mayChange: [`Output of: ${command}`],
    verifyStep: verify,
  };
}

/**
 * Generates a deterministic agent execution plan.
 * Every step is clearly labeled with what it inspects, what it may change,
 * required permissions, and how to verify success.
 *
 * MVP: no actual execution. This is a UX-only plan for user review.
 */
export function generatePlan(
  sessionId: string,
  taskDescription: string,
  taskType: AgentTaskType,
  selectedSkillIds: string[]
): AgentPlan {
  stepCounter = 0;
  const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const steps: AgentPlanStep[] = [];

  switch (taskType) {
    case 'explain':
      steps.push(auditStep(
        'project structure',
        'Need to understand the codebase before explaining anything.',
        ['package.json', 'tsconfig.base.json', 'apps/*/src/'],
        'codebase-auditor'
      ));
      steps.push({
        id: nextStepId(),
        title: `Explain: ${taskDescription.slice(0, 60)}`,
        description: `Generate a clear explanation based on the codebase analysis. No files will be modified.`,
        reason: 'User asked for an explanation — this is a read-only request.',
        skillId: 'codebase-auditor',
        permissionLevel: 'read-only' as PermissionLevel,
        affectedFiles: [],
        toolName: 'explain',
        status: 'pending' as AgentStepStatus,
        inspectionTargets: ['Analyzed codebase structure', 'User\'s question context'],
        mayChange: [],
        verifyStep: 'User confirms the explanation addresses their question.',
      });
      break;

    case 'plan':
      steps.push(auditStep(
        'project architecture and conventions',
        'Need to survey existing patterns before proposing new architecture.',
        ['package.json', 'tsconfig.base.json', 'apps/', 'packages/', 'docs/ARCHITECTURE.md'],
        'codebase-auditor'
      ));
      steps.push({
        id: nextStepId(),
        title: 'Design architecture and component layout',
        description: 'Propose a system architecture, component tree, and data flow based on project conventions.',
        reason: 'User asked for a design plan. No code will be modified — this is an advisory step.',
        skillId: 'project-planner',
        permissionLevel: 'suggest-edits' as PermissionLevel,
        affectedFiles: ['docs/*.md (new plan document)'],
        toolName: 'write_plan_doc',
        status: 'pending' as AgentStepStatus,
        inspectionTargets: ['Existing architecture', 'Project file structure'],
        mayChange: ['New plan document in docs/'],
        verifyStep: 'User reviews and confirms the proposed plan before implementation.',
      });
      steps.push({
        id: nextStepId(),
        title: 'Generate step-by-step implementation checklist',
        description: 'Break the plan into concrete, actionable sub-steps with file-level detail.',
        reason: 'Architecture needs a clear implementation path before coding starts.',
        skillId: 'project-planner',
        permissionLevel: 'suggest-edits' as PermissionLevel,
        affectedFiles: ['docs/*.md'],
        toolName: 'write_plan_doc',
        status: 'pending' as AgentStepStatus,
        inspectionTargets: ['Architecture plan output'],
        mayChange: ['Checklist in plan document'],
        verifyStep: 'Checklist covers all required deliverables and is ordered logically.',
      });
      break;

    case 'edit-code':
      steps.push(auditStep(
        'target files and their dependencies',
        'Identify exact files and functions to modify — avoiding unintended side effects.',
        ['(relevant source files — determined by analysis)', '**/package.json', '**/tsconfig.json'],
        'codebase-auditor'
      ));
      steps.push({
        id: nextStepId(),
        title: 'Plan code modifications',
        description: 'Identify the exact files, functions, and lines to modify based on conventions in the analyzed code.',
        reason: 'Precise targeting prevents accidental changes to unrelated code.',
        skillId: 'project-planner',
        permissionLevel: 'suggest-edits' as PermissionLevel,
        affectedFiles: [],
        toolName: 'plan_edits',
        status: 'pending' as AgentStepStatus,
        inspectionTargets: ['Audit results', 'Imports and references of target functions'],
        mayChange: [],
        verifyStep: 'Planned edits are scoped to only the files that need changing.',
      });
      steps.push(editStep(
        'targeted source files',
        'Apply the planned edits to implement the requested feature or fix.',
        ['(files identified in plan step)'],
        ['Apply the edits planned in the previous step'],
        'codebase-auditor',
        'Run `npm run typecheck` to verify no type errors were introduced.',
        'apply-edits-after-approval'
      ));
      break;

    case 'debug-build':
      steps.push(commandStep(
        'npm run typecheck',
        'Reproduce the build error to capture exact error messages.',
        'build-fixer',
        'Typecheck command runs successfully and returns exit code 0 or human-readable errors.',
      ));
      steps.push(auditStep(
        'typecheck/build output and error messages',
        'Parse error messages to identify root causes — dependency mismatch, type error, missing config, etc.',
        ['tsconfig.json', 'package.json', '(files referenced in errors)'],
        'build-fixer'
      ));
      steps.push(editStep(
        'files causing build errors',
        'Apply targeted fixes for each build error found during diagnosis.',
        ['(files with errors — determined by analysis)'],
        ['Fix type errors', 'Update imports', 'Add missing dependencies', 'Correct config values'],
        'build-fixer',
        'Run `npm run typecheck` again — must pass with 0 errors.',
        'apply-edits-after-approval'
      ));
      steps.push(commandStep(
        'npm run typecheck && npm run build',
        'Verify that all proposed fixes resolve the build errors without introducing new ones.',
        'build-fixer',
        'Full typecheck and build pass with 0 errors. No regressions introduced.',
      ));
      break;

    case 'ui-fix':
      steps.push(auditStep(
        'current styling, component structure, and Tailwind usage',
        'Review the design system — existing classes, color tokens, layout patterns — before making changes.',
        ['apps/web/src/styles/theme.css', 'apps/web/tailwind.config.js', '(affected component files)'],
        'ui-debugger'
      ));
      steps.push(editStep(
        'component styling',
        'Apply the requested style/layout/animation changes while preserving the existing design system conventions.',
        ['(component files — determined by analysis)'],
        ['Update Tailwind classes', 'Adjust layout', 'Fix visual bug', 'Apply new style'],
        'ui-debugger',
        'Visual inspection: the UI renders correctly at responsive breakpoints. No layout breaks.',
        'apply-edits-after-approval'
      ));
      break;

    case 'dependency-fix':
      steps.push(auditStep(
        'all package.json files and lock files',
        'Find dependency conflicts, version mismatches, and security vulnerabilities across the monorepo.',
        ['package.json', '**/package.json', 'package-lock.json'],
        'dependency-checker'
      ));
      steps.push(commandStep(
        'npm audit',
        'Check for known security vulnerabilities in current dependencies.',
        'dependency-checker',
        'Audit report shows vulnerability counts. High/critical issues flagged for action.',
      ));
      steps.push(editStep(
        'package.json dependency declarations',
        'Update version ranges, add missing deps, or remove unused ones based on audit results.',
        ['package.json', '**/package.json'],
        ['Update dependency versions', 'Add missing packages', 'Remove unused dependencies'],
        'dependency-checker',
        'Run `npm install && npm run typecheck && npm run build` to verify all packages resolve and build passes.',
        'apply-edits-after-approval'
      ));
      break;

    case 'docs':
      steps.push(auditStep(
        'existing documentation for gaps or outdated content',
        'Read current docs to avoid duplication and identify what needs updating.',
        ['docs/*.md', 'README.md', 'AGENTS.md'],
        'codebase-auditor'
      ));
      steps.push(editStep(
        'documentation files',
        'Create new or update existing documentation with clear, structured content matching the project style.',
        ['docs/*.md', 'README.md'],
        ['Add new documentation', 'Update outdated sections', 'Add code examples', 'Fix broken links'],
        'readme-writer',
        'Documentation renders correctly in markdown viewers and covers the intended topic.',
        'apply-edits-after-approval'
      ));
      break;
  }

  const plan: AgentPlan = {
    id: planId,
    sessionId,
    taskType,
    selectedSkillIds,
    steps,
    status: 'pending-approval',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return plan;
}
