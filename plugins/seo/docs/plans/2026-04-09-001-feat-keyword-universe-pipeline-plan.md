---
title: "feat: Add Keyword Universe pipeline with business profiling, DataforSEO discovery, and Jaccard clustering"
type: feat
status: completed
date: 2026-04-09
deepened: 2026-04-09
---

# feat: Add Keyword Universe pipeline with business profiling, DataforSEO discovery, and Jaccard clustering

## Overview

Add three new automation capabilities to the SEO skill plugin that together form a "Keyword Universe" pipeline: (1) a per-project business profiling config that filters all keyword recommendations by business relevance, (2) a DataforSEO-powered keyword discovery script that supplements Keywords Everywhere with multi-source seed expansion, and (3) a SERP-based Jaccard clustering script that automatically groups keywords into topic clusters with page mapping recommendations.

These scripts follow the established patterns in `skills/seo/Tools/` — standalone `.mjs` files that output JSON to `data/seo/YYYY-MM-DD/`, use env vars for auth, and include `fetchWithRetry`, logging, and console summaries.

## Problem Frame

Current keyword research is single-source (Keywords Everywhere), requires manual seed lists, produces flat keyword lists with no grouping, and has no business context layer. This means:
- Keyword discovery is limited to what we explicitly seed
- No automatic clustering into topic groups for page mapping
- No filter to ensure keywords align with business goals and revenue
- Manual effort is the bottleneck as keyword volume grows

Tryggvi's "Keyword Universe" architecture demonstrates a better approach: multi-source ingestion, automatic clustering via SERP overlap, and a business-profiling AI layer that gates everything.

## Requirements Trace

- R1. Per-project business profile config (JSON) that defines what the business sells, current audience, and aspirational audience
- R2. DataforSEO Keyword Ideas endpoint integration for automated seed expansion (~5K keywords for ~$2-3)
- R3. DataforSEO SERP API integration for fetching top 10 results per keyword (~$0.60/1K queries)
- R4. Jaccard similarity clustering at configurable threshold (default 0.6) using SERP URL overlap
- R5. Cluster output includes page mapping recommendations (existing URL match or "new page candidate")
- R6. All scripts follow existing Tool conventions: env var auth, `data/seo/YYYY-MM-DD/` output, fetchWithRetry, logging, console summary
- R7. Business profile is used to score keywords by business relevance (+1 product term match, +1 location match, -1 irrelevant topic match). Keywords scoring -1 are excluded; remaining keywords are ranked by score then volume
- R8. Total API cost stays under $10/month for a 5K keyword universe refresh

## Scope Boundaries

- No vector database integration in this plan — that's a follow-up project
- No forum/Reddit scraping — separate ingestion source to add later
- No auto page creation or CMS integration — output is recommendations, not automation
- No UI/dashboard — JSON output consumed by existing SEO skill workflows
- Keywords Everywhere script (`keyword-research.mjs`) stays as-is — new scripts supplement, don't replace
- No changes to `content-brief.mjs`, `gsc-report.mjs`, `competitor-backlinks.mjs`, or `backlink-outreach.mjs`

## Context & Research

### Relevant Code and Patterns

- `skills/seo/Tools/competitor-backlinks.mjs` — DataforSEO auth pattern: reads `DATAFORSEO_AUTH` (Base64-encoded `login:password`), uses `fetchWithRetry` with exponential backoff, outputs to `data/seo/YYYY-MM-DD/`
- `skills/seo/Tools/keyword-research.mjs` — Keyword expansion pattern: seeds → API expand → batch data fetch → sort by volume → JSON output + console summary
- `skills/seo/Tools/.env.example` — env var conventions, already has `DATAFORSEO_AUTH` defined
- `skills/seo/Tools/content-brief.mjs` — SERP data fetching pattern (currently via Serper), `slugify()` utility
- All scripts share: `today()`, `outDir()`, `log()`, `fetchWithRetry()` utilities — duplicated per file (no shared module)

