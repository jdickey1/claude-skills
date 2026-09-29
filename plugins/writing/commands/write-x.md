---
description: Write an X/Twitter post
argument-hint: <topic or angle>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write an X/Twitter post about the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user what they want to post about.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-posts.md` for X algorithm and posting strategy
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-writing-craft.md` for quality tests, voice, and engagement templates
3. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for hook formulas
   - If the post explains a law or its record (a new or proposed rule, what the law does not require, a contested bill or ordinance, or hearing testimony), also read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-explainer-threads.md`. Pick its variant first, then follow that skeleton and checklist.
4. Write 3+ draft variations with different hook patterns
5. **Run the mandatory self-audit pass** on the leading variation (writing skill: "Self-Audit Pass" section). Output 2–4 honest "still-AI" bullets, then revise to a FINAL version. X is a mandatory channel; do not skip this step.
6. **Fact-check** only when step 3 read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-explainer-threads.md`. A narrative X post skips this step and never reads `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-explainer-fact-check.md`.
   - Save the source record as text. A local file is copied whole. A URL is fetched once, and the captured text is what the checker gets. Pasted text is saved verbatim. A transcript is saved whole, with speaker labels and timestamps. When the record is long and the checker can read files, pass the saved file's path. Never pass a drafter-chosen excerpt. If the full text cannot be re-read, the report says "the fact-check was not run".
   - Start a separate agent when one can run with no access to this drafting conversation. Otherwise this same session re-reads the saved record and follows the same prompt. The report names which one ran. The same-session re-read is weaker than a separate agent, and it is still useful. Do not name a host.
   - The checker gets only three inputs: the full saved record, the FINAL thread including alternate hooks and self-replies, and the prompt at `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/x-explainer-fact-check.md`. Drafts, the self-audit, the user request, the drafter's notes, and `evals.json` stay out.
   - The checker labels. The drafter cites or cuts every unsupported sentence before the thread is shown.
   - One re-check only. It is a new call under the same dispatch condition, on the changed sentences only, with the saved record and that same prompt. Repairs that restore a post count, the filer post, or a required walk quote are changed sentences and go in that re-check. There is no third round.
   - On that re-check, a sentence fixed by adding a source a reader can open is cleared. The source string is in the sentence. Do not fetch the page. The report's change line records the citation. A vague attribution stays unsupported and is cut.
   - If some rows parse and others do not, name the unlabeled sentences as not checked. Do not call them passed. That run is not independent. The thread is still shown.
   - If the checker returns nothing usable, or the saved record cannot be re-read, the report says exactly "the fact-check was not run". Still show the thread. Never say the fact-check passed.
   - Append the report after the self-replies under the heading `## Fact-check`. That heading does not start with FINAL and does not match a self-reply heading. The live block is one mode-and-counts line, then one line per change. Do not put traced quotes in that block.
   - Append the checker rows under the next heading `## Fact-check rows`. Keep the checker's row shape, including each traced quote in that row's evidence. The grader reads traced quotes from that heading only.
   - The mode line uses `independent` only when every factual sentence was labeled by the separate agent, or cleared on the re-check by a citation a reader can open, and those results were applied. It uses `fallback` when this session re-read the saved record because no separate agent could start. A fallback is not the independent result. The first line of `## Fact-check` starts with `independent` or `fallback`, then the counts. When any sentence is not checked, that line does not start with `independent`.
7. Apply the pre-publish checklist from the writing skill against the FINAL version
8. Present the post.
   - If step 6 ran, present only the checked FINAL thread, its alternate hooks, its self-replies, and the short report. A draft variation that was outside the checker input is not an option.
   - If step 6 was skipped, present the best options with rationale.

## Key Rules

- **Hook is everything** — first line stops the scroll or you lose them
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **No copula avoidance** ("serves as", "stands as", "boasts" — see writing skill rule #16)
- **Self-audit pass is mandatory** — DRAFT → still-AI bullets → FINAL
- **Use contractions** — they're, don't, won't, can't
- **Specificity wins** — numbers, names, places over abstract claims
- **280 chars for max reach** — but threads work for depth
- Follow current X algorithm signals from the reference file
