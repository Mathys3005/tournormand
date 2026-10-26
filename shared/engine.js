// Tour de Normandie — moteur de jeu pur (aucune dépendance UI)
export const START_CASH = 2000;
export const SALARY = 300;
export const JAIL_FINE = 100;
export const JAIL_TURNS = 3;
export const BOARD_SIZE = 32;
const r5 = (x) => Math.max(5, Math.round(x / 5) * 5);

export const GROUPS = [
  { name: "Vallée d'Eure", color: "#a88be0" },
  { name: "Vallée de Seine", color: "#58b7d0" },
  { name: "Pays d'Évreux", color: "#7cc35e" },
  { name: "Auge & Orne", color: "#e6bd3c" },
  { name: "Côte d'Albâtre", color: "#ee8a3a" },
  { name: "Manche & Bessin", color: "#e0564f" },
  { name: "Côte Fleurie", color: "#dc6fb0" },
  { name: "Grandes villes", color: "#4a78e6" },
].map((g) => ({ ...g, tiles: [] }));
const GROUP_BASE = [60, 90, 130, 170, 210, 250, 300, 360];
const RENT_MULT = [0.15, 0.5, 1.2, 2.2, 3.5, 5];
export const RESORT_PRICE = 200;
export const RESORT_RENT = [0, 75, 175, 350, 600];

export const TILES = [
  { t: "start", name: "Départ", short: "Départ" },
  { t: "city", g: 0, name: "Pacy-sur-Eure", short: "Pacy" },
  { t: "city", g: 0, name: "Giverny", short: "Giverny" },
  { t: "chance", name: "Chance", short: "Chance" },
  { t: "city", g: 1, name: "Vernon", short: "Vernon" },
  { t: "resort", name: "Étretat", short: "Étretat" },
  { t: "city", g: 1, name: "Les Andelys", short: "Andelys" },
  { t: "city", g: 1, name: "Louviers", short: "Louviers" },
  { t: "jail", name: "Île Tatihou", short: "Île" },
  { t: "city", g: 2, name: "Évreux", short: "Évreux" },
  { t: "city", g: 2, name: "Bernay", short: "Bernay" },
  { t: "chance", name: "Chance", short: "Chance" },
  { t: "city", g: 3, name: "Lisieux", short: "Lisieux" },
  { t: "resort", name: "Cabourg", short: "Cabourg" },
  { t: "city", g: 3, name: "Falaise", short: "Falaise" },
  { t: "city", g: 3, name: "Alençon", short: "Alençon" },
  { t: "champ", name: "Championnat", short: "Champ." },
  { t: "city", g: 4, name: "Fécamp", short: "Fécamp" },
  { t: "city", g: 4, name: "Dieppe", short: "Dieppe" },
  { t: "chance", name: "Chance", short: "Chance" },
  { t: "city", g: 5, name: "Saint-Lô", short: "Saint-Lô" },
  { t: "resort", name: "Mont-Saint-Michel", short: "St-Michel" },
  { t: "city", g: 5, name: "Bayeux", short: "Bayeux" },
  { t: "city", g: 5, name: "Cherbourg", short: "Cherbourg" },
  { t: "airport", name: "Aéroport de Deauville", short: "Aéroport" },
  { t: "city", g: 6, name: "Honfleur", short: "Honfleur" },
  { t: "city", g: 6, name: "Deauville", short: "Deauville" },
  { t: "tax", name: "Impôts", short: "Impôts" },
  { t: "resort", name: "Omaha Beach", short: "Omaha" },
  { t: "city", g: 7, name: "Le Havre", short: "Le Havre" },
  { t: "city", g: 7, name: "Caen", short: "Caen" },
  { t: "city", g: 7, name: "Rouen", short: "Rouen" },
];
TILES.forEach((t, i) => {
  t.i = i;
  if (t.t === "city") {
    const g = GROUPS[t.g];
    const k = g.tiles.length;
    g.tiles.push(i);
    t.price = GROUP_BASE[t.g] + 10 * k;
    t.house = r5(t.price * 0.5);
    t.hotel = r5(t.price * 1.5);
    t.mark = r5(t.price * 2);
    t.rents = RENT_MULT.map((m) => r5(t.price * m));
  }
  if (t.t === "resort") t.price = RESORT_PRICE;
});
export const RESORTS = TILES.filter((t) => t.t === "resort").map((t) => t.i);
export const SIDES = [0, 1, 2, 3].map((s) =>
  TILES.filter((t) => t.i > s * 8 && t.i < s * 8 + 8 && (t.t === "city" || t.t === "resort")).map((t) => t.i)
);
export const LEVEL_NAMES = ["Terrain", "1 maison", "2 maisons", "3 maisons", "Hôtel", "Monument"];
export const PLAYER_COLORS = ["#f4c542", "#ff7a6b", "#47d6b6", "#b9a4ff"];

