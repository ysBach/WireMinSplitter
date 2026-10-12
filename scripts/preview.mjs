import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("dist");
const port = Number(process.env.PORT || "8080");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

// Apply the same static header rules that Cloudflare Pages reads from _headers.
const headerRules = [];
let currentRule;
for (const line of (await readFile(resolve(root, "_headers"), "utf8")).split(/\r?\n/)) {
  if (!line.trim() || line.trimStart().startsWith("#")) continue;
  if (!/^\s/.test(line)) {
    currentRule = { path: line.trim(), headers: {} };
    headerRules.push(currentRule);
  } else if (currentRule) {
    const separator = line.indexOf(":");
    if (separator !== -1) {
      currentRule.headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
  }
}

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const filename = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!filename.startsWith(root + sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(filename);
    const configuredHeaders = {};
    for (const rule of headerRules) {
      const matches = rule.path.endsWith("*")
        ? pathname.startsWith(rule.path.slice(0, -1))
        : pathname === rule.path;
      if (matches) Object.assign(configuredHeaders, rule.headers);
    }
    response.writeHead(200, {
      "Content-Type": types[extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
      ...configuredHeaders,
    }).end(body);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500).end("File unavailable. Run npm run build first.");
  }
}).listen(port, "127.0.0.1", () => {
  console.info(`MoneySplit preview: http://127.0.0.1:${port}`);
});
