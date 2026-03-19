#!/usr/bin/env python3
"""Reconstruct overnight-optimizer state for resuming an interrupted run.

Usage:
    python resume.py <experiment.yaml>

Reads results.tsv (authoritative) and git log (advisory) to reconstruct:
- How many experiments have run
- What the baseline, best, and current scores are
- Recent experiment history
- Any learnings summary
- Whether there is an orphaned commit (experiment committed but not logged)

Outputs JSON to stdout.
"""

import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import utils


def _run_git(args: list, cwd: str) -> str:
    """Run a git command and return stdout. Returns '' on failure."""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=30,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return ""


def _count_optimizer_commits(repo_root: str, skill_name: str) -> int:
    """Count overnight-optimizer commits for this skill in git log."""
    grep_pattern = f"overnight-optimizer({skill_name})"
    output = _run_git(
        ["log", "--oneline", f"--grep={grep_pattern}"],
        cwd=repo_root,
    )
    if not output:
        return 0
    return len([line for line in output.splitlines() if line.strip()])


def _get_last_optimizer_commit(repo_root: str, skill_name: str) -> dict | None:
    """Get info about the most recent overnight-optimizer commit for this skill."""
    grep_pattern = f"overnight-optimizer({skill_name})"
    output = _run_git(
        ["log", "--oneline", "-1", f"--grep={grep_pattern}"],
        cwd=repo_root,
    )
    if not output:
        return None
    parts = output.split(" ", 1)
    if len(parts) < 2:
        return None
    return {"sha": parts[0], "message": parts[1]}


def _find_repo_root(start_path: str) -> str | None:
    """Find the git repo root by walking up from start_path."""
    p = Path(start_path).resolve()
    for candidate in [p] + list(p.parents):
        if (candidate / ".git").exists():
            return str(candidate)
    return None


def main():
    if len(sys.argv) < 2:
        print(
            "Usage: python resume.py <experiment.yaml>",
            file=sys.stderr,
        )
        sys.exit(1)

    config_path = sys.argv[1]
    config_file = Path(config_path)

    if not config_file.exists():
        print(f"Error: config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)

    config = utils.parse_config(config_path)
    config_dir = config_file.parent
    skill_name = config.get("name", "unknown")

    # --- Read results.tsv ---
    tsv_path = str(config_dir / "results.tsv")
    rows = utils.read_tsv(tsv_path)
    experiment_count = len(rows)

    # Helper: safe float
    def _f(v, default=0.0):
        try:
            return float(str(v).rstrip("%"))
        except (TypeError, ValueError):
            return default

    # Scores as floats
    scored_rows = []
    for r in rows:
        scored_rows.append({
            "id": int(r.get("experiment", 0)) if r.get("experiment", "").isdigit() else r.get("experiment", 0),
            "score": _f(r.get("score", 0)),
            "pass_rate": _f(r.get("pass_rate", 0)),
            "max_score": r.get("max_score", ""),
            "status": r.get("status", ""),
            "description": r.get("description", ""),
        })

    baseline_score = scored_rows[0]["score"] if scored_rows else 0.0

    kept_scores = [
        r["score"] for r in scored_rows
        if r["status"] in ("baseline", "keep")
    ]
    best_score = max(kept_scores, default=0.0)

    # Current score = score of the last kept experiment
    current_score = baseline_score
    for r in reversed(scored_rows):
        if r["status"] in ("baseline", "keep"):
            current_score = r["score"]
            break

    # Consecutive discards from the end
    consecutive_discards = 0
    for r in reversed(scored_rows):
        if r["status"] == "discard":
            consecutive_discards += 1
        else:
            break

    # Last 5 experiments
    recent = []
    for r in scored_rows[-5:]:
        recent.append({
            "id": r["id"],
            "score": r["score"],
            "status": r["status"],
            "description": r["description"],
        })

    # --- Read learnings.md ---
    learnings_summary = None
    learnings_path = config_dir / "learnings.md"
    if learnings_path.exists():
        try:
            content = learnings_path.read_text()
            learnings_summary = content[:500]
        except OSError:
            pass

    # --- Detect orphaned commits ---
    orphaned_commit = None
    repo_root = _find_repo_root(str(config_dir))

    if repo_root:
        git_commit_count = _count_optimizer_commits(repo_root, skill_name)
        # An orphaned commit exists when git has one more optimizer commit
        # than there are TSV rows (commit was made but log subcommand wasn't called,
        # or TSV was written before git commit and then the process died).
        if git_commit_count > experiment_count:
            last_commit = _get_last_optimizer_commit(repo_root, skill_name)
            if last_commit:
                orphaned_commit = last_commit

    output = {
        "experiment_count": experiment_count,
        "baseline_score": baseline_score,
        "best_score": best_score,
        "current_score": current_score,
        "consecutive_discards": consecutive_discards,
        "recent": recent,
        "learnings_summary": learnings_summary,
        "orphaned_commit": orphaned_commit,
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
