"""Gaffar's own reading → Ülgen voice (ElevenLabs speech-to-speech), so the pronunciation is his and the timbre stays Ülgen."""
import json, os, subprocess, sys, concurrent.futures as cf
sys.argv = [sys.argv[0]] + sys.argv[1:]
from ifix import stt, toks, score, finish, A, BK, KEY
U = json.load(open("utt.json")); W = [w for w in json.load(open("voice_stt.json"))["words"] if w.get("type") == "word"]
ULGEN = "9UoAU5im7Rl44J2IvBHU"; REC = "rec_hq.wav"
# item number -> list of (start, end) pieces of the recording (last clean attempt chosen where repeated)
def u(*ks): return [(U[k]["s"], U[k]["e"]) for k in ks]
e_word = next(w for w in W if 69.9 < w["start"] < 70.6)   # «e,» that ends item 27, glued to utterance 30
MAP = {1: u(0), 2: u(1), 3: u(2), 4: u(3), 5: u(4), 6: u(5), 7: u(6), 8: u(7), 9: u(8), 10: u(9), 11: u(10), 12: u(11), 13: u(12),
  14: u(13), 15: u(14), 16: u(15), 17: u(16), 18: u(17), 19: u(18), 20: u(20), 22: u(22), 23: u(24), 24: u(25), 25: u(26), 26: u(27),
  27: u(28, 29) + [(e_word["start"], e_word["end"])], 28: [(e_word["end"] + 0.05, U[30]["e"])], 29: u(31), 30: u(33), 31: u(34), 32: u(35),
  33: u(36), 34: u(37), 35: u(38), 37: u(41), 38: u(42), 39: u(43, 44), 40: u(45, 46, 47), 41: u(48), 42: u(49, 53), 43: u(57, 58),
  44: u(59), 45: u(60), 46: u(61), 48: u(64, 65, 66), 49: u(67, 68), 52: u(76, 77), 54: u(82), 55: u(83, 86), 56: u(87), 58: u(90, 91, 92)}
items = json.load(open("ifix_state.json"))["fixed"]

def piece_audio(n):
    out = f"sts/in_{n:02d}.wav"
    if os.path.exists(out): return out
    parts = []
    for i, (s, e) in enumerate(MAP[n]):
        p = f"sts/p_{n:02d}_{i}.wav"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", REC, "-ss", f"{max(0, s - 0.12):.3f}", "-to", f"{e + 0.18:.3f}", "-ac", "1", "-ar", "44100", p], check=True)
        parts.append(p)
    gap = "sts/gap.wav"
    if not os.path.exists(gap): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.22", gap], check=True)
    seq = []
    for i, p in enumerate(parts): seq += ([gap] if i else []) + [p]
    open(f"sts/l_{n:02d}.txt", "w").write("".join(f"file '{os.path.abspath(p)}'\n" for p in seq))
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"sts/l_{n:02d}.txt", out], check=True)
    return out

def convert(n):
    src = piece_audio(n); out = f"sts/out_{n:02d}.mp3"
    if not os.path.exists(out):
        r = subprocess.run(["curl", "-sS", "-m", "180", "-w", "%{http_code}", "-X", "POST", f"https://api.elevenlabs.io/v1/speech-to-speech/{ULGEN}?output_format=mp3_44100_128",
            "-H", "xi-api-key: " + KEY, "-F", "model_id=eleven_multilingual_sts_v2", "-F", "remove_background_noise=true",
            "-F", 'voice_settings={"stability":0.5,"similarity_boost":0.85}', "-F", f"audio=@{src}", "-o", out + ".tmp"], capture_output=True, text=True)
        if r.stdout.strip() != "200": print("STS FAIL", n, open(out + ".tmp", "rb").read(300)); return n, None, None
        os.rename(out + ".tmp", out)
    return n, out, stt(out)

if __name__ == "__main__":
    want = [int(x) for x in sys.argv[1:]] or sorted(MAP)
    with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(convert, want))
    rep = {}
    for n, out, h in res:
        t = items[n - 1]["text"]; iw = [w for w in toks(t) if "i" in w]
        ok = h is not None and all(w in set(toks(h)) for w in iw)
        rep[n] = {"text": t, "heard": h, "i_ok": ok, "score": round(score(h or "", t), 2)}
        print(n, "i-ok" if ok else "i-?? ", rep[n]["score"], "|", t[:45], "→", h)
    old = json.load(open("sts_rep.json")) if os.path.exists("sts_rep.json") else {}
    old.update({str(k): v for k, v in rep.items()}); json.dump(old, open("sts_rep.json", "w"), ensure_ascii=False, indent=1)
