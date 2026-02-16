#!/usr/bin/env node
// keyword-research.mjs
// Expands seed keywords into 200-300 variations with volume, CPC, and competition data.
// Output: data/seo/YYYY-MM-DD/keywords.json

import { writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.KEYWORDS_EVERYWHERE_API_KEY;
const BASE_URL = 'https://api.keywordseverywhere.com/v1';
const DATA_DIR = process.env.SEO_DATA_DIR || 'data/seo';
const BATCH_SIZE = 100; // API limit per request

// Replace with your keywords
const SEED_KEYWORDS = [
  "your service keyword 1",
  "your service keyword 2",
  "your service + city",
];

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
  const logFile = join(outDir(), 'keyword-research.log');
  appendFileSync(logFile, line + '\n');
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const wait = Math.pow(2, attempt) * 1000;
        log(`Rate limited (429). Waiting ${wait}ms before retry ${attempt}/${retries}`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (response.status >= 500) {
        const wait = Math.pow(2, attempt) * 1000;
        log(`Server error (${response.status}). Waiting ${wait}ms before retry ${attempt}/${retries}`);
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

// --- API Calls ---

async function getKeywordData(keywords) {
  const formData = new URLSearchParams();
  formData.append('country', 'us');
  formData.append('currency', 'usd');
  formData.append('dataSource', 'gkp');
  keywords.forEach(kw => formData.append('kw[]', kw));

  return fetchWithRetry(`${BASE_URL}/get_keyword_data`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });
}

async function getRelatedKeywords(seed) {
  const formData = new URLSearchParams();
  formData.append('country', 'us');
  formData.append('currency', 'usd');
  formData.append('dataSource', 'gkp');
  formData.append('kw', seed);

  return fetchWithRetry(`${BASE_URL}/get_related_keywords`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });
}

// --- Main ---

async function main() {
  if (!API_KEY) {
    console.error('ERROR: KEYWORDS_EVERYWHERE_API_KEY not set. See .env.example');
    process.exit(1);
  }

  log(`Starting keyword research with ${SEED_KEYWORDS.length} seed keywords`);

  // Phase 1: Expand seeds into related keywords
  const allKeywords = new Set(SEED_KEYWORDS);

  for (const seed of SEED_KEYWORDS) {
    try {
      log(`Expanding: "${seed}"`);
      const related = await getRelatedKeywords(seed);
      const before = allKeywords.size;
      related.data?.forEach(kw => allKeywords.add(kw.keyword));
      log(`  +${allKeywords.size - before} keywords (total: ${allKeywords.size})`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      log(`  FAILED to expand "${seed}": ${err.message}`);
    }
  }

  log(`Expansion complete: ${allKeywords.size} unique keywords`);

  // Phase 2: Get full data in batches
  const keywordList = [...allKeywords];
  const allResults = [];

  for (let i = 0; i < keywordList.length; i += BATCH_SIZE) {
    const batch = keywordList.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(keywordList.length / BATCH_SIZE);

    try {
      log(`Fetching data batch ${batchNum}/${totalBatches} (${batch.length} keywords)`);
      const result = await getKeywordData(batch);
      if (result.data) allResults.push(...result.data);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      log(`  FAILED batch ${batchNum}: ${err.message}`);
    }
  }

  // Phase 3: Sort and output
  const sorted = allResults.sort((a, b) => (b.vol || 0) - (a.vol || 0));

  const output = {
    generated: new Date().toISOString(),
    seedKeywords: SEED_KEYWORDS,
    totalExpanded: allKeywords.size,
    totalWithData: sorted.length,
    keywords: sorted.map(kw => ({
      keyword: kw.keyword,
      volume: kw.vol || 0,
      cpc: kw.cpc?.value || null,
      competition: kw.competition || null,
      trend: kw.trend || null
    }))
  };

  // Write JSON
  const outPath = join(outDir(), 'keywords.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  log(`Wrote ${sorted.length} keywords to ${outPath}`);

  // Console summary
  console.log('\nTOP KEYWORDS BY VOLUME:\n');
  sorted.slice(0, 30).forEach(kw => {
    const vol = String(kw.vol || 0).padStart(6);
    const cpc = kw.cpc?.value ? `$${kw.cpc.value}` : '  --';
    console.log(`  ${kw.keyword.padEnd(45)} | Vol: ${vol} | CPC: ${cpc}`);
  });

  log('Done');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
