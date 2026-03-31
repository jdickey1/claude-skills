---
name: verify-memories
description: "Use when user says 'verify memories', 'check memory rules', 'run memory sweep', 'verify-memories', or wants to validate that feedback memories with machine-checkable rules are being followed. Also use when user asks 'are my memory rules being followed' or 'check memory verification'."
version: 1.0.0
effort: low
---

# Verify Memories

Sweep all auto-memory files, run machine-checkable verification patterns, and report which rules pass or fail.

## How It Works

Some feedback memories include an optional `verify:` block in their YAML frontmatter:

```yaml
---
name: Example Rule
description: Never do X
type: feedback
verify:
  check: "grep -r 'bad_pattern' ~/.claude/ --include='*.md' 2>/dev/null"
  expect: "no_match"
---
```

This skill reads every memory file, finds those with `verify:` blocks, runs each check command, and compares the result against the expected outcome.

## Verification Protocol

### Step 1: Discover the Memory Directory

Find the memory directory for the current project:

1. Use Glob to find `MEMORY.md` files under `~/.claude/projects/`
2. If exactly one is found, use its parent directory
3. If multiple are found, list them and ask the user which to verify
4. If none are found, report that no memory directory was found and stop

### Step 2: Read All Memory Files

Read every `.md` file in the memory directory (except `MEMORY.md` and `CLAUDE.md` which are index/config files, not memories).

For each file, check whether its YAML frontmatter contains a `verify:` block with both `check` and `expect` fields.

Categorize each file:
- **Verifiable**: Has a valid `verify:` block (both `check` and `expect` present)
- **Skipped**: No `verify:` field (this is normal — most memories don't need verification)
- **Malformed**: Has `verify:` but missing `check` or `expect` — report as a warning

### Step 3: Run Verification Checks

For each verifiable memory, run the `check` command using the Bash tool.

**IMPORTANT**: Run each check with a timeout and suppress errors:
- Append `2>/dev/null` if not already present
- Use a 10-second timeout to prevent hanging on slow commands

Evaluate the result based on the `expect` value:

| `expect` value | PASS condition | FAIL condition |
|----------------|---------------|----------------|
| `no_match` | Command produces no stdout output (empty result) | Command produces any stdout output |
| `match` | Command produces any stdout output | Command produces no stdout output |
| `exit_0` | Command exits with code 0 | Command exits with non-zero code |

### Step 4: Report Results

Present results in this format:

```
MEMORY VERIFICATION SWEEP
══════════════════════════════════════════
✓ Rule Name — brief confirmation
✓ Rule Name — brief confirmation
✗ Rule Name — what was found (quote the output, truncated to 200 chars)
⚠ Rule Name — malformed verify block (missing check/expect)
══════════════════════════════════════════
Verified: N | Passed: N | Failed: N | Warnings: N
Skipped: N memories (no verify field)
══════════════════════════════════════════
```

For failures, include:
- The memory file name
- The check command that was run
- What was expected vs. what was found
- A brief suggestion (e.g., "Review the file at [path] or update the verify pattern if the rule has changed")

### Step 5: Summary Assessment

After the report:
- If all checks pass: "All verified memory rules are being followed."
- If any fail: "N rule(s) have violations. Review the failures above — they may indicate a real rule violation or an outdated verify pattern."
- If malformed entries exist: "N memories have malformed verify blocks. Fix them by ensuring both `check` and `expect` fields are present."

## When NOT to Verify

- Do not run verification automatically at session start
- Do not attempt to fix violations — report them only
- Do not modify memory files during verification
- Do not treat skipped memories (no verify field) as problems — most memories are prose-only by design
