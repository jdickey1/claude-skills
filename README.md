# Claude Code Skills

> **Production-tested skills for Claude Code** — SEO, security auditing, writing, and web tools that actually work.

These skills extend [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with specialized domain knowledge and workflows. They are not wrappers or thin prompts — each one encodes real methodology built from hands-on consulting work.

If these save you time, **[give the repo a star](https://github.com/jdickey1/claude-skills)** so others can find them too.

---

## What's Included

### seo

**Comprehensive SEO audit, optimization, and automation.** Combines a 4-tier audit framework with a full DIY automation system that replaces the core deliverables of a $1,500/month agency.

**Slash commands:**

| Command | What it does |
|---------|-------------|
| `/seo-audit <url>` | Run full 4-tier SEO audit (~180 checklist items) |
| `/seo-brief <keyword>` | Create content brief with SERP analysis and keyword validation |
| `/seo-gbp <business>` | Audit and optimize Google Business Profile |
| `/seo-weekly` | Run weekly recurring SEO maintenance tasks |
| `/seo-report` | Analyze GSC, keyword, and backlink data |
| `/seo-automate` | Set up DIY automation scripts (~$75/mo vs ~$1,500/mo agency) |
| `/teach-seo` | Gather site context, write SEO config to CLAUDE.md |

**What it covers:**
- **4-tier audit checklist (~180 items):** indexation, Core Web Vitals, on-page optimization, E-E-A-T, schema markup, local SEO (GBP, citations, SABs), AI search readiness (AEO/GEO), content strategy, link building
- **On-page SEO** with structured subsections: title tags, meta descriptions, headers, URLs, images, internal linking, semantic optimization
- **E-E-A-T framework** organized by priority: Trust (foundation), Experience (hardest to fake), Expertise, Authoritativeness — with YMYL guidance and entity SEO signals
- **Schema markup** covering JSON-LD best practices, FAQ/Article/LocalBusiness/Person types, deprecated types (Jan 2026), dual validation workflow
- **AI search optimization (AEO/GEO)** with platform-specific citation data for Google AI Overviews, ChatGPT, Perplexity, and Copilot — including defensive AI SEO and multimodal content metrics
- **Content strategy** with topic clusters, content pruning, internal linking architecture, video optimization, and social proof integration
- **Link building** with prioritized tactics (Digital PR, HARO, guest posting), anchor text distribution, link velocity guidance, and content types that earn links
- **Local business SEO** — GBP optimization, citations (quality hierarchy), NAP consistency, review management, SAB content strategy, Google spam warnings
- **Built-in verification protocol** to prevent false findings from content extractors — requires raw HTML confirmation before marking structural findings as confirmed
- Automation scripts for keyword research, backlink intelligence, Google Search Console monitoring, content briefs, and outreach
- Keyword validation framework (SERP test, PAA check, competitor check, AI query alignment)

### security-audit

**Red-team security audit framework** modeled on how top penetration testers actually work — not a checklist, but a methodology.

- Follows OWASP Top 10 and NIST 800-53
- Traces data flows, identifies logic flaws, catches subtle vulnerabilities automated tools miss
- Covers authentication, authorization, injection, cryptography, API security, infrastructure hardening
- Structured severity ratings (Critical/High/Medium/Low/Info) with remediation guidance
- Designed for web applications, APIs, and supporting infrastructure

### writing

**Research-backed writing standards for human-quality content.** Universal rules that apply to everything you write, plus platform-specific optimization guides.

**Slash commands:**

| Command | What it does |
|---------|-------------|
| `/write-x <topic>` | Write an X/Twitter post |
| `/write-linkedin <topic>` | Write a LinkedIn post |
| `/write-web <topic>` | Write website copy or blog post |
| `/write-headline <topic>` | Generate 5+ headline candidates with formulas |
| `/write-newsletter <topic>` | Write email/newsletter content |
| `/write-review <content>` | Review/edit existing content for AI tells |
| `/teach-writing` | Gather voice/brand context, write to CLAUDE.md |

**What it covers:**
- Anti-AI detection: em dash ban, buzzword replacement table, contractions, sentence rhythm variation
- Headline optimization with hard statistics (80% of readers never get past the headline)
- Platform guides: X posts (algorithm signals, link decoupling), X articles, LinkedIn (algorithm priorities, hook formulas), website copy (SEO, CTAs, content structure)
- Interview script standards for podcasts and video
- Persuasion frameworks: PAS, BAB, AIDA, FAB, 4Ps, plus classic direct response principles
- Pre-publish checklist covering all quality gates

### web-reader

**Clean web page content extraction.** Fetches any URL and returns it as structured markdown for analysis. Simple, reliable, and useful as a building block for other workflows.

### digest

**Universal web content analysis and capture.** Fetches any URL — articles, blog posts, documentation, X/Twitter posts — analyzes the content, saves structured analysis to Obsidian, and recommends actionable uses including content ideas, action items, and project connections. X/Twitter links get specialized 3-tier fetch logic; all other URLs use clean markdown extraction. **Video support:** X/Twitter posts with native video are automatically downloaded and transcribed using faster-whisper (CPU-optimized, capped at 80% CPU usage).

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
/plugins install digest@claude-skills
```

Or browse with `/plugins` > **Discover** to see all available plugins.

### 3. Use them

Skills activate automatically based on context, or use slash commands directly:

```
/seo-audit example.com
/seo-brief "personal injury lawyer austin"
/seo-gbp "Smith & Associates Law"
/write-x "new product launch announcement"
/write-linkedin "lessons from scaling to 10K users"
/write-headline "blog post about AI in healthcare"
/write-review [paste content]
/teach-seo
/teach-writing
/digest https://example.com/article
```

### Updating

Marketplace plugins update automatically when Claude Code syncs. You can also manually update with `/plugins update`.

---

## SEO Automation Setup

The SEO plugin includes 5 Node.js automation scripts that connect to external APIs. To use them:

1. Get API keys from [Keywords Everywhere](https://keywordseverywhere.com/), [DataForSEO](https://dataforseo.com/), [Serper](https://serper.dev/), and [Google Search Console](https://search.google.com/search-console)
2. Create a `.env` file with your keys (see `seo/Tools/.env.example`)
3. Ask Claude Code to run the tools — it knows how to use them, or use `/seo-automate` for guided setup

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
