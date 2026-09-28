"""Programmatic grader for x-explainer-threads evals.

Usage: python3 grade.py <run_dir> [walk|rule]
       python3 grade.py --self-check

Both modes read sb6-37.0561.md, the enrolled Utilities Code §37.0561 excerpt.
walk: subsection-order checks. rule: stakes-first checks.
Reads <run_dir>/outputs/thread.md and writes (overwrites) <run_dir>/grading.json.
"""
import json, re, sys, pathlib

FIXTURE = "sb6-37.0561.md"
PHRASES = (
    "75 megawatts",
    "flat study fee of at least $100,000",
    "ownership interest, lease, or another legal interest",
    "security provided on a dollar per megawatt basis",
    "contribution in aid of construction",
    "load ramp milestones",
    "reallocated to one or more other customers",
)
# Denylist only. These strings are not a source record. A hit in any other writing file fails --self-check.
BANNED = (
    "per gallon",
    "Lone Star",
    "Pecan County",
    "99001",
    "House Bill 1234",
    "Bayline",
    "HB-77",
)

def fixture_path():
    return pathlib.Path(__file__).parent / FIXTURE

def fixture_text():
    return fixture_path().read_text()

def subsection_letters(text):
    return re.findall(r"(?m)^Sec\. 37\.0561\(([a-z])\)", text)

def fabricated(text):
    low = text.lower()
    return [b for b in BANNED if b.lower() in low]

def fact_check_body(raw):
    # Heading text is Fact-check. Not a FINAL heading and not a self-reply heading.
    heads = list(re.finditer(r"(?m)^#+\s*(.*)$", raw))
    body = None
    for i, h in enumerate(heads):
        if not re.fullmatch(r"(?i)fact-check", h.group(1).strip()):
            continue
        end = heads[i + 1].start() if i + 1 < len(heads) else len(raw)
        body = raw[h.end():end]
    return body

def fact_check_mode(body):
    # First match wins. The word "passed" is not a mode. No heading is not a failure.
    if body is None:
        return "fact-check: absent"
    if "the fact-check was not run" in body.lower():
        return "not-run"
    if re.search(r"(?i)\bnot checked\b", body):
        return "incomplete"
    first = next((ln.strip() for ln in body.splitlines() if ln.strip()), "")
    if re.match(r"(?i)fallback\b", first):
        return "fallback"
    if re.match(r"(?i)independent\b", first):
        return "independent"
    return "incomplete"

def fact_check_quote_misses(body):
    if not body:
        return []
    quotes = []
    for q in re.findall(r'"([^"]*)"', body):
        nq = re.sub(r"\s+", " ", q).strip()
        # ponytail: skip quotes no longer than "filer-expectation". Drop the cutoff if a real trace quote is that short.
        if len(nq) <= len("filer-expectation"):
            continue
        if nq not in quotes:
            quotes.append(nq)
    if not quotes:
        return []
    src = re.sub(r"\s+", " ", fixture_text())
    return [q for q in quotes if q not in src]

def self_check():
    root = pathlib.Path(__file__).resolve().parents[2]
    bad = []
    for p in list(root.rglob("*.md")) + list(root.rglob("*.py")) + list(root.rglob("*.json")):
        if p.name == "grade.py":
            continue
        text = p.read_text(errors="replace")
        for b in BANNED:
            if b in text:
                bad.append(f"{p.relative_to(root)}: {b}")
    if bad:
        raise SystemExit("banned fixture language:\n" + "\n".join(bad))
    src = fixture_text()
    for phrase in PHRASES:
        if phrase not in src:
            raise SystemExit(f"phrase missing from fixture: {phrase}")
    letters = subsection_letters(src)
    if letters != ["c", "f", "g", "h", "i", "j"]:
        raise SystemExit(f"subsection order {letters}")
    if "capitol.texas.gov/tlodocs/89R/billtext/html/SB00006F.htm" not in src:
        raise SystemExit("source url missing")
    print("self-check ok")

if len(sys.argv) > 1 and sys.argv[1] == "--self-check":
    self_check()
    sys.exit(0)

run = pathlib.Path(sys.argv[1])
variant = sys.argv[2] if len(sys.argv) > 2 else "walk"
if variant not in ("walk", "rule"):
    sys.exit(f"unknown mode {variant!r}; use walk or rule")
raw = (run / "outputs/thread.md").read_text()
report = fact_check_body(raw)
# Side field from the raw file, before the FINAL cut. Not part of summary.total.
fact_check = fact_check_mode(report)
quote_misses = fact_check_quote_misses(report)
t = raw

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

letters = subsection_letters(t)
want = subsection_letters(fixture_text())
any_secs = re.findall(r"(?m)^\W*Sec(?:tion|\.)\s*(\d+)", t)
parts = len(re.findall(r"(?m)^\W*\d{1,2}/\d{1,2}\W*$", t))  # n/N on its own line
quoted = sum(1 for phrase in PHRASES if phrase in t)
last_parts = t[-2500:]
fake = fabricated(t)

