// bwt.mjs — Bing Webmaster Tools API client.
//
// Auth: BWT issues a per-account API key via Settings → API Access in the
// Webmaster Tools UI. Pass it via env var BWT_API_KEY (stored in keychain or
// shell rc; do not commit). The key authorizes access to every property the
// account owns/manages.
//
// Endpoint base:
//   https://ssl.bing.com/webmaster/api.svc/json/<Method>?apikey=<key>
//
// We use a small subset of the documented JSON API:
//   GetUserSites               (account-level — owned/verified sites)
//   GetPageStats               (per-site, last 6 months daily totals)
//   GetPageQueryStats          (per-site, page-query joins)
//   GetQueryStats              (per-site, query-level totals)
//
// AI Performance (Feb 2026 public preview) is currently surfaced in the BWT
// GUI only. The JSON API has no documented method yet; when Microsoft ships
// one, add it here and write to bwt_perf with source='copilot'/'ai_grounding'.
//
// Reference: https://learn.microsoft.com/en-us/bingwebmaster/

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';

function apiKey() {
  const k = process.env.BWT_API_KEY;
  if (!k) {
    const err = new Error('BWT_API_KEY env var not set');
    err.code = 'BWT_NO_KEY';
    throw err;
  }
  return k;
}

async function call(method, params = {}) {
  const url = new URL(`${BASE}/${method}`);
  url.searchParams.set('apikey', apiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`BWT ${method} HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getUserSites() {
  const r = await call('GetUserSites');
  return r.d ?? [];
}

// GetPageStats returns per-day clicks/impressions for a site.
export async function getPageStats(siteUrl) {
  const r = await call('GetPageStats', { siteUrl });
  return r.d ?? [];
}

export async function getQueryStats(siteUrl) {
  const r = await call('GetQueryStats', { siteUrl });
  return r.d ?? [];
}

// GetPageQueryStats returns rows of (page, query) joins for a site.
export async function getPageQueryStats(siteUrl) {
  const r = await call('GetPageQueryStats', { siteUrl });
  return r.d ?? [];
}

// Probe: did the auth + base path even work? Used by `gsc bwt status`.
export async function probe() {
  try {
    const sites = await getUserSites();
    return { ok: true, site_count: sites.length };
  } catch (e) {
    return { ok: false, error: e.message, code: e.code || null };
  }
}
