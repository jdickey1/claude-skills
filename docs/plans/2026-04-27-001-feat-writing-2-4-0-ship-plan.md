---
title: "feat: Ship writing skill 2.4.0 (humanizer-derived enhancements)"
type: feat
status: completed
date: 2026-04-27
completed: 2026-04-27
shipped_in: 336003a
---

# feat: Ship writing skill 2.4.0 (humanizer-derived enhancements)

## Overview

Bump the `writing` skill from 2.3.0 to 2.4.0 by importing five surgical enhancements borrowed from the `blader/humanizer` Claude Code skill (digested earlier this session). Most edits are already on disk; this plan captures the remaining validate-and-ship work plus the audit decisions, so the work survives a context compact and can resume cleanly in a fresh window.

This plan documents a state that is partly already-applied (in-flight). The implementation units below cover only what is still pending.

---

## Problem Frame

The existing `writing:writing` skill enforces 15 universal rules and 8 binary EVALs against AI-tells in branded content. A digest of `blader/humanizer` (15.8k-star Claude Code skill, MIT, by Siqi Chen) cataloged 29 numbered AI-writing tells from Wikipedia's WikiProject AI Cleanup. Cross-referencing humanizer's 29 patterns against the writing skill surfaced ~10 genuine gaps — the largest being **copula avoidance** ("serves as", "boasts") and the absence of a **two-pass self-audit workflow** that humanizer uses to catch residual AI shape after lexical fixes.

User explicitly broadened the self-audit from "mandatory only in `/write-review`" to **mandatory in any branded/public-facing channel** (X, LinkedIn, web/blog, newsletter, Hyperscale, JD Key). That's the load-bearing constraint for the command-file edits.

---

## Requirements Trace

- R1. Add high-signal humanizer patterns that are not already covered, without violating the SKILL.md 500-line ceiling.
- R2. Make the two-pass self-audit (DRAFT → still-AI bullets → FINAL) mandatory across all high-stakes user channels: X, LinkedIn, web/blog, newsletter, and any branded content (Hyperscale, JD Key, WoI, etc.).
- R3. Strengthen the writing skill's structural-tell coverage (copula avoidance, inline-header lists) without breaking voice override (rule #15).
- R4. Preserve marketplace.json sync — no `plugin.json` description change so the marketplace entry stays valid.
- R5. Keep all changes additive and reversible — snapshot the 2.3.0 state before any edits so before/after eval is possible if quality regresses.

---

## Scope Boundaries

- Not importing all 29 humanizer patterns — overlapping or low-signal patterns are deliberately omitted.
- Not importing humanizer pattern #26 (hyphenated word pairs) — fights AP/Chicago compound-modifier rules and would make JD Key memos look ungrammatical.
- Not importing humanizer pattern #18 (emojis) — already a global user-level rule in `~/CLAUDE.md`; double-banning adds nothing.
- Not adding humanizer pattern #22 (sycophantic chat artifacts) — writing skill targets output, not chat replies.
- Not running a full `skill-creator` quantitative eval (Phase 4b autoresearch) in this iteration; deferred unless validation in U1 reveals issues.

### Deferred to Follow-Up Work

- **Quantitative eval run** (skill-creator workflow, baseline 2.3.0 vs 2.4.0): defer until manual validation in U1 either confirms the audit catches real residual tells or surfaces edge cases worth quantifying.
- **`References` cross-link in JD Key vault doc**: handled in U3 here, but future humanizer-version refresh (humanizer is single-maintainer; expect 2.5.x → 2.6.x drift) is a separate periodic chore not scheduled.

---

## Context & Research

### Already-applied edits (state going into this plan)

These are on disk in `/Users/james/.claude/plugins/marketplaces/claude-skills/`, uncommitted:

- `plugins/writing/skills/writing/SKILL.md` — version 2.3.0 → 2.4.0; new rule #16 (No Copula Avoidance), new rule #17 (No Inline-Header Vertical Lists); rule #15 extended with inline voice-sample calibration; new "Self-Audit Pass" section before pre-publish checklist; new EVAL 9 (copula avoidance, greppable) and EVAL 10 (self-audit completed, channel-conditional); 4 new pre-publish checklist items; 3 new gotchas. Final size: 498 lines.
- `plugins/writing/skills/writing/references/ai-slop-patterns.md` — 4 new pattern families appended: Significance Inflation, Synonym Cycling, Filler & Hedging Bloat, Curly Quotes & Em-Char Drift (with greppable Unicode regex). Final size: 336 lines.
- `plugins/writing/commands/write-x.md`, `write-linkedin.md`, `write-web.md`, `write-newsletter.md`, `write-review.md` — each gets a mandatory self-audit step inserted into Process and a `Self-audit pass is mandatory` line in Key Rules. `write-review.md` also gains explicit copula/inline-header steps and a `[ ] Self-audit pass completed` checklist line.
- `plugins/writing/skills/writing-workspace/skill-snapshot/` — pre-edit snapshot of `SKILL.md` + all `references/` files. Untracked. Used as baseline for any future A/B eval.

