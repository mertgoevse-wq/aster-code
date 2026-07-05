import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileNode } from '@aster-code/shared';

// Determine runtime root and target workspace directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Workspace path resolved to <root>/workspace
export const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../workspace');

// Enforce path traversal checking
export function getSafePath(relativePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, relativePath);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error(`Security Violation: Path traversal blocked targeting "${relativePath}"`);
  }
  return resolved;
}

// Recursively build file nodes list
export function listFiles(dirPath = WORKSPACE_ROOT): FileNode[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const item of items) {
    // Skip node_modules and .git for clean trees
    if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') {
      continue;
    }

    const fullPath = path.join(dirPath, item.name);
    const relPath = path.relative(WORKSPACE_ROOT, fullPath).replace(/\\/g, '/');

    if (item.isDirectory()) {
      nodes.push({
        name: item.name,
        path: relPath,
        type: 'directory',
        children: listFiles(fullPath)
      });
    } else {
      nodes.push({
        name: item.name,
        path: relPath,
        type: 'file'
      });
    }
  }

  // Sort directories first, then files alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

// Read file contents
export function readFile(relativePath: string): string {
  const safePath = getSafePath(relativePath);
  if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
    throw new Error(`File does not exist: ${relativePath}`);
  }
  return fs.readFileSync(safePath, 'utf-8');
}

// Write file contents
export function writeFile(relativePath: string, content: string): void {
  const safePath = getSafePath(relativePath);
  const parentDir = path.dirname(safePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  fs.writeFileSync(safePath, content, 'utf-8');
}

// Delete file or folder
export function deleteFile(relativePath: string): void {
  const safePath = getSafePath(relativePath);
  if (!fs.existsSync(safePath)) {
    throw new Error(`Target path does not exist: ${relativePath}`);
  }
  const stat = fs.statSync(safePath);
  if (stat.isDirectory()) {
    fs.rmSync(safePath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(safePath);
  }
}

// Create directory folder
export function createFolder(relativePath: string): void {
  const safePath = getSafePath(relativePath);
  if (fs.existsSync(safePath)) {
    throw new Error(`Directory or path already exists: ${relativePath}`);
  }
  fs.mkdirSync(safePath, { recursive: true });
}

// Initialize workspace with simple HTML/Vite app boilerplate if empty
export function initializeWorkspace(): void {
  if (!fs.existsSync(WORKSPACE_ROOT)) {
    fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
  }

  const existingFiles = fs.readdirSync(WORKSPACE_ROOT);
  if (existingFiles.length === 0) {
    console.log(`[Workspace] Sandbox empty. Populating boilerplate files inside ${WORKSPACE_ROOT}...`);

    // 1. package.json
    writeFile('package.json', JSON.stringify({
      name: "aster-sandbox-preview",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        "dev": "vite --port 3002 --strictPort --host 0.0.0.0",
        "build": "vite build"
      },
      devDependencies: {
        "vite": "^5.2.11"
      }
    }, null, 2));

    // 2. index.html
    writeFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aster Sandbox Live Preview</title>
  <style>
    body {
      background-color: #FAF8F5;
      color: #3D3427;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 3rem;
      margin: 0;
    }
    .card {
      background: white;
      border: 1px solid #EBE5DC;
      border-radius: 16px;
      padding: 2.5rem;
      max-w: 420px;
      margin: 2rem auto;
      box-shadow: 0 4px 20px rgba(140, 126, 106, 0.06);
    }
    h1 {
      font-size: 1.75rem;
      margin-top: 0;
    }
    button {
      background: #866854;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #715340;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Vite Live Sandbox</h1>
    <p>This page is running live inside your Aster Code sandbox!</p>
    <div style="margin: 1.5rem 0;">
      <span id="counter" style="font-size: 2rem; font-weight: bold; display: block; margin-bottom: 0.5rem;">0</span>
      <button id="btn">Click Counter</button>
    </div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`);

    // 3. src/main.js
    writeFile('src/main.js', `console.log('[Aster Sandbox] Main script loaded.');

let count = 0;
const counter = document.getElementById('counter');
const btn = document.getElementById('btn');

if (btn && counter) {
  btn.addEventListener('click', () => {
    count++;
    counter.textContent = count;
  });
}
`);
  }
}
