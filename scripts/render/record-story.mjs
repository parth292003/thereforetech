#!/usr/bin/env node
// Records the "How we work" stick-figure story frame by frame (24 fps) through steps-story.js's review hook.
// usage: node scripts/render/record-story.mjs <w> <h> <mobile 0|1> <outdir> [seconds] [reduce 0|1]
// Needs: npm run build:preview && node scripts/serve.mjs 8765
import { spawn } from "node:child_process";
import fs from "node:fs";
const [W, H, MOB, OUT, SECS, REDUCE] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/.p${port}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(), errors = [];
ws.addEventListener("message", (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 2, mobile: MOB === "1" });
if (REDUCE === "1") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:8765/" });
await sleep(2500);
// bring the steps into view, let the rules draw in, and frame the region around them
const box = await ev(`(async()=>{const l=document.querySelector('.steps');l.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,1800));
  document.querySelectorAll('.step').forEach(s=>s.classList.add('is-in'));
  const r=l.getBoundingClientRect();const mob=${MOB === "1"};
  const top=r.top+scrollY-(mob?72:110), h=mob?Math.min(r.height+80, 1400):190;
  return {x:0,y:Math.max(0,top),width:innerWidth,height:h,scale:${MOB === "1" ? 1 : 0.75}}})()`);
const total = await ev(`document.querySelector('.steps').storyFrame ? document.querySelector('.steps').storyFrame(0,1) : 0`);
const secs = Math.min(+(SECS || total || 0), total || 1), n = REDUCE === "1" ? 1 : Math.ceil(secs * 24);
for (let i = 0; i < n; i++) {
  if (REDUCE !== "1") await ev(`document.querySelector('.steps').storyFrame(${(i / 24).toFixed(4)}, ${1 + (Math.floor(i / 3) % 3)})`);
  const shot = (await send("Page.captureScreenshot", { format: "png", clip: box })).result.data;
  fs.writeFileSync(`${OUT}/f_${String(i).padStart(4, "0")}.png`, Buffer.from(shot, "base64"));
}
console.log(JSON.stringify({ total: +(total || 0).toFixed(2), frames: n, box, errors }));
ws.close(); chrome.kill();
