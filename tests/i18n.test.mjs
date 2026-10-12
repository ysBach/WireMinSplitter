import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../web/app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../web/index.html", import.meta.url), "utf8");
const prefix = "const TRANSLATIONS = ";
const start = app.indexOf(prefix) + prefix.length;
const TRANSLATIONS = new Function("return " + app.slice(start, app.indexOf("\n};\n", start) + 2))();

const keysFor = (attribute) => [...html.matchAll(new RegExp(attribute + '="([^"]+)"', "g"))].map((match) => match[1]);
const textKeys = keysFor("data-i18n");
const mathKeys = keysFor("data-i18n-math");

test("every language translates each text and math key on the page", () => {
  assert.ok(mathKeys.length > 0);
  for (const [language, table] of Object.entries(TRANSLATIONS)) {
    for (const key of [...textKeys, ...mathKeys]) {
      assert.equal(typeof table[key], "string", language + ": missing " + key);
    }
  }
});

test("inline math markers are paired, and plain text keys contain none", () => {
  for (const [language, table] of Object.entries(TRANSLATIONS)) {
    for (const key of mathKeys) {
      assert.equal(table[key].split("$").length % 2, 1, language + ": unpaired $ in " + key);
    }
    for (const key of textKeys) {
      assert.ok(!table[key].includes("$"), language + ": $ in plain text key " + key);
    }
  }
});

