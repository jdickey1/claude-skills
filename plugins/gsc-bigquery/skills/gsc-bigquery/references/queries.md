# GSC BigQuery Query Library

Complete SQL query library for analyzing Google Search Console bulk export data in BigQuery. Replace `{DATASET}` with the user's dataset name and `{PROJECT}` with their project ID.

---

## Parameters and complete-period gate

Replace identifier placeholders with the confirmed project/dataset; identifiers cannot be query parameters. Bind `@end_date` (DATE, verified complete Pacific date), `@days` (INT64, positive; normally 28, 7 for alerts, 90 for gap research), `@baseline_days` (INT64, 60 for #20), and `@history_start` (DATE, for #16/#21). Set `@url_pattern` (STRING, SQL LIKE pattern) for #12. Thresholds in remaining SQL are explicit defaults; edit them deliberately when needed.

All daily windows contain exactly N inclusive dates: end_date minus (N - 1) through end_date. Never choose the latest row alone as proof of completeness. For comparisons validate both periods; for #9 validate all three full months; for #16 validate the entire requested history including comparison months; for #21 validate the training range. Date buckets remain America/Los_Angeles even when the report timestamp uses another timezone.

Run this gate first with `@coverage_start` and `@coverage_end` (DATE) spanning every date used by the analysis. Bind `@require_site` and `@require_url` (BOOL) for the tables read by the selected analysis; use both only when it reads both. Bind `@site_namespace` and `@url_namespace` (STRING, nullable for an unused table) to the actual native ExportLog namespace values observed for each required table, not guessed labels. Inspect ``SELECT DISTINCT namespace FROM `{PROJECT}.{DATASET}.ExportLog` `` first. `ExportLog` contains successful exports only; it has no status or row-count field. Check its native schema with #3.

```sql
ASSERT @coverage_start IS NOT NULL AND @coverage_end IS NOT NULL
  AND @coverage_start <= @coverage_end AS 'Invalid coverage dates';
ASSERT @require_site IS NOT NULL AND @require_url IS NOT NULL
  AND (@require_site OR @require_url) AS 'Select required export tables';
ASSERT (NOT @require_site OR @site_namespace IS NOT NULL)
  AND (NOT @require_url OR @url_namespace IS NOT NULL)
  AND (NOT (@require_site AND @require_url) OR @site_namespace != @url_namespace)
  AS 'Verify required native namespace mappings';
WITH expected AS (
  SELECT day, table_name, namespace
  FROM UNNEST(GENERATE_DATE_ARRAY(@coverage_start, @coverage_end)) AS day
  CROSS JOIN UNNEST([
    STRUCT('searchdata_site_impression' AS table_name, @site_namespace AS namespace, @require_site AS required),
    STRUCT('searchdata_url_impression' AS table_name, @url_namespace AS namespace, @require_url AS required)
  ])
  WHERE required
), logs AS (
  SELECT DISTINCT data_date, namespace
  FROM `{PROJECT}.{DATASET}.ExportLog`
  WHERE agenda = 'SEARCHDATA'
    AND data_date BETWEEN @coverage_start AND @coverage_end
), partitions AS (
  SELECT DISTINCT table_name, SAFE.PARSE_DATE('%Y%m%d', partition_id) AS day
  FROM `{PROJECT}.{DATASET}.INFORMATION_SCHEMA.PARTITIONS`
  WHERE table_name IN ('searchdata_site_impression', 'searchdata_url_impression')
    AND total_rows > 0
)
SELECT e.day, e.table_name,
  l.data_date IS NOT NULL AS export_logged,
  p.day IS NOT NULL AS partition_present
FROM expected e
LEFT JOIN logs l ON l.data_date = e.day AND l.namespace = e.namespace
LEFT JOIN partitions p ON p.day = e.day AND p.table_name = e.table_name
WHERE l.data_date IS NULL OR p.day IS NULL
ORDER BY e.day, e.table_name
```

Require non-null ordered coverage dates and positive day counts before execution. Zero returned rows passes the gate; otherwise report the missing dates as a **data-quality finding** and stop dependent comparisons. Do not replace missing partitions with zero traffic. For a truly empty property day, absence of a physical partition still fails this conservative gate until independently verified. After the gate passes, an absent URL within those complete site-wide periods can be assigned zero clicks, while position and CTR without impressions remain unavailable. Record namespace mapping, coverage results, end date and latest export versions/publication times in the report. Recheck coverage when rerunning after export revisions.

Source: [native table schema](https://support.google.com/webmasters/answer/12917991) and [aggregation guidelines](https://support.google.com/webmasters/answer/12917174).

## Comparable click-through-rate cohorts

Queries #6/#13 use optional same-site peer cohorts matched by position bucket, device, country and observed brand status. Bind a reviewed `@brand_regex` (STRING), `@min_peer_pages` (INT64, default 5) and `@min_peer_impressions` (INT64, default 1000). Exclude anonymized/empty queries because brand status is unknown. These illustrative sample floors are configurable, not statistical significance tests. Exclude the target URL from its own benchmark. If no reviewed brand definition or sufficient comparable peers exist, report **benchmark unavailable** and do not invent a global curve. Check intent and search appearance before interpreting gaps; position buckets alone cannot make peers equivalent. Extra clicks assume the observed peer CTR transfers and are scenarios only.

## Intent Classification Patterns

Used by query #18. Regex-based classification:

| Intent | Pattern Keywords |
|--------|-----------------|
| Informational | how, what, why, when, where, who, guide, tutorial, learn, explain, meaning, definition, example |
| Transactional | buy, price, cheap, deal, discount, order, shop, coupon, purchase, pricing, cost, free trial |
| Commercial | best, top, review, comparison, vs, versus, alternative, compared |
| Navigational | login, sign in, dashboard, account, support, contact, address, phone, hours |

## Composite Analyses

Two analyses combine multiple queries:

### Content Recommendations
Run Quick Wins (#5) + Content Gaps (#7) + Cannibalization (#10), then merge and rank into three action categories:

- **Update**: Striking distance keywords to optimize existing content for
- **Create**: Gaps supported by audience needs and a review of existing coverage
- **Investigate**: Multiple URLs; consolidate only after verifying overlapping intent and likely harm

Rank by evidence and business relevance. Extra-click calculations are optional scenarios, not forecasts or guarantees.

### Full Performance Report
Run Snapshot (#8) + Alerts (#14) + Quick Wins (#5) + Traffic Drops (#11) + Content Decay (#9) + Content Recommendations in sequence. Output as formatted markdown.

---

## General Purpose

### Query 1: Run Arbitrary SELECT

```sql
-- Only SELECT allowed. Auto-add LIMIT if missing.
-- Blocked: INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, MERGE, GRANT, REVOKE
-- Dry-run first, then set --maximum_bytes_billed to the agreed byte cap.
```

### Query 2: Cost Estimate (Dry Run)

```bash
bq query --use_legacy_sql=false --dry_run 'YOUR_SQL_HERE'
# Estimate from dry-run bytes and current region/billing-plan pricing; include storage and ML usage.
# Apply --maximum_bytes_billed=<approved_byte_cap> on execution; LIMIT does not cap scan cost.
```

### Query 3: List Tables with Schema

```sql
-- Table metadata
SELECT
  table_id AS table_name,
  CASE type WHEN 1 THEN 'BASE TABLE' WHEN 2 THEN 'VIEW' WHEN 3 THEN 'EXTERNAL' ELSE 'TABLE' END AS table_type,
  CAST(row_count AS STRING) AS row_count,
  CAST(size_bytes AS STRING) AS size_bytes,
  CAST(TIMESTAMP_MILLIS(creation_time) AS STRING) AS creation_time
FROM `{PROJECT}.{DATASET}.__TABLES__`
ORDER BY table_id
```

```sql
-- Column schema
SELECT table_name, column_name, data_type, is_nullable
FROM `{PROJECT}.{DATASET}.INFORMATION_SCHEMA.COLUMNS`
ORDER BY table_name, ordinal_position
```

### Query 4: Sample Rows

```sql
SELECT * FROM `{PROJECT}.{DATASET}.{TABLE}` LIMIT 10
```

---

## Core SEO Analysis

The Search Console application programming interface (API) supports these analyses within its row, privacy, aggregation and history limits. Bulk export supports retained daily data and SQL analysis without the API row cap; privacy restrictions still apply.

### Query 5: Quick Wins (Striking Distance Keywords)

Keywords at positions 4-15 with high impressions. Sorted by impressions; no fixed CTR uplift is assumed.

**Parameters:** days (default 28), min_impressions (default 100), max_position (default 15)

```sql
SELECT
  query,
  SUM(clicks) AS clicks,
  SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1, 1) AS avg_position,
  CAST(NULL AS FLOAT64) AS extra_clicks_scenario
FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
WHERE
  data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
  AND is_anonymized_query = false
  AND search_type = 'WEB'
GROUP BY query
HAVING
  avg_position BETWEEN 4 AND 15
  AND impressions >= 100
ORDER BY impressions DESC
LIMIT 50
```

### Query 6: CTR Opportunities (Comparable Cohorts)

Apply the cohort contract above; output is per URL/device/country/brand cohort. `total_cohorts` and `unavailable_cohorts` describe the entire result before the 50-row ranking limit. Report both counts even when unavailable rows fall outside the displayed sample; an empty result means zero cohorts. Do not infer complete benchmark coverage from the displayed rows.

```sql
WITH page_metrics AS (
  SELECT url, device, country,
    REGEXP_CONTAINS(query, @brand_regex) AS is_brand,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1 AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
    AND search_type = 'WEB' AND NOT is_anonymized_query AND NULLIF(query, '') IS NOT NULL
  GROUP BY url, device, country, is_brand
), buckets AS (
  SELECT *, CAST(FLOOR(avg_position) AS INT64) AS position_bucket FROM page_metrics
), cohort_totals AS (
  SELECT device, country, is_brand, position_bucket,
    COUNT(*) AS cohort_pages, SUM(clicks) AS cohort_clicks,
    SUM(impressions) AS cohort_impressions
  FROM buckets
  GROUP BY device, country, is_brand, position_bucket
), peers AS (
  SELECT a.*,
    CASE WHEN c.cohort_pages - 1 >= @min_peer_pages
      AND c.cohort_impressions - a.impressions >= @min_peer_impressions
      THEN SAFE_DIVIDE(c.cohort_clicks - a.clicks, c.cohort_impressions - a.impressions)
      END AS benchmark_ctr
  FROM buckets a
  LEFT JOIN cohort_totals c USING (device, country, is_brand, position_bucket)
)
SELECT *, COUNT(*) OVER () AS total_cohorts,
  COUNT(IF(benchmark_ctr IS NULL, 1, NULL)) OVER () AS unavailable_cohorts,
  SAFE_DIVIDE(clicks, impressions) AS actual_ctr,
  GREATEST(0, impressions * benchmark_ctr - clicks) AS extra_clicks_scenario,
  CASE WHEN benchmark_ctr IS NULL THEN 'benchmark unavailable'
    WHEN SAFE_DIVIDE(clicks, impressions) < benchmark_ctr THEN 'below comparable peers'
    ELSE 'at or above comparable peers' END AS verdict
FROM peers
ORDER BY extra_clicks_scenario DESC
LIMIT 50
```

### Query 7: Content Gaps

Queries with impressions beyond position 20 are research candidates. Check existing coverage, search intent and audience evidence before calling a content gap or proposing new content.

**Parameters:** days (default 90), min_impressions (default 50), min_position (default 20)

```sql
SELECT
  query,
  SUM(clicks) AS clicks,
  SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1, 1) AS avg_position,
  CAST(NULL AS FLOAT64) AS extra_clicks_scenario
FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
WHERE
  data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
  AND is_anonymized_query = false
  AND search_type = 'WEB'
GROUP BY query
HAVING avg_position >= 20 AND impressions >= 50
ORDER BY impressions DESC
LIMIT 50
```

### Query 8: Site Snapshot (Period over Period)

Overview of site performance with comparison to prior period.

**Parameters:** days (default 28)

```sql
WITH current_queries AS (
  SELECT
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1, 1) AS avg_position,
    COUNT(DISTINCT IF(NOT is_anonymized_query, NULLIF(query, ''), NULL)) AS unique_queries
  FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date AND search_type = 'WEB'
),
prior_queries AS (
  SELECT
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1, 1) AS avg_position,
    COUNT(DISTINCT IF(NOT is_anonymized_query, NULLIF(query, ''), NULL)) AS unique_queries
  FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (2 * @days - 1) DAY)
    AND DATE_SUB(@end_date, INTERVAL @days DAY)
    AND search_type = 'WEB'
),
current_pages AS (
  SELECT COUNT(DISTINCT url) AS unique_pages
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date AND search_type = 'WEB'
)
SELECT
  c.clicks AS current_clicks, p.clicks AS prior_clicks,
  c.clicks - p.clicks AS click_change,
  ROUND(SAFE_DIVIDE(c.clicks - p.clicks, p.clicks) * 100, 1) AS click_change_pct,
  c.impressions AS current_impressions, p.impressions AS prior_impressions,
  c.ctr_pct AS current_ctr, p.ctr_pct AS prior_ctr,
  c.avg_position AS current_position, p.avg_position AS prior_position,
  cp.unique_pages AS current_pages, c.unique_queries AS current_queries
FROM current_queries c CROSS JOIN prior_queries p CROSS JOIN current_pages cp
```

### Query 9: Content Decay (Latest Three Complete Months)

Three monthly totals with two consecutive decreases. This does not mean three month-over-month drops (which would require four months). Only the latest intended sequence is evaluated, one row per URL. The last month is the month containing end_date only when end_date is its last day; otherwise use the preceding month. Validate coverage from the first day of the earliest month through the last day of the last month before running. Compare #16 and business/event calendars for seasonality; label seasonality unavailable if history is insufficient. A trend is a review candidate, not proof the content caused it.

```sql
WITH bounds AS (
  SELECT IF(@end_date = LAST_DAY(@end_date), DATE_TRUNC(@end_date, MONTH),
    DATE_SUB(DATE_TRUNC(@end_date, MONTH), INTERVAL 1 MONTH)) AS last_month
), monthly AS (
  SELECT url, DATE_TRUNC(data_date, MONTH) AS month, SUM(clicks) AS clicks
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`, bounds
  WHERE data_date BETWEEN DATE_SUB(last_month, INTERVAL 2 MONTH) AND LAST_DAY(last_month)
    AND search_type = 'WEB'
  GROUP BY url, month
), complete AS (
  SELECT u.url, m AS month, COALESCE(t.clicks, 0) AS clicks
  FROM (SELECT DISTINCT url FROM monthly) u CROSS JOIN bounds
  CROSS JOIN UNNEST(GENERATE_DATE_ARRAY(DATE_SUB(last_month, INTERVAL 2 MONTH), last_month, INTERVAL 1 MONTH)) m
  LEFT JOIN monthly t ON t.url = u.url AND t.month = m
), totals AS (
  SELECT url,
    MAX(IF(month = DATE_SUB(last_month, INTERVAL 2 MONTH), clicks, NULL)) AS clicks_3_months_ago,
    MAX(IF(month = DATE_SUB(last_month, INTERVAL 1 MONTH), clicks, NULL)) AS clicks_2_months_ago,
    MAX(IF(month = last_month, clicks, NULL)) AS clicks_last_month
  FROM complete CROSS JOIN bounds GROUP BY url
)
SELECT *, SAFE_DIVIDE(clicks_last_month - clicks_3_months_ago, clicks_3_months_ago) * 100 AS total_decline_pct
FROM totals
WHERE clicks_3_months_ago >= 10 AND clicks_3_months_ago > clicks_2_months_ago
  AND clicks_2_months_ago > clicks_last_month
ORDER BY clicks_3_months_ago - clicks_last_month DESC
LIMIT 50
```

### Query 10: Keyword Cannibalization

Multiple URLs for a query are an investigation signal. Check intent, time, device, geography, canonicalization and whether the pages serve distinct needs. Do not automatically merge or consolidate.

**Parameters:** days (default 28), min_impressions (default 50)

```sql
WITH query_urls AS (
  SELECT
    query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1, 1) AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
    AND is_anonymized_query = false AND search_type = 'WEB'
  GROUP BY query, url
),
multi_url AS (
  SELECT query FROM query_urls
  GROUP BY query
  HAVING COUNT(DISTINCT url) >= 2 AND SUM(impressions) >= 50
)
SELECT qu.query, qu.url, qu.clicks, qu.impressions, qu.avg_position
FROM query_urls qu
INNER JOIN multi_url mu ON qu.query = mu.query
ORDER BY qu.query, qu.avg_position ASC
LIMIT 200
```

### Query 11: Traffic Drops with Diagnosis

Pages that lost traffic with diagnostic hypotheses. The relative CTR decline cutoff (50%) and other diagnostic cutoffs are editable screening defaults, not universal performance rules. Check mix shifts, seasonality and technical evidence before assigning causes. Prior-only URLs have zero current clicks only after the complete-period gate passes.

**Parameters:** days (default 28)

```sql
WITH current_period AS (
  SELECT url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1, 1) AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date AND search_type = 'WEB'
  GROUP BY url
),
prior_period AS (
  SELECT url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1, 1) AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (2 * @days - 1) DAY)
    AND DATE_SUB(@end_date, INTERVAL @days DAY)
    AND search_type = 'WEB'
  GROUP BY url
)
SELECT
  p.url, p.clicks AS prev_clicks, COALESCE(c.clicks, 0) AS curr_clicks,
  COALESCE(c.clicks, 0) - p.clicks AS click_change,
  ROUND(SAFE_DIVIDE(COALESCE(c.clicks, 0) - p.clicks, p.clicks) * 100, 1) AS click_change_pct,
  p.avg_position AS prev_position, c.avg_position AS curr_position,
  p.ctr_pct AS prev_ctr, c.ctr_pct AS curr_ctr,
  CASE
    WHEN c.url IS NULL THEN 'no_current_observations_in_complete_period'
    WHEN c.avg_position - p.avg_position > 3 THEN 'possible_ranking_loss'
    WHEN SAFE_DIVIDE(p.ctr_pct - c.ctr_pct, p.ctr_pct) >= 0.5 AND c.avg_position - p.avg_position <= 1 THEN 'possible_ctr_change'
    WHEN p.impressions - c.impressions > p.impressions * 0.3 AND c.avg_position - p.avg_position <= 1 THEN 'possible_demand_or_visibility_change'
    ELSE 'mixed'
  END AS diagnosis
