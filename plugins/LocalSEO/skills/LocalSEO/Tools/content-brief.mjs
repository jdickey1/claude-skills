#!/usr/bin/env node
// content-brief.mjs
// Fetches top Google results for a keyword and outputs structured SERP data for brief generation.
// Output: data/seo/YYYY-MM-DD/brief-{keyword-slug}.json
//
// Usage: node content-brief.mjs "cold email deliverability"

import { writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
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

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  appendFileSync(join(outDir(), 'content-brief.log'), line + '\n');
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

async function searchGoogle(keyword) {
  return fetchWithRetry('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: keyword,
      num: 10,
      gl: 'us',
      hl: 'en'
    })
  });
}

async function getPeopleAlsoAsk(keyword) {
  // Serper includes PAA in the main search response
  // This is extracted in the main flow
  return null;
}

// --- Main ---

async function main() {
  const keyword = process.argv[2];

  if (!keyword) {
    console.error('Usage: node content-brief.mjs "your target keyword"');
    process.exit(1);
  }

  if (!SERPER_API_KEY) {
    console.error('ERROR: SERPER_API_KEY not set. See .env.example');
    process.exit(1);
  }

  log(`Generating content brief data for: "${keyword}"`);

  const results = await searchGoogle(keyword);

  const organic = (results.organic || []).map((r, i) => ({
    position: i + 1,
    title: r.title,
    url: r.link,
    snippet: r.snippet || '',
    domain: new URL(r.link).hostname
  }));

  const peopleAlsoAsk = (results.peopleAlsoAsk || []).map(q => q.question);

  const relatedSearches = (results.relatedSearches || []).map(r => r.query);

  const output = {
    generated: new Date().toISOString(),
    keyword,
    searchResults: organic,
    peopleAlsoAsk,
    relatedSearches,
    knowledgeGraph: results.knowledgeGraph || null,
    briefPrompt: generateBriefPrompt(keyword, organic, peopleAlsoAsk)
  };

  const slug = slugify(keyword);
  const outPath = join(outDir(), `brief-${slug}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  log(`Wrote SERP data to ${outPath}`);

  // Print the prompt ready for Claude
  console.log('\n' + '='.repeat(70));
  console.log('CONTENT BRIEF PROMPT — paste this to Claude:');
  console.log('='.repeat(70) + '\n');
  console.log(output.briefPrompt);

  log('Done');
}

function generateBriefPrompt(keyword, organic, paa) {
  let prompt = `I need a content brief for the keyword: "${keyword}"\n\n`;
  prompt += `Here are the top ${organic.length} Google results:\n\n`;

  organic.forEach(r => {
    prompt += `${r.position}. ${r.title}\n`;
    prompt += `   URL: ${r.url}\n`;
    prompt += `   ${r.snippet}\n\n`;
  });

  if (paa.length > 0) {
    prompt += `People Also Ask:\n`;
    paa.forEach(q => { prompt += `- ${q}\n`; });
    prompt += '\n';
  }

  prompt += `Analyze these and create a brief with:

1. RECOMMENDED TITLE OPTIONS (3 options, include the keyword)

2. TARGET WORD COUNT (based on top-ranking content)

3. SEARCH INTENT (informational, transactional, navigational)

4. OUTLINE
   - H1 (title)
   - H2s and H3s that cover the topic comprehensively
   - Include sections competitors have
   - Add 2-3 sections competitors are MISSING (our edge)

5. TOPICS TO COVER (bullet points, include People Also Ask questions)

6. INTERNAL LINKING OPPORTUNITIES
   - What existing content should we link TO
   - What existing content should link TO this

7. COMPETITOR GAPS
   - What are the top 3 results missing that we can include?

Be specific. No fluff.`;

  return prompt;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
