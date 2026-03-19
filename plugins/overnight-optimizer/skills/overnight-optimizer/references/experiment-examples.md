---
name: experiment-examples
description: Example experiment.yaml configurations for common optimization use cases — prompt tuning, config optimization, template refinement.
---

# Experiment Examples

These are complete, production-ready `experiment.yaml` configurations for common overnight-optimizer use cases. Each example includes the full config, a description of what it optimizes, what the eval checks, and a realistic timeline estimate.

---

## Example 1: X Post Generator Prompt (Script Mode)

**What it optimizes:** The system prompt for an X post generator. The eval calls the Claude API with the current prompt and a test topic, then passes the generated post to a separate "adversary evaluator" prompt that scores it 0–10 on hook quality, engagement potential, and editorial voice adherence.

**What the eval checks:** An adversary evaluator grades each post across three dimensions: hook strength (does it stop the scroll?), structural clarity (blank lines, punchy sentences), and voice fidelity (does it match the Hyperscale editorial style?). The script averages three independent evaluation calls to reduce variance and writes the mean to stdout.

**Expected timeline:** 40 experiments at roughly 90 seconds each = ~60 minutes. With a 12-hour time limit as a safety backstop, this run is well within an overnight window. Realistically, the optimizer should plateau within 30–35 experiments on a well-scoped prompt.

```yaml
name: "hyperscale-x-post-prompt"
description: >-
  Optimize X post generator system prompt for higher adversary scores.
  Targeting Hyperscale News editorial voice and engagement patterns.

target: "./prompts/x-generator-system.txt"
eval_mode: script
eval_script: "./eval/score_prompt.sh"
metric_name: "adversary_score"
metric_goal: maximize
metric_format: "float"
metric_max: 10.0

budget: 50
time_limit_hours: 12
stop_on_score: 9.5
stop_on_plateau: 5

guards:
  - name: "No banned words"
    check: "./eval/check_banned_words.sh"
  - name: "Token budget"
    check: "./eval/check_tokens.sh"

instructions: |
  Focus on hook quality, closing line punch, and blank line formatting.
  Do not change the core editorial voice section or the Hard Rules block.
  Good targets: the opening instruction, the example posts, the anti-pattern list.
  A common failure mode is posts that open with a statistic — address this directly.
```

**Eval script sketch (`./eval/score_prompt.sh`):**
```bash
#!/usr/bin/env bash
# Calls Claude API 3 times with test topics, averages adversary scores
# Prints single float to stdout (e.g., "7.83")
# Exits 0 on success, 1 on API error or parse failure
python ./eval/score_prompt.py --prompt ./prompts/x-generator-system.txt --runs 3
```

---

## Example 2: Cold Outreach Email Template (Assertion Mode)

**What it optimizes:** A cold outreach email template used by a B2B SaaS sales team. The template is a text file with instructions that Claude follows to draft personalized emails. The goal is to improve clarity, CTA strength, and compliance — without drifting into aggressive or legally risky language.

