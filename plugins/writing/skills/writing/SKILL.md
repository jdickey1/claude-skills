---
name: writing
description: Use when writing any content, copy, social posts, articles, blog posts, website text, emails, newsletters, headlines, descriptions, or any text that will be read by humans. Also use when reviewing or editing AI-generated text for quality.
version: 2.4.0
effort: high
---

# Writing

Universal writing standards for all content. Format-specific guidance in references/. Use slash commands for specific tasks.

## Commands

| Command | What it does |
|---------|-------------|
| `/write-x <topic>` | Write an X/Twitter post |
| `/write-linkedin <topic>` | Write a LinkedIn post |
| `/write-web <topic>` | Write website copy or blog post |
| `/write-headline <topic>` | Generate 5+ headline candidates |
| `/write-newsletter <topic>` | Write email/newsletter content |
| `/write-review <content>` | Review/edit content for AI tells |
| `/teach-writing` | Write voice/brand context to CLAUDE.md |

## Pre-Write Context Check

Before writing any content, confirm you know:

1. **Who is the audience?** (general public, developers, clients, voters, etc.)
2. **What voice/brand?** (personal, company, publication; check CLAUDE.md for voice context from `/teach-writing`)
3. **What format?** (X post, blog, newsletter, etc.; may already be clear from the command used)

If voice/brand context exists in CLAUDE.md (via `/teach-writing`), use it. If not and the audience is ambiguous, ask before writing. Don't guess at voice for branded content. A casual tone for a law firm or formal tone for a podcast social account wastes a draft.

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
| False exclusivity | "Nobody's talking about this" | If it's novel, the content proves it. Cut the hook. |
| Manufactured urgency | "This changes everything" / "Drop everything" | Show urgency with evidence (deadlines, data), don't assert it. |
| Dramatic fragmentation | "Let that sink in." / "Read that again." | Write a compelling paragraph instead. |
| Fake vulnerability | "Unpopular opinion:" / "Hot take incoming:" | If the take is bold, the content proves it. |
| Qualifier sandwiches | "It's worth noting that..." / "To be fair..." | Make the claim. Put caveats in the next sentence as new info. |
| Pivot hype | "But here's where it gets interesting:" | Transition with logic, not hype. |
| Fake closers | "Buckle up." / "We're still early." / "Act accordingly." | End with something specific: a number, name, or concrete next step. |
| AI adverb clusters | literally, incredibly, fundamentally, genuinely | Cut them. If the sentence is weaker without the adverb, rewrite the sentence. |
| Fill-in-the-blank templates | "[X] is the new [Y]." / "If you're still [old method], you're already behind." | If your sentence fits a template, it's not insight. Rewrite with specifics. |

**Scoring rule:** If a draft triggers 4+ patterns from the full list, it needs a rewrite, not a polish. The patterns compound: readers who spot one start looking for the rest.

### 14. Earned Language Over Credential-Dropping

Don't just list what you are. Show that you earned it. "Diligence and fidelity to mission that earned a spot on the Newman Guide" is stronger than "a Newman Guide institution." The reader respects achievement more than status.

### 15. Preserve Idiosyncrasies, Don't Auto-Smooth

Captured voice beats generic "good writing." When a writer's voice context (from `/teach-writing`, project CLAUDE.md, or explicit instruction) contains deliberate stylistic quirks, preserve them even when they conflict with the universal rules above.

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

Then mirror those signals in the rewrite. Don't just remove AI patterns, replace them with patterns from the sample. If they write short sentences, don't produce long ones. If they say "stuff" and "things," don't upgrade to "elements" and "components." Inline samples are one-shot; persistent voice context (`/teach-writing` or project CLAUDE.md) wins for ongoing work.

**What's NOT an idiosyncrasy:** Em dashes (rule #1), banned AI buzzwords (rule #2), AI slop patterns (rule #13, throat-clearers, fake vulnerability, pivot hype, fake closers, etc.), corrective reframing (rule #10), copula avoidance (rule #16), and inline-header vertical lists (rule #17) are always wrong. Those aren't voice choices, they're AI tells. Rule #15 protects deliberate human quirks, not AI artifacts. If a captured voice corpus contains these patterns, they're contamination from AI editing, not real voice. Strip them.

**Why this rule exists:** Applying every universal rule maximally smooths output toward a generic "competent" register that reads as AI-processed even when it's technically "correct." The writer's quirks are the fingerprint. Don't polish them out.

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

