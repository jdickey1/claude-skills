# Autoresearch Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an autonomous hill-climbing skill optimization loop to the skill-creator, inspired by Karpathy's autoresearch methodology, with binary evals, TSV experiment tracking, changelog generation, live dashboard, guard assertions, and narrative learning accumulation.

**Architecture:** Extends the existing skill-creator Phase 4 (REFACTOR) with a new autonomous mode ("Phase 4b: AUTORESEARCH") that runs the eval suite in a loop, making one targeted mutation per iteration, scoring via binary yes/no checks, and keeping/discarding changes based on score delta. All new files live alongside existing skill-creator infrastructure — no existing workflows are broken.

**Tech Stack:** Markdown (skill instructions), Python (dashboard generator), HTML/JS/Chart.js (live dashboard), TSV (experiment log)

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `references/eval-guide.md` | Binary eval writing guide (adapted from Ole Lehmann's eval-guide) |
| `references/autoresearch.md` | Autonomous loop protocol reference |
| `scripts/generate_dashboard.py` | Live HTML dashboard generator (Chart.js, auto-refresh from results.json) |
| `assets/dashboard_template.html` | Self-contained HTML template for the live dashboard |

### Modified Files

| File | Changes |
|------|---------|
| `SKILL.md` | Add Phase 4b (AUTORESEARCH) section, link to new references |
| `references/schemas.md` | Add schemas for results.tsv, results.json, changelog.md, binary evals |
| `references/learning-loops.md` | Add narrative accumulation pattern ("learnings.md" alongside .learnings.jsonl) |

### Unchanged Files

All existing scripts, agents, eval-viewer, and other references remain untouched. The autoresearch loop is additive — it's a new mode within the existing lifecycle, not a replacement.

---

## Repo Context

**Source repo:** `/Users/james/Projects/claude-skills`
**Skill path:** `plugins/skill-creator/skills/skill-creator/`
**Branch:** `feature/autoresearch-integration`

All file paths below are relative to `plugins/skill-creator/skills/skill-creator/`.

---

### Task 1: Add Binary Eval Guide Reference

**Files:**
- Create: `references/eval-guide.md`

This is the foundation — all other tasks depend on the eval format defined here.

- [ ] **Step 1: Create `references/eval-guide.md`**

```markdown
---
name: eval-guide
description: How to write binary yes/no eval criteria for skill optimization. Referenced by Phase 4b autoresearch loop.
---

# Eval Guide

How to write eval criteria that actually improve your skills instead of giving you false confidence.

---

## The Golden Rule

Every eval must be a yes/no question. Not a scale. Not a vibe check. Binary.

Why: Scales compound variability. If you have 4 evals scored 1-7, your total score has massive variance across runs. Binary evals give you a reliable signal.

---

## Good Evals vs Bad Evals

### Text/Copy Skills (newsletters, tweets, emails, landing pages)

**Bad evals:**
- "Is the writing good?" (too vague — what's "good"?)
- "Rate the engagement potential 1-10" (scale = unreliable)
- "Does it sound like a human?" (subjective, inconsistent scoring)

**Good evals:**
- "Does the output contain zero phrases from this banned list: [game-changer, here's the kicker, the best part, level up]?" (binary, specific)
- "Does the opening sentence reference a specific time, place, or sensory detail?" (binary, checkable)
- "Is the output between 150-400 words?" (binary, measurable)
- "Does it end with a specific CTA that tells the reader exactly what to do next?" (binary, structural)

### Visual/Design Skills (diagrams, images, slides)

**Bad evals:**
- "Does it look professional?" (subjective)
- "Rate the visual quality 1-5" (scale)

**Good evals:**
- "Is all text in the image legible with no truncated or overlapping words?" (binary, specific)
- "Does the color palette use only soft/pastel tones with no neon, bright red, or high-saturation colors?" (binary, checkable)
- "Is the layout linear — flowing either left-to-right or top-to-bottom with no scattered elements?" (binary, structural)

### Code/Technical Skills (code generation, configs, scripts)

**Bad evals:**
- "Is the code clean?" (subjective)
- "Does it follow best practices?" (vague)

**Good evals:**
- "Does the code run without errors?" (binary, testable — actually execute it)
- "Does the output contain zero TODO or placeholder comments?" (binary, greppable)
- "Are all function and variable names descriptive (no single-letter names except loop counters)?" (binary, checkable)

### Document Skills (proposals, reports, decks)

**Bad evals:**
- "Is it comprehensive?" (compared to what?)

**Good evals:**
- "Does the document contain all required sections: [list them]?" (binary, structural)
- "Is every claim backed by a specific number, date, or source?" (binary, checkable)
- "Is the document under [X] pages/words?" (binary, measurable)

---

## Common Mistakes

### 1. Too Many Evals
More than 6 evals and the skill starts gaming them — it optimizes for passing the test instead of producing good output.

**Fix:** Pick the 3-6 checks that matter most.

### 2. Too Narrow/Rigid
"Must contain exactly 3 bullet points" creates skills that technically pass but produce weird, stilted output.

**Fix:** Evals should check for qualities you care about, not arbitrary structural constraints.

### 3. Overlapping Evals
If eval 1 is "Is the text grammatically correct?" and eval 4 is "Are there any spelling errors?" — these overlap. You're double-counting.

**Fix:** Each eval should test something distinct.

### 4. Unmeasurable by an Agent
"Would a human find this engaging?" — an agent can't reliably answer this.

**Fix:** Translate subjective qualities into observable signals. "Engaging" might mean: "Does the first sentence contain a specific claim, story, or question (not a generic statement)?"

---

## The 3-Question Test

Before finalizing an eval, ask:

1. **Could two different agents score the same output and agree?** If not, the eval is too subjective. Rewrite it.
2. **Could a skill game this eval without actually improving?** If yes, the eval is too narrow. Broaden it.
3. **Does this eval test something the user actually cares about?** If not, drop it. Every eval that doesn't matter dilutes the signal.

---

## Template

```
EVAL [N]: [Short name]
Question: [Yes/no question]
Pass: [What "yes" looks like — one sentence, specific]
Fail: [What triggers "no" — one sentence, specific]
```

Example:

```
EVAL 1: Text legibility
Question: Is all text in the output fully legible with no truncated, overlapping, or cut-off words?
Pass: Every word is complete and readable without squinting or guessing
Fail: Any word is partially hidden, overlapping another element, or cut off at the edge
```

---

## Sweet Spots

- **3-6 evals** per skill optimization run
- **5 runs per experiment** (balance reliability vs. cost)
- **One change per iteration** (know exactly what helped)
```

- [ ] **Step 2: Verify file renders correctly**

Run: `head -20 references/eval-guide.md`
Expected: Clean YAML frontmatter + first heading visible

- [ ] **Step 3: Commit**

```bash
git add references/eval-guide.md
git commit -m "feat(skill-creator): add binary eval guide reference

Adapted from Ole Lehmann's autoresearch eval methodology.
Covers good vs bad evals by skill type, common mistakes,
the 3-question test, and eval templates."
```

---

### Task 2: Add Autoresearch Protocol Reference

**Files:**
- Create: `references/autoresearch.md`

Defines the autonomous loop protocol. Referenced by Phase 4b in SKILL.md.

- [ ] **Step 1: Create `references/autoresearch.md`**

```markdown
---
name: autoresearch
description: Autonomous hill-climbing loop protocol for skill optimization. Defines the modify-score-keep/discard cycle, guard assertions, and stopping conditions.
---

# Autoresearch Protocol

Autonomous iterative optimization for Claude Code skills. Based on Karpathy's autoresearch methodology: make one change, measure, keep or discard, repeat.

---

## Core Loop

Once setup is complete, run this loop autonomously. Do NOT pause to ask the user between iterations.

### LOOP:

**1. ANALYZE failures.**
Read the most recent experiment outputs. Identify which evals are failing most. Read the actual failing outputs — understand the pattern. Is it a formatting issue? A missing instruction? An ambiguous directive?

**2. FORM a hypothesis.**
Pick ONE thing to change. Don't change multiple things at once — you won't know what helped.

Good mutations:
- Add a specific instruction that addresses the most common failure
- Reword an ambiguous instruction to be more explicit
- Add an anti-pattern ("Do NOT do X") for a recurring mistake
- Move a buried instruction higher in the skill (priority = position)
- Add or improve an example that shows the correct behavior
- Remove an instruction that's causing over-optimization for one thing at the expense of others

Bad mutations:
- Rewriting the entire skill from scratch
- Adding 10 new rules at once
- Making the skill longer without a specific reason
- Adding vague instructions like "make it better"

**3. MUTATE the working copy.**
Edit the working copy of SKILL.md (NEVER the original). One targeted change only.

**4. RUN the experiment.**
Execute the skill N times (default 5) using the test inputs. Score every output against every binary eval.

**5. SCORE it.**
Calculate total score: number of evals passed across all runs.

**6. CHECK guards** (if defined).
Run any guard assertions. Guards are pass/fail checks that must hold even when the primary score improves. Example: "Token count stays under 50K" while optimizing pass_rate.

**7. DECIDE: keep or discard.**
- Score improved AND guards pass → **KEEP.** Update working copy as new baseline.
- Score unchanged → **DISCARD.** Revert working copy to previous version.
- Score worsened → **DISCARD.** Revert working copy to previous version.
- Score improved BUT guards fail → **DISCARD.** The improvement isn't worth the regression.

**8. LOG the result.**
Append to results.tsv and changelog.md. Update results.json for the dashboard.

**9. REPEAT.**
Go back to step 1. Continue until:
- User manually stops the loop
- Budget cap reached (if set)
- 95%+ pass rate achieved for 3 consecutive experiments (diminishing returns)

---

## Setup Requirements

Before starting the loop, gather from the user:

1. **Target skill** — path to the SKILL.md to optimize
2. **Test inputs** — 3-5 different prompts/scenarios (variety prevents overfitting)
3. **Binary evals** — 3-6 yes/no checks defining "good" output (see eval-guide.md)
4. **Runs per experiment** — default 5 (more = reliable but slower)
5. **Budget cap** — optional max number of experiments (default: no cap)
6. **Guard assertions** — optional pass/fail checks that must always hold (e.g., "output under 500 words")

---

## File Layout

All autoresearch artifacts live in `autoresearch-[skill-name]/` inside the skill's directory:

```
autoresearch-[skill-name]/
├── [user-chosen-name].md   # working copy (mutated each iteration)
├── SKILL.md.baseline       # original skill (never modified)
├── dashboard.html           # live browser dashboard
├── results.json             # data powering the dashboard
├── results.tsv              # experiment log (tab-separated)
├── changelog.md             # detailed mutation log
└── learnings.md             # accumulated insights across iterations
```

**The original SKILL.md is NEVER modified.** The user decides whether to apply changes after reviewing.

---

## results.tsv Format

Tab-separated. Header row required.

```
experiment	score	max_score	pass_rate	status	description
0	14	20	70.0%	baseline	original skill — no changes
1	16	20	80.0%	keep	added explicit hex codes for color palette
2	16	20	80.0%	discard	tried enforcing left-to-right layout — no improvement
3	18	20	90.0%	keep	added worked example of correct formatting
```

---

## changelog.md Format

Append after each experiment:

```markdown
## Experiment [N] — [keep/discard]

**Score:** [X]/[max] ([percent]%)
**Change:** [One sentence describing what was changed]
**Reasoning:** [Why this change was expected to help]
**Result:** [What actually happened — which evals improved/declined]
**Failing outputs:** [Brief description of what still fails, if anything]
```

---

## results.json Format

Powers the live dashboard. Updated after each experiment.

```json
{
  "skill_name": "[name]",
  "status": "running",
  "current_experiment": 3,
  "baseline_score": 70.0,
  "best_score": 90.0,
  "experiments": [
    {
      "id": 0,
      "score": 14,
      "max_score": 20,
      "pass_rate": 70.0,
      "status": "baseline",
      "description": "original skill — no changes"
    }
  ],
  "eval_breakdown": [
    {"name": "Text legibility", "pass_count": 8, "total": 10},
    {"name": "Pastel colors", "pass_count": 9, "total": 10}
  ],
  "guards": [
    {"name": "Token budget", "status": "pass"}
  ]
}
```

---

## learnings.md Format

Narrative accumulation file. Agent appends insights after each experiment. Survives context compaction — fresh agents read this to inherit understanding.

```markdown
# Autoresearch Learnings: [skill-name]

## Insights

- Specific hex codes work better than vague color descriptions (Exp 1 → +10%)
- Anti-patterns alone don't help if a positive example already covers the behavior (Exp 4 → no change)
- Worked examples are the single most effective mutation type for formatting skills
- Word count constraints that are too tight cause CTA quality to drop (Exp 6 → reverted)

## Dead Ends

- Enforcing layout direction via text instruction — the model ignores it consistently
- Banning specific words without providing alternatives — leads to awkward phrasing

## Patterns

- Position matters: instructions near the top of the skill are followed more reliably
- Examples > rules for anything involving formatting or structure
```

---

## Guard Assertions

Guards prevent regressions while optimizing the primary metric.

Format:
```
GUARD [N]: [Short name]
Question: [Yes/no question — must pass for any change to be kept]
```

Example:
```
GUARD 1: Token budget
Question: Does the skill execution use fewer than 50,000 tokens total?

GUARD 2: No regressions
Question: Do all previously-passing evals still pass?
```

If the primary score improves but a guard fails, the change is DISCARDED. Guards are conservative by design.

---

## Running Out of Ideas

If you run out of obvious mutations:
1. Re-read the failing outputs — there's always a pattern
2. Try combining two previous near-miss mutations
3. Try removing things instead of adding them (simplification that maintains the score is a win)
4. Try a completely different approach to the same problem
5. Read the learnings.md for dead ends to avoid and patterns to exploit
6. Try reordering existing instructions (position affects adherence)
```

- [ ] **Step 2: Verify file renders correctly**

Run: `head -20 references/autoresearch.md`
Expected: Clean YAML frontmatter + first heading visible

- [ ] **Step 3: Commit**

```bash
git add references/autoresearch.md
git commit -m "feat(skill-creator): add autoresearch protocol reference

Defines the autonomous hill-climbing loop: analyze failures,
form hypothesis, mutate one thing, score, keep/discard, repeat.
Includes file layout, TSV format, changelog format, guard
assertions, and learnings accumulation."
```

---

### Task 3: Add Dashboard Generator Script

**Files:**
- Create: `scripts/generate_dashboard.py`

Self-contained Python script that generates a live HTML dashboard from results.json. No external dependencies beyond stdlib + inline Chart.js from CDN.

- [ ] **Step 1: Create `scripts/generate_dashboard.py`**

```python
#!/usr/bin/env python3
"""Generate a live auto-refreshing HTML dashboard for autoresearch runs.

Reads results.json and produces a self-contained dashboard.html that:
- Auto-refreshes every 10 seconds
- Shows score progression line chart (Chart.js from CDN)
- Shows colored experiment bars (green=keep, red=discard, blue=baseline)
- Shows experiment table with details
- Shows per-eval breakdown
- Shows guard status
- Shows current status (running/complete)

Usage:
    python generate_dashboard.py <results_json_path> [--output <dashboard_html_path>]

Can also be called as a module:
    from generate_dashboard import generate_dashboard_html
    html = generate_dashboard_html(results_dict)
"""

import argparse
import json
import sys
from pathlib import Path


def generate_dashboard_html(data: dict, auto_refresh: bool = True) -> str:
    """Generate self-contained HTML dashboard from results data."""

    skill_name = data.get("skill_name", "Unknown Skill")
    status = data.get("status", "unknown")
    current_exp = data.get("current_experiment", 0)
    baseline_score = data.get("baseline_score", 0)
    best_score = data.get("best_score", 0)
    experiments = data.get("experiments", [])
    eval_breakdown = data.get("eval_breakdown", [])
    guards = data.get("guards", [])

    # Build experiment rows
    exp_rows = ""
    for exp in experiments:
        status_class = {
            "baseline": "status-baseline",
            "keep": "status-keep",
            "discard": "status-discard",
        }.get(exp.get("status", ""), "")
        exp_rows += f"""
        <tr class="{status_class}">
            <td>{exp.get('id', '')}</td>
            <td>{exp.get('score', '')}/{exp.get('max_score', '')}</td>
            <td>{exp.get('pass_rate', 0):.1f}%</td>
            <td>{exp.get('status', '')}</td>
            <td>{exp.get('description', '')}</td>
        </tr>"""

    # Build eval breakdown rows
    eval_rows = ""
    for ev in eval_breakdown:
        total = ev.get("total", 1)
        passed = ev.get("pass_count", 0)
        pct = (passed / total * 100) if total > 0 else 0
        bar_color = "#4ade80" if pct >= 80 else "#fbbf24" if pct >= 50 else "#f87171"
        eval_rows += f"""
        <tr>
            <td>{ev.get('name', '')}</td>
            <td>{passed}/{total}</td>
            <td>
                <div class="bar-bg">
                    <div class="bar-fill" style="width:{pct:.0f}%;background:{bar_color}"></div>
                </div>
            </td>
            <td>{pct:.0f}%</td>
        </tr>"""

    # Build guard rows
    guard_rows = ""
    for g in guards:
        g_status = g.get("status", "unknown")
        g_icon = "&#x2705;" if g_status == "pass" else "&#x274C;"
        guard_rows += f"<tr><td>{g_icon}</td><td>{g.get('name', '')}</td><td>{g_status}</td></tr>"

    # Chart data
    labels = json.dumps([f"Exp {e.get('id', '')}" for e in experiments])
    scores = json.dumps([e.get("pass_rate", 0) for e in experiments])
    colors = json.dumps([
        "#60a5fa" if e.get("status") == "baseline"
        else "#4ade80" if e.get("status") == "keep"
        else "#f87171"
        for e in experiments
    ])

    refresh_meta = '<meta http-equiv="refresh" content="10">' if auto_refresh else ""
    status_text = f"Running experiment {current_exp}..." if status == "running" else "Complete"
    status_color = "#4ade80" if status == "complete" else "#60a5fa"

    improvement = best_score - baseline_score
    improvement_sign = "+" if improvement >= 0 else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {refresh_meta}
    <title>Autoresearch: {skill_name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; }}
        h1 {{ font-size: 1.5rem; margin-bottom: 4px; }}
        .subtitle {{ color: #64748b; margin-bottom: 24px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }}
        .card {{ background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
        .card-label {{ font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }}
        .card-value {{ font-size: 1.75rem; font-weight: 700; margin-top: 4px; }}
        .chart-container {{ background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 24px; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th {{ text-align: left; padding: 10px 12px; font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #e2e8f0; }}
        td {{ padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }}
        .status-keep {{ background: #f0fdf4; }}
        .status-discard {{ background: #fef2f2; }}
        .status-baseline {{ background: #eff6ff; }}
        .bar-bg {{ background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; }}
        .bar-fill {{ height: 100%; border-radius: 4px; transition: width 0.3s; }}
        .status-badge {{ display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; color: white; }}
        .section {{ margin-bottom: 24px; }}
        .section-title {{ font-size: 1rem; font-weight: 600; margin-bottom: 12px; }}
    </style>
</head>
<body>
    <h1>Autoresearch: {skill_name}</h1>
    <p class="subtitle">
        <span class="status-badge" style="background:{status_color}">{status_text}</span>
    </p>

    <div class="grid">
        <div class="card">
            <div class="card-label">Baseline</div>
            <div class="card-value">{baseline_score:.1f}%</div>
        </div>
        <div class="card">
            <div class="card-label">Best Score</div>
            <div class="card-value" style="color:#16a34a">{best_score:.1f}%</div>
        </div>
        <div class="card">
            <div class="card-label">Improvement</div>
            <div class="card-value">{improvement_sign}{improvement:.1f}%</div>
        </div>
        <div class="card">
            <div class="card-label">Experiments</div>
            <div class="card-value">{len(experiments)}</div>
        </div>
    </div>

    <div class="chart-container">
        <canvas id="scoreChart" height="80"></canvas>
    </div>

    {"<div class='section card'><div class='section-title'>Guard Status</div><table><tr><th></th><th>Guard</th><th>Status</th></tr>" + guard_rows + "</table></div>" if guards else ""}

    <div class="section card">
        <div class="section-title">Per-Eval Breakdown</div>
        <table>
            <tr><th>Eval</th><th>Passed</th><th>Distribution</th><th>Rate</th></tr>
            {eval_rows}
        </table>
    </div>

    <div class="section card">
        <div class="section-title">Experiment Log</div>
        <table>
            <tr><th>#</th><th>Score</th><th>Pass Rate</th><th>Status</th><th>Description</th></tr>
            {exp_rows}
        </table>
    </div>

    <script>
        new Chart(document.getElementById('scoreChart'), {{
            type: 'line',
            data: {{
                labels: {labels},
                datasets: [{{
                    label: 'Pass Rate %',
                    data: {scores},
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: {colors},
                    pointRadius: 6,
                    pointHoverRadius: 8
                }}]
            }},
            options: {{
                responsive: true,
                plugins: {{
                    legend: {{ display: false }},
                    title: {{ display: true, text: 'Score Progression', font: {{ size: 14 }} }}
                }},
                scales: {{
                    y: {{ min: 0, max: 100, title: {{ display: true, text: 'Pass Rate %' }} }},
                    x: {{ title: {{ display: true, text: 'Experiment' }} }}
                }}
            }}
        }});
    </script>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate autoresearch dashboard")
    parser.add_argument("results_json", help="Path to results.json")
    parser.add_argument("--output", "-o", help="Output HTML path (default: dashboard.html in same dir)")
    parser.add_argument("--static", action="store_true", help="Disable auto-refresh")
    args = parser.parse_args()

    results_path = Path(args.results_json)
    if not results_path.exists():
        print(f"Error: {results_path} not found", file=sys.stderr)
        sys.exit(1)

    with open(results_path) as f:
        data = json.load(f)

    html = generate_dashboard_html(data, auto_refresh=not args.static)

    output_path = Path(args.output) if args.output else results_path.parent / "dashboard.html"
    output_path.write_text(html)
    print(f"Dashboard written to {output_path}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Verify script is syntactically valid**

Run: `python3 -c "import ast; ast.parse(open('scripts/generate_dashboard.py').read()); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/generate_dashboard.py
git commit -m "feat(skill-creator): add autoresearch dashboard generator

Self-contained Python script that produces a live HTML dashboard
with Chart.js line chart, experiment table, per-eval breakdown,
and guard status. Auto-refreshes every 10 seconds."
```

---

### Task 4: Update Schemas Reference

**Files:**
- Modify: `references/schemas.md`

Add schemas for the new autoresearch data formats.

- [ ] **Step 1: Read current schemas.md**

Run: Read `references/schemas.md` to find the right insertion point.

- [ ] **Step 2: Append autoresearch schemas to end of `references/schemas.md`**

Add the following section at the end of the file:

```markdown

---

## Autoresearch Schemas

### Binary Eval Definition

Used by the autoresearch loop (Phase 4b). Each eval is a binary yes/no check.

```json
{
  "evals": [
    {
      "id": 1,
      "name": "Text legibility",
      "question": "Is all text fully legible with no truncated or overlapping words?",
      "pass": "Every word is complete and readable",
      "fail": "Any word is partially hidden or cut off"
    }
  ]
}
```

### results.tsv

Tab-separated experiment log. One row per experiment.

| Column | Type | Description |
|--------|------|-------------|
| experiment | int | Sequential counter starting at 0 (baseline) |
| score | int | Number of evals passed across all runs |
| max_score | int | Maximum possible score (num_evals × runs_per_experiment) |
| pass_rate | string | Percentage with % suffix (e.g., "70.0%") |
| status | enum | `baseline`, `keep`, or `discard` |
| description | string | One-sentence description of the mutation |

### results.json

Powers the live dashboard. Updated after each experiment.

```json
{
  "skill_name": "string",
  "status": "running | complete",
  "current_experiment": 0,
  "baseline_score": 0.0,
  "best_score": 0.0,
  "experiments": [
    {
      "id": 0,
      "score": 14,
      "max_score": 20,
      "pass_rate": 70.0,
      "status": "baseline | keep | discard",
      "description": "string"
    }
  ],
  "eval_breakdown": [
    {
      "name": "string",
      "pass_count": 0,
      "total": 0
    }
  ],
  "guards": [
    {
      "name": "string",
      "status": "pass | fail"
    }
  ]
}
```

### Guard Assertion Definition

Optional regression-prevention checks.

```json
{
  "guards": [
    {
      "id": 1,
      "name": "Token budget",
      "question": "Does the skill execution use fewer than 50,000 tokens total?",
      "threshold": 50000,
      "metric": "total_tokens"
    }
  ]
}
```
```

- [ ] **Step 3: Commit**

```bash
git add references/schemas.md
git commit -m "feat(skill-creator): add autoresearch schemas to reference

Adds binary eval definition, results.tsv format, results.json
format, and guard assertion schemas."
```

---

### Task 5: Update Learning Loops Reference

**Files:**
- Modify: `references/learning-loops.md`

Add narrative accumulation pattern alongside existing JSONL journal.

- [ ] **Step 1: Read current learning-loops.md**

Run: Read `references/learning-loops.md` to find the right insertion point.

- [ ] **Step 2: Add narrative accumulation section before the "Running promote_learnings" section**

Add:

```markdown

## Narrative Accumulation (learnings.md)

In addition to the structured `.learnings.jsonl` journal, autoresearch runs produce a `learnings.md` file — a prose document that accumulates insights across iterations.

Unlike JSONL (which is data), `learnings.md` is understanding. It captures:

- **Insights** — what mutation patterns work for this specific skill
- **Dead ends** — approaches that were tried and failed, so future agents don't repeat them
- **Patterns** — recurring observations about what makes this skill succeed or fail

### Why both?

`.learnings.jsonl` is machine-readable and feeds into `promote_learnings.py` for automated analysis. `learnings.md` is agent-readable and survives context compaction — when a fresh agent picks up an autoresearch run, it reads `learnings.md` to inherit the accumulated understanding without processing hundreds of JSONL entries.

### Format

```markdown
# Autoresearch Learnings: [skill-name]

## Insights

- [Observation from experiment N → result]
- [Pattern discovered across experiments]

## Dead Ends

- [Approach that consistently fails and why]

## Patterns

- [Meta-observations about what works for this skill type]
```

The agent appends to this file after each experiment. Keep entries concise — one line per insight.
```

- [ ] **Step 3: Commit**

```bash
git add references/learning-loops.md
git commit -m "feat(skill-creator): add narrative accumulation to learning loops

Adds learnings.md pattern — prose document that accumulates
insights across autoresearch iterations. Complements existing
.learnings.jsonl with agent-readable understanding that
survives context compaction."
```

---

### Task 6: Add Phase 4b to SKILL.md

**Files:**
- Modify: `SKILL.md`

This is the main integration — adding the autoresearch mode to the skill lifecycle.

- [ ] **Step 1: Read current SKILL.md**

Read the full file. Identify where Phase 4 (REFACTOR Harden) ends and Phase 5 (Learning Instrumentation) begins.

- [ ] **Step 2: Insert Phase 4b section after Phase 4 and before Phase 5**

Add the following section between Phase 4 and Phase 5:

```markdown

---

## Phase 4b: AUTORESEARCH — Autonomous Skill Optimization

**When to use this instead of Phase 4:** Use when the user says "run autoresearch", "optimize this skill", "improve this skill autonomously", or when the user wants hands-off improvement. Phase 4 (manual REFACTOR) is for human-guided iteration. Phase 4b is for autonomous iteration.

**Prerequisites:** The skill must already exist (at least a draft from Phase 2). The user must provide test inputs and eval criteria.

### Setup

**STOP. Do not run any experiments until all fields below are confirmed with the user.**

1. **Target skill** — Which skill to optimize? (exact path to SKILL.md)
2. **Test inputs** — 3-5 different prompts/scenarios covering different use cases
3. **Eval criteria** — 3-6 binary yes/no checks defining good output (see [references/eval-guide.md](references/eval-guide.md) for how to write good evals)
4. **Runs per experiment** — Default: 5
5. **Budget cap** — Optional max experiments. Default: no cap (runs until stopped or hits ceiling)
6. **Guard assertions** — Optional pass/fail checks that must always hold (e.g., "output under 500 words")
7. **Version name** — What to call the optimized copy (e.g., "my-skill-v2")

### Execution

1. **Read the target skill completely** — including all referenced files in `references/`
2. **Create working directory:** `autoresearch-[skill-name]/` inside the skill's folder
3. **Copy original** to `[version-name].md` (the working copy) and `SKILL.md.baseline` (the safety net)
4. **Build eval suite** from user's criteria using the format in [references/eval-guide.md](references/eval-guide.md)
5. **Generate the live dashboard** using `scripts/generate_dashboard.py` — open it immediately in the browser
6. **Establish baseline** (Experiment 0): run the skill as-is, score all outputs, record in results.tsv
7. **Confirm baseline score with user** — if already 90%+, ask if they still want to continue
8. **Enter the autoresearch loop** — follow the protocol in [references/autoresearch.md](references/autoresearch.md)
9. **After each experiment:** update results.tsv, results.json, changelog.md, and learnings.md
10. **When loop ends:** present results summary (baseline → final, experiments run, top changes, remaining failures)

### Key Rules

- **ONE change per iteration.** Never combine mutations.
- **Binary evals ONLY.** No scales, no vibes.
- **NEVER modify the original SKILL.md.** All mutations on the working copy.
- **NEVER stop to ask the user** between experiments. Run autonomously.
- **Update the dashboard** after every experiment so the user can watch progress.
- **Log everything** — the changelog is the most valuable artifact.

### Output

The skill produces these files in `autoresearch-[skill-name]/`:

```
autoresearch-[skill-name]/
├── [version-name].md        # improved working copy
├── SKILL.md.baseline        # original (untouched)
├── dashboard.html           # live browser dashboard
├── results.json             # dashboard data
├── results.tsv              # experiment log
├── changelog.md             # detailed mutation log
└── learnings.md             # accumulated insights
```

See [references/autoresearch.md](references/autoresearch.md) for complete protocol details.
See [references/schemas.md](references/schemas.md) for data format specifications.
```

- [ ] **Step 3: Add eval-guide.md and autoresearch.md to the Reference Files section at the bottom of SKILL.md**

Find the existing reference file listings and add:

```markdown
- [references/eval-guide.md](references/eval-guide.md) — How to write binary yes/no eval criteria for skill optimization
- [references/autoresearch.md](references/autoresearch.md) — Autonomous hill-climbing loop protocol
```

- [ ] **Step 4: Verify SKILL.md renders correctly**

Run: `grep -n "Phase 4b\|Phase 5\|eval-guide\|autoresearch" SKILL.md`
Expected: Phase 4b appears between Phase 4 and Phase 5, references are listed

- [ ] **Step 5: Commit**

```bash
git add SKILL.md
git commit -m "feat(skill-creator): add Phase 4b autoresearch to skill lifecycle

Adds autonomous hill-climbing optimization mode between Phase 4
(manual REFACTOR) and Phase 5 (Learning Instrumentation).
Links to eval-guide.md, autoresearch.md protocol, and
generate_dashboard.py for live progress tracking."
```

---

### Task 7: Verify All Cross-References

**Files:**
- Read-only verification of all modified/created files

- [ ] **Step 1: Verify all internal links resolve**

Check that every `[references/X.md](references/X.md)` and `[scripts/X.py](scripts/X.py)` link in SKILL.md points to a file that exists:

Run:
```bash
cd plugins/skill-creator/skills/skill-creator
for ref in references/eval-guide.md references/autoresearch.md scripts/generate_dashboard.py; do
  [ -f "$ref" ] && echo "OK: $ref" || echo "MISSING: $ref"
done
```

Expected: All OK

- [ ] **Step 2: Verify no broken YAML frontmatter**

Run:
```bash
for f in references/eval-guide.md references/autoresearch.md; do
  head -1 "$f" | grep -q "^---$" && echo "OK: $f" || echo "BAD: $f"
done
```

Expected: All OK

- [ ] **Step 3: Run quick_validate on the skill**

Run:
```bash
python3 scripts/quick_validate.py .
```

Expected: Valid skill

- [ ] **Step 4: Final commit (if any fixes needed)**

Only if steps 1-3 revealed issues. Otherwise skip.

---

### Task 8: Integration Test — Dry Run

**Files:**
- Read-only verification

- [ ] **Step 1: Verify generate_dashboard.py works with sample data**

Run:
```bash
cd plugins/skill-creator/skills/skill-creator
python3 -c "
from scripts.generate_dashboard import generate_dashboard_html
import json
sample = {
    'skill_name': 'test-skill',
    'status': 'running',
    'current_experiment': 2,
    'baseline_score': 60.0,
    'best_score': 80.0,
    'experiments': [
        {'id': 0, 'score': 12, 'max_score': 20, 'pass_rate': 60.0, 'status': 'baseline', 'description': 'original'},
        {'id': 1, 'score': 16, 'max_score': 20, 'pass_rate': 80.0, 'status': 'keep', 'description': 'added hex codes'},
        {'id': 2, 'score': 14, 'max_score': 20, 'pass_rate': 70.0, 'status': 'discard', 'description': 'tried word limit'}
    ],
    'eval_breakdown': [
        {'name': 'Text legibility', 'pass_count': 8, 'total': 10},
        {'name': 'Color compliance', 'pass_count': 6, 'total': 10}
    ],
    'guards': [{'name': 'Token budget', 'status': 'pass'}]
}
html = generate_dashboard_html(sample)
print(f'Generated {len(html)} chars of HTML')
assert 'Chart.js' in html or 'chart.js' in html
assert 'test-skill' in html
assert '80.0%' in html
print('All checks passed')
"
```

Expected: "All checks passed"

- [ ] **Step 2: Commit test results if passing**

No commit needed — this is a verification step only.

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | Create `references/eval-guide.md` | Binary eval writing guide |
| 2 | Create `references/autoresearch.md` | Autonomous loop protocol |
| 3 | Create `scripts/generate_dashboard.py` | Live HTML dashboard generator |
| 4 | Modify `references/schemas.md` | Add autoresearch data schemas |
| 5 | Modify `references/learning-loops.md` | Add narrative accumulation pattern |
| 6 | Modify `SKILL.md` | Add Phase 4b autoresearch section |
| 7 | Verify cross-references | Ensure all links resolve |
| 8 | Integration test | Verify dashboard generation works |

**Dependency order:** Tasks 1-3 are independent (can run in parallel). Task 4-5 are independent. Task 6 depends on 1-3. Tasks 7-8 depend on all prior tasks.
