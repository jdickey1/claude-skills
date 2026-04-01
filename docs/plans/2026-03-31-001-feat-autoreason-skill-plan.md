---
title: "feat: Add AutoReason adversarial refinement skill"
type: feat
status: completed
date: 2026-03-31
origin: docs/specs/2026-03-31-autoreason-design.md
deepened: 2026-03-31
---

# feat: Add AutoReason adversarial refinement skill

## Overview

Add an AutoReason plugin to the claude-skills repo that iteratively refines subjective content (writing, analysis, arguments, copy) through an adversarial multi-agent loop. Each iteration cycles through four isolated agents — critic, author, synthesizer, blind judge — until the judge consistently picks the incumbent or the round cap is reached.

## Problem Frame

LLMs have systematic biases in iterative refinement: sycophancy when improving, hypercriticism when reviewing, over-compromise when merging. Standard "critique and revise" loops amplify these because context accumulates. AutoReason (SHL0MS) eliminates this through context isolation — every agent role gets fresh context with zero shared history. (see origin: docs/specs/2026-03-31-autoreason-design.md)

## Requirements Trace

- R1. Content-agnostic — works on any subjective content without modification
- R2. Context isolation — each agent sees only what is explicitly passed to it, no shared history
- R3. Adaptive iterations — default 3 rounds, `--deep` for 5, `--rounds N` for explicit override
- R4. Dual input mode — accepts both generation prompts and existing content for refinement
- R5. Blind judging — randomized labels prevent position bias in evaluation
- R6. Convergence detection — loop exits early when judge picks the current best
- R7. Verbose mode — `--verbose` flag shows all intermediate versions and reasoning

## Scope Boundaries

- No content-type-specific logic (no special handling for newsletters vs. arguments vs. copy)
- No persistent state between invocations (no learning loops, no experiment logs)
- No multi-judge panel (single judge with randomized labels is sufficient for v1)
- No parallel agent dispatch within an iteration (Steps 1-4 are sequential by design)

## Context & Research

### Relevant Code and Patterns

- `plugins/skill-creator/.claude-plugin/plugin.json` — plugin.json schema: `name`, `description`, `author` fields
- `plugins/skill-creator/skills/skill-creator/agents/` — agent file pattern: plain markdown, no YAML frontmatter, structured sections (Role, Inputs, Process, Output Format)
- `plugins/seo/skills/seo/SKILL.md` — SKILL.md frontmatter: `name`, `description`, `version`, `effort`
- `plugins/seo/commands/seo-audit.md` — command file pattern: `description`, `argument-hint` frontmatter, `$ARGUMENTS` and `${CLAUDE_PLUGIN_ROOT}` substitution
- `plugins/overnight-optimizer/skills/overnight-optimizer/SKILL.md` — iterative loop pattern: REPEAT until stop condition, with state tracking and stop conditions

### Context Isolation Table (from design spec)

This table is the source of truth for what each agent receives during dispatch. Any change requires updating both the design spec and the SKILL.md dispatch instructions.

| Agent | Receives | Does NOT receive |
|-------|----------|-----------------|
| Author (generate mode) | Task description only | Nothing else — fresh generation |
| Critic | Task + current best version | Previous critiques, previous versions, synthesis history |
| Author (rewrite mode) | Task + current best version + current critique | Previous rewrites, synthesis history, judge reasoning |
| Synthesizer | Task + two versions (randomized labels) | Which is original vs rewrite, critique, judge history |
| Judge | Task + three versions (randomized labels) | Which is A/B/AB, critique, authorship, prior rounds |

### Institutional Learnings

- Agent files in this repo use plain markdown headings (no YAML frontmatter), unlike the compound-engineering plugin agents which use YAML frontmatter
- `${CLAUDE_PLUGIN_ROOT}` resolves to the plugin root directory at runtime
- Commands reference skills via "**First**: Use the `{skill}` skill..." pattern

## Key Technical Decisions

