---
name: digest
description: This skill should be used when the user pastes any URL (web page, article, blog post, X/Twitter link), says "digest this", "analyze this link", "read this page", "save this article", or when a URL appears in conversation context. Also triggers on /digest command. Handles all URL types — X/Twitter posts get specialized fetch logic, everything else uses web-reader.
version: 1.1.0
---

# Digest

Fetch, analyze, and save any web content to Obsidian with actionable recommendations.

## 1. Overview

Given any URL, this skill: classifies the URL type, fetches content using the appropriate strategy, performs structured analysis, saves a markdown file to Obsidian, and presents a concise summary with top recommendations.

## 2. URL Classification

Determine the URL type to select the right fetch strategy and file naming.

**X/Twitter URLs** match these patterns:
- `https://x.com/{user}/status/{id}`
- `https://x.com/{user}/status/{id}?s=46`
- `https://twitter.com/{user}/status/{id}`

**All other URLs** are treated as general web content (articles, blog posts, docs, etc.).

## 3. Fetch Strategy

### For X/Twitter URLs (3-Tier Fallback)

Extract `username` and `tweet_id` from the URL:

```bash
USERNAME=$(echo "$URL" | grep -oP '(?<=x\.com/|twitter\.com/)[^/]+')
TWEET_ID=$(echo "$URL" | grep -oP '(?<=status/)[0-9]+')
```

**Tier 1: npx playbooks get**

```bash
npx playbooks get "$URL"
```

Use this output if it contains actual tweet text. Reject it (fall to Tier 2) if the output:
- Contains "Did someone say" or "JavaScript is not available"
- Is mostly empty or contains only a cookie wall / login prompt

**Tier 2: Twitter Syndication API (no auth)**

```bash
curl -s "https://cdn.syndication.twimg.com/tweet-result?id=${TWEET_ID}&token=0"
```

Parse JSON. Key fields: `.text`, `.user.name`, `.user.screen_name`, `.favorite_count`, `.created_at`.

**Tier 3: Twitter oEmbed API (no auth)**

```bash
curl -s "https://publish.twitter.com/oembed?url=${URL}"
```

Parse JSON. Key fields: `.html` (blockquote containing tweet text), `.author_name`.

If all three tiers fail, report the failure with the specific error from each tier.

### For All Other URLs (2-Tier Fallback)

**Tier 1: npx playbooks get**

```bash
npx playbooks get "$URL"
```

Use this output if it returns meaningful page content (headings, paragraphs, body text). Reject it if the output is mostly empty, a cookie wall, or a login prompt.

**Tier 2: WebFetch tool**

Fall back to the WebFetch tool with a prompt asking for the full page content as structured markdown.

If both tiers fail, report the failure to the user.

## 3b. Video Content Handling

For X/Twitter posts, check the syndication API response for video content: look for `mediaDetails` entries with `"type": "video"` and a `video_info` object containing `variants`.

**Detection:** If the syndication response contains `video_info.variants`, the post has video. Extract the highest-bitrate MP4 URL from `video_info.variants` (filter for `content_type: "video/mp4"`, pick the highest `bitrate`).

**Download and Transcribe:**

```bash
# Download the video
curl -L -o /tmp/digest-video.mp4 "{MP4_URL}"

# Transcribe using faster-whisper (base model, CPU)
/home/nonrootadmin/.local/bin/transcribe /tmp/digest-video.mp4 base > /tmp/digest-transcript.txt

# Clean up video after transcription
rm /tmp/digest-video.mp4
```

**Important notes:**
- The `transcribe` script outputs timestamped segments. Use the full transcript as the primary content for analysis — it replaces the tweet text as the "raw content."
- Include the original tweet text as context alongside the transcript.
- For videos over 60 minutes, use the `tiny` model instead of `base` to reduce processing time.
- If transcription fails, fall back to analyzing only the tweet text and note that the video could not be transcribed.
- Set `source_type` to `X Video` instead of `X Post` when video is present.

**For non-X URLs with embedded video:** Video transcription is currently supported only for X/Twitter native video. For YouTube links or other video platforms, note the video URL in the analysis and suggest the user provide a transcript.

## 4. Metadata Extraction

After fetching, extract metadata for the output template:

**For X/Twitter URLs:**
- `source_label`: `@{username}` (lowercase)
- `source_type`: `X Post` (or `X Video` if video content was transcribed)

**For Web URLs:**
- `source_label`: Page title if available, otherwise the domain name
- `source_type`: Infer from content — `Article`, `Blog Post`, `Documentation`, `News`, `Report`, `Thread`, etc.
- `domain`: Extract from URL (e.g., `techcrunch.com`, `github.com`)
- `author`: Extract from page metadata/byline if available

## 5. Analysis Instructions

Analyze the fetched content and produce all of the following:

**Summary**: One paragraph digest of the content's main point or argument.

**Key Claims**: Bulleted list of specific assertions, data points, or statements made.

**Sentiment**: Brief assessment of tone and intent (e.g., promotional, critical, informational, provocative).

**Recommendations**:

- **Content Ideas**: Specific content pieces this could inspire. Include format (X post, podcast episode, newsletter, blog post) and the angle or hook. Be concrete, not generic.

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

## 6. Output Template

Fill in this exact template:

````markdown
# Digest: {source_label}

**Source**: {url}
**Type**: {source_type}
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
{original text from the page/post}
```
````

Choose a concise `{category}` tag based on the content topic (e.g., `ai-policy`, `texas-politics`, `datacenter`, `legal`, `media`, `saas`, `dev-tools`).

## 7. Save Instructions

Save to:

```
/home/obsidian/automation-vault/web-analyses/YYYY-MM-DD-{slug}.md
```

**File naming by URL type:**

- **X/Twitter**: `YYYY-MM-DD-{username}-{tweet_id}.md` (e.g., `2026-02-23-elonmusk-1234567890.md`)
- **Web pages**: `YYYY-MM-DD-{domain}-{path-slug}.md` (e.g., `2026-02-23-techcrunch-com-ai-startup-raises.md`)

**Slug rules:**
- Use today's date for `YYYY-MM-DD`
- Lowercase everything
- Replace non-alphanumeric characters with hyphens
- Collapse multiple hyphens into one
- Trim to reasonable length (max ~60 chars for the slug portion)
- Before writing, check if the file already exists. If it does, inform the user and ask whether to overwrite

## 8. Presentation

After saving, present inline:

1. One-line summary of the content.
2. Top 2-3 recommendations (mix of content ideas and action items).
3. Full file path where the analysis was saved.

Keep the inline presentation brief — the full analysis is in the file.

## 9. Multiple URLs

If multiple URLs are detected in the current context, process each one sequentially. After all are processed, present a summary table:

| Source | Type | Top Recommendation | File Saved |
|--------|------|--------------------|------------|
| @user1 | X Post | {brief rec} | /path/to/file.md |
| techcrunch.com | Article | {brief rec} | /path/to/file.md |
