"""Juji podcast voicing with ElevenLabs eleven_v4 (SESLENDIRME.md method).
Each line gets an English emotion tag; text is tried in Latin first, and when Scribe (kmr) hears it badly
the line is retried in Arabic-script Kurmancî and the better take is kept.
  python3 el.py kmr-a1-01 kmr-a1-02   -> audio_el/<id>.mp3 + .json {dur, at[]} + report
"""
import concurrent.futures as cf, difflib, json, os, re, subprocess, sys, unicodedata

D = "/home/claude/kew_pod/"; OUT = D + "audio_el/"; C = D + "cache_el/"
KEY = open("/home/claude/.k3").read().strip()
# one ElevenLabs voice per character
VOICE = {"Juji": "oPC5I9GKjMReiaM29gjY",      # Gökçe Deniz: young, fun, energetic
         "Rojda": "9UoAU5im7Rl44J2IvBHU",     # Ülgen
         "Berfîn": "9UoAU5im7Rl44J2IvBHU",    # Ülgen
         "Azad": "aB3kjBYXGX3jTKxg1bsE",      # Yunus C
         "Firoşkar": "TqNc7APmsiuh2GbDHtCn",  # Murat Ekim
         "Dayik": "KbaseEXyT9EE0CQLEfbB",     # Belma
         "Bapîr": "mF7tIc9VLrznhGooGjaT",     # Seyfullah Kartal (old)
         "Bijîşk": "FDs1ZX5J4e4f2c2erxtW"}    # Buket
GAP = 0.5
# emotion tag per line (episode id -> list, same order as lines)
TAGS = {
 "kmr-a1-01": ["[cheerful, welcoming]", "[excited]", "[warm, happy]", "[cheerful]", "[friendly]", "[curious]",
               "[proud]", "[curious]", "[modest, smiling]", "[delighted]", "[sweet, polite]", "[cheerful, signing off]"],
 "kmr-a1-02": ["[cheerful]", "[friendly]", "[counting on fingers]", "[curious]", "[fondly]", "[playful, curious]",
               "[proud]", "[curious]", "[warm]", "[curious]", "[nostalgic, warm]", "[delighted]"],
 "kmr-a1-03": ["[excited, bustling market around]", "[loud market seller, calling out]", "[polite]", "[friendly seller]", "[decisive]",
               "[proud of his fruit]", "[satisfied]", "[friendly]", "[cheerful]", "[warm, generous]", "[teacherly, cheerful]"],
 "kmr-a1-04": ["[sleepy, then excited]", "[warm, motherly, calling]", "[curious, hungry]", "[proud, motherly]", "[delighted gasp]",
               "[motherly]", "[polite]", "[gentle]", "[grateful, happy]", "[tender]", "[teacherly, cheerful]"],
 "kmr-a1-05": ["[curious, friendly]", "[matter-of-fact]", "[cheerful]", "[curious]", "[proud]", "[curious]",
               "[playful]", "[curious]", "[happy]", "[curious]", "[sleepy, yawning]"],
 "kmr-a2-01": ["[joyful]", "[respectful, warm]", "[old man, nostalgic]", "[old man, smiling, remembering]", "[curious]",
               "[old man, proud, nostalgic]", "[old man, joyful, remembering]", "[proud]", "[old man, wise, warm]", "[festive, joyful]"],
 "kmr-a2-02": ["[curious, friendly]", "[excited]", "[curious]", "[amazed, dreamy]", "[excited]", "[curious, hungry]",
               "[delighted, savoring]", "[curious]", "[warm, grateful]", "[curious]", "[enthusiastic]"],
 "kmr-a2-03": ["[calm, a little worried]", "[calm, professional, kind]", "[weak, hoarse, unwell]", "[calm, professional]",
               "[tired, unwell]", "[gentle, reassuring]", "[clear, instructive]", "[hopeful, unwell]", "[kind but firm]",
               "[grateful, tired]", "[caring, warm]"],
 "kmr-a2-04": ["[curious, respectful]", "[old man, wise, storytelling]", "[curious]", "[old man, softly]",
               "[old man, nostalgic, storytelling]", "[curious]", "[old man, wise]", "[curious, hopeful]",
               "[old man, proud]", "[enthusiastic]"],
 "kmr-a2-05": ["[excited]", "[happy, dreamy]", "[curious]", "[cheerful]", "[determined]", "[playful]",
               "[thoughtful]", "[cheeky, playful]", "[excited, hopeful]", "[enthusiastic]", "[warm, signing off]"],
 "ckb-a1-01": ["[cheerful, welcoming]", "[excited]", "[warm, happy]", "[cheerful]", "[friendly]", "[curious]",
               "[proud]", "[curious]", "[modest, smiling]", "[delighted]", "[sweet, polite]", "[cheerful, signing off]"],
 "ckb-a1-02": ["[cheerful]", "[friendly]", "[counting on fingers]", "[curious]", "[fondly]", "[playful, curious]",
               "[proud]", "[curious]", "[warm]", "[curious]", "[nostalgic, warm]", "[delighted]"],
 "ckb-a1-03": ["[excited, bustling market around]", "[loud market seller, calling out]", "[polite]", "[friendly seller]",
               "[decisive]", "[proud of his fruit]", "[shocked, haggling]", "[friendly, giving in]", "[satisfied]",
               "[friendly seller]", "[cheerful]", "[warm, generous]"],
 "ckb-a2-01": ["[joyful]", "[respectful, warm]", "[old man, nostalgic]", "[old man, smiling]", "[curious]",
               "[old man, fondly remembering]", "[curious, playful]", "[old man, joyful]", "[curious]",
               "[old man, proud]", "[old man, wise, warm]", "[festive, joyful]"],
 "ckb-a2-02": ["[curious, friendly]", "[excited]", "[curious]", "[cheerful]", "[amazed, dreamy]", "[curious, hungry]",
               "[delighted, savoring]", "[curious]", "[warm, grateful]", "[curious]", "[enthusiastic]"],
 "ckb-a2-03": ["[calm, a little worried]", "[calm, professional, kind]", "[weak, hoarse, unwell]", "[calm, professional]",
               "[tired, unwell]", "[gentle, reassuring]", "[clear, instructive]", "[hopeful, unwell]", "[kind but firm]",
               "[grateful, tired]", "[caring, warm]"],
}
SAY = {"Juji": "Jûjî", "ژوژی": "ژووژی"}  # how names should be read
# per-line reading hints for words the model gets wrong (episode, line index) -> text actually sent
FIX = {("kmr-a1-02", 3): "Navê xwiş-ka te çi ye?", ("kmr-a1-02", 10): "Na! Kalikê min li gund dijî. Em havînan diçin cem wî."}

