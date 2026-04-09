#!/usr/bin/env node
// keyword-cluster.mjs
// Clusters keywords by SERP overlap using Jaccard similarity + union-find.
// Output: data/seo/YYYY-MM-DD/clusters.json

import { writeFileSync, mkdirSync, existsSync, appendFileSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH;
const DATA_DIR = process.env.SEO_DATA_DIR || 'data/seo';

// --- CLI Args ---

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const inputPath    = getArg('--input');
const profilePath  = getArg('--profile');
const threshold    = parseFloat(getArg('--threshold') || '0.6');
const maxKeywords  = parseInt(getArg('--max-keywords') || '500', 10);
const force        = args.includes('--force');

// --- Utilities ---

function today() {
  return new Date().toISOString().split('T')[0];
}

function outDir() {
  const dir = join(DATA_DIR, today());
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  appendFileSync(join(outDir(), 'keyword-cluster.log'), line + '\n');
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429 || response.status >= 500) {
        const wait = Math.pow(2, attempt) * 1000;
        log(`HTTP ${response.status}. Retry ${attempt}/${retries} in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
      }

      return await response.json();
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = Math.pow(2, attempt) * 1000;
      log(`Request failed: ${err.message}. Retry ${attempt}/${retries} in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// --- Union-Find ---

class UnionFind {
  constructor(elements) {
    this.parent = {};
    this.rank = {};
    for (const el of elements) {
      this.parent[el] = el;
      this.rank[el] = 0;
    }
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;

    // merge by rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
    return true;
  }
}

// --- Input Resolution ---

function resolveInputPath() {
  if (inputPath) {
    const p = resolve(inputPath);
    if (!existsSync(p)) {
      console.error(`ERROR: --input file not found: ${p}`);
      console.error('Run keyword-universe.mjs first to generate keyword-universe-filtered.json');
      process.exit(1);
    }
    return p;
  }

  // Auto-discover: list subdirectories of DATA_DIR matching YYYY-MM-DD
  if (!existsSync(DATA_DIR)) {
    console.error(`ERROR: Data directory not found: ${DATA_DIR}`);
    console.error('Run keyword-universe.mjs first to generate keyword-universe-filtered.json');
    process.exit(1);
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const dateDirs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && datePattern.test(d.name))
    .map(d => d.name)
    .sort()
    .reverse();

  for (const dir of dateDirs) {
    const candidate = join(DATA_DIR, dir, 'keyword-universe-filtered.json');
    if (existsSync(candidate)) return candidate;
  }

  console.error('ERROR: keyword-universe-filtered.json not found in any data/seo/YYYY-MM-DD/ directory.');
  console.error('Run keyword-universe.mjs first to generate it.');
  process.exit(1);
}

function resolveProfile() {
  const candidates = [
    profilePath ? resolve(profilePath) : null,
    process.env.SEO_PROFILE_PATH ? resolve(process.env.SEO_PROFILE_PATH) : null,
    resolve('seo-profile.json')
  ].filter(Boolean);

  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, 'utf8'));
      } catch (err) {
        console.error(`ERROR: Failed to parse profile at ${p}: ${err.message}`);
        process.exit(1);
      }
    }
  }

  return null; // profile is optional (page mapping simply won't match)
}

// --- SERP Fetch ---

async function fetchSerp(keyword) {
  const data = await fetchWithRetry('https://api.dataforseo.com/v3/serp/google/organic/live', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${DATAFORSEO_AUTH}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      keyword,
      language_code: 'en',
      location_code: 2840,
      depth: 10
    }])
  });

  const items = data?.tasks?.[0]?.result?.[0]?.items || [];
  const urls = items
    .filter(item => item.url)
    .map(item => item.url);

  return urls;
}

// --- Main ---

