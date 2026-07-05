# Windows Installer Smoke Test — Aster Code

This document describes the end-to-end workflow for building, installing, and smoke-testing the Aster Code Windows desktop installer (NSIS).

---

## 1. Build the Installer

### Step 1: Build everything

From the project root, run:

```powershell
npm run app:build
```

This runs typecheck + build for all workspaces (shared, web, runtime, desktop).

### Step 2: Package the installer

```powershell
npm run desktop:dist
```

This runs:
1. `npm run build --workspace=apps/web` — Vite production build
2. `npm run build --workspace=apps/runtime` — Runtime TypeScript compile
3. `tsc && electron-builder --win --config` — Electron package + NSIS installer

### Installer Output

| Artifact | Path |
|----------|------|
| **Installer (.exe)** | `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe` |
| **Unpacked app** | `apps/desktop/dist-electron/win-unpacked/` |

### Quick check: print expected paths

```powershell
npm run desktop:smoke
```

This script prints all expected build output paths and URLs so you can verify they exist.

---

## 2. Install Aster Code

### Prerequisites

- **Windows 10 or 11** (x64)
- Administrator privileges **not required** (user-level install)
- ~50 MB free disk space

### Installation Steps

1. Locate the installer at:
   ```
   apps\desktop\dist-electron\Aster Code Setup 0.1.0.exe
   ```

2. **Double-click** the installer.

3. **Windows Defender SmartScreen may block the unsigned installer.**

   - Click **"More info"**
   - Click **"Run anyway"**
   - *For production: obtain a code signing certificate to avoid this warning.*

4. Choose an installation directory (default: `%LOCALAPPDATA%\Aster Code`).

5. Click **Install** and wait for completion (~10–30 seconds).

6. **Check the boxes** for:
   - ✅ Create Desktop shortcut
   - ✅ Create Start Menu shortcut

   (These are enabled by default in the NSIS config.)

7. Click **Finish**. The app launches automatically if "Launch Aster Code" is checked.

---

## 3. Launch Aster Code

After installation, you can launch Aster Code from:

| Method | Path |
|--------|------|
| **Desktop shortcut** | Double-click `Aster Code` on the desktop |
| **Start Menu** | `Start → Aster Code → Aster Code` |
| **Install directory** | `%LOCALAPPDATA%\Aster Code\Aster Code.exe` |

---

## 4. Uninstall Aster Code

| Method | Steps |
|--------|-------|
| **Settings app** | `Settings → Apps → Installed apps → Aster Code → Uninstall` |
| **Control Panel** | `Control Panel → Programs → Uninstall a program → Aster Code` |
| **Start Menu** | `Start → Aster Code → Uninstall Aster Code` |

The uninstaller removes:
- The application directory (`%LOCALAPPDATA%\Aster Code`)
- Desktop shortcut
- Start Menu entries
- **Does not** remove user data (workspace files, settings stored in `%APPDATA%\aster-code`)

---

## 5. Smoke Test Checklist

Run through these checks after installing. Each test verifies a critical part of the application.

### Core Launch

| # | Check | Expected Result | ✅ |
|---|-------|-----------------|----|
| 1 | **Electron window opens** | A window with title "Aster Code" appears, ivory background, no error dialogs | ⬜ |
| 2 | **No blank screen** | The UI renders immediately — sidebar, top bar, and a screen are visible | ⬜ |
| 3 | **No unstyled HTML** | Text is styled with the ivory/Claude-like theme (warm beige tones, proper fonts), not raw browser defaults | ⬜ |
| 4 | **No API connection errors** | No "Cannot connect to runtime" errors, no red error banners in the UI | ⬜ |

### Runtime & Connectivity

| # | Check | Expected Result | ✅ |
|---|-------|-----------------|----|
| 5 | **Runtime auto-starts** | The status bar at the bottom shows "Runtime: starting…" → "Runtime: online" within ~5 seconds | ⬜ |
| 6 | **Runtime status online** | Status bar shows green badge: **Online** with the URL `http://localhost:3001` | ⬜ |
| 7 | **Health check passes** | Open Settings → Runtime Server panel → status shows "online" with uptime counting up | ⬜ |

### Screen Navigation

| # | Check | Expected Result | ✅ |
|---|-------|-----------------|----|
| 8 | **Chat screen opens** | Click "Chat" in sidebar → chat interface renders with input area and message area | ⬜ |
| 9 | **Agent plan generation** | Type a task in chat (e.g., "create a hello world app") and send → a plan appears with expandable steps | ⬜ |
| 10 | **Workbench opens** | Click "Workbench" in sidebar → file tree, editor panel, terminal, and preview panels are visible | ⬜ |
| 11 | **Model Registry opens** | Click "Models" in sidebar → provider list and model grid/table render with model names and capability badges | ⬜ |
| 12 | **Skills opens** | Click "Skills" in sidebar → skills list renders with toggle switches and descriptions | ⬜ |
| 13 | **Settings opens** | Click "Settings" in sidebar → provider config forms, system prompt library, and Runtime Server panel are visible | ⬜ |

