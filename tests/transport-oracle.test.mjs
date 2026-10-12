import assert from "node:assert/strict";
import test from "node:test";
import { solveSettlement } from "../web/solver.js";

// Enumerate all integer transport matrices, including non-leaf transfers.
// This oracle uses a different search space from the production leaf search.
function matrixOptimum(supply, demand, preferred, strict) {
  const remainingSupply = [...supply];
  const remainingDemand = [...demand];
  const outgoing = supply.map(() => 0);
  let best = null;
  function visit(cell, edges) {
    if (cell === supply.length * demand.length) {
      if (remainingSupply.some(Boolean) || remainingDemand.some(Boolean)) return;
      const penalty = outgoing.reduce((total, count, payer) =>
        total + (preferred.has(payer) ? 0 : Math.max(0, count - 1)), 0);
      if (!best || edges < best[0] || (edges === best[0] && penalty < best[1])) best = [edges, penalty];
      return;
    }
    const payer = Math.floor(cell / demand.length);
    const receiver = cell % demand.length;
    const limit = Math.min(remainingSupply[payer], remainingDemand[receiver]);
    for (let amount = 0; amount <= limit; amount += 1) {
      if (amount > 0 && strict && !preferred.has(payer) && outgoing[payer] > 0) continue;
      remainingSupply[payer] -= amount;
      remainingDemand[receiver] -= amount;
      outgoing[payer] += Number(amount > 0);
      if (receiver !== demand.length - 1 || remainingSupply[payer] === 0) visit(cell + 1, edges + Number(amount > 0));
      outgoing[payer] -= Number(amount > 0);
      remainingDemand[receiver] += amount;
      remainingSupply[payer] += amount;
    }
  }
  visit(0, 0);
  return best;
}

function* compositions(total, parts, prefix = []) {
  if (parts === 1) { yield [...prefix, total]; return; }
  for (let first = 1; first <= total - parts + 1; first += 1) {
    yield* compositions(total - first, parts - 1, [...prefix, first]);
  }
}

const decimal = (cents) => `0.${String(cents).padStart(2, "0")}`;

test("exact plans match exhaustive integer transport matrices in soft and strict modes", () => {
  let cases = 0;
  for (let total = 1; total <= 5; total += 1) {
    for (let payerCount = 1; payerCount <= Math.min(3, total); payerCount += 1) {
      for (let receiverCount = 1; receiverCount <= Math.min(3, total); receiverCount += 1) {
        for (const supply of compositions(total, payerCount)) {
          for (const demand of compositions(total, receiverCount)) {
            for (const mask of [0, 1, (1 << payerCount) - 1]) {
              const preferred = new Set(supply.flatMap((_, index) => mask & (1 << index) ? [index] : []));
              for (const strict of [false, true]) {
                const label = JSON.stringify({ supply, demand, mask, strict });
                const expected = matrixOptimum(supply, demand, preferred, strict);
                const people = [
                  ...supply.map((amount, index) => ({ name: `P${index}`, spent: "0", extra_pay: decimal(amount) })),
                  ...demand.map((amount, index) => ({ name: `R${index}`, spent: "0", extra_get: decimal(amount) })),
                ];
                const payload = { people, strict_preference: strict, preferred_multi_payers: [...preferred].map(index => `P${index}`) };
                cases += 1;
                if (expected === null) {
                  assert.throws(() => solveSettlement(payload), /No feasible settlement/, label);
                  continue;
                }
                const result = solveSettlement(payload);
                assert.deepEqual([result.summary.transactions, result.summary.burden_penalty], expected, label);
                assert.equal(result.transfers.length, expected[0]);
                const sent = supply.map(() => 0n);
                const received = demand.map(() => 0n);
                const counts = supply.map(() => 0);
                for (const transfer of result.transfers) {
                  assert.match(transfer.from, /^P\d+$/);
                  assert.match(transfer.to, /^R\d+$/);
                  assert.match(transfer.amount, /^\d+\.\d{2}$/);
                  const amount = BigInt(transfer.amount.replace(".", ""));
                  assert.ok(amount > 0n);
                  const payer = Number(transfer.from.slice(1));
                  const receiver = Number(transfer.to.slice(1));
                  sent[payer] += amount;
                  received[receiver] += amount;
                  counts[payer] += 1;
                }
                assert.deepEqual(sent, supply.map(BigInt), label);
                assert.deepEqual(received, demand.map(BigInt), label);
                const actualPenalty = counts.reduce((sum, count, index) => sum + (preferred.has(index) ? 0 : Math.max(0, count - 1)), 0);
                assert.equal(actualPenalty, expected[1]);
                if (strict) counts.forEach((count, index) => assert.ok(preferred.has(index) || count <= 1));
              }
            }
          }
        }
      }
    }
  }
  assert.ok(cases > 1000);
});
