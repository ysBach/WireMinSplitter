// Calculate exact settlements with BigInt rational amounts.
//
// A plan with the fewest transfers has no cycle. Moving money around a cycle
// removes a transfer without adding transfers or increasing any payer's count.
// Thus, an optimal graph is a forest, a graph without cycles.
//
// A nonempty forest has a leaf, a participant with one transfer. Its transfer
// carries the leaf's whole remaining amount, the smaller remaining amount of the
// pair. Searching every active payer/receiver pair therefore reaches every
// minimum-transfer plan in soft and strict modes.
//
// The search caches states as sorted multisets. Merge payers only when their
// amount, preferred status, and previous-payment status match. Keep preferred
// and other payers separate because their penalties differ.

export class SettlementError extends Error {
  constructor(message) {
    super(message);
    this.name = "SettlementError";
  }
}

// Report a memory or stack failure without concluding whether a plan exists.
export class SettlementResourceError extends SettlementError {
  constructor(message) {
    super(message);
    this.name = "SettlementResourceError";
  }
}

// Valid input with no plan under the strict preference.
export class SettlementInfeasibleError extends SettlementError {
  constructor(message) {
    super(message);
    this.name = "SettlementInfeasibleError";
  }
}

const NAME_WHITESPACE = new Set(
  Array.from("\t\n\x0b\x0c\r \xa0\u1680\u2028\u2029\u202f\u205f\u3000\ufeff")
    .concat(Array.from({ length: 11 }, (_, k) => String.fromCharCode(0x2000 + k))),
);
const MAX_NAME_LENGTH = 120;
const DECIMAL_RE = /^([+-]?)([0-9]*)(?:\.([0-9]*))?(?:[eE]([+-]?[0-9]+))?$/;
const OPEN = Symbol("open");

// ---------- names ----------

export function compareCodePoints(a, b) {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const x = a.codePointAt(i);
    const y = b.codePointAt(j);
    if (x !== y) return x < y ? -1 : 1;
    i += x > 0xffff ? 2 : 1;
    j += y > 0xffff ? 2 : 1;
  }
  if (i < a.length) return 1;
  if (j < b.length) return -1;
  return 0;
}

export function cleanName(name) {
  if (typeof name !== "string") throw new SettlementError("Participant names must be text.");
  const text = name.normalize("NFC");
  let start = 0;
  let end = text.length;
  while (start < end && NAME_WHITESPACE.has(text[start])) start += 1;
  while (end > start && NAME_WHITESPACE.has(text[end - 1])) end -= 1;
  if (start === end) throw new SettlementError("Participant names must be non-empty.");
  return text.slice(start, end);
}

// ---------- exact rationals ----------

const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};
function rat(n, d = 1n) {
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return g > 1n ? { n: n / g, d: d / g } : { n, d };
}
const ZERO = rat(0n);
const ONE = rat(1n);
const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
const cmpRat = (a, b) => {
  const x = a.n * b.d;
  const y = b.n * a.d;
  return x < y ? -1 : x > y ? 1 : 0;
};
function floorDiv(n, d) {
  const q = n / d;
  return n % d !== 0n && n < 0n ? q - 1n : q;
}

function pow10(k) {
  try {
    return 10n ** k;
  } catch (error) {
    if (error instanceof RangeError) throw new SettlementResourceError("Monetary value is too large to compute.");
    throw error;
  }
}

// Parse a decimal string, BigInt, or safe-integer Number. The solver sets no size limit.
export function parseDecimal(value, field) {
  const invalid = () => new SettlementError("Invalid monetary value for " + field + ": " + String(value));
  if (typeof value === "bigint") return rat(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw invalid();
    return rat(BigInt(value));
  }
  if (typeof value !== "string") throw invalid();
  const match = DECIMAL_RE.exec(value);
  if (!match) throw invalid();
  const [, sign, whole = "", frac = "", exp] = match;
  if (whole.length + frac.length === 0) throw invalid();
  const digits = BigInt(whole + frac);
  if (digits === 0n) return ZERO;
  let exponent = 0n;
  if (exp !== undefined) {
    exponent = BigInt(exp.replace(/^[+-]/, ""));
    if (exp[0] === "-") exponent = -exponent;
  }
  const shift = exponent - BigInt(frac.length);
  const signed = sign === "-" ? -digits : digits;
  return shift >= 0n ? rat(signed * pow10(shift)) : rat(signed, pow10(-shift));
}

