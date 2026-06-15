# Project & Technical Work Summaries

**When to use:** recapping engineering / data / ops work — "summarize what we did," "give me a list of everything we did," "write up the process," or any end-of-task recap. Applies to summaries the user reads *and* (usually) forwards to a team, client, or vendor.

## The one reframe that fixes most drafts

A work summary is almost always **forwarded by the user as himself**, not read as a status report from an assistant. Write it as his first-person account, ready to paste into a message. That single shift removes the most common failures at once: "we did X *for you*," deliverable-location notes ("saved to iCloud Downloads"), "let me know if you want a PR" offers, and self-praise.

The universal rules still apply (no em dashes, contractions, specificity, etc.). These are additions for this format.

## Rules

1. **No phase scaffolding.** Strip U-IDs, "Phase 1," "Step 3:," and bold `Label —` lead-ins. They are build-time structure, invisible and irrelevant to the reader. The `Label — text` pattern also hides an em dash (violates rule #1).
2. **Lead each item with a bare past-tense verb; elide the subject.** "Found every broken policy…", "Made a safety backup…", "Confirmed it worked…". Not "We checked…", not noun headers like "Discovery:".
3. **Cut internal ceremony.** Assumption checks, permission probes, dry-run gating, and "you approved it" checkpoints are process for the operator, not news for the reader. Drop them unless a reader's decision actually hinged on one.
4. **Keep every concrete proof point.** Exact counts ("310 records across 242 policies"), the named example ("SHP000033702"), and completeness absolutes ("every single one matched," "zero broken records left," "on every transaction"). The numbers and names *are* the value of a technical summary — never round them off into "all the affected records."
5. **Fold the "why" inline, in plain words.** "…so we could put everything back instantly if anything went wrong." Not a separate "Why this matters" callout or a parenthetical lecture.
6. **Match the reader's vocabulary; trust them.** For an insider audience, use their shorthand ("prod," the real report names, "the snapshots," "the code change") and don't over-explain. Don't define terms they use daily; don't drop to a general-public register for a technical reader.
7. **End on the last concrete action.** No closing paragraph about who-owns-what-next, no "our work cleaned up the damage," no "in the meantime." If a genuine forward dependency exists, attach it as a neutral half-clause on the final action ("…so we can repeat it after the code change is in prod."), not a sermon.
8. **Open with a plain status line, no fanfare.** "Ok, all done for now. Here's the process I followed:" Not a meta-explainer like "Here's everything we did, in plain terms:".
9. **One flowing sentence per item.** Compound is fine and preferred. Don't chop into "Did X. Confirmed Y. Proved Z." inside a single bullet.

## Before / after (real)

Context: end-of-task recap of a production data-fix, forwarded to the iMGA team.

**DRAFT (assistant-voice, over-structured):**
> - **U5 — Made the fix.** We corrected all 310 records in one safe, reversible operation -- flipping the carrier back to Insurors Indemnity where it had been wrongly changed.
> - **U6 — Confirmed it worked.** We re-scanned the whole system: **zero broken records left.**
> …
> One thing still owned by iMGA (Ryland): fixing the rule that causes the corruption. Our work cleaned up the damage and gave you a repeatable way to keep it clean.

**SENT (the user, ready-to-forward):**
> Made the fix, correcting all 310 records in one safe, reversible operation that flipped the carrier back to Insurors Indemnity where it had been wrongly changed in the XML on the snapshots.
> Confirmed it worked by re-scanning prod. There are zero broken records left, and specifically confirmed it also against Alice's original example policy (SHP000033702), which now correctly reads Insurors Indemnity.
> …
> Saved the procedure and query so we can quickly repeat the fix implementation after the code change is in prod.

**What changed:** dropped the U-IDs and bold labels (and the em dashes they hid); each line now opens with a past-tense verb; cut the assumptions step and the approval checkpoint entirely; added the precise "in the XML on the snapshots" and the insider shorthand "re-scanning prod"; deleted the ownership/self-praise epilogue; ended on the last real action with the forward dependency as a single neutral clause.
