const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", algorithm: "SHA-256", hardware: "ASIC" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", algorithm: "Scrypt", hardware: "ASIC" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", algorithm: "Scrypt", hardware: "ASIC" },
  { id: "monero", symbol: "XMR", name: "Monero", algorithm: "RandomX", hardware: "CPU" },
  { id: "ethereum-classic", symbol: "ETC", name: "Ethereum Classic", algorithm: "Etchash", hardware: "GPU" }
];

export async function getMarket() {
  const ids = COINS.map(c => c.id).join(",");
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.search = new URLSearchParams({ ids, vs_currencies: "brl,usd", include_24hr_change: "true" });
  try {
    const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Market API returned ${response.status}`);
    const data = await response.json();
    return COINS.map(coin => ({ ...coin, brl: data[coin.id]?.brl ?? null, usd: data[coin.id]?.usd ?? null, change24h: data[coin.id]?.brl_24h_change ?? null }));
  } catch (error) {
    return COINS.map(coin => ({ ...coin, brl: null, usd: null, change24h: null, marketError: error.message }));
  }
}

export function getStatus() {
  return { app: "Miner AI Brasil", version: "0.1.0", mode: "monitoramento", miningEnabled: false, workers: 0, hashrate: 0, uptime: process.uptime(), safety: "A mineração está desativada por padrão." };
}

// Sem hashrate medido, consumo, tarifa elétrica, dificuldade, recompensa e pool,
// não existe base confiável para afirmar qual moeda é lucrativa.
export function evaluateProfitability(input = {}) {
  const required = ["hashrate", "powerWatts", "electricityBrlKwh", "dailyRevenueBrl"];
  const missing = required.filter(key => !Number.isFinite(input[key]) || input[key] < 0);
  if (missing.length) return { ready: false, missing, recommendation: "Aguardando dados reais do equipamento e da rede." };
  const energyCost = (input.powerWatts / 1000) * 24 * input.electricityBrlKwh;
  const netDaily = input.dailyRevenueBrl - energyCost;
  return { ready: true, energyCostBrlDay: energyCost, netDailyBrl: netDaily, profitable: netDaily > 0 };
}
