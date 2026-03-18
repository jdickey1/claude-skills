# Skill Library Improvement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve all 22 skills across the claude-skills ecosystem by merging a redundant skill, categorizing against Anthropic's taxonomy, rewriting descriptions for trigger optimization, and adding Gotchas sections collaboratively.

**Architecture:** Four sequential tasks operating on SKILL.md frontmatter and content across two git repos and one local plugin directory. Tasks 1-3 are autonomous; Task 4 is collaborative (requires user review between batches). No new files created except one Obsidian reference doc and one optional writing reference file.

**Tech Stack:** Markdown, git, SSH (for Obsidian vault writes and skill-sync)

**Spec:** `docs/superpowers/specs/2026-03-18-skill-library-improvement-design.md`

---

## File Map

### Repos

| Shorthand | Path |
|-----------|------|
| `PUB` | `/Users/james/Projects/claude-skills/plugins` |
| `PRV` | `/Users/james/Projects/claude-skills-private/plugins` |
| `LOCAL` | `/Users/james/.claude/plugins/local/content-creator` |

### Public Repo Skills (PUB) — 9 files

| # | Skill | SKILL.md Path |
|---|-------|---------------|
| 1 | web-reader | `PUB/web-reader/skills/web-reader/SKILL.md` |
| 2 | interconnection-audit | `PUB/interconnection-audit/skills/interconnection-audit/SKILL.md` |
| 3 | digest | `PUB/digest/skills/digest/SKILL.md` |
| 4 | md-to-docx | `PUB/md-to-docx/skills/md-to-docx/SKILL.md` |
| 5 | skill-creator | `PUB/skill-creator/skills/skill-creator/SKILL.md` |
| 6 | security-audit | `PUB/security-audit/skills/security-audit/SKILL.md` |
| 7 | seo | `PUB/seo/skills/seo/SKILL.md` |
| 8 | plan-review | `PUB/plan-review/skills/plan-review/SKILL.md` |
| 9 | writing | `PUB/writing/skills/writing/SKILL.md` |

### Private Repo Skills (PRV) — 13 files

| # | Skill | SKILL.md Path |
|---|-------|---------------|
| 10 | transcript-review | `PRV/transcript-review/skills/transcript-review/SKILL.md` |
| 11 | obsidian-vault | `PRV/obsidian-vault/skills/obsidian-vault/SKILL.md` |
| 12 | new-project | `PRV/new-project/skills/new-project/SKILL.md` |
| 13 | imga-systems | `PRV/imga-systems/skills/imga-systems/SKILL.md` |
| 14 | email-security-audit | `PRV/vps-ops/skills/email-security-audit/SKILL.md` |
| 15 | quick-security-scan | `PRV/vps-ops/skills/quick-security-scan/SKILL.md` |
| 16 | email-domain-setup | `PRV/vps-ops/skills/email-domain-setup/SKILL.md` |
| 17 | incident-triage | `PRV/vps-ops/skills/incident-triage/SKILL.md` |
| 18 | project-status-update | `PRV/vps-ops/skills/project-status-update/SKILL.md` |
| 19 | skill-sync | `PRV/vps-ops/skills/skill-sync/SKILL.md` |
| 20 | infrastructure-audit | `PRV/vps-ops/skills/infrastructure-audit/SKILL.md` |
| 21 | deploy-audit | `PRV/vps-ops/skills/deploy-audit/SKILL.md` |
| 22 | post-deploy-verify | `PRV/vps-ops/skills/post-deploy-verify/SKILL.md` |

### Local Plugin (to be deleted)

| Skill | Path |
|-------|------|
| tweet-writer | `LOCAL/skills/tweet-writer/SKILL.md` |

### Additional Files

