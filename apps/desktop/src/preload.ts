import { contextBridge } from 'electron';

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
    };
  }
}
