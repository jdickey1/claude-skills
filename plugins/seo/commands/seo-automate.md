---
description: Set up DIY SEO automation scripts to replace agency work
---

**First**: Use the `seo` skill for core philosophy.

Set up the DIY SEO automation system. Read `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/automation.md` for full scripts, prompts, and templates.

## Prerequisites

- A VPS or machine for cron jobs (or GitHub Actions)
- Node.js / Bun runtime
- API keys (see below)

## Step 1: Get API Access

| Service | Sign Up | Cost | Purpose |
|---------|---------|------|---------|
| Keywords Everywhere | keywordseverywhere.com/api | $10/mo | Keyword research |
| DataForSEO | dataforseo.com | ~$30/mo | Backlinks + keyword discovery + SERP clustering |
| Serper | serper.dev | $10-50/mo | SERP data for content briefs |
| Google Search Console | search.google.com/search-console | Free | Performance monitoring |

Store credentials as environment variables (see `${CLAUDE_PLUGIN_ROOT}/skills/seo/Tools/.env.example`).

## Step 2: Deploy Scripts

1. Copy scripts from `${CLAUDE_PLUGIN_ROOT}/skills/seo/Tools/` to your server
2. Copy `seo-profile.example.json` to `seo-profile.json` in your project root and fill in your business details
3. Run `node validate-profile.mjs` to verify your profile
4. Test each script manually first

## Step 3: Set Up Cron Schedule

```bash
crontab -e

# Add these:
0 9 * * 1 node /scripts/keyword-research.mjs
0 9 * * 1 node /scripts/gsc-report.mjs
0 9 * * 3 node /scripts/competitor-backlinks.mjs
0 10 * * 3,5 node /scripts/backlink-outreach.mjs

# Keyword Universe Pipeline (run in sequence)
0 9 * * 1 node /scripts/keyword-universe.mjs
0 10 * * 1 node /scripts/keyword-cluster.mjs
```

## Step 4: Set Up Output Delivery

Options: email digest, Slack webhook, file output, or dashboard.

## Keyword Universe Pipeline

The Keyword Universe pipeline automates keyword discovery, business-relevance scoring, and SERP-based topic clustering. Run the scripts in order:

1. **`keyword-universe.mjs`** — Expands seed keywords via DataforSEO Keyword Ideas endpoint, scores by business relevance, outputs `keyword-universe-filtered.json` (~$2-3 for 5K keywords)
2. **`keyword-cluster.mjs`** — Fetches top 10 SERPs per keyword, clusters via Jaccard similarity (default threshold 0.6), outputs `clusters.json` with page mapping recommendations (~$1-3 for 500 keywords)

**Cost**: ~$6-8/month total for a 5K keyword universe refresh.

**Flags**:
- `--profile path` — custom seo-profile.json location
- `--max-keywords N` — cap keywords before SERP fetching (default 500)
- `--threshold N` — Jaccard threshold for clustering (default 0.6)
- `--force` — proceed even if estimated cost exceeds $5

**Workflow**: Review `clusters.json` → pick a cluster → run `/seo-brief "primary keyword"` to generate a content brief.

## Step 5: Weekly Review Ritual

Every Monday, review:
1. Keyword Universe clusters — any new topic opportunities?
2. GSC report — winners, losers, quick wins
3. Backlink opportunities — who to pitch this week
4. Generate content briefs for priority cluster keywords (use `/seo-brief`)

## Validation Checklist

- [ ] All 4 API keys configured and tested
- [ ] Each script runs successfully standalone
- [ ] Cron jobs scheduled and verified
- [ ] Output delivery method working
- [ ] Seed keywords customized for your business
- [ ] Competitors list populated
- [ ] GSC property connected
- [ ] Outreach template customized
