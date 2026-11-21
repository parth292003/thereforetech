// "What we do": two small ink-and-watercolour paintings, painted on scroll. Palette from the hero field
// (wheat gold, dusk pink) plus a dusk blue and a sage. A different hand from the "How we work" stick figures.
//   01 Transform: a stream seen from above, jammed by sticks and stones. The sticks slide away one by one and
//      the thin trickle widens into a full, flowing stream.
//   02 Discover (paper cut-out): a white footpath paints itself across a golden field below a pink ridge, and the sun
//      rises with its rays opening.
// Wide screens pin the section: scrolling first clears the river, then draws the path. Decorative only
// (aria-hidden). Reduced motion shows the finished paintings, still.
(() => {
  const slots = [...document.querySelectorAll(".wwd__art[data-art]")];
  if (!slots.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const f1 = (n) => n.toFixed(1);
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const C = { ink: "#2B2621", gold: "#B8922E", goldL: "#E8D08E", wheat: "#F1DFAE", pink: "#EAC7C4", blue: "#5E86A8", blueL: "#AFC8DA", sage: "#9DB088", sageL: "#CCD7B8", bark: "#7A5A2E", stone: "#C3CCD3", road: "#FAF1DE" };

  const smooth = (pts) => {                     // Catmull-Rom through the points
    if (pts.length < 2) return "";
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d;
  };
  const ribbon = (A, B) => smooth(A) + "L" + smooth([...B].reverse()).slice(1) + "Z";   // closed shape between two edges
  const line = (a, b, j = 0) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return `M${f1(a[0])} ${f1(a[1])}Q${f1(mx - (dy / L) * j)} ${f1(my + (dx / L) * j)} ${f1(b[0])} ${f1(b[1])}`;
  };

  let uid = 0;
  function canvas(slot) {
    const u = ++uid, svg = el("svg", { viewBox: "0 0 400 230", focusable: "false", "aria-hidden": "true", preserveAspectRatio: "xMidYMid meet" });
    const defs = el("defs", {}, svg);
    // watercolour: ragged, bleeding edges with a darker rim; a steadier wobble for the fine ink line
    const w = el("filter", { id: `wc${u}`, x: "-10%", y: "-15%", width: "120%", height: "130%" }, defs);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.045", numOctaves: "3", seed: String(3 + u), result: "n" }, w);
    el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "7", xChannelSelector: "R", yChannelSelector: "G", result: "d" }, w);
    el("feGaussianBlur", { in: "d", stdDeviation: "0.5" }, w);
    const k = el("filter", { id: `ik${u}` }, defs);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.08", numOctaves: "2", seed: "4" }, k);
    el("feDisplacementMap", { in: "SourceGraphic", scale: "1.4", xChannelSelector: "R", yChannelSelector: "G" }, k);
    // the painting fades softly into the white page
    const g = el("radialGradient", { id: `vg${u}`, cx: "0.5", cy: "0.52", r: "0.62" }, defs);
    el("stop", { offset: "0.6", "stop-color": "#fff" }, g); el("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, g);
    const m = el("mask", { id: `vm${u}`, maskUnits: "userSpaceOnUse", x: "0", y: "0", width: "400", height: "230" }, defs);
    el("rect", { width: "400", height: "230", fill: `url(#vg${u})` }, m);
    const root = el("g", { mask: `url(#vm${u})` }, svg);
    slot.appendChild(svg);
    const wash = (parent, d, fill, op = 0.85) => el("path", { d, fill, "fill-opacity": op, stroke: fill, "stroke-opacity": Math.min(1, op + 0.1), "stroke-width": "1.4", filter: `url(#wc${u})` }, parent);
    const ink = (parent, a = {}) => el("path", { fill: "none", stroke: C.ink, "stroke-width": "1.15", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke", filter: `url(#ik${u})`, ...a }, parent);
    return { u, defs, root, wash, ink };
  }

  // =============== 01 Transform: the stream ===============
  function stream(slot) {
    const { root, wash, ink } = canvas(slot);
    const r = rnd(11);
    const c = (x) => 116 + 24 * Math.sin(x * 0.0125 + 0.6), hw = (x) => 27 + 3 * Math.sin(x * 0.031 + 1);
    const ang = (x) => Math.atan(24 * 0.0125 * Math.cos(x * 0.0125 + 0.6)) * 180 / Math.PI;
    const edge = (o, a = -14, b = 414, st = 10) => { const pts = []; for (let x = a; x <= b; x += st) pts.push([x, c(x) + o(x)]); return pts; };
    const band = (o1, o2, a, b) => ribbon(edge(o1, a, b), edge(o2, a, b));
    // grass banks, the water, and the deeper channel (pooled above the jam; a thin trickle below it that widens)
    wash(root, band((x) => -hw(x) - 26, (x) => -hw(x) + 3), C.sageL, 0.9);
    wash(root, band((x) => hw(x) - 3, (x) => hw(x) + 26), C.sageL, 0.9);
    wash(root, band((x) => -hw(x) - 8, (x) => -hw(x) - 1, 30, 150), C.sage, 0.5);
    wash(root, band((x) => hw(x) + 2, (x) => hw(x) + 9, 240, 380), C.sage, 0.5);
    wash(root, band((x) => -hw(x) + 1, (x) => hw(x) - 1), C.blueL, 0.9);
    const deep = wash(root, "", C.blue, 0.42);
    // fine ink banks, broken like a quick pen line, and a few grass ticks
    let tex = "";
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1, x = 10 + i * 33 + r() * 12, y = c(x) + side * (hw(x) + 5 + r() * 6);
      tex += line([x, y], [x - 1.5, y + side * (5 + r() * 3)], 0.4) + line([x + 2.5, y], [x + 4, y + side * (4 + r() * 2)]);
    }
    ink(root, { d: smooth(edge((x) => -hw(x))) + smooth(edge((x) => hw(x))), "stroke-dasharray": "70 9 34 6 90 12", opacity: 0.85 });
    ink(root, { d: tex, opacity: 0.6 });
    // moving water: soft white strokes on the blue
    const flow = (x0, x1, o) => smooth(edge((x) => o * hw(x) / 27, x0, x1, 9));
    const OFF = [-5, 5, -15, 15];
    const stroke = { fill: "none", stroke: "#fff", "stroke-width": "1.3", "stroke-linecap": "round", "stroke-dasharray": "12 16", "vector-effect": "non-scaling-stroke" };
    const up = OFF.map((o) => el("path", { ...stroke, d: flow(-14, 186, o), "stroke-opacity": "0.75" }, root));
    const down = OFF.map((o) => el("path", { ...stroke, d: flow(186, 414, o), "stroke-opacity": "0" }, root));
    // the jam: sticks (bark-brown ink) and stones (grey wash with an ink rim), each free to slide away
    const jx = 206, jy = c(206), T = (x, side, gap) => c(x) + side * (hw(x) + gap);
    const stick = (L, tw) => line([-L / 2, 0], [L / 2, 0], 1.2) + line([L * tw, 0], [L * tw + 5, -5]);
    const items = [
      [stick(62, 0.12), jx - 6, jy - 6, 74, 258, T(258, -1, 13), ang(258) + 6],
      [stick(58, -0.3), jx + 6, jy + 4, -62, 300, T(300, 1, 13), ang(300) - 4],
      [stick(46, 0.2), jx - 4, jy + 13, 12, 150, T(150, -1, 12), ang(150) - 8],
      [stick(54, -0.1), jx + 12, jy - 4, 106, 342, T(342, -1, 14), ang(342) + 10],
      [stick(40, 0.25), jx - 10, jy + 1, -28, 226, T(226, 1, 12), ang(226) + 5],
      [stick(50, 0.3), jx + 2, jy - 14, 18, 190, T(190, -1, 13), ang(190) - 3],
      [stick(36, -0.2), jx + 14, jy + 14, 132, 372, T(372, 1, 12), ang(372) + 7],
      [6.5, jx + 3, jy - 19, 0, jx + 30, T(jx + 30, -1, -8), 20],
      [6, jx + 10, jy + 18, 0, jx + 56, T(jx + 56, 1, -8), -10],
      [4.6, jx - 9, jy - 15, 0, jx - 26, T(jx - 26, -1, -6), 30],
      [4, jx - 6, jy + 19, 0, jx - 44, T(jx - 44, 1, -6), 0],
    ].map(([d, ...m], i) => {
      const g = el("g", {}, root);
      if (typeof d === "number") { el("ellipse", { rx: d, ry: d * 0.82, fill: C.stone }, g); ink(g, { d: `M${d} 0A${d} ${f1(d * 0.82)} 0 1 1 ${f1(d * 0.97)} ${f1(-d * 0.2)}`, opacity: 0.8 }); }
      else ink(g, { d, stroke: C.bark, "stroke-width": "2" });
      return { g, m, a: 0.05 + i * 0.045 };
    });
    let up0 = 0, dn0 = 0;
    return (p, dt) => {
      for (const it of items) {                  // drift a little downstream, then come to rest on the bank
        const e = ease(span(p, it.a, it.a + 0.17)), [x0, y0, r0, x1, y1, r1] = it.m, bob = Math.sin(e * Math.PI);
        it.g.setAttribute("transform", `translate(${f1(lerp(x0, x1, e) + 10 * bob)} ${f1(lerp(y0, y1, e))}) rotate(${f1(lerp(r0, r1, e) + 18 * bob)})`);
      }
      const free = ease(span(p, 0.48, 0.92));    // the trickle widens into the full channel
      const k = lerp(0.1, 0.6, free), wk = (x) => lerp(0.6, k, ease(clamp((x - 186) / 44)));
      deep.setAttribute("d", band((x) => -hw(x) * wk(x), (x) => hw(x) * wk(x)));
      up0 -= dt * 20 * lerp(0.15, 1, free); dn0 -= dt * 26;
      up.forEach((u) => u.setAttribute("stroke-dashoffset", f1(up0)));
      down.forEach((d, i) => { d.setAttribute("stroke-opacity", f1(0.75 * ease(span(p, 0.55 + i * 0.08, 0.72 + i * 0.08)))); d.setAttribute("stroke-dashoffset", f1(dn0)); });
    };
  }

  // =============== 02 Discover: the footpath and the rising sun ===============
  // Exactly Parth's chosen picture (docs/review/wwd-style-options.png, row C, paper cut-out): a gold sun behind a
  // light green mountain and a pink ridge, a darker green hill, a golden field and a white path, all flat layers
  // with a soft shadow. The last frame is that picture; on the way there the path paints in and the sun rises.
  function footpath(slot) {
    const { u, defs, root } = canvas(slot);
    const HZ = 70, VX = 228, M = { gold: "#B8922E", green: "#C9D3B3", pink: "#EAC7C4", hill: "#8FA37A", field: "#E3C77A" };
    const vg = defs.querySelector(`#vg${u}`); vg.setAttribute("cy", "0.55"); vg.querySelector("stop").setAttribute("offset", "0.62");
    const sh = el("filter", { id: `sh${u}` }, defs);
    el("feDropShadow", { dx: "0", dy: "2", stdDeviation: "1.6", "flood-color": "#3b2d10", "flood-opacity": "0.22" }, sh);
    const shape = (d, fill) => el("path", { d, fill, filter: `url(#sh${u})` }, root);
    const hill = (x0, x1, y, h, yb = 240) => { const m = (x0 + x1) / 2, w = (x1 - x0) / 2;
      return `M-40 ${yb}L-40 ${y + h * 0.4}C${x0} ${y + h * 0.4} ${m - w * 0.6} ${y - h} ${m} ${y - h}C${m + w * 0.6} ${y - h} ${x1} ${y + h * 0.4} 440 ${y + h * 0.4}L440 ${yb}Z`; };
    const at0 = (s) => { const z = 1 / (1 - 0.92 * s), X = -72 * Math.cos(s * 2.6 * Math.PI) + 40 * s; return [VX + X / z, HZ + 150 / z, 34 / z]; };
    // past s = 0.9 the path runs on up the pink ridge and thins to a point just under the sun
    // (a smooth curve: it leaves along the path's own heading and meets the ridge line where the sun sits)
    const A = at0(0.9), B = at0(0.899), TOP = [VX, HZ - 4];
    const dx = A[0] - B[0], dy = A[1] - B[1], dl = Math.hypot(dx, dy), K = 0.5 * Math.hypot(TOP[0] - A[0], TOP[1] - A[1]);
    const C1 = [A[0] + (dx / dl) * K, A[1] + (dy / dl) * K];
    const at = (s) => {
      if (s <= 0.9) return at0(s);
      const t = (s - 0.9) / 0.1, q = (i) => (1 - t) * (1 - t) * A[i] + 2 * (1 - t) * t * C1[i] + t * t * TOP[i];
      return [q(0), q(1), A[2] * Math.pow(1 - t, 0.9) + 0.3 * t];
    };
    // sun rays, drawn by hand: needle-sharp gold spikes of uneven length and spacing, sides slightly bowed and
    // a little wobble; they open, turn a touch and brighten as the sun rises
    const hd = el("filter", { id: `hd${u}`, x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.12", numOctaves: "2", seed: "9" }, hd);
    el("feDisplacementMap", { in: "SourceGraphic", scale: "1.6", xChannelSelector: "R", yChannelSelector: "G" }, hd);
    const rays = el("g", { fill: M.gold }, root);
    const rr = rnd(29); let rd = "";
    const P = (r, a) => `${f1(r * Math.cos(a))} ${f1(r * Math.sin(a))}`;
    for (let i = 0; i < 16; i++) {
      const t = ((i + (rr() - 0.5) * 0.45) / 16) * 2 * Math.PI, w = 0.05 + rr() * 0.03, r0 = 18.5;
      const r1 = (i % 2 ? 29 : 40) + rr() * 8, bend = (rr() - 0.5) * 0.06;
      rd += `M${P(r0, t - w)}Q${P((r0 + r1) / 2, t - w * 0.35 + bend)} ${P(r1, t + bend)}Q${P((r0 + r1) / 2, t + w * 0.35 + bend)} ${P(r0, t + w)}Z`;
    }
    el("path", { d: rd, filter: `url(#hd${u})` }, rays);
    const sun = el("circle", { cx: VX, cy: HZ, r: "14", fill: M.gold }, root);     // behind the land, so it rises
    shape(hill(0, 180, HZ + 2, 24, 230), M.green);
    shape(hill(220, 400, HZ + 2, 16, 230), M.pink);
    shape(hill(-30, 200, 150, 40), M.hill);
    shape(hill(230, 430, 140, 34), M.field);
    const road = shape("", "#FFFFFF");

    const N = 70, END = 1;
    return (p) => {
      const sNow = END * ease(span(p, 0.02, 0.8));                   // the path paints itself in
      const L = [], R = [];
      for (let i = 0; i <= N; i++) { const s = (i / N) * sNow, [x, y, w] = at(s); L.push([x - w, y]); R.push([x + w, y]); }
      road.setAttribute("d", sNow > 0.002 ? ribbon(L, R) : "");
      const cy = lerp(HZ + 22, HZ, ease(span(p, 0.2, 1))), glow = ease(span(p, 0.55, 1));
      sun.setAttribute("cy", f1(cy));                                // and the sun rises to where the picture has it
      rays.setAttribute("transform", `translate(${VX} ${f1(cy)}) rotate(${f1(8 * glow)}) scale(${(0.6 + 0.4 * glow).toFixed(3)})`);
      rays.setAttribute("opacity", (0.65 * glow).toFixed(3));
    };
  }

  // ---- scroll driver ----
  // Wide screens: the section is pinned while the reader scrolls through a tall track; the first half clears the
  // river, the second half draws the path. Narrow screens (stacked columns): each painting follows its own passage
  // up the viewport. Either way progress is eased toward its target every frame.
  const pin = slots[0].closest(".wwd-pin"), stage = pin && pin.querySelector(".wwd-pin__stage");
  const wide = matchMedia("(min-width: 768px)");
  const SEQ = [[0, 0.46], [0.54, 1]];          // stream, then path, as shares of the pinned scroll
  let pinned = false;
  const layout = () => {
    if (!pin) return;
    pin.classList.remove("is-pinned"); pin.style.removeProperty("--wwd-art-max"); pinned = false;
    if (reduce || !wide.matches) return;
    const pad = 2 * parseFloat(getComputedStyle(document.documentElement).fontSize) * 3;   // stage padding (space-7 each side)
    const excess = stage.offsetHeight + pad - innerHeight, artH = slots[0].offsetHeight;
    if (excess > 0) {                                   // shrink the paintings so the whole section fits on screen
      if (artH - excess < 150) return;                  // too short a window: leave the section unpinned
      pin.style.setProperty("--wwd-art-max", `${Math.floor(((artH - excess) * 400) / 230)}px`);
    }
    pin.classList.add("is-pinned"); pinned = true;
  };
  const scenes = slots.map((slot, i) => ({ slot, seq: SEQ[i] || SEQ[1], paint: slot.dataset.art === "stream" ? stream(slot) : footpath(slot), p: reduce ? 1 : 0, on: false }));
  const target = (s) => {
    if (pinned) {
      const r = pin.getBoundingClientRect(), P = clamp(-r.top / Math.max(1, r.height - innerHeight));
      return span(P, s.seq[0], s.seq[1]);
    }
    const t = s.slot.getBoundingClientRect().top; return clamp((innerHeight * 0.95 - t) / (innerHeight * 0.6));
  };
  scenes.forEach((s) => s.paint(s.p, 0));
  if (reduce) return;
  layout();
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
  wide.addEventListener("change", layout);
  let raf = 0, last = 0, frozen = false;
  const tick = (now) => {
    raf = 0; if (frozen || document.hidden || !scenes.some((s) => s.on)) { last = 0; return; }
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    for (const s of scenes) { if (!s.on) continue; s.p += (target(s) - s.p) * Math.min(1, dt * 6); s.paint(s.p, dt); }
    raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const io = new IntersectionObserver((es) => { es.forEach((e) => { scenes.find((s) => s.slot === e.target).on = e.isIntersecting; }); go(); }, { rootMargin: "100px 0px" });
  scenes.forEach((s) => io.observe(s.slot));
  document.addEventListener("visibilitychange", go);
  // Frame-exact hook for review captures (scripts/render/record-wwd.mjs): stops the live loop and paints the
  // section's overall progress P (0-1), split between the two paintings the way the pinned scroll splits it.
  slots[0].closest(".wwd").artFrame = (P, dt = 0) => { frozen = true; scenes.forEach((s) => { s.p = span(P, s.seq[0], s.seq[1]); s.paint(s.p, dt); }); };
})();
