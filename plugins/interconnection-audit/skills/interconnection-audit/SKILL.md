---
name: interconnection-audit
description: Use when auditing vault connections, checking vault health, finding orphan notes, discovering missing cross-note links, or improving interconnection between Obsidian vault notes. Also use after a batch of new content (20+ notes) or on a monthly cadence.
version: 1.5.0
effort: high
---

# Interconnection Mapping Audit

Scan an Obsidian vault, discover missing connections between notes, score vault interconnection health, and propose typed frontmatter connections for user approval.

## Overview

The audit runs four phases:
1. **Inventory** — scan every note, build a shared vault registry
2. **Discovery** — dispatch parallel subagents to analyze notes and propose connections
3. **Review** — deduplicate, score, generate report for user approval
4. **Apply** — write approved connections to note frontmatter

Default vault root: `~/Projects/obsidian/automation-vault-local/`
Override by passing a path as the first argument.

## Connection Format

Each connection lives in a note's YAML frontmatter:

```yaml
connections:
  - target: "01-Projects/Hyperscale/project-design.md"
    type: informs
    context: "Skill graph architecture pattern applicable to newsletter repurposing"
```

The `context` field is the critical LLM signal — one sentence explaining why this connection matters, so an LLM can decide whether to follow the link without reading the target.

**Connection types:** `informs`, `extends`, `blocks`, `contradicts`, `source-for`, `action-pending`, `supersedes`

Read `references/connection-schema.md` for full type definitions, reverse link pairs, and lifecycle rules.

## Step 0: Validate Before Proceeding

Verify the vault is accessible and worth auditing before dispatching any subagents.
The audit scans hundreds of files across 4 parallel agents — discovering a problem
after that work completes wastes significant compute and user time.

- **Confirm the vault path is reachable via SSH.** Run a quick `ls` against the vault root
  on `nonrootadmin` before proceeding. A failed SSH connection or missing directory is
  faster to catch now than after 30 seconds of inventory planning.
- **Check note count before committing to a full audit.** A vault with fewer than 10 `.md`
  files has no meaningful connection graph to map. If the count is below 10, report the
  count and ask the user whether they want to continue — don't run 4 phases against a
  handful of stub notes.

## Phase 1: Inventory & Scan

Run as a single orchestrator pass before dispatching subagents.

1. List all subdirectories of `{vault_root}/01-Projects/` to build the **project registry** (known project names)
2. Glob all `.md` files in the vault
3. For each file, extract:
   - **path** (relative to vault root)
   - **category** (classify by directory — see table below)
   - **frontmatter** (title, tags, status, existing connections)
   - **fingerprint** (title + tags + first non-empty body line)
4. Exclude `99-System/**` and `.trash/**` from deep analysis (keep in registry for incoming links)

### Category Classification

| Directory Pattern | Category |
|-------------------|----------|
| `01-Projects/**` | `project-doc` |
| `web-analyses/**` | `web-analysis` |
| `x-analyses/**` | `x-analysis` |
| `02-Areas/**` | `area` |
| `03-Resources/**` | `resource` |
| `project-status/**` | `status-file` |
| `00-Inbox/**` | `inbox` |
| `04-Journal/**` | `journal` |
| `99-System/templates/**` | `template` |
| `99-System/**` (other) | `system` |

Output a vault registry object with `project_names` array and `notes` array. Pass this to all Phase 2 subagents.

## Phase 2: Connection Discovery

Dispatch 4 parallel subagents (researcher type, read-only). Each receives the full vault registry plus its assigned partition for deep analysis.

| Agent | Partition | Read Depth |
|-------|-----------|------------|
| 1 | `01-Projects/` | Frontmatter + 30 lines |
| 2 | `web-analyses/` + `x-analyses/` | Full read |
| 3 | `02-Areas/` + `03-Resources/` | Frontmatter + 20 lines |
| 4 | `project-status/` + `00-Inbox/` + `04-Journal/` | Frontmatter + 30 lines |

**Override:** any file with "audit" in its name or any file in `web-analyses/`/`x-analyses/` always gets a full read.

Each agent can propose connections to **any note in the vault** (not just its partition) because it has the full registry.

Read `references/subagent-prompt.md` for the complete prompt template, discovery signals, and output format.

## Phase 2.5: Wikilink Backlink Enrichment (conditional)

After subagents return but before deduplication, optionally run `obsidian-cli` to surface wikilink-based relationships that content analysis may have missed.

