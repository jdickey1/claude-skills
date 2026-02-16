# Claude Code Skills

> **Production-tested skills for Claude Code** — SEO, security auditing, and web tools that actually work.

These skills extend [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with specialized domain knowledge and workflows. They are not wrappers or thin prompts — each one encodes real methodology built from hands-on consulting work.

If these save you time, **[give the repo a star](https://github.com/jdickey1/claude-skills)** so others can find them too.

---

## What's Included

### LocalSEO

**Full local SEO system for service businesses.** Replaces the core deliverables of a $1,500/month SEO agency with Claude Code automation.

- 21 battle-tested local SEO rules (keyword placement, GBP optimization, citation strategy)
- Complete audit workflows: technical SEO, content gaps, competitor analysis
- Automation scripts for keyword research, backlink intelligence, Google Search Console monitoring, content briefs, and outreach
- GBP optimization playbook with category strategy and review management
- Weekly/monthly maintenance cadences

The automation tools in `LocalSEO/Tools/` are production Node.js scripts that integrate with Keywords Everywhere, DataForSEO, Serper, and Google Search Console APIs.

### security-audit

**Red-team security audit framework** modeled on how top penetration testers actually work — not a checklist, but a methodology.

- Follows OWASP Top 10 and NIST 800-53
- Traces data flows, identifies logic flaws, catches subtle vulnerabilities automated tools miss
- Covers authentication, authorization, injection, cryptography, API security, infrastructure hardening
- Structured severity ratings (Critical/High/Medium/Low/Info) with remediation guidance
- Designed for web applications, APIs, and supporting infrastructure

### seo-review

**Comprehensive website SEO audit** that inspects live pages using Playwright, checks source code, and evaluates against modern search best practices.

- Technical SEO: indexation, crawlability, page speed, Core Web Vitals
- On-page: title tags, meta descriptions, heading structure, internal linking
- Local business: NAP consistency, Google Business Profile, citations, reviews
- Structured data and schema markup validation
- AI search readiness (AEO/GEO) — optimizing for AI-generated answers
- Content strategy and link building assessment

### web-reader

**Clean web page content extraction.** Fetches any URL and returns it as structured markdown for analysis. Simple, reliable, and useful as a building block for other workflows.

---

## Installation

### 1. Add this marketplace to Claude Code

```
/plugins marketplace add jdickey1/claude-skills
```

### 2. Install the plugins you want

```
/plugins install LocalSEO@claude-skills
/plugins install security-audit@claude-skills
/plugins install seo-review@claude-skills
/plugins install web-reader@claude-skills
```

Or browse with `/plugins` > **Discover** to see all available plugins.

### 3. Use them

Skills activate automatically based on context. Ask Claude Code to:

- "Run a security audit on this app"
- "Do an SEO review of example.com"
- "Create a content brief for [keyword]"
- "Audit my Google Business Profile"
- "Read this page and summarize it"

### Updating

Marketplace plugins update automatically when Claude Code syncs. You can also manually update with `/plugins update`.

---

## LocalSEO Automation Setup

The LocalSEO plugin includes 5 Node.js automation scripts that connect to external APIs. To use them:

1. Get API keys from [Keywords Everywhere](https://keywordseverywhere.com/), [DataForSEO](https://dataforseo.com/), [Serper](https://serper.dev/), and [Google Search Console](https://search.google.com/search-console)
2. Create a `.env` file with your keys (see `LocalSEO/Tools/.env.example`)
3. Ask Claude Code to run the tools — it knows how to use them

Total cost for all APIs: roughly $75/month for a typical small business.

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Playwright plugin (for seo-review live page inspection)
- Node.js 18+ (for LocalSEO automation tools)

---

## Contributing

Issues and PRs welcome. If you build skills that complement these (technical SEO, e-commerce SEO, different security frameworks), open a PR.

---

## License

MIT

---

**Found these useful?** [Star the repo](https://github.com/jdickey1/claude-skills) to help other Claude Code users find them.
