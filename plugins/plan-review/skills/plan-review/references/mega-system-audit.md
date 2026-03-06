# Pre-Review System Audit (Mega Only)

Before doing anything else, run a system audit. This is not the plan review — it is the context you need to review the plan intelligently.

## Audit Commands

Run the following (adapt to project's VCS and language):

```bash
git log --oneline -30                          # Recent history
git diff main --stat                           # What's already changed
git stash list                                 # Any stashed work
```

Search for open issues in touched files:
```bash
# Search for TODO/FIXME/HACK/XXX in source files
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.py" --include="*.rb" --include="*.js" -l
```

Check recently modified files:
```bash
# Files modified more recently than the dependency lock file
find . -name "*.ts" -o -name "*.py" -o -name "*.rb" -o -name "*.js" | head -20
```

## What to Map

1. **Current system state** — what's deployed, what's in flight?
2. **In-flight work** — other open PRs, branches, stashed changes?
3. **Known pain points** — existing issues most relevant to this plan?
4. **Open issues in touched files** — TODO/FIXME/HACK comments in files this plan modifies?

## Retrospective Check

Check the git log for this branch. If prior commits suggest a previous review cycle (review-driven refactors, reverted changes):
- Note what was changed
- Flag whether the current plan re-touches those areas
- Be MORE aggressive reviewing previously-problematic areas — recurring problems are architectural smells

## Taste Calibration (EXPANSION mode only)

- Identify 2-3 files or patterns in the codebase that are particularly well-designed. Note as style references.
- Identify 1-2 patterns that are frustrating or poorly designed. Note as anti-patterns to avoid repeating.

**Report all findings before proceeding to Step 0.**
