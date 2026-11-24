#!/usr/bin/env python3
"""Builds src/content/course_deu.json (German for Turkish speakers) from tools/deu/*.txt.

Format (one unit per "##" block):
  # A1 | Section name (Türkçe) | section description          -> starts a section
  ## id | English title | Türkçe ünite adı | #colour
  w: english = türkçe | 🍎            (word, optional picture)
  s: English sentence. = Türkçe cümle.
  t: English example = Türkçe açıklama (grammar tip)
  n: Türkçe not
  story: Story title
  > Speaker: English line = Türkçe ? Soru? = doğru / yanlış1 / yanlış2
Meanings are Turkish only (the course is offered with a Turkish interface only).
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = pathlib.Path(__file__).parent

CHARS = {
    "Lena": {"c": "#d24d7a", "hair": "#c9852e", "g": "f"},
    "Max": {"c": "#1c8fc7", "hair": "#6b3e1c", "g": "m"},
    "Frau Schmidt": {"c": "#8a4fbf", "hair": "#9a9a9a", "g": "f"},
    "Herr Weber": {"c": "#5b6b7c", "hair": "#4a3a2a", "g": "m", "moust": 1},
    "Kellner": {"c": "#2f7a4f", "hair": "#1d1410", "g": "m"},
    "Ärztin": {"c": "#3a7bd5", "hair": "#2b1d14", "g": "f"},
}
SAYINGS = [
    ["Übung macht den Meister.", "İşleyen demir pas tutmaz."],
    ["Aller Anfang ist schwer.", "Her başlangıç zordur."],
    ["Besser spät als nie.", "Geç olsun, güç olmasın."],
    ["Morgenstund hat Gold im Mund.", "Erken kalkan yol alır."],
    ["Wer A sagt, muss auch B sagen.", "Başladığın işi bitir."],
    ["Ende gut, alles gut.", "Sonu iyi biten her şey iyidir."],
    ["Viele Köche verderben den Brei.", "Bir gemide iki kaptan olmaz."],
]
FILES = ["a1.txt"]


def build():
    sections, sec, unit, story = [], None, None, None
    ids, problems = set(), []
    for fn in FILES:
        p = SRC / fn
        if not p.exists():
            continue
        for ln, raw in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            line = raw.strip()
            if not line or line.startswith("//"):
                continue
            where = f"{fn}:{ln}"
            if line.startswith("## "):
                uid, ti, name, col = [x.strip() for x in line[3:].split("|")]
                if uid in ids:
                    problems.append(f"{where} duplicate unit {uid}")
                ids.add(uid)
                unit = {"id": "de_" + uid, "ku": ti, "col": col, "name": name, "words": [], "sents": [], "tips": []}
                sec["units"].append(unit)
                story = None
            elif line.startswith("# "):
                lvl, name, sub = [x.strip() for x in line[2:].split("|")]
                sec = {"lvl": lvl, "name": name, "sub": sub, "units": []}
                sections.append(sec)
            elif line.startswith("w:"):
                body, _, pic = line[2:].partition("|")
                en, _, tr = body.partition("=")
                row = [en.strip(), tr.strip()]
                if pic.strip():
                    row.append(pic.strip())
                if not row[0] or not row[1]:
                    problems.append(f"{where} bad word")
                unit["words"].append(row)
            elif line.startswith("s:"):
                en, _, tr = line[2:].partition(" = ")
                if not tr:
                    problems.append(f"{where} sentence without ' = '")
                unit["sents"].append([en.strip(), tr.strip()])
            elif line.startswith("t:"):
                en, _, tr = line[2:].partition(" = ")
                unit["tips"].append([en.strip(), tr.strip()])
            elif line.startswith("n:"):
                unit["note"] = line[2:].strip()
            elif line.startswith("story:"):
                story = {"title": line[6:].strip(), "lines": []}
                unit["story"] = story
            elif line.startswith(">"):
                body = line[1:].strip()
                who, _, rest = body.partition(":")
                main, _, quiz = rest.partition(" ? ")
                en, _, tr = main.partition(" = ")
                row = [who.strip(), en.strip(), tr.strip()]
                if quiz:
                    q, _, opts = quiz.rpartition(" = ")
                    opts = [o.strip() for o in opts.split(" / ")]
                    row.append({"q": q.strip(), "options": opts})
                    if opts[0] != en.strip():
                        problems.append(f"{where} first option must equal the line")
                if who.strip() not in CHARS and who.strip() not in ("Juji", "Azad", "Rojda", "Berfîn"):
                    problems.append(f"{where} unknown speaker {who}")
                story["lines"].append(row)
            else:
                problems.append(f"{where} ?? {line[:40]}")
    for s in sections:
        for u in s["units"]:
            if not u["tips"]:
                del u["tips"]
            if len(u["words"]) < 6:
                problems.append(f"{u['id']}: only {len(u['words'])} words")
            if len(u["sents"]) < 5:
                problems.append(f"{u['id']}: only {len(u['sents'])} sentences")
    out = {"SECTIONS": sections, "CHARS": CHARS, "SAYINGS": SAYINGS}
    (ROOT / "src/content/course_deu.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    units = [u for s in sections for u in s["units"]]
    print(f"{len(sections)} sections, {len(units)} units, {sum(len(u['words']) for u in units)} words, "
          f"{sum(len(u['sents']) for u in units)} sentences, {sum(1 for u in units if u.get('story'))} stories")
    for p in problems:
        print("PROBLEM", p)
    return not problems


if __name__ == "__main__":
    sys.exit(0 if build() else 1)
