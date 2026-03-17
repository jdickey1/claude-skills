---
name: skill-creator
description: Create, test, harden, and continuously improve skills. Use when creating a skill from scratch, updating or optimizing an existing skill, running evals to test a skill, benchmarking performance, optimizing a skill's description for triggering accuracy, or instrumenting a skill for self-improvement via learning loops.
---

# Skill Creator

Create skills and iteratively improve them through test-driven development with learning loops.

**The lifecycle:** Capture Intent → Draft → Test (RED/GREEN) → Harden (REFACTOR) → Instrument → Optimize Description → Deploy → Learn → Repeat

Your job is to figure out where the user is in this lifecycle and jump in. Maybe they want to create from scratch, or they have an existing skill that needs better testing, or they just want to optimize a description. Be flexible — if the user says "just vibe with me," skip the formal process.

---

## Communicating with the User

Skills attract users across a wide range of technical familiarity — from experienced developers to people opening their terminal for the first time. Pay attention to context cues and adapt your language.

**Default assumptions:**
- "evaluation" and "benchmark" are borderline but OK
- "JSON" and "assertion" need serious cues from the user before using without explanation
- Briefly explain terms when in doubt — a short inline definition costs nothing

Be transparent about what you're doing and why. When spawning subagents, running scripts, or making architectural decisions, explain the reasoning. The user should never wonder "what just happened?"

---

## Phase 1: Capture Intent

Start by understanding the user's intent. The conversation might already contain a workflow to capture (e.g., "turn this into a skill"). If so, extract answers from context first — tools used, steps taken, corrections made, input/output formats observed.

