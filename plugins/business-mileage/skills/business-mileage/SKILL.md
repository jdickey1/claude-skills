---
name: business-mileage
description: Use when calculating business driving mileage, generating mileage reports, doing expense reimbursement mileage, or user says "mileage for [month]", "business miles", "driving expenses", "calculate mileage".
version: 1.0.0
effort: high
---

# Business Mileage Report

Generate monthly business driving mileage reports from Outlook calendar events for JD Key Consulting expense reimbursement.

## Quick Start

```
/business-mileage February 2026
```

If no month specified, ask the user.

## Setup (First Run)

Check for `${CLAUDE_PLUGIN_ROOT}/.config-local.md`. If missing, ask the user for:
- Home address
- Microsoft account ID (from `mcp__microsoft__list_accounts`)

Create the file:
```markdown
---
# PII - this file is .gitignored
---
Home: [address]
Account ID: [uuid]
```

## Pipeline

Six phases, each with a gate. Do not skip gates.

---

### Phase 1: Fetch & Filter Calendar Events

1. Read `${CLAUDE_PLUGIN_ROOT}/.config-local.md` for account_id and home address
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/business-mileage/references/config.md` for IRS rates and constraints
3. Calculate the tightest `days_back`/`days_ahead` window covering the target month from today's date
4. Call `mcp__microsoft__list_events` with account_id, days_back, days_ahead, include_details=true
5. The response is large (900K+ chars). Save the tool result file path — it will be saved automatically when too large.
6. Run the filter:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/business-mileage/scripts/mileage-pipeline.py filter \
  --month YYYY-MM \
  --events-file /path/to/saved/result.json \
  --output /tmp/mileage-filtered.json
```

The filter uses **two-pass virtual detection**:
- Pass 1: identifies drive events (🚗 emoji or "Drive to/from" in subject)
- Pass 2: removes virtual events (Zoom, Teams, Meet, Calendly URLs) BUT preserves any meeting that has drive events on the same day — because some in-person meetings have Zoom URLs as their calendar location

**Gate:** Report the event counts. If zero in-person events, stop and confirm with user.

---

### Phase 2: Classify Business vs Personal

1. Read `/tmp/mileage-filtered.json` and extract the `in_person` array
2. Present events as a numbered table (exclude drive events from the display — show only meetings):

```
| # | Date | Time | Subject | Location |
```

3. Ask user to classify: "Which are business? (e.g., 'all business except 3, 7' or '1-5 B, 6 P')"
4. Remove personal events and their associated drive events
5. Save classified business events to `/tmp/mileage-classified.json`

**Gate:** Confirm the business event list with the user before proceeding.

---

### Phase 3: Build Trip Chains

Run the trip builder:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/business-mileage/scripts/mileage-pipeline.py build-trips \
  --home-address "HOME_ADDRESS_HERE" \
  --events-file /tmp/mileage-classified.json \
  --output /tmp/mileage-trips.json
```

The script:
- Groups events by date, orders by start time
- Parses → arrow notation in drive event locations for origin/destination
- Builds trip chains: Home → Stop1 → Stop2 → Home
- **Multi-day trips:** scans up to 3 days forward for a return-home drive. Intermediate drives within a destination city are separate local legs.
- **Flags:** `needs_confirmation` (meeting with no drive events), `multi_day` (spanning multiple days), `no_return_home` (no drive home found)

Present the trip chains to the user:

```
Trip 1 (Jan 6): BNI Circle of Trust + BNI 360 Group
  Home → 123 E Old Settlers (?) → Panera I-35 (?) → 5204 RR 2222 (?) → Home (?)

