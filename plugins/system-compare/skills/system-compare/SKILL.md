---
name: system-compare
description: Use when comparing two skills, tools, plugins, or systems head-to-head and you need a verdict — "X vs Y", "should we switch from X to Y", "is this better than ours", "keep, merge, or deprecate", or "is this actually a skill or a system". Produces a forced-verdict matrix, 10-vector fitness scorecard, and ranked steal list. Markdown output by default.
---

# System Compare

Head-to-head comparison of two systems. Forces a WHO-WINS verdict per dimension, scores both on 10 fitness vectors, produces a ranked steal list.

## When to Use

- Two skills/plugins in the same workspace — keep, merge, or deprecate decision
- External repo or tool vs your internal stack — find symmetrical gaps
- Architectural verdict — is this skill actually a system?
- Adoption decision — should we install this OSS plugin?

## When NOT to Use

- Single-input analysis → use `digest`
- Pre-implementation duplicate check → use `context-gap-analysis`
- General topic research → use `research`
- Reviewing one skill against standards → use `skill-creator` review mode

## Inputs

You need two inputs. Either side may be a local path, a URL, or an Obsidian note from a prior digest. If only one is provided, ask for the second before proceeding. If a side is a URL and not already saved, run `digest` first so the comparison reads from a stable note rather than re-fetching.

## Process

### 1. Lock scope (one question max)

Read both systems before asking anything. Infer the mode:

| Mode | When |
|---|---|
| `skill-vs-skill` | Both inputs are individual skills |
| `skill-vs-system` | One input may have outgrown skill scope |
| `external-vs-internal` | One side is your stack, other is third-party |

Only ask if the mode is genuinely ambiguous. State the locked scope and proceed. The reason: a six-question intake adds more friction than the comparison saves for typical cases — front-load the inference, ask only when necessary.

### 2. Build the comparison

Read actual files (SKILL.md, README, configs) from both sides. Not just directory names — the comparison is only as honest as the files you actually opened.

**Dimensions matrix** — 4–8 capability dimensions covering the comparison surface. Each row: System A capability | System B capability | **Winner** + one-sentence why. Force a verdict or call a tie with a reason. "Both have strengths" is not a verdict.

**Fitness scorecard** — score both LOW/MED/HIGH on each vector with one-sentence evidence:

1. **Prerequisites** — dependencies, setup complexity, what must exist first
2. **Cost impact** — token burn, agent spawns, run frequency
3. **Quality control** — does the skill validate output, or rely on the model?
4. **User experience** — friction, interaction model, output format fit
5. **Skill standard compliance** — would `skill-creator` approve this as-is?
6. **Security** — keys, prompt injection surface, data leaving workspace
7. **Architecture fit** — scope right for what it is (skill / pipeline / system)?
8. **Workspace compatibility** — namespace fit, routing conventions
9. **Trigger precision** — unambiguous triggers, no overlap with adjacent skills
10. **Maintenance decay rate** — LOW (internal conventions) → HIGH (scraped/volatile)

**Steal list** — ranked by operational impact, not by ease of porting. The reason: easy-to-port items are usually low-value cosmetic copies; high-impact items are usually harder but worth it.

1. Fills a daily-workflow gap
2. Prevents a known failure mode
3. Adds a missing capability
4. Improves an existing capability (lowest priority)

Each item: what to steal, why it matters (one sentence), effort estimate (port vs rebuild), which vector or dimension it addresses.

**Moats** — what does each side have that the other can't easily replicate? Accumulated context, architectural advantages, low-decay design.

**Architecture verdict** (skill-vs-system mode only):

```
VERDICT: [skill | orchestrating-skill | pipeline | full-system]
REASON: one paragraph — what triggered this classification
RESTRUCTURE: specific changes if verdict differs from current structure
```

### 3. Output

Default: markdown printed to chat. Save to a file only if the user asks. The reason: most comparisons are decisions in flight, not artifacts to archive — printing inline keeps context tight.

For larger comparisons (3+ tracks, 8+ dimensions per track), or when the user asks for a shareable artifact, save markdown to `temp/[a]-vs-[b]-comparison.md` and return the path.

## Anti-patterns

- **"Both have strengths"** — force the verdict per dimension or call it a tie with a reason
- **Generic steal items** — "improve QC" is useless; "port the pre-send spam-check assertion from skill X" is actionable
- **Workflow re-statement** — explain why something wins, not what it does
- **Bias drift** — neutral by default; symmetrical gaps are the most useful finding
- **Pretending you read the files** — if you only looked at directory names, say so and ask permission to dig deeper
- **Editorial PDF for casual comparisons** — markdown is the default; an archival format should be opt-in

## Related skills

- `digest` — fetch and save an external thing (run before compare if input is a URL)
- `skill-creator` — review one skill against standards (single-input)
- `context-gap-analysis` — pre-implementation duplicate check (narrower, pre-build gate)
