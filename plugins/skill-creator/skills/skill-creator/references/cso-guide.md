# Claude Search Optimization (CSO) Guide

CSO = Claude Search Optimization. Analogous to SEO, but for how Claude's skill-matching system
finds and triggers skills based on their `description` field.

> Source: superpowers writing-skills v5.0.2, §"Claude Search Optimization"

---

## 1. Rich Description Field

**Purpose:** Claude reads `description` to decide which skills to load for a given task.
Make it answer: "Should I read this skill right now?"

**Format:** Start with `"Use when..."` — triggering conditions only, no workflow summary.

**Hard limit:** 1024 characters.

**CRITICAL rule:** Description = **When to Use**, NOT **What the Skill Does**.

The description must ONLY describe triggering conditions. Do NOT summarize the skill's
process or workflow.

---

## 2. The Shortcut Trap

When a description summarizes the skill's workflow, Claude may follow the description
**instead of reading the full skill content.** The skill body becomes documentation Claude skips.

**Real example:** A description saying "code review between tasks" caused Claude to do ONE
review, even though the skill's flowchart clearly showed TWO reviews (spec compliance then
code quality). When changed to "Use when executing implementation plans with independent
tasks" (no workflow summary), Claude correctly read the flowchart and followed both stages.

```yaml
# BAD: Summarizes workflow — Claude may follow this instead of reading skill
description: Use when executing plans - dispatches subagent per task with code review between tasks

# BAD: Too much process detail
description: Use for TDD - write test first, watch it fail, write minimal code, refactor

# GOOD: Just triggering conditions, no workflow summary
description: Use when executing implementation plans with independent tasks in the current session

# GOOD: Triggering conditions only
description: Use when implementing any feature or bugfix, before writing implementation code
```

**Additional bad patterns:**

```yaml
# BAD: Too abstract, vague, no "when to use"
description: For async testing

# BAD: First person (injected into system prompt — must be third person)
description: I can help you with async tests when they're flaky

# BAD: Mentions technology but skill is not technology-specific
description: Use when tests use setTimeout/sleep and are flaky

# GOOD: Starts with "Use when", describes problem, no workflow
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently

# GOOD: Technology-specific skill with explicit trigger
description: Use when using React Router and handling authentication redirects
```

---

## 3. Keyword Coverage

Include words Claude would search for when a user hits a problem:

- **Error messages:** `"Hook timed out"`, `"ENOTEMPTY"`, `"race condition"`
- **Symptoms:** `"flaky"`, `"hanging"`, `"zombie"`, `"pollution"`
- **Synonyms:** `"timeout/hang/freeze"`, `"cleanup/teardown/afterEach"`
- **Tools:** Actual command names, library names, file types

Keep triggers technology-agnostic unless the skill itself is technology-specific. Describe
the *problem* (race conditions, inconsistent behavior) not language-specific symptoms
(setTimeout, sleep).

---

## 4. Descriptive Naming

Use **verb-first, active voice** for skill names:

| Bad | Good |
|-----|------|
| `skill-creation` | `creating-skills` |
| `async-test-helpers` | `condition-based-waiting` |
| `skill-usage` | `using-skills` |
| `data-structure-refactoring` | `flatten-with-flags` |
| `debugging-techniques` | `root-cause-tracing` |

**Gerunds (-ing) work well for processes:** `creating-skills`, `testing-skills`,
`debugging-with-logs` — active, describes the action being taken.

**Name by what you DO or the core insight**, not the category.

---

## 5. Token Efficiency

**Why it matters:** `getting-started` and frequently-referenced skills load into EVERY
conversation. Every token counts.

**Target word counts:**
- getting-started workflows: < 150 words each
- Frequently-loaded skills: < 200 words total
- Other skills: < 500 words (still be concise)

**Verification:**
```bash
wc -w skills/path/SKILL.md
```

### Move-to-Help Technique

Move reference content (flag lists, option tables) out of SKILL.md and into tool `--help`
or separate reference files. Cross-link from SKILL.md.

```bash
# BAD: Document all flags inline
search-conversations supports --text, --both, --after DATE, --before DATE, --limit N

# GOOD: Reference --help
search-conversations supports multiple modes and filters. Run --help for details.
```

### Cross-References Instead of Repetition

```markdown
# BAD: Repeat workflow details (20 lines of repeated instructions)
When searching, dispatch subagent with template...

# GOOD: Reference other skill
Always use subagents (50-100x context savings). REQUIRED: Use [other-skill-name] for workflow.
```

### Compress Examples

```markdown
# BAD: Verbose example (42 words)
your human partner: "How did we handle authentication errors in React Router before?"
You: I'll search past conversations for React Router authentication patterns.
[Dispatch subagent with search query: "React Router authentication error handling 401"]

# GOOD: Minimal example (20 words)
Partner: "How did we handle auth errors in React Router?"
You: Searching...
[Dispatch subagent → synthesis]
```

**Eliminate redundancy:**
- Don't repeat what's in cross-referenced skills
- Don't explain what's obvious from a command name
- Don't include multiple examples of the same pattern

---

## 6. Cross-Referencing Skills

When writing documentation that references other skills, use **skill name only** with
explicit requirement markers. Never use file paths or `@` links.

```markdown
# GOOD — explicit requirement marker
**REQUIRED SUB-SKILL:** Use superpowers:test-driven-development

# GOOD — background requirement
**REQUIRED BACKGROUND:** You MUST understand superpowers:systematic-debugging

# GOOD — recommended (not required)
**RECOMMENDED:** See skill-creator:cso-guide for description optimization

# BAD — file path (unclear if required)
See skills/testing/test-driven-development

# BAD — @ link (force-loads the skill, burns context budget)
@skills/testing/test-driven-development/SKILL.md
```

**Why no @ links:** Force-loading a skill consumes context even when it may not be needed.
Let Claude decide when to load based on the skill's description.

---

*See also: skill-creator:schemas (SKILL.md field constraints), skill-creator:skill-structure (file layout)*
