---
name: digest
description: This skill should be used when the user pastes any URL (web page, article, blog post, X/Twitter link, GitHub repo), says "digest this", "analyze this link", "read this page", "save this article", "check out this repo", or when a URL appears in conversation context. Also triggers on /digest command. Handles all URL types — X/Twitter posts get specialized fetch logic, GitHub repos get cloned and security-reviewed, everything else uses web-reader.
version: 1.6.0
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

**Step 5b: Full code review** — dispatch a background code review agent while you continue with the analysis.

Use the Agent tool to launch a `feature-dev:code-reviewer` subagent with `run_in_background: true`. The agent should:

1. Read all source files in the repo's core directories (src/, lib/, app/, browse/src/, etc.)
2. Review for: security issues (injection, auth bypass, path traversal), architecture quality, error handling, race conditions, resource leaks, type safety, and test coverage quality
3. Evaluate shell scripts (bin/, scripts/) for injection vectors
4. Check CI/CD configs for supply chain risks (unpinned action versions, postinstall hooks)
5. Assess the quality of any LLM prompt files (SKILL.md, system prompts, etc.)
6. Return a structured review with confidence ratings (HIGH/MEDIUM/LOW) per finding, grouped by category, with file paths and line numbers

Pass the cloned repo path (`$TMPDIR/$REPO`) to the agent. This review runs in parallel with your own analysis — incorporate its findings into the Security Assessment and Code Review Highlights sections of the digest before saving.

**If the repo is very small (<500 LOC):** Skip the background agent and do the review inline during Step 5 instead. The agent is for repos with enough code to warrant parallel review.

**Step 6: Clean up**

Clean up the temp directory. Use `find <dir> -delete` rather than `rm -rf` (security hook may block rm -rf on temp dirs).

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

**Code Review Highlights** (from the background code review in Step 5b):
- **Strengths**: 3-5 specific things the codebase does well (architecture choices, patterns, testing approach)
- **Concerns**: 3-5 specific issues found by the code review, with file paths, confidence ratings, and suggested fixes
- Group findings by severity: Critical > Important > Quality
- Include the total finding count: "Code review found N issues (X critical, Y important, Z quality)"

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

  **Structured connections:** When generating Project Connections, prepare structured `connections:` entries for the output template's YAML frontmatter. Choose the connection type based on the relationship:

  | Situation | Type | Example |
  |-----------|------|---------|
  | Content contains a recommendation the project should act on | `action-pending` | "Consider adopting this caching pattern for API responses" |
  | Content directly informs or provides context for a project | `informs` | "Market data relevant to Hyperscale newsletter coverage" |
  | Content is raw material that could be used to produce project output | `source-for` | "Interview quotes usable for Winning on Issues episode" |

  `action-pending` is the default when unsure. Only include connections where the recommendation is specific enough to be actionable — not every project mention warrants a frontmatter connection.

  **Connection rules:**
  - Target must be a specific `.md` file path (e.g., `01-Projects/Hyperscale/Hyperscale News - Project Design.md`), never a directory
  - Context must be a specific, actionable one-sentence explanation (not "Related to this project")
  - No same-directory connections (digest files are all in `web-analyses/`, so never link to other `web-analyses/` files)
  - Consider reverse links: if this digest `informs` a project doc, that project doc could get a `source-for` back to this digest during the next `/interconnection-audit` run

## Binary Quality Checks

When evaluating digest output quality, use these binary checks:

**EVAL 1: URL correctly classified**
Question: Was the URL type (X/Twitter, GitHub Repo, General Web) correctly identified?
Pass: Fetch strategy matches URL pattern
Fail: Wrong strategy used (e.g., X fetch for a blog URL)

**EVAL 2: Content successfully fetched**
Question: Did the fetch return meaningful content (not a login wall, cookie prompt, or empty page)?
Pass: Raw content section contains actual page/post text
Fail: Raw content is empty, contains "JavaScript is not available", or is a login prompt

**EVAL 3: Actionable recommendations**
Question: Do all recommendations reference specific projects and describe concrete next steps?
Pass: Every recommendation names a project and explains the integration/action
Fail: Any recommendation is generic ("could be useful for marketing")

**EVAL 4: Project connections are genuine**
Question: Are all listed project connections actually relevant (not forced)?
Pass: Each connection has a specific, actionable context sentence
Fail: Any connection is vague or the project link is a stretch

**EVAL 5: Code review dispatched for GitHub repos**
Question: For GitHub repos with >500 LOC, was a background code review agent dispatched?
Pass: Agent launched in background, findings incorporated into digest
Fail: No code review for a non-trivial repo, or findings not incorporated

**EVAL 6: Frontmatter connections valid**
Question: Do all YAML frontmatter connections point to real files with valid types?
Pass: All targets are specific .md file paths; all types are action-pending/informs/source-for
Fail: Any target is a directory, any type is invalid, or any context is generic

## Anti-Patterns

