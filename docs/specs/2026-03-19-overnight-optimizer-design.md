# Overnight Optimizer — Design Spec

**Date:** 2026-03-19
**Status:** Approved
**Plugin:** `plugins/overnight-optimizer/`
**Repo:** jdickey1/claude-skills (public)

---

## Summary

A general-purpose autonomous experiment runner for Claude Code. Implements the autoresearch pattern (modify → eval → keep/revert → repeat) to optimize any target: prompts, configs, code, templates. Ships as a separate plugin in the public repo, complementary to skill-creator's Phase 4b (which handles skill-specific optimization).

## Design Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Eval modes | Dual: script-based (fast) + assertion-based (slow) | Script for programmatic metrics, assertions for Claude-judged quality |
| Architecture | Separate plugin (`plugins/overnight-optimizer/`) | Clean separation; shared code copied not imported |
| Reversion mechanism | Git commits per experiment, `git reset HEAD~1` to discard | Skills are in GitHub; commits are natural, reviewable, reversible |
| Mutation scope | Any files per experiment, constrained by commit boundary | Git diff shows exactly what changed; no artificial file limits |
| First test case | Hyperscale X post prompt optimization | Real eval harness exists (adversary evaluator), real metric (score 1-10) |

## Plugin Structure

```
plugins/overnight-optimizer/
├── .claude-plugin/
│   └── plugin.json
├── skills/overnight-optimizer/
│   ├── SKILL.md                      # Workflow instructions + loop protocol
│   ├── references/
│   │   ├── config-schema.md          # experiment.yaml specification
│   │   └── experiment-examples.md    # Example configs for common use cases
│   └── scripts/
│       ├── run_experiment.py         # Eval orchestration + git ops + logging
│       ├── generate_dashboard.py     # Live HTML dashboard (from skill-creator)
│       ├── resume.py                 # Reconstruct state from git log + results.tsv
│       └── utils.py                  # YAML parsing, TSV append, results.json update
├── README.md
└── LICENSE
```

## Config Schema: experiment.yaml

User creates this in their project root:

```yaml
name: "hyperscale-x-post-prompt"
description: "Optimize X post generator system prompt for higher adversary scores"

# What to optimize
target: "./prompts/x-generator-system.txt"

# Eval mode: "script" or "assertions"
eval_mode: script

# --- Script mode ---
eval_script: "./eval/score_prompt.sh"   # exit 0, print metric to stdout
metric_name: "adversary_score"
metric_goal: maximize                   # "maximize" or "minimize"
metric_format: "float"                  # "float" or "int"
metric_max: 10.0                        # optional: max possible value (for pass_rate calc and dashboard)

# --- Assertion mode (alternative) ---
# eval_mode: assertions
# assertions:
#   - name: "No em dashes"
#     question: "Is the output completely free of em dash characters?"
#   - name: "Under 280 chars"
#     question: "Is every post under 280 characters?"
# runs_per_experiment: 5

# Constraints
budget: 50                              # max experiments (null = unlimited)
time_limit_hours: 12                    # max wall clock (null = unlimited)
stop_on_score: 9.5                      # stop if metric hits this (null = never)
stop_on_plateau: 5                      # stop after N consecutive discards

# Guards (must always pass)
guards:
  - name: "No banned words"
    check: "./eval/check_banned_words.sh"
  - name: "Token budget"
    check: "./eval/check_tokens.sh"

# Mutation guidance (optional)
instructions: |
  Focus on hook quality, closing line punch, blank line formatting.
  Don't change core editorial voice or hard rules sections.
```

## Core Loop Protocol

### Phase 1: Setup

1. Read `experiment.yaml` from current directory
2. Validate config:
   - Target file exists
   - Eval script exists and is executable (script mode)
   - `metric_goal` is "maximize" or "minimize"
   - At least one stop condition is set (`budget`, `time_limit_hours`, `stop_on_score`, or `stop_on_plateau`). Warn and require confirmation if all are null.
   - **If validation fails, print the specific error and halt. Do not proceed.**
3. **Check git state:** working tree must be clean (`git status --porcelain` returns empty). If dirty, halt with: "Uncommitted changes detected. Commit or stash before running the optimizer."
4. Run `resume.py` — if previous experiments exist, reconstruct state and continue. If fresh, establish baseline.
5. Run baseline eval, record as experiment 0
6. `git commit -m "overnight-optimizer([name]): baseline [metric_name]=[value]"` (include config `name` in commit message for multi-experiment repos)
7. Generate `dashboard.html`, open in browser if available

### Phase 2: Autonomous Loop

