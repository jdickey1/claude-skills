#!/bin/bash
# gsc-weekly — full weekly sweep: pull, per-site inspect, digest.
# Invoked by ~/Library/LaunchAgents/com.jdkey.seo-cli.plist on Mondays at 7am CT.
#
# Logs to ~/Library/Logs/gsc-cli/cron-YYYY-MM-DD.log.
# Per-step failures are recorded but later steps still run; exit code is non-zero
# if any step failed so launchd can alert via crash reporter / status checks.

set -uo pipefail

GSC_DIR="$(cd "$(dirname "$0")" && pwd)"
GSC="$GSC_DIR/gsc"
LOG_DIR="$HOME/Library/Logs/gsc-cli"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/cron-$(date +%Y-%m-%d).log"
TODAY="$(date +%Y-%m-%d)"
DLG_HOLD_UNTIL="${GSC_DLG_HOLD_UNTIL:-2026-05-11}"
INSPECT_TOP="${GSC_INSPECT_TOP:-50}"

step_status=0

# Wraps a labeled command, captures rc, keeps the script going on failure.
run_step() {
  local title="$1"; shift
  echo
  echo "--- $title ---"
  if "$@"; then
    echo "  → ok"
  else
    local rc=$?
    echo "  → FAILED (rc=$rc)"
    step_status=1
  fi
}

{
  echo "=== gsc weekly run started $(date) ==="
  echo "  HOST=$(hostname)"
  echo "  PATH=$PATH"
  echo "  node=$(command -v node || echo MISSING) $(node -v 2>/dev/null || true)"
  echo "  GSC=$GSC"
  echo "  TODAY=$TODAY  DLG_HOLD_UNTIL=$DLG_HOLD_UNTIL  INSPECT_TOP=$INSPECT_TOP"

  run_step "gsc pull" "$GSC" pull

  echo
  echo "--- gsc inspect (per site, top $INSPECT_TOP) ---"
  # Source of truth for active sites: seo_db.sites. Fall back to GSC API if
  # the database is unreachable so we still get inspections written somewhere.
  if sites=$(ssh -o BatchMode=yes seo \
      "psql seo_db -At -c \"select site_url from sites where active=true order by display_name\"" \
      2>/dev/null); then
    :
  else
    echo "  WARN: seo_db unreachable via ssh, falling back to GSC API list"
    sites=$("$GSC" sites --json 2>/dev/null \
      | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{JSON.parse(s).forEach(x=>console.log(x.siteUrl||x.site_url))}catch(e){process.exit(1)}})')
  fi

  if [ -z "$sites" ]; then
    echo "  ERROR: no sites found"
    step_status=1
  else
    for site in $sites; do
      if [[ "$site" == "sc-domain:dickeylawgroup.com" && "$TODAY" < "$DLG_HOLD_UNTIL" ]]; then
        echo "  skip $site (held until $DLG_HOLD_UNTIL — post-DNS-cutover crawl window)"
        continue
      fi
      echo "  $site:"
      if "$GSC" inspect --site "$site" --top "$INSPECT_TOP"; then
        echo "    → ok"
      else
        echo "    → FAILED"
        step_status=1
      fi
    done
  fi

  run_step "gsc digest" "$GSC" digest

  echo
  echo "=== gsc weekly run finished $(date) (status=$step_status) ==="
} >> "$LOG" 2>&1

exit $step_status
