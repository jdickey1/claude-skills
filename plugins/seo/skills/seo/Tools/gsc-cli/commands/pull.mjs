// gsc pull — paginate Search Analytics for each verified site and upsert into seo_db.
//
// Default window: 9 days ago → 2 days ago (GSC has a ~2-day data lag).
// Dimensions: date, query, page, country, device.
// search_type defaults to 'web'; pass --type to override.
//
// Idempotent — primary key on gsc_perf is (site_url, date, query, page, country, device, search_type).
// Re-running for the same window overwrites with the latest values.

import { listSites, searchAnalyticsAll } from '../lib/api.mjs';
import { withDb, ensurePartition, upsertSite } from '../lib/db.mjs';

const DIMS = ['date', 'query', 'page', 'country', 'device'];
const PG_PARAM_LIMIT = 65000;     // postgres caps at 65535
const COLS = 11;                  // params per row in the upsert
const ROWS_PER_BATCH = Math.floor(PG_PARAM_LIMIT / COLS);

function isoDate(d) { return d.toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; }

function deriveDisplayName(siteUrl) {
  // 'sc-domain:jdkey.com' → 'jdkey.com'; URL-prefix → host
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.slice('sc-domain:'.length);
  try { return new URL(siteUrl).host; } catch { return siteUrl; }
}

function derivePrimaryDomain(siteUrl) {
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.slice('sc-domain:'.length);
  try { return new URL(siteUrl).host.replace(/^www\./, ''); } catch { return siteUrl; }
}

async function upsertBatch(db, siteUrl, searchType, batch) {
  if (batch.length === 0) return 0;
  const params = [];
  const values = batch.map((row, i) => {
    const o = i * COLS;
    params.push(
      siteUrl,
      row.keys[0],          // date
      row.keys[1] || '',    // query
      row.keys[2] || '',    // page
      row.keys[3] || '',    // country
      row.keys[4] || '',    // device
      searchType,
      row.clicks || 0,
      row.impressions || 0,
      row.ctr ?? null,
      row.position ?? null,
    );
    return `($${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6},$${o+7},$${o+8},$${o+9},$${o+10},$${o+11})`;
  }).join(',');

  const sql = `
    insert into gsc_perf
      (site_url, date, query, page, country, device, search_type, clicks, impressions, ctr, position)
    values ${values}
    on conflict (site_url, date, query, page, country, device, search_type) do update set
      clicks      = excluded.clicks,
      impressions = excluded.impressions,
      ctr         = excluded.ctr,
      position    = excluded.position,
      pulled_at   = now()
  `;
  const r = await db.query(sql, params);
  return r.rowCount || 0;
}

export async function pullCmd({ days = 7, type = 'web', site: onlySite } = {}) {
  const numDays = parseInt(days, 10);
  const startDate = isoDate(daysAgo(numDays + 2));
  const endDate = isoDate(daysAgo(2));

  console.log(`gsc pull: ${startDate} → ${endDate} (search_type=${type})\n`);

  const allSites = await listSites();
  const verified = allSites.filter(s => s.permissionLevel !== 'siteUnverifiedUser');
  const sites = onlySite ? verified.filter(s => s.siteUrl === onlySite) : verified;
  if (sites.length === 0) {
    if (onlySite) throw new Error(`Site not found or not verified: ${onlySite}`);
    throw new Error('No verified sites found.');
  }

  await withDb(async (db) => {
    for (const s of sites) {
      const siteUrl = s.siteUrl;
      const t0 = Date.now();
      const runStart = new Date();

      await upsertSite(db, {
        siteUrl,
        displayName: deriveDisplayName(siteUrl),
        primaryDomain: derivePrimaryDomain(siteUrl),
      });
      await ensurePartition(db, siteUrl);

      let pulled = 0;
      let written = 0;
      let batch = [];
      try {
        for await (const row of searchAnalyticsAll(siteUrl, {
          startDate, endDate, dimensions: DIMS, type, dataState: 'final',
        })) {
          batch.push(row);
          pulled++;
          if (batch.length >= ROWS_PER_BATCH) {
            written += await upsertBatch(db, siteUrl, type, batch);
            batch = [];
          }
        }
        if (batch.length) written += await upsertBatch(db, siteUrl, type, batch);

        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('pull', $1, $2, now(), $3, 'success', $4)`,
          [siteUrl, runStart.toISOString(), written, JSON.stringify({ startDate, endDate, type, pulled })]
        );
        const ms = Date.now() - t0;
        console.log(`  ✓ ${deriveDisplayName(siteUrl).padEnd(28)} ${String(written).padStart(6)} rows (${ms}ms)`);
      } catch (err) {
        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('pull', $1, $2, now(), $3, 'error', $4)`,
          [siteUrl, runStart.toISOString(), written, JSON.stringify({ startDate, endDate, type, pulled, error: err.message })]
        ).catch(() => {});
        console.error(`  ✗ ${deriveDisplayName(siteUrl)}: ${err.message}`);
      }
    }
  });
}
