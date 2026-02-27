---
name: digest
description: This skill should be used when the user pastes any URL (web page, article, blog post, X/Twitter link, GitHub repo), says "digest this", "analyze this link", "read this page", "save this article", "check out this repo", or when a URL appears in conversation context. Also triggers on /digest command. Handles all URL types — X/Twitter posts get specialized fetch logic, GitHub repos get cloned and security-reviewed, everything else uses web-reader.
version: 1.3.0
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

**GitHub Repo URLs** match these patterns:
- `https://github.com/{owner}/{repo}`
- `https://github.com/{owner}/{repo}.git`
- `https://github.com/{owner}/{repo}/tree/{branch}`

Do NOT match GitHub issue, PR, or file URLs (those use general web fetch):
- `https://github.com/{owner}/{repo}/issues/{id}` → general web
- `https://github.com/{owner}/{repo}/pull/{id}` → general web

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

### For GitHub Repo URLs

Extract `owner` and `repo` from the URL:

```bash
OWNER=$(echo "$URL" | grep -oP '(?<=github\.com/)[^/]+')
REPO=$(echo "$URL" | grep -oP '(?<=github\.com/[^/]+/)[^/.]+')
```

**Step 1: Repo metadata** — use `gh` CLI (authenticated, no token needed):

```bash
gh repo view "$OWNER/$REPO" --json name,description,owner,primaryLanguage,languages,stargazerCount,forkCount,licenseInfo,latestRelease,createdAt,updatedAt,isArchived,defaultBranchRef
```

**Step 2: Clone to temp dir** (shallow clone for speed):

```bash
TMPDIR=$(mktemp -d /tmp/digest-repo-XXXXXX)
git clone --depth 1 "https://github.com/$OWNER/$REPO.git" "$TMPDIR/$REPO"
```

**Step 3: Read README** — look for `README.md`, `README.rst`, `readme.md`, or similar at the repo root.

**Step 4: Evaluate code structure** — map the project layout:

```bash
# Directory tree (2 levels deep, ignore .git)
find "$TMPDIR/$REPO" -maxdepth 2 -not -path '*/.git/*' | head -80
```

Read key files to understand the project:
- Package manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.)
- Entry points (`src/index.*`, `main.*`, `app.*`)
- Config files (`tsconfig.json`, `.env.example`, `docker-compose.yml`, etc.)
- Any `CLAUDE.md`, `.cursorrules`, or similar AI context files

**Step 5: Security scan** — this is critical. Check for:

| Risk | What to look for |
|------|-----------------|
| Hardcoded secrets | API keys, tokens, passwords in source (not `.example` files) |
| Dependency risks | Known vulnerable packages, unpinned versions, excessive deps |
| Injection vectors | Unsanitized user input in SQL, shell commands, HTML rendering |
| Auth weaknesses | Missing auth on routes, weak token validation, exposed admin endpoints |
| Unsafe patterns | `eval()`, `dangerouslySetInnerHTML`, `shell=True`, `--no-verify`, `chmod 777` |
| Supply chain | Postinstall scripts, obfuscated code, unusual build steps |
| Data exposure | Logging sensitive data, verbose error messages, open CORS |

Read any files that look suspicious. This is not a full audit — it's a quick scan to flag obvious risks before we consider using the code.

**Step 6: Clean up**

```bash
rm -rf "$TMPDIR"
```

## 3b. Video Content Handling

Video transcription is supported for **any URL** — X/Twitter native video, YouTube, and generic web pages with embedded video.

### Detection

**X/Twitter:** Check the syndication API response for `mediaDetails` entries with `"type": "video"` and a `video_info` object containing `variants`.

**General web pages:** After fetching page content, look for signs of embedded video:
- Page text is minimal but mentions a video player, "Video Player is loading", or duration timestamps
- The page title or URL suggests video content (e.g., "open_meeting", "webcast", "recording")
- The fetched content contains `<video>` references or known video platform embeds

When video is detected (or suspected), attempt to download and transcribe it.

### Download

**X/Twitter video** — extract the highest-bitrate MP4 URL from `video_info.variants` (filter for `content_type: "video/mp4"`, pick the highest `bitrate`):

```bash
curl -L -o /tmp/digest-video.mp4 "{MP4_URL}"
```

**All other video** — use `yt-dlp` which handles YouTube, HTML5 video, and most embedded players:

