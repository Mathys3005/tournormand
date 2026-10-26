import React, { useState, useEffect, useRef } from "react";
import * as E from "../../shared/engine.js";
import { GameScreen, LocalGame, RoundsPick, Rules, store } from "./GameUI.jsx";
import { connect, api } from "./net.js";

const TOKEN_KEY = "tdn-token";

// ---------------- connexion ----------------
function Login({ onLogged }) {
  const [list, setList] = useState(null);
  const [pick, setPick] = useState(null);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api("/api/whitelist").then(setList).catch(() => setErr("Le serveur ne répond pas. Il se réveille peut-être : réessaie dans 30 secondes."));
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!pick.hasPin && pin !== pin2) return setErr("Les deux codes ne sont pas identiques.");
    setBusy(true); setErr("");
    try {
      const r = await api("/api/login", { body: { pseudo: pick.pseudo, pin } });
      store.set(TOKEN_KEY, r.token);
      onLogged(r.token);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <div className="home">
      <Hero />
      <section className="panel">
        <h3>Qui joue ?</h3>
        {!list && !err ? <p className="note">Chargement des joueurs…</p> : null}
        {list ? (
          <div className="pseudos">
            {list.map((w) => (
              <button key={w.pseudo} className={"pseudo" + (pick && pick.pseudo === w.pseudo ? " on" : "")}
                onClick={() => { setPick(w); setPin(""); setPin2(""); setErr(""); }}>{w.pseudo}</button>
            ))}
          </div>
        ) : null}
        {pick ? (
          <form className="stack" onSubmit={submit}>
            <p className="note">{pick.hasPin ? `Entre ton code secret, ${pick.pseudo}.` : `Première connexion : choisis un code secret de 4 à 8 chiffres. Il protégera le pseudo ${pick.pseudo}.`}</p>
            <input id="pin" className="pin" type="password" inputMode="numeric" autoComplete={pick.hasPin ? "current-password" : "new-password"}
              pattern="[0-9]*" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="Code" aria-label="Code secret" autoFocus />
            {!pick.hasPin ? (
              <input id="pin2" className="pin" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]*" maxLength={8}
                value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} placeholder="Confirme le code" aria-label="Confirme le code" />
            ) : null}
            <button className="roll" type="submit" disabled={busy || pin.length < 4}>{pick.hasPin ? "Entrer" : "Créer mon code et entrer"}</button>
          </form>
        ) : null}
        {err ? <p className="err">{err}</p> : null}
      </section>
      <LocalCard />
      <Rules />
    </div>
  );
}

function Hero() {
  return (
    <div className="hero">
      <div className="mini-board" aria-hidden="true">{E.GROUPS.map((g, k) => <i key={k} style={{ background: g.color }} />)}</div>
      <h1>Tour de<br /><span>Normandie</span></h1>
      <p>Achète Giverny, construis à Deauville, rachète Rouen sous le nez de tes amis.</p>
    </div>
  );
}

function LocalCard() {
  const has = !!store.get("tdn-local");
  const go = () => { location.hash = "local"; };
  return (
    <section className="panel">
      <h3>Sur un seul téléphone</h3>
      <p className="note">Jusqu'à 4 joueurs qui se passent l'appareil, sans connexion.</p>
      <div className="stack">
        <button className={has ? "roll" : "ghost"} onClick={go}>{has ? "Reprendre la partie locale" : "Nouvelle partie locale"}</button>
        {has ? <button className="ghost" onClick={() => { store.del("tdn-local"); go(); }}>Recommencer à zéro</button> : null}
      </div>
    </section>
  );
}

