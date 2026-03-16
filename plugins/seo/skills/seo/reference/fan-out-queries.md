# Fan-Out Query Optimization

AI models (GPT 5.4+, Perplexity, Gemini) don't make a single search to answer a question. They decompose user queries into **multiple sub-queries (fan-out queries)** and synthesize the results. As of March 2026, GPT 5.4 uses `site:` operator searches extensively in its fan-out pattern, searching directly within specific domains.

This reference covers how to optimize for this behavior.

---

## The Three-Phase Fan-Out Pattern

When a user asks something like "best applicant tracking system with AI features," the AI model executes queries in three phases:

### Phase 1: Discovery (Broad Queries)
The model makes 2-3 broad web searches to identify the relevant domain set:
- "2026 best applicant tracking system AI features official"
- "ATS AI recruiting features official documentation"
- "G2 ATS 2026 reviews"

**What determines if you make the cut:** Traditional SEO signals, brand authority, presence in list articles, review sites, comparison content. If your domain doesn't surface in the broad sweep, the AI never searches your site directly.

### Phase 2: Site-Specific Deep Dive
The model searches **within each identified domain** using `site:` queries:
- `site:greenhouse.com AI features greenhouse recruiting official`
- `site:ashbyhq.com AI features Ashby recruiting official`
- `site:workable.com AI features workable recruiting official`

**What determines how much you're cited:** The depth, structure, and relevance of on-site content that matches these sub-queries. If `site:yoursite.com [topic]` returns thin results, the AI cites your competitors instead.

### Phase 3: Third-Party Validation
The model searches review and comparison sites to cross-reference:
- `site:g2.com Ashby recruiting reviews 2026`
- `site:g2.com Greenhouse recruiting reviews 2026`

**What determines trust:** Your presence, rating, review count, and recency on G2, Capterra, Trustpilot, and category-specific review sites.

---

## Fan-Out Query Readiness Audit

Add this to AEO audits. Score 0-25 points.

### 1. Discovery Layer (8 pts)

Can your domain be found in broad category searches?

- [ ] **Brand appears in "best [category]" queries** — Test 5-10 broad category queries in Google. Does your domain appear in page 1 results? If not, the AI model may never select you for Phase 2.
- [ ] **Present in authoritative list articles** — Are you mentioned in "best X" roundups, comparison articles, and industry lists? These are what broad discovery queries surface.
- [ ] **Review site presence** — Active profiles with recent reviews on G2, Capterra, Trustpilot, or vertical-specific review sites. The AI model explicitly searches these sites.
- [ ] **Category entity association** — Does Google's Knowledge Graph associate your brand with your category? Search `[brand name]` and check if your category appears in the knowledge panel.

### 2. On-Site Content Depth (12 pts)

When the AI runs `site:yoursite.com [topic]`, will it find comprehensive content?

- [ ] **Feature pages exist as standalone URLs** — Each major feature/capability has its own page (not buried in a single features list). `site:yoursite.com AI features` must return relevant results.
- [ ] **Product/service pages use category keywords in titles and H1s** — The `site:` query includes category terms. Your page titles need to match.
- [ ] **Use-case pages** — Pages targeting specific buyer segments (e.g., `/recruiting-for-startups`, `/enterprise-ats`). AI fan-out queries often include segment qualifiers.
- [ ] **Comparison pages** — `/compare/you-vs-competitor` pages. AI models frequently generate "X vs Y" sub-queries.
- [ ] **Pricing/plans page** — The AI often searches for pricing within sites. A clear, indexable pricing page gets cited.
- [ ] **Integration/ecosystem pages** — Pages for each major integration. AI asks "does X integrate with Y" as fan-out queries.
- [ ] **Documentation/help content is indexable** — If you have docs, they must be crawlable (not behind auth). AI models search docs sites heavily.

**Audit method:** Run `site:yoursite.com` with 10 likely fan-out terms (features, pricing, integrations, reviews, [use-case], [competitor-name], etc.) and count how many return relevant, content-rich results.

### 3. Third-Party Depth (5 pts)

What does the AI find when it searches review/comparison sites for your brand?

- [ ] **G2/Capterra profile complete** — All sections filled, recent reviews (last 90 days), high review count (50+), response to reviews.
- [ ] **Review content is substantive** — Thin reviews ("great product!") don't help. Encourage detailed reviews mentioning specific features and use cases — these are what AI extracts.
- [ ] **Present in comparison content** — Your brand appears in "vs" pages on review sites and comparison articles.

