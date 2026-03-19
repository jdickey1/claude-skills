---
name: config-schema
description: Full specification for experiment.yaml — the configuration file that drives overnight-optimizer runs.
---

# experiment.yaml Schema Reference

`experiment.yaml` lives in the project root. The optimizer reads it at startup, validates all fields, then uses it throughout the run. Fields marked **required** must be present; fields marked **optional** use the listed default if omitted.

---

## Top-Level Fields

### `name`

| | |
|---|---|
| **Type** | string |
| **Required** | yes |
| **Default** | — |

Human-readable experiment name. Used in git commit messages (`overnight-optimizer([name]): ...`) and as the dashboard title. Keep it short and slug-friendly — avoid special characters that would break commit message parsing.

---

### `description`

| | |
|---|---|
| **Type** | string |
| **Required** | no |
| **Default** | — |

Free-text description of what this experiment is optimizing and why. Does not affect behavior — used for documentation and report generation only.

---

### `target`

| | |
|---|---|
| **Type** | string |
| **Required** | yes |
| **Default** | — |

Path to the file being optimized, relative to the project root. The optimizer reads, mutates, commits, and (on discard) reverts this file each iteration.

**Constraints:**
- Must point to an existing file. Validation fails if the file is not found.
- Must be tracked by git (the optimizer relies on `git reset HEAD~1` for revert).
- Directories are not supported — specify a single file.

---

### `eval_mode`

| | |
|---|---|
| **Type** | string |
| **Required** | yes |
| **Default** | — |
| **Valid values** | `"script"`, `"assertions"` |

Selects the evaluation strategy for the run. All other fields are conditional on this value.

- **`script`** — fast, programmatic evaluation via a shell or Python script that writes a numeric score to stdout.
- **`assertions`** — Claude-judged evaluation: the target is executed with `test_prompt`, and a set of yes/no assertions are graded against the output.

---

## Script Mode Fields

These fields apply when `eval_mode: script`.

### `eval_script`

| | |
|---|---|
| **Type** | string |
| **Required** | yes (script mode) |
| **Default** | — |

Path to the evaluation script, relative to the project root. The script is invoked directly by the optimizer each experiment.

**Protocol:**
- Exit code 0 = success. The optimizer reads stdout as the metric value.
- Any non-zero exit code = eval failure. The experiment is discarded.
- Stdout must be a single numeric value (float or int). Empty or non-numeric output = eval failure.
- Three consecutive eval failures halt the optimizer immediately.

**Constraints:**
- The file must exist.
- The file must be executable (`chmod +x`). Validation fails if it is not.

---

### `metric_name`

| | |
|---|---|
| **Type** | string |
| **Required** | no |
| **Default** | `"score"` |

Label for the metric being tracked. Used in commit messages, dashboard headers, and log output. Examples: `"adversary_score"`, `"test_pass_rate"`, `"perplexity"`.

---

### `metric_goal`

| | |
|---|---|
| **Type** | string |
| **Required** | yes (script mode) |
| **Default** | — |
| **Valid values** | `"maximize"`, `"minimize"` |

Direction of improvement. The optimizer keeps experiments that move the metric in this direction relative to the current baseline.

- `"maximize"` — keep if `new_score > baseline_score`
- `"minimize"` — keep if `new_score < baseline_score`

---

### `metric_format`

| | |
|---|---|
| **Type** | string |
| **Required** | no |
| **Default** | `"float"` |
| **Valid values** | `"float"`, `"int"` |

How to parse the eval script's stdout output. Use `"int"` when the metric is a count (e.g., number of tests passed). Use `"float"` for continuous scores.

---

### `metric_max`

| | |
|---|---|
| **Type** | number |
| **Required** | no |
| **Default** | `null` |

Maximum possible value for the metric. When set, enables `pass_rate` calculation (score / metric_max) and percentage display in the dashboard. Set this if your metric has a known ceiling (e.g., `10.0` for a 0–10 scoring rubric, or `50` for 50 unit tests).

