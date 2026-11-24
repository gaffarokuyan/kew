import json, sys, os, shutil, subprocess, concurrent.futures as cf
sys.argv = [sys.argv[0]]
from ifix import stt, toks, score, finish, A, BK, C, KEY
from arab import to_arabic
ULGEN = "9UoAU5im7Rl44J2IvBHU"; SORF = "gKBBj5qeN1aYCf7AcOpK"
def tts(text, voice, out, seed, lang="ckb"):
    if os.path.exists(out): return out
    tag = "[clearly, warm teacher] " if " " in text.strip() else ""
    body = json.dumps({"text": tag + text, "model_id": "eleven_v4", "seed": seed, "language_code": lang})
    for _ in range(3):
        r = subprocess.run(["curl", "-sS", "-m", "120", "-w", "%{http_code}", "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                            "-H", "xi-api-key: " + KEY, "-H", "Content-Type: application/json", "-d", body, "-o", out + ".tmp"], capture_output=True, text=True)
        if r.stdout.strip() == "200" and os.path.getsize(out + ".tmp") > 2000: os.rename(out + ".tmp", out); return out
        if b"quota" in open(out + ".tmp", "rb").read(300): sys.exit("quota")
    return None
st = json.load(open("ifix_state.json"))
def one(x):
    text, f, heard0 = x["text"], x["f"], x["before"]
    s0 = score(heard0, text); iw = [w for w in toks(text) if "i" in w]; ar = to_arabic(text.replace("Juji", "Jûjî"))
    best = None
    for voice, seed, tagv in ((ULGEN, 11, "ulgen"), (ULGEN, 23, "ulgen"), (SORF, 11, "sorani")):
        if best and not best[0] and tagv == "sorani": break   # Ülgen already fine: keep one voice
        p = tts(ar, voice, f"{C}{f[:-4]}_ckb_{tagv}{seed}.mp3", seed)
        if not p: continue
        h = stt(p)
        if h is None: continue
        ok = all(w in set(toks(h)) for w in iw)
        cand = (not ok, tagv != "ulgen", -score(h, text), p, h, tagv)
        if best is None or cand[:3] < best[:3]: best = cand
    if best and not best[0] and -best[2] >= s0 - 0.05:
        if not os.path.exists(BK + f): shutil.copy(A + f, BK + f)
        finish(best[3], A + f)
        return {**x, "fixed": True, "after": best[4], "how": "ckb-" + best[5]}
    return {**x, "fixed": False, "after3": best[4] if best else None}
with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(one, st["retry"]))
for r in res: print("OK " + r.get("how", "") if r["fixed"] else "--     ", r["text"][:45], "|", r["before"][:35], "→", (r.get("after") if r["fixed"] else r.get("after3")) or "")
st["fixed"] += [r for r in res if r["fixed"]]; st["retry"] = [r for r in res if not r["fixed"]]
json.dump(st, open("ifix_state.json", "w"), ensure_ascii=False, indent=1)
print("fixed now", len(st["fixed"]), "still", len(st["retry"]))
