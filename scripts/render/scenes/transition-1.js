// Transition 1: "Consultants hand you a report. We own the outcome with you."
// A thin copper trace lies on white paper. Its last section softens, lifts off the page, thickens into bark
// and grows into a living branch; one leaf unfolds at the tip. Low window light, soft shadows, shallow focus.
// The top of the frame is kept empty for the headline.
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export async function setup({ THREE, renderer, W, H, variant }) {
  const FRAMES = 120;                                   // 5 s at 24 fps
  const mobile = variant === "mobile";
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (t) => t * t * (3 - 2 * t);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;

  // ---------- Paper: white, with a fine tooth (normal map from noise and short fibres) ----------
  function paperNormal(size = 512) {
    const hgt = new Float32Array(size * size);
    const rnd = (() => { let s = 99; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    for (let i = 0; i < hgt.length; i++) hgt[i] = rnd() * 0.35;
    for (let k = 0; k < 2200; k++) {                    // fibres
      let x = rnd() * size, y = rnd() * size; const a = rnd() * Math.PI, len = 6 + rnd() * 26, hh = 0.25 + rnd() * 0.5;
      for (let s = 0; s < len; s++) { const ix = (((x + Math.cos(a) * s) | 0) % size + size) % size, iy = (((y + Math.sin(a) * s) | 0) % size + size) % size; hgt[iy * size + ix] += hh; }
    }
    const blur = new Float32Array(hgt.length);           // soften
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += hgt[((y + dy + size) % size) * size + ((x + dx + size) % size)];
      blur[y * size + x] = s / 9;
    }
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const hx = blur[y * size + ((x + 1) % size)] - blur[y * size + ((x - 1 + size) % size)];
      const hy = blur[((y + 1) % size) * size + x] - blur[((y - 1 + size) % size) * size + x];
      const n = V(-hx * 2, -hy * 2, 1).normalize(), i = (y * size + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255; data[i + 1] = (n.y * 0.5 + 0.5) * 255; data[i + 2] = (n.z * 0.5 + 0.5) * 255; data[i + 3] = 255;
    }
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(220, 220); t.needsUpdate = true;
    return t;
  }
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.93, metalness: 0, normalMap: paperNormal(), normalScale: new THREE.Vector2(0.07, 0.07),
  }));
  paper.rotation.x = -Math.PI / 2;
  paper.receiveShadow = true;
  scene.add(paper);

  // ---------- Light: low, warm window light from the upper left, soft (jittered) ----------
  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.955, 0.89), 3.4);
  const sunBase = V(-1.4, 4.8, 0.9);   // high sun: the leaf shadow lands under the plant, not at the frame edge
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 14 });
  sun.shadow.bias = -0.00015; sun.shadow.normalBias = 0.002; sun.shadow.radius = 1.5;
  sun.target.position.set(-0.2, 0, 0.3);
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(new THREE.Color(0.86, 0.9, 1.0), new THREE.Color(1.0, 0.96, 0.9), 0.12));
  const sunU = V(0, 1, 0).cross(sunBase).normalize(), sunV = sunBase.clone().cross(sunU).normalize();

  // ---------- Paths ----------
  const R_WIRE = 0.009;
  // Fillet a polyline (x, z on the paper) and sample it densely.
  function filleted(pts, r, step) {
    const out = [];
    const P = pts.map(([x, z]) => new THREE.Vector2(x, z));
    const pushSeg = (a, b) => { const n = Math.max(1, Math.ceil(a.distanceTo(b) / step)); for (let i = out.length ? 1 : 0; i <= n; i++) out.push(a.clone().lerp(b, i / n)); };
    let cur = P[0];
    for (let i = 1; i < P.length - 1; i++) {
      const a = P[i - 1], c = P[i], b = P[i + 1];
      const p1 = c.clone().add(a.clone().sub(c).setLength(r)), p2 = c.clone().add(b.clone().sub(c).setLength(r));
      pushSeg(cur, p1);
      const n = 10; for (let k = 1; k <= n; k++) { const t = k / n, m = 1 - t; out.push(new THREE.Vector2(m * m * p1.x + 2 * m * t * c.x + t * t * p2.x, m * m * p1.y + 2 * m * t * c.y + t * t * p2.y)); }
      cur = p2;
    }
    pushSeg(cur, P[P.length - 1]);
    return out.map((p) => V(p.x, R_WIRE, p.y));
  }
  function arcParam(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1])); return L; }
  function at(pts, L, v) {
    const s = clamp(v) * L[L.length - 1];
    let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
    const f = (s - L[lo]) / Math.max(1e-9, L[hi] - L[lo]);
    return pts[lo].clone().lerp(pts[hi], f);
  }

  // Circuit trace: fixed part, then the part that becomes the branch.
  const fixed = filleted([[-3.6, 0.62], [-1.55, 0.62], [-1.2, 0.27], [-0.42, 0.27]], 0.03, 0.006);
  const active = filleted([[-0.42, 0.27], [-0.12, 0.57], [0.62, 0.57]], 0.03, 0.006);
  const activeL = arcParam(active);
  // Where it grows: rises from the paper in a loose, living curve.
  const branchCurve = new THREE.CatmullRomCurve3([
    V(-0.42, R_WIRE, 0.27), V(-0.2, 0.025, 0.34), V(0.03, 0.15, 0.42), V(0.2, 0.38, 0.46), V(0.35, 0.6, 0.42), V(0.44, 0.76, 0.36),
  ], false, "centripetal");
  const NA = 320;
  const branchPts = branchCurve.getSpacedPoints(NA);
  // Organic irregularity: small seeded kinks, never on the base point.
  branchPts.forEach((p, i) => { const v = i / NA; p.x += 0.012 * Math.sin(v * 17 + 1.3) * v; p.z += 0.01 * Math.sin(v * 23 + 0.4) * v; });

  // ---------- Tube with varying radius and a per-vertex "bark" blend ----------
  const RS = 14;
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.3, envMapIntensity: 2.2 });
  tubeMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aBark; attribute float aV; attribute vec2 aUv2; varying float vBark; varying float vV; varying vec2 vTube;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBark = aBark; vV = aV; vTube = aUv2;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        varying float vBark; varying float vV; varying vec2 vTube;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float b = vn(vec2(vTube.x * 70.0, vTube.y * 7.0)) * 0.6 + vn(vec2(vTube.x * 260.0, vTube.y * 19.0)) * 0.4;
        vec3 bark = mix(vec3(0.055, 0.036, 0.024), vec3(0.22, 0.15, 0.095), b);
        vec3 young = mix(vec3(0.12, 0.14, 0.05), vec3(0.2, 0.22, 0.08), b);
        vec3 living = mix(bark, young, smoothstep(0.72, 1.0, vV));
        vec3 copper = vec3(0.955, 0.638, 0.538) * (0.82 + 0.18 * vn(vec2(vTube.x * 180.0, vTube.y * 9.0)));
        diffuseColor.rgb = mix(copper, living, vBark);`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.28 + 0.08 * b, 0.8 + 0.1 * b, vBark);")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = mix(1.0, 0.0, smoothstep(0.0, 0.6, vBark));");
  };
  const tube = new THREE.Mesh(new THREE.BufferGeometry(), tubeMat);
  tube.castShadow = true; tube.receiveShadow = true;
  scene.add(tube);

  function buildTube(pts, radii, bark, vs) {
    const n = pts.length, pos = new Float32Array(n * (RS + 1) * 3), nor = new Float32Array(n * (RS + 1) * 3);
    const aB = new Float32Array(n * (RS + 1)), aV = new Float32Array(n * (RS + 1)), uv = new Float32Array(n * (RS + 1) * 2);
    let T = pts[1].clone().sub(pts[0]).normalize();
    let N = Math.abs(T.y) < 0.9 ? V(0, 1, 0).cross(T).normalize() : V(1, 0, 0).cross(T).normalize();
    let s = 0;
    for (let i = 0; i < n; i++) {
      const Tn = (i < n - 1 ? pts[i + 1].clone().sub(pts[i]) : pts[i].clone().sub(pts[i - 1])).normalize();
      // parallel transport: rotate N by the change in tangent, so the tube never twists
      const axis = T.clone().cross(Tn); const ang = Math.asin(clamp(axis.length(), -1, 1));
      if (axis.lengthSq() > 1e-12) N.applyAxisAngle(axis.normalize(), ang);
      T = Tn;
      const B = T.clone().cross(N).normalize();
      if (i) s += pts[i].distanceTo(pts[i - 1]);
      for (let k = 0; k <= RS; k++) {
        const a = (k / RS) * Math.PI * 2, dir = N.clone().multiplyScalar(Math.cos(a)).add(B.clone().multiplyScalar(Math.sin(a)));
        const j = i * (RS + 1) + k, p = pts[i].clone().addScaledVector(dir, radii[i]);
        pos.set([p.x, p.y, p.z], j * 3); nor.set([dir.x, dir.y, dir.z], j * 3);
        aB[j] = bark[i]; aV[j] = vs[i]; uv.set([s, k / RS], j * 2);
      }
    }
    const idx = [];
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < RS; k++) {
      const a = i * (RS + 1) + k, b = a + RS + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    g.setAttribute("aBark", new THREE.BufferAttribute(aB, 1));
    g.setAttribute("aV", new THREE.BufferAttribute(aV, 1));
    g.setAttribute("aUv2", new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  // ---------- One solder pad on the trace: the circuit cue ----------
  const copperMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.955, 0.66, 0.55), metalness: 1, roughness: 0.34, envMapIntensity: 2.2 });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.041, 0.005, 48), copperMat);
  pad.position.set(-0.86, 0.0025, 0.27); pad.castShadow = pad.receiveShadow = true; scene.add(pad);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.0062, 32), new THREE.MeshStandardMaterial({ color: 0x2a211b, roughness: 0.6 }));
  hole.position.set(-0.86, 0.0031, 0.27); scene.add(hole);

  // ---------- Leaf: one leaf, veins painted into its texture, unfolds from a closed fold ----------
  function leafTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 1024;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 1024, 0, 0);
    g.addColorStop(0, "#4d6a25"); g.addColorStop(0.6, "#5d7a2e"); g.addColorStop(1, "#6f8a37");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    const r = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < 0.5 ? "30,45,10" : "150,170,80"},${0.03 + r() * 0.05})`; x.beginPath(); x.arc(r() * 1024, r() * 1024, 2 + r() * 14, 0, 7); x.fill(); }
    x.lineCap = "round";
    // midrib (u = 0.5, v runs bottom → top of the canvas)
    x.strokeStyle = "rgba(196,206,140,0.9)"; x.lineWidth = 9; x.beginPath(); x.moveTo(512, 1024); x.quadraticCurveTo(505, 500, 512, 20); x.stroke();
    // secondary veins
    for (let k = 1; k <= 10; k++) {
      const y0 = 1024 - k * 92, reach = 380 * Math.sin(Math.PI * Math.min(1, (k / 11) ** 0.8));
      for (const sgn of [-1, 1]) {
        x.strokeStyle = "rgba(186,198,128,0.55)"; x.lineWidth = 3.2;
        x.beginPath(); x.moveTo(512, y0); x.quadraticCurveTo(512 + sgn * reach * 0.45, y0 - 40, 512 + sgn * reach, y0 - 120 - r() * 30); x.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  const leafTex = leafTexture();
  const leafMat = new THREE.MeshPhysicalMaterial({
    map: leafTex, bumpMap: leafTex, bumpScale: 0.6, roughness: 0.5, metalness: 0, side: THREE.DoubleSide,
    sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.75, 0.85, 0.55),
  });
  const NU = 28, NV = 56;
  const leafGeo = new THREE.BufferGeometry();
  const lPos = new Float32Array((NU + 1) * (NV + 1) * 3), lUv = new Float32Array((NU + 1) * (NV + 1) * 2), lIdx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    lUv.set([i / NU, j / NV], (j * (NU + 1) + i) * 2);
    if (i < NU && j < NV) { const a = j * (NU + 1) + i, b = a + NU + 1; lIdx.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  leafGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3));
  leafGeo.setAttribute("uv", new THREE.BufferAttribute(lUv, 2));
  leafGeo.setIndex(lIdx);
  const leaf = new THREE.Mesh(leafGeo, leafMat);
  leaf.castShadow = true; leaf.receiveShadow = true;
  scene.add(leaf);

  function shapeLeaf(open, time) {
    const scale = 0.22 + 0.78 * open;
    const Lf = 0.5 * scale, Wl = 0.19 * scale;
    const fold = THREE.MathUtils.degToRad(84 - 70 * open);         // each half's lift above flat
    const curl = 1.5 - 1.15 * open + 0.03 * Math.sin(time * 2.1);  // rolled tip when young
    for (let j = 0; j <= NV; j++) {
      const t = j / NV, hw = Wl * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.75) * (1 - 0.2 * t);
      const phi = curl * Math.pow(t, 1.4), rho = Lf / Math.max(1e-3, curl);
      const cy = curl < 1e-3 ? t * Lf : rho * Math.sin(phi), cz = curl < 1e-3 ? 0 : rho * (1 - Math.cos(phi));
      const ny = -Math.sin(phi), nz = Math.cos(phi);
      for (let i = 0; i <= NU; i++) {
        const sx = (i / NU) * 2 - 1, d = Math.abs(sx) * hw;
        const lx = Math.sign(sx) * d * Math.cos(fold);
        const lz = d * Math.sin(fold) + 0.004 * Math.sin(t * 26 + sx * 2) * sx * sx * scale;
        lPos.set([lx, cy + ny * lz, cz + nz * lz], (j * (NU + 1) + i) * 3);
      }
    }
    leafGeo.attributes.position.needsUpdate = true;
    leafGeo.computeVertexNormals();
  }

  // ---------- Camera ----------
  const cam = new THREE.PerspectiveCamera(mobile ? 36 : 23, W / H, 0.05, 600);
  const shot = mobile
    ? { pos: V(0.85, 2.7, 3.3), aim: V(0.02, 0.3, 0.42), drift: V(-0.05, -0.08, -0.18), shiftY: -0.06, aperture: 0.035 }
    : { pos: V(1.15, 2.6, 3.5), aim: V(0.02, 0.3, 0.4), drift: V(-0.08, -0.1, -0.22), shiftY: -0.2, aperture: 0.07 };
  const focusA = V(-0.86, 0.0, 0.3);
  let leafCentre = V(0.5, 0.82, 0.36);

  // ---------- Per frame ----------
  let camPos = shot.pos.clone(), focus = focusA.clone(), focusDist = 1;
  let ap = shot.aperture;   // stops down as focus lands on the leaf (Parth 2026-11-21: leaf crisp at the end)
  const focusOnAxis = V();
  const right = V(), up = V();

  function prepare(f) {
    const T = f / (FRAMES - 1);
    const tm = ease(span(T, 0.1, 0.64));                 // metal → living branch
    const lo = ease(span(T, 0.5, 0.88));                 // leaf unfolds

    const pts = [], radii = [], bark = [], vs = [];
    fixed.forEach((p) => { pts.push(p); radii.push(R_WIRE); bark.push(0); vs.push(0); });
    for (let i = 1; i <= NA; i++) {
      const v = i / NA;
      const m = smooth(clamp((tm - (1 - v) * 0.55) / 0.45));
      const a = at(active, activeL, v), b = branchPts[i];
      // a little overshoot and settle as it lifts, so the motion isn't mechanical
      const lift = m + 0.04 * Math.sin(Math.PI * m) * Math.sin(v * 5 + T * 3);
      const p = a.clone().lerp(b, lift);
      const mb = smooth(clamp((m - 0.15) / 0.85));
      const rb = R_WIRE + 0.017 * smooth(clamp(v / 0.3)) * Math.pow(1 - v, 0.8);
      const tip = 1 - 0.45 * smooth(clamp((v - 0.94) / 0.06));
      pts.push(p); radii.push((R_WIRE + (rb - R_WIRE) * mb) * tip); bark.push(mb); vs.push(v);
    }
    tube.geometry.dispose();
    tube.geometry = buildTube(pts, radii, bark, vs);

    // Leaf at the tip, facing up towards the light and camera
    const tipP = pts[pts.length - 1], tipT = pts[pts.length - 1].clone().sub(pts[pts.length - 4]).normalize();
    leaf.visible = lo > 0.001;
    if (leaf.visible) {
      shapeLeaf(lo, T * 5);
      const turn = 0.25 * (1 - lo) + 0.05 * Math.sin(T * 4.2);               // settles as it opens
      const Y = tipT.clone().multiplyScalar(0.45).add(V(0.7, 0.32 + turn, 0.3)).normalize();
      const toCam = camPos.clone().sub(tipP).normalize();
      const Z0 = V(0, 1, 0).add(toCam.multiplyScalar(0.45)).add(V(-0.35, 0, 0)).normalize();
      const X = Y.clone().cross(Z0).normalize(), Z = X.clone().cross(Y).normalize();
      leaf.matrixAutoUpdate = false;
      leaf.matrix.makeBasis(X, Y, Z).setPosition(tipP);
      leaf.matrixWorldNeedsUpdate = true;
    }
    leafCentre = tipP.clone().addScaledVector(tipT.clone().multiplyScalar(0.45).add(V(0.7, 0.32, 0.3)).normalize(), 0.22);

    // Camera: slow push-in with a little hand-held sway; focus racks from the trace to the leaf
    const e = ease(T);
    camPos = shot.pos.clone().addScaledVector(shot.drift, e).add(V(0.006 * Math.sin(T * 5.1), 0.004 * Math.sin(T * 3.7 + 1), 0.005 * Math.sin(T * 4.3 + 2)));
    focus = focusA.clone().lerp(leafCentre, ease(span(T, 0.22, 0.8)));
    ap = shot.aperture * (1 - 0.55 * ease(span(T, 0.6, 0.84)));
    cam.position.copy(camPos); cam.lookAt(shot.aim);
    cam.updateMatrixWorld();
    const fwd = V(); cam.getWorldDirection(fwd);
    focusDist = focus.clone().sub(camPos).dot(fwd);          // depth of the focal plane
    focusOnAxis.copy(camPos).addScaledVector(fwd, focusDist);
    cam.updateMatrixWorld();
    right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
  }

  function sample({ ax, ay, lx, ly, jx, jy }) {
    cam.position.copy(camPos).addScaledVector(right, ax * ap).addScaledVector(up, ay * ap);
    cam.lookAt(focusOnAxis);
    cam.setViewOffset(W, H, jx, jy + shot.shiftY * H, W, H);
    sun.position.copy(sunBase).addScaledVector(sunU, lx * 0.38).addScaledVector(sunV, ly * 0.38);
  }

  return {
    scene, camera: cam, frames: FRAMES, prepare, sample,
    fade: (f) => { const T = f / (FRAMES - 1); return smooth(span(T, 0, 0.1)) * (1 - smooth(span(T, 0.9, 1))); },
    exposureFrame: 60,
    exposurePatch: mobile ? [0.78, 0.04, 0.95, 0.12] : [0.84, 0.05, 0.96, 0.16],     // bare paper, bottom right
    paperWhite: 1.1, grain: 0.032, edge: 0.07,
  };
}
