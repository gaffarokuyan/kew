"""Re-voice every Kurmancî lesson clip (words, sentences, story lines) with ElevenLabs eleven_v4 Ülgen, and add the
B1 clips that were missing. Latin first; if Scribe (kmr) hears it badly, an Arabic-script take is tried and the better kept.
Writes assets/audio/<name>.mp3 (existing names kept, so audioMap keys stay) and regenerates src/content/audioMap.ts.
  python3 lesson.py [limit]
"""
import concurrent.futures as cf, hashlib, json, os, re, subprocess, sys
sys_argv = sys.argv[1:]; sys.argv = [sys.argv[0]]
exec(open("/home/claude/kew_pod/el.py").read().split("os.makedirs(OUT")[0])  # tts, stt, score, to_arabic, clean, dur
REPO = "/home/claude/kew/"; A = REPO + "assets/audio/"; LC = "/home/claude/kew_pod/cache_lesson/"
ULGEN = "9UoAU5im7Rl44J2IvBHU"
os.makedirs(LC, exist_ok=True)
amap = open(REPO + "src/content/audioMap.ts").read()
pairs = re.findall(r'"((?:[^"\\]|\\.)*)":\s*require\("\.\./\.\./assets/audio/([^"]+)\.mp3"\)', amap)
name_of = {}
for t, f in pairs: name_of.setdefault(f, t)          # file -> canonical text
texts = {t: f for f, t in name_of.items()}
c = json.load(open(REPO + "src/content/course.json"))
need = []
for sec in c["SECTIONS"]:
    for u in sec["units"]:
        need += [w[0] for w in u["words"]] + [x[0] for x in u["sents"]]
        if u.get("story"): need += [l[1] for l in u["story"]["lines"]]
keys = {t for t, _ in pairs}
strip = lambda x: re.sub(r"[.,!?;:…«»]+", "", x).strip()
for x in dict.fromkeys(need):
    if x not in keys and strip(x) not in keys and x not in texts:
        texts[x] = hashlib.md5(x.encode()).hexdigest()[:10]
items = sorted(texts.items(), key=lambda kv: kv[1])
if sys_argv: items = items[: int(sys_argv[0])]
print(len(items), "clips,", sum(len(t) for t, _ in items), "chars", flush=True)

def one(kv):
    text, name = kv
    out = A + name + ".mp3"; done = LC + name + ".done"
    if os.path.exists(done): return name, json.load(open(done))
    spoken = text.replace("Juji", "Jûjî")
    tag = "[clearly, warm teacher]" if " " in text.strip() else "[clearly]"
    p1 = tts(spoken, ULGEN, tag, LC + name + "_lat.mp3"); s1 = stt(p1); sc1 = score(s1, text); best = (sc1, p1, s1, "lat")
    if sc1 < 0.8:
        p2 = tts(to_arabic(spoken), ULGEN, tag, LC + name + "_ar.mp3"); s2 = stt(p2); sc2 = score(s2, text)
        if sc2 > sc1: best = (sc2, p2, s2, "ar")
    wav = LC + name + ".wav"; clean(best[1], wav)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", wav, "-af", "adelay=60,apad=pad_dur=0.12", "-ac", "1", "-ar", "44100", "-b:a", "56k", out], check=True, timeout=60)
    os.remove(wav)
    r = {"text": text, "score": round(best[0], 2), "heard": best[2], "how": best[3]}
    json.dump(r, open(done, "w"), ensure_ascii=False)
    return name, r

res = {}
with cf.ThreadPoolExecutor(3) as ex:
    for k, (name, r) in enumerate(ex.map(one, items)):
        res[name] = r
        if k % 50 == 0: print(k, name, r["score"], r["text"][:40], flush=True)

# regenerate the map: every original key, plus new texts
lines = ["/* generated: Kurmancî text -> bundled recording (ElevenLabs eleven_v4, Ülgen) */", "export const AUDIO: Record<string, number> = {"]
seen = set()
for t, f in pairs + [(t, n) for t, n in texts.items() if t not in keys]:
    if t in seen or not os.path.exists(A + f + ".mp3"): continue
    seen.add(t); lines.append(f'  {json.dumps(t, ensure_ascii=False)}: require("../../assets/audio/{f}.mp3"),')
lines.append("};")
open(REPO + "src/content/audioMap.ts", "w").write("\n".join(lines) + "\n")
weak = sorted((r["score"], r["text"], r["heard"]) for r in res.values() if r["score"] < 0.8)
open("/home/claude/kew_pod/lesson_report.txt", "w").write("\n".join(f"{s:.2f} | {t}\n       heard: {h}" for s, t, h in weak))
print("done", len(res), "weak", len(weak), "map", len(seen), flush=True)
