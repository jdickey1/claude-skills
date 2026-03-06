# Standard Review Sections

## Scope Modes (Standard)

After Step 0, present these three options:

1. **SCOPE REDUCTION:** The plan is overbuilt. Propose a minimal version that achieves the core goal, then review that.
2. **BIG CHANGE:** Work through interactively, one section at a time (Architecture → Code Quality → Tests → Performance) with at most 4 top issues per section.
3. **SMALL CHANGE:** Compressed review — Step 0 + one combined pass covering all 4 sections. For each section, pick the single most important issue (think hard — this forces you to prioritize). Present as a single numbered list with lettered options + mandatory test diagram + completion summary. One AskUserQuestion round at the end.

---

## Section 1: Architecture Review

Evaluate:

- Overall system design and component boundaries
- Dependency graph and coupling concerns
- Data flow patterns and potential bottlenecks
- Scaling characteristics and single points of failure
- Security architecture (auth, data access, API boundaries)
- Whether key flows deserve ASCII diagrams in the plan or in code comments
- For each new codepath or integration point, describe one realistic production failure scenario and whether the plan accounts for it

**STOP.** You MUST call AskUserQuestion NOW with your findings. Do NOT proceed to the next section until the user responds.

---

## Section 2: Code Quality Review

Evaluate:

- Code organization and module structure
- DRY violations — be aggressive here
- Error handling patterns and missing edge cases (call these out explicitly)
- Technical debt hotspots
- Areas that are over-engineered or under-engineered relative to engineering preferences
- Existing ASCII diagrams in touched files — are they still accurate after this change?

**STOP.** You MUST call AskUserQuestion NOW with your findings. Do NOT proceed to the next section until the user responds.

---

## Section 3: Test Review

Make a diagram of all new UX, new data flow, new codepaths, and new branching conditions or outcomes. For each, note what is new about the features discussed in this plan. Then, for each new item in the diagram, make sure there is a test.

For LLM/prompt changes: check for eval suites in the project. If this plan touches prompt patterns, state which eval suites must be run, which cases should be added, and what baselines to compare against. Confirm eval scope with the user.

**STOP.** You MUST call AskUserQuestion NOW with your findings. Do NOT proceed to the next section until the user responds.

---

## Section 4: Performance Review

Evaluate:

- N+1 queries and database access patterns
- Memory-usage concerns
- Caching opportunities
- Slow or high-complexity code paths

**STOP.** You MUST call AskUserQuestion NOW with your findings. Do NOT proceed to the next section until the user responds.

---

## Completion Summary (Standard)

At the end of the review, display:

```
- Step 0: Scope Challenge (user chose: ___)
- Architecture Review: ___ issues found
- Code Quality Review: ___ issues found
- Test Review: diagram produced, ___ gaps identified
- Performance Review: ___ issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: ___ items proposed to user
- Failure modes: ___ critical gaps flagged
```
