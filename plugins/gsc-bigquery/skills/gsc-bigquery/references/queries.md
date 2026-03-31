# GSC BigQuery Query Library

Complete SQL query library for analyzing Google Search Console bulk export data in BigQuery. Replace `{DATASET}` with the user's dataset name and `{PROJECT}` with their project ID.

---

## CTR Benchmarks

Used by queries #6 and #13. Industry averages by position:

| Position | Expected CTR |
|----------|-------------|
| 1 | 28.5% |
| 2 | 15.7% |
| 3 | 11.0% |
| 4 | 8.0% |
| 5 | 7.2% |
| 6 | 5.1% |
| 7 | 4.0% |
| 8 | 3.2% |
| 9 | 2.8% |
| 10 | 2.5% |
| 11+ | MAX(0.5%, 2.5% - (pos-10)*0.2%) |

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
- **Create**: Content gaps where no page targets the query
- **Consolidate**: Cannibalized queries where pages should be merged

Sort all by estimated opportunity (extra clicks).

### Full Performance Report
Run Snapshot (#8) + Alerts (#14) + Quick Wins (#5) + Traffic Drops (#11) + Content Decay (#9) + Content Recommendations in sequence. Output as formatted markdown.

---

## General Purpose

### Query 1: Run Arbitrary SELECT

```sql
-- Only SELECT allowed. Auto-add LIMIT if missing.
-- Blocked: INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, MERGE, GRANT, REVOKE
-- 10GB byte billing safety cap
```

### Query 2: Cost Estimate (Dry Run)

```bash
bq query --use_legacy_sql=false --dry_run 'YOUR_SQL_HERE'
# Formula: (bytes_processed / 1TB) * $6.25 = estimated cost (on-demand pricing)
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

These queries could use the GSC API, but BigQuery is faster, unsampled, and has no row limits.

### Query 5: Quick Wins (Striking Distance Keywords)

Keywords at positions 4-15 with high impressions. Sorted by traffic opportunity.

**Parameters:** days (default 28), min_impressions (default 100), max_position (default 15)

```sql
SELECT
  query,
  SUM(clicks) AS clicks,
  SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)), 1) AS avg_position,
  ROUND(SUM(impressions) * (0.11 - SAFE_DIVIDE(SUM(clicks), SUM(impressions))), 0) AS opportunity
FROM `{DATASET}.searchdata_site_impression`
WHERE
  data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
  AND is_anonymized_query = false
  AND search_type = 'WEB'
GROUP BY query
HAVING
  avg_position BETWEEN 4 AND 15
  AND impressions >= 100
ORDER BY opportunity DESC
LIMIT 50
```

### Query 6: CTR Opportunities (Below Benchmark)

Pages with high impressions but CTR below expected benchmark for their position.

**Parameters:** days (default 28), min_impressions (default 500)

```sql
WITH page_metrics AS (
  SELECT
    url,
    SUM(clicks) AS clicks,
    SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS actual_ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE
    data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
    AND search_type = 'WEB'
  GROUP BY url
  HAVING impressions >= 500 AND avg_position <= 20
),
benchmarks AS (
  SELECT *,
    CASE
      WHEN avg_position <= 1 THEN 28.5
      WHEN avg_position <= 2 THEN 15.7
      WHEN avg_position <= 3 THEN 11.0
      WHEN avg_position <= 4 THEN 8.0
      WHEN avg_position <= 5 THEN 7.2
      WHEN avg_position <= 6 THEN 5.1
      WHEN avg_position <= 7 THEN 4.0
      WHEN avg_position <= 8 THEN 3.2
      WHEN avg_position <= 9 THEN 2.8
      WHEN avg_position <= 10 THEN 2.5
      ELSE GREATEST(0.5, 2.5 - (avg_position - 10) * 0.2)
    END AS benchmark_ctr_pct
  FROM page_metrics
)
SELECT
  url, clicks, impressions, actual_ctr_pct, avg_position, benchmark_ctr_pct,
  ROUND(benchmark_ctr_pct - actual_ctr_pct, 2) AS ctr_gap_pct,
  ROUND(impressions * (benchmark_ctr_pct - actual_ctr_pct) / 100, 0) AS potential_extra_clicks
