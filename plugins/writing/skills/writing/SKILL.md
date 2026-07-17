---
name: writing
description: Use when writing any content, copy, social posts, articles, blog posts, website text, emails, newsletters, headlines, descriptions, or any text that will be read by humans. Also use when reviewing or editing AI-generated text for quality.
version: 2.8.1
effort: high
expires_when: "Claude's unprompted prose drops the em dashes, banned buzzwords, corrective reframes, copula avoidance, and slop patterns, retiring the tic-suppression apparatus and self-audit; the voice-precedence machinery (rule #15, pre-write context check), the org brand roster, headlines.md, and persuasion-frameworks.md stay"
---

# Writing

Universal writing standards for all content. Format-specific guidance in references/. Use slash commands for specific tasks.

## Commands

| Command | What it does |
|---------|-------------|
| `/writing:write-x <topic>` | Write an X/Twitter post |
| `/writing:write-linkedin <topic>` | Write a LinkedIn post |
| `/writing:write-web <topic>` | Write website copy or blog post |
| `/writing:write-headline <topic>` | Generate 5+ headline candidates |
| `/writing:write-newsletter <topic>` | Write email/newsletter content |
| `/writing:write-review <content>` | Review/edit content for AI tells |
| `/writing:teach-writing` | Write voice/brand context to CLAUDE.md |

These are plugin-namespaced **commands** — invoke them with the `writing:` prefix (the bare `/write-x`, `/teach-writing`, etc. do not resolve). Note the distinction: `writing:writing` (this file) is the *skill*; the rows above are *commands*, which live under the same `writing:` namespace but are separate `/writing:<name>` invocations, not skills.

## Pre-Write Context Check

Before writing any content, confirm you know:

1. **Who is the audience?** (general public, developers, clients, voters, etc.)
2. **What voice/brand?** (personal, company, publication; check CLAUDE.md for voice context from `/writing:teach-writing`)
3. **What format?** (X post, blog, newsletter, etc.; may already be clear from the command used)

If voice/brand context exists in CLAUDE.md (via `/writing:teach-writing`), use it. If not and the audience is ambiguous, ask before writing. Don't guess at voice for branded content. A casual tone for a law firm or formal tone for a podcast social account wastes a draft.

