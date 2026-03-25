---
name: overnight-optimizer
description: >-
  Use when running autonomous optimization experiments, overnight prompt tuning,
  iterative config improvement, or any modify-eval-keep/revert loop. Supports
  script-based evals (fast, programmatic) and assertion-based evals (Claude-judged).
effort: high
---

## 1. Context Recovery (FIRST)

Before forming your next hypothesis, read `learnings.md` and run `python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/resume.py experiment.yaml` to reconstruct your state.

This ensures context survives compaction. If `learnings.md` does not exist yet, this is a fresh run — proceed to Phase 1: Setup.

## 2. Overview

The overnight-optimizer is a general-purpose autonomous experiment runner. It implements the autoresearch pattern: modify a target, evaluate it, keep or revert the change, then repeat — autonomously, without human intervention between iterations.

The user creates an `experiment.yaml` in the project root. The optimizer reads it, validates the config, establishes a baseline, then runs an autonomous modify-eval-keep/revert loop until a stop condition is met.

Supported eval modes:
- **Script mode** — fast, programmatic evaluation via a shell/Python script that outputs a numeric score to stdout
- **Assertion mode** — Claude-judged evaluation using a test prompt and a set of yes/no assertions

## 3. Phase 1: Setup

1. Read `experiment.yaml` from the current working directory.

2. Validate the config:
   - Target file(s) exist on disk
   - For script mode: `eval_script` exists and is executable
   - `metric_goal` is either `maximize` or `minimize`
   - At least one stop condition is set (`budget`, `time_limit_hours`, `stop_on_score`, or `stop_on_plateau`). If all are null, print a warning: "No stop condition set — optimizer will run indefinitely until interrupted."
   - If validation fails, print the specific error and halt. Do not proceed with a broken config.

3. Check git state: run `git status --porcelain`. The output must be empty. If it is not, print: "Uncommitted changes detected. Commit or stash before running the optimizer." Then halt.

4. Run `python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/resume.py experiment.yaml`. If previous experiments exist for this run, reconstruct state and continue from where you left off. If this is a fresh run, proceed to establish baseline.

5. Run the baseline eval: `python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/run_experiment.py eval experiment.yaml`. Record this as experiment 0.

6. Commit the baseline: `git commit -m "overnight-optimizer([name]): baseline [metric_name]=[value]"`

7. Log the baseline: `python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/run_experiment.py log experiment.yaml 0 baseline "original, no changes" [score]`

8. Generate the dashboard: `python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/generate_dashboard.py results.json`. Open in browser if available.

## 4. Phase 2: Autonomous Loop

Run this loop autonomously. Do NOT pause to ask the user between iterations. Each step should complete before moving to the next.

```
REPEAT until stop condition:

  1. ANALYZE — Read learnings.md + results.tsv + recent git diffs to understand
     what has worked and what has failed. Look for patterns before hypothesizing.

  2. HYPOTHESIZE — Form ONE change. Log your reasoning in changelog.md before
     executing any edits. This creates an audit trail of intent.

     Good mutations:
       - Add a specific instruction targeting a common failure pattern
       - Reword an ambiguous instruction for clarity
       - Add an anti-pattern example to prevent a known failure mode
       - Reorder instructions to reflect actual priority
       - Add or improve a concrete example
       - Remove an instruction that has caused over-optimization

     Bad mutations (avoid these):
       - Rewriting everything at once
       - Making multiple independent changes in one experiment
       - Vague improvements ("make it better", "clarify this section")

  3. MUTATE — Edit the target file(s). Make one focused change only.
     Larger changes mask causality — you cannot learn what worked.

  4. COMMIT — git commit -m "overnight-optimizer([name]): experiment [N] — [description]"
     The commit message should describe the specific change, not the goal.

  5. EVALUATE — python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/run_experiment.py eval experiment.yaml

     Script mode:
       - Runs eval_script and captures stdout as the metric
       - Non-zero exit code → eval failure, DISCARD
       - Empty or non-numeric stdout → eval failure, DISCARD
       - Timeout exceeded → eval failure, DISCARD
       - 3 consecutive eval failures → HALT immediately (eval script is likely broken)

     Assertion mode:
       - Execute the target with test_prompt, repeated runs_per_experiment times
       - For each run, evaluate every assertion as binary yes/no using the
         question, pass, and fail fields
       - Score = total assertions passed across all runs
       - Max = num_assertions × runs_per_experiment

  6. CHECK GUARDS — The eval output includes guard results. All guards must pass.
     A guard failure means the change introduced a regression, even if the
     primary metric improved.

  7. DECIDE — ALL discard branches use: git reset HEAD~1

     Improved + guards pass   → KEEP   (commit stays, this becomes the new baseline)
     Same or worse            → DISCARD (git reset HEAD~1)
     Improved + guard fail    → DISCARD (git reset HEAD~1)
     Eval failure             → DISCARD (git reset HEAD~1)

     After git reset HEAD~1, the working tree is back to the previous baseline.
     Do not cherry-pick partial changes — the whole experiment stays or goes.

  8. LOG — python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/run_experiment.py log experiment.yaml [N] [keep/discard] "[description]" [score]
     Then update learnings.md with the insight from this experiment.
     Update changelog.md with the full experiment entry (see format in Section 10).

  9. CHECK STOP CONDITIONS
     - budget: has this many experiments been run?
     - time_limit_hours: has this much wall-clock time elapsed since Phase 1?
     - stop_on_score: has the metric reached or exceeded this threshold?
     - stop_on_plateau: have this many consecutive experiments been discarded?
     If any condition is met, exit the loop and proceed to Phase 3: Report.
```

