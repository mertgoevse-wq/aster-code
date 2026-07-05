import { AgentIntentType, IntentMatch } from '@aster-code/shared';

/**
 * Intent Classifier — rule-based prompt analysis.
 * Maps natural language prompts to one or more agent intents.
 * Supports English and German prompts. No LLM required.
 *
 * Returns detected language alongside intent matches.
 */

interface ClassificationOutput {
  intents: IntentMatch[];
  detectedLanguage: 'en' | 'de' | 'mixed' | 'unknown';
}

// German-specific keywords
const DE_KEYWORDS: Record<AgentIntentType, string[]> = {
  'explain-code': ['erkläre', 'erklär', 'erklären', 'was ist', 'wie funktioniert', 'beschreibe', 'beschreib', 'zeig mir', 'was macht', 'übersicht', 'zusammenfassung', 'bedeutung von'],
  'build-feature': ['baue', 'bau', 'erstellen', 'erstelle', 'implementiere', 'implementier', 'neue funktion', 'neues feature', 'füge hinzu', 'hinzufügen', 'generiere', 'scaffolding', 'einrichten'],
  'fix-bug': ['fehler', 'kaputt', 'geht nicht', 'funktioniert nicht', 'absturz', 'abstürzt', 'bug', 'falsche ausgabe', 'unerwartet', 'reparieren', 'reparier', 'beheben', 'beheb'],
  'debug-build': ['kompilierfehler', 'build-fehler', 'type error', 'typescript fehler', 'lässt sich nicht kompilieren', 'tsc fehler', 'compiler', 'kompilierung'],
  'improve-ui': ['design', 'aussehen', 'styling', 'css', 'layout', 'farbe', 'farben', 'abstand', 'responsive', 'schrift', 'animation', 'oberfläche', 'benutzeroberfläche', 'ui verbessern', 'verschönern', 'schöner'],
  'dependency-task': ['installiere', 'installier', 'paket', 'abhängigkeit', 'npm', 'package', 'bibliothek', 'modul nicht gefunden', 'import fehler', 'aktualisiere', 'upgrade'],
  'write-tests': ['test', 'teste', 'testen', 'unit test', 'integrationstest', 'abdeckung', 'assert', 'überprüfung', 'prüfung', 'testabdeckung'],
  'create-docs': ['dokumentation', 'dokumentiere', 'doku', 'readme', 'dokumentieren', 'beschreibung', 'kommentar', 'kommentiere', 'changelog', 'anleitung'],
  'refactor': ['refactoring', 'umstrukturieren', 'aufräumen', 'bereinigen', 'extrahieren', 'vereinfachen', 'umbenennen', 'verschieben', 'restrukturieren', 'sauberer code'],
  'setup-runtime': ['server starten', 'konfiguration', 'umgebungsvariable', '.env', 'port', 'einrichten', 'setup', 'dev server', 'server einrichten', 'runtime'],
  'model-provider-task': ['modell', 'provider', 'anbieter', 'api key', 'ollama', 'openai', 'claude', 'gpt', 'llm', 'context fenster', 'token'],
  'mcp-tool-task': ['mcp', 'tool server', 'integration', 'plugin', 'erweiterung', 'verbinde', 'anbindung', 'werkzeug'],
  'git-task': ['git', 'commit', 'branch', 'zweig', 'merge', 'zusammenführen', 'pull request', 'push', 'clone', 'klonen', 'rebase'],
  'unknown': [],
};