| File | Action | Purpose |
|------|--------|---------|
| `PUB/writing/skills/writing/references/x-posts.md` | Modify | Merge target for tweet-writer algorithm content |
| `PUB/writing/skills/writing/references/x-writing-craft.md` | Create | New file for tweet-writer's quality/voice framework |
| `PUB/writing/skills/writing/SKILL.md` | Modify | Add reference to x-writing-craft.md |
| `PUB/writing/commands/write-x.md` | Modify | Add read instruction for x-writing-craft.md |
| Obsidian: `web-analyses/2026-03-18-skill-category-audit.md` | Create | Category audit reference doc |

---

## Task 1: Merge tweet-writer into writing

**Files:**
- Read: `LOCAL/skills/tweet-writer/SKILL.md`
- Read: `PUB/writing/skills/writing/references/x-posts.md`
- Read: `PUB/writing/skills/writing/SKILL.md`
- Read: `PUB/writing/commands/write-x.md`
- Create: `PUB/writing/skills/writing/references/x-writing-craft.md`
- Modify: `PUB/writing/skills/writing/SKILL.md`
- Modify: `PUB/writing/commands/write-x.md`
- Delete: `LOCAL/` (entire content-creator plugin)

### Context for Worker

The tweet-writer skill and writing/references/x-posts.md cover **complementary** territory:
- `tweet-writer`: content quality framework, voice development, engagement psychology, pre-post checklist, writing process, engagement structure templates (how-to, insight, collaborative, thread opener formats)
- `x-posts.md`: algorithm mechanics (open-source weights), time decay, posting strategy (link decoupling, post frequency, reply optimization), threading best practices, format mixing schedule, timing

They don't overlap much. The tweet-writer content is about *craft* (how to write well for X), while x-posts.md is about *platform mechanics* (how the algorithm works). Both are needed.

- [ ] **Step 1: Create x-writing-craft.md**

Create `PUB/writing/skills/writing/references/x-writing-craft.md` with the tweet-writer's content, adapted to fit the writing plugin's style. Include:

```markdown
# X/Twitter Writing Craft

> For algorithm mechanics, posting strategy, and threading best practices, see [x-posts.md](x-posts.md).

## Core Quality Tests

Every post must pass these four tests before posting:

### 1. Genuine Value Test
Ask: "Would I bookmark this if someone else wrote it?"

**Avoid:**
- Recycled advice said a thousand times
- Generic shitposting without strategy
- Observations without insights

**Pursue:**
- Fresh insights from direct experience
- Ideas that shift how someone thinks about their work
- Saying something old in a way that makes people see it differently

### 2. Actionability Test
An insight without a blueprint is entertainment, not education.

**Weak:** "wow this new ChatGPT update is absolutely insane"
**Strong:** "how to write copy that sounds human with GPT-5.2:" + step-by-step process they can implement today

People follow because you taught them how to use something, not because you noticed it.

### 3. Natural Engagement Test
Never beg for engagement ("like if you agree"). Structure the post to invite it naturally.

**For bookmarks:** Use "here's how" or "how to" or "do this" in the hook. Make the first line so clear and valuable the bookmark happens instinctively.

**For replies:**
- Option A (Controversial stance): "GPT-5.2 now writes better copy than Claude, Gemini, and Grok all together, here's the proof"
- Option B (Collaborative opening): "this is the workflow i'm using with ChatGPT right now, curious if anyone's tested this approach with Claude"

### 4. Readability Test
Structure for one-second scanning:

**Hook:** Short, punchy, one line signaling clear value ("how to X", "why X doesn't work", "the X mistake you're making")

**Body:** One sentence per line. Lists using `-` or `>` or `1.`. White space between sections.

**Language:** Conversational, like a mentor to students. "use" not "utilize". "help" not "facilitate". "get better" not "optimize performance". Could a 14-year-old understand this?

## Voice Development

Develop 3-4 recognizable patterns used consistently but not formulaically:
- Always using `>` to break down processes
- Starting posts with a specific pattern
- Writing in fragments for emphasis
- Using "tbh" or "honestly" before controversial takes

Mix up order and context while keeping patterns recognizable.

## Engagement Structure Templates

### Thread Opener
```
[Bold claim or promise]

