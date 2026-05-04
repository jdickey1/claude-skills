// gsc inspect — URL Inspection API, optionally followed by Indexing API request-indexing.
//
// Forms:
//   gsc inspect <url>                                  Inspect one URL (auto-detects site)
//   gsc inspect --site <site> <url>                    Inspect one URL with explicit site
//   gsc inspect --site <site> --top N                  Inspect top N pages by impressions (last 28 days)
//   gsc inspect --site <site> --top N --request-indexing
//
// Flags:
//   --json                  Machine-readable output
//   --request-indexing      After each successful inspect, publish URL_UPDATED to Indexing API
//                           (best-effort; Indexing API is officially scoped to JobPosting/BroadcastEvent)
//   --pace-ms <ms>          Delay between API calls (default 500). URL Inspection quota is
//                           ~2,000/day per property, so 500ms is conservative.
//
// Writes to gsc_inspections (one row per inspection; (site_url, url, inspected_at) is the PK).
// Writes to gsc_run_log on completion (success or error).

import { listSites, inspectUrl, notifyUrlUpdate } from '../lib/api.mjs';
import { withDb, upsertSite } from '../lib/db.mjs';

function deriveDisplayName(siteUrl) {
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.slice('sc-domain:'.length);
  try { return new URL(siteUrl).host; } catch { return siteUrl; }
}

function derivePrimaryDomain(siteUrl) {
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.slice('sc-domain:'.length);
  try { return new URL(siteUrl).host.replace(/^www\./, ''); } catch { return siteUrl; }
}

// Match a URL to one of the user's verified GSC properties.
// sc-domain properties cover all subdomains of the domain.
async function siteForUrl(url) {
  const all = await listSites();
  const verified = all.filter(s => s.permissionLevel !== 'siteUnverifiedUser');
  let host;
  try { host = new URL(url).host; } catch { return null; }
  // Prefer sc-domain match (covers subdomains)
  for (const s of verified) {
    if (s.siteUrl.startsWith('sc-domain:')) {
      const d = s.siteUrl.slice('sc-domain:'.length);
      if (host === d || host.endsWith(`.${d}`)) return s.siteUrl;
    }
  }
  // Fallback: URL-prefix property whose origin matches
  for (const s of verified) {
    if (s.siteUrl.startsWith('http')) {
      try {
        const su = new URL(s.siteUrl);
        if (su.host === host) return s.siteUrl;
      } catch {}
    }
  }
  return null;
}

function flatten(result) {
  // result is the `inspectionResult` object from the URL Inspection API.
  const isr = result?.indexStatusResult || {};
  return {
    index_status:     isr.verdict || null,
    coverage_state:   isr.coverageState || null,
    last_crawl:       isr.lastCrawlTime || null,
    page_fetch_state: isr.pageFetchState || null,
    robots_txt_state: isr.robotsTxtState || null,
    indexing_state:   isr.indexingState || null,
    user_canonical:   isr.userCanonical || null,
    google_canonical: isr.googleCanonical || null,
  };
}

async function inspectOne(db, siteUrl, url, { requestIndexing, json }) {
  const inspected_at = new Date().toISOString();
  let response, flat;
  try {
    response = await inspectUrl(siteUrl, url);
    const result = response?.inspectionResult || response;
    flat = flatten(result);
    await db.query(
      `insert into gsc_inspections
        (site_url, url, inspected_at, index_status, coverage_state, last_crawl,
         page_fetch_state, robots_txt_state, indexing_state,
         user_canonical, google_canonical, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       on conflict (site_url, url, inspected_at) do nothing`,
      [
        siteUrl, url, inspected_at,
        flat.index_status, flat.coverage_state, flat.last_crawl,
        flat.page_fetch_state, flat.robots_txt_state, flat.indexing_state,
        flat.user_canonical, flat.google_canonical, JSON.stringify(result),
      ]
    );
  } catch (err) {
    if (json) console.log(JSON.stringify({ url, error: err.message }));
    else console.error(`  ✗ ${url} — ${err.message}`);
    throw err;
  }

  let indexingResult = null;
  if (requestIndexing) {
    try {
      indexingResult = await notifyUrlUpdate(url);
    } catch (err) {
      indexingResult = { error: err.message };
    }
  }

  if (json) {
    console.log(JSON.stringify({ url, ...flat, requestIndexing: indexingResult }));
  } else {
    const verdict = flat.index_status || '?';
    const cov = flat.coverage_state || '?';
    const last = flat.last_crawl ? new Date(flat.last_crawl).toISOString().slice(0, 10) : '—';
    console.log(`  ✓ ${verdict.padEnd(8)} ${cov.padEnd(28)} last:${last}  ${url}`);
    if (requestIndexing) {
      const status = indexingResult?.error ? `error: ${indexingResult.error}` : 'sent';
      console.log(`    → request-indexing: ${status}`);
    }
  }
  return { flat, indexingResult };
}

