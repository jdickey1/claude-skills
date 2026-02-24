---
description: Write email or newsletter content
argument-hint: <topic or audience>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write newsletter or email content for the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user about the email's purpose and audience.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for subject line formulas (2-4 words optimal for email)
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/persuasion-frameworks.md` for email structure options
3. Write 5+ subject line candidates first
4. Draft the email body
5. Apply the pre-publish checklist from the writing skill

## Key Rules

- **Subject line is everything** — 2-4 words optimal for email open rates
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **Use contractions** — formal email is dead
- **One CTA per email** — don't split attention
- **Specificity wins** — "3 things I learned" beats "some thoughts on"
- **Short paragraphs** — 1-3 sentences max, lots of white space
- **Preview text matters** — first 40-90 chars visible in inbox alongside subject
- Use PAS (Problem-Agitate-Solve) or BAB (Before-After-Bridge) for persuasive emails
