import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script — exposes a minimal, safe API to the renderer process.
 *
 * Security rules:
 * - contextIsolation: true (enforced in main process)
 * - nodeIntegration: false (enforced in main process)
 * - Only explicitly listed APIs are exposed
 * - No arbitrary shell, file system, or process access
 * - No secrets or environment variables exposed
 */

export interface RuntimeStatus {
  state: 'starting' | 'online' | 'offline' | 'error';
  pid: number | null;
  url: string;
  uptime: number | null;
  error?: string;
}

contextBridge.exposeInMainWorld('asterDesktop', {
  /** Whether the app is running inside Electron (vs browser) */
  isElectron: true,

  /** Platform identifier: 'win32', 'darwin', 'linux' */
  platform: process.platform,

  /** Electron version string */
  electronVersion: process.versions.electron,

  /** Chrome version string (useful for debugging) */
  chromeVersion: process.versions.chrome,

  /** App version from package.json */
  appVersion: process.env.npm_package_version || '0.1.0',

  /** Runtime URL for API calls */
  runtimeUrl: 'http://localhost:3001',

  // ── Runtime Management (IPC) ──────────────────────────────────────────────

  /** Get the current runtime server status */
  getRuntimeStatus: (): Promise<RuntimeStatus> =>
    ipcRenderer.invoke('runtime:status'),

  /** Restart the runtime server (stop if running, then start fresh) */
  restartRuntime: (): Promise<RuntimeStatus> =>
    ipcRenderer.invoke('runtime:restart'),

  /** Get recent runtime log lines */
  getRuntimeLogs: (): Promise<string[]> =>
    ipcRenderer.invoke('runtime:logs'),

  /** Listen for runtime status change events */
  onRuntimeStatusChange: (callback: (status: RuntimeStatus) => void): (() => void) => {
    const handler = (_event: any, status: RuntimeStatus) => callback(status);
    ipcRenderer.on('runtime:status-changed', handler);
    return () => {
      ipcRenderer.removeListener('runtime:status-changed', handler);
    };
  },
});

// Type declaration for the renderer (TypeScript consumers)
declare global {
  interface Window {
    asterDesktop?: {
      isElectron: boolean;
      platform: string;
      electronVersion: string;
      chromeVersion: string;
      appVersion: string;
      runtimeUrl: string;
      getRuntimeStatus: () => Promise<import('./preload').RuntimeStatus>;
      restartRuntime: () => Promise<import('./preload').RuntimeStatus>;
      getRuntimeLogs: () => Promise<string[]>;
      onRuntimeStatusChange: (callback: (status: import('./preload').RuntimeStatus) => void) => () => void;
    };
  }
}
