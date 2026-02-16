# X/Twitter Posts

> **Headlines are 80% of the work.** For hook formulas, testing methodology, and platform-specific headline optimization, see [headlines.md](headlines.md).

## Algorithm Reality

The For You feed uses a Grok-based transformer predicting 19 engagement signals per post per user. What matters most:

| Signal | What Drives It |
|--------|---------------|
| P(reply) | Provocative framing, questions experts feel compelled to answer |
| P(repost) | Quotable lines, insider insights worth sharing |
| P(dwell) | Engaging opening, substance that rewards reading |
| P(favorite) | Strong takes, useful information |
| P(follow_author) | Consistent expertise, unique perspective |

Video gets an explicit bonus (VQV weight). Text/image posts don't.

## What the Algorithm Does NOT Use

- **Hashtags**: The For You algorithm literally does not parse them. They only affect Search/Explore (a separate system). Skip them or use 1-2 max.
- **Post text for ranking**: Text is only checked against user muted keywords, never fed to the ML ranking model.

## Posting Strategy

### 1. Decouple Links from Posts (BIGGEST IMPACT)

Posts with external links get lower predicted engagement scores (less dwell time, less on-platform interaction). Fix:

```
[Main post: strong text, no link]

Self-reply: "Full analysis: [link]"
```

### 2. Space Posts Across the Day

The author diversity scorer applies exponential decay. Post 1 gets full score. Each subsequent post from the same account gets diminishing multiplier. Space 2-3 hours apart minimum.

### 3. Use @ Mentions Consistently

Tag companies/organizations mentioned in every post. Creates notification-driven engagement and potential reposts from tagged accounts.

### 4. End with the Strongest Line

The final line triggers the repost impulse. Don't end with a URL, hashtag string, or "Read more at..."

Strong closing examples:
- "Equipment without operators is just expensive metal."
- "Power gets the headlines. Water will get the lawsuits."
- "If you're not already in line, you're already behind."

## Post Template

```
[Opening hook: specific number, surprising claim, or provocative framing]

[2-3 sentences: context, analysis, insider detail]

[Closing line: quotable, repostable, strongest take]

@relevant_accounts
```

Self-reply:
```
Full analysis in today's @ProjectHandle briefing:
[link]
```

## What NOT to Do on X

- LinkedIn-style closing questions ("What's your take?") feel off-platform
- Engagement bait without substance triggers not-interested/mute
- Generic trend observations ("Datacenters are growing") get zero traction
- Posting all content at once guarantees diminishing returns
- Optimizing for clicks (takes users off-platform, reduces dwell)

## Threading Best Practices

- 5-10 tweets optimal (7 is sweet spot)
- Threads get ~63% higher engagement than single tweets
- Each tweet: one clear point
- Compelling hook in tweet 1, clear purpose/CTA in final tweet
- Continued engagement through a thread signals high-quality content to algorithm

## Timing

- Best windows: 9-11 AM and 2-4 PM in audience timezone
- Post daily for algorithm favorability
- 80/20 split: 80% value, 20% promotional
