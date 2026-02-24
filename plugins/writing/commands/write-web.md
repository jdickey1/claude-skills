---
description: Write website copy or a blog post
argument-hint: <topic, page type, or keyword>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write website copy or a blog post for the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user what they need.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/web-copy.md` for web writing optimization
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for headline formulas
3. If SEO matters, also use the `seo` skill for on-page optimization principles
4. Write 5+ headline candidates first, select the best
5. Draft the content following web copy structure from the reference
6. Apply the pre-publish checklist from the writing skill

## Key Rules

- **Headline first** — write 5+ candidates before selecting (80% of the work)
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **Scannable structure** — short paragraphs, clear H2/H3 headers, bullet points
- **Evidence after claims** — every assertion backed within 1-2 sentences
- **CTAs are clear and specific** — not just "learn more"
- **SEO-friendly** if applicable — keyword in H1, meta title, meta description
- Follow web copy best practices from the reference file
