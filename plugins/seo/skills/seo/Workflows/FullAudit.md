# Full SEO Audit

Comprehensive audit covering all 4 tiers. For each item, report: PASS, FAIL, or N/A with a note. Skip "Local Business" sections for non-local sites.

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

### Indexation & Crawlability
- [ ] Site indexed (`site:domain.com`)
- [ ] robots.txt not blocking important pages
- [ ] XML sitemap accessible at `/sitemap.xml` (only canonical, 200-status, indexable URLs)
- [ ] Sitemap referenced in robots.txt
- [ ] No accidental `noindex` on important pages
- [ ] Canonical tags present and correct
- [ ] No duplicate pages targeting same keyword
- [ ] HTTPS enforced
- [ ] No 404 errors on linked pages
- [ ] No redirect chains > 2 hops
- [ ] Important pages within 3-4 clicks of homepage

### Page Speed & Core Web Vitals
- [ ] LCP under 2.5 seconds
- [ ] INP under 200 milliseconds
- [ ] CLS under 0.1
- [ ] Images optimized (WebP/AVIF, lazy loading, proper dimensions)
- [ ] No render-blocking resources above fold
- [ ] Mobile responsive (content parity with desktop)
- [ ] Font loading strategy set

### On-Page SEO
- [ ] Meta title: exists, unique, 50-60 chars, keyword front-loaded
- [ ] Meta description: exists, unique, 140-160 chars, includes CTA
- [ ] One H1 per page
- [ ] Header hierarchy logical (H1 > H2 > H3), headings descriptive
- [ ] URL slugs clean and readable (do NOT flag for missing keywords)
- [ ] Image alt text descriptive
- [ ] Internal links with descriptive anchor text (not "click here")
- [ ] External links to authoritative sources

### E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- [ ] Author byline on content (not anonymous)
- [ ] Author page with credentials, bio, photo
- [ ] Author schema (Person with jobTitle, sameAs links)
- [ ] First-hand experience demonstrated (not generic advice)
- [ ] About page with company credentials, team, history
- [ ] Trust signals visible (certifications, awards, memberships)
- [ ] Claims backed by data or citations
- [ ] Consistent identity across website and external profiles

### Contact & Conversion
- [ ] Clear CTAs on every service page
- [ ] Contact page with full business info
- [ ] Contact form works

#### Local Business
- [ ] Phone above the fold, clickable `tel:` link
- [ ] Address in footer on every page
- [ ] NAP consistent across all pages
- [ ] H1 = keyword + city
- [ ] Content targets "service + city" not "how to"
- [ ] Business name is clean (no keyword stuffing — suspension risk)

## Tier 2: High Priority

### Google Business Profile (Local Business)
- [ ] GBP claimed and verified
- [ ] Name matches website (no keyword stuffing)
- [ ] Category matches top 3 competitors
- [ ] NAP matches website exactly
- [ ] Links to location/service page, not homepage
- [ ] Hours current
- [ ] Description filled with natural keywords
- [ ] Products/Services section filled
- [ ] Q&A section populated
- [ ] Photos uploaded weekly
- [ ] Posts 2-3x/week with keyword + location
- [ ] Reviews actively collected (systematized)
- [ ] Reviews responded to within 24 hours
- [ ] Review velocity maintained (live ranking signal, ~20% of local pack weight)
- [ ] Review text quality (mentions of services + locations carry ranking weight)
- [ ] Attributes filled out
- [ ] Behavioral signals (directions clicks, calls, messages = ranking factors)

#### Service Area Businesses
- [ ] Service areas precisely defined (Google verifies claims)
- [ ] Address hidden if home-based
- [ ] No service area abuse (don't claim coverage you can't serve)
- [ ] Unique content per service area page (H1, local testimonials, city-specific details, FAQ)
- [ ] No city-name-swap pages (spam update target)

### Structured Data / Schema (JSON-LD)
- [ ] LocalBusiness/Organization schema (specific subtype: Plumber, Attorney, etc.)
- [ ] Schema includes name, address, phone, hours, geo coordinates
- [ ] Person schema for authors (jobTitle, description, sameAs, worksFor, image)
- [ ] BreadcrumbList schema
- [ ] Service schema on service pages (nested within LocalBusiness)
- [ ] FAQ schema where applicable (3.2x AI Overview visibility boost)
- [ ] Article schema with author (Person type), dates, image (min 696px wide)
- [ ] Review/AggregateRating schema (ratingValue + reviewCount must match visible numbers)
- [ ] Schema validates in Rich Results Test AND Schema Markup Validator
- [ ] Only visible content marked up (invisible content = manual action risk)
- [ ] No over-marking (only schema types that authentically represent page content)
- [ ] areaServed for SABs (postal codes array)
- [ ] Separate LocalBusiness per location page (no duplication)
- [ ] Deprecated types removed (Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, Vehicle Listing — Jan 2026)