### Decisions captured during the audit

| Humanizer pattern | Verdict | Rationale |
|---|---|---|
| #1 Significance inflation | **Imported** to `ai-slop-patterns.md` | Structural pattern broader than word-list; bans unmarked by existing rule #2 |
| #8 Copula avoidance | **Imported** as rule #16 | Highest-signal gap; greppable; not in any banned list |
| #11 Synonym cycling | **Imported** to `ai-slop-patterns.md` | Genuinely uncovered structural tic |
| #15 Boldface overuse | Folded into rule #17 (inline-header lists) | Same root cause; one rule covers both |
| #16 Inline-header vertical lists | **Imported** as rule #17 | Strong newsletter tell; not previously named |
| #19 Curly quotes | **Imported** to `ai-slop-patterns.md` | Greppable Unicode check |
| #23 Filler phrases | **Imported** to `ai-slop-patterns.md` | Adds 20–30% bloat with zero signal |
| #24 Excessive hedging | **Imported** to `ai-slop-patterns.md` | Same as #23 |
| Voice calibration from inline sample | **Imported** as rule #15 extension | Operationalizes existing override rule |
| Two-pass self-audit | **Imported** as standalone section | Mandatory across all branded channels per R2 |
| #26 Hyphenated word pairs | **Skipped** | Fights AP/Chicago compound modifier rules |
| #18 Emojis | **Skipped** | Already a global user rule |
| #22 Sycophancy | **Skipped** | Out of scope (chat ≠ content) |
| #25 Generic positive conclusions | **Skipped** | Already covered by `ai-slop-patterns.md` "Fake Philosophical Closers" |

### Institutional / digest references

- Digest of source repo: `/home/obsidian/automation-vault/web-analyses/2026-04-27-gh-blader-humanizer.md`
- Source repo: `https://github.com/blader/humanizer` (snapshot of v2.5.1 was read inline, not persisted — see U3 for vault snapshot)

### External references

