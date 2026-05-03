# Editorial Edit Patterns

Patterns derived from real editorial passes on AI-drafted long-form work — the moves a careful editor makes that the lexical rules and slop-pattern sweeps don't fully catch. Each pattern below pairs the AI draft's instinct with the human editor's correction, plus the reasoning that makes the correction durable rather than stylistic.

**When to apply:** Run this pass after the universal rules and after [ai-slop-patterns.md](ai-slop-patterns.md), before final delivery on branded or long-form content. The patterns here catch *posture* issues — what the prose is doing rhetorically, not what words it's using.

**Relationship to other rules:**
- Universal Rules #1–#17 catch lexical mistakes (wrong words, wrong constructions).
- AI Slop Patterns catch *named* AI moves (throat-clearers, fake closers, etc.).
- Editorial Edit Patterns catch *posture* moves — the things AI does because it lacks an editor's reflexes.

---

## 1. Cut Defensive Disclaimers

**The pattern:** Preempting an imagined critique with a sentence that defends the analysis from a reader who hasn't pushed back yet.

**Before:** "None of that is a defense of any individual datacenter project. It's a reminder that 'uses water' is a category Texas has been managing across a dozen industrial sectors for decades..."

**After:** "All of that is a reminder that 'uses water' is a category Texas has been managing across a dozen industrial sectors for decades..."

**The fix:** Delete the disclaimer. State the point.

**Why:** Defensive disclaimers signal the writer's anxiety about being misread, telegraph that the analysis is contestable, and ask the reader to interpret the next line generously. They are cousins of corrective reframing (Rule #10) but with a different motive — corrective reframing performs rhetorical drama, defensive disclaimers perform self-protection. Cut both, for different reasons.

**Tells to grep for:** "None of that is...", "That's not to say...", "While reasonable people may...", "This isn't to suggest...", "I'm not arguing that..."

---

## 2. Cut Hedging Epilogues at Section Ends

**The pattern:** Closing a section with a paragraph that softens the analysis just made — "this is contestable," "time will tell," "whether this generalizes is an open question."

**Before:** *[Strong analytical case made over three paragraphs.]* "The principle is contestable. The mechanism is real, and the case proves out a small version of it. Whether other operators replicate the play, and at what scale, is one of the open questions of the next decade."

**After:** *[Hedging paragraph deleted entirely.]*

**The fix:** Delete it. If the case is made with evidence, the reader can judge generalizability themselves.

**Why:** Hedging epilogues read as apologizing for the analysis. They undercut the work that just landed. They are related to qualifier sandwiches (in the AI Slop Patterns reference) but live specifically at section closes — the worst possible position, because they are the last thing the reader carries forward into the next section.

**Tells to grep for:** Section-final paragraphs starting with "The principle is contestable," "Whether this...", "Time will tell," "Of course, none of this...", "It remains to be seen..."

---

## 3. Add Precision Qualifiers When Absolutes Overstate

**The pattern:** Stating an absolute claim when the truth is conditional. The inverse of qualifier sandwiches: this rule catches *under-hedged* claims, not over-hedged ones.

**Before:** "A facility that runs zero on-site water hasn't eliminated water from its operating footprint. It's moved the water cost to the power plant."

**After:** "A facility that runs zero on-site water hasn't *always* eliminated water from its operating footprint. It's *sometimes* moved the water cost to the power plant."

**The fix:** Add "always," "sometimes," "in those cases," or similar — the smallest qualifier that makes the sentence accurate.

**Why:** When the article's whole argument is about variance and conditional truth, an absolute claim mid-piece contradicts the argument. The form fights the content. Small qualifiers align the sentence with the analytical posture without sliding into qualifier-sandwich hedging.

**The boundary with qualifier sandwiches:** Qualifier sandwiches over-hedge claims that should be direct ("It's worth noting that..." before a punchy statement). Precision qualifiers under-hedge claims that should be conditional. They are opposite errors. Apply this rule when the article's thesis is conditional and a sentence states something as universal.

---

## 4. Don't Go Neutral at the Conclusion

**The pattern:** After making a clearly directional analysis, stating the conclusion in neutral terms instead of the directional terms the structure has earned.

**Before:** "The three buckets are separable, and a permit conversation that asks which bucket a project lands in produces a different decision than a conversation that doesn't."

**After:** "The three buckets are separable, and a permit conversation that asks which bucket a project lands in produces a different, *and more appropriate*, decision than a conversation that doesn't."

**The fix:** Add the directional adjective. "Different" was true; "different and more appropriate" was the actual claim.

**Why:** Falsely-balanced conclusions are an AI tic of their own. If the body of the work argues that Process A produces better decisions than Process B, the conclusion can't suddenly turn neutral without telegraphing model-trained false-balance. Say what you mean.

**Self-check:** Reread the closing paragraph of each section. Does it state the verdict the body of the section earned, or does it state a softer verdict that refuses to take a position the analysis already took? If the conclusion is more cautious than the analysis, sharpen it.

---

## 5. Compress Two-Sentence Balance Beats

**The pattern:** Splitting "X is true; X is also Y" across two sentences, with "It's also" or "But it's also" doing the connective work.

**Before:** "That's a real explanation. It's also exactly the explanation that, accepted at face value, leaves the public record where it currently sits..."

**After:** "That's real, and exactly the explanation that, accepted at face value, leaves the public record where it currently sits..."

**The fix:** Compress to one sentence with a comma + "and."

**Why:** "X is true. X is also Y." telegraphs careful balance — the writer performing judiciousness. The one-sentence form just *is* judicious. Two-sentence balance is a register signal more than a structural beat; cutting the redundant frame tightens the prose without losing the both-sides acknowledgment.

