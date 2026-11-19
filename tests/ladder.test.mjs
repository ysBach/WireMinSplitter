import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { drawLadder, solveSettlement } from "../web/solver.js";

const balances = values => values.map((v, i) => ({ name: String.fromCharCode(65 + i), cents: BigInt(v) }));

test("text seed links replay Unicode and preserve numeric seed links", () => {
  const app = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  const readDraw = new Function(app.slice(app.indexOf("function drawFromText"), app.indexOf("function loadSplitFromAddress")) + ";return readLadderDraw;")();
  assert.deepEqual(readDraw("2.~kasi"), { version: 2, seed: 0x2e8bedbd, text: "kasi" });
  assert.deepEqual(readDraw("2.~  한글&+~ ".normalize("NFD")), readDraw("2.~한글&+~"));
  assert.deepEqual(readDraw("1.0"), { version: 1, seed: 0 });
  assert.deepEqual(readDraw("2.z"), { version: 2, seed: 35 });
  assert.equal(readDraw("2.~ "), null);
});

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

test("v2 keeps the table order and the bridges trace to the drawn counts", () => {
  const rows = [
    { name: "Z", spent: "69" }, { name: "A" }, { name: "R", spent: "112.32" },
    { name: "C" }, { name: "B" }, { name: "D" },
  ];
  const orders = new Set();
  for (let seed = 0; seed < 128; seed++) {
    const result = solveSettlement({ rows }, seed, 2);
    const { top, bottom, rungs, winners } = result.ladder;
    assert.deepEqual(top, ["A", "C", "B", "D"]);
    const lanes = [...top];
    const bridges = Array(top.length - 1).fill(0);
    for (const gap of rungs) {
      assert.ok(Number.isInteger(gap) && gap >= 0 && gap < bridges.length);
      bridges[gap]++;
      [lanes[gap], lanes[gap + 1]] = [lanes[gap + 1], lanes[gap]];
    }
    assert.ok(bridges.every(count => count >= 2));
    assert.deepEqual(lanes, bottom);
    assert.deepEqual(winners, [lanes[0]]);
    assert.deepEqual(lanes.map(name => result.transfers.filter(t => t.from === name).length), [2, 1, 1, 1]);
    orders.add(bottom.join(""));
  }
  assert.equal(orders.size, 24);
});
