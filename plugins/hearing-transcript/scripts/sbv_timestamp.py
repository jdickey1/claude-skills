#!/usr/bin/env python3
"""Map a line number in an SBV/VTT/SRT caption file to a YouTube timestamp.

Usage:
    python sbv_timestamp.py <caption-file> <line-number> [--video-id YOUTUBE_ID]

Output:
    Prints the start time of the nearest enclosing caption block in the form
    `?t=NNNs` (suitable for appending to a YouTube URL) and the human-readable
    `H:MM:SS` form. With --video-id, prints a full youtu.be URL.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Matches SBV (HH:MM:SS.mmm,HH:MM:SS.mmm) and VTT/SRT
# (HH:MM:SS.mmm --> HH:MM:SS.mmm or HH:MM:SS,mmm --> HH:MM:SS,mmm) timestamps.
TIMESTAMP_RE = re.compile(
    r"(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})"
    r"\s*(?:,|-->)\s*"
    r"\d{1,2}:\d{2}:\d{2}[.,]\d{3}"
)


def total_seconds(h: str, m: str, s: str, ms: str) -> int:
    return int(h) * 3600 + int(m) * 60 + int(s) + (1 if int(ms) >= 500 else 0)


def find_block_start(lines: list[str], target_line: int) -> int | None:
    """Walk backwards from target_line to find the nearest timestamp line.

    Returns total seconds from start of video, or None if no timestamp found.
    """
    for i in range(min(target_line, len(lines)) - 1, -1, -1):
        match = TIMESTAMP_RE.search(lines[i])
        if match:
            return total_seconds(*match.groups())
    return None


def format_hms(seconds: int) -> str:
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("caption_file", type=Path)
    parser.add_argument("line_number", type=int, help="1-indexed line number")
    parser.add_argument(
        "--video-id",
        help="YouTube video ID; if provided, prints a full youtu.be URL",
    )
    args = parser.parse_args()

    if not args.caption_file.exists():
        print(f"error: file not found: {args.caption_file}", file=sys.stderr)
        return 1

    lines = args.caption_file.read_text(encoding="utf-8").splitlines()
    if args.line_number < 1 or args.line_number > len(lines):
        print(
            f"error: line {args.line_number} out of range (file has {len(lines)} lines)",
            file=sys.stderr,
        )
        return 1

    seconds = find_block_start(lines, args.line_number)
    if seconds is None:
        print(
            f"error: no timestamp found at or before line {args.line_number}",
            file=sys.stderr,
        )
        return 1

    hms = format_hms(seconds)
    if args.video_id:
        print(f"https://youtu.be/{args.video_id}?t={seconds}s   ({hms})")
    else:
        print(f"?t={seconds}s   ({hms})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
