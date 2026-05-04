#!/bin/bash
# install.sh — install (or refresh) the gsc-cli weekly LaunchAgent.
# Idempotent: safe to re-run after editing the plist.

set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/com.jdkey.seo-cli.plist"
DST="$HOME/Library/LaunchAgents/com.jdkey.seo-cli.plist"
LABEL="com.jdkey.seo-cli"

if [ ! -f "$SRC" ]; then
  echo "ERROR: source plist not found at $SRC" >&2
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$HOME/Library/Logs/gsc-cli"

# bootout (modern equivalent of unload). Tolerate missing.
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true

cp "$SRC" "$DST"
launchctl bootstrap "gui/$(id -u)" "$DST"

echo "Installed: $DST"
echo "Label:     $LABEL"
echo
echo "Status:"
launchctl print "gui/$(id -u)/$LABEL" 2>/dev/null | grep -E '^\s*(state|last exit code|next run)' || true
echo
echo "Next steps:"
echo "  Test now:    launchctl kickstart -k gui/$(id -u)/$LABEL"
echo "  Check log:   tail -f ~/Library/Logs/gsc-cli/cron-\$(date +%Y-%m-%d).log"
echo "  Uninstall:   $(dirname "$SRC")/uninstall.sh"