### DataforSEO API Details

- **Keyword Ideas endpoint**: `POST https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live` — $0.0105/request, up to 200 seed keywords per request, returns related keywords with volume, CPC, competition
- **SERP API**: `POST https://api.dataforseo.com/v3/serp/google/organic/live` — $0.002/request (Live queue), returns top N organic results with URLs, titles, snippets
- **Auth**: Basic Auth with Base64-encoded `login:password` — same pattern as `competitor-backlinks.mjs`
- **Rate limits**: 2,000 requests/minute, 30 concurrent per endpoint

### Jaccard Clustering Algorithm

- Compare top 10 SERP URLs for each keyword pair
- Jaccard coefficient = |intersection of URLs| / |union of URLs|
- Threshold of 0.6 = keywords with 60%+ URL overlap cluster together
- Agglomerative clustering or union-find to form groups
- Cost: purely computational after SERP data is fetched

## Key Technical Decisions

- **Node.js (not Python) for clustering**: All existing scripts are `.mjs`. Keeping the entire pipeline in one language simplifies deployment, avoids a Python dependency, and follows established patterns. Jaccard computation is simple math — no need for scikit-learn.
- **DataforSEO Live queue as default**: Use Live queue ($0.002/request, synchronous) as the default — simpler implementation, no polling complexity. Support `--standard` flag for bulk runs at $0.0006/request when cost optimization matters. Standard queue requires async task_post/tasks_ready/task_get polling pattern — add as a follow-up optimization once the pipeline works end-to-end with Live queue.
- **Separate scripts, not monolith**: Three independent scripts (`business-profile.mjs` for validation, `keyword-universe.mjs` for discovery, `keyword-cluster.mjs` for clustering) rather than one pipeline. This matches existing conventions and allows running each step independently.
- **Business profile as JSON file**: Not YAML (no parser needed in Node without extra deps). Stored as `seo-profile.json` in the project root. Simple `readFileSync` + `JSON.parse`.
- **Cluster output feeds content-brief.mjs**: Clusters produce a list of keywords per topic group. The user picks a cluster and feeds it to `content-brief.mjs` for SERP analysis — no changes needed to the existing brief workflow.
- **Union-find for clustering**: More efficient than pairwise matrix for large keyword sets. O(n * alpha(n)) per merge vs O(n^2) for full matrix. Still simple to implement in ~30 lines of JS.

## Open Questions

### Resolved During Planning

- **Which DataforSEO endpoint for keyword ideas?** → `dataforseo_labs/google/keyword_suggestions/live` — returns related keywords with metrics, accepts up to 200 seeds per request
- **Standard vs Live queue?** → Default to Live queue ($0.002/request, synchronous) for simplicity. Support `--standard` flag for bulk runs at lower cost. Standard queue polling architecture is a follow-up optimization
- **How to handle the SERP fetch volume?** → Fetch SERPs only for keywords that pass the business relevance filter, not all discovered keywords. This keeps API costs manageable
- **Shared utility module?** → No — existing scripts duplicate utilities. Follow the same pattern. Extracting shared code would be a separate refactor

### Deferred to Implementation