// ---------------- accueil connecté ----------------
function Home({ me, tables, net, onLogout, whitelist, status, err }) {
  const [rounds, setRounds] = useState(0);
  const live = tables.filter((g) => g.status !== "ended");
  const done = tables.filter((g) => g.status === "ended");
  return (
    <div className="home">
      <Hero />
      <section className="panel">
        <h3>Ton pseudo</h3>
        <div className="inrow">
          <p className="iam" style={{ flex: 1 }}>Tu joues en tant que <b>{me.pseudo}</b></p>
          <button className="mini" onClick={onLogout}>Changer</button>
        </div>
        {status !== "online" ? <p className="note">Connexion au serveur…</p> : null}
      </section>

      <section className="panel">
        <h3>Tables</h3>
        {live.length === 0 ? <p className="note">Aucune table ouverte. Crée la première, tes amis la verront ici.</p> : null}
        <ul className="tables">
          {live.map((g) => {
            const inIt = g.players.includes(me.pseudo);
            return (
              <li key={g.id}>
                <div>
                  <b>Table de {g.hostPseudo}</b>
                  <small>{g.status === "lobby" ? `Salle d'attente · ${g.players.length}/4` : `En cours · tour ${g.round}`} — {g.players.join(", ")}</small>
                </div>
                <button className="mini" onClick={() => (location.hash = "t-" + g.id)}>
                  {g.status === "lobby" ? (inIt ? "Ouvrir" : "Rejoindre") : inIt ? "Jouer" : "Regarder"}
                </button>
              </li>
            );
          })}
          {done.map((g) => (
            <li key={g.id} className="done">
              <div><b>Table de {g.hostPseudo}</b><small>Terminée · {g.winner ? `${g.winner} a gagné` : ""}</small></div>
              <button className="mini" onClick={() => (location.hash = "t-" + g.id)}>Voir</button>
            </li>
          ))}
        </ul>
        <div className="stack">
          <RoundsPick value={rounds} onChange={setRounds} />
          <button className="roll" onClick={() => net.send({ t: "create", maxRounds: rounds })}>Créer une table</button>
        </div>
        {err ? <p className="err">{err}</p> : null}
      </section>

      <LocalCard />
      <Rules />
      {me.admin ? <Admin net={net} list={whitelist} me={me} /> : null}
    </div>
  );
}

