// Sprites pixel art, dés 3D, pions et effets visuels
import React from "react";

// ---------- couleurs ----------
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
const WALL = "#f3efe4", WALL_D = "#d4ccb8", TIMBER = "#6b4429", DOOR = "#3a2617", GLASS = "#8fd3ec", INK = "#13202a";

// rects : [x, y, w, h, couleur]
function Px({ w, h, rects, className, style }) {
  return (
    <svg className={"px " + (className || "")} viewBox={`0 0 ${w} ${h}`} style={style} shapeRendering="crispEdges" aria-hidden="true">
      {rects.map(([x, y, rw, rh, f], k) => <rect key={k} x={x} y={y} width={rw} height={rh} fill={f} />)}
    </svg>
  );
}

// Maison normande à colombages (8 × 10)
function house(ox, roof) {
  const rd = shade(roof, -0.18);
  return [
    [ox + 3, 0, 2, 1, INK],
    [ox + 2, 1, 2, 1, roof], [ox + 4, 1, 2, 1, rd],
    [ox + 1, 2, 3, 1, roof], [ox + 4, 2, 3, 1, rd],
    [ox + 0, 3, 4, 1, roof], [ox + 4, 3, 4, 1, rd],
    [ox + 0, 4, 8, 1, shade(roof, -0.35)],
    [ox + 1, 5, 6, 5, WALL], [ox + 6, 5, 1, 5, WALL_D],
    [ox + 1, 5, 1, 5, TIMBER], [ox + 6, 5, 1, 5, TIMBER], [ox + 1, 7, 6, 1, TIMBER],
    [ox + 3, 5, 1, 1, TIMBER], [ox + 4, 6, 1, 1, TIMBER],
    [ox + 2, 5, 1, 2, GLASS],
    [ox + 3, 8, 2, 2, DOOR],
  ];
}
export function Houses({ n, color, className }) {
  const rects = [];
  for (let k = 0; k < n; k++) rects.push(...house(k * 9, color));
  return <Px w={n * 9 - 1} h={10} rects={rects} className={className} />;
}
// Hôtel (12 × 15)
export function Hotel({ color, className }) {
  const d = shade(color, -0.2);
  const r = [
    [5, 0, 1, 3, INK], [6, 0, 3, 2, color],
    [2, 3, 8, 1, color], [1, 4, 10, 1, d], [0, 5, 12, 1, shade(color, -0.35)],
    [1, 6, 10, 9, WALL], [10, 6, 1, 9, WALL_D],
    [1, 6, 1, 9, TIMBER], [10, 6, 1, 9, TIMBER], [1, 10, 10, 1, TIMBER],
  ];
  [[3, 7], [6, 7], [8, 7], [3, 11], [8, 11]].forEach(([x, y]) => r.push([x, y, 1, 2, GLASS]));
  r.push([5, 12, 2, 3, DOOR], [4, 11, 4, 1, color]);
  return <Px w={12} h={15} rects={r} className={className} />;
}
// Monument : phare de la côte normande (9 × 20)
export function Monument({ color, className }) {
  const r = [
    [3, 0, 3, 1, INK], [2, 1, 5, 1, INK],
    [3, 2, 3, 2, "#ffd84a"], [2, 2, 1, 2, INK], [6, 2, 1, 2, INK],
    [1, 4, 7, 1, INK],
    [2, 5, 5, 3, color], [2, 8, 5, 3, WALL], [2, 11, 5, 3, color], [2, 14, 5, 3, WALL],
    [6, 5, 1, 12, "rgba(0,0,0,.22)"],
    [4, 9, 1, 1, GLASS], [4, 15, 1, 2, DOOR],
    [0, 17, 9, 3, "#8c96a0"], [0, 17, 9, 1, "#b3bcc4"],
  ];
  return (
    <span className={"monument " + (className || "")}>
      <span className="beam" />
      <Px w={9} h={20} rects={r} />
    </span>
  );
}
// Drapeau de terrain (6 × 10)
export function Flag({ color, className }) {
  const r = [[1, 0, 1, 10, INK], [2, 1, 4, 3, color], [2, 4, 3, 1, shade(color, -0.2)], [0, 9, 3, 1, INK]];
  return <Px w={6} h={10} rects={r} className={className} />;
}
// Parasol de plage (11 × 11)
export function Parasol({ color, className }) {
  const r = [
    [4, 0, 3, 1, color], [2, 1, 7, 1, color], [1, 2, 9, 1, color],
    [0, 3, 11, 1, color], [2, 3, 2, 1, WALL], [7, 3, 2, 1, WALL], [4, 1, 3, 1, WALL],
    [5, 4, 1, 6, INK], [0, 10, 11, 1, "#e8cf8f"],
  ];
  return <Px w={11} h={11} rects={r} className={className} />;
}

