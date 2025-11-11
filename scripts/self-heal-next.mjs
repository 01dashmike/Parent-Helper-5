#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function log(msg) {
  console.log(`[self-heal-next] ${msg}`);
}

function killPort3000() {
  try {
    // macOS / Linux
    execSync("lsof -ti:3000 | xargs kill -9", { stdio: "ignore" });
  } catch {}
  try {
    // Windows (best effort)
    execSync(
      'for /f "tokens=5" %a in (\'netstat -a -n -o ^| findstr :3000 ^| findstr LISTENING\') do taskkill /f /pid %a',
      { stdio: "ignore", shell: "cmd.exe" }
    );
  } catch {}
  log("Killed processes on port 3000");
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeFileIfMissing(p, contents, onCreateMsg) {
  if (!fs.existsSync(p)) {
    ensureDir(path.dirname(p));
    fs.writeFileSync(p, contents);
    if (onCreateMsg) log(onCreateMsg);
  }
}

function overwriteIfInvalid(p, isInvalid, contents, onFixMsg) {
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, "utf8");
  if (isInvalid(txt)) {
    fs.writeFileSync(p, contents);
    if (onFixMsg) log(onFixMsg);
  }
}

function cleanNextCache(cwd) {
  const nextDir = path.join(cwd, ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    log("Cleared .next directory");
  }
}

function ensureManifestStubs(cwd) {
  const serverDir = path.join(cwd, ".next", "server");
  ensureDir(serverDir);
  // Required manifest placeholders (do NOT read them at runtime)
  const REQUIRED_JSON = [
    "middleware-manifest.json",
    "build-manifest.json",
    "app-paths-manifest.json",
    "app-path-routes-manifest.json",
    "required-server-files.json",
    "pages-manifest.json",
  ];

  for (const f of REQUIRED_JSON) {
    const p = path.join(serverDir, f);
    writeFileIfMissing(p, "{}", `stubbed ${f} ✅`);
  }

  // Good _document.js stub (prevents hydration warnings)
  const pagesDir = path.join(serverDir, "pages");
  ensureDir(pagesDir);

  const documentPath = path.join(pagesDir, "_document.js");
  const GOOD_DOCUMENT = `
const React = require("react");
const { Html, Head, Main, NextScript } = require("next/document");
function Document() {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      "body",
      null,
      React.createElement(Main, null),
      React.createElement(NextScript, null)
    )
  );
}
module.exports = Document;
module.exports.__esModule = true;
module.exports.default = Document;
`.trim();

  writeFileIfMissing(documentPath, GOOD_DOCUMENT, "stubbed _document.js ✅");
  overwriteIfInvalid(
    documentPath,
    (txt) => !txt.includes("Html") || txt.includes("return null"),
    GOOD_DOCUMENT,
    "repaired invalid _document.js stub ✅"
  );

  // Safe _app.js stub (prevents legacy bad stubs)
  const appPath = path.join(pagesDir, "_app.js");
  const GOOD_APP = `
const React = require("react");
function App({ Component, pageProps }) {
  return React.createElement(Component, pageProps);
}
module.exports = App;
module.exports.__esModule = true;
module.exports.default = App;
`.trim();

  if (!fs.existsSync(appPath)) {
    fs.writeFileSync(appPath, GOOD_APP);
    log("stubbed _app.js ✅");
  } else {
    overwriteIfInvalid(
      appPath,
      (txt) => txt.includes("return null") || !txt.includes("Component"),
      GOOD_APP,
      "repaired invalid _app.js stub ✅"
    );
  }
}

function main() {
  const cwd = process.cwd();
  killPort3000();
  cleanNextCache(cwd);
  ensureManifestStubs(cwd);
  log("Self-heal complete.");
}

main();
