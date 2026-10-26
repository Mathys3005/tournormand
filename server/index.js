import express from "express";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import * as E from "../shared/engine.js";
import { pool, migrate } from "./db.js";

const PORT = process.env.PORT || 3000;
const ADMINS = (process.env.ADMIN_PSEUDOS || "mathys27").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const AFK_MS = 120000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");

// ---------- PIN ----------
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${h}`;
}
function checkPin(pin, stored) {
  const [salt, h] = String(stored).split(":");
  if (!salt || !h) return false;
  const got = crypto.scryptSync(pin, salt, 32);
  const want = Buffer.from(h, "hex");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}
const norm = (p) => String(p || "").trim().toLowerCase();
const isAdmin = (p) => ADMINS.includes(p);

async function userFromToken(token) {
  if (!token) return null;
  const r = await pool.query("SELECT pseudo FROM sessions WHERE token = $1", [String(token)]);
  return r.rows[0] ? r.rows[0].pseudo : null;
}

// ---------- état des parties (mémoire + Postgres) ----------
const games = new Map();
const saveChains = new Map();
function persist(id) {
  const prev = saveChains.get(id) || Promise.resolve();
  const next = prev.then(async () => {
    const g = games.get(id);
    if (!g) {
      await pool.query("DELETE FROM games WHERE id = $1", [id]);
      return;
    }
    await pool.query(
      `INSERT INTO games (id, status, state, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, state = EXCLUDED.state, updated_at = now()`,
      [id, g.status, JSON.stringify(g)]
    );
  }).catch((e) => console.error("Sauvegarde impossible", id, e.message));
  saveChains.set(id, next);
  return next;
}
async function loadGames() {
  const r = await pool.query(
    "SELECT id, state FROM games WHERE updated_at > now() - interval '60 days' ORDER BY created_at DESC LIMIT 200"
  );
  for (const row of r.rows) games.set(row.id, { ...row.state, id: row.id });
}
function tablesSummary() {
  const all = [...games.values()].sort((a, b) => b.createdAt - a.createdAt);
  const live = all.filter((g) => g.status !== "ended");
  const done = all.filter((g) => g.status === "ended").slice(0, 5);
  return [...live, ...done].map((g) => ({
    id: g.id,
    status: g.status,
    hostPseudo: g.hostPseudo,
    maxRounds: g.maxRounds || 0,
    round: g.round || 0,
    createdAt: g.createdAt,
    players: g.status === "lobby"
      ? Object.entries(g.seats || {}).filter(([, v]) => v).sort((a, b) => a[1].at - b[1].at).map(([k]) => k)
      : g.players.map((p) => p.id),
    winner: g.status === "ended" && g.players[g.winner] ? g.players[g.winner].pseudo : null,
  }));
}

// ---------- HTTP ----------
const app = express();
app.use(express.json({ limit: "32kb" }));

const attempts = new Map();
function tooMany(key) {
  const now = Date.now();
  const a = (attempts.get(key) || []).filter((t) => now - t < 10 * 60000);
  a.push(now);
  attempts.set(key, a);
  return a.length > 12;
}

app.get("/api/whitelist", async (_req, res) => {
  const r = await pool.query("SELECT pseudo, pin_hash IS NOT NULL AS has_pin FROM whitelist ORDER BY pseudo");
  res.json(r.rows.map((x) => ({ pseudo: x.pseudo, hasPin: x.has_pin })));
});

app.post("/api/login", async (req, res) => {
  const pseudo = norm(req.body && req.body.pseudo);
  const pin = String((req.body && req.body.pin) || "");
  if (tooMany(req.ip + "|" + pseudo)) return res.status(429).json({ error: "Trop d'essais. Réessaie dans 10 minutes." });
  if (!/^\d{4,8}$/.test(pin)) return res.status(400).json({ error: "Le code doit faire 4 à 8 chiffres." });
  const r = await pool.query("SELECT pin_hash FROM whitelist WHERE pseudo = $1", [pseudo]);
  if (!r.rows[0]) return res.status(403).json({ error: "Ce pseudo n'est pas dans la liste." });
  if (!r.rows[0].pin_hash) {
    await pool.query("UPDATE whitelist SET pin_hash = $2 WHERE pseudo = $1 AND pin_hash IS NULL", [pseudo, hashPin(pin)]);
  } else if (!checkPin(pin, r.rows[0].pin_hash)) {
    return res.status(403).json({ error: "Code incorrect." });
  }
  const token = crypto.randomBytes(24).toString("hex");
  await pool.query("INSERT INTO sessions (token, pseudo) VALUES ($1, $2)", [token, pseudo]);
  res.json({ token, pseudo, admin: isAdmin(pseudo) });
});

app.get("/api/me", async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  const pseudo = await userFromToken(token);
  if (!pseudo) return res.status(401).json({ error: "Session expirée." });
  res.json({ pseudo, admin: isAdmin(pseudo) });
});

app.post("/api/logout", async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
  res.json({ ok: true });
});

app.get("/healthz", (_req, res) => res.send("ok"));
app.use(express.static(DIST, { index: false, maxAge: "1h" }));
app.get("*", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

// ---------- WebSocket ----------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const clients = new Set();

const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };
function broadcastTables() {
  const msg = { t: "tables", tables: tablesSummary() };
  for (const c of clients) send(c.ws, msg);
}
function broadcastGame(id) {
  const g = games.get(id);
  for (const c of clients) if (c.sub === id) send(c.ws, { t: "game", id, game: g || null });
}
async function sendWhitelist(c) {
  if (!isAdmin(c.pseudo)) return;
  const r = await pool.query("SELECT pseudo, pin_hash IS NOT NULL AS has_pin FROM whitelist ORDER BY pseudo");
  send(c.ws, { t: "whitelist", list: r.rows.map((x) => ({ pseudo: x.pseudo, hasPin: x.has_pin })) });
}
function changed(id) {
  persist(id);
  broadcastGame(id);
  broadcastTables();
}

const handlers = {
  sub(c, m) {
    c.sub = m.id || null;
    if (c.sub) send(c.ws, { t: "game", id: c.sub, game: games.get(c.sub) || null });
  },
  create(c, m) {
    const id = crypto.randomBytes(5).toString("hex");
    const maxRounds = [0, 20, 30].includes(m.maxRounds) ? m.maxRounds : 0;
    games.set(id, { id, status: "lobby", createdAt: Date.now(), hostPseudo: c.pseudo, maxRounds, seats: { [c.pseudo]: { at: Date.now() } } });
    send(c.ws, { t: "created", id });
    changed(id);
  },
  join(c, m) {
    const g = games.get(m.id);
    if (!g || g.status !== "lobby") return "Cette table n'accepte plus de joueurs.";
    const seated = Object.values(g.seats).filter(Boolean).length;
    if (!g.seats[c.pseudo] && seated >= 4) return "La table est complète.";
    g.seats[c.pseudo] = g.seats[c.pseudo] || { at: Date.now() };
    changed(m.id);
  },
  leave(c, m) {
    const g = games.get(m.id);
    if (!g || g.status !== "lobby" || g.hostPseudo === c.pseudo) return;
    delete g.seats[c.pseudo];
    changed(m.id);
  },
  start(c, m) {
    const g = games.get(m.id);
    if (!g || g.status !== "lobby") return;
    if (g.hostPseudo !== c.pseudo) return "Seul l'hôte peut lancer la partie.";
    const seats = Object.entries(g.seats).filter(([, v]) => v).sort((a, b) => a[1].at - b[1].at);
    if (seats.length < 2) return "Il faut au moins 2 joueurs.";
    const s = E.newGame(seats.map(([k]) => ({ id: k, pseudo: k })), { maxRounds: g.maxRounds });
    games.set(m.id, { ...s, id: g.id, createdAt: g.createdAt, hostPseudo: g.hostPseudo, seats: g.seats });
    changed(m.id);
  },
  delete(c, m) {
    const g = games.get(m.id);
    if (!g) return;
    if (g.hostPseudo !== c.pseudo && !isAdmin(c.pseudo)) return "Seul l'hôte peut supprimer la table.";
    games.delete(m.id);
    changed(m.id);
  },
  act(c, m) {
    const g = games.get(m.id);
    if (!g || g.status !== "playing") return;
    const actor = g.players.findIndex((p) => p.id === c.pseudo);
    if (actor < 0) return "Tu ne joues pas à cette table.";
    const a = m.action || {};
    if (a.type === "skip" && Date.now() - (g.updatedAt || 0) < AFK_MS) return "Le joueur a encore le temps de jouer.";
    const ns = E.reduce(g, a, actor);
    if (ns === g) return;
    games.set(m.id, ns);
    changed(m.id);
  },
  async "wl-add"(c, m) {
    if (!isAdmin(c.pseudo)) return;
    const p = norm(m.pseudo).replace(/[^a-z0-9_.-]/g, "").slice(0, 24);
    if (!p) return "Pseudo invalide (lettres, chiffres, . _ -).";
    await pool.query("INSERT INTO whitelist (pseudo) VALUES ($1) ON CONFLICT DO NOTHING", [p]);
    await sendWhitelist(c);
  },
  async "wl-del"(c, m) {
    if (!isAdmin(c.pseudo)) return;
    const p = norm(m.pseudo);
    if (p === c.pseudo) return "Tu ne peux pas te retirer toi-même.";
    await pool.query("DELETE FROM whitelist WHERE pseudo = $1", [p]);
    await sendWhitelist(c);
  },
  async "wl-reset"(c, m) {
    if (!isAdmin(c.pseudo)) return;
    const p = norm(m.pseudo);
    await pool.query("UPDATE whitelist SET pin_hash = NULL WHERE pseudo = $1", [p]);
    await pool.query("DELETE FROM sessions WHERE pseudo = $1", [p]);
    await sendWhitelist(c);
  },
};

wss.on("connection", async (ws, req) => {
  const token = new URL(req.url, "http://x").searchParams.get("token");
  const pseudo = await userFromToken(token).catch(() => null);
  if (!pseudo) { send(ws, { t: "auth", ok: false }); ws.close(4001, "auth"); return; }
  const c = { ws, pseudo, sub: null, alive: true };
  clients.add(c);
  send(ws, { t: "hello", me: { pseudo, admin: isAdmin(pseudo) } });
  send(ws, { t: "tables", tables: tablesSummary() });
  sendWhitelist(c);
  ws.on("pong", () => (c.alive = true));
  ws.on("message", async (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const h = handlers[m && m.t];
    if (!h) return;
    try {
      const err = await h(c, m);
      if (err) send(ws, { t: "error", msg: err });
    } catch (e) {
      console.error(e);
      send(ws, { t: "error", msg: "Erreur du serveur, réessaie." });
    }
  });
  ws.on("close", () => clients.delete(c));
});
setInterval(() => {
  for (const c of clients) {
    if (!c.alive) { c.ws.terminate(); clients.delete(c); continue; }
    c.alive = false;
    try { c.ws.ping(); } catch {}
  }
}, 30000);

// Maintien en éveil : Render endort le service gratuit après 15 min sans visite.
// On se ping soi-même toutes les 10 minutes via l'URL publique.
const SELF_URL = process.env.KEEPALIVE_URL || process.env.RENDER_EXTERNAL_URL;
if (SELF_URL && process.env.KEEPALIVE !== "off") {
  setInterval(() => {
    fetch(SELF_URL.replace(/\/$/, "") + "/healthz").catch(() => {});
  }, 10 * 60000);
}

await migrate();
await loadGames();
server.listen(PORT, () => console.log(`Tour de Normandie sur http://localhost:${PORT}`));
