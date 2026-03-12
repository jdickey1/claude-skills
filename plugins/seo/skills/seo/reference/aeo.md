# Answer Engine Optimization (AEO) — Full Audit Reference

Dedicated AEO audit framework for optimizing visibility across AI answer engines (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews). Covers ecommerce, service businesses, and content sites.

For foundational AI search data (citation stats, platform comparison, content formatting), see `ai-search.md`. This file covers the **audit methodology and implementation system**.

---

## AEO Audit Scoring (0-100)

| Section | Points | What It Measures |
|---------|--------|-----------------|
| AI Crawlability & Access | 0-20 | Can AI bots find and read your content? |
| Content Structure & Extractability | 0-25 | Is content formatted for AI citation? |
| Schema & Machine-Readable Data | 0-25 | Structured data AI agents can consume directly |
| Authority & Trust Signals | 0-30 | Why should AI recommend YOU over competitors? |

---

## Section 1: AI Crawlability & Access (0-20 pts)

### robots.txt AI Bot Access (8 pts)

Check `robots.txt` for explicit AI crawler directives. Only 14% of top domains have these — having them is a differentiator.

- [ ] **GPTBot allowed** — `User-agent: GPTBot` with `Allow: /` (or no Disallow). Required for ChatGPT citations. GPTBot surged from 5% to 30% of AI crawler traffic 2024-2025.
- [ ] **ClaudeBot allowed** — `User-agent: ClaudeBot` with `Allow: /`. Required for Claude/Anthropic citations.
- [ ] **PerplexityBot allowed** — `User-agent: PerplexityBot` with `Allow: /`. Required for Perplexity citations.
- [ ] **Google-Extended** — Allow if you want AI Overview citations. Block only if you want to prevent Google AI training without affecting regular search.

**Audit method:** `curl -s https://{domain}/robots.txt | grep -iE 'gptbot|claudebot|perplexitybot|google-extended|chatgpt|anthropic'`

### Technical Accessibility (12 pts)

- [ ] **Content in HTML, not JS-only** — AI crawlers can't execute JavaScript. SSR/SSG required for key content. Check: disable JS in browser and verify content still renders.
- [ ] **No cloaking** — Same content served to bots and users.
- [ ] **Fast page load** — Pages with FCP under 0.4s average 6.7 AI citations; over 1.13s drops to 2.1 (3x difference). Check via PageSpeed Insights.
- [ ] **Mobile-optimized** — AI systems prioritize mobile content (Google mobile-first indexing).
- [ ] **No noindex on revenue pages** — AI won't cite pages excluded from search indexes.
- [ ] **Sitemap freshness** — `lastmod` dates current and accurate. Bing (which feeds ChatGPT) weights `lastmod` and `changefreq` more than Google.

---

## Section 2: Content Structure & Extractability (0-25 pts)

### Answer-First Content Format (10 pts)

AI models extract answers from the first 30% of content 44% of the time. Structure matters more than length.

- [ ] **Direct answer leads each page/section** — 30-60 word neutral, factual summary in the opening paragraph. Write it the way you'd want ChatGPT to say it. This is the paragraph AI will quote verbatim.
- [ ] **Self-contained answer blocks** — 120-180 word blocks between headings. Each block is independently citable (no pronoun references to previous sections). 70% more ChatGPT citations vs unstructured.
- [ ] **Atomic paragraphs** — 1-3 sentences per paragraph. Dense, scannable, quotable.
- [ ] **Question-formatted headings** — H2s phrased as real questions (matches how users query AI). 84% more likely to trigger AI Overviews.
- [ ] **Definitive language** — "X is the best for Y because Z" beats "X might be good for Y." AI prefers confident, verifiable assertions.

### Structured Data Formats (10 pts)

- [ ] **Comparison tables** — 2.5-2.8x citation rate vs text-only. Use for product comparisons, service comparisons, feature matrices. Models achieve 96% parsing accuracy on structured tables.
- [ ] **Numbered/bulleted lists** — Listicles account for 50% of top AI citations. +200-300% citation lift vs unstructured text.
- [ ] **FAQ sections** — 72% citation rate vs 34% for paragraph-only. Pull questions directly from real AI query testing (see Answer Intent Mapping below).
- [ ] **Statistics with attribution** — Adding statistics: +22% citation likelihood. Adding quotes from authoritative sources: +37%.
- [ ] **Original data or research** — Pages with original data earn 4.1-5.5x more AI citations. This is the single strongest content differentiator.

