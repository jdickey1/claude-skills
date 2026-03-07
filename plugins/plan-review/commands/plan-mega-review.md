---
name: plan-mega-review
description: Exhaustive 10-section plan review with system audit, error mapping, security analysis, observability, and deployment review. The most thorough review possible.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
---

# Mega Plan Review

The most thorough plan review possible. If the standard review is a 5, HOLD SCOPE is an 8, and EXPANSION is a 15. Boil the ocean. See around corners. Leave nothing unquestioned.

**Load references:** Read `references/mega-system-audit.md`, `references/mega-sections.md`, and `references/templates.md` from the plan-review skill.

**Process:**

1. Run the **Pre-Review System Audit** (from mega-system-audit.md)
2. Report audit findings before proceeding
3. Run **Step 0: Scope Challenge** (from SKILL.md) with mega-specific additions (Dream State Mapping, Temporal Interrogation, mode-specific analysis)
4. Present the 3 scope modes (SCOPE EXPANSION / HOLD SCOPE / SCOPE REDUCTION) via AskUserQuestion
5. After mode is selected, work through all 10 review sections sequentially
6. After all sections, produce all required outputs including mega-specific outputs (Dream state delta, Error/exception registry, Delight opportunities if EXPANSION)
7. Display the mega completion summary

**Do NOT make any code changes. Do NOT start implementation.** Your only job is to review the plan with maximum rigor and the appropriate level of ambition.

$ARGUMENTS