export const CARDS = [
  { id: "start", title: "Train Paris–Rouen en avance", text: "Avance jusqu'au Départ et touche ton salaire." },
  { id: "jail", title: "Contrôle de gendarmerie", text: "Direction l'Île Tatihou." },
  { id: "airport", title: "Vol charter", text: "Rends-toi à l'Aéroport : au prochain tour, tu choisis ta destination." },
  { id: "champ", title: "Fête normande offerte", text: "Organise un championnat dans une de tes villes." },
  { id: "escape", title: "Bateau pour le continent", text: "Carte Évasion : garde-la pour quitter l'île gratuitement." },
  { id: "angel", title: "Ange gardien", text: "Ton prochain loyer est annulé." },
  { id: "storm", title: "Tempête sur la Manche", text: "Choisis une ville adverse : elle perd un niveau de construction." },
  { id: "back3", title: "Parapluie oublié", text: "Recule de 3 cases." },
  { id: "bonus", title: "Récolte de pommes record", text: "Reçois 150 k." },
  { id: "fine", title: "Excès de vitesse sur l'A13", text: "Paie 100 k." },
  { id: "birthday", title: "Joyeux anniversaire", text: "Chaque joueur t'offre 50 k." },
  { id: "cider", title: "Tournée de cidre", text: "Paie 30 k à chaque joueur." },
  { id: "resort", title: "Escapade à la mer", text: "Avance jusqu'à la prochaine station balnéaire." },
];
export const cardById = (id) => CARDS.find((c) => c.id === id);

// ---------- helpers ----------
export function invested(i, l) {
  const t = TILES[i];
  if (t.t === "resort") return t.price;
  if (t.t !== "city") return 0;
  return t.price + t.house * Math.min(l, 3) + (l >= 4 ? t.hotel : 0) + (l >= 5 ? t.mark : 0);
}
export const propValue = (s, i) => (s.props[i] ? invested(i, s.props[i].l) : 0);
export const buybackPrice = (s, i) => 2 * propValue(s, i);
export const ownsGroup = (s, pi, g) => GROUPS[g].tiles.every((i) => s.props[i] && s.props[i].o === pi);
export const resortCount = (s, pi) => RESORTS.filter((i) => s.props[i] && s.props[i].o === pi).length;
export function rentOf(s, i) {
  const p = s.props[i];
  if (!p) return 0;
  const t = TILES[i];
  if (t.t === "resort") return RESORT_RENT[resortCount(s, p.o)];
  let r = t.rents[p.l];
  if (ownsGroup(s, p.o, t.g)) r *= 2;
  if (s.champ && s.champ.tile === i) r *= s.champ.mult;
  return r;
}
export const ownedBy = (s, pi) =>
  Object.keys(s.props).map(Number).filter((i) => s.props[i].o === pi).sort((a, b) => a - b);
export function netWorth(s, pi) {
  return s.players[pi].cash + ownedBy(s, pi).reduce((a, i) => a + propValue(s, i), 0);
}
export function buildOptions(start) {
  if (start < 3) return [start + 1, start + 2, start + 3].filter((l) => l <= 3);
  if (start === 3) return [4];
  if (start === 4) return [5];
  return [];
}

function log(s, m, p) {
  s.log.unshift({ m, p: p == null ? -1 : p, k: s.seq });
  if (s.log.length > 50) s.log.length = 50;
}
const cur = (s) => s.players[s.turn];
const name = (s, pi) => s.players[pi].pseudo;

export function rollDice(mode) {
  const d = () => 1 + Math.floor(Math.random() * 6);
  let a = d(), b = d();
  const ranges = { low: [2, 6], mid: [6, 8], high: [8, 12] };
  const r = ranges[mode];
  if (r && Math.random() < 0.35) {
    for (let k = 0; k < 60; k++) {
      const s = a + b;
      if (s >= r[0] && s <= r[1]) break;
      a = d(); b = d();
    }
  }
  return [a, b];
}

