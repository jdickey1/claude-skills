---
name: plan-review
description: |
  Review a plan thoroughly before implementation. Two depths: standard (4-section)
  and mega (10-section exhaustive). Challenges scope, reviews architecture/code
  quality/tests/performance, walks through issues interactively with opinionated
  recommendations. Use when reviewing implementation plans, design docs, or
  feature specs before writing code.
version: 1.0.0
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
---

# Plan Review

Review plans thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give an opinionated recommendation, and ask for user input before assuming a direction.

Pairs well with plan-writing workflows (e.g., superpowers `writing-plans`) but works on any plan document.

**Two depths available:**
- **Standard** (`/plan-review`): 4-section review — Architecture, Code Quality, Tests, Performance. Load `references/standard-sections.md`.
- **Mega** (`/plan-mega-review`): 10-section exhaustive review with system audit. Load `references/mega-sections.md`, `references/mega-system-audit.md`, and `references/templates.md`.

## Priority Hierarchy (Under Context Pressure)

Step 0 > Test diagram > Error/rescue map > Opinionated recommendations > Everything else.

Never skip Step 0, the test diagram, or failure modes.

## Engineering Preferences (Guide All Recommendations)

- DRY is important — flag repetition aggressively
- Well-tested code is non-negotiable; too many tests > too few
- "Engineered enough" — not under-engineered (fragile) and not over-engineered (premature abstraction)
- Handle more edge cases, not fewer; thoughtfulness > speed
- Explicit over clever
- Minimal diff: fewest new abstractions and files touched
- Observability is not optional — new codepaths need logs, metrics, or traces
- Security is not optional — new codepaths need threat modeling
- Deployments are not atomic — plan for partial states, rollbacks, and feature flags

## Documentation and Diagrams

- Use ASCII art diagrams liberally: data flow, state machines, dependency graphs, processing pipelines, decision trees
- For complex designs, embed ASCII diagrams directly in code comments: Models (data relationships, state transitions), Controllers (request flow), Services (processing pipelines), Tests (non-obvious setup)
- **Diagram maintenance is part of the change.** When modifying code near ASCII diagrams, review accuracy. Update as part of the same commit. Stale diagrams are worse than none — flag any you encounter.

## Step 0: Scope Challenge (Both Modes)

Before reviewing anything, answer:

1. **What existing code already partially or fully solves each sub-problem?** Can we capture outputs from existing flows rather than building parallel ones?
2. **What is the minimum set of changes that achieves the stated goal?** Flag any work that could be deferred. Be ruthless about scope creep.
3. **Complexity check:** If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether fewer moving parts can achieve the same goal.

Then present scope mode options via AskUserQuestion. The available modes depend on which command was invoked — see the loaded reference file for mode options.

**Critical: Once a mode is selected, commit to it fully.** Raise scope concerns once in Step 0 — after that, optimize within the chosen scope. Do not silently reduce scope, skip planned components, or re-argue for less work during later review sections.

## For Each Issue Found

For every specific issue (bug, smell, design concern, risk):

1. Describe the problem concretely, with file and line references
2. Present 2-3 options, including "do nothing" where reasonable
3. For each option, specify in one line: effort, risk, and maintenance burden
4. **Lead with your recommendation.** State it as a directive: "Do B. Here's why:" — not "Option B might be worth considering." Be opinionated.
5. **Map reasoning to engineering preferences above.** One sentence connecting your recommendation to a specific preference.
6. **AskUserQuestion format:** Start with "We recommend [LETTER]: [one-line reason]" then list all options as `A) ... B) ... C) ...`. Label with issue NUMBER + option LETTER (e.g., "3A", "3B"). Never ask yes/no or open-ended.

## Formatting Rules

- NUMBER issues (1, 2, 3...) and give LETTERS for options (A, B, C...)
- Recommended option is always listed first
- Keep each option to one sentence max — pickable in under 5 seconds
- After each review section, pause and ask for feedback before moving on

## Required Outputs (Both Modes)

### "NOT in scope" section
List work considered and explicitly deferred, with one-line rationale each.

### "What already exists" section
List existing code/flows that partially solve sub-problems and whether the plan reuses them or unnecessarily rebuilds them.

### TODOS.md updates
Deferred work that is genuinely valuable MUST be written as TODOS.md entries:
- **What:** One-line description
- **Why:** Concrete problem it solves or value it unlocks
- **Context:** Enough detail for someone in 3 months to understand motivation, current state, and where to start
- **Depends on / blocked by:** Prerequisites or ordering constraints

Do NOT append vague bullet points. Ask which deferred items to capture before writing them.

### Failure Modes Registry
For each new codepath in the test review diagram:

```
CODEPATH | FAILURE MODE   | HANDLED? | TEST? | USER SEES?     | LOGGED?
---------|----------------|----------|-------|----------------|--------
[path]   | [how it fails] | Y/N      | Y/N   | Error / Silent | Y/N
```

If any row has: HANDLED = N, TEST = N, USER SEES = Silent → flag as **CRITICAL GAP**.

### Diagrams
Mandatory for any non-trivial data flow, state machine, or processing pipeline. Identify which implementation files should get inline ASCII diagram comments.

### Stale Diagram Audit
List every ASCII diagram in files the plan touches. For each: still accurate? If not, what needs updating?

### Unresolved Decisions
If any AskUserQuestion goes unanswered, note it. Never silently default. Display: "Unresolved decisions that may bite you later:" with each item and what was assumed by default.

## Retrospective Learning

Check the git log for the branch. If prior commits suggest a previous review cycle (review-driven refactors, reverted changes), note what was changed and whether the current plan touches the same areas. Be more aggressive reviewing areas that were previously problematic.

## Binary Quality Checks

**EVAL 1: Step 0 scope challenge completed**
Question: Was the scope explicitly challenged before reviewing implementation details?
Pass: Review includes scope assessment with at least one item deferred or confirmed
Fail: Review jumps straight to implementation without questioning scope

**EVAL 2: All issues have options**
Question: Does every raised issue include at least 2 numbered options with a recommendation?
Pass: All issues follow the NUMBER + LETTER format with concrete alternatives
Fail: Any issue is raised without options or recommendation

**EVAL 3: Failure modes documented**
Question: Is a failure modes registry included with HANDLED/TEST/USER SEES columns?
Pass: Registry covers all identified code paths
Fail: Missing registry or incomplete coverage

**EVAL 4: No silent failures approved**
Question: Are there zero cases where HANDLED=N, TEST=N, USER SEES=Silent?
Pass: All silent failure modes are flagged for remediation
Fail: Any silent unhandled failure mode is accepted

## Learning

When this skill runs, append to `.learnings.jsonl`:

```json
{"timestamp": "ISO-8601", "skill": "plan-review", "event_type": "edge_case", "context": "Plan had 12 files — scope challenge caught 4 that were unnecessary"}
```

Track: How often do scope challenges reduce file count? Which issue types recur across reviews?