```
REPEAT until stop condition:

  1. ANALYZE — Read learnings.md + results.tsv + recent git diffs

  2. HYPOTHESIZE — Form ONE change. Log reasoning before executing.

  3. MUTATE — Edit target file(s). One focused change only.

  4. COMMIT — git commit -m "overnight-optimizer([name]): experiment [N] — [description]"

  5. EVALUATE —
     Script mode: run eval_script, capture stdout, parse metric
       - If script exits non-zero: treat as eval failure, log error, DISCARD
       - If stdout is empty or non-numeric: treat as eval failure, DISCARD
       - If script hangs >5 minutes: kill, treat as eval failure, DISCARD
       - If 3 consecutive eval failures: HALT and report (likely broken eval script)
     Assertion mode: see Assertion Mode section below

  6. CHECK GUARDS — Run each guard check. All must pass.

  7. DECIDE — ALL discard branches use git reset HEAD~1:
     Improved + guards pass → KEEP (new baseline)
     Same/worse            → DISCARD (git reset HEAD~1)
     Improved + guard fail → DISCARD (git reset HEAD~1)
     Eval failure          → DISCARD (git reset HEAD~1)

  8. LOG — run_experiment.py handles logging AFTER the decide step:
     Append results.tsv (with status=keep/discard), update results.json,
     regenerate dashboard.html. Claude updates learnings.md manually.
     Because logging happens after decide, TSV accurately reflects
     the final status of every experiment including discards.

  9. CHECK STOP CONDITIONS —
     budget reached? time_limit exceeded? stop_on_score hit?
     stop_on_plateau consecutive discards?
```

### Phase 3: Report

1. Summary: baseline → best score, experiments run, keep/discard ratio
2. Top 3 most impactful mutations (biggest score jumps)
3. `git log --oneline` showing chain of kept experiments
4. Reminder: `git diff HEAD~N` to see total delta, `git reset HEAD~N` to undo all

### Stop Conditions

- `budget` experiments run
- `time_limit_hours` elapsed
- `stop_on_score` reached (single threshold, not consecutive — config comment is authoritative)
- `stop_on_plateau` consecutive discards
- 3 consecutive eval script failures (broken eval, halt immediately)
- User Ctrl+C

### Orphaned Commit Recovery

If the optimizer crashes between COMMIT (step 4) and DECIDE (step 7), an orphaned commit exists with no corresponding TSV row. `resume.py` detects this by comparing the count of optimizer commits in `git log` against TSV row count. If git has one more commit than TSV has rows:
- Read the orphaned commit's diff to understand what was attempted
- Run the eval against current state to score it retroactively
- Log the result and proceed normally

This makes resume robust against mid-experiment crashes.

## Scripts

### run_experiment.py

Two subcommands: `eval` (run the eval and return metric) and `log` (record result after Claude decides).

```
Usage:
  python run_experiment.py eval <experiment.yaml>
  python run_experiment.py log <experiment.yaml> <experiment_number> <status> <description> <score>

eval subcommand:
  1. Read experiment.yaml for eval config
  2. Run eval_script with 5-minute timeout (script mode)
     - exit 0 + numeric stdout → return metric
     - exit non-zero → return {"error": "..."}
     - timeout → return {"error": "timeout after 300s"}
  3. Run guard checks (each guard script: exit 0 = pass, exit 1 = fail)
  4. Output JSON to stdout:
     {"metric": 8.5, "guards_pass": true, "guard_results": [
       {"name": "No banned words", "pass": true},
       {"name": "Token budget", "pass": true}
     ]}
     OR on eval failure:
     {"error": "eval script exited 1: rate limit exceeded", "guards_pass": null}

log subcommand (called AFTER Claude's keep/discard decision):
  1. Append row to results.tsv
  2. Update results.json
  3. Regenerate dashboard.html

Does NOT:
  - Git commit/revert (Claude handles this)
  - Form hypotheses or edit files
```

### resume.py

```
Usage: python resume.py <experiment.yaml>

Reconstructs state from results.tsv (authoritative) + git log (advisory):
  - Experiment count, baseline score, best score
  - current_score = score of the last KEPT experiment (not last run)
  - Last 5 experiments with keep/discard status
  - Reads learnings.md summary
  - Detects orphaned commits (git has more optimizer commits than TSV rows)

Output JSON:
  {"experiment_count": N, "baseline": X, "best_score": Y,
   "current_score": Z, "recent": [...], "learnings_summary": "...",
   "orphaned_commit": null | {"sha": "abc123", "message": "..."}}
```

### generate_dashboard.py

Copied from skill-creator (pinned at commit `HEAD` of skill-creator at time of copy — note source hash in file header for drift detection). Reads results.json, produces self-contained HTML with:
- Score progression chart (Chart.js)
- Colored experiment bars (green=keep, red=discard, blue=baseline)
- Per-eval breakdown (assertion mode) or single metric line (script mode)
- Guard status indicators
- Auto-refresh every 10 seconds

### utils.py

Shared helpers: YAML config parsing, TSV row append, results.json update.

## File Artifacts (created during run)

```
project-root/
├── experiment.yaml          # user-created config
├── results.tsv              # experiment log
├── results.json             # dashboard data
├── dashboard.html           # live monitoring UI
├── learnings.md             # accumulated insights (survives context loss)
└── changelog.md             # detailed per-experiment mutation log
```

### results.tsv Format

**Script mode** — `score` is the raw metric, `max_score` is from config (`metric_max`, defaults to null meaning unbounded), `pass_rate` is `score/max_score` if max is set or just the raw score repeated:

