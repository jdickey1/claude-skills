---
name: seo-review
description: Comprehensive website SEO review and audit. USE WHEN reviewing a website for search visibility, local SEO, technical SEO, on-page optimization, Google Business Profile, link building, AI search readiness, or content strategy. Covers local business SEO, technical foundations, and modern AI search optimization.
---

# SEO Review - Website Search Visibility Audit

**Performs comprehensive SEO audits** combining local business fundamentals, technical SEO, on-page optimization, AI search readiness (AEO/GEO), and content strategy. This audit inspects live pages using Playwright, checks source code, and evaluates against modern search best practices.

---

## Audit Philosophy

**Think like a search engine, report like a marketer.**

1. **Start with indexability** - If Google can't find your pages, nothing else matters.
2. **Prioritize buyers over browsers** - Target "service + city" keywords, not "how to" keywords.
3. **Local first** - For local businesses, Google Business Profile is the #1 lever.
4. **Structure for machines** - AI search systems (ChatGPT, Copilot, Gemini) need structured, citable content.
5. **Prove it with data** - Every finding must reference the specific page, element, or missing item.

---

## Audit Execution

### How to Run This Audit

1. **Get the target URL** from the user (homepage or specific pages)
2. **Use Playwright** to load and inspect pages (snapshot, screenshot, evaluate DOM)
3. **Use web-reader skill** (`npx playbooks get <url>`) for content extraction
4. **Check source HTML** for meta tags, schema, headers, canonical tags
5. **Crawl key pages** - homepage, service pages, location pages, blog (if exists)
6. **Check Google Business Profile** if applicable (search for business name)
7. **Compile findings** using the output format below

### Tools to Use

- **Playwright browser tools** - Navigate, snapshot, screenshot, evaluate JavaScript on pages
- **web-reader** - Extract page content as markdown for analysis
- **WebSearch** - Check indexation (`site:domain.com`), search for business name, check competitors
- **WebFetch** - Fetch robots.txt, sitemap.xml, specific URLs

---

## Audit Scope & Checklist

### TIER 1: CRITICAL (Audit First)

#### A1 - Indexation & Crawlability
- [ ] Site is indexed (`site:domain.com` returns results)
- [ ] robots.txt exists and is not blocking important pages
- [ ] XML sitemap exists and is accessible (`/sitemap.xml`)
- [ ] Sitemap is referenced in robots.txt
- [ ] No accidental `noindex` tags on important pages
- [ ] Canonical tags present and correct (no self-referencing errors)
- [ ] No duplicate pages targeting the same keyword (Google will rank neither)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] 404 errors checked (broken links, missing pages)
- [ ] Redirect chains (no chain > 2 hops)

#### A2 - Page Speed & Core Web Vitals
- [ ] Page loads in under 3 seconds
- [ ] Images are optimized (WebP/AVIF, lazy loading, proper dimensions)
- [ ] No render-blocking resources above the fold
- [ ] Mobile responsive (viewport meta tag, responsive layout)
- [ ] No layout shift (CLS) from dynamically loaded content
- [ ] Font loading strategy (font-display: swap or optional)