checks = [
    ("hook-names-version", bool(re.search(r"\bas (adopted|filed|enacted|passed|proposed)\b|\b(adopted|filed|enacted|proposed)\b", first, re.I)), "version phrase in part 1"),
    ("walk-opens-with-section-numbers", len(letters) >= 6, f"{len(letters)} lines start with Sec. 37.0561(x)"),
    ("walk-in-text-order", letters == want, f"order {letters}"),
    ("parts-numbered-n-of-N", parts >= 6, f"{parts} n/N lines"),
    ("close-links-primary-source", "capitol.texas.gov" in last_parts and re.search(r"yourself|read (it|the)", last_parts, re.I) is not None, "source link + read-yourself in last 2500 chars"),
    ("statutory-phrases-present", quoted >= 5, f"{quoted}/7 enrolled phrases present"),
    ("share-ask-self-reply", re.search(r"\bshar(e|ing)\b[^\n]*\b(first|thread)\b|\bfirst (post|one)\b[^\n]*\bshar(e|ing)\b", t, re.I) is not None, "share-the-first-post ask present"),
    ("no-em-dashes", "—" not in t, f"{t.count(chr(0x2014))} em dashes"),
    ("no-fabricated-instrument", not fake, f"banned: {fake}" if fake else "none"),
]
# Rule 7 tripwire: firsts, superlatives, comparisons, cost predictions, and scope-widening phrases
# that the source doesn't contain. Keyword-based, so it misses rephrasings; read the thread too.
if variant == "rule":
    SUPERLATIVE = (r"(?i)\b(toughest|strictest|harshest|steepest|largest|biggest|unprecedented|never before|nowhere else"
                   r"|first[- ](ever|of its kind)|first[- ]in[- ]the[- ](state|nation|country)"
                   r"|(state|nation|country|texas)['\u2019]?s? first"
                   r"|than any\b[^.\n]{0,40}\w*|costs? more than[^.\n]{0,40}\w*|anywhere in the state"
                   r"|most \w+ in (the country|the nation|texas|history))")
    src = fixture_text().lower()
    unsourced = sorted({m.group(0).strip() for m in re.finditer(SUPERLATIVE, t) if m.group(0).lower().strip() not in src})
    posts = [p.strip() for p in re.split(r"(?m)^\s*---\s*$", t) if p.strip()]  # harness asks for --- between posts
    thread = [p for p in posts if not re.match(r"(?i)^\W*(self[- ]?repl|reply)", p)]
    hook, tail = (thread[0] if thread else ""), "\n".join(thread[-2:])
    checks = [
        ("hook-leads-with-hard-number", re.search(r"\$\s?\d|\d+\s?%", hook.split("\n\n")[0]) is not None, "$ or % in hook's first paragraph"),
        ("hook-not-invented-myth-list", len(re.findall(r"(?m)^\W*[\"\u201c].*[!?][\"\u201d]?\s*$", hook)) < 3, "fewer than 3 quoted objection lines in hook (the excerpt has no objections)"),
        ("hook-no-link", not re.search(r"https?://|\.example|\.gov", hook), "no URL in hook"),
        ("thread-6-to-8-posts", 6 <= len(thread) <= 8, f"{len(thread)} thread posts"),
        ("not-a-section-walk", len(any_secs) < 3, f"{len(any_secs)} lines start with Sec. N"),
        ("scenario-question-post", any(re.match(r"[^\n?]{3,90}\?", p) for p in thread[1:]), "a body post opens with a question"),
        ("close-cites-section-and-fee", "37.0561" in tail and "$100,000" in tail, "section + study fee in last 2 posts"),
        ("names-other-filers", re.search(r"(?i)\b(utilit(y|ies)|cooperativ\w*|commission|customers?|ERCOT)\b[^\n]{0,80}\b(argue|push|want|file|say|comment)", "\n".join(thread[1:])) is not None, "a named group near argue/push/want/file in a body post"),
        ("no-unsourced-superlatives", not unsourced, f"flagged: {unsourced}" if unsourced else "none flagged"),
        ("no-em-dashes", "\u2014" not in t, f"{t.count(chr(0x2014))} em dashes"),
        ("no-fabricated-instrument", not fake, f"banned: {fake}" if fake else "none"),
    ]

res = {"expectations": [{"text": n, "passed": bool(p), "evidence": e} for n, p, e in checks]}
res["summary"] = {"passed": sum(c[1] for c in checks), "total": len(checks)}
res["fact_check"] = fact_check
res["fact_check_quote_misses"] = quote_misses
(run / "grading.json").write_text(json.dumps(res, indent=2))
print(run.parent.name, run.name, f"{res['summary']['passed']}/{len(checks)}", fact_check, [n for n, p, _ in checks if not p])
