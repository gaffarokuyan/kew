import json, re, difflib, collections
rows = json.load(open('withi.json')); stt = json.load(open('stt.json'))
def toks(s): return [w for w in re.findall(r"[a-zêîûçşA-ZÊÎÛÇŞ'’]+", s.replace("’","'").lower())]
def low(s): return s.replace("I","ı").lower() if False else s.lower()
idot = []   # text word with i, heard as same word but i→î
other = []  # i-word heard as something else
okc = 0
wordstat = collections.Counter(); wordbad = collections.Counter()
for t, f in rows:
    if f not in stt: continue
    a, b = toks(t), toks(stt[f])
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    bad = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for w in a[i1:i2]:
                if "i" in w: wordstat[w] += 1
            continue
        for k, w in enumerate(a[i1:i2]):
            if "i" not in w: continue
            wordstat[w] += 1
            h = b[j1 + k] if j1 + k < j2 else ""
            if h and len(h) == len(w) and all(x == y or (x == "i" and y == "î") for x, y in zip(w, h)) and h != w:
                bad.append((w, h, "î")); wordbad[w] += 1
            elif h != w:
                bad.append((w, h, "?"))
    if not bad: okc += 1
    elif any(x[2] == "î" for x in bad): idot.append((t, stt[f], f, bad))
    else: other.append((t, stt[f], f, bad))
print("checked", sum(1 for t,f in rows if f in stt), "ok", okc, "i→î", len(idot), "other mismatch", len(other))
json.dump({"idot": idot, "other": other}, open('result.json', 'w'), ensure_ascii=False, indent=0)
for x in idot[:25]: print("Î ", x[0], "|", x[1], "|", x[3])
print("---")
for x in other[:15]: print("? ", x[0], "|", x[1])
