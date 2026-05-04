---
name: hearing-transcript
description: Use when the user provides an auto-generated transcript file (.sbv, .vtt, .srt, .txt) of a legislative or government meeting — committee, council, board, commission, or YouTube auto-captions of a public hearing — and asks to clean, fix, correct, edit, revise, or improve it. A bare path to such a file pasted into conversation also triggers when surrounding context is about a hearing or public meeting. Slash command: /clean-hearing.
version: 0.1.0
effort: high
---

# Hearing Transcript Cleanup

Auto-generated captions from YouTube and similar ASR services consistently mangle proper nouns, technical terms, and legislative procedure language. The errors are predictable: misheard organization names ("encore" for Oncor), garbled witness surnames, broken acronyms, and a roll call where every member's name is a near-miss. This skill systematizes the cleanup so the corrected transcript is reliable enough to quote from in journalism, research, or analysis.

The skill is **autonomous** — once the hearing is identified, every disambiguation has a deterministic answer the agent can derive from public record. Do not stop to ask the user about individual fixes. Do the work, then surface what could not be resolved with confidence in a single review report at the end.

## Core Principles

1. **Verbatim is the product.** Quotes will be cited downstream. Never invent words. If a phrase is unintelligible, leave it. A transcript with a confessed gap is more useful than a polished hallucination.
2. **Domain glossary first, substitution second.** Build the corrected vocabulary before touching the file. A list of every witness, member, organization, technical term, and acronym specific to this hearing makes the substitution pass deterministic.
3. **Preserve format integrity.** SBV, VTT, and SRT are structured. Line counts, timestamp blocks, and rolling-overlap duplication must survive cleanup intact, or the file stops working as captions.
4. **Roll call is deterministic.** Legislative clerks call the Chair first, the Vice Chair second, then remaining members alphabetically by last name. Given the committee membership, every roll-call token has exactly one correct answer.
5. **Backup before mutation.** Always write a `.bak` file before the first substitution. Cleanup happens in place; recovery requires the snapshot.

## When to Use

- A user provides a transcript file from a legislative or government meeting (committee hearing, city council, school board, commission, regulatory body) and asks for cleanup.
- The transcript came from YouTube auto-captions, Otter, Rev ASR, or a similar machine source — not a human stenographer.
- Coverage of the meeting is intended (article quotes, research, internal briefing) and the cleanup needs to support direct quotation.

## When NOT to Use

- The user provides a professional human-transcribed record (court reporter, official journal). Those are already verbatim — only flag obvious typos, do not rewrite.
- The transcript is fictional, dramatic, or non-public (private meeting recordings without authorization). Confirm scope before proceeding.
- The user only wants a summary or extracted quotes from a transcript they have not asked to clean up. Use the digest skill or read directly instead.

## Pipeline

The cleanup runs as five sequential phases. Do not skip ahead. Each phase has a clear gate to the next.

### Phase 1: Identify the Hearing

Before opening the transcript, establish four facts. Without them the substitution pass is guessing.

1. **Body and committee.** Which legislature, council, or board? Which specific committee or subcommittee?
2. **Date.** When did the meeting occur? (Caption files often have no date metadata.)
3. **Subject.** What bill, topic, or agenda was the hearing about? This determines the technical-term glossary.
4. **Source URL.** Where is the video hosted? (Usually YouTube. Needed for timestamp-anchored review links in the final report.)

Ask the user only for what cannot be inferred from conversation context, the transcript filename, the file's first few hundred lines, or recent prior turns. Once these four are in hand, proceed.

### Phase 2: Build the Domain Glossary

Assemble the correct vocabulary for this hearing in one pass, before any edits. The glossary has four sections:

- **Committee membership** — Chair, Vice Chair, all members. Pull from the official committee roster (state/federal legislature website, council page, board minutes). Note party affiliations only if relevant for context.
- **Witness list** — Every person who testified. Pull from the bill analysis, witness card filings, hearing notice, or a news writeup of the hearing. Include their organization affiliations. **For Texas legislative hearings the canonical source is the Texas Legislature Online (TLO) witness list URL pattern**: `https://capitol.texas.gov/tlodocs/<SESSION>/witlistmtg/html/C<COMMITTEE_CODE><YYYYMMDD>10001.htm` (e.g., House State Affairs 89R 2026-04-23 → `C4502026042310001.htm`; committee code 450 = House State Affairs). Fetch this page first; it gives every witness name with the spelling the clerk recorded, plus their employer/organization. Without it, witness-name corrections are phonetic guesses.
- **Organizations and proper nouns** — Every company, agency, utility, regulator, NGO, university, or named project mentioned in the hearing's subject area. For an energy hearing in Texas: Oncor, ERCOT, PUCT, CenterPoint, Vistra, Constellation, Calpine, Lancium, Crusoe, Skybox, Stack, Aligned, etc. Cast wide.
- **Technical vocabulary and acronyms** — Domain-specific terms the ASR will mangle. Spell out the acronym on first reference: ERCOT = Electric Reliability Council of Texas, PUCT = Public Utility Commission of Texas. Include unit notations (MW, GW, kWh), regulatory references, and term-of-art phrases (closed-loop cooling, evaporative cooling, capacity market, ancillary services).

