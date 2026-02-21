# SEO Automation Setup

Step-by-step guide to replace agency SEO work with automated scripts.

Refer to `AutomationSystem.md` for full scripts, prompts, and templates.

## Prerequisites

- A VPS or machine for cron jobs (or GitHub Actions)
- Node.js / Bun runtime
- API keys (see below)

## Step 1: Get API Access

| Service | Sign Up | Cost | Purpose |
|---------|---------|------|---------|
| Keywords Everywhere | keywordseverywhere.com/api | $10/mo | Keyword research |
| DataForSEO | dataforseo.com | ~$30/mo | Backlink analysis |
| Serper | serper.dev | $10-50/mo | SERP data for content briefs |
| Google Search Console | search.google.com/search-console | Free | Performance monitoring |

Store credentials as environment variables:
```bash
export KEYWORDS_EVERYWHERE_API_KEY="your-key"
export DATAFORSEO_AUTH="base64-encoded-login:password"
export SERPER_API_KEY="your-key"
```

## Step 2: Deploy Scripts

1. Copy scripts from `AutomationSystem.md` to your server
2. Test each one manually first
3. Customize:
   - `SEED_KEYWORDS` - your service + city keywords
   - `COMPETITORS` - your top 5 competitors
   - `SITE_URL` - your GSC property
   - Email template - your company details and stats

## Step 3: Set Up Cron Schedule

```bash
crontab -e

# Add these:
0 9 * * 1 node /scripts/keyword-research.mjs
0 9 * * 1 node /scripts/gsc-report.mjs
0 9 * * 3 node /scripts/competitor-backlinks.mjs
0 10 * * 3,5 node /scripts/backlink-outreach.mjs
```

## Step 4: Set Up Output Delivery

Options:
- **Email digest** - Pipe script output to email
- **Slack webhook** - Post results to a channel
- **File output** - Save to a shared folder for review
- **Dashboard** - Build a simple web UI (overkill for most)

## Step 5: Weekly Review Ritual

Every Monday, review:
1. Keyword research output - any new opportunities?
2. GSC report - winners, losers, quick wins
3. Backlink opportunities - who to pitch this week
4. Generate content briefs for priority keywords

## Validation Checklist

- [ ] All 4 API keys configured and tested
- [ ] Each script runs successfully standalone
- [ ] Cron jobs scheduled and verified
- [ ] Output delivery method working
- [ ] Seed keywords customized for your business
- [ ] Competitors list populated
- [ ] GSC property connected
- [ ] Outreach template customized
