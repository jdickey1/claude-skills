---
description: Run a dedicated AEO (Answer Engine Optimization) audit to measure and improve AI search visibility across ChatGPT, Perplexity, Claude, Gemini, and Google AI Overviews
argument-hint: <url> | --audit <project>
---

**First**: Use the `seo` skill for core philosophy, verification rules, and the Three-Layer Model (SEO + AEO + GEO).

## Two Invocation Modes

1. **Full AEO audit** — `$ARGUMENTS` is a target URL. Runs the 100-point scored assessment, Answer Intent Map, and 4-week implementation roadmap.
2. **Quarterly citation audit** — `$ARGUMENTS` starts with `--audit` (e.g., `--audit jdkey.com`, `--audit hyperscale`). Runs the quarterly citation-presence matrix across ChatGPT / Perplexity / Google AI Mode against the project's stored query panel and produces a quarterly audit note.

If no arguments are provided, ask the user which mode and what target.

### Quarterly Citation Audit Mode (--audit)

When invoked with `--audit`, follow the **"Quarterly Citation Audit Protocol"** in `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/aeo.md`. Key requirements:

- Reuse the project's stored query panel from prior quarter (found in `01-Projects/<Project>/aeo-citation-audit-*.md`). If none exists, build one per the protocol's query-panel design and save it as the baseline.
- Test every query across **ChatGPT, Perplexity, and Google AI Mode** (required). Claude/Gemini optional.
- Per query, log: cited (yes/no), prominence (high/medium/low/none), source surface (company-page / personal-profile / website / article / other), and top competitors cited.
- Write the per-quarter note to `01-Projects/<Project>/aeo-citation-audit-YYYY-QN.md` using the template from the protocol.
- Include a quarter-over-quarter trend table when prior audits exist.
- End with "Actions for Next Quarter" — 3-5 concrete content/surface moves driven by the citation gaps surfaced.

Run the Source Credibility Check below before adopting any vendor-claimed numbers cited during the audit.

Run a dedicated AEO audit on the provided URL (`$ARGUMENTS`). If no URL is provided, ask the user for a target website.

## Source Credibility Check (Before Adopting Any Cited Number)

Before adopting any AEO number that arrives via a social-media thread, vendor blog, or "proprietary study," run this three-check pattern. The canonical escape hatch for LinkedIn-AEO specifically is the **Verified LinkedIn AEO Playbook** in `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/aeo.md` — fall back to it when a viral claim fails triangulation.

1. **Traceability** — Is the "proprietary study" traceable to public research (Semrush, Ahrefs, Profound, Peec AI, LLM Pulse, Search Engine Land)? If the numbers match an unattributed public study, treat as repackaged.
2. **Closed loop** — Does the author own a tool that produced the data? Closed-loop marketing data is directional at best.
3. **Triangulation** — Can the headline number be reproduced across **≥2 independent trackers**? If not, flag as basket-specific or unsupported.

When **all three** fire, warn the user and cite the verified playbook instead of the viral number. Single trigger is informational only. The guardrail warns — it never blocks.

**Reference test:** Given "Jake Ward says LinkedIn is 11% of AI answers — should we adopt?" — the command should surface the verified `aeo.md` row ("basket-specific; false on broad baskets per LLM Pulse"), warn that the headline is not triangulated, and return the verified tactics (500-2,000 word articles, 50-66% citation share; platform split; Bing-first mechanism) rather than the headline number.

Keep the wording of this check aligned with the matching guardrail in the `digest` skill's Section 5 — they solve the same failure mode (closed-loop marketing data) and should stay in sync when either is edited.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/aeo.md` for the full AEO audit framework and scoring system
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/ai-search.md` for citation data and platform-specific stats
3. Follow the 4-section audit structure from `aeo.md`:
   - **AI Crawlability & Access** (0-20 pts) — robots.txt, technical accessibility
   - **Content Structure & Extractability** (0-25 pts) — answer-first format, tables, FAQs, freshness
   - **Schema & Machine-Readable Data** (0-25 pts) — JSON-LD, llms.txt, brand-facts
   - **Authority & Trust Signals** (0-30 pts) — 19 trust signals, third-party validation
4. Run an **Answer Intent Map** — test 15-20 category queries in ChatGPT and Perplexity to establish the brand's current AI visibility baseline
5. Generate scored report with prioritized implementation roadmap

## Answer Intent Mapping + Visibility Scorecard

This is what makes the AEO audit actionable. For the target business:

1. Generate 15-20 query variations buyers would ask AI (category + location + use case + brand vs competitor). Follow the query generation guidance in `aeo.md`.
2. Test each via WebSearch — note which brands/sites appear in search results as a proxy for AI engine responses
3. For each query, log: query text, brand mentioned (yes/no), prominence (high/medium/low), competitors that appeared
4. Calculate the **Visibility Score** using the formula in `aeo.md` (Quantitative Visibility Scorecard section):
   - Mention Rate (% of queries where brand appears)
   - Prominence Rate (% of mentions at high/medium prominence)
   - Composite Score = (Mention Rate x 0.6) + (Prominence Rate x 0.4)
5. Build the **Competitor Frequency Table** — rank all competitors by appearance count
6. Identify **high-value gaps** — queries where 2+ competitors appear but target brand does not
7. Include **historical tracking row** if this is a repeat audit

## Adapt to Business Type

- **Ecommerce:** Focus on Answer Hub pages, product schema with GTINs, Merchant Center feed, GPT Shopping eligibility
- **Service businesses** (law firms, consultants, agencies): Focus on Service Authority Pages, professional directory citations, credential signals, case studies
- **Content sites:** Focus on topical authority, FAQ coverage, original research, author credentials

## Critical Rules

- Use dev-browser (script files at `/tmp/*.js`, run via `dev-browser run /tmp/script.js`, never heredocs) to inspect live pages — evaluate DOM, read rendered HTML, screenshot
- Check `robots.txt` directly with curl for AI bot directives
- **Verify schema in raw HTML** — don't rely on content extractors for structured data findings
- Check for `llms.txt` and `brand-facts.json` at their expected URLs
- Weight severity using the Common Mistakes table in `aeo.md`
- The Answer Intent Map is NOT optional — it's the foundation of every recommendation

## Output

Use the AEO Audit Output Format from `aeo.md`. Score out of 100 with 4-section breakdown. Include:
- **Visibility Scorecard** — Mention Rate, Prominence Rate, composite Visibility Score (0-100 scale), competitor frequency table, gap analysis
- **Answer Intent Map** — full per-query results table
- Per-finding format matching the main SEO audit style (SEVERITY, Category, Page, Confidence, Issue, Recommendation, Impact)
- 4-week prioritized implementation roadmap (gap analysis queries should directly inform Week 2 content targets)
- Historical tracking row for trend monitoring
- Weekly maintenance loop setup instructions
