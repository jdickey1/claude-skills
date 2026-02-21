# Full SEO Audit

Comprehensive audit covering all 4 tiers. For each item, report: PASS, FAIL, or N/A with a note. Skip "Local Business" sections for non-local sites.

## Execution Order

1. Indexation check — `site:domain.com`, robots.txt, sitemap.xml
2. Homepage audit — meta tags, H1, speed, phone/address, schema
3. Service page audit — keyword targeting, content quality, CTAs, internal links
4. GBP review (local) — search for business, check listing completeness
5. Technical scan — mobile, HTTPS, redirects, 404s, Core Web Vitals
6. Content analysis — keyword cannibalization, thin pages, buyer vs browser intent
7. Citation check (local) — Bing, Yelp, BBB, YellowPages, Chamber
8. Schema validation — structured data presence and accuracy
9. AI readiness — content structure, extractability, brand signals
10. Link profile — internal linking, anchor text, homepage link ratio
11. Competitor comparison — category matching, keyword gaps
12. Report generation — compile findings, prioritize, provide action plan

## Tier 1: Critical

### Indexation & Crawlability
- [ ] Site indexed (`site:domain.com`)
- [ ] robots.txt not blocking important pages
- [ ] XML sitemap accessible at `/sitemap.xml`
- [ ] Sitemap referenced in robots.txt
- [ ] No accidental `noindex` on important pages
- [ ] Canonical tags present and correct
- [ ] No duplicate pages targeting same keyword
- [ ] HTTPS enforced
- [ ] No 404 errors on linked pages
- [ ] No redirect chains > 2 hops

### Page Speed & Core Web Vitals
- [ ] Page loads under 3 seconds
- [ ] Images optimized (WebP/AVIF, lazy loading, proper dimensions)
- [ ] No render-blocking resources above fold
- [ ] Mobile responsive
- [ ] No CLS from dynamic content
- [ ] Font loading strategy set

### On-Page SEO
- [ ] Meta title: exists, unique, under 60 chars, keyword front-loaded
- [ ] Meta description: exists, unique, 150-160 chars, includes CTA
- [ ] One H1 per page
- [ ] Header hierarchy logical (H1 > H2 > H3)
- [ ] URL slugs clean and readable (do NOT flag for missing keywords)
- [ ] Image alt text descriptive
- [ ] Internal links between related pages
- [ ] External links to authoritative sources

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
- [ ] Posts include keyword + location
- [ ] Reviews actively collected
- [ ] Reviews responded to within 24 hours
- [ ] Attributes filled out

### Structured Data / Schema
- [ ] LocalBusiness or Organization schema on homepage
- [ ] Schema includes name, address, phone, hours, geo
- [ ] BreadcrumbList schema
- [ ] Service schema on service pages
- [ ] FAQ schema where applicable
- [ ] Review/AggregateRating schema
- [ ] Schema validates in Rich Results Test

### Citations & Directories (Local Business)
- [ ] Bing Places (critical — LLMs pull from Bing)
- [ ] Yelp complete
- [ ] BBB listed
- [ ] YellowPages listed
- [ ] Apple Maps listed
- [ ] Local Chamber of Commerce
- [ ] Industry-specific directories
- [ ] NAP identical across all citations
- [ ] No duplicate listings

### Content Strategy
- [ ] Each service has dedicated page
- [ ] Content is substantial (not thin)
- [ ] No keyword cannibalization
- [ ] Content targets buyers not browsers
- [ ] Social proof on service pages
- [ ] FAQ answers real customer questions
- [ ] Content updated regularly

## Tier 3: AI Search (AEO/GEO)

### AI Search Readiness
- [ ] Content in clear, extractable blocks
- [ ] Headings mirror real questions
- [ ] Q&A uses natural language
- [ ] Key facts in lists, tables, or definitions
- [ ] Content states: who, what problem, why better
- [ ] Comparison content exists
- [ ] Front-loaded important info
- [ ] Modular, independently citable blocks

### Generative Engine Optimization
- [ ] Brand mentions on third-party sites
- [ ] Expert reviews or press mentions
- [ ] Verified reviews with volume
- [ ] Consistent brand voice
- [ ] No unverifiable claims
- [ ] Credentials displayed
- [ ] Author attribution on content

### Technical AI Accessibility
- [ ] Content in HTML (not JS-only)
- [ ] No cloaking
- [ ] Semantic HTML elements
- [ ] SSR/SSG for key content
- [ ] Descriptive image alt text

## Tier 4: Links & Authority

### Link Profile
- [ ] 80-90% of links to homepage
- [ ] Branded anchor text primary
- [ ] No spammy backlinks
- [ ] Internal linking connects service → homepage
- [ ] Competitor backlink opportunities identified
- [ ] No anchor text over-optimization

### Brand Signals
- [ ] Brand searches exist/growing
- [ ] Social profiles link to website
- [ ] Consistent brand across platforms

## Keyword Validation (For New Page Recommendations)

Before recommending a new page, validate the keyword:

- [ ] **SERP test** — local competitors and directories dominate = valid
- [ ] **PAA check** — questions align with service = valid
- [ ] **Competitor page check** — 3+ competitors have dedicated page = validated
- [ ] **AI query alignment** — someone would ask ChatGPT this = FAQ opportunity
- [ ] **Fold vs standalone** — if validation fails, fold into parent page

## Output Format

After auditing, provide:

1. **Overall Score** — X/100 with breakdown (Technical /25, On-Page /25, Local-GBP /25, Content-Authority /15, AI-Readiness /10)
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
