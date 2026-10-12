import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "web");

test("Manifest: valid JSON and all referenced icons exist on disk", () => {
  const manifestPath = path.join(webDir, "manifest.webmanifest");
  assert.ok(fs.existsSync(manifestPath), "manifest.webmanifest must exist");

  const raw = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  assert.equal(manifest.name, "Wire-Min-Splitter");
  assert.equal(manifest.short_name, "MoneySplit");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "must define icons");

  for (const icon of manifest.icons) {
    const iconRel = icon.src.replace(/^\.\//, "");
    const iconPath = path.join(webDir, iconRel);
    assert.ok(fs.existsSync(iconPath), "Icon file must exist: " + icon.src);
    assert.ok(fs.statSync(iconPath).size > 0, "Icon file must not be empty: " + icon.src);
  }
});

test("Headers: CSP permits self, worker, blob, and forbids unsafe-inline scripts", () => {
  const headersPath = path.join(webDir, "_headers");
  assert.ok(fs.existsSync(headersPath), "_headers must exist");

  const headers = fs.readFileSync(headersPath, "utf8");
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /script-src\s+'self'/);
  assert.doesNotMatch(headers, /script-src[^;]*'unsafe-inline'/);
  assert.match(headers, /worker-src\s+'self';/);
  assert.doesNotMatch(headers, /worker-src[^;]*blob:/);
  assert.match(headers, /img-src\s+'self'\s+data:\s+blob:/);
});

