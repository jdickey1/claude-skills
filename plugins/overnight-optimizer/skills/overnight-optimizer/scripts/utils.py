#!/usr/bin/env python3
"""Shared utilities for overnight-optimizer scripts."""

import json
import csv
import re
from pathlib import Path


def parse_config(config_path: str) -> dict:
    """Parse experiment.yaml without requiring PyYAML.

    Handles a flat-ish YAML structure with support for:
    - Simple key: value pairs
    - Lists (- item)
    - Nested objects under list items (name:, check:, question:, pass:, fail:)
    - Multiline strings (|)
    - Null values
    - Comments (#)

    The config schema has these top-level keys:
      name, description, target, eval_mode, eval_script, metric_name,
      metric_goal, metric_format, metric_max, assertions (list of dicts),
      runs_per_experiment, test_prompt, budget, time_limit_hours,
      stop_on_score, stop_on_plateau, guards (list of dicts with name/check),
      instructions
    """
    text = Path(config_path).read_text()
    lines = text.splitlines()
    return _parse_lines(lines)


def _parse_value(raw: str):
    """Convert a raw string value to the appropriate Python type."""
    # Strip inline comment (but not inside quotes)
    stripped = raw.strip()

    # Quoted strings
    if (stripped.startswith('"') and stripped.endswith('"')) or \
       (stripped.startswith("'") and stripped.endswith("'")):
        return stripped[1:-1]

    # Null
    if stripped in ("null", "~", ""):
        return None

    # Booleans
    if stripped.lower() == "true":
        return True
    if stripped.lower() == "false":
        return False

    # Integer
    try:
        return int(stripped)
    except ValueError:
        pass

    # Float
    try:
        return float(stripped)
    except ValueError:
        pass

    # Plain string — strip inline comment
    # Only strip if # is preceded by whitespace (otherwise it might be a URL fragment)
    comment_match = re.search(r'\s+#.*$', stripped)
    if comment_match:
        stripped = stripped[:comment_match.start()].strip()

    return stripped


def _get_indent(line: str) -> int:
    """Return the number of leading spaces."""
    return len(line) - len(line.lstrip(' '))


def _parse_lines(lines: list) -> dict:
    """Parse a list of lines into a dict, handling nested structures."""
    result = {}
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]

        # Skip blank lines and comment-only lines
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            i += 1
            continue

        indent = _get_indent(line)

        # Top-level key: value  (indent == 0)
        if indent != 0:
            i += 1
            continue

        # Detect list item at top level (shouldn't happen in this schema)
        if stripped.startswith('- '):
            i += 1
            continue

        # Key: value or Key: (start of block)
        if ':' not in stripped:
            i += 1
            continue

        key_part, _, value_part = stripped.partition(':')
        key = key_part.strip()
        value_raw = value_part.strip()

        # Multiline block scalar (|)
        if value_raw == '|' or value_raw.startswith('| '):
            # Collect all indented lines following
            block_lines = []
            i += 1
            # Determine block indent from first non-empty line
            block_indent = None
            while i < n:
                bl = lines[i]
                bl_stripped = bl.strip()
                if not bl_stripped:
                    block_lines.append('')
                    i += 1
                    continue
                bl_indent = _get_indent(bl)
                if block_indent is None:
                    block_indent = bl_indent
                if bl_indent < (block_indent or 1):
                    break
                # Remove the block indent prefix
                block_lines.append(bl[block_indent:] if block_indent else bl)
                i += 1
            # Strip trailing empty lines, add final newline per YAML spec
            while block_lines and block_lines[-1] == '':
                block_lines.pop()
            result[key] = '\n'.join(block_lines) + '\n'
            continue

        # Empty value — could be a list or nested object follows
        if value_raw == '' or value_raw.startswith('#'):
            # Peek ahead to see if next non-blank line is a list item
            j = i + 1
            while j < n and not lines[j].strip():
                j += 1
            if j < n:
                next_stripped = lines[j].strip()
                next_indent = _get_indent(lines[j])
                if next_stripped.startswith('- ') and next_indent == 2:
                    # It's a list of items
                    items, i = _parse_list(lines, j)
                    result[key] = items
                    continue
                elif next_indent > 0 and ':' in next_stripped:
                    # It's a nested dict (unlikely at top level for this schema)
                    sub, i = _parse_dict_block(lines, j, next_indent)
                    result[key] = sub
                    continue
            # Otherwise treat as null
            result[key] = None
            i += 1
            continue

        # Simple scalar value
        result[key] = _parse_value(value_raw)
        i += 1

    return result