export function Building({ type, level, color, className }) {
  if (type === "resort") return <Parasol color={color} className={className} />;
  if (level >= 5) return <Monument color={color} className={className} />;
  if (level === 4) return <Hotel color={color} className={className} />;
  if (level >= 1) return <Houses n={level} color={color} className={className} />;
  return <Flag color={color} className={className} />;
}

// ---------- pion ----------
export function Pawn({ color }) {
  const d = shade(color, -0.25), l = shade(color, 0.25);
  const r = [
    [3, 0, 3, 1, INK], [2, 1, 1, 3, INK], [6, 1, 1, 3, INK], [3, 4, 3, 1, INK],
    [3, 1, 3, 3, color], [3, 1, 1, 1, l], [5, 2, 1, 2, d],
    [2, 5, 5, 1, INK], [3, 6, 3, 3, color], [2, 6, 1, 3, INK], [6, 6, 1, 3, INK], [5, 6, 1, 3, d],
    [1, 9, 7, 1, INK], [1, 10, 7, 2, color], [0, 10, 1, 2, INK], [8, 10, 1, 2, INK], [6, 10, 2, 2, d],
    [0, 12, 9, 1, INK],
  ];
  return <Px w={9} h={13} rects={r} />;
}

// ---------- dés 3D ----------
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const POSE = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
function Face({ v }) {
  return (
    <div className={"face f" + v}>
      {Array.from({ length: 9 }, (_, k) => <span key={k} className={PIPS[v].includes(k) ? "pip on" : "pip"} />)}
    </div>
  );
}
export function Die3D({ v, seq, which }) {
  const [x, y] = POSE[v] || [0, 0];
  const spinX = seq * (which ? 1080 : 720);
  const spinY = seq * (which ? 720 : 360);
  return (
    <div className="die3d">
      <div className="cube" style={{ transform: `rotateX(${x + spinX}deg) rotateY(${y + spinY}deg)` }}>
        {[1, 2, 3, 4, 5, 6].map((f) => <Face key={f} v={f} />)}
      </div>
      <div className="dshadow" />
    </div>
  );
}

// ---------- particules ----------
export function Burst({ color, n = 10, kind = "spark" }) {
  return (
    <span className={"burst " + kind} aria-hidden="true">
      {Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2 + (k % 2 ? 0.3 : 0);
        const dist = 70 + (k % 3) * 35;
        return <i key={k} style={{ "--dx": `${Math.cos(a) * dist}%`, "--dy": `${Math.sin(a) * dist - 60}%`, background: k % 3 === 2 ? "#fff" : color, animationDelay: `${(k % 4) * 30}ms` }} />;
      })}
    </span>
  );
}

export function Confetti({ colors }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 70 }, (_, k) => (
        <i key={k} style={{
          left: `${(k * 37) % 100}%`,
          background: colors[k % colors.length],
          animationDelay: `${(k % 14) * 120}ms`,
          animationDuration: `${1800 + (k % 7) * 220}ms`,
          "--rx": `${(k % 5) * 80 - 160}px`,
        }} />
      ))}
    </div>
  );
}

// ---------- différences entre deux états : quels effets jouer ----------
export function diffFx(prev, s) {
  if (!prev || !s || !prev.players || !s.players) return null;
  const tiles = {};
  for (let i = 0; i < 32; i++) {
    const a = prev.props[i], b = s.props[i];
    if (!a && b) tiles[i] = "buy";
    else if (a && !b) tiles[i] = "sell";
    else if (a && b && a.o !== b.o) tiles[i] = "flip";
    else if (a && b && b.l > a.l) tiles[i] = "build";
    else if (a && b && b.l < a.l) tiles[i] = "storm";
  }
  if (s.champ && (!prev.champ || prev.champ.tile !== s.champ.tile || prev.champ.mult !== s.champ.mult)) tiles[s.champ.tile] = "champ";
  const cash = s.players.map((p, k) => (prev.players[k] ? p.cash - prev.players[k].cash : 0));
  if (!Object.keys(tiles).length && !cash.some(Boolean)) return null;
  return { tiles, cash, k: s.seq };
}
export const FX_LABEL = { buy: "Achat !", build: "Construit !", flip: "Rachat !", storm: "Tempête !", sell: "Vendu", champ: "Fête !" };