When captured voice context exists, it overrides universal defaults where they conflict (see rule #15). The universal rules are defaults, not mandates. Voice wins.

Exception: if the user provides enough context in their prompt ("write a casual X post about datacenter cooling"), skip the check and go.

## Universal Rules (ALL Content Must Follow)

### 1. No Em Dashes (CRITICAL)

NEVER use em dashes in any content. This is the #1 tell of AI-generated text.

- Wrong: `The datacenter -- which opened last year -- is expanding.`
- Right: `The datacenter, which opened last year, is expanding.`

Use commas, periods, colons, semicolons, or parentheses instead. No exceptions.

### 2. Banned AI Buzzwords

These words are immediate AI detection flags. Replace on sight:

| Banned | Use Instead |
|--------|------------|
| delve | dig into, explore |
| landscape | space, world, field |
| leverage | use |
| robust | strong, [specific descriptor] |
| streamline | simplify |
| moreover / furthermore | Plus, Also, or omit |
| ensure | make sure |
| facilitate | help, enable |
| utilize | use |
| holistic | complete, full |
| synergy | [describe the actual benefit] |
| paradigm | model, approach |
| ecosystem | system, network |
| myriad | many, countless |
| underscore | highlight, show |
| notably | [just state the thing] |
| comprehensive | thorough, complete |
| In today's digital age | [delete entirely] |
| It is essential to note | [delete entirely] |
| seamless | [describe the specific integration] |
| cutting-edge | [name the actual advance] |
| groundbreaking | [state what's new about it] |
| revolutionary | [describe the change] |
| transformative | [show the before/after] |
| game-changing | [explain the specific impact] |
| next-level | [describe the improvement] |
| world-class | [cite the ranking or comparison] |
| leverage | use |
| navigate (challenges) | solve, handle |
| unpack (concepts) | explain |
| supercharge | speed up, improve |
| unlock | enable, allow |
| reimagine | redesign, rethink |

### 3. Use Contractions

Avoiding contractions is one of the most obvious AI fingerprints. Use them naturally: don't, can't, won't, isn't, it's, doesn't, wouldn't, hasn't.

### 4. Vary Sentence Rhythm

Evenly-paced paragraphs (every sentence 15-25 words) read as machine-generated. Mix it up:

- Short punch. Then a longer sentence that develops the idea with context and nuance. Fragment for impact.
- Vary openers. Don't start consecutive sentences the same way.
- Real writers speed up and slow down. So should you.

### 5. Specificity Over Generality

- Wrong: "Water is scarce in Texas."
- Right: "The Ogallala Aquifer in the Permian Basin is depleting 150+ feet below sustainable levels."

Specific numbers, names, places, and examples beat abstract claims every time.

### 6. Active Voice Preferred

- Wrong: "Gas generation is permitted in Texas."
- Right: "Texas permits gas generation."

### 7. Show, Don't Preach

- Don't talk down to the reader
- Don't over-explain obvious things
- Let evidence make your case, not admonishments
- Trust the reader's intelligence

### 8. Evidence After Claims

Every assertion should be followed within 1-2 sentences by proof: a number, an example, a story, or a comparison. Unsupported claims read as filler.

### 9. Headlines Are 80% of the Work (CRITICAL)

David Ogilvy: "On the average, five times as many people read the headline as read the body copy." 80% of readers never get past the headline. Everything else is downstream.

- Always write 5+ headline candidates before selecting one
- Use numbers (+36% engagement), brackets (+40% CTR), specificity (+321% conversion)
- Test headline length for channel: 6 words general, 8 words landing pages, 2-4 words email
- Negative superlatives ("worst," "never") outperform positive by 30%

**Full research and formulas**: See [references/headlines.md](references/headlines.md)

### 10. No Corrective Reframing (CRITICAL)

The "That's not X. That's Y." construction is an AI rhetorical crutch. It sounds like a TED talk punchline, not human writing. AI loves this move because it creates artificial drama without evidence. Kill it on sight.

**All of these are the same bad pattern:**

- "That's not a tagline. That's a promise."
- "This isn't marketing. This is reality."
- "That's not positioning. That's just what's true."
- "This isn't a challenge. It's an opportunity."
- "That's not a bug. That's a feature."
- "We don't sell insurance. We sell peace of mind."
- "This isn't about technology. It's about people."

**Also catch these softer variants:**

- "More than just X, it's Y" / "It's not just X, it's Y"
- "Less of an X and more of a Y"
- "X? No. Y." (the dramatic question-then-correction)
- "Call it X. What it really is: Y."
- "Forget X. Think Y."
- "Stop thinking of it as X. Start thinking of it as Y."

**Also catch parallel-clause moralistic punchlines.** These don't use explicit negation but compress the same rhetorical move into a "[verb A], [verb B]" parallel where the second clause exposes what the first misses:

- "Survey the datacenter, miss the gas plant."
- "Watch the speaker, miss the policy."
- "Trust the headline, lose the story."
- "Read the contract, miss the fine print."

Same family as "X isn't Y, it's Z": the writer compressing a moral into a punchline instead of letting evidence carry it. State the principle directly ("Most of the water cost sits upstream of the facility") instead of compressing to a moralistic two-clause snap. Particularly common in X drafts where the punchiness feels earned by the medium; it's still the AI shape.

**Why this is bad:** It's the writer stepping in front of the evidence to tell the reader how to interpret it. If your evidence is strong, the reframe is unnecessary. If your evidence is weak, the reframe won't save it. Either way, cut it.

**What to do instead:** State the thing directly. Let evidence create the reframe in the reader's mind.

- Wrong: "That's not a policy change. That's a market signal."
- Right: "Three carriers pulled out of Florida in six months. The market noticed."
- Wrong: "This isn't just a product update. It's a paradigm shift."
- Right: "Processing time dropped from 3 hours to 11 seconds."

**One structural pivot per piece, maximum.** If you absolutely must use a corrective reframe once for rhetorical impact, you get one. Two is one too many. Zero is ideal.

### 11. End in the Speaker's Voice, Not the Writer's

When writing for an organization or another person, the final paragraph should sound like *them*, not like you. "That's just what's true" sounds like a copywriter. "We have been blessed with so much" sounds like a university president. The closer is where the reader decides who's talking. Make sure it's the right person.

### 12. Front-Load Credentials, Then Trust the Reader

State key credentials, numbers, and authority markers with full specificity *once*, early in the piece. After that, refer to them casually. Restating credentials mid-piece signals insecurity. The reader remembers. Don't re-cite your authority every time you reference it.

- First mention: "one of only 16 fully recommended Newman Guide colleges in America"
- Later: "as a Newman Guide university" (the reader already knows what that means)

### 13. AI Slop Patterns (CRITICAL)

Beyond individual banned words, AI produces recognizable *structural* patterns that scream "a model wrote this." These are just as damaging as em dashes or buzzwords because readers pattern-match on them instantly.

**Full encyclopedia**: See [references/ai-slop-patterns.md](references/ai-slop-patterns.md) for every pattern with examples and fixes.

**The worst offenders to catch in every draft:**

| Pattern | Example | Fix |
|---------|---------|-----|
| Throat-clearers | "Here's the thing:" / "Let me be clear:" | Delete. Start with the actual point. |
| Talk-down moves | "Read what's actually being proposed" / "Look at this carefully" / "Consider what this really means" / "Pay attention to..." | Describe the thing directly. These phrases position the reader as having read sloppily — condescending, and a recognizable AI-shaped tic. Distinct from throat-clearers because they don't just delay the point; they insult the reader. |
| False exclusivity | "Nobody's talking about this" | If it's novel, the content proves it. Cut the hook. |
| Manufactured urgency | "This changes everything" / "Drop everything" | Show urgency with evidence (deadlines, data), don't assert it. |
| Dramatic fragmentation | "Let that sink in." / "Read that again." | Write a compelling paragraph instead. |
| Fake vulnerability | "Unpopular opinion:" / "Hot take incoming:" | If the take is bold, the content proves it. |
| Qualifier sandwiches | "It's worth noting that..." / "To be fair..." | Make the claim. Put caveats in the next sentence as new info. |
| Pivot hype | "But here's where it gets interesting:" | Transition with logic, not hype. |
| Fake closers | "Buckle up." / "We're still early." / "Act accordingly." | End with something specific: a number, name, or concrete next step. |
| AI adverb clusters | literally, incredibly, fundamentally, genuinely | Cut them. If the sentence is weaker without the adverb, rewrite the sentence. |
| Fill-in-the-blank templates | "[X] is the new [Y]." / "If you're still [old method], you're already behind." | If your sentence fits a template, it's not insight. Rewrite with specifics. |
| Validation / meta-commentary | "That's the spine." / "Fair hit." / "That's something to sit with." / "A real observation." / "That's doing real work." / "Genuinely. Quietly." | Assistant-voice tics: the writer stamping a verdict on their own line instead of writing it. Delete the fragment; let the sentence stand. See [ai-slop-patterns.md](references/ai-slop-patterns.md). |

**Scoring rule:** If a draft triggers 4+ patterns from the full list, it needs a rewrite, not a polish. The patterns compound: readers who spot one start looking for the rest.

### 14. Earned Language Over Credential-Dropping

Don't just list what you are. Show that you earned it. "Diligence and fidelity to mission that earned a spot on the Newman Guide" is stronger than "a Newman Guide institution." The reader respects achievement more than status.

### 15. Preserve Idiosyncrasies, Don't Auto-Smooth

Captured voice beats generic "good writing." When a writer's voice context (from `/writing:teach-writing`, project CLAUDE.md, or explicit instruction) contains deliberate stylistic quirks, preserve them even when they conflict with the universal rules above.

**Examples of voice signals that override defaults:**

- Short, uniform sentences as a deliberate cadence (e.g., non-native English speaker who writes direct and tight) → don't force rhythm variation per rule #4
- Consistent avoidance of contractions for register reasons (legal, formal brand voice) → don't force contractions per rule #3
- A recurring sentence starter, signature transition, or personal phrase that shows up across their corpus → keep it, don't edit it out as repetition
- Idiomatic constructions that a grammar checker would flag → keep if they're part of the writer's pattern

**The test:** Before applying a universal rule, check whether the writer's captured voice contradicts it. If yes, the voice wins. Default rules exist to prevent AI-generated mush, not to normalize humans toward an imaginary middle.

**Inline voice samples.** When the user pastes a few paragraphs of their own writing into the prompt as a one-shot reference (separate from any persistent voice context), analyze it before drafting:

- Sentence length distribution (short and punchy? long and flowing? mixed?)
- Word-choice register (casual? academic? somewhere between?)
- How paragraphs open (jump in? set context first?)
- Punctuation tics (parenthetical asides? semicolons? sentence fragments for emphasis?)
- Recurring transitions or signature phrases
- Idioms a grammar checker would flag

Then mirror those signals in the rewrite. Don't just remove AI patterns, replace them with patterns from the sample. If they write short sentences, don't produce long ones. If they say "stuff" and "things," don't upgrade to "elements" and "components." Inline samples are one-shot; persistent voice context (`/writing:teach-writing` or project CLAUDE.md) wins for ongoing work.

**What's NOT an idiosyncrasy:** Em dashes (rule #1), banned AI buzzwords (rule #2), AI slop patterns (rule #13, throat-clearers, fake vulnerability, pivot hype, fake closers, etc.), corrective reframing (rule #10), copula avoidance (rule #16), and inline-header vertical lists (rule #17) are always wrong. Those aren't voice choices, they're AI tells. Rule #15 protects deliberate human quirks, not AI artifacts. If a captured voice corpus contains these patterns, they're contamination from AI editing, not real voice. Strip them.

**Why this rule exists:** Applying every universal rule maximally smooths output toward a generic "competent" register that reads as AI-processed even when it's technically "correct." The writer's quirks are the fingerprint. Don't polish them out.

**Channel context modifies voice-mirror.** Voice-mirror beats AI mush, but on conversational channels (X, SMS, casual newsletter, DMs), plainness often beats voice-mirror. A literary phrase that lands in a print article can read as overwritten in 280 chars. If a phrase mirrors the parent piece's voice but adds friction at thread cadence, swap it down a register for the conversational version.

- Parent piece: "They aren't the same kind of object."
- X draft mirroring it: "Different objects."
- Live X (better): "Very different."

Both are correct for their channels. The literary mirror feels overwritten on X; the plain phrase feels underwritten in print. Calibrate to where the reader is. The published voice can carry deliberate idiosyncrasies into a thread (signature transitions, sentence fragments, abbreviations), but a single literary turn that requires a reader's full attention is the kind of thing that gets edited down on the live post.

### 16. No Copula Avoidance

LLMs substitute elaborate constructions for plain "is" and "has." After em dashes, this is the strongest single structural AI tell. The fix is almost always shorter and clearer.

| AI move | Plain English |
|---------|---------------|
| serves as | is |
| stands as | is |
| functions as | is |
| acts as | is (or describe what it does) |
| represents (a) | is |
| marks (a) | is |
| boasts (a) | has |
| features (a) | has |
| offers (a) | has, gives |

- Wrong: "Gallery 825 serves as LAAA's exhibition space and boasts over 3,000 square feet."
- Right: "Gallery 825 is LAAA's exhibition space. It has 3,000 square feet."

**Why:** Copula avoidance is a tic from training data weighted toward marketing copy. Humans say "is" and "has" because they're unmarked. AI adds ceremony to every linking verb. Strip it.

**Narrow exception:** Legal and policy boilerplate sometimes uses "serves as" legitimately ("This document serves as notice that..."). One instance of legitimate use is fine. Two is the AI tic returning.

### 17. No Inline-Header Vertical Lists

The "**Bold Label:** sentence that just restates the label" pattern is one of the most recognizable AI fingerprints in newsletters and posts. It looks structured but adds no information.

- Wrong:
  > - **Performance:** Performance has been significantly improved.
  > - **Security:** Security has been strengthened.
  > - **Adoption:** Adoption continues to grow.

- Right (prose):
  > Performance is faster, security is stronger, and adoption keeps growing.

- Right (genuine bullets where each label adds info):
  > - **Latency**: down 40% after the cache rewrite
  > - **Auth**: now end-to-end encrypted with rotating keys
  > - **Active users**: 12k → 38k in six months

**The test:** Remove the bold label. Does the bullet still convey the same information? If yes, the label is decoration, kill it. If no (because the label adds a category, metric, or dimension the prose doesn't), keep it.

**Why:** AI loves this format because it looks organized while requiring no actual structure. It also pads token count without adding signal.

### 18. Pressure-Test Drafts Against Editor Reflexes

The lexical rules catch wrong words. The structural rules catch named AI constructions. Real editors still cut a third category: defensive disclaimers, hedging epilogues, false-neutral conclusions, two-sentence balance beats, clever "the question isn't X, it's Y" closers. These pass the other rules but a careful editor cuts them on first pass.

Before finalizing branded or long-form content, scan for the eight editorial-edit patterns in [references/editorial-edit-patterns.md](references/editorial-edit-patterns.md). Each is documented with a real before/after from an editorial revision pass.

**Why:** Rule #13 catches AI's *writing* tics. This rule catches AI's *editing* tics: the moves even careful AI prose makes because the model lacks an editor's reflexes. A human editor cuts these on first pass; doing it before delivery saves the round-trip.

### 19. Order Lists by Magnitude and Recognizability

When you list deals, proof-points, or competing examples, the first item anchors the reader. Order largest-first by magnitude (dollars, MW, headcount, votes); break ties by audience recognizability; avoid leading with a foreign-spelling brand (Wärtsilä, Mærsk, Citroën) unless it's the single most-recognized name in its category.

- Wrong: "Wärtsilä committed 412 MW, PROENERGY 650 MW, and INNIO 1.25 GW to the buildout."
- Right: "INNIO committed 1.25 GW, PROENERGY 650 MW, and Wärtsilä 412 MW to the buildout."

**Applies** to any prose with three or more named items, including comma-separated runs in a sentence. **Doesn't apply** to alphabetical indexes, chronological lists, or rankings where another order is load-bearing (final standings, search results). **Why:** the first item is the anchor; the rest live in its shadow. Magnitude signals size, recognizability signals shape; either beats alphabetical or arrival order.

## Hook Patterns (Universal)

The first line of anything has one job: stop the scroll. Patterns that work:

1. **Specific number + surprising claim**: "$178B fork in the road for Texas energy"
2. **Contrarian take with evidence**: "I analyzed 100 accounts. 83% posted LESS than experts recommend."
3. **Quotable provocation**: "Power gets the headlines. Water will get the lawsuits."
4. **Curiosity gap**: Reveal enough to create tension, not enough to resolve it.

End strong too. The last line triggers shares and reposts. Don't bury your best line in the middle.

## Format-Specific Guides

Read the appropriate reference before writing:

- **Headlines & titles (START HERE)**: See [references/headlines.md](references/headlines.md)
- **X/Twitter posts**: See [references/x-posts.md](references/x-posts.md) (algorithm & strategy) and [references/x-writing-craft.md](references/x-writing-craft.md) (quality & voice)
- **AI slop patterns (anti-patterns)**: See [references/ai-slop-patterns.md](references/ai-slop-patterns.md)
- **Editorial edit patterns (revision-pass posture catches)**: See [references/editorial-edit-patterns.md](references/editorial-edit-patterns.md)
- **X Articles (long-form)**: See [references/x-articles.md](references/x-articles.md)
- **LinkedIn posts & articles**: See [references/linkedin.md](references/linkedin.md)
- **Website copy & blog posts**: See [references/web-copy.md](references/web-copy.md)
- **Persuasion frameworks**: See [references/persuasion-frameworks.md](references/persuasion-frameworks.md)
- **Interview scripts**: See [references/interview-scripts.md](references/interview-scripts.md)
- **Project & technical work summaries (recaps, "what we did" lists)**: See [references/project-summaries.md](references/project-summaries.md)

## Self-Audit Pass

Before finalizing branded or public-facing content, run a second-pass self-audit. Drafts that *technically* clear the universal rules can still feel AI-shaped because patterns compound in ways no checklist enumerates. The audit forces the model to look at its own draft as a critic.

**Mandatory for:**
- X / Twitter posts (`/writing:write-x`)
- LinkedIn posts (`/writing:write-linkedin`)
- Web copy and blog posts (`/writing:write-web`)
- Newsletters (`/writing:write-newsletter`)
- Any content under a brand identity (Hyperscale, JD Key, Winning on Issues, Sharper Stories, DLG, Link2s, PodStyle Video, VidPublish, TRU)
- Anything `/writing:write-review` is reviewing

**Optional for:**
- Internal scratch drafts and conversational replies
- Plans, specs, and developer-facing docs

**The pass (run in this order, don't skip a step):**

1. **Hold the draft.** Have the leading draft (or selected variation) ready.
2. **Self-critique.** Ask explicitly: *"What makes this still obviously AI-generated?"* Answer in 2–4 honest bullets. Look for: structural patterns the lexical rules don't catch, evenly-paced rhythm, "clean but soulless" cadence, copula avoidance that slipped through, inline-header lists, qualifier sandwiches, throat-clearers, dramatic fragments, AI vocabulary not on the banned list but still off.
3. **Revise.** Produce a final version that addresses each tell from step 2. The revision should rewrite affected sentences, not search-and-replace single words. It also shouldn't swap one template for another: replacing "Moreover" with "Picture this:", or academic voice with fake-startup-blog voice, just relocates the tell. After revising, re-scan the new version against the same tell list to confirm the fix didn't introduce a fresh one.
4. **Deliver.** Present the FINAL version. If you produced multiple draft variations, the audit applies to whichever variation gets selected.

**Output format on mandatory channels:**

```
DRAFT:
{draft content}

Still-AI tells (self-audit):
- {bullet 1}
- {bullet 2}
- {bullet 3}

FINAL:
{revised content}
```

**Don't fake the audit.** "I see no AI tells in this draft" is not a valid step-2 answer on a first draft. Honest bullets always exist. The point is to expose them, not to declare victory.

**Why this exists:** Lexical rules (banned buzzwords, em dashes, contractions) catch words. Structural rules (rules #10, #13, #16, #17) catch named constructions. The self-audit catches the residual *shape* of AI prose, patterns we haven't yet named, and cuts them before content goes public. Anything Hyperscale, JD Key, or any other brand publishes hits readers who pattern-match on AI output instantly; the audit is the last guard against that signal.

## Quality Checks and Guards

For autoresearch evals, manual review, or pre-publish gates, use the **eleven binary quality checks** in [references/quality-checks.md](references/quality-checks.md). The reference defines: voice/channel context overrides, EVAL 1-11 (em dashes, banned buzzwords, contractions, rhythm, evidence, opener, AI slop, corrective reframing, copula avoidance, self-audit, editorial-edit tics), greppable patterns where checkable, and the two guard assertions (word-count vs. quality, format-specific rule preservation).

The pre-publish checklist below is the human-facing version of these checks; the quality-checks.md reference is the machine-checkable version.

## Pre-Publish Checklist

Before finalizing any content:

- [ ] Headline tested: 5+ candidates written, best one selected (see [headlines.md](references/headlines.md))
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
- [ ] Zero AI slop patterns (throat-clearers, false exclusivity, fake urgency, dramatic fragments, fake closers; see [ai-slop-patterns.md](references/ai-slop-patterns.md))
- [ ] Zero conversational validation / meta-commentary (no "That's the spine," "Fair hit," "something to sit with," "A real observation," "That's doing real work," adverb-only fragments like "Genuinely. Quietly."; delete the verdict stamp, see [ai-slop-patterns.md](references/ai-slop-patterns.md))
- [ ] Zero time-deixis (no "today's newsletter," "in today's post," "this week's brief"; open with substance, see [ai-slop-patterns.md](references/ai-slop-patterns.md))
- [ ] Zero two-part engagement questions ("Should X, or does Y?"): single-clause questions only (see [ai-slop-patterns.md](references/ai-slop-patterns.md))
- [ ] Zero spectacle framing around failure (no "cratered," "vendors walked," "lesson writes itself"; mechanics over spectacle, see [ai-slop-patterns.md](references/ai-slop-patterns.md))
- [ ] Zero fractional-magnitude precision ("$5B" not "$5.27B" unless the digits carry meaning, see [ai-slop-patterns.md](references/ai-slop-patterns.md))
- [ ] Zero corrective reframes ("That's not X. That's Y." and all variants): one max, zero ideal
- [ ] Zero copula avoidance ("serves as", "stands as", "boasts", "features"; see rule #16)
- [ ] Zero inline-header vertical lists where the bold label just restates the line (rule #17)
- [ ] Lists ordered by magnitude and recognizability (largest-first; foreign-spelling brand never first unless single most-recognized in category, see rule #19)
- [ ] Self-audit pass completed (mandatory for X, LinkedIn, web/blog, newsletter, branded content; see Self-Audit Pass section)
- [ ] Editorial-edit pressure-test passed (no defensive disclaimers, no hedging epilogues at section closes, no false-neutral conclusions, no clever "the question isn't X, it's Y" closer; see [editorial-edit-patterns.md](references/editorial-edit-patterns.md) and rule #18)
- [ ] Captured voice idiosyncrasies preserved over generic defaults (rule #15: deliberate quirks in voice context kept, not smoothed)
- [ ] Final paragraph is in the speaker's voice, not the writer's
- [ ] Credentials stated fully once, referenced lightly after
- [ ] Achievements framed as earned, not just listed

## Escalation Protocol

**STOP and ask the user before proceeding when:**
- The content's intended audience or voice is unclear (writing for the user vs. writing for a brand/client)
- The topic requires domain expertise you're uncertain about (legal claims, medical advice, financial figures)
- The user's requested format conflicts with quality rules (e.g., "write a 50-word blog post" is too short to be useful)
- Content involves named individuals who haven't been consulted (quotes, attributions, testimonials)
- A banned AI pattern is the most natural way to express something and removing it significantly weakens the piece

**Do NOT escalate (handle autonomously):**
- Applying all universal rules (no em dashes, no banned buzzwords, contractions, rhythm)
- Generating 5+ headline candidates before selecting one
- Running the pre-publish checklist before finalizing
- Choosing format-specific guidance from references/

## Completion Status

When writing is complete, report:

```
CONTENT: {title or description}
═══════════════════════════
Format: {X post / LinkedIn / web copy / newsletter / etc.}
Word count: {N}
Headlines tested: {N} candidates → selected: "{winner}"
Quality checks: {passed/failed count} of 8 binary evals
Pre-publish checklist: {all passed / items failed}
═══════════════════════════
```

## Verification of Claims

- **"Zero em dashes" must be verified with a literal search**, not assumed from writing carefully.
- **"No banned buzzwords" must be checked against the full banned list**, not just common ones.
- **Headline selection must show all candidates**, not just the winner.
- **Specific claims (numbers, dates, names) must be sourced** from the user's input or verified reference material. Never fabricate statistics.
- **"Read aloud test" means actually evaluating rhythm and flow**, not just checking sentence length metrics.

## Rationalization Defense (Discipline-Skill Bulletproofing)

These are the rationalizations the skill must refuse, with the counter to apply:

| Rationalization | Counter |
|---|---|
| "User said keep it short, so I skipped the headline candidates." | Headlines are 80% of the work (rule #9). Generate 5+ candidates, pick one, then trim the body if needed. Never compress by skipping candidate generation. |
| "The em dashes in the parent piece show the user wants them." | Em dashes in source material are AI contamination, not voice (see rule #15: "What's NOT an idiosyncrasy"). Strip them. |
| "Skipping contractions sounds more authoritative for this topic." | If the user requested formal register, that's voice context (rule #15) and EVAL 3 yields. If they didn't, the rule applies. Default to contractions. |
| "The corrective reframe lands really well, so I'll keep this one." | Rule #10: zero is ideal, one is the absolute max. If the evidence is strong the reframe is unnecessary; if the evidence is weak the reframe won't save it. |
| "I'm under word-count pressure, so I skipped the self-audit." | The self-audit is mandatory for branded channels (Self-Audit Pass section). Cut elsewhere; never skip the audit. |
| "I don't see any AI tells in this draft." | A first-draft audit with zero bullets in step 2 means the audit was skipped, not passed. Name 2-4 honest tells before revising. |
| "This buzzword isn't on the exact-match list." | Rule #2 applies to the word, not the phrase. "The modern digital landscape" contains "landscape" even though the exact phrase isn't listed. Check each banned word independently. |
| "The parallel-clause punchline is punchier on X, so it's earned." | Rule #10's parallel-clause moralistic punchline subsection: same AI rhetorical move as "X isn't Y, it's Z" without the negation. State the principle directly. |
| "Voice context says no contractions, but rule #3 says use them." | Voice wins (rule #15). Captured voice context overrides universal defaults where they conflict. EVAL 3 yields to formal register. |
| "The user's draft already used 'serves as,' so it must be voice." | If the captured voice contains AI tells (em dashes, copula avoidance, corrective reframes), it's contamination from prior AI editing. Strip them. Rule #15 protects deliberate human quirks, not AI artifacts. |
| "Opening with 'In today's brief...' tells the reader where they are." | Time-deixis is structural AI slop (see [ai-slop-patterns.md](references/ai-slop-patterns.md)). The medium label is invisible to a reader who already opened it. Open with substance: a number, a name, a claim. |
| "The two-part question ('Should the city act, or does the market clear?') is more nuanced." | Two-part engagement questions are the AI shape (ai-slop-patterns.md). Pick one clause. Single-clause questions land; compound ones stall. |
| "The vendor cratered, and the language matches the moment." | Spectacle framing reaches for verbs the facts don't earn. State the mechanic: "The vendor missed three deadlines and the contract was terminated." Mechanics over spectacle (ai-slop-patterns.md). |
| "$5.27B is the actual number from the filing, so I'll use it verbatim." | Fractional-magnitude precision past meaningful digits is an AI tic (ai-slop-patterns.md). Round to "$5.3B" or "~$5B" unless the trailing digits carry argumentative weight (e.g., "$5.27B vs. the $5.30B reported"). |
| "'That's the spine' / 'Fair hit' lands the point conversationally, so it stays." | Conversational validation and meta-commentary (ai-slop-patterns.md): assistant-voice tics where the writer stamps a verdict on their own line. If the point lands, the stamp is redundant; if it doesn't, the stamp won't save it. Delete it. Same for adverb-only fragments ("Genuinely. Quietly.") and the "one honest caveat / stated plainly" frame, which implies the rest wasn't honest. |

If a rationalization isn't on this list, write it down before acting on it. New rationalizations are the most valuable signal for the next skill iteration.

## Gotchas
- **Em dash verification must be literal.** Don't trust "I didn't use em dashes." Run `grep -c '—'` on the actual output. Claude's most common quality failure.
- **Contractions conflict with formal tone.** The 3+ contractions/paragraph rule breaks legal, regulatory, or formal business content. Ask the user if formal tone is required before forcing contractions.
- **Banned buzzword variants slip through.** "The modern digital landscape" contains "landscape" but Claude misses it because the exact phrase "In today's digital age" isn't present. Check each banned word independently, not as phrases.
- **AI slop patterns are structural, not lexical.** You can't grep for "fake vulnerability." You have to read the draft and recognize the pattern. "Unpopular opinion:" is easy to catch; "I know this might be controversial, but..." is the same pattern in disguise. Check the full reference at `references/ai-slop-patterns.md` and match on intent, not exact wording.
- **Copula avoidance has a single legitimate exception.** Legal and policy boilerplate ("This document serves as notice...") uses these constructions correctly. EVAL 9 should pass at ≤1 instance when context demands it, not strictly zero. Two or more in the same piece is the AI tic returning.
- **Self-audit must precede the pre-publish checklist, not replace it.** The checklist is lexical (catches em dashes, banned words, copula avoidance). The audit is structural (catches the residual AI shape). Run the audit, revise, then run the checklist on the revised version. A draft that "passes the checklist" without the audit will still feel AI-shaped on mandatory channels.
- **"No AI tells in this draft" is a fake audit.** If the model returns zero bullets in step 2 of the self-audit on a first draft, the audit was skipped, not passed. Push back: name 2–4 honest tells before revising.

## Learning

When executing this skill, append a JSON line to `<skill-dir>/.learnings.jsonl` when:

- **The user corrects your output** (`event_type: user_correction`). Capture the original AI phrasing and the user's revised version. Examples: em dash that slipped through, banned buzzword the user replaced, corrective reframe the user rewrote, AI tic the user cut.
- **You encounter a scenario not covered by this skill** (`event_type: edge_case`). Capture the new register, channel, or constraint. Examples: legal content needed formal tone (contractions rule conflicted), regional dialect required different cadence, accessibility constraint required different sentence structure.
- **A rationalization comes up that isn't in the Rationalization Defense table** (`event_type: edge_case`, with context `"new_rationalization"`). The new rationalizations are the most valuable signal for skill iteration. Capture the verbatim rationalization the model considered.
- **A self-audit catches a residual AI tell that none of the lexical or structural rules named** (`event_type: edge_case`, with context `"unnamed_pattern"`). These are the patterns the next skill iteration will name and add to ai-slop-patterns.md.
- **The skill produces a successful unconventional choice that the user accepted without pushback** (`event_type: user_correction` with `original` showing the rule-following draft and `corrected` showing the accepted variant). Validates voice-overrides-default rule #15 in the wild.

### Event format

```jsonl
{"timestamp":"2026-05-04T11:42:00Z","skill":"writing","event_type":"user_correction","context":"Survey-the-X-miss-the-Y parallel punchline; user swapped for plain principle statement","original":"Survey the datacenter, miss the gas plant.","corrected":"The full picture includes more than what's on site."}
{"timestamp":"2026-05-04T13:10:00Z","skill":"writing","event_type":"edge_case","context":"unnamed_pattern: literary 'Different objects' mirrored parent piece but felt overwritten on X; user swapped for 'Very different'"}
{"timestamp":"2026-05-04T14:30:00Z","skill":"writing","event_type":"edge_case","context":"new_rationalization: 'The parallel-clause punchline is X-native, so it's earned'"}
```

### Promotion to skill iteration

Periodically run `python -m scripts.promote_learnings` (skill-creator script) on the journal. Group events by theme and propose targeted patches: new banned-pattern entries for ai-slop-patterns.md, new rationalization-counter pairs for the Rationalization Defense table, new examples in the relevant rule sections.

Patterns to watch:
- Which banned phrases slip through most often? (suggests the buzzword list needs synonym expansion)
- Which formats (X, LinkedIn, web) trigger the most corrections? (suggests the format reference needs sharpening)
- When do contractions hurt rather than help? (suggests rule #15 examples to add)
- Which rationalizations recur? (suggests new rows in the defense table)
- Which channel-context overrides surface most? (suggests rule #15's "channel context modifies voice-mirror" needs more channels named)
- Which rules conflict with each other under pressure? (suggests new examples or hierarchies in rule #15)

The journal is per-installation data, not source code. `.learnings.jsonl` is gitignored at the skill root.
