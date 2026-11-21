#!/usr/bin/env node
// Headless check of homepage section 3 ("What we do") at one viewport. Saves screenshots at several scroll
// positions and reports the column alignment: label/heading/body/link tops, heading and body line counts,
// link baselines, and the video time.
// usage: node scripts/render/check-wwd.mjs <w> <h> <mobile 0|1> <outdir> [reduce 0|1]
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
const lines = (sel) => `(e=>{const r=document.createRange();r.selectNodeContents(e);const tops=new Set([...r.getClientRects()].map(x=>Math.round(x.top)));return tops.size})(document.querySelector('${sel}'))`;
const layout = await ev(`(()=>{const q=(s)=>document.querySelector(s), top=(s)=>Math.round(q(s).getBoundingClientRect().top+scrollY);
  const out={};
  for (const c of [1,2]) { const p='.wwd__col--'+c+' ';
    out[c]={num:top(p+'.wwd__num'), title:top(p+'.wwd__title'), body:top(p+'.wwd__body'), link:top(p+'.wwd__link'),
      titleLines:${lines("XX .wwd__title").replace("'XX ", "p+'")}, bodyLines:${lines("XX .wwd__body").replace("'XX ", "p+'")},
      bodyCh: +(q(p+'.wwd__body').getBoundingClientRect().width / (parseFloat(getComputedStyle(q(p+'.wwd__body')).fontSize)*0.5)).toFixed(1),
      left:Math.round(q(p).getBoundingClientRect().left), width:Math.round(q(p).getBoundingClientRect().width)} }
  const sc=q('.wwd__scene').getBoundingClientRect(); out.scene={top:Math.round(sc.top+scrollY), h:Math.round(sc.height), w:Math.round(sc.width)};
  out.overflowX = document.documentElement.scrollWidth > innerWidth;
  return out})()`);
console.log(JSON.stringify(layout));
const shots = MOB === "1" ? [["text1", layout[1].num - 40], ["scene", layout.scene.top - 60], ["text2", layout[2].num - 200]]
  : [["head", layout[1].num - 160], ["mid", layout.scene.top - +H * 0.5], ["end", layout.scene.top + layout.scene.h - +H]];
for (const [name, y] of shots) {
  await ev(`scrollTo(0, ${Math.max(0, y)})`); await sleep(1800);
  const t = await ev(`(()=>{const v=document.querySelector('.wwd__video');return v?+v.currentTime.toFixed(2):null})()`);
  const shot = (await send("Page.captureScreenshot", { format: "png" })).result.data;
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot, "base64")); console.log(name, "t=", t);
}
ws.close(); chrome.kill();