- Exact DataforSEO response field names for keyword suggestions (need to test with a live request)
- Optimal batch size for SERP API requests (start with 1 keyword per request, test batching)
- Whether Standard queue requires polling for task completion (may need a `check task` pattern)

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
Pipeline Flow:
                                                  
  seo-profile.json ─────────────────────────────┐  
  (per-project)                                  │  
                                                 ▼  
  keyword-universe.mjs                    ┌─────────────┐
  ┌──────────────────┐                    │  Business    │
  │ Read seeds from  │                    │  Relevance   │
  │ seo-profile.json │                    │  Filter      │
  │        │         │                    └──────┬──────┘
  │        ▼         │                           │
  │ DataforSEO       │                           │
  │ Keyword Ideas    │──► keyword-universe.json ──►  keyword-universe-filtered.json
  │ (expand seeds)   │    (all discovered)       │
  └──────────────────┘                           │
                                                 ▼
                                        keyword-cluster.mjs
                                        ┌──────────────────┐
                                        │ Fetch top 10     │
                                        │ SERPs per keyword│
                                        │ (DataforSEO SERP)│
                                        │        │         │
                                        │        ▼         │
                                        │ Jaccard pairwise │
                                        │ similarity       │
                                        │        │         │
                                        │        ▼         │
                                        │ Union-find       │
                                        │ clustering (0.6) │
                                        │        │         │
                                        │        ▼         │
                                        │ Page mapping     │
                                        │ recommendations  │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        clusters.json
                                        (topic groups with
                                         page mapping recs)
