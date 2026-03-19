#!/usr/bin/env python3
"""Generate a live auto-refreshing HTML dashboard for overnight-optimizer runs.

Adapted from skill-creator generate_dashboard.py (commit 9bce959).

Reads results.json and produces a self-contained dashboard.html that:
- Auto-refreshes every 10 seconds
- Shows score progression line chart (Chart.js from CDN)
- Shows colored experiment bars (green=keep, red=discard, blue=baseline)
- Shows experiment table with details
- Shows per-eval breakdown (assertion mode)
- Shows guard status
- Shows current status (running/complete)
- Supports both percentage mode (assertion/max_score) and raw metric mode
  (script mode without max_score)

Usage:
    python generate_dashboard.py <results_json_path> [--output <dashboard_html_path>]

Can also be called as a module:
    from generate_dashboard import generate_dashboard_html
    html = generate_dashboard_html(results_dict)
"""

import argparse
import json
import sys
from pathlib import Path


def generate_dashboard_html(data: dict, auto_refresh: bool = True) -> str:
    """Generate self-contained HTML dashboard from results data."""

    name = data.get("name", "Unknown")
    status = data.get("status", "unknown")
    current_exp = data.get("current_experiment", 0)
    baseline_score = data.get("baseline_score", 0)
    best_score = data.get("best_score", 0)
    experiments = data.get("experiments", [])
    breakdown = data.get("eval_breakdown", [])
    guards = data.get("guards", [])
    metric_name = data.get("metric_name", "Score")
    mode = data.get("eval_mode", "script")

    # Determine display mode: percentage vs raw metric
    # Use percentages when we have a max_score on the first experiment,
    # or when mode is assertion.
    has_max = False
    if experiments:
        first_max = experiments[0].get("max_score", "")
        try:
            if float(first_max) > 0:
                has_max = True
        except (TypeError, ValueError):
            pass
    use_percentage = (mode == "assertion") or has_max

    def _fmt_score(exp: dict) -> str:
        """Format score for display in cards and chart."""
        if use_percentage:
            pr = exp.get("pass_rate", 0)
            try:
                return f"{float(pr):.1f}%"
            except (TypeError, ValueError):
                return str(pr)
        else:
            sc = exp.get("score", exp.get("pass_rate", 0))
            try:
                return f"{float(sc):.2f}"
            except (TypeError, ValueError):
                return str(sc)

    def _fmt_card(value) -> str:
        """Format a summary card value."""
        if use_percentage:
            try:
                return f"{float(value):.1f}%"
            except (TypeError, ValueError):
                return str(value)
        else:
            try:
                return f"{float(value):.2f}"
            except (TypeError, ValueError):
                return str(value)

    # Build chart data
    # Y-axis: pass_rate (percentage) or raw score
    chart_values = []
    for e in experiments:
        if use_percentage:
            try:
                chart_values.append(float(e.get("pass_rate", 0)))
            except (TypeError, ValueError):
                chart_values.append(0)
        else:
            try:
                chart_values.append(float(e.get("score", e.get("pass_rate", 0))))
            except (TypeError, ValueError):
                chart_values.append(0)

    labels = json.dumps([f"Exp {e.get('id', i)}" for i, e in enumerate(experiments)])
    scores = json.dumps(chart_values)
    colors = json.dumps([
        "#60a5fa" if e.get("status") == "baseline"
        else "#4ade80" if e.get("status") == "keep"
        else "#f87171"
        for e in experiments
    ])

    y_axis_label = f"{metric_name} %" if use_percentage else metric_name
    y_axis_max = "100," if use_percentage else ""

    # Build experiment rows
    exp_rows = ""
    for exp in experiments:
        status_class = {
            "baseline": "status-baseline",
            "keep": "status-keep",
            "discard": "status-discard",
        }.get(exp.get("status", ""), "")

        score_cell = f"{exp.get('score', '')}"
        if exp.get("max_score"):
            score_cell += f"/{exp.get('max_score', '')}"

        exp_rows += f"""
        <tr class="{status_class}">
            <td>{exp.get('id', '')}</td>
            <td>{score_cell}</td>
            <td>{_fmt_score(exp)}</td>
            <td>{exp.get('status', '')}</td>
            <td>{exp.get('description', '')}</td>
        </tr>"""

    # Build eval breakdown rows
    breakdown_rows = ""
    for ev in breakdown:
        total = ev.get("total", 1)
        passed = ev.get("pass_count", 0)
        pct = (passed / total * 100) if total > 0 else 0
        bar_color = "#4ade80" if pct >= 80 else "#fbbf24" if pct >= 50 else "#f87171"
        breakdown_rows += f"""
        <tr>
            <td>{ev.get('name', '')}</td>
            <td>{passed}/{total}</td>
            <td>
                <div class="bar-bg">
                    <div class="bar-fill" style="width:{pct:.0f}%;background:{bar_color}"></div>
                </div>
            </td>
            <td>{pct:.0f}%</td>
        </tr>"""

    # Build guard rows
    guard_rows = ""
    for g in guards:
        g_status = g.get("status", "unknown")
        g_icon = "&#x2705;" if g_status == "pass" else "&#x274C;"
        guard_rows += (
            f"<tr><td>{g_icon}</td><td>{g.get('name', '')}</td>"
            f"<td>{g_status}</td></tr>"
        )

    refresh_meta = '<meta http-equiv="refresh" content="10">' if auto_refresh else ""
    status_text = (
        f"Running experiment {current_exp}..." if status == "running" else "Complete"
    )
    status_color = "#4ade80" if status == "complete" else "#60a5fa"

    try:
        improvement = float(best_score) - float(baseline_score)
    except (TypeError, ValueError):
        improvement = 0.0
    improvement_sign = "+" if improvement >= 0 else ""
    improvement_display = (
        f"{improvement_sign}{improvement:.1f}%"
        if use_percentage
        else f"{improvement_sign}{improvement:.2f}"
    )

    breakdown_section = ""
    if breakdown:
        breakdown_section = f"""
    <div class="section card">
        <div class="section-title">Per-Eval Breakdown</div>
        <table>
            <tr><th>Eval</th><th>Passed</th><th>Distribution</th><th>Rate</th></tr>
            {breakdown_rows}
        </table>
    </div>"""

    guard_section = ""
    if guards:
        guard_section = f"""
    <div class='section card'>
        <div class='section-title'>Guard Status</div>
        <table>
            <tr><th></th><th>Guard</th><th>Status</th></tr>
            {guard_rows}
        </table>
    </div>"""

    score_col_header = f"{metric_name} %" if use_percentage else metric_name

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {refresh_meta}
    <title>Overnight Optimizer: {name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; }}
        h1 {{ font-size: 1.5rem; margin-bottom: 4px; }}
        .subtitle {{ color: #64748b; margin-bottom: 24px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }}
        .card {{ background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
        .card-label {{ font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }}
        .card-value {{ font-size: 1.75rem; font-weight: 700; margin-top: 4px; }}
        .chart-container {{ background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 24px; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th {{ text-align: left; padding: 10px 12px; font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #e2e8f0; }}
        td {{ padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }}
        .status-keep {{ background: #f0fdf4; }}
        .status-discard {{ background: #fef2f2; }}
        .status-baseline {{ background: #eff6ff; }}
        .bar-bg {{ background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; }}
        .bar-fill {{ height: 100%; border-radius: 4px; transition: width 0.3s; }}
        .status-badge {{ display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; color: white; }}
        .section {{ margin-bottom: 24px; }}
        .section-title {{ font-size: 1rem; font-weight: 600; margin-bottom: 12px; }}
    </style>
</head>
<body>
    <h1>Overnight Optimizer: {name}</h1>
    <p class="subtitle">
        <span class="status-badge" style="background:{status_color}">{status_text}</span>
    </p>

    <div class="grid">
        <div class="card">
            <div class="card-label">Baseline</div>
            <div class="card-value">{_fmt_card(baseline_score)}</div>
        </div>
        <div class="card">
            <div class="card-label">Best Score</div>
            <div class="card-value" style="color:#16a34a">{_fmt_card(best_score)}</div>
        </div>
        <div class="card">
            <div class="card-label">Improvement</div>
            <div class="card-value">{improvement_display}</div>
        </div>
        <div class="card">
            <div class="card-label">Experiments</div>
            <div class="card-value">{len(experiments)}</div>
        </div>
    </div>

    <div class="chart-container">
        <canvas id="scoreChart" height="80"></canvas>
    </div>

    {guard_section}

    {breakdown_section}

    <div class="section card">
        <div class="section-title">Experiment Log</div>
        <table>
            <tr><th>#</th><th>Score</th><th>{score_col_header}</th><th>Status</th><th>Description</th></tr>
            {exp_rows}
        </table>
    </div>

    <script>
        new Chart(document.getElementById('scoreChart'), {{
            type: 'line',
            data: {{
                labels: {labels},
                datasets: [{{
                    label: '{y_axis_label}',
                    data: {scores},
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: {colors},
                    pointRadius: 6,
                    pointHoverRadius: 8
                }}]
            }},
            options: {{
                responsive: true,
                plugins: {{
                    legend: {{ display: false }},
                    title: {{ display: true, text: 'Score Progression', font: {{ size: 14 }} }}
                }},
                scales: {{
                    y: {{ min: 0, {y_axis_max} title: {{ display: true, text: '{y_axis_label}' }} }},
                    x: {{ title: {{ display: true, text: 'Experiment' }} }}
                }}
            }}
        }});
    </script>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(
        description="Generate overnight-optimizer dashboard"
    )
    parser.add_argument("results_json", help="Path to results.json")
    parser.add_argument(
        "--output", "-o",
        help="Output HTML path (default: dashboard.html in same dir)",
    )
    parser.add_argument(
        "--static", action="store_true", help="Disable auto-refresh"
    )
    args = parser.parse_args()

    results_path = Path(args.results_json)
    if not results_path.exists():
        print(f"Error: {results_path} not found", file=sys.stderr)
        sys.exit(1)

    with open(results_path) as f:
        data = json.load(f)

    html = generate_dashboard_html(data, auto_refresh=not args.static)

    output_path = (
        Path(args.output) if args.output else results_path.parent / "dashboard.html"
    )
    output_path.write_text(html)
    print(f"Dashboard written to {output_path}")


if __name__ == "__main__":
    main()
