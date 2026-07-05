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
 *
 * Each skill candidate now includes detailed risk explanations
 * and multi-skill selection logic.
 */

interface SkillRouteTemplate {
  skillId: string;
  confidence: number;
  reasonFn: (prompt: string) => string;
  requiredPermissions: string[];
  riskLevel: RiskLevel;
  riskExplanation: string;
}

const INTENT_SKILL_MAP: Record<AgentIntentType, SkillRouteTemplate[]> = {
  'explain-code': [
    {
      skillId: 'codebase-auditor',
      confidence: 0.95,
      reasonFn: () => 'Auditor surveys codebase structure, identifies key files, and explains how they connect.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only — no files or configs will be modified. Completely safe.',
    },
  ],
  'build-feature': [
    {
      skillId: 'project-planner',
      confidence: 0.9,
      reasonFn: () => 'Planner designs feature architecture, component trees, and file structure before any code is written.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Plan-phase is read-only. File edits only happen after you approve the plan. You can review every change.',
    },
    {
      skillId: 'codebase-auditor',
      confidence: 0.75,
      reasonFn: () => 'Auditor identifies existing code that the new feature should integrate with — preventing duplication.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only survey. No changes to existing code.',
    },
    {
      skillId: 'test-writer',
      confidence: 0.6,
      reasonFn: () => 'New features should include tests. Test writer scaffolds test files alongside implementation.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Writes new test files only. Does not modify existing production code. Requires approval per file.',
    },
  ],
  'fix-bug': [
    {
      skillId: 'codebase-auditor',
      confidence: 0.9,
      reasonFn: () => 'Auditor traces the reported bug to its source by scanning relevant files for error patterns.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only investigation. Auditor identifies the problematic code but does not modify anything.',
    },
    {
      skillId: 'build-fixer',
      confidence: 0.7,
      reasonFn: () => 'Build fixer can diagnose and repair broken code, configs, or type errors.',
      requiredPermissions: ['read_workspace', 'write_workspace', 'execute_commands'],
      riskLevel: 'medium',
      riskExplanation: 'MEDIUM RISK: May run build commands (npm run typecheck, npm run build) to verify fixes. Each command requires separate approval.',
    },
  ],
  'debug-build': [
    {
      skillId: 'build-fixer',
      confidence: 0.95,
      reasonFn: () => 'Build fixer specializes in compiler and build error resolution — reads error messages and proposes targeted fixes.',
      requiredPermissions: ['read_workspace', 'write_workspace', 'execute_commands'],
      riskLevel: 'medium',
      riskExplanation: 'MEDIUM RISK: Will run diagnostic commands (tsc, build) to reproduce errors. Fixes require your approval before being applied.',
    },
    {
      skillId: 'dependency-checker',
      confidence: 0.8,
      reasonFn: () => 'Many build errors stem from dependency conflicts. Dependency checker audits package versions for compatibility.',
      requiredPermissions: ['read_workspace', 'execute_commands'],
      riskLevel: 'medium',
      riskExplanation: 'MEDIUM RISK: May run npm audit or similar commands. Package installs require explicit approval.',
    },
  ],
  'improve-ui': [
    {
      skillId: 'ui-debugger',
      confidence: 0.95,
      reasonFn: () => 'UI debugger analyzes styling, layout, and component structure with Tailwind/JSX awareness.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Styling changes only. Affects visual appearance, not business logic. Each component edit requires approval.',
    },
    {
      skillId: 'project-planner',
      confidence: 0.55,
      reasonFn: () => 'For large UI overhauls, planner can design the component tree before implementation.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Planning phase only. No code changed until you approve the plan steps.',
    },
  ],
  'dependency-task': [
    {
      skillId: 'dependency-checker',
      confidence: 0.95,
      reasonFn: () => 'Dependency checker audits packages for security vulnerabilities, version conflicts, and deprecated APIs.',
      requiredPermissions: ['read_workspace', 'execute_commands'],
      riskLevel: 'medium',
      riskExplanation: 'MEDIUM RISK: Package installs/upgrades modify node_modules and lock files. Every install command requires your explicit approval.',
    },
    {
      skillId: 'build-fixer',
      confidence: 0.65,
      reasonFn: () => 'Dependency changes often require build verification to ensure nothing broke.',
      requiredPermissions: ['read_workspace', 'write_workspace', 'execute_commands'],
      riskLevel: 'medium',
      riskExplanation: 'Will verify that dependency changes compile and typecheck correctly after updates.',
    },
  ],
  'write-tests': [
    {
      skillId: 'test-writer',
      confidence: 0.95,
      reasonFn: () => 'Test writer generates unit, integration, and smoke tests following the project\'s existing test patterns.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Writes new test files only. Does not modify source code. Tests are safe to run after approval.',
    },
    {
      skillId: 'codebase-auditor',
      confidence: 0.7,
      reasonFn: () => 'Auditor identifies untested code paths and suggests what needs coverage.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only analysis. Auditor flags code paths with low or missing test coverage.',
    },
  ],
  'create-docs': [
    {
      skillId: 'readme-writer',
      confidence: 0.95,
      reasonFn: () => 'README writer generates clear, structured documentation matching the project\'s existing doc style.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Creates or updates markdown documentation. Does not touch source code or configs.',
    },
    {
      skillId: 'codebase-auditor',
      confidence: 0.6,
      reasonFn: () => 'Auditor surveys the codebase for missing or outdated documentation.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only scan. Auditor identifies what needs documenting — you decide what to write.',
    },
  ],
  'refactor': [
    {
      skillId: 'codebase-auditor',
      confidence: 0.9,
      reasonFn: () => 'Auditor identifies refactoring targets, dead code, and opportunities for simplification.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only analysis. Auditor suggests refactoring targets but does not execute any changes.',
    },
    {
      skillId: 'project-planner',
      confidence: 0.75,
      reasonFn: () => 'Planner designs the refactored structure — ensures new layout matches project conventions.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Plan-phase only. No code is moved or modified until you approve the final plan.',
    },
    {
      skillId: 'test-writer',
      confidence: 0.5,
      reasonFn: () => 'Regression tests ensure the refactored code behaves identically to the original.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Adds test files to verify refactored code produces the same outputs as before.',
    },
  ],
  'setup-runtime': [
    {
      skillId: 'dependency-checker',
      confidence: 0.8,
      reasonFn: () => 'Runtime setup often requires dependency verification, version checks, and configuration validation.',
      requiredPermissions: ['read_workspace', 'execute_commands'],
      riskLevel: 'medium',
      riskExplanation: 'MEDIUM RISK: May suggest install or configuration commands. Each command requires your approval.',
    },
    {
      skillId: 'codebase-auditor',
      confidence: 0.7,
      reasonFn: () => 'Auditor verifies project configuration files (tsconfig, package.json, .env templates) for correctness.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only config audit. Auditor checks that all required configs are present and valid.',
    },
  ],
  'model-provider-task': [
    {
      skillId: 'codebase-auditor',
      confidence: 0.75,
      reasonFn: () => 'Auditor checks provider configuration, registry adapters, and API key setup (without exposing keys).',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only. Auditor inspects provider configs but never reads or logs API key values.',
    },
    {
      skillId: 'dependency-checker',
      confidence: 0.6,
      reasonFn: () => 'Provider integration may require SDK packages or Node version validation.',
      requiredPermissions: ['read_workspace', 'execute_commands'],
      riskLevel: 'medium',
      riskExplanation: 'MEDIUM RISK: May suggest package installs for provider SDKs. Requires approval.',
    },
  ],
  'mcp-tool-task': [
    {
      skillId: 'project-planner',
      confidence: 0.7,
      reasonFn: () => 'Planner designs MCP server integration: transport configuration, tool allowlists, and security policies.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'MCP config changes only. Tool execution is disabled by default until you explicitly enable and approve.',
    },
    {
      skillId: 'codebase-auditor',
      confidence: 0.6,
      reasonFn: () => 'Auditor surveys existing MCP server configs and verifies security policies are intact.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only audit of MCP server configurations and tool allowlists.',
    },
  ],
  'git-task': [
    {
      skillId: 'codebase-auditor',
      confidence: 0.7,
      reasonFn: () => 'Auditor reviews staged changes before git operations — catches accidental commits of secrets or build artifacts.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only check. Auditor verifies that git changes look intentional and safe before you commit.',
    },
  ],
  'unknown': [
    {
      skillId: 'codebase-auditor',
      confidence: 0.6,
      reasonFn: () => 'Auditor can analyze the workspace for any general request — surveys codebase to find relevant context.',
      requiredPermissions: ['read_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Read-only exploration. Auditor helps narrow down what you might want to do.',
    },
    {
      skillId: 'project-planner',
      confidence: 0.5,
      reasonFn: () => 'Planner can help structure unclear requests into concrete action steps.',
      requiredPermissions: ['read_workspace', 'write_workspace'],
      riskLevel: 'low',
      riskExplanation: 'Planning phase only. No execution until you understand and approve the plan.',
    },
  ],
};

/**
 * Routes detected intents to candidate skills.
 * Resolves skill names from the active registry.
 */
export function routeIntentsToSkills(
  intents: IntentMatch[],
  availableSkills: SkillDefinition[]
): IntentMatch[] {
  return intents.map(intent => {
    const templates = INTENT_SKILL_MAP[intent.intent] || [];

    const candidates: SkillCandidate[] = templates
      .map(t => {
        const skill = availableSkills.find(s => s.id === t.skillId);
        if (!skill) return null;
        return {
          skillId: t.skillId,
          skillName: skill.name,
          confidence: Math.round(t.confidence * intent.confidence * 100) / 100,
          reason: t.reasonFn(''),
          requiredPermissions: t.requiredPermissions,
          riskLevel: t.riskLevel,
        } as SkillCandidate & { riskExplanation?: string };
      })
      .filter((c): c is SkillCandidate => c !== null);

    return { ...intent, candidates };
  });
}

/**
 * Computes overall risk from all selected skill candidates.
 * Returns the highest risk level found.
 */
export function computeOverallRisk(candidates: SkillCandidate[]): RiskLevel {
  if (candidates.some(c => c.riskLevel === 'high')) return 'high';
  if (candidates.some(c => c.riskLevel === 'medium')) return 'medium';
  return 'low';
}

/**
 * Builds a human-readable risk explanation based on selected skills.
 */
export function buildRiskExplanation(candidates: SkillCandidate[]): string {
  if (candidates.length === 0) return 'No active skills selected. No risk.';

  const hasWrite = candidates.some(c => c.requiredPermissions.includes('write_workspace'));
  const hasCommands = candidates.some(c => c.requiredPermissions.includes('execute_commands'));
  const hasSystem = candidates.some(c => c.requiredPermissions.includes('system'));
  const overallRisk = computeOverallRisk(candidates);

  const parts: string[] = [];

  if (overallRisk === 'high') {
    parts.push('⚠️ HIGH RISK: Contains system-level or unrestricted operations.');
  } else if (overallRisk === 'medium') {
    parts.push('⚡ MEDIUM RISK: Operations may modify files or run commands.');
  } else {
    parts.push('✅ LOW RISK: Primarily read-only or advisory operations.');
  }

  if (hasWrite) parts.push('File write/edit permission requested. Each file modification requires explicit approval.');
  if (hasCommands) parts.push('Command execution permission requested. Each command runs only after you approve it.');
  if (hasSystem) parts.push('System-level access requested. Use with extreme caution.');

  return parts.join(' ');
}

/**
 * Determines if the routing result requires user approval.
 * File-edit and command skills always require approval.
 */
export function requiresApproval(candidates: SkillCandidate[]): boolean {
  if (candidates.length === 0) return false;
  return candidates.some(c =>
    c.requiredPermissions.includes('write_workspace') ||
    c.requiredPermissions.includes('execute_commands') ||
    c.requiredPermissions.includes('system')
  );
}
