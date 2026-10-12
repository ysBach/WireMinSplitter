import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "web");
const distDir = path.join(rootDir, "dist");

const CRITICAL_FILES = [
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

function verifySanity() {
  for (const rel of CRITICAL_FILES) {
    const full = path.join(webDir, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`Build sanity check failed: Missing critical file "${rel}" in web/`);
    }
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function shouldCopy(srcPath) {
  const base = path.basename(srcPath);
  if (base === ".DS_Store" || base.endsWith(".map") || base.endsWith("~") || base.startsWith(".git")) {
    return false;
  }
  return true;
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (!shouldCopy(srcPath)) {
      continue;
    }
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function computeContentHash(files) {
  // Hash source INCLUDING sw.js template and all app assets, BEFORE replacement.
  const hash = crypto.createHash("sha256");
  const sortedFiles = [...files].sort();
  for (const file of sortedFiles) {
    const rel = path.relative(distDir, file);
    hash.update(rel);
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

function build() {
  console.log("Checking build sanity...");
  verifySanity();

  console.log("Building static frontend into dist/...");
  removeDir(distDir);
  copyDirRecursive(webDir, distDir);

  const distFiles = getAllFiles(distDir);
  const contentHash = computeContentHash(distFiles);
  console.log("Calculated asset content hash (pre-replacement):", contentHash);

  // Replace __CACHE_VERSION__ in dist/sw.js
  const swPath = path.join(distDir, "sw.js");
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, "utf8");
    const updatedSw = swContent.replace(/__CACHE_VERSION__/g, contentHash);
    fs.writeFileSync(swPath, updatedSw, "utf8");
    console.log("Stamped cache version in dist/sw.js:", contentHash);
  }

  // Replace __CACHE_VERSION__ in dist/app.js
  const appPath = path.join(distDir, "app.js");
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, "utf8");
    const updatedApp = appContent.replace(/__CACHE_VERSION__/g, contentHash);
    fs.writeFileSync(appPath, updatedApp, "utf8");
    console.log("Stamped cache version in dist/app.js:", contentHash);
  }

  console.log("Build complete: dist/ populated with", distFiles.length, "files.");
}

build();

