---
name: web-reader
description: This skill should be used when needing to "read a web page", "get page content", "fetch URL as markdown", "scrape page text", or any time web page content needs to be retrieved as text/markdown rather than viewed visually. Not suitable for visual inspection of pages.
version: 1.1.0
effort: low
expires_when: "WebFetch reliably strips nav/ads/clutter and returns clean markdown equal to defuddle — whole skill retires, no durable remainder (pure tooling workaround for the extraction gap); tooling clock, so no model-arrival hook ever fires for it"
---

# Web Reader

Efficiently retrieve web page content as structured markdown using `npx defuddle parse`, the content-extraction engine behind Obsidian Web Clipper.

## Step 0: Validate Before Proceeding

Confirm the fetch target before issuing any command. A missing or malformed URL means
the fetch will either fail with a cryptic error or silently retrieve the wrong content.

- **Confirm a URL was provided.** If the user said "read this page" or "check this" without
  including a URL, ask for one. Do not infer a URL from earlier conversation context —
  the user may have multiple pages in mind.
- **Verify the URL starts with `http://` or `https://`.** Bare domains (`example.com`),
  paths (`/docs/api`), or pasted text fragments are not valid inputs to `npx defuddle parse`
  and will return confusing errors rather than a meaningful page.

## When to Use

Use `npx defuddle parse <url> --md` instead of WebFetch any time the goal is to read the **text content and structure** of a web page. It strips nav/ads/clutter and returns clean markdown that is more token-efficient and better structured than WebFetch, plus it can surface structured metadata (title, author, published date, domain) via `--json` or `-p`.

**Do not use** when the goal is to visually inspect a page (layout, styling, screenshots). Use Playwright or WebFetch for visual tasks.

## Usage

```bash
npx defuddle parse <url> --md
```

Returns the page content converted to markdown, including headings, links, lists, and body text.

Other useful forms:

```bash
# Structured metadata as JSON (title, author, published, domain, description, wordCount)
npx defuddle parse <url> --json

# Prepend YAML frontmatter to the markdown (Obsidian-ready)
npx defuddle parse <url> --md --frontmatter

# Extract a single field
npx defuddle parse <url> -p title

# Custom User-Agent when a site returns 403
npx defuddle parse <url> --md -u "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
```

## Examples

```bash
# Read a documentation page
npx defuddle parse https://docs.example.com/api/reference --md

# Read a blog post
npx defuddle parse https://example.com/blog/post-title --md

# Read a GitHub README
npx defuddle parse https://github.com/owner/repo --md
```

## Fallback Chain

Both defuddle and playbooks are JSDOM-based (they do **not** execute JavaScript), so both fail the same way on JS-heavy SPAs. Escalate through the chain in order:

1. **`npx defuddle parse <url> --md`** — primary. Best article-boundary quality and metadata.
2. **`npx playbooks get <url>`** — fallback. A different converter sometimes succeeds where defuddle returns thin content.
3. **WebFetch tool** — fallback. Handles some pages the JSDOM converters miss.
4. **Playwright / dev-browser** — last resort for JS-rendered pages that require a real browser.

## Guidelines

- Prefer `npx defuddle parse --md` over WebFetch for all text-content retrieval tasks.
- Pipe output or capture as needed for further processing.
- If the command fails, returns thin content, or the page requires JavaScript rendering, walk down the fallback chain above.
- Works best for static content, documentation, articles, and markdown-friendly pages.

## Gotchas
- **Empty output ≠ page failure** — a JSDOM converter (defuddle or playbooks) may return an empty string or <100 chars for JS-heavy pages. Check exit code == 0 AND output length > 100 chars before accepting. If either fails, fall through to the next tier.
- **Login pages returned as content** — Some sites return 200 OK with embedded login HTML. If output contains `<form>`, `<input type="password">`, or login keywords, escalate — don't treat it as page content.
- **403 / FORBIDDEN** — some sites block the default User-Agent. Retry defuddle once with `-u "<a normal browser UA>"` before falling through to the next tier.

## Escalation & Completion

**Escalate when:** The page requires authentication, returns a CAPTCHA, or defuddle, playbooks, and WebFetch all fail. Report the failure and ask the user for an alternative approach.

**Completion:** Report whether content was successfully retrieved, the approximate word count, and which method was used (defuddle, playbooks, or WebFetch fallback).

**Verification:** If reporting that a page is empty or inaccessible, show the actual command output or error message as evidence.
