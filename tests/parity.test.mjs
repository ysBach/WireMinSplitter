import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";
import { SettlementError, SettlementResourceError, solveSettlement } from "../web/solver.js";

// Compare implementations with distinct integer and rational arithmetic runtimes.
const python = process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python";
test("browser settlement matches the Python reference across source amounts and preferences", {
  skip: !existsSync(python) && "Run uv sync --extra test to enable reference parity checks.",
}, () => {
  const payloads = [];
  for (let number = 1; number <= 32; number += 1) {
    const people = Array.from({ length: 2 + number % 4 }, (_, index) => ({
      name: `Person ${index}`,
      spent: `${(number * (index + 3)) % 19}.${String((number + index * 17) % 100).padStart(2, "0")}`,
      extra_pay: index === 0 ? "0.015" : "0",
      extra_get: index === 1 ? "0.015" : "0",
    }));
    payloads.push({
      people,
      multiplier: ["1", "0.01", "1.005", "7.25"][number % 4],
      preferred_multi_payers: number % 2 ? ["Person 0"] : [],
      strict_preference: number % 3 === 0,
    });
  }
  payloads.push({ people: [{ name: "A", spent: "1e26" }, { name: "B", spent: "0" }], multiplier: "0.0001" });
  payloads.push({ people: [{ name: "é", spent: "0.01" }, { name: "😀", spent: "0" }, { name: "\uE000", spent: "0" }] });
  payloads.push({ people: [{ name: "A", spent: "0", extra_get: "0.001" }, { name: "B", spent: "0" }] });
  for (const [spending, multiplier] of [[[2, 3, 3], "0.01"], [[3, 2, 9, 1, 5, 0], "1.1"]]) {
    payloads.push({
      people: spending.map((spent, index) => ({ name: `Person ${index}`, spent: String(spent) })),
      multiplier,
      strict_preference: true,
    });
  }

  const program = [
    "import json, sys",
    "from wire_min_splitter.optimizer import SettlementError, SettlementResourceError, solve_payload",
    "results = []",
    "for payload in json.load(sys.stdin):",
    "    try:",
    "        results.append({'result': solve_payload(payload)})",
    "    except SettlementError as error:",
    "        results.append({'error': {'message': str(error), 'resource': isinstance(error, SettlementResourceError)}})",
    "json.dump(results, sys.stdout)",
  ].join("\n");
  const reference = spawnSync(python, ["-c", program], {
    input: JSON.stringify(payloads),
    encoding: "utf8",
    env: { ...process.env, PYTHONPATH: "src" },
    timeout: 30000,
  });
  assert.equal(reference.status, 0, reference.stderr || reference.error?.message);
  const expected = JSON.parse(reference.stdout);
  payloads.forEach((payload, index) => {
    let actual;
    try { actual = { result: solveSettlement(payload) }; }
    catch (error) {
      if (!(error instanceof SettlementError)) throw error;
      actual = { error: { message: error.message, resource: error instanceof SettlementResourceError } };
    }
    assert.deepEqual(actual, expected[index], `Parity failure for ${JSON.stringify(payload)}`);
  });
});