async function main() {
  if (!DATAFORSEO_AUTH) {
    console.error('ERROR: DATAFORSEO_AUTH not set.');
    console.error('Set it as Base64-encoded "login:password" from your DataforSEO account.');
    process.exit(1);
  }

  // Phase 0 — Input resolution and cost gate

  const filteredPath = resolveInputPath();
  log(`Reading keywords from: ${filteredPath}`);

  let filteredData;
  try {
    filteredData = JSON.parse(readFileSync(filteredPath, 'utf8'));
  } catch (err) {
    console.error(`ERROR: Failed to parse ${filteredPath}: ${err.message}`);
    process.exit(1);
  }

  // Support both array-of-objects and {keywords: [...]} formats
  const allKeywords = Array.isArray(filteredData)
    ? filteredData
    : (filteredData.keywords || []);

  if (allKeywords.length === 0) {
    console.error('ERROR: No keywords found in input file.');
    console.error('Run keyword-universe.mjs first to generate keyword-universe-filtered.json');
    process.exit(1);
  }

  const keywords = allKeywords.slice(0, maxKeywords);
  const count = keywords.length;

  const estimatedCost = count * 0.002;
  log(`Loaded ${count} keywords (capped at ${maxKeywords}). Estimated cost: $${estimatedCost.toFixed(2)}`);

  if (estimatedCost > 5 && !force) {
    console.error(`ERROR: Estimated cost $${estimatedCost.toFixed(2)} exceeds $5.00 limit.`);
    console.error('Use --force to proceed anyway, or --max-keywords to reduce the count.');
    process.exit(1);
  }

  const profile = resolveProfile();
  const siteUrl = profile?.siteUrl || null;
  if (siteUrl) {
    log(`Site URL for page mapping: ${siteUrl}`);
  } else {
    log('No seo-profile.json found — page mapping will mark all clusters as new_page_candidate');
  }

  // Phase 1 — Fetch SERPs

  log(`Phase 1: Fetching SERPs for ${count} keywords...`);

  const serps = new Map(); // keyword -> Set<url>

  for (let i = 0; i < keywords.length; i++) {
    const kwObj = keywords[i];
    const keyword = typeof kwObj === 'string' ? kwObj : kwObj.keyword;

    try {
      const urls = await fetchSerp(keyword);

      if (urls.length === 0) {
        log(`  WARNING: No SERP results for "${keyword}" — skipping`);
      } else {
        serps.set(keyword, new Set(urls));
      }
    } catch (err) {
      log(`  WARNING: Failed to fetch SERP for "${keyword}": ${err.message} — skipping`);
    }

    if ((i + 1) % 50 === 0) {
      log(`  Progress: ${i + 1}/${count} keywords fetched`);
    }

    // 100ms delay between requests (rate limit: 2000/min, 30 concurrent)
    await new Promise(r => setTimeout(r, 100));
  }

  const validKeywords = [...serps.keys()];
  log(`Phase 1 complete: ${validKeywords.length}/${count} keywords returned SERP results`);

  // Phase 2 — Jaccard clustering with union-find

  log(`Phase 2: Computing Jaccard similarity and clustering (threshold: ${threshold})...`);

  const uf = new UnionFind(validKeywords);

  const n = validKeywords.length;
  const totalPairs = (n * (n - 1)) / 2;
  let pairsChecked = 0;
  let mergesPerformed = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const kwI = validKeywords[i];
      const kwJ = validKeywords[j];
      const urlsI = serps.get(kwI);
      const urlsJ = serps.get(kwJ);

      const intersection = new Set([...urlsI].filter(u => urlsJ.has(u)));
      const union = new Set([...urlsI, ...urlsJ]);
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;

      if (jaccard >= threshold) {
        if (uf.union(kwI, kwJ)) mergesPerformed++;
      }

      pairsChecked++;
      if (pairsChecked % 10000 === 0) {
        log(`  Pairs checked: ${pairsChecked.toLocaleString()}/${totalPairs.toLocaleString()} — merges so far: ${mergesPerformed}`);
      }
    }
  }

  log(`Phase 2 complete: ${pairsChecked.toLocaleString()} pairs checked, ${mergesPerformed} merges`);

  // Phase 3 — Cluster assembly

  log('Phase 3: Assembling clusters...');

  // Build a volume map from the input (support {keyword, volume} objects)
  const volumeMap = new Map();
  for (const kwObj of keywords) {
    if (typeof kwObj === 'object' && kwObj.keyword) {
      volumeMap.set(kwObj.keyword, kwObj.volume || 0);
    }
  }

  // Group keywords by union-find root
  const groups = new Map(); // root -> [keyword, ...]
  for (const kw of validKeywords) {
    const root = uf.find(kw);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(kw);
  }

  // Build cluster objects
  let clusterList = [];
  for (const [, members] of groups) {
    // Sort members by volume descending to pick primary
    const membersWithVol = members.map(kw => ({
      keyword: kw,
      volume: volumeMap.get(kw) || 0
    }));
    membersWithVol.sort((a, b) => b.volume - a.volume);

    const primaryKeyword = membersWithVol[0].keyword;
    const totalVolume = membersWithVol.reduce((sum, m) => sum + m.volume, 0);

    clusterList.push({
      primaryKeyword,
      totalVolume,
      keywords: membersWithVol,
      members // raw list for SERP lookup
    });
  }

  // Sort by totalVolume descending, assign IDs
  clusterList.sort((a, b) => b.totalVolume - a.totalVolume);
  clusterList = clusterList.map((c, idx) => ({ ...c, id: idx + 1 }));

  log(`Phase 3 complete: ${clusterList.length} clusters assembled`);

  // Phase 4 — Page mapping

  log('Phase 4: Page mapping...');

  const clusters = clusterList.map(cluster => {
    let pageMapping = { status: 'new_page_candidate' };

    if (siteUrl) {
      // Collect all SERP URLs from all keywords in this cluster
      outer:
      for (const kw of cluster.members) {
        const urls = serps.get(kw);
        if (!urls) continue;
        for (const url of urls) {
          if (url.includes(siteUrl)) {
            pageMapping = { status: 'existing', url };
            break outer;
          }
        }
      }
    }

    return {
      id: cluster.id,
      primaryKeyword: cluster.primaryKeyword,
      totalVolume: cluster.totalVolume,
      keywords: cluster.keywords,
      pageMapping
    };
  });

  log('Phase 4 complete');

  // Phase 5 — Output

  const totalClusters = clusters.length;
  const singletons = clusters.filter(c => c.keywords.length === 1).length;

  const output = {
    generated: new Date().toISOString(),
    threshold,
    totalKeywords: count,
    totalClusters,
    siteUrl: siteUrl || null,
    clusters
  };

  const outPath = join(outDir(), 'clusters.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  log(`Wrote ${totalClusters} clusters to ${outPath}`);

  // Console summary
  console.log('\n' + '='.repeat(80));
  console.log('KEYWORD CLUSTERING SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Keywords processed : ${count}`);
  console.log(`  Keywords with SERPs: ${validKeywords.length}`);
  console.log(`  Total clusters     : ${totalClusters}`);
  console.log(`  Threshold          : ${threshold}`);
  console.log(`  Singletons         : ${singletons}`);
  console.log('');
  console.log('TOP 10 CLUSTERS:\n');

  const header = 'Primary Keyword'.padEnd(45) + ' | Members | Volume  | Page Mapping';
  console.log(`  ${header}`);
  console.log('  ' + '-'.repeat(header.length));

  clusters.slice(0, 10).forEach(c => {
    const kw      = c.primaryKeyword.padEnd(45);
    const members = String(c.keywords.length).padStart(7);
    const vol     = String(c.totalVolume).padStart(7);
    const mapping = c.pageMapping.status === 'existing'
      ? `existing — ${c.pageMapping.url}`
      : 'new page candidate';
    console.log(`  ${kw} | ${members} | ${vol} | ${mapping}`);
  });

  console.log('');

  log('Done');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
