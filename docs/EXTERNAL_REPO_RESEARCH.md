# External Repository Research — Agent Skills & Tools

Date: 2026-07-05
Source: https://github.com/stars/mertgoevse-wq/lists/liste (29 repos)
Cloned for analysis: 12 most relevant repos

---

## Cloned & Analyzed Repositories

### 1. addyosmani/agent-skills
- **URL:** https://github.com/addyosmani/agent-skills
- **License:** MIT ✅
- **Language:** Shell (skill files)
- **Stars:** 69k
- **Description:** Production-grade engineering skills packaged as slash commands (`/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship`) for consistent AI coding agent workflows.
- **Useful idea:** Lifecycle-based skill framework — Define → Plan → Build → Verify → Review → Ship. Each phase has quality gates.
- **Aster skill mapping:** Could inspire `build-fixer`, `test-writer`, `project-planner` with more formalized checklists and quality gates.
- **Security risk:** Low (read-only skill definitions, no executable code)
- **Dependency risk:** Low (shell-based, no npm deps)
- **Recommendation:** **Use idea only** — adopt the lifecycle model, write our own skill definitions.

### 2. obra/superpowers
- **URL:** https://github.com/obra/superpowers
- **License:** MIT ✅
- **Language:** Shell
- **Stars:** 246k
- **Description:** Complete development methodology for coding agents — iterative specs, implementation plans, subagent-driven development.
- **Useful idea:** "Tease out spec before coding" methodology, subagent orchestration patterns.
- **Aster skill mapping:** Could enhance `project-planner` with iterative spec refinement; inspire subagent delegation in the agent loop.
- **Security risk:** Low (methodology only, documented patterns)
- **Dependency risk:** Low (shell scripts, no runtime deps)
- **Recommendation:** **Use idea only** — adopt methodology patterns, write our own implementation.

### 3. mattpocock/skills
- **URL:** https://github.com/mattpocock/skills
- **License:** MIT ✅
- **Language:** Shell
- **Stars:** 157k
- **Description:** Small, composable skills to fix agent failure modes — misalignment fixing (`/grill-me`, `/grill-with-docs`), verbosity control.
- **Useful idea:** Skill-based prompt injection to reduce misalignment between user intent and agent output.
- **Aster skill mapping:** Could add "alignment-checker" skill that validates agent plan against user's original request.
- **Security risk:** Low (skill definitions only)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — adopt grilling/alignment-check techniques.

### 4. JuliusBrussee/caveman
- **URL:** https://github.com/JuliusBrussee/caveman
- **License:** MIT ✅
- **Language:** JavaScript
- **Stars:** 84k
- **Description:** Plugin to reduce output tokens by 65% via caveman-style speaking while keeping code output exact.
- **Useful idea:** Token optimization through response compression — useful for reducing API costs in agent loops.
- **Aster skill mapping:** Could add "token-optimizer" skill that compresses verbose agent outputs while preserving technical accuracy.
- **Security risk:** Low (output formatting only)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — implement our own token-efficient response format.

### 5. dontriskit/awesome-ai-system-prompts
- **URL:** https://github.com/dontriskit/awesome-ai-system-prompts
- **License:** MIT ✅
- **Language:** TypeScript
- **Stars:** 6k
- **Description:** Curated system prompts for major AI tools (ChatGPT, Claude, Perplexity, v0, etc.) with structural analysis.
- **Useful idea:** Prompt structure taxonomy — Role Definition, Tool Integration, Reasoning/Planning, Safety protocols.
- **Aster skill mapping:** Directly feeds our System Prompt Library. The prompt taxonomy helps users write better prompts.
- **Security risk:** Low (prompt templates only)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — study prompt patterns, don't copy prompts directly.

### 6. tallesborges/agentic-system-prompts
- **URL:** https://github.com/tallesborges/agentic-system-prompts
- **License:** MIT ✅
- **Language:** Jinja
- **Stars:** 176
- **Description:** Complete system prompts and tool definitions from production AI coding agents (Claude Code, Cline, Aider).
- **Useful idea:** Real-world prompt templates with full tool API specs — shows how agents describe their capabilities to LLMs.
- **Aster skill mapping:** Could inform how Aster's agent loop describes its tools to the LLM in future phases.
- **Security risk:** Low (documentation only)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — study prompt/tool description patterns for LLM agent loop.

### 7. f/prompts.chat
- **URL:** https://github.com/f/prompts.chat
- **License:** MIT (code) / CC0 1.0 (content) ✅
- **Language:** HTML
- **Stars:** 164k
- **Description:** Massive open-source prompt library (formerly "Awesome ChatGPT Prompts") with community contributions.
- **Useful idea:** Community-driven prompt sharing model, prompt categorization by domain.
- **Aster skill mapping:** Could seed our System Prompt Library with more diverse defaults; inspire prompt sharing features.
- **Security risk:** Low (prompts only, CC0 licensed)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — CC0 prompts can be adapted; study categorization model.

### 8. ai-boost/awesome-prompts
- **URL:** https://github.com/ai-boost/awesome-prompts
- **License:** GNU GPL v3 ⚠️
- **Language:** (curated list)
- **Stars:** 8k
- **Description:** Curated prompts with focus on prompt engineering as an engineering discipline — testing, regression, optimization.
- **Useful idea:** Prompt testing/regression frameworks (promptfoo), automated prompt optimization techniques.
- **Aster skill mapping:** Could inspire a "prompt-tester" skill that validates prompts before deployment.
- **Security risk:** Low (curated list)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — GPL license prevents code import, but ideas/concepts are fine.