| Banned Pattern | Why | Instead Do |
|----------------|-----|-----------|
| Invent security findings without code evidence | False security claims erode trust | Only flag issues found in actual source code |
| Write connections to files outside 01-Projects/ | Violates vault structure conventions | Target must be a specific .md in 01-Projects/ |
| Recommend adoption without considering maintenance burden | Uncritical adoption leads to tech debt | Always include "Adoption Risks" for repos |
| Use generic connection context ("Related to this project") | Unactionable connections add noise | Context must be a specific, actionable sentence |
| Same-directory connections | Digest files are all in web-analyses/ | Never link to other web-analyses/ files |

## 6. Output Template

Fill in the appropriate template based on URL type.

**For GitHub Repos:**

````markdown
---
connections:
{for each project mentioned in Project Connections with a specific, actionable recommendation:}
  - target: "{relative path to project's main doc in 01-Projects/}"
    type: {action-pending | informs | source-for}
    context: "{specific, actionable one-sentence explanation of the connection}"
---

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

## Code Review Highlights

### Strengths
{3-5 specific things the codebase does well}

### Concerns
{findings grouped by severity with file:line, confidence, and fix suggestions}

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
---
connections:
{for each project mentioned in Project Connections with a specific, actionable recommendation:}
  - target: "{relative path to project's main doc in 01-Projects/}"
    type: {action-pending | informs | source-for}
    context: "{specific, actionable one-sentence explanation of the connection}"
---

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

Save to the vault's `web-analyses/` directory (external content analysis, not PARA-categorized):

```
/home/obsidian/automation-vault/web-analyses/YYYY-MM-DD-{slug}.md
```

**Remote access:** If not running on the VPS, use SSH: `ssh nonrootadmin` with `sudo -u obsidian` for file writes.

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

## Gotchas
- **Tier 1 false success** — npx playbooks may return cookie walls or login prompts that look like content. Always check output length > 100 chars AND absence of "JavaScript is not available" before accepting Tier 1 results.
- **Video temp files accumulate** — If transcription fails, /tmp/digest-audio.wav and /tmp/digest-video.mp4 persist on the shared VPS. Always run cleanup even on transcription failure.
- **Vague project connections** — "Related to Hyperscale" will be rejected. Every frontmatter connection needs a specific, actionable context like "500MW expansion data directly relevant to Q1 infrastructure coverage."

## 9. Multiple URLs

If multiple URLs are detected in the current context, process each one sequentially. After all are processed, present a summary table:

| Source | Type | Top Recommendation | File Saved |
|--------|------|--------------------|------------|
| @user1 | X Post | {brief rec} | /path/to/file.md |
| techcrunch.com | Article | {brief rec} | /path/to/file.md |

## Escalation Protocol

**STOP and ask the user before proceeding when:**
- All fetch tiers fail for a URL (don't silently produce an empty digest)
- Content appears paywalled, login-walled, or restricted — ask if the user has access or wants a different approach
- GitHub repo security scan finds CRITICAL issues (hardcoded secrets, active vulnerabilities)
- Unsure whether a project connection is genuine or forced — when in doubt, ask rather than include a weak connection
- The URL points to content that may be legally sensitive (court filings, sealed documents, DMCA'd content)
- Video transcription fails and the page content alone is insufficient for meaningful analysis

**Do NOT escalate (handle autonomously):**
- Falling back between fetch tiers (Tier 1 → 2 → 3)
- Classifying URL type and selecting fetch strategy
- Generating project connections for clearly relevant content
- Dispatching background code review agents for GitHub repos

## Completion Status

When the digest is complete, report:

```
DIGEST: {source_label}
═══════════════════════════
URL type: {X Post / GitHub Repo / Article / etc.}
Fetch tier: {which tier succeeded}
Content length: {word count of raw content}
Connections: {count} project connections proposed
File saved: {full path}
Code review: {dispatched/completed/skipped/N/A}
═══════════════════════════
```

## Verification of Claims

- **Every project connection must cite specific content** from the source that justifies the connection. "Related to Hyperscale" is not evidence — "Article discusses 500MW datacenter expansion in Texas" is.
- **Security findings for GitHub repos must cite file paths and line numbers**, not just categories.
- **"No issues found" in security assessment must state what was checked**, not just the absence of findings.
- **Fetch tier fallback must log why the previous tier failed** (e.g., "Tier 1 returned login wall", not just "fell back to Tier 2").
- **Frontmatter connection targets must be verified to exist** before writing them.

## Learning

When this skill runs, append observations to `.learnings.jsonl`:

```json
{"timestamp": "ISO-8601", "skill": "digest", "event_type": "edge_case", "context": "Tier 1 fetch failed on paywalled article — fell back to Tier 2 successfully"}
{"timestamp": "ISO-8601", "skill": "digest", "event_type": "user_correction", "context": "User removed project connection to DLG — content wasn't actually relevant to legal work"}
```

Track these patterns:
- Tier 1 vs Tier 2 fallback ratio (how often does playbooks fail?)
- Which project connections get removed by users? (signals forced connections)
- Security assessment accuracy for GitHub repos (did flagged issues matter?)
- Video transcription success rate
