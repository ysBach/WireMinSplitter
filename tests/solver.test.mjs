import assert from "node:assert/strict";
import test from "node:test";
import {
  SettlementInfeasibleError,
  SettlementResourceError,
  computeNetBalances,
  expandRows,
  optimizeTransfers,
  solveSettlement,
} from "../web/solver.js";

const balances = (list) => list.map((cents, index) => ({ name: "n" + index, cents: BigInt(cents) }));
const byName = (result) => Object.fromEntries(result.balances.map((b) => [b.name, b.net]));

test("preferred first payer keeps 4 transfers and penalty 0 in soft and strict modes", () => {
  for (const strict of [false, true]) {
    const { transfers, penalty } = optimizeTransfers(balances([-200, -200, -200, 300, 300]), ["n0"], strict);
    assert.equal(transfers.length, 4);
    assert.equal(penalty, 0);
    assert.equal(transfers.filter((t) => t.payer === "n0").length, 2);
  }
});

test("strict mode without a preferred payer reports infeasible, soft mode pays the penalty", () => {
  const input = balances([-200, -200, -200, 300, 300]);
  assert.throws(() => optimizeTransfers(input, [], true), /No feasible settlement/);
  assert.equal(optimizeTransfers(input, [], false).penalty, 1);
});

test("plans are conserved and independent of input order", () => {
  const input = balances([-700, -500, -300, 400, 600, 500]);
  const forward = optimizeTransfers(input, ["n1"]);
  const backward = optimizeTransfers([...input].reverse(), ["n1"]);
  assert.deepEqual(backward, forward);
  const sent = {};
  for (const t of forward.transfers) {
    sent[t.payer] = (sent[t.payer] ?? 0n) + t.cents;
    sent[t.receiver] = (sent[t.receiver] ?? 0n) - t.cents;
  }
  for (const b of input) assert.equal(sent[b.name] ?? 0n, -b.cents);
});

test("balanced rounding sums to zero, stays within one cent and ignores row order", () => {
  const people = ["A", "B", "C"].map((name, i) => ({ name, spent: i === 0 ? "1.00" : "0" }));
  const result = solveSettlement({ people });
  assert.deepEqual(byName(result), { A: "0.67", B: "-0.33", C: "-0.34" });
  assert.equal(result.rounding_notice, true);
  assert.deepEqual(byName(solveSettlement({ people: [...people].reverse() })), byName(result));
});

test("ties between equal remainders use Unicode code point order", () => {
  const people = [{ name: "😀" }, { name: "A", spent: "0.01" }, { name: "\uE000" }];
  assert.deepEqual(byName(solveSettlement({ people })), { A: "0.01", "\uE000": "0.00", "😀": "-0.01" });
});

test("computeNetBalances takes BigInt cents", () => {
  const result = computeNetBalances([
    { name: "A", spent_cents: 10000n },
    { name: "B", spent_cents: 0n },
    { name: "C", spent_cents: 0n },
  ]);
  assert.deepEqual(result.map((b) => b.cents), [6667n, -3333n, -3334n]);
});

test("the original result is solved without the multiplier", () => {
  const payload = {
    people: [{ name: "A", spent: "10.01" }, { name: "B", spent: "0", extra_pay: "0.015" }, { name: "C", extra_get: "0.015" }],
    multiplier: "1.005",
  };
  const result = solveSettlement(payload);
  const plain = solveSettlement({ ...payload, multiplier: "1" });
  assert.deepEqual(result.original, plain);
  assert.equal(plain.original, undefined);
  const total = result.balances.reduce((sum, b) => sum + BigInt(b.net.replace(".", "")), 0n);
  assert.equal(total, 0n);
});

test("adjustments are checked before the multiplier is applied", () => {
  const people = [{ name: "A", extra_get: "0.004" }, { name: "B", extra_pay: "0.003" }];
  assert.throws(() => solveSettlement({ people, multiplier: "1000" }), /Infeasible adjustments/);
});

test("very large values stay exact", () => {
  const result = solveSettlement({ people: [{ name: "A", spent: "1e26" }, { name: "B" }] });
  assert.equal(result.transfers[0].amount, "50000000000000000000000000.00");
});

test("a very large exponent is a resource error, not invalid input", () => {
  assert.throws(
    () => solveSettlement({ people: [{ name: "A", spent: "1e999999999999999" }, { name: "B" }] }),
    SettlementResourceError,
  );
});

test("input validation", () => {
  const bad = (people, pattern, extra = {}) =>
    assert.throws(() => solveSettlement({ people, ...extra }), pattern);
  bad([], /At least one participant/);
  bad([{ name: "  " }], /non-empty/);
  bad([{ name: "A" }, { name: "A" }], /Duplicate/);
  bad([{ name: "\u00e9" }, { name: "e\u0301" }], /Duplicate/);
  bad([{ name: "A", spent: "-1" }], /cannot be negative/);
  bad([{ name: "A", spent: "1,5" }], /Invalid monetary/);
  bad([{ name: "A", spent: 1.5 }], /Invalid monetary/);
  bad([{ name: "A" }], /multiplier/, { multiplier: "0" });
  bad([{ name: "A" }], /strict_preference/, { strict_preference: "false" });
  bad([{ name: "A" }], /preferred_multi_payers/, { preferred_multi_payers: "A" });
});

