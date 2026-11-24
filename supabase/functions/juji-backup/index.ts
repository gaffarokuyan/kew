// Juji cloud backup: the app keeps a 12-character recovery code; only its SHA-256 is stored.
// save {code, data} overwrites the backup; load {code} returns it. No account, no e-mail.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const MAX = 600_000; // bytes of JSON
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-juji-app", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("juji-backup:" + s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}
const clean = (c: unknown) => (typeof c === "string" ? c.toUpperCase().replace(/[^A-Z0-9]/g, "") : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (req.headers.get("x-juji-app") !== "juji-app-1") return json({ error: "forbidden" }, 403);
  const raw = await req.text();
  if (raw.length > MAX + 200) return json({ error: "too big" }, 413);
  // deno-lint-ignore no-explicit-any
  let b: any; try { b = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }
  const code = clean(b?.code);
  if (code.length !== 12) return json({ error: "bad code" }, 400);
  const key = await sha(code);

  if (b.op === "save") {
    if (!b.data || typeof b.data !== "object" || b.data.v !== 3) return json({ error: "bad data" }, 400);
    const bytes = JSON.stringify(b.data).length;
    if (bytes > MAX) return json({ error: "too big" }, 413);
    const { error } = await db.from("juji_backup").upsert({ key, data: b.data, bytes, updated_at: new Date().toISOString() });
    return error ? json({ error: "save failed" }, 500) : json({ ok: true, at: Date.now() });
  }
  if (b.op === "load") {
    const { data } = await db.from("juji_backup").select("data,updated_at").eq("key", key).maybeSingle();
    return data ? json({ data: data.data, at: Date.parse(data.updated_at) }) : json({ error: "not found" }, 404);
  }
  if (b.op === "delete") { await db.from("juji_backup").delete().eq("key", key); return json({ ok: true }); }
  return json({ error: "op" }, 400);
});