here's the exact process:

🧵
```

### How-To Format
```
how to [specific outcome]:

> step 1: [action]
> step 2: [action]
> step 3: [action]

[optional: real example or result]
```

### Insight Format
```
[counterintuitive observation]

most people think [common belief]

but [fresh perspective]

here's why:
[explanation]
```

### Collaborative Format
```
[share your current approach/result]

curious what you'd change

or if you've tried [alternative]
```

## Writing Process

1. Start with the actionable system or insight
2. Work backward to craft a hook that promises that value
3. Format for maximum scannability
4. Simplify language until it feels almost too simple
5. Add one engagement element (controversial take or collaborative question)
6. Final check against the four quality tests

## Pre-Post Checklist

- [ ] Would I bookmark this if someone else wrote it?
- [ ] Does it teach something implementable today?
- [ ] Is the structure scannable in one second?
- [ ] Does it have my recognizable style?
- [ ] Is the language simple enough for anyone?
```

- [ ] **Step 2: Update writing SKILL.md to reference x-writing-craft.md**

In `PUB/writing/skills/writing/SKILL.md`, find the Format-Specific Guides section and add a reference. Change:

```markdown
- **X/Twitter posts**: See [references/x-posts.md](references/x-posts.md)
```

To:

```markdown
- **X/Twitter posts**: See [references/x-posts.md](references/x-posts.md) (algorithm & strategy) and [references/x-writing-craft.md](references/x-writing-craft.md) (quality & voice)
```

- [ ] **Step 3: Update write-x.md command to load x-writing-craft.md**

In `PUB/writing/commands/write-x.md`, find the Process section and add a read step. Change:

```markdown
## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-posts.md` for X-specific optimization
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for hook formulas
```

To:

```markdown
## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-posts.md` for X algorithm and posting strategy
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-writing-craft.md` for quality tests, voice, and engagement templates
3. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for hook formulas
```

Also renumber subsequent steps (3→4, 4→5, 5→6).

- [ ] **Step 4: Delete the local content-creator plugin**

```bash
rm -rf /Users/james/.claude/plugins/local/content-creator/
```

Verify it's gone:
```bash
ls /Users/james/.claude/plugins/local/content-creator/ 2>&1
# Expected: "No such file or directory"
```

Note: The `/tweet` command from the old plugin will no longer exist. Users should use `/write-x` instead, which now includes all the craft guidance that tweet-writer provided.

- [ ] **Step 5: Commit in public repo**

```bash
cd /Users/james/Projects/claude-skills
git add plugins/writing/skills/writing/references/x-writing-craft.md plugins/writing/skills/writing/SKILL.md plugins/writing/commands/write-x.md
git commit -m "feat: merge tweet-writer craft framework into writing plugin

Moved tweet-writer's quality tests, voice development, engagement
templates, and writing process into references/x-writing-craft.md.
x-posts.md retains algorithm mechanics and posting strategy.
Local content-creator plugin deleted separately."
```

- [ ] **Step 6: Verify /write-x triggers correctly**

Open a new Claude Code session and run `/write-x test topic`. Confirm both x-posts.md (algorithm) and x-writing-craft.md (quality) content are loaded. The write-x.md command should show 3 read steps in its Process section. Report result to user.

---

## Task 2: Category Audit

**Files:**
- Read: All 22 SKILL.md files (listed in File Map above)
- Create: Obsidian doc via SSH

### Context for Worker

Map each skill to Anthropic's 10 categories. Read the description and first ~50 lines of each SKILL.md to determine category. Some skills may fit two categories — assign primary and secondary.

**Anthropic's 10 categories:**
1. Library/SDK Guides
2. Verification
3. Data & Observability
4. Workflow Automation
5. Scaffolding
6. Code Quality & Review
7. Deployment
8. Debugging & Investigation
9. Maintenance & Operations
10. Cross-cutting / Unmatched

