# Learning Loops

Skills that improve after deployment via structured feedback loops.

---

## Overview

Most skill improvements happen at authoring time, through iteration and eval-driven refinement. Learning loops extend this into production: a skill running in the field emits structured events when interesting things happen, those events accumulate in a local journal, and a promotion script periodically analyzes the journal and proposes targeted patches to SKILL.md.

The cycle is:

1. Skill executes in the field
2. Claude appends JSON events to `.learnings.jsonl` when noteworthy things occur
3. Patterns accumulate over multiple executions
4. `promote_learnings` reads the journal and groups events by theme
5. Human reviews the proposed SKILL.md patches and applies the ones that make sense
6. Skill gets smarter; journal is optionally reset

This is the distinguishing feature of this plugin — skills that get better the more they are used, without requiring a full eval/improve cycle every time.

---

## Learning Event Schema

See `references/schemas.md` — section "Learning Event Schema" — for the canonical field definitions, required vs. optional fields, and the full list of valid `event_type` values.

In brief, the five event types are:

| Event type | When to emit |
|---|---|
| `user_correction` | User changed the skill's output or approach |
| `edge_case` | Scenario the skill didn't anticipate or handle well |
| `assertion_drift` | An eval assertion changed pass/fail status unexpectedly |
| `recommendation_completed` | A skill recommendation was actually implemented |
| `recommendation_ignored` | A recommendation was explicitly skipped by the user |

Do not duplicate the schema definition here — `schemas.md` is the source of truth.

---

## JSONL Journal Convention

Each skill's learning journal lives at:

```
<skill-dir>/.learnings.jsonl
```

Rules:

- **Append-only** — never overwrite or delete individual lines
- **One JSON object per line** — standard JSONL format
- **Human-readable** — compact but not minified; a developer should be able to read it with `tail`
- **Git-ignored** — the journal is per-installation data, not source code; add `.learnings.jsonl` to `.gitignore` at the skill root
- **No user data** — see Privacy section below

Example journal after three executions:

```jsonl
{"timestamp":"2026-03-10T14:22:01Z","skill":"pdf","event_type":"edge_case","context":"User passed a scanned PDF with no text layer; skill assumed selectable text"}
{"timestamp":"2026-03-11T09:05:44Z","skill":"pdf","event_type":"user_correction","context":"Skill produced summary in bullet form; user asked for prose","original":"bullet list","corrected":"prose paragraphs"}
{"timestamp":"2026-03-12T16:30:17Z","skill":"pdf","event_type":"edge_case","context":"PDF was password-protected; skill did not detect or report this gracefully"}
```

---

## Instrumenting a Skill

To enable learning loops for a skill, add a `## Learning` section to its SKILL.md. This section tells Claude when to emit events and where to write them.

Template:

```markdown
## Learning

When executing this skill, append a JSON line to `<skill-dir>/.learnings.jsonl` when:
- The user corrects your output (event_type: user_correction)
- You encounter a scenario not covered by this skill (event_type: edge_case)
- An eval assertion changes pass/fail status (event_type: assertion_drift)
- A recommendation you made is implemented (event_type: recommendation_completed)
- A recommendation is explicitly skipped (event_type: recommendation_ignored)

Format: see references/schemas.md for learning event schema.
```

Replace `<skill-dir>` with the actual path to the skill directory (e.g., `plugins/pdf/skills/pdf`). The path should be absolute or resolvable from the working directory Claude is operating in.

You can also add guidance on which specific scenarios to watch for. For example, a skill that makes frequent format recommendations might add:

```markdown
- Pay particular attention to format choices (prose vs. bullets, long vs. short output) as these are commonly corrected
```

The `## Learning` section is advisory — Claude reads it and follows the instrumentation instructions during execution. It does not require any code changes.

---

## Running the Promotion Script

After a skill has accumulated events, run:

```bash
python -m scripts.promote_learnings <skill-path> --threshold 3
```

`<skill-path>` is the path to the skill directory (the one containing SKILL.md and `.learnings.jsonl`).

`--threshold 3` means: only propose patches for themes that appear in at least 3 events. Lower the threshold for skills with low usage volume; raise it for high-traffic skills to filter noise.

**Output format:**

The script prints structured JSON with proposed patches grouped by theme:

```json
{
  "skill": "pdf",
  "journal_entries": 14,
  "themes": [
    {
      "theme": "scanned PDFs without text layer",
      "event_count": 4,
      "event_types": ["edge_case"],
      "proposed_patch": {
        "section": "Limitations",
        "action": "add",
        "content": "Scanned PDFs without a text layer cannot be read directly. Detect this condition and prompt the user to run OCR first."
      }
    },
    {
      "theme": "output format preference: prose over bullets",
      "event_count": 3,
      "event_types": ["user_correction"],
      "proposed_patch": {
        "section": "Output",
        "action": "update",
        "content": "Default to prose paragraphs unless the user requests bullet points."
      }
    }
  ]
}
```

**Reviewing proposals:**

The script never modifies SKILL.md directly. It produces proposals; you decide what to apply. For each theme:

1. Read the raw events that contributed to it (`--verbose` flag shows them)
2. Decide whether the pattern is real or coincidental
3. Apply the patch manually to SKILL.md if it makes sense
4. Mark the recommendation as COMPLETED (see next section)

---

## Completion Tracking

When you apply a learning loop recommendation to SKILL.md, record it so future runs know it was addressed. Append a `recommendation_completed` event to the journal:

```jsonl
{"timestamp":"2026-03-14T10:00:00Z","skill":"pdf","event_type":"recommendation_completed","context":"Applied patch: default output format changed to prose; added scanned PDF limitation note","original":"promote_learnings proposal 2026-03-13","corrected":"SKILL.md updated at Limitations and Output sections"}
```

This closes the loop: the journal reflects both that a pattern was observed and that it was acted on. Future `promote_learnings` runs will see the `recommendation_completed` event and can avoid re-proposing the same theme.

---

## When to Reset

After a major skill rewrite, the existing journal may no longer be relevant — the patterns it captured may have been resolved, or may not apply to the new version's logic.

To reset:

```bash
mv <skill-dir>/.learnings.jsonl <skill-dir>/.learnings.jsonl.archive-$(date +%Y%m%d)
```

Do not delete the old journal outright; archive it in case you need to refer back to it. A fresh `.learnings.jsonl` will be created automatically on the next execution that emits an event.

Indicators that a reset is warranted:
- The skill's primary mode of operation changed substantially
- Most existing journal entries describe problems that were fixed in the rewrite
- The rewrite introduced new behaviors that need their own baseline observation period

---

## Privacy

Learning journals log skill behavior, never user data.

Rules:
- Do not log file contents, document text, or any data the user provided as input
- Do not log names, email addresses, or any personally identifiable information
- `context` fields should describe the type of situation, not the content (e.g., "user's PDF contained only scanned images" — not a quote from the PDF)
- `original` and `corrected` fields describe format or approach choices, not the actual text

The journal is local-only. It is git-ignored and never uploaded to any service. It exists solely to inform future improvements to the skill's SKILL.md.

---

## Platform Note

Learning instrumentation requires file-writing tools (Write or Edit) to append to `.learnings.jsonl`.

On platforms without file tools — Claude.ai, the API without tool use, or any environment where Write/Edit are unavailable — the skill continues to work normally. Claude simply skips the `## Learning` instrumentation steps when it cannot fulfill them. No errors are raised, no functionality is degraded; the skill just does not emit events.

Learning loops are an enhancement, not a dependency. Skills must function correctly with or without them.
