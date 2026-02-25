# AI Search Optimization (AEO/GEO)

> **For the full AEO audit framework** (scoring, Answer Intent Mapping, trust signals, service business adaptations, implementation roadmap), see `reference/aeo.md`. This file covers citation data, content formatting, and platform-specific stats.

AI Overviews appear in ~16-60% of Google searches (varies by query type; peaked at 60% in Nov 2025). 58-60% of searches end without a click. Organic CTR drops 61% when AI Overviews appear (from 1.76% to 0.61%). Being cited in AI answers is the counter-strategy: cited brands recover +35% organic CTR and +91% paid CTR vs uncited.

**AEO vs GEO distinction:** AEO (Answer Engine Optimization) = be the direct answer (featured snippets, voice, position zero). GEO (Generative Engine Optimization) = be the source AI synthesizes from (ChatGPT, Perplexity, Claude, Copilot). AEO originated in Google-focused SEO; GEO emerged with LLMs. Optimize for both.

## Answer Engine Optimization (AEO)

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

## Generative Engine Optimization (GEO)

- [ ] **Brand entity recognition** — consistent brand mentions across authoritative third-party sites. Brands in lowest quartile of web mentions are nearly absent from AI Overviews. ChatGPT now tags brands as structured entities (Oct 2025 update); fewer brands surfaced per answer (3-4 vs 6-7) means authority matters more.
- [ ] **Third-party review profiles** — presence on Trustpilot, G2, Capterra, Yelp increases citation probability 3x
- [ ] Expert reviews, press mentions, and industry recognition exist
- [ ] **Author attribution with visible credentials** — author credentials increase AI citations by +40%. Author identity is a direct input to Google's quality models.
- [ ] **Definitive language** — AI systems prefer "X is true" over "X might be true." High entity density (15+ recognized entities per page = 4.8x higher citation likelihood).
- [ ] Content includes verifiable data with current-year citations — pages citing current-year sources appear in positions 3-5 vs older references in positions 6-8
- [ ] **Content freshness maintained** — 53% of ChatGPT citations are content updated within 6 months. 23% of AI Overview featured content is <30 days old. Target 90-day update cadence for competitive topics.
- [ ] **Defensive AI SEO** — monitor AI answers about your brand across platforms. Create authoritative "single source of truth" content that AI prefers over misinformation. Publish FAQ sections addressing false narratives with verifiable data.

## Technical AI Accessibility

- [ ] Content is in HTML (not trapped in JavaScript-only rendering)
- [ ] No cloaking (same content served to bots and users)
- [ ] Clean HTML structure (semantic elements: article, section, nav, main)
- [ ] Structured data is comprehensive — schema markup boosts AI citations by 36%. 2.3x more likely in AI Overviews vs pages without.
- [ ] **Page speed matters for AI** — pages with FCP under 0.4s average 6.7 citations; over 1.13s drops to 2.1 (3x difference)
- [ ] Site loads without JavaScript (SSR/SSG preferred for key content)
- [ ] Descriptive image alt text (AI can't see images without it)
- [ ] **AI crawler governance** — allow GPTBot, ClaudeBot, PerplexityBot for AI search visibility. Block Google-Extended if you want to prevent AI training without affecting traditional SEO. Only 14% of top domains have AI bot directives in robots.txt. GPTBot surged from 5% to 30% of AI crawler traffic (2024-2025).

## Multi-Platform AI Visibility

Each platform cites different sources — only 11% of domains appear in both ChatGPT and Perplexity citations.

- [ ] **Google AI Overviews** — favors fresh community content (Reddit 20%, YouTube 23.3%, Wikipedia only 7%). 76% of citations from top-10 pages, but 47% come from positions #6-#20+. Informational queries: 99.9% AI Overview rate. Local queries: only 7.9%.
- [ ] **ChatGPT** — relies heavily on Wikipedia (43%) and training data. Prefers DA 60+ domains. 7.92 citations per question. Favors definitive language, high entity density, simple writing structures.
- [ ] **Perplexity** — real-time web retrieval, most transparent. 21.87 citations per question (highest). Favors recency over domain authority. YouTube (16.1%) and Reddit (6.6%) heavily cited.
- [ ] **Bing/Copilot** — software and tech sources preferred (SourceForge 21.33%). Important for Microsoft ecosystem and enterprise B2B searches.
- [ ] **Sitemap freshness** — Bing weights `lastmod`, `changefreq` more than Google
- [ ] Content is voice-search friendly (conversational Q&A format). 50%+ of local searches are now voice; 58% of consumers use voice for local business info.
- [ ] **Reddit presence** (if applicable) — Google AI Overviews cite Reddit 20% of the time. Authentic participation in relevant subreddits drives AI citations.
- [ ] **Video content** — YouTube = 23.3% of Google AI Overview citations. Chapter timestamps enable AI to cite specific segments.

## AI Citation Data Quick Reference

| Signal | Impact on AI Citations |
|--------|----------------------|
| Schema markup (JSON-LD) | 2.3-2.5x more likely to be cited; GPT-4 accuracy 16%->54% with schema |
| Tables and comparison matrices | 2.5-2.8x citation rate vs text-only |
| Original data/statistics | 4.1-5.5x citation boost |
| Strong E-E-A-T signals | r=0.81 correlation (strongest predictor) |
| Listicles/numbered lists | 50% of top AI citations |
| Third-party review profiles | 3x higher citation probability |
| Consistent heading hierarchy | 3.2x higher citation rates |
| Meaningful content updates | +71% citation lift (vs +12% for timestamp-only) |

## Platform-Specific Notes

- **Google AI Overviews** — Sources broadly, cites ~7.7 domains per response. E-E-A-T is primary filter.
- **ChatGPT** — Uses Bing's index. Wikipedia-heavy (47.9% of citations). Cites ~5.0 domains per response. Bing SEO is foundational.
- **Perplexity** — Most transparent/trackable. Indexes fresh content within hours. Only 11% domain overlap with ChatGPT citations.
- **Voice assistants** — Only 1% answer overlap across Google, Siri, and Alexa. Must optimize for all platforms, not just Google.
