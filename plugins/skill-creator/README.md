# skill-creator

**Create, test, harden, and continuously improve Claude Code skills.**

A unified workflow that takes a skill from a rough idea all the way through TDD validation, bulletproofing, learning instrumentation, and deployment — then keeps improving it over time via self-reinforcing feedback loops.

---

## What It Does

skill-creator implements a 7-phase lifecycle for building production-quality Claude Code skills:

| Phase | Name | What Happens |
|-------|------|--------------|
| 1 | Capture Intent | Interview the user, research existing skills, classify skill type (workflow / reference / hybrid) |
| 2 | Draft | Structure SKILL.md with frontmatter and workflow routing; optimize description for trigger accuracy |
| 3 | RED/GREEN | Spawn baseline and with-skill eval runs; grade responses; benchmark improvement |
| 4 | REFACTOR | Analyze eval results, identify edge cases, close loopholes, harden against failure modes |
| 5 | Instrument | Add learning event emission so the skill accumulates improvement signals over time |
| 6 | Optimize | Run description triggering accuracy tests; tune USE WHEN clauses for precision |
| 7 | Package | Bundle all files, commit with conventional messages, deploy to marketplace |

---

## What Makes It Different

Three prior efforts inform this plugin — each contributed something distinct:

| Source | Contribution |
|--------|-------------|
| Anthropic official skill-creator | Eval infrastructure: Python scripts, eval agents, HTML viewer, benchmarking |
| Jesse Vincent / superpowers | TDD methodology, CSO (Canonical Skill Object), pressure testing, bulletproofing |
| This plugin | Unified lifecycle that connects both + self-improving learning loops |

The key insight is that eval runs should not be one-off quality gates. They should emit structured learning events that accumulate into patterns, which the skill then uses to propose its own improvements.

---

## Installation

```
/plugins install skill-creator@claude-skills
```

---

## Usage

**Create a new skill from scratch:**
```
/create-skill "I want a skill that helps me write cold outreach emails"
```

**Improve an existing skill:**
```
/improve-skill seo
```

**Run evals on a skill:**
```
/run-evals writing --baseline
```

**Run the promotion pipeline (benchmark → harden → deploy):**
```
/promote-skill digest
```

---

## Self-Improving Skills

Every skill built with skill-creator emits structured learning events during use:

```json
{
  "skill": "seo",
  "event": "trigger_miss",
  "context": "user asked for title tag help, skill not invoked",
  "timestamp": "2026-03-14T10:22:00Z"
}
```

These events accumulate in a per-skill learning log. The `promote_learnings.py` script reads the log and generates concrete improvement proposals: new trigger phrases, updated descriptions, edge cases to add to bulletproofing guides.

The result is a skill that gets more accurate and more robust with every use, without requiring manual intervention.

---

## File Structure

```
skill-creator/
├── SKILL.md                          # Main skill — 7-phase lifecycle
├── LICENSE                           # MIT
├── README.md                         # This file
├── references/
│   ├── skill-structure.md            # CSO schema and SKILL.md spec
│   ├── cso-guide.md                  # Canonical Skill Object methodology
│   ├── bulletproofing.md             # Pressure testing and hardening patterns
│   └── learning-loops.md             # Learning event schema and accumulation
├── eval-viewer/
│   └── index.html                    # HTML viewer for A/B eval results
├── assets/
│   └── eval-comparison-schema.json   # Schema for eval result files
└── scripts/
    ├── run_eval.py                    # Run baseline and with-skill evals
    ├── grade_eval.py                  # Grade and score eval runs
    └── promote_learnings.py          # Analyze learning logs, propose improvements
```

---

## Attribution

- **Eval infrastructure** (scripts, agents, HTML viewer, benchmarking): [Anthropic claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- **TDD methodology, CSO, bulletproofing**: [Jesse Vincent / superpowers](https://github.com/obra/superpowers) — MIT license

---

## License

MIT — see [LICENSE](./LICENSE)
