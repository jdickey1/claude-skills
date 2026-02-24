---
description: Write an X/Twitter post
argument-hint: <topic or angle>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write an X/Twitter post about the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user what they want to post about.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-posts.md` for X-specific optimization
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for hook formulas
3. Write 3+ draft variations with different hook patterns
4. Apply the pre-publish checklist from the writing skill
5. Present the best options with rationale

## Key Rules

- **Hook is everything** — first line stops the scroll or you lose them
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **Use contractions** — they're, don't, won't, can't
- **Specificity wins** — numbers, names, places over abstract claims
- **280 chars for max reach** — but threads work for depth
- Follow current X algorithm signals from the reference file
