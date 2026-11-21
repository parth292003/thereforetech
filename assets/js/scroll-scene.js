// ScrollScene controller (PLAN §5.2) with lightweight SVG placeholder motion.
//   data-mode="scrub": progress 0–1 follows scroll through the pinned scene.
//   data-mode="play":  time-based loop while in view, with a pause control.
// When the Fable clips arrive, a scene gets a <video data-scrub> and progress drives video.currentTime
// instead of the placeholder renderer. Reduced motion: final frame, text visible, no pinning, no loop.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const span = (p, a, b) => clamp((p - a) / (b - a));
  function rng(seed) { return (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); }; }
  function el(svg, d, cls) { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); if (cls) p.setAttribute("class", cls); svg.appendChild(p); return p; }
  // A stroke not yet started stays hidden: a zero-length dash with a round cap would still paint a dot.
  function drawable(p) { const len = p.getTotalLength() || 1; p.style.strokeDasharray = `${len} ${len}`; return (f) => { f = clamp(f); p.style.visibility = f > 0.002 ? "visible" : "hidden"; p.style.strokeDashoffset = String(len * (1 - f)); }; }

  // Recursive branching, bottom-up. Returns [{d, depth, tip:[x,y], angle}]
  function tree(r, x, y, angle, len, depth, maxDepth, out = []) {
    const a = (angle * Math.PI) / 180;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const bend = r(-0.25, 0.25) * len;
    const mx = (x + x2) / 2 + Math.cos(a + Math.PI / 2) * bend, my = (y + y2) / 2 + Math.sin(a + Math.PI / 2) * bend;
    out.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, depth, tip: [x2, y2], angle });
    if (depth < maxDepth) {
      const n = depth < 2 ? 2 : r(0, 1) > 0.35 ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const spread = n === 2 ? (i ? 1 : -1) * r(16, 30) : (i - 1) * r(20, 32);
        tree(r, x2, y2, angle + spread, len * r(0.66, 0.8), depth + 1, maxDepth, out);
      }
    }
    return out;
  }

  // ---------- Scene 2: branches open into a flock ----------
  function branchesToFlock(svg) {
    const r = rng(29);
    const parts = tree(r, 560, 900, -82, 200, 0, 5);
    const branches = parts.map((b) => { const p = el(svg, b.d, "branch"); return { p, draw: drawable(p), a: b.depth * 0.065, b: b.depth * 0.065 + 0.065 }; });   // a branch grows only once its parent reaches the fork
    const tips = parts.filter((b) => b.depth >= 4);
    const birds = Array.from({ length: 70 }, (_, i) => {
      const tip = tips[i % tips.length].tip;
      return { x: tip[0], y: tip[1], dx: r(500, 1250), dy: r(-520, -120), wob: r(20, 70), ph: r(0, 6.28), s: r(5, 11), start: 0.3 + r(0, 0.22) };
    });
    const flock = el(svg, "", "flock");
    return (pr) => {
      const fade = 1 - 0.88 * ease(span(pr, 0.5, 0.85));
      for (const b of branches) { b.draw(ease(span(pr, b.a, b.b))); b.p.style.opacity = fade; }
      let d = "";
      for (const b of birds) {
        const q = ease(span(pr, b.start, 1));
        if (q <= 0) continue;
        const x = b.x + b.dx * q, y = b.y + b.dy * q + Math.sin(q * 6 + b.ph) * b.wob * q;
        const s = b.s * (0.4 + 0.6 * q), flap = Math.sin(q * 24 + b.ph) * s * 0.45;
        d += `M${(x - s).toFixed(1)} ${(y - flap).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${(x + s).toFixed(1)} ${(y - flap).toFixed(1)} `;
      }
      flock.setAttribute("d", d || "M0 0");
    };
  }

  // ---------- Scene 3: a form that keeps growing and changing shape ----------
  function frontier(svg) {
    const r = rng(53), C = 400, RINGS = 7, PTS = 96;
    const harmonics = [2, 3, 5, 7].map((h) => ({ h, a: r(0.02, 0.07), w: r(0.12, 0.35) * (r(0, 1) > 0.5 ? 1 : -1), ph: r(0, 6.28) }));
    const rings = Array.from({ length: RINGS }, () => el(svg, "", "ring"));
    // Colour: inner rings rose, then gold, outer rings green (scene palette tokens)
    const css = getComputedStyle(document.documentElement);
    const palette = ["--scene-stroke-ring-a", "--scene-stroke-ring-b", "--scene-stroke-ring-c"].map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
    return (t) => {
      rings.forEach((ring, k) => {
        const life = (t / 7 + k / RINGS) % 1;               // each ring is born at the centre and grows outward
        const base = 30 + 330 * Math.sqrt(life);
        let d = "";
        for (let i = 0; i <= PTS; i++) {
          const th = (i / PTS) * Math.PI * 2;
          let m = 1;
          for (const hm of harmonics) m += hm.a * (0.6 + life) * Math.sin(hm.h * th + hm.ph + hm.w * t + k * 0.5);
          const x = C + Math.cos(th) * base * m, y = C + Math.sin(th) * base * m;
          d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }
        ring.setAttribute("d", d + "Z");
        ring.style.opacity = String(Math.sin(Math.PI * life) ** 0.8);
        if (palette.length) ring.style.stroke = palette[Math.min(palette.length - 1, Math.floor(life * palette.length))];
      });
    };
  }

  const renderers = { "branches-to-flock": branchesToFlock, frontier };

  // ---------- Controller ----------
  const saveData = navigator.connection && navigator.connection.saveData;

  // Rendered clip, scrubbed by scroll: progress drives video.currentTime. Loaded shortly before the scene
  // arrives; reduced motion, Save-Data and no JS keep the still poster.
  // Stance sequence (homepage section 2): the builders heading settles small, "Consultants hand you a report."
  // blurs out as the leaf opens, and the outcome line rises in as the payoff.
  function stanceFrame(scene) {
    const heading = scene.querySelector(".stance__heading");
    const report = scene.querySelector("[data-stance-report]");
    const outcome = scene.querySelector("[data-stance-outcome]");
    let last = -1;
    return (p) => {
      if (Math.abs(p - last) < 0.0004) return; last = p;
      const k = ease(span(p, 0.48, 0.66));              // heading: large → small, done before the outcome appears
      heading.style.fontSize = `calc(${(1 - k).toFixed(4)} * var(--stance-h2-big) + ${k.toFixed(4)} * var(--stance-h2-small))`;
      const b = ease(span(p, 0.5, 0.74));               // report: blurs as it fades out completely
      report.style.filter = b > 0.001 ? `blur(${(10 * b).toFixed(2)}px)` : "";
      report.style.opacity = (1 - b).toFixed(3);
      report.style.visibility = b > 0.999 ? "hidden" : "";
      const c = ease(span(p, 0.62, 0.84));              // then its space closes, so the outcome rises into place
      const gap = parseFloat(getComputedStyle(report.parentElement).rowGap) || 0;
      report.style.marginBottom = c > 0.0005 ? `${(-(report.offsetHeight + gap) * c).toFixed(1)}px` : "";
      const o = ease(span(p, 0.6, 0.84));               // outcome: rises in
      outcome.style.opacity = o.toFixed(3);
      outcome.style.transform = `translate3d(0, ${((1 - o) * 0.15).toFixed(3)}em, 0)`;
    };
  }

  function clipScene(scene) {
    const video = scene.querySelector("video[data-scrub]");
    const stage = scene.querySelector(".scene__stage");
    const lines = scene.querySelectorAll("[data-at]");
    if (!video || reduce || saveData) return;
    scene.classList.add("is-animated");
    let target = 0, current = 0, raf = 0, active = false, loaded = false;
    const clipFrom = parseFloat(scene.dataset.clipFrom || "0"), clipTo = parseFloat(scene.dataset.clipTo || "1");
    const lead = parseFloat(scene.dataset.lead || "0");
    const flow = scene.hasAttribute("data-flow");
    const clipEnd = parseFloat(scene.dataset.clipEnd || "1");   // start progress this fraction of a viewport before pinning
    const frame = scene.dataset.scene === "stance" ? stanceFrame(scene) : null;
    const load = () => {
      if (loaded) return; loaded = true;
      const size = matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
      for (const [type, key] of [["video/webm", "Webm"], ["video/mp4", "Mp4"]]) {
        const src = document.createElement("source"); src.src = video.dataset[size + key]; src.type = type; video.appendChild(src);
      }
      video.preload = "auto";
      video.addEventListener("loadeddata", () => { video.classList.add("is-ready"); seek(); }, { once: true });
      video.load();
      // iOS Safari only paints seeked frames after the video has started once
      const p = video.play(); if (p && p.then) p.then(() => { video.pause(); seek(); }).catch(() => {});
    };
    const seek = () => {
      if (video.readyState < 1 || !video.duration) return;
      // data-clip-from / data-clip-to: the slice of scroll progress that plays the clip (holds the last frame after)
      const t = span(current, clipFrom, clipTo) * Math.min(video.duration - 1 / 48, clipEnd * video.duration);   // data-clip-end: stop before a fade-out
      if (Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
    };
    const measure = () => {
      const rect = scene.getBoundingClientRect();
      if (flow) { target = clamp((innerHeight - rect.top) / (innerHeight + rect.height)); return; }   // unpinned: progress across the element's passage
      const total = scene.offsetHeight - innerHeight + lead * innerHeight;
      target = total > 0 ? clamp((lead * innerHeight - rect.top) / total) : 1;
    };
    const tick = () => {
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.0005) current = target;
      seek();
      if (frame) frame(current);
      if (stage) stage.style.setProperty("--p", current.toFixed(4));
      lines.forEach((l) => l.classList.toggle("is-on", current >= parseFloat(l.dataset.at)));
      raf = active && current !== target ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => { measure(); if (!raf) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: "100% 0px" }).observe(scene);
    new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      if (active) { addEventListener("scroll", onScroll, { passive: true }); onScroll(); }
      else removeEventListener("scroll", onScroll);
    }, { rootMargin: "20% 0px" }).observe(scene);
    addEventListener("resize", onScroll, { passive: true });
  }

  document.querySelectorAll("[data-scene]").forEach((scene) => {
    if (scene.hasAttribute("data-clip")) { clipScene(scene); return; }
    const svg = scene.querySelector(".scene__art, [data-scene-art]");
    const make = renderers[scene.dataset.scene];
    if (!svg || !make) return;
    const render = make(svg);
    const lines = scene.querySelectorAll("[data-at]");
    const stage = scene.querySelector(".scene__stage");

    if (scene.dataset.mode === "play") {
      if (reduce) { render(4); return; }
      let visible = false, raf = 0, last = null, t = 0;
      const loop = (now) => {
        if (last !== null) t += Math.min(0.05, (now - last) / 1000);
        last = now; render(t);
        raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
      };
      const run = () => { if (!raf && visible && !document.hidden) { last = null; raf = requestAnimationFrame(loop); } };
      render(0);
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(scene);
      document.addEventListener("visibilitychange", run);
      return;
    }

    // Scrub mode
    if (reduce) { render(1); return; }
    scene.classList.add("is-animated");
    let target = 0, current = 0, raf = 0, active = false;
    // data-fold: after the drawing finishes, it folds up and away, the heading glides to the top of the screen and the
    // section that follows (the steps) rises in underneath it while the stage is still pinned. Scrolling back reverses it.
    const fold = scene.hasAttribute("data-fold") ? { next: scene.nextElementSibling, text: stage.querySelector(".scene__text"), bar: stage.querySelector(".scene__progress") } : null;
    const layoutFold = () => {
      if (!fold || !fold.next) return;
      const ih = stage.clientHeight;                                       // 100svh: steady while a phone's address bar slides
      fold.w = innerWidth;
      fold.text.style.transform = ""; scene.style.height = "";
      const tr = fold.text.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      fold.top = Math.max(ih * 0.1, 72);                                    // where the heading comes to rest
      fold.shift = fold.top - (tr.top - sr.top);
      fold.pull = Math.max(0, ih - (fold.top + tr.height + Math.max(56, ih * 0.09)));   // room for the stick figures above the step rules   // how far the steps rise into the stage
      scene.style.height = `calc(290vh + ${fold.pull}px)`;
      scene.classList.add("has-fold"); fold.next.style.marginTop = `${-fold.pull}px`;
      const total = scene.offsetHeight - ih;
      fold.a = clamp((total - fold.pull - ih * 0.35) / total);              // fold starts
      fold.b = clamp((total - fold.pull * 0.35) / total);                   // fold done
    };
    layoutFold();
    scene.foldInfo = fold;                             // read by review captures
    const measure = () => {
      const rect = scene.getBoundingClientRect();
      const total = scene.offsetHeight - (fold ? stage.clientHeight : innerHeight);   // the pin ends when the stage meets the scene's end
      target = total > 0 ? clamp(-rect.top / total) : 1;
    };
    const tick = () => {
      current += (target - current) * 0.12;            // smoothing (lerp)
      if (Math.abs(target - current) < 0.0005) current = target;
      const drawP = fold && fold.next ? clamp(current / fold.a) : current;   // the drawing's own 0-1 runs before the fold
      render(drawP);
      if (stage) stage.style.setProperty("--p", drawP.toFixed(4));
      lines.forEach((l) => l.classList.toggle("is-on", drawP >= parseFloat(l.dataset.at)));
      if (fold && fold.next) {
        const f = ease(span(current, fold.a, fold.b));
        svg.style.transformOrigin = "50% 0";
        svg.style.transform = f ? `translate3d(0, ${(-18 * f).toFixed(2)}%, 0) scaleY(${(1 - 0.85 * f).toFixed(4)})` : "";
        svg.style.opacity = (1 - f).toFixed(3);
        fold.text.style.transform = f ? `translate3d(0, ${(fold.shift * f).toFixed(1)}px, 0)` : "";
        if (fold.bar) fold.bar.style.opacity = (1 - f).toFixed(3);
      }
      raf = active && current !== target ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => { measure(); if (!raf) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      if (active) { addEventListener("scroll", onScroll, { passive: true }); onScroll(); }
      else removeEventListener("scroll", onScroll);
    }, { rootMargin: "20% 0px" }).observe(scene);
    // A phone's address bar changes only the height as you scroll: re-lay the fold only when the width changes,
    // otherwise the page would jump mid-scroll.
    addEventListener("resize", () => { if (fold && fold.w !== innerWidth) layoutFold(); onScroll(); }, { passive: true });
    document.fonts && document.fonts.ready.then(() => { layoutFold(); onScroll(); });
    render(0);
  });
})();
