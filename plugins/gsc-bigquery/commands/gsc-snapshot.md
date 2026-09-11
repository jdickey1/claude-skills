---
description: Site performance overview with period-over-period comparison
argument-hint: [days]
---

**First**: Use the `gsc-bigquery` skill for setup, table schema, and execution methodology.

Run a site performance snapshot comparing the current period to the prior period.

## Process

1. Ask the user for their BigQuery **project ID** and **dataset name** if not already known
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/gsc-bigquery/references/queries.md` for Query #8 (Site Snapshot)
3. Run the query-library complete-period gate using native ExportLog plus physical partitions for every date/table needed. Bind the verified complete `@end_date` (Pacific buckets) and positive `@days`. Include prior periods and full monthly/history ranges where used. Missing coverage stops dependent comparisons and becomes a data-quality finding. Dry-run each query, estimate current usage and execute with `--maximum_bytes_billed`.
4. Execute Query #8 using the skill’s parameter binding and byte cap
5. Present results as a formatted comparison table

## Parameters

- **days**: Number of days per period (default: 28). Use `$ARGUMENTS` if provided.

## Output

Format as a clean markdown table:

```
| Metric      | Current | Prior  | Change  |
|-------------|---------|--------|---------|
| Clicks      | X       | Y      | +/-Z%   |
| Impressions | X       | Y      | +/-Z%   |
| CTR         | X%      | Y%     | +/-Z    |
| Position    | X       | Y      | +/-Z    |
```

Include unique pages and unique queries counts below the table.

Report the exact inclusive dates, Pacific data buckets, table aggregation, filters and coverage evidence. Use equal adjacent periods; report percent change as unavailable when the prior baseline is zero. Review seasonality before attributing declines. Use comparable site cohorts only where sufficient; otherwise mark benchmark unavailable. Label extra clicks as scenarios. Require audience evidence for content gaps and inspect intent before consolidation. Anonymous metrics do not reveal queries.