**Precondition — confirm the vault actually uses body `[[wikilinks]]` before running.** This phase only yields results on vaults that link via inline `[[wikilinks]]` in note bodies. A vault that links exclusively via typed `connections:` frontmatter returns zero Linked Mentions for every note, so the phase is pure overhead. Check first:

```bash
# Count body wikilinks across the vault (excluding frontmatter is fine — this is a cheap signal)
grep -rlE '\[\[[^]]+\]\]' "{vault_root}" --include='*.md' | wc -l
```

If the count is near zero (vault links via frontmatter, not wikilinks), **skip Phase 2.5 entirely and record it as N/A in the report** — do not run per-orphan `obsidian-cli` calls. (2026-05-31: this vault returned zero Linked Mentions for every distinctively-named orphan because it links via typed frontmatter; the phase was dead weight.) Only proceed below when the vault demonstrably uses body wikilinks.

**Requires:** `obsidian-cli` installed locally (`brew install yakitrak/yakitrak/obsidian-cli`).

For each **orphan candidate** (notes with zero proposed connections from Phase 2):

```bash
obsidian-cli print "<note-name>" --vault automation-vault-local --mentions
```

This appends a "Linked Mentions" section showing every note that references this note via `[[wikilinks]]`, with the surrounding context line. For each mention found:
- If the linking note is in a **different directory** and no connection already exists → propose an `informs` or `source-for` connection (pick based on directionality)
- Use the mention's context line to draft the connection's `context` field
- Tag the proposal with signal `wikilink-backlink`

**Scope limit:** Only run on orphan candidates and notes with fewer than 2 proposed connections. Do not run on every note — it's a targeted enrichment pass, not a full scan.

**Fallback:** If `obsidian-cli` is not available, skip this phase silently. The audit still works without it.

## Phase 3: Review & Report

After all subagents return (and Phase 2.5 enrichment, if available):

1. **Deduplicate** — merge identical proposals, consolidate expected reverse pairs
2. **Check reverse links** — per the reverse link pairs table, flag missing reverses
3. **Identify orphans** — notes with zero connections outside their directory (exclude `99-System/**`, `00-Inbox/`, `04-Journal/`, and `06-Agent-Log/` — these categories are not intended to carry project connections). **Also exclude finished-experiment output trees** — leaves under a directory whose own name ends in `-\d{4}-\d{2}-\d{2}` (e.g. `01-Projects/Hyperscale/x-article-lede-test-2026-08-13/cells/`), where that dated directory holds **≥10 notes below its own top level** (mirroring the dated-series ≥10 threshold) and the note sits **at least one level below** it — documents directly in the dated directory are the experiment's write-up and are never excluded. All three conditions must hold; when uncertain, do not exclude. Do not add a filename-stem or recent-modification test: both were tried on 2026-09-11 and together caught only 12 of the 43 intended leaves, the freshness test failing on a 29-day-old experiment. Validated live, the three-condition form matches exactly 2 trees / 43 leaves / 1.6% and leaves all 50 other date-stamped directories counted normally. These are run artifacts, not documents anyone links; 43 of them floored the orphan dimension at 0.00 for four consecutive runs before the rule was adopted 2026-09-11. Report the matched trees and their leaf counts separately, and alarm if the rule alone removes >5% of the vault or matches >3 trees. **Also exclude recurring auto-generated dated series** — directories holding a daily/periodic stream of `YYYY-MM-DD.md` notes (e.g. `01-Projects/X-Intel/`). Treat these like journal/agent-log: ephemeral by design, not a connectivity failure. Detect a series as a directory where ≥10 children match **`^\d{4}-\d{2}-\d{2}\.md$`** — the date must be the *entire* filename stem; exclude those dated children from the orphan count (the directory's non-dated docs still count). (2026-05-31: 27 of 116 orphans were X-Intel dailies — structural, not missing links.)

   > **Anchor the regex — do not use a date *prefix* match.** The earlier form `^\d{4}-\d{2}-\d{2}.*\.md$` matches any filename that merely *starts* with a date, which silently swept 615 notes out of measurement on this vault: all 315 `web-analyses/`, all of `03-Resources/web-analyses/`, `05-Commitments/open|completed/`, `01-Projects/Hyperscale/drafts/`, and `01-Projects/JD-Key/`. Those are dated *documents*, not an auto-generated daily series. It hid **71 real orphans** and made coverage read 97.9% when the true figure was 93.3%. It also contradicted this skill's own Phase 2 partition table, which assigns `web-analyses/` a dedicated full-read discovery agent — the audit was reading those notes and then excluding them from every metric. Only a pure `YYYY-MM-DD.md` stem (the X-Intel case this rule was written for) qualifies. (2026-07-24: found and corrected; expect a one-time downward trend break in orphan count the first run after this change.)
