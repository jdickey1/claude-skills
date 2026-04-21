---
name: seo
description: Comprehensive SEO audit, optimization, and automation. USE WHEN audit SEO OR review website SEO OR check GBP OR optimize local search OR technical SEO OR on-page optimization OR AI search readiness OR AEO OR answer engine optimization OR AI visibility OR AI citations OR ChatGPT ranking OR Perplexity optimization OR content strategy OR link building OR citation building OR keyword research OR backlink analysis OR content brief OR SEO automation OR replace SEO agency OR analyze SEO report OR review GSC data OR weekly SEO tasks.
version: 2.5.0
effort: high
---

# SEO - Website Audit, Optimization & Automation

Comprehensive SEO framework covering technical foundations, on-page optimization, E-E-A-T, local business SEO, AI search readiness (AEO/GEO), content strategy, link building, and a full DIY automation system.

---

## Audit Philosophy

**Think like a search engine, report like a marketer.**

1. **Start with indexability** — If Google can't find your pages, nothing else matters.
2. **Prioritize buyers over browsers** — Target "service + city" keywords, not "how to" keywords.
3. **Local first** — For local businesses, Google Business Profile is the #1 lever.
4. **Structure for machines** — AI search systems (ChatGPT, Copilot, Gemini, Perplexity) need structured, citable content.
5. **E-E-A-T everywhere** — Trust is the foundation. Untrustworthy pages have low E-E-A-T regardless of other signals.
6. **Prove it with data** — Every finding must reference the specific page, element, or missing item.

---

## Commands

| Command | What it does |
|---------|-------------|
| `/seo-audit <url>` | Run full 4-tier audit |
| `/seo-brief <keyword>` | Create content brief for keyword |
| `/seo-gbp <business>` | Google Business Profile optimization |
| `/seo-weekly` | Weekly recurring SEO tasks |
| `/seo-report` | Analyze GSC/keyword data |
| `/seo-automate` | Set up DIY automation scripts |
| `/seo-aeo <url>` | Dedicated AEO audit — AI visibility across ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews |
| `/teach-seo` | Write SEO context to project CLAUDE.md |

## Reference Files

Deep-dive references loaded on demand by commands:

| File | Contents |
|------|----------|
| `reference/audit-checklist.md` | Full 4-tier audit checklist (~180 items) |
| `reference/ranking-factors.md` | Evidence-based ranking factor priorities, severity calibration, keyword validation |
| `reference/ai-search.md` | AEO/GEO optimization, platform-specific citation data, AI accessibility |
| `reference/aeo.md` | Full AEO audit framework: 4-section scoring, Answer Intent Mapping, trust signals, service business adaptations, maintenance loop |
| `reference/fan-out-queries.md` | Fan-out query optimization: how AI models decompose queries and use `site:` searches, content depth strategy, audit methodology |
| `reference/local-seo.md` | GBP, citations, NAP, reviews, SABs, Google spam warnings |
| `reference/link-building.md` | Link profile, tactics, local link building, brand signals |
| `reference/automation.md` | Full DIY automation system (~$75/mo replaces ~$1,500/mo agency) |

## Tools

Standalone scripts in `Tools/` for automation. All output JSON to `data/seo/YYYY-MM-DD/`.

| Script | Purpose | Schedule |
|--------|---------|----------|
| `keyword-research.mjs` | Expand seed keywords with volume/CPC data | Monday 9 AM |
| `competitor-backlinks.mjs` | Scan competitor backlinks for opportunities (paid — DataForSEO) | Wednesday 9 AM |
| `commoncrawl-backlinks.sh` | Free competitive backlink audit + gap analysis (Common Crawl + DuckDB) | Quarterly (on new CC release) |
| `gsc-report.mjs` | GSC data pull with period comparison | Monday 9 AM |
| `content-brief.mjs` | Fetch SERP data and generate brief prompt | On demand |
| `backlink-outreach.mjs` | Generate outreach queue (dry-run by default) | Wed + Fri 10 AM |
| `validate-profile.mjs` | Validate seo-profile.json business config | Before pipeline runs |
| `keyword-universe.mjs` | Expand seeds via DataforSEO + business relevance scoring | Monday 9 AM |
| `keyword-cluster.mjs` | SERP-based Jaccard clustering with page mapping | After keyword-universe |

---

## DO (Core Principles)

- **Use dev-browser** (script files only, `dev-browser run /tmp/script.js` — never heredocs or inline `-e`) to load and inspect live pages: evaluate DOM, read rendered HTML, screenshot
- **Use web-reader** (`npx playbooks get <url>`) for content extraction
- **Check source HTML** for meta tags, schema, headers, canonical tags
- **Crawl key pages** — homepage, service pages, location pages, blog (if exists)
- **Verify findings in raw HTML** before marking as CONFIRMED (see Verification Rules below)
- **Weight severity by ranking impact** — consult `reference/ranking-factors.md`
- **Validate keywords** before recommending new pages (5-point methodology)

