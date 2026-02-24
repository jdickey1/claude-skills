---
name: seo
description: Comprehensive SEO audit, optimization, and automation. USE WHEN audit SEO OR review website SEO OR check GBP OR optimize local search OR technical SEO OR on-page optimization OR AI search readiness OR content strategy OR link building OR citation building OR keyword research OR backlink analysis OR content brief OR SEO automation OR replace SEO agency OR analyze SEO report OR review GSC data OR weekly SEO tasks.
version: 2.0.0
---

# SEO - Website Audit, Optimization & Automation

Comprehensive SEO framework covering technical foundations, on-page optimization, E-E-A-T, local business SEO, AI search readiness (AEO/GEO), content strategy, link building, and a full DIY automation system.

---

## Audit Philosophy

**Think like a search engine, report like a marketer.**

1. **Start with indexability** — If Google can't find your pages, nothing else matters.
2. **Prioritize buyers over browsers** — Target "service + city" keywords, not "how to" keywords.
3. **Local first** — For local businesses, Google Business Profile is the #1 lever.
4. **Structure for machines** — AI search systems (ChatGPT, Copilot, Gemini, Perplexity) need structured, citable content.
5. **E-E-A-T everywhere** — Trust is the foundation. Untrustworthy pages have low E-E-A-T regardless of other signals.
6. **Prove it with data** — Every finding must reference the specific page, element, or missing item.

---

## Commands

| Command | What it does |
|---------|-------------|
| `/seo-audit <url>` | Run full 4-tier audit |
| `/seo-brief <keyword>` | Create content brief for keyword |
| `/seo-gbp <business>` | Google Business Profile optimization |
| `/seo-weekly` | Weekly recurring SEO tasks |
| `/seo-report` | Analyze GSC/keyword data |
| `/seo-automate` | Set up DIY automation scripts |
| `/teach-seo` | Write SEO context to project CLAUDE.md |

## Reference Files

Deep-dive references loaded on demand by commands:

| File | Contents |
|------|----------|
| `reference/audit-checklist.md` | Full 4-tier audit checklist (~180 items) |
| `reference/ranking-factors.md` | Evidence-based ranking factor priorities, severity calibration, keyword validation |
| `reference/ai-search.md` | AEO/GEO optimization, platform-specific citation data, AI accessibility |
| `reference/local-seo.md` | GBP, citations, NAP, reviews, SABs, Google spam warnings |
| `reference/link-building.md` | Link profile, tactics, local link building, brand signals |
| `reference/automation.md` | Full DIY automation system (~$75/mo replaces ~$1,500/mo agency) |

## Tools

Standalone scripts in `Tools/` for automation. All output JSON to `data/seo/YYYY-MM-DD/`.

| Script | Purpose | Schedule |
|--------|---------|----------|
| `keyword-research.mjs` | Expand seed keywords with volume/CPC data | Monday 9 AM |
| `competitor-backlinks.mjs` | Scan competitor backlinks for opportunities | Wednesday 9 AM |
| `gsc-report.mjs` | GSC data pull with period comparison | Monday 9 AM |
| `content-brief.mjs` | Fetch SERP data and generate brief prompt | On demand |
| `backlink-outreach.mjs` | Generate outreach queue (dry-run by default) | Wed + Fri 10 AM |

---

## DO (Core Principles)

- **Use Playwright** to load and inspect live pages (snapshot, screenshot, evaluate DOM)
- **Use web-reader** (`npx playbooks get <url>`) for content extraction
- **Check source HTML** for meta tags, schema, headers, canonical tags
- **Crawl key pages** — homepage, service pages, location pages, blog (if exists)
- **Verify findings in raw HTML** before marking as CONFIRMED (see Verification Rules below)
- **Weight severity by ranking impact** — consult `reference/ranking-factors.md`
- **Validate keywords** before recommending new pages (5-point methodology)

## DON'T (Critical Mistakes)

- **DON'T conclude something is missing based on content extractors alone** — they strip nav, header, footer
- **DON'T recommend URL restructuring for keyword placement** — negligible ranking benefit, high redirect risk
- **DON'T over-prioritize URL slugs** — INFO severity at most
- **DON'T assign high severity to low-impact factors** — consult ranking-factors.md
- **DON'T create a brief for a keyword nobody searches** — validate first
- **DON'T flag exact-match anchor text as positive** — branded is safer
- **DON'T recommend blog content for local businesses** unless it targets buyer intent

---

## Verification Rules (CRITICAL — Prevents False Findings)

