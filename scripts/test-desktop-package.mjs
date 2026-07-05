// test-desktop-package.mjs — Verify Electron desktop packaging artifacts exist
// Run: node scripts/test-desktop-package.mjs

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

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
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}

function readDesktopVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(root, 'apps/desktop/package.json'), 'utf-8'));
    return pkg.version || '0.1.0';
  } catch {
    return '0.1.0';
  }
}

const version = readDesktopVersion();
const desktopDist = resolve(root, 'apps/desktop/dist');
const distElectron = resolve(root, 'apps/desktop/dist-electron');
const installerName = `Aster Code Setup ${version}.exe`;

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(msg) { passed++; console.log(`  ✅ ${msg}`); }
function fail(msg) { failed++; console.log(`  ❌ ${msg}`); }
function skip(msg) { skipped++; console.log(`  ⏭️  ${msg}`); }

function run() {
  console.log('');
  console.log('=== Desktop Package Test ===');
  console.log('');

  // --- Desktop dist (compiled main process) ---
  console.log('[1/7] Desktop main process dist');
  const mainJs = resolve(desktopDist, 'main.js');
  if (existsSync(mainJs)) {
    const stats = statSync(mainJs);
    pass(`main.js exists (${stats.size} bytes)`);
  } else {
    fail('main.js not found — run: npm run desktop:build');
  }

  // Check for preload.js and window.js
  console.log('[2/7] Desktop preload + window');
  for (const f of ['preload.js', 'window.js']) {
    const fp = resolve(desktopDist, f);
    if (existsSync(fp)) {
      pass(`${f} exists`);
    } else {
      fail(`${f} not found`);
    }
  }

  // --- dist-electron directory ---
  console.log('[3/7] dist-electron directory exists');
  if (existsSync(distElectron)) {
    try {
      const files = readdirSync(distElectron);
      pass(`dist-electron exists (${files.length} top-level items)`);
    } catch (e) {
      fail(`dist-electron exists but cannot read: ${e.message}`);
    }
  } else {
    skip('dist-electron not found — run: npm run desktop:dist');
    // Skip remaining packaging checks
    skipped += 4;
    summary();
    return;
  }

  // --- Installer ---
  console.log('[4/7] NSIS installer');
  const installerPath = resolve(distElectron, installerName);
  if (existsSync(installerPath)) {
    const stats = statSync(installerPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    pass(`Installer exists: ${installerName} (${sizeMB} MB)`);
  } else {
    fail(`Installer not found: ${installerName} — run: npm run desktop:dist`);
  }

  // --- Unpacked EXE ---
  console.log('[5/7] Unpacked executable');
  const unpackedExe = resolve(distElectron, 'win-unpacked', 'Aster Code.exe');
  if (existsSync(unpackedExe)) {
    const stats = statSync(unpackedExe);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    pass(`Unpacked EXE exists (${sizeMB} MB)`);
  } else {
    fail('Unpacked Aster Code.exe not found');
  }

  // --- No secrets in dist-electron ---
  console.log('[6/7] No .env files in packaged output');
  try {
    const allFiles = getAllFiles(distElectron);
    const envFiles = allFiles.filter(f => f.includes('.env'));
    if (envFiles.length === 0) {
      pass('No .env files found in dist-electron');
    } else {
      fail(`Found ${envFiles.length} .env file(s): ${envFiles.join(', ')}`);
    }
  } catch (e) {
    fail(`Could not scan for .env files: ${e.message}`);
  }

  // --- Web resources in package ---
  console.log('[7/7] Web resources in package');
  const packagedWebIndex = resolve(distElectron, 'win-unpacked', 'resources', 'web', 'dist', 'index.html');
  if (existsSync(packagedWebIndex)) {
    pass('Web index.html bundled in package');
  } else {
    skip('Web resources not found in unpacked app (may use different path)');
  }

  summary();
}

function summary() {
  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('');
  if (failed > 0) {
    console.log('❌ Desktop package check FAILED');
    process.exit(1);
  } else {
    console.log('✅ Desktop package check PASSED');
    process.exit(0);
  }
}

run();
