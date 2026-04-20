---
title: "feat(seo): Operationalize NAP/Google Maps consistency check"
type: feat
status: active
date: 2026-04-19
---

# feat(seo): Operationalize NAP/Google Maps consistency check

**Target repo:** `claude-skills` (this repo — `plugins/seo/`)

## Overview

The SEO skill already mentions NAP (Name, Address, Phone) consistency as a checklist item in three places, but it is not operationalized. There is no canonical-source definition, no normalization rules (e.g., "Suite" vs "Ste.", phone-format variants), no specific procedure for extracting NAP from the Google Maps / GBP listing, no delta-report format, and no severity calibration. This plan turns the existing scattered bullets into a single authoritative operational procedure inside `reference/local-seo.md`, then updates the two commands (`/seo-gbp`, `/seo-audit`) and the audit checklist so the procedure is actually invoked during audits.

## Problem Frame

A local-SEO audit (e.g., the DLG work tracked in `01-Projects/DLG/dlg-seo-audit-master.md`) can silently lose 3-pack visibility when the business's NAP drifts between the website, the Google Maps listing, and directory citations. Common failure modes — flagged in a recent local-SEO playbook digested at `web-analyses/2026-04-19-irentdumpsters-2045968270986219862.md` — include: "Suite" vs "Ste.", zip vs zip+4, phone formatted as `(555) 123-4567` on one surface and `555-123-4567` on another, street-type abbreviation drift (`Street` vs `St`), and LLC-suffix presence mismatches (`Elite Plumbing LLC` on the website vs `Elite Plumbing` on GBP). Google treats any of these as a trust-drop signal. The current skill tells an auditor to "check NAP consistency" but gives no procedure for *how*, *against what*, or *how bad is each drift type*.

## Requirements Trace

- **R1**: The skill contains a single authoritative procedure for NAP/GBP consistency checking, not three scattered bullets.
- **R2**: The procedure names canonical sources explicitly, including the Google Maps / Google Business Profile listing itself (not just "citations").
- **R3**: The procedure specifies how to extract NAP from each canonical source, including a concrete Google-Maps extraction path (dev-browser script-based primary, user-paste fallback).
- **R4**: The procedure defines normalization rules that handle the drift types the 2025-2026 Google enforcement pattern punishes (suite abbreviations, zip+4, phone format, street abbreviation, LLC-suffix presence).
- **R5**: The procedure emits a concrete delta-report format (sources-as-rows, NAP-fields-as-columns) that the commands reuse verbatim.
- **R6**: Each type of NAP drift is mapped to an audit severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), calibrated against `reference/ranking-factors.md`.
- **R7**: The `/seo-gbp` command invokes the procedure and includes the delta report in its output.
- **R8**: The `/seo-audit` command's step 8 (Citation check) invokes the procedure for local businesses.
- **R9**: The existing three scattered NAP bullets in `reference/audit-checklist.md` are reconciled into a single coherent check that references the procedure.
- **R10**: All stray Playwright references in the SEO skill and commands are replaced with dev-browser guidance, so the house standard is consistent across the entire plugin (not just the new procedure).

## Scope Boundaries

- The procedure covers checking — not fixing. Auditors still remediate by hand (or through future tooling). Out of scope: automated directory-listing corrections.
- Citation-tool integrations (BrightLocal, Whitespark, Yext) are out of scope for this plan. The procedure can be executed manually via curl + Playwright + user paste.
- The procedure handles US-formatted NAP only for v1. International-address normalization (UK postcode formats, AU unit numbers, etc.) is out of scope.

### Deferred to Separate Tasks

- **`Tools/nap-check.mjs` normalization + diff helper script**: An automated CLI that ingests pasted NAP strings for each source and emits the delta-report JSON mechanically. The procedure in v1 is executable by-hand; the script is a quality-of-life improvement for auditors running the check frequently. Deferred to a separate plan once the procedure has been exercised against 2-3 real audits (DLG, a test case, etc.).
- **International address normalization**: UK/AU/CA-specific rules. Separate plan when a non-US client needs it.
- **Citation-platform API integration**: Pulling NAP from Yelp/BBB/Apple Maps via their search endpoints programmatically. Separate plan — currently a manual step.

## Context & Research

### Relevant Code and Patterns