**What the eval checks:** Five assertions cover the dimensions that matter most: subject line specificity, single CTA discipline, body length (under 150 words), absence of unsubstantiated claims, and personalization signal (does it reference the prospect's industry or role?). Running 6 times per experiment gives a max score of 30 — enough resolution to detect single-assertion improvements.

**Expected timeline:** 25 experiments at ~3 minutes each in assertion mode = ~75 minutes. With `stop_on_plateau: 4`, the run will terminate earlier if the template converges. Total: 1–2 hours.

```yaml
name: "outreach-email-template"
description: >-
  Optimize cold outreach email template for clarity, CTA strength, and
  compliance. Target audience: mid-market finance and operations buyers.

target: "./templates/cold-outreach-template.txt"
eval_mode: assertions

test_prompt: |
  Draft a cold outreach email to a VP of Finance at a 200-person logistics
  company. We are introducing our spend analytics platform. Use the template
  to guide your structure and tone.

runs_per_experiment: 6

assertions:
  - name: "Specific subject line"
    question: "Does the subject line name a concrete benefit or pain point rather than a generic greeting?"
    pass: "Subject line references a specific outcome, metric, or problem (e.g., 'Cut procurement costs by 15%')"
    fail: "Subject line is generic ('Hello', 'Quick intro', 'Following up') or omits a value signal"

  - name: "Single CTA"
    question: "Does the email contain exactly one call to action with no alternatives?"
    pass: "One and only one next step is requested — a meeting, a reply, or a specific action"
    fail: "Multiple options are offered, or no CTA is present"

  - name: "Body under 150 words"
    question: "Is the email body (excluding subject line) under 150 words?"
    pass: "Word count is 150 or fewer"
    fail: "Word count exceeds 150"

  - name: "No unsubstantiated claims"
    question: "Are all claims either qualified with hedging language or sourced?"
    pass: "Superlatives are absent or qualified; statistics are cited or omitted"
    fail: "Unverified statistics, absolute guarantees, or unqualified superlatives are present"

  - name: "Personalization signal"
    question: "Does the email reference the prospect's specific industry, role, or company context?"
    pass: "At least one sentence directly addresses the prospect's situation (logistics, finance, company size)"
    fail: "Email reads as fully generic with no contextual tailoring"

budget: 25
stop_on_plateau: 4

instructions: |
  Optimize for persuasion and compliance. Do not change the legal disclaimer at
  the bottom. Focus on the opening value proposition and the CTA structure.
  The compliance tone is non-negotiable — do not soften or remove compliance language.
  Short sentences outperform long ones in this context.
```

---

## Example 3: Code Generation System Prompt (Script Mode)

**What it optimizes:** A system prompt used to generate Python utility functions from natural language descriptions. The eval runs the current prompt against a fixed test suite of 20 function descriptions, executes the generated code, and reports how many pass their unit tests. The goal is to maximize test pass rate.

**What the eval checks:** The eval script generates 20 functions using the current system prompt, runs the pre-written test suite against each, and writes the pass count to stdout (0–20). Guards check that the prompt stays under the model's context window limit and that generated code never produces unsafe import patterns (security regression guard).

**Expected timeline:** 30 experiments at ~2 minutes each = ~60 minutes. The test suite is deterministic, so variance is low — fewer runs are needed compared to assertion mode. With `stop_on_score: 19` and a budget of 30, this run targets near-perfect performance or exhausts its budget in just over an hour.

```yaml
name: "codegen-system-prompt"
description: >-
  Optimize Python code generation system prompt for test suite pass rate.
  Target: 20 utility function generation tasks, evaluated against unit tests.

target: "./prompts/codegen-system.txt"
eval_mode: script
eval_script: "./eval/run_test_suite.sh"
metric_name: "tests_passed"
metric_goal: maximize
metric_format: "int"
metric_max: 20

budget: 30
time_limit_hours: 8
stop_on_score: 19
stop_on_plateau: 6

guards:
  - name: "Prompt under context limit"
    check: "./eval/check_prompt_length.sh"
  - name: "No unsafe patterns in output"
    check: "./eval/check_unsafe_patterns.sh"

instructions: |
  Focus on the instructions for handling edge cases: empty inputs, None values,
  and type coercion. The test suite fails most often on boundary conditions.
  Do not change the output format requirements — tests depend on exact return types.
  Adding a worked example for a boundary case is a high-value mutation to try early.
```

**Eval script sketch (`./eval/run_test_suite.sh`):**
```bash
#!/usr/bin/env bash
# Generates 20 functions using current prompt, runs unit tests, prints pass count
# Prints single int to stdout (e.g., "17")
# Exits 0 on success, 1 on generation or test harness failure
python ./eval/run_suite.py --prompt ./prompts/codegen-system.txt
```

---

## Example 4: Minimal Config

**What it optimizes:** The simplest possible `experiment.yaml` — a prompt file evaluated by a single script, with one stop condition and no guards or instructions. Use this as a starting template and add fields as needed.

**What the eval checks:** Whatever the eval script checks — the minimal config places no constraints on eval design. The only requirement is that the script exits 0 on success and prints a number to stdout.

**Expected timeline:** Runs until 20 experiments are complete. At typical eval speeds, this is 30–60 minutes for a script-mode eval.

```yaml
name: "my-experiment"
target: "./prompts/my-prompt.txt"
eval_mode: script
eval_script: "./eval/score.sh"
metric_goal: maximize
budget: 20
```

This config uses all defaults:
- `metric_name`: `"score"`
- `metric_format`: `"float"`
- `metric_max`: `null` (no percentage display in dashboard)
- No guards
- No instructions (optimizer chooses its own mutation strategy)
- No plateau stop, no time limit, no score target

Add fields incrementally as you learn what your experiment needs. Most production experiments end up with at least `stop_on_plateau` and `instructions` — the plateau guard prevents wasted compute, and instructions prevent the optimizer from mutating sections you care about preserving.
