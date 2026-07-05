# Repository License Review — External Skills Research

Date: 2026-07-05

---

## Cloned Repositories (12)

| # | Repository | License | Permissive? | Can Import Code? | Can Use Ideas? | Notes |
|---|-----------|---------|-------------|-----------------|---------------|-------|
| 1 | addyosmani/agent-skills | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |
| 2 | obra/superpowers | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |
| 3 | mattpocock/skills | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |
| 4 | JuliusBrussee/caveman | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |
| 5 | dontriskit/awesome-ai-system-prompts | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |
| 6 | tallesborges/agentic-system-prompts | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |
| 7 | f/prompts.chat | MIT + CC0 1.0 | ✅ Yes (code), ✅ Yes (content) | ✅ Yes (code) | ✅ Yes | Dual license — CC0 for prompts is very permissive |
| 8 | ai-boost/awesome-prompts | GNU GPL v3 | ⚠️ Copyleft | ❌ No | ✅ Yes | GPL requires derivative works to also be GPL |
| 9 | nextlevelbuilder/ui-ux-pro-max-skill | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |
| 10 | ComposioHQ/awesome-claude-skills | Apache 2.0 | ✅ Yes | ✅ Yes | ✅ Yes | Apache 2.0 — requires notice and attribution |
| 11 | multica-ai/andrej-karpathy-skills | **MISSING** | ❌ No license | ❌ No | ✅ Yes (concepts) | No license = all rights reserved. Ideas/concepts only. |
| 12 | affaan-m/ECC | MIT | ✅ Yes | ✅ Yes | ✅ Yes | Clean MIT |

---

## Star-List Repositories — Not Cloned (17)

| # | Repository | License (from GitHub API/known) | Can Import? | Can Use Ideas? |
|---|-----------|-------------------------------|-------------|---------------|
| 13 | linexjlin/GPTs | Unknown | ❌ (leaked content) | ⚠️ Study patterns only |
| 14 | piyush-gambhir/leaked-llms-system-prompts | Unknown | ❌ (leaked content) | ❌ Cannot use |
| 15 | brexhq/prompt-engineering | MIT | ✅ Yes | ✅ Yes |
| 16 | langchain-ai/langchain | MIT | ✅ Yes | ✅ Yes |
| 17 | vllm-project/vllm | Apache 2.0 | ✅ Yes | ✅ Yes |
| 18 | bytedance/deer-flow | Apache 2.0 | ✅ Yes | ✅ Yes |
| 19 | microsoft/autogen | MIT | ✅ Yes | ✅ Yes |
| 20 | openai/swarm | MIT | ✅ Yes | ✅ Yes |
| 21 | crewAIInc/crewAI | MIT | ✅ Yes | ✅ Yes |
| 22 | punkpeye/awesome-mcp-servers | MIT | ✅ Yes | ✅ Yes |
| 23 | karpathy/autoresearch | MIT | ✅ Yes | ✅ Yes |
| 24 | khoj-ai/khoj | AGPL v3 | ❌ No (strong copyleft) | ✅ Yes (architecture) |
| 25 | dair-ai/Prompt-Engineering-Guide | MIT | ✅ Yes | ✅ Yes |
| 26 | Graphify-Labs/graphify | Unknown (check) | ⚠️ Verify | ✅ Yes |
| 27 | ruvnet/RuView | Unknown | N/A (irrelevant) | N/A |
| 28 | navidrome/navidrome | GPL v3 | ❌ No | N/A (irrelevant) |
| 29 | x1xhlol/system-prompts-and-models-of-ai-tools | Unknown | ❌ (leaked content) | ❌ Cannot use |

---

## License Summary

| License | Count | Aster Code Compatible? |
|---------|-------|----------------------|
| MIT | 14 | ✅ Full compatibility |
| Apache 2.0 | 3 | ✅ Compatible (requires attribution) |
| CC0 1.0 | 1 | ✅ Public domain (content only) |
| GNU GPL v3 | 2 | ⚠️ Ideas only, no code import |
| AGPL v3 | 1 | ❌ No code import |
| Missing/Unknown | 5 | ⚠️ Ideas only, no code import |
| Leaked content | 3 | ❌ Cannot use at all |

---

## Recommendations

1. **Safe to reference:** 18 of 29 repos (MIT + Apache 2.0 + CC0) — can study architecture and adapt ideas
2. **Ideas only:** 8 repos (GPL, AGPL, missing license) — study patterns, reimplement from scratch
3. **Do not use:** 3 repos (leaked proprietary content) — no use under any circumstances

### Policy for Aster Code

- **All code written for Aster must be original** — no copy-paste from external repos
- **Ideas and patterns** from MIT/Apache 2.0 licensed repos can be studied and reimplemented
- **GPL/AGPL code** must not enter the codebase (viral copyleft)
- **No dependencies** from external repos without individual review
- **Skill definitions** in the registry are original Aster content regardless of inspiration source
