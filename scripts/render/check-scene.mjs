// Headless Chrome via CDP: set viewport, scroll through the clip scene, screenshot + report video state.
// usage: node scripts/render/check-scene.mjs <w> <h> <mobile 0|1> <outdir> [reduce 0|1]
// Needs the site served with Range support first: npm run build:preview && node scripts/serve.mjs 8765
import { spawn } from "node:child_process";
import fs from "node:fs";
const [W, H, MOB, OUT, REDUCE] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/.prof`, "--autoplay-policy=no-user-gesture-required",
  "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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
const report = [];
for (const p of [0, 0.15, 0.35, 0.55, 0.75, 1]) {
  await ev(`(()=>{const s=document.querySelector('[data-clip]');const top=s.getBoundingClientRect().top+scrollY;scrollTo(0, top+(s.offsetHeight-innerHeight)*${p});})()`);
  await sleep(1800);
  const st = await ev(`(()=>{const s=document.querySelector('[data-clip]');const v=s.querySelector('video');
    const lines=[...s.querySelectorAll('[data-at]')].map(l=>{const r=l.getBoundingClientRect();return {on:l.classList.contains('is-on'),x:[Math.round(r.left),Math.round(r.right)],y:[Math.round(r.top),Math.round(r.bottom)]}});
    return {src:(v.currentSrc||'').split('/').pop(),t:+v.currentTime.toFixed(2),dur:v.duration,ready:v.classList.contains('is-ready'),lines}})()`);
  report.push({ p, ...st });
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${OUT}/p${String(Math.round(p * 100)).padStart(3, "0")}.png`, Buffer.from(shot.result.data, "base64"));
}
console.log(JSON.stringify(report, null, 1));
ws.close(); chrome.kill();
