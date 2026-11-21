#!/usr/bin/env node
// Headless check of the stance sequence (homepage section 2). Scrolls through it at one viewport and, at each
// step, saves a screenshot and measures:
//   cross: clip pixels (darker than paper) inside the text boxes, measured with the text hidden. Must be 0.
//   blank: share of the viewport that is empty white (64 px tiles).
//   video time, heading size, report blur/opacity, outcome opacity.
// usage: node scripts/render/check-stance.mjs <w> <h> <mobile 0|1> <outdir> [reduce 0|1]
// Needs: npm run build:preview && node scripts/serve.mjs 8765
import { spawn } from "node:child_process";
import fs from "node:fs";
const [W, H, MOB, OUT, REDUCE] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/.prof`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map();
ws.addEventListener("message", (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: MOB === "1" });
if (REDUCE === "1") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:8765/" });
await sleep(2500);

// pixel analysis in the page: draw the screenshot into a canvas
const analyse = `async (png, boxes) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
  const c = new OffscreenCanvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, img.width, img.height).data, lum = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  let cross = 0;
  for (const b of boxes) for (let y = Math.max(0, b.t); y < Math.min(img.height, b.b); y++) for (let X = Math.max(0, b.l); X < Math.min(img.width, b.r); X++) if (lum((y * img.width + X) * 4) < 235) cross++;
  let tiles = 0, blank = 0;
  for (let ty = 0; ty < img.height; ty += 64) for (let tx = 0; tx < img.width; tx += 64) {
    tiles++; let ink = false;
    for (let y = ty; y < Math.min(img.height, ty + 64) && !ink; y += 4) for (let X = tx; X < Math.min(img.width, tx + 64); X += 4) if (lum((y * img.width + X) * 4) < 240) { ink = true; break; }
    if (!ink) blank++;
  }
  return { cross, blank: +(blank / tiles).toFixed(2) };
}`;
await ev(`window.__analyse = ${analyse}`);

const report = [];
const RECORD = +(process.env.RECORD || 0);           // RECORD=n: n evenly spaced frames for a screen recording, no analysis
const steps = RECORD ? [...Array(RECORD).keys()].map((i) => i / (RECORD - 1)) : REDUCE === "1" ? [0.5] : [0, 0.2, 0.4, 0.55, 0.62, 0.7, 0.85, 1];
for (const p of steps) {
  await ev(`(()=>{const s=document.querySelector('.scene--stance');const top=s.getBoundingClientRect().top+scrollY;const lead=0.35*innerHeight;
    const total=s.offsetHeight-innerHeight+lead; scrollTo(0, top-lead+total*${p});})()`);
  await sleep(RECORD ? 260 : 1600);
  if (RECORD) { const shot = (await send("Page.captureScreenshot", { format: "png" })).result.data; fs.writeFileSync(`${OUT}/rec_${String(steps.indexOf(p)).padStart(3, "0")}.png`, Buffer.from(shot, "base64")); continue; }
  const st = await ev(`(()=>{const s=document.querySelector('.scene--stance');const v=s.querySelector('video');
    const q=(sel)=>s.querySelector(sel), cs=(e)=>getComputedStyle(e);
    const boxes=[...s.querySelectorAll('.stance__heading,.stance__report,.cloud-text__line')].filter(e=>+getComputedStyle(e.closest('.stance__heading,.stance__report,.stance__outcome')).opacity>0.05).map(e=>{const r=e.getBoundingClientRect();
      // the visible ink box of the line (inline content), padded 6 px
      const rg=document.createRange(); rg.selectNodeContents(e); const rr=rg.getBoundingClientRect();
      return {l:Math.round(rr.left-6),r:Math.round(rr.right+6),t:Math.round(rr.top-6),b:Math.round(rr.bottom+6)}});
    return {t:+v.currentTime.toFixed(2), h2:cs(q('.stance__heading')).fontSize, rep:{o:cs(q('.stance__report')).opacity, f:cs(q('.stance__report')).filter},
      out:cs(q('.stance__outcome')).opacity, cloud:!!q('[data-cloud-ready]'), boxes}})()`);
  const shot = (await send("Page.captureScreenshot", { format: "png" })).result.data;
  fs.writeFileSync(`${OUT}/p${String(Math.round(p * 100)).padStart(3, "0")}.png`, Buffer.from(shot, "base64"));
  // hide the text, re-shoot, count clip pixels inside the text boxes
  await ev(`document.querySelector('.stance__text').style.visibility='hidden'`); await sleep(120);
  const bare = (await send("Page.captureScreenshot", { format: "png" })).result.data;
  await ev(`document.querySelector('.stance__text').style.visibility=''`);
  const a = await ev(`window.__analyse(${JSON.stringify(bare)}, ${JSON.stringify(st.boxes)})`);
  const b = await ev(`window.__analyse(${JSON.stringify(shot)}, [])`);
  delete st.boxes;
  report.push({ p, ...st, cross: a.cross, blank: b.blank });
}
if (!RECORD) console.log(JSON.stringify(report));
ws.close(); chrome.kill();