FROM prior_period p
LEFT JOIN current_period c ON c.url = p.url
WHERE COALESCE(c.clicks, 0) < p.clicks AND p.clicks >= 5
ORDER BY (p.clicks - COALESCE(c.clicks, 0)) DESC
LIMIT 50
```

### Query 12: Topic Cluster Performance

Aggregate performance for all pages matching a URL pattern.

**Parameters:** url_pattern (required), days (default 28)

```sql
-- Summary
SELECT
  COUNT(DISTINCT url) AS page_count,
  SUM(clicks) AS total_clicks, SUM(impressions) AS total_impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS avg_ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1, 1) AS avg_position
FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
  AND url LIKE @url_pattern AND search_type = 'WEB'
```

```sql
-- Top pages in cluster
SELECT url, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1, 1) AS avg_position
FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
  AND url LIKE @url_pattern AND search_type = 'WEB'
GROUP BY url ORDER BY clicks DESC LIMIT 10
```

```sql
-- Top queries for cluster
SELECT query, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct
FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
  AND url LIKE @url_pattern AND is_anonymized_query = false AND search_type = 'WEB'
GROUP BY query ORDER BY clicks DESC LIMIT 10
```

### Query 13: CTR vs Comparable Peers with Verdicts

Run the executable SQL in Query #6 with the same parameters. Report `total_cohorts` and `unavailable_cohorts` from Query #6, retain any unavailable rows in the displayed sample, and do not sum scenarios across incompatible cohorts. The verdict is descriptive, not a significance test.

### Query 14: SEO Alerts

Position drops, CTR drops, click drops, and disappeared pages. Severity-rated.

**Parameters:** @days (default 7). Explicit default thresholds: position warning >20 places, critical >40; relative CTR decline warning >=50%, critical >=75%; click decline warning >=30%, critical >=60% with at least 5 prior clicks. CTR 10% to 5% warns, to 2.5% is critical, to 0% is critical. Zero prior CTR yields NULL, not an alert. Critical conditions always take precedence. Apply sample-size review before acting. Query-level disappearances may reflect privacy changes and are not proof of deindexing.

```sql
WITH current_period AS (
  SELECT query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr_pct,
    SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1 AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
    AND search_type = 'WEB' AND is_anonymized_query = false
  GROUP BY query, url
),
prior_period AS (
  SELECT query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr_pct,
    SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1 AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (2 * @days - 1) DAY)
    AND DATE_SUB(@end_date, INTERVAL @days DAY)
    AND search_type = 'WEB' AND is_anonymized_query = false
  GROUP BY query, url
)
SELECT c.query, c.url,
  p.clicks AS prev_clicks, c.clicks AS curr_clicks,
  p.avg_position AS prev_position, c.avg_position AS curr_position,
  ROUND(c.avg_position - p.avg_position, 1) AS position_change,
  CASE
    WHEN c.avg_position - p.avg_position > 40
      OR SAFE_DIVIDE(p.ctr_pct - c.ctr_pct, p.ctr_pct) * 100 >= 75
      OR (p.clicks >= 5 AND SAFE_DIVIDE(p.clicks - c.clicks, p.clicks) * 100 >= 60) THEN 'critical'
    WHEN c.avg_position - p.avg_position > 20
      OR SAFE_DIVIDE(p.ctr_pct - c.ctr_pct, p.ctr_pct) * 100 >= 50
      OR (p.clicks >= 5 AND SAFE_DIVIDE(p.clicks - c.clicks, p.clicks) * 100 >= 30) THEN 'warning'
    ELSE NULL
  END AS severity
