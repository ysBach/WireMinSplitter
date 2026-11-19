import assert from "node:assert/strict";
import test from "node:test";
import { drawLadder, solveSettlement } from "../web/solver.js";

const balances = values => values.map((v, i) => ({ name: String.fromCharCode(65 + i), cents: BigInt(v) }));

test("the ladder excludes fixed senders, receivers and settled participants", () => {
  const entries = balances([-6, -4, -4, 3, 3, 3, 5, 0]);
  const draw = drawLadder(entries, 0);
  assert.deepEqual(draw, { top: ["C", "B"], rungs: [0], bottom: ["B", "C"], winners: ["A", "B"] });
  assert.deepEqual(drawLadder([...entries].reverse(), 0), draw);
  assert.deepEqual(drawLadder(balances([-4, -4, -4, 3, 3, 3, 3]), 8), {});
  assert.deepEqual(drawLadder(balances([-2, -2, 4]), 8), {});
});

test("a shared draw selects real co-senders and keeps the minimum transfer count", () => {
  // Each person owes 10 before deducting their spending.
  const rows = [6, 6, 6, 12, 12, 13, 15].map((spent, i) => ({ name: String.fromCharCode(65 + i), spent }));
  const payload = { rows, multiplier: "2", strict_preference: true };
  const minimum = solveSettlement({ ...payload, strict_preference: false }).summary.transactions;
  const teams = new Set();
  for (let seed = 0; seed < 16; seed++) {
    const result = solveSettlement(payload, seed);
    assert.equal(result.summary.transactions, minimum);
    assert.deepEqual(result, solveSettlement(payload, seed));
    for (const plan of [result, result.original]) {
      const counts = new Map();
      for (const { from } of plan.transfers) counts.set(from, 1 + (counts.get(from) || 0));
      const actual = [...counts.keys()].filter(name => counts.get(name) > 1).sort();
      assert.deepEqual(actual, result.ladder.winners);
      assert.equal(actual.length, 2);
      teams.add(actual.join(""));
    }
  }
  assert.deepEqual([...teams].sort(), ["AB", "AC", "BC"]);
});