## DON'T (Critical Mistakes)

- **DON'T conclude something is missing based on content extractors alone** — they strip nav, header, footer
- **DON'T recommend URL restructuring for keyword placement** — negligible ranking benefit, high redirect risk
- **DON'T over-prioritize URL slugs** — INFO severity at most
- **DON'T assign high severity to low-impact factors** — consult ranking-factors.md
- **DON'T create a brief for a keyword nobody searches** — validate first
- **DON'T flag exact-match anchor text as positive** — branded is safer
- **DON'T recommend blog content for local businesses** unless it targets buyer intent

## Anti-Patterns

These are explicitly banned behaviors. If you catch yourself doing any of these, stop and correct:

| Banned Pattern | Why | Instead Do |
|----------------|-----|-----------|
| Conclude missing elements from content extractors alone | Extractors strip JS-rendered content, structured data, meta tags | Verify via `curl -s URL \| grep` or view-source |
| Recommend URL restructuring | URL changes break existing backlinks and rankings | Optimize on-page content, not URL slugs |
| Flag exact-match anchor text as positive | Over-optimized anchors are a spam signal | Note as potential risk, not a win |
| Over-prioritize URL slugs | Minimal ranking impact vs. content quality | Focus on title tags, H1s, content depth |
| Report findings without page URLs | Abstract advice is unactionable | Always include the specific page affected |
| Skip structured data verification | Schema markup is invisible to extractors | Check via Google Rich Results Test or raw HTML |

---

## Verification Rules (CRITICAL — Prevents False Findings)

**Content extractors (web-reader, WebFetch) strip structural HTML elements** like navigation, headers, footers, and sticky bars. NEVER conclude something is missing based solely on extracted content.

**For findings about header, nav, footer, or above-the-fold elements** (phone numbers, CTAs, addresses, logos), MUST verify with raw HTML:
```bash
curl -s <url> | grep -oP '.{0,80}(tel:|phone|555|address).{0,80}' | head -10
```

**For findings about `<head>` tags** (hreflang, canonical, OG tags, meta robots, twitter cards), MUST extract the `<head>` block:
```bash
curl -s <url> | sed -n '/<head/,/<\/head>/p' | grep -i 'hreflang\|canonical\|og:\|twitter:\|noindex'
```

**Confidence levels:**
- **CONFIRMED** = Verified via raw HTML source. Only use when you have directly seen the presence or absence.
- **LIKELY** = Inferred from content extraction tools but NOT verified in raw HTML. Default for content extractor findings.
- **NEEDS VERIFICATION** = Conflicting signals or unable to check raw HTML.

## Binary Audit Checks

When evaluating SEO audit quality (for autoresearch or review), use these binary checks:

**EVAL 1: All findings include specific URLs**
Question: Does every finding reference a specific page URL?
Pass: Every recommendation points to a concrete page
Fail: Any finding is abstract without a URL target

**EVAL 2: Verification rule compliance**
Question: Were all findings verified against raw HTML, not just content extractors?
Pass: No finding relies solely on extracted content — all checked via curl/view-source
Fail: Any finding based only on content extractor output without HTML verification

**EVAL 3: Severity matches ranking-factors guidance**
Question: Are severity levels (CRITICAL/HIGH/MEDIUM/LOW) consistent with the ranking-factors reference?
Pass: All severity assignments follow the documented criteria
Fail: Any severity over- or under-rated vs. reference guidance

**EVAL 4: Confidence stated**
Question: Does every finding include a confidence level (CONFIRMED/LIKELY/NEEDS VERIFICATION)?
Pass: All findings explicitly state confidence
Fail: Any finding lacks confidence level

**EVAL 5: Actionable recommendations**
Question: Does every finding include a specific remediation step?
Pass: All findings have concrete "do this" instructions
Fail: Any finding says "fix this" without explaining how

---

## Audit Execution Order

1. **Indexation check** — `site:domain.com`, robots.txt, sitemap.xml
2. **Homepage audit** — Meta tags, H1, speed, phone/address visibility, schema
3. **Service page audit** — Keyword targeting, content quality, CTAs, internal links
4. **E-E-A-T check** — Author attribution, credentials, experience signals
5. **GBP review** (local business) — Search for business, check listing completeness
6. **Technical scan** — Mobile, HTTPS, redirects, 404s, Core Web Vitals
7. **Content analysis** — Keyword cannibalization, thin pages, buyer vs browser intent, freshness
8. **Citation check** (local business) — Bing, Apple Maps, Yelp, BBB, YellowPages, Chamber
9. **Schema validation** — Structured data presence and accuracy
10. **AI readiness** — Content structure, extractability, citation optimization, fan-out query coverage
11. **Link profile** — Internal linking, anchor text, homepage link ratio
12. **Competitor comparison** — Category matching, keyword gaps
13. **Report generation** — Compile findings, prioritize, provide action plan

For the full checklist with ~180 items, see `reference/audit-checklist.md`.

---

## Audit Tools