FROM benchmarks
WHERE benchmark_ctr_pct - actual_ctr_pct > 1.0
ORDER BY potential_extra_clicks DESC
LIMIT 50
```

### Query 7: Content Gaps

Queries where you get impressions but rank beyond position 20. No page properly targets these.

**Parameters:** days (default 90), min_impressions (default 50), min_position (default 20)

```sql
SELECT
  query,
  SUM(clicks) AS clicks,
  SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)), 1) AS avg_position,
  ROUND(SUM(impressions) * 0.072, 0) AS estimated_clicks_at_pos5
FROM `{DATASET}.searchdata_site_impression`
WHERE
  data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
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
    ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)), 1) AS avg_position,
    COUNT(DISTINCT query) AS unique_queries
  FROM `{DATASET}.searchdata_site_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) AND search_type = 'WEB'
),
prior_queries AS (
  SELECT
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)), 1) AS avg_position,
    COUNT(DISTINCT query) AS unique_queries
  FROM `{DATASET}.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 56 DAY)
    AND DATE_SUB(CURRENT_DATE(), INTERVAL 29 DAY)
    AND search_type = 'WEB'
),
current_pages AS (
  SELECT COUNT(DISTINCT url) AS unique_pages
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) AND search_type = 'WEB'
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

### Query 9: Content Decay (3-Month Consecutive Decline)

Pages with traffic declining for three straight months. One bad month is noise; three is a problem.

```sql
WITH monthly AS (
  SELECT
    url, DATE_TRUNC(data_date, MONTH) AS month, SUM(clicks) AS clicks
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 4 MONTH) AND search_type = 'WEB'
  GROUP BY url, month
),
ranked AS (
  SELECT url, month, clicks,
    LAG(clicks, 1) OVER (PARTITION BY url ORDER BY month) AS prev_clicks,
    LAG(clicks, 2) OVER (PARTITION BY url ORDER BY month) AS prev2_clicks
  FROM monthly
)
SELECT
  url,
  prev2_clicks AS clicks_3_months_ago,
  prev_clicks AS clicks_2_months_ago,
  clicks AS clicks_last_month,
  ROUND(SAFE_DIVIDE(clicks - prev2_clicks, prev2_clicks) * 100, 1) AS total_decline_pct
FROM ranked
WHERE prev2_clicks IS NOT NULL AND prev_clicks IS NOT NULL
  AND clicks < prev_clicks AND prev_clicks < prev2_clicks AND prev2_clicks >= 10
ORDER BY (prev2_clicks - clicks) DESC
LIMIT 50
```

### Query 10: Keyword Cannibalization

Multiple pages competing for the same query.

**Parameters:** days (default 28), min_impressions (default 50)

```sql
WITH query_urls AS (
  SELECT
    query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
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

Pages that lost traffic with automated diagnosis: ranking loss, CTR collapse, or demand decline.

**Parameters:** days (default 28)

```sql
WITH current_period AS (
  SELECT url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) AND search_type = 'WEB'
  GROUP BY url
),
prior_period AS (
  SELECT url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 56 DAY)
    AND DATE_SUB(CURRENT_DATE(), INTERVAL 29 DAY)
    AND search_type = 'WEB'
  GROUP BY url
)
SELECT
  c.url, p.clicks AS prev_clicks, c.clicks AS curr_clicks,
  c.clicks - p.clicks AS click_change,
  ROUND(SAFE_DIVIDE(c.clicks - p.clicks, p.clicks) * 100, 1) AS click_change_pct,
  p.avg_position AS prev_position, c.avg_position AS curr_position,
  p.ctr_pct AS prev_ctr, c.ctr_pct AS curr_ctr,
  CASE
    WHEN c.avg_position - p.avg_position > 3 THEN 'ranking_loss'
    WHEN p.ctr_pct - c.ctr_pct > 2 AND c.avg_position - p.avg_position <= 1 THEN 'ctr_collapse'
    WHEN p.impressions - c.impressions > p.impressions * 0.3 AND c.avg_position - p.avg_position <= 1 THEN 'demand_decline'
    ELSE 'mixed'
  END AS diagnosis
FROM current_period c
INNER JOIN prior_period p ON c.url = p.url
WHERE c.clicks < p.clicks AND p.clicks >= 5
ORDER BY (p.clicks - c.clicks) DESC
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
  ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
