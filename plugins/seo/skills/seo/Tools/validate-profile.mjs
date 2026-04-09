#!/usr/bin/env node
// validate-profile.mjs
// Reads and validates seo-profile.json before running any pipeline tool.
// Usage:
//   node validate-profile.mjs
//   node validate-profile.mjs --profile /path/to/seo-profile.json
//   SEO_PROFILE_PATH=/path/to/seo-profile.json node validate-profile.mjs

import { readFileSync } from 'fs';
import { resolve } from 'path';

// --- Resolve profile path ---

function resolveProfilePath() {
  // 1. --profile CLI flag
  const flagIndex = process.argv.indexOf('--profile');
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    return resolve(process.argv[flagIndex + 1]);
  }

  // 2. SEO_PROFILE_PATH env var
  if (process.env.SEO_PROFILE_PATH) {
    return resolve(process.env.SEO_PROFILE_PATH);
  }

  // 3. seo-profile.json in cwd
  return resolve(process.cwd(), 'seo-profile.json');
}

// --- Validation ---

function validateProfile(profile) {
  const errors = [];
  const warnings = [];

  // Required: business.description
  if (!profile.business?.description || typeof profile.business.description !== 'string' || !profile.business.description.trim()) {
    errors.push('Missing required field: business.description');
  }

  // Required: business.products (non-empty array)
  if (!Array.isArray(profile.business?.products) || profile.business.products.length === 0) {
    errors.push('Missing required field: business.products (must be a non-empty array)');
  }

  // Required: seeds (non-empty array)
  if (!Array.isArray(profile.seeds)) {
    errors.push('Missing required field: seeds (must be an array)');
  } else if (profile.seeds.length === 0) {
    warnings.push('seeds array is empty — pipeline tools will have nothing to expand');
  }

  // Required: siteUrl
  if (!profile.siteUrl || typeof profile.siteUrl !== 'string' || !profile.siteUrl.trim()) {
    errors.push('Missing required field: siteUrl');
  }

  // Warning: irrelevantTopics overlap with seeds
  if (Array.isArray(profile.irrelevantTopics) && Array.isArray(profile.seeds)) {
    const seedSet = new Set(profile.seeds.map(s => s.toLowerCase().trim()));
    const overlapping = profile.irrelevantTopics.filter(t => seedSet.has(t.toLowerCase().trim()));
    if (overlapping.length > 0) {
      warnings.push(
        `irrelevantTopics overlaps with seeds (${overlapping.length} term${overlapping.length > 1 ? 's' : ''}): ${overlapping.join(', ')}`
      );
    }
  }

  return { errors, warnings };
}

// --- Main ---

const profilePath = resolveProfilePath();

let raw;
try {
  raw = readFileSync(profilePath, 'utf-8');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error(`ERROR: Profile not found at ${profilePath}`);
    console.error('       Copy seo-profile.example.json to seo-profile.json and fill in your details.');
  } else {
    console.error(`ERROR: Could not read profile at ${profilePath}: ${err.message}`);
  }
  process.exit(1);
}

let profile;
try {
  profile = JSON.parse(raw);
} catch (err) {
  console.error(`ERROR: seo-profile.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

const { errors, warnings } = validateProfile(profile);

if (warnings.length > 0) {
  console.warn('\nWARNINGS:');
  warnings.forEach(w => console.warn(`  ! ${w}`));
}

if (errors.length > 0) {
  console.error('\nERRORS:');
  errors.forEach(e => console.error(`  x ${e}`));
  process.exit(1);
}

// --- Success summary ---

const p = profile;
const seedCount = p.seeds?.length ?? 0;
const productCount = p.business?.products?.length ?? 0;
const competitorCount = p.competitors?.length ?? 0;
const excludeCount = p.irrelevantTopics?.length ?? 0;

console.log('\nProfile valid: ' + profilePath);
console.log('\nBUSINESS SUMMARY:\n');
console.log(`  Site:        ${p.siteUrl}`);
console.log(`  Location:    ${p.targetLocation || '(not set)'}`);
console.log(`  Description: ${p.business.description}`);
console.log(`\n  Products/Services (${productCount}):`);
p.business.products.forEach(prod => console.log(`    - ${prod}`));
console.log(`\n  Current Audience:      ${p.business.currentAudience || '(not set)'}`);
console.log(`  Aspirational Audience: ${p.business.aspirationalAudience || '(not set)'}`);
console.log(`\n  Seed Keywords (${seedCount}):`);
(p.seeds || []).forEach(s => console.log(`    - ${s}`));
if (competitorCount > 0) {
  console.log(`\n  Competitors (${competitorCount}):`);
  p.competitors.forEach(c => console.log(`    - ${c}`));
}
if (excludeCount > 0) {
  console.log(`\n  Excluded Topics (${excludeCount}):`);
  p.irrelevantTopics.forEach(t => console.log(`    - ${t}`));
}
console.log('');
