// gsc bwt — Bing Webmaster Tools ingest + status.
//
// Forms:
//   gsc bwt status                            Show per-site BWT state
//   gsc bwt register --site <site>            Mark a site as BWT-tracked
//   gsc bwt pull [--site <site>] [--days N]   Pull page/query stats
//
// `pull` requires BWT_API_KEY in the environment. `status` and `register`
// work without a key.

import { withDb } from '../lib/db.mjs';
import { primaryHostForSite } from '../lib/crawl.mjs';
import * as bwt from '../lib/bwt.mjs';

async function activeSites(db, onlySite) {
  if (onlySite) {
    const { rows } = await db.query(`select site_url, display_name from sites where site_url = $1`, [onlySite]);
    return rows;
  }
  const { rows } = await db.query(
    `select site_url, display_name from sites where active = true order by display_name`
  );
  return rows;
}

async function ensureBwtSiteRow(db, siteUrl) {
  const host = primaryHostForSite(siteUrl);
  await db.query(
    `insert into bwt_sites (site_url, bwt_host)
       values ($1, $2)
       on conflict (site_url) do update set bwt_host = excluded.bwt_host`,
    [siteUrl, host]
  );
  return host;
}

async function statusAction() {
  const keySet = !!process.env.BWT_API_KEY;
  console.log(`BWT_API_KEY: ${keySet ? 'set' : 'NOT SET'}`);

  if (keySet) {
    const p = await bwt.probe();
    if (p.ok) console.log(`API probe: ok (${p.site_count} sites visible to this key)`);
    else console.log(`API probe: FAILED (${p.code || 'unknown'}: ${p.error})`);
  }

  await withDb(async (db) => {
    const { rows } = await db.query(
      `select s.site_url, s.display_name,
              bs.bwt_host, bs.verified, bs.api_key_set, bs.last_pulled_at, bs.notes
         from sites s
         left join bwt_sites bs on bs.site_url = s.site_url
        where s.active = true
        order by s.display_name`
    );

    console.log('\nPer-site BWT state:');
    console.log(`  ${'site'.padEnd(36)}  ${'host'.padEnd(28)}  verified  key  last pulled`);
    for (const r of rows) {
      const verified = r.verified === true ? 'yes' : (r.verified === false ? 'no' : '—');
      const apiKey = r.api_key_set === true ? 'yes' : (r.api_key_set === false ? 'no' : '—');
      const last = r.last_pulled_at ? new Date(r.last_pulled_at).toISOString().slice(0, 10) : '—';
      console.log(`  ${r.site_url.padEnd(36)}  ${(r.bwt_host || '—').padEnd(28)}  ${verified.padEnd(8)}  ${apiKey.padEnd(3)}  ${last}`);
    }
    if (rows.every(r => !r.bwt_host)) {
      console.log('\nNo sites registered yet. Run: gsc bwt register --site <site_url>');
    }
  });
}

async function registerAction({ site }) {
  if (!site) throw new Error('--site is required for `gsc bwt register`');
  await withDb(async (db) => {
    const host = await ensureBwtSiteRow(db, site);
    // If the key is set, opportunistically check whether BWT sees this site
    // as verified — saves a manual GUI check.
    if (process.env.BWT_API_KEY) {
      try {
        const sites = await bwt.getUserSites();
        const verified = sites.some(s => {
          const u = (s.Url || s.SiteUrl || '').toLowerCase();
          return u.includes(host.toLowerCase());
        });
        await db.query(
          `update bwt_sites set verified = $1, api_key_set = true where site_url = $2`,
          [verified, site]
        );
        console.log(`Registered ${site} (host=${host}, verified=${verified}, api_key_set=true)`);
      } catch (e) {
        await db.query(
          `update bwt_sites set api_key_set = true, notes = $1 where site_url = $2`,
          [`probe failed: ${e.message}`, site]
        );
        console.log(`Registered ${site} (host=${host}, api_key_set=true, probe failed: ${e.message})`);
      }
    } else {
      console.log(`Registered ${site} (host=${host}). BWT_API_KEY not set — verification + pulls deferred.`);
    }
  });
}

function parseBwtDate(s) {
  // BWT returns Date strings like "/Date(1700000000000)/" or with an embedded
  // timezone offset for time-series methods: "/Date(1779519600000-0700)/".
  // Take the milliseconds-since-epoch part; ignore the offset (the absolute
  // instant is what matters for our daily UTC bucket).
  if (!s) return null;
  const m = String(s).match(/Date\((-?\d+)(?:[-+]\d+)?\)/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10)).toISOString().slice(0, 10);
}

