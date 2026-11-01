import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProfitability } from "../src/strategy.js";
import { heartbeat, listWorkers, getWorkerSummary } from "../src/workers.js";

test("calculates energy, pool fee and daily net result", () => {
  const result = evaluateProfitability({
    hashrate: 1000, powerWatts: 120, electricityBrlKwh: 0.9,
    grossRevenueBrlDay: 2, poolFeePercent: 1, uptimePercent: 95,
    hardwareCostBrl: 1000
  });
  assert.equal(result.ready, true);
  assert.ok(Math.abs(result.energyKwhDay - 2.736) < 1e-9);
  assert.ok(Math.abs(result.energyCostBrlDay - 2.4624) < 1e-9);
  assert.ok(Math.abs(result.grossAfterPoolBrlDay - 1.881) < 1e-9);
  assert.ok(result.netDailyBrl < 0);
  assert.equal(result.profitableOnInputs, false);
});

test("rejects missing simulation inputs", () => {
  const result = evaluateProfitability({ hashrate: 100 });
  assert.equal(result.ready, false);
  assert.ok(result.missing.includes("powerWatts"));
});

test("rejects impossible fee percentages", () => {
  const result = evaluateProfitability({
    hashrate: 1, powerWatts: 1, electricityBrlKwh: 1,
    grossRevenueBrlDay: 1, poolFeePercent: 101
  });
  assert.equal(result.ready, false);
});

test("accepts worker telemetry and aggregates online worker count", () => {
  const result = heartbeat({
    id: "test-worker-01", name: "Worker de teste", coin: "XMR",
    hashrate: 1200, hashrateUnit: "H/s", powerWatts: 95
  });
  assert.equal(result.ok, true);
  const worker = listWorkers().find(w => w.id === "test-worker-01");
  assert.equal(worker.status, "online");
  assert.equal(getWorkerSummary().online, 1);
});
