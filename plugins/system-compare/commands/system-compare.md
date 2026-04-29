---
description: Compare two skills, plugins, tools, or systems head-to-head and produce a forced-verdict matrix, fitness scorecard, and ranked steal list
argument-hint: <system A> vs <system B>
---

Invoke the system-compare skill with the provided arguments. Arguments may be local paths, URLs, or Obsidian notes from a prior digest.

Read the system-compare skill at `${CLAUDE_PLUGIN_ROOT}/skills/system-compare/SKILL.md` and follow its instructions exactly, using `$ARGUMENTS` as the two systems to compare.

If only one system is provided in `$ARGUMENTS`, or if the inputs cannot be parsed into two distinct systems, ask the user to clarify before proceeding.
