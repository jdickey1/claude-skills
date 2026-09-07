#!/usr/bin/env bash
# Append operator Hits to the standing digest queue, rewrite the iCloud Word
# copy, and make sure the 9am launchd nudge is loaded if any box is still open.
# Usage: update-operator-queue.sh [items.md]
# items.md: one or more "- [ ] ..." blocks. Omit or pass an empty file to
# rewrite Word from the current queue without adding. Pass a file, not stdin
# (a heredoc would collide with the embedded Python).
# Not an agent. No email.
set -euo pipefail

VAULT="${VAULT_ROOT:-$HOME/Projects/obsidian/automation-vault-local}"
QUEUE="${QUEUE:-$VAULT/05-Commitments/open/digest-operator-queue.md}"
DEST="${ICLOUD_DOWNLOADS:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/Downloads}"
WORD="$DEST/Digest operator checklist.docx"
PLIST="$HOME/Library/LaunchAgents/com.jdkey.digest-hits-nudge.plist"
LABEL="gui/$(id -u)/com.jdkey.digest-hits-nudge"
LOG="${LOG:-$HOME/logs/digest-hits-nudge.log}"
TODAY="$(date +%F)"
mkdir -p "$(dirname "$LOG")" "$DEST"

items_file="${1:-}"
if [[ -n "$items_file" ]]; then
  if [[ ! -f "$items_file" ]]; then
    echo "items file missing: $items_file" >&2
    exit 1
  fi
  export DIGEST_QUEUE_ITEMS="$(cat "$items_file")"
else
  export DIGEST_QUEUE_ITEMS=""
fi

python3 - "$QUEUE" "$TODAY" <<'PY'
import os, re, sys

queue_path = sys.argv[1]
today = sys.argv[2]
raw = os.environ.get("DIGEST_QUEUE_ITEMS") or ""

HEADER = """---
title: Digest operator queue
description: Standing James to-do from digest Hits. Check boxes here. Word copy in iCloud Downloads is for reading.
type: commitment
subtype: pickup
source: digest
project: JD-Key
status: active
Last Updated: {today}
---

# Digest operator queue

Daily reminder (launchd `com.jdkey.digest-hits-nudge`) reads **this file**. Check a box here (`[x]`) to mark it done. The Word copy does not stop the nudge.

Word: `Digest operator checklist.docx` in iCloud Downloads.

When every `- [ ]` below is `- [x]`, the job unloads itself. The next digest that adds an open box loads it again.

## Inbox
"""

def blocks(text):
    chunks = re.split(r'(?=^- \[ \])', text, flags=re.M)
    out = []
    for c in chunks:
        c = c.strip("\n")
        if c.startswith("- [ ]"):
            out.append(c.strip() + "\n")
    return out

def key(block):
    first = block.splitlines()[0]
    first = re.sub(r'^- \[[ xX]\] ', '', first)
    first = re.sub(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', r'\1', first)
    first = re.sub(r'<https?://[^>]+>', '', first)
    first = re.sub(r'https?://\S+', '', first)
    return re.sub(r'\s+', ' ', first).strip().lower()

new_blocks = blocks(raw)
if os.path.exists(queue_path):
    body = open(queue_path).read()
    body = re.sub(r'^Last Updated:.*$', f'Last Updated: {today}', body, count=1, flags=re.M)
else:
    body = HEADER.format(today=today)

existing = {key(b) for b in re.split(r'(?=^- \[[ xX]\])', body, flags=re.M) if re.match(r'^- \[[ xX]\]', b)}
added = []
for b in new_blocks:
    k = key(b)
    if not k or k in existing:
        continue
    existing.add(k)
    added.append(b)

if added:
    if "## Inbox" not in body:
        body = body.rstrip() + "\n\n## Inbox\n"
    heading = f"### {today}"
    if heading not in body:
        body = body.rstrip() + f"\n\n{heading}\n"
    insert_at = body.rfind(heading)
    after = body.find("\n", insert_at)
    body = body[: after + 1] + "\n" + "\n".join(added) + body[after + 1 :]

open(queue_path, "w").write(body if body.endswith("\n") else body + "\n")
print(f"added {len(added)} skipped {len(new_blocks) - len(added)}")
PY

if ! command -v pandoc >/dev/null 2>&1; then
  echo "pandoc not found; queue updated but Word not rewritten" >&2
else
  (cd "$(dirname "$QUEUE")" && pandoc -s --from=markdown+yaml_metadata_block "$(basename "$QUEUE")" -o "$WORD")
  echo "word $WORD ($(wc -c < "$WORD" | tr -d ' ') bytes)"
fi

open_n=$(grep -cE '^- \[ \]' "$QUEUE" || true)
echo "open $open_n"
echo "$(date '+%Y-%m-%d %H:%M:%S %Z') queue-update open=$open_n" >>"$LOG"

if [[ "${open_n:-0}" -gt 0 ]]; then
  if [[ ! -f "$PLIST" ]]; then
    echo "launchd plist missing: $PLIST; 9am nudge not loaded" >&2
  elif launchctl print "$LABEL" >/dev/null 2>&1; then
    :
  else
    launchctl bootstrap "gui/$(id -u)" "$PLIST" || launchctl load "$PLIST" || true
    if launchctl print "$LABEL" >/dev/null 2>&1; then
      echo "launchd loaded $LABEL"
    else
      echo "launchd bootstrap failed; 9am nudge is not loaded ($LABEL)" >&2
    fi
  fi
fi
