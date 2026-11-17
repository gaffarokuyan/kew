"""Merge per-course podcast files into the app manifest; attach audio (audio/<id>.mp3 + .json) when voiced.
Bump VERSION on every content change: the app takes the remote manifest only if its version is higher than the bundled one."""
import json, os, sys
VERSION = int(sys.argv[1])
D = "/home/claude/kew_pod/"; URL = "https://gaffarokuyan.github.io/kew/pod/"
eps = [e for c in ["kmr", "ckb"] for e in json.load(open(D + c + ".json"))["episodes"]]
assert len({e["id"] for e in eps}) == len(eps)
n = 0
for e in eps:
    j = f"{D}audio/{e['id']}.json"
    if os.path.exists(j) and os.path.exists(j[:-4] + "mp3"):
        a = json.load(open(j)); assert len(a["at"]) == len(e["lines"]), e["id"]
        e["audio"] = URL + e["id"] + ".mp3"; e["dur"] = a["dur"]; n += 1
        for l, t in zip(e["lines"], a["at"]): l["at"] = t
json.dump({"version": VERSION, "episodes": eps}, open("/home/claude/kew/src/content/podcasts.json", "w"), ensure_ascii=False, indent=1)
print(len(eps), "episodes,", n, "with audio")
