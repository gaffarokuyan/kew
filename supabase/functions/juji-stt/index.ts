// Juji speaking exercises: forwards a short clip to the Kurmancî speech recogniser.
// The STT key lives only in the KURDISH_STT_KEY secret. Audio is not stored.
const STT = "https://www.kurdishtts.com/api/stt-proxy";
const MAX = 600_000; // ~2 min of 32 kbps AAC; words/sentences are far smaller

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-juji-app") !== "juji-app-1") return new Response("Forbidden", { status: 403 });
  const key = Deno.env.get("KURDISH_STT_KEY");
  if (!key) return Response.json({ error: "not configured" }, { status: 503 });
  let form: FormData;
  try { form = await req.formData(); } catch { return Response.json({ error: "bad form" }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX) return Response.json({ error: "bad file" }, { status: 400 });
  const out = new FormData();
  out.append("file", file, file.name || "say.m4a");
  out.append("dialect", "kurmanji");
  const r = await fetch(STT, { method: "POST", headers: { "x-api-key": key }, body: out });
  if (!r.ok) return Response.json({ error: "stt " + r.status }, { status: 502 });
  const j = await r.json().catch(() => ({}));
  return Response.json({ text: typeof j.text === "string" ? j.text : "" });
});
