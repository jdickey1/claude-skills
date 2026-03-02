# X/Twitter Posts

> **Headlines are 80% of the work.** For hook formulas, testing methodology, and platform-specific headline optimization, see [headlines.md](headlines.md).

## Algorithm Reality (Open-Source Weights)

The For You feed uses a Grok-based transformer predicting 19 engagement signals per post per user. Engagement weights from X's open-source algorithm code:

| Action | Weight (vs. Like) | What Drives It |
|--------|-------------------|---------------|
| Reply + author response | **150x** | Provocative framing, debatable questions, then RESPONDING to replies |
| Reply | **27x** | Questions experts feel compelled to answer, disagreement |
| Quote tweet | **25x** | Strong takes worth adding commentary to |
| Repost | **20x** | Quotable lines, insider insights worth sharing |
| Bookmark | **10x** | Reference-quality information, specific data |
| Profile click | **12x** | Consistent expertise, unique perspective |
| Like | **1x** (baseline) | Agreement, useful information |

**The single most valuable thing you can do:** Post something that provokes a reply, then reply back. That interaction is worth 150 likes.

Video gets an explicit bonus (VQV weight). Text/image posts don't.

### Time Decay

Posts lose approximately half their visibility score every six hours. The first 30-60 minutes are critical. Rapid early engagement dramatically outperforms slow accumulation.

## What the Algorithm Does NOT Use

- **Hashtags**: The For You algorithm literally does not parse them. They only affect Search/Explore (a separate system). Skip them entirely.
- **Post text for ranking**: Text is only checked against user muted keywords, never fed to the ML ranking model.

## Posting Strategy

### 1. Decouple Links from Posts (BIGGEST IMPACT)

Posts with external links get 50-90% reach reduction. The algorithm learns from engagement patterns: link posts get less dwell time and on-platform interaction. Fix:

```
[Main post: strong text, no link]

Self-reply: "Full analysis: [link]"
```

### 2. Fewer, Better Posts (2-3 Per Day Max)

The author diversity scorer applies exponential decay. Post 1 gets full score. Each subsequent post from the same account gets a diminishing multiplier. By Post 5, visibility is heavily penalized. Space 2-3 hours apart minimum.

**Quality over quantity.** Three posts that each trigger replies and reposts beat five posts where the last three get buried.

### 3. Design for Replies, Not Just Likes

Replies are 27x more valuable than likes. Reply + your response = 150x. At least one post per day should end with a specific, debatable question experts feel compelled to answer.

- Good: "Is self-supplied datacenter power a permanent feature, or a transitional phase?"
- Bad: "What do you think?" (generic, no one feels compelled)
- Bad: "What's your take?" (LinkedIn-style, feels off-platform on X)

### 4. Use @ Mentions Consistently

Tag companies/organizations mentioned in every post. Creates notification-driven engagement and potential reposts from tagged accounts.

### 5. End with the Strongest Line (NEVER Recycle)

The final line triggers the repost impulse. Don't end with a URL, hashtag string, or "Read more at..."

A strong closer works ONCE. Never reuse a closing line across posts. The audience remembers, and repetition trains the algorithm to predict low engagement (already seen this, low dwell time). Generate a fresh closer every time.

**Closer structures that work:**
- Contrast/paradox: "The industry that tracks every kilowatt can't tell you how many gallons it drinks."
- Three-word punch: "No disclosure. No permits. No recourse."
- Reframe: "The grid isn't slow. It's full."
- Consequence: "The next drought won't ask permission."

### 6. 280 Characters Is the Hard Limit

Posts that fit in the viewport without "Show more" get higher completion rates and dwell time. Write to 280 chars or less. If a detail is interesting but not essential for the hook to land, cut it.

## Post Template

```
[Opening hook: drama, tension, or provocative claim, NOT background context]

[1-2 sentences: proof, analysis, insider detail]

[Closing line: quotable, repostable, strongest take, ORIGINAL every time]

@relevant_accounts
```

Self-reply:
```
Full analysis in the latest @ProjectHandle briefing:
[link]
```

## What NOT to Do on X

- **Recycle closing lines** across posts (audiences notice, algorithm penalizes)
- **Post 5+ times a day** from one account (exponential decay kills posts 4-5)
- **LinkedIn-style closing questions** ("What's your take?") feel off-platform
- **Engagement bait** without substance triggers not-interested/mute
- **Generic trend observations** ("Datacenters are growing") get zero traction
- **Posting all content at once** guarantees diminishing returns
- **Optimizing for clicks** (takes users off-platform, reduces dwell)
- **List-then-conclude** structure (put the punchline FIRST, data underneath)
- **Context-before-drama** hooks (lead with the human moment, not the background)

## Threading Best Practices

Threads get ~63% higher engagement than single tweets. Use them for the strongest narrative arc from each briefing.

- **5-7 tweets optimal** (7 is sweet spot)
- Tweet 1: HOOK. Must work as a standalone post. End with thread indicator.
- Each tweet: ONE clear point, under 280 chars, blank lines between beats
- Build a **narrative arc**, not a list of facts. Thesis > evidence > conclusion.
- Second-to-last tweet: most quotable/screenshot-worthy line
- Final tweet: specific debatable question + project mention (link in self-reply)
- Each tweet must create forward momentum (reader needs the next one)

## Format Mixing

Don't post the same structure every day. Mix across days:

| Format | Frequency | Algorithm Signal |
|--------|-----------|-----------------|
| Hot take / bold claim | Daily | P(reply), P(repost) |
| Stat callout with context | Daily | P(dwell), P(bookmark) |
| Thread (5-7 tweets) | 2-3x/week | Extended engagement, P(follow) |
| Expert question | Daily | P(reply), design to trigger 150x signal |
| Contrarian framing | 2-3x/week | P(reply), P(quote_tweet) |

## Timing

- Best windows: 9-11 AM and 2-4 PM in audience timezone
- Post daily for algorithm favorability
- Engage with first replies within 30-60 minutes (critical for the 150x reply signal)
- 80/20 split: 80% value, 20% promotional
