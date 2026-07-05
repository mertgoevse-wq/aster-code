import { AgentIntentType, IntentMatch } from '@aster-code/shared';

/**
 * Intent Classifier — rule-based prompt analysis.
 * Maps natural language prompts to one or more agent intents.
 * No LLM required — uses keyword matching with confidence scoring.
 */
export function classifyIntents(prompt: string): IntentMatch[] {
  const lower = prompt.toLowerCase();
  const intents: IntentMatch[] = [];

  // explain-code: asking "what", "how", "explain", "describe"
  if (matchAny(lower, ['explain', 'what is', 'how does', 'tell me about', 'describe', 'what are', 'meaning of'])) {
    intents.push({ intent: 'explain-code', confidence: 0.9, reason: 'User is asking for an explanation of code or concepts.', candidates: [] });
  }

  // build-feature: creating new functionality
  if (matchAny(lower, ['create', 'build', 'add', 'implement', 'new feature', 'make a', 'scaffold', 'generate a'])) {
    intents.push({ intent: 'build-feature', confidence: 0.85, reason: 'User wants to build or create new functionality.', candidates: [] });
  }

  // fix-bug: fixing errors, bugs
  if (matchAny(lower, ['bug', 'not working', 'broken', 'fails', 'crash', 'unexpected', 'wrong output', 'incorrect'])) {
    intents.push({ intent: 'fix-bug', confidence: 0.85, reason: 'User is reporting a bug or unexpected behavior.', candidates: [] });
  }

  // debug-build: build/type errors
  if (matchAny(lower, ['typecheck', 'type error', 'compiler', 'build error', 'ts error', 'tsc', 'compilation', 'type mismatch', 'does not compile'])) {
    intents.push({ intent: 'debug-build', confidence: 0.9, reason: 'User is dealing with build or type errors.', candidates: [] });
  }

  // improve-ui: styling, layout, design
  if (matchAny(lower, ['style', 'css', 'layout', 'tailwind', 'color', 'padding', 'margin', 'responsive', 'alignment', 'design', 'ui', 'ux', 'font', 'spacing', 'border', 'shadow'])) {
    intents.push({ intent: 'improve-ui', confidence: 0.82, reason: 'User is requesting UI/styling changes.', candidates: [] });
  }

  // dependency-task: npm, packages, install
  if (matchAny(lower, ['install', 'package', 'dependency', 'npm', 'import error', 'module not found', 'update package', 'upgrade', 'audit'])) {
    intents.push({ intent: 'dependency-task', confidence: 0.88, reason: 'User is dealing with dependency management.', candidates: [] });
  }

  // write-tests: testing
  if (matchAny(lower, ['test', 'testing', 'unit test', 'integration test', 'spec', 'coverage', 'vitest', 'jest', 'assert', 'mock'])) {
    intents.push({ intent: 'write-tests', confidence: 0.87, reason: 'User wants to write or modify tests.', candidates: [] });
  }

  // create-docs: documentation
  if (matchAny(lower, ['readme', 'document', 'doc', 'write about', 'comment', 'documentation', 'jsdoc', 'changelog'])) {
    intents.push({ intent: 'create-docs', confidence: 0.87, reason: 'User is requesting documentation work.', candidates: [] });
  }

  // refactor: restructuring without behavior change
  if (matchAny(lower, ['refactor', 'restructure', 'clean up', 'reorganize', 'extract', 'simplify', 'rename', 'move to'])) {
    intents.push({ intent: 'refactor', confidence: 0.83, reason: 'User wants to refactor or restructure existing code.', candidates: [] });
  }

  // setup-runtime: dev server, config, env
  if (matchAny(lower, ['setup', 'config', 'env', 'server', 'port', 'start', 'runtime', 'dev server', 'environment variable', '.env'])) {
    intents.push({ intent: 'setup-runtime', confidence: 0.8, reason: 'User is dealing with runtime/server setup.', candidates: [] });
  }

  // model-provider-task: LLM providers, models
  if (matchAny(lower, ['model', 'provider', 'ollama', 'openai', 'anthropic', 'claude', 'gpt', 'llm', 'token', 'context window', 'api key setup'])) {
    intents.push({ intent: 'model-provider-task', confidence: 0.82, reason: 'User is working with model provider configuration.', candidates: [] });
  }

  // mcp-tool-task: MCP, tool servers
  if (matchAny(lower, ['mcp', 'tool server', 'connect app', 'integration', 'plugin', 'extension'])) {
    intents.push({ intent: 'mcp-tool-task', confidence: 0.78, reason: 'User wants to work with MCP tools or integrations.', candidates: [] });
  }

  // git-task: version control
  if (matchAny(lower, ['git', 'commit', 'branch', 'merge', 'pull request', 'rebase', 'stash', 'push', 'clone'])) {
    intents.push({ intent: 'git-task', confidence: 0.85, reason: 'User is performing git/version-control operations.', candidates: [] });
  }

  // Fallback: unknown
  if (intents.length === 0) {
    intents.push({ intent: 'unknown', confidence: 0.5, reason: 'Could not classify the intent — treating as a general request.', candidates: [] });
  }

  return intents.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Simple keyword matcher — returns true if any keyword is present in the text.
 */
function matchAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}
