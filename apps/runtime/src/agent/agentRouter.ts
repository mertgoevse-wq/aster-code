import { RoutingResult, IntentMatch, SkillCandidate } from '@aster-code/shared';
import { classifyIntents, detectLanguage } from './intentClassifier.js';
import {
  routeIntentsToSkills,
  computeOverallRisk,
  requiresApproval,
  buildRiskExplanation,
} from './skillRouter.js';
import { skillsRegistry } from '../skills/registry.js';

/**
 * Agent Router — orchestrates the full routing pipeline:
 *   User prompt → Language detection → Intent Classifier → Skill Router → Routing Result
 *
 * The result is displayed to the user for approval before any execution.
 */
export function routeAgentTasks(prompt: string): RoutingResult {
  // Step 0: Detect language
  const detectedLanguage = detectLanguage(prompt);

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
  const riskExplanation = buildRiskExplanation(selectedSkills);

  // Step 6: Build enhanced summary
  const intentNames = routedIntents.filter(i => i.candidates.length > 0).map(i => i.intent);
  const skillNames = selectedSkills.map(s => s.skillName);

  const langLabel = detectedLanguage === 'de'
    ? '🇩🇪 German prompt detected.'
    : detectedLanguage === 'mixed'
    ? '🌐 Mixed-language prompt detected.'
    : detectedLanguage === 'en'
    ? '🇬🇧 English prompt detected.'
    : '';

  let summary: string;
  if (selectedSkills.length === 0) {
    summary = `${langLabel} No matching skills found for: ${intentNames.join(', ')}. Try rephrasing your request with more specific keywords.`;
  } else {
    const riskEmoji = overallRisk === 'high' ? '🔴' : overallRisk === 'medium' ? '🟡' : '🟢';
    summary = [
      `${langLabel}`,
      `Detected ${intentNames.length} intent(s): ${intentNames.map(i => i.replace(/-/g, ' ')).join(', ')}.`,
      `Selected ${selectedSkills.length} skill(s): ${skillNames.join(', ')}.`,
      `Risk: ${riskEmoji} ${overallRisk.toUpperCase()}.`,
      needsApproval
        ? '⚠️ Approval required before any file edits or commands run.'
        : '✅ Ready to execute (read-only or advisory).',
    ].join(' ');
  }

  return {
    intents: routedIntents,
    selectedSkills,
    requiresApproval: needsApproval,
    summary,
    detectedLanguage,
  };
}
