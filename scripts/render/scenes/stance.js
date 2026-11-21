// Stance section (homepage section 2): "We're not consultants. We're builders."
// One continuous organic line enters from the left edge and draws itself across the paper: a fine copper
// wire that thickens into a living stem, lifts off the page and opens one leaf from its tip. Line and leaf are
// one form. Macro still-life look (approved study A): low warm raking light, soft shadow, shallow focus.
// The first frame is bare white paper; the last frame HOLDS the leaf (end state of the section).
// Composition: the left/top of the frame stays empty for type; the leaf sits in the right third.
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export async function setup({ THREE, renderer, W, H, variant }) {
  const FRAMES = 120;                                   // 5 s at 24 fps
  const mobile = variant === "mobile";
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const smooth = (t) => t * t * (3 - 2 * t);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(2, 2, 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;
  scene.fog = new THREE.FogExp2(new THREE.Color(2, 2, 2), 0.022);

  // ---------- Paper ----------
  function paperNormal(size = 512) {
    const hgt = new Float32Array(size * size);
    const rnd = (() => { let s = 99; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    for (let i = 0; i < hgt.length; i++) hgt[i] = rnd() * 0.35;
    for (let k = 0; k < 2200; k++) {
      const x = rnd() * size, y = rnd() * size, a = rnd() * Math.PI, len = 6 + rnd() * 26, hh = 0.25 + rnd() * 0.5;
      for (let s = 0; s < len; s++) { const ix = (((x + Math.cos(a) * s) | 0) % size + size) % size, iy = (((y + Math.sin(a) * s) | 0) % size + size) % size; hgt[iy * size + ix] += hh; }
    }
    const blur = new Float32Array(hgt.length);
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
    color: 0xffffff, roughness: 0.93, metalness: 0, normalMap: paperNormal(), normalScale: new THREE.Vector2(0.1, 0.1),
  }));
  paper.rotation.x = -Math.PI / 2;
  paper.receiveShadow = true;
  scene.add(paper);

  // ---------- Light: warm raking key from back-left, cool bounce from front-right ----------
  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.88, 0.72), 3.5);
  const sunBase = V(-3.0, 2.9, -2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.1, far: 24 });
  sun.shadow.bias = -0.00015; sun.shadow.normalBias = 0.001; sun.shadow.radius = 1.5;
  sun.target.position.set(0.3, 0, 0.2);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(new THREE.Color(0.74, 0.85, 1.0), 0.55);
  fill.position.set(3, 2.4, 4); scene.add(fill);
  scene.add(new THREE.HemisphereLight(new THREE.Color(0.86, 0.9, 1.0), new THREE.Color(1.0, 0.96, 0.9), 0.14));
  const sunU = V(0, 1, 0).cross(sunBase).normalize(), sunV = sunBase.clone().cross(sunU).normalize();

  // ---------- The line: one smooth, slightly irregular curve (no straight runs, no corners) ----------
  const ctrl = [V(-2.3, 0, 0.62), V(-1.75, 0, 0.42), V(-1.05, 0, 0.74), V(-0.25, 0, 0.5), V(0.45, 0.03, 0.56),
       V(0.92, 0.2, 0.38), V(1.18, 0.5, 0.22), V(1.28, 0.82, 0.12)];
  const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");
  const NP = 900;
  const path = curve.getSpacedPoints(NP);
  const L = curve.getLength();
  // fine organic wander, strongest in the middle, never at the ends
  path.forEach((p, i) => { const v = i / NP, w = Math.sin(Math.PI * v); p.x += 0.006 * Math.sin(v * 41 + 0.7) * w; p.z += 0.012 * Math.sin(v * 29 + 1.9) * w; });
  const vLift = 0.62;                                  // where the line starts to leave the paper (approx.)

  // Thickness: fine wire → swelling stem → tapering into the leaf stalk; small living variation.
  const radiusAt = (v) => {
    const wire = 0.012, stem = 0.029, stalk = 0.0105;
    let r = wire + (stem - wire) * smooth(span(v, 0.42, 0.74));
    r += (stalk - stem) * smooth(span(v, 0.8, 1.0));
    return r * (1 + 0.07 * Math.sin(v * 63 + 0.4) * smooth(span(v, 0.45, 0.6)));
  };
  // Material along the length: copper wire → bark → young green stalk (stored as aBark / aV).
  const barkAt = (v) => smooth(span(v, 0.36, 0.66));

  const RS = 16;
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.3, envMapIntensity: 1.25 });
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
        vec3 bark = mix(vec3(0.13, 0.075, 0.035), vec3(0.33, 0.21, 0.09), b);
        vec3 young = mix(vec3(0.2, 0.27, 0.06), vec3(0.33, 0.4, 0.1), b);
        vec3 living = mix(bark, young, smoothstep(0.78, 0.97, vV));
        vec3 copper = vec3(0.93, 0.52, 0.28) * (0.84 + 0.16 * vn(vec2(vTube.x * 180.0, vTube.y * 9.0)));
        diffuseColor.rgb = mix(copper, living, vBark);`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.24 + 0.1 * b, 0.74 + 0.12 * b, vBark);")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = mix(1.0, 0.0, smoothstep(0.0, 0.55, vBark));");
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

  // ---------- Leaf (approved macro look), grows out of the tip from nothing ----------
  function leafTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 1024;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 1024, 0, 0);
    g.addColorStop(0, "#476b22"); g.addColorStop(0.6, "#739b35"); g.addColorStop(1, "#92ae47");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    const r = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < 0.5 ? "30,45,10" : "150,170,80"},${0.03 + r() * 0.05})`; x.beginPath(); x.arc(r() * 1024, r() * 1024, 2 + r() * 14, 0, 7); x.fill(); }
    x.lineCap = "round";
    x.strokeStyle = "rgba(188,204,113,0.6)"; x.lineWidth = 4; x.beginPath(); x.moveTo(512, 1024); x.quadraticCurveTo(505, 500, 512, 20); x.stroke();
    for (let k = 1; k <= 10; k++) {
      const y0 = 1024 - k * 92, reach = 380 * Math.sin(Math.PI * Math.min(1, (k / 11) ** 0.8));
      for (const sgn of [-1, 1]) {
        x.strokeStyle = "rgba(178,198,108,0.32)"; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(512, y0); x.quadraticCurveTo(512 + sgn * reach * 0.45, y0 - 40, 512 + sgn * reach, y0 - 120 - r() * 30); x.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  const leafTex = leafTexture();
  const leafMat = new THREE.MeshPhysicalMaterial({
    map: leafTex, bumpMap: leafTex, bumpScale: 0.018, roughness: 0.64, metalness: 0, side: THREE.DoubleSide,
    sheen: 0.15, sheenRoughness: 0.8, sheenColor: new THREE.Color(0.55, 0.65, 0.35),
  });
  leafMat.onBeforeCompile = (shader) => {                // light through the thin tissue (backlit glow)
    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
      vec3 tissue = texture2D(map, vMapUv).rgb;
      float through = 0.2 + 0.8 * pow(max(0.0, dot(normal, normalize(vec3(-0.4, 0.65, -0.6)))), 1.5);
      outgoingLight += tissue * vec3(0.85, 1.0, 0.35) * through * 0.34;
      #include <opaque_fragment>`);
  };
  const NU = 64, NV = 140;
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
  const LEAF = mobile ? 0.8 : 0.86;

  function shapeLeaf(open, time) {
    const scale = 0.02 + 0.98 * easeOut(open);          // from a bud at the tip, no pop-in
    const Lf = LEAF * scale, Wl = LEAF * 0.37 * scale;
    const fold = THREE.MathUtils.degToRad(86 - 78 * smooth(open));
    const curl = 1.6 - 1.33 * smooth(open) + 0.03 * Math.sin(time * 2.1);
    for (let j = 0; j <= NV; j++) {
      const t = j / NV;
      // short stalk at the base, so the stem flows into the blade
      const hw = Wl * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.75) * (1 - 0.2 * t) * smooth(span(t, 0.0, 0.12));
      const phi = curl * Math.pow(t, 1.4), rho = Lf / Math.max(1e-3, curl);
      const cy = rho * Math.sin(phi), cz = rho * (1 - Math.cos(phi));
      const ny = -Math.sin(phi), nz = Math.cos(phi);
      for (let i = 0; i <= NU; i++) {
        const sx = (i / NU) * 2 - 1, d = Math.abs(sx) * hw;
        const lx = Math.sign(sx) * d * Math.cos(fold) * (1 + 0.009 * Math.sin(t * 53 + sx));
        const lz = d * Math.sin(fold) + 0.1 * scale * Math.pow(Math.abs(sx), 1.6) * Math.sin(t * Math.PI) + 0.006 * Math.sin(t * 26 + sx * 2) * sx * sx * scale;
        lPos.set([lx, cy + ny * lz, cz + nz * lz], (j * (NU + 1) + i) * 3);
      }
    }
    leafGeo.attributes.position.needsUpdate = true;
    leafGeo.computeVertexNormals();
  }

  // ---------- Camera: low macro view, long lens; frame bottom-aligned, top-left left empty for type ----------
  const cam = new THREE.PerspectiveCamera(mobile ? 38 : 22, W / H, 0.05, 600);
  const shot = mobile
    ? { pos: V(0.9, 2.4, 5.5), aim: V(0.8, 0.72, 0.3), drift: V(-0.02, -0.02, -0.08), shiftY: 0, aperture: 0.035 }
    : { pos: V(0.6, 2.35, 5.4), aim: V(0.6, 0.66, 0.3), drift: V(-0.02, -0.03, -0.1), shiftY: 0, aperture: 0.045 };

  let camPos = shot.pos.clone();
  const focusOnAxis = V(), right = V(), up = V();

  function prepare(f) {
    const T = f / (FRAMES - 1);
    const grow = ease(span(T, 0.02, 0.72));             // the line draws itself
    const open = smooth(span(T, 0.6, 0.97));            // leaf unfolds from the tip

    const head = Math.max(2, Math.round(grow * NP));
    const pts = [], radii = [], bark = [], vs = [];
    const tipLen = 0.05 / L;                            // rounded growing tip, in v units
    for (let i = 0; i <= head; i++) {
      const v = i / NP, p = path[i].clone();
      let r = radiusAt(v);
      // growing tip tapers to a soft point; once the leaf opens the stalk carries straight into it
      const toTip = (head / NP - v) / tipLen;
      r *= THREE.MathUtils.lerp(0.15 + 0.85 * Math.sqrt(clamp(toTip)), 1, smooth(span(T, 0.66, 0.8)));
      const b = barkAt(v);
      p.y = r * 0.9 + 0.0005 + 0.5 * (p.y + Math.sqrt(p.y * p.y + 0.0004));   // smooth max: rests on paper, lifts without a kink
      pts.push(p); radii.push(r); bark.push(b); vs.push(v);
    }
    tube.geometry.dispose();
    tube.geometry = buildTube(pts, radii, bark, vs);

    // Leaf: base at the tip, its midrib continuing the stem's direction, turning to face the light as it opens
    const tipP = pts[pts.length - 1], tipT = pts[pts.length - 1].clone().sub(pts[Math.max(0, pts.length - 8)]).normalize();
    leaf.visible = open > 0.0005;
    if (leaf.visible) {
      shapeLeaf(open, T * 5);
      const rest = V(0.76, 0.52, -0.12).normalize();
      const Y = tipT.clone().lerp(rest, smooth(open) * 0.85 + 0.05 * Math.sin(T * 4.2) * open).normalize();
      const Z0 = V(-0.15, 0.45, 1).normalize();
      const X = Y.clone().cross(Z0).normalize(), Z = X.clone().cross(Y).normalize();
      leaf.matrixAutoUpdate = false;
      leaf.matrix.makeBasis(X, Y, Z).setPosition(tipP);
      leaf.matrixWorldNeedsUpdate = true;
    }
    // Focus follows the drawing tip, settling on the leaf
    const focus = tipP.clone().lerp(curve.getPoint(1).add(V(0.15, 0.2, -0.05)), smooth(span(T, 0.6, 0.95)));

    const e = ease(T);
    camPos = shot.pos.clone().addScaledVector(shot.drift, e).add(V(0.005 * Math.sin(T * 5.1), 0.003 * Math.sin(T * 3.7 + 1), 0.004 * Math.sin(T * 4.3 + 2)));
    cam.position.copy(camPos); cam.lookAt(shot.aim);
    cam.updateMatrixWorld();
    const fwd = V(); cam.getWorldDirection(fwd);
    focusOnAxis.copy(camPos).addScaledVector(fwd, focus.clone().sub(camPos).dot(fwd));
    right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
  }

  function sample({ ax, ay, lx, ly, jx, jy }) {
    cam.position.copy(camPos).addScaledVector(right, ax * shot.aperture).addScaledVector(up, ay * shot.aperture);
    cam.lookAt(focusOnAxis);
    cam.setViewOffset(W, H, jx, jy + shot.shiftY * H, W, H);
    sun.position.copy(sunBase).addScaledVector(sunU, lx * 0.4).addScaledVector(sunV, ly * 0.4);
  }

  return {
    scene, camera: cam, frames: FRAMES, prepare, sample,
    fade: (f) => smooth(span(f / (FRAMES - 1), 0, 0.04)),   // fade in only; the end frame holds the leaf
    exposureFrame: 100,
    exposurePatch: mobile ? [0.04, 0.03, 0.2, 0.1] : [0.03, 0.03, 0.14, 0.1],      // bare foreground paper, bottom left
    paperWhite: 1.08, grain: 0.018, edge: 0.1,
  };
}
