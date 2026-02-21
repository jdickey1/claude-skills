#!/usr/bin/env node
// gsc-report.mjs
// Pulls Google Search Console data, compares current vs previous period.
// Output: data/seo/YYYY-MM-DD/gsc-report.json

import { writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const ACCESS_TOKEN = process.env.GSC_ACCESS_TOKEN;
const SITE_DOMAIN = process.env.SITE_DOMAIN;
const DATA_DIR = process.env.SEO_DATA_DIR || 'data/seo';
const PERIOD_DAYS = 28;

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
  appendFileSync(join(outDir(), 'gsc-report.log'), line + '\n');
}

function fmt(d) {
  return d.toISOString().split('T')[0];
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

async function fetchSearchAnalytics(startDate, endDate) {
  const siteUrl = `sc-domain:${SITE_DOMAIN}`;

  return fetchWithRetry(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query'],
        rowLimit: 200
      })
    }
  );
}

// --- Analysis ---

function analyzeData(current, previous) {
  const prevMap = {};
  (previous.rows || []).forEach(row => {
    prevMap[row.keys[0]] = row;
  });

  const winners = [];
  const losers = [];
  const quickWins = [];
  const ctrOpportunities = [];

  (current.rows || []).forEach(row => {
    const keyword = row.keys[0];
    const pos = row.position;
    const clicks = row.clicks;
    const impressions = row.impressions;
    const ctr = row.ctr;
    const prev = prevMap[keyword];

    const entry = {
      keyword,
      position: Math.round(pos * 10) / 10,
      clicks,
      impressions,
      ctr: Math.round(ctr * 1000) / 10, // percentage
      previousPosition: prev ? Math.round(prev.position * 10) / 10 : null,
      positionChange: prev ? Math.round((prev.position - pos) * 10) / 10 : null
    };

    // Winners: improved 3+ spots
    if (prev && (prev.position - pos) >= 3) {
      winners.push(entry);
    }

    // Losers: dropped 3+ spots
    if (prev && (pos - prev.position) >= 3) {
      losers.push(entry);
    }

    // Quick wins: position 8-15 (near page 1)
    if (pos >= 8 && pos <= 15) {
      quickWins.push(entry);
    }

    // CTR opportunities: 100+ impressions but CTR below 2%
    if (impressions >= 100 && ctr < 0.02) {
      ctrOpportunities.push(entry);
    }
  });

  // Sort each category
  winners.sort((a, b) => b.positionChange - a.positionChange);
  losers.sort((a, b) => a.positionChange - b.positionChange);
  quickWins.sort((a, b) => a.position - b.position);
  ctrOpportunities.sort((a, b) => b.impressions - a.impressions);

  return { winners, losers, quickWins, ctrOpportunities };
}

// --- Main ---

async function main() {
  if (!ACCESS_TOKEN) {
    console.error('ERROR: GSC_ACCESS_TOKEN not set. See .env.example');
    process.exit(1);
  }
  if (!SITE_DOMAIN) {
    console.error('ERROR: SITE_DOMAIN not set. See .env.example');
    process.exit(1);
  }

  log(`Starting GSC report for ${SITE_DOMAIN}`);

  // Current period: last 28 days (offset by 3 days for data delay)
  const currentEnd = new Date();
  currentEnd.setDate(currentEnd.getDate() - 3);
  const currentStart = new Date(currentEnd);
  currentStart.setDate(currentStart.getDate() - PERIOD_DAYS);

  // Previous period: 28 days before that
  const prevEnd = new Date(currentStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - PERIOD_DAYS);

  log(`Current period: ${fmt(currentStart)} to ${fmt(currentEnd)}`);
  log(`Previous period: ${fmt(prevStart)} to ${fmt(prevEnd)}`);

  const [current, previous] = await Promise.all([
    fetchSearchAnalytics(currentStart, currentEnd),
    fetchSearchAnalytics(prevStart, prevEnd)
  ]);

  log(`Current period: ${current.rows?.length || 0} queries`);
  log(`Previous period: ${previous.rows?.length || 0} queries`);

  const analysis = analyzeData(current, previous);

  const output = {
    generated: new Date().toISOString(),
    domain: SITE_DOMAIN,
    currentPeriod: { start: fmt(currentStart), end: fmt(currentEnd) },
    previousPeriod: { start: fmt(prevStart), end: fmt(prevEnd) },
    totalQueries: current.rows?.length || 0,
    ...analysis,
    raw: {
      current: current.rows || [],
      previous: previous.rows || []
    }
  };

  const outPath = join(outDir(), 'gsc-report.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  log(`Wrote report to ${outPath}`);

  // Console summary
  console.log(`\nGSC REPORT — ${SITE_DOMAIN}\n`);
  console.log(`Period: ${fmt(currentStart)} to ${fmt(currentEnd)} vs previous ${PERIOD_DAYS} days\n`);

  if (analysis.winners.length > 0) {
    console.log('WINNERS (position improved 3+ spots):');
    analysis.winners.slice(0, 10).forEach(w => {
      console.log(`  "${w.keyword}" — ${w.previousPosition} -> ${w.position} (+${w.positionChange})`);
    });
    console.log();
  }

  if (analysis.losers.length > 0) {
    console.log('LOSERS (position dropped 3+ spots):');
    analysis.losers.slice(0, 10).forEach(l => {
      console.log(`  "${l.keyword}" — ${l.previousPosition} -> ${l.position} (${l.positionChange})`);
    });
    console.log();
  }

  if (analysis.quickWins.length > 0) {
    console.log('QUICK WINS (position 8-15, near page 1):');
    analysis.quickWins.slice(0, 10).forEach(q => {
      console.log(`  "${q.keyword}" — position ${q.position}, ${q.impressions} impressions`);
    });
    console.log();
  }

  if (analysis.ctrOpportunities.length > 0) {
    console.log('CTR OPPORTUNITIES (high impressions, low CTR):');
    analysis.ctrOpportunities.slice(0, 10).forEach(c => {
      console.log(`  "${c.keyword}" — ${c.ctr}% CTR on ${c.impressions} impressions`);
    });
    console.log();
  }

  log('Done');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
