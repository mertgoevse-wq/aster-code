import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { createMainWindow } from './window.js';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

const isDev = !app.isPackaged;
const WEB_DEV_URL = 'http://localhost:5173';
const RUNTIME_URL = 'http://localhost:3001';

let mainWindow: BrowserWindow | null = null;

// ─── Runtime Process Management ─────────────────────────────────────────────

let runtimeProcess: ChildProcess | null = null;
let runtimeLogs: string[] = [];
let runtimeStatus: 'starting' | 'online' | 'offline' | 'error' = 'offline';
let runtimeStartedByUs = false;
let runtimeHealthInterval: ReturnType<typeof setInterval> | null = null;
let runtimeStartTime: number | null = null;
const MAX_RUNTIME_LOGS = 1000;

/**
 * Determine the path to the runtime server script.
 * In dev: use tsx watch with the source file.
 * In production: use the compiled server.
 */
function getRuntimeCommand(): { command: string; args: string[]; cwd: string } {
  if (isDev) {
    // In dev, we assume the runtime is started via concurrently (npm run app:dev)
    // But if it's not, we can try to start it using tsx
    const runtimeRoot = path.resolve(__dirname, '../../runtime');
    return {
      command: 'npx',
      args: ['tsx', 'watch', 'src/server.ts'],
      cwd: runtimeRoot,
    };
  } else {
    // In production, the compiled runtime should be in the packaged extraResources
    const runtimeRoot = path.resolve(process.resourcesPath, 'runtime');
    return {
      command: 'node',
      args: ['dist/server.js'],
      cwd: runtimeRoot,
    };
  }
}

/** Emit runtime status to all renderer windows */
function emitRuntimeStatus(status: typeof runtimeStatus): void {
  runtimeStatus = status;
  const uptime = runtimeStartTime !== null ? Date.now() - runtimeStartTime : null;
  const payload = {
    state: status,
    pid: runtimeProcess?.pid || null,
    url: RUNTIME_URL,
    uptime: status === 'online' ? uptime : null,
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('runtime:status-changed', payload);
  }
}

/** Check whether the runtime is responding via health endpoint */
async function checkRuntimeHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${RUNTIME_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/** Start monitoring runtime health with periodic pings */
function startHealthMonitoring(): void {
  if (runtimeHealthInterval) clearInterval(runtimeHealthInterval);

  // Immediate first check
  checkRuntimeHealth().then(healthy => {
    if (healthy && runtimeStatus !== 'online') {
      emitRuntimeStatus('online');
    }
  });

  runtimeHealthInterval = setInterval(async () => {
    const healthy = await checkRuntimeHealth();
    if (healthy && runtimeStatus !== 'online') {
      emitRuntimeStatus('online');
    } else if (!healthy && runtimeStatus === 'online') {
      emitRuntimeStatus('offline');
    }
  }, 5000);
}

/** Start the runtime server as a child process */
async function startRuntime(): Promise<void> {
  if (runtimeProcess) {
    log.info('[Runtime] Already running, skipping start');
    emitRuntimeStatus('online');
    return;
  }

  // First check if it's already running
  const alreadyRunning = await checkRuntimeHealth();
  if (alreadyRunning) {
    log.info('[Runtime] Found already running at', RUNTIME_URL);
    runtimeStartedByUs = false;
    emitRuntimeStatus('online');
    startHealthMonitoring();
    return;
  }

  log.info('[Runtime] Starting runtime server...');
  emitRuntimeStatus('starting');
  runtimeStartedByUs = true;

  const { command, args, cwd } = getRuntimeCommand();

  try {
    runtimeProcess = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: isDev ? 'development' : 'production',
      },
    });

    runtimeStartTime = Date.now();
    log.info(`[Runtime] Spawned ${command} ${args.join(' ')} in ${cwd} (pid: ${runtimeProcess.pid})`);

    // Capture stdout
    runtimeProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      runtimeLogs.push(text);
      if (runtimeLogs.length > MAX_RUNTIME_LOGS) {
        runtimeLogs = runtimeLogs.slice(-MAX_RUNTIME_LOGS);
      }
      log.info(`[Runtime stdout] ${text.trim()}`);
    });

    // Capture stderr
    runtimeProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      runtimeLogs.push(text);
      if (runtimeLogs.length > MAX_RUNTIME_LOGS) {
        runtimeLogs = runtimeLogs.slice(-MAX_RUNTIME_LOGS);
      }
      log.warn(`[Runtime stderr] ${text.trim()}`);
    });

    // Handle exit
    runtimeProcess.on('exit', (code, signal) => {
      log.info(`[Runtime] Process exited (code: ${code}, signal: ${signal})`);
      runtimeProcess = null;

      if (code !== 0 && runtimeStartedByUs) {
        emitRuntimeStatus('error');
        runtimeLogs.push(`[Runtime] Exited with code ${code}, signal: ${signal}\n`);
      } else {
        emitRuntimeStatus('offline');
      }
    });

    runtimeProcess.on('error', (err) => {
      log.error('[Runtime] Process error:', err.message);
      runtimeProcess = null;
      emitRuntimeStatus('error');
      runtimeLogs.push(`[Runtime] Error: ${err.message}\n`);
    });

    // Start health monitoring
    startHealthMonitoring();

    log.info('[Runtime] Process started, waiting for health check...');
  } catch (err: any) {
    log.error('[Runtime] Failed to start:', err.message);
    emitRuntimeStatus('error');
    runtimeLogs.push(`[Runtime] Failed to start: ${err.message}\n`);
  }
}