### Runtime Management (in Settings)

| # | Check | Expected Result | ✅ |
|---|-------|-----------------|----|
| 14 | **Runtime logs viewable** | Settings → Runtime Server → Toggle "Runtime Logs" → log lines appear with timestamps | ⬜ |
| 15 | **Restart runtime works** | Settings → Runtime Server → Click "Restart Runtime" → runtime restarts, status goes starting→online | ⬜ |

### Post-Install Cleanup

| # | Check | Expected Result | ✅ |
|---|-------|-----------------|----|
| 16 | **Desktop shortcut exists** | `Aster Code` shortcut is on the desktop with app icon | ⬜ |
| 17 | **Start Menu entry exists** | `Start → Aster Code` folder with `Aster Code` and `Uninstall Aster Code` entries | ⬜ |

---

## 6. Troubleshooting

### Windows Defender SmartScreen — Unsigned App Warning

**Symptom:** Windows shows: "Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting."

**Fix:**
1. Click **"More info"**
2. Click **"Run anyway"**
3. The app will launch normally.

**Permanent fix (production):** Purchase a code signing certificate (EV or OV) from a CA like DigiCert or Sectigo and add it to the electron-builder config.

---

### Runtime Port 3001 Already in Use

**Symptom:** Status bar shows "Runtime: error" or "Runtime: offline". Runtime logs show `EADDRINUSE` or `port 3001 already in use`.

**Fix:**
1. Find the process using port 3001:
   ```powershell
   netstat -ano | findstr :3001
   ```
2. Kill it (replace `<PID>` with the PID from the output):
   ```powershell
   taskkill /PID <PID> /F
   ```
3. Restart Aster Code, or click "Restart Runtime" in Settings.

---

### Installer Missing (desktop:dist didn't produce .exe)

**Symptom:** The file `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe` does not exist.

**Fix:**
1. Ensure all build steps succeeded:
   ```powershell
   npm run check
   ```
2. Re-run the dist command:
   ```powershell
   npm run desktop:dist
   ```
3. Check that `apps/web/dist/` and `apps/runtime/dist/` exist.
4. If still missing, check for electron-builder errors in the terminal output.

---

### App Opens Blank/White

**Symptom:** Electron window opens but shows a blank white screen.

**Possible causes:**
1. Vite dev server not running (dev mode only)
2. Web dist not included in package (production mode)
3. JavaScript error in console

**Fix:**
1. Open DevTools: Press `F12` or `Ctrl+Shift+I`.
2. Check the **Console** tab for errors.
3. Check the **Network** tab to see if resources are loading.
4. In dev mode: ensure `npm run dev:web` is running before launching.
5. In production: re-run `npm run desktop:dist` to rebuild the package.

---

### App Cannot Reach Runtime

**Symptom:** Status bar stays "Runtime: offline" or "Runtime: error" indefinitely. API-dependent screens (Models, Workbench, Chat) show error states.

**Fix:**
1. Check that nothing else is using port 3001 (see "Port 3001 already in use" above).
2. View runtime logs: **Settings → Runtime Server → Runtime Logs**.
3. Try manually starting the runtime in a separate terminal:
   ```powershell
   npm run dev:runtime
   ```
4. Restart the runtime from Settings.
5. If in dev mode (running via `app:dev`), the concurrently process manages the runtime — check its terminal output.

---

### Logs Location

| Component | Log Location |
|-----------|-------------|
| **Runtime stdout/stderr** | View in-app: Settings → Runtime Server → Runtime Logs |
| **Electron main process** | `%APPDATA%\aster-code\logs\main.log` |
| **Electron renderer** | Open DevTools (`F12`) → Console tab |
| **Installer log** | `%TEMP%\Aster Code Setup Log.txt` (generated by NSIS) |

---

## 7. Quick Build-and-Test Workflow

```powershell
# 1. Full build
npm run check

# 2. Package installer
npm run desktop:dist

# 3. Verify outputs exist
npm run desktop:smoke

# 4. Install
# Open: apps\desktop\dist-electron\Aster Code Setup 0.1.0.exe
# Run through installer wizard

# 5. Smoke test
# Launch Aster Code from Desktop or Start Menu
# Run through the checklist in Section 5

# 6. Clean up
# Uninstall via Settings → Apps → Aster Code → Uninstall
```
