# Claude Code Skills

> **Production-tested skills for Claude Code** — SEO, security auditing, writing, and web tools that actually work.

These skills extend [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with specialized domain knowledge and workflows. They are not wrappers or thin prompts — each one encodes real methodology built from hands-on consulting work.

If these save you time, **[give the repo a star](https://github.com/jdickey1/claude-skills)** so others can find them too.

---

## What's Included

### seo

**Comprehensive SEO audit, optimization, and automation.** Combines a 4-tier audit framework with a full DIY automation system that replaces the core deliverables of a $1,500/month agency.

- 4-tier audit checklist (~80 items): indexation, on-page, local SEO, AI search readiness (AEO/GEO), link building
- Local business SEO as progressively disclosed subset — GBP optimization, citations, NAP consistency, review management
- Evidence-based ranking factor priorities with severity calibration
- 6 workflows: full audit, GBP optimization, weekly maintenance, automation setup, content briefs, report analysis
- Automation scripts for keyword research, backlink intelligence, Google Search Console monitoring, content briefs, and outreach
- Keyword validation framework (SERP test, PAA check, competitor check, AI query alignment)

The automation tools in `seo/Tools/` are production Node.js scripts that integrate with Keywords Everywhere, DataForSEO, Serper, and Google Search Console APIs.

### security-audit

**Red-team security audit framework** modeled on how top penetration testers actually work — not a checklist, but a methodology.

- Follows OWASP Top 10 and NIST 800-53
- Traces data flows, identifies logic flaws, catches subtle vulnerabilities automated tools miss
- Covers authentication, authorization, injection, cryptography, API security, infrastructure hardening
- Structured severity ratings (Critical/High/Medium/Low/Info) with remediation guidance
- Designed for web applications, APIs, and supporting infrastructure

### writing

**Research-backed writing standards for human-quality content.** Universal rules that apply to everything you write, plus platform-specific optimization guides.

- Anti-AI detection: em dash ban, buzzword replacement table, contractions, sentence rhythm variation
- Headline optimization with hard statistics (80% of readers never get past the headline)
- Platform guides: X posts (algorithm signals, link decoupling), X articles, LinkedIn (algorithm priorities, hook formulas), website copy (SEO, CTAs, content structure)
- Persuasion frameworks: PAS, BAB, AIDA, FAB, 4Ps, plus classic direct response principles
- Pre-publish checklist covering all quality gates

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
/plugins install seo@claude-skills
/plugins install security-audit@claude-skills
/plugins install writing@claude-skills
/plugins install web-reader@claude-skills
```

Or browse with `/plugins` > **Discover** to see all available plugins.

### 3. Use them

Skills activate automatically based on context. Ask Claude Code to:

- "Run a security audit on this app"
- "Do an SEO audit of example.com"
- "Create a content brief for [keyword]"
- "Audit my Google Business Profile"
- "Write a LinkedIn post about [topic]"
- "Review this copy for AI tells"
- "Read this page and summarize it"

### Updating

Marketplace plugins update automatically when Claude Code syncs. You can also manually update with `/plugins update`.

---

## SEO Automation Setup

The SEO plugin includes 5 Node.js automation scripts that connect to external APIs. To use them:

1. Get API keys from [Keywords Everywhere](https://keywordseverywhere.com/), [DataForSEO](https://dataforseo.com/), [Serper](https://serper.dev/), and [Google Search Console](https://search.google.com/search-console)
2. Create a `.env` file with your keys (see `seo/Tools/.env.example`)
3. Ask Claude Code to run the tools — it knows how to use them

Total cost for all APIs: roughly $75/month for a typical small business.

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Playwright plugin (for seo live page inspection)
- Node.js 18+ (for SEO automation tools)

---

## Contributing

Issues and PRs welcome. If you build skills that complement these (technical SEO, e-commerce SEO, different security frameworks), open a PR.

---

## License

MIT

---

**Found these useful?** [Star the repo](https://github.com/jdickey1/claude-skills) to help other Claude Code users find them.
