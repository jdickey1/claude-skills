---
name: seo
description: Comprehensive SEO audit, optimization, and automation. USE WHEN audit SEO OR review website SEO OR check GBP OR optimize local search OR technical SEO OR on-page optimization OR AI search readiness OR content strategy OR link building OR citation building OR keyword research OR backlink analysis OR content brief OR SEO automation OR replace SEO agency OR analyze SEO report OR review GSC data OR weekly SEO tasks.
---

# SEO - Website Audit, Optimization & Automation

Comprehensive SEO framework covering technical foundations, on-page optimization, E-E-A-T, local business SEO, AI search readiness (AEO/GEO), content strategy, link building, and a full DIY automation system. Inspects live pages using Playwright, checks source code, and evaluates against modern search best practices.

---

## Audit Philosophy

**Think like a search engine, report like a marketer.**

1. **Start with indexability** - If Google can't find your pages, nothing else matters.
2. **Prioritize buyers over browsers** - Target "service + city" keywords, not "how to" keywords.
3. **Local first** - For local businesses, Google Business Profile is the #1 lever.
4. **Structure for machines** - AI search systems (ChatGPT, Copilot, Gemini, Perplexity) need structured, citable content.
5. **E-E-A-T everywhere** - Experience, Expertise, Authoritativeness, Trustworthiness. Trust is the foundation — untrustworthy pages have low E-E-A-T regardless of other signals.
6. **Prove it with data** - Every finding must reference the specific page, element, or missing item.

---

## Reference Files

- **`AutomationSystem.md`** - Full DIY automation system with prompts and templates. Keyword research, backlink recon, GSC monitoring, content briefs, and outreach automation. ~$75/month replaces ~$1,500/month agency.
- **`Tools/`** - Production-ready scripts with error handling, retry logic, JSON output, and logging. See `Tools/.env.example` for configuration.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **FullAudit** | "audit SEO for [site]", "full SEO check" | `Workflows/FullAudit.md` |
| **GBPOptimize** | "check my GBP", "optimize Google Business Profile" | `Workflows/GBPOptimize.md` |
| **WeeklyMaintenance** | "weekly SEO tasks", "SEO maintenance" | `Workflows/WeeklyMaintenance.md` |
| **AutomationSetup** | "set up SEO automation", "replace SEO agency", "DIY SEO scripts" | `Workflows/AutomationSetup.md` |
| **ContentBrief** | "create content brief for [keyword]", "brief me on [topic]" | `Workflows/ContentBrief.md` |
| **ReportAnalysis** | "analyze SEO report", "review keyword data", "review GSC data" | `Workflows/ReportAnalysis.md` |

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

## Audit Execution

### How to Run an Audit

1. **Get the target URL** from the user (homepage or specific pages)
2. **Use Playwright** to load and inspect pages (snapshot, screenshot, evaluate DOM)
3. **Use web-reader skill** (`npx playbooks get <url>`) for content extraction
4. **Check source HTML** for meta tags, schema, headers, canonical tags
5. **Crawl key pages** - homepage, service pages, location pages, blog (if exists)
6. **Check Google Business Profile** if applicable (search for business name)
7. **Compile findings** using the output format below

### Audit Tools

- **Playwright browser tools** - Navigate, snapshot, screenshot, evaluate JavaScript on pages
- **web-reader** - Extract page content as markdown for analysis
- **WebSearch** - Check indexation (`site:domain.com`), search for business name, check competitors
- **WebFetch** - Fetch robots.txt, sitemap.xml, specific URLs

### Audit Execution Order

1. **Indexation check** - `site:domain.com`, robots.txt, sitemap.xml
2. **Homepage audit** - Meta tags, H1, speed, phone/address visibility, schema
3. **Service page audit** - Keyword targeting, content quality, CTAs, internal links
4. **E-E-A-T check** - Author attribution, credentials, experience signals
5. **GBP review** (local business) - Search for business, check listing completeness
6. **Technical scan** - Mobile, HTTPS, redirects, 404s, Core Web Vitals
7. **Content analysis** - Keyword cannibalization, thin pages, buyer vs browser intent, freshness
8. **Citation check** (local business) - Bing, Apple Maps, Yelp, BBB, YellowPages, Chamber
9. **Schema validation** - Structured data presence and accuracy
10. **AI readiness** - Content structure, extractability, citation optimization
11. **Link profile** - Internal linking, anchor text, homepage link ratio
12. **Competitor comparison** - Category matching, keyword gaps
13. **Report generation** - Compile findings, prioritize, provide action plan