Save the glossary to a temp file alongside the transcript (e.g., `<transcript-name>-glossary.md`). It is both an input to Phase 3 and an artifact in the final report.

If you cannot find an authoritative committee roster or witness list, say so and proceed with what is verifiable. Do not fabricate either list.

### Phase 2.5: Pull a Second-ASR Cross-Reference (when available)

Whenever a second, independent ASR transcription of the same hearing exists, pull it before substituting. Disagreement between two ASR engines on the same passage is the highest-yield manual-review signal you can get for free.

For Texas legislative hearings, a Deepgram-processed transcript pipeline writes pre-cleaned transcripts to iDrive E2 at `idrivee2:tlo-pipeline/<YYYY-MM-DD>-<slug>/`. Each folder contains `transcript.md` (with `[HH:MM:SS] Speaker N` markers), `transcript.json` (word-level timestamps), `speaker-map.json`, and a few other artifacts. Check before doing anything else:

```bash
rclone ls idrivee2:tlo-pipeline/ | grep <YYYY-MM-DD>
rclone copy idrivee2:tlo-pipeline/<YYYY-MM-DD>-<slug>/transcript.md /tmp/
```

If present, grep both transcripts for ambiguous tokens and prioritize the disagreements in the manual-review queue (Phase 6). Caveat: Deepgram still mangles proper names independently, and its diarization sometimes mixes adjacent witnesses on a panel — trust the text content, not the speaker label, for unmapped witnesses. Also: pipeline audio often starts 15–25 minutes after the YouTube video begins (the pipeline skips housekeeping), so timestamps between the two will not align directly without computing the offset first.

If no second ASR source exists, skip this phase and proceed to Phase 3 with single-source caveats noted in the final report.

### Phase 3: Backup and Format Audit

Before touching the file:

1. **Create the backup.** `cp <transcript> <transcript>.bak`. Verify the backup exists.
2. **Detect the format.** Inspect the first 50 lines:
   - **SBV** (YouTube): `HH:MM:SS.mmm,HH:MM:SS.mmm` timestamp lines, then 1–2 caption lines, then a blank line. Critical quirk: YouTube's auto-caption export uses **rolling overlap** — the same caption text appears in 2–3 consecutive blocks with shifted timestamps. Substitutions must apply to all occurrences (use `replace_all` or count matches before editing).
   - **VTT**: `WEBVTT` header, then `HH:MM:SS.mmm --> HH:MM:SS.mmm` blocks. Often has the same rolling-overlap behavior on YouTube exports.
   - **SRT**: Numbered blocks, `HH:MM:SS,mmm --> HH:MM:SS,mmm`, caption text, blank line. Less likely to have overlap.
   - **TXT**: No timestamps. Treat as plain text; the timestamp-anchored review report becomes line-number-anchored instead.
3. **Record the line count.** Note the original line count. After cleanup, the count must match exactly. A different count means structure was damaged.
4. **Note speaker conventions.** YouTube SBV uses `>>` for new speaker. Some tools use `Speaker 1:`. Preserve whatever the source uses verbatim.

### Phase 4: High-Confidence Substitution Pass

Apply substitutions only when context unambiguously identifies the correct term. Order matters: do the most universal fixes first (organization names, acronyms), then the more context-dependent (witness surnames spoken once or twice).

For each substitution:

1. **Search for occurrences first.** Use `grep -ic` or equivalent to count matches. Surprises here mean the term appears in a context you did not anticipate.
2. **Verify a sample.** Read 2–3 hits with surrounding lines. Confirm the wrong term is in fact the misheard version of the right term, not a coincidence.
3. **Apply with `replace_all`.** SBV's rolling overlap means a single phrase can appear in 2–3 consecutive blocks; missing one breaks the pattern.
4. **Track the count.** Keep a running tally per substitution: `Oncor (was "encore"): 18 occurrences`. This goes in the final report.

Common ASR error patterns to scan for, even when not flagged by the glossary:

