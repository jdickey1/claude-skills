---
description: Run a dedicated AEO (Answer Engine Optimization) audit to measure and improve AI search visibility across ChatGPT, Perplexity, Claude, Gemini, and Google AI Overviews
argument-hint: <url>
---

**First**: Use the `seo` skill for core philosophy, verification rules, and the Three-Layer Model (SEO + AEO + GEO).

Run a dedicated AEO audit on the provided URL (`$ARGUMENTS`). If no URL is provided, ask the user for a target website.

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

## Answer Intent Mapping

This is what makes the AEO audit actionable. For the target business:

1. Generate 15-20 query variations buyers would ask AI (category + location + use case + brand vs competitor)
2. Test each in ChatGPT and Perplexity (use WebSearch to simulate — note which brands/sites appear in search results as a proxy)
3. Log: query, which brands appear, whether target brand is mentioned, position
4. Summarize as visibility score: X out of Y queries mention the brand

## Adapt to Business Type

- **Ecommerce:** Focus on Answer Hub pages, product schema with GTINs, Merchant Center feed, GPT Shopping eligibility
- **Service businesses** (law firms, consultants, agencies): Focus on Service Authority Pages, professional directory citations, credential signals, case studies
- **Content sites:** Focus on topical authority, FAQ coverage, original research, author credentials

## Critical Rules

- Use Playwright to inspect live pages (snapshot, screenshot, evaluate DOM)
- Check `robots.txt` directly with curl for AI bot directives
- **Verify schema in raw HTML** — don't rely on content extractors for structured data findings
- Check for `llms.txt` and `brand-facts.json` at their expected URLs
- Weight severity using the Common Mistakes table in `aeo.md`
- The Answer Intent Map is NOT optional — it's the foundation of every recommendation

## Output

Use the AEO Audit Output Format from `aeo.md`. Score out of 100 with 4-section breakdown. Include:
- AI visibility baseline (Answer Intent Map results)
- Per-finding format matching the main SEO audit style (SEVERITY, Category, Page, Confidence, Issue, Recommendation, Impact)
- 4-week prioritized implementation roadmap
- Weekly maintenance loop setup instructions
