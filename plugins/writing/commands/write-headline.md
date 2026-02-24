---
description: Generate 5+ headline candidates with formulas and testing methodology
argument-hint: <topic or content summary>
---

**First**: Use the `writing` skill for universal rules and headline principles (Rule #9).

Generate headline candidates for the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user what the content is about.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for the full headline research and formulas
2. Generate **at least 5 headline candidates** using different formulas from the reference
3. Score each against the headline criteria
4. Recommend the top 1-2 with rationale
5. Note which formula each headline uses

## Key Rules

- **80% of readers never get past the headline** — this is the most important part of any content
- **Use numbers** (+36% engagement), **brackets** (+40% CTR), **specificity** (+321% conversion)
- **Test headline length for channel:** 6 words general, 8 words landing pages, 2-4 words email
- **Negative superlatives** ("worst," "never") outperform positive by 30%
- **Front-load the keyword** if SEO matters
- **No AI buzzwords** in headlines
- Generate variety: informational, emotional, curiosity-gap, contrarian, data-driven
