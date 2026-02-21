# SEO Report Analysis

Analyze SEO data from automated scripts or manual export. Cross-reference keyword, backlink, and GSC data to produce actionable recommendations.

## Triggers

- "analyze my SEO report"
- "review keyword data"
- "review GSC data"
- "what does my SEO data say"
- "analyze backlink report"
- "SEO report for [domain]"

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

Check for the most recent report directory:
```bash
ls -d data/seo/*/  | sort -r | head -1
```

If a previous period exists, load both for comparison.

### Step 2: GSC Analysis

From `gsc-report.json`, identify:

**Winners** — Position improved 3+ spots vs previous period
- List keyword, old position, new position, change
- Note: these are working — double down with internal links and content updates

**Losers** — Position dropped 3+ spots
- List keyword, old position, new position, change
- Investigate: did a competitor publish new content? Did you lose a backlink?

**Quick Wins** — Currently ranking positions 8-15
- These are on the edge of page 1
- Action: optimize title tag, add internal links, update content freshness

**CTR Opportunities** — High impressions, CTR below 2%
- These get seen but not clicked
- Action: rewrite title tag and meta description

### Step 3: Keyword Analysis

From `keywords.json`, identify:

- **High volume + low competition** keywords not yet targeted
- **Long-tail variations** of your primary keywords
- **New keyword clusters** that suggest content opportunities
- **CPC signals** — high CPC keywords indicate commercial intent (valuable)

### Step 4: Backlink Analysis

From `backlinks.json`, identify:

- **Highest DR opportunities** — sites linking to competitors but not you
- **Content type patterns** — are roundups, guides, or directories most common?
- **Overlap** — sites linking to 2+ competitors (warm targets)
- **Fresh opportunities** — new backlinks from the past 7 days

### Step 5: Cross-Reference

Connect the data sources:

| Signal | Action |
|--------|--------|
| Quick-win keyword + competitor has backlinks for it | Prioritize link building for this keyword |
| Losing keyword + competitor gained new backlink | They outbuilt you — match their link |
| High-volume keyword + no content yet | Create content brief (use ContentBrief workflow) |
| CTR opportunity + high CPC | High-value title tag rewrite — do this first |

### Step 6: Produce Action Plan

Output a prioritized list:

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

## Output Format

- Lead with the action plan (what to do)
- Follow with the supporting data (why)
- Keep it concise — no restating raw data the user already has
- Flag anything that needs the ContentBrief or GBPOptimize workflow