- [ ] **Step 1: Read all 22 SKILL.md files**

Read descriptions and opening sections of all skills listed in the File Map. For each, determine:
- Primary category (best fit from the 10)
- Secondary category (if applicable)
- Brief justification (one sentence)

- [ ] **Step 2: Build the category mapping table**

Create a markdown table with columns: Skill | Repo | Primary Category | Secondary Category | Notes

- [ ] **Step 3: Identify gaps**

Count skills per category. Flag categories with 0-1 skills. For each gap, recommend 1-2 concrete skills that would fill it, with a one-sentence description of what the skill would do.

- [ ] **Step 4: Save to Obsidian**

Write the audit document to a local temp file first (`/tmp/skill-category-audit.md`), then upload:

```bash
# Use the table from Step 2 and gap analysis from Step 3 as the file content
ssh nonrootadmin "sudo -u obsidian tee /home/obsidian/automation-vault/web-analyses/2026-03-18-skill-category-audit.md > /dev/null" < /tmp/skill-category-audit.md
```

If SSH fails, save to iCloud Downloads instead:
```bash
# Fallback
cp /tmp/skill-category-audit.md "/Users/james/Library/Mobile Documents/com~apple~CloudDocs/Downloads/2026-03-18-skill-category-audit.md"
```

- [ ] **Step 5: Report results to user**

Present the category table and gap analysis inline. No commit needed — this is a reference doc, not code.

---

## Task 3: Description Trigger Optimization

**Files:**
- Modify: All 22 SKILL.md files (frontmatter `description` field only)

### Context for Worker

Rewrite every skill's `description` frontmatter so it reads as a **trigger condition** — when should Claude invoke this skill? Include exact phrases/keywords a user would say. Don't change skill names or any content below the frontmatter.

**Pattern:**
```
# Before (summary):
description: Fast security header check across all projects via curl.

# After (trigger):
description: Use when doing a quick security header check, verifying headers after nginx changes, or spot-checking security hardening across projects. Lighter than full security-audit.
```

If a description already reads as a good trigger condition, leave it unchanged or normalize lightly. It's valid to skip a skill and note why.

- [ ] **Step 1: Read all 22 current descriptions**

Read the frontmatter of each SKILL.md. Record the current description for comparison.

- [ ] **Step 2: Draft new descriptions for public repo skills (9)**

For each skill in PUB, draft the new trigger-condition description. Format as a before/after table for review.

| Skill | Current | Proposed | Changed? |
|-------|---------|----------|----------|

Skills to rewrite:

1. **web-reader** — Current: `Efficiently retrieve web page content as structured markdown using npx playbooks get...`
2. **interconnection-audit** — Current: `Use when auditing vault connections...` (already trigger-style, normalize)
3. **digest** — Current: `Fetch, analyze, and save any web content to Obsidian...`
4. **md-to-docx** — Current: `Convert Markdown files to Word (.docx) documents...`
5. **skill-creator** — Current: `Create, test, harden, and continuously improve skills...`
6. **security-audit** — Current: `Comprehensive cybersecurity audit for web applications. USE WHEN...` (partially trigger-style)
7. **seo** — Current: `Comprehensive SEO audit, optimization, and automation. USE WHEN...` (partially trigger-style)
8. **plan-review** — Current: `Review a plan thoroughly before implementation...`
9. **writing** — Current: `Use when writing any content, copy, social posts...` (already trigger-style)

- [ ] **Step 3: Apply changes to public repo**

Edit each SKILL.md's `description` field. Touch NOTHING else in the file.

- [ ] **Step 4: Commit public repo**

```bash
cd /Users/james/Projects/claude-skills
git add plugins/*/skills/*/SKILL.md
git commit -m "feat: rewrite skill descriptions as trigger conditions

Optimized all 9 public skill descriptions to read as 'when to trigger'
conditions per Anthropic's skill best practices. Includes exact
phrases/keywords users would say to invoke each skill."
```

