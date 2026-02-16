#!/usr/bin/env node
// backlink-outreach.mjs
// Generates outreach emails from backlink opportunity data.
// Operates in dry-run mode by default — outputs a review queue, does NOT send.
//
// Usage:
//   node backlink-outreach.mjs                    # Dry run (default)
//   node backlink-outreach.mjs --send             # Actually send (requires confirmation)
//   node backlink-outreach.mjs --review           # Review pending queue
//
// Output: data/seo/YYYY-MM-DD/outreach-queue.json

import { writeFileSync, readFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = process.env.SEO_DATA_DIR || 'data/seo';
const DAILY_LIMIT = parseInt(process.env.OUTREACH_DAILY_LIMIT || '25', 10);
const DRY_RUN = process.env.OUTREACH_DRY_RUN !== 'false';
const SENDER_NAME = process.env.OUTREACH_SENDER_NAME || 'Your Name';
const COMPANY_NAME = process.env.OUTREACH_COMPANY_NAME || 'Your Company';

// Track sent emails and opt-outs
const SENT_LOG = join(DATA_DIR, 'outreach-sent.json');
const OPTOUT_FILE = join(DATA_DIR, 'outreach-optouts.json');

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
  appendFileSync(join(outDir(), 'outreach.log'), line + '\n');
}

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

