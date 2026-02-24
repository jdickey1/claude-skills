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
4. Check contraction usage (at least 3 per paragraph)
5. Analyze sentence rhythm (flag evenly-paced paragraphs)
6. Check specificity (flag abstract claims missing evidence)
7. Check hook strength (first line) and closer strength (last line)
8. Provide a revised version with all fixes applied

## Checklist

- [ ] Zero em dashes
- [ ] Zero banned AI buzzwords
- [ ] 3+ contractions per paragraph
- [ ] Varied sentence lengths (short + long + fragment)
- [ ] First line hooks or provokes
- [ ] Last line is quotable or actionable
- [ ] Every claim backed by evidence within 1-2 sentences
- [ ] Specific numbers/names/examples (not abstractions)
- [ ] Active voice dominant
- [ ] Read aloud: does it sound human?
- [ ] No self-refereeing more than once
- [ ] Final paragraph is in the speaker's voice, not the writer's
- [ ] Credentials stated fully once, referenced lightly after
- [ ] Achievements framed as earned, not just listed

## Output

1. **Issues found** — list with line references
2. **Revised content** — full rewrite with all fixes applied
3. **Summary** — what changed and why