- **Single-syllable misreads of company names**: "Stack" → "stock", "Aligned" → "a line", "Crusoe" → "crew so" / "Caruso".
- **Acronyms spelled phonetically**: "ERCOT" → "air cot", "PUCT" → "puct" (correct, but check capitalization), "HARC" → "hark" / "Heart", "TEPRI" → "Tepper".
- **Utility and grid operator names**: "Oncor" → "encore" / "anchor", "CenterPoint" → "center point" (split), "Vistra" → "Vista" / "vest era".
- **Witness surnames pronounced unusually**: Spanish-origin surnames (Guillen → "Ian", Anchía → "an chia") and surnames with silent letters are highest-risk. Persian/Arabic-origin surnames also fail predictably (Poursoltan → "porcelain" / "Sultan" / "Persoltan"; Fakhoury → "Fakhouri").
- **First-name-only address from the dais ≠ casual reference.** When a chair or member addresses a witness as ">> Cameron." or "Cameron, with the Data Center Coalition?", the ASR has dropped the surname, not the speaker. The first name being used alone in a question/handoff position is a near-certain signal that the surname needs to be filled in from the witness list. Replace with the surname (or "Mr./Ms. <Surname>") rather than leaving the first-name-only form.
- **Hyphenated surnames lose the hyphen.** "Collier-Brown" → "Collier Brown" routinely; sometimes also splits across two caption lines. Always restore the hyphen during substitution.
- **Phonetic substitution variants of unfamiliar names within one hearing.** A single witness's surname can appear in 3–6 different garbled forms in the same transcript (e.g., "Cameron porcelain" / "Cameron Sultan" / "Cameron Persoltan" / bare "Cameron"). Glossary substitution must enumerate every variant observed in the file, not just the most frequent one — phonetically related variants do not collapse under a single `replace_all`.
- **Bill numbers and citations**: "HB 1500" → "HP 1500", "Senate Bill 6" → "Senate bill six". Standardize to the form used in official record.
- **Number-and-unit pairs**: "2.45 GW" → "two point four five gigawatts" or "2.45 G W". Preserve the form the speaker used (digits if digits, words if words) — this is a transcription, not a stylebook conversion.

#### Parallel sectioning for long files

For transcripts longer than ~5,000 lines, dispatch one subagent per ~5,000-line section in parallel rather than processing serially. A 20,000-line SBV cleaned this way completes in roughly the time of a single section.

Critical rules when sectioning:

