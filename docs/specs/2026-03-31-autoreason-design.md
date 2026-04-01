# AutoReason Skill Design

**Date:** 2026-03-31
**Status:** Draft
**Plugin:** claude-skills (public)
**Inspired by:** SHL0MS's AutoReason methodology

## Problem

LLMs have three systematic biases when doing iterative refinement on subjective content:

1. **Sycophancy** when asked to improve — they flatter what exists
2. **Hypercriticism** when asked to find flaws — they invent problems
3. **Over-compromise** when asked to merge perspectives — they hedge instead of choosing

The result: output quality is shaped more by prompting strategy than by what's actually better. Standard "critique and revise" loops amplify these biases because context accumulates across turns.

## Solution

AutoReason eliminates these biases through **context isolation** — every role in the refinement loop is a separate agent with zero shared history. No agent sees the outputs of previous iterations except what is explicitly passed to it. A blind judge with randomized labels picks the winner, and the loop repeats until convergence.

## Scope

- Content-agnostic adversarial refinement skill for subjective content (writing, analysis, arguments, copy)
- Accepts both generation prompts and existing content for refinement
- Adaptive iteration cap: default 3 rounds, `--deep` for 5, `--rounds N` for explicit override

## File Structure

```
plugins/autoreason/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── autoreason.md             # /autoreason entry point
├── skills/
│   └── autoreason/
│       └── SKILL.md              # Main orchestration
└── agents/
    ├── critic.md                 # Strawman attacker
    ├── author.md                 # Independent rewriter
    ├── synthesizer.md            # Version merger
    └── judge.md                  # Blind evaluator
```

## Invocation

```
/autoreason Write a compelling intro about datacenter cooling
/autoreason --deep Refine this: [pasted content or file path]
/autoreason --rounds 2 [task or content]
/autoreason --verbose [task or content]
```

**Input detection:**
- File path provided → read file, use as version A (refine mode)
- Content block provided (multi-paragraph text that reads as a draft, not an instruction) → use as version A (refine mode)
- Instruction/prompt (imperative sentence describing what to write) → generate version A first, then refine
- Ambiguous cases → ask the user: "Should I refine this as-is, or treat it as a prompt to generate from?"

**Flags:**
- `--deep` — max 5 iterations (default: 3)
- `--rounds N` — explicit iteration cap
- `--verbose` — show all intermediate versions, full judge reasoning, and label mappings

## The Loop

### Step 0: Generate or Accept Draft (once)

- If user provided a prompt → dispatch a fresh agent to generate version A
- If user provided existing content → that becomes version A
- Store: `version_A` (current incumbent)

### Step 1: Strawman Critique

- **Agent:** `agents/critic.md`
- **Receives:** Original task + version A
- **Context:** No prior history, no previous critiques
- **Output:** Numbered list of weaknesses, each with: what's wrong, why it matters, severity (critical/moderate/minor)
- **Instruction emphasis:** Attack only. No fixes, no suggestions, no hedging.

### Step 2: Independent Rewrite

- **Agent:** `agents/author.md`
- **Receives:** Original task + version A + critique from Step 1
- **Context:** No prior versions, no synthesis history
- **Output:** Version B — a complete rewrite, not an edit of A
- **Instruction emphasis:** Write from scratch to serve the original task. Use the critique to understand A's weaknesses, but don't patch A. Keep strong unchallenged elements of A if genuinely good.

### Step 3: Synthesis

- **Agent:** `agents/synthesizer.md`
- **Receives:** Original task + two versions (A and B with randomized labels, no indication which is original vs rewrite)
- **Context:** No history with either drafting process
- **Output:** Version AB — unified piece taking the strongest elements of both
- **Instruction emphasis:** Be decisive. When versions conflict, pick the better approach. No hedging, no compromise prose.

### Step 4: Blind Judge

- **Agent:** `agents/judge.md`
- **Receives:** Original task + three versions (A, B, AB) with randomized labels (X, Y, Z)
- **Context:** No knowledge of which is original, rewrite, or synthesis
- **Output:** Winner label + 2-3 sentence reasoning
- **Instruction emphasis:** Pick one winner. No ties. Evaluate on: clarity, persuasiveness, completeness, coherence, fitness for task.

### Loop Logic

- If winner ≠ current incumbent A → winner becomes new A, continue loop
- If winner = current incumbent A → convergence, exit loop
- If max rounds reached → exit with current best version

### Context Isolation

Enforced structurally by the Agent tool — each dispatch starts a fresh context. The orchestrator (SKILL.md) controls what each agent sees:

| Agent | Sees | Does NOT see |
|-------|------|-------------|
| Critic | Task + current version A | Previous critiques, previous versions, synthesis history |
| Author | Task + version A + current critique | Previous rewrites, synthesis history, judge reasoning |
| Synthesizer | Task + two versions (randomized labels) | Which is original vs rewrite, critique, judge history |
| Judge | Task + three versions (randomized labels) | Which is A/B/AB, critique, authorship, prior rounds |

