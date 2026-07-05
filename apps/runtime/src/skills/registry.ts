import { SkillDefinition } from '@aster-code/shared';

/**
 * Built-in skill definitions for the MVP.
 * These are the authoritative skill definitions used by the runtime.
 */
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
    console.log(`[SkillsRegistry] Initialized with ${this.skills.size} built-in skills.`);
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