export function newGame(players, opts = {}) {
  const order = players.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const s = {
    status: "playing",
    players: order.map((p, k) => ({
      id: p.id, pseudo: p.pseudo, color: PLAYER_COLORS[k % 4],
      cash: START_CASH, pos: 0, jail: 0, dbl: 0, bankrupt: false, escape: 0, angel: 0, airport: false,
    })),
    turn: 0, round: 1, maxRounds: opts.maxRounds || 0,
    phase: "roll", pending: null, extra: false,
    props: {}, champ: null,
    dice: [1, 1], rollSeq: 0, seq: 0, moves: [], card: null,
    log: [], winner: null, winReason: "", updatedAt: Date.now(),
  };
  log(s, `La partie commence. ${s.players[0].pseudo} ouvre le bal.`);
  return s;
}

// ---------- mouvements ----------
function moveTo(s, pi, to, kind, salary) {
  const p = s.players[pi];
  const from = p.pos;
  if (salary && kind !== "back" && to !== from && (to < from || to === 0)) {
    p.cash += SALARY;
    log(s, `${name(s, pi)} passe par le Départ : +${SALARY} k`, pi);
  }
  p.pos = to;
  s.moves.push({ p: pi, from, to, kind });
}
function sendJail(s, pi) {
  const p = s.players[pi];
  s.moves.push({ p: pi, from: p.pos, to: 8, kind: "jump" });
  p.pos = 8;
  p.jail = JAIL_TURNS;
  p.dbl = 0;
  s.extra = false;
  log(s, `${name(s, pi)} échoue sur l'Île Tatihou.`, pi);
}

// ---------- argent ----------
function pay(s, pi, to, amount, reason, split) {
  const p = s.players[pi];
  if (amount <= 0) return true;
  if (p.cash >= amount) {
    transfer(s, pi, to, amount, split);
    return true;
  }
  s.phase = "debt";
  s.pending = { amount, to: to == null ? null : to, reason, split: split || null };
  log(s, `${name(s, pi)} doit ${amount} k mais n'a que ${p.cash} k.`, pi);
  return false;
}
function transfer(s, pi, to, amount, split) {
  s.players[pi].cash -= amount;
  if (split) {
    const each = Math.floor(amount / split.length);
    split.forEach((j) => (s.players[j].cash += each));
  } else if (to != null) s.players[to].cash += amount;
}
function sellProp(s, pi, i) {
  const v = Math.floor(propValue(s, i) / 2);
  delete s.props[i];
  if (s.champ && s.champ.tile === i) s.champ = null;
  s.players[pi].cash += v;
  log(s, `${name(s, pi)} vend ${TILES[i].name} pour ${v} k.`, pi);
}
function forcePay(s, pi, to, amount) {
  const p = s.players[pi];
  if (p.bankrupt) return;
  while (p.cash < amount) {
    const own = ownedBy(s, pi).sort((a, b) => propValue(s, a) - propValue(s, b));
    if (!own.length) break;
    sellProp(s, pi, own[0]);
  }
  if (p.cash >= amount) transfer(s, pi, to, amount);
  else goBankrupt(s, pi, to);
}
function goBankrupt(s, pi, to) {
  const p = s.players[pi];
  if (to != null && typeof to === "number" && p.cash > 0) s.players[to].cash += p.cash;
  p.cash = 0;
  p.bankrupt = true;
  ownedBy(s, pi).forEach((i) => delete s.props[i]);
  if (s.champ && !s.props[s.champ.tile]) s.champ = null;
  log(s, `${name(s, pi)} fait faillite.`, pi);
}

// ---------- victoire ----------
function endGame(s, w, reason) {
  s.status = "ended";
  s.phase = "over";
  s.winner = w;
  s.winReason = reason;
  s.pending = null;
  log(s, `${name(s, w)} gagne : ${reason} !`, w);
}
export function winCheckFor(s, pi) {
  const groups = GROUPS.filter((g, gi) => ownsGroup(s, pi, gi)).length;
  if (groups >= 3) return "Triple monopole";
  if (SIDES.some((side) => side.every((i) => s.props[i] && s.props[i].o === pi))) return "Monopole de côte";
  if (RESORTS.every((i) => s.props[i] && s.props[i].o === pi)) return "Monopole balnéaire";
  return null;
}
function checkWin(s) {
  if (s.status !== "playing") return true;
  const alive = s.players.map((_, i) => i).filter((i) => !s.players[i].bankrupt);
  if (alive.length === 1) { endGame(s, alive[0], "dernier joueur en lice"); return true; }
  for (const i of alive) {
    const r = winCheckFor(s, i);
    if (r) { endGame(s, i, r); return true; }
  }
  return false;
}

