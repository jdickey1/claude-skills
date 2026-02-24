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
5. Check NAP consistency against their website

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
