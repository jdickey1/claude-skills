---
title: "feat: writing v2.6.0 — five net-new universal patterns"
type: feat
status: completed
date: 2026-05-10
---

# feat: writing v2.6.0 — five net-new universal patterns

## Summary

Add five universal anti-patterns to the `writing` plugin (currently v2.5.1) discovered by a coverage audit comparing the Hyperscale Style Guide against the writing skill. Four land as new sections in `references/ai-slop-patterns.md`; one lands as a new Rule #19 in SKILL.md. Bump skill version to v2.6.0 (substantive bundle, not patch). Verify `marketplace.json` writing entry is unchanged. Total work: ~30 minutes.

## Requirements

- R1. Four new sections in `plugins/writing/skills/writing/references/ai-slop-patterns.md` for: Two-Part Engagement Questions, Spectacle Framing Around Failure, Fractional-Magnitude Precision, Time-Deixis (Self-Reference to the Medium).
- R2. New Rule #19 "Order Lists by Magnitude and Recognizability" in `plugins/writing/skills/writing/SKILL.md`.
- R3. SKILL.md `version:` bumped from `2.5.1` to `2.6.0`. EVAL 7 question expanded to enumerate the four new ai-slop categories. Pre-Publish Checklist updated with the new patterns.
- R4. `.claude-plugin/marketplace.json` writing entry verified — no description change needed (existing description is general enough), no source path change. Confirm in commit message.
- R5. Each new ai-slop section follows the existing template: H2 heading, one-line intent, one or two examples (anti-pattern → fix), generalizable framing (not Hyperscale-specific). Each is greppable for at least one pattern phrase where applicable, mirroring the "Greppable check" subsection in EVAL 9 and the curly-quote section.

## Scope Boundaries

- Not modifying enforcement architecture (regex pre-checks, surgical salvage layer) from the Hyperscale Style Guide. Those are pipeline-level mechanisms specific to the newsletter-box build, not editorial-content-level rules. They do not belong in the writing skill.
- Not adding Hyperscale-specific patterns (climate-language ban, mechanics-over-spectacle Hyperscale-vocabulary list, "Speaker @Burrows4TX" insider title rules). Those live in `~/Projects/hyperscale/CLAUDE.md` per writing-skill rule #15.
- Not refactoring existing rules or sections. Pure additions only.
- Not writing tests beyond skill-creator pattern verification (the skill is prose; "tests" are grep-based content checks).
- Not touching the other 10 plugins in this repo. Writing-only change.

## Context & Research

### Relevant Code and Patterns

- `plugins/writing/skills/writing/SKILL.md` — current v2.5.1, 499 lines; rules numbered through #18 ("Pressure-Test Drafts Against Editor Reflexes"). Rule #19 is the next slot.
- `plugins/writing/skills/writing/references/ai-slop-patterns.md` — current 382 lines, 19 H2 sections (Throat-Clearers, False Exclusivity Hooks, Manufactured Urgency, Dramatic Fragmentation, Fake Vulnerability, False Agency, Ladder of Escalation, Pivot Phrases, Parallel-Clause Moralistic Punchlines, Qualifier Sandwiches, Call-to-Action Slop, Fake Philosophical Closers, AI Adverbs, AI Adjectives, AI Verbs, Fill-in-the-Blank Templates, Significance Inflation, Synonym Cycling, Filler and Hedging Bloat, Curly Quotes and Em-Char Drift, Self-Assessment).
- `.claude-plugin/marketplace.json` — writing plugin entry has a general description that already covers anti-AI detection broadly; no description change needed for a v2.6.0 with five net-new patterns.
- Audit findings: `~/Projects/hyperscale/docs/plans/2026-05-09-001-coverage-audit-findings.md` (private repo) — Bucket 3 has full delta enumeration with example/fix/suggested-home for each.
- Recent precedent — commit `b18a5e3 feat(writing): v2.5.0 — channel-context voice rule, parallel-clause punchlines, X-craft additions, audit pass`: prior bundle of 4 additions became a minor-version bump (v2.4.0 → v2.5.0). Five net-new patterns is the same shape; v2.5.1 → v2.6.0 is consistent.
- Recent precedent — commit `8da718e feat(writing): add Rule #18 and editorial-edit-patterns reference`: how a single new SKILL.md rule lands alongside a new reference file. Single-commit pattern; my Rule #19 will follow the same shape.

### Institutional Learnings

