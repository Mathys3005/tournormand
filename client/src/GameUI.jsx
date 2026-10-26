import React, { useState, useEffect, useRef, useCallback } from "react";
import * as E from "../../shared/engine.js";
const { TILES, GROUPS } = E;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (n) => `${Math.round(n).toLocaleString("fr-FR")} k`;
const keyOf = (p) =>
  p.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const reducedMotion = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } })();

// ---------------- icônes ----------------
const Ico = {
  start: () => (<svg viewBox="0 0 24 24"><path d="M20 12H6m5-6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  jail: () => (<svg viewBox="0 0 24 24"><path d="M3 19c3-2 6-2 9 0s6 2 9 0" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 17V8m0 0c-2-3-5-3-7-2m7 2c2-3 5-3 7-2m-7 2c-1-3 0-5 2-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  champ: () => (<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4m10-4h3a3 3 0 0 1-3 4M12 13v4m-4 3h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  airport: () => (<svg viewBox="0 0 24 24"><path d="M10.5 3.5c0-1 1.5-1 1.5 0V9l8 4.5v2L12 13v4.5l2.5 2v1.5L11 20l-3.5 1v-1.5l2.5-2V13l-8 2.5v-2L10.5 9z" fill="currentColor"/></svg>),
  chance: () => (<svg viewBox="0 0 24 24"><path d="M8.5 8.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3v.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/></svg>),
  tax: () => (<svg viewBox="0 0 24 24"><path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10.5h9M4 13.5h9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>),
  resort: () => (<svg viewBox="0 0 24 24"><path d="M2 15c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1M2 19.5c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><circle cx="16" cy="7" r="3" fill="currentColor"/></svg>),
};

// ---------------- dés ----------------
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function Die({ v, rolling }) {
  return (
    <div className={"die" + (rolling ? " rolling" : "")}>
      {Array.from({ length: 9 }, (_, k) => <span key={k} className={PIPS[v] && PIPS[v].includes(k) ? "pip on" : "pip"} />)}
    </div>
  );
}

// ---------------- plateau ----------------
function coord(i) {
  if (i <= 8) return { r: 8, c: 8 - i };
  if (i <= 16) return { r: 8 - (i - 8), c: 0 };
  if (i <= 24) return { r: 0, c: i - 16 };
  return { r: i - 24, c: 8 };
}
const LevelPips = ({ l }) => {
  if (l >= 5) return <span className="lv mark">★</span>;
  if (l === 4) return <span className="lv hotel">H</span>;
  return <span className="lv">{"▮".repeat(l)}</span>;
};

function Tile({ s, i, onTap, selectable, dim, highlight }) {
  const t = TILES[i];
  const { r, c } = coord(i);
  const prop = s.props[i];
  const owner = prop ? s.players[prop.o] : null;
  const corner = i % 8 === 0;
  const champ = s.champ && s.champ.tile === i;
  let cls = "tile t-" + t.t + (corner ? " corner" : "") + (selectable ? " sel" : "") + (dim ? " dim" : "") + (highlight ? " hl" : "");
  const style = { gridRow: r + 1, gridColumn: c + 1 };
  if (owner) style["--own"] = owner.color;
  const I = Ico[t.t];
  return (
    <button className={cls} style={style} onClick={() => onTap(i)} aria-label={t.name}>
      {t.t === "city" ? <span className="strip" style={{ background: GROUPS[t.g].color }} /> : null}
      {I ? <span className="ico"><I /></span> : null}
      <span className="nm">{t.short}</span>
      {(t.t === "city" || t.t === "resort") && !owner ? <span className="pr">{t.price}</span> : null}
      {owner ? (
        <span className="own">
          {t.t === "city" ? <LevelPips l={prop.l} /> : <span className="lv">◆</span>}
        </span>
      ) : null}
      {champ ? <span className="champ">×{s.champ.mult}</span> : null}
    </button>
  );
}

function Tokens({ s, disp }) {
  const groups = {};
  s.players.forEach((p, k) => {
    if (p.bankrupt) return;
    const pos = disp[k] == null ? p.pos : disp[k];
    (groups[pos] = groups[pos] || []).push(k);
  });
  const OFF = [[-0.22, 0.05], [0.22, 0.05], [-0.22, 0.3], [0.22, 0.3]];
  return s.players.map((p, k) => {
    if (p.bankrupt) return null;
    const pos = disp[k] == null ? p.pos : disp[k];
    const { r, c } = coord(pos);
    const g = groups[pos];
    const idx = g.indexOf(k);
    const off = g.length > 1 ? OFF[idx % 4] : [0, 0.2];
    return (
      <span key={k} className={"token" + (k === s.turn ? " active" : "")}
        style={{ left: `${((c + 0.5 + off[0]) / 9) * 100}%`, top: `${((r + 0.5 + off[1]) / 9) * 100}%`, background: p.color }}>
        {p.pseudo.slice(0, 1).toUpperCase()}
      </span>
    );
  });
}

// ---------------- animations ----------------
function useAnimation(s) {
  const [disp, setDisp] = useState(() => s.players.map((p) => p.pos));
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [card, setCard] = useState(null);
  const dispRef = useRef(disp);
  const seqRef = useRef(s.seq);
  const rollRef = useRef(s.rollSeq);
  dispRef.current = disp;
  useEffect(() => {
    if (s.seq === seqRef.current) return;
    const prev = seqRef.current;
    seqRef.current = s.seq;
    const newRoll = s.rollSeq !== rollRef.current;
    rollRef.current = s.rollSeq;
    if (s.seq !== prev + 1 || reducedMotion) {
      setDisp(s.players.map((p) => p.pos));
      setBusy(false); setRolling(false);
      if (s.card && s.seq === prev + 1) setCard({ ...s.card, k: s.seq });
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true);
      if (newRoll) { setRolling(true); await sleep(650); if (cancelled) return; setRolling(false); await sleep(120); }
      let d = dispRef.current.slice();
      for (const m of s.moves || []) {
        if (cancelled) return;
        if (m.kind === "walk") {
          let x = d[m.p] == null ? m.from : d[m.p];
          let guard = 0;
          while (x !== m.to && guard++ < 40) {
            x = (x + 1) % E.BOARD_SIZE;
            d = d.slice(); d[m.p] = x; setDisp(d);
            await sleep(150);
            if (cancelled) return;
          }
        } else if (m.kind === "back") {
          let x = d[m.p];
          let guard = 0;
          while (x !== m.to && guard++ < 40) {
            x = (x + E.BOARD_SIZE - 1) % E.BOARD_SIZE;
            d = d.slice(); d[m.p] = x; setDisp(d);
            await sleep(170);
            if (cancelled) return;
          }
        } else {
          await sleep(180);
          d = d.slice(); d[m.p] = m.to; setDisp(d);
          await sleep(380);
        }
      }
      if (cancelled) return;
      setDisp(s.players.map((p) => p.pos));
      if (s.card) setCard({ ...s.card, k: s.seq });
      setBusy(false);
    })();
    return () => { cancelled = true; setBusy(false); setRolling(false); };
  }, [s.seq]);
  return { disp, busy, rolling, card, closeCard: () => setCard(null) };
}

// ---------------- feuilles d'action ----------------
function Sheet({ title, kicker, children, onClose }) {
  return (
    <div className="sheet-wrap" onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="grab" />
        {kicker ? <div className="kicker">{kicker}</div> : null}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function TileFacts({ s, i }) {
  const t = TILES[i];
  const prop = s.props[i];
  if (t.t === "city") {
    return (
      <div className="facts">
        <div className="factrow"><span>Groupe</span><b style={{ color: GROUPS[t.g].color }}>{GROUPS[t.g].name}</b></div>
        <table className="rents">
          <thead><tr><th>Niveau</th><th>Coût</th><th>Loyer</th></tr></thead>
          <tbody>
            {E.LEVEL_NAMES.map((n, l) => (
              <tr key={l} className={prop && prop.l === l ? "cur" : ""}>
                <td>{n}</td>
                <td>{fmt(l === 0 ? t.price : l <= 3 ? t.house : l === 4 ? t.hotel : t.mark)}</td>
                <td>{fmt(t.rents[l])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">Loyer doublé si tout le groupe appartient au même joueur. Un monument rend la ville impossible à racheter.</p>
        {prop ? (
          <div className="factrow"><span>Propriétaire</span><b style={{ color: s.players[prop.o].color }}>{s.players[prop.o].pseudo}</b></div>
        ) : null}
        {prop ? <div className="factrow"><span>Loyer actuel</span><b>{fmt(E.rentOf(s, i))}</b></div> : null}
        {prop && prop.l < 5 ? <div className="factrow"><span>Prix de rachat</span><b>{fmt(E.buybackPrice(s, i))}</b></div> : null}
      </div>
    );
  }
  if (t.t === "resort") {
    return (
      <div className="facts">
        <div className="factrow"><span>Prix</span><b>{fmt(t.price)}</b></div>
        {[1, 2, 3].map((n) => <div key={n} className="factrow"><span>{n} station{n > 1 ? "s" : ""} possédée{n > 1 ? "s" : ""}</span><b>{fmt(E.RESORT_RENT[n])}</b></div>)}
        <p className="note">Posséder les 4 stations balnéaires fait gagner la partie.</p>
        {prop ? <div className="factrow"><span>Propriétaire</span><b style={{ color: s.players[prop.o].color }}>{s.players[prop.o].pseudo}</b></div> : null}
        {prop ? <div className="factrow"><span>Prix de rachat</span><b>{fmt(E.buybackPrice(s, i))}</b></div> : null}
      </div>
    );
  }
  const txt = {
    start: `Touche ${E.SALARY} k à chaque passage.`,
    jail: `Tu restes bloqué jusqu'à ${E.JAIL_TURNS} tours. Sors avec un double, en payant ${E.JAIL_FINE} k ou avec une carte Évasion.`,
    champ: "Organise un championnat dans une de tes villes : son loyer double (et redouble si tu y reviens, jusqu'à ×8).",
    airport: "Au prochain tour, tu t'envoles vers la case de ton choix.",
    chance: "Tire une carte au hasard.",
    tax: "Paie 10 % de ta fortune (argent + propriétés).",
  }[t.t];
  return <p className="note big">{txt}</p>;
}

function ActionSheet({ s, dispatch }) {
  const p = s.players[s.turn];
  const pend = s.pending || {};
  const i = pend.tile;
  const t = i != null ? TILES[i] : null;
  switch (s.phase) {
    case "buy": {
      const levels = t.t === "resort" ? [0] : [0, 1, 2, 3];
      return (
        <Sheet kicker={t.t === "resort" ? "Station balnéaire" : GROUPS[t.g].name} title={`Acheter ${t.name} ?`}>
          <p className="cashline">Ton argent : <b>{fmt(p.cash)}</b></p>
          <div className="choices">
            {levels.map((l) => {
              const cost = E.invested(i, l);
              return (
                <button key={l} className="choice" disabled={cost > p.cash} onClick={() => dispatch({ type: "buy", level: l })}>
                  <span>{t.t === "resort" ? "Station" : l === 0 ? "Terrain seul" : `Terrain + ${E.LEVEL_NAMES[l]}`}</span>
                  <b>{fmt(cost)}</b>
                  {t.t === "city" ? <small>loyer {fmt(t.rents[l])}</small> : <small>loyer {fmt(E.RESORT_RENT[E.resortCount(s, s.turn) + 1])}</small>}
                </button>
              );
            })}
          </div>
          <button className="ghost" onClick={() => dispatch({ type: "pass" })}>Ne rien acheter</button>
        </Sheet>
      );
    }
    case "build": {
      const prop = s.props[i];
      const opts = E.buildOptions(pend.start);
      return (
        <Sheet kicker={`${t.name} · ${E.LEVEL_NAMES[prop.l]}`} title="Construire ?">
          <p className="cashline">Ton argent : <b>{fmt(p.cash)}</b></p>
          <div className="choices">
            {opts.map((l) => {
              const cost = E.invested(i, l) - E.invested(i, prop.l);
              return (
                <button key={l} className="choice" disabled={cost > p.cash} onClick={() => dispatch({ type: "build", level: l })}>
                  <span>{E.LEVEL_NAMES[l]}</span><b>{fmt(cost)}</b><small>loyer {fmt(t.rents[l])}</small>
                </button>
              );
            })}
          </div>
          {pend.start < 3 ? <p className="note">L'hôtel se construit lors d'une visite suivante, une fois les 3 maisons posées. Le monument vient après l'hôtel.</p> : null}
          <button className="ghost" onClick={() => dispatch({ type: "pass" })}>Ne rien construire</button>
        </Sheet>
      );
    }
    case "buyback": {
      const prop = s.props[i];
      const price = E.buybackPrice(s, i);
      return (
        <Sheet kicker={`${t.name} · ${t.t === "city" ? E.LEVEL_NAMES[prop.l] : "Station"}`} title={`Racheter à ${s.players[prop.o].pseudo} ?`}>
          <p className="note">Le rachat coûte le double de la valeur investie. Il va directement dans la poche de {s.players[prop.o].pseudo}.</p>
          <p className="cashline">Ton argent : <b>{fmt(p.cash)}</b></p>
          <div className="choices">
            <button className="choice primary" onClick={() => dispatch({ type: "buyback" })}><span>Racheter la {t.t === "city" ? "ville" : "station"}</span><b>{fmt(price)}</b></button>
          </div>
          <button className="ghost" onClick={() => dispatch({ type: "pass" })}>Non merci</button>
        </Sheet>
      );
    }
    case "champ": {
      const mine = E.ownedBy(s, s.turn).filter((k) => TILES[k].t === "city");
      return (
        <Sheet kicker="Championnat" title="Où organiser la fête ?">
          <p className="note">La ville choisie voit son loyer doubler. Choisir à nouveau la même ville double encore (×8 maximum).</p>
          <div className="choices">
            {mine.map((k) => (
              <button key={k} className="choice" onClick={() => dispatch({ type: "champ", tile: k })}>
                <span><i className="sw" style={{ background: GROUPS[TILES[k].g].color }} />{TILES[k].name}</span>
                <b>{fmt(E.rentOf(s, k))}</b><small>→ {fmt(s.champ && s.champ.tile === k && s.champ.mult >= 8 ? E.rentOf(s, k) : E.rentOf(s, k) * 2)}</small>
              </button>
            ))}
          </div>
          <button className="ghost" onClick={() => dispatch({ type: "pass" })}>Passer</button>
        </Sheet>
      );
    }
    case "storm": {
      const targets = E.stormTargets(s, s.turn);
      return (
        <Sheet kicker="Tempête sur la Manche" title="Quelle ville frapper ?">
          <div className="choices">
            {targets.map((k) => (
              <button key={k} className="choice" onClick={() => dispatch({ type: "storm", tile: k })}>
                <span><i className="sw" style={{ background: s.players[s.props[k].o].color }} />{TILES[k].name}</span>
                <b>{E.LEVEL_NAMES[s.props[k].l]}</b><small>{s.players[s.props[k].o].pseudo}</small>
              </button>
            ))}
          </div>
          <button className="ghost" onClick={() => dispatch({ type: "pass" })}>Épargner tout le monde</button>
        </Sheet>
      );
    }
    case "debt": {
      const mine = E.ownedBy(s, s.turn);
      return (
        <Sheet kicker={pend.reason} title={`Il te manque ${fmt(pend.amount - p.cash)}`}>
          <p className="cashline">À payer : <b>{fmt(pend.amount)}</b> · En caisse : <b>{fmt(p.cash)}</b></p>
          <p className="note">Vends des propriétés à la banque (moitié de leur valeur) jusqu'à pouvoir payer.</p>
          <div className="choices">
            {mine.map((k) => (
              <button key={k} className="choice" onClick={() => dispatch({ type: "sell", tile: k })}>
                <span><i className="sw" style={{ background: TILES[k].t === "city" ? GROUPS[TILES[k].g].color : "#3cc6c6" }} />{TILES[k].name}</span>
                <b>+{fmt(Math.floor(E.propValue(s, k) / 2))}</b>
              </button>
            ))}
          </div>
          <button className="danger" onClick={() => dispatch({ type: "bankrupt" })}>Déclarer faillite</button>
        </Sheet>
      );
    }
  }
  return null;
}

function phaseText(s) {
  const p = s.players[s.turn];
  const t = s.pending && s.pending.tile != null ? TILES[s.pending.tile].name : "";
  return {
    roll: p.jail > 0 ? `${p.pseudo} tente de quitter l'île` : `${p.pseudo} va lancer les dés`,
    travel: `${p.pseudo} choisit sa destination`,
    buy: `${p.pseudo} hésite à acheter ${t}`,
    build: `${p.pseudo} construit à ${t}`,
    buyback: `${p.pseudo} pense à racheter ${t}`,
    champ: `${p.pseudo} choisit sa ville de championnat`,
    storm: `${p.pseudo} déchaîne la tempête`,
    debt: `${p.pseudo} cherche de l'argent`,
  }[s.phase] || "";
}

// ---------------- écran de jeu ----------------
export function GameScreen({ s, me, local, dispatch, onExit, title }) {
  const { disp, busy, rolling, card, closeCard } = useAnimation(s);
  const [tileInfo, setTileInfo] = useState(null);
  const [travelTo, setTravelTo] = useState(null);
  const [menu, setMenu] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [mode, setMode] = useState("free");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(id); }, []);
  useEffect(() => { if (!card) return; const id = setTimeout(closeCard, 3200); return () => clearTimeout(id); }, [card && card.k]);

  const cur = s.players[s.turn];
  const myTurn = s.status === "playing" && (local || me === s.turn);
  const canAct = myTurn && !busy;
  const travelMode = canAct && s.phase === "travel";
  const onTap = (i) => {
    if (travelMode) { if (i !== 24) setTravelTo(i); return; }
    setTileInfo(i);
  };
  const afk = !local && me != null && me !== s.turn && s.status === "playing" && !s.players[me].bankrupt && now - (s.updatedAt || now) > 120000;
  const dice = s.dice;

  const ranking = s.players.map((p, k) => ({ p, k, w: E.netWorth(s, k) }));

  return (
    <div className="game">
      <header className="gbar">
        <button className="iconbtn" onClick={onExit} aria-label="Retour">‹</button>
        <div className="gtitle">
          <b>{title}</b>
          <small>Tour {s.round}{s.maxRounds ? ` / ${s.maxRounds}` : ""}{local ? " · sur ce téléphone" : ""}</small>
        </div>
        <button className="iconbtn" onClick={() => setMenu(true)} aria-label="Menu">⋯</button>
      </header>

      <div className="players">
        {s.players.map((p, k) => (
          <div key={k} className={"pchip" + (k === s.turn && s.status === "playing" ? " turn" : "") + (p.bankrupt ? " out" : "")} style={{ "--pc": p.color }}>
            <span className="dot">{p.pseudo.slice(0, 1).toUpperCase()}</span>
            <span className="pn">{p.pseudo}{!local && k === me ? " (toi)" : ""}</span>
            <span className="pc">{p.bankrupt ? "faillite" : fmt(p.cash)}</span>
          </div>
        ))}
      </div>

      <div className="board-wrap">
        <div className={"board" + (travelMode ? " travel" : "")}>
          {TILES.map((t, i) => (
            <Tile key={i} s={s} i={i} onTap={onTap} selectable={travelMode && i !== 24}
              highlight={canAct && s.pending && s.pending.tile === i} />
          ))}
          <div className="center">
            <div className="brand">Tour de<br /><span>Normandie</span></div>
            <div className="whose" style={{ "--pc": cur.color }}>
              {s.status === "ended" ? <span>Partie terminée</span> : <><i className="dot" />{myTurn && !local ? "À toi de jouer" : `Au tour de ${cur.pseudo}`}</>}
            </div>
            <div className="dice"><Die v={dice[0]} rolling={rolling} /><Die v={dice[1]} rolling={rolling} /></div>
            {s.status === "playing" ? (
              canAct && s.phase === "roll" ? (
                cur.jail > 0 ? (
                  <div className="jailbtns">
                    <button className="roll" onClick={() => dispatch({ type: "roll" })}>Tenter un double</button>
                    <div className="row2">
                      <button className="mini" disabled={cur.cash < E.JAIL_FINE} onClick={() => dispatch({ type: "jailPay" })}>Payer {E.JAIL_FINE} k</button>
                      <button className="mini" disabled={!cur.escape} onClick={() => dispatch({ type: "jailCard" })}>Évasion ({cur.escape})</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button className="roll" onClick={() => dispatch({ type: "roll", mode })}>Lancer les dés</button>
                    <div className="dctl" role="radiogroup" aria-label="Contrôle des dés">
                      {[["free", "Libre"], ["low", "2–6"], ["mid", "6–8"], ["high", "8–12"]].map(([k, l]) => (
                        <button key={k} role="radio" aria-checked={mode === k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>
                      ))}
                    </div>
                  </>
                )
              ) : travelMode ? (
                <div className="travelhint">
                  <p>Touche une case pour t'y envoler</p>
                  <button className="mini" onClick={() => dispatch({ type: "stay" })}>Rester et lancer</button>
                </div>
              ) : (
                <p className="status">{busy ? "…" : phaseText(s)}</p>
              )
            ) : (
              <p className="status">{s.players[s.winner].pseudo} gagne</p>
            )}
            <p className="lastlog">{s.log[0] ? s.log[0].m : ""}</p>
          </div>
          <div className="tokens"><Tokens s={s} disp={disp} /></div>
        </div>
      </div>

      {afk ? (
        <div className="afk">
          <span>{cur.pseudo} ne joue plus depuis 2 minutes.</span>
          <button className="mini" onClick={() => dispatch({ type: "skip" })}>Passer son tour</button>
        </div>
      ) : null}

      <section className="panel">
        <h3>Fortunes</h3>
        <div className="fortunes">
          {ranking.map(({ p, k, w }) => {
            const own = E.ownedBy(s, k);
            return (
              <div key={k} className={"fortune" + (p.bankrupt ? " out" : "")} style={{ "--pc": p.color }}>
                <div className="fhead">
                  <span className="dot">{p.pseudo.slice(0, 1).toUpperCase()}</span>
                  <b>{p.pseudo}</b>
                  <span className="fw">{fmt(w)}</span>
                </div>
                <div className="fcards">
                  {p.escape ? <span className="tag">Évasion ×{p.escape}</span> : null}
                  {p.angel ? <span className="tag">Ange ×{p.angel}</span> : null}
                  {p.jail ? <span className="tag warn">Sur l'île</span> : null}
                  {p.airport ? <span className="tag">À l'aéroport</span> : null}
                </div>
                <div className="props">
                  {own.length ? own.map((i) => (
                    <button key={i} className="ptag" onClick={() => setTileInfo(i)}
                      style={{ "--gc": TILES[i].t === "city" ? GROUPS[TILES[i].g].color : "#3cc6c6" }}>
                      {TILES[i].short}{TILES[i].t === "city" && s.props[i].l ? ` ${s.props[i].l >= 5 ? "★" : s.props[i].l === 4 ? "H" : s.props[i].l}` : ""}
                    </button>
                  )) : <span className="none">Aucune propriété</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Journal</h3>
        <ol className="log">
          {s.log.slice(0, 14).map((l, k) => (
            <li key={k} style={{ "--pc": l.p >= 0 && s.players[l.p] ? s.players[l.p].color : "var(--muted)" }}>{l.m}</li>
          ))}
        </ol>
      </section>

      {canAct && ["buy", "build", "buyback", "champ", "storm", "debt"].includes(s.phase) && !card ? <ActionSheet s={s} dispatch={dispatch} /> : null}

      {travelTo != null && travelMode ? (
        <Sheet kicker="Aéroport de Deauville" title={`S'envoler vers ${TILES[travelTo].name} ?`} onClose={() => setTravelTo(null)}>
          <TileFacts s={s} i={travelTo} />
          <div className="choices">
            <button className="choice primary" onClick={() => { const to = travelTo; setTravelTo(null); dispatch({ type: "travel", to }); }}><span>Décoller</span></button>
          </div>
          <button className="ghost" onClick={() => setTravelTo(null)}>Choisir une autre case</button>
        </Sheet>
      ) : null}

      {tileInfo != null ? (
        <Sheet kicker={TILES[tileInfo].t === "city" ? GROUPS[TILES[tileInfo].g].name : "Case spéciale"} title={TILES[tileInfo].name} onClose={() => setTileInfo(null)}>
          <TileFacts s={s} i={tileInfo} />
          <button className="ghost" onClick={() => setTileInfo(null)}>Fermer</button>
        </Sheet>
      ) : null}

      {card ? (
        <div className="cardshow" onClick={closeCard}>
          <div className="ccard">
            <div className="cico"><Ico.chance /></div>
            <small>Chance · {s.players[card.p] ? s.players[card.p].pseudo : ""}</small>
            <h2>{E.cardById(card.id).title}</h2>
            <p>{E.cardById(card.id).text}</p>
            <span className="tapclose">Toucher pour continuer</span>
          </div>
        </div>
      ) : null}

      {s.status === "ended" && !busy ? (
        <div className="winner">
          <div className="wcard" style={{ "--pc": s.players[s.winner].color }}>
            <small>Victoire</small>
            <h2>{s.players[s.winner].pseudo}</h2>
            <p>{s.winReason.charAt(0).toUpperCase() + s.winReason.slice(1)}</p>
            <ol>
              {ranking.slice().sort((a, b) => b.w - a.w).map(({ p, w }, k) => <li key={k}><span>{p.pseudo}</span><b>{p.bankrupt ? "faillite" : fmt(w)}</b></li>)}
            </ol>
            <button className="roll" onClick={onExit}>Retour à l'accueil</button>
          </div>
        </div>
      ) : null}

      {menu ? (
        <Sheet title="Menu de la partie" onClose={() => { setMenu(false); setConfirmResign(false); }}>
          <div className="choices">
            <button className="choice" onClick={() => { setMenu(false); onExit(); }}><span>Revenir à l'accueil</span><small>la partie continue</small></button>
            {s.status === "playing" && (local || (me != null && !s.players[me].bankrupt)) ? (
              confirmResign ? (
                <button className="choice dangerc" onClick={() => { setMenu(false); setConfirmResign(false); dispatch({ type: "resign" }); }}>
                  <span>Confirmer l'abandon{local ? ` de ${cur.pseudo}` : ""}</span><small>tes propriétés retournent à la banque</small>
                </button>
              ) : (
                <button className="choice" onClick={() => setConfirmResign(true)}><span>Abandonner{local ? ` (${cur.pseudo})` : ""}</span></button>
              )
            ) : null}
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}

// ---------------- partie locale ----------------
export function LocalGame({ onExit }) {
  const [s, setS] = useState(() => store.get("tdn-local"));
  const latest = useRef(s);
  const dispatch = (a) => {
    const cur = latest.current;
    const ns = E.reduce(cur, a, a.type === "resign" ? cur.turn : cur.turn);
    if (ns === cur) return;
    latest.current = ns;
    setS(ns);
    store.set("tdn-local", ns);
  };
  if (!s) return <LocalSetup onStart={(ns) => { latest.current = ns; setS(ns); store.set("tdn-local", ns); }} onExit={onExit} />;
  return <GameScreen s={s} me={null} local dispatch={dispatch} onExit={onExit} title="Partie locale" />;
}
function LocalSetup({ onStart, onExit }) {
  const [names, setNames] = useState(["Joueur 1", "Joueur 2", "Joueur 3"]);
  const [rounds, setRounds] = useState(0);
  return (
    <div className="home">
      <header className="gbar">
        <button className="iconbtn" onClick={onExit} aria-label="Retour">‹</button>
        <div className="gtitle"><b>Partie locale</b><small>On se passe le téléphone</small></div><span />
      </header>
      <section className="panel">
        <h3>Joueurs</h3>
        <div className="stack">
          {names.map((n, k) => (
            <div key={k} className="inrow">
              <span className="dot" style={{ background: E.PLAYER_COLORS[k] }} />
              <input id={"lp" + k} value={n} maxLength={16} onChange={(e) => setNames(names.map((x, j) => (j === k ? e.target.value : x)))} aria-label={`Nom du joueur ${k + 1}`} />
              {names.length > 2 ? <button className="iconbtn" aria-label="Retirer" onClick={() => setNames(names.filter((_, j) => j !== k))}>×</button> : null}
            </div>
          ))}
          {names.length < 4 ? <button className="ghost" onClick={() => setNames([...names, `Joueur ${names.length + 1}`])}>Ajouter un joueur</button> : null}
          <RoundsPick value={rounds} onChange={setRounds} />
          <button className="roll" onClick={() => onStart(E.newGame(names.map((n, k) => ({ id: "local" + k, pseudo: n.trim() || `Joueur ${k + 1}` })), { maxRounds: rounds }))}>Commencer</button>
        </div>
      </section>
    </div>
  );
}
export function RoundsPick({ value, onChange }) {
  return (
    <div className="seg" role="radiogroup" aria-label="Durée">
      {[[0, "Sans limite"], [20, "20 tours"], [30, "30 tours"]].map(([v, l]) => (
        <button key={v} role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

export function Rules() {
  return (
    <details className="panel rules">
      <summary>Règles du jeu</summary>
      <ul>
        <li>Chacun commence avec {fmt(E.START_CASH)} et touche {fmt(E.SALARY)} à chaque passage au Départ.</li>
        <li>Lance les dés et avance. Un double fait rejouer ; trois doubles d'affilée envoient sur l'Île Tatihou.</li>
        <li>Achète les villes libres : terrain seul ou avec 1 à 3 maisons. En repassant sur ta ville, tu construis : maisons, puis hôtel, puis monument.</li>
        <li>Chez un adversaire, tu paies le loyer. Ensuite tu peux <b>racheter</b> sa ville au double de sa valeur, sauf si elle porte un monument.</li>
        <li>Posséder tout un groupe de couleur double les loyers. Le Championnat double encore le loyer d'une de tes villes.</li>
        <li>L'Aéroport te laisse choisir ta destination au tour suivant. Contrôle des dés : vise une plage de résultats, avec une chance sur trois que ça marche.</li>
        <li><b>Victoire immédiate</b> : trois groupes de couleur, toutes les propriétés d'un côté du plateau, ou les quatre stations balnéaires. Sinon, le dernier joueur non ruiné gagne (ou le plus riche si une limite de tours est fixée).</li>
      </ul>
    </details>
  );
}


export { store, fmt, Sheet };
