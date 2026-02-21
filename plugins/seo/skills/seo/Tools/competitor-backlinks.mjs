#!/usr/bin/env node
// competitor-backlinks.mjs
// Scans competitor backlinks and identifies link building opportunities.
// Output: data/seo/YYYY-MM-DD/backlinks.json

import { writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH;
const DATA_DIR = process.env.SEO_DATA_DIR || 'data/seo';

// Replace with your competitors
const COMPETITORS = [
  'competitor1.com',
  'competitor2.com',
  'competitor3.com',
  'competitor4.com',
  'competitor5.com'
];

const SKIP_DOMAINS = [
  'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com',
  'instagram.com', 'pinterest.com', 'reddit.com', 'tiktok.com',
  'g2.com', 'capterra.com', 'trustpilot.com', 'crunchbase.com',
  'wikipedia.org', 'bbb.org'
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
  appendFileSync(join(outDir(), 'competitor-backlinks.log'), line + '\n');
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

// --- API ---

async function getBacklinks(domain, limit = 100) {
  const data = await fetchWithRetry('https://api.dataforseo.com/v3/backlinks/backlinks/live', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${DATAFORSEO_AUTH}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      target: domain,
      limit,
      mode: 'as_is',
      filters: [
        ['dofollow', '=', true],
        'and',
        ['domain_from_rank', '>', 20]
      ],
      order_by: ['domain_from_rank,desc']
    }])
  });

  return data.tasks?.[0]?.result?.[0]?.items || [];
}

function filterBacklinks(backlinks) {
  return backlinks.filter(bl => {
    const domain = bl.domain_from || '';
    if (SKIP_DOMAINS.some(d => domain.includes(d))) return false;
    const url = bl.url_from || '';
    return /\/(blog|post|article|guide|best|top|review|list|comparison|roundup|resource)/i.test(url);
  });
}

// --- Main ---

async function main() {
  if (!DATAFORSEO_AUTH) {
    console.error('ERROR: DATAFORSEO_AUTH not set. See .env.example');
    process.exit(1);
  }

  log(`Starting backlink scan for ${COMPETITORS.length} competitors`);

  const allOpportunities = [];
  const domainOverlap = {}; // track domains linking to multiple competitors

  for (const competitor of COMPETITORS) {
    try {
      log(`Scanning ${competitor}...`);
      const backlinks = await getBacklinks(competitor);
      log(`  ${backlinks.length} raw backlinks found`);

      const filtered = filterBacklinks(backlinks);
      log(`  ${filtered.length} after filtering`);

      filtered.forEach(bl => {
        const domain = bl.domain_from;

        // Track overlap
        if (!domainOverlap[domain]) domainOverlap[domain] = new Set();
        domainOverlap[domain].add(competitor);

        allOpportunities.push({
          competitor,
          domain,
          url: bl.url_from,
          domainRank: bl.domain_from_rank || 0,
          anchor: bl.anchor || '',
          firstSeen: bl.first_seen || null
        });
      });

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      log(`  FAILED to scan ${competitor}: ${err.message}`);
    }
  }

  // Sort by domain rank
  allOpportunities.sort((a, b) => b.domainRank - a.domainRank);

  // Identify overlap targets (link to 2+ competitors = warm lead)
  const overlapTargets = Object.entries(domainOverlap)
    .filter(([, comps]) => comps.size >= 2)
    .map(([domain, comps]) => ({ domain, competitorCount: comps.size, competitors: [...comps] }))
    .sort((a, b) => b.competitorCount - a.competitorCount);

  const output = {
    generated: new Date().toISOString(),
    competitors: COMPETITORS,
    totalOpportunities: allOpportunities.length,
    opportunities: allOpportunities,
    overlapTargets
  };

  const outPath = join(outDir(), 'backlinks.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  log(`Wrote ${allOpportunities.length} opportunities to ${outPath}`);

  // Console summary
  console.log('\nTOP BACKLINK OPPORTUNITIES:\n');
  allOpportunities.slice(0, 20).forEach(opp => {
    console.log(`  DR ${String(opp.domainRank).padStart(3)} | ${opp.domain}`);
    console.log(`         URL: ${opp.url}`);
    console.log(`         Links to: ${opp.competitor}\n`);
  });

  if (overlapTargets.length > 0) {
    console.log('\nOVERLAP TARGETS (link to 2+ competitors — warm leads):\n');
    overlapTargets.slice(0, 10).forEach(t => {
      console.log(`  ${t.domain} — links to ${t.competitorCount} competitors: ${t.competitors.join(', ')}`);
    });
  }

  log('Done');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
