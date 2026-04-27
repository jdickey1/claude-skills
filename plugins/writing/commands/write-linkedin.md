---
description: Write a LinkedIn post
argument-hint: <topic or angle>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write a LinkedIn post about the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user what they want to post about.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/linkedin.md` for LinkedIn-specific optimization
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for hook formulas
3. Write 2-3 draft variations with different hook patterns
4. **Run the mandatory self-audit pass** on the leading variation (writing skill: "Self-Audit Pass" section). Output 2–4 honest "still-AI" bullets, then revise to a FINAL version. LinkedIn pattern-matches AI output faster than any other platform; do not skip this step.
5. Apply the pre-publish checklist from the writing skill against the FINAL version
6. Present the best options with rationale

## Key Rules

- **First 2-3 lines are visible before "see more"** — hook hard
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **No copula avoidance** ("serves as", "stands as", "boasts" — see writing skill rule #16)
- **No inline-header vertical lists** (rule #17) — LinkedIn's signature AI tell
- **Self-audit pass is mandatory** — DRAFT → still-AI bullets → FINAL
- **Use contractions** naturally
- **Specificity wins** — data, outcomes, real examples
- **Personal stories outperform generic advice** on LinkedIn
- Follow current LinkedIn algorithm priorities from the reference file
