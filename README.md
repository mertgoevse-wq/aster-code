# Aster Code - Coding-Agent Studio

A calm, Claude-inspired coding-agent studio combining:
- A Claude Desktop style agent experience.
- A Codex/Claude Code style coding workflow.
- A bolt.new / bolt.diy style workbench and live preview.
- Safe local and cloud model provider registry APIs.
- Day-one safe agent skills configuration architecture.

## Repository Layout
- `apps/web`: React / Vite / TypeScript client.
- `apps/runtime`: Express server.
- `packages/shared`: Shared types and interfaces.
- `docs/`: In-depth documentation on architecture, security, skills, and model registry.

## Setup and Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the full check suite:
   ```bash
   npm run check
   ```
3. Start the runtime server (terminal 1):
   ```bash
   npm run runtime:dev
   ```
4. Start the web frontend (terminal 2):
   ```bash
   npm run dev:web
   ```
5. Open http://localhost:5173 in your browser.

> See **[docs/LOCAL_TESTING.md](docs/LOCAL_TESTING.md)** for detailed Windows PowerShell instructions and a smoke test checklist.
