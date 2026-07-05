# Aster Code - Coding-Agent Studio

A calm, Claude-inspired coding-agent studio combining:
- A Claude Desktop style agent experience.
- A Codex/Claude Code style coding workflow.
- A bolt.new / bolt.diy style workbench and live preview.
- Safe local and cloud model provider registry APIs.
- Day-one safe agent skills configuration architecture.

## Repository Layout
- `apps/web`: React / Vite / TypeScript client.
- `apps/runtime`: Express server (port 3001).
- `apps/desktop`: Electron desktop app with auto-runtime management.
- `packages/shared`: Shared types and interfaces.
- `docs/`: In-depth documentation on architecture, security, skills, and model registry.
- `release-notes/`: Versioned release notes.

## Quick Start (Development)

```bash
npm install       # Install dependencies
npm run app:dev   # Start everything (runtime + web + desktop)
```

Then open **http://localhost:5173** in your browser, or use the Electron window that opens.

## Build Windows Installer

```bash
npm run release:local   # Full pipeline: check → build → package → verify
```

Outputs:
- **Installer:** `apps/desktop/dist-electron/Aster Code Setup 0.1.0.exe` (~77 MB)
- **Portable:** `apps/desktop/dist-electron/win-unpacked/Aster Code.exe` (~178 MB)

See **[docs/RELEASE_PACKAGE.md](docs/RELEASE_PACKAGE.md)** for full install/run/uninstall instructions.

## Documentation

| Document | Description |
|----------|-------------|
| **[docs/START_HERE.md](docs/START_HERE.md)** | Beginner step-by-step guide with troubleshooting |
| **[docs/DESKTOP_APP.md](docs/DESKTOP_APP.md)** | Electron desktop packaging and runtime management |
| **[docs/DESKTOP_RUNTIME.md](docs/DESKTOP_RUNTIME.md)** | Runtime IPC API and lifecycle documentation |
| **[docs/WINDOWS_INSTALLER_TEST.md](docs/WINDOWS_INSTALLER_TEST.md)** | Installer smoke test checklist (17 items) |
| **[docs/RELEASE_PACKAGE.md](docs/RELEASE_PACKAGE.md)** | Build, install, run, uninstall, and logs guide |
| **[release-notes/0.1.0.md](release-notes/0.1.0.md)** | v0.1.0 release notes |
