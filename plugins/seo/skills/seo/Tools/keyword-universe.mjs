#!/usr/bin/env node
// keyword-universe.mjs
// Expands seed keywords via DataforSEO, scores by business relevance, and outputs filtered universe.
// Output: data/seo/YYYY-MM-DD/keyword-universe.json + keyword-universe-filtered.json

import { writeFileSync, mkdirSync, existsSync, appendFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH;
const DATA_DIR = process.env.SEO_DATA_DIR || 'data/seo';

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
  appendFileSync(join(outDir(), 'keyword-universe.log'), line + '\n');
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        throw new Error('HTTP 401: Authentication failed. Check DATAFORSEO_AUTH (must be Base64-encoded login:password).');
      }

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
      if (err.message.startsWith('HTTP 401')) throw err;
      if (attempt === retries) throw err;
      const wait = Math.pow(2, attempt) * 1000;
      log(`Request failed: ${err.message}. Retry ${attempt}/${retries} in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// --- Profile resolution ---

function resolveProfilePath() {
  // 1. --profile CLI flag
  const profileFlagIdx = process.argv.indexOf('--profile');
  if (profileFlagIdx !== -1 && process.argv[profileFlagIdx + 1]) {
    return resolve(process.argv[profileFlagIdx + 1]);
  }
  // 2. SEO_PROFILE_PATH env var
  if (process.env.SEO_PROFILE_PATH) {
    return resolve(process.env.SEO_PROFILE_PATH);
  }
  // 3. Default: cwd/seo-profile.json
  return resolve(process.cwd(), 'seo-profile.json');
}

function loadProfile() {
  const path = resolveProfilePath();
  if (!existsSync(path)) {
    console.error(`ERROR: Profile not found at ${path}`);
    console.error('Copy and edit seo-profile.example.json to create your profile.');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

// --- API ---

async function expandSeed(seed) {
  const data = await fetchWithRetry(
    'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DATAFORSEO_AUTH}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keyword: seed,
        language_code: 'en',
        location_code: 2840,
        limit: 500
      }])
    }
  );

  return data.tasks?.[0]?.result?.[0]?.items || [];
}

// --- Scoring ---

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRelevanceScorer(profile) {
  const products = (profile.business?.products || []).map(p => new RegExp(`\\b${escapeRegex(p)}\\b`, 'i'));
  const location = profile.targetLocation
    ? new RegExp(`\\b${escapeRegex(profile.targetLocation)}\\b`, 'i')
    : null;
  const irrelevant = (profile.irrelevantTopics || []).map(t => new RegExp(`\\b${escapeRegex(t)}\\b`, 'i'));

  return function score(keyword) {
    let s = 0;
    if (products.some(re => re.test(keyword))) s += 1;
    if (location && location.test(keyword)) s += 1;
    if (irrelevant.some(re => re.test(keyword))) s -= 1;
    return s;
  };
}

// --- Main ---

async function main() {
  if (!DATAFORSEO_AUTH) {
    console.error('ERROR: DATAFORSEO_AUTH not set.');
    console.error('Set it to Base64-encoded "login:password" from your DataforSEO account.');
    console.error('  export DATAFORSEO_AUTH=$(echo -n "user@example.com:yourpassword" | base64)');
    process.exit(1);
  }

  const profile = loadProfile();
  const seeds = profile.seeds || [];

  if (seeds.length === 0) {
    console.error('ERROR: No seeds found in profile. Add a "seeds" array to seo-profile.json.');
    process.exit(1);
  }

  log(`Loaded profile with ${seeds.length} seeds`);
  log(`Starting keyword universe expansion`);

  // Phase 1 — Seed expansion
  const kwMap = new Map(); // keyword string -> { volume, cpc, competition }

  for (const seed of seeds) {
    try {
      log(`Expanding seed: "${seed}"`);
      const items = await expandSeed(seed);

      if (items.length === 0) {
        log(`  WARNING: seed "${seed}" returned 0 results, skipping`);
      } else {
        let added = 0;
        for (const item of items) {
          const kw = item.keyword;
          if (kw && !kwMap.has(kw)) {
            kwMap.set(kw, {
              volume: item.keyword_info?.search_volume ?? 0,
              cpc: item.keyword_info?.cpc ?? null,
              competition: item.keyword_info?.competition_level ?? null
            });
            added++;
          }
        }
        log(`  ${items.length} returned, ${added} new (total unique: ${kwMap.size})`);
      }
    } catch (err) {
      log(`  FAILED to expand "${seed}": ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  log(`Expansion complete: ${kwMap.size} unique keywords discovered`);

  // Phase 2 — Business relevance scoring
  const scoreKw = buildRelevanceScorer(profile);

  const allKeywords = [...kwMap.entries()].map(([keyword, meta]) => ({
    keyword,
    volume: meta.volume,
    cpc: meta.cpc,
    competition: meta.competition,
    relevanceScore: scoreKw(keyword)
  }));

  // Full set sorted by relevance desc, then volume desc
  allKeywords.sort((a, b) =>
    b.relevanceScore - a.relevanceScore || b.volume - a.volume
  );

  // Filtered: exclude score -1
  const filteredKeywords = allKeywords.filter(kw => kw.relevanceScore >= 0);

  log(`Relevance scoring complete: ${filteredKeywords.length} kept, ${allKeywords.length - filteredKeywords.length} excluded`);

  // Phase 3 — Output
  const generated = new Date().toISOString();

  const universeOutput = {
    generated,
    seedCount: seeds.length,
    totalDiscovered: allKeywords.length,
    totalFiltered: filteredKeywords.length,
    keywords: allKeywords
  };

  const filteredOutput = {
    generated,
    seedCount: seeds.length,
    totalDiscovered: allKeywords.length,
    totalFiltered: filteredKeywords.length,
    keywords: filteredKeywords
  };

  const universePath = join(outDir(), 'keyword-universe.json');
  const filteredPath = join(outDir(), 'keyword-universe-filtered.json');

  writeFileSync(universePath, JSON.stringify(universeOutput, null, 2));
  log(`Wrote ${allKeywords.length} keywords to ${universePath}`);

  writeFileSync(filteredPath, JSON.stringify(filteredOutput, null, 2));
  log(`Wrote ${filteredKeywords.length} filtered keywords to ${filteredPath}`);

  // Console summary
  console.log(`\nKEYWORD UNIVERSE SUMMARY:`);
  console.log(`  Total discovered : ${allKeywords.length}`);
  console.log(`  After filtering  : ${filteredKeywords.length}`);
  console.log(`  Excluded (-1)    : ${allKeywords.length - filteredKeywords.length}`);

  console.log('\nTOP 30 KEYWORDS BY VOLUME:\n');
  const top30 = [...filteredKeywords].sort((a, b) => b.volume - a.volume).slice(0, 30);
  top30.forEach(kw => {
    const vol = String(kw.volume).padStart(7);
    const cpc = kw.cpc != null ? `$${Number(kw.cpc).toFixed(2)}` : '  --';
    const rel = String(kw.relevanceScore).padStart(2);
    console.log(`  ${kw.keyword.padEnd(50)} | Vol: ${vol} | CPC: ${cpc.padStart(6)} | Rel: ${rel}`);
  });

  const serpCost = (filteredKeywords.length * 0.002).toFixed(2);
  console.log(`\nEstimated SERP clustering cost (Live queue): $${serpCost} (${filteredKeywords.length} keywords × $0.002)`);

  log('Done');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
