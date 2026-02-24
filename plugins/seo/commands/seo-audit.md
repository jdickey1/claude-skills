---
description: Run a full 4-tier SEO audit on a website
argument-hint: <url>
---

**First**: Use the `seo` skill for core philosophy, verification rules, and audit execution methodology.

Run a comprehensive SEO audit on the provided URL (`$ARGUMENTS`). If no URL is provided, ask the user for a target website.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/audit-checklist.md` for the full 4-tier checklist
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/ranking-factors.md` for severity calibration
3. Follow the audit execution order from the checklist (13 steps)
4. For local businesses, also consult `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/local-seo.md`
5. For AI search readiness, consult `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/ai-search.md`

## Critical Rules

- Use Playwright to inspect live pages (snapshot, screenshot, evaluate DOM)
- Use `npx playbooks get <url>` for content extraction
- **Verify structural findings in raw HTML** before marking as CONFIRMED (see skill verification rules)
- Validate keywords before recommending new pages (5-point methodology in checklist)
- Weight severity by actual ranking impact (see ranking-factors.md)

## Output

Use the audit summary and per-finding format from the checklist. Score out of 100 with breakdown by category.
