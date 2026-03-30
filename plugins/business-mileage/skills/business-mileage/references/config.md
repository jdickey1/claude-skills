# Business Mileage Configuration

## Mileage Log
Path: `/home/obsidian/automation-vault/01-Projects/JD-Key/business-mileage-log.md`
Access: `ssh nonrootadmin` (write as obsidian user via `sudo -u obsidian`)

## IRS Standard Mileage Rates
| Year | Rate ($/mile) | Status |
|------|--------------|--------|
| 2025 | 0.70 | Confirmed |
| 2026 | 0.725 | Confirmed |

When processing a year not listed above, prompt the user to confirm the rate before calculating.

## dev-browser Constraints
- Max legs per batch script: 7 (QuickJS 30s timeout)
- Script location: `/tmp/mileage-batch-N.js`
- Page name: `maps`
- Distance regex: `/(\d+[\.,]?\d*)\s*mi(?:les?)?(?!\s*n)/gi`
- Validation: every distance must be non-null, > 0, < 1000 miles

## Calendar API
- Tool: `mcp__microsoft__list_events`
- Calculate `days_back` and `days_ahead` for the tightest window covering the target month
- Response can be 900K+ characters; always save to temp file before filtering
