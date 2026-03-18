# Skill Library Improvement — Design Spec

**Date**: 2026-03-18
**Source**: Anthropic's "Lessons from Building Claude Code: How We Use Skills" (Thariq, @trq212)
**Scope**: All skills across claude-skills (public), claude-skills-private (private), and local plugins

---

## Context

Anthropic published internal best practices for Claude Code skills based on hundreds of skills in active use. Three key gaps identified in our skill library:

1. No formal categorization against Anthropic's skill taxonomy
2. Only 3 of 23 skills have dedicated Gotchas sections (Anthropic says this is the highest-signal content)
3. Many skill descriptions read as summaries rather than trigger conditions

Additionally, one redundant skill was identified: `tweet-writer` (local content-creator plugin) overlaps with `writing/references/x-posts.md`.

## Current Inventory

**23 skills across 3 locations:**

| Location | Count | Skills |
|----------|-------|--------|
| claude-skills (public) | 9 | web-reader, interconnection-audit, digest, md-to-docx, skill-creator, security-audit, seo, plan-review, writing |
| claude-skills-private (private) | 13 | transcript-review, obsidian-vault, new-project, imga-systems, email-security-audit, quick-security-scan, email-domain-setup, incident-triage, project-status-update, skill-sync, infrastructure-audit, deploy-audit, post-deploy-verify |
| Local plugins (not in git) | 1 | tweet-writer (content-creator) |

**Skills with existing Gotchas sections:** new-project (4 gotchas), imga-systems (14 gotchas), transcript-review (2 gotchas)

---

## Rec 0: Merge tweet-writer into writing

**Type**: Prerequisite cleanup
**Execution**: Autonomous

### Content Assessment

The two files cover **complementary** territory:
- `tweet-writer` SKILL.md: content quality, voice, engagement psychology, pre-post checklist
- `writing/references/x-posts.md`: algorithm mechanics (weights, timing, link decoupling, threading)

The merge must preserve both dimensions.

### Steps

1. Compare `tweet-writer` SKILL.md content with `writing/references/x-posts.md`
2. Keep algorithm/platform mechanics in `writing/references/x-posts.md`
3. Move tweet-writer's quality framework, voice guidance, and engagement psychology into a new `writing/references/x-writing-craft.md` (or integrate into x-posts.md if it fits naturally without bloating)
4. Update `writing/SKILL.md` to reference the new file if created
5. Delete `/Users/james/.claude/plugins/local/content-creator/` plugin entirely
6. Verify: open a new Claude session, run `/write-x [test topic]`, confirm both algorithm and craft guidance are applied

### Output

- Updated `writing/references/x-posts.md` and/or new `writing/references/x-writing-craft.md`
- Deleted local content-creator plugin
- Skill count reduced to 22

---

## Rec 1: Category Audit

**Type**: Analysis — no code changes
**Execution**: Autonomous

### Anthropic's 10 Skill Categories

1. **Library/SDK Guides** — How to use a library, CLI, or SDK correctly
2. **Verification** — How to test/verify code is working (Playwright, tmux, etc.)
3. **Data & Observability** — Connect to data/monitoring stacks
4. **Workflow Automation** — Automate repetitive workflows into one command
5. **Scaffolding** — Generate framework boilerplate
6. **Code Quality & Review** — Enforce org code quality
7. **Deployment** — Fetch, push, deploy code
8. **Debugging & Investigation** — Symptom → investigation → structured report
9. **Maintenance & Operations** — Routine maintenance with guardrails
10. **Cross-cutting / Unmatched** — Skills that span multiple categories

### Steps

1. Map each of 22 skills to primary category (and secondary if applicable)
2. Identify gaps — categories with 0-1 skills
3. Produce gap analysis with recommendations for future skill development

### Output

- Reference document saved to Obsidian: `/home/obsidian/automation-vault/web-analyses/2026-03-18-skill-category-audit.md`
- Fallback: if VPS is unreachable, save to iCloud Downloads and note it for later sync
- No code changes

---

## Rec 2: Description Trigger Optimization

