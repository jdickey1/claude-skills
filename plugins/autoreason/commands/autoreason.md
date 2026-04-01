---
description: Refine subjective content through adversarial multi-agent debate until convergence
argument-hint: "[--deep] [--rounds N] [--verbose] <task description or content to refine>"
---

**First**: Use the `autoreason` skill for the full orchestration workflow.

Parse `$ARGUMENTS` before passing to the skill:

## Flag Parsing

- `--deep` → max rounds = 5 (default is 3)
- `--rounds N` → max rounds = N (overrides `--deep`)
- `--verbose` → show all intermediate versions, judge reasoning, and label mappings
- Everything remaining after flags is the task/content input

## Input Mode Detection

Inspect the remaining input after flags are stripped:

- **File path** (starts with `/`, `~`, `./`, or has a file extension) → read the file; use its contents as existing content to refine
- **Multi-paragraph draft** (reads as written content, not an instruction) → use as existing content to refine
- **Imperative instruction** (describes what to write) → generate mode: create from scratch, then refine
- **Ambiguous** → ask: "Should I refine this as-is, or treat it as a prompt to generate from?"

If no arguments are provided at all, ask the user what they'd like to write or refine.

## Handoff

Pass the parsed flags (max rounds, verbose) and detected input mode (content to refine vs. generate instruction) to the skill. Do not re-implement the debate orchestration here.
