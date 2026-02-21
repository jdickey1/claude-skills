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
- [ ] Canonical tags present and correct — every page should have a **self-referencing canonical** (even without duplicates). Only one canonical per page (multiple tags cancel the signal). Paginated pages get their own canonical (don't point all to page 1). AI search engines use canonicals to identify authoritative version for citation.
- [ ] No duplicate pages targeting the same keyword (Google will rank neither)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] 404 errors checked (broken links, missing pages)
- [ ] Redirect chains (no chain > 2 hops)
- [ ] All important pages within 3-4 clicks of homepage (crawl depth)

#### A2 - Page Speed & Core Web Vitals
CWV accounts for ~10-15% of ranking signals. Only 47% of sites currently pass all three thresholds. 1-second delay = up to 7% conversion loss; 53% of mobile users abandon pages taking >3 seconds.

- [ ] **LCP (Largest Contentful Paint)** under 2.5 seconds (≥75% of visits must meet threshold)
- [ ] **INP (Interaction to Next Paint)** under 200 milliseconds (replaced FID in 2024)
- [ ] **CLS (Cumulative Layout Shift)** under 0.1
- [ ] Images are optimized — WebP (26% smaller than PNG) or AVIF (50% smaller than JPEG), lazy loading via `loading="lazy"`, proper dimensions set, responsive `srcset`
- [ ] No render-blocking resources above the fold
- [ ] **Mobile responsive** — viewport meta tag, responsive layout, 70%+ of traffic is mobile
- [ ] **Tap targets minimum 48x48px** on mobile (buttons, links)
- [ ] **No intrusive interstitials** — pop-ups blocking main content penalized, especially on mobile. Cookie consent and age verification are acceptable.
- [ ] Font loading strategy (font-display: swap or optional)
- [ ] Content parity between mobile and desktop (Google mobile-first indexing fully rolled out Oct 2023)

#### A3 - On-Page SEO Fundamentals

##### Title Tags
- [ ] Meta title exists, unique per page, **50-60 characters** (Google truncates ~61% of titles exceeding this)
- [ ] **Keyword is front-loaded** (within first 5-10 words — users scan the first few words of search results; immediate keyword confirmation increases CTR)
- [ ] Title reads as a marketing message, not keyword stuffing — well-optimized titles drive **20-50% CTR improvements**
- [ ] Power words and modifiers where appropriate (numbers, "Best", "Complete Guide", "2026", outcome words)

##### Meta Descriptions
- [ ] Meta description exists, unique per page, **150-160 characters** (put benefit/CTA in first 100 characters before likely truncation)
- [ ] Meta description includes a call to action or value proposition — pages with optimized descriptions see **20-30% CTR improvement**; pages without see 10-15% lower CTR
- [ ] Description matches page content closely — Google rewrites **60-71% of meta descriptions** when they don't match search intent well. Accurate descriptions are more likely to be kept.

##### Headers & Content Structure
- [ ] One H1 tag per page (not zero, not multiple)
- [ ] Header hierarchy is logical (H1 > H2 > H3, no skipped levels — breaks screen reader navigation)
- [ ] Headings are descriptive (not vague labels like "Introduction")
- [ ] **Question-formatted H2/H3s** where appropriate — mirror real search queries to win featured snippets and AI citations. 65% of featured snippets triggered by question formats.
- [ ] **Answer blocks after question headers** — 40-60 words, direct and concise. Follow with bulleted list, numbered process, or compact table to maximize AI/snippet extraction surface.
- [ ] Content is scannable — short paragraphs (3-5 sentences), white space, logical transitions. Target **60-70 Flesch Reading Ease** for general audiences (not a direct ranking factor but improves engagement signals).