async function pullAction({ site: onlySite, days }) {
  if (!process.env.BWT_API_KEY) {
    throw new Error('BWT_API_KEY env var not set. See `gsc bwt status` and the BWT setup section of the seo-automation status doc.');
  }
  const numDays = parseInt(days ?? '7', 10);
  if (!Number.isFinite(numDays) || numDays <= 0) {
    throw new Error('--days must be a positive integer');
  }

  await withDb(async (db) => {
    const sites = await activeSites(db, onlySite);
    if (sites.length === 0) {
      if (onlySite) throw new Error(`Site not found in seo_db: ${onlySite}`);
      throw new Error('No active sites in seo_db.');
    }

    // Restrict to sites with a bwt_sites row (i.e., explicitly registered).
    const { rows: registered } = await db.query(`select site_url, bwt_host from bwt_sites`);
    const enabled = new Map(registered.map(r => [r.site_url, r.bwt_host]));

    let succeeded = 0, failed = 0, skipped = 0;
    for (const site of sites) {
      if (!enabled.has(site.site_url)) {
        console.log(`  skip ${site.site_url} (not registered in bwt_sites; run \`gsc bwt register --site ${site.site_url}\`)`);
        skipped++;
        continue;
      }
      const bwtHost = enabled.get(site.site_url);
      const bwtUrl = `https://${bwtHost}/`;          // BWT API takes a URL-form siteUrl
      const runStart = new Date();

      try {
        console.log(`\n→ ${site.display_name} (${bwtUrl})`);
        const today = new Date().toISOString().slice(0, 10);
        const cutoff = new Date();
        cutoff.setUTCDate(cutoff.getUTCDate() - numDays);
        const cutoffIso = cutoff.toISOString().slice(0, 10);

        // 1) Per-day site totals from GetRankAndTrafficStats — the only BWT
        //    method that returns a time series. Written as (page='', query='').
        const rats = await bwt.getRankAndTrafficStats(bwtUrl);
        const dayRows = [];
        for (const s of rats) {
          const d = parseBwtDate(s.Date);
          if (!d || d < cutoffIso) continue;
          dayRows.push({
            date: d,
            clicks: Number(s.Clicks || 0),
            impressions: Number(s.Impressions || 0),
          });
        }
        console.log(`  GetRankAndTrafficStats: ${rats.length} total rows, ${dayRows.length} in window`);
        for (const r of dayRows) {
          await db.query(
            `insert into bwt_perf (site_url, date, query, page, source, clicks, impressions)
             values ($1, $2, '', '', 'bing', $3, $4)
             on conflict (site_url, date, query, page, source) do update set
               clicks = excluded.clicks,
               impressions = excluded.impressions,
               pulled_at = now()`,
            [site.site_url, r.date, r.clicks, r.impressions]
          );
        }

        // 2) Per-page rollup from GetPageStats — not a time series; record
        //    under today as a fresh snapshot of "top pages this week".
        const pages = await bwt.getPageStats(bwtUrl).catch(e => {
          console.log(`  GetPageStats failed (continuing): ${e.message}`);
          return [];
        });
        let pageWritten = 0;
        for (const p of pages) {
          const page = p.Page || p.Url || '';
          if (!page) continue;
          await db.query(
            `insert into bwt_perf (site_url, date, query, page, source, clicks, impressions, avg_position)
             values ($1, $2, '', $3, 'bing', $4, $5, $6)
             on conflict (site_url, date, query, page, source) do update set
               clicks = excluded.clicks,
               impressions = excluded.impressions,
               avg_position = excluded.avg_position,
               pulled_at = now()`,
            [site.site_url, today, page,
             Number(p.Clicks || 0), Number(p.Impressions || 0),
             p.Position == null ? null : Number(p.Position)]
          );
          pageWritten++;
        }

        // 3) Per-query rollup from GetQueryStats — same shape as #2 but query side.
        const queries = await bwt.getQueryStats(bwtUrl).catch(e => {
          console.log(`  GetQueryStats failed (continuing): ${e.message}`);
          return [];
        });
        let queryWritten = 0;
        for (const q of queries) {
          const query = q.Query || '';
          if (!query) continue;
          await db.query(
            `insert into bwt_perf (site_url, date, query, page, source, clicks, impressions, avg_position)
             values ($1, $2, $3, '', 'bing', $4, $5, $6)
             on conflict (site_url, date, query, page, source) do update set
               clicks = excluded.clicks,
               impressions = excluded.impressions,
               avg_position = excluded.avg_position,
               pulled_at = now()`,
            [site.site_url, today, query,
             Number(q.Clicks || 0), Number(q.Impressions || 0),
             q.Position == null ? null : Number(q.Position)]
          );
          queryWritten++;
        }
        console.log(`  ✓ wrote ${dayRows.length} day + ${pageWritten} page + ${queryWritten} query rows`);

        await db.query(
          `update bwt_sites set last_pulled_at = now(), api_key_set = true where site_url = $1`,
          [site.site_url]
        );
        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('bwt', $1, $2, now(), $3, 'success', $4)`,
          [site.site_url, runStart.toISOString(), dayRows.length + pageWritten + queryWritten,
           JSON.stringify({ day_rows: dayRows.length, page_rows: pageWritten, query_rows: queryWritten })]
        );
        succeeded++;
      } catch (err) {
        console.error(`  ✗ ${site.display_name}: ${err.message}`);
        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('bwt', $1, $2, now(), 0, 'error', $3)`,
          [site.site_url, runStart.toISOString(), JSON.stringify({ error: err.message })]
        ).catch(() => {});
        failed++;
      }
    }
    console.log(`\nDone. ${succeeded} ok, ${failed} fail, ${skipped} skip.`);
  });
}

export async function bwtCmd({ action, site, days }) {
  switch (action) {
    case 'status':   return statusAction();
    case 'register': return registerAction({ site });
    case 'pull':     return pullAction({ site, days });
    default:
      throw new Error(`Unknown bwt action: ${action}. Try: gsc bwt status | register | pull`);
  }
}