### Content Freshness (5 pts)

- [ ] **Publication and update dates visible** — Missing dates signal staleness. AI deprioritizes undated content.
- [ ] **Updated within 6 months** — 53% of ChatGPT citations are content updated within 6 months. 23% of AI Overview featured content is <30 days old.
- [ ] **Current-year citations** — Pages citing current-year sources appear in positions 3-5 vs older references in positions 6-8.

### Passage-Level Citability Scoring

Score every substantive content block on the page (paragraphs between headings, list sections, table sections) on a 0-100 citability scale. This measures how likely AI models are to extract and quote each passage.

**Optimal passage length:** 134-167 words. Research shows this is the sweet spot for AI citation — long enough for substance, short enough to quote verbatim.

**5 Scoring Dimensions:**

| Dimension | Weight | What to Evaluate |
|-----------|--------|-----------------|
| Answer Block Quality | 30% | Does it directly answer a question in 1-3 sentences? Contains definition patterns ("X is...", "X refers to...")? Answer appears in first 60 words? Has a question-based heading? Contains quotable, verifiable claims? |
| Self-Containment | 25% | Understandable without surrounding context? Low pronoun density (fewer "it", "they", "this", "that")? Contains named entities and proper nouns instead of references? No dangling references to other sections? |
| Structural Readability | 20% | Average sentence length 10-20 words? Mix of sentence lengths? Contains list-like structures (first/second/third, numbered items)? Clear paragraph breaks? |
| Statistical Density | 15% | Contains percentages, dollar amounts, specific numbers with context? Year references for timeliness? Named sources or attributions ("according to", "per Gartner")? |
| Uniqueness Signals | 10% | Contains original data ("our research found", "we analyzed")? Case studies or real-world examples? Specific tool/product mentions showing practical experience? |

**Scoring each block:**
1. Read each content block between headings
2. Score 0-100 per dimension based on criteria above
3. Calculate weighted total
4. Grade: A (80+) Highly Citable, B (65-79) Good, C (50-64) Moderate, D (35-49) Low, F (<35) Poor

**Page Citability Score** = average of top 5 scoring blocks (rewards pages with at least some strong passages).

**Output in audit:**
- Page Citability Score with grade
- Top 3 most citable passages (with scores and why they work)
- Bottom 3 passages needing improvement (with specific fixes: "add a statistic", "remove pronoun references", "shorten to 134-167 words", "lead with the answer")

---

## Section 3: Schema & Machine-Readable Data (0-25 pts)

### JSON-LD Schema Markup (15 pts)