- `plugins/seo/skills/seo/reference/local-seo.md` lines 69–72 — existing "NAP Consistency" sub-section (3 bullets, no procedure).
- `plugins/seo/skills/seo/reference/local-seo.md` lines 9–13 — existing "Category & Setup" checklist with "Address and phone match website NAP exactly" bullet.
- `plugins/seo/skills/seo/reference/audit-checklist.md` lines 125, 138, 188 — three scattered NAP bullets to reconcile.
- `plugins/seo/commands/seo-gbp.md` — existing command already says "Check NAP consistency against their website" (step 5) but does not define how.
- `plugins/seo/commands/seo-audit.md` — existing command references `local-seo.md` for local businesses but step 8 (Citation check) is not prescriptive about NAP.
- `plugins/seo/skills/seo/reference/ranking-factors.md` — authoritative severity calibration; the new severity map must cite it.
- **Pattern to mirror**: `plugins/seo/skills/seo/SKILL.md` "Verification Rules (CRITICAL)" block (lines 108–126) — shows how the skill already operationalizes a check (raw-HTML verification) with explicit `curl` commands, confidence levels, and when-to-use criteria. The new NAP procedure should follow this shape.

### Institutional Learnings

- `web-analyses/2026-04-19-irentdumpsters-2045968270986219862.md` (digested earlier in this session) — local-SEO operator's thread flagging exactly the drift types the procedure must detect: "Suite" vs "Ste.", zip-code typos, inconsistent phone formats. Thread claims these alone are enough for Google to question whether a business is real.
- Memory `feedback-local-patterns-first.md` — use VPS standards doc and existing project code for patterns before external web research. Applied here: mirroring the existing `Verification Rules` pattern in SKILL.md rather than inventing a new doc layout.
- Memory `feedback-obsidian-vault-first.md` — check vault docs before reinventing. DLG's `seo-audit-master.md`, `seo-audit-2026-02-21.md`, and `2026-04-18-001-fix-seo-audit-remediations-plan.md` are the real-world callers of this procedure and should be consulted when calibrating what the procedure needs to output.

### External References

- Whitespark Local Ranking Factors (already linked in SKILL.md Supporting References) — citation/NAP weight evidence.
- Google Business Profile Help (already linked) — GBP NAP-matching guidelines.

## Key Technical Decisions

- **Keep the procedure inside `reference/local-seo.md` rather than a new `reference/nap-consistency.md` file.** Rationale: NAP consistency is local-SEO-specific, tightly coupled to the existing GBP and Citations sections in that file, and a standalone file would fragment the local-SEO reference for no navigational gain.
- **dev-browser for GBP extraction (primary), user-paste fallback.** Rationale: Google Maps listings are heavily JS-rendered and the auditor's session may or may not be logged in. `dev-browser` (the house standard, per `feedback-dev-browser-scripts.md`) uses a persistent real-browser session that Google Maps treats as a normal user. Script files are written to `/tmp/*.js` and invoked via `dev-browser run /tmp/script.js` — never heredocs or inline `-e` flags. User-paste is the guaranteed-to-work fallback that keeps the procedure executable even when dev-browser isn't available.
- **Sweep stray Playwright references in one pass (Unit 4) rather than leaving them as follow-on cleanup.** Rationale: 4 lines across 3 files (SKILL.md:75 and :180, seo-audit.md:20, seo-aeo.md:45) is too small a change to defer; leaving Playwright mentions in place while writing a new dev-browser procedure would create confusing contradictions inside the same plugin. Folding the sweep into this plan keeps the house standard coherent.
- **Normalization is advisory, byte-exact is the gate.** Rationale: the ranking-impact evidence supports byte-exact as the target state. Normalized matching is used only to *describe* what kind of drift exists, not to say "it's fine because they normalize the same." Auditor output always flags drift; normalization tells the auditor how severe the drift is.
- **Severity calibration reuses the existing CRITICAL/HIGH/MEDIUM/LOW/INFO ladder from `ranking-factors.md`.** Rationale: consistency with the rest of the audit output. Don't invent a NAP-specific severity taxonomy.
- **Delta-report format is a Markdown table (sources-as-rows, NAP-fields-as-columns).** Rationale: matches the existing audit output style (SKILL.md `Output Format` section), renders cleanly in PR review, and a later `Tools/nap-check.mjs` can emit the same shape as JSON and then as a rendered table.
- **SKILL.md version bump 2.3.0 → 2.4.0.** Rationale: the skill's public surface gains a new required procedure and commands gain new prescribed steps. Minor-version bump under the skill's existing semver convention.