---

## Audit Checklist

### TIER 1: CRITICAL (Audit First)

#### A1 - Indexation & Crawlability
- [ ] Site is indexed (`site:domain.com` returns results)
- [ ] robots.txt exists and is not blocking important pages
- [ ] XML sitemap exists and is accessible (`/sitemap.xml`)
- [ ] Sitemap contains only canonical, 200-status, indexable URLs (no redirects, soft-404s, or blocked URLs)
- [ ] Sitemap is referenced in robots.txt
- [ ] No accidental `noindex` tags on important pages
- [ ] Canonical tags present and correct (no self-referencing errors)
- [ ] No duplicate pages targeting the same keyword (Google will rank neither)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] 404 errors checked (broken links, missing pages)
- [ ] Redirect chains (no chain > 2 hops)
- [ ] All important pages within 3-4 clicks of homepage (crawl depth)

#### A2 - Page Speed & Core Web Vitals
- [ ] **LCP (Largest Contentful Paint)** under 2.5 seconds
- [ ] **INP (Interaction to Next Paint)** under 200 milliseconds (replaced FID in 2024)
- [ ] **CLS (Cumulative Layout Shift)** under 0.1
- [ ] Images are optimized (WebP/AVIF, lazy loading, proper dimensions)
- [ ] No render-blocking resources above the fold
- [ ] Mobile responsive (viewport meta tag, responsive layout)
- [ ] Font loading strategy (font-display: swap or optional)
- [ ] Content parity between mobile and desktop (Google indexes mobile version exclusively)

