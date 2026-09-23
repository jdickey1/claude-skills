---
description: Write email or newsletter content
argument-hint: <topic or audience>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write newsletter or email content for the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user about the email's purpose and audience.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for subject lines. Length depends on the mail: 2-4 words is a cold-outbound open-rate result, not the rule for a briefing.
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/newsletters.md` before drafting a briefing. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/persuasion-frameworks.md` when the email is one offer.
3. Write 5+ subject line candidates first
4. Draft the email body
5. **Run the mandatory self-audit pass** on the draft body (writing skill: "Self-Audit Pass" section). Output 2–4 honest "still-AI" bullets, then revise to a FINAL version. Newsletters under any brand (Hyperscale, JD Key, Winning on Issues, etc.) are mandatory; do not skip.
6. Apply the pre-publish checklist from the writing skill against the FINAL version

## Key Rules

- **Subject line is everything.** Name the fact. Front-load the number and the actor. Do not cut a briefing subject down to 2-4 words. That length is for cold outbound email. See headlines.md.
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **No copula avoidance** ("serves as", "stands as", "boasts" — see writing skill rule #16)
- **No inline-header vertical lists** where the bold label just restates the line (rule #17) — the #1 newsletter AI tell
- **Self-audit pass is mandatory** — DRAFT → still-AI bullets → FINAL
- **Use contractions** — formal email is dead
- **One ask.** A promo email gets one CTA. A news briefing's ask is the decision in the lead. Don't add a second offer. See newsletters.md.
- **Specificity wins** — "3 things I learned" beats "some thoughts on"
- **Short paragraphs** — 1-3 sentences max, lots of white space
- **Preview text matters** — first 40-90 chars visible in inbox alongside subject
- Use PAS (Problem-Agitate-Solve) or BAB (Before-After-Bridge) for persuasive emails
