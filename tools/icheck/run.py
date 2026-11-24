import json, os, sys, time, concurrent.futures as cf, subprocess
rows = json.load(open('withi.json'))
out = json.load(open('stt.json')) if os.path.exists('stt.json') else {}
URL = "https://ppntnfpiqsynzenwiiha.supabase.co/functions/v1/juji-stt"
def one(r):
    t, f = r
    if f in out: return None
    for k in range(3):
        p = subprocess.run(["curl", "-s", "-m", "60", "-H", "x-juji-app: juji-app-1", "-F", f"file=@/home/claude/kew/assets/audio/{f};type=audio/mpeg", URL], capture_output=True, text=True)
        try:
            j = json.loads(p.stdout)
            if "text" in j: return f, j["text"]
        except Exception: pass
        time.sleep(2 + k * 3)
    return f, None
with cf.ThreadPoolExecutor(3) as ex:
    n = 0
    for res in ex.map(one, rows):
        if not res: continue
        f, txt = res
        if txt is not None: out[f] = txt
        n += 1
        if n % 50 == 0:
            json.dump(out, open('stt.json', 'w'), ensure_ascii=False); print(n, len(out), flush=True)
json.dump(out, open('stt.json', 'w'), ensure_ascii=False); print("done", len(out))