**Type**: Code changes (frontmatter only)
**Execution**: Autonomous, user reviews diffs before sync

### Principles

- Descriptions are trigger conditions, not summaries
- Claude scans these at session start to decide relevance
- Include exact phrases/keywords a user would say
- Normalize format across all skills for consistency

### Transformation Pattern

```
# Before (summary style):
description: Fast security header check across all projects via curl.

# After (trigger style):
description: Use when doing a quick security header check, verifying headers
after nginx changes, or spot-checking security hardening across projects.
Lighter than full security-audit.
```

### Steps

1. Rewrite all 22 skill descriptions in trigger-condition format
2. One commit per repo (public, private)
3. User reviews diffs before sync to VPS

### Constraints

- Don't change skill names
- Don't change any skill content — description frontmatter field only
- Preserve any existing trigger-style descriptions that already work well — it's valid to leave a description unchanged and note why. Don't over-edit to justify the work.

---

## Rec 3: Gotchas Sections (Collaborative)

**Type**: Code changes (skill content)
**Execution**: Collaborative — I draft, user reviews before commit

### What Belongs in Gotchas

- Common mistakes Claude makes when following this skill
- Edge cases that cause silent failures
- Things that look right but aren't
- Environment-specific traps (VPS paths, permissions, tool versions)

### Format

```markdown
## Gotchas
- **Short label** — Explanation of the failure mode and what to do instead.
```

Placed after main instructions, before references/sub-file sections.

### Drafting Confidence Tiers

**High confidence** (I've used these extensively):
- digest, obsidian-vault, writing, seo, deploy-audit, post-deploy-verify, incident-triage, project-status-update, web-reader, security-audit

**Medium confidence** (domain knowledge but fewer sessions):
- interconnection-audit, email-domain-setup, email-security-audit, quick-security-scan, infrastructure-audit, skill-sync, md-to-docx, new-project (expand existing)

**Low confidence** (need most user input):
- skill-creator, plan-review, transcript-review (expand existing), imga-systems (expand existing)

### Steps

1. Draft Gotchas in batches ordered by confidence tier: high-confidence first, then medium, then low — early batches move fast and build trust before reaching skills that need more user input
2. Present each batch for user review
3. User adds, cuts, or modifies based on real experience
4. Commit per-repo after sign-off on each batch

### Minimum Bar

- High/medium confidence skills: at least 2 gotchas each
- Low confidence skills: at least 1 user-confirmed gotcha; placeholder items are acceptable pending future user input (marked with `[NEEDS INPUT]`)

---

## Execution Order

```
Rec 0: Merge tweet-writer → writing (prerequisite)
  ↓
Rec 1: Category audit (reference doc, no code changes)
  ↓
Rec 2: Description rewrites (autonomous, 22 skills)
  ↓
Rec 3: Gotchas sections (collaborative, batches of 5)
```

### Dependencies

- Rec 0 must complete before Rec 2 (so we rewrite the correct description for writing skill)
- Rec 1 informs Rec 3: before drafting Gotchas for any skill, check the category assigned in the Rec 1 audit doc and use it to frame the type of gotchas relevant to that category (e.g., deployment skills need rollback gotchas, verification skills need false-positive gotchas)
- Rec 2 and Rec 3 are independent but sequential (avoid merge conflicts in same files)

### Repos Touched

| Repo | Recs | Commit Strategy |
|------|------|-----------------|
| `/Users/james/Projects/claude-skills/` | 0, 2, 3 | One commit per rec |
| `/Users/james/Projects/claude-skills-private/` | 2, 3 | One commit per rec |
| `/Users/james/.claude/plugins/local/content-creator/` | 0 (delete) | N/A |

### Success Criteria

- [ ] tweet-writer merged into writing, local plugin deleted
- [ ] All 22 skills mapped to Anthropic categories with gap analysis
- [ ] All 22 descriptions rewritten as trigger conditions
- [ ] All 22 skills have dedicated Gotchas sections (at least 2 user-confirmed gotchas for high/medium confidence; at least 1 for low confidence)
- [ ] All changes committed per-repo
- [ ] Skills synced to VPS via skill-sync
