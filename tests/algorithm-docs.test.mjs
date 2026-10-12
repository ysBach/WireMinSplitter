import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { generate } from "../scripts/algorithm-docs.mjs";

test("the app and docs/ALGORITHM*.md show the text in scripts/algorithm-content.mjs", () => {
  for (const [file, expected] of generate()) {
    const actual = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    assert.ok(actual === expected, path.basename(file) + " is out of date. Run npm run docs:algorithm.");
  }
});
