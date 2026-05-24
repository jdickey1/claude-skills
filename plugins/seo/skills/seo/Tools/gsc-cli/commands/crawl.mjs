// gsc crawl — fetch a site's sitemap, crawl every URL, count inbound internal
// links per URL, write results to seo_db.
//
// Forms:
//   gsc crawl                              All active sites
//   gsc crawl --site <site>                One site
//   gsc crawl --site <site> --sitemap <url>  Explicit sitemap (overrides discovery)
//   gsc crawl --concurrency N              Default 8
//
// Default sitemap discovery: look up the most-recent SUCCESS row in
// gsc_sitemap_log for the site; fall back to '<origin>/sitemap.xml'.

import { withDb } from '../lib/db.mjs';
import { runCrawl, originForSite, primaryHostForSite } from '../lib/crawl.mjs';

async function activeSites(db, onlySite) {
  if (onlySite) {
    const { rows } = await db.query(
      `select site_url, display_name, primary_domain from sites where site_url = $1`,
      [onlySite]
    );
    return rows;
  }
  const { rows } = await db.query(
    `select site_url, display_name, primary_domain from sites where active = true order by display_name`
  );
  return rows;
}

async function discoverSitemap(db, siteUrl) {
  const { rows } = await db.query(
    `select feedpath from gsc_sitemap_log
       where site_url = $1 and status = 'success'
       order by performed_at desc limit 1`,
    [siteUrl]
  );
  if (rows[0]?.feedpath) {
    const fp = rows[0].feedpath;
    if (/^https?:/.test(fp)) return fp;
    const origin = originForSite(siteUrl);
    return new URL(fp, origin).toString();
  }
  // Probe common sitemap paths. Sites with multi-sitemap setups commonly
  // expose /sitemap-index.xml; small sites use /sitemap.xml.
  const origin = originForSite(siteUrl);
  for (const path of ['/sitemap-index.xml', '/sitemap.xml']) {
    try {
      const res = await fetch(`${origin}${path}`, { method: 'HEAD' });
      if (res.ok) return `${origin}${path}`;
    } catch {/* try next */}
  }
  return `${origin}/sitemap.xml`;
}

async function insertCrawl(db, siteUrl, result) {
  const { rows: [{ id: crawlId }] } = await db.query(
    `insert into internal_link_crawls
       (site_url, urls_attempted, urls_fetched, urls_failed, status, detail, finished_at)
       values ($1, $2, $3, $4, $5, $6, now())
       returning id`,
    [
      siteUrl,
      result.urls_attempted,
      result.urls_fetched,
      result.urls_failed,
      result.urls_failed === 0 ? 'success' : (result.urls_fetched > 0 ? 'partial' : 'error'),
      JSON.stringify({ sitemap_url: result.sitemap_url, rows: result.rows.length }),
    ]
  );

  // Batched insert of per-URL counts. ~5 params per row, well under the 65k cap.
  const COLS = 6;
  const ROWS_PER_BATCH = Math.floor(60000 / COLS);
  for (let i = 0; i < result.rows.length; i += ROWS_PER_BATCH) {
    const slice = result.rows.slice(i, i + ROWS_PER_BATCH);
    const params = [];
    const values = slice.map((r, n) => {
      const o = n * COLS;
      params.push(crawlId, siteUrl, r.url, r.inbound_count, r.outbound_count, r.in_sitemap);
      return `($${o+1}, $${o+2}, $${o+3}, $${o+4}, $${o+5}, $${o+6})`;
    }).join(',');
    await db.query(
      `insert into internal_links (crawl_id, site_url, url, inbound_count, outbound_count, in_sitemap)
       values ${values}`,
      params
    );
  }

  // Backfill http_status separately so the main insert stays simple.
  const withStatus = result.rows.filter(r => r.http_status != null);
  for (const r of withStatus) {
    await db.query(
      `update internal_links set http_status = $1 where crawl_id = $2 and url = $3`,
      [r.http_status, crawlId, r.url]
    );
  }

  return crawlId;
}

export async function crawlCmd({ site: onlySite, sitemap, concurrency } = {}) {
  const conc = concurrency ? parseInt(concurrency, 10) : 8;
  if (!Number.isFinite(conc) || conc <= 0) {
    throw new Error('--concurrency must be a positive integer');
  }

  await withDb(async (db) => {
    const sites = await activeSites(db, onlySite);
    if (sites.length === 0) {
      if (onlySite) throw new Error(`Site not found in seo_db: ${onlySite}`);
      throw new Error('No active sites in seo_db.');
    }

    for (const site of sites) {
      const runStart = new Date();
      const sitemapUrl = sitemap || await discoverSitemap(db, site.site_url);
      const host = primaryHostForSite(site.site_url);

      console.log(`\n→ ${site.display_name} (${site.site_url})`);
      console.log(`  sitemap: ${sitemapUrl}`);
      console.log(`  host:    ${host}`);

      try {
        const result = await runCrawl({
          sitemapUrl,
          host,
          concurrency: conc,
          log: (m) => console.log(`  ${m}`),
        });
        const crawlId = await insertCrawl(db, site.site_url, result);

        // Surface the worst-starved high-impression pages immediately so the
        // operator sees value without needing to query psql.
        const { rows: starved } = await db.query(
          `with latest_perf as (
              select page,
                     sum(impressions)::int as impressions,
                     sum(clicks)::int as clicks
                from gsc_perf
               where site_url = $1
                 and date >= current_date - interval '28 days'
                 and page <> ''
               group by page
            )
            select il.url, il.inbound_count, lp.impressions, lp.clicks
              from internal_links il
              join latest_perf lp on lp.page = il.url
             where il.crawl_id = $2
             order by lp.impressions desc, il.inbound_count asc
             limit 15`,
          [site.site_url, crawlId]
        );

        console.log(`  ✓ crawl_id=${crawlId} attempted=${result.urls_attempted} fetched=${result.urls_fetched} failed=${result.urls_failed}`);
        if (starved.length > 0) {
          console.log(`  Top 15 by 28d impressions × inbound link count (ascending):`);
          console.log(`    ${'inbound'.padStart(7)}  ${'imp 28d'.padStart(7)}  ${'clicks'.padStart(6)}  url`);
          for (const r of starved) {
            console.log(`    ${String(r.inbound_count).padStart(7)}  ${String(r.impressions).padStart(7)}  ${String(r.clicks).padStart(6)}  ${r.url}`);
          }
        }

        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('crawl', $1, $2, now(), $3, 'success', $4)`,
          [site.site_url, runStart.toISOString(), result.rows.length,
           JSON.stringify({ crawl_id: crawlId, attempted: result.urls_attempted, fetched: result.urls_fetched, failed: result.urls_failed })]
        );
      } catch (err) {
        console.error(`  ✗ crawl failed: ${err.message}`);
        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('crawl', $1, $2, now(), 0, 'error', $3)`,
          [site.site_url, runStart.toISOString(), JSON.stringify({ error: err.message })]
        ).catch(() => {});
      }
    }
  });
}
