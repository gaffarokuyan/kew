"""Re-voice lesson clips whose short Kurmancî «i» was heard as «î»: Ülgen (eleven_v4) reads the text with i→ı
(Turkish dotless ı is the Kurmancî i sound), the take is checked with the Kurdish STT (juji-stt), and it replaces
the old clip only when the i-words now come back right. Originals are kept in arsiv/ses-eski/i-duzeltme-oncesi/."""
import json, os, re, subprocess, sys, difflib, unicodedata, shutil, concurrent.futures as cf
KEY = open(os.path.expanduser("~/.secrets/elevenlabs")).read().strip()
ULGEN = "9UoAU5im7Rl44J2IvBHU"; REPO = "/home/claude/kew/"; A = REPO + "assets/audio/"
BK = REPO + "arsiv/ses-eski/i-duzeltme-oncesi/"; C = "/home/claude/icheck/cand/"
os.makedirs(BK, exist_ok=True); os.makedirs(C, exist_ok=True)
URL = "https://ppntnfpiqsynzenwiiha.supabase.co/functions/v1/juji-stt"

def toks(s): return re.findall(r"[a-zêîûçşA-ZÊÎÛÇŞ']+", s.replace("’", "'").lower())
def norm(s): s = unicodedata.normalize("NFC", s.lower()); s = re.sub(r"[^\wçêîşû ]", " ", s); return " ".join(s.split())
def score(said, want): return difflib.SequenceMatcher(None, norm(said), norm(want)).ratio()
def ierr(text, heard):
    """number of text words with short i that came back as the same word with î"""
    a, b = toks(text), toks(heard); n = 0
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if op == "equal": continue
        for k, w in enumerate(a[i1:i2]):
            h = b[j1 + k] if j1 + k < j2 else ""
            if "i" in w and h and len(h) == len(w) and h != w and all(x == y or (x == "i" and y == "î") for x, y in zip(w, h)): n += 1
    return n
def stt(p):
    for _ in range(3):
        r = subprocess.run(["curl", "-s", "-m", "60", "-H", "x-juji-app: juji-app-1", "-F", f"file=@{p};type=audio/mpeg", URL], capture_output=True, text=True)
        try: return json.loads(r.stdout)["text"]
        except Exception: pass
    return None
def tts(text, out, seed):
    if os.path.exists(out): return out
    tag = "[clearly, warm teacher] " if " " in text.strip() else ""
    body = json.dumps({"text": tag + text, "model_id": "eleven_v4", "seed": seed})
    for _ in range(3):
        r = subprocess.run(["curl", "-sS", "-m", "120", "-w", "%{http_code}", "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{ULGEN}?output_format=mp3_44100_128",
                            "-H", "xi-api-key: " + KEY, "-H", "Content-Type: application/json", "-d", body, "-o", out + ".tmp"], capture_output=True, text=True)
        if r.stdout.strip() == "200" and os.path.getsize(out + ".tmp") > 2000: os.rename(out + ".tmp", out); return out
        err = open(out + ".tmp", "rb").read(300)
        if b"quota" in err: sys.exit("ElevenLabs quota_exceeded")
    return None
def finish(src, dst):
    wav = src + ".wav"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15,areverse,loudnorm=I=-18:TP=-2", "-ac", "1", "-ar", "44100", wav], check=True, timeout=60)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", wav, "-af", "adelay=60,apad=pad_dur=0.12", "-ac", "1", "-ar", "44100", "-b:a", "56k", dst], check=True, timeout=60)
    os.remove(wav)

def one(job):
    text, f, heard0 = job
    e0 = ierr(text, heard0); s0 = score(heard0, text)
    spoken = text.replace("Juji", "Jûjî").replace("i", "ı")
    best = None
    for seed in (11, 23, 47):
        p = tts(spoken, f"{C}{f[:-4]}_{seed}.mp3", seed)
        if not p: continue
        h = stt(p)
        if h is None: continue
        cand = (ierr(text, h), -score(h, text), p, h, seed)
        if best is None or cand[:2] < best[:2]: best = cand
        if cand[0] == 0 and -cand[1] >= 0.85: break
    if best and best[0] < e0 and -best[1] >= s0 - 0.05:
        if not os.path.exists(BK + f): shutil.copy(A + f, BK + f)
        finish(best[2], A + f)
        return {"text": text, "f": f, "fixed": True, "before": heard0, "after": best[3], "seed": best[4]}
    return {"text": text, "f": f, "fixed": False, "before": heard0, "after": best[3] if best else None}

if __name__ == "__main__":
    r = json.load(open("result.json")); stt0 = json.load(open("stt.json"))
    jobs = [(t, f, stt0[f]) for t, h, f, bad in r["idot"]]
    if len(sys.argv) > 1: jobs = jobs[: int(sys.argv[1])]
    print(len(jobs), "clips,", sum(len(j[0]) for j in jobs), "chars per take", flush=True)
    out = []
    with cf.ThreadPoolExecutor(3) as ex:
        for k, res in enumerate(ex.map(one, jobs)):
            out.append(res); print(k, "OK " if res["fixed"] else "-- ", res["text"][:40], "|", res["before"], "→", res["after"], flush=True)
    json.dump(out, open("ifix_out.json", "w"), ensure_ascii=False, indent=1)
    print("fixed", sum(x["fixed"] for x in out), "of", len(out))