test("one creditor and many debtors needs no deep recursion", () => {
  const people = [{ name: "Payer", spent: "1001" }];
  for (let i = 0; i < 1000; i += 1) people.push({ name: "p" + i });
  const result = solveSettlement({ people });
  assert.equal(result.summary.transactions, 1000);
});

test("compact rows expand with the established naming rule", () => {
  const { people, preferred } = expandRows([
    { name: "Ann", repeat: 10, spent: "1", preferred: true },
    { name: "Bob", repeat: 2, spent: "0" },
    { name: "Bob 1", repeat: 1, spent: "0" },
  ]);
  const names = people.map((p) => p.name);
  assert.equal(names[0], "Ann 01");
  assert.equal(names[9], "Ann 10");
  assert.deepEqual(names.slice(10), ["Bob 1 (2)", "Bob 2", "Bob 1"]);
  assert.equal(preferred.length, 10);
});

test("typed names are never taken by generated names, in any row order", () => {
  const rows = [
    { name: "A", repeat: 2, spent: "10" },
    { name: "A 2", repeat: 1, spent: "0", extra_pay: "1" },
    { name: "Z", repeat: 1, spent: "0", extra_get: "1" },
  ];
  const forward = solveSettlement({ rows });
  const backward = solveSettlement({ rows: [...rows].reverse() });
  const nets = (result) => Object.fromEntries(result.balances.map((b) => [b.name, b.net]));
  assert.deepEqual(nets(backward), nets(forward));
  assert.ok("A 2" in nets(forward) && "A 2 (2)" in nets(forward));
  assert.equal(nets(forward)["A 2"], "-6.00");
  assert.equal(nets(forward)["Z"], "-4.00");
  assert.deepEqual(expandRows(rows).people.map((p) => p.name), ["A 1", "A 2 (2)", "A 2", "Z"]);
});

test("rows reject typed duplicates, bad repeat counts and invalid names", () => {
  assert.throws(() => expandRows([{ name: "x".repeat(130) }, { name: "x".repeat(125) }]), /Duplicate/);
  assert.throws(() => expandRows([{ name: "A" }, { name: "A" }]), /Duplicate/);
  for (const repeat of [0, "1.5", "-1", 2 ** 60, "abc"]) {
    assert.throws(() => expandRows([{ name: "A", repeat }]), /Repeat/);
  }
  assert.throws(() => expandRows([{ name: "A", preferred: "yes" }]), /preferred/);
  const long = expandRows([{ name: "x".repeat(200), repeat: 2 }]).people;
  assert.ok(long.every((p) => p.name.length <= 120));
});

test("the worker answers with result or error and keeps the request id", async () => {
  const sent = [];
  globalThis.self = { postMessage: (message) => sent.push(message) };
  await import("../web/solver-worker.js");
  globalThis.self.onmessage({ data: { id: 7, payload: { rows: [{ name: "A", spent: "2" }, { name: "B" }] } } });
  globalThis.self.onmessage({ data: { id: 8, payload: { people: [] } } });
  assert.equal(sent[0].id, 7);
  assert.equal(sent[0].result.transfers[0].amount, "1.00");
  assert.equal(sent[1].id, 8);
  assert.match(sent[1].error.message, /At least one participant/);
  delete globalThis.self;
});

const strictPayload = (spent, multiplier) => ({
  people: spent.map((amount, index) => ({ name: "P" + index, spent: String(amount) })),
  multiplier,
  strict_preference: true,
});

test("each view of a multiplied payload shows its own plan or its own error", () => {
  const convertedOnly = solveSettlement(strictPayload([2, 3, 3], ".01"));
  assert.equal(convertedOnly.error, undefined);
  assert.deepEqual(Object.keys(convertedOnly), ["summary", "balances", "transfers", "rounding_notice", "original"]);
  assert.deepEqual(Object.keys(convertedOnly.original), ["error"]);
  assert.deepEqual(convertedOnly.original.error.resource, false);
  assert.match(convertedOnly.original.error.message, /No feasible settlement/);

  const originalOnly = solveSettlement(strictPayload([3, 2, 9, 1, 5, 0], "1.1"));
  assert.deepEqual(Object.keys(originalOnly), ["error", "original"]);
  assert.match(originalOnly.error.message, /No feasible settlement/);
  assert.ok(originalOnly.original.transfers.length > 0);
});

test("without a multiplier an infeasible strict plan is thrown", () => {
  assert.throws(() => solveSettlement(strictPayload([2, 3, 3], "1")), SettlementInfeasibleError);
});

test("invalid input stays a global error even when a multiplier is set", () => {
  const people = [{ name: "A", extra_get: "1" }, { name: "B" }];
  assert.throws(() => solveSettlement({ people, multiplier: "2", strict_preference: true }), /Infeasible adjustments/);
});
