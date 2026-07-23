---
description: Write a persuasive talk / slide deck
argument-hint: <talk topic or the position you're arguing>
---

**First**: Use the `writing` skill for universal rules (em dash ban, buzzword ban, contractions, rhythm, specificity, evidence-after-claims).

Write a persuasive talk deck about the provided topic (`$ARGUMENTS`). If no topic is provided, ask what the talk is arguing and to whom.

## Gather before drafting

A talk deck argues a position to a specific room, so a few answers change the whole deck. Confirm (ask if not clear from the prompt or voice context):

1. **The room.** Who's in it, and do they start neutral, skeptical, or opposed? A hostile room needs heavier steelmanning and on-slide sourcing.
2. **The objections.** What are the actual fears/pushbacks this talk has to answer? Each becomes one objection unit. If the user hasn't listed them, propose a set and confirm.
3. **The sources.** Every number needs a named source on its slide (rule #3 in the reference). Ask for the data, or flag which claims still need a citation before this is presentable.
4. **The frame and the ask.** The one value/principle the talk sits on, and the concrete action the room should leave with.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/presentations.md` for talk-deck structure and the Fear → Flip → Receipts unit.
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/writing/references/headlines.md` for the title and slide-headline craft.
3. Outline the spine first: Title/ethos → Frame → objection units (one per fear) → What to require → Close. Confirm the outline with the user before writing every slide if the deck is long.
4. Draft each objection unit as Fear (steelman, in their words) → Flip (reframe as reason to act) → Receipts (sourced bullets).
5. **Run the mandatory self-audit pass** (writing skill: "Self-Audit Pass") on the slide copy. Output 2–4 honest "still-AI" tells, then revise. Watch especially for corrective reframing (rule #10) sneaking into flips and inline-header lists (rule #17) in bullets.
6. Fill `${CLAUDE_PLUGIN_ROOT}/skills/writing/assets/deck-template.html`: copy it, set `<title>` and the `FOOTER_ORG` copyright constant, replace the placeholder slides with your content. Keep the design system unless the user has brand context.
7. Apply the pre-publish checklist from the writing skill against the final slide copy.
8. Save the deck and tell the user how to present it and export the PDF leave-behind (see the reference's "Export to PDF" section).

## Key Rules

- **Steelman before you answer.** Quote the objection in the skeptic's own voice; a strawman loses the room.
- **Flip, don't rebut.** Turn the fear into the reason to act. This is *not* corrective reframing ("that's not X, it's Y") — it's showing what the objection gets them.
- **Every number carries a named source, on the slide.** In a skeptical room the sourcing is the argument. One unsourced figure discounts them all.
- **Concede what's true** to earn credibility for the rest.
- **One idea per slide.** Two ideas is two slides; "continued" is fine.
- **Numbers over adjectives.** Specific and checkable beats sweeping.
- **Write the frame, say the detail.** Slides are spoken over, not read. No wall-of-text.
- **End on the ask or the fork**, never a generic "Questions?" slide.
- **Em dashes:** the rule #1 ban holds on slides too. A slide tempts you to use a dash for a pause; a period or line break does the same job without the #1 AI tell.
- **No inline-header vertical lists** (rule #17) — a bullet leads with the claim, not a category label.
