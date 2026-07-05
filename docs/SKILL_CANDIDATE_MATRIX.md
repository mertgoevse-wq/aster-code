# Skill Candidate Matrix — Aster Code

Date: 2026-07-05
Generated from analysis of 29 external repositories (12 cloned, analyzed in depth)

---

## Proposed New Skill Placeholders

These are candidates for future Aster Code skills, derived from external repo research. Marked as "placeholder" — no external code imported.

### Tier 1: High Value, Low Risk (implement soon)

| Skill ID | Name | Source Inspiration | Description | Permission | Mode |
|----------|------|-------------------|-------------|------------|------|
| `alignment-checker` | Alignment Checker | mattpocock/skills | Grills the user to validate agent plan matches original intent before execution | read-only | ask |
| `spec-writer` | Spec Writer | addyosmani/agent-skills, obra/superpowers | Generates formal specs before coding; validates plan completeness | read, write | auto |
| `design-system-builder` | Design System Builder | nextlevelbuilder/ui-ux-pro-max-skill | Generates Tailwind design tokens and component patterns from requirements | read, write | ask |
| `prompt-optimizer` | Prompt Optimizer | ai-boost/awesome-prompts | Tests and refines system prompts using regression testing patterns | read, write | ask |

### Tier 2: Medium Value, Medium Effort

| Skill ID | Name | Source Inspiration | Description | Permission | Mode |
|----------|------|-------------------|-------------|------------|------|
| `token-compressor` | Token Compressor | JuliusBrussee/caveman | Reduces verbose agent output while preserving technical accuracy | read-only | auto |
| `security-scanner` | Security Scanner | affaan-m/ECC | Scans workspace for credential leaks, unsafe patterns, path traversal | read-only | auto |
| `prompt-validator` | Prompt Validator | brexhq/prompt-engineering, dair-ai/Prompt-Engineering-Guide | Validates system prompts against best practices; suggests improvements | read-only | auto |
| `memory-optimizer` | Memory Optimizer | affaan-m/ECC | Optimizes agent context window usage by summarizing non-critical info | read-only | auto |

### Tier 3: Future (MVP+)

| Skill ID | Name | Source Inspiration | Description | Permission | Mode |
|----------|------|-------------------|-------------|------------|------|
| `app-connector` | App Connector | ComposioHQ/awesome-claude-skills | Connects to external services (Slack, email, GitHub) via secure APIs | execute | ask |
| `mcp-bridge` | MCP Bridge | punkpeye/awesome-mcp-servers | Discovers and connects to MCP servers for extended tool capabilities | execute | ask |
| `subagent-orchestrator` | Subagent Orchestrator | obra/superpowers, microsoft/autogen | Spawns specialized subagents for parallel task execution | execute | ask |
| `rag-researcher` | RAG Researcher | khoj-ai/khoj | Searches local docs and external sources for context-aware research | read, url | ask |

---

## Enhancement Candidates for Existing Skills

Existing Aster skills that could be improved with ideas from research:

| Existing Skill | Enhancement | Source |
|---------------|-------------|--------|
| `project-planner` | Add formal `/spec` phase with quality gates | addyosmani/agent-skills, obra/superpowers |
| `codebase-auditor` | Add security scanning (`credential-check`, `unsafe-pattern-check`) | affaan-m/ECC |
| `ui-debugger` | Add design system generation, accessibility audit | nextlevelbuilder/ui-ux-pro-max-skill |
| `test-writer` | Add test coverage analysis, regression testing patterns | addyosmani/agent-skills |
| `build-fixer` | Add build pipeline optimization, error pattern learning | — |
| `readme-writer` | Add prompt template generation for agent instructions | dontriskit/awesome-ai-system-prompts |

---

## Rejected Candidates

| Source | Reason for Rejection |
|--------|---------------------|
| piyush-gambhir/leaked-llms-system-prompts | Leaked proprietary content — cannot ethically use |
| linexjlin/GPTs | Leaked GPT prompts — unclear provenance, legal risk |
| x1xhlol/system-prompts-and-models-of-ai-tools | Leaked system prompts — copyright concerns |
| ruview/ruview | WiFi sensing — not relevant to coding agent skills |
| navidrome/navidrome | Music streaming — not relevant |

---

## Implementation Guidelines

1. **Placeholder entries only** — skills registry gets stub entries with descriptions, no code
2. **"Use idea only"** — implement from scratch using Aster conventions
3. **All existing permissions and approval gates apply** to new skills
4. **No external dependencies** — only use packages already in the monorepo
5. **Re-review licenses** before implementing any skill that references external patterns
