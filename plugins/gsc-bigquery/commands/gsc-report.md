---
description: Generate comprehensive markdown performance report from BigQuery GSC data
argument-hint: [days]
---

**First**: Use the `gsc-bigquery` skill for setup, table schema, and execution methodology.

Generate a full performance report combining all major GSC analyses.

## Process

1. Ask the user for their BigQuery **project ID** and **dataset name** if not already known
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/gsc-bigquery/references/queries.md` for all referenced queries
3. Run the query-library complete-period gate using native ExportLog plus physical partitions for every date/table needed. Bind the verified complete `@end_date` (Pacific buckets) and positive `@days`. Include prior periods and full monthly/history ranges where used. Missing coverage stops dependent comparisons and becomes a data-quality finding. Dry-run each query, estimate current usage and execute with `--maximum_bytes_billed`.
4. Execute these analyses in sequence:
   - Site Snapshot (Query #8)
   - SEO Alerts (Query #14)
   - Quick Wins (Query #5)
   - Traffic Drops (Query #11)
   - Content Decay (Query #9)
   - Intent Breakdown (Query #18)
   - Anonymous Traffic (Query #15)
   - New Keywords (Query #20)
5. Compile into a structured markdown report

## Parameters

- **days**: Analysis period (default: 28). Use `$ARGUMENTS` if provided.

## Output

```markdown
# GSC Performance Report
**Date:** [date]
**Period:** [inclusive start through verified complete end_date, Pacific dates]
**Coverage:** [required ranges, native namespaces, partition/export checks, revisions, missing dates]
**Comparability:** [seasonality, cohort availability, API/export limitations]
**Source:** BigQuery bulk export data

## Site Snapshot
[Period-over-period comparison table]

## Alerts ([count] total: [critical] critical, [warning] warning)
[Severity-rated list]

## Quick Wins ([count] opportunities)
[Table: keyword, position, impressions, CTR, opportunity]

## Traffic Drops ([count] pages declining)
[Table: page, current, prior, change, diagnosis]

## Content Decay ([count] pages with declines across three complete months)
[Table: page, 3mo ago, 2mo ago, last month, decline%]

## Search Intent Breakdown
[Table: intent category, queries, clicks, impressions, CTR]

## Anonymous Traffic
[Measured anonymous vs known metrics for this property and period]

## New Keywords
[Table: query, clicks, impressions, position]

## Recommendations
[Prioritized action items from combined analysis]
```

Save the report to a file if the user requests it.

Report the exact inclusive dates, Pacific data buckets, table aggregation, filters and coverage evidence. Use equal adjacent periods; report percent change as unavailable when the prior baseline is zero. Review seasonality before attributing declines. Use comparable site cohorts only where sufficient; otherwise mark benchmark unavailable. Label extra clicks as scenarios. Require audience evidence for content gaps and inspect intent before consolidation. Anonymous metrics do not reveal queries.
