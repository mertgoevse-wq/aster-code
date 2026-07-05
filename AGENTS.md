# Operational Rules for AI Assistants

Always follow these rules strictly:
- Never add unrequested features.
- Never rewrite unrelated files.
- Keep changes small and incremental.
- Every run must update BUILD_REPORT.md in the root directory.
- Every run must run the build and typecheck steps (`npm run typecheck` and `npm run build`) to ensure correctness.
- No secrets or API keys in the frontend code.
- Provider API keys must only reside in the runtime `.env` file and be accessed via backend endpoints.
- No arbitrary or unvetted shell execution.
- Do not import external GitHub repository code without checking and documenting its license.
