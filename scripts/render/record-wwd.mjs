#!/usr/bin/env node
// Captures the "What we do" ink drawings at given scroll progresses through wwd-art.js's review hook.
// usage: node scripts/render/record-wwd.mjs <w> <h> <mobile 0|1> <outdir> <p1,p2,...|seq:seconds> [reduce 0|1]
// Needs: npm run build:preview && node scripts/serve.mjs 8765
import { spawn } from "node:child_process";
import fs from "node:fs";
const [W, H, MOB, OUT, PS, REDUCE] = process.argv.slice(2);
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
const box = await ev(`(async()=>{const l=document.querySelector('.wwd');l.scrollIntoView({block:'start'});await new Promise(r=>setTimeout(r,1500));
  document.querySelectorAll('[data-reveal]').forEach(s=>s.classList.add('is-in'));await new Promise(r=>setTimeout(r,900));
  const r=l.getBoundingClientRect();return {x:0,y:r.top+scrollY-20,width:innerWidth,height:r.height+40,scale:${MOB === "1" ? 0.75 : 0.6}}})()`);
const seq = PS.startsWith("seq:") ? Array.from({ length: Math.ceil(+PS.slice(4) * 24) }, (_, i) => i / (Math.ceil(+PS.slice(4) * 24) - 1)) : PS.split(",").map(Number);
for (let i = 0; i < seq.length; i++) {
  if (REDUCE !== "1") await ev(`document.querySelector('.wwd').artFrame(${seq[i]}, ${PS.startsWith("seq:") ? 1 / 24 : 0.6}, ${1 + (Math.floor(i / 3) % 3)})`);
  const shot = (await send("Page.captureScreenshot", { format: "png", clip: box, captureBeyondViewport: true })).result.data;
  fs.writeFileSync(`${OUT}/f_${String(i).padStart(4, "0")}.png`, Buffer.from(shot, "base64"));
}
console.log(JSON.stringify({ frames: seq.length, box, errors }));
ws.close(); chrome.kill();
