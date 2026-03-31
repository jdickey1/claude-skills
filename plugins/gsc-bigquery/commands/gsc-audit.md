---
description: Full SEO health check from BigQuery GSC data
argument-hint: [days]
---

**First**: Use the `gsc-bigquery` skill for setup, table schema, and execution methodology.

Run a comprehensive SEO health check using BigQuery GSC bulk export data.

## Process

1. Ask the user for their BigQuery **project ID** and **dataset name** if not already known
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/gsc-bigquery/references/queries.md` for all referenced queries
3. Execute these analyses in sequence:
   - **Alerts** (Query #14): Position drops, CTR drops, click drops, disappeared pages
   - **Quick Wins** (Query #5): Striking distance keywords
   - **Content Decay** (Query #9): Pages with 3-month consecutive decline
   - **Cannibalization** (Query #10): Pages competing for same queries
   - **Traffic Drops** (Query #11): Pages losing traffic with diagnosis
   - **Anonymous Traffic** (Query #15): Hidden traffic the API misses
4. Generate content recommendations by combining quick wins, content gaps, and cannibalization data
5. Present findings organized by severity and opportunity

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
### Cannibalized Keywords
[From Query #10]
### Traffic Drops
[From Query #11 with diagnosis]

## Hidden Traffic
[Anonymous traffic summary from Query #15]

## Recommendations
### Update (optimize existing content)
### Create (new content for gaps)
### Consolidate (merge competing pages)
```