FROM `{DATASET}.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
  AND url LIKE '%{URL_PATTERN}%' AND search_type = 'WEB'
```

```sql
-- Top pages in cluster
SELECT url, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
FROM `{DATASET}.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
  AND url LIKE '%{URL_PATTERN}%' AND search_type = 'WEB'
GROUP BY url ORDER BY clicks DESC LIMIT 10
```

```sql
-- Top queries for cluster
SELECT query, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct
FROM `{DATASET}.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
  AND url LIKE '%{URL_PATTERN}%' AND is_anonymized_query = false AND search_type = 'WEB'
GROUP BY query ORDER BY clicks DESC LIMIT 10
```

### Query 13: CTR vs Benchmark with Verdicts

**Parameters:** days (default 28), min_impressions (default 200)

```sql
WITH page_metrics AS (
  SELECT url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS actual_ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) AND search_type = 'WEB'
  GROUP BY url
  HAVING impressions >= 200 AND avg_position <= 20
),
with_benchmark AS (
  SELECT *,
    CASE
      WHEN avg_position <= 1 THEN 28.5  WHEN avg_position <= 2 THEN 15.7
      WHEN avg_position <= 3 THEN 11.0  WHEN avg_position <= 4 THEN 8.0
      WHEN avg_position <= 5 THEN 7.2   WHEN avg_position <= 6 THEN 5.1
      WHEN avg_position <= 7 THEN 4.0   WHEN avg_position <= 8 THEN 3.2
      WHEN avg_position <= 9 THEN 2.8   WHEN avg_position <= 10 THEN 2.5
      ELSE GREATEST(0.5, 2.5 - (avg_position - 10) * 0.2)
    END AS benchmark_ctr_pct
  FROM page_metrics
)
SELECT url, clicks, impressions, actual_ctr_pct, avg_position, benchmark_ctr_pct,
  ROUND(actual_ctr_pct - benchmark_ctr_pct, 2) AS gap_pct,
  CASE
    WHEN actual_ctr_pct - benchmark_ctr_pct >= 2.0 THEN 'Above benchmark'
    WHEN actual_ctr_pct - benchmark_ctr_pct >= -2.0 THEN 'At benchmark'
    WHEN actual_ctr_pct - benchmark_ctr_pct >= -5.0 THEN 'Below benchmark'
    ELSE 'Significantly below benchmark'
  END AS verdict
FROM with_benchmark
ORDER BY gap_pct ASC
LIMIT 50
```

### Query 14: SEO Alerts

Position drops, CTR drops, click drops, and disappeared pages. Severity-rated.

**Parameters:** days (default 7), position_drop_threshold (default 20), ctr_drop_pct (default 50), click_drop_pct (default 30)

```sql
WITH current_period AS (
  SELECT query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    AND search_type = 'WEB' AND is_anonymized_query = false
  GROUP BY query, url
),
prior_period AS (
  SELECT query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
    AND DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
    AND search_type = 'WEB' AND is_anonymized_query = false
  GROUP BY query, url
)
SELECT c.query, c.url,
  p.clicks AS prev_clicks, c.clicks AS curr_clicks,
  p.avg_position AS prev_position, c.avg_position AS curr_position,
  ROUND(c.avg_position - p.avg_position, 1) AS position_change,
  CASE
    WHEN c.avg_position - p.avg_position > 40 THEN 'critical'
    WHEN c.avg_position - p.avg_position > 20 THEN 'warning'
    WHEN p.ctr_pct > 0 AND (p.ctr_pct - c.ctr_pct) / p.ctr_pct * 100 > 100 THEN 'critical'
    WHEN p.ctr_pct > 0 AND (p.ctr_pct - c.ctr_pct) / p.ctr_pct * 100 > 50 THEN 'warning'
    WHEN p.clicks >= 5 AND (p.clicks - c.clicks) / p.clicks * 100 > 60 THEN 'critical'
    WHEN p.clicks >= 5 AND (p.clicks - c.clicks) / p.clicks * 100 > 30 THEN 'warning'
    ELSE NULL
  END AS severity
FROM current_period c
INNER JOIN prior_period p ON c.query = p.query AND c.url = p.url
WHERE c.avg_position - p.avg_position > 20
  OR (p.ctr_pct > 0 AND (p.ctr_pct - c.ctr_pct) / p.ctr_pct * 100 > 50)
  OR (p.clicks >= 5 AND (p.clicks - c.clicks) / p.clicks * 100 > 30)
ORDER BY CASE WHEN severity = 'critical' THEN 0 ELSE 1 END, (p.clicks - c.clicks) DESC
LIMIT 100
```

