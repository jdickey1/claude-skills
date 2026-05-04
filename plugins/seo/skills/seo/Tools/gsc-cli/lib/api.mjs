// api.mjs — thin wrappers over GSC + Indexing APIs

import { getAccessToken } from './auth.mjs';

const WEBMASTERS = 'https://www.googleapis.com/webmasters/v3';
const SEARCHCONSOLE = 'https://searchconsole.googleapis.com/v1';

async function callJson(url, opts = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const token = await getAccessToken();
    const r = await fetch(url, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    });
    if (r.status === 429 || r.status >= 500) {
      const wait = 2 ** attempt * 500;
      await new Promise(res => setTimeout(res, wait));
      continue;
    }
    if (r.status === 204) return null;
    const body = await r.text();
    let parsed = null;
    try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
    if (!r.ok) {
      const err = new Error(`HTTP ${r.status} ${url}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
      err.status = r.status;
      err.body = parsed;
      throw err;
    }
    return parsed;
  }
  throw new Error(`Exhausted retries for ${url}`);
}

// ── Sites API ──
export async function listSites() {
  const data = await callJson(`${WEBMASTERS}/sites`);
  return data.siteEntry || [];
}

export async function deleteSite(siteUrl) {
  return callJson(
    `${WEBMASTERS}/sites/${encodeURIComponent(siteUrl)}`,
    { method: 'DELETE' }
  );
}

// ── Sitemaps API ──
export async function listSitemaps(siteUrl) {
  const data = await callJson(`${WEBMASTERS}/sites/${encodeURIComponent(siteUrl)}/sitemaps`);
  return data.sitemap || [];
}

export async function submitSitemap(siteUrl, feedpath) {
  return callJson(
    `${WEBMASTERS}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`,
    { method: 'PUT' }
  );
}

export async function deleteSitemap(siteUrl, feedpath) {
  return callJson(
    `${WEBMASTERS}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`,
    { method: 'DELETE' }
  );
}

// ── Search Analytics API ──
// dimensions: array of 'query'|'page'|'country'|'device'|'searchAppearance'|'date'
export async function searchAnalytics(siteUrl, { startDate, endDate, dimensions, rowLimit = 25000, startRow = 0, type = 'web', dataState = 'final' }) {
  return callJson(`${WEBMASTERS}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, startRow, type, dataState }),
  });
}

// Iterate all rows for a query (paginate over startRow until empty)
export async function* searchAnalyticsAll(siteUrl, params) {
  let startRow = 0;
  const pageSize = params.rowLimit || 25000;
  for (;;) {
    const page = await searchAnalytics(siteUrl, { ...params, startRow, rowLimit: pageSize });
    const rows = page.rows || [];
    for (const row of rows) yield row;
    if (rows.length < pageSize) return;
    startRow += rows.length;
  }
}

// ── URL Inspection API ──
export async function inspectUrl(siteUrl, inspectionUrl, languageCode = 'en-US') {
  return callJson(`${SEARCHCONSOLE}/urlInspection/index:inspect`, {
    method: 'POST',
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode }),
  });
}

// ── Indexing API (best-effort; officially scoped to JobPosting/BroadcastEvent) ──
export async function notifyUrlUpdate(url) {
  return callJson('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  });
}

export async function notifyUrlDelete(url) {
  return callJson('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    body: JSON.stringify({ url, type: 'URL_DELETED' }),
  });
}
