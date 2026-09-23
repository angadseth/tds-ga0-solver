// Plays tds-network-games "detective" for an email and returns the completion JWT.
// The weekly graph is identical for every email (only the anchor differs), so the shared
// service discovers it once per week (edge-cached) and each student's session just queries
// the culprit and submits the shortest anchor->culprit path.
const GAME = "https://tds-network-games.sanand.workers.dev/detective";

export function isoWeek(d = new Date()) {
  const e = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  e.setUTCDate(e.getUTCDate() + 4 - (e.getUTCDay() || 7));
  const y = new Date(Date.UTC(e.getUTCFullYear(), 0, 1));
  return `${e.getUTCFullYear()}-W${String(Math.ceil(((e - y) / 864e5 + 1) / 7)).padStart(2, "0")}`;
}

function shortestPath(adj, from, to) {
  const prev = new Map([[from, null]]);
  const q = [from];
  while (q.length && !prev.has(to)) {
    const u = q.shift();
    for (const v of adj[u] || []) if (!prev.has(v)) (prev.set(v, u), q.push(v));
  }
  if (!prev.has(to)) return null;
  const path = [];
  for (let v = to; v !== null; v = prev.get(v)) path.unshift(v);
  return path;
}

export async function playDetective(email, service, log = () => {}) {
  const graphP = fetch(`${service}/detective-graph?week=${isoWeek()}`).then((r) => r.json());
  let token = "";
  const call = async (method, path, body) => {
    const r = await fetch(GAME + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { "X-Session-Token": token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || j.error || `detective HTTP ${r.status}`);
    return j;
  };
  const [start, graph] = await Promise.all([call("POST", "/start", { email }), graphP]);
  token = start.session_token;
  if (graph.error) throw new Error(`graph: ${graph.error}`);
  const adj = { ...graph.adj, [start.anchor_node.id]: start.anchor_node.neighbors };
  const culprit = graph.culprit;
  await call("GET", `/node/${culprit}`);
  const path = shortestPath(adj, start.anchor_node.id, culprit);
  if (!path) throw new Error("detective: no path to culprit");
  log(`detective: anchor ${start.anchor_node.id} -> ${culprit} via ${path.join(">")}`);
  const res = await call("POST", "/submit", { compromised_node: culprit, path });
  if (!res.completion_token) throw new Error(`detective: no token (score ${res.score})`);
  return res.completion_token;
}
