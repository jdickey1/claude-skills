# Link Building & Authority

Backlinks remain a core ranking factor but the game has shifted: **topical relevance beats raw domain authority**. A link from a DR 40 site in your niche can outperform a DR 80 link with no thematic connection. For AI search, backlinks matter primarily through organic ranking performance — 92% of AI Overview citations come from domains already in the top 10.

## Link Profile Assessment

- [ ] **Balanced homepage vs deep page links** — natural profiles mix both. Heavily homepage-concentrated profiles are a red flag. Deep links to service/landing pages build topical authority for specific terms.
- [ ] **Anchor text distribution is safe** — 30-50% branded, 20-30% partial-match, <10% exact-match keywords. Over-optimized exact-match anchors trigger Penguin penalties.
- [ ] No spammy or irrelevant backlinks (PBNs, paid links, link exchanges, directory spam)
- [ ] Internal linking strategy connects service pages to homepage (see audit checklist B4 for detailed internal linking)
- [ ] **Link reclamation performed** — 66.5% of backlinks across top sites point to 404 pages. Identify broken backlinks and create 301 redirects. Unlinked brand mentions converted to links (25%+ conversion rate). Faster ROI than new link building.
- [ ] Competitor backlink sources identified for prospecting (use Link Intersect to find sites linking to competitors but not you)
- [ ] **Link velocity is natural** — new sites: 5-10 links/month initially. Established sites: +5-14.5% monthly growth in referring domains. Sudden spikes trigger scrutiny; consistent pace is safe.
- [ ] **Original research and data-driven content** created as link magnets — original research earns 8x more backlinks than curated/opinion content. 90%+ of successful digital PR campaigns use data-led content.
- [ ] **Nofollow/sponsored/UGC attributes** used correctly on outbound links — Google treats these as "hints" not strict exclusions; they may still pass some value

## Link Building Tactics (Prioritized)

