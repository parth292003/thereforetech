#!/usr/bin/env node
// Copy lint (docs/PLAN.md §0). Fails the build when copy breaks a ground rule.
//
//   1. Brand name: "Therefore" must always be followed by "Tech". "Theirfor" never appears.
//   2. Never "consultancy".
//   3. No AI buzzwords outside /work/ (case-study) pages.
//   4. NDA blocklist: terms tied to the excluded engagement never appear anywhere in the repo or the
//      built site. The list itself is never committed: it is read from the git-ignored file
//      `.nda-blocklist` (one term per line) or the NDA_BLOCKLIST environment variable (CI secret).
//
// Usage: node scripts/copy-lint.js        (run after a build; scans _site, src, docs and root files)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IS_CI = !!process.env.CI;

const BRAND_RULES = [
  { id: "brand-name", re: /\btherefore\b(?!(?:\s|&nbsp;|&#160;)+tech\b)/gi, msg: '"Therefore" must be written as "Therefore Tech"' },
  { id: "misspelling", re: /theirfor/gi, msg: 'Misspelling "Theirfor"' },
  { id: "consultancy", re: /\bconsultanc(?:y|ies)\b/gi, msg: 'Never use "consultancy"' },
];

const BUZZWORDS = [
  "cutting-edge", "cutting edge", "AI-powered", "AI powered", "AI-driven", "AI driven", "RAG", "LLM", "LLMs",
  "large language model", "large language models", "agentic", "AI agent", "AI agents", "next-gen", "next generation AI",
  "state-of-the-art", "revolutionary", "revolutionise", "revolutionize", "game-changing", "game changer",
  "supercharge", "unlock the power", "harness the power", "synergy", "disruptive",
];
const BUZZ_RE = new RegExp(`(?<![\\w-])(?:${BUZZWORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\w-])`, "gi");

function loadNdaTerms() {
  let raw = process.env.NDA_BLOCKLIST || "";
  const file = path.join(ROOT, ".nda-blocklist");
  if (!raw && fs.existsSync(file)) raw = fs.readFileSync(file, "utf8");
  return raw.split(/\r?\n/).map((t) => t.trim()).filter((t) => t && !t.startsWith("#"));
}

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".lighthouseci"].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, exts, out);
    else if (exts.includes(path.extname(entry.name))) out.push(p);
  }
  return out;
}

/** Remove CSS and executable JS; keep JSON-LD, attributes and text, which is what people and crawlers read. */
function readableHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, " ");
}

function lineOf(text, index) { return text.slice(0, index).split("\n").length; }

const problems = [];
function check(file, text, rules) {
  for (const { id, re, msg } of rules) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) problems.push(`${path.relative(ROOT, file)}:${lineOf(text, m.index)}  [${id}] ${msg}: "${m[0]}"`);
  }
}

// ---- 1–3: copy rules on what ships (built HTML) and on its sources ----
const isWorkPage = (f) => /[\\/]work[\\/]/.test(f);
const siteFiles = walk(path.join(ROOT, "_site"), [".html", ".xml", ".txt", ".json"]).filter((f) => !/OFL-/.test(f));
const srcFiles = walk(path.join(ROOT, "src"), [".njk", ".md", ".json", ".html", ".js", ".svg"]);
if (!siteFiles.length) { console.error("copy-lint: _site is empty. Run the build first."); process.exit(1); }

for (const file of [...siteFiles, ...srcFiles]) {
  let text = fs.readFileSync(file, "utf8");
  if (file.endsWith(".html")) text = readableHtml(text);
  const rules = [...BRAND_RULES];
  if (!isWorkPage(file)) rules.push({ id: "buzzword", re: BUZZ_RE, msg: "AI buzzword on a main page" });
  check(file, text, rules);
}

// ---- 4: NDA blocklist over everything that could become public ----
const ndaTerms = loadNdaTerms();
if (!ndaTerms.length) {
  const msg = "copy-lint: NDA blocklist not found (.nda-blocklist or NDA_BLOCKLIST).";
  if (IS_CI) { console.error(msg + " Failing because this is CI."); process.exit(1); }
  console.warn("⚠ " + msg + " NDA scan skipped.");
} else {
  const ndaRe = new RegExp(ndaTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s-]+")).join("|"), "gi");
  const everything = [
    ...walk(ROOT, [".html", ".njk", ".md", ".json", ".js", ".css", ".txt", ".xml", ".yml", ".yaml", ".svg"]),
  ].filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`) && !/package-lock\.json$/.test(f));
  for (const file of everything) {
    const text = fs.readFileSync(file, "utf8");
    ndaRe.lastIndex = 0;
    let m;
    // Never print the matched term itself: CI logs can be public.
    while ((m = ndaRe.exec(text))) problems.push(`${path.relative(ROOT, file)}:${lineOf(text, m.index)}  [nda] NDA-blocklisted term found (term hidden)`);
  }
}

if (problems.length) {
  console.error(`copy-lint: ${problems.length} problem(s)\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`copy-lint: OK (${siteFiles.length} built files, ${srcFiles.length} source files, NDA terms: ${ndaTerms.length})`);
