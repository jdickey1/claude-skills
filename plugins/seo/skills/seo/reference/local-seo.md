# Local SEO: GBP, Citations, NAP & Reviews

## Google Business Profile (GBP)

### Category & Setup
- [ ] **Business category** matches the top 3 competitors ranking above you
- [ ] **GBP links to location/service page**, NOT homepage (unless single-location)
- [ ] **Products/Services section** is filled out (even for service businesses — use it to list services with descriptions and pricing)
- [ ] Business name matches website exactly (no keyword stuffing — suspension risk)
- [ ] Address and phone match website NAP exactly — run the **NAP Consistency Procedure** below before marking PASS
- [ ] Business hours are current and accurate
- [ ] Business description filled with keywords naturally
- [ ] Attributes filled out (accessibility, amenities, etc.)

### Content & Media
- [ ] **New photo uploaded this week** — at least one new, relevant photo every single week
- [ ] **Recent GBP update posted** — every update should include primary keyword AND city/location
- [ ] Post frequency: 2-3 posts/week ideal
- [ ] Q&A section has owner-generated questions and answers

### Reviews
- [ ] **Every review has a response** — respond within 24 hours, no exceptions
- [ ] **Active review generation** — ask every single customer for a review. Systematize with follow-up emails, QR codes, SMS.
- [ ] **Review velocity maintained** — consistent new reviews matter more than total count. Review velocity is a live ranking signal; rankings drop when generation stops. Reviews account for ~20% of local pack ranking weight.
- [ ] **Review text quality** — reviews mentioning specific services and locations carry more ranking weight. Coach customers to mention the service they received and their city.
- [ ] **Review responses include keywords naturally** — "Thank you for choosing [service] in [city]..."

### Behavioral Signals
- [ ] Clicks to directions, calls from profile, website clicks, and message inquiries are all ranking signals
- [ ] An active, engaging profile outranks a passive one
- [ ] "Business open at search time" is a top-5 local ranking factor (Whitespark 2026)

### GBP Updates Strategy

Post updates that include:
1. Your primary service keyword
2. Your city/location name
3. A photo when possible
4. A call to action

Example: "Just completed another [kitchen remodel] project in [Austin, TX]. Contact us for a free estimate!"

### Service Area Businesses (SABs)
- [ ] Service areas defined precisely (20 zip codes/cities you actually serve — Google verifies claims)
- [ ] Business address hidden from public if home-based
- [ ] No service area abuse — don't claim coverage you can't actually serve (suspension risk)
- [ ] Unique service area pages per major city with this structure: H1 ("Service in City"), local testimonials, city-specific details (climate, building codes, local issues), service breakdown, location-specific FAQ
- [ ] Each service area page has genuinely unique content (not city-name swaps — Google spam updates target these)

## Citations & Directory Listings

Citations have shifted from "ranking fuel" to **verification layer** — businesses with consistent citations perform 18x stronger in local search. For AI search, 3 of top 4 visibility factors are citation-related (Whitespark 2026).

