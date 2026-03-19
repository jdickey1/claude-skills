#!/usr/bin/env python3
"""Run experiment evaluation and logging for overnight-optimizer.

Usage:
    python run_experiment.py measure <experiment.yaml>
    python run_experiment.py log <experiment.yaml> <experiment_number> <status> <description> <score>

Subcommands:

  measure  - Run the eval_script (or guards) defined in experiment.yaml and
             print a JSON result to stdout.

  log      - Record an experiment result to results.tsv and results.json,
             then regenerate the dashboard.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

# Allow importing utils from the same directory
sys.path.insert(0, str(Path(__file__).parent))
import utils


# ---------------------------------------------------------------------------
# measure subcommand (called "eval" in the skill)
# ---------------------------------------------------------------------------

SCRIPT_TIMEOUT = 300  # seconds


def run_measure(config_path: str) -> None:
    """Run the scoring script and print JSON result to stdout."""
    config = utils.parse_config(config_path)
    config_dir = Path(config_path).parent

    mode = config.get("eval_mode", "script")

    if mode == "assertion":
        print(json.dumps({
            "error": "assertion mode evals are handled by Claude inline, not by this script"
        }))
        return

    # --- Script mode ---
    scoring_script = config.get("eval_script")
    if not scoring_script:
        print(json.dumps({"error": "eval_script not set in config"}))
        sys.exit(1)

    # Resolve script path relative to experiment.yaml location
    script_path = Path(scoring_script)
    if not script_path.is_absolute():
        script_path = config_dir / script_path

    # Run scoring script
    metric = None
    error = None

    try:
        result = subprocess.run(
            [str(script_path)],
            capture_output=True,
            text=True,
            timeout=SCRIPT_TIMEOUT,
        )
        if result.returncode != 0:
            stderr_snippet = result.stderr.strip()[:500]
            error = f"eval script exited {result.returncode}: {stderr_snippet}"
        else:
            stdout = result.stdout.strip()
            if not stdout:
                error = "non-numeric output: (empty)"
            else:
                try:
                    metric = float(stdout.splitlines()[-1].strip())
                except ValueError:
                    snippet = stdout[:200]
                    error = f"non-numeric output: {snippet}"
    except subprocess.TimeoutExpired:
        error = f"timeout after {SCRIPT_TIMEOUT}s"

    if error:
        print(json.dumps({"error": error, "guards_pass": None}))
        return

    # --- Run guards ---
    guards_config = config.get("guards") or []
    guard_results = []
    guards_pass = True

    for guard in guards_config:
        guard_name = guard.get("name", "unnamed")
        check_script = guard.get("check")
        if not check_script:
            guard_results.append({"name": guard_name, "pass": True})
            continue

        check_path = Path(check_script)
        if not check_path.is_absolute():
            check_path = config_dir / check_path

        try:
            g_result = subprocess.run(
                [str(check_path)],
                capture_output=True,
                text=True,
                timeout=SCRIPT_TIMEOUT,
            )
            passed = g_result.returncode == 0
        except subprocess.TimeoutExpired:
            passed = False
        except FileNotFoundError:
            passed = False

        if not passed:
            guards_pass = False
        guard_results.append({"name": guard_name, "pass": passed})

    output = {
        "metric": metric,
        "guards_pass": guards_pass,
        "guard_results": guard_results,
    }
    print(json.dumps(output))


# ---------------------------------------------------------------------------
# log subcommand
# ---------------------------------------------------------------------------

def run_log(config_path: str, experiment_number: str, status: str,
            description: str, score: str) -> None:
    """Record an experiment result and regenerate dashboard."""
    config = utils.parse_config(config_path)
    config_dir = Path(config_path).parent

    results_tsv = str(config_dir / "results.tsv")
    results_json = str(config_dir / "results.json")

    # Determine max_score from config
    metric_max = config.get("metric_max")

    # Calculate pass_rate
    try:
        score_f = float(score)
    except (ValueError, TypeError):
        print(f"Error: score must be numeric, got: {score!r}", file=sys.stderr)
        sys.exit(1)

    if metric_max is not None:
        try:
            max_f = float(metric_max)
            pass_rate = (score_f / max_f * 100.0) if max_f > 0 else score_f
        except (ValueError, TypeError):
            pass_rate = score_f
    else:
        pass_rate = score_f

    row = {
        "experiment": experiment_number,
        "score": score,
        "max_score": str(metric_max) if metric_max is not None else "",
        "pass_rate": f"{pass_rate:.1f}%" if metric_max is not None else f"{pass_rate}",
        "status": status,
        "description": description,
    }

    utils.append_tsv(results_tsv, row)

    # Read all TSV rows and rebuild experiments list
    all_rows = utils.read_tsv(results_tsv)
    experiments = []
    for r in all_rows:
        try:
            pr_raw = str(r.get("pass_rate", "0")).rstrip("%")
            pr = float(pr_raw)
        except (ValueError, TypeError):
            pr = 0.0
        experiments.append({
            "id": r.get("experiment", ""),
            "score": r.get("score", ""),
            "max_score": r.get("max_score", ""),
            "pass_rate": pr,
            "status": r.get("status", ""),
            "description": r.get("description", ""),
        })

    # Determine overall status — running unless explicitly marked complete
    run_status = "complete" if status == "complete" else "running"

    utils.update_results_json(
        json_path=results_json,
        config=config,
        experiments=experiments,
        status=run_status,
    )

    # Regenerate dashboard
    dashboard_script = Path(__file__).parent / "generate_dashboard.py"
    if dashboard_script.exists():
        try:
            subprocess.run(
                [sys.executable, str(dashboard_script), results_json],
                check=True,
            )
        except subprocess.CalledProcessError as exc:
            print(f"Warning: dashboard generation failed: {exc}", file=sys.stderr)
    else:
        print(
            f"Warning: generate_dashboard.py not found at {dashboard_script}",
            file=sys.stderr,
        )

    print(
        f"Logged experiment {experiment_number} [{status}]: score={score}, "
        f"pass_rate={pass_rate:.1f}"
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Run experiment scoring or log results for overnight-optimizer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # measure / eval subcommand
    # Note: exposed as "eval" in the SKILL.md interface for consistency;
    # internally the function is named run_measure to avoid ambiguity.
    measure_parser = subparsers.add_parser(
        "eval",
        help="Run eval_script and output JSON result",
    )
    measure_parser.add_argument("config", help="Path to experiment.yaml")

    # log subcommand
    log_parser = subparsers.add_parser(
        "log",
        help="Record experiment result to TSV/JSON and regenerate dashboard",
    )
    log_parser.add_argument("config", help="Path to experiment.yaml")
    log_parser.add_argument("experiment_number", help="Experiment number (e.g. 1, 2, 3)")
    log_parser.add_argument(
        "status",
        choices=["baseline", "keep", "discard", "complete"],
        help="Outcome of this experiment",
    )
    log_parser.add_argument("description", help="Short description of what was tried")
    log_parser.add_argument("score", help="Numeric score from the eval")

    args = parser.parse_args()

    if args.subcommand == "eval":
        run_measure(args.config)
    elif args.subcommand == "log":
        run_log(
            args.config,
            args.experiment_number,
            args.status,
            args.description,
            args.score,
        )


if __name__ == "__main__":
    main()