---

## Content Strategy for Fan-Out Queries

### Predict the Sub-Queries

For any topic you want to rank in AI answers, predict what fan-out queries the AI will generate:

| User Query | Likely Fan-Out Sub-Queries |
|-----------|---------------------------|
| "best [product] for [use-case]" | `site:yoursite.com [use-case]`, `site:yoursite.com features`, `site:g2.com [product] reviews`, `[product] vs [competitor]` |
| "is [product] worth it" | `site:yoursite.com pricing`, `site:g2.com [product] reviews 2026`, `[product] pros cons` |
| "[product] vs [competitor]" | `site:yoursite.com [competitor]`, `site:competitor.com features`, `site:g2.com [product] vs [competitor]` |
| "how to [task] with [product]" | `site:yoursite.com [task]`, `site:yoursite.com documentation [task]`, `[product] [task] tutorial` |

### Create Content That Matches

For each predicted fan-out query, ensure a dedicated, content-rich page exists:

1. **Map your content to fan-out patterns** — List your top 20 target queries. For each, predict 5-8 fan-out sub-queries. Check if you have pages matching each.
2. **Fill the gaps** — Missing pages = missing citations. Create dedicated pages for features, use cases, comparisons, and documentation that fan-out queries target.
3. **Optimize page titles for site-search** — When the AI does `site:yoursite.com AI features`, your page title and H1 must contain those terms. Generic titles like "Our Platform" won't match.
4. **Self-contained pages** — Each page must answer its question without requiring navigation to other pages. The AI extracts from individual pages, not your site navigation flow.

### The "Official" Signal

Note that fan-out queries frequently include the word "official" — the AI is specifically looking for authoritative first-party content. Ensure:

- Your official feature/product pages are clearly marked as such
- Meta descriptions include "official" where natural
- Your domain is the canonical source for product information (not just marketing fluff)

---

## Fan-Out Query Testing Methodology

Add this to the weekly maintenance loop:

### Monthly Fan-Out Audit (30 min)

1. **Identify your top 10 target queries** — The queries you most want to be cited for.
2. **For each query, run it in ChatGPT** (with browsing enabled) — Observe or infer what sub-queries it generates.
3. **Run `site:yoursite.com` with predicted fan-out terms** — In Google, test:
   - `site:yoursite.com [main feature]`
   - `site:yoursite.com [each use-case]`
   - `site:yoursite.com pricing`
   - `site:yoursite.com vs [each competitor]`
   - `site:yoursite.com [each integration]`
4. **Score each:** Does the query return a relevant, content-rich page? Score 0 (no result), 1 (thin result), 2 (strong result).
5. **Calculate Fan-Out Coverage Score:** `(sum of scores) / (max possible) x 100`
6. **Gap list:** Every 0-score is a content gap that directly costs you AI citations.

### Track Over Time

```
| Date | Queries Tested | Fan-Out Terms | Coverage Score | New Gaps Found | Gaps Closed |
```

---

## Integration With Existing AEO Framework

Fan-out optimization builds on, not replaces, existing AEO principles:

- **Passage citability still matters** — Once the AI lands on your page via `site:` search, the passage-level citability score determines what gets extracted.
- **Schema still matters** — Structured data helps the AI parse what it finds on your pages.
- **Authority still matters** — Getting into the discovery set (Phase 1) requires the same E-E-A-T and brand signals.
- **Content freshness still matters** — AI models include year qualifiers in fan-out queries ("2026 reviews"). Stale content won't match.

The new layer is ensuring **content depth and coverage match the sub-queries the AI generates** when it searches your site directly.

---

## Common Fan-Out Optimization Mistakes

| Mistake | Why It Hurts |
|---------|-------------|
| Single "Features" page listing everything | `site:yoursite.com [specific feature]` returns one generic page instead of a dedicated, deep page |
| No comparison content | AI generates "X vs Y" sub-queries; if you don't have `/compare/` pages, competitors control the narrative |
| Docs behind authentication | AI can't crawl gated content; your documentation never appears in `site:` results |
| Generic page titles | "Our Solution" doesn't match `site:yoursite.com CRM integration`; use descriptive titles |
| No pricing page | AI frequently searches for pricing; if it can't find yours, it cites competitors who publish theirs |
| Ignoring review site profiles | Phase 3 specifically searches review sites; empty/stale profiles = missing validation |
| Marketing copy instead of substance | `site:` searches surface pages, but AI extracts facts. Pages full of superlatives without specifics get skipped |