**Key questions:**
1. What should this skill enable Claude to do?
2. When should it trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases? (suggest based on skill type — objectively verifiable outputs benefit from evals; subjective outputs often don't)

**Interview and research:**
- Ask about edge cases, input/output formats, example files, success criteria, dependencies
- Check available MCPs — if useful for research (docs, similar skills, best practices), research via subagents if available, otherwise inline
- Wait to write test prompts until intent is solid

**Skill type identification** (determines testing approach):
| Type | Description | Example |
|------|-------------|---------|
| **Discipline** | Rules/requirements to enforce | TDD, code review gates |
| **Technique** | Concrete method with steps | Condition-based waiting |
| **Pattern** | Mental model for problems | Flatten-with-flags |
| **Reference** | API docs, syntax guides | Library documentation |

See `references/bulletproofing.md` for the testing approach specific to each type.

---

## Phase 2: Draft the Skill

Read `references/skill-structure.md` for anatomy, templates, and progressive disclosure patterns.

**The key rule for descriptions:** Description starts with "Use when..." — triggering conditions only, never workflow summary. When a description summarizes the skill's workflow, Claude may follow the description instead of reading the full skill content. See `references/cso-guide.md` for the full optimization guide.

**Writing principles:**
- Explain the *why* behind instructions — today's LLMs respond better to reasoning than rigid MUSTs
- Use imperative form for instructions
- Keep SKILL.md under 500 lines; defer detail to reference files with clear pointers
- One excellent example beats many mediocre ones
- Skills must not contain malware, exploit code, or misleading content

After drafting, come up with 2-3 realistic test prompts. Share them with the user for review before running.

Save test cases to `evals/evals.json`. Don't write assertions yet — just prompts. See `references/schemas.md` for the full schema.

```json
{
  "skill_name": "example-skill",
  "evals": [
    { "id": 1, "prompt": "User's task prompt", "expected_output": "Description of expected result", "files": [] }
  ]
}
```

---

## Phase 3: RED/GREEN — Test

This section is one continuous sequence — don't stop partway through.

### Workspace Convention

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace: `iteration-N/eval-N/`. Create directories as you go.

### Step 1: Spawn all runs in parallel

For each test case, spawn two subagents in the same turn — one with the skill, one without. Launch everything at once.

**With-skill run:**
```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
```

**Baseline run** (depends on context):
- **New skill**: no skill at all — same prompt, save to `without_skill/outputs/`
- **Improving existing skill**: snapshot the old version first (`cp -r`), point baseline at snapshot, save to `old_skill/outputs/`

Write `eval_metadata.json` for each test case with a descriptive name:
```json
{ "eval_id": 0, "eval_name": "descriptive-name-here", "prompt": "The user's task prompt", "assertions": [] }
```

### Step 2: While runs execute, draft assertions

Don't wait idle. Draft quantitative assertions and explain them to the user. Good assertions are objectively verifiable with descriptive names that read clearly in the benchmark viewer. Subjective skills (writing style, design quality) are better evaluated qualitatively — don't force assertions.

Update `eval_metadata.json` and `evals/evals.json` with assertions.

### Step 3: Capture timing on completion

When each subagent completes, you receive `total_tokens` and `duration_ms` in the notification. Save immediately to `timing.json` in the run directory — this data isn't persisted elsewhere.

```json
{ "total_tokens": 84852, "duration_ms": 23332, "total_duration_seconds": 23.3 }
```

### Step 4: Grade, aggregate, launch viewer

Once all runs complete:

**1. Grade each run** — spawn a grader subagent (or grade inline) using `agents/grader.md`. Save to `grading.json`. The expectations array must use fields `text`, `passed`, and `evidence` (the viewer depends on these exact names). For programmatically checkable assertions, write and run a script.

**2. Aggregate into benchmark:**
```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```
Produces `benchmark.json` and `benchmark.md`. If generating manually, see `references/schemas.md` for the schema.

**3. Analyst pass** — read benchmark data and surface hidden patterns. See `agents/analyzer.md` for what to look for: non-discriminating assertions, high-variance evals, time/token tradeoffs.

**4. Launch the viewer:**
```bash
nohup python <skill-creator-path>/eval-viewer/generate_review.py \
  <workspace>/iteration-N \
  --skill-name "my-skill" \
  --benchmark <workspace>/iteration-N/benchmark.json \
  > /dev/null 2>&1 &
VIEWER_PID=$!
```
For iteration 2+, add `--previous-workspace <workspace>/iteration-<N-1>`.

**5. Tell the user** the viewer is open with two tabs — Outputs (click through test cases, leave feedback) and Benchmark (quantitative comparison). When done reviewing, come back.

### Step 5: Read feedback

When the user returns, read `feedback.json`. Empty feedback = the user thought it was fine. Focus improvements on test cases with specific complaints.

```bash
kill $VIEWER_PID 2>/dev/null
```

### Pressure testing by skill type

| Skill Type | Pressure Scenarios |
|------------|--------------------|
| **Discipline** | Combined pressures: time + sunk cost + authority. Document rationalizations verbatim. |
| **Technique** | Application + variation + missing-information scenarios. |
| **Pattern** | Recognition + counter-examples (when NOT to apply). |
| **Reference** | Retrieval + application + gap testing. |

See `references/bulletproofing.md` for the complete methodology.

---

## Phase 4: REFACTOR — Harden

Analyze results and improve the skill. This is the heart of the loop.

**How to think about improvements:**

1. **Generalize from feedback.** Skills get used across many different prompts. Don't overfit to test cases — if a fix is fiddly or overly constrictive, try different metaphors or patterns instead.

2. **Keep the prompt lean.** Read transcripts, not just outputs. If the skill makes the model waste time on unproductive work, remove those sections.

3. **Explain the why.** Try hard to explain reasoning behind instructions. If you find yourself writing ALWAYS or NEVER in all caps, that's a yellow flag — reframe with reasoning so the model understands importance.

4. **Look for repeated work.** If all test runs independently wrote similar helper scripts, bundle that script in `scripts/` and tell the skill to use it.

5. **Identify rationalizations.** For discipline-enforcing skills, document exact rationalizations agents used to skip rules. Add explicit counters. Build a rationalization table. See `references/bulletproofing.md` for closing loopholes.

6. **Read feedback.json** for user complaints and prioritize those.

**The iteration loop:**
1. Apply improvements to the skill
2. Rerun all test cases into `iteration-<N+1>/`, including baselines
3. Launch viewer with `--previous-workspace` pointing at the previous iteration
4. Wait for user review
5. Read feedback, improve, repeat

Keep going until: user is happy, feedback is all empty, or you're not making meaningful progress.

---

## Phase 5: Learning Instrumentation

Before deploying, add a learning section so the skill improves itself over time.

Read `references/learning-loops.md` for the full system. In brief:
- Add a `## Learning` section to the skill with event emission instructions
- Define which events to capture (corrections, failures, pattern discoveries)
- Template and schema are in `references/learning-loops.md`
- Use `scripts/promote_learnings.py` to analyze accumulated events and suggest skill improvements

**Claude.ai caveat:** Claude.ai sessions lack file-writing tools, so event emission won't work there. The skill still functions normally — learning loops just won't accumulate data. Skills deployed to Claude Code or Codex get the full benefit.

**Keep it lightweight:** Learning instrumentation should add 10-20 lines to a skill, not dominate it. The goal is passive data collection that feeds future improvements.

---

## Phase 6: Optimize Description

The description field is the primary mechanism determining whether Claude invokes a skill. After the skill is solid, optimize it for triggering accuracy.

### Step 1: Generate trigger eval queries

Create 20 eval queries — mix of should-trigger (8-10) and should-not-trigger (8-10). Save as JSON:
```json
[
  {"query": "realistic user prompt with detail", "should_trigger": true},
  {"query": "near-miss that shares keywords but needs something different", "should_trigger": false}
]
```

Queries must be realistic — concrete, specific, with file paths, personal context, casual speech, typos. Focus on edge cases. Should-not-trigger queries should be near-misses, not obviously irrelevant.

### Step 2: Review with user

Present the eval set using the HTML template:
1. Read `assets/eval_review.html`
2. Replace `__EVAL_DATA_PLACEHOLDER__`, `__SKILL_NAME_PLACEHOLDER__`, `__SKILL_DESCRIPTION_PLACEHOLDER__`
3. Write to temp file and open it
4. User edits, toggles, then clicks "Export Eval Set"

### Step 3: Run the optimization loop

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

This splits eval set into 60% train / 40% test, evaluates the current description (3 runs per query), proposes improvements via extended thinking, and iterates up to 5 times. Selects best by test score to avoid overfitting.

### Step 4: Apply the result

Take `best_description` from output and update SKILL.md frontmatter. Show before/after and report scores. Verify with `scripts/improve_description` if needed.

---

## Phase 7: Package and Deploy

```bash
python -m scripts.package_skill <path/to/skill-folder>
```

Present the `.skill` file to the user with a summary of what was built and eval results. Commit the skill to git if appropriate.

### Marketplace Sync (required for marketplace-hosted plugins)

If the skill lives inside a plugin that is registered in a marketplace repo (has a `.claude-plugin/marketplace.json`), you MUST verify the marketplace manifest is in sync after any of these operations:

- **Creating a new plugin** → add an entry to `marketplace.json` with name, description, source path, category, and homepage
- **Renaming a plugin** → update the `name` and `source` path in `marketplace.json` to match the new directory name
- **Changing a plugin description** → update the `description` in `marketplace.json` to match `plugin.json`
- **Deleting a plugin** → remove its entry from `marketplace.json`

**Why this matters:** The marketplace loader resolves plugins by the `source` path in `marketplace.json`. If the path doesn't match the actual directory, the plugin silently disappears from the marketplace with no error.

**Verification step:**
```bash
# From the marketplace repo root, check for mismatches
for dir in plugins/*/; do
  name=$(basename "$dir")
  grep -q "\"./plugins/$name\"" .claude-plugin/marketplace.json || echo "MISSING from marketplace.json: $name"
done
```

Include the `marketplace.json` update in the same commit as the plugin change — never split them across commits.

---

## Improving an Existing Skill

When a user brings an existing skill to improve, figure out where they are and jump in:

- **"My skill doesn't trigger reliably"** → Jump to Phase 6 (Description Optimization)
- **"The skill triggers but outputs are wrong"** → Snapshot old version as baseline, then Phase 3 (Test) with old vs new comparison
- **"I want to add learning loops"** → Jump to Phase 5 (Learning Instrumentation)
- **"Just make it better"** → Start with Phase 3 to establish a baseline, then iterate

**Always snapshot before editing:** Before making any changes, copy the current skill to `<workspace>/skill-snapshot/` so you have a clean baseline for comparison. The snapshot becomes the baseline for all eval runs.

**Use `--previous-workspace`** when rerunning evals so the viewer shows before/after comparisons.

---

## Advanced: Blind Comparison

For rigorous A/B testing between two skill versions, read `agents/comparator.md` for blind comparison (outputs presented without identifying which version produced them) and `agents/analyzer.md` for deep analysis of why the winner won. This is optional and most users won't need it — the human review loop is usually sufficient.

---

## Platform-Specific Instructions

### Claude Code (full support)

All features work: subagents for parallel eval runs, browser-based viewer, description optimization via `claude -p`, learning loop event emission, blind comparison.

### Claude.ai

- **No subagents**: Run evals inline — read the skill, follow its instructions yourself for each test case, one at a time. Less rigorous but still useful as a sanity check.
- **No baseline runs**: Skip baselines; focus on qualitative feedback.
- **No browser viewer**: Present results directly in conversation. For file outputs (.docx, .xlsx), save to filesystem and tell user where to find them.
- **No benchmarking**: Skip quantitative benchmarks; focus on qualitative review.
- **No description optimization**: Requires `claude -p` CLI, which is Claude Code only.
- **Packaging works**: `package_skill.py` just needs Python and a filesystem.

### Cowork

- **Subagents work**: Full parallel eval workflow supported. If timeouts are severe, fall back to serial execution.
- **No display**: Use `--static <output_path>` for the viewer to write standalone HTML instead of starting a server. Proffer a link for the user to open.
- **Feedback via download**: "Submit All Reviews" downloads `feedback.json` as a file. Read from the user's download location.
- **Description optimization works**: Uses `claude -p` via subprocess.
- **IMPORTANT**: GENERATE THE EVAL VIEWER BEFORE evaluating outputs yourself. Get results in front of the human ASAP.

---

## Reference Files

| File | Purpose |
|------|---------|
| `references/schemas.md` | JSON schemas for evals, grading, benchmark, and learning events |
| `references/skill-structure.md` | Skill anatomy, templates, progressive disclosure patterns |
| `references/cso-guide.md` | Description optimization for triggering accuracy (CSO) |
| `references/bulletproofing.md` | Testing methodology, pressure scenarios, rationalization defense |
| `references/learning-loops.md` | Self-improving feedback loop system and event schemas |
| `agents/grader.md` | How to evaluate assertions against outputs |
| `agents/comparator.md` | Blind A/B comparison between two outputs |
| `agents/analyzer.md` | Deep analysis of benchmark results and version differences |

---

## The Core Loop

Capture → Draft → Test → Harden → Instrument → Optimize → Deploy → Learn → Repeat

Every pass through this loop makes the skill more robust. The first iteration catches obvious issues. The second catches subtle rationalizations. By the third, the skill should be solid — but the learning loops keep improving it in production.

Figure out where the user is. Jump in. Help them move forward.
