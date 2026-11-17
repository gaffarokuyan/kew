"""Voice the podcast episodes with Kurdish TTS: one clip per line (cached), joined into one mp3 per episode with line start times.
  python3 tts.py kmr|ckb [episode-id ...]   -> audio/<id>.mp3 + audio/<id>.json {dur, at[]}"""
import json, hashlib, os, subprocess, sys
D = "/home/claude/kew_pod/"; KEY = open("/home/claude/.ktts3").read().strip()
# Pronunciation comes from Kurdish TTS v4; the timbre is then converted with ElevenLabs speech-to-speech
# (women -> Ülgen, Juji and men -> Yunus C), the same way as the Demsal lesson video.
V = {"kmr": {"Juji": ("kurmanji_233", "v4"), "F": ("kurmanji_236", "v4"), "M": ("kurmanji_236", "v4")},
     "ckb": {"Juji": ("sorani_1", "v4"), "F": ("sorani_986", "v4"), "M": ("sorani_986", "v4")}}
EL = {"F": "9UoAU5im7Rl44J2IvBHU", "M": "aB3kjBYXGX3jTKxg1bsE", "Juji": "aB3kjBYXGX3jTKxg1bsE"}
ELKEY = open("/home/claude/.k3").read().strip()
def sts(src, voice):
    out = f"{D}cache/el_{voice[:6]}_{os.path.basename(src)[:-4]}.wav"
    if os.path.exists(out): return out
    for attempt in range(3):
        r = subprocess.run(["curl", "-sS", "--max-time", "180", "-w", "%{http_code}", "-X", "POST", f"https://api.elevenlabs.io/v1/speech-to-speech/{voice}?output_format=mp3_44100_128", "-H", "xi-api-key: " + ELKEY,
                            "-F", "audio=@" + src, "-F", "model_id=eleven_multilingual_sts_v2", "-F", "remove_background_noise=false", "-o", out + ".mp3"], capture_output=True, text=True)
        if r.stdout.strip() == "200" and os.path.getsize(out + ".mp3") > 3000:
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", out + ".mp3", "-af", "loudnorm=I=-18:TP=-2", "-ac", "1", "-ar", "24000", out], check=True, timeout=60); os.remove(out + ".mp3")
            if abs(dur(out) - dur(src)) < 1.0: return out
            os.remove(out)
        else:
            print("  EL FAIL", r.stdout.strip(), open(out + ".mp3", "rb").read(200), flush=True)
            if r.stdout.strip() in ("401", "402", "403"): sys.exit(1)
    sys.exit("EL gave up: " + src)
FEM = {"Rojda", "Berfîn", "Dayik", "Bijîşk"}
GAP = 0.45
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)
def clip(text, spk, mv):
    out = f"{D}cache/{hashlib.md5((spk + mv + text).encode()).hexdigest()[:12]}.wav"
    if os.path.exists(out): return out
    for attempt in range(3):
        r = subprocess.run(["curl", "-sS", "--max-time", "120", "-w", "%{http_code}", "-X", "POST", "https://www.kurdishtts.com/api/tts-proxy", "-H", "x-api-key: " + KEY, "-H", "Content-Type: application/json",
                            "-d", json.dumps({"text": text, "speaker_id": spk, "model_version": mv}), "-o", out + ".raw"], capture_output=True, text=True)
        code = r.stdout.strip()
        if code == "200" and os.path.getsize(out + ".raw") > 3000:
            trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", out + ".raw", "-af", trim, "-ac", "1", "-ar", "24000", out + ".t.wav"], check=True, timeout=60)
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", out + ".t.wav", "-af", "loudnorm=I=-18:TP=-2", "-ac", "1", "-ar", "24000", out], check=True, timeout=60)
            os.remove(out + ".raw"); os.remove(out + ".t.wav")
            d = dur(out)
            if 0.035 * len(text) < d < 0.3 * len(text) + 1: return out
            print("  odd duration", round(d, 1), len(text), text[:40], flush=True); os.remove(out)
        else:
            print("  FAIL", code, open(out + ".raw", "rb").read(120), flush=True)
            if code in ("401", "402", "403"): sys.exit(1)
    sys.exit("gave up: " + text)
c = sys.argv[1]; only = sys.argv[2:]
for e in json.load(open(D + c + ".json"))["episodes"]:
    if only and e["id"] not in only: continue
    at, t, parts = [], 0.6, []
    for l in e["lines"]:
        role = "Juji" if l["s"] == "Juji" else "F" if l["s"] in FEM else "M"
        spk, mv = V[c][role]
        p = sts(clip(l["t"], spk, mv), EL[role]); at.append(round(t, 2)); parts.append(p); t += dur(p) + GAP
    lst = D + "cache/list.txt"; sil = D + "cache/sil.wav"; lead = D + "cache/lead.wav"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(GAP), sil], check=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.6", lead], check=True)
    open(lst, "w").write(f"file '{lead}'\n" + "".join(f"file '{p}'\nfile '{sil}'\n" for p in parts))
    out = f"{D}audio/{e['id']}.mp3"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-ac", "1", "-ar", "24000", "-b:a", "48k", out], check=True)
    json.dump({"dur": round(dur(out), 1), "at": at}, open(f"{D}audio/{e['id']}.json", "w"))
    print(e["id"], round(dur(out), 1), "s", flush=True)
