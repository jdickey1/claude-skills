#!/usr/bin/env node
// skill-doctor v0 — audit Claude Code skills for quality and routing risk
// Checks: frontmatter validity, script references, orphan scripts,
// description collisions (Jaccard), dark-skill heuristic (no trigger phrases).
// Zero runtime dependencies.

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { homedir } from 'node:os';

const args = process.argv.slice(2);
const flags = {
  root: getArg('--root') || homedir(),
  json: args.includes('--json'),
  verbose: args.includes('-v') || args.includes('--verbose'),
  help: args.includes('-h') || args.includes('--help'),
  fix: args.includes('--fix'),
  fixDry: args.includes('--fix-dry'),
  fixModel: getArg('--fix-model') || 'claude-haiku-4-5',
};

function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

if (flags.help) {
  console.log(`skill-doctor v0 — audit Claude Code skills

Usage: skill-doctor [options]

Options:
  --root <dir>       Root to scan (default: $HOME)
  --json             Emit JSON instead of human report
  -v, --verbose      Show passing checks and skill list
  --fix              Rewrite over-long / dark-skill descriptions in place via LLM
  --fix-dry          Preview --fix changes without writing files
  --fix-model <id>   Model for --fix (default: claude-haiku-4-5)
  -h, --help         This message

Scans <root>/.claude/skills and <root>/.claude/plugins/cache for SKILL.md files.
--fix requires ANTHROPIC_API_KEY. Only touches frontmatter description; body untouched.
Run --fix against source repos (use --root <repo>), not ~/.claude/plugins/cache.
Exit codes: 0 clean, 1 warnings only, 2 errors present.`);
  process.exit(0);
}

// ---------- Discovery ----------

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
  return dedupeCaches(out);
}

// Plugin cache layout: .../plugins/cache/<source>/<plugin>/<version-or-hash>/skills/<skill>/SKILL.md
// Older versions linger after upgrades. Keep the newest mtime per (source/plugin/skill).
function dedupeCaches(paths) {
  const best = new Map();
  for (const p of paths) {
    const m = p.match(/\/plugins\/cache\/([^/]+)\/([^/]+)\/[^/]+\/skills\/([^/]+)\/SKILL\.md$/);
    const key = m ? `cache:${m[1]}/${m[2]}/${m[3]}` : p;
    const mtime = statSync(p).mtimeMs;
    const prev = best.get(key);
    if (!prev || mtime > prev.mtime) best.set(key, { path: p, mtime });
  }
  return [...best.values()].map(v => v.path);
}

// ---------- Frontmatter parse ----------

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { frontmatter: null, body: content };
  const fm = {};
  let currentKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      fm[currentKey] = kv[2].replace(/^['"]|['"]$/g, '').trim();
    } else if (currentKey && /^\s+\S/.test(line)) {
      fm[currentKey] += ' ' + line.trim();
    }
  }
  return { frontmatter: fm, body: content.slice(m[0].length) };
}

function inferPluginDir(skillPath) {
  // SKILL.md lives at .../<pluginRoot>/skills/<name>/SKILL.md
  // or .../<pluginRoot>/<name>/SKILL.md for bare user-level skills.
  let dir = dirname(dirname(skillPath));
  if (dir.endsWith('/skills')) dir = dirname(dir);
  return dir;
}

// ---------- Findings ----------

const findings = [];
function add(severity, skill, check, msg) {
  findings.push({ severity, skill, check, msg });
}

// ---------- Checks ----------

function checkFrontmatter(s) {
  const fm = s.frontmatter;
  if (!fm) return add('error', s.id, 'frontmatter', 'Missing or malformed YAML frontmatter');
  if (!fm.name) add('error', s.id, 'frontmatter', 'Missing `name` field');
  if (!fm.description) {
    add('error', s.id, 'frontmatter', 'Missing `description` field');
    return;
  }
  const len = fm.description.length;
  if (len < 30) add('warn', s.id, 'frontmatter', `Description is ${len} chars — too short to route reliably`);
  if (len > 600) add('warn', s.id, 'frontmatter', `Description is ${len} chars — unusually long (may dilute routing signal)`);
}