---

## Assertion Mode Fields

These fields apply when `eval_mode: assertions`.

### `assertions`

| | |
|---|---|
| **Type** | list of assertion objects |
| **Required** | yes (assertions mode) |
| **Default** | — |

List of binary yes/no checks evaluated against the target's output. Each assertion is graded independently per run. Score = total assertions passed across all runs.

**Assertion object fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Short name for this assertion. Used in dashboard and logs. |
| `question` | string | yes | Yes/no question to evaluate against the output. Should be unambiguous. |
| `pass` | string | yes | Describes what a passing answer looks like. Used as grading guidance. |
| `fail` | string | yes | Describes what a failing answer looks like. Used as grading guidance. |

**Example:**
```yaml
assertions:
  - name: "Concise hook"
    question: "Does the post open with a single punchy sentence under 15 words?"
    pass: "First sentence is self-contained and under 15 words"
    fail: "First sentence is long, compound, or part of a larger opening paragraph"
  - name: "No hashtags"
    question: "Is the post free of hashtags?"
    pass: "No # characters appear anywhere in the post"
    fail: "One or more hashtags are present"
```

---

### `runs_per_experiment`

| | |
|---|---|
| **Type** | int |
| **Required** | no |
| **Default** | `5` |

How many times to run the target per experiment in assertion mode. Multiple runs reduce noise from non-deterministic outputs. The final score is the total assertions passed across all runs; the maximum possible score is `num_assertions × runs_per_experiment`.

**Constraints:** Must be a positive integer. Higher values increase accuracy but slow down each experiment cycle.

---

### `test_prompt`

| | |
|---|---|
| **Type** | string |
| **Required** | yes (assertions mode) |
| **Default** | — |

The prompt fed to the target during assertion-mode evaluation. Must be representative of real-world inputs — assertion results are only meaningful if the test prompt resembles actual use cases.

Supports multiline YAML block syntax:
```yaml
test_prompt: |
  Write an X post about the latest developments in AI infrastructure costs.
```

---

## Stop Conditions

At least one stop condition must be set. If all four are `null`, the optimizer prints a warning and requires confirmation before proceeding. The loop halts as soon as any condition is satisfied; if multiple conditions are met simultaneously, all are reported.

### `budget`

| | |
|---|---|
| **Type** | int |
| **Required** | no |
| **Default** | `null` |

Maximum number of experiments to run (not counting the baseline, which is experiment 0). When the Nth experiment completes, the optimizer proceeds to Phase 3: Report.

---

### `time_limit_hours`

| | |
|---|---|
| **Type** | number |
| **Required** | no |
| **Default** | `null` |

Maximum wall-clock hours elapsed since Phase 1 began. Accepts fractional values (e.g., `0.5` for 30 minutes). The check occurs after each experiment completes — the optimizer will not interrupt a running eval.

---

### `stop_on_score`

| | |
|---|---|
| **Type** | number |
| **Required** | no |
| **Default** | `null` |

Stop when the metric reaches or exceeds (for `maximize`) or falls to or below (for `minimize`) this value. Useful when you have a known target quality threshold and don't need to run a fixed budget.

---

### `stop_on_plateau`

| | |
|---|---|
| **Type** | int |
| **Required** | no |
| **Default** | `null` |

Stop after this many consecutive discarded experiments. Signals that the optimizer has exhausted obvious improvements at the current granularity. Example: `stop_on_plateau: 5` halts if five experiments in a row produce no improvement.

---

## Additional Fields

### `guards`

| | |
|---|---|
| **Type** | list of guard objects |
| **Required** | no |
| **Default** | `[]` |

Optional regression-prevention checks. Guards run after every eval. If any guard fails, the experiment is discarded even if the primary metric improved. This prevents the optimizer from improving one dimension at the expense of breaking another.

**Guard object fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Short name for this guard. Used in logs and dashboard. |
| `check` | string | yes | Path to the guard script, relative to project root. Exit 0 = pass, exit 1 = fail. |

