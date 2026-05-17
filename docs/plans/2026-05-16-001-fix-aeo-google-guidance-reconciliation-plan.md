---
title: "fix: Reconcile AEO/GEO playbook with Google's official generative-AI guidance"
type: fix
status: completed
date: 2026-05-16
---

# fix: Reconcile AEO/GEO playbook with Google's official generative-AI guidance

## Summary

Reconcile the `seo` plugin's AEO/GEO references (plus two Obsidian-vault strategy docs) against Google's official 2026-05-15 guidance on optimizing for generative AI features. Engine-scope the tactics Google explicitly disclaims for Google Search (llms.txt, content chunking, structured-data overfocus) rather than deleting them — they remain valid for ChatGPT/Bing/Perplexity. Correct the query-fan-out mechanism description, and **fully reverse/remove** the genuinely black-hat directives Google calls spam: mass per-variation page generation, inauthentic-mention scoring pressure, and the JD-Key plan's neutral-persona/sockpuppet strategy.

---

## Problem Frame

Google Search Central published "Optimizing for generative AI features on Google Search" (https://developers.google.com/search/docs/fundamentals/ai-optimization-guide, last updated 2026-05-15; digested at Obsidian `web-analyses/2026-05-15-developers-google-com-ai-optimization-guide.md`). It is the authoritative first-party source and it explicitly (a) disclaims llms.txt/special markup, content "chunking", AI-specific rewriting, and structured-data overfocus as requirements for Google Search AI features; (b) flags "seeking inauthentic mentions" and "scaled content abuse" (mass per-variation/fan-out pages to manipulate rankings) as spam.

Our AEO module (seo plugin v2.5.0, references dated Feb–Apr 2026 — all predate this guidance) and the JD-Key AI Visibility Master Plan currently contain guidance that either contradicts Google's stated position or actively recommends tactics Google now classifies as spam/disingenuous. The plugin is public (`github.com/jdickey1/claude-skills`); the JD-Key plan is a live client strategy. Leaving the conflict unaddressed risks shipping Google-non-compliant advice under our name and steering a real client domain toward a spam-flagged tactic.

The reconciliation is mostly a precision scope-and-caveat pass — the playbook is already engine-segmented (it flags "Only optimizing for Google" as a mistake, and the LinkedIn→Bing→ChatGPT playbook is already scoped to non-Google engines). Google's disclaimers are *consistent* with that model; they just need to be made explicit. The genuine new work is reversing the scaled-page and inauthentic-mention directives that have no authenticity guardrail today.

---

## Requirements

- R1. Every AEO/GEO tactic that Google explicitly disclaims for Google Search is engine-scoped with an explicit caveat (cites Google's 2026-05-15 guidance; states it is not a Google Search input; retained where load-bearing for ChatGPT/Bing/Perplexity). No silent deletion of engine-legitimate tactics.
- R2. The query-fan-out mechanism is described per Google's official definition (concurrent related queries + RAG/grounding over Google's core index), not as models running `site:` operator searches into individual domains. This is a **de-generalize, not delete** correction: `fan-out-queries.md` already scopes its `site:` premise to non-Google engines (line 1; `ai-search.md:81` attributes the `site:` behavior to ChatGPT/GPT-5.4), so its existing scoping is verified/tightened, not rewritten. The over-generalized statements live in `aeo.md`/`ai-search.md`/`SKILL.md`; those are corrected to Google's definition while genuinely Bing/ChatGPT-specific `site:` behavior is kept and explicitly fenced.
- R3. Directives that instruct mass per-variation / per-fan-out-term page generation are removed and replaced with the plugin's own existing anti-thin-page stance. Self-ranking ("yours at #1") page templates are reversed to honest, non-self-ranking framing.
- R4. An explicit anti-inauthentic-mention guardrail is added wherever the playbook scores third-party mentions/community presence, plus a CRITICAL row in the Common AEO Mistakes table citing Google's spam policy. Legitimate organic third-party-presence advice is reframed as an outcome, not removed.
- R5. The existing source-credibility guardrail is extended with a Google-official-contradiction check that is **semantically consistent** (same check, same warn-never-block severity posture) across the three surfaces that carry it (`commands/seo-aeo.md`, `reference/aeo.md`, `plugins/digest/skills/digest/SKILL.md` §5b). The three are *not* byte-identical today and must not be forced so: each surface's intentional structural differences are preserved (digest §5b's two-trigger gate + Sentiment/Recommendations "Effect on output" block; `seo-aeo.md`'s "Reference test"). The pre-existing documented sync contract is `seo-aeo.md` ↔ digest §5b (mandated at `seo-aeo.md:42`); `aeo.md` 412-432 is newly joined to that contract by this change, not retrofitted to a prior invariant.
- R6. The Obsidian-vault mirror is reconciled (kept a cross-link, not duplicated), and the JD-Key AI Visibility Master Plan's neutral-persona/sockpuppet and inauthentic-mention tactics are reversed/removed and reframed around its still-valid core insight.
- R7. The `seo` SKILL.md version is bumped following the claude-skills repo's own manual-versioning convention, and dependent description/table wording stays accurate.

---

## Scope Boundaries

- Not rewriting the SEO skill's core philosophy — `SKILL.md` "SEO is the foundation / start with indexability" is already Google-aligned and is the anchor to reconcile *toward*, not a target to change.
- Not deleting the "Verified LinkedIn AEO Playbook" or the LinkedIn→Bing→ChatGPT material — it is correctly non-Google-scoped; it only needs the explicit "not applicable to Google Search" fence.
- Not changing non-AEO SEO guidance (local-seo, link-building, automation scripts, keyword-universe pipeline) except where it carries an AEO conflict already inventoried.
- Not re-auditing jdkey.com / dickeylawgroup.com against the revised framework (that is a downstream `/seo-aeo` run, not this doc).
- Not re-sourcing every AI-citation causal stat (the "2.3-2.5x", "+40%", "2.8x" numbers). This plan reconciles the *internal 36% vs 2.3-2.5x schema inconsistency* and engine-scopes the schema claim; full stat re-triangulation is deferred.

### Deferred to Follow-Up Work

- Capture this reconciliation as a retrievable institutional learning: the claude-skills repo has **no `docs/solutions/`**, so this reasoning is currently only discoverable via git archaeology. Recommend a follow-up to add a solutions doc (separate change; out of scope here).
- Full AI-citation-stat re-triangulation pass across `aeo.md`, `ai-search.md`, `ranking-factors.md` (separate change).
- Post-reconciliation `/seo-aeo` re-baseline of jdkey.com and dickeylawgroup.com.

---

## Context & Research

### Relevant Code and Patterns

Target repo: **`~/Projects/claude-skills`** (`github.com/jdickey1/claude-skills`). Conflict inventory (file → lines → Google point):

- **llms.txt / special markup (G3 — scope, don't delete):** `plugins/seo/skills/seo/reference/aeo.md` 132, 137-196, 152; brand-facts adjacency 133-135; `plugins/seo/commands/seo-aeo.md` 50-52, 82.
- **Content chunking / passage-citability (G3 — scope):** `aeo.md` 45-98 (esp. 71-98 "Passage-Level Citability Scoring"), 49-52, 75; `reference/ai-search.md` 11-14, 19; `reference/audit-checklist.md` 212-227; `skills/seo/SKILL.md` 21, 228 (framing only).
- **Schema overfocus (G3 — scope + reconcile 36% vs 2.3-2.5x):** `aeo.md` 106, 497, Section-3 25-pt block; `ai-search.md` 38, 61; `audit-checklist.md` 161, 166; `seo-aeo.md` 50-52.
- **`site:` fan-out mischaracterization (G1 — correct):** over-generalized in `aeo.md` 245-253, 515-517; `ai-search.md` 70-78, 83; `SKILL.md` 169. `reference/fan-out-queries.md` is **not** in the rewrite set — its line-1 premise is already non-Google-scoped (`ai-search.md:81` ties the `site:` behavior to ChatGPT/GPT-5.4); it only gets a verification pass + an explicit "not Google Search" fence if its scoping could be misread, never a premise rewrite.
- **Scaled per-variation page generation (G4 — REVERSE):** `fan-out-queries.md` 51-63, 90-95, 97-104, 107-129; `ai-search.md` 76; `aeo.md` 339-341 ("yours at #1" Service Authority Page), 515-517, 612.
- **Inauthentic-mention scoring pressure (G4 — guardrail):** `aeo.md` 224-231 (10-pt Third-Party Validation, Reddit/Quora at 231); `ai-search.md` 48; `reference/link-building.md` 124-128.
- **Keep-and-extend anchors:** `seo-aeo.md` 30-42 (Source Credibility Check); `aeo.md` 412-432 (Credibility Guardrail / Unverified Claims); already-aligned anti-spam stances at `audit-checklist.md` 210, `local-seo.md` 170-182 / 46-48, `link-building.md` 9/14, `ranking-factors.md` 2-24, `SKILL.md` 231 — propagate these *into* the AEO sections.

Obsidian-vault targets (separate from the repo): `02-Areas/SEO/aeo-module-reference.md` (mirror — declares itself a cross-link, not a duplicate); `01-Projects/JD-Key/JD-Key-AI-Visibility-Master-Plan.md` (Section 1 "Listicle Domination": neutral-persona Medium accounts, "seeking inauthentic mentions", self-mention-embedding).

### Institutional Learnings

- No `docs/solutions/` exists in claude-skills; the de-facto knowledge base is the skill files + git history. Prior reasoning to extend, not fork:
  - The "Verified LinkedIn AEO Playbook" + "Unverified or Misleading Claims" structure (`aeo.md` 373-483, consolidated commit `e96a2a7`, seo 2.5.0) is the established pattern for exactly this class of reconciliation — slot Google's guidance into that frame.
  - Source-credibility guardrail: the documented sync contract is `seo-aeo.md` 30-42 ↔ `digest` SKILL.md §5b, mandated at `seo-aeo.md:42`. The sync is **semantic, not byte-identical** — the two already differ structurally by design (digest §5b carries a two-trigger gate + a Sentiment/Recommendations "Effect on output" block; `seo-aeo.md` carries a "Reference test"). The shared invariant is *the same check with the same warn-never-block posture*, not identical prose. `aeo.md` 412-432 is a third copy of the check but is **not** part of the pre-existing pointer contract (no sync pointer exists in `aeo.md` today); this change newly enrolls it and adds the pointer. Any wording change to the check itself touches all three in the same commit.
  - The playbook is engine-plural by design (flags "Only optimizing for Google" as a MEDIUM mistake at `aeo.md:502`). Reconcile by scoping, not deleting. llms.txt is already hedged as "an emerging specification" (added commit `251e897`, 2026-03-11) — a freshness/scope caveat is the surgical change.
  - The genuine gap: Third-Party Validation (`aeo.md` 224-232) currently *encourages* external mentions with no authenticity guardrail — Google's "inauthentic mentions" spam flag has no counterpart. That guardrail is net-new.

### External References

- Google, "Optimizing for generative AI features on Google Search" — https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (last updated 2026-05-15). Digest: Obsidian `web-analyses/2026-05-15-developers-google-com-ai-optimization-guide.md`.

---

## Key Technical Decisions

- **Scope, don't delete, for G3 tactics.** Google disclaims llms.txt/chunking/schema *for Google Search*; they remain load-bearing for ChatGPT/Bing/Perplexity. Rationale: the playbook is already engine-segmented; deletion would regress non-Google guidance. Caveat language is the minimal correct change. Maps R1.
- **Reverse, don't scope, for G4 tactics.** Mass per-variation page generation and inauthentic-mention seeking are spam/disingenuous on *any* engine, not just Google. Rationale: the user's instruction is explicit ("reversing or removing completely anything Google makes clear it'd see as black hat"); these have no legitimate-engine carve-out. Maps R3, R4, R6.
- **Extend the existing credibility frame; do not add a parallel doc.** Add a Google-official-contradiction check as a 4th lens inside `aeo.md` 412-432 and the `seo-aeo.md` Source Credibility Check. Rationale: institutional-learning guidance — extend, don't fork. Maps R5.
- **Versioning follows the claude-skills repo's own convention.** `seo` SKILL.md `version:` is the only version string in that repo; its git history shows manual bumps (v2.1.0 → v2.5.0). Bump to `2.6.0`. **Note for the implementer:** the compound-engineering plugin's release-please / "don't manually bump version" rule does **not** apply here — that governs a different repo. Maps R7.
- **Treat this as a dated freshness pass.** Caveats cite "per Google's 2026-05-15 guidance" so the reconciliation is auditable and the pre-existing (Feb–Apr 2026) text is visibly superseded rather than silently rewritten. Maps R1, R5.

---

## Reconciliation Disposition Matrix

> Directional guidance for review — the per-unit Files/Approach fields are authoritative.

| Conflict cluster | Google point | Disposition | Unit |
|---|---|---|---|
| llms.txt / brand-facts / special markup | G3 | Scope + caveat (keep for non-Google) | U3 |
| Content chunking / passage-citability scoring | G3 | Scope + caveat | U3 |
| Schema overfocus + 36% vs 2.3-2.5x inconsistency | G3 | Scope + caveat + reconcile internal stat | U3 |
| `site:` query-fan-out mechanism | G1 | Correct to Google's official definition | U2 |
| Mass per-variation / per-fan-out-term page generation | G4 | **Reverse/remove**; replace w/ anti-thin-page stance | U4 |
| "Yours at #1" self-ranking Service Authority Page | G4 | **Reverse** to honest non-self-ranking framing | U4 |
| Third-party-mention scoring pressure (no authenticity guard) | G4 | **Add hard guardrail** + CRITICAL mistake row | U5 |
| Source-credibility guardrail | aligned | Extend (Google-contradiction check); keep 3-surface sync | U1, U6 |
| JD-Key neutral-persona / sockpuppet / inauthentic mentions | G4 | **Remove/reverse**; reframe around valid core insight | U7 |

---

## Implementation Units

### U1. Add the Google-scope principle and extend the credibility guardrail (aeo.md)

**Goal:** Establish the governing reconciliation principle at the top of the AEO reference and extend the existing credibility guardrail with a Google-official-contradiction lens — the anchor every other unit references.

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Modify: `plugins/seo/skills/seo/reference/aeo.md` (new subsection near the top of the AEO framework; extend the "Credibility Guardrail for Viral AEO Claims" at 412-432)

**Approach:**
- Add a short "Google Search vs AI-Engine Scope" subsection stating Google's official 2026-05-15 position (RAG/grounding + query fan-out over the core index; foundational SEO + non-commodity content is the path; llms.txt/chunking/structured-data NOT required for Google Search; inauthentic mentions + scaled content abuse = spam), with the canonical URL and the principle: *engine-scope every AI tactic; never present a Google-disclaimed tactic as a Google-Search input; never recommend a tactic that is disingenuous on any engine.*
- Extend the existing 3-check credibility guardrail with a 4th check: "Google-official contradiction — does the tactic contradict Google's official Search guidance? If so, scope to non-Google engines or remove." Preserve the existing warn-never-block posture.

**Patterns to follow:** The existing "Verified LinkedIn AEO Playbook" / "Unverified or Misleading Claims" framing in `aeo.md` 373-483 — extend that structure, do not introduce a parallel doc.

**Test scenarios:** Test expectation: none — skill/reference content; verified by review + grep assertions.

**Verification:**
- `aeo.md` contains the scope principle with the Google URL and the 4th credibility check.
- The guardrail still reads warn-never-block; no scoring gate introduced.

---

### U2. Correct the query-fan-out mechanism description (G1)

**Goal:** Replace the `site:`-operator fan-out mischaracterization with Google's official definition; scope any genuinely Bing/ChatGPT-specific `site:` behavior instead of generalizing it.

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Modify: `plugins/seo/skills/seo/reference/aeo.md` (245-253, 515-517 — de-generalize the over-broad `site:` mechanism claim)
- Modify: `plugins/seo/skills/seo/reference/ai-search.md` (70-78, 83 — de-generalize; preserve the ChatGPT/GPT-5.4 attribution at 81)
- Modify: `plugins/seo/skills/seo/SKILL.md` (169 wording)
- Verify only (no premise rewrite): `plugins/seo/skills/seo/reference/fan-out-queries.md` — its line-1 premise is already non-Google-scoped; confirm it reads unambiguously as ChatGPT/Bing-scoped and add an explicit "not a Google Search mechanism" fence *only if* it could be misread as Google guidance. Do not rewrite or collapse the file.

**Approach:**
- **De-generalize, don't delete.** State Google's mechanism: the model issues a set of concurrent related queries and RAG/grounding retrieves relevant pages from Google's core Search index — it does not run `site:domain.com` operator searches into individual websites. Apply this only where the text *generalizes* `site:` fan-out as the universal/Google mechanism.
- Where the `site:` behavior is genuinely claimed for Bing/ChatGPT (e.g. `ai-search.md:81`), keep it verbatim and explicitly fence it as Bing/ChatGPT-scoped and not Google. The correction removes over-generalization, not accurate engine-specific behavior.
- Do not let the corrected mechanism silently delete the (separately handled) scaled-page sections — those are U4.

**Patterns to follow:** The engine-segmentation already present in `ai-search.md` 44-91 and `aeo.md` "Platform-Specific Optimization Notes".

**Test scenarios:** Test expectation: none — reference content; verified by grep assertions.

**Verification:**
- No remaining text generalizing `site:` operator fan-out as the universal/Google mechanism (grep `site:` occurrences; each is either corrected to Google's definition or explicitly Bing/ChatGPT-fenced).
- `fan-out-queries.md` line 1 and `ai-search.md:81` ChatGPT/GPT-5.4 attributions are intact (diff shows no premise rewrite there — verification/fence only).
- Google's official RAG + query-fan-out definition appears with the source URL.

---

### U3. Engine-scope the llms.txt / chunking / schema tactics (G3)

**Goal:** Add explicit "not a Google Search input per Google 2026-05-15; retained for ChatGPT/Bing/Perplexity" caveats to every G3 conflict, and reconcile the internal 36% vs 2.3-2.5x schema-stat inconsistency. No deletion of engine-legitimate guidance.

**Requirements:** R1

**Dependencies:** U1

**Files:**
- Modify: `plugins/seo/skills/seo/reference/aeo.md` (132, 137-196, 152 llms.txt; 133-135 brand-facts; 45-98 esp. 71-98 chunking/passage-citability; 106, 497 + Section-3 25-pt block schema)
- Modify: `plugins/seo/skills/seo/reference/ai-search.md` (11-14, 19 chunking; 38, 61 schema — reconcile 36% vs 2.3-2.5x)
- Modify: `plugins/seo/skills/seo/reference/audit-checklist.md` (161, 166, 212-227 AEO/GEO tier)
- Modify: `plugins/seo/skills/seo/SKILL.md` (21, 228 "structure for machines" framing — caveat only, not removal)

**Approach:**
- Caveat each cluster with the dated Google scope statement; keep the scoring but annotate that the llms.txt/schema/chunking sub-scores are non-Google-engine signals, not Google-AI readiness.
- Resolve the schema-stat inconsistency: pick one sourced figure or label both as directional non-Google estimates; do not leave 36% and 2.3-2.5x contradicting each other across files.
- Preserve the LinkedIn→Bing→ChatGPT playbook; only add the explicit "not applicable to Google Search" fence where it could be misread as Google guidance.

**Patterns to follow:** llms.txt is already hedged as "an emerging specification" — extend that hedge into an explicit scope+freshness caveat rather than re-litigating it.

**Test scenarios:** Test expectation: none — reference content; verified by review + grep assertions.

**Verification:**
- Every llms.txt / chunking / schema conflict site carries a dated Google-scope caveat.
- No occurrence where schema is asserted as required for Google AI Overviews/AI Mode without a caveat.
- 36% and 2.3-2.5x schema figures are reconciled (single sourced figure or jointly labeled directional).
- No engine-legitimate tactic was deleted (diff shows additions/annotations, not section removals, in this unit).

---

### U4. Reverse scaled per-variation page generation and self-ranking pages (G4)

**Goal:** Remove the directives that instruct creating a dedicated page per predicted fan-out term / feature / use-case / competitor, and reverse the "yours at #1" Service Authority Page into an honest, non-self-ranking comparison guide.

**Requirements:** R3

**Dependencies:** U1, U2

**Files:**
- Modify: `plugins/seo/skills/seo/reference/fan-out-queries.md` (51-63, 90-95, 97-104, 107-129)
- Modify: `plugins/seo/skills/seo/reference/ai-search.md` (76)
- Modify: `plugins/seo/skills/seo/reference/aeo.md` (339-341 Service Authority Page; 515-517, 612 weekly per-fan-out-gap page creation)

**Approach:**
- Replace "missing page = missing citation → create a dedicated page for every fan-out term" with the plugin's own correct stance: consolidate into genuinely unique, non-commodity pages; never generate pages whose purpose is fan-out coverage or ranking manipulation. Cross-reference the existing anti-thin-page guidance (`audit-checklist.md` 210, `local-seo.md` 178-179 / 46-48) so the AEO sections inherit it.
- Reframe the "ranked list with yours at #1 + real competitors" template into an honest comparison (no self-ranking; criteria-based, even-handed).
- Keep the legitimate idea that genuinely distinct features/use-cases *may* warrant their own substantive pages — the removal targets the mass/templated/coverage-driven directive, not all multi-page IA.

**Execution note:** Surgical removal — excise the spam directive and its scored incentive; preserve surrounding engine-legitimate context. Do not collapse the whole `fan-out-queries.md` file; correct its premise (U2) and strip the scaled-page operationalization here.

**Patterns to follow:** `local-seo.md` 46-48 ("each service area page has genuinely unique content — not city-name swaps; Google spam updates target these") is the correct shape to mirror.

**Test scenarios:** Test expectation: none — reference content; verified by review + grep assertions.

**Verification:**
- No remaining instruction to create a page per predicted fan-out term / per competitor / per use-case for coverage's sake.
- No "yours at #1" self-ranking template; the comparison framing is even-handed.
- The anti-thin-page principle is cross-referenced from the former scaled-page locations.

---

### U5. Add the anti-inauthentic-mention guardrail and reframe Third-Party Validation (G4)

**Goal:** Close the genuine gap — add a hard authenticity guardrail wherever the playbook scores third-party mentions/community presence, add a CRITICAL Common-AEO-Mistakes row citing Google's spam policy, and reframe organic third-party presence as an outcome rather than a lever to game.

**Requirements:** R4

**Dependencies:** U1

**Files:**
- Modify: `plugins/seo/skills/seo/reference/aeo.md` (224-231 Third-Party Validation; 487-503 Common AEO Mistakes table)
- Modify: `plugins/seo/skills/seo/reference/ai-search.md` (48 community-content framing)
- Modify: `plugins/seo/skills/seo/reference/link-building.md` (124-128 mention/brand-signal framing)

**Approach:**
- Add an explicit guardrail to Third-Party Validation: no coordinated/seeded/persona/sockpuppet mentions, no review or forum manipulation; legitimate third-party presence is an *outcome of real work and real expertise*, never a scored mention-seeking lever.
- Add a CRITICAL row to the Common AEO Mistakes table: "Seeding inauthentic mentions / coordinated mention-building → Google scaled-content/spam policy; ineffective and disqualifying." Annotate the existing "Generic AI-written content" and fake-freshness rows with the Google scaled-content-abuse citation (reinforce, don't duplicate).
- Lightly reframe `ai-search.md` 48 and `link-building.md` 124-128 so mentions read as organic signals, not acquisition targets.

**Patterns to follow:** `local-seo.md` 170-182 (review-manipulation / thin-city-page spam warnings) is the existing correct anti-inauthentic stance — mirror its tone and severity.

**Test scenarios:** Test expectation: none — reference content; verified by review + grep assertions.

**Verification:**
- Third-Party Validation carries an unmissable anti-astroturfing guardrail.
- A CRITICAL inauthentic-mention row exists in the Common AEO Mistakes table citing Google's policy.
- No remaining text that frames buying/seeding/persona-driven mentions as a tactic.

---

### U6. Propagate to the command surface and hold the 3-surface sync invariant + version bump

**Goal:** Mirror U2–U5 into the executable `/seo-aeo` command, apply the U1 credibility-check extension identically across the three synced surfaces, and bump the skill version.

**Requirements:** R5, R7

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Modify: `plugins/seo/commands/seo-aeo.md` (30-42 Source Credibility Check — add the Google-contradiction check; 48-52, 82 — mirror llms.txt/brand-facts/scaled-page changes)
- Modify: `plugins/seo/skills/seo/reference/aeo.md` (412-432 — add the same Google-contradiction check; add a sync pointer enrolling this block in the `seo-aeo.md`↔digest contract, which it is **not** part of today)
- Modify: `plugins/digest/skills/digest/SKILL.md` (§5b — apply the same check; this is the pre-existing documented sync contract from `seo-aeo.md:42`. Preserve §5b's two-trigger gate and Sentiment/Recommendations "Effect on output" block — do not flatten it to match the others)
- Modify: `plugins/seo/skills/seo/SKILL.md` (`version:` 2.5.0 → 2.6.0; update any description/table wording made inaccurate by U2–U5, e.g. the `aeo.md` "4-section scoring" line if section semantics changed)

**Approach:**
- The command is a thin orchestrator over the references; ensure it no longer instructs scoring llms.txt/brand-facts as a Google-AI signal and no longer hard-wires scaled-page audit steps.
- **Semantic sync, not byte-identity.** The Google-contradiction check must be present and behaviorally consistent (same check, same warn-never-block posture) across all three surfaces, edited in the same change. The three are *not* byte-identical today and must not be forced so — preserve each surface's intentional structure: digest §5b's two-trigger gate + Sentiment/Recommendations "Effect on output" block, and `seo-aeo.md`'s "Reference test". A divergence in the *check's logic or severity* is a defect; a structural difference that already exists by design is not.
- `aeo.md` 412-432 has no sync pointer today and is not in the pre-existing `seo-aeo.md`↔digest contract. This unit newly enrolls it: add a one-line sync pointer in `aeo.md` (mirroring the one at `seo-aeo.md:42`) so the three-way contract is explicit going forward rather than tacit.
- Version bump per the claude-skills repo's own convention (manual `SKILL.md` bump; **not** governed by compound-engineering's release-please rule — different repo).

**Test scenarios:** Test expectation: none — skill/command content; the sync invariant is the verifiable property.

**Verification:**
- The Google-contradiction check is present in all three surfaces with the same logic and the same warn-never-block posture (semantic equality, verified by reading each — *not* a byte-diff).
- The pre-existing intentional structural differences are preserved, not flattened: digest §5b still has its two-trigger gate + "Effect on output" block; `seo-aeo.md` still has its "Reference test".
- `aeo.md` 412-432 carries the new sync pointer enrolling it in the three-way contract.
- `/seo-aeo` process/scoring text reflects U3/U4/U5 (no llms.txt-as-Google-signal, no scaled-page directive).
- `SKILL.md` version is `2.6.0`; description/reference-table wording is accurate against the revised sections.

---

### U7. Reconcile the Obsidian-vault docs (mirror + JD-Key Master Plan)

**Goal:** Bring the vault mirror in line (kept a cross-link, not duplicated) and reverse/remove the black-hat tactics in the JD-Key AI Visibility Master Plan, reframing around its still-valid core insight.

**Requirements:** R6

**Dependencies:** U1, U5, **and a hard gate: James's explicit sign-off on the JD-Key strategic reversal.** The JD-Key Master Plan edits do not proceed until James approves the reframed first-party direction. The mirror-doc edit (`aeo-module-reference.md`) has no such gate — only the live-client JD-Key plan does. Surface the proposed reframing to James and wait for approval before writing the JD-Key file; if sign-off is not obtained in-session, complete the mirror-doc half and leave the JD-Key edit pending with a note, rather than proceeding unilaterally.

**Target:** Obsidian vault (separate from the claude-skills repo). Paths below are vault-relative; edit via the established SSH path (`nonrootadmin` → `sudo -u obsidian`).

**Files:**
- Modify: `02-Areas/SEO/aeo-module-reference.md` (add the Google-scope principle + extend the "do not cite externally" frame with Google-disclaimed-for-Google-Search tactics; keep it a cross-link to the skill reference, not a content duplicate)
- Modify: `01-Projects/JD-Key/JD-Key-AI-Visibility-Master-Plan.md` (Section 1 "Listicle Domination" and any dependent sections)

**Approach:**
- Mirror doc: add a short pointer to U1's scope principle and a row/note that Google disclaims llms.txt/chunking/structured-data for Google Search; do not paste the skill reference's content — preserve the cross-link contract the doc already declares.
- JD-Key plan: **remove** the "Create Medium account under … a 'neutral' industry expert persona" instruction, the "seeking inauthentic mentions" framing, and the self-mention-embedding-in-self-authored-listicles directives. Replace the listicle-volume play with attributed first-party thought-leadership (James/JD Key bylined, expertise-led, non-commodity). Add a short Google-compliance note and reframe around the plan's still-valid core insight: *win by being discoverable through authentic, crawlable, non-commodity expertise* — not manufactured presence.
- Preserve the plan's legitimate analysis (platform citation patterns, the head-to-head win-rate insight); only the tactics Google deems disingenuous are reversed.

**Execution note:** The JD-Key plan is a live client strategy doc — this unit changes strategic direction. The reversal is mandated by the user's explicit instruction; surface the change for James's sign-off rather than treating it as silently settled (see Risks).

**Test scenarios:** Test expectation: none — strategy/reference documents; verified by review.

**Verification:**
- James's sign-off on the JD-Key reversal was obtained before the JD-Key file was written (or, if not obtained, the JD-Key edit was left pending with a note and only the mirror-doc half completed).
- The mirror remains a cross-link (no duplicated skill content) and carries the Google-scope note.
- The JD-Key plan contains no neutral-persona/sockpuppet or inauthentic-mention instructions; the reframed first-party approach and Google-compliance note are present; the legitimate analytical content is retained.

---

## System-Wide Impact

- **Interaction graph:** `/seo-aeo` reads `aeo.md` + `ai-search.md`; `/seo-audit` reads `audit-checklist.md`; the `digest` skill §5b shares the credibility guardrail wording with `seo-aeo.md`. Changes to scoring semantics ripple to both audit commands and the digest source-credibility behavior.
- **API surface parity:** The Source Credibility Check is a *semantic* shared contract. Pre-existing scope: `seo-aeo.md` ↔ `digest` SKILL.md §5b (mandated at `seo-aeo.md:42`), structurally divergent by design. U6 newly enrolls `aeo.md` 412-432 as a third surface and adds its sync pointer. The invariant is *same check, same severity posture* — not byte-identity; structural differences (digest §5b's two-trigger gate + "Effect on output" block; `seo-aeo.md`'s "Reference test") are intentional and preserved. U6 owns this.
- **Unchanged invariants:** SEO core philosophy (`SKILL.md` indexability-first), the Verified LinkedIn AEO Playbook content, non-AEO references (local-seo, link-building except 124-128, automation, keyword-universe pipeline). The reconciliation annotates and reverses within the AEO surface; it does not restructure the skill.
- **Blast radius:** `claude-skills` is a public repo — the change is reputationally positive (aligns public guidance with Google) and should land as one coherent commit/PR with the version bump.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Over-deletion: removing tactics that are legitimately valid for ChatGPT/Perplexity/Bing | U3 scopes-with-caveat (no deletion); only U4/U5/U7 remove, and only the spam directive, not surrounding engine-legitimate context (U4 execution note) |
| Credibility-guardrail *check logic* drifts across the 3 surfaces | U6 edits all three in the same change; verification is a *semantic* equality check (same check, same posture) — deliberately not a byte-diff, since the surfaces are structurally divergent by design |
| Forcing byte-identity flattens an intentional structural difference | R5/U6 explicitly preserve digest §5b's two-trigger gate + "Effect on output" block and `seo-aeo.md`'s "Reference test"; only the check's logic/severity is held constant |
| Implementer cross-applies compound-engineering's release-please rule and refuses the version bump | Key Technical Decisions + U6 explicitly state the bump follows the claude-skills repo's own manual convention and the release-please rule governs a different repo |
| JD-Key plan reversal changes a live client's strategic direction | U7 reframes around the still-valid core insight rather than gutting the doc. James's sign-off is a **hard dependency and verification criterion** on U7 (not merely a flag): the JD-Key file is not written until approved; the mirror-doc half can proceed independently. The reversal itself is mandated by explicit instruction — sign-off gates the *direction of the reframe*, not whether to reverse |
| Reconciliation reasoning is lost (no `docs/solutions/` in claude-skills) | Caveats are dated ("per Google's 2026-05-15 guidance") so the change is self-documenting; a solutions-doc capture is filed under Deferred to Follow-Up Work |

---

## Open Questions / Assumptions

These are explicit bets the plan rests on. They are not blockers (the user's instruction is unambiguous about direction), but they are surfaced so a reviewer or implementer can challenge them rather than discover them later.

- **A1 (load-bearing assumption): G3 tactics retain value on non-Google engines.** The "scope, don't delete" disposition for llms.txt / content chunking / structured-data overfocus assumes these still help ChatGPT/Bing/Perplexity citation. Google's guidance only establishes they are *not Google Search inputs* — it says nothing about other engines, and the playbook's own evidence for non-Google value is the same Feb–Apr 2026 material now being caveated. If this assumption is false, the correct disposition shifts from "scope + caveat" toward "deprecate with a freshness warning". The plan does not re-evidence this; caveats are written as engine-scoped and dated so the bet is visible and revisable, not asserted as settled fact.
- **A2 (scope decision): the 36% vs 2.3-2.5x schema-stat fix stays in.** Reconciling the *internal* contradiction (same playbook, two incompatible schema-lift figures across files) is retained in U3 because it is cheap, self-contained, and leaving a self-contradiction in a public reference is itself a credibility defect. Full external re-triangulation of all AI-citation stats remains explicitly Deferred (see Scope Boundaries / Deferred to Follow-Up Work). If a reviewer judges even the internal reconciliation as scope creep, the fallback is to label both figures "directional, non-Google, unverified" in place rather than pick one — no new sourcing work either way.

---

## Documentation / Operational Notes

- Bump `seo` `SKILL.md` `version:` to `2.6.0` (claude-skills convention). Update `aeo.md`/`SKILL.md` description/table wording only where U2–U5 changed section semantics.
- Land as a single coherent commit/PR on `jdickey1/claude-skills` (public). Include the digest URL in the commit body for provenance.
- Vault edits (U7) are outside the repo PR — apply via the Obsidian SSH path; note in the PR description that the vault mirror + JD-Key plan were reconciled in tandem.

---

## Sources & References

- External: Google, "Optimizing for generative AI features on Google Search" — https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (last updated 2026-05-15)
- Digest: Obsidian `web-analyses/2026-05-15-developers-google-com-ai-optimization-guide.md`
- Target repo: `~/Projects/claude-skills` (`github.com/jdickey1/claude-skills`)
- Sync invariant source: `plugins/seo/commands/seo-aeo.md:42`
- Prior consolidation: seo plugin commit `e96a2a7` (v2.5.0, Verified LinkedIn AEO Playbook); `251e897` (llms.txt subsection, 2026-03-11)
