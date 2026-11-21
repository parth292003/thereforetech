// Accumulation renderer. Each frame = N jittered renders averaged in a float buffer:
//   aperture offset (depth of field), sub-pixel offset (anti-aliasing), light offset (soft shadows).
// Composite: exposure (paper → pure white), soft edge matte to white, fade in/out to white,
// fine grain that fades out on white so the clip melts into the page.
import * as THREE from "three";

const q = new URLSearchParams(location.search);
const W = +q.get("w"), H = +q.get("h"), SAMPLES = +q.get("samples") || 32;
const variant = q.get("variant"), sceneName = q.get("scene");
const post = (p, body) => fetch(p, { method: "POST", body });
const log = (m) => post("/log", String(m));
window.addEventListener("error", (e) => post("/error", e.message + " @" + e.filename + ":" + e.lineno));
window.addEventListener("unhandledrejection", (e) => post("/error", String(e.reason && e.reason.stack || e.reason)));

// Low-discrepancy sequence for evenly spread samples
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const disk = (u, v) => { const r = Math.sqrt(u), a = 2 * Math.PI * v; return [r * Math.cos(a), r * Math.sin(a)]; };

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // the composite shader does the sRGB encode
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const gl = renderer.getContext();
const dbg = gl.getExtension("WEBGL_debug_renderer_info");
log("GPU: " + (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "unknown"));

const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, colorSpace: THREE.LinearSRGBColorSpace };
const sampleRT = new THREE.WebGLRenderTarget(W, H, rtOpts);
const accumRT = new THREE.WebGLRenderTarget(W, H, { ...rtOpts, depthBuffer: false });

const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadGeo = new THREE.PlaneGeometry(2, 2);
const vert = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const addMat = new THREE.ShaderMaterial({
  uniforms: { tex: { value: sampleRT.texture }, k: { value: 1 } },
  vertexShader: vert,
  fragmentShader: "uniform sampler2D tex; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb * k, 1.0); }",
  blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
});
const compMat = new THREE.ShaderMaterial({
  uniforms: {
    tex: { value: accumRT.texture }, exposure: { value: 1 }, fade: { value: 1 }, seed: { value: 0 },
    edge: { value: 0.06 }, grain: { value: 0.035 }, res: { value: new THREE.Vector2(W, H) },
  },
  vertexShader: vert,
  fragmentShader: `
    uniform sampler2D tex; uniform float exposure, fade, seed, edge, grain; uniform vec2 res; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main(){
      vec3 c = clamp(texture2D(tex, vUv).rgb * exposure, 0.0, 1.0);
      vec3 s = srgb(c);
      vec2 d = min(vUv, 1.0 - vUv) * vec2(res.x / res.y, 1.0);
      float m = smoothstep(0.0, edge, min(d.x, d.y));
      s = mix(vec3(1.0), s, m);
      float l = dot(s, vec3(0.2126, 0.7152, 0.0722));
      vec2 px = floor(vUv * res);
      float g = (hash(px + seed) + hash(px * 1.37 + seed * 1.7) - 1.0) * grain;
      s += g * (1.0 - smoothstep(0.72, 0.93, l));   // no grain on paper white
      s = mix(vec3(1.0), s, fade);
      gl_FragColor = vec4(clamp(s, 0.0, 1.0), 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const quad = new THREE.Mesh(quadGeo, addMat);
const quadScene = new THREE.Scene();
quadScene.add(quad);

const mod = await import(`./scenes/${sceneName}.js`);
const S = await mod.setup({ THREE, renderer, W, H, variant });
const list = q.get("frames") === "all" ? [...Array(S.frames).keys()] : q.get("frames").split(",").map(Number);

function accumulate(frame, n) {
  S.prepare(frame);
  renderer.setRenderTarget(accumRT);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  for (let i = 0; i < n; i++) {
    const [ax, ay] = disk(halton(i + 1, 2), halton(i + 1, 3));
    const [lx, ly] = disk(halton(i + 1, 5), halton(i + 1, 7));
    const jx = halton(i + 1, 11) - 0.5, jy = halton(i + 1, 13) - 0.5;
    S.sample({ ax, ay, lx, ly, jx, jy });
    renderer.setRenderTarget(sampleRT);
    renderer.setClearColor(0xffffff, 1);
    renderer.clear();
    renderer.render(S.scene, S.camera);
    quad.material = addMat;
    addMat.uniforms.k.value = 1 / n;
    renderer.setRenderTarget(accumRT);
    renderer.autoClear = false;
    renderer.render(quadScene, quadCam);
    renderer.autoClear = true;
  }
}

// Exposure: make empty paper read as pure white (just over 1.0 before clamping).
accumulate(S.exposureFrame, 8);
const [u0, v0, u1, v1] = S.exposurePatch;            // uv patch of bare paper (v measured from the bottom)
const pw = Math.round((u1 - u0) * W), ph = Math.round((v1 - v0) * H);
const buf = new Uint16Array(pw * ph * 4);
renderer.readRenderTargetPixels(accumRT, Math.round(u0 * W), Math.round(v0 * H), pw, ph, buf);
let sum = 0;
for (let i = 0; i < pw * ph; i++) sum += 0.2126 * THREE.DataUtils.fromHalfFloat(buf[i * 4]) + 0.7152 * THREE.DataUtils.fromHalfFloat(buf[i * 4 + 1]) + 0.0722 * THREE.DataUtils.fromHalfFloat(buf[i * 4 + 2]);
const paper = sum / (pw * ph);
const exposure = (S.paperWhite || 1.04) / paper;
log(`paper ${paper.toFixed(4)} → exposure ${exposure.toFixed(3)}`);

for (const f of list) {
  accumulate(f, SAMPLES);
  quad.material = compMat;
  compMat.uniforms.exposure.value = exposure;
  compMat.uniforms.fade.value = S.fade(f);
  compMat.uniforms.seed.value = (f * 7.31) % 97;
  compMat.uniforms.grain.value = S.grain ?? 0.035;
  compMat.uniforms.edge.value = S.edge ?? 0.06;
  renderer.setRenderTarget(null);
  renderer.render(quadScene, quadCam);
  const blob = await new Promise((r) => renderer.domElement.toBlob(r, "image/png"));
  await post(`/frame?n=${f}`, blob);
}
await post("/done", "");
