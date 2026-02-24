# Ranking Factor Priority (Evidence-Based)

When prioritizing findings, weight recommendations by actual ranking impact. Focus effort where data confirms it matters.

## High-Impact Factors (prioritize these)

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

## Low-Impact Factors (do NOT over-prioritize)

- **Keywords in URL slugs** — Google's John Mueller: "very lightweight" factor. Backlinko ranking study: near-zero correlation after controlling for other factors. URLs matter for user trust and CTR, not keyword matching. Never recommend restructuring existing URLs for keyword placement — the redirect risk outweighs the negligible benefit.
- **Exact-match anchor text** — Branded anchor text is safer and equally effective. Over-optimized anchors trigger penalties.
- **Blog content for local businesses** — Informational "how to" content attracts browsers, not buyers.
- **Domain Authority alone** — DA correlation with AI citations dropped from r=0.23 (2024) to r=0.18 (2026). E-E-A-T is the stronger signal.

## Severity Calibration

When assigning severity ratings, a missing title tag keyword is HIGH. A URL without keywords is INFO at most. Do not assign MEDIUM or HIGH to URL slug recommendations — the data does not support it.

## Severity Rating System

| Rating | Definition | Priority |
|--------|-----------|----------|
| **CRITICAL** | Site not indexed, major crawl blocks, no phone/address visible. Business invisible to search. | Fix immediately |
| **HIGH** | Missing GBP optimization, no schema, keyword cannibalization, no Bing listing, no E-E-A-T signals. Major ranking limitation. | Fix within 1 week |
| **MEDIUM** | Missing citations, thin content, poor internal linking, no AI optimization, no author attribution. Competitive disadvantage. | Fix within 1 month |
| **LOW** | Minor improvements - image optimization, anchor text diversity, content freshness. Polish items. | Fix in next cycle |
| **INFO** | Best practice recommendation. No immediate ranking impact but compounds over time. | Consider for roadmap |

## Keyword Validation

When recommending new pages or content during an audit, validate that the target keyword matches real search behavior before recommending it:

- [ ] **SERP test** - Search the exact keyword in Google. Results dominated by local competitors and directories = valid. Results showing DIY sites, forms, or unrelated content = weak keyword.
- [ ] **People Also Ask check** - PAA questions should align with the service being offered. If PAA is all DIY/informational, the keyword attracts researchers not buyers.
- [ ] **Competitor page check** - Do 3+ local competitors have a dedicated page for this keyword? If yes, validated. If zero, it's either a gap or nobody searches for it — investigate which.
- [ ] **AI query alignment** - Would someone ask ChatGPT or Google AI this question? If yes, FAQ sections can capture AI-generated answer traffic.
- [ ] **Recommend fold vs. standalone** - If a keyword fails validation, recommend folding that content into a stronger parent page as a section rather than creating a standalone page nobody will find.
