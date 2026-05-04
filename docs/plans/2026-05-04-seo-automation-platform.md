# SEO Automation Platform — gsc-cli + seo_db

**Date:** 2026-05-04
**Status:** Phases 0–3 shipped + VPS user/DB infra shipped. dlg DNS cutover complete (2026-05-04 ~14:11 PT). Phase 4 (`gsc inspect`) up next, but blocked-by-data-quality: wait ~7 days post-cutover before re-mining.
**Code:** `~/Projects/claude-skills/plugins/seo/skills/seo/Tools/gsc-cli/`
**VPS user:** `seo` (uid 1039) on serveroptima
**Database:** `seo_db` (peer auth, owner `seo`)

---

## Goal

Replace the manual GSC workflow (downloading 7 CSVs, hand-submitting sitemaps, no historical store) with a CLI-driven multi-site automation platform that:

1. Authenticates once via OAuth and runs unattended
2. Pulls weekly Search Console performance and URL Inspection data into a shared postgres DB
3. Submits sitemaps and tracks their state across the portfolio
4. Generates per-site weekly digests as Brevo email drafts (drafts only — global rule)
5. Runs from a Mac mini LaunchAgent on Mondays at 7am CT

This is the **live operations** layer. The complementary `gsc-bigquery` plugin handles historical BigQuery export analysis. They do not overlap.

---

## Architecture

```
Mac mini LaunchAgent (Mon 7am CT)
        │
        ▼
   gsc CLI (Node, ESM)
        │
        ├─ OAuth2 PKCE — ~/.config/gsc-cli/credentials.json
        │
        ├─ GSC API: sites, sitemaps, searchAnalytics, URL Inspection
        ├─ Indexing API: best-effort, JobPosting/BroadcastEvent only
        │
        └─ writes to →  ssh seo@serveroptima → seo_db (peer auth)
                                 │
                                 ├─ sites
                                 ├─ gsc_perf (partitioned by site)
                                 ├─ gsc_inspections
                                 └─ gsc_sitemap_log
```

**Why a separate `seo` Linux user / DB:** Project isolation per the VPS Web Projects standard. Even though this is a CLI not a web app, the data store is shared infrastructure that other tools (Brevo digest, future dashboards) will read. Keeping it under a dedicated user prevents cross-project credential leaks and matches the rest of the portfolio.

---

## Phase Status

### Phase 0 — OAuth + Bootstrap (DONE 2026-05-04)
- GCP project `gsc-sites-2026` created; Search Console + Indexing APIs enabled; consent screen Published
- OAuth client at `~/.config/gsc-cli/oauth-client.json` (chmod 600)
- `gsc auth login | status | logout` working with PKCE flow
- Refresh token persisted at `~/.config/gsc-cli/credentials.json`

### Phase 1 — `gsc sites` (DONE 2026-05-04)
- `gsc sites [--json]` lists verified properties
- `gsc sites delete --site <site>` removes a property from this account's GSC view
- Verified 7 properties: jdkey.com, dickeylawgroup.com, winningonissues.com, txelectionresults.com, callviv.com, podstylevideo.com, hyperscalenews.com (all `sc-domain:` Domain properties)
- Removed redundant URL-prefix property for jdkey.com

### Phase 2 — `gsc sitemap` (DONE 2026-05-04)
- `gsc sitemap list --site <site> [--json]`
- `gsc sitemap submit --site <site> <feedpath>`
- `gsc sitemap delete --site <site> <feedpath>`
- Audited and fixed sitemap registrations across portfolio:
  - jdkey: `/sitemap-index.xml` ✓ (3,123 URLs); deleted stale `/sitemap.xml`
  - dickeylawgroup: `/sitemap.xml` ✓ (9 URLs)
  - txelectionresults: `/sitemap.xml` ✓ NEWLY submitted
  - podstylevideo: `/sitemap.xml` ✓ NEWLY submitted
  - hyperscalenews: `/sitemap.xml` ✓ NEWLY submitted
  - callviv: code shipped (commit `bea2211`) — needs `./deploy.sh` then GSC submit
  - winningonissues: code shipped (commit `8e1124f`) — needs `./deploy.sh` then GSC submit

### Phase 2.5 — VPS `seo` User + DB Infrastructure (DONE 2026-05-04)
Adapted from `new-project:new-project` skill, cherry-picking phases relevant to a CLI tool (skipped web-app scaffolding, port allocation, nginx, SSL, deploy.sh).