async function topPagesForSite(db, siteUrl, n) {
  // Top pages by impressions across the last 28 days of stored data.
  // Uses the page-only aggregation (where query is the empty string from pull rows).
  const { rows } = await db.query(
    `select page, sum(impressions) as imp
       from gsc_perf
      where site_url = $1
        and date >= current_date - interval '28 days'
        and page <> ''
      group by page
      order by imp desc
      limit $2`,
    [siteUrl, n]
  );
  return rows.map(r => r.page);
}

export async function inspectCmd({ site, top, all, requestIndexing, json, paceMs, positional = [] }) {
  const pace = parseInt(paceMs ?? '500', 10);
  const wantsRequestIndexing = !!requestIndexing;

  const url = positional[0]; // single-URL form

  if (top || all) {
    if (!site) throw new Error('--site is required when using --top or --all');
    const limit = all ? 1000 : parseInt(top, 10);
    if (!Number.isFinite(limit) || limit <= 0) throw new Error('--top must be a positive integer');

    await withDb(async (db) => {
      await upsertSite(db, {
        siteUrl: site,
        displayName: deriveDisplayName(site),
        primaryDomain: derivePrimaryDomain(site),
      });
      const urls = await topPagesForSite(db, site, limit);
      if (urls.length === 0) {
        console.error(`No pages with impressions found for ${site}. Run \`gsc pull\` first.`);
        return;
      }
      const runStart = new Date();
      let ok = 0, fail = 0;
      console.log(`gsc inspect: ${site} — ${urls.length} URL${urls.length === 1 ? '' : 's'} (pace ${pace}ms${wantsRequestIndexing ? ', +request-indexing' : ''})\n`);
      for (let i = 0; i < urls.length; i++) {
        const u = urls[i];
        try {
          await inspectOne(db, site, u, { requestIndexing: wantsRequestIndexing, json });
          ok++;
        } catch {
          fail++;
        }
        if (i < urls.length - 1) await new Promise(r => setTimeout(r, pace));
      }
      await db.query(
        `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
         values ('inspect', $1, $2, now(), $3, $4, $5)`,
        [site, runStart.toISOString(), ok, fail === 0 ? 'success' : 'partial',
         JSON.stringify({ requested: urls.length, ok, fail, requestIndexing: wantsRequestIndexing })]
      );
      if (!json) {
        console.log(`\nDone. ${ok} ok, ${fail} fail.`);
      }
    });
    return;
  }

  // Single-URL form
  if (!url) throw new Error('Usage: gsc inspect <url>  OR  gsc inspect --site <site> --top N');

  let resolvedSite = site;
  if (!resolvedSite) {
    resolvedSite = await siteForUrl(url);
    if (!resolvedSite) throw new Error(`Could not auto-detect site for ${url}. Pass --site explicitly.`);
  }

  await withDb(async (db) => {
    await upsertSite(db, {
      siteUrl: resolvedSite,
      displayName: deriveDisplayName(resolvedSite),
      primaryDomain: derivePrimaryDomain(resolvedSite),
    });
    if (!json) {
      console.log(`gsc inspect: ${resolvedSite}\n`);
    }
    await inspectOne(db, resolvedSite, url, { requestIndexing: wantsRequestIndexing, json });
  });
}
