#!/usr/bin/env node
// Proves that skill-doctor's description-rewrite regex is load-bearing for
// expires_when: placement: column-0 keys survive rewriteSkillFile; the same key
// indented as a continuation under a wrapped description is silently deleted.
// Calls rewriteSkillFile directly — no CLI, no network, no ANTHROPIC_API_KEY.

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rewriteSkillFile } from '../bin/skill-doctor.mjs';

const EXPIRES_VALUE = 'Claude decomposes multi-step tasks without prompting';
const NEW_DESC = 'A short new description.';

// Genuinely multi-line wrapped description: line 1 + two indented continuations.
// Single-line descriptions make the regex continuation group match zero times,
// so the test would pass regardless of expires_when placement.
const WRAPPED_DESCRIPTION = [
  'description: Use when the user needs multi-step task scaffolding that',
  '  currently requires explicit decomposition prompts, intermediate checkpoints,',
  '  and structured handoffs across tools the model does not yet chain reliably.',
].join('\n');

const root = mkdtempSync(join(tmpdir(), 'expires-when-survival-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));

const positivePath = join(root, 'positive', 'SKILL.md');
const negativePath = join(root, 'negative', 'SKILL.md');
mkdirSync(join(root, 'positive'), { recursive: true });
mkdirSync(join(root, 'negative'), { recursive: true });

// Column 0: expires_when immediately after the description block, no leading whitespace.
writeFileSync(
  positivePath,
  [
    '---',
    'name: positive-skill',
    WRAPPED_DESCRIPTION,
    `expires_when: ${EXPIRES_VALUE}`,
    '---',
    '',
    '# Positive',
    '',
  ].join('\n')
);

// Indented: expires_when looks like another description continuation line.
writeFileSync(
  negativePath,
  [
    '---',
    'name: negative-skill',
    WRAPPED_DESCRIPTION,
    `  expires_when: ${EXPIRES_VALUE}`,
    '---',
    '',
    '# Negative',
    '',
  ].join('\n')
);

let failed = 0;

rewriteSkillFile(positivePath, NEW_DESC);
const positiveAfter = readFileSync(positivePath, 'utf8');
const positiveOk =
  positiveAfter.includes(`expires_when: ${EXPIRES_VALUE}`) &&
  positiveAfter.includes(NEW_DESC);
console.log(
  `${positiveOk ? 'PASS' : 'FAIL'} column-0-survives: expires_when still present after rewrite`
);
if (!positiveOk) failed++;

rewriteSkillFile(negativePath, NEW_DESC);
const negativeAfter = readFileSync(negativePath, 'utf8');
const negativeOk = !negativeAfter.includes('expires_when');
console.log(
  `${negativeOk ? 'PASS' : 'FAIL'} indented-gets-deleted: expires_when absent after rewrite`
);
if (!negativeOk) failed++;

if (failed) {
  console.error(`\n${failed} case(s) failed.`);
  process.exit(1);
}
console.log('\nAll expires_when survival cases passed.');
