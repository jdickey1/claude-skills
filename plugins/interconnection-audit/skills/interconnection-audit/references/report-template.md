# Audit Report Template & Scoring

## Report Save Location

Save to: `{vault_root}/project-status/interconnection-audit-YYYY-MM-DD.md`

## Scoring Formulas

Each dimension is scored as a percentage of its weight, then summed:

### Connection Coverage (30 points)

```
score = (connected_notes / total_non_excluded_notes) * 30
```

A note counts as "connected" if it has at least one connection (existing or newly proposed) to a note outside its own directory, or a project hub carve-out link to its own directory's hub doc.

`total_non_excluded_notes` uses **the same exclusion set as orphan counting** (below): drop `99-System/**`, `00-Inbox/`, `04-Journal/`, `06-Agent-Log/`, and recurring auto-generated dated series. Do NOT use a "non-inbox only" denominator — that pulls 300+ agent-log/system notes into the denominator and understates coverage by ~13 points versus the orphan-exclusion logic. Coverage and orphans must measure the same population. (2026-05-31: non-inbox denom read 76.4%; the consistent non-excluded denom read 89.5% and matches prior audits.)

### Action-Pending Clearance (25 points)

```
ratio = open_action_pending_items / total_connections
score = 25 * max(0, 1 - (ratio / 0.10))     # 0% open -> 25, >=10% open -> 0
```

Scored as a **share of total connections**, not an absolute count (changed 2026-07-25). The old
formula was `max(0, 25 - open_items)`: one point per item, so any vault carrying more than 25 open
items scored a flat 0 forever. This vault sat at 243 open and read 0.00 for months, which meant the
dimension had stopped measuring anything — it could not distinguish 26 open items from 260.

A standing population of `action-pending` links is the **correct steady state** for a vault with a
running research-digest pipeline. It is the research inbox, not debt. What is worth measuring is
whether it is growing faster than the graph around it, which the ratio captures and the raw count
does not.

### Orphan Notes (20 points)

```
score = max(0, 20 - (real_orphan_count * 0.5))
```

Each orphan costs 0.5 points. Notes in `99-System/**`, `00-Inbox/`, `04-Journal/`, `06-Agent-Log/`, **recurring auto-generated dated series**, and **`web-analyses/` / `x-analyses/` digests** are excluded from orphan counting — these categories (system files, inbox staging, journal entries, agent logs, ephemeral daily streams, and web/X digests) are not intended to carry cross-project connections.

**Digests were added to the exclusion set on 2026-07-25.** The skill has documented them as structural leaves since 2026-07-24 — a full discovery pass over 63 of them yielded 6 genuine connections — but the formula kept counting them, so the dimension read 0.00 whether the vault had 12 real orphans or 120. Report **both** numbers: the raw orphan count for trend continuity, and `real_orphan_count` (raw minus digests) as the scored figure. If the two are far apart, say so in the report rather than letting the headline number carry a distortion it does not explain.

**Dated-series detection — anchored match, not a prefix.** A series is a directory with ≥10 children matching `^\d{4}-\d{2}-\d{2}\.md$`: the date must be the entire filename stem (e.g. `01-Projects/X-Intel/2026-07-19.md`). Do **not** use `^\d{4}-\d{2}-\d{2}.*\.md$` — that matches any date-*prefixed* document and on 2026-07-24 excluded 615 notes (all of `web-analyses/`, `05-Commitments/`, `Hyperscale/drafts/`, `JD-Key/`), hiding 71 real orphans and overstating coverage by 4.6 points.

**Always report the exclusion set.** State total excluded, the directories detected as series, and — separately — how many notes the *dated-series* rule removed on its own. Alarm on that series figure, not the total: fixed category exclusions (`99-System`, `00-Inbox`, `04-Journal`, `06-Agent-Log`) legitimately account for ~30-35% of this vault, so a total-exclusion threshold misfires every run. Investigate if the series rule alone removes >10% of notes or detects more than 2-3 series directories. (2026-07-24 calibration: anchored → 1 dir / 110 notes / 5.8%; prefix → 8 dirs / 66.8% total excluded.)

An orphan is a note with zero connections (existing + proposed) to notes outside its own directory — except that a note connected to its own directory's hub doc via the **project hub carve-out** (see SKILL.md Constraints) counts as connected, not orphaned.

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

- If a `target` path points to a file that does not exist → stale (broken link). **Exclude** `{...}` placeholder targets and connections inside `_TEMPLATE.md` / template files — these are format illustrations, not real links.
- If an `action-pending` connection is older than 60 days → flag for triage. **Do not bulk-convert these to `informs`.** An earlier version of this template recommended exactly that for `web-analyses`/`x-analyses` sources, on the theory they are reference signals rather than tracked work, and claimed it clears the backlog "without losing anything". That was tested on 2026-07-25 and is false: of 146 such items, **93 were under 14 days old and 29 were created that same day**, and the contexts were specific live work ("Add NERC 2026 SOR verified ERCOT/Texas facts: 9 CILR events >=100 MW in 2025"), not vague relevance. Even the 18 oldest at 60-66 days were still actionable. Converting them deletes the distinction between "this digest is relevant to that doc" and "this digest holds a specific thing that doc still needs", which is the entire meaning of the type.
- **Triage means checking whether the work was done, one item at a time.** If the target already incorporated the recommendation, the connection has served its purpose and becomes `informs`. If not, it is still open and stays `action-pending` however old it is. Age alone is not evidence of staleness, and no bulk retype is a substitute for that check.

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
| Action-pending items | {n} ({pct}% of connections) | <10% |
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
