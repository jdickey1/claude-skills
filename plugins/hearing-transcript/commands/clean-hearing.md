---
description: Clean up an auto-generated transcript of a legislative hearing. Builds a domain glossary, fixes ASR errors, disambiguates the roll call, and produces a manual-review report with video timestamps.
argument-hint: <transcript-path> [video-url]
---

Invoke the hearing-transcript skill to clean up the transcript at the path provided.

The argument may be:

- A transcript file path (`.sbv`, `.vtt`, `.srt`, or `.txt`) — the only required input.
- An optional second argument with the source video URL (usually a YouTube link). If omitted, ask the user for it before generating the manual-review report.

Read the skill at `skills/hearing-transcript/SKILL.md` and follow its five-phase pipeline exactly: identify the hearing, build the domain glossary, back up and audit format, run the substitution pass, disambiguate the roll call, then generate the review report.

If the argument in `$ARGUMENTS` is empty or does not look like a transcript path, ask the user to provide one before starting.
