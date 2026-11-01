const workers = new Map();
const ALLOWED_COINS = new Set(["BTC", "LTC", "DOGE", "XMR", "ETC"]);
const STALE_AFTER_MS = 90000;

export function heartbeat(input = {}) {
  const id = String(input.id || "").trim();
  const name = String(input.name || id).trim();
  const coin = String(input.coin || "").toUpperCase();
  const hashrate = Number(input.hashrate);
  const powerWatts = Number(input.powerWatts);
  const unit = String(input.hashrateUnit || "H/s").slice(0, 16);
  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) return { ok: false, error: "ID inválido (2 a 64 caracteres: letras, números, _ ou -)." };
  if (!name || name.length > 80) return { ok: false, error: "Nome do worker inválido." };
  if (!ALLOWED_COINS.has(coin)) return { ok: false, error: "Moeda não suportada. Use BTC, LTC, DOGE, XMR ou ETC." };
  if (!Number.isFinite(hashrate) || hashrate < 0 || hashrate > 1e18) return { ok: false, error: "Hashrate inválido." };
  if (!Number.isFinite(powerWatts) || powerWatts < 0 || powerWatts > 100000) return { ok: false, error: "Consumo elétrico inválido." };
  const item = { id, name, coin, hashrate, hashrateUnit: unit, powerWatts, status: input.status === "idle" ? "idle" : "online", lastSeen: new Date().toISOString(), receivedAt: Date.now() };
  workers.set(id, item);
  return { ok: true, worker: { ...item, receivedAt: undefined } };
}

export function listWorkers() {
  const now = Date.now();
  return [...workers.values()].map(({ receivedAt, ...w }) => ({
    ...w,
    status: now - receivedAt > STALE_AFTER_MS ? "stale" : w.status
  }));
}
export function getWorkerSummary() {
  const all = listWorkers();
  const online = all.filter(w => w.status === "online");
  const rates = online.reduce((sum, w) => sum + w.hashrate, 0);
  return { online: online.length, total: all.length, hashrate: rates };
}
