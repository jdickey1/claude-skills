# expires_when Frontmatter

Optional custom frontmatter key recording what stops earning its keep, and when.

---

## Start here: expiry is usually partial

**Most skills are mixtures, and the common outcome is that a *section* dies, not the skill.**

A skill is durable where it encodes private context — your paths, your house rules, your methodology, your product knowledge. A model release never absorbs that. A skill is perishable where it compensates for something the model can't yet do, or works around a broken tool. Those are bets, and bets come due.

Almost every real skill contains both. When the condition fires, you delete the paragraph that was propping up the weak spot and keep everything else. Whole-skill retirement is the rare case — reserve it for skills that are *nothing but* the workaround.

**So the question is never "does this skill expire?" It is "which part of this skill expires, and what survives?"** Answer the second question in the tag.

This is not theoretical. It is the finding that came out of classifying all 59 first-party skills (recorded in the vault at `project-status/skill-durability-audit-2026-07-16.md`). An earlier version of this doc opened by asserting skills "fall into two categories," and that binary directly produced a wrong verdict: `seo` was tagged perishable on the strength of an ~18-line raw-HTML verification workaround, while ~294 lines of audit methodology — the actual reason the skill exists, invoked weekly by `/seo-audit` — were durable. The binary forced an all-or-nothing call on a mixed file and lost.

---

## Value shape

The value is a **condition**, not a date and not a vague hope. Name an **observable** behavior — model or tooling — that retires the thing:

```yaml
expires_when: Claude decomposes multi-step tasks without prompting
```

Not a calendar date. Not "maybe someday". Not "when models get better."

**When the skill is a mixture — which is most of the time — name the part.** A condition that reads as though the whole skill dies will get the whole skill deleted by whoever acts on it later, including you in a year:

```yaml
# Good — scopes the expiry to what actually dies
expires_when: Extraction tools return full structural HTML, retiring the raw-HTML verification rules (the audit methodology and scoring stay)

# Bad — same condition, but implies the skill is disposable
expires_when: Extraction tools return full structural HTML
```

If you cannot name what survives, that is the signal to check whether the skill is genuinely all-workaround. Usually it isn't.

`expires_when: never` is permitted. It records an explicit check: "this is private context, not a workaround." It is never required — omitting the key already means durable.

Absence of the key means durable — either never evaluated, or treated as lasting context. Do not invent a separate "unevaluated" state; missing key = durable.

---

## Which clock

Name it in the condition when it isn't the model:

- **Model clock** — expires when a release absorbs the capability. The `model-watch` SessionStart hook fires on new model IDs, so these get noticed automatically.
- **Tooling clock** — expires when a tool stops being broken (extractors, CLIs, APIs). **No model-arrival hook will ever fire for these.** `web-reader` is the standing example: tagged, but effectively unwatched.
- **Infra clock** — expires when infrastructure changes underneath it.

A tag on the tooling or infra clock is a note to your future self, not a trigger. Do not assume it will page you.

---

## What this key is not

It is not a deprecation marker and not a removal queue. It is inert — the loader ignores unknown frontmatter keys, and `skill-doctor` neither reads nor validates it. Tagging a skill changes nothing at runtime; it records a bet and its terms so the bet can be *rechecked* when the condition plausibly fires. Frequency of use is not an input: a perishable section invoked daily is still perishable, and a durable skill untouched for a year is still durable.

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