/** Stop the runtime server if we started it */
async function stopRuntime(): Promise<void> {
  if (runtimeHealthInterval) {
    clearInterval(runtimeHealthInterval);
    runtimeHealthInterval = null;
  }

  if (runtimeProcess && runtimeStartedByUs) {
    log.info('[Runtime] Stopping runtime process (pid:', runtimeProcess.pid, ')');

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        log.warn('[Runtime] Force killing runtime process');
        runtimeProcess?.kill('SIGKILL');
      }, 5000);

      runtimeProcess?.on('exit', () => {
        clearTimeout(timeout);
        runtimeProcess = null;
        emitRuntimeStatus('offline');
        resolve();
      });

      runtimeProcess?.kill('SIGTERM');
    });
  }

  runtimeProcess = null;
  emitRuntimeStatus('offline');
}

/** Restart the runtime server */
async function restartRuntime(): Promise<void> {
  await stopRuntime();
  // Small delay to ensure port is freed
  await new Promise(resolve => setTimeout(resolve, 1000));
  await startRuntime();
}

// ─── IPC Handlers ───────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  ipcMain.handle('runtime:status', () => ({
    state: runtimeStatus,
    pid: runtimeProcess?.pid || null,
    url: RUNTIME_URL,
    uptime: runtimeStatus === 'online' && runtimeProcess ? process.uptime() : null,
  }));

  ipcMain.handle('runtime:restart', async () => {
    await restartRuntime();
    return {
      state: runtimeStatus,
      pid: runtimeProcess?.pid || null,
      url: RUNTIME_URL,
      uptime: null,
    };
  });

  ipcMain.handle('runtime:logs', () => {
    // Return last 200 lines
    return runtimeLogs.slice(-200);
  });
}

// ─── Window Management ──────────────────────────────────────────────────────

/**
 * Create the main application window.
 * In development, loads the Vite dev server.
 * In production, loads the built web assets.
 */
function createWindow(): BrowserWindow {
  mainWindow = createMainWindow({
    isDev,
    webDevUrl: WEB_DEV_URL,
  });

  // Load content
  if (isDev) {
    mainWindow.loadURL(WEB_DEV_URL);
    log.info(`[Desktop] Loading dev server: ${WEB_DEV_URL}`);
  } else {
    // Production: load built web assets from extraResources
    const webDistPath = path.join(process.resourcesPath, 'web', 'dist', 'index.html');
    mainWindow.loadFile(webDistPath);
    log.info(`[Desktop] Loading production build from: ${webDistPath}`);
  }

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Remove default menu in production
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  // Handle external links: open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  return mainWindow;
}

// ─── App Lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  log.info('[Desktop] App ready');

  registerIpcHandlers();
  createWindow();

  // Start or connect to runtime
  await startRuntime();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  log.info('[Desktop] App quitting');
  await stopRuntime();
  mainWindow = null;
});
