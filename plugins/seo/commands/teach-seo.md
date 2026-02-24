---
description: Gather site context and write SEO configuration to CLAUDE.md
argument-hint: <website url>
---

**First**: Use the `seo` skill for core philosophy.

Gather project-specific SEO context and write it to the project's CLAUDE.md file so all future SEO work has the right context automatically.

## What to Gather

Ask the user for each of these (skip any they don't have):

1. **Target website URL and domain** — the site being optimized
2. **Primary service/product keywords** — top 3-5 keywords they want to rank for
3. **Service area** — city, state, region (for local businesses)
4. **Top 3-5 competitors** — domains that rank above them
5. **Google Business Profile status** — claimed? verified? URL?
6. **Current analytics access** — Google Search Console property, GA4 property
7. **Business type** — local business, e-commerce, SaaS, content site, etc.
8. **Current SEO pain points** — what's not working, what they've tried

## What to Write

Write an `## SEO Context` section to the project's CLAUDE.md with this format:

```markdown
## SEO Context

- **Domain:** example.com
- **Business type:** Local service business
- **Primary keywords:** keyword 1, keyword 2, keyword 3
- **Service area:** Austin, TX metro
- **Competitors:** competitor1.com, competitor2.com, competitor3.com
- **GBP:** [claimed/verified/not set up] — [URL if available]
- **GSC property:** sc-domain:example.com
- **GA4 property:** [property ID if available]
- **Notes:** [any specific context, pain points, or constraints]
```

## Rules

- If the project CLAUDE.md already has an `## SEO Context` section, update it rather than duplicating
- Keep the section concise — this is context for future commands, not an audit
- After writing, confirm what was saved and suggest running `/seo-audit` as the next step
