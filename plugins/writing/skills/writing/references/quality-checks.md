# Binary Quality Checks

Eleven yes/no checks for evaluating writing output quality (autoresearch evals, manual review, or pre-publish gates).

**Voice context override:** EVAL 3 (contractions) and EVAL 4 (sentence rhythm) yield to captured voice context per SKILL.md rule #15. If the writer's voice signals dictate no contractions (formal register) or uniform short sentences (deliberate cadence), these evals are informational, not pass/fail. Evals 1, 2, 7, 8, 9, and 11 never yield: AI tells are always wrong regardless of voice. EVAL 10 yields to channel context: mandatory only for branded / public-facing channels.

## EVAL 1: No em dashes
**Question:** Does the output contain zero em dashes (—)?
**Pass:** Not a single em dash in the entire text.
**Fail:** Any em dash present.

## EVAL 2: No banned buzzwords
**Question:** Does the output contain zero words from the banned phrases list?
**Pass:** None of the banned phrases appear anywhere.
**Fail:** Any banned phrase detected.

## EVAL 3: Contractions present
**Question:** Does the output average 3+ contractions per paragraph?
**Pass:** Most paragraphs use natural contractions (don't, can't, won't, isn't, etc.).
**Fail:** Fewer than 3 contractions per paragraph on average.
**Yields to voice context** (formal register may legitimately suppress contractions).

## EVAL 4: Sentence rhythm
**Question:** Does the output include varied sentence lengths?
**Pass:** Mix of short (<10 words), medium (10-25 words), and long (>25 words) sentences.
**Fail:** Most sentences are similar length.
**Yields to voice context** (deliberate uniform cadence may be the writer's signature).

## EVAL 5: Specific evidence
**Question:** Does every claim include specific numbers, names, or examples within 1-2 sentences?
**Pass:** No abstract assertions without supporting specifics.
**Fail:** Any unsupported claim detected.

## EVAL 6: Strong opener
**Question:** Does the first sentence reference a specific time, place, number, or provoke curiosity?
**Pass:** Opening isn't generic.
**Fail:** Generic opening (e.g., "In today's world..." or "Communication is key...").

## EVAL 7: No AI slop patterns
**Question:** Does the output avoid throat-clearers, false exclusivity hooks, manufactured urgency, dramatic fragmentation, fake vulnerability, qualifier sandwiches, pivot hype, fake closers, and fill-in-the-blank templates?
**Pass:** Zero instances of structural AI slop patterns (see [ai-slop-patterns.md](ai-slop-patterns.md)).
**Fail:** Any throat-clearer ("Here's the thing:"), false exclusivity ("Nobody's talking about this"), urgency hook ("This changes everything"), dramatic fragment ("Let that sink in."), fake vulnerability ("Unpopular opinion:"), qualifier sandwich ("It's worth noting..."), pivot hype ("But here's where it gets interesting:"), fake closer ("Buckle up."), or template sentence detected.

## EVAL 8: No corrective reframing
**Question:** Does the output avoid the "That's not X. That's Y." pattern and its variants?
**Pass:** Zero instances of corrective reframing (or at most one deliberate structural pivot).
**Fail:** Any "That's not X. That's Y.", "This isn't X. It's Y.", "More than just X, it's Y.", "Forget X. Think Y.", parallel-clause moralistic punchlines ("Survey the X, miss the Y"), or similar construct detected.

## EVAL 9: No copula avoidance
**Question:** Does the output avoid "serves as / stands as / functions as / acts as / boasts / features / offers" as substitutes for "is" and "has"?
**Pass:** Zero copula-avoidance phrases (≤1 acceptable when context demands it, e.g., legal boilerplate).
**Fail:** Multiple copula-avoidance phrases detected.
**Greppable:** `grep -iE 'serves as|stands as|functions as|acts as|boasts a|features a|offers a'`

## EVAL 10: Self-audit pass completed (mandatory channels only)
**Question:** For X, LinkedIn, web, newsletter, or branded content, did the draft go through an explicit "what's still AI?" self-audit and revision pass?
**Pass:** Self-audit bullets shown + revised FINAL version produced.
**Fail:** Single-pass output for a mandatory channel.
**N/A:** Internal drafts, conversational replies, dev-facing docs.
**Yields to channel context** (mandatory only on branded / public-facing channels).

## EVAL 11: No editorial-edit posture tics
**Question:** Does the output avoid defensive disclaimers, section-end hedging epilogues, and "the question isn't X, it's Y" closers?
**Pass:** Zero defensive disclaimer openings ("None of that is...", "That's not to say...", "While reasonable people may..."), zero section-final hedging epilogues ("the principle is contestable...", "time will tell..."), and no "the question isn't X, it's Y" closing line.
**Fail:** Any of the above patterns present (see [editorial-edit-patterns.md](editorial-edit-patterns.md) for the full taxonomy of eight patterns; this eval covers the binary-checkable subset).
**Greppable:** `grep -iE "none of that is|that's not to say|while reasonable people|the principle is contestable|the question isn'?t.*it'?s"`

## Guard Assertions (Optimization Safety Rails)

When optimizing writing quality, these guards prevent regressions:

**GUARD 1: Word count constraints don't sacrifice quality.** Tightening word count must not cut the headline, CTA, or key evidence. If brevity hurts impact, revert.

**GUARD 2: Format-specific rules preserved.** Each format (X post, LinkedIn, newsletter, web) has its own constraints. Optimizing for one format must not break another's rules.
