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
2. Copy env parameters:
   ```bash
   cp .env.example apps/runtime/.env
   ```
3. Run the development server (runs backend on 3001 and frontend on 5173):
   ```bash
   npm run dev
   ```
4. Verify tests and typechecks:
   ```bash
   npm run typecheck
   ```
5. Build production bundle:
   ```bash
   npm run build
   ```
