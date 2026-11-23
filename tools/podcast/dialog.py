"""Juji podcast voicing — DEVIR NOTU method (approved): eleven_v4, seed 11, no emotion tags (emotion only from
punctuation), each line voiced in one piece per speaker, trimmed at -50 dB, 0.35 s gaps, loudnorm I=-15. Checked with Scribe.
  python3 dialog.py kmr-b1-01   -> audio_dlg/<id>.mp3 + .json {dur, at[]} + report
Key: ~/.secrets/elevenlabs
"""
import concurrent.futures as cf, difflib, json, os, re, subprocess, sys, unicodedata
D = "/home/claude/kew_pod/"; OUT = D + "audio_dlg/"; C = D + "cache_dlg/"
KEY = open(os.path.expanduser("~/.secrets/elevenlabs")).read().strip()
# speaker -> (voice_id, stability)
VOICE = {"Juji": ("h5qtAtbcNxKhIa170f34", 0.5),    # Abdulgaffar Kurmancî (user's own cloned voice)
         "Bapîr": ("nMvZRihyU408YNgNXHuX", 0.4),   # Gaspar
         "Dapîr": ("0M3917teU4Y57BvDVCKx", 0.5)}   # "Juji Dapîr": IVC clone of Kurdish TTS kurmanji_233 (user choice)
GAP = 0.35
FIX = {("kmr-b1-01", 0): "Silav hevalno! Ez Jûjî me, û ev podkasta asta B1 ye. Îro du mêvanên me hene: Bapîr û Dapîr!",
       ("kmr-b1-01", 12): "Bapîr, her tim wisa dibêje... lê ew, ji xewa sibê jî pir hez dike!"}
os.makedirs(OUT, exist_ok=True); os.makedirs(C, exist_ok=True)

def norm(s):
    s = unicodedata.normalize("NFC", s.lower()); s = re.sub(r"[^\wçêîşû ]", " ", s); return " ".join(s.split())
def score(a, b): return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)
def ff(*a): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True, timeout=120)

def tts(text, voice, stab, out):
    if os.path.exists(out): return out
    body = json.dumps({"text": text, "model_id": "eleven_v4", "seed": 11, "voice_settings": {"stability": stab, "similarity_boost": 0.85}})
    for _ in range(3):
        r = subprocess.run(["curl", "-sS", "--max-time", "120", "-w", "%{http_code}", "-X", "POST",
                            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                            "-H", "xi-api-key: " + KEY, "-H", "Content-Type: application/json", "-d", body, "-o", out + ".tmp"], capture_output=True, text=True)
        if r.stdout.strip() == "200" and os.path.getsize(out + ".tmp") > 2000: os.rename(out + ".tmp", out); return out
        print("  TTS FAIL", r.stdout.strip(), open(out + ".tmp", "rb").read(200), flush=True)
    sys.exit("tts gave up")

def stt(p):
    js = p[:-4] + ".stt.json"
    if not os.path.exists(js):
        r = subprocess.run(["curl", "-sS", "--max-time", "120", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text", "-H", "xi-api-key: " + KEY,
                            "-F", "model_id=scribe_v1", "-F", "language_code=kmr", "-F", "file=@" + p], capture_output=True, text=True)
        open(js, "w").write(r.stdout)
    return json.load(open(js)).get("text", "")

eps = {e["id"]: e for e in json.load(open(D + "kmr.json"))["episodes"]}
for eid in sys.argv[1:]:
    e = eps[eid]
    def one(il):
        i, l = il; v, st = VOICE[l["s"]]; text = FIX.get((eid, i), l["t"])
        p = tts(text, v, st, f"{C}{eid}_{i:02d}.mp3"); said = stt(p); return p, said, score(said, l["t"])
    with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(one, enumerate(e["lines"])))
    parts, at, t, rep = [], [], 0.5, []
    for i, (l, (p, said, sc)) in enumerate(zip(e["lines"], res)):
        w = f"{C}{eid}_{i:02d}.wav"
        trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1,areverse"
        ff("-i", p, "-af", trim, "-ac", "1", "-ar", "44100", w)
        at.append(round(t, 2)); parts.append(w); t += dur(w) + GAP
        rep.append(f"{i+1:2d} {l['s']:6s} {sc:.2f} | {l['t']}\n{'':17s}duyulan: {said}")
    sil, lead, lst = C + "sil.wav", C + "lead.wav", C + "list.txt"
    ff("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", str(GAP), sil)
    ff("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.5", lead)
    open(lst, "w").write(f"file '{lead}'\n" + "".join(f"file '{p}'\nfile '{sil}'\n" for p in parts))
    raw = C + eid + "_raw.wav"; ff("-f", "concat", "-safe", "0", "-i", lst, "-ac", "1", "-ar", "44100", raw)
    out = f"{OUT}{eid}.mp3"; ff("-i", raw, "-af", "loudnorm=I=-15:TP=-1.5", "-ac", "1", "-ar", "44100", "-b:a", "96k", out)
    json.dump({"dur": round(dur(out), 1), "at": at}, open(f"{OUT}{eid}.json", "w"))
    open(f"{OUT}{eid}_report.txt", "w").write("\n".join(rep) + "\n")
    print(eid, round(dur(out), 1), "s"); print("\n".join(rep))
