// Homepage section 3, "What we do". One continuous scene along a garden path.
// Left half ("Transform what exists"): the path starts close to camera, overgrown, crossed by knotted roots and
// arching briars, in cool early shade. As the clip plays (scroll), the roots and briars draw back, the grass on
// the path settles, and the low sun rises and warms the path.
// Right half ("Discover what's next"): the same path runs into an open wildflower field at sunrise: field gold,
// dusty rose haze, soft sage, backlit, continuing the hero footage.
// Nature-film look: low backlight, haze, shallow focus, soft foreground, grain (composite). Edges fade to page white.
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export async function setup({ THREE, renderer, W, H, variant }) {
  const FRAMES = 120;
  const mobile = variant === "mobile";
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (t) => t * t * (3 - 2 * t);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const C = (hex) => new THREE.Color(hex);
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const R = rng(20261120);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.12;
  const hazeCol = C("#f4d9c6");
  scene.fog = new THREE.FogExp2(hazeCol, 0.011);

  // ---------- Shared uniforms ----------
  const U = {
    uTime: { value: 0 }, uWind: { value: 0.035 }, uClear: { value: 0 },
    uSunView: { value: V(0, 0, -1) }, uSunCol: { value: C("#ffcf96") }, uBack: { value: 1.3 },
    uSunDir: { value: V(0.3, 0.1, -0.95) }, uSunAmt: { value: 1 },
  };

  // ---------- Path ----------
  const pathCurve = new THREE.CatmullRomCurve3([
    V(-5.4, 0, 9.5), V(-3.4, 0, 5.4), V(-1.7, 0, 1.4), V(0.1, 0, -2.6), V(2.3, 0, -7.6),
    V(4.9, 0, -14.5), V(8.4, 0, -24.5), V(12.8, 0, -39), V(18.5, 0, -60),
  ], false, "centripetal");
  const PATH = pathCurve.getSpacedPoints(600);
  const HALF = 0.85;
  const distToPath = (x, z) => {
    let best = 1e9, bi = 0;
    for (let i = 0; i < PATH.length; i += 3) { const dx = PATH[i].x - x, dz = PATH[i].z - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    for (let i = Math.max(0, bi - 3); i < Math.min(PATH.length, bi + 4); i++) { const dx = PATH[i].x - x, dz = PATH[i].z - z, d = dx * dx + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  };
  // "Tangle" zone: the near part of the path (left half of the frame)
  const tangleW = (z) => smooth(span(z, -5.5, -1.0));        // 1 near camera, 0 further on

  // ---------- Ground: earth with a worn, dusty path, painted to a texture ----------
  const GX0 = -40, GX1 = 40, GZ0 = -80, GZ1 = 14, GS = 2048;
  const toTex = (x, z) => [((x - GX0) / (GX1 - GX0)) * GS, ((z - GZ0) / (GZ1 - GZ0)) * GS];
  const gc = document.createElement("canvas"); gc.width = gc.height = GS;
  const g = gc.getContext("2d");
  g.fillStyle = "#6c6340"; g.fillRect(0, 0, GS, GS);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "60,52,30" : "130,118,78"},${0.06 + R() * 0.08})`; g.beginPath(); g.arc(R() * GS, R() * GS, 2 + R() * 9, 0, 7); g.fill(); }
  g.lineCap = "round"; g.lineJoin = "round";
  const pxPerM = GS / (GX1 - GX0);
  for (const [w, col] of [[2.0, "rgba(150,128,92,0.35)"], [1.45, "rgba(176,152,112,0.75)"], [1.1, "rgba(190,166,126,0.9)"]]) {
    g.strokeStyle = col; g.lineWidth = w * pxPerM; g.beginPath();
    PATH.forEach((p, i) => { const [u, v] = toTex(p.x, p.z); i ? g.lineTo(u, v) : g.moveTo(u, v); }); g.stroke();
  }
  for (let i = 0; i < 2600; i++) {                                   // pebbles and dust on the path
    const p = PATH[(R() * PATH.length) | 0], [u, v] = toTex(p.x + (R() - 0.5) * 1.0, p.z + (R() - 0.5) * 1.0);
    g.fillStyle = `rgba(${R() < 0.5 ? "120,100,70" : "214,196,160"},${0.15 + R() * 0.25})`; g.beginPath(); g.arc(u, v, 1 + R() * 3, 0, 7); g.fill();
  }
  const gTex = new THREE.CanvasTexture(gc); gTex.colorSpace = THREE.SRGBColorSpace; gTex.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(GX1 - GX0, GZ1 - GZ0), new THREE.MeshStandardMaterial({ map: gTex, roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set((GX0 + GX1) / 2, 0, (GZ0 + GZ1) / 2); ground.receiveShadow = true;
  scene.add(ground);
  const farGround = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: C("#7d6f3e"), roughness: 1 }));
  farGround.rotation.x = -Math.PI / 2; farGround.position.y = -0.01; scene.add(farGround);

  // ---------- Sky: dusty rose haze, warm gold towards the low sun, pale overhead ----------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 uSunDir; uniform float uSunAmt; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float el = clamp(d.y, -0.2, 1.0);
        vec3 horizon = vec3(0.86, 0.68, 0.62), rose = vec3(0.84, 0.66, 0.64), top = vec3(0.93, 0.86, 0.84);
        vec3 c = mix(horizon, rose, smoothstep(0.0, 0.12, el)); c = mix(c, top, smoothstep(0.1, 0.55, el));
        float s = max(0.0, dot(d, normalize(uSunDir)));
        c += vec3(1.0, 0.72, 0.38) * (0.55 * pow(s, 12.0) + 0.6 * pow(s, 90.0)) * uSunAmt;   // soft glow, no hard disc
        c = mix(c, vec3(0.908, 0.701, 0.573), smoothstep(0.16, 0.0, el));   // = fog colour in linear light: no seam at the horizon
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  scene.add(sky);

  // ---------- Light ----------
  const sun = new THREE.DirectionalLight(C("#ffd2a0"), 2.0);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 120 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  const sunTarget = V(1.0, 0, -6);
  sun.target.position.copy(sunTarget); scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(C("#f2d6cc"), C("#5e5434"), 0.9); scene.add(hemi);

  // ---------- Vegetation material: blades sway, backlit tissue glows ----------
  function vegMaterial(base) {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, side: THREE.DoubleSide, ...base });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime, uWind, uClear; attribute float aPhase; attribute float aClear;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float h = max(0.0, position.y);
          float sway = uWind * h * h * (sin(uTime * 1.6 + aPhase) + 0.35 * sin(uTime * 3.7 + aPhase * 2.3));
          transformed.x += sway; transformed.z += 0.4 * sway * cos(aPhase);
          transformed.y *= mix(1.0, 0.22, aClear * uClear);
          transformed.x += aClear * uClear * 0.25 * h * cos(aPhase);  // settles outwards, off the path`);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uSunView; uniform vec3 uSunCol; uniform float uBack;")
        .replace("#include <opaque_fragment>", `
          float back = pow(max(0.0, dot(normalize(-vViewPosition), normalize(uSunView))), 3.0);
          outgoingLight += diffuseColor.rgb * uSunCol * uBack * back;
          #include <opaque_fragment>`);
    };
    return m;
  }

  // Blade: a tapered, slightly curved strip, height 1, width 1 (scaled per instance)
  function bladeGeometry(segs = 6) {
    const pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, w = 0.5 * (1 - t) ** 0.9, bend = 0.18 * t * t;
      pos.push(-w, t, bend, w, t, bend);
      if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  }

  // Scatter positions over what the camera sees
  function inView(x, z) { return z < 10.5 && z > -75 && Math.abs(x - 0.25 * (8 - z) * 0.55) < 3.2 + (10 - z) * 0.72; }
  const palette = { sage: C("#959a6c"), sage2: C("#aaa775"), straw: C("#c4a663"), gold: C("#c29a2c"), olive: C("#857a3e"), dry: C("#d2bd8c") };

  const blades = [];
  const N_BLADES = mobile ? 70000 : 85000;
  let tries = 0;
  while (blades.length < N_BLADES && tries++ < N_BLADES * 8) {
    // denser sampling near the camera
    const z = 8.6 - Math.pow(R(), 1.9) * 84, x = (R() - 0.5) * (8 + (10 - z) * 1.5) + (8 - z) * 0.14;
    if (!inView(x, z)) continue;
    const d = distToPath(x, z), tw = tangleW(z);
    let onPath = 0;
    if (d < HALF) { if (R() > 0.5 * tw) continue; onPath = 1; }            // the path is clear except where overgrown
    else if (d < HALF + 0.25 && R() < 0.5 * (1 - tw)) continue;             // trodden edges further on
    const tall = THREE.MathUtils.lerp(0.34, 0.75, tw) * (0.5 + R() * 0.7);
    const verge = 0.45 + 0.55 * smooth(span(d, HALF, HALF + 1.6));   // grass lower along the path edge
    blades.push({ x, z, h: onPath ? tall * 0.8 : tall * verge, w: 0.018 + R() * 0.02, rot: R() * Math.PI, lean: (R() - 0.5) * 0.5, onPath, tw });
  }
  const bladeMesh = new THREE.InstancedMesh(bladeGeometry(), vegMaterial({}), blades.length);
  const aPhase = new Float32Array(blades.length), aClear = new Float32Array(blades.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V(1, 1, 1), col = new THREE.Color();
  blades.forEach((b, i) => {
    e.set(b.lean, b.rot, (R() - 0.5) * 0.3); q.setFromEuler(e); s.set(b.w, b.h, 1);
    m4.compose(V(b.x, 0, b.z), q, s); bladeMesh.setMatrixAt(i, m4);
    const r = R();
    col.copy(r < 0.22 ? palette.sage : r < 0.36 ? palette.sage2 : r < 0.7 ? palette.straw : r < 0.82 ? palette.olive : palette.dry);
    if (b.tw > 0.5) col.lerp(palette.olive, 0.35);                         // the overgrown part is greener, denser
    col.offsetHSL(0, 0, (R() - 0.5) * 0.06); bladeMesh.setColorAt(i, col);
    aPhase[i] = R() * 6.283; aClear[i] = b.onPath;
  });
  bladeMesh.geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(aPhase, 1));
  bladeMesh.geometry.setAttribute("aClear", new THREE.InstancedBufferAttribute(aClear, 1));
  bladeMesh.castShadow = true; bladeMesh.receiveShadow = true; bladeMesh.frustumCulled = false;
  scene.add(bladeMesh);

  // ---------- Flower heads: tansy-like gold clusters, a few dusty rose and cream ----------
  const heads = [];
  const N_HEADS = mobile ? 14000 : 17000;
  tries = 0;
  while (heads.length < N_HEADS && tries++ < N_HEADS * 10) {
    const z = 8.4 - Math.pow(R(), 1.5) * 80, x = (R() - 0.5) * (8 + (10 - z) * 1.5) + (8 - z) * 0.14;
    if (!inView(x, z) || distToPath(x, z) < HALF + 0.15) continue;
    const field = 1 - tangleW(z) * 0.8;                                    // the open field flowers most
    if (R() > field) continue;
    const cx = x, cz = z, ch = 0.22 + R() * 0.32, n = 3 + ((R() * 6) | 0), phase = R() * 6.283;
    const r = R(), hue = r < 0.78 ? palette.gold : r < 0.9 ? C("#cf9f93") : C("#e3d3b2");
    for (let k = 0; k < n; k++) heads.push({ x: cx + (R() - 0.5) * 0.09, y: ch + (R() - 0.5) * 0.06, z: cz + (R() - 0.5) * 0.09, r: 0.016 + R() * 0.016, col: hue, phase });
  }
  const headMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), vegMaterial({ roughness: 0.65 }), heads.length);
  const hPhase = new Float32Array(heads.length), hClear = new Float32Array(heads.length);
  heads.forEach((f, i) => {
    m4.compose(V(f.x, f.y, f.z), q.identity(), s.set(f.r, f.r * 0.8, f.r)); headMesh.setMatrixAt(i, m4);
    col.copy(f.col).offsetHSL(0, (R() - 0.5) * 0.05, (R() - 0.5) * 0.06); headMesh.setColorAt(i, col);
    hPhase[i] = f.phase;
  });
  headMesh.geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(hPhase, 1));
  headMesh.geometry.setAttribute("aClear", new THREE.InstancedBufferAttribute(hClear, 1));
  headMesh.castShadow = true; headMesh.frustumCulled = false;
  scene.add(headMesh);

  // ---------- Roots and briars across the near path: they draw back as the path clears ----------
  const RS = 10;
  function tube(pts, radius) {
    const n = pts.length, pos = new Float32Array(n * (RS + 1) * 3), nor = new Float32Array(n * (RS + 1) * 3), idx = [];
    let T = pts[1].clone().sub(pts[0]).normalize(), N = V(0, 1, 0).cross(T).normalize();
    if (N.lengthSq() < 1e-6) N = V(1, 0, 0);
    for (let i = 0; i < n; i++) {
      const Tn = (i < n - 1 ? pts[i + 1].clone().sub(pts[i]) : pts[i].clone().sub(pts[i - 1])).normalize();
      const axis = T.clone().cross(Tn), ang = Math.asin(clamp(axis.length(), -1, 1));
      if (axis.lengthSq() > 1e-12) N.applyAxisAngle(axis.normalize(), ang);
      T = Tn; const B = T.clone().cross(N).normalize(), r = radius(i / (n - 1));
      for (let k = 0; k <= RS; k++) {
        const a = (k / RS) * Math.PI * 2, d = N.clone().multiplyScalar(Math.cos(a)).add(B.clone().multiplyScalar(Math.sin(a))), j = i * (RS + 1) + k;
        pos.set(pts[i].clone().addScaledVector(d, r).toArray(), j * 3); nor.set(d.toArray(), j * 3);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < RS; k++) { const a = i * (RS + 1) + k, b = a + RS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
    geo.userData.segs = n - 1;
    return geo;
  }
  const barkMat = new THREE.MeshStandardMaterial({ color: C("#7a5f43"), roughness: 0.85, metalness: 0 });
  const briarMat = new THREE.MeshStandardMaterial({ color: C("#6e5a3c"), roughness: 0.8, metalness: 0 });
  const tangles = [];
  const pathAt = (z) => { let best = PATH[0], bd = 1e9; for (const p of PATH) { const d = Math.abs(p.z - z); if (d < bd) { bd = d; best = p; } } return best; };
  const pathNormalAt = (z) => { const i = PATH.indexOf(pathAt(z)), a = PATH[Math.max(0, i - 2)], b = PATH[Math.min(PATH.length - 1, i + 2)]; const t = b.clone().sub(a).normalize(); return V(-t.z, 0, t.x); };
  // knotted roots lying across the path
  for (let k = 0; k < 12; k++) {
    const z0 = 6.4 - k * 0.8 - R() * 0.4, c = pathAt(z0), nrm = pathNormalAt(z0), side = R() < 0.5 ? 1 : -1;
    const pts = [], n = 90, loops = 1 + R() * 2.2, ph = R() * 6;
    for (let i = 0; i <= n; i++) {
      const t = i / n, across = side * THREE.MathUtils.lerp(HALF + 0.5, -(HALF + 0.35), t);
      const p = c.clone().addScaledVector(nrm, across);
      p.x += (R() - 0.5) * 0.004; p.z += 0.14 * Math.sin(t * Math.PI * loops * 2 + ph);
      p.y = 0.03 + 0.12 * Math.pow(Math.max(0, Math.sin(t * Math.PI * (loops + 0.5) + ph)), 3) + 0.02 * Math.sin(t * 17 + ph);
      pts.push(p);
    }
    const r0 = 0.03 + R() * 0.03;
    const m = new THREE.Mesh(tube(pts, (t) => r0 * (1 - 0.6 * t) * (1 + 0.15 * Math.sin(t * 31))), barkMat);
    m.castShadow = m.receiveShadow = true; scene.add(m);
    tangles.push({ m, start: 0.08 + 0.05 * k + R() * 0.06, sink: 0.012 });
  }
  // briars arching over the path
  for (let k = 0; k < 11; k++) {
    const z0 = 6.2 - k * 0.85 - R() * 0.5, c = pathAt(z0), nrm = pathNormalAt(z0), side = R() < 0.5 ? 1 : -1;
    const pts = [], n = 80, arch = 0.35 + R() * 0.45;
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = c.clone().addScaledVector(nrm, side * THREE.MathUtils.lerp(HALF + 0.6, -(HALF + 0.2), t));
      p.y = arch * Math.sin(Math.PI * Math.pow(t, 0.8)) + 0.02; p.z += 0.2 * Math.sin(t * 5 + k);
      pts.push(p);
    }
    const m = new THREE.Mesh(tube(pts, (t) => 0.011 * (1 - 0.7 * t) + 0.003), briarMat);
    m.castShadow = true; scene.add(m);
    tangles.push({ m, start: 0.05 + 0.06 * k + R() * 0.05, sink: 0 });
  }

  // ---------- Camera ----------
  const cam = new THREE.PerspectiveCamera(mobile ? 52 : 34, W / H, 0.05, 900);
  const shot = mobile
    ? { pos: V(-2.4, 2.3, 11.4), aim: V(1.6, 0.0, -5), drift: V(0.12, 0.0, -0.45), aperture: 0.04, focusZ: 2.5 }
    : { pos: V(-1.4, 2.25, 11.2), aim: V(3.2, 0.1, -5), drift: V(0.18, 0.0, -0.55), aperture: 0.05, focusZ: 3.0 };
  let camPos = shot.pos.clone();
  const focusOnAxis = V(), right = V(), up = V(), sunDir = V(), sunJ = { u: V(), v: V() };

  function prepare(f) {
    const T = f / (FRAMES - 1);
    const clear = ease(span(T, 0.08, 0.8));
    U.uTime.value = T * 5;                                              // seconds of breeze
    U.uClear.value = clear;
    tangles.forEach((t) => {
      const c = smooth(span(clear, t.start * 0.6, t.start * 0.6 + 0.55));
      t.m.visible = c < 0.999;
      t.m.geometry.setDrawRange(0, Math.round(t.m.geometry.userData.segs * (1 - c)) * RS * 6);
      t.m.position.y = -t.sink * c;
    });
    // morning: the sun lifts and warms; the near path comes into the light
    const el = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(4.5, 10.5, ease(T)));
    const az = THREE.MathUtils.degToRad(mobile ? 18 : 22);
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    U.uSunDir.value.copy(sunDir);
    U.uSunAmt.value = THREE.MathUtils.lerp(0.75, 1.15, ease(T));
    sun.intensity = THREE.MathUtils.lerp(0.7, 3.2, ease(T));
    sun.color.copy(C("#e8c4b4")).lerp(C("#ffcc8a"), ease(T));
    U.uSunCol.value.copy(sun.color);
    hemi.intensity = THREE.MathUtils.lerp(0.62, 0.95, ease(T));
    sunJ.u.copy(V(0, 1, 0).cross(sunDir).normalize()); sunJ.v.copy(sunDir.clone().cross(sunJ.u).normalize());

    const e2 = ease(T);
    camPos = shot.pos.clone().addScaledVector(shot.drift, e2);
    cam.position.copy(camPos); cam.lookAt(shot.aim); cam.updateMatrixWorld();
    const fwd = V(); cam.getWorldDirection(fwd);
    const focusP = pathAt(shot.focusZ).clone().setY(0.3);
    focusOnAxis.copy(camPos).addScaledVector(fwd, focusP.clone().sub(camPos).dot(fwd));
    right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
  }

  function sample({ ax, ay, lx, ly, jx, jy }) {
    cam.position.copy(camPos).addScaledVector(right, ax * shot.aperture).addScaledVector(up, ay * shot.aperture);
    cam.lookAt(focusOnAxis);
    cam.setViewOffset(W, H, jx, jy, W, H);
    cam.updateMatrixWorld();
    const d = sunDir.clone().addScaledVector(sunJ.u, lx * 0.012).addScaledVector(sunJ.v, ly * 0.012).normalize();
    sun.position.copy(sunTarget).addScaledVector(d, 60);
    U.uSunView.value.copy(sunDir).transformDirection(cam.matrixWorldInverse);
  }

  return {
    scene, camera: cam, frames: FRAMES, prepare, sample,
    fade: () => 1,                                                      // always a full picture; edges still fade to page
    exposureFrame: 60,
    exposurePatch: mobile ? [0.35, 0.86, 0.65, 0.96] : [0.3, 0.86, 0.6, 0.96],   // upper sky
    paperWhite: 0.93, grain: 0.016, edge: 0.0001,          // soft edges come from a CSS mask on the page
  };
}
