---
name: autoresearch
description: Autonomous hill-climbing loop protocol for skill optimization. Defines the modify-score-keep/discard cycle, guard assertions, and stopping conditions.
---

# Autoresearch Protocol

Autonomous iterative optimization for Claude Code skills. Based on Karpathy's autoresearch methodology: make one change, measure, keep or discard, repeat.

> **See also:** `plugins/overnight-optimizer/` — a general-purpose version of this protocol that works on any target (prompts, configs, code, templates), not just skills. Uses `experiment.yaml` config files and git commits for versioning instead of working copies.

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