```

**Data flow:**
1. `seo-profile.json` provides seeds + business context
2. `keyword-universe.mjs` expands seeds via DataforSEO → `keyword-universe.json`
3. Business relevance filter scores keywords → `keyword-universe-filtered.json`
4. `keyword-cluster.mjs` reads filtered keywords, fetches SERPs, clusters → `clusters.json`

## Implementation Units

- [ ] **Unit 1: Business Profile Config**

**Goal:** Define the per-project `seo-profile.json` schema and create a validation script that reads/validates it.

**Requirements:** R1, R7

**Dependencies:** None

**Files:**
- Create: `skills/seo/Tools/seo-profile.example.json`
- Create: `skills/seo/Tools/validate-profile.mjs`
- Create: `skills/seo/Tools/.gitignore` (exclude `seo-profile.json`, `data/`, `.env` — the plugin repo is public and these contain business intelligence and credentials)

**Approach:**
- `seo-profile.json` lives in the consuming project root (next to `.env`), not in the plugin. Resolution order: (1) `--profile` CLI flag if provided, (2) `SEO_PROFILE_PATH` env var if set, (3) `process.cwd()/seo-profile.json` as default. This resolution order applies to all scripts that read the profile (validate-profile, keyword-universe, keyword-cluster)
- Schema includes: `business.description`, `business.products` (array), `business.currentAudience`, `business.aspirationalAudience`, `seeds` (array of seed keywords), `competitors` (array of domains), `siteUrl`, `targetLocation` (e.g., "us"), `irrelevantTopics` (array of exclusion terms)
- `validate-profile.mjs` reads the file, checks required fields, prints a summary
- The example file should be concrete (not placeholder) so users understand the expected detail level
- `seeds` in the profile replaces the hardcoded `SEED_KEYWORDS` array in the current `keyword-research.mjs`

**Patterns to follow:**
- `competitor-backlinks.mjs` lines 13-18: hardcoded `COMPETITORS` array — the profile externalizes this pattern

**Test scenarios:**
- Happy path: valid `seo-profile.json` with all required fields → validation passes, prints business summary
- Error path: missing required field (e.g., no `seeds`) → clear error message naming the missing field
- Error path: file not found → error message with path and instruction to copy from example
- Edge case: empty `seeds` array → warning that no keywords will be discovered
- Edge case: `irrelevantTopics` contains terms that overlap with `seeds` → warning about conflict

**Verification:**
- `node validate-profile.mjs` succeeds with the example file copied to project root
- Error messages are specific enough to fix the issue without reading docs

---

- [ ] **Unit 2: DataforSEO Keyword Discovery Script**

**Goal:** Create `keyword-universe.mjs` that reads seeds from `seo-profile.json`, expands them via DataforSEO Keyword Ideas endpoint, scores by business relevance, and outputs filtered keywords.

**Requirements:** R2, R6, R7, R8

**Dependencies:** Unit 1 (reads `seo-profile.json`)

**Files:**
- Create: `skills/seo/Tools/keyword-universe.mjs`

**Approach:**
- Read `seo-profile.json` for seeds, business context, and irrelevant topics
- Phase 1 — Seed expansion: POST seeds (up to 200 per request) to DataforSEO `keyword_suggestions/live` endpoint. Collect all returned keywords with volume, CPC, competition
- Phase 2 — Business relevance scoring: For each keyword, score relevance using simple heuristics:
  - +1 if keyword contains any product/service term from profile
  - +1 if keyword contains target location
  - -1 if keyword contains any `irrelevantTopics` term
  - Neutral (0) otherwise
  - Filter out keywords scoring -1 (explicitly irrelevant)
  - Sort remaining by: relevance score (desc), then volume (desc)
- Phase 3 — Output `keyword-universe.json` (all discovered) and `keyword-universe-filtered.json` (relevance >= 0)
- Auth: reuse `DATAFORSEO_AUTH` env var (same Base64 pattern as `competitor-backlinks.mjs`)
- Console summary: total discovered, total after filtering, top 30 by volume, estimated clustering cost

**Patterns to follow:**
- `competitor-backlinks.mjs` lines 76-97: DataforSEO request pattern (POST with Basic Auth, task array, result extraction)
- `keyword-research.mjs` lines 113-188: seed expansion → batch data → sort → output flow

**Test scenarios:**
- Happy path: 5 seed keywords → DataforSEO returns ~200-500 related keywords → output JSON with volume/CPC/relevance
- Happy path: keywords matching `irrelevantTopics` are excluded from filtered output
- Happy path: keywords containing product terms score higher than generic keywords
- Error path: `DATAFORSEO_AUTH` not set → clear error with setup instructions
- Error path: `seo-profile.json` not found → error pointing to example file
- Error path: DataforSEO API returns 401 (bad auth) → specific auth error message
- Error path: DataforSEO rate limit (429) → retry with exponential backoff (via fetchWithRetry)
- Edge case: seed keyword returns 0 related keywords → logged, script continues with remaining seeds
- Edge case: duplicate keywords across seed expansions → deduplicated in output

**Verification:**
- `node keyword-universe.mjs` produces `data/seo/YYYY-MM-DD/keyword-universe.json` and `keyword-universe-filtered.json`
- Output JSON includes `generated`, `seedCount`, `totalDiscovered`, `totalFiltered`, `keywords` array
- Each keyword entry has: `keyword`, `volume`, `cpc`, `competition`, `relevanceScore`
- Console shows top 30 keywords and estimated clustering cost

---

- [ ] **Unit 3: SERP-Based Jaccard Clustering Script**

**Goal:** Create `keyword-cluster.mjs` that reads filtered keywords, fetches top 10 SERPs via DataforSEO, computes Jaccard similarity, clusters keywords at configurable threshold, and outputs topic groups with page mapping recommendations.

**Requirements:** R3, R4, R5, R6, R8

**Dependencies:** Unit 2 (reads `filtered-keywords.json`)

**Files:**
- Create: `skills/seo/Tools/keyword-cluster.mjs`

**Approach:**
- Read `keyword-universe-filtered.json` via `--input path` flag (preferred) or auto-discover from the most recent `data/seo/YYYY-MM-DD/` directory (list subdirectories matching YYYY-MM-DD pattern, sort descending, take first). Error if no directories found or if the discovered directory lacks `keyword-universe-filtered.json`
- Read `seo-profile.json` for `siteUrl` (needed for page mapping)
- Phase 0 — Cost gate: Count input keywords, cap at `--max-keywords N` (default 500). Print estimated API cost. If cost exceeds $5, require `--force` flag to proceed
- Phase 1 — Fetch SERPs: For each keyword, POST to DataforSEO SERP API (`serp/google/organic/live` by default). Extract top 10 organic URLs per keyword. Batch to stay under rate limits. Support `--standard` flag for async queue at lower cost (follow-up optimization)
- Phase 2 — Jaccard clustering: Build a pairwise Jaccard similarity score for all keyword pairs using their top 10 SERP URLs. Use union-find data structure: for each pair with Jaccard >= threshold (default 0.6, configurable via `--threshold`), merge their sets
- Phase 3 — Cluster assembly: Extract connected components from union-find. For each cluster: pick the highest-volume keyword as the "primary" keyword, list all member keywords, sum total search volume
- Phase 4 — Page mapping: For each cluster, check if any SERP URLs match `siteUrl` from the profile. If yes → "existing page: {url}". If no → "new page candidate". Sort clusters by total volume desc
- Phase 5 — Output `clusters.json` with cluster groups and page mapping recommendations. Console summary with top 10 clusters

**Technical design:**

> *Directional guidance, not implementation specification.*

```
Union-Find structure:
  parent = {}     // keyword -> parent keyword
  rank = {}       // keyword -> tree rank

  find(x):  path-compressed root lookup
  union(x, y):  merge by rank

