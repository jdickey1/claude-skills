---
description: Site performance overview with period-over-period comparison
argument-hint: [days]
---

**First**: Use the `gsc-bigquery` skill for setup, table schema, and execution methodology.

Run a site performance snapshot comparing the current period to the prior period.

## Process

1. Ask the user for their BigQuery **project ID** and **dataset name** if not already known
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/gsc-bigquery/references/queries.md` for Query #8 (Site Snapshot)
3. Execute the query via `bq query --use_legacy_sql=false --format=prettytable`
4. Present results as a formatted comparison table

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
