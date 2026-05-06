#!/usr/bin/env node
// Reproduces false-positive script-ref errors that skill-doctor emits when
// a SKILL.md contains pedagogical examples (JSON manifest snippets, slash-command
// escape syntax, inline backtick spans, non-shell fenced blocks).
// Each fixture below is a minimal SKILL.md exhibiting one false-positive pattern
// observed in the wild (plugin-dev/command-development, plugin-dev/hook-development,
// plugin-dev/plugin-structure, claude-skills/skill-doctor).
//
// Pass criterion: false-positive fixtures emit zero `scripts` errors.
// Pass criterion: true-positive fixture (real missing script) still emits one error.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const SKILL_DOCTOR = new URL('../bin/skill-doctor.mjs', import.meta.url).pathname;

const fixtures = {
  'manifest-command-json': {
    body: [
      '## Hooks',
      '```json',
      '{',
      '  "hooks": {',
      '    "PreToolUse": [{',
      '      "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"',
      '    }]',
      '  }',
      '}',
      '```',
    ].join('\n'),
    expectErrors: 0,
  },
  'slash-command-escape': {
    body: [
      'Run analysis: !`node ${CLAUDE_PLUGIN_ROOT}/scripts/analyze.js $1`',
      'Build: !`bash ${CLAUDE_PLUGIN_ROOT}/scripts/build.sh`',
    ].join('\n'),
    expectErrors: 0,
  },
  'markdown-fenced-block': {
    body: [
      '**In component files** (commands, agents, skills):',
      '```markdown',
      'Reference scripts at: ${CLAUDE_PLUGIN_ROOT}/scripts/helper.py',
      '```',
    ].join('\n'),
    expectErrors: 0,
  },
  'bash-block-with-shebang': {
    body: [
      '```bash',
      '#!/bin/bash',
      '# ${CLAUDE_PLUGIN_ROOT} available as environment variable',
      'source "${CLAUDE_PLUGIN_ROOT}/lib/common.sh"',
      '```',
    ].join('\n'),
    expectErrors: 0,
  },
  'inline-backtick-prose': {
    body: [
      'Skill resolution tries skill-local first; a reference like `bash scripts/measure.sh`',
      'resolves to either skill-local or plugin-level paths.',
    ].join('\n'),
    expectErrors: 0,
  },
  'pipeline-under-test-heading': {
    body: [
      '### Test Hook Scripts',
      '',
      'Test command hooks directly:',
      '',
      '```bash',
      "echo '{\"tool_name\": \"Write\"}' | \\",
      '  bash ${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh',
      '```',
    ].join('\n'),
    expectErrors: 0,
  },
  'real-missing-script': {
    // Genuine bug: the skill body asserts an invocation that should resolve.
    body: [
      '## Usage',
      '```bash',
      'bash scripts/does-not-exist.sh',
      '```',
    ].join('\n'),
    expectErrors: 1,
  },
};

const root = mkdtempSync(join(tmpdir(), 'skill-doctor-test-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));

// Lay out a fake plugin per fixture so each SKILL.md is its own pluginDir.
const pluginsDir = join(root, '.claude/plugins/cache/test-marketplace');
for (const [name, fx] of Object.entries(fixtures)) {
  const skillDir = join(pluginsDir, name, '1.0.0/skills', name);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    join(skillDir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: Use when running fixture ${name} to verify skill-doctor handles this pattern correctly.\n---\n\n${fx.body}\n`
  );
}

let stdout;
try {
  execFileSync('node', [SKILL_DOCTOR, '--root', root, '--json'], { encoding: 'utf8' });
} catch (e) {
  // Non-zero exit is expected when there are findings; we still want stdout.
  stdout = e.stdout;
}
if (!stdout) {
  // Re-run without throwing, capturing stdout regardless of exit code.
  stdout = execFileSync('node', [SKILL_DOCTOR, '--root', root, '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

const report = JSON.parse(stdout);
const scriptErrorsBySkill = {};
for (const f of report.findings) {
  if (f.check !== 'scripts') continue;
  scriptErrorsBySkill[f.skill] = (scriptErrorsBySkill[f.skill] || 0) + 1;
}

let failed = 0;
for (const [name, fx] of Object.entries(fixtures)) {
  const got = scriptErrorsBySkill[name] || 0;
  const ok = got === fx.expectErrors;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: expected ${fx.expectErrors} script errors, got ${got}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} fixture(s) failed.`);
  process.exit(1);
}
console.log('\nAll fixtures passed.');