## Open Questions

### Resolved During Planning

- **Should this live in `reference/local-seo.md` or its own file?** Resolved: stays in `local-seo.md` — see Key Technical Decisions.
- **Should normalization tolerate soft-matches (e.g., "Suite" vs "Ste.") or flag them?** Resolved: always flag. The business should have a single canonical form and propagate it everywhere. Normalization is used to describe the drift type, not excuse it.
- **Does the skill need a new file listed in SKILL.md's reference-files table?** Resolved: no — changes stay inside existing reference files and commands, so the SKILL.md reference-file table is unchanged.

### Deferred to Implementation

- **Exact dev-browser selectors for GBP name / address / phone.** Google Maps DOM is not version-stable. The procedure will describe the extraction as "locate the primary listing card, extract the business-name header, the address line, and the tap-to-call phone link." The implementer will write the actual selector against a real GBP at implementation time (inside a `/tmp/nap-gbp.js` script file invoked with `dev-browser run /tmp/nap-gbp.js`) and iterate if Google changes the DOM.
- **Phone normalization canonical form** — E.164 (`+15551234567`) vs hyphenated (`555-123-4567`). The procedure will specify a canonical form; the implementer will pick one (likely E.164 since it's unambiguous) during Unit 1.
- **Whether to include Facebook Page as a Tier-1 citation source for NAP matching.** Not enough signal yet; the implementer can decide based on whether the Facebook-page NAP is easy to extract.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**Procedure shape** (conceptual — expressed as the delta-report the auditor produces):

```
NAP Consistency Delta Report — {Business Name}

| Source                          | Name                        | Address                                        | Phone           |
|---------------------------------|-----------------------------|------------------------------------------------|-----------------|
| Website homepage (visible)      | Elite Plumbing LLC          | 123 Main St, Suite 200, Dallas, TX 75201       | (214) 555-0100  |
| Website footer                  | Elite Plumbing              | 123 Main Street, Ste 200, Dallas, TX 75201     | 214-555-0100    |
| Website contact page            | Elite Plumbing LLC          | 123 Main St, Suite 200, Dallas, TX 75201-1234  | (214) 555-0100  |
| LocalBusiness JSON-LD schema    | Elite Plumbing LLC          | 123 Main Street, Dallas, TX 75201              | +12145550100    |
| Google Maps (GBP)               | Elite Plumbing              | 123 Main St #200, Dallas, TX 75201             | (214) 555-0100  |
| Yelp                            | Elite Plumbing LLC          | 123 Main St Ste 200, Dallas, TX 75201          | (214) 555-0100  |
| Bing Places                     | Elite Plumbing              | 123 Main St, Dallas, TX 75201                  | (214) 555-0100  |

Drift found:
- Name: LLC suffix present on 4/7 sources, absent on 3/7 → CRITICAL (GBP lacks suffix)
- Address: 5 distinct formats for Suite/Ste/#200 → HIGH
- Address: zip+4 present only on contact page → LOW
- Phone: 3 distinct formats, all same digits → INFO (digit-match, format drift)
```

**Severity mapping** (directional — final calibration in Unit 1):

| Drift type                                           | Severity  | Why                                               |
|------------------------------------------------------|-----------|---------------------------------------------------|
| GBP ↔ website name mismatch (different digits/words) | CRITICAL  | Suspension risk, de-duplication failure           |
| GBP ↔ website phone digit mismatch                   | CRITICAL  | Suspension risk                                   |
| GBP ↔ website address street-number mismatch         | CRITICAL  | Suspension risk                                   |
| Name: LLC/Inc/Corp suffix drift                      | HIGH      | Trust-drop signal; Google wants one canonical    |
| Address: Suite/Ste/#/Unit formatting drift           | HIGH      | Citation consistency is an 18x factor             |
| Address: Street/St or Avenue/Ave abbreviation drift  | MEDIUM    | Drift signal but less operationally breaking      |
| Address: zip+4 presence mismatch                     | LOW       | Minor; Google tolerates                           |
| Phone format drift (digits match, format differs)    | INFO      | Same underlying value; cosmetic                   |
| Tier-1 citation ↔ GBP mismatch (any field)           | HIGH      | Citation is verification-layer (Whitespark 2026)  |
| Tier-2 citation ↔ GBP mismatch (any field)           | MEDIUM    | Lower authority weight                            |

**Canonical sources** (the rows of the delta report, in priority order):

1. Google Maps / GBP listing — the source of truth Google itself rank-uses.
2. Website homepage (visible rendered content — not extractor output).
3. Website footer (visible rendered content).
4. Website contact page (visible rendered content).
5. `LocalBusiness` / `Organization` JSON-LD schema (machine-readable NAP).
6. Tier-1 citations: Yelp, Apple Business Connect, Bing Places, BBB.
7. Tier-2 citations: Facebook Page, Chamber of Commerce, industry-specific directory.

## Implementation Units

- [ ] **Unit 1: Expand `reference/local-seo.md` NAP Consistency section into operational procedure**

  **Goal:** Turn the existing 3-bullet NAP Consistency section (lines 69–72) into a full operational procedure covering canonical sources, extraction steps (including a concrete Google Maps / GBP extraction path), normalization rules, delta-report format, and severity calibration. This unit produces the authoritative procedure the rest of the plan references.

  **Requirements:** R1, R2, R3, R4, R5, R6

  **Dependencies:** None

  **Files:**
  - Modify: `plugins/seo/skills/seo/reference/local-seo.md`
  - Modify: `plugins/seo/skills/seo/SKILL.md` (version bump 2.3.0 → 2.4.0 only)

  **Approach:**
  - Replace the existing `### NAP Consistency` sub-section (~3 bullets) with a structured procedure that mirrors the shape of the existing `## Verification Rules (CRITICAL)` block in `SKILL.md` (lines 108–126): intent paragraph, when-to-use, numbered steps, example output, severity table.
  - The procedure must define **canonical sources** as a numbered list (GBP first), with, for each source, a one-line instruction for *how to extract* NAP from it.
  - The Google Maps / GBP extraction step must describe both a dev-browser path (write a script file to `/tmp/nap-gbp.js` that uses `browser.getPage("seo-gbp")`, navigates to the GBP public URL, waits for JS render, evaluates the DOM, and prints NAP; run it via `dev-browser run /tmp/nap-gbp.js`) and a user-paste fallback. Do not write the actual dev-browser script — that's implementation-time (see Deferred to Implementation). The procedure must explicitly forbid heredoc / inline-`-e` invocations of dev-browser per `feedback-dev-browser-scripts.md`.
  - Include the Markdown delta-report template shown in High-Level Technical Design.
  - Include the severity table shown in High-Level Technical Design, with each row citing `ranking-factors.md` evidence where available.
  - Define normalization rules as a flat list: case, punctuation (. , #), Suite/Ste/Unit/#, Street/St, Avenue/Ave, Boulevard/Blvd, phone canonical form (pick E.164 unless implementation discovers a reason otherwise), zip-vs-zip+4, LLC/Inc/Corp suffix handling.
  - Cross-reference the GBP Category & Setup bullet "Address and phone match website NAP exactly" (line 11) with a pointer to the new procedure, rather than duplicating guidance.

  **Patterns to follow:**
  - `plugins/seo/skills/seo/SKILL.md` lines 108–126 (`## Verification Rules (CRITICAL)`) — shape and tone.
  - `plugins/seo/skills/seo/SKILL.md` lines 129–154 (`## Binary Audit Checks`) — severity-calibration style.

  **Test scenarios:**
  - *Happy path*: A fictional `Elite Plumbing LLC` with 7 canonical sources and 4 drift types — run the procedure by-hand against the doc alone, produce the delta report and severity assignments without looking outside the doc. Procedure passes if an auditor can do this cold.
  - *Edge case*: Business with only 1 physical location and no Yelp / Bing presence yet — procedure gracefully handles missing Tier-1 citations (the delta report simply has fewer rows; procedure does not error out or refuse to produce output).
  - *Edge case*: Business legal name is `Elite Plumbing, LLC` (comma present) while GBP shows `Elite Plumbing` — procedure correctly classifies this as the "LLC suffix drift" HIGH row, not a digit-mismatch CRITICAL.
  - *Edge case*: Phone `+12145550100` vs `(214) 555-0100` — procedure normalizes both to the canonical form and classifies as INFO (digit-match), not as a CRITICAL digit-mismatch.
  - *Edge case*: Address `123 Main St #200` (GBP) vs `123 Main Street, Suite 200` (website footer) — procedure correctly classifies as HIGH Suite-formatting drift, not as a street-number mismatch.
  - *Integration*: An auditor running `/seo-gbp` against a real DLG-style business can produce the delta report using only the new procedure text. No external lookups required beyond the canonical-source extraction commands the procedure itself specifies.

  **Verification:**
  - The section now contains: intent paragraph, canonical-sources list (7 entries, GBP first), extraction instructions per source, normalization rules, Markdown delta-report template, severity table with per-row evidence cite.
  - Cross-references from `Category & Setup` → new procedure are in place; no duplicated NAP guidance remains in `local-seo.md`.
  - SKILL.md frontmatter version is `2.4.0`.

- [ ] **Unit 2: Update `/seo-gbp` and `/seo-audit` commands to invoke the procedure**

  **Goal:** Make the procedure actually run during audits. The `/seo-gbp` command becomes the primary caller (emits the delta report as part of its output). The `/seo-audit` command invokes the procedure at step 8 (Citation check) for local businesses.

  **Requirements:** R7, R8

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `plugins/seo/commands/seo-gbp.md`
  - Modify: `plugins/seo/commands/seo-audit.md`

  **Approach:**
  - In `seo-gbp.md`, replace the existing step 5 ("Check NAP consistency against their website") with an explicit step that references the new procedure in `reference/local-seo.md` and requires the delta report as part of the command output.
  - Add a new `### NAP Consistency Delta` section to the `seo-gbp.md` command's `## Output` description so callers know the delta report is a required output block.
  - In `seo-audit.md`, update the existing step 8 ("Citation check (local)") to explicitly invoke the new procedure for local businesses. Audit severity mapping from the procedure feeds into the overall `Local SEO / GBP` score (existing 20-point slice).
  - Both commands remain self-contained — no new frontmatter fields, no argument-hint changes.

  **Patterns to follow:**
  - `plugins/seo/commands/seo-audit.md` existing "Process" step list — numbered, short, references a reference file for detail.
  - `plugins/seo/commands/seo-gbp.md` existing "Output" block — PASS/FAIL per section.

  **Test scenarios:**
  - *Happy path*: Running `/seo-gbp "Elite Plumbing"` produces an output that includes the delta-report table from Unit 1. The command's existing checklist output remains unchanged.
  - *Happy path*: Running `/seo-audit https://example-plumber.com` on a local-business site produces an audit report where step 8 contains the delta report, and findings from the procedure show up in the `Per-Finding Format` output with CRITICAL/HIGH/MEDIUM/LOW/INFO severity properly calibrated per Unit 1's severity table.
  - *Edge case*: `/seo-audit` on a non-local business (e.g., a SaaS product site) — step 8 still runs but skips the procedure (no GBP to check) without failing. The command output explicitly notes "NAP consistency check skipped — no GBP / non-local business."
  - *Edge case*: `/seo-gbp` invoked when the Google Maps listing cannot be reached via dev-browser (dev-browser not installed, script errors, or Google blocks the session) — command falls back to user-paste NAP extraction per the procedure, still produces a delta report (one row may be user-provided rather than auto-extracted), and the confidence on the GBP row is marked `NEEDS VERIFICATION` per SKILL.md confidence rules.

  **Verification:**
  - `/seo-gbp` output contract now explicitly includes the NAP delta report.
  - `/seo-audit` step 8 references the new procedure by file path and section anchor.
  - Existing command functionality (category review, photo upload check, review velocity, etc.) is unchanged.

- [ ] **Unit 3: Reconcile scattered NAP bullets in `reference/audit-checklist.md`**

  **Goal:** The three existing NAP bullets in `audit-checklist.md` (lines 125, 138, 188) currently each say the same thing with slightly different wording and no procedure. Consolidate into a single coherent check per section that points to the procedure, eliminating the implicit "audit NAP" three times with no method problem.

  **Requirements:** R1, R9

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `plugins/seo/skills/seo/reference/audit-checklist.md`

  **Approach:**
  - Line 125 (on-page NAP) — keep as a checklist item but rephrase to reference the procedure: *"NAP consistency across website surfaces (homepage visible, footer, contact page, JSON-LD schema) — see NAP Consistency Procedure in `local-seo.md`."*
  - Line 138 (GBP NAP match) — rephrase to reference the procedure: *"GBP address and phone match website NAP per NAP Consistency Procedure (see `local-seo.md`)."*
  - Line 188 (citation NAP match) — rephrase to reference the procedure: *"Citation NAP matches GBP per NAP Consistency Procedure (see `local-seo.md`)."*
  - Do not remove any of the three bullets — each stays in its section (on-page, GBP, citations) to preserve the tier structure of the checklist. The change is wording + cross-reference only.

  **Patterns to follow:**
  - Existing cross-reference pattern in `audit-checklist.md` — lines 133, 178 already use "See `reference/local-seo.md` for full..." to point into reference material. Mirror that idiom.

  **Test scenarios:**
  - *Happy path*: An auditor reading the checklist from the top now finds that all three NAP bullets share a single canonical procedure and understand that running the procedure once satisfies all three checks (not three separate comparisons).
  - *Edge case*: Reviewer compares the checklist against `local-seo.md` — no NAP guidance is duplicated between the two files. Reference file is the source of truth; checklist is a pointer.

  **Verification:**
  - Lines 125, 138, 188 of `audit-checklist.md` each contain a short phrasing + explicit pointer to the procedure.
  - Searching `audit-checklist.md` for `NAP` returns exactly 3 checklist-item hits (same as before), not zero and not more.

- [ ] **Unit 4: Replace stray Playwright references with dev-browser across the SEO plugin**

  **Goal:** Bring the existing SEO plugin into alignment with the dev-browser house standard so there are no contradictory browser-automation instructions inside the same plugin.

  **Requirements:** R10

  **Dependencies:** None (can run in parallel with Units 1-3)

  **Files:**
  - Modify: `plugins/seo/skills/seo/SKILL.md`
  - Modify: `plugins/seo/commands/seo-audit.md`
  - Modify: `plugins/seo/commands/seo-aeo.md`

  **Approach:**
  - `plugins/seo/skills/seo/SKILL.md` line 75 (in the `DO` list): replace "**Use Playwright** to load and inspect live pages (snapshot, screenshot, evaluate DOM)" with dev-browser equivalent. The dev-browser idiom (script-file-only, `browser.getPage()`, `p.evaluate()`) must be referenced so readers know the right invocation pattern, not just the right tool name. Follow the `feedback-dev-browser-scripts.md` rule ("never heredocs or inline -e flags").
  - `plugins/seo/skills/seo/SKILL.md` line 180 (in the `## Audit Tools` section): replace "**Playwright browser tools** — Navigate, snapshot, screenshot, evaluate JavaScript on pages" with a dev-browser-equivalent entry that preserves the capability list (navigate, screenshot, evaluate DOM). Note that screenshotting is supported via dev-browser's page.screenshot().
  - `plugins/seo/commands/seo-audit.md` line 20: replace "Use Playwright to inspect live pages (snapshot, screenshot, evaluate DOM)" with dev-browser equivalent.
  - `plugins/seo/commands/seo-aeo.md` line 45: same replacement.
  - Do not rewrite surrounding paragraphs — single-line replacements only. If the replacement text would change severity calibration, audit execution order, or other structural content, stop and flag for a larger change.

  **Patterns to follow:**
  - `feedback-dev-browser-scripts.md` house rule (script files only, `dev-browser run /tmp/script.js`, never heredocs).
  - The new Unit 1 procedure language — Unit 4 should use wording consistent with how Unit 1 describes dev-browser so the plugin reads coherently.

  **Test scenarios:**
  - *Happy path*: `grep -i playwright plugins/seo/` returns zero matches after Unit 4. `grep -i dev-browser plugins/seo/` shows dev-browser now mentioned in SKILL.md, seo-audit.md, seo-aeo.md, and the new NAP procedure.
  - *Edge case*: The SKILL.md `DO` list still reads as a coherent DO block — replacement text doesn't leave a dangling fragment or break the list's parallel structure (each bullet remains imperative-verb-led, same length band).
  - *Edge case*: The `## Audit Tools` entry preserves the four capabilities (navigate, screenshot, evaluate DOM, and the replacement for "snapshot" — dev-browser equivalent is `p.content()` or `p.evaluate("document.documentElement.outerHTML")`). If any capability has no equivalent, flag it — do not silently drop it.
  - *Integration*: A reader who loads the SKILL.md after the change, then reads the new NAP procedure in `local-seo.md`, sees the same tool (dev-browser) referenced the same way in both places. No "use Playwright here, dev-browser there" contradiction anywhere in the plugin.

  **Verification:**
  - `grep -ni playwright plugins/seo/` returns no matches.
  - All 4 original lines have been replaced with dev-browser equivalents that preserve the capability list.
  - The `DO` list and `Audit Tools` section still read as coherent English — no dangling fragments, no list-structure breaks.

## System-Wide Impact

- **Interaction graph**: The procedure is new but the skill's existing command-to-reference-file interaction pattern is unchanged. No callers of the skill outside the `seo` plugin need to change.
- **Error propagation**: The procedure is by-hand — there are no runtime errors to propagate. The only failure mode is "Playwright can't reach GBP," and Unit 2 handles it via the documented user-paste fallback.
- **State lifecycle risks**: None. This is a docs + command-text change. No persistent data is written, no scripts run on a schedule, no .learnings.jsonl schema changes.
- **API surface parity**: The `/seo-gbp` and `/seo-audit` commands gain a new required output block (delta report for local businesses). Existing `argument-hint` values are unchanged, so the CLI surface is backward-compatible.
- **Integration coverage**: Unit 2's "non-local business" edge case is specifically the integration scenario that unit tests alone wouldn't prove — a reviewer must read the updated command against a non-local site's audit output to confirm it degrades gracefully.
- **Unchanged invariants**: The skill's 4-tier severity ladder, verification-rules block, anti-patterns table, and the 13-step audit execution order are all unchanged. The procedure slots into step 8 without reshaping the order. Unit 4 touches individual lines in the DO list and Audit Tools section but preserves their structure — no list-shape changes, no new/removed items.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Google Maps DOM changes and the dev-browser extraction step breaks | The procedure's user-paste fallback is always executable; dev-browser is a speed optimization, not a hard dependency. |
| Implementer reaches for Playwright because existing SKILL.md still mentions it | Unit 4 sweeps the 4 stray references in one pass so the house standard is consistent across the entire plugin. |
| Unit 4's text replacements accidentally change audit-tool capabilities the skill actually relies on (e.g., screenshot) | dev-browser has equivalent capabilities (navigate, evaluate DOM, screenshot); Unit 4 Verification requires the replacement text to preserve the capability list, not just swap the tool name. |
| Normalization rules over-reach and soft-match drift that should be flagged | Explicit design decision (Key Technical Decisions): normalization is descriptive, not gating. Every drift is always reported; normalization only sets severity. |
| The new procedure conflicts with something in `ranking-factors.md` calibration | Unit 1 requires each severity-table row to cite the `ranking-factors.md` evidence. Any conflict surfaces during Unit 1 review. |
| The three audit-checklist reconciliations in Unit 3 accidentally drop NAP coverage from one of the three tiers | Unit 3 Verification step explicitly checks that searching `audit-checklist.md` for `NAP` still returns 3 hits — not 0 and not more. |
| International-address customers try to use this v1 and get wrong results | Scope Boundaries explicitly say v1 is US-only; international is deferred. Procedure preamble will state this. |

## Documentation / Operational Notes

- Bump `plugins/seo/skills/seo/SKILL.md` `version: 2.3.0` → `2.4.0` (Unit 1).
- No changes to `marketplace.json` or plugin manifest — only skill internals change.
- No migration needed for downstream consumers: existing `/seo-audit` and `/seo-gbp` calls continue to work; the new procedure emits an additional output block for local businesses only.
- Consider exercising the new procedure against the live DLG audit (`01-Projects/DLG/dlg-seo-audit-master.md`) after merge to validate it against a real client footprint before declaring the skill ready for broad use. Not a blocker to merge.

## Sources & References

- **Digested source that surfaced the gap**: `web-analyses/2026-04-19-irentdumpsters-2045968270986219862.md` (local-SEO operator's thread on byte-exact NAP discipline).
- **Existing NAP bullets**:
  - `plugins/seo/skills/seo/reference/local-seo.md` lines 9–13, 69–72
  - `plugins/seo/skills/seo/reference/audit-checklist.md` lines 125, 138, 188
- **Existing `/seo-gbp` and `/seo-audit` commands**:
  - `plugins/seo/commands/seo-gbp.md`
  - `plugins/seo/commands/seo-audit.md`
- **Pattern to mirror (Verification Rules shape)**: `plugins/seo/skills/seo/SKILL.md` lines 108–126.
- **Severity calibration authority**: `plugins/seo/skills/seo/reference/ranking-factors.md`.
- **Real-world caller**: `01-Projects/DLG/dlg-seo-audit-master.md` (Obsidian vault) — the audit that will first exercise the procedure post-merge.