Trip 2 (Jan 7): ...
```

**Gate:** User confirms trip chains. Ask about any flagged trips:
- `needs_confirmation`: "Did you drive to this meeting or was it actually virtual?"
- `multi_day`: "This spans multiple days — is this one trip or separate trips?"
- `no_return_home`: "I don't see a drive-home event. Did you drive home that day?"

---

### Phase 4: Distance Lookups

#### Step 1: Check the distance cache

Read the mileage log from the vault:
```bash
ssh nonrootadmin 'cat /home/obsidian/automation-vault/01-Projects/JD-Key/business-mileage-log.md'
```

Parse the "## Frequently Used Distances" table. The cache stores ALL origin→destination pairs (not just from Home). Normalize addresses before matching — see `references/addresses.md` for normalization rules.

For each trip leg, check the cache. Mark legs as `cached` or `needs_lookup`.

#### Step 2: Look up uncached distances

For uncached legs, use the dev-browser Google Maps template:

1. Read the template: `${CLAUDE_PLUGIN_ROOT}/skills/business-mileage/scripts/mileage-batch.js`
2. For each batch of ≤7 legs:
   - Copy the template
   - Fill in the `legs` array with actual addresses
   - Write to `/tmp/mileage-batch-N.js`
   - Run: `dev-browser run /tmp/mileage-batch-N.js`
3. Parse the `=== RESULTS ===` JSON from output
4. **Validation:** Every result must have `miles` (not `error`). If any leg has an error:
   - Report the failed legs to the user
   - Ask for manual distance entry
   - Do NOT proceed with null/0 distances

#### Step 3: Fill distances into trips

Update `/tmp/mileage-trips.json` with all distances (cached + looked up). Save as `/tmp/mileage-trips-with-distances.json`.

**Gate:** Present all distances in a table:
```
| Leg | From | To | Miles | Source |
```
Source = "cached" or "Google Maps". User confirms. Any corrections? Apply them.

---

### Phase 5: Calculate & Format Report

1. Check the IRS rate for the target year in `references/config.md`. If the year is not listed, ask user to confirm the rate.

2. Run the calculator:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/business-mileage/scripts/mileage-pipeline.py calc-totals \
  --irs-rate RATE \
  --month "Month YYYY" \
  --trips-file /tmp/mileage-trips-with-distances.json
```

3. Also prepare the "Excluded Events" section listing:
   - Virtual meetings removed (from the filter output)
   - Personal events excluded by user

**Gate:** Present the complete report to the user for review. This is the last chance to make corrections before writing to the vault.

---

### Phase 6: Write to Vault

1. **Re-read the mileage log** immediately before writing (prevents stale state from LiveSync edits):
```bash
ssh nonrootadmin 'cat /home/obsidian/automation-vault/01-Projects/JD-Key/business-mileage-log.md'
```

2. **Idempotency check:** If `## {Month} {Year}` heading already exists in the file, STOP and alert the user. Do not duplicate months.

3. **Insert the month section** before the `## Frequently Used Distances` heading. Use the heading as a marker, not line numbers.

4. **Update the distance cache table** with any new origin→destination pairs discovered this month.

5. **Write via SSH:**
```bash
ssh nonrootadmin "sudo -u obsidian tee /home/obsidian/automation-vault/01-Projects/JD-Key/business-mileage-log.md" << 'EOF'
[full updated file contents]
EOF
```

6. **Verify** by reading back and confirming the new month section is present.

Update the `Last Updated` date in the file's YAML frontmatter.

---

## Anti-Patterns

- **Never skip the distance cache.** Always check before hitting Google Maps.
- **Never batch more than 7 legs** in one dev-browser script (30s timeout).
- **Never proceed with null/0 distances.** Halt and ask for manual entry.
- **Never use heredocs with dev-browser.** Always write to a /tmp/ script file.
- **Never re-derive the filter/trip logic inline.** Use the scripts.
- **Never write to the vault without re-reading first.** File may have changed.

## Edge Cases

| Situation | Handling |
|-----------|---------|
| Meeting with Zoom URL but physical drive events | Preserved by two-pass filter |
| Multi-day trip (e.g., Dallas overnight) | 3-day forward scan, flagged for user confirmation |
| Meeting with no drive events | Flagged as `needs_confirmation` |
| Google Maps extraction fails | Explicit error, user provides manual distance |
| CAPTCHA or consent overlay | Batch stops, remaining legs need manual entry |
| Month already in mileage log | Abort write, alert user |
| IRS rate not in config for target year | Prompt user to confirm rate |
| Very old month (>60 days ago) | Large API response; filter handles it but warn user it may be slow |

## Escalation Protocol

**STOP and ask the user:**
- Zero in-person events after filtering
- Any flagged trip chains (needs_confirmation, multi_day, no_return_home)
- Distance lookup failures
- Month already exists in mileage log
- IRS rate unknown for target year

**Handle autonomously:**
- Running scripts, parsing output
- Cache lookups and normalization
- Formatting the report
- Writing to vault (after user approves report)

## Completion Status

```
MILEAGE REPORT: {Month Year}
═══════════════════════════
Trips: {count}
Total miles: {miles}
IRS reimbursement: ${amount} at ${rate}/mi
Cache hits: {count}/{total legs}
New distances cached: {count}
Written to: business-mileage-log.md
═══════════════════════════
```

## Learning

After each run, append to `.learnings.jsonl` in the skill directory:
```json
{"timestamp": "ISO-8601", "skill": "business-mileage", "event_type": "run_complete", "month": "YYYY-MM", "trips": N, "miles": N, "cache_hits": N, "lookup_errors": N, "flags": ["list of flags encountered"]}
```

Track: cache hit rates (improving over time?), common lookup failures, new recurring locations to add to addresses.md.