### Essential Listings
- [ ] **Bing Places** (LLMs pull from Bing — critical for ChatGPT visibility)
- [ ] **Apple Business Connect** (Siri integration — 86.5M US users)
- [ ] Yelp with complete profile
- [ ] BBB (Better Business Bureau)
- [ ] YellowPages
- [ ] Local Chamber of Commerce
- [ ] Industry-specific directories (highest value tier)
- [ ] "Best of" lists and awards (expert-curated lists are #1 AI citation factor)

### Citation Quality Hierarchy
- **Tier 1 (highest value):** Industry-specific directories (Justia for legal, Angie's for contractors), authoritative general directories (Yelp, Apple Maps, Bing), expert-curated "Best of" lists, quality news/press mentions, professional association memberships
- **Tier 2 (moderate value):** Local business directories, city guides, white pages, social media profiles with complete info
- **Tier 3 (lower value):** Auto-populated directories, low-authority or spam directories (avoid these)

### NAP Consistency

- [ ] NAP (Name, Address, Phone) is byte-identical across ALL canonical sources (exact match, no variations)
- [ ] No duplicate listings on any platform
- [ ] Audit NAP consistency quarterly — run the **NAP Consistency Procedure** below

## NAP Consistency Procedure (CRITICAL for Local Business Audits)

**When to use.** Any time a local-business audit reaches step 5 (GBP) or step 8 (Citation check), or any time `/seo-gbp` runs against a business that has a Google Business Profile. The byte-exact gate on NAP is a prerequisite for local-pack ranking — Google treats drift between the GBP listing, the website, and directory citations as a trust-drop signal (ref: ranking-factors.md #1 GBP optimization, #10 Bing/Apple citation pull-through; Whitespark 2026: citation consistency is an 18x factor).

**Scope.** US-formatted NAP only in v1. International address formats (UK postcodes, AU unit numbers, CA postal codes, etc.) are out of scope — do not run this procedure against non-US businesses without flagging the scope mismatch.

**Outcome.** A Markdown delta report (sources-as-rows, NAP-fields-as-columns) plus a severity-rated list of drift findings that feeds the main audit's `Per-Finding Format` and the `/seo-gbp` output.

### Step 1: Extract NAP from each canonical source

Extract the business Name, Address, and Phone as they appear on each source. Capture the raw text — do **not** normalize at this stage. Normalization happens in Step 2 and is descriptive only.

**Canonical sources (in priority order):**

1. **Google Maps / Google Business Profile listing** — the source of truth Google itself rank-uses.
2. **Website homepage** (visible rendered content — not content-extractor output, which strips nav/header/footer).
3. **Website footer** (visible rendered content, every page).
4. **Website contact page** (visible rendered content).
5. **`LocalBusiness` / `Organization` JSON-LD schema** on the homepage (machine-readable NAP — must match visible NAP).
6. **Tier-1 citations**: Yelp, Apple Business Connect, Bing Places, BBB.
7. **Tier-2 citations**: Facebook Page, local Chamber of Commerce, industry-specific directory (Justia for legal, Angie's for contractors, etc.).

**Per-source extraction instructions:**

- **Google Maps / GBP (primary path — dev-browser):** Write an extraction script to `/tmp/nap-gbp.js` that uses `browser.getPage("seo-gbp")`, navigates to the GBP public URL, waits for JS render, evaluates the DOM to locate the primary listing card, extracts the business-name header, the address line, and the tap-to-call phone link, then prints the three values. Invoke via `dev-browser run /tmp/nap-gbp.js`. **Never** use heredocs, inline `-e` flags, or piped stdin — the house rule (`feedback-dev-browser-scripts.md`) is script-files-only so the invocation doesn't trigger permission prompts and the script stays inspectable. Google Maps DOM is not version-stable; expect to iterate the selectors when Google ships UI changes.
- **Google Maps / GBP (fallback — user-paste):** If dev-browser is unavailable, the auditor's session is logged out, or Google blocks the request, ask the user to open the GBP listing in their own browser and paste the visible Name, Address, and Phone. Mark the GBP row's confidence as `NEEDS VERIFICATION` per SKILL.md confidence rules.
- **Website homepage / footer / contact page:** Use dev-browser (same script-file-only rule) to load the rendered page and evaluate the visible NAP. Content extractors (`web-reader`, `WebFetch`) strip structural elements and will miss footer phone numbers — do not use them for this step.
- **JSON-LD schema:** `curl -s <homepage-url> | sed -n '/<script type="application\/ld+json"/,/<\/script>/p'` and parse the `name`, `address` (including `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`), and `telephone` fields out of the `LocalBusiness` / `Organization` entry.
- **Tier-1 / Tier-2 citations:** Prefer dev-browser against the public listing URL. If the citation requires a login or blocks scraping, fall back to user-paste for that row.

### Step 2: Normalize for drift classification (descriptive only)

Normalization is used **only to describe what kind of drift exists**, never to say "it's fine because they normalize the same." Every drift is always reported in the delta report; normalization sets the **severity**.

**Normalization rules (US format):**

- **Case:** Compare case-insensitively.
- **Punctuation:** Strip commas, periods, `#`, and double/trailing whitespace before comparison.
- **Suite / Ste / Unit / `#`:** All four denote a secondary unit. Any two sources using different forms (e.g., `Suite 200`, `Ste 200`, `Ste. 200`, `Unit 200`, `#200`) count as "Suite-formatting drift" → HIGH.
- **Street types:** `Street` ↔ `St`, `Avenue` ↔ `Ave`, `Boulevard` ↔ `Blvd`, `Road` ↔ `Rd`, `Drive` ↔ `Dr`, `Lane` ↔ `Ln`, `Place` ↔ `Pl`, `Court` ↔ `Ct`, `Highway` ↔ `Hwy`. Drift between the spelled-out and abbreviated form → MEDIUM.
- **Phone canonical form:** E.164 (`+15551234567`). Normalize all phone values to E.164 before comparing digits. If the 11-digit E.164 values match but the source formats differ (`(214) 555-0100`, `214-555-0100`, `+12145550100`), classify as phone format drift → INFO. If the E.164 values differ by any digit, classify as phone digit mismatch → CRITICAL.
- **ZIP codes:** `75201` vs `75201-1234` — presence/absence of the `+4` extension → LOW. Any digit mismatch in the 5-digit base → CRITICAL (different location).
- **Legal suffixes:** `LLC`, `Inc`, `Corp`, `Ltd`, `Co.`, `, LLC` (with comma), `L.L.C.` (with periods). Presence/absence mismatch between any two sources → HIGH. The business should have a single canonical form; this is a trust-drop signal, not a normalization win.

### Step 3: Emit the delta report

Produce a Markdown table with canonical sources as rows and NAP fields as columns. Use exactly this shape so downstream tooling (future `Tools/nap-check.mjs`) can parse it without a schema rewrite:

```
## NAP Consistency Delta Report — {Business Name}

| Source                          | Name                        | Address                                        | Phone           |
|---------------------------------|-----------------------------|------------------------------------------------|-----------------|
| Google Maps (GBP)               | Elite Plumbing              | 123 Main St #200, Dallas, TX 75201             | (214) 555-0100  |
| Website homepage (visible)      | Elite Plumbing LLC          | 123 Main St, Suite 200, Dallas, TX 75201       | (214) 555-0100  |
| Website footer                  | Elite Plumbing              | 123 Main Street, Ste 200, Dallas, TX 75201     | 214-555-0100    |
| Website contact page            | Elite Plumbing LLC          | 123 Main St, Suite 200, Dallas, TX 75201-1234  | (214) 555-0100  |
| LocalBusiness JSON-LD schema    | Elite Plumbing LLC          | 123 Main Street, Dallas, TX 75201              | +12145550100    |
| Yelp                            | Elite Plumbing LLC          | 123 Main St Ste 200, Dallas, TX 75201          | (214) 555-0100  |
| Bing Places                     | Elite Plumbing              | 123 Main St, Dallas, TX 75201                  | (214) 555-0100  |

Drift found:
- Name: LLC suffix present on 4/7 sources, absent on 3/7 (GBP lacks suffix) → HIGH
- Address: 5 distinct Suite/Ste/#200 formats across sources → HIGH
- Address: zip+4 present only on contact page → LOW
- Address: `Street` vs `St` drift between footer/JSON-LD and other sources → MEDIUM
- Phone: 3 distinct formats, all same underlying digits → INFO
```

If a source can't be reached, include its row with `—` for unextracted fields and a confidence note; do **not** drop the row silently. If a business lacks a Tier-1 or Tier-2 citation entirely (e.g., no Yelp profile exists yet), the delta report simply has fewer rows — that's a separate citation-building finding, not a drift finding, and the procedure does not error out.

### Step 4: Assign severity to each drift finding

Each drift type maps to a severity from the skill's standard ladder (CRITICAL / HIGH / MEDIUM / LOW / INFO — see `ranking-factors.md`). Use this table verbatim so severities stay calibrated with the rest of the audit:

| Drift type                                                     | Severity  | Evidence / Why                                                                                      |
|----------------------------------------------------------------|-----------|-----------------------------------------------------------------------------------------------------|
| GBP ↔ website **name** mismatch (different words or digits)    | CRITICAL  | Suspension risk + de-duplication failure; GBP is #1 local ranking factor (ranking-factors.md #1)    |
| GBP ↔ website **phone** digit mismatch (post-normalization)    | CRITICAL  | Suspension risk + breaks behavioral-signal attribution (ranking-factors.md #7)                      |
| GBP ↔ website **address** street-number or base-ZIP mismatch   | CRITICAL  | Suspension risk + different physical location signal to Google                                      |
| Name: `LLC` / `Inc` / `Corp` suffix presence drift             | HIGH      | Trust-drop signal; Google expects a single canonical legal form across surfaces                     |
| Address: `Suite` / `Ste` / `Unit` / `#` formatting drift       | HIGH      | Citation consistency is an 18x factor (Whitespark 2026; local-seo.md Citations section)             |
| Address: `Street` / `St` or `Avenue` / `Ave` abbreviation drift| MEDIUM    | Drift signal but less operationally breaking than suite-format drift                                |
| Address: zip vs zip+4 presence mismatch                        | LOW       | Google tolerates zip+4 presence variance; still worth fixing in next cycle                          |
| Phone format drift (digits match under E.164, format differs)  | INFO      | Same underlying value; cosmetic only                                                                |
| **Tier-1** citation ↔ GBP mismatch (any field)                 | HIGH      | Tier-1 citations (Yelp, Apple, Bing, BBB) are the verification layer (local-seo.md Citations)       |
| **Tier-2** citation ↔ GBP mismatch (any field)                 | MEDIUM    | Lower authority weight than Tier-1 but still a consistency-layer finding                            |

**Byte-exact is the gate.** Normalization describes the drift; it does not excuse it. Every entry in "Drift found" becomes a finding in the audit's `Per-Finding Format` output with its severity from this table, a specific URL or source name under `Page`, and a `Recommendation` that names the single canonical form the business should adopt across all surfaces.

### Step 5: Feed findings into the audit

- `/seo-gbp` output: include the full delta report as its own section and emit the drift findings into the command's section-level PASS/FAIL.
- `/seo-audit` step 8 (Citation check): for local businesses, run this procedure and fold the resulting severities into the **Local SEO / GBP** 20-point score slice. For non-local businesses (no GBP), skip the procedure and note "NAP consistency check skipped — no GBP / non-local business." in the audit output.

## Google Spam Warnings

Flag these during audits — Google is actively penalizing:

- **Keyword-stuffed business names** — "Best Plumber in Denver - 24/7 Emergency" instead of legal name. Suspension risk.
- **Fake addresses** — Virtual offices or fake storefronts to game proximity. Algorithmic demotion or suspension.
- **Phone number spoofing** — Using local area codes that don't match actual location.
- **Service area abuse** — Claiming coverage you can't actually serve.
- **Review manipulation** — Fake reviews, paid reviews, review exchange schemes. Stricter enforcement in 2025+.
- **Thin city pages** — Generic content with city-name swaps. Spam update target.
- **NAP inconsistencies** — Same business with different name/address/phone across platforms.

Google's 2025 enforcement is significantly stricter: more aggressive spam profile filtering, higher suspension risk, algorithmic demotion without warning, and tighter review authentication (especially for SABs).

## Ongoing Habits

These aren't one-time fixes. They need to happen consistently:

| Task | Frequency |
|------|-----------|
| Upload new GBP photo | Weekly |
| Post GBP update (keyword + location) | 2-3x per week |
| Respond to reviews | Within 24 hours |
| Ask customers for reviews (coach them to mention service + city) | Every single one |
| Check for 404 errors | Weekly |
| Verify indexing | Monthly |
| Update top content with new data/examples | Quarterly |
| Audit NAP consistency across citations | Quarterly |

Do all of this consistently for **6 months** and you will not recognize your business. There are no shortcuts. Consistency is the strategy.
