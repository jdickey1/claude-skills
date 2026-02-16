---
name: LocalSEO
description: Local SEO audit, optimization, and automation for service businesses. USE WHEN audit SEO OR check GBP OR optimize local search OR review website SEO OR local business marketing OR citation building OR review strategy OR keyword research OR backlink analysis OR content brief OR SEO automation OR replace SEO agency OR analyze SEO report OR review GSC data OR create content brief.
---

# LocalSEO

Local SEO framework for service-based businesses. Covers on-page optimization, Google Business Profile (GBP), citations, link building, maintenance habits, and a full DIY automation system to replace agency work.

## Reference

- **`BestPractices.md`** - The 21 rules behind every checklist item. Read this first to understand the "why."
- **`AutomationSystem.md`** - Full DIY system with prompts and templates. Keyword research, backlink recon, GSC monitoring, content briefs, and outreach automation. ~$75/month replaces ~$1,500/month agency.
- **`Tools/`** - Production-ready scripts with error handling, retry logic, JSON output, and logging. See `Tools/.env.example` for configuration.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **FullAudit** | "audit SEO for [site]", "full SEO check" | `Workflows/FullAudit.md` |
| **GBPOptimize** | "check my GBP", "optimize Google Business Profile" | `Workflows/GBPOptimize.md` |
| **WeeklyMaintenance** | "weekly SEO tasks", "SEO maintenance" | `Workflows/WeeklyMaintenance.md` |
| **AutomationSetup** | "set up SEO automation", "replace SEO agency", "DIY SEO scripts" | `Workflows/AutomationSetup.md` |
| **ContentBrief** | "create content brief for [keyword]", "brief me on [topic]", "content plan for [keyword]" | `Workflows/ContentBrief.md` |
| **ReportAnalysis** | "analyze SEO report", "review keyword data", "review GSC data", "what does my SEO data say" | `Workflows/ReportAnalysis.md` |

## Tools

Standalone scripts in `Tools/` for automation. All output JSON to `data/seo/YYYY-MM-DD/`.

| Script | Purpose | Schedule |
|--------|---------|----------|
| `keyword-research.mjs` | Expand seed keywords with volume/CPC data | Monday 9 AM |
| `competitor-backlinks.mjs` | Scan competitor backlinks for opportunities | Wednesday 9 AM |
| `gsc-report.mjs` | GSC data pull with period comparison | Monday 9 AM |
| `content-brief.mjs` | Fetch SERP data and generate brief prompt | On demand |
| `backlink-outreach.mjs` | Generate outreach queue (dry-run by default) | Wed + Fri 10 AM |

## Examples

**Example 1: Full site audit**
```
User: "Audit SEO for podstylevideo.com"
-> Invokes FullAudit workflow
-> Checks on-page, GBP, citations, indexing, 404s
-> Returns prioritized action list
```

**Example 2: GBP optimization**
```
User: "Check my Google Business Profile setup"
-> Invokes GBPOptimize workflow
-> Reviews category, products, photos, updates, reviews
```

**Example 3: Weekly check-in**
```
User: "What are my weekly SEO tasks?"
-> Invokes WeeklyMaintenance workflow
-> Returns this week's checklist
```

**Example 4: Build automation system**
```
User: "Help me set up SEO automation to replace our agency"
-> Invokes AutomationSetup workflow
-> Walks through API setup, script deployment, cron scheduling
-> References AutomationSystem.md for full scripts
```

**Example 5: Content brief**
```
User: "Create a content brief for cold email deliverability"
-> Invokes ContentBrief workflow
-> Fetches top 10 SERP results via Serper API
-> Generates comprehensive brief with outline, gaps, and recommendations
```

**Example 6: Analyze weekly report**
```
User: "Analyze my SEO report"
-> Invokes ReportAnalysis workflow
-> Reads latest data from data/seo/
-> Cross-references GSC, keyword, and backlink data
-> Produces prioritized action plan
```
