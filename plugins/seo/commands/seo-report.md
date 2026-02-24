---
description: Analyze SEO data from automated scripts or manual export
argument-hint: <domain or data path>
---

**First**: Use the `seo` skill for core philosophy and ranking factor priorities.

Analyze SEO data and produce actionable recommendations. Consult `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/ranking-factors.md` for severity calibration.

## Data Sources

Reports are read from `data/seo/` directory, organized by date:

```
data/seo/
  YYYY-MM-DD/
    keywords.json       (from keyword-research.mjs)
    backlinks.json      (from competitor-backlinks.mjs)
    gsc-report.json     (from gsc-report.mjs)
```

If no files exist, ask the user to paste their data directly.

## Process

### Step 1: Locate Data

Check for the most recent report directory. If a previous period exists, load both for comparison.

### Step 2: GSC Analysis

From `gsc-report.json`, identify:

- **Winners** — Position improved 3+ spots (double down with internal links and content updates)
- **Losers** — Position dropped 3+ spots (investigate: competitor content? lost backlink?)
- **Quick Wins** — Position 8-15, on the edge of page 1 (optimize title tag, add internal links, update content)
- **CTR Opportunities** — High impressions, CTR below 2% (rewrite title tag and meta description)

### Step 3: Keyword Analysis

From `keywords.json`, identify: high volume + low competition not yet targeted, long-tail variations, new keyword clusters, high CPC signals (commercial intent).

### Step 4: Backlink Analysis

From `backlinks.json`, identify: highest DR opportunities, content type patterns, overlap targets (2+ competitors), fresh opportunities from past 7 days.

### Step 5: Cross-Reference

| Signal | Action |
|--------|--------|
| Quick-win keyword + competitor has backlinks for it | Prioritize link building for this keyword |
| Losing keyword + competitor gained new backlink | Match their link |
| High-volume keyword + no content yet | Create content brief (use `/seo-brief`) |
| CTR opportunity + high CPC | High-value title tag rewrite — do this first |

### Step 6: Produce Action Plan

## Output

```
## This Week's SEO Actions

### Critical (do now)
1. [action] — [reason] — [expected impact]

### High Priority (this week)
2. [action] — [reason]
3. [action] — [reason]

### Queue (next week)
4. [action] — [reason]
5. [action] — [reason]
```

Lead with the action plan. Follow with supporting data. Keep it concise.