test("Build Script Sanity Check: fails when critical files are missing, succeeds when present", () => {
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "moneysplit-build-test-"));
  const mockWebDir = path.join(tmpDir, "web");
  const mockDistDir = path.join(tmpDir, "dist");
  const mockScriptsDir = path.join(tmpDir, "scripts");
  fs.mkdirSync(mockWebDir, { recursive: true });
  fs.mkdirSync(mockScriptsDir, { recursive: true });

  const buildScript = fs.readFileSync(path.join(rootDir, "scripts", "build.mjs"), "utf8");
  fs.writeFileSync(path.join(mockScriptsDir, "build.mjs"), buildScript);

  // 1. Run in empty web dir -> must fail sanity check
  assert.throws(() => {
    execFileSync("node", ["scripts/build.mjs"], { cwd: tmpDir, stdio: "pipe" });
  }, "Build must throw when critical files are missing");

  // 2. Populate all required files
  const requiredFiles = [
    "index.html",
    "styles.css",
    "app.js",
    "manifest.webmanifest",
    "sw.js",
    "_headers",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon.svg",
    "vendor/html2canvas.min.js",
    "solver-worker.js",
    "solver.js",
  ];
  for (const f of requiredFiles) {
    const full = path.join(mockWebDir, f);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    if (f === "sw.js" || f === "app.js") {
      fs.writeFileSync(full, 'const BUILD_VERSION = "__CACHE_VERSION__";');
    } else {
      fs.writeFileSync(full, "mock content for " + f);
    }
  }

  // Run build -> must succeed
  const stdout = execFileSync("node", ["scripts/build.mjs"], { cwd: tmpDir, encoding: "utf8" });
  assert.match(stdout, /Calculated asset content hash/);
  assert.match(stdout, /Stamped cache version/);

  // Verify dist/ contents
  assert.ok(fs.existsSync(path.join(mockDistDir, "index.html")));
  const builtSw = fs.readFileSync(path.join(mockDistDir, "sw.js"), "utf8");
  const builtApp = fs.readFileSync(path.join(mockDistDir, "app.js"), "utf8");
  assert.doesNotMatch(builtSw, /__CACHE_VERSION__/, "dist/sw.js must have placeholder replaced");
  assert.doesNotMatch(builtApp, /__CACHE_VERSION__/, "dist/app.js must have placeholder replaced");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Exact Decimal Math & Formatting: preserves huge amounts (1e26) and handles negative/comma styles", () => {
  const appCode = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

  const sliceCode = appCode.slice(
    appCode.indexOf("function parseDecimalScientific"),
    appCode.indexOf("function spentStepDigits")
  );

  const helperFns = new Function(
    sliceCode +
    "; return {" +
    " parseDecimalScientific," +
    " isValidDecimalString," +
    " isPositiveDecimal," +
    " decimalToBigIntCents," +
    " formatBigIntDecimal," +
    " roundBigIntCents," +
    " formatRoundedAmountBigInt," +
    " isMultiplierOne" +
    "};"
  )();

  const {
    isPositiveDecimal,
    decimalToBigIntCents,
    formatBigIntDecimal,
    roundBigIntCents,
    isMultiplierOne,
  } = helperFns;

  // 1. Scientific & non-standard decimal formats
  assert.equal(isPositiveDecimal(".5"), true);
  assert.equal(decimalToBigIntCents(".5"), 50n);
  assert.equal(isPositiveDecimal("5."), true);
  assert.equal(decimalToBigIntCents("5."), 500n);
  assert.equal(isPositiveDecimal("001"), true);
  assert.equal(decimalToBigIntCents("001"), 100n);
  assert.equal(isPositiveDecimal("1e2"), true);
  assert.equal(decimalToBigIntCents("1e2"), 10000n);

  // 2. Reject zero and negatives
  assert.equal(isPositiveDecimal("0"), false);
  assert.equal(isPositiveDecimal("0.0"), false);
  assert.equal(isPositiveDecimal("0e99"), false);
  assert.equal(isPositiveDecimal("-.1"), false);
  assert.equal(isPositiveDecimal("-100"), false);

  // 3. Huge amount 1e26
  const hugeCents = decimalToBigIntCents("1e26");
  assert.equal(hugeCents.toString(), "10000000000000000000000000000");

  const formattedComma = formatBigIntDecimal(hugeCents, 2, "comma_period");
  assert.equal(formattedComma, "100,000,000,000,000,000,000,000,000.00");

  const formattedPeriod = formatBigIntDecimal(hugeCents, 2, "period_comma");
  assert.equal(formattedPeriod, "100.000.000.000.000.000.000.000.000,00");

  // 4. Exact Multiplier Equality
  assert.equal(isMultiplierOne("1"), true);
  assert.equal(isMultiplierOne("1."), true);
  assert.equal(isMultiplierOne("1.e0"), true);
  assert.equal(isMultiplierOne("10e-1"), true);
  assert.equal(isMultiplierOne("1.0"), true);
  assert.equal(isMultiplierOne("1.000"), true);
  assert.equal(isMultiplierOne("1e0"), true);
  assert.equal(isMultiplierOne("0.1e1"), true);
  assert.equal(isMultiplierOne("001"), true);
  assert.equal(isMultiplierOne(".01e2"), true);
  assert.equal(isMultiplierOne(".001e3"), true);
  assert.equal(isMultiplierOne("0.0010e3"), true);
  assert.equal(isMultiplierOne("1e-1000000000"), false);
  assert.equal(isMultiplierOne("1.001"), false);
  assert.equal(isMultiplierOne("0.999"), false);
  assert.equal(isMultiplierOne("10"), false);

  // 5. Mathematical ROUND_HALF_UP rounding
  assert.equal(roundBigIntCents(1580n, 2), 1580n); // exact cents
  assert.equal(roundBigIntCents(1580n, 1), 158n); // $15.8
  assert.equal(roundBigIntCents(1580n, 0), 16n); // $16
  assert.equal(roundBigIntCents(1580n, -1), 2n); // unit 10 -> $20
});