function saveJson(path, data) {
  const dir = join(path, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// --- Opt-out management ---

function getOptouts() {
  return new Set(loadJson(OPTOUT_FILE, []).map(d => d.toLowerCase()));
}

function addOptout(domain) {
  const optouts = loadJson(OPTOUT_FILE, []);
  if (!optouts.includes(domain.toLowerCase())) {
    optouts.push(domain.toLowerCase());
    saveJson(OPTOUT_FILE, optouts);
    log(`Added ${domain} to opt-out list`);
  }
}

// --- Send tracking ---

function getSentToday() {
  const sent = loadJson(SENT_LOG, { entries: [] });
  return sent.entries.filter(e => e.date === today());
}

function recordSent(domain, url) {
  const sent = loadJson(SENT_LOG, { entries: [] });
  sent.entries.push({ domain, url, date: today(), timestamp: new Date().toISOString() });
  saveJson(SENT_LOG, sent);
}

function getAlreadySentDomains() {
  const sent = loadJson(SENT_LOG, { entries: [] });
  return new Set(sent.entries.map(e => e.domain.toLowerCase()));
}

// --- Email template ---

function generateEmail(opportunity) {
  // Extract article type from URL
  const url = opportunity.url || '';
  let articleType = 'article';
  if (/best|top|list|roundup/i.test(url)) articleType = 'roundup';
  else if (/guide|how/i.test(url)) articleType = 'guide';
  else if (/review|comparison/i.test(url)) articleType = 'review';
  else if (/resource/i.test(url)) articleType = 'resource list';

  // Infer topic from URL path
  const topic = url.split('/').pop()?.replace(/[-_]/g, ' ').replace(/\.\w+$/, '') || 'your topic';

  return {
    subject: `Quick note about your ${articleType} on ${topic}`,
    body: `Hey,

Just came across your ${articleType} — solid breakdown.

I run ${COMPANY_NAME}, and we might be a good addition to your ${articleType}. Happy to send more details if you're open to it.

Either way, nice work on the piece.

— ${SENDER_NAME}

P.S. If you'd prefer not to hear from us, just reply and we'll remove you from our list.`,
    metadata: {
      domain: opportunity.domain,
      url: opportunity.url,
      domainRank: opportunity.domainRank,
      competitor: opportunity.competitor,
      articleType,
      topic
    }
  };
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--send') ? 'send' : args.includes('--review') ? 'review' : 'dry-run';

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  log(`Outreach mode: ${mode}`);
  log(`Daily limit: ${DAILY_LIMIT}`);

  // Load backlink opportunities (find most recent)
  const dirs = existsSync(DATA_DIR)
    ? require('fs').readdirSync(DATA_DIR)
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort()
        .reverse()
    : [];

  let backlinksPath = null;
  for (const dir of dirs) {
    const candidate = join(DATA_DIR, dir, 'backlinks.json');
    if (existsSync(candidate)) { backlinksPath = candidate; break; }
  }

  if (!backlinksPath) {
    console.error('No backlinks.json found. Run competitor-backlinks.mjs first.');
    process.exit(1);
  }

  log(`Loading backlinks from ${backlinksPath}`);
  const backlinks = JSON.parse(readFileSync(backlinksPath, 'utf-8'));

  // Filter opportunities
  const optouts = getOptouts();
  const alreadySent = getAlreadySentDomains();
  const sentToday = getSentToday();

  const remaining = DAILY_LIMIT - sentToday.length;
  if (remaining <= 0 && mode === 'send') {
    log(`Daily limit reached (${sentToday.length}/${DAILY_LIMIT}). No emails will be sent.`);
    process.exit(0);
  }

  const eligible = backlinks.opportunities.filter(opp => {
    const domain = (opp.domain || '').toLowerCase();
    if (optouts.has(domain)) return false;
    if (alreadySent.has(domain)) return false;
    return true;
  });

  log(`${eligible.length} eligible opportunities (${backlinks.totalOpportunities} total, ${alreadySent.size} already sent, ${optouts.size} opted out)`);

  // Generate email queue
  const queue = eligible.slice(0, Math.min(remaining, DAILY_LIMIT)).map(opp => generateEmail(opp));

  // Review mode
  if (mode === 'review') {
    const queuePath = join(outDir(), 'outreach-queue.json');
    if (existsSync(queuePath)) {
      const existing = JSON.parse(readFileSync(queuePath, 'utf-8'));
      console.log(`\nPENDING OUTREACH QUEUE (${existing.emails.length} emails):\n`);
      existing.emails.forEach((email, i) => {
        console.log(`  ${i + 1}. ${email.metadata.domain} (DR ${email.metadata.domainRank})`);
        console.log(`     Subject: ${email.subject}`);
        console.log(`     Target: ${email.metadata.url}\n`);
      });
    } else {
      console.log('No pending queue. Run without --review first to generate one.');
    }
    return;
  }

  // Save queue
  const queueOutput = {
    generated: new Date().toISOString(),
    mode,
    dailyLimit: DAILY_LIMIT,
    sentToday: sentToday.length,
    emailsGenerated: queue.length,
    emails: queue
  };

  const queuePath = join(outDir(), 'outreach-queue.json');
  writeFileSync(queuePath, JSON.stringify(queueOutput, null, 2));

  // Dry run — just show what would be sent
  if (mode === 'dry-run' || DRY_RUN) {
    console.log(`\nDRY RUN — ${queue.length} emails generated (not sent):\n`);
    queue.forEach((email, i) => {
      console.log(`  ${i + 1}. TO: ${email.metadata.domain} (DR ${email.metadata.domainRank})`);
      console.log(`     Subject: ${email.subject}`);
      console.log(`     Re: ${email.metadata.url}`);
      console.log(`     Competitor: ${email.metadata.competitor}\n`);
    });
    console.log(`\nQueue saved to ${queuePath}`);
    console.log('Review with: node backlink-outreach.mjs --review');
    console.log('Send with:   node backlink-outreach.mjs --send');
    console.log('\nIMPORTANT: Review the queue before sending. Edit outreach-queue.json to remove any targets.');
    log('Dry run complete');
    return;
  }

  // Send mode
  if (mode === 'send') {
    console.log(`\nSEND MODE — ${queue.length} emails to send\n`);
    console.log('WARNING: This will send real emails. The queue has been saved for review.');
    console.log('Actual email sending requires integration with your email provider.');
    console.log('Supported integrations: Mailgun, SendGrid, Amazon SES, SMTP.');
    console.log('\nTo integrate, add your send function to the sendEmail() placeholder below.');

    // Placeholder — replace with actual email sending
    for (const email of queue) {
      log(`Would send to ${email.metadata.domain}: "${email.subject}"`);
      recordSent(email.metadata.domain, email.metadata.url);
    }

    log(`Recorded ${queue.length} sends`);
  }

  log('Done');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
