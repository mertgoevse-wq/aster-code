# Release Package — Aster Code v0.1.0

This document describes how to build, install, run, and test a local Windows release of Aster Code.

---

## 1. Build the Release

From the project root, run the one-command release pipeline:

```powershell
npm run release:local
```

This runs four steps sequentially:
1. `npm run check` — TypeScript typecheck + all workspace builds
2. `npm run app:build` — Full production build (typecheck + all builds + desktop)
3. `npm run desktop:dist` — Package Windows NSIS installer
4. `npm run desktop:smoke` — Verify all build artifacts exist

### Build Steps (manual)

If you prefer to run each step individually:

```powershell
# Step 1: Verify all builds
npm run check

# Step 2: Full production build
npm run app:build

# Step 3: Package Windows installer
npm run desktop:dist

# Step 4: Verify outputs
npm run desktop:smoke
```

---

## 2. Output Artifacts

| Artifact | Path | Size |
|----------|------|------|
| **NSIS Installer** | `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe` | ~77 MB |
| **Unpacked EXE** | `apps/desktop/dist-electron/win-unpacked/Aster Code.exe` | ~178 MB |
| **Unpacked folder** | `apps/desktop/dist-electron/win-unpacked/` | ~343 MB total |

The unpacked folder contains the app ready to run without installation.

---

## 3. Install from NSIS Installer

### Prerequisites
- Windows 10 or 11 (x64)
- ~400 MB free disk space
- Administrator privileges **not required** (user-level install to `%LOCALAPPDATA%`)

### Installation Steps

1. Locate the installer:
   ```
   apps\desktop\dist-electron\Aster Code Setup 0.1.0.exe
   ```

2. **Double-click** the installer.

3. **Windows SmartScreen may warn** (unsigned app — see Section 6).

4. Choose installation directory (default: `%LOCALAPPDATA%\Aster Code`).

5. Check **Desktop shortcut** and **Start Menu shortcut** (enabled by default).

6. Click **Install**, then **Finish**.

---

## 4. Run Aster Code

| Method | Path |
|--------|------|
| **Desktop shortcut** | Double-click `Aster Code` on the desktop |
| **Start Menu** | `Start → Aster Code → Aster Code` |
| **Unpacked (portable)** | Run `apps/desktop/dist-electron/win-unpacked/Aster Code.exe` directly |
| **Dev mode** | `npm run app:dev` (starts runtime + web + desktop) |

### What happens on launch
1. Electron window opens (1440×900, ivory theme)
2. Runtime server auto-starts on `localhost:3001`
3. Health check pings every 5 seconds
4. Status bar shows "Runtime: online" within ~5 seconds

---

## 5. Uninstall

| Method | Steps |
|--------|-------|
| **Settings app** | `Settings → Apps → Installed apps → Aster Code → Uninstall` |
| **Control Panel** | `Control Panel → Programs → Uninstall a program → Aster Code` |
| **Start Menu** | `Start → Aster Code → Uninstall Aster Code` |

The uninstaller removes the application directory, desktop shortcut, and Start Menu entries.

---

## 6. Known Issues: Unsigned App Warning

**Symptom:** Windows SmartScreen shows: "Windows protected your PC"

**Cause:** The `.exe` is not code-signed (no signing certificate configured).

**Workaround:**
1. Click **"More info"**
2. Click **"Run anyway"**

**Permanent fix:** Purchase a code signing certificate from a CA (DigiCert, Sectigo, etc.) and configure `electron-builder` win signing settings.

---

## 7. Collecting Logs

| Component | Log Location |
|-----------|-------------|
| **Runtime logs** | In-app: Settings → Runtime Server → Runtime Logs |
| **Electron main process** | `%APPDATA%\aster-code\logs\main.log` |
| **Electron renderer** | Open DevTools (`Ctrl+Shift+I`) → Console tab |
| **NSIS installer log** | `%TEMP%\Aster Code Setup Log.txt` |

---

## 8. Smoke Test Checklist

See **[docs/WINDOWS_INSTALLER_TEST.md](WINDOWS_INSTALLER_TEST.md)** for the full 17-item checklist covering:

- Electron window opens (no blank screen, no unstyled HTML)
- Runtime auto-starts and shows "online"
- All 6 screens render (Chat, Workbench, Models, Skills, Settings, Workbench)
- Agent plan generation works
- Runtime logs viewable, restart works

---

## 9. Package Contents

What's inside the installer:

| Component | Source | Packaged as |
|-----------|--------|-------------|
| Electron binary | Electron 32.x | Bundled in app |
| Desktop main process | `apps/desktop/dist/` | `app.asar` / `dist/` |
| Web frontend | `apps/web/dist/` | `resources/web/dist/` |
| Runtime server | `apps/runtime/dist/` | `resources/runtime/dist/` |
| Runtime dependencies | `apps/runtime/node_modules/` | `resources/runtime/node_modules/` |
| Runtime package.json | `apps/runtime/package.json` | `resources/runtime/package.json` |

### What is NOT included
- `.env` files (environment variables) — configure providers via Settings UI
- `node_modules` source tree beyond runtime dependencies
- `_research/` directory
- Source maps (`*.map` files)
- API keys or secrets
- Git history

---

## 10. Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run release:local` | Full release pipeline (check + build + dist + smoke) |
| `npm run check` | Typecheck + build all workspaces |
| `npm run app:build` | Full production build |
| `npm run desktop:dist` | Build web + runtime + package NSIS installer |
| `npm run desktop:smoke` | Verify build artifacts exist |
| `npm run app:dev` | Start runtime + web + desktop in dev mode |