#### A3 - On-Page SEO Fundamentals
- [ ] Meta title exists, unique per page, under 60 characters
- [ ] **Keyword is front-loaded in meta title** (most important word first)
- [ ] Meta description exists, unique per page, 150-160 characters
- [ ] Meta description includes a call to action or value proposition
- [ ] One H1 tag per page (not zero, not multiple)
- [ ] **H1 includes primary keyword AND city/location** (for local businesses)
- [ ] Header hierarchy is logical (H1 > H2 > H3, no skipped levels)
- [ ] **URL slugs are clean and readable** (human trust and CTR, not keyword stuffing — Google's John Mueller confirms keywords in URLs are a "very lightweight" factor; Backlinko data shows near-zero ranking correlation)
- [ ] **Do NOT recommend URL restructuring for keyword placement** — the redirect risk and broken link cost outweigh the negligible ranking benefit. Only flag URLs that are genuinely unreadable (random IDs, `/page-3` style)
- [ ] Image alt text is descriptive (not empty, not keyword-stuffed)
- [ ] Internal linking between related pages
- [ ] External links to authoritative sources where relevant

#### A4 - Contact & Conversion (Local Business Critical)
- [ ] **Phone number visible above the fold** (no scrolling required)
- [ ] Phone number is clickable (`tel:` link) on mobile
- [ ] **Physical address in website footer** on every page
- [ ] NAP (Name, Address, Phone) is consistent across all pages
- [ ] Contact page exists with full business information
- [ ] Clear calls-to-action on every service page
- [ ] Contact form works and is easy to find

### TIER 2: HIGH PRIORITY

#### B1 - Google Business Profile (Local SEO)
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
- [ ] **GBP posts include keyword AND location** in every update
- [ ] Reviews being actively collected (ask every customer)
- [ ] **Reviews responded to within 24 hours** (every single one)
- [ ] Attributes filled out (accessibility, amenities, etc.)

#### B2 - Structured Data / Schema Markup
- [ ] LocalBusiness or Organization schema on homepage
- [ ] Schema includes: name, address, phone, hours, geo coordinates
- [ ] BreadcrumbList schema for navigation
- [ ] Service schema on service pages
- [ ] FAQ schema on pages with FAQs (enables rich results)
- [ ] Review/AggregateRating schema (if reviews on site)
- [ ] Product schema (for product pages)
- [ ] Article schema (for blog/content pages)
- [ ] Schema validates in Google Rich Results Test

#### B3 - Citations & Directory Listings
- [ ] **Listed on Bing Places** (LLMs pull from Bing - this is critical now)
- [ ] Listed on Yelp with complete profile
- [ ] Listed on BBB (Better Business Bureau)
- [ ] Listed on YellowPages
- [ ] Listed on Uber (if applicable)
- [ ] Listed on local Chamber of Commerce
- [ ] Listed on Apple Maps
- [ ] Listed on industry-specific directories
- [ ] NAP is identical across all citations (exact match, no variations)
- [ ] No duplicate listings on any platform

#### B4 - Content Strategy
- [ ] **Service pages target "service + city" keywords** (not "how to" keywords)
- [ ] Each service has its own dedicated page
- [ ] Service pages have unique, substantial content (not thin/duplicate)
- [ ] **No two pages target the same keyword** (cannibalization check)
- [ ] Content speaks to buyers, not browsers
- [ ] Testimonials/social proof on service pages
- [ ] Case studies or portfolio examples where applicable
- [ ] **No generic blog posts** for local businesses (unless they target buyer intent)
- [ ] FAQ content answers real customer questions
- [ ] Content updated regularly (freshness signals)

### TIER 3: AI SEARCH OPTIMIZATION (AEO/GEO)

#### C1 - AI Search Readiness (Answer Engine Optimization)
- [ ] Content is structured in clear, extractable blocks (not walls of text)
- [ ] Headings mirror real questions people ask
- [ ] Q&A sections use natural language questions
- [ ] Key facts are in structured lists, tables, or definition formats
- [ ] Content clearly states: who it's for, what problem it solves, why it's better
- [ ] Comparison content exists (vs competitors, vs alternatives)
- [ ] Content is front-loaded with the most important information
- [ ] Modular content blocks that AI can cite independently

#### C2 - Generative Engine Optimization (GEO)
- [ ] Brand mentions on authoritative third-party sites
- [ ] Expert reviews or press mentions exist
- [ ] Verified reviews with volume (not just rating)
- [ ] Consistent brand voice across all content
- [ ] No exaggerated or unverifiable claims
- [ ] Certifications, awards, or credentials displayed
- [ ] Author/expert attribution on content
- [ ] Content includes data, statistics, or original research where possible

#### C3 - Technical AI Accessibility
- [ ] Content is in HTML (not trapped in JavaScript-only rendering)
- [ ] No cloaking (same content served to bots and users)
- [ ] Clean HTML structure (semantic elements: article, section, nav, main)
- [ ] Structured data is comprehensive and accurate
- [ ] Site loads without JavaScript (SSR/SSG preferred for key content)
- [ ] Descriptive image alt text (AI can't see images without it)

### TIER 4: LINK BUILDING & AUTHORITY

#### D1 - Link Profile Assessment
- [ ] **Homepage receives 80-90% of inbound links** (foundation first)
- [ ] **Branded anchor text** is primary (safest, most effective)
- [ ] No spammy or irrelevant backlinks
- [ ] Internal linking strategy connects service pages to homepage
- [ ] Broken link opportunities identified (Check My Links method)
- [ ] Competitor backlink sources identified for prospecting
- [ ] No exact-match anchor text over-optimization
- [ ] 2-6 quality links per month (consistency over volume)

#### D2 - Brand Signals
- [ ] Brand name searches are growing (or at minimum, exist)
- [ ] Social profiles exist and link to website
- [ ] Wikipedia or knowledge panel presence (if applicable)
- [ ] Brand mentioned in community discussions (forums, Reddit, etc.)
- [ ] Consistent brand presentation across all platforms

---

## Ranking Factor Priority (Evidence-Based)

When prioritizing findings, weight recommendations by actual ranking impact. Many commonly recommended SEO changes have minimal effect. Focus effort where data confirms it matters.

### High-Impact Factors (prioritize these)

1. **Google Business Profile optimization** — Category, reviews, posting frequency, completeness. Drives the local map 3-pack more than any website change.
2. **Title tags with location + service keywords** — Front-loaded, under 60 characters. Highest-impact on-page element.
3. **H1 tags matching search intent** — H1 = keyword + city for local businesses.
4. **Content depth** — Pages with 2,500+ words consistently outrank thin competitors.
5. **FAQ schema** — Enables rich results and AI search answer positioning.
6. **Internal linking** — Distributes authority, helps Google understand site structure.
7. **Review volume, velocity, and response time** — More reviews, collected consistently, responded to within 24 hours.
8. **Bing Places listing** — LLMs pull from Bing. No longer optional.

### Low-Impact Factors (do NOT over-prioritize)

- **Keywords in URL slugs** — Google's John Mueller: "very lightweight" factor. Backlinko ranking study: near-zero correlation after controlling for other factors. URLs matter for user trust and CTR, not keyword matching. Never recommend restructuring existing URLs for keyword placement — the redirect risk outweighs the negligible benefit.
- **Exact-match anchor text** — Branded anchor text is safer and equally effective.
- **Blog content for local businesses** — Informational "how to" content attracts browsers, not buyers.

### Severity Calibration

When assigning severity ratings, a missing title tag keyword is HIGH. A URL without keywords is INFO at most. Do not assign MEDIUM or HIGH to URL slug recommendations — the data does not support it.

---

## Severity Rating System

| Rating | Definition | Priority |
|--------|-----------|----------|
| **CRITICAL** | Site not indexed, major crawl blocks, no phone/address visible. Business invisible to search. | Fix immediately |
| **HIGH** | Missing GBP optimization, no schema, keyword cannibalization, no Bing listing. Major ranking limitation. | Fix within 1 week |
| **MEDIUM** | Missing citations, thin content, poor internal linking, no AI optimization. Competitive disadvantage. | Fix within 1 month |
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
- Indexation & Technical: [X/25]
- On-Page SEO: [X/25]
- Local SEO / GBP: [X/25]
- Content & Authority: [X/15]
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

## Audit Execution Order

1. **Indexation check** - `site:domain.com`, robots.txt, sitemap.xml
2. **Homepage audit** - Meta tags, H1, speed, phone/address visibility, schema
3. **Service page audit** - Keyword targeting, content quality, CTAs, internal links
4. **GBP review** - Search for business, check listing completeness
5. **Technical scan** - Mobile, HTTPS, redirects, 404s, Core Web Vitals
6. **Content analysis** - Keyword cannibalization, thin pages, buyer vs browser intent
7. **Citation check** - Bing, Yelp, BBB, YellowPages, Chamber
8. **Schema validation** - Structured data presence and accuracy
9. **AI readiness** - Content structure, extractability, brand signals
10. **Link profile** - Internal linking, anchor text, homepage link ratio
11. **Competitor comparison** - Category matching, keyword gaps
12. **Report generation** - Compile findings, prioritize, provide action plan

---

## Local SEO Golden Rules

These are non-negotiable for any local business:

1. **Address in the footer of every page.** Not just the contact page.
2. **GBP links to your location page, not your homepage.** The location page has your NAP and services for that area.
3. **Front-load your keyword in your meta title.** "Plumbing Repair Austin TX | ABC Plumbing" not "ABC Plumbing | Your Trusted Partner"
4. **H1 = keyword + city.** "Emergency Plumbing Repair in Austin, TX" not "Welcome to Our Website"
5. **URLs should be readable, not keyword-stuffed.** `/plumbing-repair` not `/services/page-3`. Don't waste effort adding city names or extra keywords to slugs — it's a near-zero ranking factor per Google's own statements and independent studies. Focus effort on title tags and H1s instead.
6. **Stop writing "how to" blog posts.** Target "service + city" keywords. You want buyers, not browsers.
7. **Phone number above the fold.** Visible without scrolling on both desktop and mobile.
8. **New GBP photo every week.** Activity signals matter.
9. **Respond to every review within 24 hours.** Every. Single. One.
10. **Fill out GBP Products section.** Even for service businesses. List your services here.
11. **Match your GBP category to your top competitors.** Check who ranks above you and match.
12. **Include keyword + location in every GBP post.** Not just updates - strategic posts.
13. **Ask every customer for a review.** Every single one. No exceptions.
14. **No duplicate keyword targeting.** One page per keyword. Period.
15. **Get on Bing.** LLMs are pulling from Bing. This is no longer optional.
16. **Build citations everywhere.** Yelp, BBB, YellowPages, Uber, Chamber of Commerce.
17. **Branded anchor text for links.** Safest and most effective form of link building.
18. **80-90% of links to homepage.** Build your domain authority foundation first.
19. **Check for 404 errors weekly.** Broken pages kill crawl budget and user trust.
20. **Consistency for 6 months.** Do all of this consistently and you will not recognize your business.

---

## AI Search Optimization Quick Reference

From Microsoft's AEO/GEO framework:

| Layer | What It Means | What to Do |
|-------|--------------|------------|
| **SEO** | Matching keywords | Rank for target queries with optimized pages |
| **AEO** | Descriptive clarity | Make content machine-readable, structured, extractable |
| **GEO** | Justification & trust | Build authority signals AI systems can verify and cite |

**Key insight:** SEO is the foundation. AEO drives understanding. GEO drives confidence. You need all three to be recommended by AI search.

---

## Supporting References

- **Google Search Central:** https://developers.google.com/search
- **Google Business Profile Help:** https://support.google.com/business
- **Schema.org:** https://schema.org
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **PageSpeed Insights:** https://pagespeed.web.dev
- **Microsoft AEO/GEO Guide:** Search for "Microsoft Answer Engine Optimization" for the latest framework
