import json, re, sys, concurrent.futures as cf, shutil, os
sys.argv=[sys.argv[0]]
from ifix import tts, stt, ierr, score, finish, toks, A, BK, C
from arab import to_arabic
st = json.load(open("ifix_state.json"))
def one(x):
    text, f, heard0 = x["text"], x["f"], x["before"]
    s0 = score(heard0, text); iw = [w for w in toks(text) if "i" in w]
    best = None
    for seed in (11, 23):
        p = tts(to_arabic(text.replace("Juji", "Jûjî")), f"{C}{f[:-4]}_ar{seed}.mp3", seed)
        if not p: continue
        h = stt(p)
        if h is None: continue
        ok = all(w in set(toks(h)) for w in iw)
        cand = (not ok, -score(h, text), p, h, seed)
        if best is None or cand[:2] < best[:2]: best = cand
        if ok and -cand[1] >= 0.85: break
    if best and not best[0] and -best[1] >= s0 - 0.05:
        if not os.path.exists(BK + f): shutil.copy(A + f, BK + f)
        finish(best[2], A + f)
        return {**x, "fixed": True, "after": best[3], "how": "ar"}
    return {**x, "fixed": False, "after2": best[3] if best else None}
with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(one, st["retry"]))
for r in res: print("OK " if r["fixed"] else "-- ", r["text"][:45], "|", r["before"][:40], "→", (r.get("after") if r["fixed"] else r.get("after2")) or "")
st["fixed"] += [r for r in res if r["fixed"]]; st["retry"] = [r for r in res if not r["fixed"]]
json.dump(st, open("ifix_state.json", "w"), ensure_ascii=False, indent=1)
print("fixed now", len(st["fixed"]), "still", len(st["retry"]))