test("Validation logic: row fixtures for blank populated name, empty skipping, duplicate name, safe-integer repeat", () => {
  const appCode = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

  const validatorFactory = new Function(
    appCode.slice(appCode.indexOf("function parseRepeatCount"), appCode.indexOf("function withMaxLength")) + "\n" +
    appCode.slice(appCode.indexOf("function parseDecimalScientific"), appCode.indexOf("function spentStepDigits")) + "\n" +
    appCode.slice(appCode.indexOf("function isFieldPopulated"), appCode.indexOf("function invalidatePendingState")) + "\n" +
    "return function validateRows(rowFixtures, multiplier, strictPref) {" +
    "  const multiplierInput = { value: multiplier || '1' };" +
    "  const repeatToggle = { checked: true };" +
    "  const extraPayToggle = { checked: true };" +
    "  const extraGetToggle = { checked: true };" +
    "  const strictPreferenceToggle = { checked: Boolean(strictPref) };" +
    "  const numberStyle = 'comma_period'; const t = (key, vars) => key;" +
    "  function rowList() {" +
    "    return rowFixtures.map(rf => ({" +
    "      querySelector(sel) {" +
    "        if (sel === '.name') return { value: rf.name ?? '' };" +
    "        if (sel === '.spent') return { value: String(rf.spent ?? '0') };" +
    "        if (sel === '.extra-pay') return { value: String(rf.extra_pay ?? '0') };" +
    "        if (sel === '.extra-get') return { value: String(rf.extra_get ?? '0') };" +
    "        if (sel === '.repeat') return { value: String(rf.repeat ?? '1') };" +
    "        if (sel === '.preferred') return { checked: Boolean(rf.preferred) };" +
    "        return null;" +
    "      }" +
    "    }));" +
    "  }" +
    "  return eval('(' + collectAndValidatePayload.toString() + ')()');" +
    "};"
  )();

  // Case 1: Unnamed row with 0.001 spending must NOT be skipped as empty; must error as blank populated!
  const res1 = validatorFactory([
    { name: "", spent: "0.001", extra_pay: "0", extra_get: "0", repeat: "1" }
  ]);
  assert.equal(res1.error, "error.blank_populated_name");

  // Case 2: Truly empty row is silently skipped
  const res2 = validatorFactory([
    { name: "", spent: "0", extra_pay: "0", extra_get: "0", repeat: "1", preferred: false },
    { name: "Alice", spent: "100", extra_pay: "0", extra_get: "0", repeat: "1", preferred: false }
  ]);
  assert.ok(res2.payload, "Must succeed when skipping truly empty row");
  assert.equal(res2.payload.rows.length, 1);
  assert.equal(res2.payload.rows[0].name, "Alice");
  assert.equal(res2.payload.rows[0].spent, "100");

  // Case 3: Duplicate participant name must error
  const res3 = validatorFactory([
    { name: "Alice", spent: "10", extra_pay: "0", extra_get: "0", repeat: "1" },
    { name: "Alice", spent: "20", extra_pay: "0", extra_get: "0", repeat: "1" }
  ]);
  assert.equal(res3.error, "error.duplicate_name");

  // Case 4: Non-safe-integer repeat must error
  const res4 = validatorFactory([
    { name: "Bob", spent: "10", extra_pay: "0", extra_get: "0", repeat: "9007199254740992" }
  ]);
  assert.equal(res4.error, "error.repeat_not_safe_integer");

  // Case 5: Compact payload verification (no main thread expansion, rows contains repeat)
  const res5 = validatorFactory([
    { name: "Charlie", spent: "50", extra_pay: "5", extra_get: "2", repeat: "5", preferred: true }
  ]);
  assert.ok(res5.payload);
  assert.equal(res5.payload.rows.length, 1);
  assert.equal(res5.payload.rows[0].name, "Charlie");
  assert.equal(res5.payload.rows[0].repeat, 5);
  assert.equal(res5.payload.rows[0].spent, "50");
  assert.equal(res5.payload.rows[0].extra_pay, "5");
  assert.equal(res5.payload.rows[0].extra_get, "2");
  assert.equal(res5.payload.rows[0].preferred, true);
});