```bash
# Download audio only (much faster and smaller than full video)
yt-dlp -x --audio-format wav --audio-quality 0 -o "/tmp/digest-audio.%(ext)s" "URL_HERE"
```

If `yt-dlp` fails (some custom players are unsupported), try using Playwright to find the direct video/audio source URL from the page, then download with `curl -L`.

### Transcribe

```bash
# For files under 60 minutes — use base model
transcribe /tmp/digest-audio.wav base

# For files over 60 minutes — use tiny model (faster, less accurate)
transcribe /tmp/digest-audio.wav tiny

# Clean up after transcription
rm /tmp/digest-audio.wav /tmp/digest-video.mp4 2>/dev/null
```

### Important notes
- `transcribe` is at `/usr/local/bin/transcribe` — available to all VPS users.
- The script auto-limits CPU to 80% via cpulimit and uses 2 threads to avoid overloading the shared VPS.
- The script outputs timestamped segments. Use the full transcript as the primary content for analysis — it replaces the page text as the "raw content."
- Include any original page text as context alongside the transcript.
- If transcription fails, fall back to analyzing only the page text and note that the video could not be transcribed.
- Set `source_type` to include `Video` when video content was transcribed (e.g., `X Video`, `Meeting Video`, `Webcast`).

## 4. Metadata Extraction

After fetching, extract metadata for the output template:

**For X/Twitter URLs:**
- `source_label`: `@{username}` (lowercase)
- `source_type`: `X Post` (or `X Video` if video content was transcribed)

**For GitHub Repo URLs:**
- `source_label`: `{owner}/{repo}`
- `source_type`: `GitHub Repo`
- `primary_language`: From repo metadata
- `license`: From repo metadata (flag if missing — could be a risk)

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

**For GitHub Repos, replace Summary/Key Claims/Sentiment with these sections:**

**What It Does**: One paragraph explaining the repo's purpose, target audience, and core functionality.

**Code Evaluation**:
- **Stack**: Languages, frameworks, key dependencies
- **Architecture**: How the code is organized (monorepo, MVC, serverless, etc.)
- **Quality signals**: Tests present? CI/CD? Types? Linting? Documentation quality?
- **Maturity**: Stars, recent commits, release cadence, open issues vs. closed

**Security Assessment** (from the scan in Step 5):
- **Risk level**: `Low` / `Medium` / `High` / `Critical`
- **Findings**: Bulleted list of specific issues found (with file paths)
- **Missing protections**: What security measures are absent that should be present
- If no issues found, say so explicitly — don't invent problems

**Recommendations** (for repos):

- **How We Could Use It**: Specific ways this repo could benefit our projects. Be concrete — name the project, describe the integration, explain the value. Consider whether to use as-is, fork and modify, or just borrow patterns/ideas.

- **Adoption Risks**: What could go wrong — maintenance burden, breaking changes, vendor lock-in, missing features we'd need to build.

- **Action Items**: Concrete next steps if we decide to use it.

- **Project Connections**: Map to relevant projects (same project list as below — only list genuine connections).

**For all other URL types, use the standard analysis sections above, plus:**

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

Fill in the appropriate template based on URL type.

**For GitHub Repos:**

````markdown
# Digest: {owner}/{repo}

**Source**: {url}
**Type**: GitHub Repo
**Language**: {primary_language}
**License**: {license}
**Stars**: {stars} | **Forks**: {forks}
**Analyzed**: {YYYY-MM-DD HH:MM}
**Tags**: #{category}

---

## What It Does
{one paragraph}

## Code Evaluation

### Stack
{languages, frameworks, key dependencies}

### Architecture
{code organization, patterns}

### Quality Signals
{tests, CI, types, linting, docs}

### Maturity
{stars, activity, releases, issues}

## Security Assessment
**Risk Level**: {Low/Medium/High/Critical}

{bulleted findings with file paths, or "No issues found"}

## Recommendations

### How We Could Use It
- {specific integration ideas per project}

### Adoption Risks
- {maintenance, breaking changes, missing features}

### Action Items
- {next steps}

### Project Connections
- {mapping to user's projects}

---

## README
```
{README content}
```

## Project Structure
```
{directory tree}
```
````

**For all other URL types:**

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
- **GitHub Repos**: `YYYY-MM-DD-gh-{owner}-{repo}.md` (e.g., `2026-02-27-gh-jjenglert1-gtm-engineer-starter-kit.md`)
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
