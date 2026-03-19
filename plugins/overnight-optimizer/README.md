# overnight-optimizer

A general-purpose autonomous experiment runner for Claude Code. Give it a target file, an eval script or assertion set, and a stop condition — then walk away. It runs a modify-eval-keep/revert loop overnight and delivers a scored, git-committed result in the morning.

## Quick Start

1. Create `experiment.yaml` in your project root:

```yaml
name: "my-prompt-tuning"
target: "./prompts/my-prompt.txt"
eval_mode: script
eval_script: "./eval/score.sh"
metric_goal: maximize
budget: 30
stop_on_plateau: 5
```

2. Invoke the skill:

```
/overnight-optimizer
```

The optimizer validates your config, establishes a baseline, then runs autonomously. Each experiment is a git commit — kept experiments accumulate, discarded ones are reverted with `git reset HEAD~1`.

## How It Works

The optimizer reads `experiment.yaml`, validates the config, and runs a baseline eval to establish a starting score. It then loops: analyze what has worked so far, form one targeted hypothesis, mutate the target file, commit, evaluate, then keep or revert the change based on whether the metric improved and all guards pass. After every experiment it updates `learnings.md` (for context survival across long runs) and `changelog.md` (for audit trail). The loop continues until a stop condition is met — budget exhausted, time limit reached, target score achieved, or a plateau of consecutive discards.

## Configuration Reference

Full field documentation, types, defaults, and validation rules: [`skills/overnight-optimizer/references/config-schema.md`](skills/overnight-optimizer/references/config-schema.md)

Annotated real-world examples: [`skills/overnight-optimizer/references/experiment-examples.md`](skills/overnight-optimizer/references/experiment-examples.md)

## Eval Modes

**Script mode** — your eval script runs, prints a number to stdout, exits 0. Fast and deterministic. Good for test suites, adversary evaluators, and any metric you can compute programmatically.

**Assertion mode** — Claude judges the target's output against a set of yes/no assertions. No eval script required. Good for tone, clarity, compliance, and qualities that are hard to measure with code.

## Relationship to skill-creator

These are complementary tools. `skill-creator`'s Phase 4b (`/autoresearch`) handles skill-specific optimization using a fixed assertion set embedded in the skill's evals. `overnight-optimizer` is general-purpose: it works on any file type (prompts, templates, configs, source files), supports both eval modes, runs from a standalone `experiment.yaml`, and is designed for longer autonomous runs with richer stop condition control. Use `skill-creator` when iterating on a skill; use `overnight-optimizer` for everything else.

## License

MIT — see [LICENSE](LICENSE).