test("CSS Specificity: .hidden overrides .calculating-banner display:flex", () => {
  const css = fs.readFileSync(path.join(webDir, "styles.css"), "utf8");
  assert.match(css, /\.hidden[^{]*\{[^}]*display:\s*none\s*!important/);
  assert.match(css, /\.calculating-banner\.hidden/);
});

test("UI Logic: parseRepeatCount validates people count and rounding notice checks original", () => {
  const appCode = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

  // Verify parseRepeatCount is used for people-count input
  assert.match(appCode, /const parsedCount = parseRepeatCount\(peopleCountInput\.value\);/);

  // Extract parseRepeatCount
  const parseRepeatCount = new Function(
    appCode.slice(appCode.indexOf("function parseRepeatCount"), appCode.indexOf("function withMaxLength")) + "; return parseRepeatCount;"
  )();

  assert.equal(parseRepeatCount("1.5"), null, "1.5 must be rejected");
  assert.equal(parseRepeatCount("0"), null, "0 must be rejected");
  assert.equal(parseRepeatCount("-1"), null, "-1 must be rejected");
  assert.equal(parseRepeatCount("3"), 3, "3 must be accepted");

  // Verify rounding notice checks data.original.rounding_notice
  assert.match(appCode, /data\.rounding_notice \|\| data\.original\?\.rounding_notice/);
  assert.match(appCode, /lastResultData\.rounding_notice \|\| lastResultData\.original\?\.rounding_notice/);
});

test("Plan View Rendering: handles plan.error safely, clears lists and avoids false transactions", () => {
  const appCode = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

  const fns = new Function(
    "const numberStyle = 'comma_period'; const t = (k, vars = {}) => { if (k === 'summary.template') return 'Transactions: ' + vars.transactions + ' | Burden penalty: ' + vars.burdenPenalty; return k; };" +
    appCode.slice(appCode.indexOf("function parseDecimalScientific"), appCode.indexOf("function spentStepDigits")) +
    appCode.slice(appCode.indexOf("function roleLabel"), appCode.indexOf("function parseDecimalScientific")) +
    appCode.slice(appCode.indexOf("function renderPlanIntoElements"), appCode.indexOf("function renderResult")) +
    appCode.slice(appCode.indexOf("function appendPlanLines"), appCode.indexOf("function resultLines")) +
    "; return { renderPlanIntoElements, appendPlanLines };"
  )();

  const { renderPlanIntoElements, appendPlanLines } = fns;

  class MockElement {
    constructor() {
      this.textContent = "";
      this._html = "";
      this.children = [];
      this.classList = {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      };
    }
    set innerHTML(val) {
      this._html = val;
      if (val === "") this.children = [];
    }
    get innerHTML() {
      return this._html; }
    appendChild(child) {
      this.children.push(child);
    }
  }

  const elements = {
    summaryEl: new MockElement(),
    balancesEl: new MockElement(),
    transfersEl: new MockElement(),
  };

  const successPlan = {
    summary: { transactions: 1, burden_penalty: 0 },
    balances: [{ name: "Alice", net: "10.00", role: "receiver" }],
    transfers: [{ from: "Bob", to: "Alice", amount: "10.00" }],
  };
  globalThis.document = { createElement: () => new MockElement() };

  renderPlanIntoElements(successPlan, 2, elements);
  assert.equal(elements.summaryEl.textContent, "Transactions: 1 | Burden penalty: 0");
  assert.equal(elements.summaryEl.classList.contains("error"), false);
  assert.equal(elements.balancesEl.children.length, 1);
  assert.equal(elements.transfersEl.children.length, 1);

  const errorPlan = {
    error: { message: "No feasible settlement found with current strict preference constraints.", resource: false },
  };

  renderPlanIntoElements(errorPlan, 2, elements);
  assert.equal(elements.summaryEl.textContent, "No feasible settlement found with current strict preference constraints.");
  assert.equal(elements.summaryEl.classList.contains("error"), true);
  assert.equal(elements.balancesEl.children.length, 0, "Balances list must be cleared on plan error");
  assert.equal(elements.transfersEl.children.length, 0, "Transfers list must be cleared on plan error");

  const lines = [];
  appendPlanLines(lines, "Multiplied Plan", errorPlan, 2);
  assert.equal(lines.length, 3);
  assert.equal(lines[0], "Multiplied Plan");
  assert.equal(lines[1], "");
  assert.equal(lines[2], "No feasible settlement found with current strict preference constraints.");
  assert.ok(!lines.some(l => l.includes("Transactions:")), "Must not include transaction count on error");
});
