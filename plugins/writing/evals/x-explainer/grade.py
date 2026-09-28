"""Programmatic grader for x-explainer-threads evals.

Usage: python3 grade.py <run_dir> [walk|rule]
       python3 grade.py --self-check

Both modes read sb6-37.0561.md, the enrolled Utilities Code §37.0561 excerpt.
walk: 11 subsection-order checks. rule: 12 stakes-first checks.
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
# Bare "proposed" is not a version word: subsection (g) says "proposed load location".
# Bare "passed" is not one either. "as proposed" and "as passed" are.
VERSION_RE = re.compile(
    r"\bas (adopted|filed|enacted|passed|enrolled|proposed)\b|\b(adopted|filed|enacted|enrolled)\b",
    re.I,
)
QUOTE_RE = re.compile(r'["“]([^"”]*)["”]')
RATE_RE = re.compile(r"\$\s?[\d,]+(?:\.\d+)?\s*(?:per|/)\s*(?:mw|megawatts?)\b", re.I)
# "Public Utility Commission" is the agency, not a filer. Bare "commission" is not in this pattern.
FILER_RE = re.compile(
    r"(?i)\b(?:consumer groups?|developers?|cooperativ\w*|customers?|ERCOT|utilit(?:y|ies)(?!\s+commission))\b"
    r"[^\n]{0,80}\b(?:argue|push|want|file|say|comment)\b"
)
SKIP_HEADINGS = {"fact-check", "fact-check rows"}

def fixture_path():
    return pathlib.Path(__file__).parent / FIXTURE

def fixture_text():
    return fixture_path().read_text()

def norm(text):
    return re.sub(r"\s+", " ", text).strip()

def subsection_letters(text):
    return re.findall(r"(?m)^Sec\. 37\.0561\(([a-z])\)", text)

def banned_hits(text):
    low = text.lower()
    return [b for b in BANNED if b.lower() in low]

def fabricated(text):
    return banned_hits(text)

def headings(raw):
    return list(re.finditer(r"(?m)^#+\s*(.*)$", raw))

def after_last_final(raw):
    finals = list(re.finditer(r"(?im)^#+\s*FINAL\b.*$", raw))
    return raw[finals[-1].end():] if finals else raw

def section_body(raw, title):
    # Last exact heading after the last FINAL. A draft heading before FINAL does not count.
    # "Fact-check report" is not the heading "Fact-check".
    region = after_last_final(raw)
    found = None
    heads = headings(region)
    for i, h in enumerate(heads):
        if h.group(1).strip().lower() != title:
            continue
        end = heads[i + 1].start() if i + 1 < len(heads) else len(region)
        found = region[h.end():end]
    return found

def fact_check_body(raw):
    return section_body(raw, "fact-check")

def fact_check_rows(raw):
    return section_body(raw, "fact-check rows")

def fact_check_mode(body, rows=None):
    # Priority, not document order: the not-run phrase, then an unchecked sentence,
    # then the first line's mode token. "Passed" is not a mode.
    # A missing heading returns fact-check: absent and does not change summary.total.
    if body is None:
        return "fact-check: absent"
    if "the fact-check was not run" in body.lower():
        return "not-run"
    if re.search(r"(?i)\bnot[- ]checked\b", body):
        return "incomplete"
    if rows and re.search(r"(?mi)^label:\s*not[- ]checked\s*$", rows):
        return "incomplete"
    first = next((ln.strip() for ln in body.splitlines() if ln.strip()), "")
    if re.match(r"(?i)fallback\b", first):
        return "fallback"
    if re.match(r"(?i)independent\b", first):
        return "independent"
    return "incomplete"

def fact_check_quote_misses(rows):
    # Traced evidence under ## Fact-check rows only. The live ## Fact-check block is not scanned.
    # Straight and curly quotes, any length. A miss does not change summary.total.
    if not rows:
        return []
    src = norm(fixture_text())
    misses = []
    for block in re.split(r"(?m)^(?=post:)", rows):
        if not re.search(r"(?mi)^label:\s*traced\s*$", block):
            continue
        evidence = "\n".join(ln for ln in block.splitlines() if re.match(r"(?i)\s*evidence:", ln))
        quoted = [norm(q) for q in QUOTE_RE.findall(evidence)]
        quoted = [q for q in quoted if q]
        if not quoted:
            rest = norm(re.sub(r"(?i)^\s*evidence:\s*", "", evidence))
            quoted = [rest] if rest else []
        for q in quoted:
            if q not in src and q not in misses:
                misses.append(q)
    return misses

def quotes_outside_record(text):
    src = norm(fixture_text())
    return [q for q in (norm(x) for x in QUOTE_RE.findall(text)) if q and q not in src]

def rate_outside(text):
    # ponytail: dollar-per-MW regex only. A spelled-out rate needs a reader.
    src = fixture_text()
    return [h for h in RATE_RE.findall(text) if h not in src]

def drop_skipped_sections(text):
    while True:
        heads = headings(text)
        cut = None
        for i, h in enumerate(heads):
            if h.group(1).strip().lower() not in SKIP_HEADINGS:
                continue
            end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
            cut = (h.start(), end)
            break
        if not cut:
            return text
        text = text[:cut[0]] + text[cut[1]:]

def graded_span(raw):
    # After the last FINAL. Fact-check sections are not graded, including when they
    # sit before Self-replies. The next other heading still ends the span.
    t = drop_skipped_sections(after_last_final(raw))
    for h in headings(t):
        if not re.match(r"(?i)self[- ]?repl", h.group(1)):
            return t[:h.start()]
    return t

def grade_raw(raw, variant):
    if variant not in ("walk", "rule"):
        raise SystemExit(f"unknown mode {variant!r}; use walk or rule")
    report = fact_check_body(raw)
    rows = fact_check_rows(raw)
    fact_check = fact_check_mode(report, rows)
    quote_misses = fact_check_quote_misses(rows)
    t = graded_span(raw)

    p2 = re.search(r"\b2/\d", t)
    first = t[:p2.start()] if p2 else t[:900]  # part 1 = text before the 2/N marker (else first 900 chars)
    letters = subsection_letters(t)
    want = subsection_letters(fixture_text())
    any_secs = re.findall(r"(?m)^\W*Sec(?:tion|\.)\s*(\d+)", t)
    parts = len(re.findall(r"(?m)^\W*\d{1,2}/\d{1,2}\W*$", t))  # n/N on its own line
    quoted = sum(1 for phrase in PHRASES if phrase in t)
    last_parts = t[-2500:]
    fake = fabricated(t)
    outside_rate = rate_outside(t)

    checks = [
        ("hook-names-version", VERSION_RE.search(first) is not None, "version phrase in part 1"),
        ("walk-opens-with-section-numbers", len(letters) >= 6, f"{len(letters)} lines start with Sec. 37.0561(x)"),
        ("walk-in-text-order", letters == want, f"order {letters}"),
        ("parts-numbered-n-of-N", parts >= 6, f"{parts} n/N lines"),
        ("close-links-primary-source", "capitol.texas.gov" in last_parts and re.search(r"yourself|read (it|the)", last_parts, re.I) is not None, "source link + read-yourself in last 2500 chars"),
        ("statutory-phrases-present", quoted >= 5, f"{quoted}/7 enrolled phrases present"),
        ("share-ask-self-reply", re.search(r"\bshar(e|ing)\b[^\n]*\b(first|thread)\b|\bfirst (post|one)\b[^\n]*\bshar(e|ing)\b", t, re.I) is not None, "share-the-first-post ask present"),
        ("no-em-dashes", "—" not in t, f"{t.count(chr(0x2014))} em dashes"),
        ("no-fabricated-instrument", not fake, f"banned: {fake}" if fake else "none"),
        ("hook-quotes-are-in-the-record", not quotes_outside_record(first), "hook quotes are in the excerpt"),
        ("no-rate-outside-the-record", not outside_rate, f"rate: {outside_rate}" if outside_rate else "none"),
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
            ("hook-leads-with-hard-number", re.search(r"\$\s?\d|\d+\s?%", hook[:280]) is not None, "$ or % in the hook's first 280 characters (above the fold; one-sentence-per-line hooks put it on line 3)"),
            ("hook-not-invented-myth-list", not quotes_outside_record(hook), "hook quotes are in the excerpt"),
            ("hook-no-link", not re.search(r"https?://|\.example|\.gov", hook), "no URL in hook"),
            ("thread-6-to-8-posts", 6 <= len(thread) <= 8, f"{len(thread)} thread posts"),
            ("not-a-section-walk", len(any_secs) < 3, f"{len(any_secs)} lines start with Sec. N"),
            ("scenario-question-post", any(re.match(r"[^\n?]{3,90}\?", p) for p in thread[1:]), "a body post opens with a question"),
            ("close-cites-section-and-fee", "37.0561" in tail and "$100,000" in tail, "section + study fee in last 2 posts"),
            ("names-other-filers", FILER_RE.search("\n".join(thread[1:])) is not None, "a named group near argue/push/want/file in a body post"),
            ("no-unsourced-superlatives", not unsourced, f"flagged: {unsourced}" if unsourced else "none flagged"),
            ("no-em-dashes", "\u2014" not in t, f"{t.count(chr(0x2014))} em dashes"),
            ("no-fabricated-instrument", not fake, f"banned: {fake}" if fake else "none"),
            ("no-rate-outside-the-record", not outside_rate, f"rate: {outside_rate}" if outside_rate else "none"),
        ]

    res = {"expectations": [{"text": n, "passed": bool(p), "evidence": e} for n, p, e in checks]}
    res["summary"] = {"passed": sum(c[1] for c in checks), "total": len(checks)}
    res["fact_check"] = fact_check
    res["fact_check_quote_misses"] = quote_misses
    return res

GOOD_WALK = """## DRAFT
## Fact-check
the fact-check was not run

