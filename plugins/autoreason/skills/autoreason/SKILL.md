---
name: autoreason
description: Refine subjective content through adversarial multi-agent debate. Use when writing quality matters — newsletters, arguments, analysis, copy. Iterates critic → author → synthesizer → blind judge until convergence. Use when asked to "autoreason", "refine through debate", "adversarial refinement", or when content needs to be substantially stronger than a single draft.
version: 1.0.0
effort: high
---

# AutoReason — Adversarial Refinement Through Debate

Refine subjective content by cycling it through isolated agents who critique, rewrite, synthesize, and blindly judge — until no further improvement is found.

## How It Works

Each round dispatches four agents in sequence. Every agent gets fresh context with zero shared history — this eliminates LLM sycophancy, hypercriticism, and over-compromise.

1. **Critic** attacks the current best version (no fixes, just weaknesses)
2. **Author** rewrites from scratch using the task + current version + critique
3. **Synthesizer** merges the current best and the rewrite (randomized labels)
4. **Judge** blindly picks the best of all three versions (randomized labels)

The winner becomes the new current best. Loop repeats until the judge picks the current best (convergence) or the round cap is reached.

## Configuration

| Flag | Default | Effect |
|------|---------|--------|
| *(none)* | 3 rounds | Standard refinement |
| `--deep` | 5 rounds | More iterations for high-stakes content |
| `--rounds N` | N rounds | Explicit cap (overrides --deep) |
| `--verbose` | off | Show all intermediate versions, judge reasoning, label mappings |

## Context Isolation Table

This is the source of truth for what each agent sees. **Do not deviate from this table.**

| Agent | Receives | Does NOT Receive |
|-------|----------|-----------------|
| Author (generate) | Task description only | Nothing else |
| Critic | Task + current best | Previous critiques, previous versions, synthesis history |
| Author (rewrite) | Task + current best + current critique | Previous rewrites, synthesis history, judge reasoning |
| Synthesizer | Task + two versions (randomized labels) | Which is original vs rewrite, critique, judge history |
| Judge | Task + three versions (randomized labels) | Which is A/B/AB, critique, authorship, prior rounds |

## Execution

### Step 0: Establish the Current Best

Determine input mode from the parsed arguments:

- **Generate mode** (user provided an instruction/prompt): Dispatch the author agent in generate mode to create version A.
- **Refine mode** (user provided existing content or file path): Use the provided content as version A directly.

Store the original task description separately — it is passed to every agent in every round.

### Step 1-4: The Adversarial Loop

For each round (1 to max_rounds):

#### Step 1: Critic

Dispatch the critic agent using this rigid template. **Copy this template exactly — do not rephrase, add context, or editorialize.**

```
Read the agent instructions from: ${CLAUDE_PLUGIN_ROOT}/agents/critic.md

Then execute with these inputs:

**task**: [PASTE THE ORIGINAL TASK DESCRIPTION HERE]

**current_version**: [PASTE THE CURRENT BEST VERSION HERE]
```

After the critic returns, extract the critique output. Report progress:
```
AutoReason: Round N/M
  ├─ Critic: Found X weaknesses (Y critical, Z moderate, W minor)
```

#### Step 2: Author (Rewrite)

Dispatch the author agent using this rigid template:

```
Read the agent instructions from: ${CLAUDE_PLUGIN_ROOT}/agents/author.md

Then execute with these inputs:

**task**: [PASTE THE ORIGINAL TASK DESCRIPTION HERE]

**current_version**: [PASTE THE CURRENT BEST VERSION HERE]

**critique**: [PASTE THE CRITIC'S OUTPUT HERE]
```

After the author returns, store the output as `version_b`. Report progress:
```
  ├─ Author: Rewrite complete
```

#### Step 3: Synthesizer

**Before dispatching**, randomize labels by running:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/shuffle.py "Version P" "Version Q"
```

The output is a JSON array like `["Version Q", "Version P"]`. Assign:
- First label → current best
- Second label → version_b

Dispatch the synthesizer agent using this rigid template:

```
Read the agent instructions from: ${CLAUDE_PLUGIN_ROOT}/agents/synthesizer.md

Then execute with these inputs:

**task**: [PASTE THE ORIGINAL TASK DESCRIPTION HERE]

**[FIRST LABEL FROM SHUFFLE]**: [PASTE THE CONTENT ASSIGNED TO THIS LABEL]

**[SECOND LABEL FROM SHUFFLE]**: [PASTE THE CONTENT ASSIGNED TO THIS LABEL]
```

Store the output as `version_ab`. Report progress:
```
  ├─ Synthesizer: Merged
```

#### Step 4: Judge

**Before dispatching**, randomize labels by running:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/shuffle.py "Version X" "Version Y" "Version Z"
```

The output is a JSON array like `["Version Z", "Version X", "Version Y"]`. Assign:
- First label → current best
- Second label → version_b
- Third label → version_ab

Record this mapping — you need it to identify the winner.

Dispatch the judge agent using this rigid template:

```
Read the agent instructions from: ${CLAUDE_PLUGIN_ROOT}/agents/judge.md

Then execute with these inputs:

**task**: [PASTE THE ORIGINAL TASK DESCRIPTION HERE]

**[FIRST LABEL]**: [PASTE THE CONTENT ASSIGNED TO THIS LABEL]

**[SECOND LABEL]**: [PASTE THE CONTENT ASSIGNED TO THIS LABEL]

**[THIRD LABEL]**: [PASTE THE CONTENT ASSIGNED TO THIS LABEL]
```

**Parse the judge's output**: The first line is exactly the winner label (e.g., "Version X"). Use the label mapping to identify which version won.

Report progress:
```
  └─ Judge: [WINNER LABEL] wins ([source: current best | rewrite | synthesis]) → [converged | new current best]
```

#### Convergence Check

- If the winner is the current best → **converged**. Exit the loop.
- If the winner is version_b or version_ab → update current best to the winner. Continue to next round.
- If max rounds reached → exit with current best.

### Error Handling

If any agent dispatch fails within a round:

1. Report which agent failed and at which round
2. Output the current best version (whatever you have so far)
3. Exit — do not attempt partial rounds or retries

## Output

### Default Output

After the loop completes, present:

**1. The winning version** — clean content, ready to use. No labels, no meta-commentary.

**2. Evolution summary** — one line per round:
```
Round 1: [what changed — e.g., "Strengthened opening argument, cut redundant examples"]
Round 2: [what changed — e.g., "No improvement found — converged"]
```

**3. Final critique** — the critique from the last round, so the user can see what the critic found but the judge deemed insufficient to improve on.

### Verbose Output (--verbose)

In addition to the default output, show for each round:
- The full critique text
- Version B (the rewrite)
- Version AB (the synthesis)
- The judge's full reasoning
- The label mappings (which label corresponded to which version)

## Anti-Patterns

| Do NOT | Why |
|--------|-----|
| Add context to dispatch templates beyond what the isolation table specifies | Breaks context isolation — the core mechanism |
| Summarize or paraphrase content when passing to agents | Agents must see the full content, not your summary |
| Tell an agent what previous agents found | Violates isolation — each agent gets fresh context |
| Skip the shuffle.py script and assign labels yourself | LLM-generated label assignment is not truly random |
| Continue a round after an agent fails | Partial rounds produce no usable output |
| Judge versions yourself instead of dispatching the judge agent | The orchestrator has context contamination — the judge does not |
