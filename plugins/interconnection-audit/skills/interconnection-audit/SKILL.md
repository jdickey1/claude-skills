---
name: interconnection-audit
description: Use when auditing vault connections, checking vault health, finding orphan notes, discovering missing cross-note links, or improving interconnection between Obsidian vault notes. Also use after a batch of new content (20+ notes) or on a monthly cadence.
version: 1.3.0
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
3. **Identify orphans** — notes with zero connections outside their directory (exclude `99-System/**`, `00-Inbox/`, `04-Journal/`, and `06-Agent-Log/` — these categories are not intended to carry project connections). **Also exclude recurring auto-generated dated series** — directories holding a daily/periodic stream of `YYYY-MM-DD.md` notes (e.g. `01-Projects/X-Intel/`). Treat these like journal/agent-log: ephemeral by design, not a connectivity failure. Detect a series as a directory where ≥10 children match **`^\d{4}-\d{2}-\d{2}\.md$`** — the date must be the *entire* filename stem; exclude those dated children from the orphan count (the directory's non-dated docs still count). (2026-05-31: 27 of 116 orphans were X-Intel dailies — structural, not missing links.)

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
- **No same-directory links** — with two exceptions: `supersedes` between date-versioned files, and the **project hub carve-out** below
- **Context required** — every connection needs a meaningful one-sentence context
- **Targets must be files** — always point to a specific `.md` file, never a directory (e.g., `01-Projects/Hyperscale/Hyperscale News - Project Design.md`, not `01-Projects/Hyperscale/`)
- **Paths not wikilinks** — relative paths from vault root
- **Non-destructive** — only modify frontmatter, never touch note body
- **Idempotent** — running twice yields same proposals minus already-applied ones

### Project hub carve-out (same-directory exception)

A same-directory connection IS allowed when the **target is that directory's designated hub doc** and the type is `informs` or `extends`.

A hub doc is, in priority order:
1. a file matching `* - Project Design.md`
2. `CLAUDE.md`
3. a file whose name equals the directory name (e.g. `Hyperscale/Hyperscale.md`)

Rules for the carve-out:
- **Target only, never source.** The hub may receive same-dir links; it must not emit them. This keeps the graph a DAG and prevents hub↔child cycles.
- **One per source note.** A note gets at most one same-dir hub link.
- **Only when the note has no cross-directory connection.** If the note is already non-orphaned, don't add a hub link — this exception exists to rescue orphans, not to thicken hubs.
- **Never `supersedes`, `blocks`, or `contradicts`** to a hub.

**Why this exists.** The blanket no-same-dir rule stranded notes whose only genuine parent is a sibling. It surfaced three runs running (2026-06-29, 2026-07-19, 2026-07-24), blocking semantically correct proposals like `VPS-Infrastructure/Backups-Current-Setup.md` → `VPS-Infrastructure/VPS Infrastructure - Project Design.md`. Those notes stayed orphaned on a technicality while the audit reported them as connectivity failures. The original rule's real target was *lateral* same-dir clutter (sibling→sibling "related" noise), not child→parent structure.

**What this deliberately does NOT rescue.** The carve-out is narrow: the target must be the directory's *hub*, not merely a related sibling. `JD-Key/slide-deck-pdf-generation.md` → `JD-Key/2026-data-center-fears-vs-facts-one-pager.md` is a real relationship but still correctly rejected — the one-pager is not a hub doc, and admitting sibling→sibling links is exactly the lateral clutter the original rule exists to prevent. Such notes remain orphans until they earn a cross-directory link. Accept that; do not widen the carve-out to close it.

**Orphan scoring interacts with this:** a note rescued only by a hub carve-out still counts as connected for coverage/orphan purposes — it now has a real, followable parent link.

## Binary Quality Checks

**EVAL 1: All proposals have valid targets**
Question: Does every proposed connection point to an existing .md file?
Pass: All target paths resolve to real files in the vault
Fail: Any target path is a directory, doesn't exist, or is outside the vault

**EVAL 2: No same-directory connections**
Question: Are all proposed connections between files in different directories?
Pass: No connection links two files in the same folder, except (a) `supersedes`/`superseded-by`, or (b) a valid project hub carve-out — target is the directory's hub doc, type is `informs`/`extends`, source is not the hub, source had no cross-directory connection
Fail: Any other same-directory connection proposed

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
- **The same-directory rule must be enforced programmatically**, not just by convention — the subagent self-check has never once caught them all (same-dir violations recurred in every run 2026-05-31 through 2026-07-24). The code gate compares `dirname(source)` to `dirname(target)` and rejects unless the proposal qualifies as `supersedes` or a valid project hub carve-out.
- **Connection context strings must be specific and actionable** — verify each answers "why would someone following this link benefit?"
- **Orphan detection must exclude `99-System/**`, `00-Inbox/`, `04-Journal/`, `06-Agent-Log/`, and recurring auto-generated dated series** (directories with ≥10 children whose filename stem is *exactly* a date — `^\d{4}-\d{2}-\d{2}\.md$` — e.g. `01-Projects/X-Intel/`) as documented in constraints. These categories (system files, inbox staging, journal entries, agent logs, ephemeral daily streams) are by design not connected to project content.
- **The dated-series regex must be anchored, and the run must report the exclusion set.** Print (a) total excluded, (b) the directories detected as series, and (c) **how many notes the *dated-series* rule removed on its own**, separately from the fixed `99-System`/`00-Inbox`/`04-Journal`/`06-Agent-Log` exclusions. A prefix match silently hid 615 notes and 71 orphans on 2026-07-24; an unreported exclusion set makes an over-broad rule invisible. **Alarm on the series component, not the total:** the fixed category exclusions legitimately run ~30-35% of this vault (agent logs alone are large), so a total-exclusion threshold misfires. If the *dated-series* rule alone removes more than ~10% of the vault, or detects more than 2-3 series directories, treat it as a bug and investigate before reporting a score. (Calibration 2026-07-24: anchored rule → 1 series dir, 110 notes, 5.8%. Prefix rule → 8 series dirs, 66.8% of the vault excluded in total.)
- **Same-directory connections are permitted only via `supersedes` or the project hub carve-out** — verify the carve-out's four conditions (hub target, `informs`/`extends`, source≠hub, source had no cross-dir link) programmatically, not by convention.
- **Broken-link counts must exclude `{...}` placeholder targets and template files** — illustrative format examples in `_TEMPLATE.md` are not real broken links.

## References

- Read `references/connection-schema.md` for full type definitions, reverse pairs, and action-pending lifecycle
- Read `references/subagent-prompt.md` for the complete subagent prompt template and discovery signals
- Read `references/report-template.md` for the report template, scoring formulas, and deduplication rules