1. **Each section gets a non-overlapping line range.** Each subagent reads its range with `Read` `offset`/`limit`, identifies errors only within that range, and applies edits.
2. **`Edit` `old_string` must anchor on the timestamp line above the cue text, not on cue text alone.** SBV's rolling overlap means the same cue text can appear in 2–3 adjacent blocks, and the same garbled phrase can recur across sections. Without timestamp anchoring, a section-1 agent's edit can collide with a section-3 agent's `old_string` match.
3. **Use `Edit`, not whole-file rewrites.** The first parallel agent to use a Python atomic write (read whole file → modify → write whole file) will silently overwrite changes another agent has just committed. Stick to `Edit` calls — they merge cleanly even under concurrent dispatch. (Field-tested failure mode: an agent reported applying 16 corrections via atomic write; verification showed only 6 had landed because the other 10 were overwritten by a sibling agent's later atomic write.)
4. **Always verify after dispatch.** Once all subagents report completion, grep the file for the original garbled forms. Trust nothing that wasn't independently verified — subagents report what they intended to do, not what survived in the final file.

Resist the urge to repunctuate or restructure sentences. ASR often runs sentences together; that is part of the verbatim record. Speaker labels (`>>`) and line breaks are meaningful — preserve them.

### Phase 5: Roll-Call Disambiguation

Find the roll-call section. It is almost always near the start, after a phrase like "we'll have a quorum check", "call the roll", or "the clerk will call the roll". The pattern:

1. **Chair is called first by role title** ("Chairman Smith" or "Chair Garcia"), responds "here" or "present".
2. **Vice Chair is called second by role title** ("Vice Chair Hernandez"), responds.
3. **Remaining members are called in alphabetical order by last name only** ("Anchía", "Darby", "Davis", "Geren", "Guillen", "Hull", "McQueeney", ...).
4. Each member responds "here" / "present" / silence (absent).

Given the committee membership from Phase 2, the alphabetical sequence is fixed. Walk the roll-call captions in order and map each token to the next expected name. Misheard tokens become unambiguous: between "Geren" and "Hull", a token rendered as "Ian here" is Guillen (the only member alphabetically between them); between "Hull" and "Metcalf", "mcwhinney" is McQueeney.

Watch for SBV captions that span two roll-call entries on one line (e.g., `Hull mcwhinney.` is two members, not a hyphenated surname). Split into two lines or use a period-separated form that preserves the original line count.

If a member is absent, the clerk usually says only the name with no response. Preserve the silence — do not insert "here" because every other member said it.

### Phase 6: Generate the Review Report

After Phases 1–5, write a single markdown report alongside the transcript: `<transcript-name>-cleanup-report.md`.

The report contains:

1. **Hearing identification** — Body, committee, date, subject, video URL, transcript file path.
2. **Glossary used** — Inline or linked to the saved glossary file.
3. **Substitutions applied** — Table of `term (was: misheard form): N occurrences`. Sort by count descending.
4. **Roll-call resolution** — The corrected sequence, with any members marked absent or unresolved.
5. **Manual review queue** — Every passage where confidence was below the substitution threshold. For each:
   - The original passage (3–5 lines of context).
   - The suspected correct reading, if any.
   - **Video timestamp link**: `https://youtu.be/VIDEO_ID?t=NNNs` where `NNN` is the start time of the relevant SBV/VTT/SRT block in seconds. Use the `scripts/sbv_timestamp.py` helper to compute the timestamp from a line number.
   - The reason confidence was low (unfamiliar witness, ambiguous acronym, fragmented audio, etc.).
6. **Format integrity check** — Line count before vs. after (must match). Backup file path.

The manual review queue is the deliverable that closes the loop. Every flagged item is something a human can resolve in seconds with the video link, and no flagged item should require re-reading the whole transcript.

## Format-Specific Notes

### SBV (YouTube auto-captions)

The single biggest gotcha is rolling overlap. A typical 5-second caption appears in three consecutive blocks:

```
0:51:38.000,0:51:42.000
Water, you know, is, is a really

0:51:39.500,0:51:43.500
Water, you know, is, is a really
scarce resource in this state.

0:51:41.000,0:51:45.000
scarce resource in this state. And so we
have to have a clear picture of what
```

A misspelled word in the first block appears in all three. Use `replace_all` on the Edit tool, or `sed -i.tmp 's/wrong/right/g'` (then verify line count). Never edit a single occurrence in isolation.

### VTT

Same overlap behavior on YouTube exports. The `WEBVTT` header line and any cue settings (`align:start position:0%`) must be preserved exactly. Speaker labels appear as `<v Speaker Name>` in some VTT files — preserve the tag structure when correcting the speaker name.

### SRT

Block numbers must remain sequential and unmodified. If a substitution accidentally splits or merges blocks, the file becomes invalid. Verify block-number continuity after the substitution pass.

### TXT

No structural constraints, but no timestamp anchors either. The review report's manual queue uses line numbers instead of YouTube timestamps. If the user can supply the video URL anyway, the report can suggest approximate timestamps based on average speaking rate (~150 words per minute).

## Edge Cases

- **Multiple speakers with the same surname.** State legislatures occasionally have two members named "Smith". Use first names or district numbers from the committee roster to disambiguate by speech context (e.g., who was speaking just before the response).
- **Witness statements with verbatim numbers.** When a witness says "11,000 gallons a day", the ASR may render it as "11000 gallons a day" or "eleven thousand gallons a day" or "11 thousand gallons a day". Pick the form most likely spoken (digits when the witness is reading off a slide, words for round numbers in flowing speech) and note the choice in the report. When in doubt, leave the ASR's form and flag for manual review.
- **Acronym vs. word collision.** "HARC" (Houston Advanced Research Center) sounds like "hark" or "heart". When the surrounding context is energy/water research, HARC is correct. When the surrounding context is theology, it is not — but in a legislative hearing on infrastructure, it almost always is HARC.
- **Bill number formats.** Texas uses "HB 1500" / "SB 6"; the U.S. Congress uses "H.R. 1500" / "S. 6"; cities use ordinances with their own numbering. Match the convention of the body whose hearing this is.
- **Foreign-language speakers and translators.** Some hearings use simultaneous interpretation. The transcript will mix the original speech with the interpreter's English. Mark interpreter passages with `[interpreter]` or `(via interpreter)` if not already present in the source — but only when the hearing record clearly shows interpretation occurred.

## What This Skill Does Not Do

- **Does not produce a clean prose article from the transcript.** That is a downstream editorial step, not transcript cleanup. Use the writing skill or digest skill for prose.
- **Does not fact-check witness claims.** A witness saying something inaccurate stays in the transcript; the transcript records what was said, not what is true.
- **Does not translate.** Cleanup operates on the language of the transcript. Translation is a separate task.
- **Does not redact.** Even if a witness says something potentially embarrassing or off-topic, it stays in the verbatim record. Redaction is a publisher's choice, not a transcriber's.

## Helper Script

`scripts/sbv_timestamp.py` — Given an SBV/VTT/SRT path and a line number, returns the YouTube `?t=Ns` parameter for the nearest enclosing caption block. Use this when generating the manual-review queue links.

```bash
python scripts/sbv_timestamp.py captions.sbv 7363
# Output: ?t=5383s   (1:29:43)
```