export function formatCents(cents) {
  const negative = cents < 0n;
  const magnitude = negative ? -cents : cents;
  const rest = (magnitude % 100n).toString().padStart(2, "0");
  return (negative ? "-" : "") + (magnitude / 100n).toString() + "." + rest;
}

// ---------- balances ----------

// people: [{name (clean), spent, pay, get}] with rational amounts.
function balancedNets(people, multiplier) {
  if (people.length === 0) throw new SettlementError("At least one participant is required.");
  const seen = new Set();
  for (const person of people) {
    if (seen.has(person.name)) throw new SettlementError("Duplicate participant name: " + person.name);
    seen.add(person.name);
    if (person.spent.n < 0n) {
      throw new SettlementError("'spent' cannot be negative for participant: " + person.name);
    }
  }
  let pay = ZERO;
  let get = ZERO;
  let total = ZERO;
  for (const person of people) {
    pay = add(pay, person.pay);
    get = add(get, person.get);
    total = add(total, person.spent);
  }
  if (cmpRat(pay, get) !== 0) {
    throw new SettlementError("Infeasible adjustments: total extra_get must equal total extra_pay.");
  }
  const share = rat(total.n, total.d * BigInt(people.length));
  const scale = mul(rat(100n), multiplier);
  const ideals = people.map((p) => mul(scale, add(sub(p.spent, share), sub(p.get, p.pay))));
  const cents = ideals.map((v) => floorDiv(v.n, v.d));
  const remainders = ideals.map((v, k) => rat(v.n - cents[k] * v.d, v.d));
  let missing = -cents.reduce((a, b) => a + b, 0n);
  if (missing < 0n || missing >= BigInt(people.length)) {
    throw new SettlementError("Internal error: balances do not sum to zero.");
  }
  const order = people
    .map((_, k) => k)
    .sort((a, b) => cmpRat(remainders[b], remainders[a]) || compareCodePoints(people[a].name, people[b].name));
  for (let k = 0; missing > 0n; k += 1, missing -= 1n) cents[order[k]] += 1n;
  return {
    balances: people.map((p, k) => ({ name: p.name, cents: cents[k] })),
    notice: ideals.some((v) => v.d !== 1n),
  };
}

// members: [{name, spent_cents, extra_pay_cents, extra_get_cents}] with BigInt cents.
export function computeNetBalances(members) {
  const cents = (value, field) => {
    if (typeof value !== "bigint") throw new SettlementError(field + " must be a BigInt.");
    return rat(value, 100n);
  };
  const people = members.map((m) => ({
    name: cleanName(m.name),
    spent: cents(m.spent_cents ?? 0n, "spent_cents"),
    pay: cents(m.extra_pay_cents ?? 0n, "extra_pay_cents"),
    get: cents(m.extra_get_cents ?? 0n, "extra_get_cents"),
  }));
  return balancedNets(people, ONE).balances;
}

// ---------- transfer search ----------

const cmpBig = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const cmpPayer = (x, y) => cmpBig(x.a, y.a) || x.p - y.p || x.s - y.s;
const samePayer = (x, y) => x.a === y.a && x.p === y.p && x.s === y.s;

function closedForm(payers, receivers, strict) {
  const count = payers.length;
  if (count === 0) return { count: 0, pen: 0 };
  if (count === 1) {
    const { p, s } = payers[0];
    const edges = receivers.length;
    if (p) return { count: edges, pen: 0 };
    if (strict) return s + edges > 1 ? null : { count: edges, pen: 0 };
    return { count: edges, pen: s ? edges : edges - 1 };
  }
  if (receivers.length === 1) {
    const extra = payers.filter((x) => x.s && !x.p).length;
    if (strict && extra) return null;
    return { count, pen: extra };
  }
  return OPEN;
}

