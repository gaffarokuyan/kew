"""Best-of takes for weak lines: score every take on disk plus extra fresh takes, write pick.json."""
import glob, json, os, sys
sys.argv = [sys.argv[0]]  # el.py reads argv for episode ids
exec(open("/home/claude/kew_pod/el.py").read().split("os.makedirs(OUT")[0])
LINES = [("kmr-a1-03", 1), ("kmr-a1-03", 6), ("kmr-a1-03", 7), ("kmr-a1-04", 2), ("kmr-a1-05", 7), ("kmr-a2-02", 2), ("kmr-a2-04", 7),
         ("ckb-a1-01", 5), ("ckb-a1-02", 2), ("ckb-a2-03", 1), ("ckb-a2-03", 3)]
eps = {e["id"]: e for c in ("kmr", "ckb") for e in json.load(open(D + c + ".json"))["episodes"]}
pick = json.load(open(D + "pick.json")) if os.path.exists(D + "pick.json") else {}
def job(li):
    eid, i = li; l = eps[eid]["lines"][i]; ckb = eid.startswith("ckb"); v = VOICE[l["s"]]; tag = TAGS[eid][i]
    plain = l["t"].replace("Juji", "Jûjî") if not ckb else l["t"]
    variants = [("ar", plain), ("lat", l.get("lat"))] if ckb else [("lat", plain), ("ar", to_arabic(plain))]
    for n in range(2):
        for how, txt in variants:
            if txt: tts(txt, v, tag, f"{C}{eid}_{i:02d}_x{how}{n}.mp3")
    cands = [p for p in glob.glob(f"{C}{eid}_{i:02d}_*.mp3") + glob.glob(f"{C}old*/{eid}_{i:02d}_*.mp3") if not p.endswith("clean.wav")]
    scored = sorted(((score(stt(p, ckb), l["t"]), p) for p in cands), reverse=True)
    return eid, i, scored
with cf.ThreadPoolExecutor(3) as ex:
    for eid, i, scored in ex.map(job, LINES):
        pick[f"{eid}_{i:02d}"] = scored[0][1]
        print(eid, i + 1, " | ".join(f"{s:.2f}" for s, _ in scored[:6]), "->", os.path.basename(scored[0][1]), "|", stt(scored[0][1], eid.startswith("ckb")), flush=True)
json.dump(pick, open(D + "pick.json", "w"), indent=1)
