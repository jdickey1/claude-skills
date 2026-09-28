# Connection Schema Reference

## Frontmatter Format

Every note gets a `connections:` block in its YAML frontmatter:

```yaml
connections:
  - target: "01-Projects/Hyperscale/project-design.md"
    type: informs
    context: "Skill graph architecture pattern applicable to newsletter repurposing"
```

## Fields

| Field | Description |
|-------|-------------|
| `target` | Relative path from vault root to the connected note |
| `type` | Relationship type from the fixed set below |
| `context` | One sentence explaining *why* this connection matters — the LLM's relevance signal for deciding whether to follow the link |

## Relationship Types

| Type | Meaning | When an LLM should follow |
|------|---------|--------------------------|
| `informs` | This note provides context/insight relevant to the target | Researching, brainstorming, exploring a topic |
| `extends` | This note builds on or adds to the target | Understanding the full picture of a system/project |
| `blocks` | This note documents an issue that blocks the target | Debugging, planning, unblocking work |
| `contradicts` | This note conflicts with or challenges the target | Validating claims, resolving inconsistencies |
| `source-for` | This note has the target as a source or useful reference; inverse of target `informs` this note | Consulting support or context; tracing provenance only when separately established |
| `action-pending` | This note contains an unacted-on recommendation for the target | Finding work to do, reviewing backlogs |
| `supersedes` | This note replaces an older version of the target | Knowing which doc is authoritative |

## Reverse Link Pairs

When proposing a forward connection, check whether the reverse should also be created:

| Forward | Expected Reverse | Notes |
|---------|-----------------|-------|
| `informs` | `source-for` | A informs B → B has A as source-for |
| `extends` | — | No required reverse |
| `blocks` | — | Flag for user review |
| `contradicts` | `contradicts` | Symmetric meaning; write each useful direction only when approved |
| `source-for` | `informs` | Reverse of informs |
| `action-pending` | — | No required reverse |
| `supersedes` | `superseded-by` | Suggest the useful inverse; write only when approved |

`superseded-by` only appears as a generated inverse of `supersedes`; its insertion still requires approval.

### Direction and provenance

A `informs` B means A supplies context relevant to B. B `source-for` A means B has A as its source or useful reference. The latter does not mean B produced A, and neither type alone proves production provenance. A note may link to a later publication as a useful reference, but its context must explicitly say **later reference** and must not claim the later publication produced the earlier note.

Existing `source-for` edges may use the older forward-style meaning. Treat these as legacy ambiguous: inspect their contexts and both notes, then propose a specific correction if needed. Never mass-migrate or reverse historical edges from the type alone.

### Cycle checks

Information/navigation cycles are permitted, including `informs`, `source-for`, and documentary `extends`. Do not impose a global directed-acyclic-graph condition or reject a proposal because a transitive return path exists. A useful approved A `informs` B plus B `source-for` A is valid.

Check authority and blocking separately:

1. Normalize A `superseded-by` B to B `supersedes` A. Deduplicate identical logical relations before checking the supersession graph for cycles. A `supersedes` B plus B `superseded-by` A is one relation and is valid; A `supersedes` B plus B `supersedes` A is contradictory and must be flagged. Check longer normalized supersession cycles too.
2. Build a separate graph containing only `blocks` edges. A `blocks` B plus B `blocks` A is a circular dependency and must be flagged, as must longer blocks-only cycles. An informational return path does not create a blocking cycle.
3. Inspect contexts for incompatible precedence claims even when their labels are informational. Do not infer a prerequisite from documentary `extends` alone.

Hold conflicting authority or circular blocking proposals for resolution; report the exact typed path and conflicting claim. Do not suppress harmless navigation links or silently delete existing links.

## action-pending Lifecycle

`action-pending` is a transient state. When the recommendation is acted on:
- If the action produced a lasting relationship → change type to `informs` or `extends`
- If it was a one-off with no ongoing relevance → remove the connection
- The monthly audit flags `action-pending` connections older than 60 days as stale for triage

## Bidirectionality Rules

Connections are stored on the note where they are most naturally discovered. Expected reverse pairs are diagnostic candidates, not mandatory insertions. Each direction must pass the content test, help a reader of its source note, and be approved before writing. Do not manufacture reverses to raise the score or add a second label when an existing direct connection already serves the same purpose.

## Context Line Quality

The `context` field is the most important part of a connection. It determines whether an LLM follows the link or skips it.

**Good context lines:**
- "SEO audit findings directly affect this project's search ranking strategy" (specific, actionable)
- "Skill graph architecture pattern applicable to newsletter content repurposing" (explains the connection's value)
- "Newer version of this monthly analytics report with corrected data" (clear supersession reason)

**Bad context lines:**
- "Related to this project" (vague, no signal)
- "See also" (no information)
- "Might be useful" (too uncertain)

A good test: would an LLM working on the target note benefit from knowing this connection exists? If the answer isn't clearly yes, skip the connection.
