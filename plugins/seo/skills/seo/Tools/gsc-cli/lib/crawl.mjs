// crawl.mjs — sitemap fetch + bounded-concurrency page fetch + link extraction.
//
// Used by `gsc crawl` to count inbound internal links per URL on a domain.
// Stays in stdlib: no cheerio, no playwright. Regex-based link extraction
// is sufficient for the "count inbound internal links per URL" task — we
// don't care about JS-rendered content, we care about the shape of the
// linking graph as crawlers see it.

const DEFAULT_CONCURRENCY = 8;
const DEFAULT_TIMEOUT_MS = 15_000;
const USER_AGENT = 'gsc-cli/0.4.0 (+internal-link-diagnostic)';

// Derive an HTTP origin from a site_url. gsc-cli stores both URL-prefix and
// Domain properties; for Domain properties we pick https:// of the apex.
export function originForSite(siteUrl) {
  if (siteUrl.startsWith('sc-domain:')) {
    const host = siteUrl.slice('sc-domain:'.length);
    return `https://${host}`;
  }
  try {
    const u = new URL(siteUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    throw new Error(`Cannot derive origin from site_url: ${siteUrl}`);
  }
}

export function primaryHostForSite(siteUrl) {
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.slice('sc-domain:'.length);
  try { return new URL(siteUrl).host; } catch { return siteUrl; }
}

async function httpGet(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xml;q=0.9,*/*;q=0.8' },
    });
    const body = await res.text();
    return { status: res.status, url: res.url, body, contentType: res.headers.get('content-type') || '' };
  } finally {
    clearTimeout(timer);
  }
}

// Recursive sitemap fetcher. Handles sitemap-index nesting up to 3 levels deep.
export async function fetchSitemap(rootUrl, { depth = 0 } = {}) {
  if (depth > 3) return [];
  const res = await httpGet(rootUrl);
  if (res.status >= 400) throw new Error(`Sitemap fetch failed ${res.status} for ${rootUrl}`);
  const body = res.body;

  // sitemap index?
  if (/<sitemapindex[\s>]/i.test(body)) {
    const urls = Array.from(body.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/gi)).map(m => decodeXmlEntities(m[1].trim()));
    const out = [];
    for (const child of urls) {
      try {
        const childUrls = await fetchSitemap(child, { depth: depth + 1 });
        out.push(...childUrls);
      } catch (e) {
        // Skip broken child sitemaps; the main loop will note the gap.
        console.error(`  warn: child sitemap failed (${child}): ${e.message}`);
      }
    }
    return out;
  }

  // urlset
  const urls = Array.from(body.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/gi)).map(m => decodeXmlEntities(m[1].trim()));
  return urls;
}

function decodeXmlEntities(s) {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

// Extract all <a href="..."> targets from HTML and resolve them against the
// page URL. Returns absolute URLs as strings.
//
// Regex-based on purpose: cheap, no DOM, works against many edge-case markup
// patterns where a strict parser would bail. False positives are filtered
// downstream by the same-host check.
const HREF_RE = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

export function extractLinks(html, pageUrl) {
  const out = new Set();
  const base = new URL(pageUrl);
  for (const m of html.matchAll(HREF_RE)) {
    const raw = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    if (!raw) continue;
    if (raw.startsWith('#')) continue;            // page anchor
    if (raw.startsWith('javascript:')) continue;
    if (raw.startsWith('mailto:')) continue;
    if (raw.startsWith('tel:')) continue;
    try {
      const resolved = new URL(raw, base);
      // Strip fragment, keep query — search engines treat ?foo=bar as a distinct URL.
      resolved.hash = '';
      out.add(resolved.toString());
    } catch {
      // Malformed href — ignore.
    }
  }
  return [...out];
}

// Two URLs are "same site" if their hosts share the same registrable domain.
// For our use, comparing host strings (with optional www. strip) is good enough.
export function sameHost(a, b) {
  const sa = a.replace(/^www\./, '');
  const sb = b.replace(/^www\./, '');
  return sa === sb || sa.endsWith('.' + sb) || sb.endsWith('.' + sa);
}

// Normalize a URL for canonical comparison: drop trailing slash on path (except
// root), drop default port, lowercase host. Query is preserved.
export function canonicalize(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return rawUrl; }
  u.hash = '';
  u.host = u.host.toLowerCase();
  if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
    u.port = '';
  }
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.slice(0, -1);
  }
  return u.toString();
}

// Bounded-concurrency map. fn is called with each item; returns array of results
// in input order. Resolves even if individual fns reject (errors captured as
// { error } entries) so the caller can audit per-URL failures.
export async function pmap(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = { value: await fn(items[i], i) };
      } catch (e) {
        results[i] = { error: e };
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// Top-level crawl: fetch the sitemap, fetch each URL, extract links, count
// inbound per URL. Returns a structure suitable for DB insert.
//
// host = the same-host filter (anything off-host is treated as external and
// not counted).
export async function runCrawl({ sitemapUrl, host, concurrency = DEFAULT_CONCURRENCY, log = () => {} }) {
  log(`Fetching sitemap: ${sitemapUrl}`);
  const sitemapUrls = await fetchSitemap(sitemapUrl);
  log(`Sitemap returned ${sitemapUrls.length} URLs`);

  // De-dupe + canonicalize.
  const seen = new Set();
  const urlsToCrawl = [];
  for (const raw of sitemapUrls) {
    const c = canonicalize(raw);
    if (seen.has(c)) continue;
    seen.add(c);
    try {
      const u = new URL(c);
      if (sameHost(u.host, host)) urlsToCrawl.push(c);
    } catch {/* ignore */}
  }
  log(`Crawling ${urlsToCrawl.length} unique on-host URLs (concurrency=${concurrency})`);

  const inbound = new Map();          // url -> count
  const outboundCount = new Map();    // url -> count
  const httpStatus = new Map();       // url -> int
  const inSitemap = new Set(urlsToCrawl);

  // Seed inbound with 0 for every sitemap URL so we get rows even for pages
  // that nothing links to (those are exactly the starved pages we want to find).
  for (const u of urlsToCrawl) inbound.set(u, 0);

  let fetched = 0;
  let failed = 0;
  const fetchResults = await pmap(urlsToCrawl, concurrency, async (pageUrl) => {
    const res = await httpGet(pageUrl);
    return { pageUrl, ...res };
  });

  for (const r of fetchResults) {
    if (r.error) { failed++; continue; }
    const { pageUrl, status, body, contentType } = r.value;
    httpStatus.set(pageUrl, status);
    if (status >= 400 || !contentType.includes('html')) { failed++; continue; }
    fetched++;

    const links = extractLinks(body, pageUrl)
      .map(canonicalize)
      .filter(target => {
        try { return sameHost(new URL(target).host, host); }
        catch { return false; }
      });

    outboundCount.set(pageUrl, links.length);
    const uniqueTargets = new Set(links);
    for (const target of uniqueTargets) {
      // Increment inbound for the target. Targets seen outside the sitemap
      // (e.g. paginated URLs) also get rows.
      inbound.set(target, (inbound.get(target) ?? 0) + 1);
    }
  }

  // Build rows for the DB.
  const rows = [];
  const allUrls = new Set([...inbound.keys(), ...inSitemap]);
  for (const url of allUrls) {
    rows.push({
      url,
      inbound_count: inbound.get(url) ?? 0,
      outbound_count: outboundCount.get(url) ?? 0,
      in_sitemap: inSitemap.has(url),
      http_status: httpStatus.get(url) ?? null,
    });
  }

  return {
    sitemap_url: sitemapUrl,
    urls_attempted: urlsToCrawl.length,
    urls_fetched: fetched,
    urls_failed: failed,
    rows,
  };
}
