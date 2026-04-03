# Skill Plan Guide

What to include when planning a skill via `/ce:plan` before drafting.

A skill plan is lighter than a feature plan — skills are mostly prose, not code. But planning prevents the two most common failure modes: (1) drafting a skill that misses integration points, and (2) forgetting infrastructure steps like marketplace registration.

---

## When to Plan

**Always plan when:**
- The skill wraps an external tool, API, or CLI (needs integration mapping)
- The skill will live in a marketplace plugin (needs plugin structure + marketplace.json)
- The skill has dependencies on VPS infrastructure, MCP servers, or other skills
- The skill requires reference files, scripts, or agents (multi-file delivery)

**Skip planning when:**
- Simple single-file skill with no external dependencies
- Improving an existing skill (description optimization, hardening, etc.)
- The user explicitly says "just draft it"

---

## Plan Contents

When invoking `/ce:plan` for a skill, include these sections in the feature description:

### Required

1. **Skill identity** — Name, type (Discipline/Technique/Pattern/Reference/Wrapper/Generator), design pattern (Tool Wrapper/Generator/Reviewer/Inversion/Pipeline)

2. **Triggering conditions** — What user phrases/contexts should activate this skill. Be specific: "make an infographic" not "content creation"

3. **Integration points** — What external systems does this skill touch?
   - CLI tools it invokes (paths, SSH commands)
   - MCP servers it needs
   - Other skills it calls or is called by
   - VPS infrastructure requirements
   - File system paths (Obsidian vault, output directories)

4. **Plugin structure** — Where does this skill live?
   - Which repo (claude-skills, claude-skills-private, project-specific)
   - Plugin name and directory structure
   - marketplace.json entry needed? (yes if in a marketplace repo)
   - Reference files, scripts, agents, assets needed

5. **Skill content outline** — Section-by-section plan for SKILL.md:
   - What sections are needed (Flow, Input Classification, Template/Schema, Output, etc.)
   - What goes in SKILL.md body vs. reference files (respect the 500-line limit)
   - What shared components or patterns to reuse from existing skills

6. **Delivery checklist** — Everything that must happen for the skill to be usable:
   - [ ] SKILL.md written
   - [ ] plugin.json created
   - [ ] marketplace.json updated (if marketplace repo)
   - [ ] Reference files created
   - [ ] Scripts/agents created (if any)
   - [ ] Learning instrumentation added
   - [ ] Committed and pushed
   - [ ] Plugin reloaded and verified triggering

### Optional (for complex skills)

7. **Data flow** — How data moves through the skill (input → transform → output). Especially important for Generator and Pipeline skills.

8. **Error handling** — What fails and how the skill should respond. VPS down? Missing dependencies? Invalid input?

9. **Testing strategy** — What evals to run, what assertions to check. Decide early whether the skill's output is objectively verifiable (use evals) or subjective (skip formal evals, use qualitative review).

---

## Example Plan Feature Description

```
Build a skill that generates branded LinkedIn infographic images from content.

Type: Generator / Pipeline hybrid
Pattern: Pipeline (analyze → select template → extract data → render → verify)

Integration points:
- Invokes infographic-generator CLI on VPS via `ssh nonrootadmin 'sudo -u infographic ...'`
- Reads rendered PNG back via scp for visual verification
- Outputs to /tmp/ by default or user-specified path

Plugin structure:
- Repo: claude-skills-private
- Plugin: infographic
- marketplace.json entry needed: yes
- Files: SKILL.md only (no reference files needed — CLI handles templates/themes)

Content outline for SKILL.md:
1. Input Classification (raw content vs explicit data vs batch)
2. Template Selection (auto-detect rules table)
3. Data Extraction (JSON schemas per template + extraction principles)
4. Brand Detection (context rules)
5. Render (SSH command pattern)
6. Batch Mode (section splitting, limits)
7. Quality Check (visual verification)

Delivery:
- [ ] SKILL.md
- [ ] plugin.json
- [ ] marketplace.json entry
- [ ] Commit + push
- [ ] Reload plugins and verify triggering
```

---

## What the Plan is NOT

- Not a substitute for Phase 1 (Capture Intent) — intent must be solid first
- Not a full `/ce:plan` with implementation units and test scenarios — skills are prose, not code
- Not required for simple skill improvements — only for new skills with integration complexity
