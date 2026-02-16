---
name: web-reader
description: This skill should be used when needing to "read a web page", "get page content", "fetch URL as markdown", "scrape page text", or any time web page content needs to be retrieved as text/markdown rather than viewed visually. Not suitable for visual inspection of pages.
---

# Web Reader

Efficiently retrieve web page content as structured markdown using `npx playbooks get`.

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
