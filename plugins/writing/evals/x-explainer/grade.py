"""Programmatic grader for x-explainer-threads evals. Usage: python3 grade.py <run_dir>"""
import json, re, sys, pathlib

run = pathlib.Path(sys.argv[1])
t = (run / "outputs/thread.md").read_text()
m = list(re.finditer(r"(?im)^#+.*\bfinal\b.*$", t))
if m: t = t[m[-1].end():]  # grade only the FINAL version when drafts are included
end = re.search(r"(?im)^#+\s*(verification|pre-publish|completion|checklist|notes)", t)
if end: t = t[: end.start()]  # drop the agent's own audit sections
p2 = re.search(r"\b2/\d", t)
first = t[: p2.start()] if p2 else t[:900]  # part 1 = everything before the 2/N marker
secs = [int(m) for m in re.findall(r"(?m)^\W*Sec(?:tion|\.)\s*(\d+)", t)]
objections = ["ban", "noise", "wells", "bills", "hulk", "overstep", "free pass"]
quoted = sum(1 for o in objections if re.search(r'["“][^"”\n]*' + re.escape(o) + r'[^"”\n]*["”]', t, re.I))
last_parts = t[-2500:]
excl = len(re.findall(r"![\"\u201d]?\s*$", first, re.M))  # objection lines may end in !" 
parts = len(re.findall(r"\b\d{1,2}/\d{1,2}\b", t))

checks = [
    ("hook-is-myth-list", excl >= 5 or "fact vs. fiction" in first.lower(), f"{excl} exclaimed lines in part 1"),
    ("hook-names-version", bool(re.search(r"as (adopted|filed|enacted|passed)", first, re.I)), "version phrase in part 1"),
    ("walk-opens-with-section-numbers", len(secs) >= 6, f"{len(secs)} posts open with Sec. N"),
    ("walk-in-text-order", len(secs) >= 2 and secs == sorted(secs), f"order {secs}"),
    ("parts-numbered-n-of-N", parts >= 6, f"{parts} n/N markers"),
    ("close-links-primary-source", "pecancountytx.gov" in last_parts and re.search(r"yourself|read (it|the)", last_parts, re.I) is not None, "source link + read-yourself in closing"),
    ("objections-quoted-in-walk", quoted >= 5, f"{quoted}/7 objections quoted"),
    ("share-ask-self-reply", re.search(r"share", t, re.I) is not None, "share ask present"),
    ("no-em-dashes", "—" not in t, f"{t.count(chr(0x2014))} em dashes"),
]
res = {"expectations": [{"text": n, "passed": bool(p), "evidence": e} for n, p, e in checks]}
res["summary"] = {"passed": sum(c[1] for c in checks), "total": len(checks)}
(run / "grading.json").write_text(json.dumps(res, indent=2))
print(run.parent.name, run.name, f"{res['summary']['passed']}/{len(checks)}", [n for n, p, _ in checks if not p])
