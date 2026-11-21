// Site-wide behaviour: compact menu and scroll reveals. Progressive enhancement throughout.
(() => {
  // ---- Compact-width menu ----
  const button = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");
  if (button && nav) {
    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Close" : "Menu";
      nav.toggleAttribute("data-open", open);
    };
    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && button.getAttribute("aria-expanded") === "true") { setOpen(false); button.focus(); }
    });
  }

  // ---- Scroll reveals: [data-reveal] gets .is-in once, as it enters the lower part of the viewport (PLAN §4A.5) ----
  // Mask reveals clip the element to zero area, which IntersectionObserver reports as never visible,
  // so those are watched through their parent instead.
  const items = document.querySelectorAll("[data-reveal]");
  items.forEach((el) => { if (el.dataset.i) el.style.setProperty("--i", el.dataset.i); });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
  const watched = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      (watched.get(e.target) || []).forEach((el) => el.classList.add("is-in"));
      io.unobserve(e.target);
    }
  }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
  items.forEach((el) => {
    const target = el.dataset.reveal === "mask" && el.parentElement ? el.parentElement : el;
    if (!watched.has(target)) { watched.set(target, []); io.observe(target); }
    watched.get(target).push(el);
  });
})();