##### URLs
- [ ] **URL slugs are clean and readable** (human trust and CTR, not keyword stuffing — Google's John Mueller confirms keywords in URLs are a "very lightweight" factor; Backlinko data shows near-zero ranking correlation). Aim for 3-5 meaningful words.
- [ ] **Do NOT recommend URL restructuring for keyword placement** — the redirect risk and broken link cost outweigh the negligible ranking benefit. Only flag URLs that are genuinely unreadable (random IDs, `/page-3` style).

##### Images, Links & Semantic Optimization
- [ ] Image alt text is descriptive (not empty, not keyword-stuffed) — **≤125 characters**, keyword front-loaded if natural. Directly impacts image SEO and accessibility.
- [ ] Internal linking between related pages with descriptive anchor text (3-8 words, not "click here")
- [ ] External links to authoritative sources where relevant — not a direct ranking factor per Google, but supports E-E-A-T trust signals and helps search engines understand topical fit
- [ ] **Semantic keyword coverage** — use related terms and entities naturally throughout content. Entity-based optimization outperforms keyword density (which is not a ranking factor). Semantic SEO yields 20-30% traffic gains. TF-IDF analysis useful for identifying gaps vs competitors.

#### A4 - E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
E-E-A-T is not a direct ranking factor but the framework that informs Google's algorithm development. Trust is the foundation — untrustworthy pages rate low regardless of other signals. December 2025 core update explicitly targeted AI content quality and E-E-A-T compliance: sites with genuine expertise gained 23% traffic; AI content without expert oversight saw 87% negative impact.

##### Trustworthiness (Most Important — Check First)
- [ ] **HTTPS/SSL** implemented (baseline requirement, not advantage)
- [ ] **Privacy policy** exists and is accessible
- [ ] **Terms of service** exists
- [ ] **Contact page** with multiple methods (email, phone, form, physical address if applicable)
- [ ] **Transparent sourcing** — claims backed by data, citations, or attributable expertise
- [ ] No exaggerated or unverifiable claims
- [ ] **Affiliate/sponsorship disclosure** — financial relationships clearly marked. Sponsored content labeled.
- [ ] **AI content disclosure** when AI is substantially used in content creation (2025 transparency requirement)

##### Experience (Hardest to Fake — High Differentiation Value)
- [ ] **First-hand experience** demonstrated in content — not generic advice but "I did this, here's what happened." Personal anecdotes with specific, verifiable details.
- [ ] **Original photos/videos** — not stock images. Real product use, real location visits, real project results. Critical for reviews and case studies.
- [ ] **Case studies with measurable outcomes** — before/after data, specific results, real client examples
- [ ] **Honest about challenges** — acknowledges failures, learning curves, limitations. Polished-only content signals AI or inexperience.
- [ ] **Process documentation** — detailed walkthroughs showing insider knowledge only practitioners would have

##### Expertise
- [ ] **Author attribution** on all content (byline with name, not anonymous). Missing author bylines are a HIGH severity E-E-A-T failure.
- [ ] **Author page** exists with: professional photo (not stock), bio (50-100 words), credentials, education, years of experience, published works, speaking engagements, social profile links
- [ ] **Author schema** (`Person` type with `jobTitle`, `description`, `knowsAbout`, `sameAs` links to LinkedIn/profiles, `worksFor`, `image`)
- [ ] **Content demonstrates deep knowledge** through structure and substance — nuanced explanations, edge cases, competing perspectives, complexity acknowledgment. Show expertise, don't just claim it.
- [ ] **YMYL content has formal credentials** — health, finance, legal, safety, and civic content require degrees, licenses, or certifications. Everyday topics accept practical expertise.

##### Authoritativeness
- [ ] Clear **"About" page** with: company name, founded year, location, mission, team bios with photos and LinkedIn links, notable projects/clients, awards, industry memberships, media coverage. About page is now a significant trust signal (Dec 2025 update).
- [ ] **Consistent author/brand identity** across website, LinkedIn, social profiles, directories
- [ ] **Entity signals** — consistent naming across all web properties. `sameAs` schema linking to LinkedIn, social profiles, Wikidata, Crunchbase. Google uses Knowledge Graph to map entity identity.
- [ ] **Third-party recognition** — backlinks from relevant publications, press mentions, speaking engagements, industry awards, "Best of" list inclusions
- [ ] **Topical authority** — deep coverage of subject area through interconnected content clusters. Focused niche authority beats broad mediocrity (Dec 2025 finding: smaller expert blogs outranked enterprise sites lacking clear attribution).

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
- [ ] **Business name is clean** — no keyword stuffing in business name (Google suspends for "Best Plumber in Denver - 24/7 Emergency Plumbing"). Use legal business name only.

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
- [ ] **Review velocity maintained** — consistent new reviews matter more than total count. Review velocity is a live ranking signal; rankings drop when generation stops. Reviews account for ~20% of local pack ranking weight.
- [ ] **Review text quality** — reviews mentioning specific services and locations carry more ranking weight. Coach customers to mention the service they received and their city.
- [ ] Attributes filled out (accessibility, amenities, etc.)
- [ ] **Behavioral signals healthy** — clicks to directions, calls from profile, website clicks, and message inquiries are all ranking signals. An active, engaging profile outranks a passive one.

##### Service Area Businesses (SABs)
- [ ] Service areas defined precisely (20 zip codes/cities you actually serve — Google verifies claims)
- [ ] Business address hidden from public if home-based
- [ ] No service area abuse — don't claim coverage you can't actually serve (suspension risk)
- [ ] Unique service area pages per major city with this structure: H1 ("Service in City"), local testimonials, city-specific details (climate, building codes, local issues), service breakdown, location-specific FAQ
- [ ] Each service area page has genuinely unique content (not city-name swaps — Google spam updates target these)

#### B2 - Structured Data / Schema Markup
All schema should use **JSON-LD format** (Google recommended, AI-universal). Use separate `<script type="application/ld+json">` tags per schema type (easier to debug than `@graph`). Only mark up content that is **visible on the page** — marking invisible content risks manual action penalties.

- [ ] LocalBusiness or Organization schema on homepage (use specific subtype: `Plumber`, `Attorney`, `Restaurant`, etc.)
- [ ] Schema includes: name, address, phone, hours, geo coordinates
- [ ] **Person schema for authors** with `jobTitle`, `description`, `sameAs` links to LinkedIn/profiles, `worksFor`, and `image`
- [ ] BreadcrumbList schema for navigation
- [ ] Service schema on service pages (nest within LocalBusiness)
- [ ] FAQ schema on pages with FAQs — **3.2x more likely to appear in AI Overviews**. Visibility reduced in standard search since 2023 but high AI citation value remains.
- [ ] Review/AggregateRating schema (if reviews on site) — `ratingValue` and `reviewCount` must match visible numbers exactly. Self-serving or inflated reviews risk penalties.
- [ ] Product schema (for product pages) with price, currency, availability
- [ ] Article schema (for blog/content pages) with `author` (Person type), `datePublished`, `dateModified`, and `image` (min 696px wide)
- [ ] Schema validates in **both** Google Rich Results Test AND Schema Markup Validator (Rich Results Test only covers Google-specific types; Markup Validator covers all schema)
- [ ] **Content with schema is 2.3-2.5x more likely to appear in AI-generated answers** — GPT-4 accuracy improves from 16% to 54% when content has structured data (Data World study)
- [ ] No over-marking — use only schema types that authentically represent the page content. Adding irrelevant types hoping for ranking boost is counterproductive.

##### Local Business Schema
- [ ] `areaServed` property for SABs — list service areas as array of postal codes or place names
- [ ] Separate LocalBusiness schema per location page (don't duplicate same schema across all pages)
- [ ] `openingHoursSpecification` in ISO 8601 format with day-specific entries
- [ ] `VirtualLocation` property for fully remote service providers (consultants, therapists meeting via video only)

**Recently deprecated (Jan 2026, no penalty but no rich results):** Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, Vehicle Listing. **HowTo** is limited to desktop only. Remove deprecated types during cleanup but don't panic about existing ones.

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

**Citation Quality Hierarchy:**
- **Tier 1 (highest value):** Industry-specific directories (Justia for legal, Angie's for contractors), authoritative general directories (Yelp, Apple Maps, Bing), expert-curated "Best of" lists, quality news/press mentions, professional association memberships
- **Tier 2 (moderate value):** Local business directories, city guides, white pages, social media profiles with complete info
- **Tier 3 (lower value):** Auto-populated directories, low-authority or spam directories (avoid these)

#### B4 - Content Strategy

##### Content Depth & Quality
- [ ] Each service has its own dedicated page
- [ ] Service pages have substantial content — **match or exceed top-10 competitors' word count** for target keyword. 1,500-2,500 words is typical for competitive topics, but comprehensiveness matters more than word count (Google confirms word count is not a ranking factor).
- [ ] **Content demonstrates first-hand experience** (E-E-A-T "Experience" — unique insights, case studies, specific examples, not generic advice). Show expertise through detailed explanations, not assertions.
- [ ] **Original research, proprietary data, or unique insights** — the only durable competitive advantage in an AI-content-saturated landscape. 50% of business content is now AI-generated (Gartner 2025); differentiation comes from what competitors can't replicate.

##### Content Organization & Cannibalization
- [ ] **No two pages target the same keyword** (cannibalization check) — multiple pages competing for the same intent fragment ranking power across all of them
- [ ] **Topic cluster architecture** — hub-and-spoke model where pillar pages cover the main topic comprehensively, with cluster pages exploring subtopics in depth. Content organized into clusters drives ~30% more organic traffic and holds rankings 2.5x longer than standalone pieces.
- [ ] One-intent-one-URL rule enforced — each subtopic maps to a single page
- [ ] **Content pruning performed** — evaluate underperforming pages: update (refresh stats, links), merge (consolidate same-topic pages), or delete (remove low-value content). One site deleted 127 posts and saw 34% traffic increase in 3 months. Pruning before publishing new content on bloated sites.

##### Social Proof & Conversion
- [ ] Testimonials/social proof on service pages — 3-5 testimonials on homepage (credibility without cognitive overload); 100+ in library correlates with 37% higher conversions
- [ ] **Video testimonials where possible** — 80% conversion increase vs text testimonials
- [ ] Case studies with quantifiable results (ROI metrics, before/after data, specific outcomes)
- [ ] User-generated content integrated (reviews, Q&A sections) — sites with UGC see 29% higher conversion rates; 88% of consumers trust peer recommendations

##### Content Freshness & Updates
- [ ] **Content updated meaningfully when new information exists** — new data, examples, rewritten sections, revised recommendations. Timestamp-only updates provide minimal benefit (+12%); meaningful updates provide +71% citation lift. Update driven by substance, not calendar.
- [ ] FAQ content answers real customer questions (natural language for voice search)

##### Internal Linking
- [ ] **Hub-and-spoke internal links** — hub pages link to 2-3+ related spokes, spokes link back to hub and cross-link to related spokes
- [ ] **3-10 contextual internal links per page** depending on content length
- [ ] Anchor text: descriptive, 3-8 words, ~30% exact-match / 30-40% partial variations / 20-30% natural contextual. Never "click here."
- [ ] **Link from high-authority pages to new/underperforming content** to accelerate discovery and pass authority
- [ ] High-value internal links placed near top of content (higher on page = more likely clicked)

##### Video & Multi-Format
- [ ] **Embedded video on key pages** — pages with embedded YouTube video rank first-page keywords 2x more frequently. Video snippets appear in 25%+ of Google results.
- [ ] Video schema (VideoObject) with chapter timestamps for AI extraction
- [ ] **Content repurposing pipeline** — video-first approach where 1 hour of content generates 15-30 repurposed pieces (blog post, social clips, podcast, quote graphics, email sequences). 400% more engagement from repurposed clips vs full-episode-only.

##### Local Business
- [ ] **Service pages target "service + city" keywords** (not "how to" keywords)
- [ ] **No generic blog posts** unless they target buyer intent — informational content supports commercial content but has lower direct conversion value
- [ ] **No thin city pages** with keyword swaps (Google spam updates target these)
- [ ] Service area pages have unique content per location (local testimonials, city-specific details, local photos)

### TIER 3: AI SEARCH OPTIMIZATION (AEO/GEO)

AI Overviews appear in ~16-60% of Google searches (varies by query type; peaked at 60% in Nov 2025). 58-60% of searches end without a click. Organic CTR drops 61% when AI Overviews appear (from 1.76% to 0.61%). Being cited in AI answers is the counter-strategy: cited brands recover +35% organic CTR and +91% paid CTR vs uncited.

**AEO vs GEO distinction:** AEO (Answer Engine Optimization) = be the direct answer (featured snippets, voice, position zero). GEO (Generative Engine Optimization) = be the source AI synthesizes from (ChatGPT, Perplexity, Claude, Copilot). AEO originated in Google-focused SEO; GEO emerged with LLMs. Optimize for both.

#### C1 - Answer Engine Optimization (AEO)
- [ ] **Answer-first layout** — "Question, Answer, Evidence" pattern: H2 as real question, 1-2 sentence direct answer, then supporting evidence. 44% of AI citations come from the first 30% of content.
- [ ] **Self-contained answer blocks** of 120-180 words between headings — 70% more ChatGPT citations vs unstructured. Each claim self-contained (no pronoun references requiring previous paragraphs).
- [ ] **Tables and comparison matrices** — 2.8x higher AI citations than text-only. Models reach 96% parsing accuracy on structured tables.
- [ ] **Numbered/bulleted lists** — listicles account for 50% of top AI citations. +200-300% citation lift vs unstructured text.
- [ ] **FAQ sections** — 72% citation rate vs 34% for paragraph-only versions. Question-formatted H2s are 84% more likely to trigger AI Overviews.
- [ ] Content clearly states: who it's for, what problem it solves, why it's better
- [ ] **Statistics and quotes boost citations** — adding statistics: +22% citation likelihood. Adding quotes from authoritative sources: +37%.
- [ ] **Original data, statistics, or research** — pages with original data earn 4.1x more AI citations. Real-time fact verification has 0.89 correlation with AI selection.
- [ ] Modular content blocks that AI can cite independently
- [ ] **Multimodal content** — text + images + video + schema = 156% higher citations. Full multimodal + schema = 317% more citations vs text-only.

#### C2 - Generative Engine Optimization (GEO)
- [ ] **Brand entity recognition** — consistent brand mentions across authoritative third-party sites. Brands in lowest quartile of web mentions are nearly absent from AI Overviews. ChatGPT now tags brands as structured entities (Oct 2025 update); fewer brands surfaced per answer (3-4 vs 6-7) means authority matters more.
- [ ] **Third-party review profiles** — presence on Trustpilot, G2, Capterra, Yelp increases citation probability 3x
- [ ] Expert reviews, press mentions, and industry recognition exist
- [ ] **Author attribution with visible credentials** — author credentials increase AI citations by +40%. Author identity is a direct input to Google's quality models.
- [ ] **Definitive language** — AI systems prefer "X is true" over "X might be true." High entity density (15+ recognized entities per page = 4.8x higher citation likelihood).
- [ ] Content includes verifiable data with current-year citations — pages citing current-year sources appear in positions 3-5 vs older references in positions 6-8
- [ ] **Content freshness maintained** — 53% of ChatGPT citations are content updated within 6 months. 23% of AI Overview featured content is <30 days old. Target 90-day update cadence for competitive topics.
- [ ] **Defensive AI SEO** — monitor AI answers about your brand across platforms. Create authoritative "single source of truth" content that AI prefers over misinformation. Publish FAQ sections addressing false narratives with verifiable data.

#### C3 - Technical AI Accessibility
- [ ] Content is in HTML (not trapped in JavaScript-only rendering)
- [ ] No cloaking (same content served to bots and users)
- [ ] Clean HTML structure (semantic elements: article, section, nav, main)
- [ ] Structured data is comprehensive — schema markup boosts AI citations by 36%. 2.3x more likely in AI Overviews vs pages without.
- [ ] **Page speed matters for AI** — pages with FCP under 0.4s average 6.7 citations; over 1.13s drops to 2.1 (3x difference)
- [ ] Site loads without JavaScript (SSR/SSG preferred for key content)
- [ ] Descriptive image alt text (AI can't see images without it)
- [ ] **AI crawler governance** — allow GPTBot, ClaudeBot, PerplexityBot for AI search visibility. Block Google-Extended if you want to prevent AI training without affecting traditional SEO. Only 14% of top domains have AI bot directives in robots.txt. GPTBot surged from 5% to 30% of AI crawler traffic (2024-2025).

#### C4 - Multi-Platform AI Visibility
Each platform cites different sources — only 11% of domains appear in both ChatGPT and Perplexity citations.

- [ ] **Google AI Overviews** — favors fresh community content (Reddit 20%, YouTube 23.3%, Wikipedia only 7%). 76% of citations from top-10 pages, but 47% come from positions #6-#20+. Informational queries: 99.9% AI Overview rate. Local queries: only 7.9%.
- [ ] **ChatGPT** — relies heavily on Wikipedia (43%) and training data. Prefers DA 60+ domains. 7.92 citations per question. Favors definitive language, high entity density, simple writing structures.
- [ ] **Perplexity** — real-time web retrieval, most transparent. 21.87 citations per question (highest). Favors recency over domain authority. YouTube (16.1%) and Reddit (6.6%) heavily cited.
- [ ] **Bing/Copilot** — software and tech sources preferred (SourceForge 21.33%). Important for Microsoft ecosystem and enterprise B2B searches.
- [ ] **Sitemap freshness** — Bing weights `lastmod`, `changefreq` more than Google
- [ ] Content is voice-search friendly (conversational Q&A format). 50%+ of local searches are now voice; 58% of consumers use voice for local business info.
- [ ] **Reddit presence** (if applicable) — Google AI Overviews cite Reddit 20% of the time. Authentic participation in relevant subreddits drives AI citations.
- [ ] **Video content** — YouTube = 23.3% of Google AI Overview citations. Chapter timestamps enable AI to cite specific segments.

### TIER 4: LINK BUILDING & AUTHORITY

Backlinks remain a core ranking factor but the game has shifted: **topical relevance beats raw domain authority**. A link from a DR 40 site in your niche can outperform a DR 80 link with no thematic connection. For AI search, backlinks matter primarily through organic ranking performance — 92% of AI Overview citations come from domains already in the top 10.

#### D1 - Link Profile Assessment
- [ ] **Balanced homepage vs deep page links** — natural profiles mix both. Heavily homepage-concentrated profiles are a red flag. Deep links to service/landing pages build topical authority for specific terms.
- [ ] **Anchor text distribution is safe** — 30-50% branded, 20-30% partial-match, <10% exact-match keywords. Over-optimized exact-match anchors trigger Penguin penalties.
- [ ] No spammy or irrelevant backlinks (PBNs, paid links, link exchanges, directory spam)
- [ ] Internal linking strategy connects service pages to homepage (see B4 Internal Linking for detailed checklist)
- [ ] **Link reclamation performed** — 66.5% of backlinks across top sites point to 404 pages. Identify broken backlinks and create 301 redirects. Unlinked brand mentions converted to links (25%+ conversion rate). Faster ROI than new link building.
- [ ] Competitor backlink sources identified for prospecting (use Link Intersect to find sites linking to competitors but not you)
- [ ] **Link velocity is natural** — new sites: 5-10 links/month initially. Established sites: +5-14.5% monthly growth in referring domains. Sudden spikes trigger scrutiny; consistent pace is safe.
- [ ] **Original research and data-driven content** created as link magnets — original research earns 8x more backlinks than curated/opinion content. 90%+ of successful digital PR campaigns use data-led content.
- [ ] **Nofollow/sponsored/UGC attributes** used correctly on outbound links — Google treats these as "hints" not strict exclusions; they may still pass some value

##### Link Building Tactics (Prioritized)
1. **Digital PR** — most effective tactic (48.6% of SEOs rank it #1). Expert commentary, original data studies, newsworthy angles. Cost: $10K-$50K/quarter for agencies; DIY via HARO/Connectively for editorial links at low cost.
2. **HARO/Connectively** — revived April 2025 with original format. Best cost-to-quality ratio for natural editorial links. Relationship-building outreach gets 25-30% response rate vs 1-2% for templates.
3. **Guest posting** — quality over quantity. Strategic placement on topically relevant, authoritative sites. $150-$400 per editorial placement.
4. **Broken link building** — find broken outbound links on relevant sites, offer your content as replacement.
5. **Resource page outreach** — works best in niche industries with curated resource lists.

##### Content Types That Earn Links
- **Original research/data studies** — 8x more backlinks than curated content
- **Infographics** — +178% link increase; 29% of sites prefer linking to infographics over lengthy articles
- **Interactive tools** — calculators, assessments, comparison engines earn natural links
- **Definitive guides** — comprehensive, authoritative reference content
- **"Why" and "What" posts** — 25.8% more links than how-to guides or videos

#### D2 - Local Link Building (Local Business)
Local links are weighted differently than national — proximity and relevance matter more. Google's Helpful Content system rewards genuine community participation.

- [ ] **Sponsorships** — local events, sports teams, nonprofits, charity auctions (organizers link to sponsor pages). Often overlooked but high ROI: local authority + community goodwill.
- [ ] **Local media outreach** — pitch newsworthy angles to local papers/outlets (highest authority + local relevance). Angles that work: community initiatives, industry awards, free services for nonprofits/seniors, local data or trends.
- [ ] **Business partnerships** — cross-promotional content with complementary businesses (landscaper + pool company, painter + realtor)
- [ ] **Chamber of Commerce membership** and professional association listings — geo-relevant, authoritative backlinks
- [ ] **Community involvement** documented on website and linked from event pages
- [ ] **Event hosting** — free workshops, webinars, community events generate links from promotional sites

#### D3 - Brand Signals
Brand search volume is the strongest predictor of AI citations (r=0.334), stronger than backlink count (r=0.37).

- [ ] Brand name searches are growing (or at minimum, exist)
- [ ] Social profiles exist and link to website
- [ ] Wikipedia or knowledge panel presence (if applicable)
- [ ] Brand mentioned in community discussions (forums, Reddit, etc.)
- [ ] Consistent brand presentation across all platforms
- [ ] **Entity consistency** — same brand name, author names, and identifiers across all web properties. AI systems use entity matching to build confidence.
- [ ] **Third-party presence** — brand visible on authoritative sites beyond your own (press mentions, industry publications, expert-curated lists). Sites with 32K+ referring domains are 3.5x more likely to be cited by ChatGPT.

---

## Ranking Factor Priority (Evidence-Based)

When prioritizing findings, weight recommendations by actual ranking impact. Focus effort where data confirms it matters.

### High-Impact Factors (prioritize these)

1. **Google Business Profile optimization** — Category, reviews, posting frequency, completeness. Drives the local map 3-pack more than any website change. Primary category is the #1 local ranking factor. Note: proximity now contributes only ~15% to local rankings (down from 25-30% in 2020); prominence and relevance signals (~60%) now dominate, meaning a further business with stronger signals outranks a closer one with weaker signals.
2. **E-E-A-T signals** — r=0.81 correlation with AI citations. Stronger predictor than domain authority. 96% of Google AI Overview content comes from verified E-E-A-T sources. Pages ranked #6-#10 with strong E-E-A-T are cited 2.3x more than #1-ranked pages with weak authority. Dec 2025 core update: sites with genuine expertise gained 23% traffic; AI content without expert oversight saw 87% negative impact; smaller expert blogs outranked enterprise sites lacking clear attribution.
3. **Title tags with location + service keywords** — Front-loaded, 50-60 characters. Highest-impact on-page element.
4. **H1 tags matching search intent** — H1 = keyword + city for local businesses.
5. **Content depth with original insights** — Pages with 2,500+ words consistently outrank thin competitors. Original data earns 4.1x more AI citations.
6. **Review velocity and recency** — New reviews increase rankings regardless of sentiment. This is a live ranking signal — rankings drop when review generation stops. Review text mentioning specific services and locations now carries additional ranking weight.
7. **Behavioral/engagement signals** — Clicks to directions, calls from GBP, website clicks, and message inquiries are active ranking factors. Google rewards businesses that "look alive" with regular activity and customer interactions. "Business open at search time" is a top-5 local ranking factor (Whitespark 2026).
8. **FAQ schema** — Rich result visibility reduced since 2023, but 3.2x more likely to appear in AI Overviews. High AI citation value outweighs reduced standard search visibility.
9. **Internal linking** — Distributes authority, helps Google understand site structure.
10. **Bing Places + Apple Business Connect** — LLMs pull from Bing. Siri pulls from Apple Maps. No longer optional.
11. **Structured data (JSON-LD)** — Content with schema is 2.3-2.5x more likely to appear in AI-generated answers.

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

## Google Spam Warnings (Local Business)

Flag these during audits — Google is actively penalizing:

- **Keyword-stuffed business names** — "Best Plumber in Denver - 24/7 Emergency" instead of legal name. Suspension risk.
- **Fake addresses** — Virtual offices or fake storefronts to game proximity. Algorithmic demotion or suspension.
- **Phone number spoofing** — Using local area codes that don't match actual location.
- **Service area abuse** — Claiming coverage you can't actually serve.
- **Review manipulation** — Fake reviews, paid reviews, review exchange schemes. Stricter enforcement in 2025+.
- **Thin city pages** — Generic content with city-name swaps. Spam update target.
- **NAP inconsistencies** — Same business with different name/address/phone across platforms.

Google's 2025 enforcement is significantly stricter: more aggressive spam profile filtering, higher suspension risk, algorithmic demotion without warning, and tighter review authentication (especially for SABs).

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
| Ask customers for reviews (coach them to mention service + city) | Every single one |
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
| Schema markup (JSON-LD) | 2.3-2.5x more likely to be cited; GPT-4 accuracy 16%→54% with schema |
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
- **Google Rich Results Test:** https://search.google.com/test/rich-results (Google-specific rich result eligibility)
- **Schema Markup Validator:** https://validator.schema.org (comprehensive validation across all engines)
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **Bing Places for Business:** https://www.bingplaces.com
- **Apple Business Connect:** https://businessconnect.apple.com
- **PageSpeed Insights:** https://pagespeed.web.dev
- **Whitespark Local Ranking Factors:** https://whitespark.ca/local-search-ranking-factors/