1. **Digital PR** — most effective tactic (48.6% of SEOs rank it #1). Expert commentary, original data studies, newsworthy angles. Cost: $10K-$50K/quarter for agencies; DIY via HARO/Connectively for editorial links at low cost.
2. **HARO/Connectively** — revived April 2025 with original format. Best cost-to-quality ratio for natural editorial links. Relationship-building outreach gets 25-30% response rate vs 1-2% for templates.
3. **Guest posting** — quality over quantity. Strategic placement on topically relevant, authoritative sites. $150-$400 per editorial placement.
4. **Broken link building** — find broken outbound links on relevant sites, offer your content as replacement.
5. **Resource page outreach** — works best in niche industries with curated resource lists.
6. **GSC "Export and Expand" prospecting** — use Google Search Console's Links report (free) as a backlink intelligence source. Workflow: export your linking domains → categorize by type (blogs, resource pages, directories, news) → search Google for similar sites in each category → build outreach list from results. This is free competitor backlink research without paid tools.

## Backlink Indexing

Building backlinks is only half the job — Google no longer reliably auto-indexes new pages. If a backlink isn't indexed, it passes zero value. Proactive indexing should be part of every link building workflow.

### Indexing Methods (Prioritized)

1. **Google Search Console submission** (free, owned domains only) — submit the backlink URL for inspection. Takes 24-48 hours but gives crawl/index diagnostics. Works for your own blogposts and any domain you control. Nearly 100% indexing rate on healthy sites.

2. **Social media cross-posting** (free, any URL) — share the backlink URL across Facebook, X, Threads, Bluesky, Tumblr, and YouTube Community posts. Meta platforms changed indexing rules in 2025 — social posts now appear heavily in SERPs and the linked URLs frequently get crawled as a side effect. No ownership required.

3. **Free press releases** (free, any URL) — publish a newsworthy press release on OpenPR or PRlog with the target URL in the body text. Press releases on these platforms typically index within ~20 minutes, and the embedded links get crawled. Requires writing actual news-angle content.

4. **Paid indexing services** (paid, any URL) — tools like Primeindexer force Googlebot to visit target URLs. Can index links in 2-5 minutes. Works on social posts, cloud links, press releases, profile links, citations, and blog posts. Best for high-volume link building where you can't wait for organic crawling.

### Indexing Checklist

- [ ] **New backlinks are submitted for indexing** within 48 hours of creation
- [ ] **Own-domain content** submitted to GSC immediately after publishing
- [ ] **Third-party backlinks** (social posts, citations, guest posts) cross-posted on social platforms to trigger crawling
- [ ] **High-priority backlinks** verified as indexed via `site:url` search within 1 week
- [ ] **Non-indexed backlinks** resubmitted or reposted (for social: delete and repost with same content to get a fresh crawl)

## Free Prospecting Tools ($0)

Before committing to paid APIs, these free tools cover core backlink research:

- **Google Search Console Links report** — shows who links to you, your top linked pages, and top linking sites. Use the export-and-expand workflow above to turn existing backlinks into prospecting lists.
- **Ahrefs Free Backlink Checker** (ahrefs.com/backlink-checker) — 100 backlink lookups per day per domain, no account required. Use it for quick competitor top-page analysis, broken link discovery, and content gap identification. Not automatable at scale, but effective for manual research.
- **Google Search operators** — `"resource page" + [your niche]`, `"add a link" + [topic]`, `intitle:"useful links" + [industry]` to find link placement opportunities directly.
- **Common Crawl + DuckDB** — scriptable, domain-level backlink data from Common Crawl's quarterly hyperlink graph. See **Common Crawl Backlink Audit** below for the full workflow. Free alternative to Ahrefs/SEMrush for the "who links to this domain" question. Best for competitive gap analysis (find domains linking to competitors but not to you) and one-shot audits. Limitations: quarterly refresh (not real-time), domain-level only (no URL/anchor detail), coverage biased toward larger sites.

## Common Crawl Backlink Audit

Common Crawl publishes a quarterly domain-level hyperlink graph as two gzipped TSV files (vertices + edges). With DuckDB you can query it locally in ~10-15 minutes after a one-time ~17 GB download. This is the free infrastructure that replaces paid API calls for competitive backlink analysis.

**Use this when:**
- You need a competitive backlink map for a client audit and don't have budget for Ahrefs/SEMrush.
- You're quantifying the gap between a site and 3-10 named competitors.
- You want to find "linked to competitors but not to us" prospecting targets at zero marginal cost.

**When NOT to use this:**
- You need per-URL or per-anchor-text data → Common Crawl only publishes domain-level edges.
- You need fresh-this-week data → the graph refreshes quarterly.
- You're checking a single backlink for indexation → use `site:url` or GSC.

### Quick start

Use the `Tools/commoncrawl-backlinks.sh` script (see Tools table in SKILL.md) — it handles DuckDB install, CC release discovery, caching, SQL generation, and backgrounded execution. Typical run on a modest VPS: 10-20 minute first-time download, then 10-15 minute query per multi-domain batch.

Credit: the methodology is adapted from [Ben Word's (@retlehs) gist](https://gist.github.com/retlehs/cf0ac6c74476e766fba2f14076fff501), which demonstrated the base DuckDB + Common Crawl pattern for single-domain lookups. The script in this skill extends it to multi-domain competitive audits with gap analysis.

### What you get

For each target domain, per run:

1. **Target resolution** — confirms the domain appears in the CC graph (some low-coverage domains won't resolve and return 0 backlinks; this is a data-coverage limit, not a real zero).
2. **Backlink counts per target** — total linking domains + their aggregate host count (proxy for linking-domain size).
3. **Top 25 linking domains per target** — ranked by host count (larger linking sites ~= higher authority).
4. **Gap analysis** — domains that link to competitors but NOT to your target. These are your highest-confidence outreach targets.

### Interpreting CC-derived backlink counts

- **Counts are lower than Ahrefs/SEMrush** (often 10-30% of paid-tool numbers) because CC only indexes what its crawler reaches. Treat them as a consistent floor across all domains in a run, not an absolute truth.
- **Zero or near-zero results for your target** usually means one of: (a) the site is too new/small for CC to have crawled widely, (b) most of your backlinks are on nofollowed/noindexed hosts CC skips, or (c) your site is correctly reporting that its real footprint is thin.
- **Relative ranking between competitors is reliable** — if Competitor A shows 10× more CC backlinks than Competitor B, the real ratio is probably similar.
- **Gap analysis is the highest-signal output** — an outreach list of domains linking to 2+ competitors but not you is directly actionable. Prioritize by linking-domain size.

### Integrating with the rest of this skill

- Run before or alongside `competitor-backlinks.mjs` (paid DataForSEO). The two sources complement each other: CC gives you the long tail of smaller linking sites; DataForSEO gives URL/anchor/dofollow granularity.
- Feed the "gap analysis" output into `backlink-outreach.mjs` as an outreach queue seed.
- Re-run quarterly as Common Crawl publishes new releases to track "new/lost backlinks this quarter" at zero marginal cost (cache both release cycles in the same parent directory).

## Content Types That Earn Links

- **Original research/data studies** — 8x more backlinks than curated content
- **Infographics** — +178% link increase; 29% of sites prefer linking to infographics over lengthy articles
- **Interactive tools** — calculators, assessments, comparison engines earn natural links
- **Definitive guides** — comprehensive, authoritative reference content
- **"Why" and "What" posts** — 25.8% more links than how-to guides or videos

## Local Link Building

Local links are weighted differently than national — proximity and relevance matter more. Google's Helpful Content system rewards genuine community participation.

- [ ] **Sponsorships** — local events, sports teams, nonprofits, charity auctions (organizers link to sponsor pages). Often overlooked but high ROI: local authority + community goodwill.
- [ ] **Local media outreach** — pitch newsworthy angles to local papers/outlets (highest authority + local relevance). Angles that work: community initiatives, industry awards, free services for nonprofits/seniors, local data or trends.
- [ ] **Business partnerships** — cross-promotional content with complementary businesses (landscaper + pool company, painter + realtor)
- [ ] **Chamber of Commerce membership** and professional association listings — geo-relevant, authoritative backlinks
- [ ] **Community involvement** documented on website and linked from event pages
- [ ] **Event hosting** — free workshops, webinars, community events generate links from promotional sites

## Brand Signals

Brand search volume is the strongest predictor of AI citations (r=0.334), stronger than backlink count (r=0.37).

- [ ] Brand name searches are growing (or at minimum, exist)
- [ ] Social profiles exist and link to website
- [ ] Wikipedia or knowledge panel presence (if applicable)
- [ ] Brand mentioned in community discussions (forums, Reddit, etc.)
- [ ] Consistent brand presentation across all platforms
- [ ] **Entity consistency** — same brand name, author names, and identifiers across all web properties. AI systems use entity matching to build confidence.
- [ ] **Third-party presence** — brand visible on authoritative sites beyond your own (press mentions, industry publications, expert-curated lists). Sites with 32K+ referring domains are 3.5x more likely to be cited by ChatGPT.
