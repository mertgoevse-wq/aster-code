// desktop-smoke.mjs — Print expected build output paths and URLs
// Run: node scripts/desktop-smoke.mjs

import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function readDesktopVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(root, 'apps/desktop/package.json'), 'utf-8'));
    return pkg.version || '0.1.0';
  } catch {
    return '0.1.0';
  }
}

const version = readDesktopVersion();
const installerName = `Aster Code Setup ${version}.exe`;

const checks = [
  {
    label: 'Web dist',
    path: resolve(root, 'apps/web/dist/index.html'),
    expected: true,
  },
  {
    label: 'Runtime dist',
    path: resolve(root, 'apps/runtime/dist/server.js'),
    expected: true,
  },
  {
    label: 'Desktop dist',
    path: resolve(root, 'apps/desktop/dist/main.js'),
    expected: true,
  },
  {
    label: `Installer (${installerName})`,
    path: resolve(root, 'apps/desktop/dist-electron', installerName),
    expected: true,
  },
  {
    label: 'Unpacked app',
    path: resolve(root, 'apps/desktop/dist-electron/win-unpacked/'),
    expected: true,
  },
  {
    label: 'Desktop shortcut path',
    path: join(homedir(), 'Desktop', 'Aster Code.lnk'),
    expected: false, // created by installer, not by build
  },
];

let allPassed = true;

console.log('');
console.log('=== Aster Code Desktop Smoke Check ===');
console.log('');

for (const check of checks) {
  const exists = existsSync(check.path);
  const icon = exists ? '✅' : '❌';
  const expectedIcon = exists === check.expected ? '  ' : ' ⚠️';
  const note = check.expected && !exists
    ? ' (missing — run npm run desktop:dist)'
    : !check.expected && exists
      ? ' (unexpectedly present)'
      : !check.expected && !exists
        ? ' (created by installer)'
        : '';

  console.log(`${icon}${expectedIcon} ${check.label}`);
  console.log(`   ${check.path}${note}`);
  console.log('');

  if (check.expected && !exists) {
    allPassed = false;
  }
}

console.log('--- URLs ---');
console.log('');
console.log('  Runtime API:  http://localhost:3001');
console.log('  Health check: http://localhost:3001/health');
console.log('  Web dev:      http://localhost:5173');
console.log('');
console.log('--- Install Locations ---');
console.log('');
console.log('  App:          %LOCALAPPDATA%\\Aster Code');
console.log('  User data:    %APPDATA%\\aster-code');
console.log('  Desktop:      ' + join(homedir(), 'Desktop', 'Aster Code.lnk'));
console.log('  Start Menu:   Start → Aster Code');
console.log('');
console.log('--- Scripts ---');
console.log('');
console.log('  Build all:          npm run check');
console.log('  Package installer:  npm run desktop:dist');
console.log('  Smoke test (this):  npm run desktop:smoke');
console.log('');

if (!allPassed) {
  console.log('⚠️  Some build artifacts are missing. Run: npm run desktop:dist');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ All build artifacts found. Installer is ready for smoke testing.');
  console.log('');
}
