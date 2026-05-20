# Answer Engine Optimization (AEO) — Full Audit Reference

Dedicated AEO audit framework for optimizing visibility across AI answer engines (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews). Covers ecommerce, service businesses, and content sites.

For foundational AI search data (citation stats, platform comparison, content formatting), see `ai-search.md`. This file covers the **audit methodology and implementation system**.

---

## Google Search vs AI-Engine Scope (Governing Principle)

> **Source:** Google Search Central, "Optimizing for generative AI features on Google Search" — https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (last updated 2026-05-15). This is the authoritative first-party statement for Google's AI features (AI Overviews, AI Mode). Where this reference predates or conflicts with it, Google's guidance governs *for Google Search*.

**What Google officially states:**

- Google's AI features run **retrieval-augmented generation (RAG)/grounding plus query fan-out over Google's core Search index** — the model issues a set of related queries concurrently and grounds its answer in pages already retrievable from that index. It does not run `site:domain.com` operator searches against individual websites.
- The path to visibility in Google's AI features is **foundational SEO plus genuinely useful, people-first, non-commodity content** — the same fundamentals that earn classic Search visibility. There is no separate AI-specific ranking lever.
- Google **does not require** `llms.txt`/special markup, AI-specific content "chunking" or rewriting, or structured-data overfocus as inputs to its AI features. (Structured data can support rich results generally; it is not an AI-Overviews/AI-Mode admission ticket.)
- Google classifies **seeking inauthentic mentions** and **scaled content abuse** (mass per-variation or per-fan-out-term pages created to manipulate rankings) as **spam**.

**The principle this reference follows:**

1. **Engine-scope every AI tactic.** State which engines a tactic applies to. Google Search, ChatGPT, Perplexity, and Bing-fed surfaces differ; a tactic legitimate for one is not automatically legitimate for all.
2. **Never present a Google-disclaimed tactic as a Google Search input.** Tactics Google explicitly disclaims (llms.txt, AI-specific chunking, structured-data overfocus) are retained here only where they remain load-bearing for non-Google engines (ChatGPT/Bing/Perplexity), and are explicitly fenced as *not* Google Search signals.
3. **Never recommend a tactic that is disingenuous on any engine.** Inauthentic mentions, sockpuppet/persona seeding, and scaled coverage-driven page generation are spam everywhere — they are reversed, not scoped.

This scope statement is the anchor the rest of this reference is reconciled toward. Dated caveats below ("per Google's 2026-05-15 guidance") mark text that this principle supersedes.

**Stance (the rhetorical position this reconciliation takes):**

Industry response to every Google guidance update oscillates between two unhelpful camps: "SEE? IT'S JUST SEO" (Google as scripture) and "see, here's the proof they're lying" (Google as adversary). Both flatten Google's guidance into a posture rather than treating it as one self-interested input among several. This reference rejects both camps. Google's guidance is the authoritative input *for Google's AI features* because Google defines those surfaces — but Google's optimization layer covers one engine of many. ChatGPT, Perplexity, Claude, Copilot, Gemini, and a long tail of vertical agents make their own retrieval decisions on different infrastructure with different incentives. The shared optimization layer is shrinking; the per-engine surface area is growing. The "Scoped (temper) vs Reversed (remove)" framework above is the technical implementation of that stance.

External articulation of this position, with citations to the Bing-published counter-guidance referenced below: Mike King (iPullRank), *"Google's Guidance on AI Search is Naive and Self-Serving"* — https://ipullrank.com/google-ai-search-guidance (May 2026).

---

## AEO Audit Scoring (0-125)

| Section | Points | What It Measures |
|---------|--------|-----------------|
| AI Crawlability & Access | 0-20 | Can AI bots find and read your content? |
| Content Structure & Extractability | 0-25 | Is content formatted for AI citation? |
| Schema & Machine-Readable Data | 0-25 | Structured data AI agents can consume directly |
| Authority & Trust Signals | 0-30 | Why should AI recommend YOU over competitors? |
| Fan-Out Query Readiness | 0-25 | Does on-site content depth match AI sub-query patterns? (See `reference/fan-out-queries.md`) |

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

