# Presentations & Slide Decks

> **A persuasive talk deck is not a document with bullet points. It's a sequence of single-idea frames the speaker talks over.** Each slide earns the next. The audience reads the frame in two seconds and listens to the rest. If a slide can be read instead of heard, it's built wrong.

This guide is for **arguing a position to a skeptical room**: town-hall and commissioners'-court talks, board presentations, debate decks, keynotes, pitch decks. It's distilled from a working eight-part debate deck (a "fears and facts" talk answering community objections to a contested land use). The pattern generalizes to any talk where you're moving a room that starts out against you.

Slash command: `/writing:write-presentation`

## The spine: one deck, one argument

Order the deck so trust is built before the argument and the argument resolves into action:

1. **Title + credentials (ethos).** Who's talking and why they're worth hearing. Include any disclosure that defuses the room's first objection to *you* ("Not a registered lobbyist or compensated in any way for this presentation"). Front-load authority once, per universal rule #12.
2. **The frame (values anchor).** One slide that establishes the lens the whole talk sits under, *before* any evidence. The example deck opens on a scripture verse about fear vs. a sound mind. Yours might be a principle, a shared value, or the one question the talk answers. Set it first so every later slide lands inside it.
3. **The objection units (the repeatable core).** One contested topic per slide (or pair), each following the Fear → Flip → Receipts pattern below. This is 60-80% of the deck.
4. **What to require (turn argument into action).** Convert the case into a checklist the audience can act on. A talk that only wins the argument and gives the room nothing to *do* leaks its energy on the walk to the parking lot.
5. **The close.** An analogy the audience already has intuitions about (the example deck contrasts the nuclear path we stopped and regret against the fracking path we built and won), then the fork and the ask. End on the decision, not a "Questions?" slide.

## The objection unit: Fear → Flip → Receipts

This is the engine. Every contested topic gets the same four-move frame, which is why the audience can follow a dense argument at speaking pace: they learn the shape once and then just track the content.

| Move | What it does | From the example deck (Electricity) |
|------|--------------|--------------------------------------|
| **Kicker** | Names/numbers the objection so the room knows where they are | `Fear No. 1` |
| **Headline** | The topic in one to three words, dominant serif | `Electricity` |
| **The fear, in their words** | Steelman: state the objection the way the skeptic would, italic and quoted | *"They'll break the grid and spike my bill."* |
| **The flip** | Reframe the fear as the reason to act, not a rebuttal of it | "They don't just consume capacity. They **cause capacity to get built.**" |
| **Receipts** | Bullets, each one specific claim + a named source inline | "ERCOT's forecast runs **94,650 MW to 154,077 MW by 2035** *(NERC 2025 LTRA)*" |

