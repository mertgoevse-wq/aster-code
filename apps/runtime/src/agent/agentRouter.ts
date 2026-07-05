import { RoutingResult, IntentMatch, SkillCandidate } from '@aster-code/shared';
import { classifyIntents } from './intentClassifier.js';
import { routeIntentsToSkills, computeOverallRisk, requiresApproval } from './skillRouter.js';
import { skillsRegistry } from '../skills/registry.js';

/**
 * Agent Router — orchestrates the full routing pipeline:
 *   User prompt → Intent Classifier → Skill Router → Routing Result
 *
 * The result is displayed to the user for approval before any execution.
 */
export function routeAgentTasks(prompt: string): RoutingResult {
  // Step 1: Classify intents
  const intents = classifyIntents(prompt);

  // Step 2: Get available active skills
  const availableSkills = skillsRegistry.getActiveSkills();

  // Step 3: Route intents to candidate skills
  const routedIntents = routeIntentsToSkills(intents, availableSkills);

  // Step 4: Collect all unique selected skill candidates
  const skillMap = new Map<string, SkillCandidate>();
  for (const intentMatch of routedIntents) {
    for (const candidate of intentMatch.candidates) {
      if (!skillMap.has(candidate.skillId)) {
        skillMap.set(candidate.skillId, candidate);
      }
    }
  }
  const selectedSkills = Array.from(skillMap.values());

  // Step 5: Determine approval requirement
  const needsApproval = requiresApproval(selectedSkills);
  const overallRisk = computeOverallRisk(selectedSkills);

  // Step 6: Build summary
  const intentNames = routedIntents.filter(i => i.candidates.length > 0).map(i => i.intent);
  const skillNames = selectedSkills.map(s => s.skillName);

  const summary = selectedSkills.length === 0
    ? `No matching skills found for: ${intentNames.join(', ')}. Try a more specific request.`
    : `Detected ${intentNames.length} intent(s): ${intentNames.join(', ')}. Selected ${selectedSkills.length} skill(s): ${skillNames.join(', ')}. Risk: ${overallRisk}. ${needsApproval ? 'Approval required.' : 'Ready to execute.'}`;

  return {
    intents: routedIntents,
    selectedSkills,
    requiresApproval: needsApproval,
    summary,
  };
}