// ---------- tours ----------
function nextTurn(s) {
  if (s.status !== "playing") return;
  s.extra = false;
  cur(s).dbl = 0;
  const n0 = s.turn;
  let n = n0;
  do { n = (n + 1) % s.players.length; } while (s.players[n].bankrupt && n !== n0);
  if (n <= n0) s.round++;
  s.turn = n;
  s.pending = null;
  if (s.maxRounds && s.round > s.maxRounds) {
    const alive = s.players.map((_, i) => i).filter((i) => !s.players[i].bankrupt);
    const best = alive.sort((a, b) => netWorth(s, b) - netWorth(s, a))[0];
    endGame(s, best, `plus grosse fortune après ${s.maxRounds} tours`);
    return;
  }
  s.phase = cur(s).airport ? "travel" : "roll";
}
function endAction(s) {
  if (s.status !== "playing") return;
  const p = cur(s);
  s.pending = null;
  if (p.bankrupt) return nextTurn(s);
  if (s.extra && p.jail === 0 && !p.airport) {
    s.phase = "roll";
    log(s, `Double ! ${p.pseudo} rejoue.`, s.turn);
    return;
  }
  nextTurn(s);
}

function land(s, pi) {
  const p = s.players[pi];
  const i = p.pos;
  const t = TILES[i];
  switch (t.t) {
    case "city":
    case "resort": {
      const prop = s.props[i];
      if (!prop) {
        if (p.cash >= t.price) { s.phase = "buy"; s.pending = { tile: i }; }
        else { log(s, `${p.pseudo} ne peut pas s'offrir ${t.name}.`, pi); endAction(s); }
        return;
      }
      if (prop.o === pi) {
        if (t.t === "city" && buildOptions(prop.l).length) { s.phase = "build"; s.pending = { tile: i, start: prop.l }; }
        else endAction(s);
        return;
      }
      const owner = prop.o;
      const rent = rentOf(s, i);
      if (p.angel > 0) {
        p.angel--;
        log(s, `L'ange gardien annule le loyer de ${rent} k à ${t.name}.`, pi);
      } else {
        log(s, `${p.pseudo} paie ${rent} k de loyer à ${name(s, owner)} (${t.name}).`, pi);
        if (!pay(s, pi, owner, rent, `Loyer à ${t.name}`)) return;
      }
      if (prop.l < 5 && p.cash >= buybackPrice(s, i)) { s.phase = "buyback"; s.pending = { tile: i }; }
      else endAction(s);
      return;
    }
    case "chance":
      return drawCard(s, pi);
    case "jail":
      sendJail(s, pi);
      return endAction(s);
    case "champ":
      if (ownedBy(s, pi).some((k) => TILES[k].t === "city")) { s.phase = "champ"; s.pending = {}; }
      else { log(s, `${p.pseudo} n'a aucune ville pour organiser le championnat.`, pi); endAction(s); }
      return;
    case "airport":
      p.airport = true;
      s.extra = false;
      log(s, `${p.pseudo} est à l'aéroport : prochain tour, vol vers la case de son choix.`, pi);
      return endAction(s);
    case "tax": {
      const amt = r5(netWorth(s, pi) * 0.1);
      log(s, `${p.pseudo} paie ${amt} k d'impôts.`, pi);
      if (pay(s, pi, null, amt, "Impôts")) endAction(s);
      return;
    }
    default:
      return endAction(s);
  }
}