Schema markup boosts AI citations 2.3-2.5x. All schema must be JSON-LD format (Google's preference, separates data from HTML).

**Required schema by page type:**

| Page Type | Required Schema | Priority |
|-----------|----------------|----------|
| Homepage | Organization (founding date, social links, knowsAbout) | Critical |
| Service/Product pages | Product or Service + AggregateRating | Critical |
| Guide/Hub pages | ItemList (ranked items) + FAQPage | Critical |
| FAQ pages | FAQPage with Question/Answer pairs | High |
| How-to content | HowTo with step-by-step markup | High |
| Blog/Articles | Article with author, datePublished, dateModified | Medium |
| Team/About | Person schema with credentials | Medium |

**Validation:** Test all schema at https://validator.schema.org and https://search.google.com/test/rich-results

- [ ] **FAQPage schema** on pages with Q&A content (highest citation impact)
- [ ] **Organization schema** on homepage with `knowsAbout`, `foundingDate`, social `sameAs` links
- [ ] **Product/Service schema** with identifiers (GTIN, MPN, or SKU), pricing, availability, AggregateRating
- [ ] **Article schema** with `author`, `datePublished`, `dateModified` on content pages
- [ ] **All schema validates** — zero errors in Rich Results Test

### Machine-Readable Brand Data (10 pts)

These are direct signals to AI agents — structured data they can consume without scraping.

- [ ] **`/llms.txt` file** — See llms.txt Audit & Generation subsection below.
- [ ] **Brand-Facts page** (`/about/facts` or `/brand-facts`) — Wikipedia-style neutral facts page: one-sentence TL;DR, key facts table (founded, category, pricing, certifications, guarantees), links to external profiles (Wikidata, Crunchbase, social, press). This gets crawled by AI bots more than marketing pages.
- [ ] **`/.well-known/brand-facts.json`** (ecommerce/product businesses) — Machine-readable JSON with brand name, category, price range, top SKUs with specs, certifications, policies, `lastUpdated` timestamp. Welcome mat for AI agents.
- [ ] **Structured product feeds** (ecommerce) — Google Merchant Center with GTINs, front-loaded titles with specs, complete attributes, 1200px+ images, 50+ reviews at 4.2+ stars. Required for GPT Shopping.

### llms.txt Audit & Generation

The `llms.txt` standard is an emerging specification that helps AI crawlers understand your site structure and find your most important content. It lives at the domain root (`/llms.txt`) with an optional extended version (`/llms-full.txt`).

**Audit steps:**

1. **Fetch `/llms.txt`** — check if it exists (200 vs 404)
2. **Fetch `/llms-full.txt`** — check if extended version exists
3. **Validate format** if present:
   - First line must be `# Site Name` (H1 title)
   - Blockquote description: `> Brief description of what this site/business does`
   - Sections organized by `## Heading` (e.g., `## Products`, `## Resources`, `## Company`)
   - Links in markdown format: `- [Page Title](url): Optional description`
   - At least 5 page links across at least 2 sections

**llms.txt Score (contributes to Section 3 total):**

| Score | Criteria |
|-------|----------|
| 0 | File absent |
| 30 | Present but malformed (missing title, no sections, broken links) |
| 50 | Valid format but minimal (fewer than 5 links or 2 sections) |
| 70 | Valid format, covers primary content areas, 10+ links |
| 90-100 | Comprehensive with `/llms-full.txt` also available, descriptions on links |

**Generation (when absent or malformed):**

Generate a ready-to-deploy `llms.txt` by analyzing the site:

1. **Extract site name** from `<title>` tag (before any `|` or `-` separator)
2. **Extract description** from `<meta name="description">` content
3. **Crawl internal links** from homepage + sitemap.xml (up to 30 pages)
4. **Categorize pages** into sections:

| Section | URL path signals |
|---------|-----------------|
| Main Pages | `/`, `/home`, uncategorized top-level pages |
| Products & Services | `/pricing`, `/features`, `/product`, `/solutions`, `/demo`, `/services` |
| Resources & Blog | `/blog`, `/article`, `/resource`, `/guide`, `/learn`, `/docs` |
| Company | `/about`, `/team`, `/career`, `/contact`, `/press`, `/partner` |
| Support | `/help`, `/support`, `/faq`, `/status` |

5. **Output format:**
```
# [Site Name]
> [Meta description or "Official website of [Site Name]"]

## [Section Name]
- [Page Title](url)
- [Page Title](url)

## Contact
- Website: [base URL]
- Email: contact@[domain]
```

6. **Also generate `llms-full.txt`** — same structure but with descriptions on each link pulled from each page's meta description:
   `- [Page Title](url): [meta description]`

Present both files in the audit output, ready for the site owner to deploy.

---

## Section 4: Authority & Trust Signals (0-30 pts)

### 19 Measurable AI Trust Signals

AI models verify brands before recommending them. Score each signal as present (1) or absent (0), then weight by category.

**Entity Identity (6 pts)**
- [ ] Comprehensive About/Team page with real photos and credentials
- [ ] Consistent NAP (Name/Address/Phone) across website and all external listings
- [ ] Wikidata entry with verified facts (or Crunchbase/LinkedIn company page)
- [ ] Social profiles linked and active (matches `sameAs` in Organization schema)
- [ ] Press page linking to all external coverage
- [ ] Clear brand values/mission statement

**Expertise Signals (8 pts)**
- [ ] Author attribution with visible credentials on content pages (+40% AI citation lift)
- [ ] Case studies or portfolio with measurable results
- [ ] Original research, data, or proprietary insights published
- [ ] Educational content hub (resource library, guides, knowledge base)
- [ ] Industry recognition (awards, certifications, professional memberships)
- [ ] Content depth and topical authority (comprehensive coverage of your domain, not thin surface content)
- [ ] Transparent pricing or service descriptions
- [ ] Customer responsiveness indicators (response time, support channels)

**Third-Party Validation (10 pts)**

This separates brands that KIND OF show up in AI from brands that show up CONSISTENTLY. AI models cross-reference what others say about you.

- [ ] **Third-party review profiles** — Presence on Trustpilot, G2, Capterra, Yelp, BBB, or industry-specific review sites. 3x higher citation probability.
- [ ] **External citations** — Your brand mentioned on authoritative sites you don't control (review roundups, industry publications, comparison articles).
- [ ] **Comparison pages** — `/compare/you-vs-competitor` pages on your own site that cite external sources (AI sees citations going both ways).
- [ ] **Community presence** — Authentic engagement on Reddit, Quora, or industry forums where your category is discussed. AI models heavily reference Reddit threads and Quora answers.
- [ ] **Authoritative outbound citations** — Your content cites credible external sources (studies, government data, industry reports). This signals research rigor.

**Defensive Signals (6 pts)**
- [ ] Policies publicly accessible (returns, privacy, terms, guarantee)
- [ ] Factual accuracy across all content (no contradictory claims between pages)
- [ ] Consistent entity information across all platforms (website, GBP, social, directories)

---

## Answer Intent Mapping (The Foundation)

Before optimizing anything, you need to know what AI is currently saying about your category and brand. This is competitive intelligence most businesses have never looked at.

### How to Run an Answer Intent Audit

1. **Generate 30-50 query variations** for your category:
   - "best [category] in [location]"
   - "best [category] for [use case]"
   - "[your brand] vs [competitor]"
   - "is [your brand] worth the price"
   - "[category] for [audience segment]"
   - "what should I look for in a [category]"
   - "how much does [service/product] cost"
   - "[your brand] reviews"

2. **Test each query** in ChatGPT, Perplexity, and Google (for AI Overviews):
   - Log which brands get recommended
   - Note exact wording the AI uses
   - Note which sources it cites (URLs)
   - Record whether your brand appears and in what position

3. **Build the Answer Intent Map** — a table with columns:
   | Query | ChatGPT Answer | Perplexity Answer | Google AIO | Your Brand Mentioned? | Sources Cited |

4. **Identify gaps** — queries where competitors appear but you don't

This map drives every other optimization. Update it monthly during the maintenance loop.

### Quantitative Visibility Scorecard

After running the Answer Intent Map, produce a structured scorecard that enables run-over-run comparison.

**Per-Query Scoring:**

For each query tested, log:

| Field | Values | Description |
|-------|--------|-------------|
| Query | text | The search query tested |
| Brand Mentioned | yes/no | Whether target brand appears in results |
| Prominence | high/medium/low/none | high = top 3 results or first mention, medium = page 1, low = deep in results |
| Competitor Count | 0-N | How many competitors appeared for this query |
| Top Competitors | names | Which competitors appeared (up to 3) |

**Visibility Score Formula:**

```
Mention Rate    = (queries where brand mentioned) / (total queries) x 100
Prominence Rate = (queries with high/medium prominence) / (queries where mentioned) x 100
Visibility Score = (Mention Rate x 0.6) + (Prominence Rate x 0.4)
```

A score of 0-20 = invisible, 20-40 = weak, 40-60 = emerging, 60-80 = competitive, 80-100 = dominant.

**Competitor Frequency Table:**

Rank all brands/competitors by how often they appear across all tested queries:

| Rank | Competitor | Appearances | % of Queries | Avg Prominence |
|------|-----------|-------------|--------------|----------------|
| 1 | [name] | X/Y | Z% | high/medium/low |
| 2 | [name] | X/Y | Z% | high/medium/low |
| ... | ... | ... | ... | ... |
| ? | **[Target Brand]** | X/Y | Z% | high/medium/low |

This shows exactly where the brand stands relative to its competitive set.

**Gap Analysis:**

Identify the highest-value gaps — queries where 2+ competitors appear but the target brand does not. These are the priority content targets for the implementation roadmap.

**Historical Tracking:**

After each audit run, append a summary row to enable trend monitoring:

```
| Date | Queries Tested | Mention Rate | Prominence Rate | Visibility Score | Top Competitor | Notes |
```

Store this in the audit report. When running subsequent audits for the same business, include the trend line showing score movement over time.

---

## Service Business Adaptations

The 7-layer ecommerce framework adapts to service businesses (law firms, consultants, agencies) with these modifications:

### Answer Hub → Service Authority Page
- URL: `/guides/best-[service]-[location]-[year]` (e.g., `/guides/best-business-attorney-austin-2026`)
- Same structure: TL;DR (60-90 words), ranked list of firms (yours at #1 + real competitors), comparison table (years in practice, specialties, case results, consultation fee, rating), FAQ from Answer Intent Map
- Key difference: emphasize credentials, case outcomes, and trust signals over price

### Brand-Facts → Firm Profile
- Include: founding year, practice areas, attorney credentials, bar memberships, notable cases/clients (if public), office locations, consultation process
- Link to bar association profiles, Martindale-Hubbell, Avvo, Google reviews

### Third-Party Citations → Professional Directories
- Legal: Avvo, Martindale-Hubbell, Super Lawyers, Best Lawyers, bar association directories
- Consulting: Clutch, GoodFirms, industry association directories
- General: BBB, Chamber of Commerce, local business directories

### Measured Results for Services
- 3x better citation rates when buyer prompts are accurately mapped
- 280% increase in consultations when firms get cited in AI recommendations
- Law firm case study: 37 mentions (48.7% share) vs competitor's 16 (21.1%) drove significant lead volume

---

## Platform-Specific Optimization Notes

| Platform | Top Sources | Citations/Answer | What It Favors |
|----------|------------|-----------------|----------------|
| **ChatGPT** | Wikipedia (47.9%), authoritative domains | ~8 | Long-form (360+ words), DA 60+, definitive language, entity density |
| **Google AIO** | Reddit (20%), YouTube (23.3%) | ~7.7 | Fresh community content, multi-source, brand name prominence |
| **Perplexity** | Reddit (6.6%), YouTube (2.0%) | ~22 | Recency over authority, community discussion, highest word count |
| **Claude** | Highly structured pages | Fewer, selective | Clean hierarchy, scannable formatting, factual density |

Only 11% of domains appear in both ChatGPT and Perplexity citations. 25% domain overlap between Perplexity and ChatGPT. Optimize for each platform, not just one.

---

## Common AEO Mistakes (Auto-Flag in Audit)

Flag these automatically when found during an audit:

| Mistake | Severity | Why It Kills Citations |
|---------|----------|----------------------|
| AI bots blocked in robots.txt | CRITICAL | Zero citations if bots can't crawl |
| No publication/update dates | HIGH | Signals staleness to AI |
| Generic AI-written content | HIGH | LLMs detect and ignore it; original insights required |
| Paragraph prose for comparison queries | HIGH | Tables beat prose 2.8x for these queries |
| Missing schema markup | HIGH | 2.3-2.5x citation gap vs pages with schema |
| No About/Team page | HIGH | AI can't verify entity identity |
| Claims without sources | MEDIUM | Reduces trust score; AI prefers verifiable assertions |
| Skipped heading levels | MEDIUM | 3.2x citation rate difference with proper hierarchy |
| No FAQ sections | MEDIUM | 72% vs 34% citation rate |
| Only optimizing for Google | MEDIUM | Misses ChatGPT/Perplexity entirely |
| Timestamp-only "updates" | LOW | +12% vs +71% for meaningful content updates. AI detects fake freshness. |

---

## Weekly Maintenance Loop (90 min)

After initial optimization, maintain AI visibility with this weekly routine:

1. **Citation check (20 min)** — Run 10-15 prompts from your Answer Intent Map in ChatGPT and Perplexity. Log whether you're cited and who else shows up. Track position changes.
2. **Content refresh (30 min)** — Update your Answer Hub/Authority Page TL;DR with any new data points, citations, or competitive changes. Add one new FAQ or comparison section.
3. **Schema & feed health (15 min)** — Fix any schema validation errors. For ecommerce: clear Merchant Center warnings, push 10+ new reviews to weakest product.
4. **Citation building (25 min)** — One outreach action: pitch a review site, engage on Reddit/Quora, publish a comparison page, or update an external directory listing.

**Monthly:** Refresh `brand-facts.json` / `llms.txt`, validate all PDP schema, update policy changes, re-run full Answer Intent Map audit.

**Track these KPIs:**
- Number of target queries where you're #1 recommendation
- AI referral traffic volume (GA4 AI channel group)
- AI referral conversion rate vs other channels
- Citation sentiment (positive/neutral/negative)

---

## GA4 AI Traffic Measurement Setup

To track AI-referred traffic in Google Analytics 4:

1. **Create "AI" channel group** — Admin > Data Display > Channel Groups > Add new group
2. **Define source rules:**
   - Source contains: `chatgpt.com`, `chat.openai.com` (ChatGPT)
   - Source contains: `perplexity.ai` (Perplexity — cleanest attribution)
   - Source contains: `gemini.google.com` (Gemini)
   - Source contains: `copilot.microsoft.com` (Copilot)
3. **Known limitations:**
   - ChatGPT free tier sends no referrer (appears as "Direct")
   - Gemini often appears as direct traffic
   - Perplexity has cleanest attribution
4. **Supplement with UTM parameters** on links you control (brand-facts pages, llms.txt links)

AI-driven sessions grew 527% YoY in early 2025. ChatGPT referrals went from ~600/month to 22,000+ by May 2025 for tracked sites.

---

## AEO Audit Output Format

```
# AEO Audit: [Business Name / Domain]
**Date:** [date]
**Pages Reviewed:** [count]
**AEO Readiness Score:** [X/100]

## Score Breakdown
- AI Crawlability & Access: [X/20]
- Content Structure & Extractability: [X/25]
- Schema & Machine-Readable Data: [X/25]
- Authority & Trust Signals: [X/30]

## Citability Analysis
**Page Citability Score: [X/100] — [Grade]**

Top citable passages:
1. [Passage heading/preview] — [Score]/100 (strengths: [why it works])
2. [Passage heading/preview] — [Score]/100
3. [Passage heading/preview] — [Score]/100

Passages needing improvement:
1. [Passage heading/preview] — [Score]/100 (fix: [specific action])
2. [Passage heading/preview] — [Score]/100 (fix: [specific action])

## llms.txt Status
**Status:** [Present/Absent] | **Score:** [X/100]
[If present: validation results. If absent: generated llms.txt + llms-full.txt included below]

## Visibility Scorecard
**Mention Rate:** [X]% ([N] of [Y] queries)
**Prominence Rate:** [X]% ([N] high/medium of [M] mentions)
**Visibility Score:** [X]/100 — [invisible/weak/emerging/competitive/dominant]

### Competitor Frequency
| Rank | Competitor | Appearances | % of Queries | Avg Prominence |
|------|-----------|-------------|--------------|----------------|
| 1 | [name] | X/Y | Z% | high/medium/low |
| ... | ... | ... | ... | ... |
| ? | **[Target Brand]** | X/Y | Z% | high/medium/low |

### High-Value Gaps
[Queries where 2+ competitors appear but target brand does not — these are priority content targets]

### Answer Intent Map
| Query | Brand Found | Prominence | Top Competitors | Gap? |
|-------|------------|------------|-----------------|------|
| [query] | yes/no | high/med/low/none | [names] | yes/no |

### Historical Trend
| Date | Queries | Mention Rate | Prominence Rate | Visibility Score | Top Competitor |
|------|---------|-------------|-----------------|-----------------|----------------|
| [date] | [N] | [X]% | [X]% | [X]/100 | [name] |

## Top Priority Findings
[Ranked by impact on AI citations — gap analysis queries inform content priorities]

## Implementation Roadmap
- Week 1: [highest-impact quick wins]
- Week 2: [content restructuring]
- Week 3: [schema + machine-readable data]
- Week 4: [authority building + maintenance loop setup]
```