function listMoves(payers, receivers) {
  const moves = [];
  for (let i = 0; i < payers.length; i += 1) {
    if (i > 0 && samePayer(payers[i], payers[i - 1])) continue;
    for (let j = 0; j < receivers.length; j += 1) {
      if (j > 0 && receivers[j] === receivers[j - 1]) continue;
      moves.push([i, j]);
    }
  }
  return moves;
}

function applyMove(payers, receivers, i, j) {
  const { a, p } = payers[i];
  const need = receivers[j];
  const moved = a < need ? a : need;
  const nextP = payers.filter((_, k) => k !== i);
  if (a > moved) nextP.push({ a: a - moved, p, s: 1 });
  nextP.sort(cmpPayer);
  const nextR = receivers.filter((_, k) => k !== j);
  if (need > moved) nextR.push(need - moved);
  nextR.sort(cmpBig);
  return [nextP, nextR];
}

const stateKey = (payers, receivers) =>
  payers.map((x) => x.a + "," + x.p + "," + x.s).join(";") + "|" + receivers.join(",");

// Iterative depth-first search. Stores the best (count, penalty, move) per state.
function fillMemo(startP, startR, strict, memo) {
  const stack = [{ p: startP, r: startR, moves: listMoves(startP, startR), next: 0, best: null }];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    let descended = false;
    while (frame.next < frame.moves.length) {
      const [i, j] = frame.moves[frame.next];
      const cost = frame.p[i].s && !frame.p[i].p ? 1 : 0;
      if (strict && cost) {
        frame.next += 1;
        continue;
      }
      const [nextP, nextR] = applyMove(frame.p, frame.r, i, j);
      if (frame.best !== null && 1 + Math.max(nextP.length, nextR.length) > frame.best.count) {
        frame.next += 1;
        continue;
      }
      let value = closedForm(nextP, nextR, strict);
      if (value === OPEN) {
        const key = stateKey(nextP, nextR);
        if (!memo.has(key)) {
          stack.push({ p: nextP, r: nextR, moves: listMoves(nextP, nextR), next: 0, best: null });
          descended = true;
          break;
        }
        value = memo.get(key);
      }
      frame.next += 1;
      if (value === null) continue;
      const count = 1 + value.count;
      const pen = cost + value.pen;
      if (frame.best === null || count < frame.best.count || (count === frame.best.count && pen < frame.best.pen)) {
        frame.best = { count, pen, i, j };
      }
    }
    if (descended) continue;
    memo.set(stateKey(frame.p, frame.r), frame.best);
    stack.pop();
  }
}