### Citations & Directories (Local Business)
- [ ] Bing Places (critical for ChatGPT visibility)
- [ ] Apple Business Connect (critical for Siri)
- [ ] Yelp complete
- [ ] BBB listed
- [ ] YellowPages listed
- [ ] Local Chamber of Commerce
- [ ] Industry-specific directories
- [ ] "Best of" lists and awards pursued
- [ ] NAP identical across all citations
- [ ] No duplicate listings
- [ ] Citation quality prioritized (Tier 1: industry-specific + authoritative > Tier 2: local directories > Tier 3: auto-populated)

### Content Strategy
- [ ] Each service has dedicated page
- [ ] Content is substantial (2,500+ words for depth)
- [ ] No keyword cannibalization
- [ ] Content targets buyers not browsers
- [ ] Social proof on service pages
- [ ] FAQ answers real customer questions (voice-search friendly)
- [ ] Content updated meaningfully quarterly
- [ ] First-hand experience demonstrated (E-E-A-T)
- [ ] No thin city pages with keyword swaps (spam target)

## Tier 3: AI Search (AEO/GEO)

### AI Search Readiness
- [ ] Answer-first layout (direct answer in first 40-60 words)
- [ ] Self-contained answer blocks (134-167 words)
- [ ] Clear, extractable content blocks
- [ ] Headings mirror real questions
- [ ] Tables and comparison matrices (2.5-2.8x citation boost)
- [ ] Numbered/bulleted lists (50% of top AI citations)
- [ ] Content states: who, what problem, why better
- [ ] Original data/statistics (4.1x citation boost)
- [ ] Modular, independently citable blocks
- [ ] Strongest content in first 30% of page

### Generative Engine Optimization
- [ ] Brand on third-party sites
- [ ] Review profiles on Trustpilot/G2/Capterra/Yelp (3x citation boost)
- [ ] Expert reviews or press mentions
- [ ] Consistent brand voice
- [ ] Author attribution with credentials
- [ ] Definitive language (not tentative)

### Technical AI Accessibility
- [ ] Content in HTML (not JS-only)
- [ ] No cloaking
- [ ] Semantic HTML elements
- [ ] SSR/SSG for key content
- [ ] Descriptive image alt text
- [ ] AI crawler governance in robots.txt (GPTBot, ClaudeBot, PerplexityBot)

### Multi-Platform AI Visibility
- [ ] Bing optimized (ChatGPT's index)
- [ ] Sitemap freshness (lastmod, changefreq)
- [ ] Voice-search friendly content (50%+ local searches are voice; 58% use voice for local business info)
- [ ] Video content (YouTube = 25% of AI citations)

## Tier 4: Links & Authority

### Link Profile
- [ ] 80-90% of links to homepage
- [ ] Branded anchor text primary
- [ ] No spammy backlinks
- [ ] Internal linking with descriptive anchors
- [ ] High-value links near top of content
- [ ] Competitor backlink opportunities identified
- [ ] No anchor text over-optimization
- [ ] Original research/data as link magnets

### Local Link Building
- [ ] Sponsorships (events, sports teams, nonprofits)
- [ ] Local media outreach (newsworthy angles)
- [ ] Business partnerships (complementary businesses)
- [ ] Chamber/association memberships
- [ ] Community involvement documented

### Brand Signals
- [ ] Brand searches exist/growing
- [ ] Social profiles link to website
- [ ] Consistent brand across platforms
- [ ] Entity consistency (same identifiers everywhere)

## Keyword Validation (For New Page Recommendations)

Before recommending a new page, validate the keyword:

- [ ] **SERP test** — local competitors and directories dominate = valid
- [ ] **PAA check** — questions align with service = valid
- [ ] **Competitor page check** — 3+ competitors have dedicated page = validated
- [ ] **AI query alignment** — someone would ask ChatGPT this = FAQ opportunity
- [ ] **Fold vs standalone** — if validation fails, fold into parent page

## Output Format

After auditing, provide:

1. **Overall Score** — X/100 with breakdown (Technical /20, On-Page /20, E-E-A-T-Authority /15, Local-GBP /20, Content-Freshness /15, AI-Readiness /10)
2. **Critical fixes** — items blocking ranking (indexing, 404s, duplicate pages)
3. **Quick wins** — fixable in under an hour
4. **High-priority items** — fix within 1 week
5. **Ongoing gaps** — habits not yet established
6. **Action plan** — prioritized next steps with keyword validation for new page recommendations

### Per-Finding Format

```
### [SEVERITY] Finding Title

**Category:** [Tier/Section reference]
**Page:** [URL]
**Confidence:** [CONFIRMED / LIKELY / NEEDS VERIFICATION]

**Issue:** What's wrong and why it matters.
**Current State:** What's there now.
**Recommendation:** Specific fix with example.
**Impact:** Expected improvement.
```