Clustering flow:
  for each keyword pair (i, j) where i < j:
    urls_i = serps[keyword_i]   // Set of top 10 URLs
    urls_j = serps[keyword_j]
    jaccard = intersection(urls_i, urls_j).size / union(urls_i, urls_j).size
    if jaccard >= threshold:
      union(keyword_i, keyword_j)

  clusters = group keywords by find(keyword)
```

**Patterns to follow:**
- `competitor-backlinks.mjs` lines 76-97: DataforSEO POST pattern
- `keyword-research.mjs` lines 140-157: batch processing with progress logging

**Test scenarios:**
- Happy path: 50 filtered keywords → fetch SERPs → cluster into 8-15 topic groups → output with page mapping
- Happy path: two keywords with 7/10 same SERP URLs → clustered together (Jaccard 0.54-0.7 depending on union size)
- Happy path: two keywords with 2/10 same SERP URLs → NOT clustered (Jaccard ~0.11)
- Happy path: cluster containing a keyword that ranks on `siteUrl` → page mapping shows "existing page"
- Happy path: cluster with no `siteUrl` presence → page mapping shows "new page candidate"
- Happy path: `--threshold 0.4` produces larger, more inclusive clusters than default 0.6
- Error path: `keyword-universe-filtered.json` not found → error with instructions to run `keyword-universe.mjs` first
- Error path: DataforSEO SERP API returns empty results for a keyword → keyword excluded from clustering, logged
- Edge case: keyword that shares no SERP URLs with any other keyword → singleton cluster
- Edge case: 500+ keywords → pairwise comparisons = 124,750 pairs — verify performance is acceptable (should be <1s for pure JS set operations)
- Edge case: Standard queue task not ready after polling → retry with backoff, timeout after 10 minutes
- Integration: output `clusters.json` can be read by a human or piped to `content-brief.mjs` for the primary keyword of a chosen cluster

**Verification:**
- `node keyword-cluster.mjs` produces `data/seo/YYYY-MM-DD/clusters.json`
- Output JSON includes: `generated`, `threshold`, `totalKeywords`, `totalClusters`, `clusters` array
- Each cluster has: `id`, `primaryKeyword`, `keywords` (array with volume), `totalVolume`, `pageMapping` (existing URL or "new page candidate")
- Console shows top 10 clusters with primary keyword, member count, total volume, and page mapping
- Clusters are sorted by total volume descending

---

- [ ] **Unit 4: Documentation and Skill Integration**

**Goal:** Update the SEO skill documentation and `/seo-automate` command to include the new Keyword Universe pipeline.

**Requirements:** R6

**Dependencies:** Units 1-3

**Files:**
- Modify: `skills/seo/SKILL.md` (add new tools to the Tools table)
- Modify: `commands/seo-automate.md` (add DataforSEO Keyword Ideas + SERP to API table, add pipeline instructions)
- Modify: `skills/seo/Tools/.env.example` (no changes — `DATAFORSEO_AUTH` already present)
- Modify: `skills/seo/reference/automation.md` (add Keyword Universe section to the paid tier)

**Approach:**
- Add three new entries to the Tools table in `SKILL.md`: `validate-profile.mjs`, `keyword-universe.mjs`, `keyword-cluster.mjs`
- Add a "Keyword Universe Pipeline" section to `seo-automate.md` explaining the 3-step workflow
- Add pipeline usage to `automation.md` reference with cost breakdown
- Keep existing documentation intact — additive only

**Patterns to follow:**
- `skills/seo/SKILL.md` lines 57-65: existing Tools table format
- `commands/seo-automate.md` lines 14-23: API access table format

**Test expectation:** none — documentation-only changes

**Verification:**
- `SKILL.md` Tools table lists all 3 new scripts with purpose and schedule
- `seo-automate.md` includes Keyword Universe pipeline as a section with step-by-step instructions
- Cost breakdown in docs matches actual API costs ($6-8/month for 5K keywords)

## System-Wide Impact

- **Interaction graph:** New scripts are standalone — no callbacks, middleware, or hooks. They read/write JSON files in `data/seo/YYYY-MM-DD/`. The only interaction is `keyword-cluster.mjs` reading `filtered-keywords.json` produced by `keyword-universe.mjs`
- **Error propagation:** Each script fails independently with clear error messages. No cascading failures. If `keyword-universe.mjs` fails, `keyword-cluster.mjs` simply won't find its input file and will error with instructions
- **State lifecycle risks:** None — all output is immutable JSON files dated by run date. No database, no cache, no mutable state
- **API surface parity:** No changes to existing scripts. New scripts follow identical conventions
- **Unchanged invariants:** No changes to existing script code: `keyword-research.mjs` (Keywords Everywhere), `competitor-backlinks.mjs`, `gsc-report.mjs`, `content-brief.mjs`, and `backlink-outreach.mjs`. Documentation files (SKILL.md, seo-automate.md, automation.md) are updated to describe the new pipeline

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| DataforSEO Standard queue polling complexity | Start with Live queue for initial development/testing ($0.002/request). Add Standard queue support as optimization once the pipeline works end-to-end |
| Pairwise Jaccard computation O(n^2) for large keyword sets | For 500 keywords = 124,750 pairs. JS Set operations are fast (~1ms per pair). Only becomes a problem at 5,000+ keywords — add batching/sampling if needed later |
| DataforSEO API cost overrun | Business relevance filter in Unit 2 reduces keyword count before SERP fetching. Add `--max-keywords N` flag to cap SERP lookups. Print estimated cost before fetching |
| SERP results vary by location/time | Use consistent `location_code: 2840` (US) and note that clusters are point-in-time snapshots. Re-cluster monthly |
| Credential echo in error logs | `fetchWithRetry` logs HTTP error bodies which could include auth details from DataforSEO error responses. Implementation must redact Authorization header values from all logged error output before writing to disk |
| Substring matching false positives | Business relevance scoring uses string matching which can produce false positives (e.g., "data" matching "birthday data"). Use word-boundary-aware matching (`\b` regex boundaries) rather than simple `includes()`. Document as known limitation in profile example |

## Sources & References

- DataforSEO Keyword Ideas endpoint: `https://docs.dataforseo.com/v3/dataforseo_labs-google-keyword_suggestions-live/`
- DataforSEO SERP API: `https://docs.dataforseo.com/v3/serp/google/organic/live/`
- DataforSEO pricing: `https://dataforseo.com/pricing`
- Jaccard similarity: `https://en.wikipedia.org/wiki/Jaccard_index`
- Open-source reference implementation: `https://github.com/dartseoengineer/keyword-clustering`
- Tryggvi's Keyword Universe architecture: `web-analyses/2026-04-08-ecomtryggvi-2041635871443624441.md` (Obsidian vault)
