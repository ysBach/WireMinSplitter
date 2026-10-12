import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../web/app.js", import.meta.url), "utf8");
const calculationCode = app.slice(app.indexOf("function invalidatePendingState"), app.indexOf("function renderPlanIntoElements"));
const cancellationCode = app.slice(app.indexOf("function terminateActiveWorker"), app.indexOf("function applyParticipantCountFromInput"));

function harness() {
  const workers = [];
  const rendered = [];
  const errors = [];
  const timers = new Map();
  let timerSequence = 0;
  class Worker {
    constructor(url, options) {
      assert.equal(url, "./solver-worker.js");
      assert.equal(options.type, "module");
      this.terminated = false;
      workers.push(this);
    }
    postMessage(message) { this.message = message; }
    terminate() { this.terminated = true; }
  }
  const context = vm.createContext({
    Worker,
    workers,
    rendered,
    errors,
    activeWorker: null,
    activeRequestId: 0,
    requestSequence: 0,
    autoCalculateTimer: null,
    lastUsedMultiplier: "1",
    AUTO_CALC_DEBOUNCE_MS: 250,
    validation: { payload: { rows: [{ name: "A", repeat: 1000000, spent: "1e26", preferred: false }], multiplier: "1", strict_preference: false } },
    collectAndValidatePayload() { return context.validation; },
    hideResultAndError() { rendered.length = 0; },
    showCalculatingIndicator() {},
    hideCalculatingIndicator() {},
    showError(message) { errors.push(message); },
    t(key) { return key; },
    renderResult(result) { rendered.push(result); },
    window: { setTimeout(callback) { const id = ++timerSequence; timers.set(id, callback); return id; } },
    clearTimeout(id) { timers.delete(id); },
  });
  vm.runInContext(cancellationCode + calculationCode, context);
  return { context, workers, rendered, errors, timers };
}

test("input changes terminate a search immediately and discard its late result", async () => {
  const { context, workers, rendered, timers } = harness();
  await context.calculate();
  const old = workers[0];
  assert.equal(old.message.payload.rows.length, 1);
  assert.equal(old.message.payload.rows[0].repeat, 1000000);
  assert.equal(old.message.payload.rows[0].spent, "1e26");
  context.scheduleAutoCalculate();
  assert.equal(old.terminated, true);
  assert.equal(context.activeWorker, null);
  assert.equal(timers.size, 1);
  old.onmessage({ data: { id: old.message.id, result: { stale: true } } });
  assert.equal(rendered.length, 0);
  await [...timers.values()][0]();
  const current = workers[1];
  old.onerror(new Error("Late worker failure"));
  assert.equal(current.terminated, false);
  current.onmessage({ data: { id: current.message.id, result: { current: true } } });
  assert.equal(current.terminated, true);
  assert.deepEqual(rendered, [{ current: true }]);
});

test("Cancel stops the active search and a late reply cannot replace the cancellation", async () => {
  const { context, workers, rendered, errors } = harness();
  await context.calculate();
  const old = workers[0];
  context.cancelCalculation();
  assert.equal(old.terminated, true);
  assert.equal(context.activeWorker, null);
  assert.equal(errors.at(-1), "message.cancelled");
  old.onmessage({ data: { id: old.message.id, result: { stale: true } } });
  assert.equal(rendered.length, 0);
});

test("an invalid edit clears a prior plan without starting another worker", async () => {
  const { context, workers, rendered, errors } = harness();
  await context.calculate();
  const worker = workers[0];
  worker.onmessage({ data: { id: worker.message.id, result: { valid: true } } });
  assert.equal(rendered.length, 1);
  context.validation = { error: "Invalid amount" };
  await context.calculate();
  assert.equal(rendered.length, 0);
  assert.equal(workers.length, 1);
  assert.equal(errors.at(-1), "Invalid amount");
});