- **Sequential pipeline, not parallel**: The rewriter depends on the critique output (author sees task + version A + critique). No safe parallelism within an iteration. Faithful to SHL0MS's original design.
- **Randomization in orchestrator, not agents**: SKILL.md assigns randomized labels before dispatching. Agents never know which version is "original" vs "rewrite" vs "synthesis."
- **Plain markdown agents, no YAML frontmatter**: Follows this repo's convention (skill-creator agents), not compound-engineering's convention.
- **Single command file**: `/autoreason` as the only entry point. No sub-commands needed.
- **No learning instrumentation in v1**: Keep it simple. Can add `.learnings.jsonl` later if usage patterns warrant it.
- **No dedicated generator agent**: Generation mode reuses the author agent with a "create from scratch" instruction (no critique input). A separate generator file would add a file for one-time use.
- **True randomization via Python script**: A `scripts/shuffle.py` generates randomized label assignments. The single-judge design (no panel) means label randomization is the *only* defense against position bias — relying on LLM-based shuffling would be an unforced error since LLMs produce non-uniform distributions when asked to randomize. The script is ~3 lines and invoked via Bash tool before each synthesizer/judge dispatch.
- **Single judge with confirmation-judge upgrade path (v1.1)**: v1 uses one judge. If position bias or judgment quality becomes a concern, v1.1 adds a confirmation judge: when the judge picks a challenger over the current best, dispatch one additional judge to confirm. Costs at most 1 extra dispatch per round (zero on convergence). Cheaper than a full 3-judge panel while protecting against cascading errors from one bad judgment.
- **Agent tool restrictions for isolation hardening**: Each agent persona file ends with explicit tool-use restrictions: "Do not use Bash, Read, Write, or any MCP tools. Work only with the content provided in this prompt." This structurally closes file-system and MCP leakage vectors that the Agent tool dispatch does not prevent on its own.

## Open Questions

### Resolved During Planning

- **Where do agent files live?** In `plugins/autoreason/agents/` at the plugin root level, following the design spec's file structure. Agents are shared across the skill, not nested inside the skill directory.
- **How to detect prompt vs. content input?** File path → read file → refine mode. Multi-paragraph text → refine mode. Imperative instruction → generate mode. Ambiguous → ask the user.

### Deferred to Implementation

- **Exact wording of agent persona prompts**: The design spec outlines the role and rules for each persona. Exact prompt engineering happens during implementation and may need tuning after testing.
- **Progress update formatting**: The design spec shows a tree-style progress format. Exact formatting depends on what renders well in the terminal.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
ORCHESTRATION FLOW (SKILL.md)

INPUT: task_description, [existing_content], flags (--deep, --rounds, --verbose)

max_rounds = parse_flags(flags)  // default 3, --deep → 5, --rounds N → N
current_best = existing_content OR dispatch(author, {task: task_description, mode: "generate"})
converged = false

FOR round = 1 to max_rounds AND NOT converged:

    critique = dispatch(critic, {task: task_description, version: current_best})

    version_b = dispatch(author, {task: task_description, version: current_best, critique: critique})

    // Randomize labels for synthesizer (two versions)
    synth_labels = random_shuffle(["Version P", "Version Q"])
    version_ab = dispatch(synthesizer, {task: task_description,
                          [synth_labels[0]]: current_best,
                          [synth_labels[1]]: version_b})

    // Randomize labels for judge (three versions)
    judge_labels = random_shuffle(["Version X", "Version Y", "Version Z"])
    label_map = zip(judge_labels, [current_best, version_b, version_ab])
    winner_label = dispatch(judge, {task: task_description, ...label_map})

    winner = reverse_lookup(winner_label, label_map)

    IF winner == current_best:
        converged = true
    ELSE:
        current_best = winner