def to_arabic(s):
    """Latin Kurmancî -> Arabic-script Kurmancî (Badînî style), word by word."""
    M = {"a": "ا", "b": "ب", "c": "ج", "ç": "چ", "d": "د", "e": "ە", "ê": "ێ", "f": "ف", "g": "گ", "h": "ه", "i": "", "î": "ی", "j": "ژ",
         "k": "ک", "l": "ل", "m": "م", "n": "ن", "o": "ۆ", "p": "پ", "q": "ق", "r": "ر", "s": "س", "ş": "ش", "t": "ت", "u": "و", "û": "وو",
         "v": "ڤ", "w": "و", "x": "خ", "y": "ی", "z": "ز"}
    def word(w):
        lw = w.lower(); out = ""
        for k, ch in enumerate(lw):
            if ch not in M: out += {"?": "؟", ",": "،"}.get(ch, ch); continue
            if k == 0 and ch in "aeêiîouû": out += "ئ" + (M[ch] if ch != "i" else "")
            elif ch == "r" and k == 0: out += "ڕ"
            else: out += M[ch]
        return out
    return re.sub(r"[A-Za-zÇçÊêÎîŞşÛû]+", lambda m: word(m.group()), s)

def norm(s):
    s = unicodedata.normalize("NFC", s.lower())
    for a, b in (("ي", "ی"), ("ك", "ک"), ("ة", "ە"), ("ه\u200c", "ە"), ("\u200c", ""), ("ـ", "")): s = s.replace(a, b)
    s = re.sub(r"[^\wçêîşû ]", " ", s); return " ".join(s.split())

def score(said, want): return difflib.SequenceMatcher(None, norm(said), norm(want)).ratio()

def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)

