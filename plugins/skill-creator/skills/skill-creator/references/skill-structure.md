# Skill Structure Reference

How skills are organized on disk, how they load, and how to write SKILL.md.

---

## Anatomy of a Skill

Every skill lives in a named directory under `skills/`. Only `SKILL.md` is required; everything else is optional.

```
skill-name/
├── SKILL.md          (required) YAML frontmatter + markdown instructions
├── agents/           (optional) Sub-agent definitions
├── scripts/          (optional) Executable code for deterministic/repetitive tasks
├── references/       (optional) Docs loaded into context on-demand
└── assets/           (optional) Files used in output (templates, icons, fonts)
```

**What goes where:**

| Location | Put here |
|---|---|
| `SKILL.md` body | Core instructions, patterns under ~50 lines, quick reference tables |
| `scripts/` | Runnable helpers — executed by Claude, not necessarily read as text |
| `references/` | Heavy reference material (API docs, syntax guides, large examples) |
| `assets/` | Output templates, icons, fonts |

---

## Progressive Disclosure

Skills use a three-level loading system that conserves context window space.

### Level 1 — Metadata only (~100 words)
- Source: YAML frontmatter `name` + `description`
- Loaded: Always, at startup, for every skill
- Shown in: Skill list; Claude uses this to decide whether to load the skill

### Level 2 — SKILL.md body (<500 lines ideal)
- Source: The markdown body of `SKILL.md` (everything after frontmatter)
- Loaded: When Claude determines the skill is relevant to the current task
- Target: Keep under 500 lines. If you're approaching this, add a references/ layer with clear pointers.

### Level 3 — Bundled resources (no hard limit)
- Source: `references/`, `agents/`, `scripts/`
- Loaded: On-demand via Read tool, triggered by explicit pointers in SKILL.md
- Scripts can execute without being loaded as text into context

**Key rule:** Reference files must be explicitly named in SKILL.md with guidance on when to read them. Don't make Claude guess.

For large reference files (>300 lines), include a table of contents at the top.

---

## SKILL.md Template

### Frontmatter Rules

```yaml
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---
```

- `name`: Letters, numbers, and hyphens only. Max 64 characters. Prefer gerund form ("Processing PDFs", "Analyzing Spreadsheets").
- `description`: Third person. Max 1024 characters. Describes **when to use**, not what the skill does. Start with "Use when..." to focus on triggering conditions. Keep under 500 characters if possible.

**Critical:** The description is for discovery, not documentation. Never summarize the skill's workflow in the description — Claude may follow the description summary instead of reading the full SKILL.md body. See `cso-guide.md` for the full explanation.

### Body Sections

```markdown
# Skill Name

## Overview
What is this? Core principle in 1-2 sentences.

## When to Use
[Small inline flowchart IF decision is non-obvious]
Bullet list with symptoms and use cases.
When NOT to use.

## Core Pattern
Before/after comparison (for technique/pattern skills).

## Quick Reference
Table or bullets for scanning common operations.

## Implementation
Inline code for simple patterns.
Link to file for heavy reference or reusable tools.

## Common Mistakes
What goes wrong + fixes.
```

Not every section is required. Use only what the skill needs.

---

## Writing Patterns

**Use imperative form** in instructions. Tell Claude what to do directly.

**Defining output formats** — lock the structure with an explicit template:

```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive Summary
## Key Findings
## Recommendations
```

**Examples pattern** — show input → output pairs clearly:

```markdown
## Commit message format
**Example:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

**Degrees of freedom** — match specificity to task fragility:

- **High freedom** (text instructions): Use when multiple approaches are valid, decisions depend on context
- **Medium freedom** (pseudocode with parameters): Use when a preferred pattern exists but variation is acceptable
- **Low freedom** (exact script, no parameters): Use when operations are fragile and consistency is critical

**Conciseness** — Claude is already very smart. Only add context Claude doesn't already have. Every token in SKILL.md competes with conversation history once loaded. Challenge each paragraph: "Does Claude really need this?"

---

## File Organization Patterns

### Pattern 1: Self-Contained

```
defense-in-depth/
  SKILL.md    # Everything inline
```

Use when: All content fits comfortably, no heavy reference needed, patterns are under ~50 lines.

### Pattern 2: With Reusable Tool

```
condition-based-waiting/
  SKILL.md        # Overview + patterns
  scripts/
    helpers.ts    # Working code to adapt or execute
```

Use when: There's runnable code that Claude should execute rather than reinvent.

### Pattern 3: With Heavy Reference

```
pptx/
  SKILL.md          # Overview + workflows, pointers to reference files
  references/
    pptxgenjs.md    # 600-line API reference
    ooxml.md        # 500-line XML structure guide
  scripts/          # Executable tools
```

Use when: Reference material is too large to inline (100+ lines of API docs, comprehensive syntax).

**SKILL.md must explicitly name each reference file** and tell Claude when to read it:

```markdown
## References
- Read `references/pptxgenjs.md` when you need shape/layout API details
- Read `references/ooxml.md` when manipulating raw XML structure
```

---

## Domain Organization

When a skill supports multiple domains, organize by variant. Claude reads only the relevant file.

```
cloud-deploy/
├── SKILL.md          # Workflow + provider selection logic
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

SKILL.md contains the branching logic: "If deploying to AWS, read `references/aws.md`."

---

## Principle of Lack of Surprise

Skills must not contain malware, exploit code, or content that could compromise system security. A skill's behavior should not surprise the user given its description.

Do not create:
- Skills designed to facilitate unauthorized access
- Skills that perform data exfiltration
- Skills with misleading names or descriptions that hide their actual behavior

Roleplay and persona skills ("act as an interviewer") are fine — the intent is transparent.

---

## What Belongs Elsewhere

This file covers structure and organization only.

| Topic | See |
|---|---|
| Description optimization and CSO | `cso-guide.md` |
| Testing, eval harness, hardening | `bulletproofing.md` |
| Learning loops and promotion | `learning-loops.md` |
| Frontmatter/manifest schemas | `schemas.md` |
