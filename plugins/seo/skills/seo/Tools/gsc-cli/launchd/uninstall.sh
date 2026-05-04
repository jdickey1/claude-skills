#!/bin/bash
# uninstall.sh — remove the gsc-cli weekly LaunchAgent.

set -euo pipefail

DST="$HOME/Library/LaunchAgents/com.jdkey.seo-cli.plist"
LABEL="com.jdkey.seo-cli"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$DST"

echo "Uninstalled $LABEL (logs preserved at ~/Library/Logs/gsc-cli/)."
