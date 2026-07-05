// test-smoke-all.mjs — Master smoke test orchestrator
// Runs all test suites: runtime health, web build, desktop package, repo hygiene
// Run: node scripts/test-smoke-all.mjs

import { spawnSync } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

let suitesPassed = 0;
let suitesFailed = 0;
const suiteResults = [];

function runSuite(name, scriptPath) {
  console.log('');
  console.log(`━━━ ${name} ━━━`);
  const result = spawnSync('node', [resolve(__dirname, scriptPath)], {
    cwd: root,
    stdio: 'inherit',
    timeout: 30000,
  });

  const passed = result.status === 0;
  suiteResults.push({ name, passed, exitCode: result.status, error: result.error });

  if (result.error) {
    console.log(`  ❌ ${name}: process error — ${result.error.message}`);
    suitesFailed++;
  } else if (passed) {
    suitesPassed++;
  } else {
    suitesFailed++;
  }
}

function runRepoHygiene() {
  console.log('');
  console.log('━━━ Repo Hygiene ━━━');
  console.log('');
  let passed = 0;
  let failed = 0;

  function pass(msg) { passed++; console.log(`  ✅ ${msg}`); }
  function fail(msg) { failed++; console.log(`  ❌ ${msg}`); }

  // Check: no .env committed
  console.log('[Repo 1/5] No .env files in repo');
  try {
    const envFiles = findFiles(root, '.env', 3);
    const actualEnvFiles = envFiles.filter(f => !f.includes('node_modules') && !f.includes('dist-electron'));
    if (actualEnvFiles.length === 0) {
      pass('No .env files in source tree');
    } else {
      fail(`Found .env file(s): ${actualEnvFiles.join(', ')}`);
    }
  } catch (e) {
    fail(`Could not scan: ${e.message}`);
  }

  // Check: node_modules not committed (check .gitignore covers it)
  console.log('[Repo 2/5] .gitignore covers node_modules');
  try {
    const gitignore = readFileSync(resolve(root, '.gitignore'), 'utf-8');
    if (gitignore.includes('node_modules')) {
      pass('.gitignore includes node_modules/');
    } else {
      fail('.gitignore does not mention node_modules/');
    }
  } catch (e) {
    fail(`.gitignore not found: ${e.message}`);
  }

  // Check: _research/import-candidates not committed
  console.log('[Repo 3/5] .gitignore covers _research/import-candidates');
  try {
    const gitignore = readFileSync(resolve(root, '.gitignore'), 'utf-8');
    if (gitignore.includes('_research/import-candidates')) {
      pass('.gitignore includes _research/import-candidates/');
    } else {
      fail('.gitignore does not mention _research/import-candidates/');
    }
  } catch (e) {
    fail(`.gitignore not found: ${e.message}`);
  }

  // Check: AGENTS.md exists
  console.log('[Repo 4/5] AGENTS.md exists');
  if (existsSync(resolve(root, 'AGENTS.md'))) {
    pass('AGENTS.md exists');
  } else {
    fail('AGENTS.md not found');
  }

  // Check: package.json valid JSON
  console.log('[Repo 5/5] package.json is valid JSON');
  try {
    JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
    pass('package.json is valid JSON');
  } catch (e) {
    fail(`package.json is invalid: ${e.message}`);
  }

  const repoPassed = failed === 0;
  suiteResults.push({ name: 'Repo Hygiene', passed: repoPassed, exitCode: failed > 0 ? 1 : 0 });

  if (repoPassed) suitesPassed++;
  else suitesFailed++;

  console.log('');
  console.log(`  Repo hygiene: ${passed} passed, ${failed} failed`);
}

function findFiles(dir, pattern, maxDepth) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = resolve(dir, entry);
      try {
        if (entry === pattern) {
          results.push(fullPath);
        }
        if (maxDepth > 0) {
          const stats = statSync(fullPath);
          if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
            results.push(...findFiles(fullPath, pattern, maxDepth - 1));
          }
        }
      } catch { /* skip permission errors */ }
    }
  } catch { /* skip */ }
  return results;
}

// ─── Run all suites ─────────────────────────────────────────────────────────

console.log('');
console.log('╔═══════════════════════════════════╗');
console.log('║  Aster Code — Smoke Test Suite   ║');
console.log('╚═══════════════════════════════════╝');

// Suite A: Runtime health (skipped if not running)
runSuite('Runtime Health', 'test-runtime-health.mjs');

// Suite B: Web build artifacts
runSuite('Web Build', 'test-web-build.mjs');

// Suite C: Desktop package
runSuite('Desktop Package', 'test-desktop-package.mjs');

// Suite D: Repo hygiene
runRepoHygiene();

// ─── Summary ────────────────────────────────────────────────────────────────

console.log('');
console.log('═══════════════════════════════════════');
console.log('           SMOKE TEST SUMMARY          ');
console.log('═══════════════════════════════════════');
console.log('');

for (const r of suiteResults) {
  const icon = r.passed ? '✅' : '❌';
  console.log(`  ${icon} ${r.name}`);
}

console.log('');
console.log(`Total: ${suitesPassed} passed, ${suitesFailed} failed, ${suiteResults.length} suites`);
console.log('');

if (suitesFailed > 0) {
  console.log('❌ Smoke tests FAILED');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ All smoke tests PASSED');
  console.log('');
  process.exit(0);
}
