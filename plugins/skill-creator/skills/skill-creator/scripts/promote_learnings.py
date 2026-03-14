#!/usr/bin/env python3
"""Promote recurring learning events into proposed SKILL.md patches.

Reads .learnings.jsonl from a skill directory, groups events by pattern
(via LLM clustering with fallback to exact-match), filters by threshold,
and outputs proposed patches as JSON.
"""

import argparse
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


def load_events(learnings_path: Path) -> list[dict]:
    """Load and parse events from .learnings.jsonl, skipping malformed lines."""
    events = []
    with learnings_path.open() as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"Warning: skipping malformed JSON on line {i}: {line[:60]!r}", file=sys.stderr)
    return events


def cluster_with_llm(events: list[dict]) -> list[dict] | None:
    """Try to cluster events using the claude CLI. Returns groups or None on failure."""
    events_summary = []
    for i, e in enumerate(events):
        events_summary.append({
            "index": i,
            "event_type": e.get("event_type", ""),
            "context": e.get("context", ""),
        })

    prompt = (
        "You are analyzing learning events from a skill. "
        "Group these events by recurring theme. "
        "Return ONLY valid JSON in this exact format: "
        '{"groups": [{"theme": "...", "event_indices": [...], "count": N}]}\n\n'
        f"Events:\n{json.dumps(events_summary, indent=2)}"
    )

    try:
        result = subprocess.run(
            ["claude", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            print(f"Warning: claude CLI exited with code {result.returncode}", file=sys.stderr)
            return None

        output = result.stdout.strip()
        # Extract JSON from output (claude may add preamble text)
        start = output.find("{")
        end = output.rfind("}") + 1
        if start == -1 or end == 0:
            print("Warning: no JSON found in claude CLI output", file=sys.stderr)
            return None

        parsed = json.loads(output[start:end])
        groups = parsed.get("groups", [])
        return groups

    except FileNotFoundError:
        print("Warning: claude CLI not found, falling back to exact-match grouping", file=sys.stderr)
        return None
    except subprocess.TimeoutExpired:
        print("Warning: claude CLI timed out, falling back to exact-match grouping", file=sys.stderr)
        return None
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Warning: failed to parse claude CLI response ({e}), falling back", file=sys.stderr)
        return None


def cluster_exact_match(events: list[dict]) -> list[dict]:
    """Group events by exact match on the context field."""
    groups_by_context: dict[str, list[int]] = defaultdict(list)
    for i, e in enumerate(events):
        context = e.get("context", "")
        groups_by_context[context].append(i)

    groups = []
    for context, indices in groups_by_context.items():
        groups.append({
            "theme": context,
            "event_indices": indices,
            "count": len(indices),
        })
    return groups


def infer_target_section(theme: str) -> str:
    """Heuristically infer the target SKILL.md section for a proposed addition."""
    theme_lower = theme.lower()
    if any(w in theme_lower for w in ("error", "fail", "invalid", "missing", "wrong", "broken")):
        return "Common Mistakes"
    if any(w in theme_lower for w in ("when", "use", "should", "avoid", "prefer")):
        return "When to Use"
    return "Core Pattern"


def build_proposed_addition(theme: str, sample_contexts: list[str]) -> str:
    """Build a plain-text proposed addition for the SKILL.md."""
    lines = [f"- {theme}"]
    for ctx in sample_contexts[:2]:
        if ctx and ctx != theme:
            lines.append(f"  - Example: {ctx}")
    return "\n".join(lines)


def generate_patches(events: list[dict], groups: list[dict], threshold: int) -> dict:
    """Filter groups by threshold and generate proposed patches."""
    qualifying = [g for g in groups if g.get("count", 0) >= threshold]

    result_groups = []
    for g in qualifying:
        theme = g.get("theme", "")
        indices = g.get("event_indices", [])
        count = g.get("count", len(indices))

        sample_contexts = []
        for idx in indices[:3]:
            if 0 <= idx < len(events):
                ctx = events[idx].get("context", "")
                if ctx and ctx not in sample_contexts:
                    sample_contexts.append(ctx)

        result_groups.append({
            "theme": theme,
            "count": count,
            "sample_events": sample_contexts,
            "proposed_addition": build_proposed_addition(theme, sample_contexts),
            "target_section": infer_target_section(theme),
        })

    n = len(result_groups)
    return {
        "groups": result_groups,
        "summary": f"Found {n} pattern{'s' if n != 1 else ''} above threshold",
    }


def main():
    parser = argparse.ArgumentParser(
        description="Promote recurring learning events into proposed SKILL.md patches."
    )
    parser.add_argument("skill_path", help="Path to skill directory containing .learnings.jsonl")
    parser.add_argument(
        "--threshold",
        type=int,
        default=3,
        help="Minimum event count for a pattern to be promoted (default: 3)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output path for JSON results (default: stdout)",
    )
    args = parser.parse_args()

    skill_path = Path(args.skill_path)
    learnings_path = skill_path / ".learnings.jsonl"

    if not learnings_path.exists():
        print("No learning events found")
        sys.exit(0)

    events = load_events(learnings_path)
    if not events:
        print("No learning events found")
        sys.exit(0)

    # Try LLM clustering first, fall back to exact-match
    groups = cluster_with_llm(events)
    if groups is None:
        groups = cluster_exact_match(events)

    output = generate_patches(events, groups, args.threshold)

    if not output["groups"]:
        print("No patterns above threshold")
        sys.exit(0)

    json_output = json.dumps(output, indent=2)
    if args.output:
        Path(args.output).write_text(json_output)
    else:
        print(json_output)


if __name__ == "__main__":
    main()
