# Claude Code Skills

> **Production-tested skills for Claude Code** — security auditing, writing, and web tools that actually work.

These skills extend [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with specialized domain knowledge and workflows. They are not wrappers or thin prompts — each one encodes real methodology built from hands-on consulting work.

If these save you time, **[give the repo a star](https://github.com/jdickey1/claude-skills)** so others can find them too.

---

## What's Included

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

### visual-package

**Clone an incumbent visual system** for posters, carousels, one-pagers, leave-behinds, and clip packets. Generic gate only. If a shop overlay skill named `shop-visuals` is installed, load it; that overlay owns runbooks and stems.

### skill-creator

**Create, test, harden, and continuously improve Claude Code skills.** A unified workflow that combines eval infrastructure, TDD methodology, and self-improving learning loops.

- 7-phase lifecycle: capture intent → draft → RED/GREEN test → REFACTOR/harden → learning instrumentation → description optimization → package
- Eval system with HTML viewer, benchmarking, and blind A/B comparison
- Self-improving learning loops: skills emit structured events, accumulate patterns, and propose their own improvements
- Built on [Anthropic's skill-creator](https://github.com/anthropics/claude-plugins-official) eval infrastructure and [superpowers](https://github.com/obra/superpowers) TDD methodology (MIT)

---

## Installation

### 1. Add this marketplace to Claude Code

```
/plugins marketplace add jdickey1/claude-skills
```

### 2. Install the plugins you want

```
/plugins install security-audit@claude-skills
/plugins install writing@claude-skills
/plugins install web-reader@claude-skills
/plugins install digest@claude-skills
/plugins install skill-creator@claude-skills
```

Or browse with `/plugins` > **Discover** to see all available plugins.

### 3. Use them

Skills activate automatically based on context, or use slash commands directly:

```
/write-x "new product launch announcement"
/write-linkedin "lessons from scaling to 10K users"
/write-headline "blog post about AI in healthcare"
/write-review [paste content]
/teach-writing
/digest https://example.com/article
```

### Updating

Marketplace plugins update automatically when Claude Code syncs. You can also manually update with `/plugins update`.

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Playwright plugin (for live page inspection)
- Node.js 18+ (for the automation tools)

---

## Contributing

Issues and PRs welcome. If you build skills that complement these (different security frameworks, new writing platforms, other research tools), open a PR.

---

## License

MIT

---

**Found these useful?** [Star the repo](https://github.com/jdickey1/claude-skills) to help other Claude Code users find them.