- Saved memory `feedback-skills-in-plugin-repos.md` — skill changes ship via the public `claude-skills` repo with `marketplace.json` updates in the same commit as the plugin change.
- Saved memory `feedback-ai-content-system-pitches.md` — frame as operational, not architectural; do not duplicate writing-skill content.
- The writing skill's Self-Assessment table (`ai-slop-patterns.md` line 372+) buckets pattern counts into Clean / Mild / Moderate / Severe / Terminal. Adding 4 new categories will inflate the maximum count; consider whether to mention this in the audit pass or leave the buckets coarse-grained (current decision: leave coarse — they're already fuzzy diagnostic ranges, not exact counts).

## Key Technical Decisions

- **Version bump: v2.5.1 → v2.6.0.** Five net-new patterns is a substantive bundle, mirroring the v2.5.0 "channel-context voice rule, parallel-clause punchlines, X-craft additions, audit pass" precedent. Patch (v2.5.2) understates the surface area.
- **Single Rule #19 for list-ordering, single new SKILL.md rule.** Delta 2 (list ordering) is a positive craft principle (do this), not an anti-pattern (don't do this) — fits SKILL.md universal rules better than `ai-slop-patterns.md`. The other four deltas are anti-patterns and fit `ai-slop-patterns.md`.
- **Single rolled-up EVAL 7 stays rolled-up.** Current EVAL 7 enumerates the slop categories in its question. Add the four new categories to the enumeration. Do not split into per-category EVALs — that would inflate the EVAL count without improving signal.
- **No marketplace.json description change.** The writing entry's existing description ("Research-backed writing standards for human-quality content. Anti-AI detection, headline optimization, platform guides for X, LinkedIn, and web copy, persuasion frameworks, and pre-publish quality gates.") already covers the new patterns under "anti-AI detection." Save a churn commit.
- **Greppable checks.** Two of the new patterns lend themselves to greppable detection (Two-Part Engagement Questions: tail-anchored regex for `\?\s*[A-Z][^.!?]*\s+or\s`; Time-Deixis: `\b(?:today's|today)\s+(?:newsletter|post|brief|article|episode)\b`). Include those in the new sections to mirror the existing pattern from "Curly Quotes and Em-Char Drift" and EVAL 9. The other two (Spectacle, Fractional-Magnitude) are softer and don't get greppable checks.

## Open Questions

### Resolved During Planning