**Apply when:** Both halves are short (under ~15 words each) and the second sentence's "also" is doing concessive work, not introducing a new beat. Don't compress when the second sentence introduces independent material.

---

## 6. Don't Trade Accuracy for Crispness

**The pattern:** Choosing a poetic-but-overstated line over a flatter line that's actually true. AI gravitates to crisp because crisp registers as confident.

**Before:** "Communities have authority they didn't have eighteen months ago."

**After:** "Communities have varying levels of authority, and many are using it..."

**The fix:** Demote crispness when crispness costs accuracy. The replacement is less neat but accurate; the original was a punchy line that probably overstated the timeline.

**Why:** AI-generated prose has a strong gravity toward sentences that *sound* authoritative. The discipline is to check whether the authoritative sentence is actually true at the level of detail it claims. A slightly less-poetic sentence that survives fact-checking beats a poetic one that needs a footnote.

**Self-check:** Every dated or quantified claim ("eighteen months ago," "ten times more," "since 2016") should be verifiable from a source on hand or trivially derivable. If you can't verify it, demote it — even at the cost of the sentence's rhythm. A flat sentence that's true is worth more than a sharp sentence that breaks under fact-check.

---

## 7. When a Quick Answer Oversimplifies, Follow with Nuance

**The pattern:** In Q&A or rebuttal sections within an article that argues *for* nuance, letting a punchy answer become a new oversimplification.

**Before (in a rebuttal list):**
> *"Closed-loop solves the water problem."*
>
> At the fence, mostly. At the power plant feeding it, no, and that's now roughly 70 percent of the total.

**After:**
> *"Closed-loop solves the water problem."*
>
> At the fence, mostly. At the power plant feeding it, no, and that's now roughly 70 percent of the total. But the power production type makes a huge difference (zero for wind, for example), and even a water-using power source may not be pulling from a local supply.

**The fix:** Add the qualifier that makes the rebuttal itself accurate. The punchy version was useful for landing the point; the qualified version is useful for landing it without contradicting the article's thesis.

**Why:** An article that spends thousands of words demanding nuance can't suddenly enforce a one-line generalization in its summary table. The form fights the content. Rebuttal lists are particularly prone to this because punchy answers feel like the right rhetorical move — but if the article's whole thesis is that the punchy version of any claim is misleading, the rebuttal has to model the standard the article demands.

**Apply when:** The article's thesis is about complexity, conditional truth, or "it depends" answers, AND the rebuttal section uses a Q&A or list format. Single-claim takedowns in opinion pieces don't need this — the genre tolerates clean rebuttals.

---

## 8. Flat Declarative Beats Clever Closer

**The pattern:** Closing an article with "the question isn't X, it's Y" — a high-value AI tic that doubles as a corrective reframe and an applause cue.

**Before:** "Texas is about to make a generation of permit decisions on datacenter water. The question isn't whether the bland generalization is true. It's whether anyone in the room is allowed to be more specific."

**After:** "Texas is about to make a generation of permit decisions on datacenter water. The decisions need to be made based on the facts that matter."

**The fix:** Replace the clever close with a flat declarative that just says what's needed.

**Why:** "The question isn't X, it's Y" as a closer combines two failures: it's a corrective reframe (Rule #10) and a fake closer (in AI Slop Patterns). It's also an applause line — the kind of close that sounds satisfying in the moment and reads as performance the morning after. Flat declaratives are less satisfying *and* more honest.

**Self-check on every close:** Does it sound like an applause cue? If yes, suspect it. Real conclusions land flatter than rhetorical reframes; that flatness is a feature, not a bug.

**Relationship to AI Slop Patterns:** The slop-patterns reference flags "fake closers" generically ("Buckle up.", "We're still early."). This pattern flags a *specific* high-value close — "the question isn't X, it's Y" — because it slips through the slop-pattern sweep by sounding like analysis rather than fluff. Promote it: the pattern earns its own line in the closing-pass checklist.

---

## Closing-Pass Checklist

After applying the universal rules and after the slop-patterns sweep, run this checklist on the final draft:

1. ☐ No defensive disclaimers ("None of that is...", "That's not to say...")
2. ☐ No hedging epilogues at section closes ("The principle is contestable...")
3. ☐ Absolute claims include precision qualifiers where the truth is conditional ("hasn't" → "hasn't always")
4. ☐ Conclusion paragraphs state the directional verdict the body earned, not a softer one
5. ☐ Two-sentence "X is true. X is also Y" balance beats compressed to single sentences where appropriate
6. ☐ Every dated or quantified claim verifiable; poetic overstatement demoted to flatter accuracy
7. ☐ Rebuttal sections in nuance-arguing articles follow punchy answers with the qualifier that makes them accurate
8. ☐ Closing line is a flat declarative, not "the question isn't X, it's Y"

Run the checklist explicitly. The model's gravity is to skim it.

---

## Where These Came From

These patterns were extracted from a real editorial pass on an AI-drafted long-form policy piece. Each before/after is a verbatim diff between the AI draft and the published version. The author's edits were not stylistic — they were substantive corrections to posture, hedging, and overclaiming that the AI's universal-rule compliance had let through. The patterns generalize because they aren't specific to the topic; they are specific to the way AI prose behaves when the lexical and structural rules are followed but the editorial reflexes aren't internalized.

Add new patterns here as additional editorial passes surface them. The best patterns are the ones a real editor cuts on first pass — what's a one-time stylistic preference belongs in voice context, not here.
