# Fan-Out Query Optimization

AI models (GPT 5.4+, Perplexity, Gemini) don't make a single search to answer a question. They decompose user queries into **multiple sub-queries (fan-out queries)** and synthesize the results. As of March 2026, GPT 5.4 uses `site:` operator searches extensively in its fan-out pattern, searching directly within specific domains.

> **Scope — not a Google Search mechanism.** This framework optimizes for the **`site:`-operator fan-out used by ChatGPT/Bing-class engines (GPT 5.4)**. It is *not* how Google's AI features work: per Google's 2026-05-15 guidance (https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), Google fans out via concurrent related queries **grounded over its core Search index (RAG)** and does not run `site:domain.com` operator searches into individual websites. Apply this reference for ChatGPT/Bing visibility; for Google, the lever is foundational SEO + genuinely useful, indexable, non-commodity content (see `aeo.md` → "Google Search vs AI-Engine Scope"). Do **not** generate pages whose purpose is fan-out-term coverage (see `aeo.md` Common AEO Mistakes — scaled content abuse).

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

> **Score genuine substance, not coverage.** Award points only for pages with **genuinely distinct, substantive content**. Do not award points for — and do not recommend creating — near-duplicate or templated pages that exist only to match a fan-out term; that is scaled content abuse (Google 2026-05-15) and a spam-update target. A consolidated, deep page beats five thin coverage pages on every engine.

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

> **Anti-scaled-content guardrail (do not skip).** This is **not** a directive to spin up a page per predicted fan-out term. Google explicitly classifies **scaled content abuse** — mass per-variation / per-fan-out-term pages created to manipulate rankings — as **spam** (per Google 2026-05-15; https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), and the same thin-page pattern is a known spam-update target (mirror the skill's own stance: `local-seo.md` "genuinely unique content, not city-name swaps"; `audit-checklist.md` "No thin city pages with keyword swaps"). A predicted fan-out query is a signal to ask *"do we have genuinely distinct, substantive expertise on this?"* — **not** a quota to fill with templated coverage pages. Generating pages whose purpose is fan-out coverage is reversed here, not recommended.

Use predicted fan-out queries to find *genuine* content gaps, then close only the ones backed by real, non-commodity substance:

1. **Map your content to fan-out patterns** — List your top 20 target queries. For each, predict 5-8 fan-out sub-queries. Check whether you already cover the underlying topic substantively.
2. **Evaluate each gap honestly** — A missing page is only worth creating when you have **genuinely distinct, substantive expertise** to put on it (real depth, original data, first-hand experience). If the only reason to create it is fan-out coverage, **do not create it** — consolidate the topic into an existing strong page instead. Thin coverage-driven pages are scaled content abuse and get suppressed, not cited.
3. **Optimize titles honestly** — Page titles and H1s should accurately describe genuinely distinct content. Descriptive titles help users and all engines; never create near-duplicate pages that differ only by a swapped fan-out term.
4. **Self-contained pages** — Each *substantive* page should answer its question without requiring navigation to other pages.

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
6. **Gap list:** Every 0-score is a *candidate* gap. Before creating anything, apply the anti-scaled-content guardrail (see "Create Content That Matches"): create a page only when you have genuinely distinct, substantive expertise for it; otherwise consolidate the topic into an existing strong page. A 0-score is a prompt to evaluate, never an instruction to mass-produce coverage pages.

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