```
experiment	score	max_score	pass_rate	status	description
0	7.0	10.0	70.0%	baseline	original prompt, no changes
1	7.5	10.0	75.0%	keep	added worked example of correct hook format
2	7.5	10.0	75.0%	discard	tried enforcing semicolons over commas, no effect
```

**Assertion mode** — `score` is total assertions passed across all runs, `max_score` is total possible (num_assertions × runs_per_experiment):

```
experiment	score	max_score	pass_rate	status	description
0	14	20	70.0%	baseline	original prompt, no changes
1	16	20	80.0%	keep	added explicit hex codes for color palette
```

### results.json Format

**Script mode:**
```json
{
  "name": "hyperscale-x-post-prompt",
  "status": "running",
  "current_experiment": 3,
  "baseline_score": 7.0,
  "best_score": 8.5,
  "eval_mode": "script",
  "metric_name": "adversary_score",
  "experiments": [
    {"id": 0, "score": 7.0, "status": "baseline", "description": "original"}
  ],
  "guards": [
    {"name": "No banned words", "status": "pass"}
  ]
}
```

**Assertion mode** adds `eval_breakdown`:
```json
{
  "name": "...",
  "eval_mode": "assertions",
  "eval_breakdown": [
    {"name": "No em dashes", "pass_count": 8, "total": 10},
    {"name": "Under 280 chars", "pass_count": 10, "total": 10}
  ]
}
```

### learnings.md Format

```markdown
# Overnight Optimizer Learnings: hyperscale-x-post-prompt

## Insights
- Worked examples of correct hooks improved scores more than abstract rules
- Position matters: instructions near top of prompt are followed more reliably

## Dead Ends
- Forcing specific punctuation choices had no measurable effect
- Adding more than 3 anti-pattern examples caused regression

## Patterns
- Examples > rules for formatting guidance
- Removing instructions sometimes helps as much as adding them
```

## Assertion Mode (Full Specification)

When `eval_mode: assertions`, the optimizer uses Claude subagents instead of scripts to evaluate.

**Config:**
```yaml
eval_mode: assertions
assertions:
  - name: "No em dashes"
    question: "Is the output completely free of em dash characters?"
    pass: "Zero em dashes found anywhere in the output"
    fail: "One or more em dashes present"
  - name: "Under 280 chars"
    question: "Is every post under 280 characters?"
    pass: "All posts are under 280 characters"
    fail: "At least one post exceeds 280 characters"
runs_per_experiment: 5
test_prompt: "Generate 3 X posts about Texas datacenter water challenges"
```

**How it works:**

1. Claude executes the target (e.g., runs the prompt against `test_prompt`) `runs_per_experiment` times
2. For each run, Claude evaluates every assertion as binary yes/no
3. Score = total assertions passed across all runs. Max = num_assertions × runs_per_experiment
4. The DECIDE step uses `pass_rate` (score/max_score) as the metric, with `metric_goal: maximize`

**Grading:** Claude evaluates assertions inline (no separate grader agent needed for MVP). Each assertion has `question`, `pass`, and `fail` fields that define unambiguous binary criteria. Claude reads the output and answers each question.

**Speed:** ~2-3 minutes per experiment (5 runs × ~30s each). Expect 20-30 experiments per hour. Overnight: ~200 experiments.

## Changelog Format

Append after each experiment:

```markdown
## Experiment [N] — [keep/discard]

**Score:** [X]/[max] ([percent]%)
**Change:** [One sentence describing what was changed]
**Reasoning:** [Why this change was expected to help]
**Result:** [What actually happened — which evals improved/declined]
**Failing outputs:** [Brief description of what still fails, if anything]
```

## Context Survival

The agent writes everything to `learnings.md` after each experiment. If context gets compacted mid-run, the SKILL.md's first instruction is:

> Before forming your next hypothesis, read learnings.md and run `python resume.py experiment.yaml` to reconstruct your state.

This is the memory that persists across context windows and session restarts.

## Relationship to skill-creator

- Skill-creator's Phase 4b stays as-is. No refactor.
- `references/autoresearch.md` gets a cross-reference note
- Future v2: Phase 4b could delegate to overnight-optimizer by generating an experiment.yaml with assertion-based evals
- Shared code (dashboard, schemas) is copied, not imported. Extract to shared lib if a third consumer appears.

## First Test Case

Hyperscale X post prompt optimization:

```
test-project/
├── experiment.yaml
├── prompts/
│   └── x-generator-system.txt        # extracted from social-posts.ts
├── eval/
│   ├── score_prompt.sh               # generate posts + run adversary, output score
│   └── check_banned_words.sh         # guard: no em dashes, no AI buzzwords
└── sample-briefings/
    └── briefing-2026-03-19.txt       # test input for post generation
```

`score_prompt.sh`:
1. Read the system prompt from `prompts/x-generator-system.txt`
2. Call Claude API with prompt + sample briefing → generate 3 X posts
3. Call Claude API with adversary system prompt + generated posts → get score
4. Parse JSON score from adversary response
5. Print score to stdout

Expected loop speed: ~90-120s per cycle (two API calls + Claude reasoning/mutation time). ~30-40 experiments/hour. Overnight (8 hours): ~250-300 experiments. Actual throughput depends on eval script latency and Claude's mutation complexity.
