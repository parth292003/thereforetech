// "How we work" steps: a tiny hand-drawn stick-figure story living on the four rules above the steps.
// Decorative only (aria-hidden SVG); the step text is the content. Reads the rules' real positions, so the
// same story runs on desktop (4 columns: jumps sideways), tablet (2x2) and mobile (stacked: drops down
// through the gutter). Runs only while the steps are on screen; reduced motion shows one still per rule.
(() => {
  const list = document.querySelector(".steps");
  if (!list) return;
  const steps = [...list.querySelectorAll(".step")];
  if (steps.length < 4) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };

  // ---------- SVG ----------
  const svg = el("svg", { class: "steps-story", "aria-hidden": "true", focusable: "false" });
  const defs = el("defs", {}, svg);
  const filt = el("filter", { id: "ink-boil", x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs);
  const turb = el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.06", numOctaves: "2", seed: "1", result: "n" }, filt);
  el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "1.6", xChannelSelector: "R", yChannelSelector: "G" }, filt);
  const clip = el("clipPath", { id: "behind-rule" }, defs);
  const clipRect = el("rect", {}, clip);
  const ink = el("g", { filter: "url(#ink-boil)", fill: "none", stroke: "currentColor", "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
  const props = el("path", {}, ink);
  const propsFill = el("path", { fill: "currentColor", stroke: "none" }, ink);
  const propsThick = el("path", {}, ink);   // the magnifier's handle, drawn heavier like a search icon
  const usG = el("g", {}, ink), fG = el("g", { "clip-path": "url(#behind-rule)" }, ink);
  const usP = el("path", {}, usG), usHead = el("path", {}, usG);
  const fP = el("path", {}, fG), fHead = el("path", { fill: "currentColor" }, fG);
  list.appendChild(svg);

  // ---------- Layout ----------
  let R = [], S = 1, W = 1.6;
  function measure() {
    // layout positions (offset*), not getBoundingClientRect: the steps' reveal slides them with a transform
    R = steps.map((s) => ({ x0: s.offsetLeft, x1: s.offsetLeft + s.offsetWidth, y: s.offsetTop, w: s.offsetWidth }));
    const mobile = innerWidth < 768;
    S = (mobile ? 26 : 30) / 32; W = mobile ? 1.5 : 1.7;
    ink.setAttribute("stroke-width", W); propsThick.setAttribute("stroke-width", W * 2);
  }

  // ---------- Hand-drawn primitives ----------
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const jit = (seed) => { const r = rnd(seed); return Array.from({ length: 16 }, () => (r() - 0.5) * 1.1); };
  const J = { us: jit(7), f: jit(31) };
  const f1 = (n) => n.toFixed(1);
  function line(a, b, j = 0) {             // slightly bowed stroke, like a pen line
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return `M${f1(a[0])} ${f1(a[1])}Q${f1(mx - (dy / L) * j)} ${f1(my + (dx / L) * j)} ${f1(b[0])} ${f1(b[1])}`;
  }
  function circle(c, r, j = 0) {           // hand-drawn loop: two half arcs with fixed ends, so the centre stays exactly on c
    const a = r * (1 + 0.05 * j), b = r * (1 - 0.04 * j);
    return `M${f1(c[0] + a)} ${f1(c[1])}A${f1(a)} ${f1(b)} 0 0 1 ${f1(c[0] - a)} ${f1(c[1])}A${f1(a)} ${f1(b)} 0 0 1 ${f1(c[0] + a * 0.97)} ${f1(c[1] - b * 0.24)}`;
  }

  // Search-icon magnifier held at hand h, angled down at the ground. Returns [lens, handle].
  function magnifier(h, dir) {
    const v = [dir * 0.72, 0.69], r = 3.9 * S, hl = 3.4 * S;
    const a = [h[0] - v[0] * 0.6 * S, h[1] - v[1] * 0.6 * S], b = [h[0] + v[0] * hl, h[1] + v[1] * hl];
    const c = [b[0] + v[0] * r, b[1] + v[1] * r];
    const g0 = [c[0] - dir * 0.55 * r, c[1] - 0.15 * r], g1 = [c[0] - dir * 0.15 * r, c[1] - 0.6 * r];
    return [circle(c, r) + `M${f1(g0[0])} ${f1(g0[1])}Q${f1(c[0] - dir * 0.55 * r)} ${f1(c[1] - 0.55 * r)} ${f1(g1[0])} ${f1(g1[1])}`, `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`];
  }

  // ---------- Figure ----------
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = (t) => 1 - (1 - t) * (1 - t);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const POSE = { lean: 0, tilt: 0, l1: 0, k1: 0, l2: 0, k2: 0, a1: 0.15, e1: 0.2, a2: -0.1, e2: 0.2 };
  const mix = (p, q, t) => { const o = {}; for (const k in POSE) o[k] = lerp(p[k] ?? POSE[k], q[k] ?? POSE[k], t); return o; };
  const pose = (o) => ({ ...POSE, ...o });
  const stand = (t = 0) => pose({ lean: 0.02 * Math.sin(t * 0.9), l1: 0.13 + 0.03 * Math.sin(t * 0.9), k1: 0.05, l2: -0.12 + 0.03 * Math.sin(t * 0.9), k2: 0.08,
    a1: 0.22 + 0.04 * Math.sin(t * 2), e1: 0.18, a2: -0.2 + 0.03 * Math.sin(t * 1.7), e2: 0.22, tilt: 0.05 * Math.sin(t * 1.3) });
  const walk = (ph, amp = 1) => pose({ lean: 0.08 * amp, tilt: 0.04 * Math.sin(2 * ph), l1: 0.42 * amp * Math.sin(ph), l2: -0.42 * amp * Math.sin(ph),
    k1: 0.12 + 0.75 * amp * Math.max(0, Math.sin(ph + 1.6)), k2: 0.12 + 0.75 * amp * Math.max(0, Math.sin(ph + 1.6 + Math.PI)),
    a1: -0.38 * amp * Math.sin(ph), e1: 0.25 + 0.25 * amp * Math.max(0, -Math.sin(ph)), a2: 0.38 * amp * Math.sin(ph), e2: 0.25 + 0.25 * amp * Math.max(0, Math.sin(ph)) });
  const run = (ph) => pose({ lean: 0.2, tilt: -0.05, l1: 0.68 * Math.sin(ph), l2: -0.68 * Math.sin(ph),
    k1: 0.2 + 1.35 * Math.max(0, Math.sin(ph + 1.2)), k2: 0.2 + 1.35 * Math.max(0, Math.sin(ph + 1.2 + Math.PI)),
    a1: -0.85 * Math.sin(ph), e1: 1.5, a2: 0.85 * Math.sin(ph), e2: 1.5 });
  // in the air: arms throw up on take-off, knees tuck at the peak, legs reach forward to land, arms out for balance
  const flight = (t) => t < 0.35 ? mix(pose({ lean: 0.15, l1: -0.15, k1: 0.3, l2: -0.35, k2: 0.6, a1: 2.6, e1: 0.2, a2: 2.4, e2: 0.3 }), tuck, t / 0.35)
    : mix(tuck, pose({ lean: 0.05, l1: 0.45, k1: 0.25, l2: 0.15, k2: 0.5, a1: 1.6, e1: 0.3, a2: 1.2, e2: 0.5 }), ease((t - 0.35) / 0.65));
  const crouch = pose({ lean: 0.35, l1: 0.95, k1: 1.9, l2: 0.75, k2: 1.7, a1: -0.7, e1: 0.4, a2: -0.8, e2: 0.4 });
  const tuck = pose({ lean: 0.2, l1: 0.9, k1: 1.6, l2: 0.4, k2: 1.2, a1: 2.4, e1: 0.3, a2: 2.0, e2: 0.4 });
  const search = (ph) => pose({ ...walk(ph, 0.5), lean: 0.75, tilt: 0.25, a1: 1.15, e1: 0.25, a2: -0.6, e2: 1.6 });   // bent, glass out, hand on back
  const offer = pose({ a1: 1.45, e1: 0.05, a2: -0.1, l1: 0.1, l2: -0.08 });
  const read = (nod = 0) => pose({ a1: 0.9, e1: 1.25, a2: 0.85, e2: 1.3, tilt: 0.35 + nod, l1: 0.05, l2: -0.05 });
  const carry = (ph, amp) => pose({ ...walk(ph, amp), a1: 0.95, e1: 0.75, a2: 0.9, e2: 0.8 });
  const reach = pose({ lean: -0.05, tilt: -0.25, a1: 2.5, e1: 0.25, a2: 2.35, e2: 0.35, l1: 0.08, l2: -0.08 });
  const shake = (ph = 0) => pose({ ...stand(), lean: 0.06, a1: 1.3 + 0.13 * Math.sin(ph), e1: 0.12 - 0.08 * Math.sin(ph), a2: -0.18, e2: 0.25 });   // right hand out, pumping
  const talk = (t, on) => pose({ ...stand(t), a1: on ? 0.5 + 0.35 * Math.sin(t * 7) : 0.12, e1: on ? 0.9 + 0.3 * Math.sin(t * 5) : 0.2, tilt: on ? 0.06 * Math.sin(t * 9) : 0 });

  function skeleton(F) {
    const p = F.p, d = F.dir, s = S;
    const TH = 7 * s, SH = 7 * s, TO = 10 * s, UA = 5.5 * s, FA = 5 * s, NH = 4.6 * s;
    const leg = (a, k) => { const kn = [TH * Math.sin(a) * d, TH * Math.cos(a)]; return [kn, [kn[0] + SH * Math.sin(a - k) * d, kn[1] + SH * Math.cos(a - k)]]; };
    const L1 = leg(p.l1, p.k1), L2 = leg(p.l2, p.k2);
    const low = Math.max(L1[1][1], L2[1][1]);
    const hy = -low - (F.air || 0);
    const P = (q) => [q[0], q[1] + hy];
    const hip = [0, hy];
    const neck = [TO * Math.sin(p.lean) * d, hy - TO * Math.cos(p.lean)];
    const sh = [lerp(neck[0], hip[0], 0.1), lerp(neck[1], hip[1], 0.1)];
    const arm = (a, e) => { const el = [sh[0] + UA * Math.sin(a) * d, sh[1] + UA * Math.cos(a)]; return [el, [el[0] + FA * Math.sin(a + e) * d, el[1] + FA * Math.cos(a + e)]]; };
    const A1 = arm(p.a1, p.e1), A2 = arm(p.a2, p.e2);
    const head = [neck[0] + NH * Math.sin(p.lean + p.tilt) * d, neck[1] - NH * Math.cos(p.lean + p.tilt)];
    // squash about the feet
    const q = F.sq || 0, T = (pt) => [F.x + pt[0] * (1 + q * 0.6), F.y + pt[1] * (1 - q)];
    return { hip: T(hip), neck: T(neck), sh: T(sh), head: T(head), r: 3.5 * s,
      k1: T(P(L1[0])), f1: T(P(L1[1])), k2: T(P(L2[0])), f2: T(P(L2[1])), e1: T(A1[0]), h1: T(A1[1]), e2: T(A2[0]), h2: T(A2[1]) };
  }
  function drawFig(F, path, headEl, j) {
    if (F.hidden) { path.setAttribute("d", ""); headEl.setAttribute("d", ""); return null; }
    const k = skeleton(F);
    path.setAttribute("d", [line(k.hip, k.neck, j[0]), line(k.hip, k.k1, j[1]), line(k.k1, k.f1, j[2]), line(k.hip, k.k2, j[3]), line(k.k2, k.f2, j[4]),
      line(k.sh, k.e1, j[5]), line(k.e1, k.h1, j[6]), line(k.sh, k.e2, j[7]), line(k.e2, k.h2, j[8])].join(""));
    headEl.setAttribute("d", circle(k.head, k.r, j[9]));
    return k;
  }

  // ---------- State + props ----------
  let us, fo, P;
  function reset() {
    us = { x: 0, y: 0, dir: 1, p: stand(), air: 0, sq: 0 };
    fo = { x: 0, y: 0, dir: -1, p: stand(), air: 0, sq: 0, hidden: false, rule: 0 };
    P = { talk: -1, glass: false, paper: null, pile: 0, blocks: [], carrying: false, roof: null, alpha: 1 };
  }

  // ---------- Timeline ----------
  // Built from the measured rules. Each segment: [duration, fn(t)] where fn sets state for local time t in 0..1.
  let TL = [], TOTAL = 0;
  function build() {
    reset(); TL = []; const add = (d, fn) => TL.push([d, fn]);
    const u = (ri, frac, dir) => (dir > 0 ? R[ri].x0 + frac * R[ri].w : R[ri].x1 - frac * R[ri].w);
    let x = 0, ri = 0, dir = 1;                                  // planned position of "us"
    const walkTo = (tx, speed = 95, kind = "walk") => {
      const x0 = x, dist = Math.abs(tx - x0); if (dist < 1) return;
      const d0 = Math.sign(tx - x0), r = ri, stride = kind === "run" ? 30 * S : kind === "search" ? 12 * S : 20 * S;
      const dur = Math.max(0.25, dist / speed);
      add(dur, (t) => {
        const e = kind === "search" ? t : ease(t), xx = lerp(x0, tx, e), ph = (Math.abs(xx - x0) / stride) * Math.PI * 2;
        Object.assign(us, { x: xx, y: R[r].y, dir: d0, sq: 0, air: kind === "run" ? 1.6 * S * Math.abs(Math.sin(ph)) * (t > 0.85 ? (1 - t) / 0.15 : 1) : 0 });
        us.p = kind === "run" ? mix(run(ph), stand(), t > 0.85 ? (t - 0.85) / 0.15 : 0) : kind === "search" ? search(ph) : kind === "carry" ? carry(ph, 0.8) : walk(ph, Math.min(1, 4 * Math.min(t, 1 - t) + 0.25));
      });
      x = tx;
    };
    const hold = (d, fn) => add(d, fn);
    const jumpTo = (tx, tri, airDir) => {         // anticipation, arc (or drop), squash on landing
      const x0 = x, y0 = R[ri].y, y1 = R[tri].y, dy = y1 - y0, side = Math.abs(dy) < 8;
      const peak = side ? 26 * S + Math.abs(tx - x0) * 0.25 : 10 * S;
      add(0.22, (t) => { Object.assign(us, { x: x0, y: y0, dir: airDir, air: 0, sq: 0.12 * easeOut(t) }); us.p = mix(stand(), crouch, easeOut(t)); });
      const airT = side ? 0.55 : 0.45 + Math.min(0.5, Math.sqrt(Math.abs(dy)) * 0.02);
      add(airT, (t) => {
        const xx = lerp(x0, tx, side ? t : easeOut(Math.min(1, t * 1.6)));
        const yy = side ? lerp(y0, y1, t) - 4 * peak * t * (1 - t) : y0 - peak * Math.sin(Math.min(1, t * 3) * Math.PI / 2) * (1 - t) + dy * (t * t);
        Object.assign(us, { x: xx, y: yy, dir: airDir, air: 0, sq: t < 0.3 ? -0.1 : 0 });
        us.p = flight(t);
      });
      add(0.32, (t) => { Object.assign(us, { x: tx, y: y1, dir: airDir, air: 0, sq: 0.22 * (1 - easeOut(t)) * Math.cos(t * 3) }); us.p = mix(crouch, stand(), easeOut(t)); });
      x = tx; ri = tri;
    };
    const toNext = (nri) => {                      // leave rule ri for rule nri
      const a = R[ri], b = R[nri];
      if (Math.abs(b.y - a.y) < 8) {               // same row: run to the end and jump the gap
        const d = Math.sign(b.x0 - a.x0) || 1, ex = d > 0 ? a.x1 - 5 : a.x0 + 5;
        walkTo(ex, 210, "run"); jumpTo(d > 0 ? b.x0 + 10 * S : b.x1 - 10 * S, nri, d); dir = d; return;
      }
      // next rule is below: hop off an end into the gutter / column gap, drop, land on the near end
      const overlap = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.5 * Math.min(a.w, b.w);
      let d = overlap ? dir : (b.x0 + b.w / 2 < a.x0 + a.w / 2 ? -1 : 1);
      const edge = d > 0 ? a.x1 : a.x0;
      walkTo(edge - d * 6 * S, 120);
      const fallX = edge + d * 8 * S;
      const land = clamp(fallX, b.x0 + 9 * S, b.x1 - 9 * S);
      // step off: small hop out into the gap, then fall to the next rule and step in
      const x0 = x, y0 = a.y, y1 = b.y;
      add(0.2, (t) => { Object.assign(us, { x: x0, y: y0, dir: d, sq: 0.1 * easeOut(t), air: 0 }); us.p = mix(stand(), crouch, easeOut(t)); });
      const fallT = 0.35 + Math.sqrt(y1 - y0) * 0.022;
      add(fallT, (t) => {
        const hop = t < 0.25 ? t / 0.25 : 1, f = t < 0.25 ? 0 : (t - 0.25) / 0.75;
        const xx = t < 0.25 ? lerp(x0, fallX, easeOut(hop)) : lerp(fallX, land, ease(f) * f);
        const yy = t < 0.25 ? y0 - 8 * S * Math.sin(hop * Math.PI / 2) : y0 - 8 * S + (y1 - y0 + 8 * S) * f * f;
        Object.assign(us, { x: xx, y: yy, dir: d, sq: f > 0.3 ? -0.12 : 0, air: 0 });
        us.p = f > 0 ? pose({ ...tuck, a1: 2.7, a2: 2.5, l1: 0.15, k1: 0.3, l2: -0.1, k2: 0.2 }) : mix(crouch, tuck, hop);
      });
      add(0.34, (t) => { Object.assign(us, { x: land, y: y1, dir: -d, air: 0, sq: 0.26 * (1 - easeOut(t)) }); us.p = mix(crouch, stand(), easeOut(t)); });
      x = land; ri = nri; dir = overlap ? -d : (land > b.x0 + b.w / 2 ? -1 : 1);
    };
    const foHop = (r, fx, down) => {               // founder hops down behind the rule / pops up from behind it
      const y = R[r].y;
      if (down) {
        add(0.2, (t) => { Object.assign(fo, { x: fx, y, hidden: false, rule: r, sq: 0.12 * t, air: 0 }); fo.p = mix(stand(), crouch, easeOut(t)); });
        add(0.5, (t) => { Object.assign(fo, { x: fx + fo.dir * 6 * S * t, y: y - 12 * S * Math.sin(Math.min(1, t * 2.2) * Math.PI / 2) + (t > 0.45 ? Math.pow((t - 0.45) / 0.55, 2) * 48 * S : 0), sq: -0.08 }); fo.p = mix(tuck, stand(), 0.3); });
        add(0.01, () => { fo.hidden = true; });
      } else {
        add(0.01, () => Object.assign(fo, { x: fx, y: y + 40 * S, hidden: false, rule: r, sq: 0, air: 0 }));
        add(0.5, (t) => { const e = easeOut(t); Object.assign(fo, { y: y + 40 * S * (1 - e) - 6 * S * Math.sin(t * Math.PI), sq: 0 }); fo.p = mix(tuck, stand(), e); });
        add(0.25, (t) => { fo.sq = 0.15 * (1 - t); fo.p = stand(); });
      }
    };

    // --- 1. Founder conversation (rule 1) ---
    x = u(0, 0.26, 1); ri = 0; dir = 1;
    const fx1 = u(0, 0.56, 1);
    const ux1 = x;
    add(0.01, () => { reset(); Object.assign(us, { x: ux1, y: R[0].y, dir: 1, p: stand() }); Object.assign(fo, { x: fx1, y: R[0].y, dir: -1, rule: 0, p: stand() }); P.alpha = 1; });
    add(0.6, (t) => { us.p = stand(t * 3); fo.p = stand(t * 3 + 1); });
    for (let i = 0; i < 4; i++) {
      const who = i % 2;
      hold(0.85, (t) => { P.talk = who; const tt = t * 2 + i; us.p = talk(tt, who === 0); fo.p = talk(tt + 2, who === 1); });
    }
    hold(0.35, (t) => { P.talk = -1; us.p = stand(t); fo.p = mix(stand(), pose({ tilt: 0.3 }), Math.sin(t * Math.PI)); });   // founder nods: deal
    add(0.01, () => { fo.dir = 1; });
    foHop(0, fx1, true);
    hold(0.25, (t) => { us.p = stand(t); });

    // --- 2. Deep audit ---
    toNext(1);
    hold(0.35, (t) => { us.p = mix(stand(), search(0), ease(t)); P.glass = t > 0.3; });
    walkTo(u(1, 0.8, dir), 52, "search");
    hold(0.5, (t) => { us.p = mix(search(0), pose({ ...search(0), tilt: 0.45 }), Math.sin(t * Math.PI)); });   // peers closer
    hold(0.3, (t) => { us.p = mix(search(0), stand(), ease(t)); P.glass = t < 0.6; });

    // --- 3. Proposal with impact ---
    toNext(2);
    walkTo(u(2, 0.3, dir), 100);
    const d3 = dir, fx3 = u(2, 0.62, d3);
    add(0.01, () => { us.dir = d3; fo.dir = -d3; });
    foHop(2, fx3, false);
    hold(0.55, (t) => { us.p = mix(stand(), offer, ease(t)); fo.p = mix(stand(), offer, ease(Math.max(0, t - 0.3) / 0.7)); P.paper = "us"; });
    hold(0.25, () => { P.paper = "fo"; us.p = mix(offer, stand(), 0.5); });
    hold(1.2, (t) => { us.p = stand(t); fo.p = read(0.08 * Math.sin(t * 6)); });
    hold(0.9, (t) => { fo.p = read(-0.35 + 0.35 * Math.abs(Math.sin(t * Math.PI * 2))); });     // nods twice
    hold(0.4, (t) => { fo.p = mix(read(), stand(), ease(t)); if (t > 0.45) P.paper = "side"; });     // lowers the paper to his side
    // both step in and shake hands
    const reach = (() => { const k = skeleton({ x: 0, y: 0, dir: 1, p: shake(0) }); return k.h1[0]; })();
    const mx = (x + fx3) / 2, ux3 = mx - d3 * (reach - 0.6 * S), fx3b = mx + d3 * (reach - 0.6 * S), ux0 = x;
    const inDur = Math.max(0.5, Math.abs(ux3 - ux0) / 75);
    add(inDur, (t) => { const e = ease(t), su = Math.abs(ux3 - ux0) * e, sf = Math.abs(fx3b - fx3) * e, amp = Math.min(1, 4 * Math.min(t, 1 - t) + 0.25);
      us.x = lerp(ux0, ux3, e); fo.x = lerp(fx3, fx3b, e);
      us.p = mix(walk((su / (20 * S)) * Math.PI * 2, amp), shake(0), clamp((t - 0.7) / 0.3));
      fo.p = mix(walk((sf / (20 * S)) * Math.PI * 2 + 1, amp), shake(0), clamp((t - 0.75) / 0.25)); });
    hold(0.25, (t) => { us.p = shake(0); fo.p = shake(0); });
    hold(1.0, (t) => { const ph = t * 3 * Math.PI * 2, d = Math.sin(t * Math.PI); us.p = pose({ ...shake(ph * 1), tilt: 0.08 * d }); fo.p = pose({ ...shake(ph), tilt: 0.12 * d }); });   // three firm pumps, a small nod each
    hold(0.35, (t) => { us.p = mix(shake(0), stand(), ease(t)); fo.p = mix(shake(0), stand(), ease(t)); });
    x = ux3;
    add(0.01, () => { fo.dir = d3; });
    foHop(2, fx3b, true);
    add(0.01, () => { P.paper = null; });

    // --- 4. Implement, your way ---
    const keep = { ri, dir };
    toNext(3);
    const d4 = dir, pileX = u(3, 0.14, d4), siteX = u(3, 0.46, d4), bs = 7 * S;
    add(0.01, () => { P.pile = 3; P.blocks = []; P.site = siteX; P.pileX = pileX; P.ruleY = R[3].y; });
    const slots = [[-bs / 2 - 0.5, 0], [bs / 2 + 0.5, 0], [0, -bs]];
    for (let i = 0; i < 3; i++) {
      walkTo(pileX + d4 * 6 * S, 150);
      hold(0.32, (t) => { us.p = mix(stand(), crouch, Math.sin(t * Math.PI)); if (t > 0.5 && !P.carrying) { P.pile--; P.carrying = true; } });
      walkTo(siteX - d4 * 11 * S, 120, "carry");
      hold(0.4, (t) => { us.p = mix(carry(0, 0), pose({ ...carry(0, 0), lean: 0.3, a1: 1.3, a2: 1.25 }), Math.sin(t * Math.PI));
        if (t > 0.55 && P.carrying) { P.carrying = false; P.blocks.push(slots[i]); } });
    }
    hold(0.2, () => { us.p = stand(); us.dir = d4; });
    const fx4 = u(3, 0.8, d4);
    add(0.01, () => { fo.dir = -d4; P.roof = "fo"; });
    // the founder climbs back up: hands first, then pulls up
    add(0.01, () => Object.assign(fo, { x: fx4, y: R[3].y + 40 * S, hidden: false, rule: 3 }));
    add(0.9, (t) => { const e = ease(t); Object.assign(fo, { y: R[3].y + 40 * S * (1 - e), sq: 0 }); fo.p = mix(pose({ a1: 2.8, e1: 0.2, a2: 2.7, e2: 0.2, l1: 0.3, k1: 0.6 }), stand(), clamp((t - 0.6) / 0.4)); });
    add(0.2, (t) => { fo.sq = 0.1 * (1 - t); fo.p = stand(); });
    const fStart = fx4, fEnd = siteX + d4 * 11 * S;
    add(Math.max(0.4, Math.abs(fEnd - fStart) / 110), (t) => { const xx = lerp(fStart, fEnd, ease(t)); fo.x = xx; fo.p = carry((Math.abs(xx - fStart) / (20 * S)) * Math.PI * 2, 0.8); });
    hold(0.8, (t) => { const e = ease(t); us.p = mix(stand(), reach, e); fo.p = mix(carry(0, 0), reach, e); P.roof = t > 0.75 ? "placed" : "both"; P.roofLift = e; });
    hold(0.6, (t) => { us.p = mix(reach, stand(), ease(t)); fo.p = mix(reach, stand(), ease(t)); });
    hold(1.4, (t) => { us.p = stand(t * 2); fo.p = stand(t * 2 + 1); });
    hold(0.5, (t) => { P.alpha = 1 - t; });
    TOTAL = TL.reduce((s, [d]) => s + d, 0);
  }

  // ---------- Draw ----------
  function draw() {
    svg.style.opacity = P.alpha;
    const fr = R[fo.rule] || R[0];
    clipRect.setAttribute("x", fr.x0 - 60); clipRect.setAttribute("width", fr.w + 120);
    clipRect.setAttribute("y", fr.y - 120); clipRect.setAttribute("height", 120 - 0.6);
    const ku = drawFig(us, usP, usHead, J.us), kf = drawFig(fo, fP, fHead, J.f);
    const d = [], dFill = [];
    if (P.talk >= 0) {                              // speech dashes in front of the speaker's mouth
      const k = P.talk === 0 ? ku : kf, F = P.talk === 0 ? us : fo;
      if (k) { const bx = k.head[0] + F.dir * 6.8 * S, by = k.head[1]; const w = 0.5 + 0.5 * Math.sin(performance.now() / 90);
        d.push(line([bx, by - 2 * S], [bx + F.dir * (2.5 + w) * S, by - 4 * S]), line([bx + F.dir * S, by], [bx + F.dir * (3.8 + w) * S, by]), line([bx, by + 2 * S], [bx + F.dir * (2.5 + w) * S, by + 4 * S])); }
    }
    const thick = [];
    if (P.glass && ku) { const [lens, handle] = magnifier(ku.h1, us.dir); d.push(lens); thick.push(handle); }
    if (P.paper) {
      const k = P.paper === "us" ? ku : kf, F = P.paper === "us" ? us : fo;   // "us" offers it, "fo" reads it, "side" he holds it after
      if (k && P.paper === "side") { const h = k.h2, pw = 3.6 * S, ph = 4.6 * S, x0 = h[0] - pw / 2, y0 = h[1] - ph * 0.3;
        d.push(`M${f1(x0)} ${f1(y0)}h${f1(pw)}v${f1(ph)}h${f1(-pw)}z`); }
      else if (k) { const h = P.paper === "fo" ? [(k.h1[0] + k.h2[0]) / 2, (k.h1[1] + k.h2[1]) / 2] : k.h1, pw = 5 * S, ph = 6.5 * S, x0 = h[0] - (F.dir < 0 ? pw : 0), y0 = h[1] - ph * 0.75;
        d.push(`M${f1(x0)} ${f1(y0)}h${f1(pw)}v${f1(ph)}h${f1(-pw)}z`, line([x0 + 1.2 * S, y0 + 2 * S], [x0 + pw - 1.2 * S, y0 + 2 * S]), line([x0 + 1.2 * S, y0 + 3.6 * S], [x0 + pw - 1.8 * S, y0 + 3.6 * S])); }
    }
    const bs = 7 * S, box = (cx, by) => `M${f1(cx - bs / 2)} ${f1(by)}v${f1(-bs)}h${f1(bs)}v${f1(bs)}z`;
    if (P.ruleY !== undefined) {
      for (let i = 0; i < P.pile; i++) d.push(box(P.pileX + (i - 1) * (bs + 1) * (i === 2 ? 0 : 1), P.ruleY - (i === 2 ? bs : 0)));
      for (const [ox, oy] of P.blocks) d.push(box(P.site + ox, P.ruleY + oy - 0.5));
      if (P.carrying && ku) { const c = [(ku.h1[0] + ku.h2[0]) / 2, (ku.h1[1] + ku.h2[1]) / 2 + bs / 2]; d.push(box(c[0], c[1])); }
      if (P.roof) {                                  // the final piece: a small roof, carried up by the founder, set together
        const top = P.ruleY - 2 * bs - 1, rw = bs * 2 + 3;
        let cx = P.site, cy = top;
        if (P.roof === "fo" && kf) { cx = (kf.h1[0] + kf.h2[0]) / 2; cy = (kf.h1[1] + kf.h2[1]) / 2 + 1; }
        if (P.roof === "both" && kf && ku) { const hx = (kf.h1[0] + ku.h1[0]) / 2, hy = Math.min(kf.h1[1], ku.h1[1]) + 2; cx = lerp(hx, P.site, (P.roofLift || 0) ** 2); cy = lerp(hy, top, Math.max(0, (P.roofLift || 0) - 0.6) / 0.4); }
        if (!(P.roof === "fo" && fo.hidden)) d.push(`M${f1(cx - rw / 2)} ${f1(cy)}L${f1(cx)} ${f1(cy - 5.5 * S)}L${f1(cx + rw / 2)} ${f1(cy)}`);
      }
    }
    props.setAttribute("d", d.join(""));
    propsFill.setAttribute("d", dFill.join(""));
    propsThick.setAttribute("d", thick.join(""));
  }

  // ---------- Run ----------
  let t0 = 0, idx = 0, elapsed = 0, last = 0, raf = 0, visible = false, seed = 1, boilAt = 0;
  function seek(time) {                            // play every segment boundary up to `time`, then the current one
    if (time < elapsed) { idx = 0; t0 = 0; }
    elapsed = time;
    while (idx < TL.length && t0 + TL[idx][0] <= time) { TL[idx][1](1); t0 += TL[idx][0]; idx++; }
    if (idx >= TL.length) { idx = 0; t0 = 0; elapsed = 0; TL[0][1](0); return; }
    TL[idx][1]((time - t0) / TL[idx][0]);
  }
  function frame(now) {
    raf = 0; if (!visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    seek(elapsed + dt); draw();
    if (now - boilAt > 125) { seed = (seed % 3) + 1; turb.setAttribute("seed", seed); boilAt = now; }   // the line "boils", like hand-drawn animation
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  function stills() {                              // reduced motion: one frame of each scene on its rule
    const mk = (cls) => { const g = el("g", { class: cls }, ink); return [el("path", {}, g), el("path", {}, g)]; };
    ink.querySelectorAll(".still").forEach((n) => n.remove());
    props.setAttribute("d", ""); usP.setAttribute("d", ""); usHead.setAttribute("d", ""); fP.setAttribute("d", ""); fHead.setAttribute("d", "");
    const fig = (x, r, dir, p, filled) => { const [a, h] = mk("still"); if (filled) h.setAttribute("fill", "currentColor"); return drawFig({ x, y: R[r].y, dir, p, air: 0, sq: 0 }, a, h, filled ? J.f : J.us); };
    const extra = [], bs = 7 * S;
    const u = (r, f) => R[r].x0 + f * R[r].w;
    fig(u(0, 0.28), 0, 1, talk(0.4, true)); fig(u(0, 0.56), 0, -1, stand(), true);
    const k2 = fig(u(1, 0.5), 1, 1, search(0.6)); const [lens, handle] = magnifier(k2.h1, 1); extra.push(lens); propsThick.setAttribute("d", handle);
    const rch = skeleton({ x: 0, y: 0, dir: 1, p: shake(0) }).h1[0] - 0.6 * S, m3 = u(2, 0.47);   // the handshake, paper in the founder's other hand
    fig(m3 - rch, 2, 1, shake(0)); const kf3 = fig(m3 + rch, 2, -1, shake(0), true);
    extra.push(`M${f1(kf3.h2[0] - 1.8 * S)} ${f1(kf3.h2[1] - 1.4 * S)}h${f1(3.6 * S)}v${f1(4.6 * S)}h${f1(-3.6 * S)}z`);
    const sx = u(3, 0.46);
    fig(sx - 11 * S, 3, 1, reach); fig(sx + 11 * S, 3, -1, reach, true);
    const y = R[3].y, box = (cx, by) => `M${f1(cx - bs / 2)} ${f1(by)}v${f1(-bs)}h${f1(bs)}v${f1(bs)}z`;
    extra.push(box(sx - bs / 2 - 0.5, y), box(sx + bs / 2 + 0.5, y), box(sx, y - bs), `M${f1(sx - bs - 1.5)} ${f1(y - 2 * bs - 1)}L${f1(sx)} ${f1(y - 2 * bs - 6.5 * S)}L${f1(sx + bs + 1.5)} ${f1(y - 2 * bs - 1)}`);
    props.setAttribute("d", extra.join(""));
  }

  function layout() {
    measure();
    if (reduce) { ink.removeAttribute("filter"); stills(); return; }
    build(); idx = 0; t0 = 0; elapsed = 0; TL[0][1](0); draw();
  }
  // Frame-exact hook for review recordings (scripts/render/record-story.mjs): stops the live loop, steps time.
  list.storyFrame = (time, s) => { visible = false; if (time < elapsed) { idx = 0; t0 = 0; elapsed = 0; } seek(time % TOTAL); draw(); turb.setAttribute("seed", s); return TOTAL; };
  document.fonts.ready.then(() => {
    layout();
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 150); }).observe(list);
    if (reduce) return;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: "0px 0px -10% 0px" }).observe(list);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) start(); });
  });
})();