## FINAL
Utilities Code §37.0561 as enrolled in S.B. 6.
"75 megawatts"
1/8

Sec. 37.0561(c). The threshold is 75 megawatts.
2/8

Sec. 37.0561(f). The flat study fee of at least $100,000 is the fee.
3/8

Sec. 37.0561(g). Site control is an ownership interest, lease, or another legal interest.
4/8

Sec. 37.0561(h). Proof may include security provided on a dollar per megawatt basis and a contribution in aid of construction.
5/8

Sec. 37.0561(i). Refunds follow load ramp milestones or capacity reallocated to one or more other customers.
6/8

Sec. 37.0561(j). The commission sets when capacity may be reallocated.
7/8

Read it yourself.
https://capitol.texas.gov/tlodocs/89R/billtext/html/SB00006F.htm
8/8

## Fact-check
independent 6 traced, 0 unsupported.
"per gallon"

## Self-replies
Share the first post in this thread.

## Fact-check rows
post: 2
sentence: The threshold is 75 megawatts.
label: traced
evidence: "75 megawatts"
"""

GOOD_RULE = """## DRAFT
## Fact-check
the fact-check was not run

## FINAL
A large load customer pays a flat study fee of at least $100,000 before the screening study.

---

Expect electric utilities to file and push for a higher study fee.

