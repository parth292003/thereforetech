#!/usr/bin/env node
// Launch-readiness check (docs/PLAN.md §8.1). Lists every launch blocker and exits 1 while any remain.
// Not part of `npm test` (it is expected to fail until launch). Run: npm run check:launch
//
// Blockers:
//   - pages that ship (not `draft: true`) whose copy is still `copyStatus: draft`
//   - homepage / engagement data still marked draft or missing (unless held back from the build)
//   - claims in src/_data/claims.json still draft while the claim's page ships
//   - required site settings still empty (email, Cal.com link, LinkedIn)
// Held-back items (`draft: true` pages, `heldBackUntilConfirmed` work items) are reported, not failed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!["_includes", "_data"].includes(e.name)) walk(p, out); }
    else if (/\.(md|njk|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Flat YAML front matter: `key: value` lines only (all this check needs). */
function frontMatter(file) {
  const m = fs.readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = {};
  if (!m) return data;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return data;
}

const blockers = [];
const heldBack = [];

// ---- Pages ----
for (const file of walk(SRC)) {
  const fm = frontMatter(file);
  const rel = path.relative(ROOT, file);
  if (fm.devOnly === "true") continue;
  if (fm.draft === "true") { heldBack.push(`${rel} (draft: true, not in production build)`); continue; }
  if (fm.copyStatus === "draft") blockers.push(`${rel}: copy is DRAFT${fm.draftNote ? ` (${fm.draftNote})` : ""}`);
}
// Placeholders left in shipping pages
for (const file of walk(SRC)) {
  const fm = frontMatter(file);
  if (fm.draft === "true" || fm.devOnly === "true") continue;
  if (/class="placeholder"/.test(fs.readFileSync(file, "utf8"))) blockers.push(`${path.relative(ROOT, file)}: contains a placeholder block`);
}

// ---- Homepage and engagement data ----
const home = read("src/_data/home.json");
for (const [key, section] of Object.entries(home)) {
  if (key.startsWith("_") || typeof section !== "object") continue;
  if (section.launchBlocker) blockers.push(`home.${key}: launch blocker (${section.status})`);
  else if (section.status === "draft") blockers.push(`home.${key}: copy is DRAFT`);
  for (const item of section.items || []) {
    if (item.status === "draft" && item.heldBackUntilConfirmed) heldBack.push(`home.${key}: "${item.title}" (held back until confirmed)`);
    else if (item.status === "draft") blockers.push(`home.${key}: "${item.title}" is DRAFT`);
    if (item.titleStatus === "draft") blockers.push(`home.${key}: title "${item.title}" is DRAFT`);
  }
  for (const f of section.fields || []) if (f.status === "draft") blockers.push(`home.${key}: field "${f.label}" is DRAFT (${f.note || "needs approval"})`);
  if (section.submitLabelStatus === "draft") blockers.push(`home.${key}: button label "${section.submitLabel}" is DRAFT`);
}
const em = read("src/_data/engagementModels.json");
if (em.status === "draft") blockers.push(`engagementModels: descriptions are DRAFT (or hold the section back)`);

// ---- Claims ----
for (const c of read("src/_data/claims.json").claims) {
  if (c.status === "draft" && c.heldBack) heldBack.push(`claim "${c.id}" (held back with its page)`);
  else if (c.status === "draft") blockers.push(`claim "${c.id}": DRAFT (${c.rule || "needs confirmation"})`);
}

// ---- Site settings ----
const site = read("src/_data/site.json");
for (const [k, label] of [["email", "enquiry email (Web3Forms)"], ["bookingUrl", "Cal.com link"], ["founderLinkedin", "Parth's LinkedIn"]]) {
  if (!site[k]) blockers.push(`site.${k}: missing ${label}`);
}
if (/draft/i.test(site.descriptionStatus || "draft")) blockers.push(`site.description: DRAFT wording ("${site.description}")`);

// ---- Report ----
console.log(`Launch check — ${blockers.length} blocker(s), ${heldBack.length} held back\n`);
if (blockers.length) console.log("BLOCKERS\n  " + blockers.join("\n  ") + "\n");
if (heldBack.length) console.log("HELD BACK (will not ship until confirmed)\n  " + heldBack.join("\n  ") + "\n");
process.exit(blockers.length ? 1 : 0);
