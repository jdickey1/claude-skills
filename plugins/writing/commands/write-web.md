---
description: Write website copy or a blog post
argument-hint: <topic, page type, or keyword>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity).

Write website copy or a blog post for the provided topic (`$ARGUMENTS`). If no topic is provided, ask the user what they need.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/web-copy.md` for web writing optimization
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for headline formulas
3. If an `seo` skill is installed and SEO matters, use it for on-page principles. This command does not require it.
4. **Page brief before draft** (rewrites, live URLs, and SEO/AEO pages). Skip when the user already handed a complete brief or wants a pure voice draft. Collect, then write:
   - **Demand evidence and sources** — what the reader is actually trying to do; named sources for any number you will use
   - **Existing target URL** — start from the live page if one exists; do not invent a new URL by default
   - **Missing information** — what the current page or competing pages leave unanswered
   - **Justified edits** — every proposed change has a reason; a keep is a valid recommendation
   - **Named links** — internal and external, by title and URL
   - **Conversion objective** — the next step the page is for
   - **Verification / recheck** — how you will confirm the page still answers the query after edits
   Do not require a new title, H1, or URL for every pick. Buyer-informational pages can be worth writing even when keyword tools show zero volume. Do not pad length to match a competitor's word count.
5. **Decide the structure**: if the page targets AI answer engines (informational query, "what is/how to/X vs Y", or AEO is an explicit goal), use the **Answer-First Article Structure** in `web-copy.md`. Otherwise use the standard Blog Post Template. The "When to use answer-first vs standard" table in `web-copy.md` is the decision guide.
6. Write 5+ headline candidates first, select the best
7. Draft the content following the chosen structure from the reference. On an article or a web page, the first paragraph is writing skill rule #21.
8. **Run the mandatory self-audit pass** on the draft (writing skill: "Self-Audit Pass" section). Output 2–4 honest "still-AI" bullets, then revise to a FINAL version. Web/blog content under any brand identity (Hyperscale, JD Key, etc.) is mandatory; do not skip.
9. Apply the pre-publish checklist from the writing skill against the FINAL version

## Key Rules

- **Headline first** — write 5+ candidates before selecting (80% of the work)
- **No em dashes.** No exceptions.
- **No AI buzzwords.** Check the banned list.
- **No copula avoidance** ("serves as", "stands as", "boasts" — see writing skill rule #16)
- **No inline-header vertical lists** where the bold label just restates the line (rule #17)
- **Self-audit pass is mandatory** for branded/public-facing pages — DRAFT → still-AI bullets → FINAL
- **Scannable structure** — short paragraphs, clear H2/H3 headers, bullet points
- **Evidence after claims.** Every assertion backed within 1-2 sentences (rule #8). The opening is rule #21.
- **CTAs are clear and specific** — not just "learn more"
- **SEO-friendly** if applicable — keyword in H1, meta title, meta description when those already need work; do not change title/H1/URL unless the brief justifies it
- **No competitor word-count padding.** Length follows the reader's task.
- **Zero tool volume is not a veto** on buyer-informational content that has a real reader job
- Follow web copy best practices from the reference file. Direct answers, useful tables, and sourced facts stay; citation-rate promises and fixed FAQ/word quotas do not.