function checkScripts(s) {
  // Only flag actual invocations, not prose mentions. An invocation is:
  //   - preceded by a runner (bash|sh|node|python|python3|bun|deno|./|./ via ${CLAUDE_PLUGIN_ROOT}/)
  //   - or inside a fenced bash/sh code block (handled by the runner prefix rule — bare mentions in prose stay ignored)
  const invokePattern = /(?:bash|sh|node|python3?|bun|deno|\.\/|\$\{CLAUDE_PLUGIN_ROOT\}\/)\s*((?:scripts|bin|lib)\/[\w.\/-]+\.(?:sh|mjs|js|py|ts))/g;
  const refs = [...new Set([...((s.body || '').matchAll(invokePattern))].map(m => m[1]))];
  s.scriptRefs = refs;
  const skillDir = dirname(s.path);
  for (const ref of refs) {
    // Claude Code plugin conventions put scripts in two places: skill-local (<skillDir>/scripts/<ref>)
    // or plugin-level (<pluginDir>/scripts/<ref>). Accept either.
    if (existsSync(join(skillDir, ref))) continue;
    if (existsSync(join(s.pluginDir, ref))) {
      s.scriptResolveLocation = 'plugin';
      continue;
    }
    add('error', s.id, 'scripts', `References \`${ref}\` — not found at skill-local or plugin-level path under ${relative(flags.root, s.pluginDir)}`);
  }
}

function checkOrphans(skills) {
  const byPlugin = new Map();
  for (const s of skills) {
    // Skip user-level skill dirs — ~/.claude isn't a plugin, its scripts/ belongs to the harness, not a skill.
    if (s.pluginDir === flags.root || s.pluginDir === join(flags.root, '.claude')) continue;
    if (!byPlugin.has(s.pluginDir)) byPlugin.set(s.pluginDir, new Set());
    for (const r of s.scriptRefs || []) byPlugin.get(s.pluginDir).add(r);
  }
  for (const [dir, refs] of byPlugin) {
    for (const sub of ['scripts', 'bin', 'lib']) {
      const subdir = join(dir, sub);
      if (!existsSync(subdir)) continue;
      walk(subdir, (file) => {
        if (!/\.(sh|mjs|js|py|ts)$/.test(file)) return;
        const rel = relative(dir, file);
        if (!refs.has(rel)) add('warn', relative(flags.root, file), 'orphan', 'Script exists but no SKILL.md in the plugin references it');
      });
    }
  }
}

