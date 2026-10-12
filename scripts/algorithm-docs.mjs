// Copy the algorithm text from scripts/algorithm-content.mjs into the web page and
// docs/ALGORITHM*.md. Run "npm run docs:algorithm" after each change to that file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BLOCKS, FORMULAS, LANGUAGES, TEXT } from "./algorithm-content.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_HTML = path.join(ROOT, "web", "index.html");
const APP_JS = path.join(ROOT, "web", "app.js");
const NOTE = "edit scripts/algorithm-content.mjs, then run npm run docs:algorithm";
const HTML_BEGIN = "      <!-- BEGIN generated algorithm section: " + NOTE + " -->";
const HTML_END = "      <!-- END generated algorithm section -->";
const JS_BEGIN = "    // BEGIN generated algorithm text: " + NOTE;
const JS_END = "    // END generated algorithm text";

// Same inline math grammar as inlineMath() in web/app.js.
const MATH_TOKEN_RE = /[A-Za-z]{2,}|[A-Za-zα-ω∅]|\d+|_[A-Za-z0-9]+|\S/gu;
const TEX_SYMBOLS = {
  "⌊": "\\lfloor ",
  "⌋": "\\rfloor ",
  "≤": "\\le ",
  "≥": "\\ge ",
  "≠": "\\ne ",
  "−": "-",
  "∈": "\\in ",
  "δ": "\\delta ",
  "∅": "\\varnothing ",
  "<": "\\lt ",
  ">": "\\gt ",
};

const EN = TEXT.en;
const KEYS = ["title"];
const PLAIN_KEYS = new Set(["title"]);
for (const block of BLOCKS) {
  const headKeys = (block.head ?? []).map((cell) => cell.key).filter(Boolean);
  KEYS.push(...[block.key, ...(block.keys ?? []), ...(block.items ?? []).map((item) => item[1]), ...headKeys].filter(Boolean));
  if (["h3", "h4", "source"].includes(block.type)) PLAIN_KEYS.add(block.key);
  for (const key of headKeys) PLAIN_KEYS.add(key);
}

const markdownFile = (language) => path.join(ROOT, "docs", language === "en" ? "ALGORITHM.md" : "ALGORITHM." + language + ".md");
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Element with translated text. Text with $...$ math uses data-i18n-math.
function textElement(tag, key, attributes = "") {
  const attribute = PLAIN_KEYS.has(key) ? "data-i18n" : "data-i18n-math";
  return "<" + tag + attributes + " " + attribute + '="algorithm.' + key + '">' + escapeHtml(EN[key]) + "</" + tag + ">";
}

// Element with language-neutral inline math. web/app.js fills it.
function mathElement(tag, source, attributes = "") {
  return "<" + tag + attributes + ' data-math="' + escapeHtml(source) + '"></' + tag + ">";
}

function htmlSection() {
  const lines = [
    HTML_BEGIN,
    '      <details id="algorithm-details" class="card algorithm-details" data-html2canvas-ignore="true">',
    '        <summary data-i18n="algorithm.title">' + escapeHtml(EN.title) + "</summary>",
    '        <div class="algorithm-body">',
  ];
  const add = (indent, ...items) => lines.push(...items.map((item) => " ".repeat(indent) + item));
  for (const block of BLOCKS) {
    if (block.type === "h3" || block.type === "h4") {
      lines.push("");
      add(8, textElement(block.type, block.key));
    } else if (block.type === "p") {
      add(8, textElement("p", block.key));
    } else if (block.type === "ul" || block.type === "ol") {
      add(8, "<" + block.type + ">");
      add(10, ...block.keys.map((key) => textElement("li", key)));
      add(8, "</" + block.type + ">");
    } else if (block.type === "formula") {
      add(8, '<div class="math-block">');
      add(10, '<math display="block">');
      add(12, ...FORMULAS[block.name].mathml);
      add(10, "</math>");
      add(8, "</div>");
    } else if (block.type === "defs") {
      add(8, '<dl class="math-defs">');
      for (const [math, key] of block.items) add(10, mathElement("dt", math), textElement("dd", key));
      add(8, "</dl>");
    } else if (block.type === "table") {
      add(8, '<div class="algorithm-table-scroll">');
      add(10, '<table class="algorithm-example">');
      add(12, "<thead>");
      add(14, "<tr>");
      add(16, ...block.head.map((cell) => (cell.key ? textElement("th", cell.key, ' scope="col"') : mathElement("th", cell.math, ' scope="col"'))));
      add(14, "</tr>");
      add(12, "</thead>");
      add(12, "<tbody>");
      for (const [name, ...cells] of block.rows) {
        add(14, '<tr><th scope="row">' + escapeHtml(name) + "</th>" + cells.map((cell) => "<td>" + escapeHtml(cell) + "</td>").join("") + "</tr>");
      }
      add(12, "</tbody>");
      add(10, "</table>");
      add(8, "</div>");
    } else if (block.type === "source") {
      add(8, '<p><a data-i18n="algorithm.' + block.key + '" href="./' + block.href + '" target="_blank" rel="noopener">' + escapeHtml(EN[block.key]) + "</a></p>");
    } else {
      throw new Error("Unknown block type: " + block.type);
    }
  }
  lines.push("        </div>", "      </details>", HTML_END);
  return lines.join("\n");
}

