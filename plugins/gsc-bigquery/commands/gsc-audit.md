---
description: Full SEO health check from BigQuery GSC data
argument-hint: [days]
---

**First**: Use the `gsc-bigquery` skill for setup, table schema, and execution methodology.

Run a comprehensive SEO health check using BigQuery GSC bulk export data.

## Process

1. Ask the user for their BigQuery **project ID** and **dataset name** if not already known
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/gsc-bigquery/references/queries.md` for all referenced queries
3. Run the query-library complete-period gate using native ExportLog plus physical partitions for every date/table needed. Bind the verified complete `@end_date` (Pacific buckets) and positive `@days`. Include prior periods and full monthly/history ranges where used. Missing coverage stops dependent comparisons and becomes a data-quality finding. Dry-run each query, estimate current usage and execute with `--maximum_bytes_billed`.
4. Execute these analyses in sequence:
   - **Alerts** (Query #14): Position drops, CTR drops, click drops, disappeared pages
   - **Quick Wins** (Query #5): Striking distance keywords
   - **Content Decay** (Query #9): Pages with decreases across the latest three complete calendar months
   - **Cannibalization** (Query #10): Multiple-URL investigation candidates
   - **Traffic Drops** (Query #11): Pages losing traffic with diagnostic hypotheses
   - **Anonymous Traffic** (Query #15): Anonymized-row metrics; hidden query text is not recovered
5. Generate content recommendations by combining quick wins, content gaps, and cannibalization data
6. Present findings organized by severity and opportunity

## Parameters

- **days**: Analysis period (default: 28). Use `$ARGUMENTS` if provided.

## Output

Structure the audit as:

```markdown
# GSC Health Check — [date]

## Alerts (Critical First)
[Severity-rated alerts from Query #14]

## Quick Wins
[Top striking distance keywords from Query #5]

## Content Issues
### Decaying Pages
[From Query #9]
### Multiple-URL Investigation
[From Query #10]
### Traffic Drops
[From Query #11 with diagnostic hypotheses]

## Anonymized-Query Metrics
[Anonymous traffic summary from Query #15]

## Recommendations
### Update (optimize existing content)
### Create (new content for gaps)
### Investigate (verify overlapping intent and harm before consolidation)
```

Report the exact inclusive dates, Pacific data buckets, table aggregation, filters and coverage evidence. Use equal adjacent periods; report percent change as unavailable when the prior baseline is zero. Review seasonality before attributing declines. Use comparable site cohorts only where sufficient; otherwise mark benchmark unavailable. Label extra clicks as scenarios. Require audience evidence for content gaps and inspect intent before consolidation. Anonymous metrics do not reveal queries.
