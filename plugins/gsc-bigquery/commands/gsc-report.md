---
description: Generate comprehensive markdown performance report from BigQuery GSC data
argument-hint: [days]
---

**First**: Use the `gsc-bigquery` skill for setup, table schema, and execution methodology.

Generate a full performance report combining all major GSC analyses.

## Process

1. Ask the user for their BigQuery **project ID** and **dataset name** if not already known
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/gsc-bigquery/references/queries.md` for all referenced queries
3. Execute these analyses in sequence:
   - Site Snapshot (Query #8)
   - SEO Alerts (Query #14)
   - Quick Wins (Query #5)
   - Traffic Drops (Query #11)
   - Content Decay (Query #9)
   - Intent Breakdown (Query #18)
   - Anonymous Traffic (Query #15)
   - New Keywords (Query #20)
4. Compile into a structured markdown report

## Parameters

- **days**: Analysis period (default: 28). Use `$ARGUMENTS` if provided.

## Output

```markdown
# GSC Performance Report
**Date:** [date]
**Period:** [days] days
**Source:** BigQuery bulk export data

## Site Snapshot
[Period-over-period comparison table]

## Alerts ([count] total: [critical] critical, [warning] warning)
[Severity-rated list]

## Quick Wins ([count] opportunities)
[Table: keyword, position, impressions, CTR, opportunity]

## Traffic Drops ([count] pages declining)
[Table: page, current, prior, change, diagnosis]

## Content Decay ([count] pages with 3-month decline)
[Table: page, 3mo ago, 2mo ago, last month, decline%]

## Search Intent Breakdown
[Table: intent category, queries, clicks, impressions, CTR]

## Anonymous Traffic
[Summary of hidden vs known traffic split]

## New Keywords
[Table: query, clicks, impressions, position]

## Recommendations
[Prioritized action items from combined analysis]
```

Save the report to a file if the user requests it.
