---
description: Review and edit existing content for AI tells and quality
argument-hint: <content or file path>
---

**First**: Use the `writing` skill for universal rules and the pre-publish checklist.

Review the provided content (`$ARGUMENTS`) for AI tells, quality issues, and adherence to writing standards. If content is a file path, read it. If no content is provided, ask the user to paste it.

## Process

1. Run through the full pre-publish checklist from the writing skill
2. Flag every em dash (replace with comma, period, colon, semicolon, or parentheses)
3. Flag every banned AI buzzword (provide specific replacements)
4. Flag every copula-avoidance phrase ("serves as", "stands as", "functions as", "boasts", "features", "offers" — replace with "is" / "has" per writing skill rule #16)
5. Flag every inline-header vertical list where the bold label just restates the line (rule #17 — convert to prose or keep only labels that add information)
6. Check contraction usage (at least 3 per paragraph)
7. Analyze sentence rhythm (flag evenly-paced paragraphs)
8. Check specificity (flag abstract claims missing evidence)
9. Flag every corrective reframe ("That's not X. That's Y." and all variants — replace with direct statements backed by evidence)
10. Scan for the four reference families in `references/ai-slop-patterns.md`: Significance Inflation, Synonym Cycling, Filler & Hedging Bloat, Curly Quotes & Em-Char Drift
11. Check hook strength (first line) and closer strength (last line)
12. **Run the mandatory self-audit pass** on the post-fix draft (writing skill: "Self-Audit Pass" section). Output 2–4 honest "still-AI" bullets, then produce the FINAL revised version. `/write-review` is the audit command — this step is the core of the review, not a postscript.
13. Provide the FINAL revised version

## Checklist

- [ ] Zero em dashes
- [ ] Zero banned AI buzzwords
- [ ] Zero copula avoidance ("serves as", "stands as", "boasts", "features")
- [ ] Zero inline-header vertical lists where the label just restates the line
- [ ] Zero curly quotes / smart-char drift unless brand style requires (`grep -P '[\x{2018}\x{2019}\x{201C}\x{201D}\x{2013}\x{2014}\x{2026}]'`)
- [ ] 3+ contractions per paragraph (unless formal voice context)
- [ ] Varied sentence lengths (short + long + fragment) (unless deliberate uniform cadence in voice context)
- [ ] First line hooks or provokes
- [ ] Last line is quotable or actionable
- [ ] Every claim backed by evidence within 1-2 sentences
- [ ] Specific numbers/names/examples (not abstractions)
- [ ] Active voice dominant
- [ ] Read aloud: does it sound human?
- [ ] Zero corrective reframes ("That's not X. That's Y." and all variants) — one max, zero ideal
- [ ] Self-audit pass completed — DRAFT → 2-4 still-AI bullets → FINAL
- [ ] Final paragraph is in the speaker's voice, not the writer's
- [ ] Credentials stated fully once, referenced lightly after
- [ ] Achievements framed as earned, not just listed

## Output

1. **Issues found** — list with line references
2. **Still-AI tells (self-audit)** — 2-4 honest bullets on what reads as AI even after the lexical fixes
3. **Revised content** — full rewrite addressing both the issues list and the still-AI tells
4. **Summary** — what changed and why
