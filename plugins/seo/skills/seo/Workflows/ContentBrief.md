# Content Brief Generator

Create a comprehensive content brief for a target keyword using SERP analysis and competitor gap identification.

## Triggers

- "create a content brief for [keyword]"
- "brief me on [keyword]"
- "content plan for [keyword]"
- "what should I write about [keyword]"

## Prerequisites

- **Serper API key** set as `SERPER_API_KEY` environment variable
- Or: user provides top 10 Google results manually

## Process

### Step 0: Keyword Validation (Do This First)

Before writing any brief, validate that the target keyword matches real search behavior:

1. **Check if people actually search this phrase.** Search the exact keyword in Google. If the results are dominated by directories (Yelp, SuperLawyers, Avvo), that's a transactional keyword with real volume — good. If results are mostly DIY sites, forms, or unrelated content, the keyword may not drive attorney-hiring traffic.

2. **Check the "People Also Ask" box.** These are the actual questions searchers ask. If PAA questions align with the service, the keyword is valid. If PAA is all DIY/informational, the keyword attracts researchers not buyers.

3. **Check competitor pages.** Do competing local businesses have dedicated pages for this keyword? If 3+ local competitors have a page targeting this keyword, it's validated. If zero competitors target it, either it's a gap (opportunity) or nobody searches for it (waste of time). Look at the content depth — thin competitor pages suggest low search demand.

4. **Check AI alignment.** Ask: "Would someone ask ChatGPT or Google AI this question?" If yes, the FAQ section of this page can capture AI-generated answer traffic. If the topic is too niche for AI queries, focus the page on traditional search only.

5. **Make the call:**
   - **Strong keyword:** SERP shows local competitors + directories, PAA aligns, 3+ competitors have dedicated pages → Write the brief
   - **Weak keyword:** SERP shows DIY sites, no local competitors target it, PAA is off-topic → Don't create a standalone page. Fold the content into a stronger page as a section instead.
   - **Niche keyword:** Low volume but high intent and no competition → May be worth a page, but set expectations that traffic will be low. Evaluate if the content works better as a section within a higher-traffic parent page.

**If the keyword fails validation, recommend alternative keywords or recommend folding content into an existing page. Do not write a brief for a keyword nobody searches for.**

### Step 1: Gather SERP Data

If the Serper API is configured, fetch top 10 results:

```bash
node Tools/content-brief.mjs "[KEYWORD]"
```

If no API access, ask the user to paste the top 10 Google results for the keyword (titles + URLs + meta descriptions).

### Step 2: Analyze the Results

For each of the top 10 results, identify:
- **Content type** (listicle, guide, comparison, case study, tool page)
- **Estimated word count** (based on content depth signals in title/description)
- **Unique angles** each competitor takes
- **Sections/subtopics covered** (infer from titles, URLs, descriptions)

### Step 3: Generate the Brief

Produce a brief with these sections:

#### 1. Title Options
- 3 options that include the target keyword
- Front-load the keyword (per BestPractices.md rule #1)
- Include a number, year, or power word where appropriate

#### 2. Target Word Count
- Based on what's ranking (match or exceed top 3)
- Round to nearest 500

#### 3. Search Intent
- Classify: informational, transactional, navigational, or commercial investigation
- Note if intent is mixed

#### 4. Outline
```
H1: [Title]
  H2: [Section]
    H3: [Subsection]
  H2: [Section]
    H3: [Subsection]
  ...
```
- Include every section the top 3 results cover
- Add 2-3 sections competitors are MISSING (the competitive edge)
- For local businesses: ensure "service + city" appears in H1 and at least one H2

#### 5. Topics to Cover
- Bullet list of specific points, stats, or questions to answer
- Include "People Also Ask" questions if available

#### 6. Internal Linking
- What existing pages should this content link TO
- What existing pages should link TO this new content

#### 7. Competitor Gaps
- Top 3 things the ranking content is missing
- These become your differentiation sections

## Output Format

Return the brief as clean markdown. No preamble. Ready to hand to a writer or use as a Claude prompt for drafting.

## For Local Businesses

Apply BestPractices.md rules:
- Target "service + city" not "how to" (Rule #7)
- No blog-style content unless it targets buyer intent (Rule #8)
- Ensure the keyword + city appears in the recommended H1 (Rule #2)
- URL slug should be descriptive (Rule #3)
