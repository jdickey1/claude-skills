---
description: Write an X/Twitter post
argument-hint: <topic or angle>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write an X/Twitter post about the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user what they want to post about.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-posts.md` for X algorithm and posting strategy
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-writing-craft.md` for quality tests, voice, and engagement templates
3. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for hook formulas
4. Write 3+ draft variations with different hook patterns
5. **Run the mandatory self-audit pass** on the leading variation (writing skill: "Self-Audit Pass" section). Output 2–4 honest "still-AI" bullets, then revise to a FINAL version. X is a mandatory channel; do not skip this step.
6. Apply the pre-publish checklist from the writing skill against the FINAL version
7. Present the best options with rationale

## Key Rules

- **Hook is everything** — first line stops the scroll or you lose them
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **No copula avoidance** ("serves as", "stands as", "boasts" — see writing skill rule #16)
- **Self-audit pass is mandatory** — DRAFT → still-AI bullets → FINAL
- **Use contractions** — they're, don't, won't, can't
- **Specificity wins** — numbers, names, places over abstract claims
- **280 chars for max reach** — but threads work for depth
- Follow current X algorithm signals from the reference file
