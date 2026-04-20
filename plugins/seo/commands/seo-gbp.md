---
description: Audit and optimize a Google Business Profile for local search ranking
argument-hint: <business name>
---

**First**: Use the `seo` skill for core philosophy and local SEO principles.

Audit and optimize the Google Business Profile for the provided business (`$ARGUMENTS`). If no business name is provided, ask the user.

## Process

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/local-seo.md` for the full GBP optimization checklist
2. Search for the business on Google to find their GBP listing
3. Check each item in the GBP checklist
4. Review their review profile (count, velocity, response patterns)
5. Run the **NAP Consistency Procedure** from `${CLAUDE_PLUGIN_ROOT}/skills/seo/reference/local-seo.md` (section: "NAP Consistency Procedure") — extract NAP from all canonical sources, emit the delta report, and assign severities from the procedure's severity table. The delta report is a required output block (see Output below). If dev-browser can't reach Google Maps, follow the procedure's user-paste fallback and mark the GBP row's confidence as `NEEDS VERIFICATION`.

## Checklist

### Category & Setup
- [ ] Business category matches top 3 competitors
- [ ] GBP links to location/service page, NOT homepage
- [ ] Products/Services section filled out
- [ ] Business name clean (no keyword stuffing)
- [ ] NAP matches website exactly
- [ ] Hours current and accurate

### Content & Media
- [ ] New photo uploaded this week
- [ ] Recent GBP update with keyword + location
- [ ] Q&A section populated
- [ ] Description filled with natural keywords

### Reviews
- [ ] Every review has a response (within 24 hours)
- [ ] Active review generation system in place
- [ ] Review velocity maintained
- [ ] Review responses include keywords naturally

## Output

Report on each section with PASS/FAIL and specific recommendations. Include GBP update examples tailored to their business.

### NAP Consistency Delta

Include the full Markdown delta-report table produced by the NAP Consistency Procedure (sources-as-rows, NAP-fields-as-columns) plus the per-drift severity-rated findings. This block is required whenever a GBP listing exists. Drift findings emit into the overall PASS/FAIL at their mapped severity (CRITICAL suspension risks fail the Category & Setup section; HIGH / MEDIUM / LOW / INFO feed into their respective sections).