function drawCard(s, pi) {
  const c = CARDS[Math.floor(Math.random() * CARDS.length)];
  const p = s.players[pi];
  s.card = { id: c.id, p: pi };
  log(s, `Chance — ${c.title}.`, pi);
  switch (c.id) {
    case "start": moveTo(s, pi, 0, "jump", true); return endAction(s);
    case "jail": sendJail(s, pi); return endAction(s);
    case "airport": moveTo(s, pi, 24, "jump", true); p.airport = true; s.extra = false; return endAction(s);
    case "champ":
      if (ownedBy(s, pi).some((k) => TILES[k].t === "city")) { s.phase = "champ"; s.pending = {}; return; }
      return endAction(s);
    case "escape": p.escape++; return endAction(s);
    case "angel": p.angel++; return endAction(s);
    case "storm":
      if (stormTargets(s, pi).length) { s.phase = "storm"; s.pending = {}; return; }
      log(s, "La tempête ne touche aucune ville.", pi);
      return endAction(s);
    case "back3": moveTo(s, pi, (p.pos + BOARD_SIZE - 3) % BOARD_SIZE, "back", false); return land(s, pi);
    case "bonus": p.cash += 150; return endAction(s);
    case "fine": if (pay(s, pi, null, 100, "Amende")) endAction(s); return;
    case "birthday":
      s.players.forEach((o, j) => { if (j !== pi && !o.bankrupt) forcePay(s, j, pi, 50); });
      if (checkWin(s)) return;
      return endAction(s);
    case "cider": {
      const others = s.players.map((_, j) => j).filter((j) => j !== pi && !s.players[j].bankrupt);
      if (pay(s, pi, null, 30 * others.length, "Tournée de cidre", others)) endAction(s);
      return;
    }
    case "resort": {
      let k = p.pos;
      do { k = (k + 1) % BOARD_SIZE; } while (TILES[k].t !== "resort");
      moveTo(s, pi, k, "jump", true);
      return land(s, pi);
    }
  }
  endAction(s);
}
export function stormTargets(s, pi) {
  return Object.keys(s.props).map(Number).filter((i) => s.props[i].o !== pi && TILES[i].t === "city" && s.props[i].l >= 1 && s.props[i].l <= 4);
}