- [ ] **Step 5: Draft new descriptions for private repo skills (13)**

Same process for PRV skills:

10. **transcript-review**
11. **obsidian-vault**
12. **new-project**
13. **imga-systems**
14. **email-security-audit**
15. **quick-security-scan**
16. **email-domain-setup**
17. **incident-triage**
18. **project-status-update**
19. **skill-sync**
20. **infrastructure-audit**
21. **deploy-audit**
22. **post-deploy-verify**

- [ ] **Step 6: Apply changes to private repo**

Edit each SKILL.md's `description` field. Touch NOTHING else.

- [ ] **Step 7: Commit private repo**

```bash
cd /Users/james/Projects/claude-skills-private
git add plugins/*/skills/*/SKILL.md
git commit -m "feat: rewrite skill descriptions as trigger conditions

Optimized all 13 private skill descriptions to read as 'when to trigger'
conditions per Anthropic's skill best practices. Includes exact
phrases/keywords users would say to invoke each skill."
```

- [ ] **Step 8: Present diffs to user for review**

Show `git diff HEAD~1` for both repos. Wait for user approval before proceeding. If user requests changes, revert with `git revert HEAD` in the affected repo, re-edit the descriptions, and re-commit.

---

## Task 4: Gotchas Sections (Collaborative)

**Files:**
- Modify: All 22 SKILL.md files (add `## Gotchas` section to content)

### Context for Worker

Add a `## Gotchas` section to every skill. Place it after the main instructions, before any references/sub-file sections. Use this format:

```markdown
## Gotchas
- **Short label** — Explanation of the failure mode and what to do instead.
```

Before drafting gotchas for any skill, check its category from the Task 2 audit doc to frame relevant failure types:
- Deployment skills → rollback, environment, path gotchas
- Verification skills → false positive/negative gotchas
- Workflow automation → idempotency, state, ordering gotchas
- Debugging skills → red herring, misdiagnosis gotchas
- etc.

Skills that already have Gotchas (new-project, imga-systems, transcript-review) — review existing gotchas but don't remove any. Add new ones if identified.

**Minimum bar:** 2+ gotchas for high/medium confidence skills. 1+ user-confirmed gotcha for low confidence skills (mark uncertain ones with `[NEEDS INPUT]`).

### Batch A: High Confidence (10 skills)

Present these to user first — fastest review cycle.

- [ ] **Step 1: Draft Gotchas for high-confidence skills**

Draft `## Gotchas` sections for these 10 skills:

1. **digest** (PUB) — e.g., syndication API returns stale cache; video transcription can timeout on long files; GitHub shallow clone misses submodules
2. **obsidian-vault** (PRV) — e.g., vault-map.md can be stale if refresh script hasn't run; SSH path differs between VPS and Mac Mini
3. **writing** (PUB) — e.g., em dash rule conflicts with direct quotes that contain them; contractions rule conflicts with formal/legal content
4. **seo** (PUB) — e.g., GSC data has 48-hour delay; tool scripts require bun not node; audit checklist references may drift from current Google guidelines
5. **deploy-audit** (PRV) — e.g., gold standard template may not match project's runtime (node vs bun vs python); PM2 ecosystem file format varies
6. **post-deploy-verify** (PRV) — e.g., health check URL may differ from root URL; PM2 process name may not match project name; public URL check fails if DNS hasn't propagated
7. **incident-triage** (PRV) — e.g., "site down" could be DNS, not the app; PM2 restart loop looks like "online" status; nginx error log location varies by project
8. **project-status-update** (PRV) — e.g., git log on VPS may differ from local if not pushed; PM2 status requires SSH to the right user
9. **web-reader** (PUB) — e.g., JavaScript-heavy pages return empty content; some sites block npx playbooks; paywalled content returns teaser only
10. **security-audit** (PUB) — e.g., false positives on intentional patterns (e.g., eval in build tools); scope creep beyond the requested audit tier

