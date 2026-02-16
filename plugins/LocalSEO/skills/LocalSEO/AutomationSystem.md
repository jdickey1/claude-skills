# DIY SEO Automation System

Replace agency work with automated scripts. 5x the output at ~$75/month in API costs.

## Why Build This

Agencies have structural problems for SEO:
- **Latency is baked in.** Ask Monday, get it Friday.
- **Reports are manual**, so they're infrequent. Monthly when SEO moves constantly.
- **The tool stack is hidden.** They use Ahrefs, Semrush, GSC—same tools you could use.
- **Scope creep pricing.** Want to add a competitor? Change order.

## The Five Components

| Component | Tool | Cost | Frequency |
|-----------|------|------|-----------|
| Keyword Research | Keywords Everywhere API | $10/mo | Weekly (Monday) |
| Competitor Backlinks | DataForSEO API | ~$30/mo | Weekly (Wednesday) |
| GSC Monitoring | Google Search Console API | Free | Weekly (Monday) |
| Content Briefs | Serper API + Claude | ~$10/mo + Claude | On demand |
| Backlink Outreach | Email automation | ~$25/mo | Wed + Fri |

**Total: ~$75/month vs ~$1,500/month agency**

## Component 1: Keyword Research Engine

Takes 10-15 seed keywords, expands to 200-300 variations with volume, CPC, and competition data.

```javascript
#!/usr/bin/env node
// keywords-research.mjs

const API_KEY = process.env.KEYWORDS_EVERYWHERE_API_KEY;
const BASE_URL = 'https://api.keywordseverywhere.com/v1';

const SEED_KEYWORDS = [
  // Replace with your service keywords
  "your service keyword 1",
  "your service keyword 2",
  "your service + city",
];

async function getKeywordData(keywords) {
  const formData = new URLSearchParams();
  formData.append('country', 'us');
  formData.append('currency', 'usd');
  formData.append('dataSource', 'gkp');
  keywords.forEach(kw => formData.append('kw[]', kw));

  const response = await fetch(`${BASE_URL}/get_keyword_data`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });

  return response.json();
}

async function getRelatedKeywords(seed) {
  const formData = new URLSearchParams();
  formData.append('country', 'us');
  formData.append('currency', 'usd');
  formData.append('dataSource', 'gkp');
  formData.append('kw', seed);

  const response = await fetch(`${BASE_URL}/get_related_keywords`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });

  return response.json();
}

async function main() {
  const allKeywords = new Set(SEED_KEYWORDS);

  for (const seed of SEED_KEYWORDS) {
    console.log(`Expanding: ${seed}`);
    const related = await getRelatedKeywords(seed);
    related.data?.forEach(kw => allKeywords.add(kw.keyword));
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  const fullData = await getKeywordData([...allKeywords].slice(0, 100));
  const sorted = fullData.data.sort((a, b) => b.vol - a.vol);

  console.log('\nTOP KEYWORDS BY VOLUME:\n');
  sorted.slice(0, 30).forEach(kw => {
    console.log(`${kw.keyword.padEnd(40)} | Vol: ${kw.vol} | CPC: ${kw.cpc?.value || '—'}`);
  });
}

main();
```

**Time saved:** ~4 hours/month of back-and-forth with agency.

## Component 2: Competitor Backlink Intelligence

Tracks 5 competitors. Every week, pulls their newest backlinks and finds opportunities. When a competitor gets featured on a high-DA site, you know within 7 days and can pitch the same site.

```javascript
#!/usr/bin/env node
// competitor-backlink-recon.mjs

const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH; // Base64 encoded login:password

const COMPETITORS = [
  'competitor1.com',
  'competitor2.com',
  'competitor3.com',
  'competitor4.com',
  'competitor5.com'
];

const SKIP_DOMAINS = [
  'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com',
  'g2.com', 'capterra.com', 'trustpilot.com', 'crunchbase.com'
];

async function getBacklinks(domain, limit = 100) {
  const response = await fetch('https://api.dataforseo.com/v3/backlinks/backlinks/live', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${DATAFORSEO_AUTH}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      target: domain,
      limit: limit,
      mode: 'as_is',
      filters: [
        ['dofollow', '=', true],
        'and',
        ['domain_from_rank', '>', 20]
      ],
      order_by: ['domain_from_rank,desc']
    }])
  });

  const data = await response.json();
  return data.tasks?.[0]?.result?.[0]?.items || [];
}

function filterBacklinks(backlinks) {
  return backlinks.filter(bl => {
    const domain = bl.domain_from;
    if (SKIP_DOMAINS.some(d => domain.includes(d))) return false;
    const url = bl.url_from || '';
    return /\/(blog|post|article|guide|best|top|review)/i.test(url);
  });
}

async function main() {
  const opportunities = [];

  for (const competitor of COMPETITORS) {
    console.log(`Scanning ${competitor}...`);
    const backlinks = await getBacklinks(competitor);
    const filtered = filterBacklinks(backlinks);

    filtered.forEach(bl => {
      opportunities.push({
        competitor,
        domain: bl.domain_from,
        url: bl.url_from,
        domainRank: bl.domain_from_rank,
        anchor: bl.anchor
      });
    });

    await new Promise(r => setTimeout(r, 1000));
  }

  opportunities.sort((a, b) => b.domainRank - a.domainRank);

  console.log('\nTOP BACKLINK OPPORTUNITIES:\n');
  opportunities.slice(0, 20).forEach(opp => {
    console.log(`DR ${opp.domainRank} | ${opp.domain}`);
    console.log(`   URL: ${opp.url}`);
    console.log(`   Links to: ${opp.competitor}\n`);
  });
}

main();
```