OUTPUT: current_best, evolution_summary, final_critique
```

## Implementation Units

- [ ] **Unit 1: Plugin scaffold**

  **Goal:** Create the plugin directory structure and registration files.

  **Requirements:** None (infrastructure)

  **Dependencies:** None

  **Files:**
  - Create: `plugins/autoreason/.claude-plugin/plugin.json`
  - Create: `plugins/autoreason/commands/autoreason.md`
  - Create: `plugins/autoreason/skills/autoreason/SKILL.md` (stub)
  - Create: `plugins/autoreason/agents/critic.md` (stub)
  - Create: `plugins/autoreason/agents/author.md` (stub)
  - Create: `plugins/autoreason/agents/synthesizer.md` (stub)
  - Create: `plugins/autoreason/agents/judge.md` (stub)
  - Create: `plugins/autoreason/scripts/shuffle.py` (label randomization script)

  **Approach:**
  - Follow `plugins/seo/.claude-plugin/plugin.json` as the template for plugin.json
  - Follow `plugins/seo/commands/seo-audit.md` as the template for the command file
  - Create directory structure matching the design spec. Note: `commands/` directory is added per standard plugin convention (seo, digest patterns) — the design spec omitted it. The design spec's `references/iteration-log-template.md` is intentionally excluded per the "no persistent state" scope boundary.
  - Agent files live at `plugins/autoreason/agents/` (plugin root), not nested under the skill directory. This diverges from the only existing example (skill-creator nests agents at `skills/skill-creator/agents/`), but is intentional — AutoReason has one skill and the agents are shared at the plugin level. `${CLAUDE_PLUGIN_ROOT}` resolves to `plugins/autoreason/`, so dispatch paths like `${CLAUDE_PLUGIN_ROOT}/agents/critic.md` will resolve correctly.
  - Stubs contain just the file heading and a TODO marker — they get filled in subsequent units

  **Patterns to follow:**
  - `plugins/seo/.claude-plugin/plugin.json` for plugin.json schema
  - `plugins/seo/commands/seo-audit.md` for command file format

  **Test expectation:** none — pure scaffolding

  **Verification:**
  - All files exist at the expected paths
  - plugin.json is valid JSON with name, description, author fields
  - Command file has correct frontmatter (description, argument-hint)

- [ ] **Unit 2: Agent persona files**

  **Goal:** Write the four agent persona prompts (critic, author, synthesizer, judge).

  **Requirements:** R2 (context isolation), R5 (blind judging)

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `plugins/autoreason/agents/critic.md`
  - Modify: `plugins/autoreason/agents/author.md`
  - Modify: `plugins/autoreason/agents/synthesizer.md`
  - Modify: `plugins/autoreason/agents/judge.md`

  **Approach:**
  - Follow the design spec's persona definitions (Section: Agent Personas)
  - Use this repo's agent file convention: plain markdown with structured sections (Role, Receives, Instructions, Rules, Output Format)
  - Follow `plugins/skill-creator/skills/skill-creator/agents/analyzer.md` as the structural template
  - Each agent must be self-contained — no references to other agents or to the loop structure
  - Each agent file must end with a tool-use restriction footer: "Do not use Bash, Read, Write, or any MCP tools. Work only with the content provided in this prompt." This closes file-system and MCP leakage vectors structurally.
  - Critic: attack-only, no fixes. Severity-tagged weaknesses.
  - Author: serves dual purpose. In **generate mode** (no critique input): create content from scratch per the task description. In **rewrite mode** (with critique input): full rewrite, not a patch. Addresses critique while serving original task.
  - Synthesizer: decisive merger, no hedging. Randomized labels — no assumption about which is "better."
  - Judge: single winner, no ties. Evaluate on clarity, persuasiveness, completeness, coherence, task fitness. Randomized labels. **Output format: first line must be exactly the winner label (e.g., "Version X"), reasoning on subsequent lines.** This makes orchestrator parsing deterministic.

  **Patterns to follow:**
  - `plugins/skill-creator/skills/skill-creator/agents/analyzer.md` for agent file structure

  **Test scenarios:**
  - Happy path: Each agent file is parseable markdown with Role, Instructions, Rules, and Output Format sections
  - Edge case: Agent prompts contain no references to other agent roles (no "the critic said" or "after synthesis")
  - Edge case: Judge instructions explicitly require picking exactly one winner (no tie option)

  **Verification:**
  - Four agent files, each ~150-250 words of focused instruction
  - No agent references any other agent by name or role
  - Judge file explicitly states "pick exactly one winner"

- [ ] **Unit 3: Command entry point**

  **Goal:** Write the `/autoreason` command that parses arguments and invokes the skill.

  **Requirements:** R3 (adaptive iterations), R4 (dual input mode), R7 (verbose mode)

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `plugins/autoreason/commands/autoreason.md`

  **Approach:**
  - Command frontmatter: `description`, `argument-hint: "[--deep] [--rounds N] [--verbose] <task or content>"`
  - Parse flags from `$ARGUMENTS`: extract `--deep`, `--rounds N`, `--verbose`
  - Detect input mode: file path → read and refine; multi-paragraph content → refine; instruction → generate
  - Pass parsed arguments to the skill via "**First**: Use the `autoreason` skill..."
  - Handle ambiguous input detection by instructing the skill to ask the user

  **Patterns to follow:**
  - `plugins/seo/commands/seo-audit.md` for command structure
  - `plugins/digest/commands/digest.md` for argument parsing pattern

  **Test scenarios:**
  - Happy path: `/autoreason Write a newsletter intro` → recognized as generation prompt
  - Happy path: `/autoreason --deep [multi-line content]` → recognized as refine mode with 5 max rounds
  - Happy path: `/autoreason --rounds 2 --verbose [task]` → rounds=2, verbose=true
  - Edge case: `/autoreason` with no arguments → asks user for task or content
  - Edge case: `/autoreason --deep` with no content → asks user for task or content

  **Verification:**
  - Command file has correct frontmatter
  - All three flags (--deep, --rounds, --verbose) are documented and handled
  - Input mode detection logic is described clearly

- [ ] **Unit 4: SKILL.md orchestration logic**

  **Goal:** Write the main skill file that orchestrates the adversarial loop — input handling, agent dispatch sequence, label randomization, convergence detection, and output formatting.

  **Requirements:** R1-R7 (all)

  **Dependencies:** Units 2, 3

  **Files:**
  - Modify: `plugins/autoreason/skills/autoreason/SKILL.md`

  **Approach:**
  - SKILL.md frontmatter: `name: autoreason`, `description: "Use when..."`, `version: 1.0.0`, `effort: medium`
  - Structure follows the high-level technical design pseudocode
  - **Input handling section**: Detect mode (generate vs refine), read file if path provided
  - **Loop section**: For each round: dispatch critic → dispatch author → randomize labels → dispatch synthesizer → randomize labels → dispatch judge → check convergence
  - **Label randomization**: Explicitly instruct the orchestrating agent to shuffle version labels before each dispatch. Use neutral labels (Version P/Q for synthesizer, Version X/Y/Z for judge)
  - **Agent dispatch**: Use Agent tool with the agent file path. Pass only the context specified in the plan's Context Isolation Table. Explicitly state what NOT to include. Use a **rigid dispatch template** that the orchestrator fills in mechanically — do not allow freeform composition of dispatch prompts, as the orchestrator's growing context (it sees all prior agent outputs) could subtly influence framing.
  - **Label randomization**: Before each synthesizer and judge dispatch, invoke `scripts/shuffle.py` via Bash tool to get randomized label assignments. Use the script output to assign labels, not LLM-generated shuffling.
  - **Progress updates**: Print tree-style status after each step within a round
  - **Convergence**: If judge picks incumbent, exit loop. Otherwise, winner becomes new incumbent.
  - **Final output**: Present winning version, evolution summary (one line per round), and final critique
  - **Verbose mode**: When `--verbose`, also show intermediate versions, full judge reasoning, and label mappings
  - **Error handling**: If any agent dispatch fails within a round, output the current best version with a message indicating which agent failed and at which round, then exit. Do not attempt partial rounds or retries — context isolation means a partial round produces no usable output.

  **Patterns to follow:**
  - `plugins/overnight-optimizer/skills/overnight-optimizer/SKILL.md` for iterative loop structure and stop conditions
  - `plugins/seo/skills/seo/SKILL.md` for SKILL.md frontmatter and section organization

  **Test scenarios:**
  - Happy path: Generation mode — single prompt input produces version A via fresh agent, then enters loop
  - Happy path: Refine mode — existing content becomes version A directly, enters loop
  - Happy path: Convergence — judge picks current best, loop exits early with "converged" message
  - Happy path: Max rounds — loop runs to cap without convergence, outputs best version
  - Edge case: Round 1 convergence — judge picks current best (original version A) immediately, only 1 round runs
  - Edge case: `--verbose` flag — all intermediate versions and judge reasoning are shown
  - Error path: Agent dispatch failure — skill reports which agent failed and at which round
  - Integration: Context isolation — verify each agent dispatch instruction explicitly lists what context to pass and what to exclude

  **Verification:**
  - SKILL.md contains complete loop logic with all 4 agent dispatches per round
  - Label randomization is handled by the orchestrator, not delegated to agents
  - Context isolation table from design spec is reflected in dispatch instructions
  - Progress updates print after each step
  - Convergence detection works (judge picks current best → exit)
  - Final output includes: winning version, evolution summary, final critique

- [ ] **Unit 5: Smoke test with real content**

  **Goal:** Run the skill end-to-end on a real prompt and verify the full loop works.

  **Requirements:** All

  **Dependencies:** Unit 4

  **Files:**
  - No files created or modified — this is a manual verification step

  **Approach:**
  - Install the plugin locally (symlink or copy to `~/.claude/plugins/`)
  - Run `/autoreason Write a paragraph arguing for nuclear energy as a datacenter power source`
  - Verify: all 4 agents dispatch per round, progress updates display, convergence or max rounds reached, final output is clean
  - Run `/autoreason --deep` with a deliberately weak draft (vague, repetitive) and verify improvement
  - Run `/autoreason --verbose` and verify intermediate versions display
  - Check that no agent output references other agents or leaks loop state

  **Test scenarios:**
  - Happy path: Generation prompt → full loop → clean output
  - Happy path: Weak draft input → measurable improvement in output
  - Happy path: `--verbose` → intermediate versions visible
  - Edge case: Already-polished content → converges in 1-2 rounds

  **Verification:**
  - Skill completes without errors
  - Output reads as coherent, refined content
  - No context leakage between agents (no agent references another's output from a prior round)
  - Progress updates are readable

## System-Wide Impact

- **Interaction graph:** Self-contained plugin. No callbacks, middleware, or observers affected. The skill dispatches agents via the Agent tool — standard Claude Code mechanism.
- **Error propagation:** If an agent dispatch fails, the skill should report the failure and exit gracefully with whatever the current best version is.
- **State lifecycle risks:** None — no persistent state between invocations. All state lives in the orchestrator's context within a single session.
- **API surface parity:** `/autoreason` is the only entry point. No other interfaces affected.
- **Integration coverage:** The Agent tool dispatch mechanism is the only integration seam. Each dispatch is independent.
- **Unchanged invariants:** No existing plugins, skills, or commands are modified. This is a purely additive change.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| High token cost per invocation (~20 agent dispatches for 3-round run) | Default to 3 rounds, document expected cost. `--deep` is opt-in. |
| Agent prompt quality determines output quality | Start with clear, focused persona prompts from design spec. Iterate based on smoke test results. |
| Label randomization must be truly random | Use explicit shuffle instruction in SKILL.md, not agent-side randomization. |
| Context leakage if orchestrator accidentally passes too much | Design spec's isolation table is the source of truth. Each dispatch instruction explicitly lists what to include AND what to exclude. |

## Sources & References

- **Origin document:** [docs/specs/2026-03-31-autoreason-design.md](../specs/2026-03-31-autoreason-design.md)
- **SHL0MS AutoReason methodology:** Vault digest at `web-analyses/2026-03-31-shloms-autoreason.md`
- Existing plugin patterns: `plugins/seo/`, `plugins/skill-creator/`, `plugins/overnight-optimizer/`
