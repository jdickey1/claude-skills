---
name: plan-review
description: Standard 4-section plan review (Architecture, Code Quality, Tests, Performance). Use before implementing any plan.
allowed-tools:
  - Read
  - Grep
  - Glob
  - AskUserQuestion
---

# Standard Plan Review

Review this plan thoroughly before making any code changes.

**Load references:** Read `references/standard-sections.md` from the plan-review skill.

**Process:**

1. Run **Step 0: Scope Challenge** (from SKILL.md)
2. Present the 3 scope modes (SCOPE REDUCTION / BIG CHANGE / SMALL CHANGE) via AskUserQuestion
3. After mode is selected, work through the 4 review sections sequentially
4. After all sections, produce required outputs (NOT in scope, What already exists, TODOS.md updates, Failure modes, Completion summary)

**Do NOT make any code changes. Do NOT start implementation.** Your only job is to review the plan with maximum rigor.

$ARGUMENTS