The flip is the hardest and most important move. "That fear is wrong" makes the skeptic defend their position. "That fear points at the thing you actually want" gives them a way to change their mind without losing face. Note it is *not* corrective reframing (rule #10): you're not saying "that's not X, it's Y," you're showing what the objection gets them when you follow it through.

## Rules that make a talk deck land

1. **Steelman before you answer.** Quote the objection in the skeptic's own voice. A room that hears its own fear stated fairly will listen to the answer; a room that hears a strawman stops listening and starts correcting you.
2. **Flip, don't just rebut.** Turn the fear into the reason to act. Rebuttal wins the point and loses the person.
3. **Every number carries a named source, on the slide.** The example deck sources each stat inline (NERC, arXiv, PUCT, PolitiFact, Brookings/NBER, a named senator in a named paper). In a hostile room the sourcing *is* the argument. One unsourced figure and the skeptic discounts all of them.
4. **Concede what's true.** "You're mostly right about the permanent number" (the Jobs slide) buys credibility for everything that follows. A talk that concedes nothing reads as a sales pitch.
5. **Teach the room to interrogate the other side's numbers.** The strongest recurring move in the example deck is the meta-lesson: *withdrawal isn't consumption, a one-time fill isn't annual makeup, a permit ceiling isn't the metered draw.* Hand the audience the tool and they re-examine the opposition's claims themselves.
6. **Receipts over promises.** Name the place, the deal, the dollar figure (Childress, Carson County, Abilene; $3.07M, 48% of the levy). Specific and checkable beats sweeping and safe. Ties to universal rule #5.
7. **One idea per slide.** If a slide needs two ideas, it's two slides. A "continued" second slide on the same fear is fine and common.
8. **Numbers over adjectives.** +0.2%, 45 dBA, 1,000 people a day, $50,000 per megawatt. The example deck almost never reaches for "significant" or "massive" when a figure is available.
9. **End with something to do.** The action checklist ("require it in writing") and the fork. The room should leave with a next step, not just a verdict.

## Slide-copy craft (this differs from prose)

Slide text is **spoken over, not read**. The writing rules still apply, but a few bend for the medium:

- **Write the frame, say the detail.** The slide carries the claim and the number; the speaker carries the argument. Don't put a paragraph on a slide the speaker will read aloud verbatim; that's the wall-of-text failure.
- **Fragments are fine.** A slide line is a beat, not a sentence. "Not a promise. Receipts." works on a slide and would get cut in prose.
- **The em-dash ban still holds (rule #1), on slides too.** A slide feels like a place to reach for a dash to mark a pause; it isn't. A period or a line break does the same work without the #1 AI tell, and a projected em dash reads as machine-set to anyone who's learned to spot it. Restructure with a period, colon, or fragment instead.
- **Bold only the load-bearing phrase** in each bullet (the number, the name, the verb that turns), so the eye lands on it while the speaker talks around it.
- **Lead the bullet with the claim, not a category label.** "**Childress.** A developer committed to a desalination plant..." leads with the place. Never the inline-header list of rule #17 ("**Cost:** the cost is high").
- **Keep each bullet to one wrapped line** where you can. Two lines is the ceiling; three means it's a paragraph wearing a bullet.

## What NOT to do

- **Wall-of-text slides.** Paragraphs the speaker reads word for word. If the audience can read faster than you talk, you've lost them to the slide.
- **Unsourced statistics** in a room that came to disagree. Source it on the slide or cut it.
- **Strawmanning the objection.** The room knows its own fear better than you do. Get it wrong and you confirm you're not listening.
- **A generic "Questions?" or "Thank You" close.** End on the ask or the fork. The last slide is where the room decides; don't hand it a shrug.
- **Corporate title-case headers** ("Key Considerations," "Path Forward"). Name the actual topic in the fewest words (Electricity, Water, Noise, Jobs).
- **Two fears crammed on one slide.** Split them. Density is the enemy of a spoken frame.

## Render format: the deck template

The reusable HTML deck lives at `assets/deck-template.html` (a stripped version of the example deck's design system). Fill its placeholder slides with your Fear → Flip → Receipts content. What the template gives you:

- Self-contained single HTML file, 16:9 (1600×900), dark theme, serif display headlines over a sans body, **one** accent color used only for emphasis and the `<em>` inside each flip.
- Semantic slide classes matching this guide: `.kicker`, `h2`, `.fear`, `.flip`, `ul > li` with an inline `.src` citation, plus a `.two.three` grid for side-by-side comparison slides (the "same 200 acres, three uses" pattern).
- Keyboard and click navigation with a progress bar for live delivery.
- Fluid `clamp()` typography so it scales from a laptop to a 4:3 projector without re-layout.

Keep the design system as-is unless the user has brand context (`/teach-writing`, project CLAUDE.md). One accent color, one serif, one sans. A talk deck earns attention with the argument, not with a second accent color.

## Export to PDF (the leave-behind)

The template's print CSS renders each slide as one 1600×900 page and **auto-injects a per-page footer** (`Page X of N` plus a copyright line) so the printed leave-behind is numbered and attributed out of the box. Set the copyright in the `FOOTER_ORG` constant at the top of the template.

To generate the PDF:
- **Simplest:** open the HTML in Chrome, Print, "Save as PDF," and it honors the slide-per-page layout.
- **Headless / scripted:** drive Chrome via Playwright and call `page.pdf({ printBackground: true, preferCSSPageSize: true })`. `preferCSSPageSize` honors the `@page { size: 1600px 900px }` rule; `printBackground` keeps the dark theme. If the browser's bundled Chromium isn't installed, launch the system browser with `channel: 'chrome'`.
