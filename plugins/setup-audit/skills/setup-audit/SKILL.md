---
name: setup-audit
description: Audit Claude Code setup for dead weight across CLAUDE.md, skills, and memories. USE WHEN user says "audit my setup", "check for dead weight", "trim my instructions", "setup audit", or monthly maintenance.
effort: medium
---

# Setup Audit

Audit the entire Claude Code setup for dead weight using 5 dimensions. Covers CLAUDE.md files, CORE skills, memory files, and hooks — not just CLAUDE.md.

## Scope

Read ALL of the following before analyzing:

### CLAUDE.md Files
- `~/.claude/CLAUDE.md` (global)
- `~/CLAUDE.md` (project root, if exists)
- Any project-specific CLAUDE.md files in the current working directory

### Skills
- All files in `~/.claude/skills/` (CORE skills, any loose skills)
- Note: Plugin skills (in `~/.claude/plugins/`) are managed by their repos and excluded from this audit

### Memory Files
- `~/.claude/projects/-Users-james/memory/MEMORY.md` (index)
- All `.md` files referenced in MEMORY.md

### Settings
- `~/.claude/settings.json` (hooks, permissions, env vars)

## The 5-Dimension Audit

For every rule, instruction, and preference found, evaluate:

### 1. Default Behavior Overlap
**Question:** Does Claude already do this without being told?

Check against these known defaults from Claude's system prompt:
- "Keep solutions simple and focused"
- "do not propose changes to code you haven't read"
- Extensive anti-over-engineering instructions (no unnecessary abstractions, YAGNI, minimal complexity)
- "Only add comments where the logic isn't self-evident"
- Security-aware by default (OWASP top 10, no command injection, XSS, SQL injection)
- Careful with destructive actions, confirms before risky operations
- Prefers editing existing files over creating new ones

**Flag if:** The rule just restates what Claude would do anyway.

### 2. Contradictions
**Question:** Does this rule conflict with another rule elsewhere in the setup?

Check for:
- Rules that give opposite instructions (e.g., "be concise" vs. "always explain reasoning")
- Tool/syntax references that don't match current tools (e.g., `Task()` when the tool is `Agent`)
- Naming conventions that conflict between files (e.g., TitleCase in one file, kebab-case in another)
- Format requirements that fight the system prompt's conciseness instruction

**Flag if:** Two rules cannot both be followed simultaneously.

### 3. Redundancy
**Question:** Is this covered by another rule in a different file?

Check across all scopes — a rule in CLAUDE.md might duplicate one in memory, or a skill might restate what a hook enforces.

**Flag if:** Removing this rule would change nothing because another rule covers it.

### 4. One-Off Fixes
**Question:** Was this added to fix one specific bad output rather than improve outputs overall?

Signs of a one-off fix:
- Very narrow scope (references a specific file, function, or scenario)
- Reads like a correction rather than a preference
- Only relevant in one project context but stored globally

**Flag if:** The rule exists to prevent a problem that happened once, not a recurring pattern.

### 5. Vagueness
**Question:** Would Claude interpret this differently every time?

Signs of vagueness:
- "Be more natural", "use a good tone", "be helpful"
- No concrete examples or measurable criteria
- "(Optional)" tags on instructions
- References to files that don't exist

**Flag if:** Two different sessions would follow this rule in meaningfully different ways.

## Also Check

### Stale References
- Files referenced that don't exist (e.g., `SecurityProtocols.md`)
- Tools/syntax that have been renamed (e.g., `Task` → `Agent`)
- Systems that have been decommissioned

### Empty Templates
- Files with only placeholder content (e.g., "[Add contacts here]")
- Auto-generated trackers for systems no longer in use

## Output Format

Present findings as a structured report:

```
## Setup Audit Results

**Files scanned:** [count]
**Rules/instructions found:** [count]
**Issues found:** [count] ([breakdown by dimension])

### 1. Default Behavior (things Claude already does)
| Rule | Location | Why it's dead weight |
|------|----------|---------------------|
| ... | ... | ... |

### 2. Contradictions
| Conflict | Files | Issue |
|----------|-------|-------|
| ... | ... | ... |

### 3. Duplicates
| Rule | Appears in | Keep which |
|------|-----------|-----------|
| ... | ... | ... |

### 4. One-Off Fixes
| Rule | Location | Issue |
|------|----------|-------|
| ... | ... | ... |

### 5. Stale / Dead / Vague
| Item | Location | Issue |
|------|----------|-------|
| ... | ... | ... |

### Recommended Cuts
[Numbered list with reasoning]

### Recommended Merges
[Items that should be combined]
```

## Rules

- **Read everything before analyzing.** Don't flag something as missing if it's defined in a different file.
- **Don't make changes without approval.** Present the report, wait for the user to say which cuts to make.
- **Be specific.** "This is redundant" is not useful. "This duplicates the rule in ~/.claude/CLAUDE.md line 32" is.
- **Err on the side of keeping.** If unsure whether a rule adds value, don't flag it. Only flag rules you're confident are dead weight.
- **Plugin skills are out of scope.** Plugins are versioned and managed by their repos. Only audit user-authored content.