#### A3 - On-Page SEO Fundamentals
- [ ] Meta title exists, unique per page, 50-60 characters
- [ ] **Keyword is front-loaded in meta title** (most important word first)
- [ ] Meta description exists, unique per page, 140-160 characters
- [ ] Meta description includes a call to action or value proposition
- [ ] One H1 tag per page (not zero, not multiple)
- [ ] Header hierarchy is logical (H1 > H2 > H3, no skipped levels)
- [ ] Headings are descriptive (not vague labels like "Introduction")
- [ ] **URL slugs are clean and readable** (human trust and CTR, not keyword stuffing — Google's John Mueller confirms keywords in URLs are a "very lightweight" factor; Backlinko data shows near-zero ranking correlation)
- [ ] **Do NOT recommend URL restructuring for keyword placement** — the redirect risk and broken link cost outweigh the negligible ranking benefit. Only flag URLs that are genuinely unreadable (random IDs, `/page-3` style)
- [ ] Image alt text is descriptive (not empty, not keyword-stuffed)
- [ ] Internal linking between related pages with descriptive anchor text (not "click here")
- [ ] External links to authoritative sources where relevant

#### A4 - E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- [ ] **Author attribution** on content (byline with name, not anonymous)
- [ ] **Author page** exists with credentials, bio, photo, and links to other work
- [ ] Author schema (`Person` type with `jobTitle`, `sameAs` links to profiles)
- [ ] **First-hand experience** demonstrated in content (not generic advice)
- [ ] Clear "About" page with company credentials, history, team
- [ ] **Trust signals visible** — certifications, awards, professional memberships, years in business
- [ ] Transparent sourcing — claims backed by data, citations, or attributable expertise
- [ ] No exaggerated or unverifiable claims
- [ ] **Consistent author/brand identity** across website, LinkedIn, social profiles, directories

#### A5 - Contact & Conversion
- [ ] Clear calls-to-action on every service page
- [ ] Contact page exists with full business information
- [ ] Contact form works and is easy to find

##### Local Business
- [ ] **Phone number visible above the fold** (no scrolling required)
- [ ] Phone number is clickable (`tel:` link) on mobile
- [ ] **Physical address in website footer** on every page
- [ ] NAP (Name, Address, Phone) is consistent across all pages
- [ ] **H1 includes primary keyword AND city/location**
- [ ] Content targets "service + city" keywords, not informational "how to" queries

### TIER 2: HIGH PRIORITY

#### B1 - Google Business Profile (Local Business)
- [ ] GBP exists and is claimed/verified
- [ ] Business name matches website exactly (no keyword stuffing in business name)
- [ ] **Business category matches top 3 competitors ranking above you**
- [ ] Address and phone match website NAP exactly
- [ ] **GBP links to location/service page, NOT homepage** (unless single-location)
- [ ] Business hours are current and accurate
- [ ] Business description is filled out with keywords naturally
- [ ] **Products/Services section filled out** (even for service businesses)
- [ ] Q&A section has owner-generated questions and answers
- [ ] **Photos uploaded regularly** (target: new photo every week)
- [ ] **GBP posts include keyword AND location** in every update (2-3 posts/week ideal)
- [ ] Reviews being actively collected (ask every customer — systematize with follow-up emails, QR codes, SMS)
- [ ] **Reviews responded to within 24 hours** (every single one)
- [ ] **Review velocity maintained** — consistent new reviews matter more than total count. Review velocity is a live ranking signal; rankings drop when generation stops.
- [ ] Attributes filled out (accessibility, amenities, etc.)

##### Service Area Businesses (SABs)
- [ ] Service areas defined precisely (20 zip codes/cities you actually serve)
- [ ] Business address hidden from public if home-based
- [ ] Unique service area pages per major city (not city-name swaps)

#### B2 - Structured Data / Schema Markup
All schema should use **JSON-LD format** (Google recommended, AI-universal).

- [ ] LocalBusiness or Organization schema on homepage (use specific subtype: `Plumber`, `Attorney`, etc.)
- [ ] Schema includes: name, address, phone, hours, geo coordinates
- [ ] **Person schema for authors** with `jobTitle`, `sameAs` links to LinkedIn/profiles
- [ ] BreadcrumbList schema for navigation
- [ ] Service schema on service pages
- [ ] FAQ schema on pages with FAQs (enables rich results and AI extraction)
- [ ] Review/AggregateRating schema (if reviews on site)
- [ ] Product schema (for product pages)
- [ ] Article schema (for blog/content pages) with `author`, `datePublished`, `dateModified`
- [ ] Schema validates in Google Rich Results Test
- [ ] **Content with schema is 2.3-2.5x more likely to appear in AI-generated answers**

#### B3 - Citations & Directory Listings (Local Business)
Citations have shifted from "ranking fuel" to **verification layer** — businesses with consistent citations perform 18x stronger in local search. For AI search, 3 of top 4 visibility factors are citation-related (Whitespark 2026).

- [ ] **Listed on Bing Places** (LLMs pull from Bing — critical for ChatGPT visibility)
- [ ] **Listed on Apple Business Connect** (Siri integration — 86.5M US users)
- [ ] Listed on Yelp with complete profile
- [ ] Listed on BBB (Better Business Bureau)
- [ ] Listed on YellowPages
- [ ] Listed on local Chamber of Commerce
- [ ] Listed on industry-specific directories (highest value tier)
- [ ] Pursue "Best of" lists and awards (expert-curated lists are #1 AI citation factor)
- [ ] NAP is identical across all citations (exact match, no variations)
- [ ] No duplicate listings on any platform

#### B4 - Content Strategy
- [ ] Each service has its own dedicated page
- [ ] Service pages have unique, substantial content (2,500+ words outranks thin competitors)
- [ ] **No two pages target the same keyword** (cannibalization check)
- [ ] Content speaks to buyers, not browsers
- [ ] Testimonials/social proof on service pages
- [ ] Case studies or portfolio examples where applicable
- [ ] FAQ content answers real customer questions (natural language for voice search)
- [ ] **Content updated meaningfully on a quarterly cycle** — new data, examples, insights. Timestamp-only updates provide minimal benefit (+12%); meaningful updates provide +71% citation lift.
- [ ] **Content demonstrates first-hand experience** (E-E-A-T "Experience" — unique insights, not generic advice)

##### Local Business
- [ ] **Service pages target "service + city" keywords** (not "how to" keywords)
- [ ] **No generic blog posts** unless they target buyer intent
- [ ] **No thin city pages** with keyword swaps (Google spam updates target these)
- [ ] Service area pages have unique content per location (local testimonials, city-specific details, local photos)

### TIER 3: AI SEARCH OPTIMIZATION (AEO/GEO)

AI Overviews now appear in 16% of Google desktop searches. 65%+ of searches end without a click. Being cited in AI answers is the new competitive advantage.

#### C1 - AI Search Readiness (Answer Engine Optimization)
- [ ] **Answer-first layout** — Direct answer in first 40-60 words, then supporting context. 44% of AI citations come from the first 30% of content.
- [ ] **Self-contained answer blocks** of 134-167 words that fully answer a query without external context
- [ ] Content is structured in clear, extractable blocks (not walls of text)
- [ ] Headings mirror real questions people ask
- [ ] Q&A sections use natural language questions
- [ ] **Tables and comparison matrices** — increase AI citation rates 2.5-2.8x vs text-only
- [ ] **Numbered/bulleted lists** — listicles account for 50% of top AI citations
- [ ] Content clearly states: who it's for, what problem it solves, why it's better
- [ ] Comparison content exists (vs competitors, vs alternatives)
- [ ] Modular content blocks that AI can cite independently
- [ ] **Original data, statistics, or research** — pages with original data earn 4.1x more AI citations

#### C2 - Generative Engine Optimization (GEO)
- [ ] Brand mentions on authoritative third-party sites
- [ ] **Third-party review profiles** — presence on Trustpilot, G2, Capterra, Yelp increases citation probability 3x
- [ ] Expert reviews or press mentions exist
- [ ] Verified reviews with volume (not just rating)
- [ ] Consistent brand voice across all content
- [ ] No exaggerated or unverifiable claims
- [ ] **Author attribution with visible credentials** on all content (author identity is a direct input to Google's quality models)
- [ ] Content includes data, statistics, or original research
- [ ] **Definitive language** — AI systems prefer "X is true" over "X might be true"

#### C3 - Technical AI Accessibility
- [ ] Content is in HTML (not trapped in JavaScript-only rendering)
- [ ] No cloaking (same content served to bots and users)
- [ ] Clean HTML structure (semantic elements: article, section, nav, main)
- [ ] Structured data is comprehensive and accurate
- [ ] Site loads without JavaScript (SSR/SSG preferred for key content)
- [ ] Descriptive image alt text (AI can't see images without it)
- [ ] **AI crawler governance** — review robots.txt for AI crawlers (GPTBot, ClaudeBot, PerplexityBot). Allow retrieval-oriented bots for visibility; block training-only bots if desired.

#### C4 - Multi-Platform AI Visibility
- [ ] **Bing optimized** — ChatGPT uses Bing's index. If you're not on Bing, you're not in ChatGPT.
- [ ] **Sitemap freshness** — Bing weights `lastmod`, `changefreq` more than Google
- [ ] Content is voice-search friendly (conversational Q&A format, natural language)
- [ ] **Reddit presence** (if applicable) — ChatGPT citations of Reddit increased 87% in 2025; authentic participation in relevant subreddits drives AI citations
- [ ] Video content exists and is properly titled/described (YouTube = 25% of all AI citations)

### TIER 4: LINK BUILDING & AUTHORITY

#### D1 - Link Profile Assessment
- [ ] **Homepage receives 80-90% of inbound links** (foundation first)
- [ ] **Branded anchor text** is primary (safest, most effective)
- [ ] No spammy or irrelevant backlinks
- [ ] Internal linking strategy connects service pages to homepage (descriptive anchor text, not "click here")
- [ ] High-value internal links placed near top of content (higher on page = more likely clicked)
- [ ] Broken link opportunities identified (Check My Links method)
- [ ] Competitor backlink sources identified for prospecting
- [ ] No exact-match anchor text over-optimization
- [ ] 2-6 quality links per month (consistency over volume)
- [ ] **Original research and proprietary data** created as link magnets (156% increase in link acquisition vs generic articles)

#### D2 - Local Link Building (Local Business)
- [ ] **Sponsorships** — local events, sports teams, nonprofits, charity auctions (organizers link to sponsor pages)
- [ ] **Local media outreach** — pitch newsworthy angles to local papers/outlets (highest authority + local relevance)
- [ ] **Business partnerships** — cross-promotional content with complementary businesses (landscaper + pool company, painter + realtor)
- [ ] **Chamber of Commerce membership** and professional association listings
- [ ] **Community involvement** documented on website and linked from event pages

#### D3 - Brand Signals
- [ ] Brand name searches are growing (or at minimum, exist)
- [ ] Social profiles exist and link to website
- [ ] Wikipedia or knowledge panel presence (if applicable)
- [ ] Brand mentioned in community discussions (forums, Reddit, etc.)
- [ ] Consistent brand presentation across all platforms
- [ ] **Entity consistency** — same brand name, author names, and identifiers across all web properties. AI systems use entity matching to build confidence.

---

## Ranking Factor Priority (Evidence-Based)

When prioritizing findings, weight recommendations by actual ranking impact. Focus effort where data confirms it matters.

### High-Impact Factors (prioritize these)

1. **Google Business Profile optimization** — Category, reviews, posting frequency, completeness. Drives the local map 3-pack more than any website change. Primary category is the #1 local ranking factor.
2. **E-E-A-T signals** — r=0.81 correlation with AI citations. Stronger predictor than domain authority. 96% of Google AI Overview content comes from verified E-E-A-T sources. Pages ranked #6-#10 with strong E-E-A-T are cited 2.3x more than #1-ranked pages with weak authority.
3. **Title tags with location + service keywords** — Front-loaded, 50-60 characters. Highest-impact on-page element.
4. **H1 tags matching search intent** — H1 = keyword + city for local businesses.
5. **Content depth with original insights** — Pages with 2,500+ words consistently outrank thin competitors. Original data earns 4.1x more AI citations.
6. **Review velocity and recency** — New reviews increase rankings regardless of sentiment. This is a live ranking signal — rankings drop when review generation stops.
7. **FAQ schema** — Enables rich results and AI search answer positioning.
8. **Internal linking** — Distributes authority, helps Google understand site structure.
9. **Bing Places + Apple Business Connect** — LLMs pull from Bing. Siri pulls from Apple Maps. No longer optional.
10. **Structured data (JSON-LD)** — Content with schema is 2.3-2.5x more likely to appear in AI-generated answers.

### Low-Impact Factors (do NOT over-prioritize)

- **Keywords in URL slugs** — Google's John Mueller: "very lightweight" factor. Backlinko ranking study: near-zero correlation after controlling for other factors. URLs matter for user trust and CTR, not keyword matching. Never recommend restructuring existing URLs for keyword placement — the redirect risk outweighs the negligible benefit.
- **Exact-match anchor text** — Branded anchor text is safer and equally effective. Over-optimized anchors trigger penalties.
- **Blog content for local businesses** — Informational "how to" content attracts browsers, not buyers.
- **Domain Authority alone** — DA correlation with AI citations dropped from r=0.23 (2024) to r=0.18 (2026). E-E-A-T is the stronger signal.

### Severity Calibration

When assigning severity ratings, a missing title tag keyword is HIGH. A URL without keywords is INFO at most. Do not assign MEDIUM or HIGH to URL slug recommendations — the data does not support it.

---

## Keyword Validation

When recommending new pages or content during an audit, validate that the target keyword matches real search behavior before recommending it:

- [ ] **SERP test** - Search the exact keyword in Google. Results dominated by local competitors and directories = valid. Results showing DIY sites, forms, or unrelated content = weak keyword.
- [ ] **People Also Ask check** - PAA questions should align with the service being offered. If PAA is all DIY/informational, the keyword attracts researchers not buyers.
- [ ] **Competitor page check** - Do 3+ local competitors have a dedicated page for this keyword? If yes, validated. If zero, it's either a gap or nobody searches for it — investigate which.
- [ ] **AI query alignment** - Would someone ask ChatGPT or Google AI this question? If yes, FAQ sections can capture AI-generated answer traffic.
- [ ] **Recommend fold vs. standalone** - If a keyword fails validation, recommend folding that content into a stronger parent page as a section rather than creating a standalone page nobody will find.

---

## Severity Rating System

| Rating | Definition | Priority |
|--------|-----------|----------|
| **CRITICAL** | Site not indexed, major crawl blocks, no phone/address visible. Business invisible to search. | Fix immediately |
| **HIGH** | Missing GBP optimization, no schema, keyword cannibalization, no Bing listing, no E-E-A-T signals. Major ranking limitation. | Fix within 1 week |
| **MEDIUM** | Missing citations, thin content, poor internal linking, no AI optimization, no author attribution. Competitive disadvantage. | Fix within 1 month |
| **LOW** | Minor improvements - image optimization, anchor text diversity, content freshness. Polish items. | Fix in next cycle |
| **INFO** | Best practice recommendation. No immediate ranking impact but compounds over time. | Consider for roadmap |

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

**Issue:**
What's wrong and why it matters for rankings/visibility.

**Current State:**
[What's there now - screenshot reference, code snippet, or description]

**Recommendation:**
[Specific fix with example code/content if applicable]

**Impact:**
[Expected improvement if fixed]
```

---

## Ongoing Habits (Local Business)

These aren't one-time fixes. They need to happen consistently:

| Task | Frequency |
|------|-----------|
| Upload new GBP photo | Weekly |
| Post GBP update (keyword + location) | 2-3x per week |
| Respond to reviews | Within 24 hours |
| Ask customers for reviews | Every single one |
| Check for 404 errors | Weekly |
| Verify indexing | Monthly |
| Update top content with new data/examples | Quarterly |
| Audit NAP consistency across citations | Quarterly |

Do all of this consistently for **6 months** and you will not recognize your business. There are no shortcuts. Consistency is the strategy.

---

## AI Search Optimization Quick Reference

### The Three Layers

| Layer | What It Means | What to Do |
|-------|--------------|------------|
| **SEO** | Matching keywords | Rank for target queries with optimized pages |
| **AEO** | Descriptive clarity | Make content machine-readable, structured, extractable |
| **GEO** | Justification & trust | Build authority signals AI systems can verify and cite |

**Key insight:** SEO is the foundation. AEO drives understanding. GEO drives confidence. You need all three to be recommended by AI search.

### AI Citation Data Points

| Signal | Impact on AI Citations |
|--------|----------------------|
| Schema markup (JSON-LD) | 2.3-2.5x more likely to be cited |
| Tables and comparison matrices | 2.5-2.8x citation rate vs text-only |
| Original data/statistics | 4.1-5.5x citation boost |
| Strong E-E-A-T signals | r=0.81 correlation (strongest predictor) |
| Listicles/numbered lists | 50% of top AI citations |
| Third-party review profiles | 3x higher citation probability |
| Consistent heading hierarchy | 3.2x higher citation rates |
| Meaningful content updates | +71% citation lift (vs +12% for timestamp-only) |

### Platform-Specific Notes

- **Google AI Overviews** — Sources broadly, cites ~7.7 domains per response. E-E-A-T is primary filter.
- **ChatGPT** — Uses Bing's index. Wikipedia-heavy (47.9% of citations). Cites ~5.0 domains per response. Bing SEO is foundational.
- **Perplexity** — Most transparent/trackable. Indexes fresh content within hours. Only 11% domain overlap with ChatGPT citations.
- **Voice assistants** — Only 1% answer overlap across Google, Siri, and Alexa. Must optimize for all platforms, not just Google.

---

## Supporting References

- **Google Search Central:** https://developers.google.com/search
- **Google Business Profile Help:** https://support.google.com/business
- **Schema.org:** https://schema.org
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **Bing Places for Business:** https://www.bingplaces.com
- **Apple Business Connect:** https://businessconnect.apple.com
- **PageSpeed Insights:** https://pagespeed.web.dev
- **Whitespark Local Ranking Factors:** https://whitespark.ca/local-search-ranking-factors/
