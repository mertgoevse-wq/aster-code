import { app, BrowserWindow, Menu, shell } from 'electron';
import { createMainWindow } from './window.js';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

const isDev = !app.isPackaged;
const WEB_DEV_URL = 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;

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
    // Production: load built web assets
    const indexPath = new URL('../web/dist/index.html', `file://${__dirname}/`).toString();
    mainWindow.loadURL(indexPath);
    log.info(`[Desktop] Loading production build from: ${indexPath}`);
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

app.whenReady().then(() => {
  log.info('[Desktop] App ready');
  createWindow();

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

app.on('before-quit', () => {
  log.info('[Desktop] App quitting');
  mainWindow = null;
});
