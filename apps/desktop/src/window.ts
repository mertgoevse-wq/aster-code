import { BrowserWindow } from 'electron';
import path from 'path';

export interface WindowOptions {
  isDev: boolean;
  webDevUrl: string;
}

/**
 * Creates and returns the main BrowserWindow with consistent
 * Claude-like ivory theme and secure defaults.
 */
export function createMainWindow(options: WindowOptions): BrowserWindow {
  const { isDev } = options;

  const win = new BrowserWindow({
    // ─── Window dimensions ───────────────────────────────────────
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,

    // ─── Title ───────────────────────────────────────────────────
    title: 'Aster Code',
    // Warm ivory background visible during load
    backgroundColor: '#FAF9F6',

    // ─── Appearance ──────────────────────────────────────────────
    show: false,
    center: true,

    // ─── Security ────────────────────────────────────────────────
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    },
  });

  // Show window when ready (avoids blank white flash)
  win.once('ready-to-show', () => {
    win.show();
    if (isDev) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });

  return win;
}