// balances: [{name, cents: BigInt}]. Returns {transfers: [{payer, receiver, cents}], penalty}.
// The search is exact with no size limit; run time can grow exponentially.
export function optimizeTransfers(balances, preferredNames = [], strict = false) {
  const seen = new Set();
  const payers = [];
  const receivers = [];
  let total = 0n;
  for (const balance of balances) {
    if (typeof balance.cents !== "bigint") throw new SettlementError("Balance cents must be a BigInt.");
    const name = cleanName(balance.name);
    if (seen.has(name)) throw new SettlementError("Duplicate participant name: " + name);
    seen.add(name);
    total += balance.cents;
    if (balance.cents < 0n) payers.push({ a: -balance.cents, name });
    else if (balance.cents > 0n) receivers.push({ a: balance.cents, name });
  }
  if (total !== 0n) throw new SettlementError("Internal mismatch: payer and receiver totals differ.");
  if (payers.length === 0) return { transfers: [], penalty: 0 };
  const wanted = new Set(preferredNames.map(cleanName));
  let actualP = payers
    .map((x) => ({ a: x.a, p: wanted.has(x.name) ? 1 : 0, s: 0, name: x.name }))
    .sort((x, y) => cmpPayer(x, y) || compareCodePoints(x.name, y.name));
  let actualR = receivers.sort((x, y) => cmpBig(x.a, y.a) || compareCodePoints(x.name, y.name));
  const startP = actualP.map(({ a, p, s }) => ({ a, p, s }));
  const startR = actualR.map((x) => x.a);
  const memo = new Map();
  let root;
  try {
    root = closedForm(startP, startR, strict);
    if (root === OPEN) {
      fillMemo(startP, startR, strict, memo);
      root = memo.get(stateKey(startP, startR));
    }
  } catch (error) {
    if (error instanceof RangeError) {
      throw new SettlementResourceError("The search ran out of resources; no feasibility conclusion is possible.");
    }
    throw error;
  }
  if (root === null) {
    throw new SettlementInfeasibleError("No feasible settlement found with current strict preference constraints.");
  }

  const transfers = [];
  while (actualP.length > 0) {
    if (actualP.length === 1) {
      for (const r of actualR) transfers.push({ payer: actualP[0].name, receiver: r.name, cents: r.a });
      break;
    }
    if (actualR.length === 1) {
      for (const x of actualP) transfers.push({ payer: x.name, receiver: actualR[0].name, cents: x.a });
      break;
    }
    const { i, j } = memo.get(stateKey(actualP, actualR.map((x) => x.a)));
    const payer = actualP[i];
    const receiver = actualR[j];
    const moved = payer.a < receiver.a ? payer.a : receiver.a;
    transfers.push({ payer: payer.name, receiver: receiver.name, cents: moved });
    actualP = actualP.filter((_, k) => k !== i);
    if (payer.a > moved) actualP.push({ a: payer.a - moved, p: payer.p, s: 1, name: payer.name });
    actualP.sort((x, y) => cmpPayer(x, y) || compareCodePoints(x.name, y.name));
    actualR = actualR.filter((_, k) => k !== j);
    if (receiver.a > moved) actualR.push({ a: receiver.a - moved, name: receiver.name });
    actualR.sort((x, y) => cmpBig(x.a, y.a) || compareCodePoints(x.name, y.name));
  }
  transfers.sort((x, y) => compareCodePoints(x.payer, y.payer) || compareCodePoints(x.receiver, y.receiver));
  return { transfers, penalty: root.pen };
}

// ---------- compact rows ----------

function parseRepeat(value) {
  if (value === undefined || value === null) return 1;
  let number = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^[0-9]+$/.test(trimmed)) number = NaN;
    else number = Number.parseInt(trimmed, 10);
  }
  if (typeof number !== "number" || !Number.isSafeInteger(number) || number < 1) {
    throw new SettlementError("Repeat must be a positive safe integer.");
  }
  return number;
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return Array.from(text).slice(0, maxLength).join("");
}