- [ ] **Step 2: Present Batch A to user**

Show all 10 drafted Gotchas sections. Ask user to:
- Confirm, modify, or cut each gotcha
- Add any real failure modes from experience
- Flag any that seem theoretical rather than real

- [ ] **Step 3: Apply Batch A changes**

Edit each SKILL.md to insert the user-approved `## Gotchas` section.

- [ ] **Step 4: Commit Batch A**

One commit per repo for the skills modified:

```bash
# Public repo (digest, writing, seo, web-reader, security-audit)
cd /Users/james/Projects/claude-skills
git add plugins/digest/skills/digest/SKILL.md plugins/writing/skills/writing/SKILL.md plugins/seo/skills/seo/SKILL.md plugins/web-reader/skills/web-reader/SKILL.md plugins/security-audit/skills/security-audit/SKILL.md
git commit -m "feat: add Gotchas sections to 5 public skills

Added failure mode documentation per Anthropic best practices.
User-reviewed gotchas for digest, writing, seo, web-reader,
and security-audit."

# Private repo (obsidian-vault, deploy-audit, post-deploy-verify, incident-triage, project-status-update)
cd /Users/james/Projects/claude-skills-private
git add plugins/obsidian-vault/skills/obsidian-vault/SKILL.md plugins/vps-ops/skills/deploy-audit/SKILL.md plugins/vps-ops/skills/post-deploy-verify/SKILL.md plugins/vps-ops/skills/incident-triage/SKILL.md plugins/vps-ops/skills/project-status-update/SKILL.md
git commit -m "feat: add Gotchas sections to 5 private skills

Added failure mode documentation per Anthropic best practices.
User-reviewed gotchas for obsidian-vault, deploy-audit,
post-deploy-verify, incident-triage, and project-status-update."
```

### Batch B: Medium Confidence (8 skills)

- [ ] **Step 5: Draft Gotchas for medium-confidence skills**

Draft `## Gotchas` sections for:

11. **interconnection-audit** (PUB) — e.g., large vaults can timeout; connection types must match schema; orphan detection misses notes in non-standard paths
12. **email-domain-setup** (PRV) — e.g., DNS propagation delay causes false failures; Brevo sender verification requires email access; Purelymail DKIM records are domain-specific
13. **email-security-audit** (PRV) — e.g., DMARC policy "none" is not a failure; CAA records are optional but flagged; dig results may be cached
14. **quick-security-scan** (PRV) — e.g., curl follows redirects by default which may mask missing headers on the initial response; some headers are set by the app not nginx
15. **infrastructure-audit** (PRV) — e.g., file permission checks may flag intentional exceptions; systemd service status differs from PM2 status
16. **skill-sync** (PRV) — e.g., rsync to non-sudoer users requires correct permissions; git pull fails if local changes exist on target
17. **md-to-docx** (PUB) — e.g., complex markdown tables may not convert cleanly; images referenced by URL won't embed; pandoc version affects output
18. **new-project** (PRV) — already has 4 gotchas. Review and expand if needed.

- [ ] **Step 6: Present Batch B to user**

Same review process as Batch A.

- [ ] **Step 7: Apply and commit Batch B**

Batch B split: 2 PUB skills (interconnection-audit, md-to-docx) + 6 PRV skills (email-domain-setup, email-security-audit, quick-security-scan, infrastructure-audit, skill-sync, new-project).