## Agent Personas

### Critic (`agents/critic.md`)

**Role:** Adversarial strawman attacker.

Find every weakness in the provided content: logical gaps, weak arguments, unclear prose, missed angles, unconvincing claims, structural problems. Be ruthless and specific.

**Rules:**
- Do NOT suggest fixes or improvements
- Do NOT acknowledge strengths (that's not your job)
- Every weakness must explain *why* it matters, not just *what* is wrong
- Classify severity: critical (undermines the core argument), moderate (weakens a section), minor (polish-level)

**Output:** Numbered list of weaknesses with severity tags.

### Author (`agents/author.md`)

**Role:** Independent rewriter.

Write a complete new version that serves the original task. You are given the current version and a critique identifying its weaknesses. Use these as inputs, but write your own piece from scratch.

**Rules:**
- Do NOT edit or patch the existing version — write fresh
- Address the weaknesses identified in the critique
- You may retain elements from the current version that weren't challenged, if they're genuinely strong
- The output must be a complete, standalone piece — not a diff or commentary

**Output:** The full rewritten content.

### Synthesizer (`agents/synthesizer.md`)

**Role:** Best-of-both merger.

You are given two versions of content written for the same task. Create a single unified version that takes the strongest elements from both.

**Rules:**
- Be decisive — when the versions conflict, pick the better approach
- Do NOT hedge or split the difference ("on one hand... on the other")
- The result must read as a unified piece, not a patchwork of alternating sources
- Labels are randomized — do not assume either version is "original" or "better"

**Output:** The synthesized content.

### Judge (`agents/judge.md`)

**Role:** Blind evaluator.

You are given three versions of content written for the same task. Pick the single best one.

**Rules:**
- You MUST pick exactly one winner — no ties, no "all are good"
- Evaluate on: clarity, persuasiveness, completeness, coherence, fitness for the stated task
- Labels are randomized — do not infer anything from label order
- Keep reasoning to 2-3 sentences — explain what made the winner better, not what made the losers worse

**Output:** Winner label + brief reasoning.

## Output and Presentation

### During Execution (progress updates)

```
AutoReason: Round 1/3
  ├─ Critic: Found 6 weaknesses (2 critical, 3 moderate, 1 minor)
  ├─ Author: Rewrite complete
  ├─ Synthesizer: Merged
  └─ Judge: Version Z wins (synthesis) → new incumbent

AutoReason: Round 2/3
  ├─ Critic: Found 3 weaknesses (0 critical, 2 moderate, 1 minor)
  ├─ Author: Rewrite complete
  ├─ Synthesizer: Merged
  └─ Judge: Version X wins (incumbent) → converged

AutoReason: Converged after 2 rounds.
```

### Final Output

1. **The winning version** — clean content, ready to use
2. **Evolution summary** — one line per round (e.g., "Round 1: Strengthened opening, cut redundancy. Round 2: No improvement found.")
3. **Final critique** — what the last critic found but the judge deemed insufficient to warrant change

### Hidden by Default (shown with `--verbose`)

- Intermediate versions (A, B, AB from each round)
- Full judge reasoning from each round
- Randomized label mappings
- Complete critique text from each round

## Design Decisions

### Why single judge, not a panel?
Token cost. Each iteration already dispatches 4 agents. A 3-judge panel would make it 6. Randomized labels eliminate position bias, and context isolation handles the rest. Can upgrade to panel later if single-judge results are inconsistent.

### Why sequential, not parallel?
The rewriter (Step 2) depends on the critique (Step 1) — "a separate author who only sees the original task, version A, and the strawman critique." The dependency chain is real: critique → rewrite → synthesis → judge. No safe parallelism within an iteration.

### Why content-agnostic?
The methodology doesn't change based on content type. The critic attacks weaknesses whether it's a newsletter, a policy argument, or marketing copy. Content-specific guidance belongs in the user's prompt, not the skill.

### Why not save intermediate artifacts?
AutoReason is a refinement tool, not an audit trail. The final version is what matters. Intermediate versions are debugging info (available via `--verbose`), not deliverables.

## Testing Plan

1. **Smoke test:** Run on a simple prompt ("Write a paragraph arguing for nuclear energy") and verify all 4 agents dispatch, the loop runs, and a winner is produced
2. **Convergence test:** Run on already-polished content and verify the judge picks the incumbent within 1-2 rounds
3. **Improvement test:** Run on deliberately weak content (vague, repetitive, missing key arguments) and verify the output is measurably better
4. **Flag tests:** Verify `--deep`, `--rounds N`, and `--verbose` all work correctly
5. **Input detection:** Test with prompt-only, pasted content, and file path inputs
