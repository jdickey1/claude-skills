---
name: skill-doctor
description: Static lint over Claude Code skill files — invalid frontmatter, broken script references, orphan scripts, description collisions (Jaccard ≥ 0.5), and dark skills (no trigger phrases). Mechanical checks only; pair with setup-audit for semantic review of whether your rules earn their keep. USE WHEN user says "skill doctor", "audit my skills", "check skill health", "find dark skills", "check for skill collisions", or wants to verify skill frontmatter, missing scripts, orphan scripts, or description ambiguity across their installed plugins.
effort: low
---

# skill-doctor

Static audit of every `SKILL.md` under `~/.claude/skills/` and `~/.claude/plugins/cache/`. Finds broken references, dark skills (no trigger phrases), routing collisions, and orphan scripts. Zero dependencies, runs in seconds.

## When to run

- After installing or updating a plugin
- Before shipping a new skill
- Monthly maintenance (pair with `setup-audit`)
- When the user suspects a skill isn't firing ("I wrote X but Claude never uses it")

## What it checks (v0)

| # | Check | Severity |
|---|-------|----------|
| 1 | Frontmatter valid (name, description, sensible length) | error / warn |
| 2 | Referenced scripts exist (`scripts/*.mjs`, `bin/*`, etc.) | error |
| 3 | Orphan scripts (exist in plugin, no SKILL.md references them) | warn |
| 4 | Description collisions (Jaccard ≥ 0.5 on two descriptions) | warn |
| 5 | Dark-skill heuristic (description has no trigger phrase) | warn |

Not yet in v0: live routing evals (checks 7 + 8 in the full sketch), per-plugin test runners, `--fix` mode.

## How to invoke

Preferred — run the CLI directly:

```bash
node ${CLAUDE_PLUGIN_ROOT}/bin/skill-doctor.mjs
```

Useful flags:

- `--root <dir>` — scan a different home (e.g., a test fixture or source repo)
- `--json` — machine-readable output for cron / dashboards
- `-v` — also list every skill discovered
- `--fix-dry` — preview LLM-rewritten descriptions for over-long / dark skills
- `--fix` — apply those rewrites in place (requires `ANTHROPIC_API_KEY`)
- `--fix-model <id>` — override the default `claude-haiku-4-5`

Exit codes: `0` clean / `1` warnings only / `2` errors present.

**Fix mode notes:** `--fix` only touches frontmatter `description`; body stays untouched. Run against source repos (`--root ~/Projects/my-plugin`), not `~/.claude/plugins/cache` — cache copies get overwritten on the next plugin update. Always `--fix-dry` first, then git-diff after `--fix` to review before committing.

## Routing eval (skill-routing-eval)

Static checks tell you a description *looks* routable. The routing eval tells you whether Claude actually picks the right skill for real intents. Drop a `skill.evals.json` next to any `SKILL.md`:

```json
{
  "positives": ["intent that should route here", "another phrasing", ...],
  "negatives": ["unrelated request", "different skill's job", ...]
}
```

Then:

```bash
node ${CLAUDE_PLUGIN_ROOT}/bin/skill-routing-eval.mjs
```

Each positive should route to the skill's name; each negative should NOT. The tool reports positive/negative pass rates per skill. Responses are cached by `(model + full skill catalog + intent)` hash so unchanged descriptions don't re-bill. Useful flags: `--skill <name>` for one skill, `--no-cache` to force re-run, `--model <id>` to swap routers (defaults to `claude-haiku-4-5`, ~$0.30 for 100 skills × 15 intents).

The eval is *separate* from the static audit — run it when you change a description or add a new skill, not on every audit pass.

## How to present results

1. Run the CLI and capture stdout.
2. Summarize the error and warning counts in one line.
3. Group findings by check (`frontmatter`, `scripts`, `dark-skill`, `collision`, `orphan`) — the CLI already does this, don't re-sort.
4. For each finding, recommend the concrete fix:
   - `frontmatter` short description → rewrite with "USE WHEN …" trigger clause
   - `scripts` missing file → check if path is stale or script was renamed
   - `orphan` → either reference it from a skill or delete it
   - `collision` → rewrite one description to disambiguate
   - `dark-skill` → add explicit trigger phrases ("Use when X", "Whenever Y")

## Gotchas

- **User-level skills in `~/.claude/skills/`** have no plugin wrapper, so `pluginDir` resolves to `~/.claude`. The orphan check skips this case to avoid flagging harness-level scripts (statusline, update-plugins, etc.) as plugin orphans.
- **Script resolution tries skill-local first, then plugin-level.** A reference like `bash scripts/measure.sh` resolves to `<skillDir>/scripts/measure.sh` (compound-engineering convention) or `<pluginDir>/scripts/measure.sh` (older convention). Only flagged as missing if neither exists.
- **Teaching plugins (plugin-dev, skill-creator) produce false-positive script errors.** Their SKILL.md bodies include code-fenced *examples* like `bash scripts/test.sh` to teach users what to write, but those scripts don't actually exist in the plugin. Verify each script error against the skill body before filing as a real bug — it may just be pedagogical prose.
- **Jaccard is a weak collision signal.** It catches shared vocabulary, not shared *intent*. A warning pair isn't automatically broken — skim both descriptions and decide.
- **Dark-skill heuristic is a regex.** Skills with prose descriptions ("handles payroll" or "for billing workflows") may trip the warning despite routing fine in practice. Confirm by running a test prompt through Claude before rewriting.
- **Plugin cache dedup keeps newest mtime per (source/plugin/skill).** If a plugin was installed from two different marketplaces, both copies are scanned separately — that's intentional.
