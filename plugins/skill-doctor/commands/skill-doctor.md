---
description: Run skill-doctor audit on installed Claude Code skills
---

Run the skill-doctor CLI and present the results grouped by check type.

```bash
node ${CLAUDE_PLUGIN_ROOT}/bin/skill-doctor.mjs $ARGUMENTS
```

After the run, briefly summarize:
- Total skills scanned, errors, warnings
- Top 3-5 highest-impact findings (errors first, then collisions, then dark skills)
- A recommended next action — not a generic "review the warnings" but something concrete like "Rewrite `write-headline` description to disambiguate from `write-web`."

If the exit code is 0, say so in one line and stop.
