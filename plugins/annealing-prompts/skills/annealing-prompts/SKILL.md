---
name: annealing-prompts
description: Use when optimizing a prompt for Haiku or another cheap model to match Opus quality on a defined task, diagnosing eval-set overfitting, designing LLM evals with train/val/holdout splits, or building iterative prompt-improvement loops. Triggers on "my prompt works on Opus but fails on Haiku", "evals pass but production fails", "prompt keeps adding examples", "annealing a prompt", "cheap-model quality gap", or "prompt optimization loop".
effort: medium
---

# Prompt Anneal Methodology

Reference doc for optimizing a prompt so a cheap model (Haiku) produces outputs indistinguishable from an expensive model (Opus) on a specific, defined task. Adapted from the `MitchellkellerLG/auto-prompt-creator` repo's `METHODOLOGY.md` (MIT-licensed). Keep this as a methodology reference — not every prompt-tuning job needs the full anneal loop, but when one does, these are the rules that prevent the optimizer from gaming its own eval.

## When to Use

Pull this skill up when any of these show up:

- A prompt requires Opus for quality but the workload is Haiku-budget.
- Evals pass but production outputs regress — classic eval-set overfitting.
- A prompt keeps growing with more worked examples and scores aren't moving.
- You need an objective "done" threshold for a prompt, not a vibes check.
- You're about to invent an iteration loop for prompt refinement from scratch.
- You want a holdout-based graduation signal before calling a prompt "shipped".

Skip this skill for one-off creative tweaks, taste-driven outputs without stable ground truth, or tasks where you'll run the prompt once and delete it.

## Core Principle

**Teach the model to reason, not to memorize.** A prompt full of worked examples that map 1:1 to the eval set scores well on eval and fails in production. The goal is generalizable reasoning instructions, not a lookup table.

## Workflow Phases

### Phase 1: Setup (human-driven)
1. Define input schema, output schema, and rubric dimensions with weights.
2. Accuracy threshold: default 0.92. Token budget: default 800. Max iterations: default 10.
3. Provide 12+ input examples (15+ recommended for stable signal).
4. Generate ground truth with Opus. **Human validates every output** — this is the quality bar.
5. Split data: train 60% / val 30% / holdout 10%. Holdout is never seen during the loop.

### Phase 2: Baseline (human-supervised)
1. Write v001 prompt.
2. Execute against all train + val inputs.
3. Score and **show the raw output table** — company, output, ground truth side-by-side.
4. Human reviews, course-corrects, then says "go iterate."

### Phase 3: Autonomous loop
Each iteration:
1. Analyze failures (structured patterns with frequency and severity).
2. Select mutation type subject to diversity constraints (below).
3. Generate mutated prompt targeting the priority failure.
4. Execute against train + val.
5. Score against ground truth.
6. Update state (`loop-state.json`): scores, mutation type, halt check.
7. Print iteration summary with raw output table.

### Phase 4: Graduation
1. Score best version against holdout.
2. If `holdout_score >= threshold` and `holdout_val_gap > -0.08`: graduate.
3. If `holdout_val_gap < -0.10`: overfitted, do not graduate.
4. Report generalization metrics.

## Mutation Diversity Constraints

The key innovation. Without these, the optimizer converges on "add another example until eval passes" and silently overfits.

### Three-phase rule

| Loop phase | Iterations | Allowed mutations | Purpose |
|---|---|---|---|
| **Bootstrap** | 1-3 | All types, examples encouraged | Teach the basic pattern |
| **Generalize** | 4-7 | Structural only, **examples blocked** | Force reasoning improvements |
| **Polish** | 8-10 | All types, subtractive encouraged | Tighten, compress, verify |

### Mutation types

| Type | What it does | When |
|---|---|---|
| `additive` | Add new instructions, rules, or examples | Bootstrap only; sparingly after |
| `structural` | Reframe reasoning approach | Generalize phase; any time reasoning is weak |
| `targeted` | Fix one specific failure pattern | Any phase, but NOT via examples during generalize |
| `consolidation` | Merge redundant rules, tighten wording | Polish; when token budget is tight |
| `subtractive` | Remove instructions/examples, re-score | Polish; validates generalization |

