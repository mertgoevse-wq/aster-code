import { AgentPlan, AgentPlanStep, AgentEvent, AgentStepStatus } from '@aster-code/shared';
import { Session } from './types.js';
import { sessionStore } from './sessionStore.js';
import { checkPermission, classifyRequiredPermission } from './policies.js';

/**
 * Safe Agent Execution Loop
 *
 * MVP: This loop executes ONLY placeholder/safe steps.
 * No real file writes or shell commands are issued.
 * Steps that require approvals are gated behind user confirmation.
 *
 * The loop respects the following safety invariants:
 * - All steps must have been approved via the plan.
 * - No step can run without an explicit approve action.
 * - `dangerous-disabled` level is ALWAYS blocked.
 * - File writes and commands are simulated (log only) in MVP.
 */

/**
 * Executes a single plan step that has been approved.
 * Returns an event describing the outcome.
 */
async function executeStep(
  step: AgentPlanStep,
  sessionId: string
): Promise<AgentEvent> {
  const now = new Date().toISOString();
  const eventId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`;

  console.log(`[AgentLoop] Executing step: ${step.id} — "${step.title}"`);

  // Check if this step is in the permanently blocked category
  if (step.permissionLevel === 'dangerous-disabled') {
    const event: AgentEvent = {
      id: eventId,
      sessionId,
      type: 'step-blocked',
      title: step.title,
      message: 'This action is permanently disabled for safety reasons.',
      stepId: step.id,
      status: 'blocked',
      affectedFile: step.affectedFiles[0],
      toolName: step.toolName,
      timestamp: now
    };
    step.status = 'blocked';
    sessionStore.addEvent(sessionId, event);
    return event;
  }

  // Mark step as running
  step.status = 'running';
  step.startedAt = now;

  const startEvent: AgentEvent = {
    id: eventId,
    sessionId,
    type: 'step-start',
    title: step.title,
    message: `Starting: ${step.description}`,
    stepId: step.id,
    status: 'running',
    affectedFile: step.affectedFiles[0],
    toolName: step.toolName,
    timestamp: now
  };
  sessionStore.addEvent(sessionId, startEvent);

  // Simulate execution (MVP: no real mutations)
  await simulateWork(step);

  // Mark step as done
  step.status = 'done';
  step.completedAt = new Date().toISOString();

  const completeEvent: AgentEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
    sessionId,
    type: 'step-complete',
    title: step.title,
    message: `✓ Completed: ${step.description}${step.toolName === 'write_file' ? ' [SIMULATED — no real files modified in MVP]' : ''}${step.toolName === 'run_command' ? ' [SIMULATED — no real commands executed in MVP]' : ''}`,
    stepId: step.id,
    status: 'done',
    affectedFile: step.affectedFiles[0],
    toolName: step.toolName,
    timestamp: new Date().toISOString()
  };
  sessionStore.addEvent(sessionId, completeEvent);

  return completeEvent;
}

/**
 * Simulates work with a small delay to make the activity feed feel alive.
 */
async function simulateWork(step: AgentPlanStep): Promise<void> {
  const delayMs = 800 + Math.random() * 600;
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Executes an approved plan: runs all non-blocked steps sequentially.
 * This is the main entry point for plan execution.
 */
export async function executeApprovedPlan(
  sessionId: string,
  plan: AgentPlan
): Promise<AgentEvent[]> {
  const results: AgentEvent[] = [];

  console.log(`[AgentLoop] Executing plan ${plan.id} with ${plan.steps.length} steps`);

  for (const step of plan.steps) {
    // Skip steps that were already done
    if (step.status === 'done' || step.status === 'blocked') {
      continue;
    }

    // Check permission policy
    const actionType = mapToolToActionType(step.toolName || 'read_file');
    const requiredLevel = classifyRequiredPermission({
      type: actionType
    });

    const policyCheck = checkPermission(step.permissionLevel, requiredLevel);

    if (!policyCheck.allowed) {
      // Block step
      step.status = 'blocked';
      const blockEvent: AgentEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
        sessionId,
        type: 'step-blocked',
        title: step.title,
        message: policyCheck.reason,
        stepId: step.id,
        status: 'blocked',
        timestamp: new Date().toISOString()
      };
      sessionStore.addEvent(sessionId, blockEvent);
      results.push(blockEvent);
      continue;
    }

    // Execute the step
    const event = await executeStep(step, sessionId);
    results.push(event);
  }

  // Mark plan as completed
  plan.status = 'completed';
  plan.updatedAt = new Date().toISOString();
  sessionStore.updateSession(sessionId, { status: 'completed' });

  const finalEvent: AgentEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
    sessionId,
    type: 'execution-complete',
    title: 'Plan execution complete',
    message: `All ${results.filter(e => e.status === 'done').length} steps completed successfully.`,
    status: 'done',
    timestamp: new Date().toISOString()
  };
  sessionStore.addEvent(sessionId, finalEvent);
  results.push(finalEvent);

  console.log(`[AgentLoop] Plan ${plan.id} execution complete.`);
  return results;
}

/**
 * Maps tool names to action types for permission checking.
 */
function mapToolToActionType(toolName: string): 'read_file' | 'write_file' | 'delete_file' | 'run_command' | 'dangerous_action' {
  switch (toolName) {
    case 'read_file':
    case 'list_files':
    case 'explain':
    case 'plan':
    case 'plan_edits':
    case 'write_plan_doc':
      return 'read_file';
    case 'write_file':
      return 'write_file';
    case 'delete_file':
      return 'delete_file';
    case 'run_command':
      return 'run_command';
    default:
      return 'read_file';
  }
}