function uniquify(base, used) {
  let candidate = cleanName(truncate(base, MAX_NAME_LENGTH));
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  for (let serial = 2; ; serial += 1) {
    const suffix = " (" + serial + ")";
    candidate = cleanName(truncate(base, Math.max(1, MAX_NAME_LENGTH - suffix.length)) + suffix);
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
}

// Expand rows into people and preferred names. Each row contains name, repeat,
// spent, extra_pay, extra_get, and preferred.
// Repeated rows receive suffixes such as " 01" and " 02". Pad each suffix to the
// digit count of the repeat value. Reject typed duplicate names. Resolve name
// collisions only for generated names. Limit names to 120 code points.
export function expandRows(rows) {
  if (!Array.isArray(rows)) throw new SettlementError("'rows' must be a list.");
  const typed = new Set();
  const parsed = rows.map((row) => {
    if (row === null || typeof row !== "object") throw new SettlementError("Each row must be an object.");
    const name = cleanName(row.name);
    if (typed.has(name)) throw new SettlementError("Duplicate participant name: " + name);
    typed.add(name);
    if (row.preferred !== undefined && typeof row.preferred !== "boolean") {
      throw new SettlementError("'preferred' must be true or false.");
    }
    return { row, name, repeat: parseRepeat(row.repeat) };
  });
  // Typed single rows keep their names. Reserve them first so a generated name
  // can never take one.
  const used = new Set();
  const names = new Map();
  for (const entry of parsed) {
    if (entry.repeat !== 1) continue;
    const name = cleanName(truncate(entry.name, MAX_NAME_LENGTH));
    if (used.has(name)) throw new SettlementError("Duplicate participant name: " + name);
    used.add(name);
    names.set(entry, [name]);
  }
  // Generate repeated-row names in code point order of the typed name, so the
  // result does not depend on the order of the rows.
  const repeated = parsed
    .filter((entry) => entry.repeat !== 1)
    .sort((a, b) => compareCodePoints(a.name, b.name));
  for (const entry of repeated) {
    const width = String(entry.repeat).length;
    const generated = [];
    for (let index = 0; index < entry.repeat; index += 1) {
      const suffix = " " + String(index + 1).padStart(width, "0");
      const base = truncate(entry.name, Math.max(1, MAX_NAME_LENGTH - suffix.length)) + suffix;
      generated.push(uniquify(base, used));
    }
    names.set(entry, generated);
  }
  const people = [];
  const preferred = [];
  for (const entry of parsed) {
    for (const name of names.get(entry)) {
      people.push({ name, spent: entry.row.spent, extra_pay: entry.row.extra_pay, extra_get: entry.row.extra_get });
      if (entry.row.preferred === true) preferred.push(name);
    }
  }
  return { people, preferred };
}

// ---------- settlement ----------

const orDefault = (value, fallback) => (value === undefined || value === null || value === "" ? fallback : value);

function toResult(people, multiplier, preferred, strict) {
  const { balances, notice } = balancedNets(people, multiplier);
  const { transfers, penalty } = optimizeTransfers(balances, preferred, strict);
  return {
    summary: { transactions: transfers.length, burden_penalty: penalty },
    balances: balances.map((b) => ({
      name: b.name,
      net: formatCents(b.cents),
      role: b.cents < 0n ? "payer" : b.cents > 0n ? "receiver" : "settled",
    })),
    transfers: transfers.map((t) => ({ from: t.payer, to: t.receiver, amount: formatCents(t.cents) })),
    rounding_notice: notice,
  };
}

// payload: {people | rows, multiplier, preferred_multi_payers, strict_preference}.
// Return {summary, balances, transfers, rounding_notice} for a successful plan.
// A multiplier other than 1 adds an independently calculated "original" view.
// Each multiplied view contains its plan or {error: {message, resource: false}}
// when its strict plan is infeasible. Invalid inputs and resource failures throw
// exceptions.
export function solveSettlement(payload) {
  if (payload === null || typeof payload !== "object") throw new SettlementError("Payload must be an object.");
  let rawPeople = payload.people;
  let preferred = payload.preferred_multi_payers || [];
  if (Array.isArray(payload.rows)) {
    const expanded = expandRows(payload.rows);
    rawPeople = expanded.people;
    preferred = expanded.preferred;
  }
  if (!Array.isArray(rawPeople)) throw new SettlementError("'people' must be a list.");
  if (!Array.isArray(preferred) || !preferred.every((name) => typeof name === "string")) {
    throw new SettlementError("'preferred_multi_payers' must be a list of names.");
  }
  const strict = payload.strict_preference === undefined ? false : payload.strict_preference;
  if (typeof strict !== "boolean") throw new SettlementError("'strict_preference' must be true or false.");
  const factor = parseDecimal(orDefault(payload.multiplier, 1), "multiplier");
  if (factor.n <= 0n) throw new SettlementError("multiplier must be greater than 0");
  const people = rawPeople.map((item) => {
    if (item === null || typeof item !== "object") throw new SettlementError("Each participant must be an object.");
    return {
      name: cleanName(item.name),
      spent: parseDecimal(orDefault(item.spent, 0), "spent"),
      pay: parseDecimal(orDefault(item.extra_pay, 0), "extra_pay"),
      get: parseDecimal(orDefault(item.extra_get, 0), "extra_get"),
    };
  });
  if (cmpRat(factor, ONE) === 0) return toResult(people, ONE, preferred, strict);
  const result = solveView(people, factor, preferred, strict);
  result.original = solveView(people, ONE, preferred, strict);
  return result;
}

// Return a multiplied view's plan or its own strict-mode error. Only a strict
// no-plan result becomes an error object. Invalid inputs and resource failures
// throw exceptions.
function solveView(people, multiplier, preferred, strict) {
  try {
    return toResult(people, multiplier, preferred, strict);
  } catch (error) {
    if (error instanceof SettlementInfeasibleError) {
      return { error: { message: error.message, resource: false } };
    }
    throw error;
  }
}
