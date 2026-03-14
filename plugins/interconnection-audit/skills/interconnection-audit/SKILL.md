---
name: interconnection-audit
description: Use when auditing vault connections, checking vault health, finding orphan notes, discovering missing cross-note links, or improving interconnection between Obsidian vault notes. Also use after a batch of new content (20+ notes) or on a monthly cadence.
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

## Phase 3: Review & Report

After all subagents return:

1. **Deduplicate** — merge identical proposals, consolidate expected reverse pairs
2. **Check reverse links** — per the reverse link pairs table, flag missing reverses
3. **Identify orphans** — notes with zero connections outside their directory (exclude `99-System/templates/` and `00-Inbox/`)
4. **Detect stale connections** — broken targets or `action-pending` items older than 60 days
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

## Constraints

- **No auto-apply** — all connections require user approval
- **No same-directory links** — except `supersedes` between date-versioned files in the same directory
- **Context required** — every connection needs a meaningful one-sentence context
- **Targets must be files** — always point to a specific `.md` file, never a directory (e.g., `01-Projects/Hyperscale/Hyperscale News - Project Design.md`, not `01-Projects/Hyperscale/`)
- **Paths not wikilinks** — relative paths from vault root
- **Non-destructive** — only modify frontmatter, never touch note body
- **Idempotent** — running twice yields same proposals minus already-applied ones

## Learning

After each audit run, capture these events for future skill improvement:

- **Rejected proposals** — if user skips specific connections, note the type and signal that produced them. Pattern: certain signals producing low-value proposals consistently → adjust signal weight.
- **Missing connections** — if user manually identifies connections the audit missed, note what signal should have caught them.
- **Type distribution** — track which connection types dominate. If 90% are `informs`, the type vocabulary may need refinement.
- **Score calibration** — if the health score doesn't match the user's sense of vault health, note the discrepancy for formula tuning.

Save observations to `{vault_root}/project-status/interconnection-audit-learnings.md` as a running log with dates.

## References

- Read `references/connection-schema.md` for full type definitions, reverse pairs, and action-pending lifecycle
- Read `references/subagent-prompt.md` for the complete subagent prompt template and discovery signals
- Read `references/report-template.md` for the report template, scoring formulas, and deduplication rules
