"""Retake weak lesson clips without an emotion tag (single words sometimes came out with a throat-clear);
keep whichever take Scribe hears best (ties -> the shorter one), rewrite assets/audio/<name>.mp3."""
import glob, json, os, subprocess, sys
sys.argv = [sys.argv[0]]
exec(open("/home/claude/kew_pod/el.py").read().split("os.makedirs(OUT")[0])
A = "/home/claude/kew/assets/audio/"; LC = "/home/claude/kew_pod/cache_lesson/"; U = "9UoAU5im7Rl44J2IvBHU"
weak = []
for f in glob.glob(LC + "*.done"):
    r = json.load(open(f)); r["n"] = os.path.basename(f)[:-5]
    if r["score"] < 0.8 and not r.get("fixed"): weak.append(r)
def body_tts(text, out):
    if os.path.exists(out): return out
    b = json.dumps({"text": text, "model_id": "eleven_v4"})
    r = subprocess.run(["curl", "-sS", "--max-time", "120", "-w", "%{http_code}", "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{U}?output_format=mp3_44100_128",
                        "-H", "xi-api-key: " + KEY, "-H", "Content-Type: application/json", "-d", b, "-o", out + ".tmp"], capture_output=True, text=True)
    if r.stdout.strip() != "200": print("FAIL", r.stdout, open(out + ".tmp", "rb").read(150), flush=True); return None
    os.rename(out + ".tmp", out); return out
def fix(r):
    n, t = r["n"], r["text"]; spoken = t.replace("Juji", "Jûjî")
    cands = [p for p in glob.glob(LC + n + "_*.mp3")]
    for p in (body_tts(spoken, LC + n + "_plain.mp3"), body_tts(spoken[:1].upper() + spoken[1:] + ".", LC + n + "_dot.mp3")):
        if p: cands.append(p)
    best = max(((score(stt(p), t), -dur(p), p) for p in set(cands)))
    wav = LC + n + ".wav"; clean(best[2], wav)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", wav, "-af", "adelay=60,apad=pad_dur=0.12", "-ac", "1", "-ar", "44100", "-b:a", "56k", A + n + ".mp3"], check=True, timeout=60)
    os.remove(wav)
    r2 = {"text": t, "score": round(best[0], 2), "heard": stt(best[2]), "how": os.path.basename(best[2]).split("_", 1)[1][:-4], "fixed": True, "was": r["score"]}
    json.dump(r2, open(LC + n + ".done", "w"), ensure_ascii=False); return r2
with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(fix, weak))
still = sorted((x["score"], x["text"], x["heard"]) for x in res if x["score"] < 0.8)
print("retook", len(res), "better", sum(x["score"] > x["was"] for x in res), "still weak", len(still))
open("/home/claude/kew_pod/lesson_report.txt", "w").write("\n".join(f"{s:.2f} | {t}\n       heard: {h}" for s, t, h in still))
