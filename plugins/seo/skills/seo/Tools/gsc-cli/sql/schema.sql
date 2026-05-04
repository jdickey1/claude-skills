-- gsc-cli schema for seo_db
-- Apply: ssh seo 'psql seo_db' < schema.sql
-- Idempotent: safe to re-run.

create table if not exists sites (
  site_url        text primary key,           -- 'sc-domain:jdkey.com' or 'https://example.com/'
  display_name    text not null,
  primary_domain  text not null,              -- canonical apex (e.g. 'jdkey.com')
  digest_email    text,                       -- recipient for weekly Brevo digest draft
  active          boolean not null default true,
  added_at        timestamptz not null default now()
);

-- gsc_perf is partitioned by site_url for query speed and clean per-site drops.
-- Each new site gets a partition created in commands/pull.mjs (or via migration).
create table if not exists gsc_perf (
  site_url        text not null references sites(site_url) on delete cascade,
  date            date not null,
  query           text not null default '',   -- '' when query dim not requested
  page            text not null default '',
  country         text not null default '',
  device          text not null default '',
  search_type     text not null default 'web',
  clicks          int  not null default 0,
  impressions     int  not null default 0,
  ctr             numeric(8,6),
  position        numeric(7,3),
  pulled_at       timestamptz not null default now(),
  primary key (site_url, date, query, page, country, device, search_type)
) partition by list (site_url);

create index if not exists gsc_perf_site_date_idx on gsc_perf (site_url, date desc);
create index if not exists gsc_perf_query_idx     on gsc_perf (site_url, query) where query <> '';
create index if not exists gsc_perf_page_idx      on gsc_perf (site_url, page)  where page  <> '';

create table if not exists gsc_inspections (
  site_url            text not null references sites(site_url) on delete cascade,
  url                 text not null,
  inspected_at        timestamptz not null,
  index_status        text,                   -- e.g. 'PASS', 'PARTIAL', 'FAIL', 'NEUTRAL'
  coverage_state      text,                   -- e.g. 'Submitted and indexed'
  last_crawl          timestamptz,
  page_fetch_state    text,
  robots_txt_state    text,
  indexing_state      text,
  user_canonical      text,
  google_canonical    text,
  raw                 jsonb not null,
  primary key (site_url, url, inspected_at)
);

create index if not exists gsc_inspections_url_idx on gsc_inspections (site_url, url);

create table if not exists gsc_sitemap_log (
  id              bigserial primary key,
  site_url        text not null references sites(site_url) on delete cascade,
  feedpath        text not null,
  action          text not null,              -- 'submit', 'delete', 'list', 'pull'
  status          text not null,              -- 'success', 'error'
  detail          jsonb,
  performed_at    timestamptz not null default now()
);

create index if not exists gsc_sitemap_log_site_idx on gsc_sitemap_log (site_url, performed_at desc);

-- Run-level audit: one row per cron invocation of pull/inspect/digest.
create table if not exists gsc_run_log (
  id              bigserial primary key,
  command         text not null,              -- 'pull', 'inspect', 'digest'
  site_url        text references sites(site_url) on delete set null,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  rows_written    int,
  status          text,                       -- 'success', 'error', 'partial'
  detail          jsonb
);

create index if not exists gsc_run_log_started_idx on gsc_run_log (started_at desc);