---

Miss the study fee?
The unused portion is credited at the same site.

---

The threshold is 75 megawatts.

---

Proof may include security provided on a dollar per megawatt basis as set by the commission.

---

Utilities Code §37.0561 sets the flat study fee of at least $100,000.

## Fact-check
independent 4 traced, 0 unsupported.
per gallon
the toughest in the nation

## Self-replies
Share the first post in this thread.

## Fact-check rows
post: 2
sentence: Expect electric utilities to file and push for a higher study fee.
label: allowed
evidence: filer-expectation
"""

def fail(msg):
    raise SystemExit(msg)

def names(res):
    return [e["text"] for e in res["expectations"]]

def failed(res):
    return [e["text"] for e in res["expectations"] if not e["passed"]]

def self_check():
    root = pathlib.Path(__file__).resolve().parents[2]
    bad = []
    for p in list(root.rglob("*.md")) + list(root.rglob("*.py")) + list(root.rglob("*.json")):
        if p.name == "grade.py":
            continue  # the tuple is the denylist, not a source record
        text = p.read_text(errors="replace")
        for b in banned_hits(text):
            bad.append(f"{p.relative_to(root)}: {b}")
    if bad:
        fail("banned fixture language:\n" + "\n".join(bad))
    for phrase in (
        "per gallon", "Lone Star", "Pecan County", "99001",
        "House Bill 1234", "Bayline", "HB-77",
    ):
        if phrase not in BANNED:
            fail(f"denylist missing {phrase}")
    if banned_hits("The fee is Per Gallon in PECAN COUNTY.") != ["per gallon", "Pecan County"]:
        fail(f"mixed-case denylist miss: {banned_hits('The fee is Per Gallon in PECAN COUNTY.')}")
    src = fixture_text()
    for phrase in PHRASES:
        if phrase not in src:
            fail(f"phrase missing from fixture: {phrase}")
    letters = subsection_letters(src)
    if letters != ["c", "f", "g", "h", "i", "j"]:
        fail(f"subsection order {letters}")
    if "capitol.texas.gov/tlodocs/89R/billtext/html/SB00006F.htm" not in src:
        fail("source url missing")
    if subsection_letters("Section 37.0561(c)\nSec. 37.0561(f)\n") != ["f"]:
        fail("Section spelling counted as a walk line")

    if not VERSION_RE.search("Utilities Code §37.0561 as enrolled in S.B. 6"):
        fail("as enrolled rejected")
    if not VERSION_RE.search("the enrolled act"):
        fail("bare enrolled rejected")
    if not VERSION_RE.search("as proposed"):
        fail("as proposed rejected")
    if not VERSION_RE.search("as passed"):
        fail("as passed rejected")
    if VERSION_RE.search("the proposed load location"):
        fail("bare proposed counted as a version")
    if VERSION_RE.search("the bill passed the Senate"):
        fail("bare passed counted as a version")

    if fact_check_mode("checked 3 sentences\n") != "incomplete":
        fail("non-token first line counted as a mode")
    if fact_check_mode("independent 1 traced\nthe fact-check was not run\n") != "not-run":
        fail("not-run lost to a leading independent")
    if fact_check_mode("independent 1 traced\nOne sentence was not checked.\n") != "incomplete":
        fail("not checked lost to a leading independent")
    if fact_check_mode("independent 1 traced\nOne sentence was not-checked.\n") != "incomplete":
        fail("hyphenated not-checked counted as independent")
    if fact_check_mode("passed\n") != "incomplete":
        fail("passed counted as a mode")
    if fact_check_mode("fallback 2 traced, 0 unsupported\n") != "fallback":
        fail("fallback was not a mode")
    if fact_check_mode(None) != "fact-check: absent":
        fail("missing heading changed the mode")
    report_only = "## Fact-check report\nindependent 1 traced\n"
    if fact_check_body(report_only) is not None or fact_check_mode(fact_check_body(report_only)) != "fact-check: absent":
        fail("Fact-check report counted as the heading")
    before = "## Fact-check\nindependent 1 traced\n\n## FINAL\nThe thread.\n"
    if fact_check_mode(fact_check_body(before)) != "fact-check: absent":
        fail("Fact-check before the last FINAL counted")
    rows_unchecked = "post: 1\nsentence: x\nlabel: not-checked\nevidence: none\n"
    if fact_check_mode("independent 1 traced\n", rows_unchecked) != "incomplete":
        fail("not-checked row stayed independent")

    planted = (pathlib.Path(__file__).parent / "planted-thread.md").read_text()
    if "is at least $200,000" not in planted:
        fail("planted arithmetic dropped at least")
    if "is $200,000" in planted:
        fail("planted arithmetic states a flat product")
    cash = "Satisfactory proof of financial commitment may include cash provided on a dollar per megawatt basis as set by the commission."
    skip = "The standards let a large load customer skip site control."
    if cash not in planted or skip not in planted:
        fail("planted misses missing")
    planted_rows = f"""post: 1
