#!/usr/bin/env node
// skill-routing-eval — assert Claude routes intents to the right skill
// Reads fixtures at <skillDir>/skill.evals.json (positives + negatives),
// sends each intent to Claude with a router prompt containing all descriptions,
// scores pass/fail. Caches responses by SHA-256 of (model + description-set + intent).
// Zero runtime dependencies. Requires ANTHROPIC_API_KEY.

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const flags = {
  root: getArg('--root') || homedir(),
  model: getArg('--model') || 'claude-haiku-4-5',
  skill: getArg('--skill'),            // optional: run only one skill by name
  concurrency: +(getArg('--concurrency') || 4),
  cacheDir: getArg('--cache-dir') || join(homedir(), '.claude/skill-doctor/cache'),
  noCache: args.includes('--no-cache'),
  json: args.includes('--json'),
  verbose: args.includes('-v') || args.includes('--verbose'),
  help: args.includes('-h') || args.includes('--help'),
};

function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

if (flags.help) {
  console.log(`skill-routing-eval — test skill routing against intents

Usage: skill-routing-eval [options]

Options:
  --root <dir>           Root to scan (default: $HOME)
  --model <id>           Router model (default: claude-haiku-4-5)
  --skill <name>         Run only this skill by frontmatter name
  --concurrency <n>      Parallel API calls (default: 4)
  --cache-dir <dir>      Response cache (default: ~/.claude/skill-doctor/cache)
  --no-cache             Ignore cache, re-run every intent
  --json                 Machine-readable output
  -v, --verbose          Log every hit/miss with the model's raw output
  -h, --help             This message

Fixture format (at <skillDir>/skill.evals.json):
{
  "positives": ["intent 1", "intent 2", ...],
  "negatives": ["unrelated intent", ...]
}

Requires ANTHROPIC_API_KEY. Typical cost ~\$0.30 for 100 skills × 15 intents on Haiku.
Exit codes: 0 all pass, 1 some failures, 2 hard error.`);
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('skill-routing-eval requires ANTHROPIC_API_KEY');
  process.exit(2);
}

// ---------- Discovery (matches skill-doctor) ----------

const SEARCH_ROOTS = [
  join(flags.root, '.claude/skills'),
  join(flags.root, '.claude/plugins/cache'),
];

function walk(dir, fn) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, fn);
    else fn(p);
  }
}