**Content extractors (web-reader, WebFetch) strip structural HTML elements** like navigation, headers, footers, and sticky bars. NEVER conclude something is missing based solely on extracted content.

**For findings about header, nav, footer, or above-the-fold elements** (phone numbers, CTAs, addresses, logos), MUST verify with raw HTML:
```bash
curl -s <url> | grep -oP '.{0,80}(tel:|phone|555|address).{0,80}' | head -10
```

**For findings about `<head>` tags** (hreflang, canonical, OG tags, meta robots, twitter cards), MUST extract the `<head>` block:
```bash
curl -s <url> | sed -n '/<head/,/<\/head>/p' | grep -i 'hreflang\|canonical\|og:\|twitter:\|noindex'
```

**Confidence levels:**
- **CONFIRMED** = Verified via raw HTML source. Only use when you have directly seen the presence or absence.
- **LIKELY** = Inferred from content extraction tools but NOT verified in raw HTML. Default for content extractor findings.
- **NEEDS VERIFICATION** = Conflicting signals or unable to check raw HTML.

---

## Audit Execution Order

1. **Indexation check** — `site:domain.com`, robots.txt, sitemap.xml
2. **Homepage audit** — Meta tags, H1, speed, phone/address visibility, schema
3. **Service page audit** — Keyword targeting, content quality, CTAs, internal links
4. **E-E-A-T check** — Author attribution, credentials, experience signals
5. **GBP review** (local business) — Search for business, check listing completeness
6. **Technical scan** — Mobile, HTTPS, redirects, 404s, Core Web Vitals
7. **Content analysis** — Keyword cannibalization, thin pages, buyer vs browser intent, freshness
8. **Citation check** (local business) — Bing, Apple Maps, Yelp, BBB, YellowPages, Chamber
9. **Schema validation** — Structured data presence and accuracy
10. **AI readiness** — Content structure, extractability, citation optimization
11. **Link profile** — Internal linking, anchor text, homepage link ratio
12. **Competitor comparison** — Category matching, keyword gaps
13. **Report generation** — Compile findings, prioritize, provide action plan

For the full checklist with ~180 items, see `reference/audit-checklist.md`.

---

## Audit Tools

- **Playwright browser tools** — Navigate, snapshot, screenshot, evaluate JavaScript on pages
- **web-reader** — Extract page content as markdown for analysis
- **WebSearch** — Check indexation (`site:domain.com`), search for business name, check competitors
- **WebFetch** — Fetch robots.txt, sitemap.xml, specific URLs

---

## Output Format

### Audit Summary

```
# SEO Audit: [Business Name / Domain]
**Date:** [date]
**Pages Reviewed:** [count]
**Overall Score:** [X/100]

## Score Breakdown
- Indexation & Technical: [X/20]
- On-Page SEO: [X/20]
- E-E-A-T & Authority: [X/15]
- Local SEO / GBP: [X/20]
- Content & Freshness: [X/15]
- AI Search Readiness: [X/10]
```

### Per-Finding Format

```
### [SEVERITY] Finding Title

**Category:** [Checklist reference, e.g., A3 - On-Page SEO]
**Page:** [URL or page description]
**Confidence:** [CONFIRMED / LIKELY / NEEDS VERIFICATION]

**Issue:** What's wrong and why it matters for rankings/visibility.
**Current State:** What's there now.
**Recommendation:** Specific fix with example.
**Impact:** Expected improvement.
```

---

## The Three-Layer Model (SEO + AEO + GEO)

| Layer | What It Means | What to Do |
|-------|--------------|------------|
| **SEO** | Matching keywords | Rank for target queries with optimized pages |
| **AEO** | Descriptive clarity | Make content machine-readable, structured, extractable |
| **GEO** | Justification & trust | Build authority signals AI systems can verify and cite |

SEO is the foundation. AEO drives understanding. GEO drives confidence. You need all three to be recommended by AI search. See `reference/ai-search.md` for full details.

---

## Supporting References

- **Google Search Central:** https://developers.google.com/search
- **Google Business Profile Help:** https://support.google.com/business
- **Schema.org:** https://schema.org
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Markup Validator:** https://validator.schema.org
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **Bing Places for Business:** https://www.bingplaces.com
- **Apple Business Connect:** https://businessconnect.apple.com
- **PageSpeed Insights:** https://pagespeed.web.dev
- **Whitespark Local Ranking Factors:** https://whitespark.ca/local-search-ranking-factors/
