"""Append the B2 section to src/content/course_ckb.json and add its Latin forms to LAT."""
import json, sys
sys.argv = ["build.py", "none"]
src = open("/home/claude/kew_ckb/build.py").read().split('if sys.argv[1] == "strings":')[0]
exec(src)  # gives fix(), NAMES
LAT_TXT = sys.stdin.read().rstrip("\n").split("\n")
FIXES = {"taqîkridn": "taqîkirdin", "berizbûnewe": "berzbûnewe", "mandûbuwn": "mandûbûn", "piştigîrî": "piştgîrî", "demxiwêndewe": "demxwêndewe"}
strings = open(D + "strings_b2.txt").read().split("\n")
assert len(strings) == len(LAT_TXT), (len(strings), len(LAT_TXT))
p = "/home/claude/kew/src/content/course_ckb.json"; d = json.load(open(p))
d["SECTIONS"] = [s for s in d["SECTIONS"] if s["lvl"] != "B2"] + [json.load(open(D + "b2.json"))]
for a, l in zip(strings, LAT_TXT):
    for x, y in FIXES.items(): l = l.replace(x, y)
    d["LAT"][a] = fix(l, a)
json.dump(d, open(p, "w"), ensure_ascii=False, indent=1)
print("sections", [s["lvl"] for s in d["SECTIONS"]], "units", sum(len(s["units"]) for s in d["SECTIONS"]), "lat", len(d["LAT"]))
