# expires_when Frontmatter

Optional custom frontmatter key for Claude Code skills that record when a skill becomes redundant.

---

## Purpose

Skills fall into two categories:

1. **Perishable** — they compensate for a current model weakness. When a newer model absorbs that capability, the skill is dead weight. These should carry `expires_when:`.
2. **Durable** — they encode private or organizational context (paths, house rules, product knowledge). The model will never "learn" that context. These do not need the key.

Absence of `expires_when:` means durable — either the skill was never evaluated for perishability, or it is treated as lasting context. Do not invent a separate "unevaluated" state; missing key = durable.

---

## Value shape

The value is a **condition**, not a date and not a vague hope. Name an **observable model behavior** that would make the skill redundant:

```yaml
expires_when: Claude decomposes multi-step tasks without prompting
```

Not a calendar date. Not "maybe someday". Not "when models get better."

`expires_when: never` is permitted. It records an explicit check: "this skill encodes private/organizational context, not a model-capability workaround." It is never required — omitting the key already means durable.

---

## Column-0 requirement (hard)

`expires_when:` must start at column 0 in the frontmatter. This is not style — it is load-bearing.

`skill-doctor --fix` rewrites the `description:` field using the description-rewrite regex in skill-doctor's `--fix` path (`plugins/skill-doctor/bin/skill-doctor.mjs`). That regex is roughly:

```
/^description:\s*.*(?:\r?\n[ \t]+\S.*)*/m
```

The trailing group `(?:\r?\n[ \t]+\S.*)*` matches **any** subsequent line that begins with whitespace and has non-whitespace content. It does not care what the line says. If `expires_when:` is written as an indented continuation under a wrapped `description:`, the regex swallows it into the description match and deletes it when the description is rewritten. A key at column 0 does not match `[ \t]+\S`, so it is never swallowed and survives untouched.

---

## What skill-doctor does and does not do

`skill-doctor` does not read or validate `expires_when:`. It has no frontmatter key allowlist, so the key is neither rejected nor reported. The only guarantee is that a correctly placed (column-0) key survives description rewrites. The actual consumer is a session-start hook you supply yourself.

---

## Correct placement

```yaml
---
name: some-skill
description: Use when the user asks to do X and needs scaffolding for multi-step decomposition.
expires_when: Claude reliably handles X without this skill's scaffolding
---
```

---

## Failure mode (do not do this)

Indented under a wrapped description — silently destroyed by `skill-doctor --fix`:

```yaml
---
name: some-skill
description: Use when the user asks to do X and needs scaffolding
  for multi-step decomposition across several tools and files.
  expires_when: Claude reliably handles X without this skill's scaffolding
---
```
