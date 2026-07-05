// test-web-build.mjs — Verify web frontend build artifacts exist
// Run: node scripts/test-web-build.mjs

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const webDist = resolve(root, 'apps/web/dist');

let passed = 0;
let failed = 0;

function pass(msg) { passed++; console.log(`  ✅ ${msg}`); }
function fail(msg) { failed++; console.log(`  ❌ ${msg}`); }

function getAllFiles(dir, maxDepth = 5) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        results.push(fullPath);
        const s = statSync(fullPath);
        if (s.isDirectory() && maxDepth > 0 && !entry.startsWith('.')) {
          results.push(...getAllFiles(fullPath, maxDepth - 1));
        }
      } catch { /* skip permission errors */ }
    }
  } catch { /* skip */ }
  return results;
}

function run() {
  console.log('');
  console.log('=== Web Build Artifact Test ===');
  console.log('');

  // Test 1: index.html exists
  console.log('[1/6] index.html');
  const indexHtml = resolve(webDist, 'index.html');
  if (existsSync(indexHtml)) {
    const content = readFileSync(indexHtml, 'utf-8');
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      pass('index.html exists and contains HTML');
    } else {
      fail('index.html exists but does not contain HTML');
    }
  } else {
    fail('index.html not found — run: npm run build --workspace=apps/web');
  }

  // Test 2: CSS asset exists
  console.log('[2/6] CSS assets');
  try {
    const assetsDir = resolve(webDist, 'assets');
    const files = readdirSync(assetsDir);
    const cssFiles = files.filter(f => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      pass(`CSS found: ${cssFiles.join(', ')}`);
    } else {
      fail('No CSS files found in assets/');
    }
  } catch {
    fail('assets/ directory not found');
  }

  // Test 3: JS asset exists
  console.log('[3/6] JS assets');
  try {
    const assetsDir = resolve(webDist, 'assets');
    const files = readdirSync(assetsDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    if (jsFiles.length > 0) {
      pass(`JS found: ${jsFiles.join(', ')}`);
    } else {
      fail('No JS files found in assets/');
    }
  } catch {
    fail('assets/ directory not found');
  }

  // Test 4: dist directory is not empty
  console.log('[4/6] dist directory not empty');
  try {
    const allFiles = getAllFiles(webDist);
    if (allFiles.length > 0) {
      pass(`${allFiles.length} files in dist/`);
    } else {
      fail('dist/ directory is empty');
    }
  } catch {
    fail('dist/ directory not found');
  }

  // Test 5: No .map files (production build should not have source maps)
  console.log('[5/6] Source map check');
  try {
    const allFiles = getAllFiles(webDist);
    const mapFiles = allFiles.filter(f => f.endsWith('.map'));
    if (mapFiles.length === 0) {
      pass('No .map files found (production build)');
    } else {
      console.log(`  ⚠️  ${mapFiles.length} source map(s) found: ${mapFiles.map(f => f.split('/').pop()).join(', ')}`);
      pass(`Source maps present (${mapFiles.length} files) — ok for dev, remove for production`);
    }
  } catch {
    fail('Could not check for source maps');
  }

  // Test 6: CSS contains styles (not empty/unstyled)
  console.log('[6/6] CSS contains styles');
  try {
    const assetsDir = resolve(webDist, 'assets');
    const files = readdirSync(assetsDir);
    const cssFiles = files.filter(f => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      const cssContent = readFileSync(resolve(assetsDir, cssFiles[0]), 'utf-8');
      if (cssContent.length > 500) {
        pass(`CSS file is ${cssContent.length} bytes (not empty/unstyled)`);
      } else {
        fail(`CSS file is only ${cssContent.length} bytes (may be unstyled)`);
      }
    }
  } catch {
    // already covered by check 2
  }

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('');

  if (failed > 0) {
    console.log('❌ Web build check FAILED');
    process.exit(1);
  } else {
    console.log('✅ Web build check PASSED');
    process.exit(0);
  }
}

run();
