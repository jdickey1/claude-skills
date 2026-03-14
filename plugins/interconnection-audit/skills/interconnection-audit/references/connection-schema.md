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
| `source-for` | This note is raw material that was used to produce the target | Tracing provenance, fact-checking |
| `action-pending` | This note contains an unacted-on recommendation for the target | Finding work to do, reviewing backlogs |
| `supersedes` | This note replaces an older version of the target | Knowing which doc is authoritative |

## Reverse Link Pairs

When proposing a forward connection, check whether the reverse should also be created:

| Forward | Expected Reverse | Notes |
|---------|-----------------|-------|
| `informs` | `source-for` | A informs B → B has A as source-for |
| `extends` | — | No required reverse |
| `blocks` | — | Flag for user review |
| `contradicts` | `contradicts` | Symmetric — both sides get it |
| `source-for` | `informs` | Reverse of informs |
| `action-pending` | — | No required reverse |
| `supersedes` | `superseded-by` | Always create reverse |

`superseded-by` only appears as an auto-generated reverse of `supersedes`.

## action-pending Lifecycle

`action-pending` is a transient state. When the recommendation is acted on:
- If the action produced a lasting relationship → change type to `informs` or `extends`
- If it was a one-off with no ongoing relevance → remove the connection
- The monthly audit flags `action-pending` connections older than 60 days as stale for triage

## Bidirectionality Rules

Connections are stored on the note where they are most naturally discovered. The audit checks for missing reverse links per the table above but does not force symmetry — only add the reverse when it is genuinely useful.

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