- A1: `useradd -m -s /bin/bash seo` (uid 1039)
- A1.5: `usermod -aG obsidian seo`
- A2: `~/sql ~/logs ~/.config/gsc-cli ~/cli` (chmod 700 on `.config/gsc-cli`)
- A3: SSH `AllowUsers` updated; `ssh` service reloaded
- A4: `authorized_keys` mirrored from `nonrootadmin`
- A5: passwordless sudo `nonrootadmin → seo` via `/etc/sudoers.d/seo-user`
- A5b: client-side SSH alias on Mac mini (`Host seo` + umbrella line) — **MacBook still pending**
- A6: postgres role `seo`; database `seo_db`; `pg_hba.conf` peer auth entry; reload OK
- End-to-end: `ssh seo 'psql seo_db -c "select 1"'` works

### Phase 3 — `gsc pull` (DONE 2026-05-04)

First production pull across all 7 sites: dickeylawgroup=661, jdkey=289, txelectionresults=64, podstylevideo=6, hyperscalenews=4, callviv=0, winningonissues=0 rows. Per-site latency ~600–1000ms over the SSH-forwarded socket. Idempotent on re-run (PK on gsc_perf).

**Implementation notes (gotchas worth remembering):**
- `pg_hba.conf` only has `local seo_db seo peer`. Initial TCP tunnel was rejected by postgres. Fix: SSH-forward the unix socket (`-L /tmp/.../.s.PGSQL.5432:/var/run/postgresql/.s.PGSQL.5432`) so peer auth still applies — no TCP exposure on VPS.
- Shared `ControlMaster` made `child.kill('SIGTERM')` on the tunnel hang forever. Fix: per-tunnel `ControlMaster=no ControlPath=none`, plus SIGKILL fallback after 1s. Cheap with key auth.
- `create table ... partition of gsc_perf for values in ($1)` does not accept parameter binding (postgres rejects with "bind message supplies 1 parameters, but prepared statement requires 0"). Fix: inline-quote the literal. partitionName is sanitized to `[a-z0-9_]` so the identifier is safe.
- `bin/gsc` parser had a latent bug: single-word commands with flags (`gsc sites --json`) were treating `--json` as the sub-command. Fixed by parsing flags first, then taking the first two positionals as group/sub.

**Schema** at `gsc-cli/sql/schema.sql`:

```sql
create table sites (
  site_url        text primary key,           -- 'sc-domain:jdkey.com'
  display_name    text not null,
  added_at        timestamptz default now(),
  active          boolean default true
);

create table gsc_perf (
  site_url        text not null references sites(site_url),
  date            date not null,
  query           text,
  page            text,
  country         text,
  device          text,
  search_type     text,                       -- web, image, video, news, discover
  clicks          int  not null default 0,
  impressions     int  not null default 0,
  ctr             numeric(8,6),
  position        numeric(7,3),
  pulled_at       timestamptz default now(),
  primary key (site_url, date, query, page, country, device, search_type)
) partition by list (site_url);

create table gsc_inspections (
  site_url        text not null references sites(site_url),
  url             text not null,
  inspected_at    timestamptz not null,
  index_status    text,
  coverage_state  text,
  last_crawl      timestamptz,
  page_fetch      text,
  robots_txt      text,
  indexing_state  text,
  user_canonical  text,
  google_canonical text,
  raw             jsonb,
  primary key (site_url, url, inspected_at)
);

create table gsc_sitemap_log (
  site_url        text not null references sites(site_url),
  feedpath        text not null,
  action          text not null,              -- submit, delete, list
  status          text,                       -- success, error
  detail          jsonb,
  performed_at    timestamptz default now()
);
```

**Per-site partition strategy:** new partition for each site in `sites` table, keeps per-site queries fast and lets us drop a site cleanly.

**`lib/db.mjs`:** `pg` client wrapper, reads `DATABASE_URL` from `~/.config/gsc-cli/db.env` (or env), exposes `query()` and `withClient()`. Uses peer auth via SSH tunnel from Mac mini, OR SSH-into-seo-and-shell-out-to-psql, depending on how Phase 6 cron is structured. Decide during implementation.

**`config/sites.json`:** per-site metadata (display name, primary domain, enabled flag, digest target email).

**`commands/pull.mjs`:** for each site in `sites.json`, paginate `searchAnalytics.query` for last N days at all dimensions (date, query, page, country, device), upsert into `gsc_perf`. Log run to `gsc_sitemap_log`-style audit table.

### dlg DNS Cutover (2026-05-04, post-Phase 3)
Discovered during first SEO mining session that dickeylawgroup.com DNS was still pointed at Hostinger Website Builder (the legacy Zyro site), while the new Next.js app on the VPS was fully ready and unreachable. Fix was DNS-only — no code changes needed.

**Pre-cutover state:**
- Apex A → 147.79.79.186 (Hostinger CDN, serving Zyro Website Builder)
- www CNAME → cdn.hstgr.net.
- VPS Next.js app at 74.82.63.199 (correct origin, all routes 200)

