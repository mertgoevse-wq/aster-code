import { SkillDefinition } from '@aster-code/shared';

/**
 * Built-in skill definitions for the MVP.
 * These are the authoritative skill definitions used by the runtime.
 */
// Placeholder skill candidates from external research — no code imported.
// See docs/SKILL_CANDIDATE_MATRIX.md for full details.
const RESEARCH_CANDIDATES: SkillDefinition[] = [
  {
    id: 'alignment-checker',
    name: 'Alignment Checker',
    description: 'Grills the user to validate agent plan matches original intent before execution. Inspired by mattpocock/skills.',
    permissions: ['read_workspace'],
    executionMode: 'ask',
    status: 'inactive',
  },
  {
    id: 'spec-writer',
    name: 'Spec Writer',
    description: 'Generates formal specifications before coding; validates plan completeness. Inspired by addyosmani/agent-skills and obra/superpowers.',
    permissions: ['read_workspace', 'write_workspace'],
    executionMode: 'auto',
    status: 'inactive',
  },
  {
    id: 'design-system-builder',
    name: 'Design System Builder',
    description: 'Generates Tailwind design tokens and component patterns from design requirements. Inspired by nextlevelbuilder/ui-ux-pro-max-skill.',
    permissions: ['read_workspace', 'write_workspace'],
    executionMode: 'ask',
    status: 'inactive',
  },
  {
    id: 'prompt-optimizer',
    name: 'Prompt Optimizer',
    description: 'Tests and refines system prompts using regression testing patterns. Inspired by ai-boost/awesome-prompts.',
    permissions: ['read_workspace', 'write_workspace'],
    executionMode: 'ask',
    status: 'inactive',
  },
  {
    id: 'token-compressor',
    name: 'Token Compressor',
    description: 'Reduces verbose agent output while preserving technical accuracy. Inspired by JuliusBrussee/caveman.',
    permissions: ['read_workspace'],
    executionMode: 'auto',
    status: 'inactive',
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    description: 'Scans workspace for credential leaks, unsafe patterns, and path traversal risks. Inspired by affaan-m/ECC.',
    permissions: ['read_workspace'],
    executionMode: 'auto',
    status: 'inactive',
  },
  {
    id: 'memory-optimizer',
    name: 'Memory Optimizer',
    description: 'Optimizes agent context window usage by summarizing non-critical information. Inspired by affaan-m/ECC.',
    permissions: ['read_workspace'],
    executionMode: 'auto',
    status: 'inactive',
  },
  {
    id: 'prompt-validator',
    name: 'Prompt Validator',
    description: 'Validates system prompts against best practices; suggests improvements. Inspired by brexhq/prompt-engineering and dair-ai/Prompt-Engineering-Guide.',
    permissions: ['read_workspace'],
    executionMode: 'auto',
    status: 'inactive',
  },
];

const BUILTIN_SKILLS: SkillDefinition[] = [
  {
    id: 'project-planner',
    name: 'Project Planner',
    description: 'Generates structural design plans, checklists, and dependency graphs before writing code.',
    permissions: ['read_workspace', 'write_workspace'],
    executionMode: 'auto',
    status: 'active',
  },
  {
    id: 'codebase-auditor',
    name: 'Codebase Auditor',
    description: 'Reviews file structure, scans for logical bugs, and searches for dead imports.',
    permissions: ['read_workspace'],
    executionMode: 'auto',
    status: 'active',
  },
  {
    id: 'ui-debugger',
    name: 'UI Debugger',
    description: 'Analyzes visual layouts, detects alignment bugs, and suggests styling adjustments.',
    permissions: ['read_workspace', 'write_workspace'],
    executionMode: 'ask',
    status: 'active',
  },
  {
    id: 'dependency-checker',
    name: 'Dependency Checker',
    description: 'Reviews package registry mappings, runs security vulnerability audits, and flags deprecated libs.',
    permissions: ['read_workspace', 'execute_commands'],
    executionMode: 'ask',
    status: 'active',
  },
  {
    id: 'build-fixer',
    name: 'Build Fixer',
    description: 'Reads TypeScript compiler errors and repairs modules automatically.',
    permissions: ['read_workspace', 'write_workspace', 'execute_commands'],
    executionMode: 'ask',
    status: 'active',
  },
  {
    id: 'test-writer',
    name: 'Test Writer',
    description: 'Scans files to output unit and integration test coverage files in test folders.',
    permissions: ['read_workspace', 'write_workspace'],
    executionMode: 'auto',
    status: 'active',
  },
  {
    id: 'readme-writer',
    name: 'README Writer',
    description: 'Synthesizes code files to write comprehensive documentation and setup guidelines.',
    permissions: ['read_workspace', 'write_workspace'],
    executionMode: 'auto',
    status: 'active',
  },
  {
    id: 'android-apk-helper',
    name: 'Android APK Helper',
    description: 'Diagnoses SDK environment variables and triggers Gradle build tasks securely.',
    permissions: ['read_workspace', 'execute_commands'],
    executionMode: 'ask',
    status: 'active',
  },
];

/**
 * In-memory skill registry.
 * MVP: uses static built-in skill definitions.
 * Future: may load from config or external packages.
 */
class SkillsRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  constructor() {
    this.initializeSkills();
  }

  private initializeSkills(): void {
    for (const skill of BUILTIN_SKILLS) {
      this.skills.set(skill.id, { ...skill });
    }
    for (const skill of RESEARCH_CANDIDATES) {
      this.skills.set(skill.id, { ...skill });
    }
    console.log(`[SkillsRegistry] Initialized with ${BUILTIN_SKILLS.length} built-in + ${RESEARCH_CANDIDATES.length} candidate skills.`);
  }

  /**
   * Returns all registered skills.
   */
  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Returns only active skills.
   */
  getActiveSkills(): SkillDefinition[] {
    return Array.from(this.skills.values()).filter(s => s.status === 'active');
  }

  /**
   * Finds a skill by ID.
   */
  getSkill(id: string): SkillDefinition | null {
    return this.skills.get(id) || null;
  }

  /**
   * Updates a skill's configuration at runtime.
   * Currently supports toggling status and execution mode.
   */
  updateSkill(id: string, updates: Partial<Pick<SkillDefinition, 'status' | 'executionMode'>>): SkillDefinition | null {
    const skill = this.skills.get(id);
    if (!skill) return null;

    if (updates.status !== undefined) {
      skill.status = updates.status;
    }
    if (updates.executionMode !== undefined) {
      skill.executionMode = updates.executionMode;
    }

    console.log(`[SkillsRegistry] Updated skill "${id}":`, updates);
    return skill;
  }

  /**
   * Resets all skills to their built-in defaults.
   */
  resetToDefaults(): void {
    this.skills.clear();
    this.initializeSkills();
  }
}

export const skillsRegistry = new SkillsRegistry();