// English-specific keywords (more comprehensive than original)
const EN_KEYWORDS: Record<AgentIntentType, string[]> = {
  'explain-code': [
    'explain', 'what is', 'how does', 'tell me about', 'describe', 'what are',
    'meaning of', 'overview', 'summary', 'show me', 'understand',
    'walk through', 'walkthrough', 'clarify', 'break down', 'inspect',
    'audit repo', 'inspect repo', 'review code', 'code review',
    'survey', 'analyze codebase', 'what does', 'how to use',
  ],
  'build-feature': [
    'create', 'build', 'add', 'implement', 'new feature', 'make a',
    'scaffold', 'generate', 'set up a', 'bootstrap', 'introduce',
    'add support for', 'enable', 'wire up', 'integrate',
    'build app', 'package release', 'add skill', 'create skill',
  ],
  'fix-bug': [
    'bug', 'not working', 'broken', 'fails', 'crash', 'unexpected',
    'wrong output', 'incorrect', 'doesn\'t work', 'issue', 'malfunction',
    'glitch', 'defect', 'regression', 'is not', 'should be but',
    'fix error', 'resolve', 'patch', 'hotfix', 'debug error', 'debug',
    'troubleshoot', 'diagnose',
  ],
  'debug-build': [
    'typecheck', 'type error', 'compiler', 'build error', 'ts error',
    'tsc', 'compilation', 'type mismatch', 'does not compile',
    'won\'t build', 'cannot build', 'build fails', 'compiler error',
    'transpile', 'lint error', 'linting',
  ],
  'improve-ui': [
    'style', 'css', 'layout', 'tailwind', 'color', 'padding', 'margin',
    'responsive', 'alignment', 'design', 'ui', 'ux', 'font', 'spacing',
    'border', 'shadow', 'animation', 'appearance', 'look and feel',
    'visual', 'theme', 'styling', 'restyle', 'redesign',
    'fix ui', 'fix the ui', 'make it look', 'beautify', 'polish',
    'improve workbench', 'workbench ui', 'dark mode', 'light mode',
  ],
  'dependency-task': [
    'install', 'package', 'dependency', 'npm', 'import error',
    'module not found', 'update package', 'upgrade', 'audit',
    'yarn', 'pnpm', 'bun', 'node module', 'require', 'uninstall',
    'version bump', 'semver', 'lock file', 'resolve dependency',
  ],
  'write-tests': [
    'test', 'testing', 'unit test', 'integration test', 'spec',
    'coverage', 'vitest', 'jest', 'assert', 'mock', 'e2e',
    'end-to-end', 'test case', 'test suite', 'test coverage',
    'write tests', 'add tests', 'test installer', 'smoke test',
    'regression test', 'validate',
  ],
  'create-docs': [
    'readme', 'document', 'doc', 'write about', 'comment', 'documentation',
    'jsdoc', 'changelog', 'guide', 'tutorial', 'explain in writing',
    'write up', 'document how', 'architecture doc', 'api doc',
    'write docs', 'docs for', 'markdown',
  ],
  'refactor': [
    'refactor', 'restructure', 'clean up', 'reorganize', 'extract',
    'simplify', 'rename', 'move to', 'split', 'deduplicate',
    'dry principle', 'abstract', 'modularize', 'rework', 'overhaul',
    'optimize structure',
  ],
  'setup-runtime': [
    'setup', 'config', 'env', 'server', 'port', 'start',
    'runtime', 'dev server', 'environment variable', '.env',
    'configure', 'bootstrap', 'initialize', 'spin up',
    'launch', 'deploy', 'provision', 'docker', 'container',
    'auth setup', 'authentication setup', 'oauth setup',
  ],
  'model-provider-task': [
    'model', 'provider', 'ollama', 'openai', 'anthropic', 'claude',
    'gpt', 'llm', 'token', 'context window', 'api key setup',
    'lm studio', 'openrouter', 'nvidia', 'nvidia nim', 'nim',
    'add provider', 'configure model', 'model settings', 'provider config',
    'local model', 'cloud model', 'model registry',
  ],
  'mcp-tool-task': [
    'mcp', 'tool server', 'connect app', 'integration', 'plugin',
    'extension', 'mcp setup', 'mcp gateway', 'tool discovery',
    'mcp server', 'stdio server', 'mcp config',
  ],
  'git-task': [
    'git', 'commit', 'branch', 'merge', 'pull request', 'rebase',
    'stash', 'push', 'clone', 'remote', 'tag', 'release',
    'cherry-pick', 'version control', 'diff', 'patch',
  ],
  'unknown': [],
};

/**
 * Detects the language of a prompt.
 * Returns 'de' if mostly German, 'en' if mostly English, 'mixed' if both, 'unknown' if unclear.
 */
