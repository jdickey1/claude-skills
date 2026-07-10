# AI Slop Patterns - Full Reference

Comprehensive catalog of AI-generated writing patterns to actively avoid. Sourced from the AISLOPOPEDIA by @Saboo_Shubham_ and expanded with observed patterns.

## Contents

| # | Pattern | What it is |
|---|---|---|
| 1 | [Throat-Clearers](#throat-clearers) | Phrases that delay the actual point |
| 2 | [Time-Deixis (Self-Reference to the Medium)](#time-deixis-self-reference-to-the-medium) | "Today's newsletter dives into..." medium-pointing |
| 3 | [False Exclusivity Hooks](#false-exclusivity-hooks) | "Nobody's talking about this" framing |
| 4 | [Manufactured Urgency](#manufactured-urgency) | "This changes everything" hype |
| 5 | [Dramatic Fragmentation](#dramatic-fragmentation) | "Let that sink in." reader-direction |
| 6 | [Fake Vulnerability](#fake-vulnerability) | "Unpopular opinion:" performative humility |
| 7 | [False Agency](#false-agency) | Crediting non-agent things with action |
| 8 | [Ladder of Escalation](#ladder-of-escalation) | "Not just X, but Y, but Z" tower |
| 9 | [Pivot Phrases](#pivot-phrases) | "But here's where it gets interesting:" |
| 10 | [Parallel-Clause Moralistic Punchlines](#parallel-clause-moralistic-punchlines) | "Survey the X, miss the Y" snap |
| 11 | [Qualifier Sandwiches](#qualifier-sandwiches) | "It's worth noting that..." hedging |
| 12 | [Call-to-Action Slop](#call-to-action-slop) | "Drop a comment below" begging |
| 13 | [Two-Part Engagement Questions](#two-part-engagement-questions) | "Should X, or does Y?" balanced-question tic |
| 14 | [Fake Philosophical Closers](#fake-philosophical-closers) | "We're still early." mock-profound |
| 15 | [AI Adverbs (Flag Words)](#ai-adverbs-flag-words) | literally / incredibly / fundamentally |
| 16 | [AI Adjectives (Empty Intensifiers)](#ai-adjectives-empty-intensifiers) | profound / remarkable / unprecedented |
| 17 | [AI Verbs (Sounds Smart, Says Nothing)](#ai-verbs-sounds-smart-says-nothing) | delve / unpack / leverage |
| 18 | [Fill-in-the-Blank Templates](#fill-in-the-blank-templates) | "[X] is the new [Y]." |
| 19 | [Significance Inflation](#significance-inflation) | Treating ordinary things as historic |
| 20 | [Spectacle Framing Around Failure](#spectacle-framing-around-failure) | "The deal cratered. Vendors walked." pile-up |
| 21 | [Fractional-Magnitude Precision](#fractional-magnitude-precision) | "$5.27B" when "$5B" is the signal |
| 22 | [Synonym Cycling (Elegant Variation)](#synonym-cycling-elegant-variation) | Renaming the same thing every paragraph |
| 23 | [Filler and Hedging Bloat](#filler-and-hedging-bloat) | "in order to" / "the fact that" |
| 24 | [Curly Quotes and Em-Char Drift](#curly-quotes-and-em-char-drift) | Typographic AI fingerprints |
| 25 | [Conversational Validation and Meta-Commentary](#conversational-validation-and-meta-commentary) | "That's the spine." / "Fair hit." / assistant-voice tics |
| 26 | [Self-Assessment](#self-assessment) | The 4+ pattern rule for full rewrite |

## Throat-Clearers

Phrases that exist solely to delay the actual point by one sentence. Cut them entirely.

| Pattern | Why it's slop |
|---------|--------------|
| "Here's the thing:" | Delays the point |
| "Here's what most people miss:" | False exclusivity + delay |
| "Here's what nobody's talking about:" | Both a throat-clearer and false exclusivity |
| "Here's the uncomfortable truth:" | Manufactured drama |
| "Let me be clear:" | Empty authority signal |
| "I'll be honest:" | Implies you're usually not |
| "Can we talk about [X] for a second?" | Fake conversational tone |
| "Let's talk about [X]." | Same |
| "We need to talk about [X]." | Same with false urgency |

**The formula:** "Here's + [dramatic noun]" = nothing interesting to open with.

**Fix:** Delete the throat-clearer. Start with the actual point.

## Time-Deixis (Self-Reference to the Medium)

A throat-clearer in disguise. The opener points at the medium itself ("today's newsletter," "today's post," "in this brief we'll explore...") instead of the substance. It signals AI scaffolding, adds zero information for the reader who already opened the email or clicked the post, and dates the content the moment the next issue ships.

| Pattern |
|---------|
| "Today's newsletter dives into..." |
| "In today's post, we'll explore..." |
| "This week's brief covers..." |
| "Today's edition is all about..." |
| "In this article we'll discuss..." |
| "Today's episode breaks down..." |
| "In today's brief, we look at..." |

**Fix:** Open with the substance directly.

- Wrong: "Today's newsletter dives into the Texas datacenter water question."
- Right: "Texas datacenter operators returned 1M gallons a day. They pulled 11,000."

**Why:** Self-reference to the medium is a ramp-up the writer hides behind because the real opener feels too cold. The reader already knows what they opened. Cut the framing and start where the story starts.

**Greppable check:** `grep -iE "(today's|this (week|month)'s) (newsletter|post|brief|article|episode|edition)|in (today's|this) (post|article|newsletter|brief|episode)" draft.md`. Any hit flags AI scaffolding to delete.

## False Exclusivity Hooks

Making the reader feel like they're receiving classified intelligence when they're not.

| Pattern |
|---------|
| "This is the part most people skip." |
| "Most people won't tell you this." |
| "Nobody's talking about this." |
| "Everyone's sleeping on this." |
| "This flew under the radar." |
| "I wasn't supposed to share this, but..." |
| "What they don't want you to know:" |
| "The thing nobody tells beginners:" |
| "The secret that [industry] doesn't want you to know:" |
| "I've been sitting on this for weeks." |

**Fix:** If the information is genuinely novel, the content proves it. If it's not, the hook is a lie. Either way, cut the hook.

## Manufactured Urgency

Creating artificial time pressure on information that has no expiration date.

| Pattern |
|---------|
| "Stop what you're doing." |
| "Drop everything." |
| "Read this before [X]." |
| "If you haven't seen this yet..." |
| "You're going to want to bookmark this." |
| "Save this before it gets taken down." |
| "This changes everything." |
| "This is bigger than people realize." |
| "[X] just changed the game forever." |

**Fix:** If it's urgent, show why with evidence (a deadline, a market move, a regulatory change). Don't assert urgency.

## Dramatic Fragmentation

Short. Sentences. For. Effect. Except it's not effective anymore.

| Pattern |
|---------|
| "Let that sink in." |
| "Read that again." |
| "Full stop." |
| "Period." |
| "That's it. That's the tweet." |
| "This. Is. The. Future." |
| "Sit with that for a second." |
| "I'll say it louder for the people in the back." |

**Fix:** Write a compelling paragraph instead. If your point needs "read that again" to land, the point isn't landing.

## Fake Vulnerability

Manufactured relatability to create parasocial trust.

| Pattern |
|---------|
| "I'm going to be honest with you." |
| "I wasn't going to post this, but..." |
| "This is scary to share." |
| "Hot take incoming (don't hate me):" |
| "Unpopular opinion:" |
| "I know I'll get hate for this, but..." |
| "I've never said this publicly before." |
| "This might ruffle some feathers." |
| "I might lose followers for this, but..." |

**Reality:** The "unpopular opinion" is always something 95% of people agree with.

**Fix:** If your take is actually bold, the content proves it. If you need to pre-frame it as bold, it probably isn't.

## False Agency

Giving inanimate things human powers to avoid naming who actually did something.

| Pattern |
|---------|
| "The data speaks for itself." |
| "The market has spoken." |
| "The numbers don't lie." |
| "This technology wants to..." |
| "AI is coming for your [X]." |
| "The industry is waking up to..." |
| "The results were eye-opening." |
| "The implications are staggering." |
| "This opens up a world of..." |
| "The possibilities are endless." |

**Fix:** Name the actor. "Analysts at Goldman revised their forecast" beats "The market has spoken."

## Ladder of Escalation

Three items, ascending intensity. Works every time. Which is why it now means nothing.

| Pattern |
|---------|
| "It's fast. It's free. It's open source." |
| "No signup. No API key. No credit card." |
| "One file. One command. One click." |
| "Not a prototype. Not a demo. Production-ready." |

**Fix:** If three features matter, explain why each matters individually. The tricolon structure is a signal, not substance.

## Pivot Phrases

How AI moves between paragraphs when it has no actual connective logic.

| Pattern |
|---------|
| "But here's where it gets interesting:" |
| "And here's the kicker:" |
| "But that's not even the best part." |
| "Wait, it gets better." |
| "But here's what really stood out:" |
| "Now here's the thing:" |
| "But the real story is:" |
| "And that's just the beginning." |
| "But wait, there's more." |
| "The plot thickens." |
| "Enter: [X]." |

**Fix:** If the next paragraph is interesting, it'll show. Transition with logic, not hype.

## Parallel-Clause Moralistic Punchlines

A close cousin of the corrective reframe (rule #10), without the explicit negation. The writer compresses a moral into a "[verb A], [verb B]" parallel where the second clause exposes what the first misses.

| Pattern |
|---------|
| "Survey the datacenter, miss the gas plant." |
| "Watch the speaker, miss the policy." |
| "Trust the headline, lose the story." |
| "Read the contract, miss the fine print." |
| "Hire the resume, lose the candidate." |
| "Fix the symptom, ignore the cause." |
| "Optimize the metric, miss the goal." |

The shape is the tell: short, balanced, two clauses, second clause is the "gotcha." It feels earned by the medium (especially on X, where compression is a virtue) but it's the same AI rhetorical move as "That's not X. That's Y.": the writer telling the reader what to take away instead of letting the evidence do the work.

**Fix:** State the principle directly. "Most of the water cost sits upstream of the facility" is what the punchline was trying to compress. The plainer line lands harder because it's a claim, not a snap. If the evidence in the surrounding tweets/paragraphs is doing its job, the moral follows without the gotcha.

**Test:** If the second clause is doing all the rhetorical work and the first clause is just a setup, you've got a punchline, not a sentence. Rewrite as a claim.

## Qualifier Sandwiches

Hedging before and after every claim to avoid being wrong about anything.

| Pattern |
|---------|
| "It's worth noting that..." |
| "To be fair..." |
| "That said..." |
| "To be clear..." |
| "Now, I'm not saying X, but..." |
| "Don't get me wrong..." |
| "This isn't to say that..." |
| "With the caveat that..." |
| "Granted, [obvious counterpoint]..." |

**Fix:** Make your claim. If it needs a caveat, put it in the next sentence as new information, not as a hedge around the original claim.

## Call-to-Action Slop

LinkedIn's final boss. Engagement farming disguised as conversation.

| Pattern |
|---------|
| "What do you think? Drop your take below" |
| "Agree or disagree? Let me know." |
| "What would you add to this list?" |
| "Follow for more [X] content." |
| "Repost if this resonated" |
| "Share this with someone who needs to see it." |
| "Save this for later" |
| "Tag someone who needs to hear this." |
| "If this helped, you'll love my newsletter." |
| "Link in comments" |

**Fix:** If your content is good, people engage. If it's not, begging won't help. One natural CTA max per piece.

## Two-Part Engagement Questions

A close cousin of Call-to-Action Slop. The closer asks a rhetorical question, then bolts on a second clause that "balances" the first ("Should X, or does Y?" / "Should X, or is Y?" / "Will X, or are we just Y?"). The second clause dilutes the prompt and exposes the AI move: every question must hedge itself.

| Pattern |
|---------|
| "Should X replace Y, or does the price point only pencil at scale?" |
| "Is this the future, or are we kidding ourselves?" |
| "Will X happen, or will Y get there first?" |
| "Should we worry, or is this just noise?" |
| "Is X overhyped, or have we under-counted Y?" |

**Fix:** Cut everything from the comma onward. One clean rhetorical move beats a balanced one.

- Wrong: "Should fuel cell microgrids replace gas turbines as the default behind-the-meter spec, or does the price point only pencil at hyperscaler scale?"
- Right: "Should fuel cell microgrids replace gas turbines as the default behind-the-meter spec?"

**Why:** Real human questions land as a single move. The "or does Y" tail is the model trying to cover both sides because it can't commit to the prompt. The shape is the tell; you can spot it without reading the content.

**Greppable check:** `grep -iE ', or (does|is|will|are|do|has|have|should|could) ' draft.md`. Inspect each hit; any that lands inside a question (line ending in `?`) is this pattern. False positives in declarative sentences are fine.

## Fake Philosophical Closers

Ending with a profound-sounding sentence that says absolutely nothing.

| Pattern |
|---------|
| "The question isn't whether, but when." |
| "We're still early." |
| "The best time to start was yesterday. The second best time is now." |
| "This is just the beginning." |
| "The genie is out of the bottle." |
| "Buckle up." |
| "Welcome to the future." |
| "And we're just getting started." |
| "That's not a prediction. That's a fact." |
| "Think about that." |
| "This is the new normal." |
| "Act accordingly." |
| "[X] will never be the same." |

**Fix:** End with something specific. A number, a name, a concrete next step. Vague profundity is the opposite of a strong close.

## AI Adverbs (Flag Words)

Three or more of these in a paragraph is an AI fingerprint.

literally, incredibly, fundamentally, genuinely, essentially, significantly, arguably, undeniably, remarkably, interestingly, notably, particularly, ultimately

**Fix:** Cut them. If the sentence is weaker without the adverb, the sentence needs rewriting, not intensifying.

## AI Adjectives (Empty Intensifiers)

Vague intensifiers that could describe literally anything.

robust, seamless, cutting-edge, groundbreaking, revolutionary, transformative, comprehensive, holistic, game-changing, next-level, world-class

**Fix:** Replace with the specific thing that makes it good. "Seamless integration" = "installs in one command." "Groundbreaking research" = "first study to measure X in Y population."

## AI Verbs (Sounds Smart, Says Nothing)

leverage, navigate (challenges), unpack (concepts), double down, spearhead, supercharge, unlock, streamline, reimagine, synergize

**Fix:** Use the plain verb. "Leverage AI" = "use AI." "Navigate challenges" = "solve problems." "Unpack this concept" = "explain this."

## Fill-in-the-Blank Templates

If your sentence fits one of these templates, rewrite it:

1. "[X] isn't just [obvious thing]. It's [grander reframe]."
2. "The best [role] don't [common action]. They [elevated action]."
3. "In [year], [X] won't be optional. It'll be table stakes."
4. "I stopped [common approach] and started [better approach]. The results speak for themselves."
5. "[X] is the new [Y]."
6. "If you're still [old method], you're already behind."
7. "[X] did in [short time] what used to take [long time]."
8. "The [role] of 2026 will look nothing like the [role] of 2024."
9. "[X] that [verb] will thrive. [X] that don't will be left behind."
10. "Your [X] is only as good as your [Y]."

## Significance Inflation

LLMs puff up the importance of arbitrary facts by adding "stands as / serves as / marks / underscores" claims. The structural pattern is broader than the buzzwords in the main writing skill. Even with the bad words swapped out, the shape persists.

| Pattern |
|---------|
| "stands as a testament to..." |
| "serves as a reminder that..." |
| "marks a pivotal moment in..." |
| "underscores the significance of..." |
| "represents a shift toward..." |
| "highlights the broader trend of..." |
| "reflects deeply rooted values of..." |
| "sets the stage for..." |
| "leaves an indelible mark on..." |
| "speaks to the enduring legacy of..." |

**Fix:** Strip the inflation. State the fact directly. "The Statistical Institute of Catalonia was established in 1989 to publish regional statistics" beats "...marking a pivotal moment in the evolution of regional statistics in Spain."

## Spectacle Framing Around Failure

When a person, company, or project stumbles, AI reaches for cinematic vocabulary that turns the failure into the subject of a case study. Pile-up verbs (*cratered, unraveled, walked, empty dirt*), cascade framing (*everything else followed, body count*), wry asides (*the market noticed, lesson writes itself*), and cautionary/teachable/object-lesson positioning all signal the same move: the writer narrating *at* the failure instead of reporting *through* it.

| Pattern |
|---------|
| "The deal cratered." |
| "Vendors walked." |
| "Then everything else followed." |
| "The lesson writes itself." |
| "It's a cautionary tale." |
| "A textbook case of [thing]." |
| "And the market noticed." |
| "Just empty dirt now." |
| "A teachable moment for [industry]." |
| "The body count piled up." |

**Fix:** The fact gets one plain clause. The story is the mechanics. Name what was actually committed (anchor tenants, secured generation, signed contracts, queue position, regulatory approvals) and let the reader infer where the gap is. The struggling subject is a data point, not the protagonist of a parable.

- Wrong: "The deal cratered. Vendors walked. Then everything else followed. The lesson writes itself."
- Right: "Three of five anchor tenants pulled out by Q2; the project lost transmission priority when the interconnect deadline slipped."

**Why:** Spectacle framing makes the writer the storyteller of someone else's loss. Readers feel the rubbernecking. Mechanics-first writing respects both the subject and the reader, and it scales: the same posture works for business failures, political losses, product flops, and personnel exits.

## Fractional-Magnitude Precision

AI preserves fractional precision in dollar magnitudes that adds no information ("$1.43B," "$847M," "$5.27B"). Human business writing rounds to whole units with the right magnitude suffix. The over-precise number is the tell: a model copy-pasting from source data instead of editing for the reader.

| Pattern |
|---------|
| "$1.43B committed to..." |
| "Aligned committed $5.27B to the buildout..." |
| "Earmarked $847M for..." |
| "A $2.31B raise..." |
| "$632M in capex..." |
| "$11.84B market cap..." |

**Fix:** Round aggressively. One decimal max for $1B–$10B; whole units below $100M unless the digits carry meaning.

- Wrong: "Aligned committed $5.27B to the Project Caprock buildout, with $1.43B earmarked for substation upgrades."
- Right: "Aligned committed $5B to Project Caprock, with $1.4B for substation upgrades."

**Why:** Fractional precision implies a level of accounting the reader rarely needs and the writer rarely has. Round numbers signal that the writer made an editorial choice. Two-decimal numbers signal that the writer didn't.

**Exception:** When the precise digits do work (a quarterly earnings number where the cent matters, a court ruling where the exact award is the story, a regulatory cap set to the dollar), keep them. The test: does removing the decimal change what the reader knows? If yes, keep it. If not, round.

## Synonym Cycling (Elegant Variation)

AI's repetition-penalty code makes it cycle through synonyms when humans would just repeat the noun. Three different ways to refer to the same person in three sentences is an AI fingerprint.

| Pattern |
|---------|
| "The protagonist... the main character... the central figure... the hero..." |
| "The company... the firm... the organization... the enterprise..." |
| "Researchers... scientists... investigators... experts..." |
| "The product... the offering... the solution... the platform..." |

**Fix:** Pick the clearest noun and repeat it. Repetition is fine. Synonym cycling is a tell. The exception is genuine variety: if "researchers" and "scientists" mean different groups in your piece, fine; if they're the same people in different sentences, pick one.

## Filler and Hedging Bloat

Padding that adds words without adding meaning. Each pattern looks innocuous individually; together they balloon prose by 20-30% with zero new information.

**Filler phrases → trims:**

| Bloat | Trim |
|-------|------|
| "in order to" | "to" |
| "due to the fact that" | "because" |
| "at this point in time" | "now" |
| "in the event that" | "if" |
| "has the ability to" | "can" |
| "it is important to note that" | (delete) |
| "for the purpose of" | "to" |
| "with regard to / in regards to" | "about" / "on" |
| "the fact that" | (often deletable) |
| "in spite of the fact that" | "although" |

**Hedging stacks:**

| Pattern |
|---------|
| "could potentially possibly..." |
| "may have some impact on..." |
| "might arguably be considered..." |
| "tends to generally suggest that..." |
| "appears to perhaps indicate..." |

**Fix:** One hedge max per claim. "May" or "might," not both. Cut "potentially," "arguably," "generally" entirely unless they're load-bearing.

## Curly Quotes and Em-Char Drift

ChatGPT (and Word's autocorrect) substitutes Unicode "smart" characters for ASCII. In drafts that pass through AI, the giveaway is mixed quote styles: straight quotes the human typed, curly quotes the AI generated.

**Watch for:**

- Curly double quotes (`U+201C` / `U+201D`) instead of straight `"`
- Curly single quotes / apostrophes (`U+2018` / `U+2019`) instead of straight `'`
- Ellipsis character (`U+2026`) instead of three periods `...`
- En dash (`U+2013`) instead of hyphen `-`
- Non-breaking space (`U+00A0`) instead of regular space (often invisible)

**Fix:** Run a literal grep on the final draft. Use ASCII straight quotes and three-period ellipsis unless the brand style guide explicitly requires otherwise. Some long-form web publications style-guide curly quotes in; most platforms (X, LinkedIn, plain email) should use straight.

**Greppable check:** `grep -P '[\x{2018}\x{2019}\x{201C}\x{201D}\x{2013}\x{2014}\x{2026}]' draft.md`. Any output flags AI residue.

## Conversational Validation and Meta-Commentary

The register of an assistant talking *to* you, leaking onto the page. Instead of writing the point, the text stamps a verdict on it, concedes to an imagined interlocutor, or invites reflection nobody asked for. In a chat window these read as engagement signals; in prose they read as an AI narrating its own text instead of writing it. The tell is uniform: delete the fragment and the surrounding sentence loses nothing.

**1. Verdict stamps.** Pointing at something just said and rating its significance with a short noun-phrase.

| Pattern |
|---------|
| "That's the spine." |
| "That's the whole thing." |
| "That's doing real work." |
| "A real observation." |
| "That's the real insight." |
| "That's the tension." |
| "That's the move." |
| "That's the point." (as a standalone verdict beat) |

**2. Conceding and coaching.** The assistant's conversational-feedback voice: granting a point, then telling the reader how to improve it.

| Pattern |
|---------|
| "Fair hit." / "Fair point." |
| "Sharpen that: say the word." |
| "Notice the arc of what just happened." |
| "Say the quiet part." |
| "Name the thing." |

**3. Reflection prompts (therapy-speak).** Inviting contemplation the reader didn't ask for. Close cousin of Dramatic Fragmentation (#5).

| Pattern |
|---------|
| "That's something to sit with." |
| "Let that land." |
| "There's something here." |
| "Sit with that." |

**4. Adverb-only emphasis fragments.** A one-word sentence made of an adverb: faux-gravitas with no verb behind it. Overlaps the AI Adverbs flag list (#15), but the tell here is the *fragment*, not the density.

| Pattern |
|---------|
| "Genuinely." |
| "Quietly." (as a standalone beat) |
| "Honestly." (as emphasis, not a real qualifier) |
| "Truly." |

**Also: the "honest / plain" frame.** "One honest caveat...", "stated plainly," "to put it plainly," "let me be honest" all imply the surrounding text was neither honest nor plain. If the caveat matters, just state it. Don't announce its honesty. (This is a hard rule for James's content: never label a section "the honest part" — it implies the rest is dishonest.)

**Why it's slop:** Same core sin as corrective reframing (rule #10) and the talk-down moves in rule #13: the writer stepping in front of the evidence to tell the reader how to weigh it. A verdict stamp is the writer grading their own sentence. If a point needs "that's the whole thing" to signal it matters, it isn't landing on its own — rewrite the point, don't stamp it.

**Fix:** Delete the fragment. Let the sentence it points at stand alone.

- Wrong: "The water returns upstream, not on site. That's the whole thing. Genuinely."
- Right: "The water returns upstream, not on site."
- Wrong: "You're conflating capacity with generation. Fair hit. Sharpen that: say the word."
- Right: "You're conflating capacity with generation."

**Greppable check:** `grep -inE "that's (the |doing real)|fair (hit|point)|something to sit with|a real (observation|insight)|the arc of what|say the (word|quiet part)|let that (land|sink)" draft.md`. Read each hit; any that's the writer stamping a verdict on their own line, rather than a real claim, is this pattern.

## Self-Assessment

Count how many of these patterns appear in a draft:

| Count | Level | Diagnosis |
|-------|-------|-----------|
| 0-3 | Clean | Probably human |
| 4-5 | Mild | Reading too much LinkedIn |
| 6-10 | Moderate | Using AI to "polish" |
| 11-20 | Severe | Prompting "write a post about X" |
| 21+ | Terminal | You ARE the AI |
