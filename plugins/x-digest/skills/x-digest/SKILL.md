---
name: x-digest
description: This skill should be used when the user pastes an X/Twitter link (x.com or twitter.com URL), says "digest this tweet", "analyze this post", "save this thread", or when an X link appears in conversation context (e.g., reading an Obsidian doc containing X links). Also triggers on /x-digest command.
---

# X Digest

Fetch, analyze, and save X/Twitter posts to Obsidian with actionable recommendations.

## 1. Overview

Given an X/Twitter URL, this skill: extracts the username and tweet ID, fetches the content using a 3-tier fallback strategy, performs structured analysis, saves a markdown file to Obsidian, and presents a concise summary with top recommendations.

## 2. URL Extraction

Parse the URL to extract `username` and `tweet_id`. Supported patterns:
- `https://x.com/{user}/status/{id}`
- `https://x.com/{user}/status/{id}?s=46`
- `https://twitter.com/{user}/status/{id}`

Strip trailing query params and anchors from the tweet ID.

```bash
URL="https://x.com/someuser/status/1234567890"
USERNAME=$(echo "$URL" | grep -oP '(?<=x\.com/|twitter\.com/)[^/]+')
TWEET_ID=$(echo "$URL" | grep -oP '(?<=status/)[0-9]+')
```

Normalize `username` to lowercase for file naming.

## 3. Fetch Strategy (3-Tier)

Try tiers in order. Stop at the first tier that returns actual tweet text.

### Tier 1: npx playbooks get

```bash
npx playbooks get "$URL"
```

Use this output if it contains actual tweet text. Reject it (fall to Tier 2) if the output:
- Contains "Did someone say" or "JavaScript is not available"
- Is mostly empty or contains only a cookie wall / login prompt

Tier 1 gives the richest content including full threads and replies.

### Tier 2: Twitter Syndication API (no auth)

```bash
curl -s "https://cdn.syndication.twimg.com/tweet-result?id=${TWEET_ID}&token=0"
```

Parse JSON response. Key fields: `.text`, `.user.name`, `.user.screen_name`, `.favorite_count`, `.created_at`, `.quoted_tweet`, `.conversation_count`.

Fall to Tier 3 if the response is an HTTP error, empty, or missing `.text`.

### Tier 3: Twitter oEmbed API (no auth)

```bash
curl -s "https://publish.twitter.com/oembed?url=${URL}"
```

Parse JSON response. Key fields: `.html` (blockquote containing tweet text), `.author_name`, `.author_url`.

If all three tiers fail, report the failure to the user with the specific error from each tier.

## 4. Analysis Instructions

Analyze the fetched content and produce all of the following:

**Summary**: One paragraph digest of the post's main point or argument.

**Key Claims**: Bulleted list of specific assertions, data points, or statements made.

**Sentiment**: Brief assessment of tone and intent (e.g., promotional, critical, informational, provocative).

**Recommendations**:

- **Content Ideas**: Specific content pieces this post could inspire. Include format (X post, podcast episode, newsletter, blog post) and the angle or hook. Be concrete, not generic.

- **Action Items**: Concrete next steps — people to contact, tools to try, strategies to implement, research to do, events to attend.

- **Project Connections**: Map the content to relevant projects. Consider:
  - Winning on Issues (political podcast — conservative politics, policy, elections)
  - JDKey (government affairs consulting — lobbying, policy analysis, regulatory issues)
  - Hyperscale (datacenter/AI infrastructure newsletter — data centers, power, compute, AI policy)
  - DLG / Dickey Law Group (law firm — legal issues, regulatory compliance, business law)
  - Sharper Stories (content/storytelling)
  - Link2s (link management / SaaS tools)
  - PodStyle Video (podcast production, video content)
  - VidPublish (video publishing platform)
  - TRU / Texas Republicans United (Texas conservative politics)

  Only list projects with a genuine connection. Explain how the content maps to each.

## 5. Output Template

Fill in this exact template:

````markdown
# X Analysis: @{username}

**Source**: {url}
**Analyzed**: {YYYY-MM-DD HH:MM}
**Tags**: #{category}

---

## Summary
{one paragraph}

## Key Claims
- {claims}

## Sentiment
{assessment}

## Recommendations

### Content Ideas
- {ideas with angle/hook}

### Action Items
- {next steps}

### Project Connections
- {mapping to user's projects}

---

## Raw Content
```
{original text from the tweet/thread}
```
````

Choose a concise `{category}` tag based on the content topic (e.g., `ai-policy`, `texas-politics`, `datacenter`, `legal`, `media`).

## 6. Save Instructions

Save the filled template to:

```
/home/obsidian/automation-vault/x-analyses/YYYY-MM-DD-{username}-{tweet_id}.md
```

- Use today's date for `YYYY-MM-DD`.
- `{username}` must be lowercase.
- Before writing, check if the file already exists. If it does, inform the user and ask whether to overwrite before proceeding.

## 7. Presentation

After saving, present inline:

1. One-line summary of the post.
2. Top 2-3 recommendations (mix of content ideas and action items).
3. Full file path where the analysis was saved.

Keep the inline presentation brief — the full analysis is in the file.

## 8. Multiple URLs

If multiple X/Twitter links are detected in the current context (e.g., from reading an Obsidian document), process each one sequentially following the steps above. After all are processed, present a summary table:

| Username | Tweet ID | Top Recommendation | File Saved |
|----------|----------|--------------------|------------|
| @user1   | 123...   | {brief rec}        | /path/to/file.md |
| @user2   | 456...   | {brief rec}        | /path/to/file.md |
