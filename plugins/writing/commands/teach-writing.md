---
description: Gather voice and brand context, write to CLAUDE.md for future writing tasks
---

**First**: Use the `writing` skill for core principles.

Gather project-specific voice and brand context and write it to the project's CLAUDE.md file so all future writing tasks have the right context automatically.

## What to Gather

Ask the user for each of these (skip any they don't have):

1. **Brand personality** — 3 words that describe the voice (e.g., "authoritative, conversational, contrarian")
2. **Target audience** — who reads this content? (e.g., "Texas policy professionals and business leaders")
3. **Voice references** — people, publications, or brands that sound right (e.g., "Matt Levine meets Texas Monthly")
4. **Anti-references** — what it should NOT sound like (e.g., "corporate press releases, generic LinkedIn thought leadership")
5. **Preferred platforms** — X, LinkedIn, web, email, newsletter, podcast scripts
6. **Any existing style rules** — word preferences, formatting conventions, etc.
7. **Content goals** — thought leadership, lead gen, community building, etc.

## What to Write

Write a `## Writing Context` section to the project's CLAUDE.md:

```markdown
## Writing Context

- **Voice:** [3 personality words]
- **Audience:** [target reader description]
- **Sounds like:** [voice references]
- **Does NOT sound like:** [anti-references]
- **Platforms:** [preferred platforms]
- **Goals:** [content goals]
- **Style rules:** [any specific conventions]
```

## Rules

- If the project CLAUDE.md already has a `## Writing Context` section, update it rather than duplicating
- Keep the section concise — this is context for future commands, not a brand guide
- After writing, confirm what was saved and suggest trying `/write-x` or `/write-linkedin` as next steps
