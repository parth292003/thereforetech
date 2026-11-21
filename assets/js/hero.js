// Homepage hero: field footage (attached after load, never competing with LCP) and the untangling line.
// PLAN §4A.6, §5.3. Reduced motion or Save-Data: poster only, line drawn straight.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  // ---------- Footage ----------
  const video = document.querySelector("[data-hero-video]");
  function startVideo() {
    if (!video || reduce || saveData) return;
    const size = matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
    for (const [type, key] of [["video/webm", "Webm"], ["video/mp4", "Mp4"]]) {
      const s = document.createElement("source");
      s.src = video.dataset[size + key];
      s.type = type;
      video.appendChild(s);
    }
    video.addEventListener("playing", () => video.classList.add("is-playing"), { once: true });
    video.load();
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
    // Pause off-screen and in background tabs.
    const hero = video.closest(".hero");
    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) video.play().catch(() => {}); else video.pause();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause(); else video.play().catch(() => {});
    });
  }
  if (document.readyState === "complete") startVideo();
  else window.addEventListener("load", startVideo, { once: true });

  // ---------- Untangling line ----------
  const svg = document.querySelector("[data-hero-line]");
  if (!svg) return;
  const path = svg.querySelector("path");
  const W = 1600, MID = 100, SEGMENTS = 9;

  // Seeded random, so the tangle is the same on every visit.
  let seed = 7;
  const rand = (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };

  const seg = W / SEGMENTS;
  const tangled = [], straight = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const x0 = i * seg, x1 = x0 + seg;
    const y1 = i === SEGMENTS - 1 ? MID : MID + rand(-60, 60);
    // Control points overshoot backwards and forwards so the curve loops over itself.
    tangled.push([x0 + seg * rand(-0.9, 1.2), MID + rand(-95, 95), x0 + seg * rand(-0.2, 1.9), MID + rand(-95, 95), x1, y1]);
    straight.push([x0 + seg / 3, MID, x0 + (2 * seg) / 3, MID, x1, MID]);
  }
  const startY = MID + 30;
  const toD = (pts, sy) => `M0 ${sy.toFixed(1)} ` + pts.map((p) => "C" + p.map((n) => n.toFixed(1)).join(" ")).join(" ");
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  if (reduce) { path.setAttribute("d", toD(straight, MID)); return; }

  const dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-signature")) || 3200;
  path.setAttribute("d", toD(tangled, startY));
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len}`;
  path.style.strokeDashoffset = String(len);

  let t0 = null;
  function frame(now) {
    if (t0 === null) t0 = now;
    const t = Math.min(1, (now - t0) / dur);
    const draw = ease(Math.min(1, t / 0.45));          // 0–45%: the tangle draws itself in
    const u = ease(Math.max(0, (t - 0.3) / 0.7));      // 30–100%: it untangles into a straight rule
    const pts = tangled.map((p, i) => p.map((n, k) => lerp(n, straight[i][k], u)));
    path.setAttribute("d", toD(pts, lerp(startY, MID, u)));
    if (draw < 1) path.style.strokeDashoffset = String(len * (1 - draw));
    else { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; }
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