## 5. Phase 3: Report

When the loop ends (for any reason), generate a final report:

1. Summary: baseline score → best score achieved, total experiments run, keep/discard ratio.

2. Top 3 most impactful mutations — the experiments with the largest single-step score improvements. Include the experiment number, the change description, and the score delta.

3. Run `git log --oneline` to show the chain of kept experiments. This is the provenance trail.

4. Remind the user of rollback options:
   - `git diff HEAD~N` to inspect the total cumulative delta across all kept experiments
   - `git reset HEAD~N` to undo all kept experiments and return to the original baseline

## 6. Assertion Mode Details

When `eval_mode` is `"assertions"`:

- Execute the target (e.g., run the prompt against `test_prompt`) `runs_per_experiment` times. Multiple runs reduce noise from non-deterministic outputs.
- For each run, evaluate every assertion as a binary yes/no judgment using the `question`, `pass`, and `fail` fields defined in the config.
- Score = total assertions passed across all runs.
- Max possible score = `num_assertions` × `runs_per_experiment`.
- In the DECIDE step, use `pass_rate` (score / max) as the metric with a `maximize` goal.
- Expected speed: approximately 2–3 minutes per experiment depending on model latency and number of runs.

Each assertion judgment should be made independently. Do not let earlier assertion results influence later ones within the same run.

## 7. File References

- `references/config-schema.md` — Full specification for `experiment.yaml`, including all fields, types, defaults, and validation rules.
- `references/experiment-examples.md` — Annotated example configs for prompt optimization, config tuning, and code improvement targets.
- `scripts/run_experiment.py` — Orchestrates eval execution, logging, and result recording.
- `scripts/generate_dashboard.py` — Generates an HTML dashboard from `results.json`.
- `scripts/resume.py` — Reconstructs optimizer state from `results.tsv` and git history for context-survival after compaction.

All scripts are invoked as: `python ${CLAUDE_PLUGIN_ROOT}/skills/overnight-optimizer/scripts/SCRIPTNAME`

## 8. Stop Conditions

The optimizer halts when any of the following is true:

- **budget** — the configured number of experiments have been run
- **time_limit_hours** — the configured number of wall-clock hours have elapsed since Phase 1 began
- **stop_on_score** — the metric has reached or exceeded (for maximize) / fallen to or below (for minimize) the target threshold
- **stop_on_plateau** — the configured number of consecutive experiments have all been discarded (no improvement streak)
- **3 consecutive eval failures** — halt immediately; do not continue running experiments against a broken eval script
- **User Ctrl+C** — treat as a clean stop; run Phase 3: Report before exiting

If multiple conditions are met simultaneously, report all of them.

## 9. Context Survival

`learnings.md` is the primary memory artifact for this optimizer run. After every experiment (keep or discard), write a concise insight to `learnings.md`. Insights should capture the "why" — not just what happened, but what it implies about the target.

If context compacts mid-run, the first instruction in this skill (Section 1) ensures you can reconstruct full state by re-reading `learnings.md` and running `resume.py`. This design means the optimizer can survive arbitrarily long runs without losing continuity.

Do not rely on conversation history for state. Always treat `learnings.md` and the git log as the source of truth.

## 10. Changelog Format

Append one entry to `changelog.md` after each experiment, using this format:

```markdown
## Experiment [N] — [keep/discard]

**Score:** [X]/[max] ([percent]%)
**Change:** [One sentence describing what was changed]
**Reasoning:** [Why this change was expected to help]
**Result:** [What actually happened]
**Failing outputs:** [Brief description of what still fails]
```

The changelog is a chronological audit trail. It enables post-run analysis and helps identify which reasoning patterns lead to successful mutations.

## 11. Learnings.md Format

Maintain `learnings.md` using this structure, adding to each section as experiments complete:

```markdown
# Overnight Optimizer Learnings: [name]

## Insights
- [What worked and why — include experiment number for traceability]

## Dead Ends
- [What didn't work — include experiment number and brief explanation]

## Patterns
- [General patterns discovered that apply across multiple experiments]
```

Keep entries concise. One bullet per experiment is sufficient. The goal is to give a future context (or a resumed context) enough signal to avoid repeating failed hypotheses and to build on successful ones.
