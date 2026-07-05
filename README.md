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

## Setup and Quick Start

```bash
npm install       # Install dependencies
npm run app:dev   # Start everything (runtime + web + desktop)
```

Then open **http://localhost:5173** in your browser, or use the Electron window that opens.

> See **[docs/START_HERE.md](docs/START_HERE.md)** for a step-by-step beginner guide with troubleshooting.
> See **[docs/DESKTOP_APP.md](docs/DESKTOP_APP.md)** for Electron desktop packaging and runtime management details.
> See **[docs/DESKTOP_RUNTIME.md](docs/DESKTOP_RUNTIME.md)** for runtime IPC API and lifecycle documentation.