```sql
-- Disappeared pages (in prior period but not current)
WITH current_period AS (
  SELECT DISTINCT query, url
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    AND search_type = 'WEB' AND is_anonymized_query = false
),
prior_period AS (
  SELECT query, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
    AND DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
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

## BigQuery-Exclusive Queries

These use data or capabilities only available through BigQuery bulk export. Impossible via GSC API.

### Query 15: Anonymous Traffic Analysis

The GSC API hides ~46% of clicks as "anonymous queries." BigQuery has them via `is_anonymized_query`.

**Parameters:** days (default 28)

```sql
-- Summary: anonymous vs known traffic split
SELECT
  CASE WHEN is_anonymized_query THEN 'anonymous' ELSE 'known' END AS query_type,
  SUM(clicks) AS clicks, SUM(impressions) AS impressions,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
  COUNT(DISTINCT url) AS unique_urls
FROM `{DATASET}.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) AND search_type = 'WEB'
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
FROM `{DATASET}.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) AND search_type = 'WEB'
GROUP BY url
HAVING total_clicks > 10
ORDER BY anonymous_clicks DESC
LIMIT 50
```

### Query 16: Year-over-Year Seasonal Analysis

Requires 12+ months of data. The GSC API's 16-month rolling window makes reliable YoY comparison impossible.

```sql
WITH monthly AS (
  SELECT
    EXTRACT(YEAR FROM data_date) AS year,
    EXTRACT(MONTH FROM data_date) AS month,
    FORMAT_DATE('%b', data_date) AS month_name,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_url_impression`
  WHERE search_type = 'WEB'
  GROUP BY 1, 2, 3
),
with_yoy AS (
  SELECT m.*,
    LAG(clicks) OVER (PARTITION BY month ORDER BY year) AS prev_year_clicks,
    ROUND(SAFE_DIVIDE(
      clicks - LAG(clicks) OVER (PARTITION BY month ORDER BY year),
      LAG(clicks) OVER (PARTITION BY month ORDER BY year)
    ) * 100, 1) AS yoy_change_pct
  FROM monthly m
)
SELECT * FROM with_yoy
ORDER BY year DESC, month DESC
```

### Query 17: Device Split (Mobile vs Desktop Cannibalization)

Finds queries where mobile and desktop rank different pages. Invisible in the GSC UI and impossible via API's 3-dimension limit.

**Parameters:** days (default 28), min_clicks (default 5)

```sql
WITH device_pages AS (
  SELECT query, device, url,
    SUM(clicks) AS clicks, SUM(impressions) AS impressions,
    ROUND(SAFE_DIVIDE(SUM(sum_position), SUM(impressions)), 1) AS avg_position,
    ROW_NUMBER() OVER (PARTITION BY query, device ORDER BY SUM(clicks) DESC) AS rn
  FROM `{DATASET}.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
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
  ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)), 1) AS avg_position
FROM `{DATASET}.searchdata_site_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
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
  FROM `{DATASET}.searchdata_site_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
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
    ROUND(SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)), 1) AS avg_position
  FROM `{DATASET}.searchdata_site_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    AND is_anonymized_query = false AND search_type = 'WEB'
  GROUP BY query
  HAVING impressions >= 10
),
baseline_queries AS (
  SELECT DISTINCT query
  FROM `{DATASET}.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 67 DAY)
    AND DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
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

These use BigQuery ML for machine learning. Service account needs "BigQuery Data Editor" role. Models are created in the user's dataset.

### Query 21: Traffic Forecast (ARIMA_PLUS)

Creates an ARIMA time-series model and forecasts daily clicks. Requires 6+ months of historical data for good results.

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
SELECT data_date AS date, SUM(clicks) AS total_clicks
FROM `{DATASET}.searchdata_url_impression`
WHERE search_type = 'WEB'
GROUP BY 1
HAVING total_clicks > 0
ORDER BY 1
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