- Wikipedia: Signs of AI writing (humanizer's source). Anchor for any future humanizer-source-drift audit.

---

## Key Technical Decisions

- **Single source of truth in SKILL.md, enforced from each command file**: instead of duplicating the self-audit protocol in five command files, define it once under `## Self-Audit Pass` in `SKILL.md` and have each high-stakes command (`write-x`, `write-linkedin`, `write-web`, `write-newsletter`, `write-review`) reference it via a one-line mandatory step. Rationale: reduces drift; voice rules in one place.
- **Rule #15 stays at #15**: did not renumber the override rule even after adding rules #16 and #17 below it. The override rule's "What's NOT an idiosyncrasy" list was extended to include #16 and #17 explicitly. Rationale: avoids touching 4 existing cross-references to "rule #15" in the file.
- **EVAL 9 always-yields, EVAL 10 channel-conditional**: copula avoidance is always wrong (added to never-yield list with EVALs 1, 2, 7, 8). Self-audit is mandatory only on branded channels (yields to channel context). Rationale: matches user's explicit broadening from "review-only" to "branded channels," while leaving internal/dev-facing drafts unencumbered.
- **No `plugin.json` description change**: marketplace.json source path remains `./plugins/writing` and description remains current. Rationale: keeps marketplace manifest in sync without a coupled commit.
- **No version bump in `plugin.json`**: it has no version field; SKILL.md frontmatter is the single version anchor. Bumped 2.3.0 → 2.4.0 there.
- **`writing-workspace/skill-snapshot/` is untracked, not committed**: it's a local baseline for A/B evals, not a shipped artifact. Add to `.gitignore` if it persists.

---

## Open Questions

### Resolved During Planning

- **Should self-audit be optional or mandatory?** → User explicitly required mandatory across X, LinkedIn, Hyperscale, JD Key. Resolved.
- **Where does the self-audit definition live?** → Single source of truth in SKILL.md; commands reference it. Resolved.
- **Skip humanizer #26 (hyphenation)?** → Yes. Documented in scope boundaries. Resolved.

### Deferred to Implementation

- **Does the self-audit pass actually catch residual tells the lexical rules miss on real Hyperscale / JD Key drafts?** → Empirical question. U1 validates manually; quantitative eval deferred unless U1 surfaces issues.
- **Does mandatory self-audit add unacceptable token cost on short X posts?** → Measure during U1 validation. If excessive on simple posts, narrow the trigger (e.g., threads only, or skip on posts ≤140 chars).

---

## Implementation Units

- U1. **Validate self-audit pass on a real branded draft**

**Goal:** Confirm the new self-audit step catches at least one residual AI tell that the lexical rules + pre-publish checklist alone do not catch. If it doesn't, the audit is dead weight and U2 is blocked.

**Requirements:** R2, R3

**Dependencies:** None (the edits already exist on disk).

**Files:**
- Read: `plugins/writing/skills/writing/SKILL.md` (the new Self-Audit Pass section, rules #16/#17, EVAL 9/10)
- Read: `plugins/writing/commands/write-x.md` (or `write-newsletter.md`, whichever channel the test draft targets)
- Test inputs: One real Hyperscale or JD Key draft, OR a fresh AI-bloated paragraph if no real draft is to hand. Source from `01-Projects/Hyperscale/` or `01-Projects/JD-Key/` in the Obsidian vault, or generate a deliberately AI-shaped paragraph.

**Approach:**
- Pick one draft (X post, newsletter section, or web headline+lede).
- Run `/write-review` against it. Record what the lexical pass flags.
- Inspect the "Still-AI tells" bullets. Are they distinct from the lexical findings, or do they restate them?
- Compare the FINAL revision against a hypothetical "lexical-only" revision (the pre-publish checklist applied without the audit step). Is the audit version materially better?
- Score: pass if ≥1 audit bullet names a tell the lexical rules don't catch AND the FINAL revision visibly addresses it. Fail if the audit just restates checklist findings.

**Patterns to follow:**
- Self-Audit Pass section's 4-step protocol in `SKILL.md`.
- `write-review.md` Output format (Issues found / Still-AI tells / Revised content / Summary).

**Test scenarios:**
- Happy path: AI-bloated newsletter paragraph → lexical pass catches em dashes + 2 banned words; audit catches "structural copula chaining the audit didn't enumerate" or similar genuine residual; FINAL is materially cleaner.
- Edge case: short X post (≤140 chars) → measure whether self-audit is meaningful or just adds tokens. If post is 10 words, audit may be overkill.
- Negative: pre-cleaned human-written draft → audit should find ≤1 honest tell, or honestly report no significant tells. If the audit invents tells on clean text, the prompt needs tightening.

**Verification:**
- A/B comparison written up in chat or saved as a one-page note. If U1 fails (audit adds nothing), block U2 and revisit Self-Audit Pass wording.

---

- U2. **Commit and push writing skill 2.4.0 to claude-skills repo**

**Goal:** Ship the changes after U1 validation passes.

**Requirements:** R1, R3, R4

**Dependencies:** U1 (must pass).

**Files (all already modified, awaiting commit):**
- Modify: `plugins/writing/skills/writing/SKILL.md`
- Modify: `plugins/writing/skills/writing/references/ai-slop-patterns.md`
- Modify: `plugins/writing/commands/write-x.md`
- Modify: `plugins/writing/commands/write-linkedin.md`
- Modify: `plugins/writing/commands/write-web.md`
- Modify: `plugins/writing/commands/write-newsletter.md`
- Modify: `plugins/writing/commands/write-review.md`
- (Optionally) `.gitignore`: add `plugins/writing/skills/writing-workspace/` if the workspace dir is meant to stay local

**Approach:**
- Pre-commit verification (already passed once this session, re-run before commit):
  - `wc -l plugins/writing/skills/writing/SKILL.md` → must be < 500
  - `grep -c '"./plugins/writing"' .claude-plugin/marketplace.json` → must return 1
  - `grep -c "self-audit pass" plugins/writing/commands/*.md` → must return 5 hits across the 5 command files
- Single commit. Conventional commit subject: `feat(writing): bump to 2.4.0 with humanizer-derived enhancements`.
- Body lists: rule #16 (copula avoidance), rule #17 (inline-header lists), Self-Audit Pass section (mandatory across X/LinkedIn/web/newsletter/branded), EVAL 9 + 10, 4 new ai-slop families, command-file wiring, version bump.
- Push to `main` (`origin/main` for the `jdickey1/claude-skills` repo).

**Patterns to follow:**
- Commit-message style from `git log --oneline`: previous commit is `feat(seo,digest): consolidate verified LinkedIn AEO playbook (seo 2.5.0, digest 1.10.0) (#20)`. Match that scope/version-marker pattern.

**Test scenarios:**
- Test expectation: none — version bump + content edits with no executable code paths to test. The verification step covers correctness.

**Verification:**
- `git log --oneline -1` shows the new commit.
- `git push` succeeds (or PR is opened, depending on whether `main` is push-protected — check before pushing).
- Skill auto-loads cleanly on next Claude Code session restart (no YAML parse errors).

---

- U3. **Update Obsidian vault: cross-link humanizer in Anti-AI Writing Reference, snapshot v2.5.1**

**Goal:** Per the digest's recommendation, cite humanizer 2.5.1 as the canonical numbered AI-tell taxonomy in the JD Key Anti-AI Writing Reference, and snapshot the SKILL.md content so future Wikipedia drift doesn't change our reference under us.

**Requirements:** R1 (the digest recommended this; doing it here keeps the cross-references current).

**Dependencies:** U2 should ideally land first so the new writing skill rule numbers (#16, #17) are stable.

**Files (in Obsidian vault, on `nonrootadmin` host):**
- Modify: `01-Projects/JD-Key/Anti-AI Writing Reference.md` — add a section linking humanizer pattern numbers to writing-skill rule numbers (e.g., "humanizer #8 ↔ writing rule #16 copula avoidance") and a `## Source Snapshot — humanizer v2.5.1` appendix containing the SKILL.md content.
- Reference: `web-analyses/2026-04-27-gh-blader-humanizer.md` (already saved this session) — link from the JD Key reference doc.

**Approach:**
- SSH to `nonrootadmin`, edit as `obsidian` user (per project conventions).
- Pull humanizer SKILL.md content via `git clone --depth 1 https://github.com/blader/humanizer.git /tmp/humanizer-snapshot` and inline the SKILL.md body into the appendix. Note version explicitly so a later refresh has a clear baseline.
- Avoid `sed` over SSH (per existing memory). Use a Python heredoc or scp-and-edit-locally approach.

**Patterns to follow:**
- Existing structure of `Anti-AI Writing Reference.md` — match its section style.
- Vault edit conventions from `feedback-no-sed-over-ssh.md` and `feedback-simple-ssh-commands.md`.

**Test scenarios:**
- Test expectation: none — vault doc edit, no executable code.

**Verification:**
- Vault file mentions `humanizer 2.5.1` with the GitHub URL.
- Cross-reference table links humanizer #1, #8, #11, #15, #16, #19, #23, #24 to their writing-skill rule or `ai-slop-patterns.md` family.
- Source snapshot appendix is present and dated 2026-04-27.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| SKILL.md is at 498/500 lines — any future addition pushes over the documented ceiling | Document this constraint in the commit body. Future humanizer updates land in `references/` only, never in SKILL.md. If a top-level rule is genuinely needed, it must displace an existing rule (consolidation, not addition). |
| Mandatory self-audit may add unacceptable token cost on short X posts | U1 measures this. If excessive on short posts, narrow the trigger in `write-x.md` to threads only, or set a minimum-length guard. |
| Humanizer is single-maintainer and may drift (Wikipedia source article evolves) | U3 snapshots v2.5.1 in vault; future refreshes are explicit, not silent. |
| Self-audit prompt may be gameable (model writes "no AI tells in this draft") | Already mitigated in SKILL.md gotchas — but if U1 reveals lazy audits, tighten step 2 wording to require ≥2 honest bullets on first drafts. |
| Pattern #26 might creep back in via future humanizer version | This plan documents the rejection rationale (AP/Chicago conflict). Any future re-import requires explicit user re-approval. |

---

## System-Wide Impact

- **Other users of the writing skill**: Anyone running `/write-x`, `/write-linkedin`, `/write-web`, `/write-newsletter`, `/write-review` after this ships sees the mandatory self-audit. No silent behavior change for `/write-headline` or `/teach-writing`.
- **Voice override (rule #15) interaction**: New rules #16 and #17 are explicitly added to the "always wrong regardless of voice" list. Captured voice contexts that contain "serves as" or inline-header lists will be treated as AI contamination, not voice signal. Worth flagging if any existing JD Key voice context has these patterns — they'd be over-corrected.
- **Pre-publish checklist consumers**: Four new checklist items. Any tooling that lints output against the checklist (none currently exist, but plausible future) will need to know about them.
- **Marketplace consumers**: No structural change. `marketplace.json` entry stays valid because plugin description and source path are unchanged.

---

## Sources & References

- **Origin digest**: `~/automation-vault/web-analyses/2026-04-27-gh-blader-humanizer.md` (saved earlier this session)
- **Source repo**: `https://github.com/blader/humanizer` (v2.5.1, MIT, Siqi Chen, 15.8k stars at audit time)
- **Pre-edit snapshot**: `plugins/writing/skills/writing-workspace/skill-snapshot/`
- **Related earlier commit**: `e96a2a7 feat(seo,digest): consolidate verified LinkedIn AEO playbook (seo 2.5.0, digest 1.10.0)`

---

## Notes on this plan's process

- **Phase 1 research agents skipped** because: the audit was performed inline this session against the actual source files (writing skill + references + commands + humanizer repo); dispatching `ce-repo-research-analyst` etc. would replicate work already in context. Cost vs. value did not justify the dispatch given context budget at 87% when the plan was written.
- **Phase 5.3 deepening skipped** because: the work is partly already-applied, the remaining surface (3 implementation units, 1 of which is a single commit) is small, and the validation step (U1) is the real confidence check. Re-deepen the plan if U1 reveals gaps.
