# SEO Audit Checklist

Full 4-tier checklist for comprehensive SEO audits. Referenced by the `/seo-audit` command.

## Execution Order

1. Indexation check — `site:domain.com`, robots.txt, sitemap.xml
2. Homepage audit — meta tags, H1, speed, phone/address, schema
3. Service page audit — keyword targeting, content quality, CTAs, internal links
4. E-E-A-T check — author attribution, credentials, experience signals
5. GBP review (local) — search for business, check listing completeness
6. Technical scan — mobile, HTTPS, redirects, 404s, Core Web Vitals
7. Content analysis — keyword cannibalization, thin pages, buyer vs browser intent, freshness
8. Citation check (local) — Bing, Apple Maps, Yelp, BBB, YellowPages, Chamber
9. Schema validation — structured data presence and accuracy
10. AI readiness — content structure, extractability, citation optimization
11. Link profile — internal linking, anchor text, homepage link ratio
12. Competitor comparison — category matching, keyword gaps
13. Report generation — compile findings, prioritize, provide action plan

## Tier 1: Critical

### A1 - Indexation & Crawlability
- [ ] Site is indexed (`site:domain.com` returns results)
- [ ] robots.txt exists and is not blocking important pages
- [ ] XML sitemap exists and is accessible (`/sitemap.xml`)
- [ ] Sitemap contains only canonical, 200-status, indexable URLs (no redirects, soft-404s, or blocked URLs)
- [ ] Sitemap is referenced in robots.txt
- [ ] No accidental `noindex` tags on important pages
- [ ] Canonical tags present and correct — every page should have a **self-referencing canonical** (even without duplicates). Only one canonical per page (multiple tags cancel the signal). Paginated pages get their own canonical (don't point all to page 1). AI search engines use canonicals to identify authoritative version for citation.
- [ ] No duplicate pages targeting the same keyword (Google will rank neither)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] 404 errors checked (broken links, missing pages)
- [ ] Redirect chains (no chain > 2 hops)
- [ ] All important pages within 3-4 clicks of homepage (crawl depth)

### A2 - Page Speed & Core Web Vitals
CWV accounts for ~10-15% of ranking signals. Only 47% of sites currently pass all three thresholds. 1-second delay = up to 7% conversion loss; 53% of mobile users abandon pages taking >3 seconds.

- [ ] **LCP (Largest Contentful Paint)** under 2.5 seconds (>=75% of visits must meet threshold)
- [ ] **INP (Interaction to Next Paint)** under 200 milliseconds (replaced FID in 2024)
- [ ] **CLS (Cumulative Layout Shift)** under 0.1
- [ ] Images are optimized — WebP (26% smaller than PNG) or AVIF (50% smaller than JPEG), lazy loading via `loading="lazy"`, proper dimensions set, responsive `srcset`
- [ ] No render-blocking resources above the fold
- [ ] **Mobile responsive** — viewport meta tag, responsive layout, 70%+ of traffic is mobile
- [ ] **Tap targets minimum 48x48px** on mobile (buttons, links)
- [ ] **No intrusive interstitials** — pop-ups blocking main content penalized, especially on mobile. Cookie consent and age verification are acceptable.
- [ ] Font loading strategy (font-display: swap or optional)
- [ ] Content parity between mobile and desktop (Google mobile-first indexing fully rolled out Oct 2023)

### A3 - On-Page SEO Fundamentals

#### Title Tags
- [ ] Meta title exists, unique per page, **50-60 characters** (Google truncates ~61% of titles exceeding this)
- [ ] **Keyword is front-loaded** (within first 5-10 words — users scan the first few words of search results; immediate keyword confirmation increases CTR)
- [ ] Title reads as a marketing message, not keyword stuffing — well-optimized titles drive **20-50% CTR improvements**
- [ ] Power words and modifiers where appropriate (numbers, "Best", "Complete Guide", "2026", outcome words)