- *Should Rule #19 (list ordering) be a new universal rule or live in `references/x-writing-craft.md`?* → New universal rule in SKILL.md. The pattern applies to any prose with a list, not just X. Universal placement matches the audit's recommendation.
- *Single rolled-up EVAL 7 or per-category EVAL split?* → Keep rolled-up. Existing pattern; splitting bloats the EVAL list without improving signal.
- *Does marketplace.json need changes?* → No. Description is general; source path is unchanged; no version field in marketplace.json (writing plugin doesn't carry one there).

### Deferred to Implementation

- *Exact EVAL 7 question wording with the four new categories appended.* Will write at U3 execution time. Pattern: "Does the output avoid [existing 9 categories], two-part engagement questions, spectacle framing around failure, fractional-magnitude precision, and time-deixis around the medium?"
- *Whether to add greppable check details inline in each new ai-slop section or only mention they're greppable.* Lean toward inline for the two patterns that warrant it (Two-Part Questions, Time-Deixis), but final wording at execution time.

## Implementation Units

- U1. **Add 4 new anti-pattern sections to `references/ai-slop-patterns.md`**

**Goal:** Land Two-Part Engagement Questions, Spectacle Framing Around Failure, Fractional-Magnitude Precision, and Time-Deixis (Self-Reference to the Medium) as new H2 sections in the existing pattern catalog.

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Modify: `plugins/writing/skills/writing/references/ai-slop-patterns.md`

**Approach:**
- Insert each new section before the `## Self-Assessment` section at the end (the assessment table is the natural terminator). Order between existing sections by topical neighborhood:
  - "Two-Part Engagement Questions" → after `## Call-to-Action Slop` (both relate to engagement-farming closers).
  - "Spectacle Framing Around Failure" → after `## Significance Inflation` (both inflate-around-event).
  - "Fractional-Magnitude Precision" → after `## Significance Inflation` or `## Synonym Cycling` (precision-as-tic).
  - "Time-Deixis (Self-Reference to the Medium)" → after `## Throat-Clearers` (both are throat-clearing variants).
- Each section follows the existing template: H2 heading + one-line intent + one anti-pattern table or block-quote example + Fix line. Two of them (Two-Part Questions, Time-Deixis) get a "Greppable check:" line at the end mirroring the curly-quote section.
- Source the example/fix wording from the audit findings file's Bucket 3 — those examples were drafted to be generalizable.
- Update the `## Contents` index at the top of the file to include the four new sections.

**Patterns to follow:**
- Existing sections in `plugins/writing/skills/writing/references/ai-slop-patterns.md`. Mirror the "Throat-Clearers" / "Curly Quotes and Em-Char Drift" shape for greppable patterns; mirror "Significance Inflation" / "Synonym Cycling" for non-greppable.

**Test scenarios:**
- Happy path: After edit, `grep -cE '^## (Two-Part Engagement Questions|Spectacle Framing Around Failure|Fractional-Magnitude Precision|Time-Deixis)' references/ai-slop-patterns.md` returns 4.
- Happy path: `grep -A2 'Greppable check:' references/ai-slop-patterns.md | grep -E 'or\s|today.s' ` returns hits in both new greppable sections.
- Edge case: Existing sections (Throat-Clearers through Self-Assessment) are byte-identical to before the edit (no accidental reflow). Verify with `git diff --stat`: should show only the new section additions and the Contents index update.

**Verification:**
- `wc -l references/ai-slop-patterns.md` shows ~80–120 line increase (4 sections × ~20 lines each).
- Manual visual scan: each new section reads as universal craft, not Hyperscale-specific.

---

- U2. **Add Rule #19 "Order Lists by Magnitude and Recognizability" to SKILL.md**

**Goal:** Land the list-ordering universal rule as Rule #19 in the SKILL.md universal rules section.

**Requirements:** R2

**Dependencies:** None (independent of U1, but commit together for atomic v2.6.0 ship)

**Files:**
- Modify: `plugins/writing/skills/writing/SKILL.md`

**Approach:**
- Insert as `### 19. Order Lists by Magnitude and Recognizability` immediately after the existing `### 18. Pressure-Test Drafts Against Editor Reflexes` section.
- Content: 1 paragraph stating the rule, 1 cautionary anti-pattern → corrected example pair (drawn from the audit findings — the Wärtsilä/PROENERGY/INNIO example, generalized to remove the Hyperscale framing), and the principle "the first list item is the anchor; smallest or least-recognizable or most-foreign first weakens the hook before the thesis lands."
- Include explicit guidance on the two cases: (a) magnitude ordering (largest-first); (b) recognizability tiebreaker when magnitudes are comparable; (c) foreign-spelling exception (avoid leading with brand names containing umlauts/accents/diacritics unless the brand is the single most recognized in its category).

**Patterns to follow:**
- Existing rules #15, #16, #17, #18. Each uses a clear H3 heading, an opening sentence stating the rule, a `Wrong: / Right:` example pair, and a Why / Fix paragraph. Rule #19 mirrors that shape.

**Test scenarios:**
- Happy path: `grep -nE '^### 19\. Order Lists by Magnitude' SKILL.md` returns one line.
- Happy path: `grep -A1 '^### 19' SKILL.md` shows the opening sentence stating the rule.
- Edge case: Rules #15–#18 are byte-identical to before. Rule #20 does not appear (we are adding exactly one rule, not two).

**Verification:**
- `wc -l SKILL.md` shows ~20–30 line increase.
- Visual scan: rule reads as universal craft applicable to any list-bearing content (datacenter deals, news bullet roundups, project budgets, candidate lists), not Hyperscale-specific.

---

- U3. **Wire new patterns into EVAL 7, Pre-Publish Checklist, and version bump**

**Goal:** Make the new patterns first-class citizens of the binary-quality checks and the pre-publish workflow. Bump skill version.

**Requirements:** R3

**Dependencies:** U1, U2

**Files:**
- Modify: `plugins/writing/skills/writing/SKILL.md`

**Approach:**
- Bump frontmatter `version: 2.5.1` → `version: 2.6.0`.
- Expand `EVAL 7: No AI slop patterns` question text to include the four new categories from U1 (the rolled-up enumeration pattern is already established).
- Add the four new ai-slop categories and Rule #19 to the `## Pre-Publish Checklist` section (each as a new line in the existing `- [ ]` list with a brief reference to the relevant section).
- Update any `## Gotchas` items if a gotcha now applies to a new pattern (most likely none — the existing gotchas are about em dashes, contractions, AI-slop-pattern recognition; the four new patterns either have greppable checks or follow the same recognition discipline). Skip this if no gotcha is genuinely needed.

**Patterns to follow:**
- The existing EVAL 7 wording for the rolled-up enumeration shape.
- The existing Pre-Publish Checklist line shape: short label + parenthetical reference to the SKILL.md rule or ai-slop section.

**Test scenarios:**
- Happy path: `grep -E '^version: 2\.6\.0$' SKILL.md` returns one line.
- Happy path: EVAL 7's question text contains the four new category names.
- Happy path: Pre-Publish Checklist contains 5 new lines (4 ai-slop categories + Rule #19).
- Edge case: Existing EVAL rows (1, 2, 3, 4, 5, 6, 8, 9, 10) are byte-identical. Existing checklist items unchanged.

**Verification:**
- `git diff --stat plugins/writing/skills/writing/SKILL.md` shows additive changes only.
- The version bump is the only change to frontmatter (no other frontmatter fields touched).

---

- U4. **Verify marketplace.json is in sync; ship as one commit**

**Goal:** Confirm the writing entry in `.claude-plugin/marketplace.json` does not need updating, and land all four prior units as a single atomic commit per the saved memory `feedback-skills-in-plugin-repos.md`.

**Requirements:** R4

**Dependencies:** U1, U2, U3

**Files:**
- Read: `.claude-plugin/marketplace.json` (verify only — no edit expected)

**Approach:**
- Inspect the `"name": "writing"` plugin entry in `.claude-plugin/marketplace.json`. Confirm:
  - `description` is general enough to cover the v2.6.0 additions (it should be — the existing description mentions "anti-AI detection" generically).
  - `source` path is unchanged (`./plugins/writing`).
  - No version field in marketplace.json at the plugin level (the marketplace entry doesn't carry a version; plugin version lives in SKILL.md frontmatter).
- If any of the above checks fail, edit accordingly and include in the same commit. Expected: no edit needed; verification only.
- Stage SKILL.md and ai-slop-patterns.md changes; create the commit with conventional message `feat(writing): v2.6.0 — five net-new universal patterns from Hyperscale audit`. Reference the audit findings file in the commit body.

**Patterns to follow:**
- Recent commit `b18a5e3 feat(writing): v2.5.0 — channel-context voice rule, parallel-clause punchlines, X-craft additions, audit pass` for the conventional commit message shape.
- Recent commit `336003a feat(writing): bump to 2.4.0 with humanizer-derived enhancements` for the version-bump phrasing.

**Test scenarios:**
- Happy path: `grep -A4 '"name": "writing"' .claude-plugin/marketplace.json` shows source still `./plugins/writing` and description unchanged.
- Happy path: After commit, `git log -1 --stat` shows only the two writing skill files modified (SKILL.md + ai-slop-patterns.md). marketplace.json appears in diff only if a verification-driven update was needed.
- Edge case: Pre-commit hook (if any) runs without issue. If a hook fails (e.g., a markdown linter), fix the issue and recommit; do not skip the hook.

**Verification:**
- `git log -1 --oneline` shows the new commit.
- The commit is atomic (one feat commit, not split across multiple per-file commits).

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Stale-cache discovery — current cached writing skill is v2.4.0 but the repo source is v2.5.1, so my audit was against an older version. New audit deltas might already be in v2.5.x. | Already verified at planning time: `grep -inE 'should x.*or\|two.part\|dual.clause\|largest.first\|foreign.spell\|mechanics.over\|spectacle\|cratered\|unravels\|round.aggressive\|fractional.magnitude\|time.deixis\|today.s news' SKILL.md ai-slop-patterns.md` returned zero matches against v2.5.1. The five deltas are still novel. |
| The four new ai-slop patterns end up being too Hyperscale-flavored and read as brand-specific in a universal catalog. | Each section's content draws on the audit findings file's Bucket 3, which deliberately re-framed the examples to be generalizable. The visual scan in U1 verification catches any Hyperscale-specific language that slipped through. |
| EVAL 7 enumeration grows past readability. | Already at 9 categories pre-edit. Adding 4 more brings total to 13. If the question line becomes too long, split into a one-line summary + a bulleted list of categories beneath it. Style-only fix at U3 execution time. |
| Skill cache invalidation — users on existing v2.5.1 installs need to update before the new patterns are loaded. | Out of scope for this plan. Cache update is a downstream user concern; once committed and pushed, the marketplace handles distribution on next plugin sync. |

## Documentation / Operational Notes

- Plan and audit findings cross-reference the Hyperscale repo PR (https://github.com/jdickey1/hyperscale/pull/45) for reviewers who want the original discovery context.
- After commit, no further action needed in this repo — the marketplace handles distribution.

## Sources & References

- Audit findings (private): `~/Projects/hyperscale/docs/plans/2026-05-09-001-coverage-audit-findings.md`
- Hyperscale PR (private): https://github.com/jdickey1/hyperscale/pull/45
- Hyperscale Style Guide (vault, private): `01-Projects/Hyperscale/Hyperscale News - Style Guide.md`
- Saved memory: `~/.claude/projects/-Users-james/memory/feedback-skills-in-plugin-repos.md`
- Saved memory: `~/.claude/projects/-Users-james/memory/feedback-ai-content-system-pitches.md`
- Recent precedent commits: `b18a5e3` (v2.5.0 bundle bump), `8da718e` (Rule #18 add), `336003a` (v2.4.0 bump phrasing)
