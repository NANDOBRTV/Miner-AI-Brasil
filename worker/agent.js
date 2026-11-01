// Agente de telemetria: NÃO inicia nem controla software de mineração.
const apiUrl = (process.env.MINER_API_URL || "").replace(/\/$/, "");
const token = process.env.WORKER_API_TOKEN || "";
const id = process.env.WORKER_ID || "";
const name = process.env.WORKER_NAME || id;
const coin = (process.env.WORKER_COIN || "XMR").toUpperCase();
const hashrate = Number(process.env.WORKER_HASHRATE || 0);
const hashrateUnit = process.env.WORKER_HASHRATE_UNIT || "H/s";
const powerWatts = Number(process.env.WORKER_POWER_WATTS || 0);
const intervalMs = Math.max(15000, Number(process.env.HEARTBEAT_INTERVAL_MS || 30000));

if (!apiUrl.startsWith("https://") || !token || !id) {
  console.error("Configure MINER_API_URL (HTTPS), WORKER_API_TOKEN e WORKER_ID.");
  process.exit(1);
}
if (!Number.isFinite(hashrate) || !Number.isFinite(powerWatts)) {
  console.error("Hashrate e consumo precisam ser números.");
  process.exit(1);
}

async function report() {
  try {
    const response = await fetch(`${apiUrl}/api/workers/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, name, coin, hashrate, hashrateUnit, powerWatts, status: "online" }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    console.log(new Date().toISOString(), "telemetria enviada", data.worker.id);
  } catch (error) {
    console.error(new Date().toISOString(), "falha no heartbeat:", error.message);
  }
}
report();
setInterval(report, intervalMs);