**Constraints:**
- Each `check` script must exist.
- Each `check` script must be executable.

**Example:**
```yaml
guards:
  - name: "Token budget"
    check: "./eval/check_tokens.sh"
  - name: "No banned words"
    check: "./eval/check_banned_words.sh"
```

---

### `instructions`

| | |
|---|---|
| **Type** | string |
| **Required** | no |
| **Default** | — |

Free-text guidance for the optimizer's mutation strategy. Use this to constrain what the optimizer should and should not change — for example, protecting a voice guide section while allowing tactical instruction changes.

Supports multiline YAML block syntax:
```yaml
instructions: |
  Focus on hook quality and closing line structure.
  Do not modify the "Hard Rules" section.
  Never add hashtags or emoji instructions.
```

---

## Validation Rules

The optimizer validates `experiment.yaml` at startup. Any failure halts with a specific error message before any eval runs.

1. **Target file must exist** at the path specified, relative to the project root.
2. **`eval_mode` must be `"script"` or `"assertions"`** — any other value is rejected.
3. **Script mode requirements:** `eval_script` and `metric_goal` must both be present. `eval_script` must exist on disk and be executable.
4. **Assertions mode requirements:** `assertions` list must be present and non-empty. `test_prompt` must be present.
5. **Stop conditions:** At least one of `budget`, `time_limit_hours`, `stop_on_score`, or `stop_on_plateau` must be non-null. If all are null, the optimizer prints: `"Warning: no stop condition set — optimizer will run indefinitely until interrupted."` and waits for confirmation.
6. **Guard scripts:** Every `check` path must exist and be executable.
7. **`metric_goal`** must be `"maximize"` or `"minimize"`.
8. **Git state:** Must be clean (`git status --porcelain` returns empty). This is checked separately in Phase 1 setup, not schema validation.

---

## Complete Examples

### Script Mode — Prompt Optimization

```yaml
name: "x-post-prompt-v2"
description: "Improve X post generator system prompt for adversary score on Hyperscale content"
target: "./prompts/x-generator-system.txt"
eval_mode: script
eval_script: "./eval/score_prompt.sh"
metric_name: "adversary_score"
metric_goal: maximize
metric_format: "float"
metric_max: 10.0
budget: 40
time_limit_hours: 10
stop_on_score: 9.5
stop_on_plateau: 6
guards:
  - name: "Token budget"
    check: "./eval/check_tokens.sh"
  - name: "No banned words"
    check: "./eval/check_banned_words.sh"
instructions: |
  Focus on the opening hook and closing call-to-action.
  Preserve the Hard Rules section verbatim — do not edit it.
  Do not add hashtags or emoji instructions.
```

### Assertion Mode — Email Template

```yaml
name: "outreach-email-clarity"
description: "Optimize cold outreach email template for clarity, CTA strength, and compliance"
target: "./templates/cold-outreach.txt"
eval_mode: assertions
test_prompt: |
  Draft a cold outreach email to a mid-market CFO introducing our spend analytics platform.
runs_per_experiment: 5
assertions:
  - name: "Clear subject line"
    question: "Does the subject line communicate a specific benefit rather than a generic greeting?"
    pass: "Subject line names a concrete outcome or pain point"
    fail: "Subject line is generic (e.g., 'Hello', 'Quick question', 'Checking in')"
  - name: "One clear CTA"
    question: "Does the email contain exactly one call to action?"
    pass: "A single next step is requested — no alternatives or multiple asks"
    fail: "Multiple CTAs are present, or no CTA is present"
  - name: "No regulatory flags"
    question: "Is the email free of unsubstantiated claims or regulatory red flags?"
    pass: "All claims are qualified and no guarantees are stated"
    fail: "Absolute promises or unverified statistics are present"
budget: 30
stop_on_plateau: 5
instructions: |
  Optimize for clarity and persuasion. Keep total length under 150 words.
  The compliance tone is non-negotiable — do not soften or remove compliance language.
```