```bash
# Public repo (interconnection-audit, md-to-docx)
cd /Users/james/Projects/claude-skills
git add plugins/interconnection-audit/skills/interconnection-audit/SKILL.md plugins/md-to-docx/skills/md-to-docx/SKILL.md
git commit -m "feat: add Gotchas sections to 2 public skills

User-reviewed gotchas for interconnection-audit and md-to-docx."

# Private repo (email-domain-setup, email-security-audit, quick-security-scan, infrastructure-audit, skill-sync, new-project)
cd /Users/james/Projects/claude-skills-private
git add plugins/vps-ops/skills/email-domain-setup/SKILL.md plugins/vps-ops/skills/email-security-audit/SKILL.md plugins/vps-ops/skills/quick-security-scan/SKILL.md plugins/vps-ops/skills/infrastructure-audit/SKILL.md plugins/vps-ops/skills/skill-sync/SKILL.md plugins/new-project/skills/new-project/SKILL.md
git commit -m "feat: add/expand Gotchas sections for 6 private skills

User-reviewed gotchas for email-domain-setup, email-security-audit,
quick-security-scan, infrastructure-audit, skill-sync, and new-project."
```

### Batch C: Low Confidence (4 skills)

- [ ] **Step 8: Draft Gotchas for low-confidence skills**

Draft `## Gotchas` sections for:

19. **skill-creator** (PUB) — e.g., eval scripts may need bun not node; description optimization can over-trigger on unrelated prompts; `[NEEDS INPUT]` for user-specific failure modes
20. **plan-review** (PUB) — e.g., mega review mode consumes significant context; reviewer may flag patterns that are intentional in the codebase; `[NEEDS INPUT]`
21. **transcript-review** (PRV) — already has 2 gotchas. Review and expand. `[NEEDS INPUT]` for episode-specific patterns
22. **imga-systems** (PRV) — already has 14 gotchas. Review for completeness. `[NEEDS INPUT]` for any new Property Lens gotchas

- [ ] **Step 9: Present Batch C to user**

These need the most user input. Present drafts and explicitly ask for real failure modes.

- [ ] **Step 10: Apply and commit Batch C**

Batch C split: 2 PUB skills (skill-creator, plan-review) + 2 PRV skills (transcript-review, imga-systems).

```bash
# Public repo (skill-creator, plan-review)
cd /Users/james/Projects/claude-skills
git add plugins/skill-creator/skills/skill-creator/SKILL.md plugins/plan-review/skills/plan-review/SKILL.md
git commit -m "feat: add Gotchas sections to 2 public skills

User-reviewed gotchas for skill-creator and plan-review."

# Private repo (transcript-review, imga-systems)
cd /Users/james/Projects/claude-skills-private
git add plugins/transcript-review/skills/transcript-review/SKILL.md plugins/imga-systems/skills/imga-systems/SKILL.md
git commit -m "feat: expand Gotchas sections for 2 private skills

User-reviewed gotchas for transcript-review and imga-systems."
```

---

## Task 5: Sync and Verify

- [ ] **Step 1: Push both repos**

```bash
cd /Users/james/Projects/claude-skills && git push
cd /Users/james/Projects/claude-skills-private && git push
```

- [ ] **Step 2: Run skill-sync to propagate to VPS**

```bash
# Invoke the skill-sync skill or run manually:
ssh nonrootadmin "cd /home/nonrootadmin/claude-skills && git pull"
ssh nonrootadmin "cd /home/nonrootadmin/claude-skills-private && git pull"
# Then rsync to other users per skill-sync process
```

- [ ] **Step 3: Verify in a fresh session**

Start a new Claude Code session. Check:
- `/write-x` triggers with both algorithm and craft guidance
- Skill listing shows updated descriptions
- Running a skill shows Gotchas section in loaded content

- [ ] **Step 4: Report completion against success criteria**

Check each criterion from the spec:
- [ ] tweet-writer merged into writing, local plugin deleted
- [ ] All 22 skills mapped to Anthropic categories with gap analysis
- [ ] All 22 descriptions rewritten as trigger conditions
- [ ] All 22 skills have Gotchas sections (2+ for high/medium, 1+ for low)
- [ ] All changes committed per-repo
- [ ] Skills synced to VPS via skill-sync