> **Engine scope (per Google 2026-05-15):** Google's guidance explicitly states that **AI-specific content "chunking" or rewriting is not required for Google Search** AI features — foundational content quality and normal good structure are sufficient; there is no separate passage-optimization lever for Google. This passage-citability scoring is a **non-Google-engine optimization** (ChatGPT/Bing/Perplexity citation behavior), retained because it remains load-bearing there. Do not present a passage-citability sub-score as a Google AI-readiness signal. Writing answer-first, well-structured content is still good practice for all engines — the caveat is against *AI-specific re-chunking as a Google tactic*, not against clear structure.

Score every substantive content block on the page (paragraphs between headings, list sections, table sections) on a 0-100 citability scale. This measures how likely AI models (ChatGPT/Bing/Perplexity-class) are to extract and quote each passage.

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

> **Engine scope (per Google 2026-05-15):** Google's guidance is explicit that **structured data is not a required input to Google's AI features** (AI Overviews / AI Mode) and that **structured-data overfocus is not the path** to Google AI visibility. Structured data still supports classic rich results and is good general SEO hygiene — but do not score or present schema as a Google-AI-citation lever. The "2.3-2.5x" figure below is a **directional, non-Google estimate** supported by four independent studies and counter-balanced by one rigorous null result; cite directionally, not as a load-bearing number. This schema sub-score is a non-Google-engine signal.

