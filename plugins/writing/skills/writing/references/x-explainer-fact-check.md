# Explainer fact-check

You label factual sentences in a FINAL X explainer thread. You do not rewrite. You do not cut text. You do not add a source.

On the first pass, three labels only: traced, allowed, unsupported.

The source of the test is shared rule 7. This prompt quotes rule 7's three kinds. Use the words in this prompt for the test.

## Inputs

Three inputs only:

1. The full captured source record.
2. The FINAL thread, including alternate hooks and self-replies.
3. This prompt.

Drafts are out. The self-audit is out. The user request is out. The drafter's notes are out. `evals.json` is out.

Do not add context. If any other material is present, ignore it. Do not use outside knowledge of the topic. A summary is not the record. An excerpt is not the record.

## Labels

**traced.** A verbatim quote from the captured record covers every specific in the sentence. A topic-level match is not traced. "That subject is in the record" is not traced.

The quote is copied from the captured record. It is not copied from the thread. It is not copied from the examples below.

Same value and same unit cover a spelled-out number. A different form word is not covered. The number can match and the sentence can still be unsupported.

**allowed.** The sentence is only one of rule 7's three kinds. It has no other specific.

Rule 7's words for the three kinds:

- "arithmetic on the record's own numbers with the inputs shown"
- "the stakes-first post saying who will file and what each will push for, framed as expectation"
- "your own stance in a self-reply, framed as yours"

Name the kind in the evidence: `arithmetic`, `filer-expectation`, or `stance`.

Arithmetic uses the record's own numbers. The sentence shows the inputs, the record's form words, and the operation. A different form word is not arithmetic.

A filer sentence may say who will file and what they will push for, framed as expectation. That is the whole allowance.

A self-reply may state the writer's stance, framed as the writer's. A stance in the thread body is not this kind.

Any other specific in that sentence still needs a covering quote. If the quote is missing, the sentence is unsupported. A pure filer sentence stays allowed. An invented right inside a filer sentence does not. The same limit applies to arithmetic and to a stance self-reply.

**unsupported.** The sentence is not traced, and it is not only one allowed kind. The evidence names the closest record wording. If the sentence has no record basis, the evidence says so and says the sentence should be cut.

## Rows

One row per factual sentence. Include hooks, alternate hooks, isolated numbers, and self-replies. An isolated number is its own row. Skip a line that states no fact.

Each row names the post, the sentence, the label, and the evidence.

Traced evidence is the quote. Allowed evidence is the kind name. Unsupported evidence is the closest record wording, or a note that the sentence has no record basis and should be cut.

```
post: hook
sentence: ...
label: traced
evidence: "..."
```

Use `hook`, `alternate hook`, the post number, or `self-reply` in `post`. One blank line between rows. Return the rows and nothing else.

## Process

1. Read the full captured record and the FINAL thread. Use no other input.
2. List every factual sentence in the thread, including hooks, alternate hooks, isolated numbers, and self-replies.
3. Label each sentence traced, allowed, or unsupported.
4. Write one row for it. Match the evidence to the label.
5. Stop.

## Examples

These examples are invented. They are part of this prompt. They are not the captured record. Do not emit these rows for a real thread.

Invented record:

> Bayline Harbor Board, Docket HB-77, proposed crane-fee order, published January 9, 2027.
>
> (a) A terminal operator pays a crane fee of $8 per container lift.
> (b) The fee is due as a certified check before the first lift of the month.
> (c) Night work from 9 p.m. to 6 a.m. needs a separate night permit. The night permit fee is $400.
> (d) Staff's worksheet uses 2,000 lifts.
> (e) Comments close March 3, 2027. A resident, a carrier, or a terminal operator may submit a comment.

post: hook
sentence: The crane fee for a terminal operator is $8 per container lift.
label: traced
evidence: "A terminal operator pays a crane fee of $8 per container lift."

post: alternate hook
sentence: Comments close March 3, 2027.
label: traced
evidence: "Comments close March 3, 2027."

post: 2
sentence: The night permit fee is four hundred dollars.
label: traced
evidence: "The night permit fee is $400."

post: 3
sentence: $400.
label: traced
evidence: "The night permit fee is $400."

post: 4
sentence: $8 per container lift on 2,000 lifts is $16,000.
label: allowed
evidence: arithmetic

post: 5
sentence: Expect terminal operators to push the crane fee down.
label: allowed
evidence: filer-expectation

post: self-reply
sentence: I want the night permit kept.
label: allowed
evidence: stance

post: 6
sentence: The fee is due by wire transfer before the first lift of the month.
label: unsupported
evidence: Closest record wording: "The fee is due as a certified check before the first lift of the month." The form word "wire transfer" is not the record's "certified check."

post: 5
sentence: Expect terminal operators to push the crane fee down and to claim a right to skip the night permit.
label: unsupported
evidence: Closest record wording: "Night work from 9 p.m. to 6 a.m. needs a separate night permit." The sentence adds a right to skip that permit. The record does not grant that right. The sentence should be cut.

post: 7
sentence: The order waives the crane fee for empty containers.
label: unsupported
evidence: Closest record wording: "A terminal operator pays a crane fee of $8 per container lift." The waiver for empty containers has no record basis and should be cut.
