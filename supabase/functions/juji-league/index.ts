// Juji weekly league + friends. Players are anonymous: the app keeps a random secret,
// only its SHA-256 is stored, plus a nickname the user picked. No e-mail, no account.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const GROUP = 30, MAX_TIER = 9, XP_CAP = 20000;
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const COURSES = new Set(["kmr", "ckb", "zza", "eng"]);

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-juji-app", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Weeks run Monday 00:00 to Monday 00:00 Türkiye time (UTC+3). */
function weekOf(ms: number) {
  const d = new Date(ms + 3 * 3600_000);
  const back = (d.getUTCDay() + 6) % 7;
  const mon = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back);
  return { id: new Date(mon).toISOString().slice(0, 10), ends: mon + 7 * 86400_000 - 3 * 3600_000 };
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}
function cleanNick(n: unknown) {
  if (typeof n !== "string") return null;
  const s = n.normalize("NFC").replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim();
  return s.length >= 2 && s.length <= 16 ? s : null;
}
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => CODE_ABC[x % CODE_ABC.length]).join("");

type Player = { key: string; code: string; nick: string; tier: number; streak: number; course: string; seen_week: string | null; last_result: number };

/** Closes the player's last league week: top of the group moves up a tier, the bottom moves down. */
async function rollover(p: Player, week: string) {
  const prevId = weekOf(Date.parse(week + "T12:00:00Z") - 7 * 86400_000).id;
  let tier = p.tier, result = 0;
  const { data: mine } = await db.from("juji_week").select("grp,xp").eq("key", p.key).eq("week", prevId).maybeSingle();
  if (mine) {
    const { data: rows } = await db.from("juji_week").select("key,xp").eq("week", prevId).eq("grp", mine.grp).order("xp", { ascending: false });
    const n = rows?.length ?? 0, rank = (rows ?? []).findIndex((r) => r.key === p.key) + 1;
    const up = Math.min(7, Math.ceil(n / 3)), down = n >= 10 ? 5 : 0;
    if (mine.xp > 0 && rank >= 1 && rank <= up && tier < MAX_TIER) { tier++; result = 1; }
    else if (tier > 0 && (mine.xp === 0 || (down && rank > n - down))) { tier--; result = -1; }
  } else if (p.seen_week && tier > 0) { tier--; result = -1; } // missed a whole week
  await db.from("juji_players").update({ tier, last_result: result, seen_week: week }).eq("key", p.key);
  return { ...p, tier, last_result: result, seen_week: week };
}

async function groupFor(tier: number, week: string) {
  const { data } = await db.from("juji_week").select("grp").eq("week", week).eq("tier", tier);
  const count = new Map<number, number>();
  for (const r of data ?? []) count.set(r.grp, (count.get(r.grp) ?? 0) + 1);
  for (let k = 0; ; k++) { const g = tier * 100000 + k; if ((count.get(g) ?? 0) < GROUP) return g; }
}

async function state(p: Player) {
  const w = weekOf(Date.now());
  const { data: me } = await db.from("juji_week").select("grp,xp").eq("key", p.key).eq("week", w.id).maybeSingle();
  let group: { nick: string; xp: number; streak: number; me: boolean }[] = [];
  if (me) {
    const { data: rows } = await db.from("juji_week").select("key,xp,juji_players(nick,streak)").eq("week", w.id).eq("grp", me.grp).order("xp", { ascending: false }).limit(GROUP);
    // deno-lint-ignore no-explicit-any
    group = (rows ?? []).map((r: any) => ({ nick: r.juji_players?.nick ?? "?", xp: r.xp, streak: r.juji_players?.streak ?? 0, me: r.key === p.key }));
  }
  const { data: fr } = await db.from("juji_friends").select("b").eq("a", p.key);
  const keys = (fr ?? []).map((f) => f.b);
  let friends: { code: string; nick: string; xp: number; streak: number; course: string }[] = [];
  if (keys.length) {
    const [{ data: ps }, { data: ws }] = await Promise.all([
      db.from("juji_players").select("key,code,nick,streak,course").in("key", keys),
      db.from("juji_week").select("key,xp").eq("week", w.id).in("key", keys),
    ]);
    const xp = new Map((ws ?? []).map((r) => [r.key, r.xp]));
    friends = (ps ?? []).map((r) => ({ code: r.code, nick: r.nick, streak: r.streak, course: r.course, xp: xp.get(r.key) ?? 0 })).sort((a, b) => b.xp - a.xp);
  }
  return { nick: p.nick, code: p.code, tier: p.tier, result: p.last_result, week: w.id, ends: w.ends, group, friends };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (req.headers.get("x-juji-app") !== "juji-app-1") return json({ error: "forbidden" }, 403);
  // deno-lint-ignore no-explicit-any
  let b: any; try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  if (typeof b?.secret !== "string" || b.secret.length < 24 || b.secret.length > 128) return json({ error: "bad secret" }, 400);
  const key = await sha(b.secret);
  const { data: found } = await db.from("juji_players").select("*").eq("key", key).maybeSingle();
  let p = found as Player | null;

  if (b.op === "join") {
    const nick = cleanNick(b.nick); if (!nick) return json({ error: "nick" }, 400);
    if (p) { await db.from("juji_players").update({ nick, updated_at: new Date().toISOString() }).eq("key", key); p.nick = nick; }
    else {
      for (let i = 0; i < 5 && !p; i++) {
        const { data, error } = await db.from("juji_players").insert({ key, code: code(), nick, seen_week: weekOf(Date.now()).id }).select("*").single();
        if (!error) p = data as Player;
      }
      if (!p) return json({ error: "join failed" }, 500);
    }
  }
  if (!p) return json({ error: "not joined" }, 404);

  if (b.op === "leave") { await db.from("juji_players").delete().eq("key", key); return json({ ok: true }); }

  if (b.op === "join" || b.op === "sync") {
    const w = weekOf(Date.now());
    if (p.seen_week !== w.id) p = await rollover(p, w.id);
    const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (Number.isFinite(b.streak)) upd.streak = Math.max(0, Math.min(5000, Math.floor(b.streak)));
    if (COURSES.has(b.course)) upd.course = b.course;
    await db.from("juji_players").update(upd).eq("key", key);
    p = { ...p, ...upd } as Player;
    const xp = Math.max(0, Math.min(XP_CAP, Math.floor(Number(b.xp) || 0)));
    const { data: row } = await db.from("juji_week").select("xp").eq("key", key).eq("week", w.id).maybeSingle();
    if (!row) {
      if (xp > 0 || b.op === "join") await db.from("juji_week").insert({ key, week: w.id, tier: p.tier, grp: await groupFor(p.tier, w.id), xp });
    } else if (xp > row.xp) await db.from("juji_week").update({ xp, updated_at: new Date().toISOString() }).eq("key", key).eq("week", w.id);
    return json(await state(p));
  }

  if (b.op === "friend" || b.op === "unfriend") {
    const c = typeof b.code === "string" ? b.code.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
    const { data: o } = await db.from("juji_players").select("key").eq("code", c).maybeSingle();
    if (!o) return json({ error: "no such code" }, 404);
    if (o.key === key) return json({ error: "self" }, 400);
    if (b.op === "friend") await db.from("juji_friends").upsert([{ a: key, b: o.key }, { a: o.key, b: key }]);
    else await db.from("juji_friends").delete().or(`and(a.eq.${key},b.eq.${o.key}),and(a.eq.${o.key},b.eq.${key})`);
    return json(await state(p));
  }
  return json({ error: "op" }, 400);
});
