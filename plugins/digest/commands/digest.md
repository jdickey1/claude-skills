---
description: Fetch a web page, X/Twitter post, or local file, analyze it, save to Obsidian, and recommend actionable uses
argument-hint: <url or file path>
---

Invoke the digest skill with the provided argument. The argument can be any web URL (page, article, blog post, X/Twitter post) or a local file path (PDF, Word doc, text file, spreadsheet, image, etc.).

Read the digest skill at `${CLAUDE_PLUGIN_ROOT}/skills/digest/SKILL.md` and follow its instructions exactly, using `$ARGUMENTS` as the input to process.

If the input is an image or PDF of business cards, the skill short-circuits to vCard export (`references/business-cards.md`) instead of a vault digest.

If the primary content is a recipe, exercise, or other health/body keep-file, the skill short-circuits to `02-Areas/Health/` instead of a `web-analyses/` digest.

If no URL or file path is provided in `$ARGUMENTS`, ask the user to provide one.