def tts(text, voice, tag, out):
    if os.path.exists(out): return out
    body = json.dumps({"text": f"{tag} {text}", "model_id": "eleven_v4"})
    for _ in range(3):
        r = subprocess.run(["curl", "-sS", "--max-time", "120", "-w", "%{http_code}", "-X", "POST",
                            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                            "-H", "xi-api-key: " + KEY, "-H", "Content-Type: application/json", "-d", body, "-o", out + ".tmp"], capture_output=True, text=True)
        if r.stdout.strip() == "200" and os.path.getsize(out + ".tmp") > 2000: os.rename(out + ".tmp", out); return out
        print("  TTS FAIL", r.stdout.strip(), open(out + ".tmp", "rb").read(200), flush=True)
    sys.exit("tts gave up")

def stt(p, ckb=False):
    js = p[:-4] + ".stt.json"
    if not os.path.exists(js):
        r = subprocess.run(["curl", "-sS", "--max-time", "120", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text", "-H", "xi-api-key: " + KEY,
                            "-F", "model_id=scribe_v1", "-F", "language_code=" + ("ckb" if ckb else "kmr"), "-F", "file=@" + p], capture_output=True, text=True)
        open(js, "w").write(r.stdout)
    return json.load(open(js)).get("text", "")

def take(eid, i, line, role):
    want = line["t"]; spoken = want
    for a, b in SAY.items(): spoken = spoken.replace(a, b)
    spoken = FIX.get((eid, i), spoken)
    tag = TAGS[eid][i]; v = VOICE[role]; base = f"{C}{eid}_{i:02d}"
    ckb = eid.startswith("ckb")
    first, second = (("ar", spoken), ("lat", line.get("lat"))) if ckb else (("lat", spoken), ("ar", to_arabic(spoken)))
    p1 = tts(first[1], v, tag, f"{base}_{first[0]}.mp3"); s1 = stt(p1, ckb); sc1 = score(s1, want)
    best = (sc1, p1, s1, first[0])
    if sc1 < 0.9 and second[1]:
        p2 = tts(second[1], v, tag, f"{base}_{second[0]}.mp3"); s2 = stt(p2, ckb); sc2 = score(s2, want)
        if sc2 > sc1: best = (sc2, p2, s2, second[0])
    return best

def clean(src, out):
    trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15,areverse"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-af", trim, "-ac", "1", "-ar", "44100", out + ".t.wav"], check=True, timeout=60)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", out + ".t.wav", "-af", "loudnorm=I=-18:TP=-2", "-ac", "1", "-ar", "44100", out], check=True, timeout=60)
    os.remove(out + ".t.wav")

os.makedirs(OUT, exist_ok=True); os.makedirs(C, exist_ok=True)
eps = {e["id"]: e for c in ("kmr", "ckb") for e in json.load(open(D + c + ".json"))["episodes"]}
report = []
for eid in sys.argv[1:]:
    e = eps[eid]; assert len(TAGS[eid]) == len(e["lines"])
    jobs = [(i, l, l["s"]) for i, l in enumerate(e["lines"])]
    with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(lambda j: take(eid, *j), jobs))
    parts, at, t = [], [], 0.6
    for (i, l, role), (sc, p, said, how) in zip(jobs, res):
        cp = f"{C}{eid}_{i:02d}_clean.wav"; clean(p, cp)
        at.append(round(t, 2)); parts.append(cp); t += dur(cp) + GAP
        report.append(f"{eid} {i+1:2d} {l['s']:7s} {how:3s} {sc:.2f} | {l['t']}\n{'':24s}heard: {said}")
    sil, lead, lst = C + "sil.wav", C + "lead.wav", C + "list.txt"
    for f, d in ((sil, GAP), (lead, 0.6)):
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", str(d), f], check=True)
    open(lst, "w").write(f"file '{lead}'\n" + "".join(f"file '{p}'\nfile '{sil}'\n" for p in parts))
    out = f"{OUT}{eid}.mp3"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-ac", "1", "-ar", "44100", "-b:a", "64k", out], check=True)
    json.dump({"dur": round(dur(out), 1), "at": at}, open(f"{OUT}{eid}.json", "w"))
    print(eid, round(dur(out), 1), "s", flush=True)
open(OUT + "report.txt", "a").write("\n".join(report) + "\n")
print("\n".join(report))