### 9. nextlevelbuilder/ui-ux-pro-max-skill
- **URL:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **License:** MIT ✅
- **Language:** Python
- **Stars:** 101k
- **Description:** AI skill that provides design intelligence for building professional UI/UX — analyzes requirements → generates design system.
- **Useful idea:** Design system generation from requirements, multi-platform UI patterns.
- **Aster skill mapping:** Could enhance `ui-debugger` with design system generation capabilities.
- **Security risk:** Low (design guidance only)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — adopt design system generation patterns.

### 10. ComposioHQ/awesome-claude-skills
- **URL:** https://github.com/ComposioHQ/awesome-claude-skills
- **License:** Apache 2.0 ✅
- **Language:** Python
- **Stars:** 66k
- **Description:** 1000+ practical Claude skills and plugins, including `connect-apps` for 500+ app integrations.
- **Useful idea:** App integration plugin model (email, Slack, GitHub issues) — agents can perform real actions.
- **Aster skill mapping:** Could inspire "app-connector" skill for future phases (not MVP).
- **Security risk:** Medium (app integrations require credential handling)
- **Dependency risk:** Medium (many external API deps)
- **Recommendation:** **Wrap as MCP later** — too complex for MVP, revisit when adding tool integrations.

### 11. multica-ai/andrej-karpathy-skills
- **URL:** https://github.com/multica-ai/andrej-karpathy-skills
- **License:** MISSING ⚠️
- **Language:** (CLAUDE.md)
- **Stars:** 187k
- **Description:** Behavioral guidelines derived from Andrej Karpathy's observations on LLM coding pitfalls — Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution.
- **Useful idea:** Four behavioral principles for coding agents that dramatically improve output quality.
- **Aster skill mapping:** Could embed these principles into the core system prompt for all agent operations.
- **Security risk:** Low (behavioral guidelines)
- **Dependency risk:** Low
- **Recommendation:** **Use idea only** — adopt principles, but no license = no code reuse.

### 12. affaan-m/ECC
- **URL:** https://github.com/affaan-m/ECC
- **License:** MIT ✅
- **Language:** JavaScript
- **Stars:** 226k
- **Description:** Harness-native operator system — skills, instincts, memory optimization, security scanning, MCP configs.
- **Useful idea:** "Instincts" (automatic behaviors), memory optimization, cross-harness compatibility patterns.
- **Aster skill mapping:** Could inspire "codebase-auditor" enhancements with security scanning; memory optimization for agent context.
- **Security risk:** Medium (security scanning module, needs isolation)
- **Dependency risk:** Medium (MCP configs, multiple integrations)
- **Recommendation:** **Reimplement small part** — adopt memory optimization and security scanning patterns only.

---

## Star-List Repos (Not Cloned — Brief Assessment)

| # | Repo | Stars | Relevance | License Risk |
|---|------|-------|-----------|-------------|
| 13 | linexjlin/GPTs | 31k | Leaked GPT prompts — useful for prompt patterns | ⚠️ Unclear provenance |
| 14 | piyush-gambhir/leaked-llms-system-prompts | 1 | Leaked system prompts — study patterns only | ⚠️ Cannot use leaked content |
| 15 | brexhq/prompt-engineering | 9k | Prompt engineering tips — educational | ✅ Generally applicable |
| 16 | langchain-ai/langchain | 140k | Agent engineering platform — reference architecture | ✅ MIT |
| 17 | vllm-project/vllm | 85k | LLM inference engine — not a skill | N/A (infra, not skill) |
| 18 | bytedance/deer-flow | 76k | SuperAgent harness — reference patterns | ⚠️ Apache 2.0 |
| 19 | microsoft/autogen | 59k | Agent framework — reference architecture | ✅ MIT |
| 20 | openai/swarm | 21k | Multi-agent orchestration — educational | ✅ MIT |
| 21 | crewAIInc/crewAI | 54k | Role-playing agents — reference patterns | ⚠️ Check license |
| 22 | punkpeye/awesome-mcp-servers | 90k | MCP server catalog — future integration reference | ✅ MIT |
| 23 | karpathy/autoresearch | 89k | Auto ML research — reference architecture | ✅ MIT |
| 24 | khoj-ai/khoj | 35k | Personal AI agent — reference | ⚠️ Check license |
| 25 | dair-ai/Prompt-Engineering-Guide | 76k | Educational guide — knowledge only | ✅ MIT |
| 26 | Graphify-Labs/graphify | 77k | Code-to-knowledge-graph — reference | ⚠️ Check license |
| 27 | ruvnet/RuView | 76k | WiFi sensing — not relevant to agent skills | N/A |
| 28 | navidrome/navidrome | 22k | Music streaming — not relevant | N/A |
| 29 | x1xhlol/system-prompts-and-models-of-ai-tools | 141k | Leaked system prompts — study patterns | ⚠️ Cannot use leaked content |

---

## Summary Statistics

- **Total repos in star list:** 29
- **Cloned & analyzed:** 12
- **MIT licensed:** 10 (of 12 cloned)
- **Apache 2.0:** 1
- **GPL v3:** 1 (ai-boost — idea-only)
- **CC0 content:** 1 (f/prompts.chat)
- **Missing license:** 1 (multica-ai — idea-only, no code reuse)
- **Recommendation "use idea only":** 10
- **Recommendation "reimplement small part":** 1
- **Recommendation "wrap as MCP later":** 1
- **Rejected (leaked content):** 3
- **Not relevant to agent skills:** 2
