"""Build src/content/bridge.json: the same word in Kurmancî, Soranî (Arabic + Latin) and Zazakî.
Words are matched by their first Turkish meaning across the three course files."""
import json, re
C = "/home/claude/kew/src/content/"
def load(f):
    d = json.load(open(C + f)); out = {}
    for s in d["SECTIONS"]:
        for u in s["units"]:
            for w in u["words"]:
                key = re.sub(r"\s*\(.*?\)", "", w[1].split("|")[0].lower()).split(",")[0].strip()
                if key and key not in out: out[key] = (w[0], w[1], s["lvl"], u.get("name", ""))
    return out, d.get("LAT", {})
k, _ = load("course.json"); s, lat = load("course_ckb.json"); z, _ = load("course_zza.json")
rows = []
for key, (kw, m, lvl, uname) in k.items():
    if key not in s: continue
    sw = s[key][0]
    rows.append({"m": m, "lvl": lvl, "topic": s[key][3] or uname, "kmr": kw, "ckb": sw, "ckbLat": lat.get(sw, ""), "zza": z[key][0] if key in z else None})
# words that are (almost) the same in Kurmancî and Soranî Latin first: they make learners feel at home
def same(r): a, b = r["kmr"].lower(), r["ckbLat"].lower(); return a == b
rows.sort(key=lambda r: (r["lvl"], not same(r)))
RULES = [
  ["v → w", "Kurmancîdeki «v» Soranîde çoğu zaman «w» olur.|Kurmancî «v» often becomes «w» in Soranî.|Kurmancî «v» wird im Soranî oft zu «w».", [["av", "aw"], ["sêv", "sêw"], ["bav", "bawk"]]],
  ["ft → wt", "«ft» Soranîde «wt» olur.|«ft» becomes «wt» in Soranî.|«ft» wird im Soranî zu «wt».", [["heft", "hewt"]]],
  ["-ik", "Kurmancîdeki «-ik» eki Soranîde genelde düşer.|The Kurmancî ending «-ik» usually drops in Soranî.|Die Kurmancî-Endung «-ik» fällt im Soranî meist weg.", [["dayik", "dayk"]]],
  ["ez → min", "Zamirler farklı: «ez» yerine «min», «ew» aynı kalır.|Pronouns differ: «min» instead of «ez»; «ew» stays.|Pronomen unterscheiden sich: «min» statt «ez»; «ew» bleibt.", [["ez", "min"], ["tu", "to"]]],
  ["-ekê / -ekan", "Soranîde belirlilik eki var: kitêbeke «kitap (belli)», kitêbekan «kitaplar».|Soranî marks definiteness: kitêbeke «the book», kitêbekan «the books».|Soranî markiert Bestimmtheit: kitêbeke «das Buch», kitêbekan «die Bücher».", [["pirtûk", "kitêbeke"]]],
  ["Zazakî", "Zazakî (Kirmanckî) ayrı bir dal: sayılar ve zamirler farklıdır (yew, di, hîrê).|Zazakî (Kirmanckî) is a separate branch: numbers and pronouns differ (yew, di, hîrê).|Zazakî (Kirmanckî) ist ein eigener Zweig: Zahlen und Pronomen unterscheiden sich (yew, di, hîrê).", [["yek", "yew"], ["sê", "hîrê"]]],
]
json.dump({"rows": rows, "rules": RULES}, open(C + "bridge.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(rows), "rows,", sum(1 for r in rows if r["zza"]), "with Zazakî,", sum(map(same, rows)), "identical kmr/ckb")
