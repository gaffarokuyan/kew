"""Build src/content/alpha.json: the Soranî (Arabic-based Kurdish) alphabet with Latin equivalents,
whether the letter joins to the next one, a short TR|EN|DE sound note and an example word from the course."""
import json
C = "/home/claude/kew/src/content/"
d = json.load(open(C + "course_ckb.json")); LAT = d["LAT"]
words = [(w[0], w[1]) for s in d["SECTIONS"] for u in s["units"] for w in u["words"] if " " not in w[0] and w[0] in LAT]
# letter, latin, joins-left, note
L = [
 ["ا", "a", 0, "Uzun a.|Long a.|Langes a."], ["ب", "b", 1, ""], ["پ", "p", 1, ""], ["ت", "t", 1, ""],
 ["ج", "c", 1, "Türkçe c.|Like «j» in «jam».|Wie «dsch»."], ["چ", "ç", 1, "Türkçe ç.|Like «ch» in «chair».|Wie «tsch»."],
 ["ح", "ḧ", 1, "Gırtlaktan, sert h (Arapça ح).|A tight throat «h».|Ein gepresstes Kehl-h."], ["خ", "x", 1, "Almanca «ch» (Bach).|Like German «Bach».|Wie in «Bach»."],
 ["د", "d", 0, ""], ["ر", "r", 0, "Tek vuruşlu r.|A single tap r.|Ein kurzes r."], ["ڕ", "rr", 0, "Titrek, güçlü r.|A rolled, strong r.|Ein gerolltes r."],
 ["ز", "z", 0, ""], ["ژ", "j", 0, "Fransızca j (Türkçe j).|Like «s» in «measure».|Wie «j» in «Journal»."],
 ["س", "s", 1, ""], ["ش", "ş", 1, "Türkçe ş.|Like «sh».|Wie «sch»."], ["ع", "'", 1, "Gırtlak sesi (Arapça ayn).|A throat sound (Arabic ʿayn).|Ein Kehllaut (arabisches ʿAin)."],
 ["غ", "ẍ", 1, "Gırtlaktan ğ, Fransız r gibi.|A throaty «gh», like French r.|Ein kehliges «gh», wie französisches r."], ["ف", "f", 1, ""], ["ڤ", "v", 1, ""],
 ["ق", "q", 1, "k sesinin gırtlağa yakın olanı.|A «k» made further back.|Ein weiter hinten gesprochenes k."], ["ک", "k", 1, ""], ["گ", "g", 1, ""],
 ["ل", "l", 1, "İnce l.|A light l.|Ein helles l."], ["ڵ", "ll", 1, "Kalın l (Türkçe «kalın»daki l).|A dark, heavy l.|Ein dunkles l."],
 ["م", "m", 1, ""], ["ن", "n", 1, ""], ["ه", "h", 1, ""],
 ["ە", "e", 0, "Kısa e. Kelime sonunda da yazılır.|Short e, also written at word end.|Kurzes e, auch am Wortende."],
 ["و", "w / u", 0, "Ünsüz w ya da kısa u.|Consonant w or short u.|Konsonant w oder kurzes u."], ["وو", "û", 0, "Uzun u.|Long u.|Langes u."],
 ["ۆ", "o", 0, ""], ["ی", "y / î", 1, "Ünsüz y ya da uzun i.|Consonant y or long i.|Konsonant j oder langes i."],
 ["ێ", "ê", 1, "Türkçe «ey»e yakın.|Like «ay» in «say».|Wie «ee» in «See»."],
 ["ئ", "-", 1, "Ünlüyle başlayan kelimenin başına gelir, okunmaz.|Placed before a word-initial vowel; silent.|Steht vor einem Vokal am Wortanfang; stumm."],
]
out = []
for ch, lat, joins, note in L:
    ex = sorted((w for w in words if ch in w[0] and (ch != "و" or "وو" not in w[0])), key=lambda w: len(w[0]))
    e = ex[0] if ex else None
    out.append({"ch": ch, "lat": lat, "joins": bool(joins), "note": note, "ex": e[0] if e else None, "exLat": LAT.get(e[0]) if e else None, "exM": e[1] if e else None})
# short words for the reading game
read = sorted({w for w, _ in words if 2 <= len(w) <= 6})
json.dump({"letters": out, "read": [[w, LAT[w]] for w in read]}, open(C + "alpha.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "letters,", sum(1 for x in out if x["ex"]), "with examples,", len(read), "reading words")
