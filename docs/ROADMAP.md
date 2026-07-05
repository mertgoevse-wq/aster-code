# Aster Code Development Roadmap

## Phase 1: MVP 0.1 (Current)
- [x] Mono-repository setup via npm workspaces.
- [x] Claude-inspired ivory theme design system.
- [x] Model Registry API supporting mock Ollama and OpenAI-Compatible adapters.
- [x] Chat interface with simulated Agent Activity timelines.
- [x] Settings workspace storing templates in local storage.
- [x] Documentation of security boundaries and integrations.
- [x] Real provider adapters foundation, cache TTL, and status APIs.

## Phase 2: Live Connections & Real Completion
- [ ] Connect chat panel completion outputs to active registry models.
- [ ] Add direct Anthropic SDK and custom LLM inference endpoints.
- [ ] Implement robust error checks and fallback strategies.

## Phase 3: Workspace Files & Preview Sandbox
- [x] Implement directory indexing using Node `fs` APIs in `/api/workspace`.
- [x] Implement command execution runner supporting streaming logs via Server-Sent Events (SSE).
- [x] Run Vite previews inside a virtual iframe to render UI updates in real-time.
- [ ] Mount Monaco Editor in `apps/web` connected via web sockets to modify real files.


## Phase 4: Native Android Client Execution
- [ ] Design a lightweight webview wrapper or Cordova/Capacitor framework to package Aster Code UI as an Android app.
- [ ] Access target device sensors and folders using a native bridge.
- [ ] Build APK files automatically on local development rigs.