- **dev-browser** — Navigate, screenshot (`page.screenshot()`), evaluate JavaScript on the rendered DOM (`page.evaluate(...)`), and read full rendered HTML (`page.content()`). Script-file-only invocation: write to `/tmp/*.js`, run with `dev-browser run /tmp/script.js`; never use heredocs or inline `-e` flags (house rule, `feedback-dev-browser-scripts.md`).
- **web-reader** — Extract page content as markdown for analysis
- **WebSearch** — Check indexation (`site:domain.com`), search for business name, check competitors
- **WebFetch** — Fetch robots.txt, sitemap.xml, specific URLs

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

**Issue:** What's wrong and why it matters for rankings/visibility.
**Current State:** What's there now.
**Recommendation:** Specific fix with example.
**Impact:** Expected improvement.
```

---

## The Three-Layer Model (SEO + AEO + GEO)

| Layer | What It Means | What to Do |
|-------|--------------|------------|
| **SEO** | Matching keywords | Rank for target queries with optimized pages |
| **AEO** | Descriptive clarity | Make content machine-readable, structured, extractable |
| **GEO** | Justification & trust | Build authority signals AI systems can verify and cite |

SEO is the foundation. AEO drives understanding. GEO drives confidence. You need all three to be recommended by AI search. See `reference/ai-search.md` for citation data and `reference/aeo.md` for the full AEO audit framework.

---

## Supporting References

- **Google Search Central:** https://developers.google.com/search
- **Google Business Profile Help:** https://support.google.com/business
- **Schema.org:** https://schema.org
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Markup Validator:** https://validator.schema.org
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **Bing Places for Business:** https://www.bingplaces.com
- **Apple Business Connect:** https://businessconnect.apple.com
- **PageSpeed Insights:** https://pagespeed.web.dev
- **Whitespark Local Ranking Factors:** https://whitespark.ca/local-search-ranking-factors/

---

## Escalation Protocol

**STOP and ask the user before proceeding when:**
- Findings contradict each other (e.g., good content signals but terrible technical SEO)
- About to recommend URL restructuring, domain migration, or canonical tag changes (high-risk)
- Audit score disagrees with the user's expectations by more than 20 points
- Unable to verify a finding in raw HTML after content extractor flagged it
- Discovering a penalty or manual action indicator (noindex on key pages, sudden deindexation)
- Keyword validation fails for a recommended target (no search volume, wrong intent)

**Do NOT escalate (handle autonomously):**
- Running all 13 audit execution steps in sequence
- Verifying findings against raw HTML (curl/grep)
- Adjusting severity based on ranking-factors.md guidance
- Generating the audit report with score breakdown

## Completion Status

When the audit is complete, report:

```
SEO AUDIT: {domain}
═══════════════════════════
Overall score: {X}/100
Pages audited: {count}
Findings: CRITICAL: {N}, HIGH: {N}, MEDIUM: {N}, LOW: {N}, INFO: {N}
Top priority: {one-sentence summary of highest-impact finding}
Verification: {count} findings HTML-verified, {count} extractor-only
Score breakdown: Technical {X}/20, On-Page {X}/20, E-E-A-T {X}/15, Local {X}/20, Content {X}/15, AI {X}/10
═══════════════════════════
```

## Verification of Claims

- **Every finding must include a specific page URL** — no abstract recommendations without a target.
- **Findings about head elements (meta tags, schema, canonical) must be verified via `curl | grep`**, not content extractors.
- **Header/nav/footer findings must be verified in raw HTML** — extractors strip structural elements.
- **Severity assignments must reference ranking-factors.md** — cite the ranking factor evidence for HIGH+ claims.
- **"Missing" claims require negative evidence** — show the search command and empty result.
- **Keyword recommendations must pass the 5-point validation** — never recommend a keyword without checking volume.

---

## Gotchas
- **Content extractor strips structural elements** — Phone numbers in footers, nav links, and header CTAs get stripped by extractors. Always verify header/nav/footer findings with `curl | grep` on raw HTML, not extractor output.
- **Severity without ranking factors** — Don't invent severity levels. Consult reference/ranking-factors.md before assigning HIGH/MEDIUM/LOW. A missing H2 is LOW, not HIGH.
- **Confidence inversion** — Extracted-content findings are LIKELY at best, not CONFIRMED. Only CONFIRMED when you directly viewed raw HTML source.

## Learning

When this skill runs, append observations to `.learnings.jsonl`:

```json
{"timestamp": "ISO-8601", "skill": "seo", "event_type": "edge_case", "context": "Content extractor missed schema markup — caught by HTML verification"}
{"timestamp": "ISO-8601", "skill": "seo", "event_type": "user_correction", "context": "Severity was HIGH but user downgraded to MEDIUM — ranking factor less impactful than rated"}
```

Track these patterns:
- Which verification rules catch the most false findings?
- Which checklist items produce the most actionable vs. noise findings?
- Are certain OWASP/ranking-factor categories over-represented in reports?
- How often does the user override severity ratings?
