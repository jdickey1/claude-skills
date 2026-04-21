---
description: Run weekly recurring SEO maintenance tasks
---

**First**: Use the `seo` skill for core philosophy and ongoing habit principles.

Run the weekly SEO maintenance checklist. Consult `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/local-seo.md` for GBP-specific guidance.

## Weekly Checklist

### GBP (Google Business Profile)
- [ ] Upload a new photo to GBP
- [ ] Post a GBP update with keyword + city name
- [ ] Respond to any new reviews (should be within 24 hours, but catch stragglers here)

### Website Health
- [ ] Check for 404 errors (use Google Search Console or crawl tool)
- [ ] Verify key pages are still indexed (`site:domain.com/page`)

### Reviews
- [ ] Confirm review requests went out to recent customers
- [ ] Check review count trend (are you gaining?)

### Link Building
- [ ] Identify one link building opportunity (local directory, partner, sponsor, press)
- [ ] Focus links to homepage (80-90% of all links)
- [ ] Use branded anchor text

## Monthly Additions

- [ ] Full indexing check across all important pages
- [ ] Citation audit (NAP consistency across Yelp, BBB, YellowPages, etc.)
- [ ] Competitor category check (are the top 3 above you still using the same category?)
- [ ] Review GBP insights for trends

## Quarterly AEO Citation Audit Check

AI citation patterns shift on a months-not-days cadence (Profound tracked LinkedIn climbing 11th → 5th on ChatGPT over 90 days). Weekly AEO audits add noise without signal — quarterly is the right frequency.

- [ ] **Has it been 90+ days since the last AEO citation audit for any target project?** If yes, invoke `/seo:seo-aeo --audit <project-domain-or-name>` for that project.
- [ ] When run, the audit produces a per-platform citation-presence matrix and is saved to `01-Projects/<Project>/aeo-citation-audit-YYYY-QN.md` for trend comparison against prior quarters.

See `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/aeo.md` → "Quarterly Citation Audit Protocol" for the query-panel design, scoring rubric, and note template.

## Tracking

Keep a simple log:
| Week | Photos | Updates | Reviews Asked | Reviews Received | 404s Fixed | Links Built |
|------|--------|---------|---------------|------------------|------------|-------------|
| W1   |        |         |               |                  |            |             |
| W2   |        |         |               |                  |            |             |

Do all of this consistently for **6 months** and you will not recognize your business. There are no shortcuts. Consistency is the strategy.