function findSkills() {
  const out = [];
  for (const r of SEARCH_ROOTS) {
    if (!existsSync(r)) continue;
    walk(r, (p) => { if (p.endsWith('/SKILL.md')) out.push(p); });
  }
  const best = new Map();
  for (const p of out) {
    const m = p.match(/\/plugins\/cache\/([^/]+)\/([^/]+)\/[^/]+\/skills\/([^/]+)\/SKILL\.md$/);
    const key = m ? `cache:${m[1]}/${m[2]}/${m[3]}` : p;
    const mtime = statSync(p).mtimeMs;
    const prev = best.get(key);
    if (!prev || mtime > prev.mtime) best.set(key, { path: p, mtime });
  }
  return [...best.values()].map(v => v.path);
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const fm = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) { key = kv[1]; fm[key] = kv[2].replace(/^['"]|['"]$/g, '').trim(); }
    else if (key && /^\s+\S/.test(line)) fm[key] += ' ' + line.trim();
  }
  return fm;
}

const skills = findSkills().map(path => {
  const fm = parseFrontmatter(readFileSync(path, 'utf8'));
  return { path, name: fm?.name, description: fm?.description, fm };
}).filter(s => s.name && s.description);

// Load fixtures co-located with the skill
for (const s of skills) {
  const fixturePath = join(dirname(s.path), 'skill.evals.json');
  if (existsSync(fixturePath)) {
    try { s.fixtures = JSON.parse(readFileSync(fixturePath, 'utf8')); }
    catch (e) { console.error(`  ✗ ${s.name}: invalid fixtures at ${fixturePath}: ${e.message}`); }
  }
}

const targets = skills.filter(s => s.fixtures && (!flags.skill || s.name === flags.skill));
if (!targets.length) {
  console.error(flags.skill
    ? `No fixtures found for skill "${flags.skill}"`
    : `No skill.evals.json fixtures found under ${flags.root}`);
  process.exit(2);
}

// ---------- Router prompt ----------

const skillCatalog = skills.map(s => `- ${s.name}: ${s.description}`).join('\n');
const descriptionSetHash = createHash('sha256').update(skillCatalog).update(flags.model).digest('hex').slice(0, 16);

function buildRouterPrompt(intent) {
  return `You are a skill router. Given a user request, output the single skill name that best matches, or "none" if no skill is a good fit.

Available skills:
${skillCatalog}

User request: ${intent}

Output ONLY the skill name (or "none"). No explanation, no punctuation.`;
}

// ---------- Cache ----------

if (!flags.noCache) {
  try { mkdirSync(flags.cacheDir, { recursive: true }); } catch {}
}

function cacheKey(intent) {
  return createHash('sha256').update(flags.model).update(descriptionSetHash).update(intent).digest('hex');
}

function cacheGet(intent) {
  if (flags.noCache) return null;
  const p = join(flags.cacheDir, cacheKey(intent) + '.json');
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

function cachePut(intent, response) {
  if (flags.noCache) return;
  const p = join(flags.cacheDir, cacheKey(intent) + '.json');
  writeFileSync(p, JSON.stringify({ intent, response, model: flags.model, ts: Date.now() }));
}

// ---------- API call with pool-based concurrency ----------

async function route(intent) {
  const cached = cacheGet(intent);
  if (cached) return cached.response;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: flags.model,
      max_tokens: 80,
      messages: [{ role: 'user', content: buildRouterPrompt(intent) }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const out = data.content[0].text.trim().replace(/^["']|["']$/g, '').split(/\s/)[0];
  cachePut(intent, out);
  return out;
}

async function pool(items, n, worker) {
  const out = new Array(items.length);
  let i = 0;
  async function run() {
    while (true) {
      const my = i++;
      if (my >= items.length) return;
      out[my] = await worker(items[my], my);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
  return out;
}

// ---------- Eval loop ----------

const results = [];
for (const s of targets) {
  const positives = s.fixtures.positives || [];
  const negatives = s.fixtures.negatives || [];
  const all = [
    ...positives.map(i => ({ intent: i, kind: 'positive' })),
    ...negatives.map(i => ({ intent: i, kind: 'negative' })),
  ];
  const routed = await pool(all, flags.concurrency, async (t) => {
    try { return { ...t, got: await route(t.intent) }; }
    catch (e) { return { ...t, got: null, error: e.message }; }
  });
  const posHits = routed.filter(r => r.kind === 'positive' && r.got === s.name).length;
  const negHits = routed.filter(r => r.kind === 'negative' && r.got !== s.name).length;
  results.push({
    skill: s.name,
    path: relative(flags.root, s.path),
    positives: positives.length,
    positivePassRate: positives.length ? posHits / positives.length : null,
    negatives: negatives.length,
    negativePassRate: negatives.length ? negHits / negatives.length : null,
    detail: routed,
  });
}

// ---------- Report ----------

if (flags.json) {
  console.log(JSON.stringify({ model: flags.model, root: flags.root, results }, null, 2));
} else {
  console.log(`skill-routing-eval (model=${flags.model})`);
  console.log(`Root:    ${flags.root}`);
  console.log(`Skills:  ${results.length}\n`);
  for (const r of results) {
    const pos = r.positivePassRate;
    const neg = r.negativePassRate;
    const fmt = (x) => x == null ? ' n/a' : (x * 100).toFixed(0).padStart(3) + '%';
    console.log(`  ${r.skill.padEnd(40)} +${fmt(pos)} (${r.positives})  -${fmt(neg)} (${r.negatives})`);
    if (flags.verbose) {
      for (const d of r.detail) {
        const ok = d.kind === 'positive' ? d.got === r.skill : d.got !== r.skill;
        console.log(`    ${ok ? '✓' : '✗'} [${d.kind}] "${d.intent}" → ${d.got ?? d.error}`);
      }
    }
  }
  console.log();
  const failing = results.filter(r => (r.positivePassRate ?? 1) < 1 || (r.negativePassRate ?? 1) < 1);
  if (!failing.length) console.log('All routing assertions passed.');
  else console.log(`${failing.length} skill(s) with routing gaps — run with -v for detail.`);
}

const anyFail = results.some(r => (r.positivePassRate ?? 1) < 1 || (r.negativePassRate ?? 1) < 1);
process.exit(anyFail ? 1 : 0);
