---
description: Create a content brief for a target keyword using SERP analysis
argument-hint: <keyword>
---

**First**: Use the `seo` skill for core philosophy and keyword validation principles.

Create a comprehensive content brief for the provided keyword (`$ARGUMENTS`). If no keyword is provided, ask the user for a target keyword.

## Process

### Step 0: Keyword Validation (Do This First)

Before writing any brief, validate that the target keyword matches real search behavior:

1. **SERP test** — Search the exact keyword in Google. Results dominated by local competitors and directories = valid. Results showing DIY sites, forms, or unrelated content = weak keyword.
2. **PAA check** — People Also Ask questions should align with the service being offered. If PAA is all DIY/informational, the keyword attracts researchers not buyers.
3. **Competitor page check** — Do 3+ local competitors have a dedicated page for this keyword? If yes, validated. If zero, investigate further.
4. **AI query alignment** — Would someone ask ChatGPT or Google AI this question? If yes, FAQ sections can capture AI answer traffic.
5. **Make the call:**
   - **Strong keyword:** SERP shows competitors + directories, PAA aligns, 3+ competitors target it -> Write the brief
   - **Weak keyword:** SERP shows DIY sites, no competitors target it -> Recommend folding into a parent page
   - **Niche keyword:** Low volume but high intent, no competition -> May be worth a page, set expectations

**If the keyword fails validation, recommend alternative keywords or folding content into an existing page. Do not write a brief for a keyword nobody searches for.**

### Step 1: Gather SERP Data

If the Serper API is configured (`SERPER_API_KEY` environment variable), fetch top 10 results:
```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/seo/Tools/content-brief.mjs "$ARGUMENTS"
```

If no API access, ask the user to paste the top 10 Google results (titles + URLs + meta descriptions).

### Step 2: Analyze Results

For each top 10 result, identify: content type, estimated word count, unique angles, sections/subtopics covered.

### Step 3: Generate the Brief

Produce a brief with these sections:

1. **Title Options** — 3 options with keyword front-loaded, include number/year/power word
2. **Target Word Count** — based on what's ranking (match or exceed top 3)
3. **Search Intent** — informational, transactional, navigational, or commercial investigation
4. **Outline** — H1/H2/H3 structure covering everything top results cover + 2-3 sections they're MISSING
5. **Topics to Cover** — specific points, stats, questions to answer, PAA questions
6. **Internal Linking** — what to link to and from
7. **Competitor Gaps** — top 3 things ranking content is missing

## For Local Businesses

- Target "service + city" not "how to"
- Ensure keyword + city appears in H1
- URL slug should be descriptive

## Output

Return the brief as clean markdown. No preamble. Ready to hand to a writer or use as a Claude prompt for drafting.
