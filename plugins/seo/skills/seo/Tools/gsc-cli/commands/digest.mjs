// gsc digest — weekly per-site digest. Reads gsc_perf for last 7d vs prior 7d,
// plus gsc_sitemap_log + gsc_inspections, and writes a static report:
//   ~/Library/Logs/gsc-cli/digest-YYYY-MM-DD/<display_name>.{html,md}
//
// Drafts only (project rule): no direct email send. Files land on disk for the
// user to review and send manually. Phase 6 cron runs this; the user opens the
// latest digest folder in their browser/mail client.
//
// Forms:
//   gsc digest                     All active sites
//   gsc digest --site <site>       One site
//   gsc digest --days N            Override window length (default 7)
//   gsc digest --out <dir>         Override output dir
//   gsc digest --json              Print JSON to stdout instead of writing files
//   gsc digest --top N             Per-section row cap (default 10)

import os from 'node:os';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { withDb } from '../lib/db.mjs';

function isoDate(d) { return d.toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; }

function defaultOutDir() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Logs', 'gsc-cli');
  }
  return path.join(os.homedir(), '.local', 'share', 'gsc-cli');
}

function fmtNum(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0));
}
function fmtPct(p) {
  if (p == null) return '—';
  return (Number(p) * 100).toFixed(2) + '%';
}
function fmtPos(p) {
  if (p == null) return '—';
  return Number(p).toFixed(1);
}
function fmtSignedNum(n) {
  const v = Math.round(Number(n) || 0);
  if (v === 0) return '0';
  return (v > 0 ? '+' : '') + new Intl.NumberFormat('en-US').format(v);
}
function fmtSignedPp(deltaCtr) {
  // deltaCtr is a fraction (e.g. 0.012 = +1.2pp).
  if (deltaCtr == null || !Number.isFinite(deltaCtr)) return '—';
  const pp = deltaCtr * 100;
  if (Math.abs(pp) < 0.005) return '0pp';
  return (pp > 0 ? '+' : '') + pp.toFixed(2) + 'pp';
}
function fmtSignedPos(a, b) {
  // Position delta where lower is better. Show (b - a) so positive = improved.
  if (a == null || b == null) return '—';
  const v = Number(b) - Number(a);
  if (Math.abs(v) < 0.05) return '0';
  return (v > 0 ? '+' : '') + v.toFixed(1);
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

async function totals(db, siteUrl, start, end) {
  const { rows } = await db.query(
    `select sum(clicks) as clicks,
            sum(impressions) as impressions,
            sum(position * impressions) / nullif(sum(impressions), 0) as avg_position
       from gsc_perf
      where site_url = $1 and date between $2 and $3 and query <> ''`,
    [siteUrl, start, end]
  );
  const r = rows[0] || {};
  const clicks = Number(r.clicks || 0);
  const impressions = Number(r.impressions || 0);
  const avg_position = r.avg_position == null ? null : Number(r.avg_position);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  return { clicks, impressions, ctr, avg_position };
}

async function topQueries(db, siteUrl, start, end, limit) {
  const { rows } = await db.query(
    `select query,
            sum(clicks)::int as clicks,
            sum(impressions)::int as impressions,
            case when sum(impressions) > 0
                 then sum(clicks)::numeric / sum(impressions)
                 else 0 end as ctr,
            sum(position * impressions) / nullif(sum(impressions), 0) as avg_position
       from gsc_perf
      where site_url = $1 and date between $2 and $3 and query <> ''
      group by query
      order by clicks desc, impressions desc
      limit $4`,
    [siteUrl, start, end, limit]
  );
  return rows;
}

async function topPages(db, siteUrl, start, end, limit) {
  const { rows } = await db.query(
    `select page,
            sum(clicks)::int as clicks,
            sum(impressions)::int as impressions,
            case when sum(impressions) > 0
                 then sum(clicks)::numeric / sum(impressions)
                 else 0 end as ctr,
            sum(position * impressions) / nullif(sum(impressions), 0) as avg_position
       from gsc_perf
      where site_url = $1 and date between $2 and $3 and page <> ''
      group by page
      order by clicks desc, impressions desc
      limit $4`,
    [siteUrl, start, end, limit]
  );
  return rows;
}

async function moversAndLosers(db, siteUrl, aStart, aEnd, bStart, bEnd, limit) {
  // Two CTEs aggregated per query for each window, then full-outer-joined so
  // queries that appeared in only one window still surface as movers/losers.
  const baseSql = `
    with a as (
      select query, sum(clicks)::int as clicks_a, sum(impressions)::int as imp_a
        from gsc_perf
       where site_url = $1 and date between $2 and $3 and query <> ''
       group by query
    ), b as (
      select query, sum(clicks)::int as clicks_b, sum(impressions)::int as imp_b
        from gsc_perf
       where site_url = $1 and date between $4 and $5 and query <> ''
       group by query
    )
    select coalesce(a.query, b.query) as query,
           coalesce(a.clicks_a, 0) as clicks_a,
           coalesce(b.clicks_b, 0) as clicks_b,
           coalesce(a.clicks_a, 0) - coalesce(b.clicks_b, 0) as delta_clicks,
           coalesce(a.imp_a, 0) as imp_a,
           coalesce(b.imp_b, 0) as imp_b
      from a full outer join b using (query)
  `;
  const { rows: movers } = await db.query(
    `${baseSql} where coalesce(a.clicks_a, 0) <> coalesce(b.clicks_b, 0)
                 order by delta_clicks desc, clicks_a desc limit $6`,
    [siteUrl, aStart, aEnd, bStart, bEnd, limit]
  );
  const { rows: losers } = await db.query(
    `${baseSql} where coalesce(a.clicks_a, 0) <> coalesce(b.clicks_b, 0)
                 order by delta_clicks asc, clicks_b desc limit $6`,
    [siteUrl, aStart, aEnd, bStart, bEnd, limit]
  );
  return { movers, losers };
}

async function recentSitemapState(db, siteUrl) {
  const { rows } = await db.query(
    `select feedpath, action, status, performed_at, detail
       from gsc_sitemap_log
      where site_url = $1
      order by performed_at desc
      limit 10`,
    [siteUrl]
  );
  return rows;
}

async function recentInspections(db, siteUrl, limit) {
  const { rows } = await db.query(
    `select url, inspected_at, index_status, coverage_state, last_crawl
       from gsc_inspections
      where site_url = $1
      order by inspected_at desc
      limit $2`,
    [siteUrl, limit]
  );
  return rows;
}

async function activeSites(db, onlySite) {
  if (onlySite) {
    const { rows } = await db.query(
      `select site_url, display_name, digest_email from sites where site_url = $1`,
      [onlySite]
    );
    return rows;
  }
  const { rows } = await db.query(
    `select site_url, display_name, digest_email
       from sites
      where active = true
      order by display_name`
  );
  return rows;
}

async function buildDigest(db, site, { aStart, aEnd, bStart, bEnd, limit }) {
  const [
    totalsA, totalsB,
    topQs, topPs,
    { movers, losers },
    sitemap, inspections,
  ] = await Promise.all([
    totals(db, site.site_url, aStart, aEnd),
    totals(db, site.site_url, bStart, bEnd),
    topQueries(db, site.site_url, aStart, aEnd, limit),
    topPages(db, site.site_url, aStart, aEnd, limit),
    moversAndLosers(db, site.site_url, aStart, aEnd, bStart, bEnd, limit),
    recentSitemapState(db, site.site_url),
    recentInspections(db, site.site_url, limit),
  ]);

  return {
    site_url: site.site_url,
    display_name: site.display_name,
    digest_email: site.digest_email,
    period: { start: aStart, end: aEnd },
    prior: { start: bStart, end: bEnd },
    totals: { current: totalsA, prior: totalsB },
    top_queries: topQs,
    top_pages: topPs,
    movers,
    losers,
    sitemap,
    inspections,
    generated_at: new Date().toISOString(),
  };
}

function renderMarkdown(d) {
  const a = d.totals.current, b = d.totals.prior;
  const out = [];
  out.push(`# ${d.display_name} — Weekly SEO Digest`);
  out.push('');
  out.push(`- **Site:** \`${d.site_url}\``);
  out.push(`- **Window:** ${d.period.start} → ${d.period.end} (vs ${d.prior.start} → ${d.prior.end})`);
  out.push(`- **Generated:** ${d.generated_at}`);
  if (d.digest_email) out.push(`- **Recipient hint:** ${d.digest_email}`);
  out.push('');
  out.push('## Totals');
  out.push('');
  out.push('| Metric | Last 7d | Prior 7d | Δ |');
  out.push('|---|---:|---:|---:|');
  out.push(`| Clicks | ${fmtNum(a.clicks)} | ${fmtNum(b.clicks)} | ${fmtSignedNum(a.clicks - b.clicks)} |`);
  out.push(`| Impressions | ${fmtNum(a.impressions)} | ${fmtNum(b.impressions)} | ${fmtSignedNum(a.impressions - b.impressions)} |`);
  out.push(`| CTR | ${fmtPct(a.ctr)} | ${fmtPct(b.ctr)} | ${fmtSignedPp(a.ctr - b.ctr)} |`);
  out.push(`| Avg position (lower = better) | ${fmtPos(a.avg_position)} | ${fmtPos(b.avg_position)} | ${fmtSignedPos(a.avg_position, b.avg_position)} |`);
  out.push('');

  out.push('## Top Movers (queries with biggest click gain vs prior week)');
  out.push('');
  if (d.movers.length === 0) {
    out.push('_No movers — period A is empty or unchanged._');
  } else {
    out.push('| Query | Clicks 7d | Prior 7d | Δ | Imp 7d |');
    out.push('|---|---:|---:|---:|---:|');
    for (const r of d.movers) {
      out.push(`| ${r.query} | ${r.clicks_a} | ${r.clicks_b} | ${fmtSignedNum(r.delta_clicks)} | ${fmtNum(r.imp_a)} |`);
    }
  }
  out.push('');

  out.push('## Top Losers (queries with biggest click drop vs prior week)');
  out.push('');
  if (d.losers.length === 0) {
    out.push('_No losers — period A is empty or unchanged._');
  } else {
    out.push('| Query | Clicks 7d | Prior 7d | Δ | Imp prior |');
    out.push('|---|---:|---:|---:|---:|');
    for (const r of d.losers) {
      out.push(`| ${r.query} | ${r.clicks_a} | ${r.clicks_b} | ${fmtSignedNum(r.delta_clicks)} | ${fmtNum(r.imp_b)} |`);
    }
  }
  out.push('');

  out.push('## Top Queries (last 7d, by clicks)');
  out.push('');
  if (d.top_queries.length === 0) {
    out.push('_No query data in window._');
  } else {
    out.push('| Query | Clicks | Impressions | CTR | Pos |');
    out.push('|---|---:|---:|---:|---:|');
    for (const r of d.top_queries) {
      out.push(`| ${r.query} | ${r.clicks} | ${fmtNum(r.impressions)} | ${fmtPct(r.ctr)} | ${fmtPos(r.avg_position)} |`);
    }
  }
  out.push('');

  out.push('## Top Pages (last 7d, by clicks)');
  out.push('');
  if (d.top_pages.length === 0) {
    out.push('_No page data in window._');
  } else {
    out.push('| Page | Clicks | Impressions | CTR | Pos |');
    out.push('|---|---:|---:|---:|---:|');
    for (const r of d.top_pages) {
      out.push(`| ${r.page} | ${r.clicks} | ${fmtNum(r.impressions)} | ${fmtPct(r.ctr)} | ${fmtPos(r.avg_position)} |`);
    }
  }
  out.push('');

  out.push('## Sitemap State (most recent 10 events)');
  out.push('');
  if (d.sitemap.length === 0) {
    out.push('_No sitemap activity recorded._');
  } else {
    out.push('| When | Action | Path | Status |');
    out.push('|---|---|---|---|');
    for (const r of d.sitemap) {
      out.push(`| ${new Date(r.performed_at).toISOString()} | ${r.action} | ${r.feedpath} | ${r.status} |`);
    }
  }
  out.push('');

  out.push('## Recent URL Inspections');
  out.push('');
  if (d.inspections.length === 0) {
    out.push('_No URL inspections recorded yet — run `gsc inspect`._');
  } else {
    out.push('| Inspected | Status | Coverage | Last crawl | URL |');
    out.push('|---|---|---|---|---|');
    for (const r of d.inspections) {
      const inspected = new Date(r.inspected_at).toISOString().slice(0, 16) + 'Z';
      const last = r.last_crawl ? new Date(r.last_crawl).toISOString().slice(0, 10) : '—';
      out.push(`| ${inspected} | ${r.index_status || '—'} | ${r.coverage_state || '—'} | ${last} | ${r.url} |`);
    }
  }
  out.push('');

  return out.join('\n');
}

function renderHtml(d) {
  const a = d.totals.current, b = d.totals.prior;
  const css = `
    body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; max-width: 880px; margin: 2em auto; padding: 0 1em; color: #222; }
    h1 { font-size: 1.6em; margin-bottom: 0.2em; }
    h2 { font-size: 1.15em; margin-top: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    .meta { color: #666; font-size: 0.92em; margin-bottom: 1.5em; }
    .meta code { background: #f4f4f4; padding: 1px 5px; border-radius: 3px; }
    table { border-collapse: collapse; width: 100%; margin: 0.5em 0 1em; }
    th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; vertical-align: top; }
    th { background: #fafafa; font-weight: 600; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .delta-pos { color: #0a7d2c; }
    .delta-neg { color: #b3261e; }
    .empty { color: #999; font-style: italic; }
    code, .url { font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
  `;

  const sign = (v) => {
    const n = Number(v) || 0;
    if (n > 0) return 'delta-pos';
    if (n < 0) return 'delta-neg';
    return '';
  };
  // For position, lower is better — flip the class.
  const signPos = (a, b) => {
    if (a == null || b == null) return '';
    const v = Number(b) - Number(a);
    if (v > 0.05) return 'delta-pos';
    if (v < -0.05) return 'delta-neg';
    return '';
  };

  const totalsRows = [
    ['Clicks', fmtNum(a.clicks), fmtNum(b.clicks), fmtSignedNum(a.clicks - b.clicks), sign(a.clicks - b.clicks)],
    ['Impressions', fmtNum(a.impressions), fmtNum(b.impressions), fmtSignedNum(a.impressions - b.impressions), sign(a.impressions - b.impressions)],
    ['CTR', fmtPct(a.ctr), fmtPct(b.ctr), fmtSignedPp(a.ctr - b.ctr), sign(a.ctr - b.ctr)],
    ['Avg position (lower = better)', fmtPos(a.avg_position), fmtPos(b.avg_position), fmtSignedPos(a.avg_position, b.avg_position), signPos(a.avg_position, b.avg_position)],
  ];

  const renderTable = (headers, rows, emptyMsg) => {
    if (rows.length === 0) return `<p class="empty">${escapeHtml(emptyMsg)}</p>`;
    const ths = headers.map(h => `<th${h.num ? ' class="num"' : ''}>${escapeHtml(h.label)}</th>`).join('');
    const trs = rows.map(r => '<tr>' + r.map((cell, i) => {
      const h = headers[i];
      const cls = [h.num ? 'num' : '', cell.cls || ''].filter(Boolean).join(' ');
      const value = typeof cell === 'object' ? cell.value : cell;
      return `<td${cls ? ` class="${cls}"` : ''}>${cell.html ? cell.html : escapeHtml(value)}</td>`;
    }).join('') + '</tr>').join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  };

  const moversTable = renderTable(
    [{ label: 'Query' }, { label: 'Clicks 7d', num: true }, { label: 'Prior 7d', num: true }, { label: 'Δ', num: true }, { label: 'Imp 7d', num: true }],
    d.movers.map(r => [
      r.query,
      String(r.clicks_a),
      String(r.clicks_b),
      { value: fmtSignedNum(r.delta_clicks), cls: sign(r.delta_clicks) },
      fmtNum(r.imp_a),
    ]),
    'No movers — period A is empty or unchanged.'
  );

  const losersTable = renderTable(
    [{ label: 'Query' }, { label: 'Clicks 7d', num: true }, { label: 'Prior 7d', num: true }, { label: 'Δ', num: true }, { label: 'Imp prior', num: true }],
    d.losers.map(r => [
      r.query,
      String(r.clicks_a),
      String(r.clicks_b),
      { value: fmtSignedNum(r.delta_clicks), cls: sign(r.delta_clicks) },
      fmtNum(r.imp_b),
    ]),
    'No losers — period A is empty or unchanged.'
  );

  const topQTable = renderTable(
    [{ label: 'Query' }, { label: 'Clicks', num: true }, { label: 'Impressions', num: true }, { label: 'CTR', num: true }, { label: 'Pos', num: true }],
    d.top_queries.map(r => [r.query, String(r.clicks), fmtNum(r.impressions), fmtPct(r.ctr), fmtPos(r.avg_position)]),
    'No query data in window.'
  );

  const topPTable = renderTable(
    [{ label: 'Page' }, { label: 'Clicks', num: true }, { label: 'Impressions', num: true }, { label: 'CTR', num: true }, { label: 'Pos', num: true }],
    d.top_pages.map(r => [
      { html: `<span class="url">${escapeHtml(r.page)}</span>` },
      String(r.clicks),
      fmtNum(r.impressions),
      fmtPct(r.ctr),
      fmtPos(r.avg_position),
    ]),
    'No page data in window.'
  );

  const sitemapTable = renderTable(
    [{ label: 'When' }, { label: 'Action' }, { label: 'Path' }, { label: 'Status' }],
    d.sitemap.map(r => [
      new Date(r.performed_at).toISOString(),
      r.action,
      r.feedpath,
      r.status,
    ]),
    'No sitemap activity recorded.'
  );

  const inspectionsTable = renderTable(
    [{ label: 'Inspected' }, { label: 'Status' }, { label: 'Coverage' }, { label: 'Last crawl' }, { label: 'URL' }],
    d.inspections.map(r => [
      new Date(r.inspected_at).toISOString().slice(0, 16) + 'Z',
      r.index_status || '—',
      r.coverage_state || '—',
      r.last_crawl ? new Date(r.last_crawl).toISOString().slice(0, 10) : '—',
      { html: `<span class="url">${escapeHtml(r.url)}</span>` },
    ]),
    'No URL inspections recorded yet — run `gsc inspect`.'
  );

  const totalsHtml = `<table><thead><tr><th>Metric</th><th class="num">Last 7d</th><th class="num">Prior 7d</th><th class="num">Δ</th></tr></thead><tbody>` +
    totalsRows.map(([label, av, bv, dv, cls]) => {
      const dCls = ['num', cls].filter(Boolean).join(' ');
      return `<tr><td>${escapeHtml(label)}</td><td class="num">${escapeHtml(av)}</td><td class="num">${escapeHtml(bv)}</td><td class="${dCls}">${escapeHtml(dv)}</td></tr>`;
    }).join('') +
    `</tbody></table>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(d.display_name)} — Weekly SEO Digest</title>
<style>${css}</style>
</head>
<body>
  <h1>${escapeHtml(d.display_name)} — Weekly SEO Digest</h1>
  <div class="meta">
    Site: <code>${escapeHtml(d.site_url)}</code><br>
    Window: ${escapeHtml(d.period.start)} → ${escapeHtml(d.period.end)} (vs ${escapeHtml(d.prior.start)} → ${escapeHtml(d.prior.end)})<br>
    Generated: ${escapeHtml(d.generated_at)}${d.digest_email ? `<br>Recipient hint: ${escapeHtml(d.digest_email)}` : ''}
  </div>

  <h2>Totals</h2>
  ${totalsHtml}

  <h2>Top Movers</h2>
  ${moversTable}

  <h2>Top Losers</h2>
  ${losersTable}

  <h2>Top Queries</h2>
  ${topQTable}

  <h2>Top Pages</h2>
  ${topPTable}

  <h2>Sitemap State</h2>
  ${sitemapTable}

  <h2>Recent URL Inspections</h2>
  ${inspectionsTable}
</body>
</html>
`;
}

function fileSafe(name) {
  return String(name).replace(/[^a-z0-9._-]+/gi, '_');
}

export async function digestCmd({ days, top, site: onlySite, out, json } = {}) {
  const numDays = parseInt(days ?? '7', 10);
  if (!Number.isFinite(numDays) || numDays <= 0) {
    throw new Error('--days must be a positive integer');
  }
  const limit = parseInt(top ?? '10', 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error('--top must be a positive integer');
  }

  // GSC has a ~2-day data lag; window A is the most recent N complete days.
  const aEnd = isoDate(daysAgo(2));
  const aStart = isoDate(daysAgo(2 + numDays - 1));
  const bEnd = isoDate(daysAgo(2 + numDays));
  const bStart = isoDate(daysAgo(2 + 2 * numDays - 1));

  const today = isoDate(new Date());
  const baseDir = out ? path.resolve(out) : path.join(defaultOutDir(), `digest-${today}`);

  await withDb(async (db) => {
    const sites = await activeSites(db, onlySite);
    if (sites.length === 0) {
      if (onlySite) throw new Error(`Site not found in seo_db: ${onlySite}. Run \`gsc pull\` first.`);
      throw new Error('No active sites in seo_db. Run `gsc pull` first.');
    }

    const allDigests = [];
    let succeeded = 0, failed = 0;
    if (!json) {
      console.log(`gsc digest: ${sites.length} site${sites.length === 1 ? '' : 's'}`);
      console.log(`  window A: ${aStart} → ${aEnd}`);
      console.log(`  window B: ${bStart} → ${bEnd}`);
      console.log(`  out: ${baseDir}\n`);
    }

    if (!json) await mkdir(baseDir, { recursive: true });

    for (const site of sites) {
      const runStart = new Date();
      try {
        const d = await buildDigest(db, site, { aStart, aEnd, bStart, bEnd, limit });
        allDigests.push(d);

        if (!json) {
          const stem = fileSafe(site.display_name || site.site_url);
          const mdPath = path.join(baseDir, `${stem}.md`);
          const htmlPath = path.join(baseDir, `${stem}.html`);
          await writeFile(mdPath, renderMarkdown(d), 'utf8');
          await writeFile(htmlPath, renderHtml(d), 'utf8');

          const a = d.totals.current;
          const dClicks = a.clicks - d.totals.prior.clicks;
          console.log(`  ✓ ${(site.display_name || site.site_url).padEnd(28)} clicks ${fmtNum(a.clicks).padStart(6)} (${fmtSignedNum(dClicks)})  → ${path.basename(htmlPath)}`);
        }

        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('digest', $1, $2, now(), $3, 'success', $4)`,
          [site.site_url, runStart.toISOString(), d.top_queries.length + d.top_pages.length,
           JSON.stringify({ aStart, aEnd, bStart, bEnd, clicksA: d.totals.current.clicks, clicksB: d.totals.prior.clicks })]
        );
        succeeded++;
      } catch (err) {
        failed++;
        console.error(`  ✗ ${site.display_name || site.site_url}: ${err.message}`);
        await db.query(
          `insert into gsc_run_log (command, site_url, started_at, finished_at, rows_written, status, detail)
           values ('digest', $1, $2, now(), 0, 'error', $3)`,
          [site.site_url, runStart.toISOString(), JSON.stringify({ error: err.message })]
        ).catch(() => {});
      }
    }

    if (json) {
      console.log(JSON.stringify(allDigests, null, 2));
    } else {
      // Write a top-level INDEX.md so the user has one entry point per week.
      const indexLines = [
        `# Weekly SEO Digest — ${today}`,
        '',
        `Generated ${new Date().toISOString()}.`,
        `Window: ${aStart} → ${aEnd} (vs ${bStart} → ${bEnd})`,
        '',
        `| Site | Clicks 7d | Δ vs prior | Files |`,
        `|---|---:|---:|---|`,
      ];
      for (const d of allDigests.sort((x, y) => y.totals.current.clicks - x.totals.current.clicks)) {
        const stem = fileSafe(d.display_name || d.site_url);
        const dClicks = d.totals.current.clicks - d.totals.prior.clicks;
        indexLines.push(`| ${d.display_name} | ${fmtNum(d.totals.current.clicks)} | ${fmtSignedNum(dClicks)} | [md](${stem}.md) · [html](${stem}.html) |`);
      }
      indexLines.push('');
      await writeFile(path.join(baseDir, 'INDEX.md'), indexLines.join('\n'), 'utf8');

      console.log(`\nDone. ${succeeded} ok, ${failed} fail. Open: ${path.join(baseDir, 'INDEX.md')}`);
    }
  });
}
