---
name: gsc-bigquery
description: Use when analyzing Google Search Console data, SEO performance metrics, organic search traffic, keyword rankings, content decay, cannibalization, anonymous queries, search intent classification, or traffic forecasting via BigQuery bulk exports. Also use when user mentions GSC, Search Console, BigQuery SEO, or bq CLI for search data.
---

# GSC BigQuery Analysis

Analyze Google Search Console (GSC) data through BigQuery bulk exports using the `bq` command-line interface. Read `references/queries.md` for the mandatory coverage gate, parameters and executable SQL.

## Step 0: Validate Before Proceeding

Confirm the Google Cloud project target and auth state before running any query. A wrong project or
expired credentials produces misleading data or cryptic errors that are much faster
to catch upfront than mid-analysis.

- **Confirm the Google Cloud project ID and dataset name.** If the user hasn't specified both,
  ask. Running queries against the wrong project returns either permission errors or
  data from an unrelated property; both waste time and erode trust in the results.
- **Verify `gcloud` auth is active and the dataset exists.** Run
  `bq ls --project_id=<project_id>` before any query. An auth failure here gives a
  clear error; the same failure inside a complex ML query is harder to diagnose.

## Prerequisites

1. `bq` CLI available (comes with `gcloud` SDK)
2. GSC bulk export enabled to BigQuery. Export starts prospectively, with no historical backfill. BigQuery storage, queries and machine learning can incur costs.
3. Auth configured (`gcloud auth application-default login` or service account)
4. Machine learning (ML) queries require job permissions and permission to create models in the intended dataset. Confirm authorization before replacing an existing model.

Use the confirmed **project ID** and **dataset name** from context; ask only if unknown. The export default dataset name is `searchconsole`.

## Table Schema

| Table | Level | Key Columns |
|-------|-------|------------|
| `searchdata_url_impression` | Page | data_date, url, query, clicks, impressions, sum_position, device, is_anonymized_query, search_type |
| `searchdata_site_impression` | Site | data_date, query, clicks, impressions, sum_top_position, is_anonymized_query, search_type |

Use `SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1` for URL average position and `SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1` for site average position. These native sums are zero-based. Never add 1 to an already computed API position. Aggregate duplicate keys. Filter `search_type = 'WEB'` unless another search type is requested. Anonymized rows provide metrics, never hidden query text; measure their share for this property. Site and URL aggregation totals can differ.

Native `data_date` buckets are Pacific time (America/Los_Angeles). Before each analysis, run the ExportLog and physical partition gate in `references/queries.md` for every required date and table. Bind a verified complete `@end_date`; use exactly N inclusive dates and equally long adjacent comparison periods. Missing dates are a data-quality finding, not zero traffic or a confident drop. Never infer completeness from MAX(data_date) alone. Inspect the native namespace values and schema rather than inventing export status fields.

Official references: [table schema](https://support.google.com/webmasters/answer/12917991), [query guidelines](https://support.google.com/webmasters/answer/12917174).

## Running Queries

```bash
bq query --use_legacy_sql=false --dry_run \
  --parameter=end_date:DATE:<verified_date> --parameter=days:INT64:28 'SQL_HERE'
bq query --use_legacy_sql=false --maximum_bytes_billed=<approved_byte_cap> \
  --parameter=end_date:DATE:<verified_date> --parameter=days:INT64:28 \
  --format=prettytable --max_rows=100 'SQL_HERE'
# Use --format=json for programmatic output
# Use --synchronous_mode=true for ML queries (CREATE MODEL)
```

Bind every parameter used by the chosen query on both dry run and execution. Estimate current usage from dry-run bytes and current region/billing-plan rates, plus storage/ML usage; do not promise fixed prices or free operation. `LIMIT` restricts output, not scanned bytes. Keep queries read-only except explicitly authorized model creation/replacement. Verify identifiers from existing context; ask only if the project/dataset cannot be established.

The Search Console application programming interface (API) can perform year, device and page comparisons within row, privacy, aggregation and history limits. It has no three-dimension limit. BigQuery helps with retained history and repeatable analysis; do not call API-supported analyses exclusive.

## Commands

| Command | What it does |
|---------|-------------|
| `/gsc-snapshot` | Site performance overview with period-over-period comparison |
| `/gsc-audit` | Full SEO health check: alerts, quick wins, decay, drops, recommendations |
| `/gsc-report` | Comprehensive markdown performance report |

## Quick Reference

Read `references/queries.md` for full SQL. It also contains optional comparable click-through-rate (CTR) cohorts, intent patterns, and composite analyses. Missing comparable data means benchmark unavailable. Extra clicks are scenarios, not guarantees. Multiple URLs are an investigation signal, not an automatic consolidation instruction. Rank alone does not prove a content gap; require audience evidence and inspect existing coverage.

| Analysis | Use When | Query # |
|----------|----------|---------|
| Site snapshot | "How's our search traffic?" | #8 |
| Quick wins | "What keywords are close to page 1?" | #5 |
| Content decay | "Which pages are losing traffic?" | #9 |
| Cannibalization | "Are our pages competing?" | #10 |
| Traffic drops | "Why did traffic drop?" | #11 |
| Anonymous traffic | "What share has anonymized query text?" | #15 |
| Intent breakdown | "What types of queries drive traffic?" | #18 |
| New keywords | "What new queries are we ranking for?" | #20 |
| Forecast | "What will traffic look like next month?" | #21 |
| Anomalies | "Any unusual traffic patterns?" | #22 |

## Common Mistakes

- Forgetting the +1 after dividing native position sums by impressions
- Using site-level table when you need page-level data (or vice versa)
- Not filtering `search_type = 'WEB'`
- Running models without appropriate permissions or a verified complete training range

## Attribution

SQL queries adapted from [Suganthan's BigQuery MCP Server](https://github.com/Suganthan-Mohanadasan/Suganthans-BigQuery-MCP-Server) (Apache 2.0).

## Learning

Append to `.learnings.jsonl`: `{"timestamp": "ISO-8601", "skill": "gsc-bigquery", "event_type": "edge_case|user_correction", "context": "what happened"}`. Track: query frequency, parameter adjustments, uncovered analysis needs.