FROM current_period c
INNER JOIN prior_period p ON c.query = p.query AND c.url = p.url
WHERE c.avg_position - p.avg_position > 20
  OR (SAFE_DIVIDE(p.ctr_pct - c.ctr_pct, p.ctr_pct) * 100 >= 50)
  OR (p.clicks >= 5 AND SAFE_DIVIDE(p.clicks - c.clicks, p.clicks) * 100 >= 30)
ORDER BY CASE WHEN severity = 'critical' THEN 0 ELSE 1 END, (p.clicks - c.clicks) DESC
LIMIT 100
```

```sql
-- Disappeared pages (in prior period but not current)
WITH current_period AS (
  SELECT DISTINCT query, url
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
    AND search_type = 'WEB' AND is_anonymized_query = false
),
prior_period AS (
  SELECT query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1 AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (2 * @days - 1) DAY)
    AND DATE_SUB(@end_date, INTERVAL @days DAY)
    AND search_type = 'WEB' AND is_anonymized_query = false
  GROUP BY query, url HAVING clicks >= 5
)
SELECT p.query, p.url, p.clicks AS prior_clicks, p.avg_position AS prior_position,
  CASE WHEN p.clicks >= 20 THEN 'critical' ELSE 'warning' END AS severity
FROM prior_period p
LEFT JOIN current_period c ON p.query = c.query AND p.url = c.url
WHERE c.query IS NULL
ORDER BY p.clicks DESC
LIMIT 50
```

---

## Extended Analyses

The API supports year-over-year, device and page comparisons within available history and row/privacy/aggregation limits. It has no three-dimension limit. Bulk export is useful for retained history and repeatable SQL.

### Query 15: Anonymous Traffic Analysis

Bulk export includes anonymized-row metrics through `is_anonymized_query`; it never recovers the hidden query text. Measure the share for this property and period. There is no universal anonymous percentage. Site and URL aggregation totals can differ.

**Parameters:** days (default 28)

```sql
-- Summary: anonymous vs known traffic split
SELECT
  CASE WHEN is_anonymized_query THEN 'anonymous' ELSE 'known' END AS query_type,
  SUM(clicks) AS clicks, SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  COUNT(DISTINCT url) AS unique_urls
FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date AND search_type = 'WEB'
GROUP BY 1
ORDER BY clicks DESC
```

```sql
-- Top pages receiving anonymous traffic
SELECT url,
  SUM(IF(is_anonymized_query, clicks, 0)) AS anonymous_clicks,
  SUM(IF(NOT is_anonymized_query, clicks, 0)) AS known_clicks,
  SUM(clicks) AS total_clicks,
  ROUND(SAFE_DIVIDE(SUM(IF(is_anonymized_query, clicks, 0)), SUM(clicks)) * 100, 1) AS anonymous_share_pct
FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date AND search_type = 'WEB'
GROUP BY url
HAVING total_clicks > 10
ORDER BY anonymous_clicks DESC
LIMIT 50
```

### Query 16: Year-over-Year Seasonal Analysis

Compare complete calendar months with the same month exactly one year earlier. Use retained history where available; the API can compare overlapping years within its available history. Validate coverage of both years first.

```sql
WITH monthly AS (
  SELECT
    EXTRACT(YEAR FROM data_date) AS year,
    EXTRACT(MONTH FROM data_date) AS month,
    FORMAT_DATE('%b', data_date) AS month_name,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1, 1) AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_TRUNC(@history_start, MONTH) AND @end_date AND search_type = 'WEB'
    AND LAST_DAY(data_date) <= @end_date AND DATE_TRUNC(data_date, MONTH) >= @history_start
  GROUP BY 1, 2, 3
),
with_yoy AS (
  SELECT m.*, p.clicks AS prev_year_clicks,
    SAFE_DIVIDE(m.clicks - p.clicks, p.clicks) * 100 AS yoy_change_pct
  FROM monthly m LEFT JOIN monthly p ON p.year = m.year - 1 AND p.month = m.month
)
SELECT * FROM with_yoy
ORDER BY year DESC, month DESC
```

### Query 17: Device Split (Mobile vs Desktop Cannibalization)

Finds queries where mobile and desktop rank different pages. The API also supports these dimensions, subject to its documented data limits. Different URLs alone do not establish harmful competition.

**Parameters:** days (default 28), min_clicks (default 5)

```sql
WITH device_pages AS (
  SELECT query, device, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1, 1) AS avg_position,
    ROW_NUMBER() OVER (PARTITION BY query, device ORDER BY SUM(clicks) DESC) AS rn
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
    AND is_anonymized_query = false AND search_type = 'WEB'
    AND device IN ('MOBILE', 'DESKTOP')
  GROUP BY query, device, url
)
SELECT m.query,
  m.url AS mobile_url, d.url AS desktop_url,
  m.clicks AS mobile_clicks, d.clicks AS desktop_clicks,
  m.avg_position AS mobile_position, d.avg_position AS desktop_position