**hPanel changes (James):**
- Apex A → 74.82.63.199, TTL 300
- www CNAME → deleted
- www A → 74.82.63.199, TTL 300

**Post-cutover verification (2026-05-04 14:11 PT):**
- `dig +short dickeylawgroup.com` → 74.82.63.199 (apex + www, multiple resolvers)
- `curl -sI https://dickeylawgroup.com/` → HTTP/2 200, `server: nginx` (not `hcdn`)
- 24 of top-25 GSC pages return 200 or correct 308 redirect; only one 404 (`/es/estate-planning/spring-tx`, 55 imp/month) — needs a 1-line addition to the i18n redirect rules.

**Important correction to prior session's narrative:** I had claimed "7 of 10 top-impression pages were 404ing" with a list of major-metro URLs (Houston, Dallas, Austin, etc.). That was wrong. Those URLs don't appear in dlg's GSC data at all — only 40 distinct pages have any impressions, all on the actual app's routes. The blast radius from the DNS misconfiguration was that the legacy Zyro page was the public face for several days, not that GSC URLs were broken. Going forward: ground claims about "what's ranking" in actual seo_db queries, not assumptions about which URLs should rank.

### Real SEO opportunities surfaced from first pull (dlg, post-cutover, pre-recovery)
Wait 7 days for fresh GSC data, then prioritize:

1. **Estate-tax sleeping giant** — `/blog/does-texas-have-estate-tax`: 5,673 impressions, position 7.9, only 1 click (0.018% CTR vs ~3% expected at pos 7-8). Multiple striking-distance variants on this same page (positions 11–17 for "texas estate tax", "inheritance tax texas", "does texas have inheritance tax", "texas inheritance tax 2025"). Highest single-page ROI. Action: rewrite title + meta description + opening 160 chars; consider expanding the page.
2. **Homepage cannibalizing service pages** — Homepage ranks at pos 16-18 for "estate planning attorney the woodlands" variants (105 + 68 imp). The Woodlands service pages are at pos 35-55. Consolidate intent: stronger internal links from homepage to The Woodlands page; differentiate titles.
3. **AI Overview eating clicks** — Pages at pos 4-7 with 0 clicks ("real estate attorney" 588 imp/pos 4, "estate planning" 262 imp/pos 4.2, "texas estate tax 2026" 280 imp/pos 7.1). Likely AIO suppression; not a fix but an awareness item — track over time.
4. **Junk traffic to deprioritize** — "civil law attorney" 1,855 imp/pos 105: ignore.

### Phase 4 — `gsc inspect` (DONE 2026-05-04, commit `7d6070b`)
URL Inspection API for one URL or top N pages per site. Writes `gsc_inspections` (PK includes `inspected_at`, so re-inspections accumulate history). Rate-limited at 500ms between calls.

**Forms:**
- `gsc inspect <url>` — auto-detects site
- `gsc inspect --site <site> <url>` — explicit site
- `gsc inspect --site <site> --top N` — top N by impressions, last 28d
- `gsc inspect ... --request-indexing` — also publish URL_UPDATED to Indexing API (best-effort; officially scoped to JobPosting/BroadcastEvent)

**Smoke test:** ran against the just-rewritten dlg estate-tax post. Result: PASS, "Submitted and indexed", last crawl 2026-04-21 (pre-rewrite). Confirms the new content isn't yet known to Google — `--request-indexing` is the right next move when ready.

**Sequencing:** Bulk dlg inspections still held until ~2026-05-11 (one full week post-DNS-cutover). Single-URL inspections on dlg are fine ad-hoc — that's the post-content-update use case. Other sites (jdkey, hyperscale, winning) can be bulk-inspected immediately.

### Phase 5 — `gsc digest` (DONE 2026-05-04)
Per-site weekly summary. Reads `gsc_perf` last 7d vs prior 7d, plus `gsc_sitemap_log` and `gsc_inspections`. Renders HTML + Markdown to `~/Library/Logs/gsc-cli/digest-YYYY-MM-DD/<display_name>.{html,md}` plus an `INDEX.md` so the user has one entry point per week.

**Drafts-only interpretation:** Phase 5 doesn't email anything — it writes static files to disk. The user opens `INDEX.md` (or the per-site HTML) in a browser, reviews, and decides whether to share. This is the strictest possible reading of the project rule "never send emails directly". Brevo / IMAP draft delivery can be added later as an opt-in flag without changing the data path.

**Forms:**
- `gsc digest` — all active sites
- `gsc digest --site <site>` — one site
- `gsc digest --days N` — override window length (default 7)
- `gsc digest --top N` — per-section row cap (default 10)
- `gsc digest --out <dir>` — override output dir
- `gsc digest --json` — print structured digests to stdout instead of writing files

