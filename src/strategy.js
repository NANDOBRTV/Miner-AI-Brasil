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

export function getStatus(workerSummary = { online: 0, total: 0, hashrate: 0 }) {
  return {
    app: "Miner AI Brasil", version: "0.2.0", mode: "monitoramento",
    miningEnabled: false, workers: workerSummary.online,
    workersTotal: workerSummary.total, hashrate: workerSummary.hashrate,
    uptime: process.uptime(), safety: "O painel monitora workers; não inicia mineradores."
  };
}

const finite = (value) => typeof value === "number" && Number.isFinite(value);
export function evaluateProfitability(input = {}) {
  const fields = ["hashrate", "powerWatts", "electricityBrlKwh", "grossRevenueBrlDay"];
  const missing = fields.filter(key => !finite(input[key]));
  if (missing.length) return { ready: false, missing, error: "Preencha todos os campos obrigatórios com números válidos." };

  const limits = [
    ["hashrate", 0, 1e18], ["powerWatts", 0, 100000],
    ["electricityBrlKwh", 0, 100], ["grossRevenueBrlDay", 0, 1e8],
    ["poolFeePercent", 0, 100], ["uptimePercent", 0, 100],
    ["hardwareCostBrl", 0, 1e9]
  ];
  for (const [key, min, max] of limits) {
    if (input[key] !== undefined && (!finite(input[key]) || input[key] < min || input[key] > max)) {
      return { ready: false, error: `Valor inválido no campo ${key}.` };
    }
  }
  if (input.hashrate <= 0) return { ready: false, error: "O hashrate precisa ser maior que zero." };

  const uptime = (input.uptimePercent ?? 100) / 100;
  const poolFee = (input.poolFeePercent ?? 0) / 100;
  const energyKwhDay = (input.powerWatts / 1000) * 24 * uptime;
  const energyCostBrlDay = energyKwhDay * input.electricityBrlKwh;
  const grossAfterPoolBrlDay = input.grossRevenueBrlDay * uptime * (1 - poolFee);
  const netDailyBrl = grossAfterPoolBrlDay - energyCostBrlDay;
  const hardwareCostBrl = input.hardwareCostBrl ?? 0;
  const monthlyNetBrl = netDailyBrl * 30;
  const breakEvenTariffBrlKwh = energyKwhDay > 0 ? grossAfterPoolBrlDay / energyKwhDay : null;

  return {
    ready: true,
    assumptions: { uptimePercent: uptime * 100, poolFeePercent: poolFee * 100, revenueIsUserEstimate: true },
    energyKwhDay, energyCostBrlDay, grossAfterPoolBrlDay, netDailyBrl,
    monthlyNetBrl, breakEvenTariffBrlKwh,
    hardwareCostBrl,
    estimatedPaybackDays: netDailyBrl > 0 && hardwareCostBrl > 0 ? hardwareCostBrl / netDailyBrl : null,
    profitableOnInputs: netDailyBrl > 0,
    warning: "Simulação baseada na receita informada por você; não é cotação de lucro garantido. Dificuldade, recompensa, taxas, câmbio e preço da moeda podem mudar."
  };
}
