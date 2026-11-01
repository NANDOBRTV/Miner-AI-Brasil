import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import { getMarket, getStatus, evaluateProfitability } from "./strategy.js";
import { heartbeat, listWorkers, getWorkerSummary } from "./workers.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "public");
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8" };
const send = (res, status, data) => { res.writeHead(status, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(data)); };
async function readJson(req, maxBytes = 16384) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > maxBytes) throw new Error("Payload muito grande.");
  }
  try { return JSON.parse(raw || "{}"); } catch { throw new Error("JSON inválido."); }
}
function validWorkerToken(req) {
  const expected = process.env.WORKER_API_TOKEN || "";
  const supplied = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
  try {
    if (url.pathname === "/health") return send(res, 200, { ok: true, service: "miner-ai-brasil" });
    if (url.pathname === "/api/status") return send(res, 200, getStatus(getWorkerSummary()));
    if (url.pathname === "/api/market") return send(res, 200, { updatedAt: new Date().toISOString(), coins: await getMarket() });
    if (url.pathname === "/api/simulation" && req.method === "POST") {
      const result = evaluateProfitability(await readJson(req));
      return send(res, result.ready ? 200 : 400, result);
    }
    if (url.pathname === "/api/workers" && req.method === "GET") return send(res, 200, { workers: listWorkers(), summary: getWorkerSummary() });
    if (url.pathname === "/api/workers/heartbeat" && req.method === "POST") {
      if (!validWorkerToken(req)) return send(res, 401, { error: "Token do worker ausente ou inválido. Configure WORKER_API_TOKEN no servidor." });
      const result = heartbeat(await readJson(req));
      return send(res, result.ok ? 200 : 400, result);
    }

    const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const file = normalize(join(root, requested));
    if (!file.startsWith(root)) return send(res, 403, { error: "Forbidden" });
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch { return send(res, 404, { error: "Not found" }); }
  } catch (error) {
    return send(res, 400, { error: error.message || "Requisição inválida." });
  }
});

server.listen(port, "0.0.0.0", () => console.log(`Miner AI Brasil listening on ${port}`));