// Replace the text between the generated-section markers in web/app.js, once per language.
function appWithText(source) {
  const lines = source.split("\n");
  const output = [];
  const done = new Set();
  let language = null;
  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index].match(/^ {2}"?([a-z]{2})"?: \{$/);
    if (header) language = header[1];
    if (lines[index] !== JS_BEGIN) {
      output.push(lines[index]);
      continue;
    }
    const stop = lines.indexOf(JS_END, index);
    if (stop < 0 || !TEXT[language] || done.has(language)) {
      throw new Error("web/app.js: bad generated text markers near line " + (index + 1) + ".");
    }
    output.push(JS_BEGIN, ...KEYS.map((key) => '    "algorithm.' + key + '": ' + JSON.stringify(TEXT[language][key]) + ","), JS_END);
    done.add(language);
    index = stop;
  }
  const missing = Object.keys(LANGUAGES).filter((code) => !done.has(code));
  if (missing.length) throw new Error("web/app.js: no generated text markers for " + missing.join(", ") + ".");
  return output.join("\n");
}

function htmlWithSection(source) {
  const start = source.indexOf(HTML_BEGIN);
  const stop = source.indexOf(HTML_END, start);
  if (start < 0 || stop < 0) throw new Error("web/index.html: generated section markers are missing.");
  return source.slice(0, start) + htmlSection() + source.slice(stop + HTML_END.length);
}

// Convert inline math such as "min(a_i, r_j)" to TeX for GitHub Markdown.
function tex(source) {
  let output = "";
  for (const token of source.match(MATH_TOKEN_RE) ?? []) {
    if (token.length > 1 && token[0] === "_") output += "_{" + token.slice(1) + "}";
    else if (/^[A-Za-z]{2,}$/.test(token)) output += (token === "min" || token === "max" ? "\\" + token : "\\operatorname{" + token + "}") + " ";
    else output += TEX_SYMBOLS[token] ?? token;
  }
  return output.trim();
}

const markdownText = (text) => text.split("$").map((part, index) => (index % 2 === 1 ? "$" + tex(part) + "$" : part)).join("");

function markdown(language) {
  const text = TEXT[language];
  const links = Object.entries(LANGUAGES).map(([code, name]) => (code === language ? name : "[" + name + "](" + path.basename(markdownFile(code)) + ")"));
  const lines = ["<!-- Generated file: " + NOTE + ". -->", "", "# " + text.title, "", links.join(" · "), ""];
  for (const block of BLOCKS) {
    if (block.type === "h3") lines.push("## " + text[block.key], "");
    else if (block.type === "h4") lines.push("### " + text[block.key], "");
    else if (block.type === "p") lines.push(markdownText(text[block.key]), "");
    else if (block.type === "ul") lines.push(...block.keys.map((key) => "- " + markdownText(text[key])), "");
    else if (block.type === "ol") lines.push(...block.keys.map((key, index) => index + 1 + ". " + markdownText(text[key])), "");
    else if (block.type === "formula") lines.push("$$", FORMULAS[block.name].tex, "$$", "");
    else if (block.type === "defs") lines.push(...block.items.map(([math, key]) => "- $" + tex(math) + "$: " + markdownText(text[key])), "");
    else if (block.type === "table") {
      const head = block.head.map((cell) => (cell.key ? text[cell.key] : "$" + tex(cell.math) + "$"));
      lines.push("| " + head.join(" | ") + " |", "| " + head.map((_, index) => (index === 0 ? "---" : "---:")).join(" | ") + " |");
      lines.push(...block.rows.map((row) => "| " + row.join(" | ") + " |"), "");
    } else if (block.type === "source") lines.push("[" + text[block.key] + "](../web/" + block.href + ")", "");
    else throw new Error("Unknown block type: " + block.type);
  }
  return lines.join("\n").trimEnd() + "\n";
}

/**
 * Return the expected content of every generated file, keyed by absolute path.
 * Throws if a language misses a key or has a key that the layout does not use.
 */
export function generate() {
  for (const language of Object.keys(LANGUAGES)) {
    const keys = Object.keys(TEXT[language] ?? {});
    const missing = KEYS.filter((key) => !keys.includes(key));
    const unused = keys.filter((key) => !KEYS.includes(key));
    if (missing.length || unused.length) {
      throw new Error(language + ": missing [" + missing.join(", ") + "], unused [" + unused.join(", ") + "].");
    }
  }
  const files = new Map([
    [INDEX_HTML, htmlWithSection(fs.readFileSync(INDEX_HTML, "utf8"))],
    [APP_JS, appWithText(fs.readFileSync(APP_JS, "utf8"))],
  ]);
  for (const language of Object.keys(LANGUAGES)) files.set(markdownFile(language), markdown(language));
  return files;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  for (const [file, content] of generate()) {
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log("Updated " + path.relative(ROOT, file));
  }
}
