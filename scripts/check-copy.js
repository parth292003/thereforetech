#!/usr/bin/env node
// Approved-copy check (docs/PLAN.md §8, Phase 2 acceptance).
// Every line in scripts/approved-copy.json must appear, word for word, as a value in the homepage data
// (src/_data/home.json + src/_data/engagementModels.json). With --html it must also appear in the built
// homepage text (enabled from Phase 3, once the homepage renders every section).
//
// Usage: node scripts/check-copy.js [--html]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const approved = read("scripts/approved-copy.json").home;
const dataFiles = ["src/_data/home.json", "src/_data/engagementModels.json"];

function strings(value, out = new Set()) {
  if (typeof value === "string") out.add(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}
const dataStrings = new Set(dataFiles.flatMap((f) => [...strings(read(f))]));

const problems = [];
for (const line of approved) {
  if (!dataStrings.has(line)) problems.push(`data: approved line missing or altered: "${line}"`);
}

if (process.argv.includes("--html")) {
  const htmlPath = path.join(ROOT, "_site/index.html");
  if (!fs.existsSync(htmlPath)) problems.push("html: _site/index.html not found (build first)");
  else {
    const text = fs.readFileSync(htmlPath, "utf8")
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&#39;|&#x27;|&apos;|&rsquo;/g, "'")
      .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ");
    // Sections held off the live site (site.holdUnfinishedHome: work, engagement models, contact) are absent from
    // the production homepage on purpose; their lines are still checked in the data above.
    const held = new Set();
    if (read("src/_data/site.json").holdUnfinishedHome && !text.includes("Selected work")) {
      const home = read("src/_data/home.json");
      [home.work, home.contact, read("src/_data/engagementModels.json")].forEach((v) => strings(v, held));
    }
    for (const line of approved) if (!held.has(line) && !text.includes(line)) problems.push(`html: approved line not on the homepage: "${line}"`);
  }
}

if (problems.length) {
  console.error(`check-copy: ${problems.length} problem(s)\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`check-copy: OK (${approved.length} approved lines verbatim${process.argv.includes("--html") ? " in data and HTML" : " in data"})`);
