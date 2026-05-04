// gsc sitemap list/submit/delete --site <site>
import { listSitemaps, submitSitemap, deleteSitemap } from '../lib/api.mjs';

function fmtDate(s) { return s ? new Date(s).toISOString().slice(0, 10) : '—'; }

// GSC's Sitemaps API rejects path-only feedpaths (e.g. `/sitemap.xml`) with HTTP 400
// for `sc-domain:` properties; it requires a fully-qualified URL. URL-prefix
// properties accept either. Normalize so callers can pass either form for any site.
function normalizeFeedpath(site, feedpath) {
  if (/^https?:\/\//i.test(feedpath)) return feedpath;
  if (site.startsWith('sc-domain:')) {
    const domain = site.slice('sc-domain:'.length);
    return `https://${domain}${feedpath.startsWith('/') ? '' : '/'}${feedpath}`;
  }
  return feedpath;
}

export async function sitemapList({ site, json = false }) {
  if (!site) throw new Error('--site required');
  const sitemaps = await listSitemaps(site);
  if (json) { console.log(JSON.stringify(sitemaps, null, 2)); return; }
  if (sitemaps.length === 0) {
    console.log(`No sitemaps submitted for ${site}.`);
    return;
  }
  console.log(`\nSitemaps for ${site} (${sitemaps.length}):\n`);
  for (const s of sitemaps) {
    const url = s.path;
    const lastSubmitted = fmtDate(s.lastSubmitted);
    const lastDownloaded = fmtDate(s.lastDownloaded);
    const errors = s.errors || 0;
    const warnings = s.warnings || 0;
    const isPending = s.isPending ? ' (pending)' : '';
    const indexed = s.contents?.[0]?.indexed ?? '?';
    const submitted = s.contents?.[0]?.submitted ?? '?';
    const flag = errors > 0 ? '✗' : warnings > 0 ? '!' : '✓';
    console.log(`  ${flag} ${url}${isPending}`);
    console.log(`      submitted=${lastSubmitted}  downloaded=${lastDownloaded}  errors=${errors}  warnings=${warnings}`);
    console.log(`      submittedURLs=${submitted}  indexedURLs=${indexed}  type=${s.type || '?'}`);
  }
  console.log('');
}

export async function sitemapSubmit({ site, feedpath }) {
  if (!site || !feedpath) throw new Error('--site and feedpath required');
  const url = normalizeFeedpath(site, feedpath);
  await submitSitemap(site, url);
  console.log(`✓ Submitted ${url} to ${site}`);
}

export async function sitemapDelete({ site, feedpath }) {
  if (!site || !feedpath) throw new Error('--site and feedpath required');
  const url = normalizeFeedpath(site, feedpath);
  await deleteSitemap(site, url);
  console.log(`✓ Removed ${url} from ${site}`);
}