**Sections per site:** Totals (clicks/impressions/CTR/avg position with deltas), Top Movers, Top Losers, Top Queries, Top Pages, Sitemap State (last 10 events), Recent URL Inspections.

**Implementation notes:**
- Window A: last `numDays` complete days ending 2 days ago (GSC lag). Window B: the prior `numDays` immediately before A.
- Movers/losers use a full outer join across the two windows so queries that appeared in only one period still surface (i.e. a query that disappeared shows as a loser).
- Position is impression-weighted across rows (`sum(position * impressions) / sum(impressions)`), since `gsc_perf` is broken down by all 5 dimensions.
- Per-site failures are logged to `gsc_run_log` with `status='error'` but don't abort the run.
- Smoke test (2026-05-04): all 7 sites generated successfully. dlg shows the recent estate-tax page in top queries at impression-weighted position 6.2 with 0 clicks — confirms the digest correctly surfaces the "sleeping giant" pattern that prompted the rewrite.

### Phase 6 — Cron / LaunchAgent (DONE 2026-05-04)
`launchd/com.jdkey.seo-cli.plist` runs Mondays 7am CT on Mac mini. Wraps `bin/gsc-weekly.sh` which:

1. `gsc pull` (all sites)
2. Per-site `gsc inspect --site <site> --top 50` (loops over `seo_db.sites where active=true`, falls back to GSC API if seo_db unreachable)
3. `gsc digest` (all sites)

**dlg hold:** built-in date gate skips `sc-domain:dickeylawgroup.com` until `GSC_DLG_HOLD_UNTIL` (default `2026-05-11`). First scheduled run is 2026-05-11, so the gate transitions exactly on the day dlg becomes eligible.

**Resilience:** Per-step failures are logged and counted, but later steps still run. Exit code is non-zero if anything failed so launchd sees it.

**Logging:**
- Per-run: `~/Library/Logs/gsc-cli/cron-YYYY-MM-DD.log` (full stdout+stderr from the wrapper)
- launchd's own: `~/Library/Logs/gsc-cli/launchd-stdout.log` and `launchd-stderr.log`
- Database: each command also writes to `gsc_run_log`

**Install/uninstall:**
- `launchd/install.sh` — copies plist to `~/Library/LaunchAgents/`, `launchctl bootout` then `bootstrap` (idempotent)
- `launchd/uninstall.sh` — removes from `~/Library/LaunchAgents/`
- Manual kick: `launchctl kickstart -k gui/$(id -u)/com.jdkey.seo-cli`

Installed and verified loaded on Mac mini at 2026-05-04 17:05 CT. First fire: Monday 2026-05-11 07:00 CT.

---

## Codebase Work (Outside CLI)

These are app-side fixes I delegated to subagents earlier today and are **shipped as commits but NOT deployed** until James runs `./deploy.sh`:

- **callviv.com** (commit `bea2211`): added `src/app/sitemap.ts` + `src/app/robots.ts` (4-route flat sitemap)
- **winningonissues.com** (commit `8e1124f`): added `app/app/sitemap.ts` + `app/app/robots.ts` (10 static + dynamic episode query)

Once deployed, run:
- `gsc sitemap delete --site sc-domain:callviv.com /sitemap.xml` (clear stale failing entry)
- `gsc sitemap submit --site sc-domain:callviv.com /sitemap.xml`
- `gsc sitemap submit --site sc-domain:winningonissues.com /sitemap.xml`

Other codebase work for jdkey.com (canonical fix on `/about/james-dickey`, legislature DB indexing decision) is captured in the GSC CLI memory and is not part of this plan.

---

## Cleanup

Stale infrastructure to archive once Phase 3 lands:
- `/home/nonrootadmin/monitoring/gsc-auth.mjs` and `gsc-weekly.sh` — never had credentials placed, PM2 entry stopped/disabled, no outputs ever generated. Move to `/home/nonrootadmin/monitoring/_archive/2026-05-04-replaced-by-seo-cli/`.

---

## Open Questions

1. **DB access pattern from Mac mini:** SSH tunnel to `seo@serveroptima` and connect to `127.0.0.1:5432`, or SSH into `seo` and run a Node script directly on the VPS? Tunnel is more flexible (CLI runs locally, can iterate fast); on-VPS is simpler (no tunnel state, peer auth Just Works). Decide when implementing `lib/db.mjs`.
2. **Multi-site pull cadence:** Daily incremental vs weekly full backfill? Daily incremental is cheaper but loses dimensions when re-aggregating. Weekly full pull (last 7 days at finest grain) is the GSC API's sweet spot — go with that.
3. **Sitemap auto-resubmit:** Should `gsc pull` automatically resubmit sitemaps if the site's sitemap file has changed since last submission? Probably no — drift between site state and GSC state is a useful signal worth surfacing in digest, not silently fixing.
