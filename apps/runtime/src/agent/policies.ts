import { PermissionLevel, SkillDefinition } from '@aster-code/shared';

/**
 * Permission level definitions and progression rules.
 * The agent loop must respect these boundaries at all times.
 *
 * Hierarchy (least → most permissive):
 *   read-only → suggest-edits → apply-edits-after-approval → run-safe-commands-after-approval → dangerous-disabled
 *
 * `dangerous-disabled` is ALWAYS blocked regardless of approval.
 */

export interface PolicyCheck {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  requiredLevel: PermissionLevel;
}

const PERMISSION_HIERARCHY: PermissionLevel[] = [
  'read-only',
  'suggest-edits',
  'apply-edits-after-approval',
  'run-safe-commands-after-approval',
  'dangerous-disabled'
];

/**
 * Determines the minimum permission level required for a given action.
 */
export function classifyRequiredPermission(action: {
  type: 'read_file' | 'write_file' | 'delete_file' | 'run_command' | 'dangerous_action';
}): PermissionLevel {
  switch (action.type) {
    case 'read_file':
      return 'read-only';
    case 'write_file':
      return 'apply-edits-after-approval';
    case 'delete_file':
      return 'apply-edits-after-approval';
    case 'run_command':
      return 'run-safe-commands-after-approval';
    case 'dangerous_action':
      return 'dangerous-disabled';
    default:
      return 'read-only';
  }
}

/**
 * Checks whether a given permission level allows a specific action.
 */
export function checkPermission(
  currentLevel: PermissionLevel,
  requiredLevel: PermissionLevel
): PolicyCheck {
  // dangerous-disabled is always blocked
  if (requiredLevel === 'dangerous-disabled') {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'This action is permanently disabled for safety.',
      requiredLevel: 'dangerous-disabled'
    };
  }

  const currentIdx = PERMISSION_HIERARCHY.indexOf(currentLevel);
  const requiredIdx = PERMISSION_HIERARCHY.indexOf(requiredLevel);

  if (currentIdx < requiredIdx) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Insufficient permissions. Required: ${requiredLevel}, Current: ${currentLevel}`,
      requiredLevel
    };
  }

  // Actions above read-only always require user approval
  const requiresApproval = requiredIdx > 0;

  return {
    allowed: true,
    requiresApproval,
    reason: requiresApproval
      ? `This action requires user approval (level: ${requiredLevel}).`
      : `Permitted with ${currentLevel} access.`,
    requiredLevel
  };
}

/**
 * Maps a skill definition to its effective permission level.
 */
export function getSkillPermissionLevel(skill: SkillDefinition): PermissionLevel {
  const perms = skill.permissions;
  if (perms.includes('execute_commands')) {
    return 'run-safe-commands-after-approval';
  }
  if (perms.includes('write_workspace')) {
    return 'apply-edits-after-approval';
  }
  if (perms.includes('read_workspace')) {
    return skill.executionMode === 'auto' ? 'suggest-edits' : 'read-only';
  }
  return 'read-only';
}

/**
 * Returns a safety disclaimer for showing to users.
 */
export function getSafetyDisclaimer(): string {
  return `⚠️ Aster Code runs in approval-gated mode. No autonomous file edits or shell commands are permitted. You must explicitly approve each plan step before execution.`;
}