4. **Detect stale connections** — broken targets or `action-pending` items older than 60 days. When counting **broken** targets, ignore (a) literal placeholder targets containing `{...}` and (b) any connection inside a `_TEMPLATE.md` / template file — these are illustrative format examples, not real links. (2026-05-31: `_TEMPLATE.md`'s `01-Projects/{ProjectName}/{main-design-doc}.md` was mis-counted as a broken link.)
5. **Score vault health** — calculate overall score out of 100 using five dimensions:
   - Connection coverage (30pts)
   - Action-pending clearance (25pts)
   - Orphan notes (20pts)
   - Link integrity (15pts)
   - Reverse link completeness (10pts)

Read `references/report-template.md` for the full template, scoring formulas, and deduplication rules.

Save report to `{vault_root}/project-status/interconnection-audit-YYYY-MM-DD.md`.

Present to user:
- Overall score and key metrics
- Proposal counts by category
- Path to saved report
- Ask: "Which connections to apply? Options: 'apply all', 'apply [section]', 'skip [section]', or 'let me review first'"

## Phase 4: Apply Approved Connections

For each approved connection:

1. Read the source note's full content
2. Parse existing YAML frontmatter
3. If `connections:` exists → append new connection to the array
4. If `connections:` missing → add after the last frontmatter field
5. If no frontmatter → add frontmatter with `connections:` only
6. Write file — **only modify frontmatter, never touch content below the closing `---`**

Apply reverse links to target notes using the same process.

Report: notes updated, connections written, any errors.

### Deleting Vault Files

When the audit recommends deleting files (empty placeholders, redirect stubs, duplicates), use the Vault Manager API on Mac Mini to delete from both local and VPS simultaneously. Direct `rm` only deletes locally and rsync will resurrect the file.

```bash
curl -s -X POST http://localhost:3456/api/delete \
  -H "Content-Type: application/json" \
  -d '{"paths": ["path/relative/to/vault/root.md", "another/file.md"]}'
```

The Vault Manager (`~/Projects/obsidian/vault-manager.ts`) runs on port 3456 and deletes from VPS via SSH first, then locally. Returns JSON with per-path success status. **Always use this for any file deletions or moves (delete old path after copying to new location).**

If the Vault Manager is not running, fall back to manual dual-delete:
```bash
ssh nonrootadmin "sudo -u obsidian rm -f '/home/obsidian/automation-vault/PATH'" && rm -f ~/Projects/obsidian/automation-vault-local/PATH
```

## Constraints

- **No auto-apply** — all connections require user approval
- **Every connection must pass the content test** — the context has to tell the reader something they could not infer from where the two notes already sit. This replaced the blanket no-same-directory rule on 2026-07-25 (see below)
- **Context required** — every connection needs a meaningful one-sentence context
- **Targets must be files** — always point to a specific `.md` file, never a directory (e.g., `01-Projects/Hyperscale/Hyperscale News - Project Design.md`, not `01-Projects/Hyperscale/`)
- **Paths not wikilinks** — relative paths from vault root
- **Non-destructive** — only modify frontmatter, never touch note body
- **Idempotent** — running twice yields same proposals minus already-applied ones

### The content test (replaced the same-directory ban, 2026-07-25)

A connection earns its place when its context says something the reader could not infer from where
the two notes already sit. Location is not the test. Content is.

**What the old rule was.** "No same-directory links," plus a project hub carve-out that let a note
link its own directory's hub doc when it had no cross-directory connection.

**Why it was dropped.** Measured against the live vault (1926 notes, 5044 connections):

| Claim the ban rested on | What the vault showed |
|---|---|
| It protects the scores | It cannot. Orphan detection and connection coverage both count *cross-directory* links only, so a same-directory link can never inflate either. |
| It is followed | 937 same-directory links already existed, 18.5% of all connections. |
| It stops notes hiding as connected | 96% of notes emitting a same-directory link also linked cross-directory. The 17 that did not were already counted as orphans. |
| Same-directory links are low quality | Only because of the carve-out. Of 132 contentless same-directory contexts, **111 were the exact string "Parent project design document"** — boilerplate the carve-out itself produced. Excluding those: 2.5% contentless, against 1.7% for cross-directory. Statistically the same. |

**The carve-out never worked.** It was written to rescue
`01-Projects/VPS-Infrastructure/Backups-Current-Setup.md`. That note carries the prescribed hub link
to this day, its context even reads "(hub carve-out)", and it was still reported as an orphan in the
2026-07-25 audit. The section claiming a carve-out link "still counts as connected for coverage and
orphan purposes" contradicted this skill's own orphan definition ("zero connections outside their
directory") and the definition is what the code implements. The carve-out bought the appearance of a
connection with none of the substance, 111 times.

**What the ban was actually reaching for** was lateral sibling-to-sibling "related" noise. The
content test targets that directly and without collateral damage: a contentless sibling link fails
it, and a genuine `source-for` between two notes that share a folder passes.

**Still prefer cross-directory.** That is what connects PARA silos and what the metrics reward. When
a cross-directory target and a same-directory one are both defensible, propose the cross-directory
one. But never suppress a real edge to satisfy a location rule, and never manufacture a hub link to
make an orphan look connected — an honest orphan is more useful than a contentless edge.

## Binary Quality Checks

**EVAL 1: All proposals have valid targets**
Question: Does every proposed connection point to an existing .md file?
Pass: All target paths resolve to real files in the vault
Fail: Any target path is a directory, doesn't exist, or is outside the vault

**EVAL 2: Every connection passes the content test**
Question: Does each context state something a reader could not infer from where the two notes sit?
Pass: Every context names the specific relationship, claim, or dependency that links them
Fail: Any context is a placeholder ("Parent project design document", "Related to this project"), a paraphrase of the target's title, or a bare category statement ("both concern data centers"). Same-directory connections are judged by this test like any other — location is not a failure, an empty context is

**EVAL 3: Connection context is actionable**
Question: Does every connection include a specific, actionable one-sentence context?
Pass: All contexts explain WHY the connection matters, not just that it exists
Fail: Any context is generic ("Related to this project") or missing

**EVAL 4: Health score is calibrated**
Question: Does the health score (0-100) match the actual vault state within ±15 points?
Pass: Score reflects reality — low score means genuinely poor connectivity
Fail: Score is wildly optimistic or pessimistic vs. actual vault state

**EVAL 5: No circular chains**
Question: Are there no circular connection chains (A→B→C→A)?
Pass: All connections form a directed acyclic graph
Fail: Any circular reference detected

## Gotchas
- **Subagent context overflow on large vaults** — Passing the full vault registry to all Phase 2 subagents can exceed context on 500+ note vaults, causing truncated results. Chunk the registry by category and send each subagent only its partition.
- **Circular reverse link chains** — A→B from agent 1, B→C from agent 3, C→A from agent 4 creates a cycle that pairwise deduplication won't catch. After deduplication, check for transitive cycles before proposing connections.

## Learning

After each audit run, capture these events for future skill improvement:

- **Rejected proposals** — if user skips specific connections, note the type and signal that produced them. Pattern: certain signals producing low-value proposals consistently → adjust signal weight.
- **Missing connections** — if user manually identifies connections the audit missed, note what signal should have caught them.
- **Type distribution** — track which connection types dominate. If 90% are `informs`, the type vocabulary may need refinement.
- **Score calibration** — if the health score doesn't match the user's sense of vault health, note the discrepancy for formula tuning.

Save observations to `{vault_root}/project-status/interconnection-audit-learnings.md` as a running log with dates.

## Acceptance Criteria for Learning

When reviewing learning events, apply these thresholds:

- **Low-value proposal**: A connection the user skips or explicitly rejects. If a signal type produces >30% rejections across 20+ proposals, deprecate or refine that signal.
- **Target type distribution**: If any single connection type exceeds 70% of all proposals, the discovery logic is over-weighted. Rebalance signals.
- **Score calibration tolerance**: ±15 points from user's perception. If users consistently feel the score is wrong by >15 points, recalibrate the formula weights.

## Escalation Protocol

**STOP and ask the user before proceeding when:**
- More than 50 connections are proposed in a single audit — confirm batch size before applying
- A proposed connection contradicts an existing one (conflicting relationship types)
- Health score drops below 40 — may indicate a structural vault problem, not just missing links
- Stale connections detected that reference deleted or moved files — confirm cleanup scope
- The audit discovers notes that appear to be duplicates — flag for user consolidation decision

**Do NOT escalate (handle autonomously):**
- Running all 4 audit phases (inventory, discovery, review, apply)
- Dispatching parallel subagents for connection discovery
- Deduplicating proposals and checking reverse links
- Generating the health score and report

## Completion Status

When the audit is complete, report:

```
INTERCONNECTION AUDIT: {date}
═══════════════════════════
Notes scanned: {total}
Connections proposed: {count} ({by type breakdown})
Orphan notes found: {count}
Stale connections: {count}
Health score: {X}/100 (prev: {prev_score}/100)
Report saved: {path}
═══════════════════════════
```

## Verification of Claims

- **Every proposed connection target must be verified to exist** as a real .md file in the vault.
- **Health score dimensions must cite the actual counts** used in calculation, not just the final weighted score.
- **Gate on content, not location** (revised 2026-07-25). The old lesson here said the same-directory rule must be enforced programmatically, and a code gate compared `dirname(source)` to `dirname(target)`. That gate was measuring the wrong thing: it rejected genuine edges between sibling notes while passing 111 contentless "Parent project design document" links its own carve-out generated. Replace it with a context-quality gate — reject a proposal whose context is empty, under ~40 characters, matches a known placeholder string, or merely restates the target's title. That check is still worth running in code rather than trusting subagent self-discipline, because the underlying lesson does hold: **subagent self-checks have never once caught every violation** (2026-05-31 through 2026-07-24, every run). The gate stays; what it tests changed.
- **Connection context strings must be specific and actionable** — verify each answers "why would someone following this link benefit?"
- **Coverage and the orphan dimension use different exclusion sets on purpose.** Coverage uses the base set; the orphan dimension adds digest and finished-experiment leaf discounts on top. Do not "reconcile" them by pulling digests out of the coverage denominator — measured 2026-09-11, 709 of 826 such notes (86%) carry a cross-directory link, so removing them inflates coverage 93.3% -> 99.0% while measuring a smaller, self-selected population. State both populations in the report.
- **Orphan detection must exclude `99-System/**`, `00-Inbox/`, `04-Journal/`, `06-Agent-Log/`, and recurring auto-generated dated series** (directories with ≥10 children whose filename stem is *exactly* a date — `^\d{4}-\d{2}-\d{2}\.md$` — e.g. `01-Projects/X-Intel/`) as documented in constraints. These categories (system files, inbox staging, journal entries, agent logs, ephemeral daily streams) are by design not connected to project content.
- **The dated-series regex must be anchored, and the run must report the exclusion set.** Print (a) total excluded, (b) the directories detected as series, (c) **how many notes the *dated-series* rule removed on its own**, and (d) **how many the finished-experiment-tree rule removed on its own, with the trees it matched** — each separately from the fixed `99-System`/`00-Inbox`/`04-Journal`/`06-Agent-Log` exclusions. Every discretionary component of the exclusion set gets its own reported number; a component folded into the total is a component nobody can audit. A prefix match silently hid 615 notes and 71 orphans on 2026-07-24; an unreported exclusion set makes an over-broad rule invisible. **Alarm on the series component, not the total:** the fixed category exclusions legitimately run ~30-35% of this vault (agent logs alone are large), so a total-exclusion threshold misfires. If the *dated-series* rule alone removes more than ~10% of the vault, or detects more than 2-3 series directories, treat it as a bug and investigate before reporting a score. The same applies to the finished-experiment-tree rule at its own thresholds: >5% of the vault or >3 trees matched. (Calibration 2026-09-11: 2 trees, 43 leaves, 1.6%.) (Calibration 2026-07-24: anchored rule → 1 series dir, 110 notes, 5.8%. Prefix rule → 8 series dirs, 66.8% of the vault excluded in total.)
- **A same-directory link never rescues a note from orphan status, whatever the schema says elsewhere.** Orphan detection counts connections *outside* the note's directory, so a sibling link leaves the count unchanged. This is worth stating because the retired hub carve-out claimed the opposite for two months and nobody noticed the note it was written for (`01-Projects/VPS-Infrastructure/Backups-Current-Setup.md`) was still being reported as an orphan in every run. When a rule and a metric disagree, check which one the code implements before trusting either.
- **Broken-link counts must exclude `{...}` placeholder targets and template files** — illustrative format examples in `_TEMPLATE.md` are not real broken links.

## References

- Read `references/connection-schema.md` for full type definitions, reverse pairs, and action-pending lifecycle
- Read `references/subagent-prompt.md` for the complete subagent prompt template and discovery signals
- Read `references/report-template.md` for the report template, scoring formulas, and deduplication rules
