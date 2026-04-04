---
name: web-reader
description: This skill should be used when needing to "read a web page", "get page content", "fetch URL as markdown", "scrape page text", or any time web page content needs to be retrieved as text/markdown rather than viewed visually. Not suitable for visual inspection of pages.
version: 1.0.0
effort: low
---

# Web Reader

Efficiently retrieve web page content as structured markdown using `npx playbooks get`.

## Step 0: Validate Before Proceeding

Confirm the fetch target before issuing any command. A missing or malformed URL means
the fetch will either fail with a cryptic error or silently retrieve the wrong content.

- **Confirm a URL was provided.** If the user said "read this page" or "check this" without
  including a URL, ask for one. Do not infer a URL from earlier conversation context —
  the user may have multiple pages in mind.
- **Verify the URL starts with `http://` or `https://`.** Bare domains (`example.com`),
  paths (`/docs/api`), or pasted text fragments are not valid inputs to `npx playbooks get`
  and will return confusing errors rather than a meaningful page.

## When to Use

Use `npx playbooks get <url>` instead of WebFetch any time the goal is to read the **text content and structure** of a web page. This returns clean markdown output that is more token-efficient and better structured than WebFetch.

**Do not use** when the goal is to visually inspect a page (layout, styling, screenshots). Use Playwright or WebFetch for visual tasks.

## Usage

```bash
npx playbooks get <url>
```

Returns the page content converted to markdown, including headings, links, lists, and body text.

## Examples

```bash
# Read a documentation page
npx playbooks get https://docs.example.com/api/reference

# Read a blog post
npx playbooks get https://example.com/blog/post-title

# Read a GitHub README
npx playbooks get https://github.com/owner/repo
```

## Guidelines

- Prefer `npx playbooks get` over WebFetch for all text-content retrieval tasks.
- Pipe output or capture as needed for further processing.
- If the command fails or the page requires JavaScript rendering, fall back to WebFetch or Playwright.
- Works best for static content, documentation, articles, and markdown-friendly pages.

## Gotchas
- **Empty output ≠ page failure** — npx playbooks may return empty string or <100 chars for JS-heavy pages. Check exit code == 0 AND output length > 100 chars before accepting. If either fails, fall back to WebFetch.
- **Login pages returned as content** — Some sites return 200 OK with embedded login HTML. If output contains `<form>`, `<input type="password">`, or login keywords, escalate — don't treat it as page content.

## Escalation & Completion

**Escalate when:** The page requires authentication, returns a CAPTCHA, or `npx playbooks get` and WebFetch both fail. Report the failure and ask the user for an alternative approach.

**Completion:** Report whether content was successfully retrieved, the approximate word count, and which method was used (playbooks or WebFetch fallback).

**Verification:** If reporting that a page is empty or inaccessible, show the actual command output or error message as evidence.
