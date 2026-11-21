#!/usr/bin/env node
// Offline scene renderer (docs/PLAN.md §5.4). Three.js in headless Chrome, many accumulated samples per frame
// (aperture depth of field, soft area-light shadows, anti-aliasing), frames written as PNG.
//
//   node scripts/render/render.mjs <scene> <desktop|mobile> [--samples 48] [--frames all|0,30,60] [--out dir]
//
// Output: media-masters/renders/<scene>-<variant>/frame_0000.png … then build the master with ffmpeg
// (see scripts/render/README.md).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZES = { desktop: [1920, 1080], mobile: [1080, 1350] };

const [scene, variant = "desktop", ...rest] = process.argv.slice(2);
if (!scene || !SIZES[variant]) {
  console.error("usage: render.mjs <scene> <desktop|mobile> [--samples N] [--frames all|a,b,c] [--out dir] [--scale k]");
  process.exit(1);
}
const opt = (name, def) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : def; };
const samples = Number(opt("samples", 48));
const frames = opt("frames", "all");
const out = path.resolve(ROOT, opt("out", `media-masters/renders/${scene}-${variant}`));
fs.mkdirSync(out, { recursive: true });
const scale = Number(opt("scale", 1));        // e.g. --scale 1.2 when the page shows the clip enlarged
const [w, h] = SIZES[variant].map((v) => Math.round(v * scale / 2) * 2);

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" };
let chrome, started = Date.now(), written = 0;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "POST") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      if (url.pathname === "/frame") {
        const n = String(url.searchParams.get("n")).padStart(4, "0");
        fs.writeFileSync(path.join(out, `frame_${n}.png`), body);
        written++;
        const secs = ((Date.now() - started) / 1000).toFixed(0);
        process.stdout.write(`  frame ${n}  (${written} written, ${secs}s)\n`);
      } else if (url.pathname === "/log") {
        console.log("  page:", body.toString());
      } else if (url.pathname === "/done") {
        console.log(`done: ${written} frames → ${path.relative(ROOT, out)} in ${((Date.now() - started) / 1000).toFixed(0)}s`);
        res.end("ok");
        finish(0);
        return;
      } else if (url.pathname === "/error") {
        console.error("  page error:", body.toString());
        res.end("ok");
        finish(1);
        return;
      }
      res.end("ok");
    });
    return;
  }
  // Static files: only the render folder and three.js
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!rel.startsWith("scripts/render/") && !rel.startsWith("node_modules/three/")) { res.statusCode = 404; return res.end(); }
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});

function finish(code) {
  if (chrome) chrome.kill("SIGTERM");
  server.close();
  setTimeout(() => process.exit(code), 300);
}

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const q = new URLSearchParams({ scene, variant, w, h, samples, frames });
  const url = `http://127.0.0.1:${port}/scripts/render/index.html?${q}`;
  console.log(`rendering ${scene} ${variant} ${w}×${h}, ${samples} samples/frame, frames=${frames}`);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "tt-render-"));
  chrome = spawn(CHROME, [
    "--headless=new", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist",
    "--no-first-run", "--no-default-browser-check", "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding", `--user-data-dir=${profile}`, `--window-size=${w},${h}`, url,
  ], { stdio: "ignore" });
  chrome.on("exit", (c) => { if (c && c !== 0 && c !== null) console.error("chrome exited", c); });
});

setTimeout(() => { console.error("timeout"); finish(1); }, 1000 * 60 * 60);