function Admin({ net, list, me }) {
  const [v, setV] = useState("");
  const [confirm, setConfirm] = useState(null);
  return (
    <section className="panel admin">
      <h3>Pseudos autorisés</h3>
      <p className="note">Visible seulement par toi. « Code oublié » efface le code d'un joueur : il en choisira un nouveau à sa prochaine connexion.</p>
      <form className="inrow" onSubmit={(e) => { e.preventDefault(); if (v.trim()) net.send({ t: "wl-add", pseudo: v }); setV(""); }}>
        <input id="wl-add" value={v} onChange={(e) => setV(e.target.value)} placeholder="Nouveau pseudo" maxLength={24} aria-label="Nouveau pseudo" />
        <button className="mini" type="submit">Ajouter</button>
      </form>
      <ul className="wl">
        {(list || []).map((w) => (
          <li key={w.pseudo}>
            <span>{w.pseudo}</span>
            <small>{w.hasPin ? "code défini" : "jamais connecté"}</small>
            {w.hasPin ? <button className="mini" onClick={() => net.send({ t: "wl-reset", pseudo: w.pseudo })}>Code oublié</button> : null}
            {w.pseudo !== me.pseudo ? (
              confirm === w.pseudo
                ? <button className="mini" onClick={() => { net.send({ t: "wl-del", pseudo: w.pseudo }); setConfirm(null); }}>Confirmer</button>
                : <button className="mini" onClick={() => setConfirm(w.pseudo)}>Retirer</button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------- salle d'attente ----------------
function Lobby({ g, me, net, onExit, err }) {
  const seats = Object.entries(g.seats || {}).filter(([, v]) => v).sort((a, b) => a[1].at - b[1].at);
  const seated = seats.some(([k]) => k === me.pseudo);
  const isHost = g.hostPseudo === me.pseudo;
  return (
    <div className="home">
      <header className="gbar">
        <button className="iconbtn" onClick={onExit} aria-label="Retour">‹</button>
        <div className="gtitle"><b>Table de {g.hostPseudo}</b><small>Salle d'attente · {g.maxRounds ? `${g.maxRounds} tours` : "sans limite de tours"}</small></div>
        <span />
      </header>
      <section className="panel">
        <h3>Joueurs ({seats.length}/4)</h3>
        <ul className="seats">
          {seats.map(([k], n) => (
            <li key={k} style={{ "--pc": E.PLAYER_COLORS[n] }}><span className="dot">{k.slice(0, 1).toUpperCase()}</span>{k}{k === g.hostPseudo ? <small>hôte</small> : null}</li>
          ))}
          {Array.from({ length: Math.max(0, 2 - seats.length) }, (_, n) => <li key={"e" + n} className="empty">Place libre</li>)}
        </ul>
        {err ? <p className="err">{err}</p> : null}
        <div className="stack">
          {!seated && seats.length < 4 ? <button className="roll" onClick={() => net.send({ t: "join", id: g.id })}>Rejoindre la table</button> : null}
          {seated && !isHost ? <button className="ghost" onClick={() => net.send({ t: "leave", id: g.id })}>Quitter la table</button> : null}
          {isHost ? (
            <button className="roll" disabled={seats.length < 2} onClick={() => net.send({ t: "start", id: g.id })}>
              {seats.length < 2 ? "En attente d'un 2e joueur…" : `Lancer la partie à ${seats.length}`}
            </button>
          ) : seated ? <p className="note">En attente du lancement par {g.hostPseudo}…</p> : null}
          {isHost || me.admin ? <button className="ghost" onClick={() => { net.send({ t: "delete", id: g.id }); onExit(); }}>Supprimer la table</button> : null}
        </div>
      </section>
    </div>
  );
}

// ---------------- table en ligne ----------------
function OnlineTable({ id, game, me, net, onExit, err }) {
  useEffect(() => {
    net.send({ t: "sub", id });
    return () => net.send({ t: "sub", id: null });
  }, [id]);
  if (game === undefined) return <div className="loading">Chargement de la partie…</div>;
  if (game === null) return <div className="home"><p className="note big">Cette table n'existe plus.</p><button className="roll" onClick={onExit}>Retour</button></div>;
  if (game.status === "lobby") return <Lobby g={game} me={me} net={net} onExit={onExit} err={err} />;
  const meIdx = game.players.findIndex((p) => p.id === me.pseudo);
  const dispatch = (action) => net.send({ t: "act", id, action });
  return (
    <>
      {err ? <div className="err toast" role="alert">{err}</div> : null}
      <GameScreen s={game} me={meIdx >= 0 ? meIdx : null} local={false} dispatch={dispatch} onExit={onExit} title={`Table de ${game.hostPseudo}`} />
    </>
  );
}

// ---------------- racine ----------------
function useHash() {
  const [h, setH] = useState(() => location.hash.slice(1));
  useEffect(() => {
    const f = () => { setH(location.hash.slice(1)); window.scrollTo(0, 0); };
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return h;
}

export default function App() {
  const [token, setToken] = useState(() => store.get(TOKEN_KEY));
  const [me, setMe] = useState(null);
  const [tables, setTables] = useState([]);
  const [games, setGames] = useState({});
  const [whitelist, setWhitelist] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [err, setErr] = useState("");
  const netRef = useRef(null);
  const hash = useHash();
  const home = () => { location.hash = ""; };

  useEffect(() => {
    if (!token) return;
    const net = connect(token, {
      onStatus: setStatus,
      onAuthFail: () => { store.del(TOKEN_KEY); setToken(null); setMe(null); },
      onMessage: (m) => {
        if (m.t === "hello") setMe(m.me);
        else if (m.t === "tables") setTables(m.tables);
        else if (m.t === "game") setGames((g) => ({ ...g, [m.id]: m.game }));
        else if (m.t === "whitelist") setWhitelist(m.list);
        else if (m.t === "created") location.hash = "t-" + m.id;
        else if (m.t === "error") { setErr(m.msg); setTimeout(() => setErr(""), 4000); }
      },
    });
    netRef.current = net;
    return () => net.close();
  }, [token]);

  const logout = async () => {
    try { await api("/api/logout", { token, body: {} }); } catch {}
    store.del(TOKEN_KEY); setToken(null); setMe(null);
  };

  if (hash === "local") return <LocalGame onExit={home} />;
  if (!token) return <Login onLogged={setToken} />;
  if (!me) return <div className="loading"><div className="brand big">Tour de<br /><span>Normandie</span></div><p>{status === "offline" ? "Le serveur se réveille…" : "Connexion…"}</p></div>;
  if (hash.startsWith("t-")) {
    const id = hash.slice(2);
    return <OnlineTable key={id} id={id} game={games[id]} me={me} net={netRef.current} onExit={home} err={err} />;
  }
  return <Home me={me} tables={tables} net={netRef.current} onLogout={logout} whitelist={whitelist} status={status} err={err} />;
}
