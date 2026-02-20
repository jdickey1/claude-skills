---
description: Fetch an X/Twitter post, analyze it, save to Obsidian, and recommend actionable uses
argument-hint: <url>
---

Invoke the x-digest skill with the provided URL argument. The URL should be an X/Twitter post link (x.com or twitter.com).

Read the x-digest skill at `${CLAUDE_PLUGIN_ROOT}/skills/x-digest/SKILL.md` and follow its instructions exactly, using `$ARGUMENTS` as the URL to process.

If no URL is provided in `$ARGUMENTS`, ask the user to provide an X/Twitter post URL.