Schema markup is associated with **~2.3-2.5x more AI citations on ChatGPT/Bing/Perplexity-class engines** (directional, non-Google, not a Google AI-features input). All schema should still be JSON-LD format (Google's stated preference for rich results; separates data from HTML).

**Evidence base (multi-study triangulation, May 2026):**

- **OtterlyAI** ([speakerdeck.com/thomaspeham/geo-experiments-2026](https://speakerdeck.com/thomaspeham/geo-experiments-2026-what-we-tested-what-failed-and-what-actually-works)) — 2,000+ URLs, Google AI Overviews citations +1,500% after schema; **ChatGPT citations dropped** (engine asymmetry — schema is not uniformly positive across AI engines).
- **AirOps / Kevin Indig** ([airops.com/report/the-fan-out-effect](https://www.airops.com/report/the-fan-out-effect-what-happens-between-a-query-and-a-citation)) — JSON-LD pages gained 6.5% over non-JSON-LD.
- **UC Berkeley 2025 paper** ([arxiv.org/html/2509.10762v1](https://arxiv.org/html/2509.10762v1)) — +39% AI citation lift correlated with structured data; reportedly examined depth-of-schema effects.
- **Digital Applied** ([digitalapplied.com/blog/we-analyzed-1000-ai-overviews-citation-pattern-study](https://www.digitalapplied.com/blog/we-analyzed-1000-ai-overviews-citation-pattern-study)) — 1,000 Google AI Overviews; schema-marked pages cited 2.3x more than unstructured.
- **Ahrefs (counter-study, must cite for honesty)** ([ahrefs.com/blog/schema-ai-citations](https://ahrefs.com/blog/schema-ai-citations/)) — no improvement in AI citations after schema; **the only one of the cited studies that tested *same pages* with/without schema**. The four positive studies above all carry possible site-level selection bias (schema-using sites are run by more SEO-aware teams that do many things better).
- Cross-synthesis (2026-05-19): [@CyrusShepard on X](https://x.com/cyrusshepard/status/2056661659876245591) reviewed 40+ AI studies and landed on "use schema, but don't bank your strategy on it" — the operator-grade stance encoded in this section.

**Engine-asymmetry caveat:** Treat schema as a positive signal for Google rich results (high confidence) and for Perplexity / Bing / non-Google AI engines (directional). For ChatGPT specifically, OtterlyAI's same-URLs data showed citations *decrease* after schema was added — mechanism unknown. Don't assume positive transfer across all AI engines.

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

> **Engine scope (per Google 2026-05-15):** `llms.txt` / special markup for AI is **not a Google Search input** — Google's guidance explicitly disclaims it as a requirement for its AI features. These signals are retained as **non-Google-engine** tactics (ChatGPT/Bing/Perplexity and AI-agent crawlers); score them as such, never as Google AI-readiness. A Brand-Facts page is also just good entity hygiene (it helps classic Search and human trust) — keep it, but not as a Google-AI lever.

These are direct signals to some AI agents — structured data they can consume without scraping (non-Google-engine scope; see caveat above).

- [ ] **`/llms.txt` file** — See llms.txt Audit & Generation subsection below.
- [ ] **Brand-Facts page** (`/about/facts` or `/brand-facts`) — Wikipedia-style neutral facts page: one-sentence TL;DR, key facts table (founded, category, pricing, certifications, guarantees), links to external profiles (Wikidata, Crunchbase, social, press). This gets crawled by AI bots more than marketing pages.
- [ ] **`/.well-known/brand-facts.json`** (ecommerce/product businesses) — Machine-readable JSON with brand name, category, price range, top SKUs with specs, certifications, policies, `lastUpdated` timestamp. Welcome mat for AI agents.
- [ ] **Structured product feeds** (ecommerce) — Google Merchant Center with GTINs, front-loaded titles with specs, complete attributes, 1200px+ images, 50+ reviews at 4.2+ stars. Required for GPT Shopping.

### llms.txt Audit & Generation

> **Scope + freshness caveat (per Google 2026-05-15):** Google has **explicitly stated `llms.txt` is not used by Google Search** or its AI features. Treat this entire subsection as **ChatGPT/Bing/Perplexity-and-AI-agent scope only**. It is an emerging, non-standardized convention with uneven adoption — audit/generate it for non-Google AI surfaces, but never report an `llms.txt` score as Google AI-readiness, and never recommend it as a Google ranking/citation tactic.

The `llms.txt` standard is an emerging specification that helps *some non-Google* AI crawlers understand your site structure and find your most important content. It lives at the domain root (`/llms.txt`) with an optional extended version (`/llms-full.txt`).

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

> **Authenticity guardrail (hard rule — read before scoring this section).** Third-party presence is scored as an **outcome of real work and real expertise**, never as a lever to manufacture. Google explicitly classifies **seeking inauthentic mentions** as spam (per Google 2026-05-15; https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), and it is disingenuous on *every* engine, not just Google. **Never** recommend or score: coordinated/seeded/paid mentions, sockpuppet or "neutral persona" accounts, astroturfed forum/Reddit/Quora activity, review solicitation that distorts rating authenticity, self-placed mentions dressed as third-party, or any mention-building whose purpose is to influence AI rather than to genuinely help a real audience. If presence was manufactured, it scores **zero** and is flagged as a spam risk — a high mention count obtained inauthentically is a liability, not a signal. The legitimate path is being genuinely worth mentioning; mirror the skill's existing anti-manipulation stance (`local-seo.md` review-manipulation / thin-page warnings).

- [ ] **Third-party review profiles** — *Organic* presence on Trustpilot, G2, Capterra, Yelp, BBB, or industry-specific review sites, with authentic, unsolicited-or-compliantly-solicited reviews. ~3x higher citation probability — but only real profiles count; never gate, incentivize, or astroturf reviews.
- [ ] **External citations (earned)** — Your brand *organically* mentioned on authoritative sites you don't control (review roundups, industry publications, comparison articles) because the work merited it. Earned, not placed or seeded.
- [ ] **Comparison pages** — `/compare/you-vs-competitor` pages on your own site that cite external sources and present honest, even-handed criteria (no self-ranking; see Service Authority Page guidance).
- [ ] **Community presence (authentic only)** — Genuine, disclosed, value-adding participation by real people from your org in Reddit, Quora, or industry forums where your category is discussed. This is a *behavioral* signal of real engagement — not a channel to seed mentions. Astroturfing or persona accounts here are spam and disqualifying.
- [ ] **Authoritative outbound citations** — Your content cites credible external sources (studies, government data, industry reports). This signals research rigor.

**Defensive Signals (6 pts)**
- [ ] Policies publicly accessible (returns, privacy, terms, guarantee)
- [ ] Factual accuracy across all content (no contradictory claims between pages)
- [ ] Consistent entity information across all platforms (website, GBP, social, directories)

---

## Answer Intent Mapping (The Foundation)

Before optimizing anything, you need to know what AI is currently saying about your category and brand. This is competitive intelligence most businesses have never looked at.

### Fan-Out Query Awareness

AI engines don't make a single search per user query — they **fan out into multiple related sub-queries** and synthesize the results. *How* they do this differs by engine, and the difference is load-bearing:

- **Google Search (AI Overviews / AI Mode):** per Google's 2026-05-15 guidance, fan-out is **concurrent related queries grounded (RAG) over Google's core Search index** — the model retrieves pages Google already indexes. It does **not** run `site:domain.com` operator searches against individual websites. There is no "search within your site" phase to optimize for; the lever is being genuinely useful, indexable, non-commodity content that the core index already ranks.
- **ChatGPT (GPT 5.4, Bing-index) and similar Bing-fed surfaces:** these *do* use `site:` operator sub-queries extensively (March 2026+), effectively searching within trusted domains. The three-phase pattern below describes **this engine class — not Google**:

1. **Phase 1 (Discovery):** Broad queries identify which domains are relevant
2. **Phase 2 (Site-specific):** `site:yoursite.com [topic]` queries extract detailed content from each trusted domain *(ChatGPT/Bing-class only; not a Google mechanism)*
3. **Phase 3 (Validation):** `site:g2.com [brand] reviews` type queries cross-reference via third parties *(ChatGPT/Bing-class only)*

Your Answer Intent Map should account for the Bing-class three-phase pattern **and** for Google's index-grounded fan-out — they are different surfaces, not one universal mechanism. See `reference/fan-out-queries.md` for the full (ChatGPT/Bing-scoped) fan-out optimization framework and content-depth strategy.

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
- Same structure: TL;DR (60-90 words), an **honest, criteria-based comparison** of real firms (including yours), comparison table (years in practice, specialties, case results, consultation fee, rating), FAQ from Answer Intent Map
- **Do not self-rank.** Never publish a "ranked list with yours at #1" — a self-authored listicle that places the author's own firm at the top is exactly the disingenuous pattern Google and AI engines discount (and a deceptive-practice risk for regulated professions like law). Present an even-handed, transparent-criteria comparison; let the criteria and verifiable facts speak. Earn the top position in *third-party* roundups through real differentiation, not by ranking yourself.
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

## Verified LinkedIn AEO Playbook

LinkedIn has become a disproportionately cited surface for AI answer engines in professional and B2B query classes. This section consolidates the **verified subset** of the LinkedIn-AEO playbook drawn from public research (Semrush, Profound, LLM Pulse, Search Engine Land, SEMAi). It exists so future invocations of `/seo:seo-aeo` can apply the tactics without re-researching, and so unverified viral-marketing claims can be rejected by pattern, not by memory.

**Why this section exists separately:** A widely shared LinkedIn thread in April 2026 inflated several of these numbers ("beats YouTube + Wikipedia," "8x articles vs posts," "0.26% gap to Reddit," "11% of all AI answers"). Those headlines do not survive triangulation. The subsections below separate verified tactics, newly discovered tactics the viral thread omits, and claims that should **not** be cited externally.

### Citation Mechanism (How LinkedIn Content Reaches AI Answers)

- **LinkedIn's robots.txt blocks every major AI crawler** (GPTBot, ClaudeBot, PerplexityBot, Google-Extended). Direct crawling is not the path.
- **Primary pipeline: LinkedIn → Bing → ChatGPT.** Microsoft has preferential ingestion access to LinkedIn (Microsoft owns LinkedIn), and ChatGPT Search runs on the Bing index. This is the dominant citation channel.
- **Perplexity lacks this channel.** Perplexity's LinkedIn citation rate is materially lower than ChatGPT's and is driven by public profile surfacing + link discovery, not preferential ingestion.
- **Google AI Mode is a weaker, separate pipeline** — LinkedIn surfaces but at a lower rate than on ChatGPT; Google AI cites YouTube, Reddit, and Wikipedia much more heavily.
- **Implication:** optimize LinkedIn content for **Bing-first discoverability** (question-style H2s, clean structure, strong author signals) — not direct AI-crawler access.

### Verified Tactics (Cite These With Confidence)

Every row below is traceable to public research. Include the source when citing externally.

| Tactic | What the data says | Source |
|--------|-------------------|--------|
| Article length sweet spot | 500-2,000 word articles account for **50-66% of LinkedIn content cited** by AI answer engines | Semrush LinkedIn AI Visibility Study, Mar 2026 (89K URLs, 325K prompts) |
| Original content required | **95% of cited LinkedIn content is original** (not repost/syndicated) | Semrush LinkedIn AI Visibility Study, Mar 2026 |
| Educational tone wins | **54-64% of cited LinkedIn content is educational** in intent (explainer, how-to, analysis) vs promotional or personal-news | Semrush LinkedIn AI Visibility Study, Mar 2026 |
| Platform split | **Perplexity cites company pages ~59%** of the time; **ChatGPT and Google AI cite individual profiles ~59%** of the time | Profound AI Platform Citation Patterns (1.4M citations) |
| Author cadence | **75% of cited LinkedIn authors post 5+ times/month** | Semrush LinkedIn AI Visibility Study, Mar 2026 |
| Density beats length | LinkedIn articles **<5K characters achieve ~66% extraction rate**; articles **>20K characters drop to ~12%** | Search Engine Land AI search playbook |
| Question-style H2s | H2 headings phrased as real questions yield **+17.54% similarity lift** for AI citation | SEMAi content structures study |
| Direct-answer openers | **40-60 word direct answers** in the first paragraph materially increase citation probability | Search Engine Land AI search playbook |
| LinkedIn momentum | LinkedIn climbed **11th → 5th** among ChatGPT-cited domains over 90 days (Nov 2025 → Feb 2026). Arbitrage window is real but closing. | Profound AI Platform Citation Patterns |

### New Tactics Ward Omits (Worth Adopting)

- **Treat LinkedIn as a Bing-optimization surface.** Microsoft's preferential ingestion is the mechanism — structure content so Bing's index reads it cleanly (clean HTML in the LinkedIn article body, question-style H2s, crawlable author profile).
- **Density over volume.** A 1,500-word article with tight answer blocks beats a 25,000-word thought piece. The `<5K → 66%` / `>20K → 12%` gradient is sharp.
- **Direct-answer opener is non-optional.** First paragraph must be a 40-60 word neutral, factual summary — this is the paragraph AI models quote verbatim.
- **Question-style H2s everywhere.** Not just for the article title — every major section heading should be phrased as a real user question.
- **Platform-split publishing, not single-surface.** Publish named-expert pieces (interpretation, POV) to a personal profile for ChatGPT and Google AI Mode; publish institutional pieces (reports, data summaries, factual recaps) to a company page for Perplexity. Single-surface plans leave citation surface on the table.
- **Ship before the window closes.** Profound's 11th → 5th rise over 90 days is real; the same mechanism that lifted early adopters will lift followers with lower gradient. Urgency is not a marketing claim — it's in the data.

### Unverified or Misleading Claims (Do Not Cite Externally)

The following claims appeared in a widely shared April 2026 LinkedIn AEO thread but do **not** survive independent triangulation. Do not repeat them as if they were verified; when asked about them, cite the row in "Verified Tactics" that replaces them.

| Claim | Status | What's actually true |
|-------|--------|---------------------|
| "LinkedIn is 11% of all AI answers" / "beats YouTube, Wikipedia, and news" | **Basket-specific; false on broad baskets.** | LLM Pulse 28-day broad-basket tracker shows LinkedIn well below YouTube, Wikipedia, and Reddit. The 11% figure is restricted to B2B/professional query baskets, not all queries. |
| "Articles cited 8x more than posts" | **Unverified in public data.** | Semrush data supports articles outperforming posts, but the ratio is closer to **2-4x** on broad samples, not 8x. Treat 8x as a marketing headline, not a planning input. |
| "LinkedIn is 0.26% behind Reddit" | **Appears fabricated.** | LLM Pulse shows a ~4x gap (Reddit meaningfully ahead of LinkedIn on broad baskets). The 0.26% figure cannot be reproduced in any public tracker. |
| "AI quotes LinkedIn posts word-for-word" | **Overstated framing.** | AI models paraphrase and recombine. "Word-for-word" is rhetorical flourish, not a documented extraction behavior. |
| Proprietary data from a vendor-owned tool with no methodology | **Low credibility signal.** | When the author owns the tool that produced the numbers, and the methodology is not published, apply the source-credibility guardrail in `/seo:seo-aeo` (and in `digest` for future ingestions). |

### Credibility Guardrail for Viral AEO Claims

Before adopting any AEO number from a social-media thread, vendor blog, or "proprietary study," run the three stat-credibility checks. When **all three** fire, treat the claim as directional only and cite the verified row above instead. Then run the fourth check on the *tactic itself*, independent of how well-sourced the number is.

1. **Traceability** — Is the claimed number traceable to public research (Semrush, Ahrefs, Profound, Peec AI, LLM Pulse, Search Engine Land)? If the numbers match an unattributed public study, treat as repackaged.
2. **Closed loop** — Does the author own a tool that produced the data? Closed-loop marketing data is directional at best.
3. **Triangulation** — Can the headline number be reproduced across **≥2 independent trackers**? If not, flag as basket-specific or unsupported.
4. **Google-official contradiction** — Does the tactic contradict Google's official Search guidance (https://developers.google.com/search/docs/fundamentals/ai-optimization-guide, 2026-05-15)? If Google explicitly disclaims it as a Google Search input (e.g. llms.txt, AI-specific chunking, structured-data overfocus), scope the tactic to non-Google engines with an explicit caveat. If Google classifies it as spam (inauthentic mentions, scaled content abuse), the tactic is removed/reversed, not scoped — it is disingenuous on every engine. A well-sourced number does not rehabilitate a Google-disclaimed or spam tactic.

Checks 1-3: three-of-three triggers a warning, not a block; a single trigger is informational only. Check 4 is a scope/removal decision, not a stat warning — it changes *whether and where* the tactic is recommended, never silently deletes engine-legitimate guidance. The whole guardrail is warn-and-scope, never a hard audit-time block.

**Sync contract (semantic, not byte-identical).** This guardrail is one of **three surfaces** that carry it: this block, the `/seo:seo-aeo` command's "Source Credibility Check", and the `digest` skill's §5b. (Historically the documented sync was seo-aeo ↔ digest §5b only; this `aeo.md` block is now explicitly enrolled as the third surface.) Keep the **four checks and the warn-and-scope/never-block severity posture** aligned across all three when editing any of them. Do **not** force them byte-identical — each intentionally keeps its own structure (this block's verified-playbook framing; the command's "Reference test"; digest §5b's two-trigger gate + "Effect on output" block). What stays in sync is the check logic and severity behavior, not the prose.

### Quarterly Citation Audit Protocol

AI citation patterns shift on a months-not-days cadence. Run this audit **once per quarter** per target project (JDKey, Hyperscale, DLG selectively) to measure whether the tactics are working and what's moving. Weekly cadence would add noise without signal.

**Invocation:** `/seo:seo-aeo --audit <project-domain-or-name>` — the `--audit` mode uses the existing AEO command surface, not a separate sub-skill.

**Query panel (10-20 queries per project).** Build once per project, reuse across quarters for trend comparison. Mix:

- **Named-entity queries** — "who is <person>", "what does <firm> do", "is <firm name> a <category>". Tests ChatGPT/Google AI individual-profile emphasis.
- **Category-expert queries** — "best <category> in <location>", "top <specialty> firm Texas". Tests broad-basket visibility.
- **Topical queries tied to publications** — named bills, dockets, events you've written about (e.g., "PUCT Project 58481," "Texas SB 6 large loads"). Tests whether your content is cited on the specific topics you covered.
- **Comparison queries** — "<firm> vs <competitor>". Tests defensive visibility.

**Scoring per query (per platform):**

| Field | Values |
|-------|--------|
| Cited | yes/no |
| Prominence | high (top 3 results or first mention) / medium (page 1) / low (deep) / none |
| Source surface | company-page / personal-profile / website / article / other |
| Top competitors cited | names (up to 3) |

**Platforms to test each quarter:** ChatGPT (required), Perplexity (required), Google AI Mode (required). Claude and Gemini optional.

**Output note template** — save to `01-Projects/<Project>/aeo-citation-audit-YYYY-QN.md`:

```
# <Project> AEO Citation Audit — <YYYY> Q<N>

**Date run:** <date>
**Platforms tested:** ChatGPT, Perplexity, Google AI Mode
**Queries tested:** <N>

## Summary
- Citation rate: X/Y queries ChatGPT | A/B queries Perplexity | C/D queries Google AI
- Top competitors cited: …
- Biggest gain vs last quarter: …
- Biggest regression: …

## Per-Query Matrix
| Query | ChatGPT | Perplexity | Google AI | Source surface | Top competitors |

## Quarter-over-Quarter Trend
| Quarter | Citation Rate | Top Cited Surface | Top Competitor |

## Actions for Next Quarter
- …
```

**Weekly SEO workflow hook:** `/seo:seo-weekly` surfaces the "has it been 90+ days since last AEO audit?" check, which points back to this protocol. No separate cron or automation — the weekly command is the reminder surface.

---

## Common AEO Mistakes (Auto-Flag in Audit)

Flag these automatically when found during an audit:

| Mistake | Severity | Why It Kills Citations |
|---------|----------|----------------------|
| AI bots blocked in robots.txt | CRITICAL | Zero citations if bots can't crawl |
| **Seeding inauthentic mentions / coordinated mention-building** | **CRITICAL** | **Google classifies seeking inauthentic mentions as spam (2026-05-15). Sockpuppet/"neutral persona" accounts, astroturfed forum/Reddit/Quora activity, seeded or paid "third-party" mentions, and review manipulation are ineffective AND disqualifying — disingenuous on every engine, not just Google. Flag and reverse, never recommend.** |
| **Scaled content abuse (mass per-variation/fan-out pages)** | **CRITICAL** | **Google classifies scaled content abuse as spam (2026-05-15). Mass per-fan-out-term / per-variation pages created for ranking coverage are suppressed and a spam-update target. See `fan-out-queries.md` anti-scaled-content guardrail.** |
| No publication/update dates | HIGH | Signals staleness to AI |
| Generic AI-written content (at scale) | HIGH | LLMs detect and ignore it; original insights required. At volume this is **Google scaled-content abuse (2026-05-15)** — spam, not just low-quality |
| Paragraph prose for comparison queries | HIGH | Tables beat prose 2.8x for these queries |
| Missing schema markup (non-Google engines) | MEDIUM | ~2.3-2.5x citation gap on ChatGPT/Bing/Perplexity-class (directional, multi-study supported with one null counter-study; see Section 3 for citations). **Not** a Google AI-features input per Google 2026-05-15 — do not flag as a Google AI-readiness gap; schema still matters for classic rich results. **ChatGPT exception:** OtterlyAI same-URL data showed ChatGPT citations *drop* after schema added |
| No About/Team page | HIGH | AI can't verify entity identity |
| Claims without sources | MEDIUM | Reduces trust score; AI prefers verifiable assertions |
| Skipped heading levels | MEDIUM | 3.2x citation rate difference with proper hierarchy |
| No FAQ sections | MEDIUM | 72% vs 34% citation rate |
| Only optimizing for Google | MEDIUM | Misses ChatGPT/Perplexity entirely |
| Timestamp-only "updates" | LOW | +12% vs +71% for meaningful content updates. AI detects fake freshness; faking update recency to game ranking aligns with Google's spam stance (2026-05-15) — make meaningful updates, not cosmetic ones. |

---

## Weekly Maintenance Loop (90 min)

After initial optimization, maintain AI visibility with this weekly routine:

1. **Citation check (20 min)** — Run 10-15 prompts from your Answer Intent Map in ChatGPT and Perplexity. Log whether you're cited and who else shows up. Track position changes.
2. **Content refresh (30 min)** — Update your Answer Hub/Authority Page TL;DR with any new data points, citations, or competitive changes. Add one new FAQ or comparison section.
3. **Schema & feed health (15 min)** — Fix any schema validation errors. For ecommerce: clear Merchant Center warnings, push 10+ new reviews to weakest product.
4. **Citation building (25 min)** — One outreach action: pitch a review site, engage on Reddit/Quora, publish a comparison page, or update an external directory listing.
5. **Fan-out coverage check (15 min)** — Run `site:yoursite.com [term]` in Google for 5 predicted sub-topic terms. This is an **indexation/coverage self-check** (does Google's core index hold a strong page for each sub-topic?), *not* a model of how Google's AI retrieves — Google grounds over its core index, it does not run `site:` operator fan-out. Score each 0/1/2. Track coverage over time; fill genuine content gaps with substantive pages (not coverage-driven thin pages — see Common AEO Mistakes).

**Monthly:** Refresh `brand-facts.json` / `llms.txt`, validate all PDP schema, update policy changes, re-run full Answer Intent Map audit. Run full Fan-Out Query Audit (see `reference/fan-out-queries.md`).

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
**AEO Readiness Score:** [X/125]

## Score Breakdown
- AI Crawlability & Access: [X/20]
- Content Structure & Extractability: [X/25]
- Schema & Machine-Readable Data: [X/25]
- Authority & Trust Signals: [X/30]
- Fan-Out Query Readiness: [X/25]

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

## Fan-Out Query Readiness: [X/25]
**Fan-Out Coverage Score:** [X]%

### Site-Search Results
| Fan-Out Term | `site:` Result | Score (0/1/2) | Gap? |
|-------------|---------------|---------------|------|
| [feature/topic] | [page found or "no result"] | [0/1/2] | [yes/no] |

### Content Gaps (Candidate Targets)
[Fan-out terms that returned 0 or 1 — *candidate* gaps. For each, recommend a new page **only** where genuinely distinct, substantive expertise exists; otherwise recommend consolidating into an existing strong page. Never recommend mass per-term page generation — scaled content abuse is Google spam (2026-05-15) and a spam-update target. See `reference/fan-out-queries.md` → "Create Content That Matches" anti-scaled-content guardrail.]

### Third-Party Validation
| Review Site | Profile Status | Recent Reviews | Rating |
|------------|---------------|----------------|--------|
| G2 | [complete/partial/absent] | [count in last 90 days] | [X/5] |
| Capterra | ... | ... | ... |

## Top Priority Findings
[Ranked by impact on AI citations — gap analysis queries inform content priorities]

## Implementation Roadmap
- Week 1: [highest-impact quick wins]
- Week 2: [content restructuring]
- Week 3: [schema + machine-readable data]
- Week 4: [authority building + maintenance loop setup]
```