#### Meta Descriptions
- [ ] Meta description exists, unique per page, **150-160 characters** (put benefit/CTA in first 100 characters before likely truncation)
- [ ] Meta description includes a call to action or value proposition — pages with optimized descriptions see **20-30% CTR improvement**; pages without see 10-15% lower CTR
- [ ] Description matches page content closely — Google rewrites **60-71% of meta descriptions** when they don't match search intent well. Accurate descriptions are more likely to be kept.

#### Headers & Content Structure
- [ ] One H1 tag per page (not zero, not multiple)
- [ ] Header hierarchy is logical (H1 > H2 > H3, no skipped levels — breaks screen reader navigation)
- [ ] Headings are descriptive (not vague labels like "Introduction")
- [ ] **Question-formatted H2/H3s** where appropriate — mirror real search queries to win featured snippets and AI citations. 65% of featured snippets triggered by question formats.
- [ ] **Answer blocks after question headers** — 40-60 words, direct and concise. Follow with bulleted list, numbered process, or compact table to maximize AI/snippet extraction surface.
- [ ] Content is scannable — short paragraphs (3-5 sentences), white space, logical transitions. Target **60-70 Flesch Reading Ease** for general audiences (not a direct ranking factor but improves engagement signals).

#### URLs
- [ ] **URL slugs are clean and readable** (human trust and CTR, not keyword stuffing — Google's John Mueller confirms keywords in URLs are a "very lightweight" factor; Backlinko data shows near-zero ranking correlation). Aim for 3-5 meaningful words.
- [ ] **Do NOT recommend URL restructuring for keyword placement** — the redirect risk and broken link cost outweigh the negligible ranking benefit. Only flag URLs that are genuinely unreadable (random IDs, `/page-3` style).

#### Images, Links & Semantic Optimization
- [ ] Image alt text is descriptive (not empty, not keyword-stuffed) — **<=125 characters**, keyword front-loaded if natural. Directly impacts image SEO and accessibility.
- [ ] Internal linking between related pages with descriptive anchor text (3-8 words, not "click here")
- [ ] External links to authoritative sources where relevant — not a direct ranking factor per Google, but supports E-E-A-T trust signals and helps search engines understand topical fit
- [ ] **Semantic keyword coverage** — use related terms and entities naturally throughout content. Entity-based optimization outperforms keyword density (which is not a ranking factor). Semantic SEO yields 20-30% traffic gains. TF-IDF analysis useful for identifying gaps vs competitors.

### A4 - E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
E-E-A-T is not a direct ranking factor but the framework that informs Google's algorithm development. Trust is the foundation — untrustworthy pages rate low regardless of other signals. December 2025 core update explicitly targeted AI content quality and E-E-A-T compliance: sites with genuine expertise gained 23% traffic; AI content without expert oversight saw 87% negative impact.

#### Trustworthiness (Most Important — Check First)
- [ ] **HTTPS/SSL** implemented (baseline requirement, not advantage)
- [ ] **Privacy policy** exists and is accessible
- [ ] **Terms of service** exists
- [ ] **Contact page** with multiple methods (email, phone, form, physical address if applicable)
- [ ] **Transparent sourcing** — claims backed by data, citations, or attributable expertise
- [ ] No exaggerated or unverifiable claims
- [ ] **Affiliate/sponsorship disclosure** — financial relationships clearly marked. Sponsored content labeled.
- [ ] **AI content disclosure** when AI is substantially used in content creation (2025 transparency requirement)

#### Experience (Hardest to Fake — High Differentiation Value)
- [ ] **First-hand experience** demonstrated in content — not generic advice but "I did this, here's what happened." Personal anecdotes with specific, verifiable details.
- [ ] **Original photos/videos** — not stock images. Real product use, real location visits, real project results. Critical for reviews and case studies.
- [ ] **Case studies with measurable outcomes** — before/after data, specific results, real client examples
- [ ] **Honest about challenges** — acknowledges failures, learning curves, limitations. Polished-only content signals AI or inexperience.
- [ ] **Process documentation** — detailed walkthroughs showing insider knowledge only practitioners would have

#### Expertise
- [ ] **Author attribution** on all content (byline with name, not anonymous). Missing author bylines are a HIGH severity E-E-A-T failure.
- [ ] **Author page** exists with: professional photo (not stock), bio (50-100 words), credentials, education, years of experience, published works, speaking engagements, social profile links
- [ ] **Author schema** (`Person` type with `jobTitle`, `description`, `knowsAbout`, `sameAs` links to LinkedIn/profiles, `worksFor`, `image`)
- [ ] **Content demonstrates deep knowledge** through structure and substance — nuanced explanations, edge cases, competing perspectives, complexity acknowledgment. Show expertise, don't just claim it.
- [ ] **YMYL content has formal credentials** — health, finance, legal, safety, and civic content require degrees, licenses, or certifications. Everyday topics accept practical expertise.

#### Authoritativeness
- [ ] Clear **"About" page** with: company name, founded year, location, mission, team bios with photos and LinkedIn links, notable projects/clients, awards, industry memberships, media coverage. About page is now a significant trust signal (Dec 2025 update).
- [ ] **Consistent author/brand identity** across website, LinkedIn, social profiles, directories
- [ ] **Entity signals** — consistent naming across all web properties. `sameAs` schema linking to LinkedIn, social profiles, Wikidata, Crunchbase. Google uses Knowledge Graph to map entity identity.
- [ ] **Third-party recognition** — backlinks from relevant publications, press mentions, speaking engagements, industry awards, "Best of" list inclusions
- [ ] **Topical authority** — deep coverage of subject area through interconnected content clusters. Focused niche authority beats broad mediocrity (Dec 2025 finding: smaller expert blogs outranked enterprise sites lacking clear attribution).

### A5 - Contact & Conversion
- [ ] Clear calls-to-action on every service page
- [ ] Contact page exists with full business information
- [ ] Contact form works and is easy to find

#### Local Business
- [ ] **Phone number visible above the fold** (no scrolling required)
- [ ] Phone number is clickable (`tel:` link) on mobile
- [ ] **Physical address in website footer** on every page
- [ ] NAP (Name, Address, Phone) is consistent across all pages
- [ ] **H1 includes primary keyword AND city/location**
- [ ] Content targets "service + city" keywords, not informational "how to" queries
- [ ] **Business name is clean** — no keyword stuffing in business name (Google suspends for "Best Plumber in Denver - 24/7 Emergency Plumbing"). Use legal business name only.

## Tier 2: High Priority

### B1 - Google Business Profile (Local Business)
See `reference/local-seo.md` for full GBP optimization details.

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
- [ ] **Review velocity maintained** — consistent new reviews matter more than total count. Review velocity is a live ranking signal; rankings drop when generation stops. Reviews account for ~20% of local pack ranking weight.
- [ ] **Review text quality** — reviews mentioning specific services and locations carry more ranking weight. Coach customers to mention the service they received and their city.
- [ ] Attributes filled out (accessibility, amenities, etc.)
- [ ] **Behavioral signals healthy** — clicks to directions, calls from profile, website clicks, and message inquiries are all ranking signals.

### B2 - Structured Data / Schema Markup
All schema should use **JSON-LD format** (Google recommended, AI-universal). Use separate `<script type="application/ld+json">` tags per schema type. Only mark up content that is **visible on the page**.

- [ ] LocalBusiness or Organization schema on homepage (use specific subtype: `Plumber`, `Attorney`, `Restaurant`, etc.)
- [ ] Schema includes: name, address, phone, hours, geo coordinates
- [ ] **Person schema for authors** with `jobTitle`, `description`, `sameAs` links to LinkedIn/profiles, `worksFor`, and `image`
- [ ] BreadcrumbList schema for navigation
- [ ] Service schema on service pages (nest within LocalBusiness)
- [ ] FAQ schema on pages with FAQs — **3.2x more likely to appear in AI Overviews**
- [ ] Review/AggregateRating schema (if reviews on site) — `ratingValue` and `reviewCount` must match visible numbers exactly
- [ ] Product schema (for product pages) with price, currency, availability
- [ ] Article schema (for blog/content pages) with `author` (Person type), `datePublished`, `dateModified`, and `image` (min 696px wide)
- [ ] Schema validates in **both** Google Rich Results Test AND Schema Markup Validator
- [ ] **Content with schema is 2.3-2.5x more likely to appear in AI-generated answers**
- [ ] No over-marking — use only schema types that authentically represent the page content

#### Local Business Schema
- [ ] `areaServed` property for SABs — list service areas as array of postal codes or place names
- [ ] Separate LocalBusiness schema per location page (don't duplicate same schema across all pages)
- [ ] `openingHoursSpecification` in ISO 8601 format with day-specific entries
- [ ] `VirtualLocation` property for fully remote service providers

**Recently deprecated (Jan 2026):** Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, Vehicle Listing. **HowTo** is limited to desktop only.

### B3 - Citations & Directory Listings (Local Business)
See `reference/local-seo.md` for full citation details and quality hierarchy.

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

### B4 - Content Strategy
- [ ] Each service has its own dedicated page
- [ ] Service pages have substantial content — **match or exceed top-10 competitors' word count**
- [ ] **Content demonstrates first-hand experience** (E-E-A-T "Experience")
- [ ] **Original research, proprietary data, or unique insights**
- [ ] **No two pages target the same keyword** (cannibalization check)
- [ ] **Topic cluster architecture** — hub-and-spoke model
- [ ] Content pruning performed — evaluate underperforming pages: update, merge, or delete
- [ ] Testimonials/social proof on service pages
- [ ] **Video testimonials where possible** — 80% conversion increase vs text
- [ ] Case studies with quantifiable results
- [ ] FAQ content answers real customer questions (voice-search friendly)
- [ ] **Content updated meaningfully when new information exists**
- [ ] **Hub-and-spoke internal links** — 3-10 contextual links per page, descriptive anchors
- [ ] **Embedded video on key pages** with VideoObject schema and chapter timestamps

#### Local Business Content
- [ ] **Service pages target "service + city" keywords** (not "how to" keywords)
- [ ] **No thin city pages** with keyword swaps (Google spam updates target these)
- [ ] Service area pages have unique content per location

## Tier 3: AI Search Optimization (AEO/GEO)
See `reference/ai-search.md` for full AI search optimization details.

- [ ] **Answer-first layout** — "Question, Answer, Evidence" pattern
- [ ] **Self-contained answer blocks** of 120-180 words between headings
- [ ] **Tables and comparison matrices** — 2.8x higher AI citations
- [ ] **Numbered/bulleted lists** — +200-300% citation lift
- [ ] **FAQ sections** — 72% citation rate vs 34% for paragraph-only
- [ ] **Statistics and quotes** boost citations (+22% and +37% respectively)
- [ ] **Original data/statistics** — 4.1x more AI citations
- [ ] **Multimodal content** — text + images + video + schema = 156% higher citations
- [ ] **Brand entity recognition** — consistent across authoritative third-party sites
- [ ] **Author attribution with visible credentials** — +40% AI citations
- [ ] **Content freshness maintained** — 53% of ChatGPT citations updated within 6 months
- [ ] Content in HTML (not JS-only rendering), semantic elements
- [ ] AI crawler governance in robots.txt (GPTBot, ClaudeBot, PerplexityBot)

## Tier 4: Links & Authority
See `reference/link-building.md` for full link building details.

- [ ] Balanced homepage vs deep page links
- [ ] Anchor text distribution is safe (30-50% branded, 20-30% partial, <10% exact-match)
- [ ] No spammy backlinks
- [ ] Link reclamation performed (broken backlinks, unlinked mentions)
- [ ] Competitor backlink sources identified
- [ ] Link velocity is natural
- [ ] Original research/data as link magnets
- [ ] Brand searches exist/growing
- [ ] Entity consistency across all web properties

## Keyword Validation (For New Page Recommendations)

Before recommending a new page, validate the keyword:

- [ ] **SERP test** — local competitors and directories dominate = valid
- [ ] **PAA check** — questions align with service = valid
- [ ] **Competitor page check** — 3+ competitors have dedicated page = validated
- [ ] **AI query alignment** — someone would ask ChatGPT this = FAQ opportunity
- [ ] **Fold vs standalone** — if validation fails, fold into parent page

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
