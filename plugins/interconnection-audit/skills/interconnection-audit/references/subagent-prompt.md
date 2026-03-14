# Subagent Prompt Template — Connection Discovery

## Partition Assignments

| Agent | Scope (deep analysis) | Default Read Depth |
|-------|----------------------|-------------------|
| 1 | `01-Projects/` (~100 notes) | Frontmatter + 30 lines |
| 2 | `web-analyses/` + `x-analyses/` (~128 notes) | Full read |
| 3 | `02-Areas/` + `03-Resources/` (~30 notes) | Frontmatter + 20 lines |
| 4 | `project-status/` + `00-Inbox/` + `04-Journal/` (~48 notes) | Frontmatter + 30 lines |

### Read Depth Overrides

- Any file with "audit" in its filename or title → full read (regardless of directory)
- Any file in `web-analyses/` or `x-analyses/` → always full read
- Audit files within `02-Areas/` → full read

## Prompt Template

Fill in `{vault_registry_json}` and `{partition_directories}` per agent, then dispatch as a `researcher` subagent (read-only):

---

Analyze Obsidian vault notes to discover missing connections.

### Task

For each note in the assigned partition, identify connections to ANY note in the vault registry.

### Vault Registry

{vault_registry_json}

### Partition

Deeply analyze all .md files in: {partition_directories}

### Connection Discovery Signals

Check these signals in priority order for each note:

1. **Explicit project name mention** (HIGH) — Does the note mention any project name from the registry's `project_names` list? If yes, propose a connection to that project's main doc or most relevant file in the registry.

2. **Audit ↔ subject relationship** (HIGH) — Is this note an audit of a specific project or site? Connect to the project it audited.

3. **Supersession pattern** (HIGH) — Is there a date-versioned file in the same directory with a newer date? The newer file `supersedes` the older one. This is the one exception to the no-same-directory rule.

4. **Unacted recommendations** (HIGH) — Does the note contain recommendations (in "Action Items", "Recommendations", or similar sections) that reference a specific project? If the recommendation has not been acted on (no evidence of follow-up in the registry), propose an `action-pending` connection.

5. **Shared tags** (MEDIUM) — Does the note share specific tags with notes in other directories? Only propose if the shared tag is narrow and specific (not generic tags like `#project`, `#update`, or `#status`).

6. **Topical similarity** (LOW) — Only propose when there is HIGH confidence the connection would be genuinely useful. Do not force connections based on vague thematic overlap.

### Rules

- SKIP same-directory connections (except `supersedes` between date-versioned files)
- SKIP connections that already exist in the note's `existing_connections`
- Every connection MUST have a one-sentence `context` explaining why it matters
- Only propose connections where the context line would help an LLM decide whether to follow the link
- No "vaguely related" connections — when in doubt, skip it

### Output Format

Return a JSON array of proposed connections:

```json
[
  {
    "source": "path/to/source-note.md",
    "target": "path/to/target-note.md",
    "type": "informs|extends|blocks|contradicts|source-for|action-pending|supersedes",
    "context": "One sentence explaining why this connection matters",
    "signal": "project-mention|audit-subject|supersession|unacted-recommendation|shared-tags|topical-similarity"
  }
]
```