// ---------- réducteur ----------
export function reduce(s0, a, actor) {
  if (!s0 || s0.status !== "playing") return s0;
  const s = JSON.parse(JSON.stringify(s0));
  s.moves = [];
  s.card = null;
  s.seq = (s.seq || 0) + 1;
  s.updatedAt = Date.now();
  const pi = s.turn;
  const p = cur(s);

  if (a.type === "resign") {
    const me = s.players[actor];
    if (!me || me.bankrupt) return s0;
    log(s, `${me.pseudo} abandonne.`, actor);
    goBankrupt(s, actor, null);
    if (checkWin(s)) return s;
    if (actor === s.turn) nextTurn(s);
    return s;
  }
  if (a.type === "skip") {
    if (actor === s.turn) return s0;
    log(s, `${p.pseudo} est absent : son tour est passé.`, pi);
    if (s.phase === "debt") { goBankrupt(s, pi, s.pending && s.pending.to); if (checkWin(s)) return s; }
    nextTurn(s);
    return s;
  }
  if (actor !== s.turn) return s0;

  switch (s.phase) {
    case "roll": {
      if (a.type === "jailPay") {
        if (p.jail <= 0 || p.cash < JAIL_FINE) return s0;
        p.cash -= JAIL_FINE; p.jail = 0;
        log(s, `${p.pseudo} paie ${JAIL_FINE} k et quitte l'île.`, pi);
        return s;
      }
      if (a.type === "jailCard") {
        if (p.jail <= 0 || p.escape <= 0) return s0;
        p.escape--; p.jail = 0;
        log(s, `${p.pseudo} utilise sa carte Évasion.`, pi);
        return s;
      }
      if (a.type !== "roll") return s0;
      const d = rollDice(p.jail > 0 ? "free" : a.mode);
      s.dice = d;
      s.rollSeq++;
      const sum = d[0] + d[1];
      const dbl = d[0] === d[1];
      if (p.jail > 0) {
        s.extra = false;
        if (dbl) {
          p.jail = 0;
          log(s, `${p.pseudo} fait un double (${d[0]}+${d[1]}) et s'échappe de l'île !`, pi);
        } else {
          p.jail--;
          if (p.jail > 0) {
            log(s, `${p.pseudo} fait ${d[0]}+${d[1]} : reste sur l'île (${p.jail} essai${p.jail > 1 ? "s" : ""}).`, pi);
            endAction(s);
            return s;
          }
          log(s, `${p.pseudo} quitte enfin l'île.`, pi);
        }
        moveTo(s, pi, (p.pos + sum) % BOARD_SIZE, "walk", true);
        land(s, pi);
        return s;
      }
      if (dbl) {
        p.dbl++;
        if (p.dbl >= 3) {
          log(s, `${p.pseudo} fait trois doubles d'affilée !`, pi);
          sendJail(s, pi);
          endAction(s);
          return s;
        }
        s.extra = true;
      } else { p.dbl = 0; s.extra = false; }
      log(s, `${p.pseudo} lance ${d[0]}+${d[1]} = ${sum}.`, pi);
      moveTo(s, pi, (p.pos + sum) % BOARD_SIZE, "walk", true);
      land(s, pi);
      return s;
    }
    case "travel": {
      if (a.type === "stay") {
        p.airport = false; s.phase = "roll";
        return s;
      }
      if (a.type !== "travel") return s0;
      const to = a.to | 0;
      if (to < 0 || to >= BOARD_SIZE || to === 24) return s0;
      p.airport = false;
      log(s, `${p.pseudo} s'envole pour ${TILES[to].name}.`, pi);
      moveTo(s, pi, to, "jump", true);
      land(s, pi);
      return s;
    }
    case "buy": {
      const i = s.pending.tile;
      const t = TILES[i];
      if (a.type === "pass") { endAction(s); return s; }
      if (a.type !== "buy") return s0;
      const level = t.t === "resort" ? 0 : Math.max(0, Math.min(3, a.level | 0));
      const cost = invested(i, level);
      if (p.cash < cost || s.props[i]) return s0;
      p.cash -= cost;
      s.props[i] = { o: pi, l: level };
      log(s, `${p.pseudo} achète ${t.name}${level ? ` avec ${LEVEL_NAMES[level]}` : ""} pour ${cost} k.`, pi);
      if (checkWin(s)) return s;
      endAction(s);
      return s;
    }
    case "build": {
      const i = s.pending.tile;
      const prop = s.props[i];
      if (a.type === "pass" || !prop) { endAction(s); return s; }
      if (a.type !== "build") return s0;
      const level = a.level | 0;
      if (!buildOptions(s.pending.start).includes(level) || level <= prop.l) return s0;
      const cost = invested(i, level) - invested(i, prop.l);
      if (p.cash < cost) return s0;
      p.cash -= cost;
      prop.l = level;
      log(s, `${p.pseudo} construit à ${TILES[i].name} : ${LEVEL_NAMES[level]} (${cost} k).`, pi);
      endAction(s);
      return s;
    }
    case "buyback": {
      const i = s.pending.tile;
      const prop = s.props[i];
      if (a.type === "pass") { endAction(s); return s; }
      if (a.type !== "buyback" || !prop || prop.l >= 5) return s0;
      const price = buybackPrice(s, i);
      if (p.cash < price) return s0;
      const prev = prop.o;
      p.cash -= price;
      s.players[prev].cash += price;
      prop.o = pi;
      log(s, `${p.pseudo} rachète ${TILES[i].name} à ${name(s, prev)} pour ${price} k !`, pi);
      if (checkWin(s)) return s;
      if (TILES[i].t === "city" && buildOptions(prop.l).length) { s.phase = "build"; s.pending = { tile: i, start: prop.l }; }
      else endAction(s);
      return s;
    }
    case "champ": {
      if (a.type === "pass") { endAction(s); return s; }
      if (a.type !== "champ") return s0;
      const i = a.tile | 0;
      if (!s.props[i] || s.props[i].o !== pi || TILES[i].t !== "city") return s0;
      if (s.champ && s.champ.tile === i) s.champ.mult = Math.min(8, s.champ.mult * 2);
      else s.champ = { tile: i, mult: 2 };
      log(s, `Championnat à ${TILES[i].name} : loyer ×${s.champ.mult} !`, pi);
      endAction(s);
      return s;
    }
    case "storm": {
      if (a.type === "pass") { endAction(s); return s; }
      if (a.type !== "storm") return s0;
      const i = a.tile | 0;
      if (!stormTargets(s, pi).includes(i)) return s0;
      s.props[i].l--;
      log(s, `La tempête frappe ${TILES[i].name} (${name(s, s.props[i].o)}) : ${LEVEL_NAMES[s.props[i].l]}.`, pi);
      endAction(s);
      return s;
    }
    case "debt": {
      const d = s.pending;
      if (a.type === "bankrupt") {
        goBankrupt(s, pi, d.to);
        if (checkWin(s)) return s;
        nextTurn(s);
        return s;
      }
      if (a.type !== "sell") return s0;
      const i = a.tile | 0;
      if (!s.props[i] || s.props[i].o !== pi) return s0;
      sellProp(s, pi, i);
      if (p.cash >= d.amount) {
        transfer(s, pi, d.to, d.amount, d.split);
        log(s, `${p.pseudo} règle sa dette de ${d.amount} k.`, pi);
        endAction(s);
      }
      return s;
    }
  }
  return s0;
}