def _parse_list(lines: list, start: int) -> tuple:
    """Parse a YAML list starting at lines[start]. Returns (list, next_i)."""
    items = []
    i = start
    n = len(lines)
    list_indent = _get_indent(lines[start])

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # Skip blank lines
        if not stripped:
            i += 1
            continue

        # Skip comments
        if stripped.startswith('#'):
            i += 1
            continue

        indent = _get_indent(line)

        # If we've gone back to a lower indent, we're done with the list
        if indent < list_indent:
            break

        # If same indent but not a list item, we're done
        if indent == list_indent and not stripped.startswith('- '):
            break

        if not stripped.startswith('- '):
            # Continuation of a multi-key list item — handled inside item parsing
            i += 1
            continue

        # List item
        item_value_raw = stripped[2:].strip()  # everything after "- "

        # Check if the item value is a key: value pair (start of a dict item)
        if ':' in item_value_raw and not item_value_raw.startswith('"') and not item_value_raw.startswith("'"):
            # This list item is an inline dict entry, possibly with more fields below
            item_dict = {}
            first_key, _, first_val = item_value_raw.partition(':')
            item_dict[first_key.strip()] = _parse_value(first_val.strip())

            # Peek ahead for more keys at deeper indent
            i += 1
            item_indent = list_indent + 2  # standard 2-space sub-indent
            while i < n:
                sub_line = lines[i]
                sub_stripped = sub_line.strip()
                if not sub_stripped or sub_stripped.startswith('#'):
                    i += 1
                    continue
                sub_indent = _get_indent(sub_line)
                if sub_indent < item_indent:
                    break
                if sub_indent >= item_indent and not sub_stripped.startswith('- '):
                    if ':' in sub_stripped:
                        # Handle multiline block scalar within list item
                        sk, _, sv = sub_stripped.partition(':')
                        sv_stripped = sv.strip()
                        if sv_stripped == '|' or sv_stripped.startswith('| '):
                            block_lines = []
                            i += 1
                            block_indent = None
                            while i < n:
                                bl = lines[i]
                                bl_stripped = bl.strip()
                                if not bl_stripped:
                                    block_lines.append('')
                                    i += 1
                                    continue
                                bl_indent = _get_indent(bl)
                                if block_indent is None:
                                    block_indent = bl_indent
                                if bl_indent < (block_indent or 1):
                                    break
                                block_lines.append(bl[block_indent:] if block_indent else bl)
                                i += 1
                            while block_lines and block_lines[-1] == '':
                                block_lines.pop()
                            item_dict[sk.strip()] = '\n'.join(block_lines) + '\n'
                        else:
                            item_dict[sk.strip()] = _parse_value(sv_stripped)
                            i += 1
                    else:
                        i += 1
                else:
                    break
            items.append(item_dict)
        else:
            # Simple scalar list item
            items.append(_parse_value(item_value_raw))
            i += 1

    return items, i


def _parse_dict_block(lines: list, start: int, block_indent: int) -> tuple:
    """Parse a nested dict block. Returns (dict, next_i)."""
    result = {}
    i = start
    n = len(lines)

    while i < n:
        line = lines[i]
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            i += 1
            continue
        indent = _get_indent(line)
        if indent < block_indent:
            break
        if ':' in stripped:
            key, _, val = stripped.partition(':')
            result[key.strip()] = _parse_value(val.strip())
        i += 1

    return result, i


def append_tsv(tsv_path: str, row: dict):
    """Append a row to results.tsv. Creates file with header if it doesn't exist.

    Row dict keys: experiment, score, max_score, pass_rate, status, description
    """
    path = Path(tsv_path)
    header = ["experiment", "score", "max_score", "pass_rate", "status", "description"]
    write_header = not path.exists()

    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=header, delimiter="\t", extrasaction="ignore")
        if write_header:
            writer.writeheader()
        writer.writerow(row)


def read_tsv(tsv_path: str) -> list:
    """Read all rows from results.tsv. Returns list of dicts."""
    path = Path(tsv_path)
    if not path.exists():
        return []
    with open(path, newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        return list(reader)


def update_results_json(json_path: str, config: dict, experiments: list,
                        guards=None,
                        eval_breakdown=None,
                        status: str = "running"):
    """Update results.json from current state.

    Args:
        json_path: Path to results.json
        config: Parsed experiment.yaml config
        experiments: List of experiment dicts with id, score, max_score,
                     pass_rate, status, description
        guards: Optional list of guard result dicts
        eval_breakdown: Optional assertion mode breakdown
        status: "running" or "complete"
    """
    kept_rates = [
        e["pass_rate"] for e in experiments
        if e.get("status") in ("baseline", "keep")
    ]

    def _to_float(v, default=0.0):
        try:
            return float(v)
        except (TypeError, ValueError):
            return default

    data = {
        "name": config.get("name", "unknown"),
        "status": status,
        "current_experiment": len(experiments) - 1 if experiments else 0,
        "baseline_score": _to_float(experiments[0]["pass_rate"]) if experiments else 0.0,
        "best_score": max((_to_float(r) for r in kept_rates), default=0.0),
        "eval_mode": config.get("eval_mode", "script"),
        "metric_name": config.get("metric_name", "score"),
        "experiments": experiments,
    }
    if guards is not None:
        data["guards"] = guards
    if eval_breakdown is not None:
        data["eval_breakdown"] = eval_breakdown

    Path(json_path).write_text(json.dumps(data, indent=2) + "\n")


def format_pass_rate(score, max_score) -> str:
    """Format pass rate as percentage string."""
    try:
        s = float(score)
        m = float(max_score) if max_score is not None else 0.0
        if m > 0:
            return f"{s / m * 100:.1f}%"
    except (TypeError, ValueError):
        pass
    return str(score)
