import {
  AgentIntentType,
  IntentMatch,
  SkillCandidate,
  SkillDefinition,
  RiskLevel
} from '@aster-code/shared';

/**
 * Skill Router — maps detected intents to candidate skills with
 * confidence scores, reasoning, permissions, and risk levels.
 */

// Intent-to-skill mapping with default candidates
const INTENT_SKILL_MAP: Record<AgentIntentType, Omit<SkillCandidate, 'skillName'>[]> = {
  'explain-code': [
    { skillId: 'codebase-auditor', confidence: 0.95, reason: 'Auditor can survey codebase and explain structure.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
  ],
  'build-feature': [
    { skillId: 'project-planner', confidence: 0.9, reason: 'Planner can design the feature structure before implementation.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
    { skillId: 'codebase-auditor', confidence: 0.75, reason: 'Auditor identifies relevant existing code to integrate with.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
    { skillId: 'test-writer', confidence: 0.6, reason: 'New features should include tests.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
  ],
  'fix-bug': [
    { skillId: 'codebase-auditor', confidence: 0.9, reason: 'Auditor can trace bug to source by scanning codebase.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
    { skillId: 'build-fixer', confidence: 0.7, reason: 'Build fixer can diagnose and repair broken code.', requiredPermissions: ['read_workspace', 'write_workspace', 'execute_commands'], riskLevel: 'medium' },
  ],
  'debug-build': [
    { skillId: 'build-fixer', confidence: 0.95, reason: 'Build fixer specializes in compiler and build error resolution.', requiredPermissions: ['read_workspace', 'write_workspace', 'execute_commands'], riskLevel: 'medium' },
    { skillId: 'dependency-checker', confidence: 0.8, reason: 'Many build errors stem from dependency issues.', requiredPermissions: ['read_workspace', 'execute_commands'], riskLevel: 'medium' },
  ],
  'improve-ui': [
    { skillId: 'ui-debugger', confidence: 0.95, reason: 'UI debugger specializes in styling and layout analysis.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
  ],
  'dependency-task': [
    { skillId: 'dependency-checker', confidence: 0.95, reason: 'Dependency checker audits packages and security vulnerabilities.', requiredPermissions: ['read_workspace', 'execute_commands'], riskLevel: 'medium' },
    { skillId: 'build-fixer', confidence: 0.65, reason: 'Dependency changes may require build fixes.', requiredPermissions: ['read_workspace', 'write_workspace', 'execute_commands'], riskLevel: 'medium' },
  ],
  'write-tests': [
    { skillId: 'test-writer', confidence: 0.95, reason: 'Test writer generates unit and integration tests.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
    { skillId: 'codebase-auditor', confidence: 0.7, reason: 'Auditor can identify untested code paths.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
  ],
  'create-docs': [
    { skillId: 'readme-writer', confidence: 0.95, reason: 'README writer specializes in documentation generation.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
    { skillId: 'codebase-auditor', confidence: 0.6, reason: 'Auditor can survey codebase for documentation gaps.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
  ],
  'refactor': [
    { skillId: 'codebase-auditor', confidence: 0.9, reason: 'Auditor can identify refactoring targets and dead code.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
    { skillId: 'project-planner', confidence: 0.75, reason: 'Planner can design the refactored structure.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
    { skillId: 'test-writer', confidence: 0.5, reason: 'Regression tests needed after refactoring.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
  ],
  'setup-runtime': [
    { skillId: 'dependency-checker', confidence: 0.8, reason: 'Runtime setup often involves dependency verification.', requiredPermissions: ['read_workspace', 'execute_commands'], riskLevel: 'medium' },
    { skillId: 'codebase-auditor', confidence: 0.7, reason: 'Auditor can verify project configuration files.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
  ],
  'model-provider-task': [
    { skillId: 'codebase-auditor', confidence: 0.75, reason: 'Auditor can check provider configs and model registry.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
    { skillId: 'dependency-checker', confidence: 0.6, reason: 'Provider setup may need package updates.', requiredPermissions: ['read_workspace', 'execute_commands'], riskLevel: 'medium' },
  ],
  'mcp-tool-task': [
    { skillId: 'project-planner', confidence: 0.7, reason: 'Planner can design MCP integration architecture.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
  ],
  'git-task': [
    { skillId: 'codebase-auditor', confidence: 0.7, reason: 'Auditor can review changes before git operations.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
  ],
  'unknown': [
    { skillId: 'codebase-auditor', confidence: 0.6, reason: 'Auditor can analyze the workspace for any general request.', requiredPermissions: ['read_workspace'], riskLevel: 'low' },
    { skillId: 'project-planner', confidence: 0.5, reason: 'Planner can help structure unknown requests.', requiredPermissions: ['read_workspace', 'write_workspace'], riskLevel: 'low' },
  ],
};

/**
 * Routes detected intents to candidate skills.
 * Resolves skill names from the registry and filters to active skills.
 */
export function routeIntentsToSkills(
  intents: IntentMatch[],
  availableSkills: SkillDefinition[]
): IntentMatch[] {
  return intents.map(intent => {
    const rawCandidates = INTENT_SKILL_MAP[intent.intent] || [];

    const candidates: SkillCandidate[] = rawCandidates
      .map(c => {
        const skill = availableSkills.find(s => s.id === c.skillId);
        return skill ? { ...c, skillName: skill.name } : null;
      })
      .filter((c): c is SkillCandidate => c !== null);

    return { ...intent, candidates };
  });
}

/**
 * Computes a summary risk level from all selected skills.
 */
export function computeOverallRisk(candidates: SkillCandidate[]): RiskLevel {
  if (candidates.some(c => c.riskLevel === 'high')) return 'high';
  if (candidates.some(c => c.riskLevel === 'medium')) return 'medium';
  return 'low';
}

/**
 * Determines if the routing result requires user approval.
 * File-edit and command skills always require approval.
 */
export function requiresApproval(candidates: SkillCandidate[]): boolean {
  if (candidates.length === 0) return false;
  return candidates.some(c =>
    c.requiredPermissions.includes('write_workspace') ||
    c.requiredPermissions.includes('execute_commands')
  );
}