**Time saved:** ~6 hours/month of manual prospecting.

## Component 3: Google Search Console Monitoring

Pulls last 28 days, compares to previous period. Identifies winners, losers, quick wins, and CTR opportunities.

```javascript
#!/usr/bin/env node
// gsc-report.mjs

const SITE_URL = 'sc-domain:yourdomain.com';

async function fetchSearchAnalytics(accessToken, days = 28) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3); // GSC data delayed ~3 days
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const fmt = d => d.toISOString().split('T')[0];

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query'],
        rowLimit: 50
      })
    }
  );

  return res.json();
}

// Output: Top queries with clicks, impressions, position
// Winners: Position improved 3+ spots
// Losers: Position dropped 3+ spots
// Quick wins: Position 8-15 (close to page 1)
```

### GSC Analysis Prompt

Pipe the GSC data to Claude with this:

```
Analyze this Google Search Console data for {DOMAIN}:

{GSC_DATA}

Identify:
1. WINNERS: Keywords where position improved 3+ spots vs last period
2. LOSERS: Keywords where position dropped 3+ spots
3. QUICK WINS: Keywords ranking 8-15 that could hit page 1 with optimization
4. CTR OPPORTUNITIES: High impressions, low CTR (title tag candidates)

For each, give specific action items. Be concise.
```

**Time saved:** ~3 hours/week of manual GSC analysis.

## Component 4: Content Brief Generator

Uses Serper API to pull top 10 Google results, then Claude generates a comprehensive brief.

### Content Brief Prompt

```
I need a content brief for the keyword: "{KEYWORD}"

First, here are the top 10 Google results for this keyword:
{SERPER_RESULTS}

Analyze these and create a brief with:

1. RECOMMENDED TITLE OPTIONS (3 options, include the keyword)

2. TARGET WORD COUNT (based on top-ranking content)

3. SEARCH INTENT (informational, transactional, navigational)

4. OUTLINE
   - H1 (title)
   - H2s and H3s that cover the topic comprehensively
   - Include sections competitors have
   - Add 2-3 sections competitors are MISSING (our edge)

5. TOPICS TO COVER (bullet points)

6. INTERNAL LINKING OPPORTUNITIES
   - What existing content should we link TO
   - What existing content should link TO this

7. COMPETITOR GAPS
   - What are the top 3 results missing that we can include?

Be specific. No fluff.
```

**Time saved:** 2 minutes vs 5 days from agency.

## Component 5: Automated Backlink Outreach

Schedule: Wednesday and Friday, 10 AM. 25 emails each = 50/week.

### Outreach Email Template

```
Subject: Quick note about your {ARTICLE_TYPE} on {TOPIC}

Hey {FIRST_NAME},

Just read your piece on {ARTICLE_TITLE} — solid breakdown, especially the section on {SPECIFIC_SECTION}.

I run {YOUR_COMPANY}, and we've {CREDIBILITY_STATEMENT}. Might be a fit for your {best agencies / tools / resources} section.

Quick stats if helpful:
• {STAT_1}
• {STAT_2}
• {STAT_3}

Happy to send more details if you're updating the piece. Either way, nice work on the article.

— {NAME}
```

**Expected rates:** ~12% response rate, ~4% link acquisition rate.
**Time saved:** ~10 hours/month of manual outreach.

## Cron Schedule

```bash
# crontab
0 9 * * 1 node /scripts/keyword-research.mjs      # Monday 9 AM
0 9 * * 1 node /scripts/gsc-report.mjs            # Monday 9 AM
0 9 * * 3 node /scripts/competitor-backlinks.mjs   # Wednesday 9 AM
0 10 * * 3,5 node /scripts/backlink-outreach.mjs   # Wed+Fri 10 AM
```

## When NOT to Build This

- You hate technical work
- Your time is worth more than $1,500/month on SEO
- You need strategic guidance, not just data
- You're scaling fast and need human judgment

## When to Build This

- You're technical or have technical resources
- You're frustrated by agency latency
- You want more frequent data (weekly vs monthly)
- You like building systems that compound

## The Real Secrets

The scripts aren't the secret. What matters:
1. **Systems thinking** to connect everything
2. **Actually maintaining it** over time
3. **Knowing what to do** with the output