function tokenize(s) {
  return new Set((s || '').toLowerCase().match(/\b[a-z][a-z-]{3,}\b/g) || []);
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function checkCollisions(skills) {
  const toks = skills.map(s => ({ id: s.id, t: tokenize(s.frontmatter?.description) }));
  for (let i = 0; i < toks.length; i++) {
    for (let j = i + 1; j < toks.length; j++) {
      if (toks[i].id === toks[j].id) continue;
      const score = jaccard(toks[i].t, toks[j].t);
      if (score >= 0.5) add('warn', `${toks[i].id} ↔ ${toks[j].id}`, 'collision', `Description Jaccard ${score.toFixed(2)} — routing may be ambiguous`);
    }
  }
}

const TRIGGER_PATTERNS = [
  /\buse\w* when\b/i,     // use when, used when, uses when, using when
  /\bshould be used\b/i,  // "this skill should be used when..."
  /\btrigger/i, /\bactivates\b/i, /\bwhenever\b/i,
  /\bafter\b/i, /\bbefore\b/i, /\bwhen user\b/i, /\bhandles\b/i,
];
function checkDarkSkill(s) {
  const desc = s.frontmatter?.description || '';
  if (!desc) return;
  if (!TRIGGER_PATTERNS.some(p => p.test(desc)))
    add('warn', s.id, 'dark-skill', 'Description lacks trigger phrase ("Use when", "Whenever", "After", etc.) — routing reliability unknown');
}

// ---------- Main ----------

const paths = findSkills();
if (!paths.length) {
  console.error(`No SKILL.md files found under ${SEARCH_ROOTS.join(', ')}`);
  process.exit(2);
}

const skills = paths.map(p => {
  const { frontmatter, body } = parseFrontmatter(readFileSync(p, 'utf8'));
  return {
    path: p,
    id: frontmatter?.name || relative(flags.root, p),
    pluginDir: inferPluginDir(p),
    frontmatter,
    body,
  };
});

for (const s of skills) { checkFrontmatter(s); checkScripts(s); checkDarkSkill(s); }
checkOrphans(skills);
checkCollisions(skills);

// ---------- Fix mode ----------

async function rewriteDescription({ name, description, issue, model }) {
  const prompt = `You are rewriting a Claude Code skill description to improve routing reliability.

Constraints:
- 120-400 characters total (aim for 180-280)
- Must include an explicit trigger phrase: "USE WHEN ...", "Use when ...", or "Whenever ..."
- Preserve the skill's actual purpose — do not invent new capabilities
- Use concrete user intents, not abstract descriptions
- First sentence states what the skill does; trigger clause follows

Skill name: ${name}
Current description: ${description}
Problem: ${issue}

Output ONLY the new description text. No quotes, no markdown, no explanation.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text.trim().replace(/^["']|["']$/g, '');
}

function rewriteSkillFile(skillPath, newDescription) {
  const raw = readFileSync(skillPath, 'utf8');
  const m = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) throw new Error(`No frontmatter in ${skillPath}`);
  const [, open, body, close] = m;
  const escaped = newDescription.includes('\n') || newDescription.includes(':')
    ? JSON.stringify(newDescription)
    : newDescription;
  let replaced = body;
  if (/^description:\s*.*/m.test(body)) {
    replaced = body.replace(/^description:\s*.*(?:\r?\n[ \t]+\S.*)*/m, `description: ${escaped}`);
  } else {
    replaced = body + `\ndescription: ${escaped}`;
  }
  writeFileSync(skillPath, open + replaced + close + raw.slice(m[0].length));
}

if (flags.fix || flags.fixDry) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('--fix requires ANTHROPIC_API_KEY in env');
    process.exit(2);
  }
  const fixable = findings.filter(f =>
    (f.check === 'frontmatter' && /Description is \d+ chars/.test(f.msg)) ||
    f.check === 'dark-skill'
  );
  const bySkill = new Map();
  for (const f of fixable) {
    if (!bySkill.has(f.skill)) bySkill.set(f.skill, []);
    bySkill.get(f.skill).push(f);
  }
  console.log(`\n── ${flags.fixDry ? 'fix-dry' : 'fix'}: ${bySkill.size} skills, model=${flags.fixModel} ──`);
  for (const [skillId, fs] of bySkill) {
    const skill = skills.find(s => s.id === skillId);
    if (!skill?.frontmatter?.description) { console.log(`  skip ${skillId} (no description)`); continue; }
    const issue = fs.map(f => f.msg).join('; ');
    try {
      const newDesc = await rewriteDescription({
        name: skill.frontmatter.name || skillId,
        description: skill.frontmatter.description,
        issue,
        model: flags.fixModel,
      });
      console.log(`\n  ${skillId}`);
      console.log(`    old: ${skill.frontmatter.description}`);
      console.log(`    new: ${newDesc}`);
      if (!flags.fixDry) {
        rewriteSkillFile(skill.path, newDesc);
        console.log(`    → wrote ${relative(flags.root, skill.path)}`);
      }
    } catch (e) {
      console.error(`    ✗ ${skillId}: ${e.message}`);
    }
  }
  console.log();
  process.exit(0);
}

// ---------- Report ----------

if (flags.json) {
  console.log(JSON.stringify({
    root: flags.root,
    skillsScanned: skills.length,
    findings,
  }, null, 2));
} else {
  const errs = findings.filter(f => f.severity === 'error');
  const warns = findings.filter(f => f.severity === 'warn');
  const byCheck = {};
  for (const f of findings) (byCheck[f.check] ||= []).push(f);

  console.log(`skill-doctor v0`);
  console.log(`Root:    ${flags.root}`);
  console.log(`Scanned: ${skills.length} skills`);
  console.log(`Errors:  ${errs.length}`);
  console.log(`Warnings:${warns.length}\n`);

  const order = ['frontmatter', 'scripts', 'dark-skill', 'collision', 'orphan'];
  for (const check of order) {
    const items = byCheck[check];
    if (!items?.length) continue;
    console.log(`── ${check} (${items.length}) ──`);
    for (const f of items) console.log(`  [${f.severity}] ${f.skill}: ${f.msg}`);
    console.log();
  }

  if (flags.verbose) {
    console.log(`── skills (${skills.length}) ──`);
    for (const s of skills) console.log(`  ${s.id}  (${relative(flags.root, s.path)})`);
  }

  if (!findings.length) console.log('All checks passed.');
}

process.exit(findings.some(f => f.severity === 'error') ? 2 : findings.length ? 1 : 0);