**Why:** Rule #13 catches AI's *writing* tics. This rule catches AI's *editing* tics — the moves even careful AI prose makes because the model lacks an editor's reflexes. A human editor cuts these on first pass; doing it before delivery saves the round-trip.

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

## Self-Audit Pass

Before finalizing branded or public-facing content, run a second-pass self-audit. Drafts that *technically* clear the universal rules can still feel AI-shaped because patterns compound in ways no checklist enumerates. The audit forces the model to look at its own draft as a critic.

**Mandatory for:**
- X / Twitter posts (`/write-x`)
- LinkedIn posts (`/write-linkedin`)
- Web copy and blog posts (`/write-web`)
- Newsletters (`/write-newsletter`)
- Any content under a brand identity (Hyperscale, JD Key, Winning on Issues, Sharper Stories, DLG, Link2s, PodStyle Video, VidPublish, TRU)
- Anything `/write-review` is reviewing

**Optional for:**
- Internal scratch drafts and conversational replies
- Plans, specs, and developer-facing docs

**The pass (run in this order, don't skip a step):**

1. **Hold the draft.** Have the leading draft (or selected variation) ready.
2. **Self-critique.** Ask explicitly: *"What makes this still obviously AI-generated?"* Answer in 2–4 honest bullets. Look for: structural patterns the lexical rules don't catch, evenly-paced rhythm, "clean but soulless" cadence, copula avoidance that slipped through, inline-header lists, qualifier sandwiches, throat-clearers, dramatic fragments, AI vocabulary not on the banned list but still off.
3. **Revise.** Produce a final version that addresses each tell from step 2. The revision should rewrite affected sentences, not search-and-replace single words.
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

**Why this exists:** Lexical rules (banned buzzwords, em dashes, contractions) catch words. Structural rules (rules #10, #13, #16, #17) catch named constructions. The self-audit catches the residual *shape* of AI prose — patterns we haven't yet named — and cuts them before content goes public. Anything Hyperscale, JD Key, or any other brand publishes hits readers who pattern-match on AI output instantly; the audit is the last guard against that signal.

## Binary Quality Checks

When evaluating writing output quality (for autoresearch or manual review), use these binary yes/no checks.

**Voice context override:** EVAL 3 (contractions) and EVAL 4 (sentence rhythm) yield to captured voice context per rule #15. If the writer's voice signals dictate no contractions (formal register) or uniform short sentences (deliberate cadence), these evals are informational, not pass/fail. Evals 1, 2, 7, 8, and 9 never yield: AI tells are always wrong regardless of voice. EVAL 10 yields to channel context: mandatory only for branded / public-facing channels.

**EVAL 1: No em dashes**
Question: Does the output contain zero em dashes (—)?
Pass: Not a single em dash in the entire text
Fail: Any em dash present

**EVAL 2: No banned buzzwords**
Question: Does the output contain zero words from the banned phrases list?
Pass: None of the banned phrases appear anywhere
Fail: Any banned phrase detected

**EVAL 3: Contractions present**
Question: Does the output average 3+ contractions per paragraph?
Pass: Most paragraphs use natural contractions (don't, can't, won't, isn't, etc.)
Fail: Fewer than 3 contractions per paragraph on average

**EVAL 4: Sentence rhythm**
Question: Does the output include varied sentence lengths?
Pass: Mix of short (<10 words), medium (10-25 words), and long (>25 words) sentences
Fail: Most sentences are similar length

**EVAL 5: Specific evidence**
Question: Does every claim include specific numbers, names, or examples within 1-2 sentences?
Pass: No abstract assertions without supporting specifics
Fail: Any unsupported claim detected

**EVAL 6: Strong opener**
Question: Does the first sentence reference a specific time, place, number, or provoke curiosity?
Pass: Opening isn't generic
Fail: Generic opening (e.g., "In today's world..." or "Communication is key...")

**EVAL 7: No AI slop patterns**
Question: Does the output avoid throat-clearers, false exclusivity hooks, manufactured urgency, dramatic fragmentation, fake vulnerability, qualifier sandwiches, pivot hype, fake closers, and fill-in-the-blank templates?
Pass: Zero instances of structural AI slop patterns (see references/ai-slop-patterns.md)
Fail: Any throat-clearer ("Here's the thing:"), false exclusivity ("Nobody's talking about this"), urgency hook ("This changes everything"), dramatic fragment ("Let that sink in."), fake vulnerability ("Unpopular opinion:"), qualifier sandwich ("It's worth noting..."), pivot hype ("But here's where it gets interesting:"), fake closer ("Buckle up."), or template sentence detected

**EVAL 8: No corrective reframing**
Question: Does the output avoid the "That's not X. That's Y." pattern and its variants?
Pass: Zero instances of corrective reframing (or at most one deliberate structural pivot)
Fail: Any "That's not X. That's Y.", "This isn't X. It's Y.", "More than just X, it's Y.", "Forget X. Think Y.", or similar construct detected

**EVAL 9: No copula avoidance**
Question: Does the output avoid "serves as / stands as / functions as / acts as / boasts / features / offers" as substitutes for "is" and "has"?
Pass: Zero copula-avoidance phrases (≤1 acceptable when context demands it, e.g., legal boilerplate)
Fail: Multiple copula-avoidance phrases detected
Greppable: `grep -iE 'serves as|stands as|functions as|acts as|boasts a|features a|offers a'`

**EVAL 10: Self-audit pass completed (mandatory channels only)**
Question: For X, LinkedIn, web, newsletter, or branded content, did the draft go through an explicit "what's still AI?" self-audit and revision pass?
Pass: Self-audit bullets shown + revised FINAL version produced
Fail: Single-pass output for a mandatory channel
N/A: Internal drafts, conversational replies, dev-facing docs

## Guard Assertions

When optimizing writing quality, these guards prevent regressions:

**GUARD 1: Word count constraints don't sacrifice quality**
Tightening word count must not cut the headline, CTA, or key evidence. If brevity hurts impact, revert.

**GUARD 2: Format-specific rules preserved**
Each format (X post, LinkedIn, newsletter, web) has its own constraints. Optimizing for one format must not break another's rules.

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
- [ ] Zero corrective reframes ("That's not X. That's Y." and all variants): one max, zero ideal
- [ ] Zero copula avoidance ("serves as", "stands as", "boasts", "features" — see rule #16)
- [ ] Zero inline-header vertical lists where the bold label just restates the line (rule #17)
- [ ] Self-audit pass completed (mandatory for X, LinkedIn, web/blog, newsletter, branded content; see Self-Audit Pass section)
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

## Gotchas
- **Em dash verification must be literal.** Don't trust "I didn't use em dashes." Run `grep -c '—'` on the actual output. Claude's most common quality failure.
- **Contractions conflict with formal tone.** The 3+ contractions/paragraph rule breaks legal, regulatory, or formal business content. Ask the user if formal tone is required before forcing contractions.
- **Banned buzzword variants slip through.** "The modern digital landscape" contains "landscape" but Claude misses it because the exact phrase "In today's digital age" isn't present. Check each banned word independently, not as phrases.
- **AI slop patterns are structural, not lexical.** You can't grep for "fake vulnerability." You have to read the draft and recognize the pattern. "Unpopular opinion:" is easy to catch; "I know this might be controversial, but..." is the same pattern in disguise. Check the full reference at `references/ai-slop-patterns.md` and match on intent, not exact wording.
- **Copula avoidance has a single legitimate exception.** Legal and policy boilerplate ("This document serves as notice...") uses these constructions correctly. EVAL 9 should pass at ≤1 instance when context demands it, not strictly zero. Two or more in the same piece is the AI tic returning.
- **Self-audit must precede the pre-publish checklist, not replace it.** The checklist is lexical (catches em dashes, banned words, copula avoidance). The audit is structural (catches the residual AI shape). Run the audit, revise, then run the checklist on the revised version. A draft that "passes the checklist" without the audit will still feel AI-shaped on mandatory channels.
- **"No AI tells in this draft" is a fake audit.** If the model returns zero bullets in step 2 of the self-audit on a first draft, the audit was skipped, not passed. Push back: name 2–4 honest tells before revising.

## Learning

When this skill runs, append observations to `.learnings.jsonl` in the skill directory:

```json
{"timestamp": "ISO-8601", "skill": "writing", "event_type": "user_correction", "context": "User corrected em dash that slipped through"}
{"timestamp": "ISO-8601", "skill": "writing", "event_type": "edge_case", "context": "Legal content needed formal tone: contractions rule conflicted"}
```

Track these patterns:
- Which banned phrases slip through most often?
- Which formats (X, LinkedIn, web) trigger the most corrections?
- When do contractions hurt rather than help? (formal contexts)
- Which rules conflict with each other under pressure?
