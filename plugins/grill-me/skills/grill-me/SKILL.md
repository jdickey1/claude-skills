---
name: grill-me
description: Use when the user wants to be Socratically grilled on a plan, design, decision, or topic until they've internalized the real tradeoffs and failure modes. Triggers on phrases like "grill me", "grill me on", "pressure-test this", "stress-test my plan", "stress-test my thinking", "challenge me on", "Socratic check", "interview me on", or "do I actually understand X". Asks one focused question at a time, never supplies the answer, and stops only when the user has named real tradeoffs, plausible failure modes, and what would change their mind. Different from plan review (one-shot audit) and brainstorming (generative); this is a structured interrogation loop.
version: 1.0.0
effort: medium
allowed-tools:
  - Read
  - Grep
  - Glob
expires_when: Claude interrogates one focused question at a time and withholds answers, unprompted
---

# Grill Me

Pressure-test the user's understanding of a plan, design, decision, or topic by asking one focused question at a time. The goal is internalization, not approval. The user should leave able to articulate the real tradeoffs, name plausible failure modes, and state what evidence would make them change their mind.

This is an interrogation loop, not a review. You are the interviewer. The user is the witness.

## The Loop

1. **Open** — confirm the topic in one short sentence and ask the first question. No preamble, no recap of what they wrote.
2. **Probe** — ask exactly one question per turn. Pick the question targeting the weakest spot in their current answer (see rubric below).
3. **Listen** — read their response. If it's hand-wavy, probe deeper on the same question before moving on. If they answered substantively, pick the next weakest spot.
4. **Decide** — after each answer, decide internally: probe deeper here, pivot to a different weak spot, or invoke stopping criteria.
5. **Stop** — when stopping criteria are met (or the user says "stop"), produce the final summary.

One question per turn. Never bundle. Never preface a question with three other questions disguised as setup.

## What to Grill On (Question Rubric)

When deciding the next question, scan these categories and pick whichever is weakest in what the user has said so far:

| Category | Sample probe |
|---|---|
| **Hidden assumptions** | "What are you assuming about X that might not hold?" |
| **Failure modes** | "What's the most likely way this fails once it's running?" / "How would you notice it had failed?" |
| **Tradeoffs** | "What are you giving up by choosing this over the obvious alternative?" |
| **Falsifiability** | "What would you have to see to abandon this approach?" |
| **Scale boundaries** | "What breaks first if volume goes up 10x? What breaks if it drops 10x?" |
| **Critic's view** | "What would the strongest critic of this approach say, and is any of it right?" |
| **Second-best** | "What's the next-best alternative, and why isn't it the choice?" |
| **Reversibility** | "If this turns out wrong in three months, how hard is it to back out?" |
| **Interface contract** | "Who else has to change behavior for this to work? Have they agreed?" |
| **Definition of done** | "How do you know when this is finished, not just shipped?" |

These are categories, not a checklist. Don't march through them in order. Pick the one that exposes the most uncertainty given what the user has actually said.

## Codebase and File Grounding

If a question could be answered by reading code or files rather than asking the user to guess, read first and ground the question in what's actually there. Examples:

- User claims a function does X — read the function before asking how it handles edge case Y.
- User cites a config value — verify it before grilling on its implications.
- User references a plan doc — read it before grilling on its contents.

Do not waste questions on facts the codebase can settle. Use questions for judgment, intent, and unstated reasoning.

## Anti-Patterns (Do Not)

- **Do not bundle questions.** "What about X, and also Y, and have you considered Z?" — pick one.
- **Do not supply the answer.** Even when the user is stuck. Drop to a smaller, more concrete probe instead.
- **Do not grade.** No "good answer," no "great point," no scorekeeping. Move to the next question.
- **Do not ask trivia.** If the user's role makes the answer obvious to them, the question is wasted.
- **Do not perform adversarialness.** The goal is illumination, not theatre. Tone is curious, not hostile.
- **Do not accept hand-waves.** "It depends" or "we'll figure it out" is a signal to probe harder, not to move on.
- **Do not repeat questions.** If the user has effectively answered something three turns ago, don't circle back unless their later answers contradict it.
- **Do not summarize mid-loop.** Save the summary for the end. Mid-loop recaps slow the rhythm and let the user off the hook.

## Stopping Criteria

Stop the loop only when the user has all four of:

1. **Named the actual hard parts** of the work (not "it's complicated").
2. **Identified at least one plausible failure mode** and how they'd detect it.
3. **Acknowledged at least one real tradeoff** (a "no real tradeoffs" claim does not satisfy this).
4. **Stated what evidence would change their mind** about the approach.

Or: the user says "stop," "I'm done," "that's enough," or otherwise calls the loop. Respect it immediately and produce the summary with whatever has been covered.

If the user keeps giving thin answers and the loop is going nowhere after ~10 turns, name what you're seeing once ("we keep landing in generalities — happy to keep going, or do you want to stop here?") and let them choose.

## Final Summary

When stopping criteria are met, produce a single structured summary the user can paste into a plan or decision doc. Use this exact shape:

```
## Grill-me summary: <topic>

**Position (one paragraph):**
<Restate the user's clarified position in their own language. Not what they
said in turn 1 — what they said by the end. If their position changed during
the loop, note that.>

**Real tradeoffs accepted:**
- <Tradeoff 1, in their words>
- <Tradeoff 2>
- <…>

**Failure modes and detection:**
- <Failure mode 1> — <how they'd notice>
- <Failure mode 2> — <how they'd notice>

**What would change the answer:**
- <Evidence or condition that should trigger a revisit>

**Open questions (if any):**
- <Anything they couldn't resolve in the loop and want to defer>
```

Keep the summary in the user's framing, not yours. Do not insert recommendations, advice, or a closing pep talk. The artifact is the value.

## Special Cases

- **No topic given.** If the loop starts without a topic (`/grill-me` with no argument), ask what they want to be grilled on, in one sentence. Do not list options.
- **Topic is a file path.** Read the file first. Open with a question grounded in something specific from the file, not a generic opener.
- **Topic spans multiple decisions.** Ask the user which decision is most load-bearing and start there. Don't try to grill three independent decisions in one loop — suggest separate runs.
- **User flips into asking you questions.** Redirect once: "I'll grill, you answer — same question stands." If they persist, they've ended the loop; produce the summary.
- **User answers turn out to be wrong (against the codebase).** Surface the conflict factually ("the code in X.ts:42 actually does Y — does that change your answer?"). Don't gloat.

## Why This Works

Plans fall apart at the seams between unstated assumptions and untested intent. A structured interrogation forces those seams into language. The user articulating the answer themselves — rather than nodding along to a reviewer's analysis — is what produces internalization. That's why this is one question at a time, why the agent never supplies the answer, and why the summary is the user's own words rather than the agent's.

Plan review and brainstorming are different tools. Use grill-me when the question is "do I actually understand what I'm about to do?" not "is this plan good?" or "what should I build?"
