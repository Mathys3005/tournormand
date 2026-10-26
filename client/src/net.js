// Connexion temps réel au serveur (WebSocket avec reconnexion automatique)
export function connect(token, { onMessage, onStatus, onAuthFail }) {
  let ws = null;
  let closed = false;
  let delay = 500;
  const queue = [];
  const open = () => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(token)}`);
    onStatus && onStatus("connecting");
    ws.onopen = () => {
      delay = 500;
      onStatus && onStatus("online");
      while (queue.length) ws.send(queue.shift());
    };
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === "auth" && !m.ok) { closed = true; onAuthFail && onAuthFail(); return; }
      onMessage(m);
    };
    ws.onclose = (e) => {
      if (closed || e.code === 4001) return;
      onStatus && onStatus("offline");
      setTimeout(open, delay);
      delay = Math.min(delay * 2, 8000);
    };
  };
  open();
  return {
    send(msg) {
      const s = JSON.stringify(msg);
      if (ws && ws.readyState === 1) ws.send(s);
      else queue.push(s);
    },
    close() { closed = true; ws && ws.close(); },
  };
}

export async function api(path, { token, body } = {}) {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || "Erreur réseau"), { status: r.status });
  return data;
}
