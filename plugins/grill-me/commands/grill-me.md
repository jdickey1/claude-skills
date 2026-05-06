---
name: grill-me
description: Socratically grill the user on a plan, design, or decision until they've internalized the real tradeoffs and failure modes.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Grill Me

Load and follow the `grill-me` skill (`skills/grill-me/SKILL.md` in this plugin). Run the interrogation loop on the topic the user provides.

**Topic:** $ARGUMENTS

**Process:**

1. If `$ARGUMENTS` is empty, ask the user (in one short sentence) what they want to be grilled on, then start.
2. If `$ARGUMENTS` looks like a file path, read it first and ground your opening question in something specific from the file.
3. Otherwise, treat `$ARGUMENTS` as the topic and open with a focused first question.

Follow the loop, rubric, anti-patterns, and stopping criteria in SKILL.md. Produce the structured summary when the loop ends.