FROM device_pages m
JOIN device_pages d ON m.query = d.query
WHERE m.device = 'MOBILE' AND d.device = 'DESKTOP'
  AND m.rn = 1 AND d.rn = 1 AND m.url != d.url
  AND (m.clicks >= 5 OR d.clicks >= 5)
ORDER BY (m.clicks + d.clicks) DESC
LIMIT 50
```

### Query 18: Intent Classification

Classifies all queries by search intent using regex pattern matching at scale.

**Parameters:** days (default 28)

```sql
SELECT
  CASE
    WHEN REGEXP_CONTAINS(query, r'(?i)\b(how|what|why|when|where|who|guide|tutorial|learn|explain|meaning|definition|example)\b') THEN 'informational'
    WHEN REGEXP_CONTAINS(query, r'(?i)\b(buy|price|cheap|deal|discount|order|shop|coupon|purchase|pricing|cost|free trial)\b') THEN 'transactional'
    WHEN REGEXP_CONTAINS(query, r'(?i)\b(best|top|review|comparison|vs|versus|alternative|compared)\b') THEN 'commercial'
    WHEN REGEXP_CONTAINS(query, r'(?i)\b(login|sign in|dashboard|account|support|contact|address|phone|hours)\b') THEN 'navigational'
    ELSE 'unclassified'
  END AS intent,
  COUNT(DISTINCT query) AS unique_queries,
  SUM(clicks) AS total_clicks, SUM(impressions) AS total_impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS avg_ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1, 1) AS avg_position
FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
  AND is_anonymized_query = false AND search_type = 'WEB'
GROUP BY 1
ORDER BY total_clicks DESC
```

### Query 19: N-Gram Analysis

Most common meaningful terms across your entire query set, ranked by clicks.

**Parameters:** days (default 28), min_query_count (default 5)

```sql
WITH query_data AS (
  SELECT query, SUM(clicks) AS clicks, SUM(impressions) AS impressions
  FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
    AND is_anonymized_query = false AND search_type = 'WEB'
  GROUP BY query
),
words AS (
  SELECT word,
    SUM(clicks) AS total_clicks, SUM(impressions) AS total_impressions,
    COUNT(DISTINCT query) AS query_count
  FROM query_data, UNNEST(SPLIT(LOWER(query), ' ')) AS word
  WHERE LENGTH(word) > 3
  GROUP BY word
)
SELECT word AS term, query_count AS queries_containing,
  total_clicks, total_impressions,
  ROUND(SAFE_DIVIDE(total_clicks, total_impressions) * 100, 2) AS avg_ctr_pct
FROM words
WHERE query_count >= 5
ORDER BY total_clicks DESC
LIMIT 100
```

### Query 20: New Keyword Discovery

Queries that appeared recently but were not present in the baseline period.

**Parameters:** recent_days (default 7), baseline_days (default 60), min_impressions (default 10)

```sql
WITH recent_queries AS (
  SELECT query,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1, 1) AS avg_position
  FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days - 1) DAY) AND @end_date
    AND is_anonymized_query = false AND search_type = 'WEB'
  GROUP BY query
  HAVING impressions >= 10
),
baseline_queries AS (
  SELECT DISTINCT query
  FROM `{PROJECT}.{DATASET}.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(@end_date, INTERVAL (@days + @baseline_days - 1) DAY)
    AND DATE_SUB(@end_date, INTERVAL @days DAY)
    AND is_anonymized_query = false AND search_type = 'WEB'
)
SELECT r.query, r.clicks, r.impressions, r.avg_position
FROM recent_queries r
LEFT JOIN baseline_queries b ON r.query = b.query
WHERE b.query IS NULL
ORDER BY r.impressions DESC
LIMIT 50
```

---

## BigQuery ML Queries

These use BigQuery ML for machine learning. Running them requires job permissions and permission to create models in the intended dataset. Confirm authorization before replacing an existing model. Models are created in the user's dataset.

### Query 21: Traffic Forecast (ARIMA_PLUS)

Creates an autoregressive integrated moving average (ARIMA) time-series model and forecasts daily clicks. Prefer at least six months of verified complete history and evaluate on held-out periods; history length alone does not ensure accuracy. After the coverage gate passes, the date scaffold preserves true zero-click days. Missing exports must never be interpolated or zero-filled as training data.

**Parameters:** horizon (default 30, max 365), confidence_level (default 0.95)

```sql
-- Step 1: Create/refresh model (takes 1-3 minutes)
CREATE OR REPLACE MODEL `{PROJECT}.{DATASET}.clicks_forecast_model`
OPTIONS(
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'date',
  time_series_data_col = 'total_clicks',
  auto_arima = TRUE,
  data_frequency = 'DAILY',
  decompose_time_series = TRUE
) AS
WITH daily AS (
  SELECT data_date, SUM(clicks) AS total_clicks
  FROM `{PROJECT}.{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN @history_start AND @end_date AND search_type = 'WEB'
  GROUP BY data_date
)
SELECT day AS date, COALESCE(d.total_clicks, 0) AS total_clicks
FROM UNNEST(GENERATE_DATE_ARRAY(@history_start, @end_date)) day
LEFT JOIN daily d ON d.data_date = day
ORDER BY date
```

```sql
-- Step 2: Forecast
SELECT
  forecast_timestamp AS date,
  ROUND(forecast_value, 0) AS predicted_clicks,
  ROUND(prediction_interval_lower_bound, 0) AS lower_bound,
  ROUND(prediction_interval_upper_bound, 0) AS upper_bound,
  ROUND(forecast_value - prediction_interval_lower_bound, 0) AS uncertainty_range
FROM ML.FORECAST(MODEL `{PROJECT}.{DATASET}.clicks_forecast_model`,
  STRUCT(30 AS horizon, 0.95 AS confidence_level))
ORDER BY forecast_timestamp
```

### Query 22: Anomaly Detection (ARIMA_PLUS)

Uses the same ARIMA model to detect genuinely unusual traffic patterns. Unlike threshold-based alerts, this understands seasonality and weekly patterns.

**Parameters:** anomaly_threshold (default 0.95)

```sql
-- Requires the forecast model from Query 21 to exist
SELECT *
FROM ML.DETECT_ANOMALIES(
  MODEL `{PROJECT}.{DATASET}.clicks_forecast_model`,
  STRUCT(0.95 AS anomaly_prob_threshold)
)
WHERE is_anomaly = TRUE
ORDER BY anomaly_probability DESC
LIMIT 50
```