sentence: {cash}
label: traced
evidence: "{cash}"

post: 2
sentence: {skip}
label: traced
evidence: "{skip}"

post: 3
sentence: Two times the flat study fee of at least $100,000 is at least $200,000.
label: allowed
evidence: arithmetic

post: 4
sentence: Expect electric utilities to file and push for a higher study fee.
label: allowed
evidence: filer-expectation

post: 5
sentence: I hope the commission keeps the security on a dollar per megawatt basis.
label: allowed
evidence: stance
"""
    misses = fact_check_quote_misses(planted_rows)
    if cash not in misses or skip not in misses or len(misses) != 2:
        fail(f"planted traced misses: {misses}")
    if fact_check_quote_misses('post: 1\nsentence: short\nlabel: traced\nevidence: "per gallon"\n') != ["per gallon"]:
        fail("short traced quote dropped")
    if fact_check_quote_misses("post: 1\nsentence: short\nlabel: traced\nevidence: \u201cper gallon\u201d\n") != ["per gallon"]:
        fail("curly traced quote dropped")
    if fact_check_quote_misses("post: 1\nsentence: short\nlabel: traced\nevidence: per gallon\n") != ["per gallon"]:
        fail("unquoted traced evidence dropped")
    if fact_check_quote_misses('post: 1\nsentence: ok\nlabel: traced\nevidence: "75 megawatts"\n'):
        fail("excerpt quote marked a miss")

    ej = json.loads((pathlib.Path(__file__).parent / "evals.json").read_text())
    walk = grade_raw(GOOD_WALK, "walk")
    rule = grade_raw(GOOD_RULE, "rule")
    if names(walk) != ej["assertions"]:
        fail(f"walk assertions drifted: {names(walk)}")
    if names(rule) != ej["assertions_rule"]:
        fail(f"rule assertions drifted: {names(rule)}")
    if failed(walk) or walk["fact_check"] != "independent" or walk["fact_check_quote_misses"]:
        fail(f"good walk {walk['summary']} {walk['fact_check']} {failed(walk)} {walk['fact_check_quote_misses']}")
    if failed(rule) or rule["fact_check"] != "independent" or rule["fact_check_quote_misses"]:
        fail(f"good rule {rule['summary']} {rule['fact_check']} {failed(rule)} {rule['fact_check_quote_misses']}")
    if walk["summary"]["total"] != 11 or rule["summary"]["total"] != 12:
        fail(f"check counts {walk['summary']['total']} {rule['summary']['total']}")

    live_only = GOOD_WALK.replace(
        'evidence: "75 megawatts"',
        'evidence: "75 megawatts"\n',
    )
    if grade_raw(live_only, "walk")["fact_check_quote_misses"]:
        fail("live-block quote was scanned")

    traced_bad = GOOD_WALK.replace(
        'evidence: "75 megawatts"',
        'evidence: "per gallon"',
    )
    bad = grade_raw(traced_bad, "walk")
    if bad["fact_check_quote_misses"] != ["per gallon"]:
        fail(f"rows miss not recorded: {bad['fact_check_quote_misses']}")
    if bad["summary"] != walk["summary"]:
        fail("a quote miss changed summary")

    myth = GOOD_WALK.replace(
        '"75 megawatts"\n',
        '"The fee is illegal!"\n',
        1,
    )
    if failed(grade_raw(myth, "walk")) != ["hook-quotes-are-in-the-record"]:
        fail(f"invented hook quote: {failed(grade_raw(myth, 'walk'))}")

    rated = GOOD_WALK.replace(
        "Sec. 37.0561(h).",
        "Sec. 37.0561(h). The customer posts $50,000 per megawatt and $50,000 per MW.",
        1,
    )
    if "no-rate-outside-the-record" not in failed(grade_raw(rated, "walk")):
        fail(f"outside rate passed walk: {failed(grade_raw(rated, 'walk'))}")
    if rate_outside("flat study fee of at least $100,000"):
        fail("study fee flagged as a per-megawatt rate")
    for sample in ("$50,000 per megawatt", "$50,000 per MW", "$50,000/MW"):
        if not rate_outside(sample):
            fail(f"rate missed {sample}")

    spelled = GOOD_RULE.replace(
        "Utilities Code §37.0561 sets the flat study fee of at least $100,000.",
        "Utilities Code §37.0561 sets the flat study fee of at least one hundred thousand dollars.",
    )
    if failed(grade_raw(spelled, "rule")) != ["close-cites-section-and-fee"]:
        fail(f"spelled fee: {failed(grade_raw(spelled, 'rule'))}")

    verb_first = GOOD_RULE.replace(
        "Expect electric utilities to file and push for a higher study fee.",
        "Expect a push for a higher fee from the utilities.",
    )
    if failed(grade_raw(verb_first, "rule")) != ["names-other-filers"]:
        fail(f"verb-before-group: {failed(grade_raw(verb_first, 'rule'))}")

    commission = GOOD_RULE.replace(
        "Expect electric utilities to file and push for a higher study fee.",
        "The commission may say the fee is flat.",
    )
    if failed(grade_raw(commission, "rule")) != ["names-other-filers"]:
        fail(f"commission counted as a filer: {failed(grade_raw(commission, 'rule'))}")
    puc = GOOD_RULE.replace(
        "Expect electric utilities to file and push for a higher study fee.",
        "The Public Utility Commission may say the fee is flat.",
    )
    if failed(grade_raw(puc, "rule")) != ["names-other-filers"]:
        fail(f"Public Utility Commission counted as a filer: {failed(grade_raw(puc, 'rule'))}")
    for filer_sentence in (
        "Expect consumer groups to push the penalty higher.",
        "Expect developers to argue for a lower study fee.",
    ):
        filer = GOOD_RULE.replace(
            "Expect electric utilities to file and push for a higher study fee.",
            filer_sentence,
        )
        if failed(grade_raw(filer, "rule")):
            fail(f"filer sentence failed: {filer_sentence} {failed(grade_raw(filer, 'rule'))}")
    myth_rule = GOOD_RULE.replace(
        "A large load customer pays a flat study fee of at least $100,000 before the screening study.\n",
        "A large load customer pays a flat study fee of at least $100,000 before the screening study.\n\"The fee is illegal!\"\n",
        1,
    )
    if failed(grade_raw(myth_rule, "rule")) != ["hook-not-invented-myth-list"]:
        fail(f"invented rule hook quote: {failed(grade_raw(myth_rule, 'rule'))}")

    walked = GOOD_RULE.replace(
        "Expect electric utilities to file and push for a higher study fee.",
        "Sec. 37.0561(c).\nExpect electric utilities to file and push for a higher study fee.",
    ).replace(
        "The threshold is 75 megawatts.",
        "Sec. 37.0561(f).\nThe threshold is 75 megawatts.",
    ).replace(
        "Proof may include security provided on a dollar per megawatt basis as set by the commission.",
        "Sec. 37.0561(h).\nProof may include security provided on a dollar per megawatt basis as set by the commission.",
    )
    if failed(grade_raw(walked, "rule")) != ["not-a-section-walk"]:
        fail(f"section lines: {failed(grade_raw(walked, 'rule'))}")

    # Hook number: above the fold counts, even on line 3; a number buried past 280 characters does not.
    split = "Datacenters have 60 days to sign.\n\nMiss it and the utility cancels.\n\nAt 300 MW, the floor is $15 million: \U0001f9f5"
    buried = "Datacenters have a deadline.\n\n" + ("Background line. " * 20) + "\n\nThe floor is $15 million: \U0001f9f5"
    for hk, want in ((split, True), (buried, False)):
        got = bool(re.search(r"\$\s?\d|\d+\s?%", hk[:280]))
        if got != want:
            fail(f"hook fold check: {got} for {hk[:40]!r}")

    print("self-check ok")

if len(sys.argv) > 1 and sys.argv[1] == "--self-check":
    self_check()
    sys.exit(0)

run = pathlib.Path(sys.argv[1])
variant = sys.argv[2] if len(sys.argv) > 2 else "walk"
raw = (run / "outputs/thread.md").read_text()
res = grade_raw(raw, variant)
(run / "grading.json").write_text(json.dumps(res, indent=2))
print(run.parent.name, run.name, f"{res['summary']['passed']}/{res['summary']['total']}", res["fact_check"], [e["text"] for e in res["expectations"] if not e["passed"]])
