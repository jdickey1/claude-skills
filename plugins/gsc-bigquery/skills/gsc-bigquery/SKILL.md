---
name: gsc-bigquery
description: Use when analyzing Google Search Console data, SEO performance metrics, organic search traffic, keyword rankings, content decay, cannibalization, anonymous queries, search intent classification, or traffic forecasting via BigQuery bulk exports. Also use when user mentions GSC, Search Console, BigQuery SEO, or bq CLI for search data.
---

# GSC BigQuery Analysis

Analyze GSC data through BigQuery bulk exports using `bq` CLI. Replaces a 26-tool MCP server with direct SQL execution.

## Prerequisites

1. `bq` CLI available (comes with `gcloud` SDK)
2. GSC bulk export enabled to BigQuery (free, 48-72hr backfill)
3. Auth configured (`gcloud auth application-default login` or service account)
4. ML queries need "BigQuery Data Editor" role

Ask the user for **project ID** and **dataset name** (default: `searchconsole`).

## Table Schema

| Table | Level | Key Columns |
|-------|-------|------------|
| `searchdata_url_impression` | Page | data_date, url, query, clicks, impressions, sum_position, device, is_anonymized_query, search_type |
| `searchdata_site_impression` | Site | data_date, query, clicks, impressions, sum_top_position, is_anonymized_query, search_type |

Divide `sum_position`/`sum_top_position` by impressions for avg position. Filter `search_type = 'WEB'` unless analyzing images/video/news. The `is_anonymized_query` flag covers ~46% of clicks the API hides.

## Running Queries

```bash
bq query --use_legacy_sql=false --format=prettytable --max_rows=100 'SQL_HERE'
# Use --format=json for programmatic output
# Use --synchronous_mode=true for ML queries (CREATE MODEL)
```

Only SELECT (plus CREATE OR REPLACE MODEL for ML). Always include LIMIT.

## Commands

| Command | What it does |
|---------|-------------|
| `/gsc-snapshot` | Site performance overview with period-over-period comparison |
| `/gsc-audit` | Full SEO health check: alerts, quick wins, decay, drops, recommendations |
| `/gsc-report` | Comprehensive markdown performance report |

## Quick Reference

Read `references/queries.md` for full SQL. It also contains CTR benchmarks, intent classification patterns, and composite analysis logic.

| Analysis | Use When | Query # |
|----------|----------|---------|
| Site snapshot | "How's our search traffic?" | #8 |
| Quick wins | "What keywords are close to page 1?" | #5 |
| Content decay | "Which pages are losing traffic?" | #9 |
| Cannibalization | "Are our pages competing?" | #10 |
| Traffic drops | "Why did traffic drop?" | #11 |
| Anonymous traffic | "How much traffic is the API hiding?" | #15 |
| Intent breakdown | "What types of queries drive traffic?" | #18 |
| New keywords | "What new queries are we ranking for?" | #20 |
| Forecast | "What will traffic look like next month?" | #21 |
| Anomalies | "Any unusual traffic patterns?" | #22 |

## Common Mistakes

- Forgetting to divide sum_position by impressions for avg position
- Using site-level table when you need page-level data (or vice versa)
- Not filtering `search_type = 'WEB'`
- Running ML queries without Data Editor role

## Attribution

SQL queries adapted from [Suganthan's BigQuery MCP Server](https://github.com/Suganthan-Mohanadasan/Suganthans-BigQuery-MCP-Server) (Apache 2.0).

## Learning

Append to `.learnings.jsonl`: `{"timestamp": "ISO-8601", "skill": "gsc-bigquery", "event_type": "edge_case|user_correction", "context": "what happened"}`. Track: query frequency, parameter adjustments, uncovered analysis needs.
