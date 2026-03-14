# Audit Report Template & Scoring

## Report Save Location

Save to: `{vault_root}/project-status/interconnection-audit-YYYY-MM-DD.md`

## Scoring Formulas

Each dimension is scored as a percentage of its weight, then summed:

### Connection Coverage (30 points)

```
score = (connected_notes / total_non_inbox_notes) * 30
```

A note counts as "connected" if it has at least one connection (existing or newly proposed) to a note outside its own directory.

### Action-Pending Clearance (25 points)

```
score = max(0, 25 - (open_action_pending_items * 1))
```

Each uncleared `action-pending` item costs 1 point, floored at 0.

### Orphan Notes (20 points)

```
score = max(0, 20 - (orphan_count * 0.5))
```

Each orphan costs 0.5 points. Notes in `99-System/templates/` and `00-Inbox/` are excluded from orphan counting.

An orphan is a note with zero connections (existing + proposed) to notes outside its own directory.

### Link Integrity (15 points)

```
score = ((total_connections - broken_connections) / max(total_connections, 1)) * 15
```

A broken connection has a `target` path pointing to a file that no longer exists.

### Reverse Link Completeness (10 points)

```
score = ((expected_reverses - missing_reverses) / max(expected_reverses, 1)) * 10
```

Only counts pairs from the reverse link table that require a reverse (`informs`↔`source-for`, `contradicts`↔`contradicts`, `supersedes`↔`superseded-by`).

## Deduplication Rules

After collecting proposals from all subagents:

- **Same source → target, same type:** Keep one. Merge context lines if they add distinct information.
- **Same source → target, different types:** Keep both as separate proposals for user review (they may represent different facets of the relationship).
- **A → B and B → A as expected reverse pair:** Consolidate into a single proposal noting both directions will be written.

## Stale Connection Detection

- If a `target` path points to a file that does not exist → stale (broken link)
- If an `action-pending` connection is older than 60 days → stale (needs triage)

## Report Template

```markdown
# Interconnection Audit — YYYY-MM-DD

## Vault Interconnection Health

| Metric | Value | Target |
|--------|-------|--------|
| Notes scanned | {n} | — |
| Existing connections | {n} | — |
| New connections proposed | {n} | — |
| Connection coverage | {n}% | >80% |
| Orphan notes | {n} | <20 |
| Action-pending items | {n} | 0 |
| Stale connections | {n} | 0 |
| Missing reverse links | {n} | 0 |
| **Overall Score** | **{n}/100** | **>80** |

## Proposed Connections

### Action-Pending (unacted recommendations)
{for each proposal with type action-pending:}
- `{source}`
  → `{target}` | type: action-pending
  → context: "{context}"

### Supersession
{for each proposal with type supersedes:}
- `{source}`
  → `{target}` | type: supersedes
  → context: "{context}"

### Missing Reverse Links
{for each missing reverse:}
- `{source}`
  → `{target}` | type: {reverse_type}
  → context: "{context}"

### Informational & Topical Connections
{for each remaining proposal:}
- `{source}`
  → `{target}` | type: {type}
  → context: "{context}"

## Orphan Notes
{for each orphan:}
- `{path}` ({category}) — {fingerprint}

## Stale Connections
{for each stale:}
- `{source}` → `{target}` — {reason: broken link | action-pending > 60 days}

## Trend
{if previous audit exists:}
- Previous score: {prev_score} → Current: {current_score} ({delta})
- Connections added since last audit: {n}
- Action-pending items cleared: {n}
{else:}
- First audit — no trend data yet
```

## Previous Audit Detection

Look for the most recent `interconnection-audit-*.md` file in `{vault_root}/project-status/`. If found:
- Add a `supersedes` connection in the new report's frontmatter pointing to it
- Calculate trend data (score delta, items cleared since last audit)
