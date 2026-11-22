/* REDLINE · behavior. No libraries. Everything degrades to a complete static page. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- theme toggle: saved choice, circular reveal from the button ---- */
  const toggle = document.querySelector(".theme-toggle");
  const label = () => toggle && toggle.setAttribute("aria-label", root.dataset.theme === "light" ? "Switch to dark theme" : "Switch to light theme");
  label();
  toggle?.addEventListener("click", (e) => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem("theme", next); } catch (_) {} label(); };
    if (!document.startViewTransition || reduce) return apply();
    const r = toggle.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    root.style.setProperty("--vt-x", x + "px");
    root.style.setProperty("--vt-y", y + "px");
    root.style.setProperty("--vt-r", Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + "px");
    document.startViewTransition(apply);
  });

  /* ---- live measurements: spec labels report real rendered sizes ---- */
  const measure = (el, out, fmt) => {
    if (!out) return;
    const ro = new ResizeObserver(([e]) => {
      const b = e.borderBoxSize?.[0];
      const w = Math.round(b ? b.inlineSize : e.contentRect.width), h = Math.round(b ? b.blockSize : e.contentRect.height);
      out.textContent = fmt(w, h);
    });
    ro.observe(el);
  };
  document.querySelectorAll(".board").forEach((b) => measure(b.querySelector(".board-frame"), b.querySelector(".dim"), (w, h) => `W ${w}  H ${h}`));

  /* ---- reveal fallback where scroll-driven CSS is missing ---- */
  if (!CSS.supports("animation-timeline: view()") && !reduce && "IntersectionObserver" in window) {
    root.classList.add("js-reveal");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  /* ---- nav: mark the section in view ---- */
  const links = [...document.querySelectorAll(".nav a[href^='#']")];
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const so = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.removeAttribute("aria-current"));
    map.get(e.target.id)?.setAttribute("aria-current", "true");
  }), { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) so.observe(s); });

  /* ---- layout grid overlay: button or the G key, like a design tool ---- */
  const gb = document.querySelector(".grid-btn:not(.motion-btn)");
  const setGrid = (on) => { root.classList.toggle("show-grid", on); gb?.setAttribute("aria-pressed", String(on)); };
  gb?.addEventListener("click", () => setGrid(!root.classList.contains("show-grid")));
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "g" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
    setGrid(!root.classList.contains("show-grid"));
  });
})();