### Hard rules
1. **Example cap: 4 per concept.** Beyond 4 worked examples for any single concept, the prompt is building a lookup table. Switch to structural reasoning.
2. **No 2 consecutive example-heavy mutations.** If the previous mutation added examples, the next must be structural, consolidation, or subtractive.
3. **Generalize phase (iterations 4-7): examples are blocked.** If the only fix for a failure is an example, the reasoning instructions are inadequate — fix those instead.
4. **Mandatory subtractive check at iteration 8.** Remove 50% of worked examples and re-score. Drop < 0.05: reasoning is strong, keep the leaner prompt. Drop > 0.10: examples are doing the work, revert and go back to generalize.
5. **Log mutation type every iteration.** The loop must check its own log before selecting the next mutation.

### Structural mutation levers (when examples are blocked)
- Reframe the task: "identify X" → "reason about X then output."
- Add constraints: word limits, format rules, forbidden patterns.
- Add negative instructions: "Do NOT do X" often beats "examples of doing Y."
- Change reasoning order: move reasoning step before/after specific instructions.
- Add self-check: "Before outputting, verify that [condition]."
- Generalize from examples: replace N specific examples with one abstract rule.
- Mirror/echo rules: "Use the input's exact terminology" instead of "if X then Y" maps.

## Halt Conditions

Checked after every iteration, in order. First match halts.

| Condition | Trigger | Halt reason |
|---|---|---|
| Threshold reached | `val >= accuracy_threshold` | `threshold-reached` |
| Max iterations | `iteration >= max_iterations` | `max-iterations` |
| Convergence plateau | 3 consecutive val deltas < 0.02 | `convergence-plateau` |
| Overfitting | `abs(train - val) > overfitting_threshold` | `overfitting` |
| Token budget | prompt tokens > budget | `token-budget` |

## Data Split Rules

| Split | Size | Purpose | When scored |
|---|---|---|---|
| Train | ~60% | Failures drive mutations | Every iteration |
| Val | ~30% | Generalization signal — not used to design mutations | Every iteration |
| Holdout | ~10% | Final generalization check — never seen during loop | Graduation only |

Minimum 12 examples (7 train, 3 val, 2 holdout). Val and holdout must each contain at least one hard case that doesn't map to any worked example in the prompt.

## Generalization Metrics (report at graduation)

| Metric | Formula | Healthy range |
|---|---|---|
| Val-Train gap | `val - train` | -0.05 to +0.05 |
| Holdout-Val gap | `holdout - val` | > -0.08 |
| Example density | `worked_examples / prompt_tokens` | < 0.01 |
| Structural ratio | `structural_mutations / total_mutations` | > 0.40 |

If holdout-val gap < -0.10, the prompt is overfitted. Do not graduate.

## Output Visibility

**Every iteration must show the raw output table.**

```
| Input | Output | Ground Truth | Score |
```

This catches qualitative regressions that aggregate scores hide and enables course correction.

## State Machine Pattern

Track iteration state in a single JSON file that survives session interruption. Minimum fields:

```json
{
  "scenario": "name",
  "current_iteration": 0,
  "best_version": "vNNN",
  "best_validation_score": 0.0,
  "last_mutation_type": "additive | structural | targeted | consolidation | subtractive",
  "halt_reason": null,
  "config": {
    "accuracy_threshold": 0.92,
    "max_iterations": 10,
    "token_budget": 800,
    "overfitting_threshold": 0.12
  },
  "score_history": [
    { "version": "vNNN", "overall": 0.0, "train": 0.0, "val": 0.0, "tokens": 0,
      "mutation_type": "...", "timestamp": "ISO-8601" }
  ]
}
```

## Parameterization Rule

**One runner, one scorer — never version-specific scripts.**
- Runner: `bun run-eval.mjs --version vNNN`
- Scorer: `bun judge.mjs --version vNNN`

Version-specific files (`run-v001.mjs`, `compute-scores-v002.py`) are tech debt. Parameterize from day one.

## When This Applies

- Optimizing a prompt to run on Haiku that currently requires Opus for quality.
- Any iterative LLM refinement where overfitting the eval set is a real risk.
- Any workflow that graduates a prompt / artifact / config from "experimental" to "blessed" based on measured quality.

## When This Does Not Apply

- One-off prompt tweaks for a task you'll run once.
- Prompts where 0.92 accuracy isn't the bar (e.g., creative writing).
- Tasks with no stable ground truth (subjective, taste-driven outputs).

## Origin & License

Lifted from `MitchellkellerLG/auto-prompt-creator/METHODOLOGY.md` (MIT, 2026-04). The methodology v2 is the source; the code in that repo has known bugs as of 2026-04-14 — the digest `2026-04-14-gh-mitchellkellerlg-auto-prompt-creator` in the Obsidian vault has the full review. Use this skill as the methodology reference; do not assume the upstream implementation works as documented until verified.