function detectLanguage(text: string): 'en' | 'de' | 'mixed' | 'unknown' {
  const germanMarkers = [
    'der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'nicht', 'mit',
    'auf', 'für', 'von', 'zu', 'den', 'dem', 'des', 'sich', 'aber',
    'wie', 'was', 'wo', 'wann', 'kann', 'muss', 'soll', 'wird',
  ];

  const englishMarkers = [
    'the', 'and', 'is', 'are', 'not', 'with', 'for', 'from', 'to',
    'can', 'must', 'should', 'will', 'have', 'has', 'was', 'were',
    'that', 'this', 'but', 'what', 'when', 'where', 'how', 'why',
  ];

  const lower = text.toLowerCase();
  let germanScore = 0;
  let englishScore = 0;

  for (const word of germanMarkers) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) germanScore++;
  }
  for (const word of englishMarkers) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) englishScore++;
  }

  if (germanScore === 0 && englishScore === 0) return 'unknown';
  if (germanScore > englishScore * 2) return 'de';
  if (englishScore > germanScore * 2) return 'en';
  if (germanScore > 0 && englishScore > 0) return 'mixed';
  if (englishScore > 0) return 'en';
  return 'de';
}

/**
 * Match intents using both English and German keywords.
 * Scores intents by keyword density for better confidence.
 */
function matchIntent(
  text: string,
  intentType: AgentIntentType,
  enKeywords: string[],
  deKeywords: string[],
  detectedLanguage: string
): IntentMatch | null {
  const lower = text.toLowerCase();
  let matchCount = 0;
  const matchedWords: string[] = [];

  for (const kw of enKeywords) {
    if (lower.includes(kw)) {
      matchCount++;
      matchedWords.push(kw);
    }
  }
  for (const kw of deKeywords) {
    if (lower.includes(kw)) {
      matchCount++;
      matchedWords.push(kw);
    }
  }

  if (matchCount === 0) return null;

  // Confidence scales with match count (caps at 0.95)
  const baseConfidence = Math.min(0.65 + matchCount * 0.07, 0.95);
  // Small boost if language matches keyword source
  const langBoost = detectedLanguage === 'de' && deKeywords.some(kw => lower.includes(kw)) ? 0.03 : 0;
  const confidence = Math.min(baseConfidence + langBoost, 0.95);

  const langLabel = detectedLanguage === 'de' ? '[DE]' : detectedLanguage === 'mixed' ? '[DE+EN]' : '';
  const reason = langLabel
    ? `Detected via ${matchCount} keyword match(es): ${matchedWords.slice(0, 4).join(', ')}. ${langLabel}`
    : `Detected via ${matchCount} keyword match(es): ${matchedWords.slice(0, 4).join(', ')}.`;

  return { intent: intentType, confidence, reason, candidates: [] };
}

/**
 * Classifies user prompt into one or more agent intents.
 * Supports English, German, and mixed-language prompts.
 */
export function classifyIntents(prompt: string): IntentMatch[] {
  const detectedLanguage = detectLanguage(prompt);

  const intentTypes: AgentIntentType[] = [
    'explain-code', 'build-feature', 'fix-bug', 'debug-build',
    'improve-ui', 'dependency-task', 'write-tests', 'create-docs',
    'refactor', 'setup-runtime', 'model-provider-task', 'mcp-tool-task',
    'git-task',
  ];

  const intents: IntentMatch[] = [];

  for (const intentType of intentTypes) {
    const match = matchIntent(
      prompt,
      intentType,
      EN_KEYWORDS[intentType],
      DE_KEYWORDS[intentType],
      detectedLanguage
    );
    if (match) {
      intents.push(match);
    }
  }

  // If no intents matched, add the unknown fallback
  if (intents.length === 0) {
    const langLabel = detectedLanguage === 'de' ? ' (German prompt detected)' : '';
    intents.push({
      intent: 'unknown',
      confidence: 0.5,
      reason: `Could not classify the intent — treating as a general request.${langLabel}`,
      candidates: [],
    });
  }

  return intents.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Re-export language detection for use by the agent router.
 */
export { detectLanguage };
