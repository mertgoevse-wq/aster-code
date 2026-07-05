#!/usr/bin/env node

/**
 * Aster Code — Development Start Script
 * 
 * Thin wrapper around `npm run app:dev` with a friendly welcome banner.
 * All process management is handled by concurrently (already installed).
 */

import { spawn } from 'child_process';

console.log('');
console.log('  \x1b[1m\x1b[37m╔══════════════════════════════════╗\x1b[0m');
console.log('  \x1b[1m\x1b[37m║     Aster Code — Dev Start      ║\x1b[0m');
console.log('  \x1b[1m\x1b[37m╚══════════════════════════════════╝\x1b[0m');
console.log('');
console.log('  Starting all development servers...');
console.log('');
console.log('  \x1b[36mRuntime:\x1b[0m  http://localhost:3001  (API, models, agent)');
console.log('  \x1b[35mWeb App:\x1b[0m  http://localhost:5173      (frontend UI)');
console.log('  \x1b[33mDesktop:\x1b[0m Electron window              (native app)');
console.log('');
console.log('  \x1b[90mPress Ctrl+C to stop all servers\x1b[0m');
console.log('');

const child = spawn('npx', ['concurrently', '-n', 'RT,WEB,DSK', '-c', 'cyan,magenta,yellow',
  'npm run dev:runtime',
  'npm run dev:web',
  'npm run dev:desktop'
], {
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  console.log('');
  console.log('  All servers stopped.');
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
