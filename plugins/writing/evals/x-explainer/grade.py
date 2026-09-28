"""Programmatic grader for x-explainer-threads evals.

Usage: python3 grade.py <run_dir> [walk|rule]
walk (default): statute-walk checks on the ordinance fixture.
rule: stakes-first rule checks on the proposed-rule fixture.
Reads <run_dir>/outputs/thread.md and writes (overwrites) <run_dir>/grading.json.
"""
import json, re, sys, pathlib

run = pathlib.Path(sys.argv[1])
variant = sys.argv[2] if len(sys.argv) > 2 else "walk"
t = (run / "outputs/thread.md").read_text()

# Grade only the FINAL version when drafts are included, and stop at the first
# appendix heading after it (Self-replies stays: the share ask lives there).
m = list(re.finditer(r"(?im)^#+\s*FINAL\b.*$", t))
if m:
    t = t[m[-1].end():]
for h in re.finditer(r"(?m)^#+\s*(.*)$", t):
    if not re.match(r"(?i)self[- ]?repl", h.group(1)):
        t = t[: h.start()]
        break

p2 = re.search(r"\b2/\d", t)
first = t[: p2.start()] if p2 else t[:900]  # part 1 = text before the 2/N marker (else first 900 chars)
walk = t[len(first):]

secs = [int(x) for x in re.findall(r"(?m)^\W*Sec(?:tion|\.)\s*(\d+)", t)]
excl = len(re.findall(r"![\"”]?\s*$", first, re.M))  # objection lines may end in !"
parts = len(re.findall(r"(?m)^\W*\d{1,2}/\d{1,2}\W*$", t))  # n/N on its own line
objections = ["ban", "noise", "wells", "bills", "hulk", "overstep", "free pass"]
# an objection counts when a line in the walk opens with a quote mark and contains the term
quoted = sum(1 for o in objections if re.search(r"(?mi)^\W*[\"“][^\n]*\b" + re.escape(o), walk))
last_parts = t[-2500:]

checks = [
    ("hook-is-myth-list", excl >= 5 or "fact vs. fiction" in first.lower(), f"{excl} exclaimed lines in part 1"),
    ("hook-names-version", bool(re.search(r"\b(adopted|filed|enacted|proposed)\b", first, re.I)), "version phrase in part 1"),
    ("walk-opens-with-section-numbers", len(secs) >= 6, f"{len(secs)} lines start with Sec. N"),
    ("walk-in-text-order", len(secs) >= 2 and secs == sorted(secs), f"order {secs}"),
    ("parts-numbered-n-of-N", parts >= 6, f"{parts} n/N lines"),
    ("close-links-primary-source", "pecancountytx.gov" in last_parts and re.search(r"yourself|read (it|the)", last_parts, re.I) is not None, "source link + read-yourself in last 2500 chars"),
    ("objections-quoted-in-walk", quoted >= 5, f"{quoted}/7 objections quoted after part 1"),
    ("share-ask-self-reply", re.search(r"\bshar(e|ing)\b[^\n]*\b(first|thread)\b|\bfirst (post|one)\b[^\n]*\bshar(e|ing)\b", t, re.I) is not None, "share-the-first-post ask present"),
    ("no-em-dashes", "—" not in t, f"{t.count(chr(0x2014))} em dashes"),
]
if variant == "rule":
    posts = [p.strip() for p in re.split(r"(?m)^\s*---\s*$", t) if p.strip()]  # harness asks for --- between posts
    thread = [p for p in posts if not re.match(r"(?i)^\W*(self[- ]?repl|reply)", p)]
    hook, tail = (thread[0] if thread else ""), "\n".join(thread[-2:])
    checks = [
        ("hook-leads-with-hard-number", re.search(r"\$\s?\d|\d+\s?%", hook.split("\n\n")[0]) is not None, "$ or % in hook's first paragraph"),
        ("hook-not-invented-myth-list", len(re.findall(r"(?m)^\W*[\"\u201c].*[!?][\"\u201d]?\s*$", hook)) < 3, "fewer than 3 quoted objection lines in hook (the source has no objections)"),
        ("hook-no-link", not re.search(r"https?://|\.example|\.gov", hook), "no URL in hook"),
        ("thread-6-to-9-posts", 6 <= len(thread) <= 9, f"{len(thread)} thread posts"),
        ("not-a-section-walk", len(secs) < 3, f"{len(secs)} lines start with Sec. N"),
        ("scenario-question-post", any(re.match(r"[^\n?]{3,90}\?", p) for p in thread[1:]), "a body post opens with a question"),
        ("close-has-docket-and-deadline", "99001" in tail and re.search(r"November 14|Nov\.? 14|11/14", tail) is not None, "project number + deadline in last 2 posts"),
        ("concedes-or-names-all-sides", re.search(r"(?i)utilit|consumer|environment|ranch|farm|cit(y|ies)", t) is not None, "other filers named"),
        ("no-em-dashes", "\u2014" not in t, f"{t.count(chr(0x2014))} em dashes"),
    ]

res = {"expectations": [{"text": n, "passed": bool(p), "evidence": e} for n, p, e in checks]}
res["summary"] = {"passed": sum(c[1] for c in checks), "total": len(checks)}
(run / "grading.json").write_text(json.dumps(res, indent=2))
print(run.parent.name, run.name, f"{res['summary']['passed']}/{len(checks)}", [n for n, p, _ in checks if not p])
